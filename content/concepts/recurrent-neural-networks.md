---
concept_id: concept.deep_learning.recurrent_neural_networks
title: Recurrent Neural Networks
slug: /concepts/recurrent-neural-networks
aliases:
  - RNN
  - Elman network
kind: concept
tier: 1
review_state: generated-draft
summary: A network that reads a sequence one step at a time, carrying a hidden state forward through the same weights, so that training becomes backpropagation down a chain of Jacobians whose product decides whether long-range gradients survive.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.backpropagation
    note: Backpropagation through time is ordinary backpropagation run over the unrolled computation graph, so the gradient derivation here is unreadable without it.
  - type: prerequisite_of
    target: concept.deep_learning.lstm
    note: Every gate in an LSTM exists to interrupt the Jacobian product derived on this page, so the fix cannot be understood before the failure.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: Both model sequences, but a transformer replaces the serial state update with an all-pairs comparison that parallelises over time and pays memory instead.
  - type: contrasts_with
    target: concept.machine_learning.hidden_markov_models
    note: Both carry latent state through a sequence, but an HMM's state is a distribution over finitely many discrete values with exact inference, while an RNN's is a single deterministic point in a continuous space.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.hochreiter1997.long_short_term_memory
    title: Long Short-Term Memory
    url: https://direct.mit.edu/neco/article/9/8/1735/6109/Long-Short-Term-Memory
    source_kind: primary-research
    supports:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.rumelhart1986.learning_representations
    title: Learning representations by back-propagating errors
    url: https://www.nature.com/articles/323533a0
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Pascanu, Mikolov and Bengio, On the difficulty of training recurrent neural networks (2013)
    reason: The sharp form of the spectral conditions — largest singular value below one as sufficient for vanishing, above one as necessary for exploding — and norm clipping as it is usually stated come from that paper, which is not in the registry; the statements here lean on the Deep Learning book's eigenvalue argument and Hochreiter and Schmidhuber's decay bound instead.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Elman (1990), Jordan (1986) and Werbos on backpropagation through time
    reason: The early attributions in the history section are stated from general knowledge and from the historical notes of a secondary source; the registry holds none of the original papers, so the dates and priority claims should be checked against primaries before this page leaves generated-draft.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **recurrent neural network** maps a sequence to a sequence by carrying a hidden
state and updating it with the same function and the same parameters at every
step:

$$
h_t = \phi\!\left(W_{hh} h_{t-1} + W_{xh} x_t + b_h\right),
\qquad
\hat y_t = W_{hy} h_t + b_y ,
$$

where $x_t \in \mathbb{R}^d$ is the input at step $t$, $h_t \in \mathbb{R}^n$ the
hidden state, $\phi$ an elementwise nonlinearity (classically $\tanh$), and
$W_{hh} \in \mathbb{R}^{n \times n}$, $W_{xh} \in \mathbb{R}^{n \times d}$,
$W_{hy}$, $b_h$, $b_y$ the parameters. None of them carries a $t$ index — the same
weights act at every step — and $h_0$ is fixed (usually zero) or learned. Training
unrolls the recurrence into a feedforward graph of depth $T$ with tied weights and
runs [Backpropagation](./backpropagation.md) over it — **backpropagation through
time**, or BPTT.

## Why it matters

A feedforward network takes a fixed-size input. To model a sequence with one you
flatten a fixed window, throwing away everything outside it and paying parameters
in proportion to its width. Recurrence removes both limits: the parameter count is
independent of sequence length, and the state can in principle summarise
arbitrarily long history.

The state is also $O(n)$ however much has been read, so consuming one more token
costs what the first did — which attention-based models cannot say, their
per-token cost growing with the context already seen.

## Intuition

Two pictures. The first is the loop: one layer whose output feeds its own input.
The second is the unrolled one, a network of depth $T$ whose layers all share a
single weight matrix — the useful picture, because it says immediately that an RNN
trained on thousand-step sequences is a thousand-layer network whose layers cannot
be tuned independently, being the same layer.

The tempting analogy is an accumulator register, and it breaks in a specific way:
nothing in $h_t$ is addressed or protected. The whole state is overwritten at
every step, so whether a fact from step 5 survives to step 500 is not a design
decision but a consequence of applying the same matrix 495 times — a question
about the spectrum of $W_{hh}$, and exactly the one the gradients answer.

## Concrete example

Take a 64-unit $\tanh$ RNN whose $W_{hh}$ is random but rescaled to a chosen
spectral radius $\rho$, run it for 100 steps, and send a unit gradient vector
backwards through the whole chain:

```python
import numpy as np
rng = np.random.default_rng(0)
n, T = 64, 100
W0 = rng.normal(size=(n, n))
W0 /= max(abs(np.linalg.eigvals(W0)))        # spectral radius exactly 1
x = 0.3 * rng.normal(size=(T, n))
for rho in (0.9, 1.1, 1.5):
    W = rho * W0
    h, D = np.zeros(n), []
    for t in range(T):
        h = np.tanh(W @ h + x[t])
        D.append(1 - h**2)                   # phi'(a_t)
    g = rng.normal(size=n); g /= np.linalg.norm(g)
    for t in reversed(range(T)):
        g = W.T @ (D[t] * g)                 # one step of BPTT
    print(rho, np.mean(D), np.linalg.norm(g))
```

The gradient norm after 100 steps is $1.6 \times 10^{-12}$ at $\rho = 0.9$,
$1.8 \times 10^{-6}$ at $\rho = 1.1$ and $0.86$ at $\rho = 1.5$. Under-unit
spectral radius kills the signal outright — twelve orders of magnitude, so the
step-1 gradient is rounding noise in float32. But $\rho > 1$ is not enough to
explode, because $\tanh$ saturation pulls the mean of $\phi'$ down to $0.79$ and
$0.64$; rerun with the input scaled to $0.02$, keeping the units near-linear, and
$\rho = 1.1$ gives $18.7$ instead. The nonlinearity does the stabilising, which is
why explosion appears as occasional spikes rather than steady growth.

## Formal treatment

Write $a_t = W_{hh}h_{t-1} + W_{xh}x_t + b_h$, $h_t = \phi(a_t)$, and
$\mathcal{L} = \sum_{t=1}^{T}\ell_t(\hat y_t, y_t)$. Because $W_{hh}$ is reused,
its gradient collects a term for every pair of steps:

$$
\frac{\partial \mathcal{L}}{\partial W_{hh}}
= \sum_{t=1}^{T} \sum_{k=1}^{t}
\frac{\partial \ell_t}{\partial h_t}
\left( \prod_{j=k+1}^{t} J_j \right)
\frac{\partial^{+} h_k}{\partial W_{hh}} ,
\qquad
J_j = \frac{\partial h_j}{\partial h_{j-1}} = D_j W_{hh},
$$

with $D_j = \operatorname{diag}\!\left(\phi'(a_j)\right)$ and $\partial^{+}$ the
derivative that treats $h_{k-1}$ as constant. Every long-range contribution passes
through a product of $t-k$ Jacobians, and that product decides everything.

In the linear case $\phi = \mathrm{id}$ the product is $W_{hh}^{\,t-k}$; for
diagonalisable $W_{hh} = Q\Lambda Q^{-1}$ it equals $Q\Lambda^{t-k}Q^{-1}$, so
each eigendirection is scaled by $\lambda_i^{\,t-k}$: components with
$|\lambda_i| < 1$ decay geometrically in the lag, components with
$|\lambda_i| > 1$ grow, and $|\lambda_i| = 1$ is a knife edge. Nonlinearly, with
$\gamma = \sup_z |\phi'(z)|$ ($1$ for $\tanh$, $\tfrac14$ for the logistic
sigmoid) and $\sigma_1$ the largest singular value of $W_{hh}$,

$$
\left\| \prod_{j=k+1}^{t} D_j W_{hh} \right\|
\;\le\; \left( \gamma\, \sigma_1 \right)^{t-k},
$$

so $\gamma \sigma_1 < 1$ forces geometric decay of every long-lag term: vanishing
gradients are a property of the architecture, not an accident of initialisation.
The converse is weaker — $\gamma\sigma_1 > 1$ is necessary for growth, not
sufficient, as the example above shows.

Two standard interventions follow. **Truncated BPTT** backpropagates only $k$
steps, treating $h_{t-k}$ as constant while the forward state is carried across
chunk boundaries — detached there, or the backward graph silently extends across
the epoch. Memory drops from $O(Tn)$ to $O(kn)$, at the price of a biased
gradient: every term of lag above $k$ is zeroed, so longer dependencies are never
credited. **Gradient clipping** rescales the gradient when it grows too large,
$g \leftarrow \min\!\left(1, c / \lVert g \rVert\right) g$, preserving direction
and bounding the step. The asymmetry matters — clipping addresses explosion only,
and no rescaling recovers a direction already decayed to numerical zero.

## Assumptions and requirements

Weight sharing assumes the transition is **stationary** — the same rule at step 3
and step 3000. Where dynamics genuinely change with position, the network must
encode that change in the state itself, one reason counting steps is hard for it.
The state must also be a **sufficient summary**: the model is Markov in $h_t$, so
anything not carried there is gone, and capacity is $n$ real numbers fixed in
advance.

BPTT requires $\phi$ differentiable and all $T$ activations held for the backward
pass, and bidirectional variants need the whole sequence up front, forfeiting
streaming. Generative training normally uses **teacher forcing**, feeding the true
previous token rather than the model's own, so the training distribution differs
from the one met at inference.

## Uses and applicability

Reach for a recurrent model when the sequence arrives incrementally and you cannot
wait for all of it: online filtering and control, low-latency embedded
transcription, streaming anomaly detection, agents whose state persists across an
unbounded interaction. That argument is about hardware, not accuracy. Recurrence
also stays reasonable for short sequences and small datasets, where it is a useful
inductive bias. Do not reach for one when the full sequence is available, the
dependencies are long, and parallel hardware is there to exploit — the regime
where the serial update is a liability.

## Limitations and common mistakes

**Vanishing gradients are relative, not absolute.** The gradient is not zero; it
is dominated by short-lag terms while long-lag terms are exponentially smaller. A
model in this state trains smoothly, shows a falling loss, and never learns the
long dependency. Nothing signals the failure.

**Clipping does not fix vanishing.** It is routinely called the fix for unstable
RNN training, which is half true: it bounds the exploding direction and leaves the
decaying one alone. Gating addresses that.

**Depth in time is not depth in layers.** Stacking three recurrent layers adds
representational depth per step and does nothing about the 1000-step product of
Jacobians.

**Gating mitigates, it does not eliminate.** That LSTMs and GRUs handle longer
dependencies is an empirical finding on particular benchmarks, not a theorem, and
the usable range is hundreds to low thousands of steps rather than unbounded.

**The serial dependency is the practical killer.** Computing $h_t$ requires
$h_{t-1}$, so the $T$ steps of one example cannot be parallelised; only the batch
dimension and the matrix multiplication inside a step use the accelerator. This
was the stated motivation for the transformer, whose layers compute all positions
at once. The trade reverses at inference, where the constant state is the cheaper
side.

## Variants and alternatives

The **Elman** network is the form above; the **Jordan** variant feeds back the
output instead of the hidden state. **Stacked** RNNs put several recurrent layers
in sequence; **bidirectional** RNNs run a pass in each direction and concatenate,
buying future context at the cost of streaming.

**LSTM** and **GRU** add multiplicative gates and an additive state path so the
Jacobian product is no longer a pure matrix power; they are the dominant answer to
the problem derived here. **Orthogonal or unitary** recurrence holds the singular
values of $W_{hh}$ at one, so the product of $W_{hh}$ factors has norm exactly one
and the matrix-power source of decay and growth is gone — the only contraction
left is $\phi'$ — at the price of restricting what the transition can express, and
**echo state networks** never train $W_{hh}$ at all, fitting only the readout.

The genuinely different competitors are **transformers**, which drop recurrence
for all-pairs attention and pay quadratic memory for full parallelism, and the
recent **linear-recurrence** family — structured state space models and RWKV among
them — which keep a recurrent state but make its update linear, so training can be
done by a parallel scan. Whether those match transformers at scale is not settled.

## History and attribution

The idea has several independent origins. Training a recurrent network by
unrolling it into an equivalent layered network with shared weights is already
described in Rumelhart, Hinton and Williams' 1986 backpropagation paper; the name
backpropagation through time comes from Werbos's work at the end of that decade,
and the simple recurrent network in its standard form is due to Elman around 1990.
The symmetric-weight networks of the early 1980s, used as associative memories,
are a separate lineage.

The failure mode was diagnosed shortly after, by Hochreiter in 1991 and by Bengio,
Simard and Frasconi in 1994, and the analysis of exponentially decaying error flow
opens Hochreiter and Schmidhuber's 1997 LSTM paper. Gated recurrence then carried
speech recognition, handwriting synthesis and the first neural machine translation
systems, until the transformer displaced it for large-scale training in 2017.

## Sources

**Deep Learning**, chapter 10, is the standard modern treatment: unfolding, BPTT,
teacher forcing, long-term dependencies, truncation, clipping and the gated
variants in one place. **Long Short-Term Memory** carries the original error-flow
analysis, the sharpest short statement of why plain recurrence cannot learn long
lags. **Learning representations by back-propagating errors** sets out the unrolling
construction in its published form — the equivalence of an iterative net to a
layered net with corresponding weights constrained equal — one of several
independent derivations of the idea, and **Attention Is All You Need** states the
parallelisation argument that ended the RNN's dominance.

## Prerequisites and next connections

Read [Backpropagation](./backpropagation.md) first — BPTT is that algorithm on a
larger graph. Eigenvalues and singular values, as in
[Spectral Theory](./spectral-theory.md), turn the vanishing-gradient condition
into a consequence rather than a rule to memorise, and
[Initialization](./initialization.md) explains why the spectral radius of
$W_{hh}$ is something you choose.

From here the gated architectures are the direct continuation, and attention and
the transformer the branch that replaced recurrence at scale.
[Hidden Markov Models](./hidden-markov-models.md) is the probabilistic counterpart
worth comparing, and [Dynamical Systems](./dynamical-systems.md) the language in
which the stability question here is standard.
