---
concept_id: concept.deep_learning.mamba
title: Mamba
slug: /concepts/mamba
aliases:
  - S6
kind: implementation
tier: 1
review_state: generated-draft
summary: A sequence architecture whose state space parameters are computed from each token, buying content-based selection at the cost of the convolutional training mode that made earlier state space models fast.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.state_space_models
    note: Mamba is stated entirely in terms of the discretized linear state space recurrence, so a reader who does not already have that recurrence cannot follow what selection changes.
  - type: variant_of
    target: concept.deep_learning.s4
    note: Mamba keeps the structured state space recurrence S4 introduced, but takes the purely diagonal state matrix of the later diagonal variants rather than S4's diagonal-plus-low-rank one, and makes the parameters functions of the input.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: Both route information across a sequence, but Mamba compresses history into a fixed-size state at linear cost while attention keeps every token and pays quadratic cost.
  - type: contrasts_with
    target: concept.deep_learning.rwkv
    note: RWKV reaches linear-time sequence modelling through time-invariant decay in a linear-attention form, so comparing it with Mamba isolates what input-dependent decay actually buys.
sources:
  - source_id: source.gu2023.mamba
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces'
    url: https://arxiv.org/abs/2312.00752
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.gu2022.s4
    title: Efficiently Modeling Long Sequences with Structured State Spaces
    url: https://arxiv.org/abs/2111.00396
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
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
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: Blelloch-style work-efficient parallel prefix scan
    reason: The linear-work, logarithmic-depth cost of the associative scan is a classical result about prefix sums that no registry source covers and no page in this corpus explains.
    sections:
      - formal-treatment
  - label: Mamba-2 and state space duality, and the Mamba hybrids
    reason: These are named as successors, but the registry holds no entry for any post-2023 follow-up to the Mamba paper, so the descriptions here are uncited.
    sections:
      - variants-and-alternatives
  - label: Later empirical studies of copying and in-context retrieval in fixed-state recurrent models
    reason: The recall limitation is argued here from the fixed state size alone; the benchmark evidence reported after 2023 is uncited because the registry has no such evaluation paper.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Mamba** is a sequence model built by stacking one kind of block whose core is a
_selective_ state space layer, called **S6**: a linear recurrence over a hidden
state in which the discretization step size $\Delta$ and the input and output
projections $B$ and $C$ are computed from the current token instead of being
fixed weights. The state matrix $A$ stays input-independent, but the discretized
transition $\bar{A}_t = \exp(\Delta_t A)$ does not, because $\Delta_t$ varies
with the input. That single change makes the layer time-varying, which is the
whole content of the architecture and the source of everything else about it.

## Why it matters

Self-attention costs work quadratic in the sequence length $L$ at every layer,
and autoregressive decoding keeps a cache that grows with every token emitted.
Structured state space models such as S4 fixed both — near-linear time in $L$, a
fixed-size state at inference — but they were _linear time-invariant_, and a
time-invariant system applies the same decay to every token. It cannot decide to
keep this token and discard that one, which is exactly what language modelling
demands, and those models lagged Transformers on text while matching them on
audio and other continuous signals.

Mamba's claim is that input-dependent parameters recover the missing selection
while keeping linear scaling. The paper reports Mamba-3B outperforming
Transformers of the same size and matching Transformers of roughly twice the size
on Pile pretraining and zero-shot downstream evaluations, with about five times
the inference throughput. Those are benchmark results at the
few-billion-parameter scale, not theorems.

## Intuition

Read $\Delta_t$ as _how much time this token is worth_. When $\Delta_t$ is large,
$\bar{A}_t = \exp(\Delta_t A)$ decays toward zero and the state is overwritten by
the current input: the model resets and attends to what just arrived. When
$\Delta_t$ is small, $\bar{A}_t \approx I$ and the state coasts through the token
almost unchanged: the token is skipped. Selection is therefore a learned,
per-token, per-channel choice about what enters memory — a forget gate, arrived
at from the continuous-time side.

The gating analogy is exact in a limiting case and breaks in two places. The
recurrence has no nonlinearity between steps — $h_t$ is linear in $h_{t-1}$ given
the coefficients, which permits parallel evaluation and is not true of an LSTM
cell. And the "continuous system being discretized" is a parameterization, not a
physical model: nothing in a token stream is sampled from an underlying ODE.

## Concrete example

Take the smallest possible selective SSM: state size $N = 1$, $A = -1$, $B = 1$,
$C = 1$, and $\Delta_t = \mathrm{softplus}(z_t)$ for a scalar $z_t$ computed from
the token. Zero-order-hold discretization gives $\bar{A}_t = e^{-\Delta_t}$ and
$\bar{B}_t = 1 - e^{-\Delta_t}$, so with $g_t = 1 - e^{-\Delta_t}$,

$$
1 - e^{-\mathrm{softplus}(z_t)} = 1 - \frac{1}{1 + e^{z_t}} = \sigma(z_t),
\qquad h_t = (1 - g_t)\,h_{t-1} + g_t\,x_t .
$$

The selective SSM is exactly the classical gated update, with the sigmoid gate
falling out of the discretization. Numerically, $z_t = 2$ gives
$\Delta_t = 2.127$, $\bar{A}_t = 0.119$, $g_t = 0.881$; $z_t = -3$ gives
$\Delta_t = 0.0486$, $\bar{A}_t = 0.953$, $g_t = 0.047$. Feed
$x = [5, 0, 0, 7]$ with $z = [2, -3, -3, 2]$ and the state goes
$4.40 \to 4.19 \to 4.00 \to 6.64$: the fillers barely move it, the content tokens
are written in. A time-invariant SSM has one $\Delta$ for all four steps and
cannot make that distinction.

A sequential reference implementation of the general layer:

```python
import torch

def selective_scan(x, A, B, C, delta):
    """x: (L, D)  A: (D, N)  B, C: (L, N)  delta: (L, D)  ->  y: (L, D)"""
    D, N = A.shape
    h = torch.zeros(D, N)
    ys = []
    for t in range(x.shape[0]):
        dA = torch.exp(delta[t].unsqueeze(-1) * A)     # (D, N)
        dB = delta[t].unsqueeze(-1) * B[t]             # (D, N), first order in delta
        h = dA * h + dB * x[t].unsqueeze(-1)           # (D, N)
        ys.append(h @ C[t])                            # (D,)
    return torch.stack(ys)
```

## Formal treatment

A continuous single-input single-output system per channel,
$h'(t) = A h(t) + B x(t)$, $y(t) = C h(t)$ with $h(t) \in \mathbb{R}^N$, is
discretized at step $\Delta$ by zero-order hold:

$$
\bar{A} = \exp(\Delta A), \qquad
\bar{B} = (\Delta A)^{-1}\!\left(\exp(\Delta A) - I\right)\!\cdot \Delta B ,
\qquad h_t = \bar{A} h_{t-1} + \bar{B} x_t, \quad y_t = C h_t .
$$

When $\bar{A}, \bar{B}, C$ are constant in $t$, unrolling gives
$y = x * \bar{K}$ with $\bar{K} = (C\bar{B},\, C\bar{A}\bar{B},\, \dots,\,
C\bar{A}^{L-1}\bar{B})$, so the whole sequence can be produced by one FFT-based
convolution in $O(L \log L)$. This is S4's training mode and it exists only
because the system is time-invariant.

Mamba makes the parameters functions of the input: for a $D$-channel token
$x_t$,

$$
B_t = W_B x_t \in \mathbb{R}^{N}, \quad
C_t = W_C x_t \in \mathbb{R}^{N}, \quad
\Delta_t = \mathrm{softplus}\!\left(\tau + W_\Delta x_t\right) \in \mathbb{R}^{D},
$$

with $A \in \mathbb{R}^{D \times N}$ diagonal per channel. Now
$h_t = \bar{A}_t h_{t-1} + \bar{B}_t x_t$ has coefficients that change every
step: the system is linear time-varying, $\bar{K}$ does not exist, and the
convolutional mode is gone. That is the trade the paper makes.

What survives is associativity. The first-order linear recurrence is a scan over
pairs under $(a_1, b_1) \oplus (a_2, b_2) = (a_2 a_1,\; a_2 b_1 + b_2)$, which is
associative whether or not the coefficients are constant, so a work-efficient
parallel scan computes all $L$ states in $O(L)$ work and $O(\log L)$ depth.
Time-invariance was needed for the _convolution_; only associativity is needed
for the _scan_.

The remaining problem is memory: materialized states have shape $(B, L, D, N)$,
which for $N = 16$ and an expanded $D$ dwarfs the $(B, L, D)$ input. The
hardware-aware implementation fuses discretization, scan and output projection
into one kernel — parameters are read from HBM into on-chip SRAM, the scan runs
there, only the $(B, L, D)$ output is written back, and intermediate states are
recomputed in the backward pass rather than stored. Per layer, training is
$O(LDN)$ work and $O(LD)$ activation memory; decoding is $O(DN)$ work and $O(DN)$
memory per token, independent of position.

## Assumptions and requirements

$A$ must be structured — diagonal in Mamba — so that $\exp(\Delta_t A)$ is an
elementwise exponential; a dense $A$ would need a matrix exponential per token
and a scan carrying $N \times N$ transitions. The per-step update must stay
linear in $h$: insert a nonlinearity between steps and the scan operator stops
being associative, leaving a serial RNN.

The speed claims assume a GPU with fast on-chip memory and a hand-written fused
kernel. A naive framework implementation that materializes every state is
bandwidth-bound and can be slower than attention — an implementation fact about
the memory hierarchy, not a property of the mathematics.

The layer as defined is causal; bidirectional use, as in vision, means two scans
in opposite directions and double the cost.

Finally, the parameterization was settled by ablation, not derived: the softplus
on $\Delta$, the initialization range of its bias, and a real rather than complex
diagonal $A$ — real reported better for discrete data such as text, complex for
continuous signals.

## Uses and applicability

Reach for Mamba when sequences are long, decoding cost or memory dominates, and
the task is compressible: audio waveforms, genomic sequences, long time series,
streaming or on-device generation where a growing key–value cache is the
bottleneck. The paper reports results on language, audio and DNA, the last at
sequence lengths near a million tokens, where quadratic attention is simply
unavailable.

Do not reach for it when the task is exact retrieval from a long context —
verbatim copying, long-context lookup, dense in-context learning over many
examples — or when you need the tooling and interpretability methods that have
accumulated around attention.

## Limitations and common mistakes

The most common error is to assume that because Mamba is a state space model it
still has a convolutional mode. It does not, and cannot: selection is what
destroys the fixed kernel. A tutorial presenting selective SSM training as an FFT
is describing S4, not Mamba.

The second is to read "constant memory at inference" as "unbounded context". The
state is $D \times N$ numbers per layer, and everything before the current token
is compressed into it, so distant recall is lossy by construction and no amount
of training changes the capacity. This is the structural reason fixed-state
recurrent models trail attention on copying and retrieval; the benchmark evidence
for that is uncited here.

The third is to treat the quality comparisons as settled. They are results at up
to about 3B parameters on particular corpora; how the gap behaves at much larger
scale is not established by that paper, and the move to hybrids that keep a few
attention layers is itself evidence that pure selective SSMs give something up.

A fourth is expecting the recurrent state to behave like a key–value cache. You
can checkpoint it and resume from it, but you cannot inspect it per token, evict
a token from it, or attend back into it.

## Variants and alternatives

Within the family: **S4** and **S4D** are the time-invariant predecessors, faster
to train through the FFT and unable to select; **S5** scans a multi-input system.
Mamba's own successor recasts the selective SSM as a structured matrix
multiplication so it can use tensor cores — a restriction on $A$ bought back as
throughput. **Hybrids** interleaving a few attention layers among many Mamba
layers, and bidirectional vision variants, are now common; these post-2023
developments are noted without citation here.

Genuinely different routes to linear-time sequence modelling include RWKV and
xLSTM, which arrive from the recurrent side, and linear or windowed attention,
which weakens attention instead of replacing it. The Transformer remains the
alternative to beat: quadratic, but with exact access to every past token.

## History and attribution

Mamba was introduced by Albert Gu and Tri Dao in December 2023, closing a line
that ran from HiPPO-initialized state matrices through S4 (Gu, Goel and Ré) to
diagonal simplifications and the H3 architecture, whose block Mamba explicitly
simplifies by folding it together with a gated multilayer perceptron. The problem
the authors were working on was well known in that community: these models were
strong on continuous signals and long-range benchmarks and weak on language, and
the diagnosis was that time-invariance forbids content-dependent behaviour. The
connection back to classical gating was not an afterthought — the paper proves
the $N=1$ case reduces to a sigmoid gate.

## Sources

The Mamba paper is the source for everything specific to this page: the selection
mechanism, the gating theorem, the fused scan, the block design and every reported
number. The S4 paper develops the convolutional training
mode that Mamba gives up, and is the right reference for what "structured state
space model" meant before selection. Attention Is All You Need supplies the
quadratic-cost baseline. The CUDA programming guide documents the GPU memory
hierarchy — global versus shared memory, kernel fusion — that the hardware-aware
implementation depends on.

## Prerequisites and next connections

Understand the discretized linear state space recurrence first — the state space
models and S4 pages in this corpus cover it, and without it selection reads as
arbitrary. Gating in [LSTM](./lstm.md) and the framing of
[Recurrent Neural Networks](./recurrent-neural-networks.md) make the intuition
land faster, and [Convolution](./convolution.md) says what the lost convolutional
mode was.

From here, [Transformers](./transformers.md) and [Attention](./attention.md) are
the comparison that gives Mamba its point, and [GPU Kernels](./gpu-kernels.md)
with [CUDA](./cuda.md) explain why a fused scan is worth writing at all: the gap
between the asymptotics and the wall clock is the engineering contribution.
