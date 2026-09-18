---
concept_id: concept.deep_learning.lstm
title: LSTM
slug: /concepts/lstm
aliases:
  - long short-term memory
  - constant error carousel
kind: method
tier: 1
review_state: generated-draft
summary: A recurrent cell that carries an additive, gate-controlled memory state through time, so that gradients survive hundreds of steps instead of decaying exponentially after ten.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.recurrent_neural_networks
    note: The LSTM is a replacement for the hidden unit of a recurrent network; unrolling, weight sharing across time and backpropagation through time are assumed by everything on this page and explained there.
  - type: contrasts_with
    target: concept.deep_learning.gru
    note: The GRU keeps the additive path but merges cell and hidden state and drops to two gates, which is the same idea at three quarters of the parameters and a different set of trade-offs.
  - type: contributes_to
    target: concept.deep_learning.residual_connection
    note: The gated additive update is the same gradient-preserving trick a residual connection applies in the depth direction rather than along time, and the recurrent version came first.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: Both attack long-range dependency, but attention gives every position a direct path to every other at quadratic cost, where an LSTM routes everything through one fixed-size state at constant cost per step.
sources:
  - source_id: source.hochreiter1997.long_short_term_memory
    title: Long Short-Term Memory
    url: https://direct.mit.edu/neco/article/9/8/1735/6109/Long-Short-Term-Memory
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.graves2013.generating_sequences
    title: Generating Sequences With Recurrent Neural Networks
    url: https://arxiv.org/abs/1308.0850
    source_kind: preprint
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.cho2014.gru
    title: 'Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation'
    url: https://arxiv.org/abs/1406.1078
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: The Gers–Schmidhuber extensions to the original cell — the forget gate ("Learning to Forget", 1999/2000) and peephole connections
    reason: The registry holds the 1997 Long Short-Term Memory paper but not the follow-up papers, so the attribution of the forget gate, the motivation of unbounded cell growth on continual streams, and the convention of initialising the forget-gate bias positive are stated here from general knowledge and are not covered by a cited source.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: Systematic empirical comparisons of LSTM gating variants (search-space ablations of the standard cell)
    reason: The registry has the GRU paper but no ablation study of gating variants, so the claim that no proposed variant reliably beats the standard cell across tasks rests on nothing cited here.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

An **LSTM** (long short-term memory) is a recurrent unit that maintains two states
per step: a **cell state** $c_t$, updated only by elementwise scaling and addition,
and a **hidden state** $h_t$, a gated view of the cell that the rest of the network
sees. Three sigmoid gates — input, forget and output — decide, per dimension and per
time step, what is written into the cell, what is retained, and what is exposed. The
cell state is the whole point: $c_t$ is reached from $c_{t-1}$ by multiplying by a
number near one and adding, not by passing through a weight matrix and a squashing
nonlinearity, so error signals travelling backwards along it decay at a learned,
per-dimension rate near one rather than at the rate set by the spectrum of a shared
recurrent matrix.

## Why it matters

A plain recurrent network computes $h_t = \tanh(W h_{t-1} + V x_t + b)$. The gradient
of a loss at step $T$ with respect to a state at step $t$ is a product of $T - t$
Jacobians, each of the form $\mathrm{diag}(\tanh'(\cdot)) W$. Such products are
unforgiving: where the relevant singular values fall below one the gradient vanishes,
where they exceed one it explodes, and no single setting works in all directions. In
practice a vanilla RNN learns dependencies of roughly ten steps and is blind past
that.

That is not a tuning problem, it is the shape of the computation, and LSTM changes
the shape. Between 2013 and 2017 gating was behind the best sequence models of the
period: handwriting synthesis and the first neural machine translation systems were
built on it, and LSTM acoustic models displaced the feedforward hybrids that had
opened the neural era in speech recognition. Gating outlived the architecture too —
the GRU and highway networks are its descendants.

## Intuition

Picture a row of small registers running alongside the network. Each step three soft
switches act on each register: the forget gate says how much of what is there
survives, the input gate how much of a newly proposed value is written, the output
gate how much of the register may influence the network right now. Between writes the
register rides forward untouched — that path is the **constant error carousel**, and
backwards along it the gradient rides just as easily.

The analogy breaks in three places. The gates are not switches but saturating
sigmoids: a "closed" gate at $0.03$ still leaks three per cent every step, and an
"open" forget gate at $0.99$ still erases one per cent. They are per-dimension and
data-dependent, so the same register can be held on one input and cleared on the
next. And nothing makes a register store one interpretable fact; the cell is a
distributed vector like any other hidden layer.

## Concrete example

Take a single-unit cell, $n = 1$, with a cue at step 1 and the answer required at
step 21. Suppose training has produced gates that open at the cue and hold
afterwards:

$$
c_1 = f_1 c_0 + i_1 \tilde{c}_1 = 0.99 \cdot 0 + 0.95 \cdot 0.8 = 0.76 .
$$

For steps $2$ to $21$ the inputs are irrelevant, so $i_t \approx 0.02$ with
$\tilde{c}_t \approx 0$, and the forget gate sits at $f_t = 0.99$. Then
$c_{21} \approx 0.76 \cdot 0.99^{20} = 0.622$. The output gate has been near zero
throughout, so nothing leaked into $h_t$; at step 21 it opens to $0.98$ and
$h_{21} = 0.98 \tanh(0.622) = 0.54$.

The gradient takes the same route: $\partial c_{21} / \partial c_1 = 0.99^{20} = 0.82$,
so the learning signal arrives essentially intact. A $\tanh$ RNN with recurrent
weight $0.99$ and typical derivative $\tanh' \approx 0.5$ contributes about $0.495$
per step, giving $0.495^{20} \approx 8 \times 10^{-7}$ over the same span — six
orders of magnitude of difference across twenty steps.

One step, with the four gate pre-activations stacked into a single matrix multiply
as libraries implement it:

```python
import numpy as np

def lstm_step(x, h, c, W, U, b):
    """W: (4n, d), U: (4n, n), b: (4n,), in gate order i, f, g, o."""
    n = h.shape[0]
    z = W @ x + U @ h + b
    i, f, g, o = z[:n], z[n:2*n], z[2*n:3*n], z[3*n:]
    sig = lambda v: 1.0 / (1.0 + np.exp(-v))
    c = sig(f) * c + sig(i) * np.tanh(g)
    return sig(o) * np.tanh(c), c
```

## Formal treatment

Let $x_t \in \mathbb{R}^d$ be the input, $h_{t-1}, c_{t-1} \in \mathbb{R}^n$ the
previous hidden and cell states, $\sigma(z) = 1/(1 + e^{-z})$ applied elementwise,
and $\odot$ the elementwise product. The cell is

$$
\begin{aligned}
i_t &= \sigma(W_i x_t + U_i h_{t-1} + b_i), \\
f_t &= \sigma(W_f x_t + U_f h_{t-1} + b_f), \\
o_t &= \sigma(W_o x_t + U_o h_{t-1} + b_o), \\
\tilde{c}_t &= \tanh(W_c x_t + U_c h_{t-1} + b_c), \\
c_t &= f_t \odot c_{t-1} + i_t \odot \tilde{c}_t, \\
h_t &= o_t \odot \tanh(c_t),
\end{aligned}
$$

with $W_\bullet \in \mathbb{R}^{n \times d}$, $U_\bullet \in \mathbb{R}^{n \times n}$
and $b_\bullet \in \mathbb{R}^n$, giving $4(nd + n^2 + n)$ parameters — four times a
vanilla RNN of the same width.

The gradient claim is precise and narrow. Differentiating $c_t$ with respect to
$c_{t-1}$ along the direct path, holding the gates fixed, gives

$$
\frac{\partial c_t}{\partial c_{t-1}} \;=\; \mathrm{diag}(f_t),
$$

so over a span the direct contribution is $\prod_{s=t+1}^{T} \mathrm{diag}(f_s)$: a
product of diagonal matrices, with no repeated multiplication by $W$ and no $\tanh'$
factor. An indirect path also exists, since $c_{t-1}$ influences $h_{t-1}$ and hence
the gates at step $t$; it behaves like a vanilla RNN's, but is a correction rather
than the dominant term when the gates are saturated.

In the 1997 formulation there was no forget gate: the cell's self-connection had
weight exactly $1.0$, so the local error flow was genuinely constant, and the
original training rule truncated the gradient where error left the cell. The forget
gate replaced that fixed $1$ with a learned $f_t \in (0,1)$, and since $\sigma$ is
strictly below one the product $\prod_s f_s$ strictly decays — at $f = 0.99$ it is
$0.82$ over 20 steps, $0.13$ over 200 and $4 \times 10^{-5}$ over 1000. **LSTM
mitigates the vanishing gradient; it does not remove it.** What it buys is a decay
rate learned per dimension rather than imposed by the spectrum of a shared matrix.

## Assumptions and requirements

The gradient argument assumes the forget gates on the paths that matter stay near
one. Nothing enforces this; it has to be learned, which is why biasing the forget
gate positive at initialisation is standard — at bias zero $f \approx 0.5$, and the
memory halves every step before training has begun.

Credit assignment is bounded by truncation as well as by architecture: if
backpropagation through time is truncated at 100 steps, no gradient reaches step 101
however open the gates are. Exploding gradients are untouched, so clipping remains
necessary. And the cell is a fixed-size summary — reproducing an arbitrarily long
past sequence verbatim exceeds $n$ real numbers of capacity however well gradients
flow, which is a different failure from the one gating fixes.

## Uses and applicability

Reach for an LSTM when the data is sequential and either the stream is unbounded or
inference must be online: it costs $O(1)$ state and $O(1)$ work per step with no
growing cache, which suits on-device audio, control loops and real-time forecasting.
It is also a sound default on small datasets and as a memory in partially observed
reinforcement learning. Graves demonstrated the regime it was built for:
character-level text prediction and online handwriting synthesis with deep stacked
LSTMs.

Avoid it when training throughput dominates. The recurrence is sequential in $T$, so
a step cannot start before the previous one finishes, and that property — more than
accuracy — is why transformers displaced LSTMs for large-scale language modelling.
Avoid it too when the task needs exact retrieval from far back.

## Limitations and common mistakes

The most common error is to read "solves the vanishing gradient problem". It does
not: gradients still decay, only slowly and at a learned rate, and the explosion
half of the problem is not addressed at all.

The second is confusing $c_t$ with $h_t$. The cell state is not the output: a cell can
hold information for a hundred steps with the output gate shut, contributing nothing
to predictions in between, so reading out $h_t$ and concluding the memory is empty
misreads the architecture.

The third is treating gates as binary. They are soft, and typically unsaturated early
in training, which is exactly when the memory is leakiest.

The fourth is over-reading benchmark comparisons: whether LSTM or GRU wins is task
and dataset dependent, and the published differences are empirical findings on
particular corpora, not properties of the architectures.

## Variants and alternatives

**Peephole connections** let the gates read $c_{t-1}$ directly, which helps on tasks
requiring precise timing; Graves uses this form. **Coupled input and forget gates**
set $i_t = 1 - f_t$, saving parameters. **Bidirectional** LSTMs run two cells in
opposite directions, available offline but not for streaming, and **stacked** LSTMs
add depth at each step. Ablation studies have generally found none of these reliably
better than the standard cell.

The nearest genuinely different approach is the **GRU** of Cho et al., which merges
the cell and hidden state and uses an update and a reset gate: fewer parameters,
often comparable accuracy, no separate protected memory. Further out, **attention**
and **transformers** drop the sequential state and give every position a direct path
to every other — better gradients and parallel training, at quadratic cost in
sequence length.

## History and attribution

Hochreiter and Schmidhuber introduced LSTM in 1997, in response to Hochreiter's
earlier analysis showing that error signals in recurrent networks either vanish or
blow up. Their cell had a constant error carousel with a self-connection of weight
one, an **input gate** and an **output gate** — the multiplicative gates shielded the
memory from irrelevant inputs and the rest of the network from irrelevant memory
contents. There was no forget gate.

The forget gate was added by Gers, Schmidhuber and Cummins in 1999/2000, motivated by
a failure of the original cell on continually running streams: with no way to reset,
the cell state grew without bound and saturated. Peephole connections followed from
the same group. The equations given above are that later cell, not the 1997 one — a
distinction frequently lost when the architecture is attributed wholesale to the 1997
paper.

## Sources

The 1997 **Long Short-Term Memory** paper covers the constant error carousel, the
original two-gate cell and the analysis motivating it. **Generating Sequences With
Recurrent Neural Networks** gives the modern gate equations with peepholes and
demonstrates deep LSTMs on text and handwriting. The **Deep Learning** book, chapter
10, is the clearest secondary treatment of long-term dependencies and where gated
RNNs sit among the fixes. The **GRU** paper is cited only for the alternative gating
scheme.

## Prerequisites and next connections

Read the recurrent neural networks page first: unrolling, weight sharing and
backpropagation through time are assumed throughout, and the gradient argument here
is a comparison against that vanilla recurrence.
[Backpropagation](./backpropagation.md) supplies the chain rule in the form used
above.

Afterwards, the GRU page is the natural next stop — the same additive path, cheaper
gating. [Residual Connection](./residual-connection.md) applies the same trick in
depth rather than in time, and reading the two together makes the shared mechanism
obvious. [Hidden Markov Models](./hidden-markov-models.md) is the probabilistic
predecessor, discrete where the LSTM is a continuous vector, and
[PyTorch](./pytorch.md)'s fused recurrent kernels are what you would use rather than
the loop above. The attention and transformer pages take up the story where the
sequential bottleneck left off.
