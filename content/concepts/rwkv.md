---
concept_id: concept.deep_learning.rwkv
title: RWKV
slug: /concepts/rwkv
aliases:
  - Receptance Weighted Key Value
kind: implementation
tier: 1
review_state: generated-draft
summary: A language-model architecture that replaces softmax attention with a per-channel exponentially decaying key-value average, so one network trains over a whole sequence at once and runs at inference as a recurrence with fixed-size state.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.attention
    note: The time-mixing block is written as a key-value average and is understood by comparison with what softmax attention computes, so a reader who does not know what K and V are cannot follow it.
  - type: specializes
    target: concept.deep_learning.recurrent_neural_networks
    note: At inference RWKV is a recurrent network whose state update happens to be linear and elementwise, and that restriction is exactly what lets the same model be trained over a whole sequence at once.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: Both process a training sequence in one pass, but RWKV drops the all-pairs comparison, so decoding costs constant memory per layer instead of a KV cache that grows with context.
  - type: contrasts_with
    target: concept.deep_learning.mamba
    note: Both are linear-time sequence models carrying a fixed-size state, but Mamba makes the state transition depend on the current input while RWKV-4's decay is a static per-channel parameter.
sources:
  - source_id: source.peng2023.rwkv
    title: 'RWKV: Reinventing RNNs for the Transformer Era'
    url: https://arxiv.org/abs/2305.13048
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - why-it-matters
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.gu2023.mamba
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces'
    url: https://arxiv.org/abs/2312.00752
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.beck2024.xlstm
    title: 'xLSTM: Extended Long Short-Term Memory'
    url: https://arxiv.org/abs/2405.04517
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: RWKV-5 Eagle, RWKV-6 Finch and RWKV-7 Goose papers
    reason: The registry holds only the 2023 paper, which describes the version the project calls RWKV-4; the claims here about matrix-valued states, data-dependent decay and later state-update rules come from follow-up papers that are not registered.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: Attention Free Transformer (Zhai et al.)
    reason: The RWKV paper credits AFT as the origin of its time-mixing form, but the AFT paper itself is not in the registry, so the attribution cannot be checked against a registered source.
    sections:
      - history-and-attribution
  - label: Linear attention as kernelised attention (Transformers are RNNs)
    reason: The general result that attention with a non-negative feature map can be rewritten as a constant-state recurrence is the frame this page uses to place RWKV, and no registered source covers it.
    sections:
      - formal-treatment
      - variants-and-alternatives
claims: []
---

## Definition

**RWKV** is a sequence-model architecture built from stacked blocks of a
_time-mixing_ sublayer and a _channel-mixing_ sublayer, in which the time-mixing
sublayer computes an exponentially decaying weighted average of past values
instead of a softmax over all pairs of positions. The name abbreviates the four
quantities that define that sublayer: $R$ (receptance, a gate on how much of the
aggregated past to admit), $W$ (a per-channel time-decay weight), $K$ (key) and
$V$ (value). Because the aggregation decays at a fixed rate per channel, it has
two exactly equivalent forms — a sum over the whole sequence, used for training,
and a two-line recurrence over a constant-size state, used for generation.

## Why it matters

A [Transformer](./transformers.md) decoder pays for its all-pairs attention
twice: a term quadratic in sequence length during training, and a KV cache at
inference that grows linearly with the tokens generated, so producing token
$10{,}000$ needs ten times the cache token $1{,}000$ needed. A classical
recurrent network has the opposite profile — constant memory per step, but a
state update run token by token, which is why it does not saturate modern
accelerators during training.

RWKV was built to have both at once: trained over the full context, deployed as a
recurrence whose per-token cost and memory do not depend on context length. That
makes long-context generation on a fixed memory budget — a laptop, a phone, a
single consumer GPU — an architectural property rather than a fight with a
growing cache.

## Intuition

Think of each channel as a leaky bucket with its own leak rate. At every step the
token pours in a quantity $e^{k_t}$ of evidence carrying a value $v_t$, and the
contents decay by a fixed factor. What comes out is the running average of the
values, weighted by how recently and how strongly they were poured. The
receptance is a tap on the outlet: a sigmoid gate deciding how much of the
accumulated past this token is allowed to see.

The analogy breaks in one important place. In real attention the weight on a past
token depends on the _current_ token, which is what makes a lookup possible. In
RWKV-4's time mixing it does not: the weight on token $i$ depends only on $k_i$
and on how many steps ago it arrived. The current token can gate the result and
shift its own key, but it cannot ask which past token matches it. Whatever RWKV
uses from the past, it had to decide to store on the way past.

## Concrete example

Take one channel with decay factor $e^{-w} = 0.5$ and bonus $u = 0$, and feed it
three tokens with $e^{k} = (1, 2, 1)$ and $v = (1, 2, 3)$. The recurrence keeps
two numbers — a weighted sum of values $a$ and a weighted sum of weights $b$:

```python
import math

alpha, u = 0.5, 0.0            # e^{-w}: this channel keeps half its state per step
k = [0.0, math.log(2), 0.0]    # keys
v = [1.0, 2.0, 3.0]            # values

a = b = 0.0                    # the entire state of this channel
for t in range(3):
    ek = math.exp(u + k[t])                      # the current token's own weight
    print(t + 1, round((a + ek * v[t]) / (b + ek), 4))
    a, b = alpha * a + math.exp(k[t]) * v[t], alpha * b + math.exp(k[t])
# 1 1.0
# 2 1.6667
# 3 2.1429
```

Check the third output against the summation form directly. Token 1 arrived two
steps ago, so it is worth $0.5^{1} \times 1 = 0.5$; token 2 arrived one step ago,
worth $0.5^{0} \times 2 = 2$; the current token is worth $e^{u + k_3} = 1$. The
output is $(0.5 \cdot 1 + 2 \cdot 2 + 1 \cdot 3) / (0.5 + 2 + 1) = 7.5/3.5
\approx 2.1429$. Same number, two ways of getting it: that identity is the whole
architectural trick.

## Formal treatment

Write $x_t \in \mathbb{R}^d$ for the input to a sublayer at position $t$. Both
sublayers first apply **token shift**, a learned per-channel interpolation with
the previous position, $\tilde{x}^{(\mu)}_t = \mu \odot x_t + (1 - \mu) \odot
x_{t-1}$ with a separate $\mu \in \mathbb{R}^d$ for each projection. Time mixing
then forms $r_t = W_r \tilde{x}^{(\mu_r)}_t$, $k_t = W_k \tilde{x}^{(\mu_k)}_t$,
$v_t = W_v \tilde{x}^{(\mu_v)}_t$ and computes, elementwise per channel,

$$
\mathrm{wkv}_t \;=\;
\frac{\sum_{i=1}^{t-1} e^{-(t-1-i)w + k_i}\, v_i \;+\; e^{u + k_t} v_t}
     {\sum_{i=1}^{t-1} e^{-(t-1-i)w + k_i} \;+\; e^{u + k_t}},
\qquad
o_t = W_o\big(\sigma(r_t) \odot \mathrm{wkv}_t\big),
$$

where $w \in (\mathbb{R}_{\geq 0})^d$ is the per-channel decay, $u \in \mathbb{R}^d$ is
a bonus applied only to the current token, and $\sigma$ is the logistic sigmoid.
Channel mixing is a gated position-wise network, $o_t = \sigma(r_t) \odot W_v
\max(k_t, 0)^2$, with its own token-shifted $r$ and $k$ — a squared-ReLU
feedforward layer with a receptance gate.

The equivalent recurrence is $a_t = e^{-w} a_{t-1} + e^{k_t} v_t$, $b_t = e^{-w}
b_{t-1} + e^{k_t}$, with $\mathrm{wkv}_t = (a_{t-1} + e^{u+k_t} v_t) /
(b_{t-1} + e^{u+k_t})$. The state a layer must carry between tokens is therefore
$a$, $b$ and the shifted inputs: $O(d)$ numbers, independent of $t$. Decoding
costs $O(d^2)$ per token, dominated by the projections, and training over a
length-$T$ sequence costs $O(T d^2)$ with no $T \times T$ matrix ever formed,
against the $O(T^2 d)$ term in self-attention's per-layer cost.

## Assumptions and requirements

The decay must be non-negative, so $e^{-w} \in (0,1]$ and the per-channel
weights never grow backwards in time; implementations store it in log form and
exponentiate, making that structural rather than something training must
respect. The bonus $u$ exists because a pure decay would treat the current token
as just another old one.

The exponentials overflow in float32 for large $k$, so real kernels carry the
state in a shifted form with a running maximum rather than as $a$ and $b$
literally — the worked example above is correct arithmetic and a numerically
careless implementation. The paper also reports that an extra LayerNorm after the
embedding, with small embedding initialisation, is needed for fast early
convergence; that is a finding about training stability, not a property of the
operator.

The decay is causal by construction, so bidirectional encoding needs two passes
or a different formulation. Most fundamentally, the architecture assumes that
whatever a later token needs from the past fits in $O(d)$ numbers per layer and
survives multiplication by $e^{-w}$ at every intervening step.

## Uses and applicability

Reach for RWKV when generation is autoregressive, contexts are long, and the
deployment budget is memory rather than compute: streaming and on-device
inference, long chat sessions, and settings where the state can be snapshotted
and resumed rather than recomputed from a prompt. The published models were
trained as general language models up to 14B parameters on the Pile, and the
paper reports performance broadly comparable to similarly sized transformers on
standard zero-shot NLP benchmarks — an empirical result at that scale, on that
data, for that version, not a general equivalence.

Do not reach for it when the task is retrieval-like — copying a specific string
from far back, or answering about a document that must be searched rather than
summarised — when you need bidirectional encoding, or when you would be
rebuilding tooling that already exists for transformers.

## Limitations and common mistakes

The paper's own limitation is the one that matters most: a fixed-size state
funnels the past, and tasks requiring recall of minutiae over a very long context
suffer for it. Prompt ordering therefore matters more than for a transformer,
since information not written into the state when it went past cannot be
retrieved later — putting the instruction before the material is not cosmetic
here. The Mamba paper makes the same point from the other side, showing that
time-invariant recurrent models fail selective-copying and induction-style tasks
that input-dependent ones solve.

Three misconceptions are worth naming. First, "RWKV is attention without the
quadratic cost" — in RWKV-4 it is not attention at all, because the weight on a
past token does not depend on the current one. Second, "constant memory means
unlimited context" — the state is finite and decaying, so effective context is
bounded by capacity and by $w$, whatever the nominal window. Third, "it
parallelises exactly like a transformer" — the time-mixing recurrence is still a
scan over positions, parallel over batch and channels in a fused kernel; what is
parallel over the sequence is every matrix multiply around it.

A practical mistake: quoting benchmark parity without a version number. Results
attach to versions, and this architecture has changed substantially between
them.

## Variants and alternatives

Within the family, versions 1 through 3 were pre-publication iterations, version
4 is the one the paper describes, and later versions changed the operator rather
than tuning it: RWKV-5 (Eagle) replaced the vector state with a matrix-valued,
multi-head state, RWKV-6 (Finch) made the decay and token shift depend on the
current token through low-rank projections, and RWKV-7 (Goose) generalised the
state update again. Each buys expressivity for state size and kernel complexity.
No registered source covers these follow-ups.

Outside the family, the closest competitors are selective state space models such
as Mamba, reaching input-dependent dynamics from the continuous-time side; xLSTM,
getting there by giving the LSTM exponential gating and a matrix memory; other
decayed linear attentions; and plain softmax attention with better kernels, which
keeps exact recall and improves only the constant factors. Hybrids interleaving a
few full-attention layers among linear ones are a pragmatic middle, buying recall
back for a bounded cache.

## History and attribution

RWKV was created by Bo Peng and developed in the open as a community project
across several versions before any paper existed; the time-mixing form is
credited to the Attention Free Transformer, whose learned pairwise position
biases RWKV replaces with a per-channel decay multiplied by relative position,
plus a bonus term for the current token. The paper, _RWKV: Reinventing RNNs for
the Transformer Era_ (2023), has a large multi-institution author list drawn from
that community and reports the version known as RWKV-4 trained on the Pile. The
problem being worked on was concrete rather than theoretical: making an RNN that
could be trained at the scale transformers were reaching, so that open weights
could be run cheaply.

## Sources

The RWKV paper is the reference for everything specific to version 4 — the
equations, the recurrence, the training setup, the benchmark comparisons, and a
limitations section unusually candid about what a fixed state costs. _Attention
Is All You Need_ supplies the baseline this architecture argues with, including
the per-layer complexity comparison. The Mamba paper is the best registered
statement of why input-independent recurrent dynamics fail certain recall tasks,
and, with the xLSTM paper, marks out the competing designs.

## Prerequisites and next connections

Read [Attention](./attention.md) first: the design is legible as a deliberate
removal of the query-key comparison, and not otherwise.
[Recurrent Neural Networks](./recurrent-neural-networks.md) supplies the other
half — what a carried state is, and why long chains of gradients were the
problem. [LSTM](./lstm.md) is useful for contrast: its gates multiply the state
by input-dependent quantities, exactly what RWKV-4 gives up.

From here, [Transformers](./transformers.md) is the architecture being displaced,
[Layer Normalization](./layer-normalization.md) explains a component used at
every sublayer boundary, and [Quantization](./quantization.md) with
[Edge Inference](./edge-inference.md) is where the constant-memory property pays
off.
