---
concept_id: concept.deep_learning.gru
title: GRU
slug: /concepts/gru
aliases:
  - gated recurrent unit
kind: method
tier: 1
review_state: generated-draft
summary: A recurrent cell that updates its hidden state as a learned interpolation between the old state and a fresh candidate, using two gates and no separate memory cell.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.recurrent_neural_networks
    note: The GRU changes only how a recurrent hidden state is updated, so the page is unreadable without the notion of a state carried across time steps and trained through time.
  - type: contrasts_with
    target: concept.deep_learning.lstm
    note: Both gate a recurrent state, but the GRU merges the forget and input gates into one update gate, drops the output gate, and keeps no separate cell vector.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: A GRU compresses history into a fixed-size state updated sequentially, where a transformer keeps every position and attends over all of them in parallel.
  - type: contributes_to
    target: concept.deep_learning.attention
    note: The GRU encoder-decoder of Cho et al. is the architecture whose fixed-length summary vector attention was introduced to bypass.
sources:
  - source_id: source.cho2014.gru
    title: 'Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation'
    url: https://arxiv.org/abs/1406.1078
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hochreiter1997.long_short_term_memory
    title: Long Short-Term Memory
    url: https://direct.mit.edu/neco/article/9/8/1735/6109/Long-Short-Term-Memory
    source_kind: primary-research
    supports:
      - why-it-matters
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.gu2023.mamba
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces'
    url: https://arxiv.org/abs/2312.00752
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Head-to-head GRU versus LSTM comparison studies (Chung et al. 2014; Greff et al.; Jozefowicz et al.)
    reason: The registry has no paper that runs the controlled architecture comparisons, so the statement that neither unit consistently wins rests on the summary in the Deep Learning book rather than on the studies themselves. Chung et al. is also the paper the formal treatment dates the flipped update-gate convention to.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
---

## Definition

A **gated recurrent unit** (GRU) is a recurrent cell whose state update is a
convex combination, computed per coordinate, of the previous hidden state and a
freshly proposed candidate state. Two sigmoid gates control it: an **update
gate** $z_t$ that decides how much of the old state survives, and a **reset gate**
$r_t$ that decides how much of the old state the candidate may see. There is no
cell state and no output gate: the hidden state $h_t$ is the unit's entire memory
and is also what the next layer reads.

## Why it matters

A plain recurrent network multiplies its state by a weight matrix at every step,
so gradients shrink or blow up exponentially in the number of steps — the
analysis that motivated gating, and the reason plain recurrence fails beyond a
few dozen steps. Gating replaces multiplication with interpolation: when $z_t$
saturates toward "keep", the state passes through nearly unchanged and a gradient
travels back along a near-identity path.

The GRU matters because it showed the full LSTM machinery is not required for
this: a smaller unit that "adaptively remembers and forgets" worked well enough
on translation to become the second default recurrent cell.

## Intuition

Picture a leaky accumulator with a learned, input-dependent leak rate. Each
coordinate decides for itself, at every step, whether to hold its value or
replace it. That dial is the update gate, and because it reads the data a unit
can hold a value for two hundred steps and overwrite it when the right token
arrives.

The reset gate is a separate and less obvious dial: it changes not what is kept
but what the _candidate_ is built from. Near zero, the candidate becomes a
function of the input alone — how a unit starts a fresh segment without its
proposal being contaminated by the old state.

Where the analogy breaks: the leak rate is not a constant, the gates read the
state they are gating, and the update is an interpolation, so a GRU coordinate
can never both fully keep its old value and fully add a new one. An LSTM cell
can, because its forget and input gates are independent.

## Concrete example

Take a one-dimensional GRU with every weight set to $1$ and every bias to $0$,
in the convention where $z_t$ weights the _old_ state. With $h_{t-1} = 0.5$ and
$x_t = 1.0$:

```python
import numpy as np

sigmoid = lambda v: 1.0 / (1.0 + np.exp(-v))
x, h = 1.0, 0.5

r = sigmoid(x + h)              # 0.8176  reset gate
z = sigmoid(x + h)              # 0.8176  update gate (weight on the old state)
n = np.tanh(x + r * h)          # 0.8872  candidate
h_new = (1 - z) * n + z * h     # 0.5706
```

The candidate wants the state to be $0.887$; because the update gate is open to
$0.82$ in favour of memory, the state moves only to $0.571$. Change one number —
set the update-gate bias to $-3$, so $z = \sigma(1.5 - 3) = 0.182$ — and the same
step gives $h_t = 0.817$. The unit has gone from holding its value to overwriting
it, and nothing else changed.

Parameter counts follow the same arithmetic. With $d_x = 256$ and $d_h = 512$, a
GRU has $3(d_h d_x + d_h^2 + d_h) = 1{,}181{,}184$ parameters against an LSTM's
$1{,}574{,}912$: exactly three quarters, three affine maps instead of four.

## Formal treatment

Let $x_t \in \mathbb{R}^{d_x}$ be the input at step $t$ and
$h_{t-1} \in \mathbb{R}^{d_h}$ the previous state. With $\sigma$ the logistic
function, $\odot$ the elementwise product, $W_\bullet \in \mathbb{R}^{d_h \times d_x}$,
$U_\bullet \in \mathbb{R}^{d_h \times d_h}$ and $b_\bullet \in \mathbb{R}^{d_h}$:

$$
z_t = \sigma(W_z x_t + U_z h_{t-1} + b_z), \qquad
r_t = \sigma(W_r x_t + U_r h_{t-1} + b_r),
$$

$$
\tilde h_t = \tanh\!\big(W_h x_t + U_h (r_t \odot h_{t-1}) + b_h\big),
$$

$$
h_t = z_t \odot h_{t-1} + (1 - z_t) \odot \tilde h_t .
$$

This is Cho's form, where $z_t$ multiplies the old state; the follow-up
literature — already Chung et al. six months later, with Cho and Bengio among
its authors — writes $h_t = (1-z_t)\odot h_{t-1} + z_t \odot \tilde h_t$, the same
family of functions with $z$ renamed $1-z$.

Compare the LSTM, which keeps a second vector $c_t$:

$$
c_t = f_t \odot c_{t-1} + i_t \odot g_t, \qquad h_t = o_t \odot \tanh(c_t).
$$

Three structural differences follow. First, $f_t$ and $i_t$ are independent, so
the cell update is unconstrained and $c_t$ is unbounded, whereas a GRU's $h_t$ is
a convex combination of a previous state and a $\tanh$ output and so stays in
$[-1,1]^{d_h}$ once $h_0$ does. Second, the output gate lets an LSTM hide part of
its memory; the GRU exposes all of $h_t$. Third, the reset gate has no LSTM
analogue: it modulates the input to the candidate rather than the memory itself.

Differentiating the update gives

$$
\frac{\partial h_t}{\partial h_{t-1}} = \operatorname{diag}(z_t) + R_t ,
$$

where $R_t$ collects the terms passing through $z_t$, $r_t$ and $\tilde h_t$. The
$\operatorname{diag}(z_t)$ term is the additive shortcut — not the whole
Jacobian, and strictly contractive whenever a gate is unsaturated, so gradients
still decay, more slowly and under the model's control.

## Assumptions and requirements

The unit assumes the task's relevant history compresses into $d_h$ numbers.
Nothing here stores a variable-length record, so exact recall of arbitrary
earlier content — copying a long string, retrieving a rare name from a document —
is outside what a fixed state can do, however good the gates are.

It assumes you can afford a sequential pass: $\tilde h_t$ puts $h_{t-1}$ through
$U_h$ and a $\tanh$, so step $t$ cannot begin before step $t-1$ finishes. There
is no parallel form over the time axis.

Gating addresses the vanishing side of the gradient problem and not the exploding
side, so gradient clipping remains standard practice, and batch statistics are
awkward across variable-length sequences, which is part of why
[Layer Normalization](./layer-normalization.md) is the usual choice in recurrent
stacks. Practitioners also initialise the update-gate bias so the unit _defaults_
to carrying state forward — a convention whose sign depends on which of the two
forms above the code uses.

## Uses and applicability

Reach for a GRU when sequences are long-running or unbounded and the per-step
budget is fixed: streaming sensor data, online control, keyword spotting on a
device, time-series forecasting with modest data. Cost per step is constant in
sequence length and memory is $O(d_h)$, where a transformer's cache grows with
every token. It is also reasonable when the training set is small enough that a
transformer would mostly overfit.

Do not reach for it when you need long-range exact retrieval, when you can and
want to train over many tokens in parallel, or when a strong pretrained model
exists for the domain. For machine translation — the task it was invented for —
it has been superseded.

## Limitations and common mistakes

The most common error is treating "fewer parameters" as "better". A GRU has
three quarters of an LSTM's parameters _at the same widths_; that is arithmetic,
not evidence. It also means the two comparisons researchers run are different
experiments: matched hidden size gives the LSTM more capacity, matched parameter
count gives the GRU a wider state.

The second is expecting a verdict. Controlled comparisons of gated units have
repeatedly come out task-dependent, with no unit winning consistently across
sequence-modelling benchmarks. "It depends on the task, try both" is the honest
summary, and it has not moved in a decade.

The third is assuming gating removes vanishing gradients. It provides a path
along which they do not vanish, which the model must learn to open.

The fourth is silent convention mismatch. Beyond the $z$ versus $1-z$ split,
implementations differ in where the reset gate is applied: Cho computes
$U_h(r_t \odot h_{t-1})$, while the cuDNN formulation used by
[PyTorch](./pytorch.md) computes $r_t \odot (U_h h_{t-1} + b)$ so the three
recurrent matrix multiplies fuse into one GEMM. These are different functions,
and porting weights without checking produces a model that runs and is wrong.

## Variants and alternatives

The nearest neighbour is the **LSTM**, which buys an unbounded cell state and an
output gate at the price of a fourth gate and a second state vector. Within the
GRU family, **minimal gated units** tie the reset and update gates into one, and
some speech variants drop the reset gate entirely, trading expressiveness for
speed; orthogonal to the cell are **bidirectional** stacks and depth with
[Residual Connections](./residual-connection.md).

The genuinely different alternatives are architectural. Transformers drop
recurrence for attention, buying parallel training at quadratic cost in sequence
length; temporal convolutions buy parallelism with a bounded receptive field.
**Selective state-space** models revive gating in parallelisable form: the Mamba
paper shows its selection mechanism, specialised
to one dimension, reduces to exactly a gated recurrence
$h_t = (1-g_t) h_{t-1} + g_t x_t$. What they give up is the GRU's hidden-to-hidden
matrix and the nonlinearity inside the recurrence — precisely what lets a
parallel scan compute theirs.

## History and attribution

The unit was introduced in June 2014 by Cho, van Merriënboer, Gulcehre,
Bahdanau, Bougares, Schwenk and Bengio, in a paper about statistical machine
translation rather than about recurrent architectures: the goal was an RNN
encoder-decoder that could score phrase pairs as a feature for a phrase-based
translation system, and the new hidden unit arrived along the way, motivated by
the LSTM and designed to be cheaper and simpler. The abbreviation "GRU" is not
theirs — it spread through follow-up comparison studies later that year.

The ancestry is Hochreiter and Schmidhuber's 1997 LSTM, which introduced gating
to hold an error signal constant across long lags. The forget gate that the GRU's
update gate most resembles was not in that original design; it was added by Gers,
Schmidhuber and Cummins around 2000, so the GRU simplifies an architecture that
had itself been amended for a decade.

## Sources

Cho et al. is the primary source for the equations, the two gates, and the
translation problem the unit was built for. The Deep Learning book's chapter on
sequence modelling is the best single account of why gating works, of gradient
clipping and the other practical requirements, and of the comparison literature
on gated variants. The 1997 LSTM paper is where gating originates; the long-lag
gradient analysis it builds on is Hochreiter's 1991 diploma thesis, which that
paper reviews, and which Bengio, Simard and Frasconi obtained independently in 1994. Mamba is cited only for deriving classical gating as a
special case of selective state spaces.

## Prerequisites and next connections

Read the recurrent neural network page first: the GRU is one choice of update
rule inside that loop. [Backpropagation](./backpropagation.md) is assumed, since
training through time is backpropagation on the unrolled graph.

The LSTM page is the natural next step — read the two sets of equations side by
side and the differences stop being a list of gate names. Then attention and
transformers, the path the field took when a fixed-size state stopped being
enough. In the other direction,
[Hidden Markov Models](./hidden-markov-models.md) attack the same problem with a
discrete latent state and exact inference, making explicit what a GRU's learned,
approximate state trades away.
