---
concept_id: concept.deep_learning.state_space_models
title: State Space Models
slug: /concepts/state-space-models
kind: concept
tier: 1
review_state: generated-draft
summary: A sequence layer built from a linear time-invariant system, whose one set of parameters can be run as a step-by-step recurrence for constant-memory inference or collapsed into a single long convolution for parallel training.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: specializes
    target: concept.deep_learning.recurrent_neural_networks
    note: The state update is a recurrence with the elementwise nonlinearity removed, and that restriction is exactly what makes the closed-form convolutional view available.
  - type: requires
    target: concept.analysis.convolution
    note: The parallel training form is literally a causal convolution of the input with the system's impulse response, so a reader who does not have convolution cannot read the dual view.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: Both mix information across positions, but an SSM does it with a fixed decaying kernel in linear time while self-attention compares every pair of positions in quadratic time.
  - type: prerequisite_of
    target: concept.deep_learning.s4
    note: S4 is a particular structured parameterisation of the matrices defined here, and its contribution only makes sense once the recurrent-convolutional duality and its cost are understood.
sources:
  - source_id: source.gu2022.s4
    title: Efficiently Modeling Long Sequences with Structured State Spaces
    url: https://arxiv.org/abs/2111.00396
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.gu2023.mamba
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces'
    url: https://arxiv.org/abs/2312.00752
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.beck2024.xlstm
    title: 'xLSTM: Extended Long Short-Term Memory'
    url: https://arxiv.org/abs/2405.04517
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: R. E. Kalman's 1960 papers on linear filtering and on controllability and observability
    reason: The registry has no control-theory primary source or textbook, so the classical attribution rests on standard history that none of the cited sources establishes.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **state space model** used as a neural network layer is a linear
time-invariant (LTI) system that carries a hidden state $x(t) \in \mathbb{R}^N$
through a scalar input signal $u(t)$ and reads out a scalar output $y(t)$:

$$
\dot{x}(t) = A x(t) + B u(t), \qquad y(t) = C x(t) + D u(t).
$$

$A \in \mathbb{R}^{N \times N}$ is the state matrix, $B \in \mathbb{R}^{N\times 1}$
the input map, $C \in \mathbb{R}^{1 \times N}$ the readout, and $D$ a direct
feedthrough term usually folded into a
[Residual Connection](./residual-connection.md) and dropped. To act on a discrete
sequence the system is discretised at step size $\Delta$, giving matrices
$\bar{A}, \bar{B}$ and a recurrence over tokens. The learned parameters are
$(A, B, C, \Delta)$.

## Why it matters

The same parameters admit two exactly equivalent computations, and they have
opposite cost profiles. Unrolled as a recurrence, the layer costs $O(N)$ time
and $O(N)$ memory per token — generation never grows more expensive as the
context lengthens. Unrolled as a convolution, the whole sequence is produced in
one pass by an FFT, so training parallelises across positions the way a
[Convolutional Layer](./convolutional-layer.md) does.

A [Recurrent Neural Network](./recurrent-neural-networks.md) has the first
property and not the second: its nonlinearity forces sequential training. A
[Transformer](./transformers.md) has the second and not the first: attention
parallelises but costs $O(L^2)$ on length $L$ and keeps a growing cache at
inference. The state space layer gets both, which is the whole reason the family
exists.

## Intuition

Think of a bank of $N$ leaky integrators listening to the same input stream.
Each one has its own decay rate and its own phase; each accumulates the input it
has heard, forgetting geometrically. The output is a fixed linear combination of
what the bank currently holds. That is all the layer is: a small set of
resonators summarising the past, which is precisely the signals-and-systems
picture of an LTI system characterised by its impulse response.

The analogy breaks in two places. First, the coefficients are learned by
gradient descent rather than designed to meet a filter specification. Second,
and more importantly, an LTI system's response to a given input is fixed the
moment training ends: it cannot decide to listen harder because of something it
just read. Attention can. This gap is the single most consequential fact about
the family.

## Concrete example

Take the smallest possible system, $N = 1$, with $A = -1$, $B = 1$, $C = 1$,
$D = 0$, discretised by zero-order hold at $\Delta = 0.5$:

$$
\bar{A} = e^{\Delta A} = e^{-0.5} \approx 0.6065, \qquad
\bar{B} = A^{-1}\!\left(e^{\Delta A} - I\right)B \approx 0.3935 .
$$

The convolution kernel is $K_j = C\bar{A}^{\,j}\bar{B}$, that is
$0.3935,\ 0.2387,\ 0.1447,\ 0.0878,\ \dots$ — an exponential moving average with
decay $0.6065$. As a check, $\sum_j K_j = 0.3935/(1-0.6065) = 1$, matching the
continuous system's DC gain $-CA^{-1}B = 1$.

Both views give the same numbers:

```python
import numpy as np

A, B, C, dt, L = -1.0, 1.0, 1.0, 0.5, 8
Abar = np.exp(dt * A)                       # zero-order hold
Bbar = (Abar - 1.0) / A * B
u = np.array([1., 0., 2., 0., -1., 0., 0., 3.])

x, y_rec = 0.0, []                          # recurrent form
for k in range(L):
    x = Abar * x + Bbar * u[k]
    y_rec.append(C * x)

K = C * Abar ** np.arange(L) * Bbar         # convolutional form
y_conv = np.convolve(u, K)[:L]

print(np.allclose(y_rec, y_conv))           # True
```

## Formal treatment

Solving the linear ODE from $x(0)$ gives
$x(t) = e^{At}x(0) + \int_0^t e^{A(t-s)}Bu(s)\,ds$, so with zero initial state
the system is the convolution $y = h * u$ with impulse response
$h(t) = Ce^{At}B$.

Discretisation replaces $e^{A\Delta}$ with something computable. Zero-order hold
takes $\bar{A} = \exp(\Delta A)$ and
$\bar{B} = \left(\int_0^{\Delta} e^{A\tau}d\tau\right) B$, which equals
$A^{-1}(\exp(\Delta A) - I)B$ when $A$ is invertible. The bilinear (Tustin)
rule, used in S4, takes

$$
\bar{A} = \left(I - \tfrac{\Delta}{2}A\right)^{-1}\!\left(I + \tfrac{\Delta}{2}A\right),
\qquad
\bar{B} = \left(I - \tfrac{\Delta}{2}A\right)^{-1}\Delta B .
$$

Either way the layer becomes $x_k = \bar{A}x_{k-1} + \bar{B}u_k$, $y_k = Cx_k$.
Unrolling from $x_{-1} = 0$ gives $x_k = \sum_{j=0}^{k} \bar{A}^{\,j}\bar{B}u_{k-j}$
and therefore

$$
y_k = \sum_{j=0}^{k} C\bar{A}^{\,j}\bar{B}\, u_{k-j} = (\bar{K} * u)_k,
\qquad
\bar{K} = \left(C\bar{B},\, C\bar{A}\bar{B},\, \dots,\, C\bar{A}^{L-1}\bar{B}\right).
$$

$\bar{K}$ is a convolution kernel as long as the sequence, so the layer is a
_global_ filter, not a local one. Taking the $z$-transform gives the rational
transfer function $H(z) = C(zI - \bar{A})^{-1}\bar{B} + D$: a SISO state space
layer of order $N$ is an IIR filter, equivalently an ARMA model of order $N$.

The cost question is where structure enters. Forming $\bar{K}$ by powering a
dense $\bar{A}$ costs $O(LN^2)$, which is prohibitive. Structured
parameterisations avoid it: if $\bar{A}$ is diagonal with entries $\bar{a}_n$
then $\bar{K}_j = \sum_n c_n b_n \bar{a}_n^{\,j}$, an $O(NL)$ Vandermonde
computation, and S4's diagonal-plus-low-rank form reaches comparable cost while
keeping the HiPPO initialisation. The deep-learning use of state space models is
essentially always a structured one, for this reason alone.

In a network, one layer runs $H$ independent SISO systems, one per channel, and
a pointwise linear map mixes channels afterwards — a convention, not a
consequence of the mathematics.

## Assumptions and requirements

**Linearity and time invariance.** The convolutional view requires that
$\bar{A}, \bar{B}, C$ do not depend on $k$ or on the input. Make them
input-dependent and $\bar{K}$ ceases to exist; you fall back to a parallel scan,
which still works because the linear recurrence is associative.

**Zero initial state.** The identity $y = \bar{K} * u$ assumes $x_{-1} = 0$. A
nonzero initial state adds $C\bar{A}^{\,k+1}x_{-1}$, which is exactly the term a
streaming implementation carries between chunks.

**Stability.** The recurrence is stable iff the spectral radius
$\rho(\bar{A}) < 1$, which for zero-order hold means $\mathrm{Re}\,\lambda_i(A) < 0$
for every eigenvalue. Violate it and the kernel grows without bound and training
diverges; this is why $A$ is parameterised so its real part is forced negative.

**Discretisation accuracy.** Zero-order hold is exact only if the input is
constant across each interval; the bilinear rule is a trapezoidal approximation.
Both degrade when $\Delta|\lambda|$ is large, so $\Delta$ and the eigenvalue
scale must be chosen together — $\Delta$ is the layer's timescale knob.

**Causality.** The kernel is one-sided. Bidirectional modelling needs a second
pass over the reversed sequence.

## Uses and applicability

Reach for a state space layer when the sequence is long and the dependencies are
smooth or positional: raw audio at sample rate, sensor time series, genomic
sequences, and the long-range benchmarks where S4 first showed large gains over
attention. Reach for it when inference is streaming and memory is capped, since
the recurrent form needs one fixed-size state rather than a cache that grows with
the context. Because the parameterisation is continuous, a trained layer can be
re-discretised at a different sample rate by changing $\Delta$, which S4
demonstrated empirically for audio.

Do not reach for it when the task is exact retrieval or lookup over a long
context, and do not bother when sequences are short — attention is cheap there
and far better supported by tooling.

## Limitations and common mistakes

The mistake that matters most is assuming a fixed kernel can select. An LTI
system compresses the past into $N$ numbers by a rule fixed before it sees the
input, so it cannot decide to remember one token and ignore the next. Mamba
demonstrates this on tasks built for the purpose — selective copying and
induction-style recall — where LTI models fail and input-dependent parameters
succeed. That was the motivation for making $\bar{A}, \bar{B}, C$ functions of
the input, at the cost of the convolutional view.

Second: the layer being linear does not make the network linear. Stacked blocks
interleave the SSM with gating and position-wise nonlinearities; the linearity
lives only inside the token-mixing operator.

Third: do not confuse this with the **linear-Gaussian state space model** of
classical time-series analysis. That one has process and observation noise,
and its inference problem is solved by the Kalman filter; this one is
deterministic, has no likelihood, and is fitted by gradient descent.

Fourth: "linear time" is a scaling claim, not a quality claim. Whether an SSM
matches a transformer of the same size is architecture- and task-dependent, the
constants and the state size $N$ are large enough to matter, and hybrid stacks
that interleave a few attention layers are common precisely because the question
is not settled.

Finally, two numerical traps: an unconstrained $\bar{A}$ drifts outside the unit
disc and the kernel explodes, and a naive dense implementation silently costs
$O(LN^2)$ and will convince you the whole idea is slow.

## Variants and alternatives

**S4** uses a diagonal-plus-low-rank $A$ with HiPPO initialisation; **DSS** and
**S4D** show a purely diagonal $A$ recovers most of the quality far more simply;
**S5** uses a multi-input multi-output system evaluated by parallel scan.
**Mamba** makes the parameters input-dependent — buying selection, paying the
convolutional view and requiring a hardware-aware scan. Both S4 and Mamba have
their own pages.

Outside the state-space parameterisation, **Hyena** and related models learn long
convolution kernels directly, which is simpler but gives up the recurrent form.
**RWKV** and **xLSTM** arrive at linear-cost recurrences from the RNN side
instead. Classically, the **linear-Gaussian state space model**, whose filtering
problem the **Kalman filter** solves, is the probabilistic cousin and
**hidden Markov models** the discrete-state one; plain **ARMA** is the scalar
special case.

## History and attribution

The state space form is classical control theory: representing a linear system by
a first-order vector ODE, rather than by a high-order scalar equation or a
transfer function, became standard through R. E. Kalman's work around 1960 on
linear filtering and on controllability and observability. Realisation theory —
recovering $(A,B,C)$ from an impulse response — and the equivalence of the
recurrence with the convolution are results from that era, not new ones.

The deep-learning line is recent and traceable. HiPPO (Gu and colleagues, 2020)
derived state matrices that keep an optimal polynomial summary of the past; the
Linear State Space Layer (2021) put the continuous, recurrent and convolutional
views into a single trainable layer but was too slow to be practical; S4 (2022)
made it efficient with the structured parameterisation; diagonal variants
simplified it; Mamba (2023) broke time invariance to regain selection.

## Sources

The **S4** paper is the reference for the definition as a sequence layer, the
bilinear discretisation, the recurrent-convolutional duality and why the
unstructured kernel is too expensive. **Mamba** is the reference for what time
invariance costs and for the selective alternative. **MIT 6.003** supplies the
LTI background — impulse responses, convolution, the $z$-transform — in which
everything above is written, and **MIT 18.03** the linear ODE systems, matrix
exponential and eigenvalue stability conditions behind the continuous form.

## Prerequisites and next connections

Read [Convolution](./convolution.md) first — the parallel form is one — and
[Recurrent Neural Networks](./recurrent-neural-networks.md), since this is the
linear special case of that recurrence. The continuous form is a system of
linear [Ordinary Differential Equations](./ordinary-differential-equations.md),
and [Fourier Analysis](./fourier-analysis.md) explains why the long kernel can be
applied by FFT.

From here, [Transformers](./transformers.md) is the architecture this family
competes with, [LSTM](./lstm.md) is the gated recurrence it replaces on long
sequences, [Hidden Markov Models](./hidden-markov-models.md) is the discrete
stochastic analogue, and [Dynamical Systems](./dynamical-systems.md) supplies the
stability vocabulary the eigenvalue conditions borrow.
