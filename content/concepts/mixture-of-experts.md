---
concept_id: concept.deep_learning.mixture_of_experts
title: Mixture of Experts
slug: /concepts/mixture-of-experts
aliases:
  - MoE
  - sparsely-gated mixture-of-experts
kind: method
tier: 1
review_state: generated-draft
summary: An architecture in which a learned gate sends each input to a few of many expert subnetworks, so a model can hold far more parameters than it evaluates for any one token.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.multilayer_perceptrons
    note: Each expert in the standard formulation is a small feedforward network, and the gate is a linear layer followed by a softmax, so the reader needs that machinery before the layer makes sense.
  - type: contributes_to
    target: concept.deep_learning.transformers
    note: In current large language models the sparse mixture layer is dropped into the position-wise feedforward slot of the transformer block, leaving attention untouched.
  - type: contrasts_with
    target: concept.machine_learning.random_forests
    note: An ensemble evaluates every member and averages to reduce variance, whereas a sparse mixture evaluates only the selected experts and trains them to differ, buying capacity rather than stability.
  - type: contrasts_with
    target: concept.deep_learning.pruning
    note: Pruning removes parameters to cut both memory and compute, while a mixture keeps every parameter resident and cuts only the compute spent per token.
sources:
  - source_id: source.shazeer2017.mixture_of_experts
    title: 'Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer'
    url: https://arxiv.org/abs/1701.06538
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - concrete-example
    checked_on: 2026-09-17
unresolved_references:
  - label: The transformer-era sparse MoE literature (GShard, Switch Transformer, expert-choice and hash routing, open-weight MoE language models)
    reason: The registry stops at the 2017 sparsely-gated layer, so the Switch-style auxiliary loss, expert capacity and token dropping, and the named routing variants of the 2020s are described here from general knowledge with no citation behind them.
    sections:
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

A **mixture of experts** is a layer built from $n$ parallel subnetworks
$E_1,\dots,E_n$ — the _experts_ — and a _gating network_ $G$ that maps the input
to a weight per expert. The layer computes

$$
y \;=\; \sum_{i=1}^{n} G(x)_i \, E_i(x).
$$

In a **sparse** mixture, $G(x)$ is forced to have at most $k \ll n$ non-zero
entries, so all but $k$ terms of the sum vanish and only those $k$ experts are
ever evaluated. That is the whole trick: the parameter count of the layer grows
with $n$, while the arithmetic per input grows with $k$.

## Why it matters

In a dense network every parameter multiplies every token, so parameters and
FLOPs rise together and compute becomes the binding constraint on capacity. A
sparse mixture breaks that coupling. It is the main practical instance of
**conditional computation**: a large model activating only the part of itself
relevant to the current input. Shazeer et al. trained language models with up to
137 billion parameters at a per-token cost no dense model of that size could
pay, and beat dense baselines at matched compute. Many of the largest language
models released since 2023 use sparse mixture layers.

## Intuition

Think of a clinic with sixty-four specialists and one receptionist. Each patient
is sent to two of them. The clinic still employs all sixty-four — the parameters
are all there, all the time — but each visit costs two consultations.

The analogy breaks where it matters. The specialists do not arrive with
specialities; the routing rule and the expertise are learned together from the
same gradient. An expert that is never chosen gets no gradient and never
improves, so it is never chosen. "Send everyone to the same two doctors" is a
stable solution to the training problem, and the machinery below exists to make
it unstable.

## Concrete example

Take a transformer block of width $d = 1024$ with a feedforward hidden width of
$4096$. Dense, that sublayer holds $2 \times 1024 \times 4096 \approx 8.4$
million parameters and costs about $8.4$ million multiply-adds per token.
Replace it with $n = 64$ experts of that shape, routed top-$k$ with $k = 2$: the
layer holds about $537$ million parameters and costs about $16.8$ million
multiply-adds per token. Sixty-four times the capacity for twice the compute —
and all 537 million parameters still occupy memory on some device.

A minimal routed forward pass, written for clarity rather than speed:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SparseMoE(nn.Module):
    def __init__(self, d_model, d_ff, n_experts, k=2):
        super().__init__()
        self.k, self.n = k, n_experts
        self.gate = nn.Linear(d_model, n_experts, bias=False)
        self.experts = nn.ModuleList(
            nn.Sequential(nn.Linear(d_model, d_ff), nn.GELU(), nn.Linear(d_ff, d_model))
            for _ in range(n_experts)
        )

    def forward(self, x):                       # x: (tokens, d_model)
        logits = self.gate(x)                   # (tokens, n_experts)
        top_val, top_idx = logits.topk(self.k, dim=-1)
        w = F.softmax(top_val, dim=-1)          # renormalise over the chosen k
        y = torch.zeros_like(x)
        for slot in range(self.k):
            for e, expert in enumerate(self.experts):
                m = top_idx[:, slot] == e
                if m.any():
                    y[m] = y[m] + w[m, slot].unsqueeze(-1) * expert(x[m])
        p = F.softmax(logits, dim=-1).mean(0)                       # mean gate prob
        f = F.one_hot(top_idx[:, 0], self.n).float().mean(0)        # token fractions
        return y, self.n * (f * p).sum()        # output and balance loss

y, aux = SparseMoE(64, 256, 8)(torch.randn(32, 64))
```

The returned `aux` is added to the task loss. With perfectly uniform routing,
$f_i = p_i = 1/n$ and the term equals $1$; the more concentrated the routing,
the larger it gets.

## Formal treatment

Let $x \in \mathbb{R}^d$ be one token representation and $W_g \in
\mathbb{R}^{d \times n}$ the gate weights. Top-$k$ gating sets

$$
G(x) \;=\; \operatorname{softmax}\big(\operatorname{KeepTop}_k(x W_g)\big),
\qquad
\operatorname{KeepTop}_k(h)_i =
\begin{cases} h_i & h_i \text{ among the } k \text{ largest} \\ -\infty & \text{otherwise,}\end{cases}
$$

so the softmax is over the surviving $k$ logits and the rest are exactly zero.
Shazeer et al. add tunable Gaussian noise to the logits before the selection,
which spreads assignments early in training and supports their load estimator.

The layer is not differentiable in the _choice_ of experts — the top-$k$ index
set is a step function of $x$ — but is differentiable in everything else.
Gradient reaches $W_g$ only through the coefficients $G(x)_i$ of the selected
experts; an unselected expert and its gate logit receive nothing at that token.
That is the positive feedback loop behind **routing collapse**: an expert chosen
more often trains faster, becomes more useful, and is chosen still more often,
while the rest stay near initialisation and are dead parameters.

Balancing is therefore an explicit term in the objective. Shazeer et al.
penalise the squared coefficient of variation of the per-expert importance
$\operatorname{Imp}(X)_i = \sum_{x \in X} G(x)_i$ over a batch $X$,

$$
L_{\text{imp}}(X) \;=\; w_{\text{imp}} \cdot \mathrm{CV}\big(\operatorname{Imp}(X)\big)^2,
\qquad \mathrm{CV}(v) = \frac{\operatorname{std}(v)}{\operatorname{mean}(v)},
$$

plus a second term on a smooth estimate of the _number_ of tokens each expert
receives, since equal total gate weight does not imply equal token counts. The
later Switch-style formulation is

$$
L_{\text{bal}} \;=\; \alpha \, n \sum_{i=1}^{n} f_i \, p_i ,
$$

with $f_i$ the fraction of the batch's tokens routed to expert $i$ and $p_i$ the
mean gate probability assigned to it. Both are non-negative and sum to one over
experts; taken independently the sum could be driven to zero by sending $f$ and
$p$ to disjoint experts, but $f$ tracks $p$, and along $f = p$ the sum is
$\sum_i p_i^2$, minimised at uniform assignment, where $n \sum_i f_i p_i = 1$
and so $L_{\text{bal}} = \alpha$; $\alpha$ is small, on the order of $10^{-2}$.

## Assumptions and requirements

The method assumes the problem is **conditionally decomposable** — that for each
input a small subset of parameters suffices. Where every token genuinely needs
every parameter, routing to $k$ of $n$ experts is a worse use of the same FLOPs
than a dense layer, and no gating rule recovers that.

It assumes a **large batch per expert**. With $B$ tokens in a batch each expert
sees roughly $kB/n$ of them, and gradients from a handful of tokens are noisy
and hardware-inefficient. Shazeer et al. call this the shrinking-batch problem
and pool one expert's tokens across many devices, which assumes an interconnect
that can afford the all-to-all exchange.

It assumes **memory for every parameter**: sparsity is in the compute, not the
storage, and all $n$ experts must be resident in aggregate for the forward pass.

And it assumes active balancing pressure — the auxiliary loss, or a routing rule
balanced by construction. Drop it and collapse is the expected outcome, not a
rare failure.

## Uses and applicability

Reach for a mixture when you are compute-bound rather than memory-bound, the
training corpus is large and heterogeneous, and you can shard experts across
devices — which describes pretraining a large language model, and is why the
technique lives there. It also fits multi-task and multilingual models, where
decomposability is plausible on its face.

Avoid it when memory binds — a single accelerator, an edge device — because the
memory bill is that of a dense model with $n$ times the feedforward width. Avoid
it when serving at batch size one, where there is no work to pool across tokens
and the layer becomes a memory-bandwidth problem with no compute saving to show
for it. It is also a poor fit for small models and datasets, where experts have
nothing to specialise on.

## Limitations and common mistakes

The first mistake is reading "sparse" as "cheap". Per-token FLOPs fall; memory
does not, communication cost rises, and capacity buffers, all-to-all exchange
and balancing are real engineering.

The second is comparing a mixture with a dense model by parameter count. A model
with 600 billion total parameters and 30 billion active per token is not a
600-billion-parameter dense model. Report both, and compare at matched active
compute or matched memory depending on which constraint binds.

The third is expecting interpretable specialisation. Experts in token-routed
language models often split on shallow, token-level regularities rather than on
topics or languages — an empirical observation that varies by model and routing
scheme, and is not settled.

The fourth is easy to miss: with per-expert capacity limits a token's output
depends on which _other_ tokens share its batch, since tokens over capacity are
dropped or passed through. The layer is then not a function of the token alone,
which costs the reproducibility a dense layer gives for free.

Finally, the balance coefficient is a real knob. Too small and routing collapses;
too large and the gate is pushed toward uniform assignment, destroying the
specialisation the layer exists to create.

## Variants and alternatives

The original **dense** or soft mixture evaluates all $n$ experts and weights them
by a full softmax. It is smooth, needs no balancing loss and no capacity logic,
and costs $n$ times a single expert — fine for small $n$, useless for scaling.
**Hierarchical mixtures of experts** arrange gates in a tree, routing in stages.
Among sparse variants $k = 1$ is cheapest and most collapse-prone, $k = 2$ the
common compromise. **Expert-choice** routing inverts the assignment — each expert
selects its top tokens — making balance exact by construction while letting a
token be seen by a variable number of experts. **Hash routing** replaces the
learned gate with a fixed random assignment and is a surprisingly strong
baseline, evidence that some of the benefit is capacity rather than clever
routing.

The genuinely different answers to the same problem are dense scaling (simple,
compute-hungry), [distillation](./distillation.md) into a smaller model,
[quantization](./quantization.md) and [pruning](./pruning.md) after the fact, and
retrieval, which moves knowledge out of the weights entirely.

## History and attribution

Jacobs, Jordan, Nowlan and Hinton introduced adaptive mixtures of local experts
in 1991, working on supervised task decomposition: when one network learns
several subtasks they interfere, and their fix was an objective that makes
experts compete to explain each example rather than cooperate on one output.
Jordan and Jacobs extended it to hierarchical mixtures trained with
expectation-maximisation in 1994, after which the model lived for two decades as
a conditional mixture in the statistical literature.

Shazeer et al. made it a scaling tool in 2017, inserting a sparsely-gated layer
with thousands of experts between stacked [LSTM](./lstm.md) layers. The move
into the [transformer](./transformers.md) feedforward slot followed in 2020 and
2021, and open-weight mixture language models from 2023 — the part of this
history the registry does not cover, flagged here as uncited.

## Sources

The Shazeer et al. preprint covers everything specific to the sparse layer:
top-$k$ noisy gating, both balancing losses, the shrinking-batch problem, and
the experiments that made the approach credible. Murphy's _Probabilistic Machine
Learning_ gives the older, more general picture — the mixture as a conditional
model $p(y \mid x)$ with a gating distribution — and carries the attribution to
Jacobs and to Jordan and Jacobs. Goodfellow, Bengio and Courville cover mixtures
under dynamic structure and conditional computation, including the
soft-versus-hard distinction and the hardware obstacles. The PyTorch
documentation covers the operations used above.

## Prerequisites and next connections

Read [Multilayer Perceptrons](./multilayer-perceptrons.md) first — experts and
gate are both built from it — and [Transformers](./transformers.md) for which
sublayer a mixture replaces and why attention is left alone.

From here, [Training Infrastructure](./training-infrastructure.md) covers the
parallelism the shrinking-batch argument depends on, and [Pruning](./pruning.md),
[Quantization](./quantization.md) and [Distillation](./distillation.md) are the
competing answers when a model is too large for the hardware you have.
