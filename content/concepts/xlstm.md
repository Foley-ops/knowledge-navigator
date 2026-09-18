---
concept_id: concept.deep_learning.xlstm
title: xLSTM
slug: /concepts/xlstm
aliases:
  - Extended Long Short-Term Memory
kind: concept
tier: 1
review_state: generated-draft
summary: A 2024 redesign of the LSTM that replaces sigmoid gating with normalised exponential gating and enlarges the memory, in two block types — a strictly sequential sLSTM with a scalar cell and a parallelisable mLSTM with a matrix cell — in an attempt to make recurrent language models trainable at Transformer scale.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.lstm
    note: Every equation here is a modification of the LSTM's gates and cell state, and the deficits xLSTM sets out to fix are properties of that cell.
  - type: contrasts_with
    target: concept.deep_learning.transformers
    note: The two solve the same problem with opposite cost profiles — a state that grows with context and exact random access, against a fixed-size state and lossy compression.
  - type: contrasts_with
    target: concept.deep_learning.mamba
    note: Both replace attention with a recurrence that has a parallel training form — a scan for Mamba, an attention-like quadratic form for mLSTM — but Mamba's state is a diagonal continuous-time system while mLSTM's is a dense outer-product memory.
  - type: contrasts_with
    target: concept.deep_learning.rwkv
    note: RWKV reached the same goal from the linear-attention side and is the closest existing architecture to mLSTM, which makes the differences in gating and state shape the interesting comparison.
sources:
  - source_id: source.beck2024.xlstm
    title: 'xLSTM: Extended Long Short-Term Memory'
    url: https://arxiv.org/abs/2405.04517
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hochreiter1997.long_short_term_memory
    title: Long Short-Term Memory
    url: https://direct.mit.edu/neco/article/9/8/1735/6109/Long-Short-Term-Memory
    source_kind: primary-research
    supports:
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
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Follow-up work applying xLSTM blocks outside language modelling, and independent third-party replications of the language-modelling comparisons
    reason: The registry has the original xLSTM preprint but no entry for later vision or larger-scale xLSTM models, and no independent evaluation of the architecture, so the sentences about what has happened since 2024 are stated without a citation and should be checked before this page leaves generated-draft.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**xLSTM** ("extended LSTM") changes the LSTM in two places and stacks the result
in residual blocks. The first change is **exponential gating**: the input gate is
$\exp$ of its pre-activation rather than a sigmoid, and the cell carries a running
**normaliser state** and a **stabiliser state** so that an unbounded gate stays
numerically usable. The second is the memory, in two forms. **sLSTM** keeps a
scalar cell per unit and keeps _memory mixing_ — the gates read the previous
hidden state — with heads that mix within a head but not across heads. **mLSTM**
replaces the scalar cell with a matrix $C_t \in \mathbb{R}^{d \times d}$ updated by
an outer-product rule, and drops memory mixing entirely.

That removal is the pivot of the design: with no hidden-to-hidden path the mLSTM
recurrence is linear in its state given the inputs, so the whole sequence can be
computed at once, while sLSTM must be scanned one step at a time.

## Why it matters

Beck et al. name three deficits of the [LSTM](./lstm.md). It cannot revise a
storage decision, because a sigmoid input gate contributes at most $1$, so a
later and better-matching input can only add to what is there. Its memory is one
scalar per unit. And memory mixing forces sequential computation, so an LSTM
cannot fill a GPU the way a [Transformer](./transformers.md) can — the third
deficit, not the first two, is why the architecture lost the scaling race.

The prize is the recurrent cost profile. A Transformer's inference state is a
key-value cache growing linearly with context, and attention costs grow
quadratically with sequence length; an xLSTM's state is a fixed-size cell, so it
generates in constant memory per step however much text has gone past.

## Intuition

Read the normalised exponential gate as a running softmax. With the forget gate
held at $1$, the cell divided by its normaliser is exactly a softmax-weighted
average of the candidate values, scored by the input-gate pre-activations. An
unbounded gate therefore lets a late arrival _outvote_ everything stored so far
in one step — precisely the revision the sigmoid cell cannot perform.

The analogy breaks in one place: attention recomputes its weights over keys that
are all still there, while the exponential gate mixes values into one accumulator
as they arrive, and once mixed they cannot be separated again.

For mLSTM, carry a different picture — the correlation-matrix associative memory
of [Hopfield Networks](./hopfield-networks.md). Key-value pairs go in as outer
products and come back out by multiplying by a query. Capacity is finite and
interference between non-orthogonal keys is the failure mode, but the matrix does
not grow with the sequence.

## Concrete example

One scalar cell, forget gate fixed at $1$, two steps: at $t=1$ a value $z_1 = +1$
arrives with input-gate pre-activation $3$, at $t=2$ a better match $z_2 = -1$
with pre-activation $6$.

With exponential gating, $i_1 = e^3 \approx 20.09$ and $i_2 = e^6 \approx 403.43$,
so $c_2 = -383.34$, $n_2 = 423.51$, and the cell reads $c_2/n_2 = -0.905$: the
second item took it over, at weight $0.953$ against the first item's $0.047$.

With sigmoid gating and no normaliser, $i_1 = \sigma(3) = 0.953$ and
$i_2 = \sigma(6) = 0.998$, so $c_2 = -0.045$ and the two items nearly cancel.
Doubling the pre-activation moved the gate by $0.045$, so the later item could
not outweigh the earlier one however well it matched.

The mLSTM's two forms compute the same thing. This prints `True`; the stabiliser
is omitted, which is safe at $T = 6$:

```python
import numpy as np

d, T = 4, 6
rng = np.random.default_rng(0)
q, k, v = (rng.normal(size=(T, d)) for _ in range(3))
k = k / np.sqrt(d)
i_log = rng.normal(size=T)                        # input-gate pre-activations
f_log = -np.logaddexp(0.0, -rng.normal(size=T))   # log sigmoid forget gates

C, n, h_rec = np.zeros((d, d)), np.zeros(d), []   # recurrent form: one state
for t in range(T):
    C = np.exp(f_log[t]) * C + np.exp(i_log[t]) * np.outer(v[t], k[t])
    n = np.exp(f_log[t]) * n + np.exp(i_log[t]) * k[t]
    h_rec.append(C @ q[t] / max(abs(n @ q[t]), 1.0))

cum = np.cumsum(f_log)                            # parallel form: decay mask
D = np.tril(np.exp(i_log[None, :] + cum[:, None] - cum[None, :]))
S = (q @ k.T) * D
h_par = (S @ v) / np.maximum(np.abs(S.sum(1)), 1.0)[:, None]

print(np.allclose(np.array(h_rec), h_par))
```

## Formal treatment

Write $x_t$ for the input at step $t$, $d$ for the head dimension, $\odot$ for
the elementwise product and $\sigma$ for the logistic function.

**sLSTM.** With cell state $c_t$, normaliser $n_t$ and hidden state $h_t$, all
scalars per unit,

$$
c_t = f_t\, c_{t-1} + i_t\, z_t, \qquad
n_t = f_t\, n_{t-1} + i_t, \qquad
h_t = o_t \odot \frac{c_t}{n_t},
$$

where $z_t = \tanh(w_z^\top x_t + r_z h_{t-1} + b_z)$,
$i_t = \exp(w_i^\top x_t + r_i h_{t-1} + b_i)$,
$o_t = \sigma(w_o^\top x_t + r_o h_{t-1} + b_o)$, and the forget gate is either
$\sigma(\tilde f_t)$ or $\exp(\tilde f_t)$. The recurrent weights $r_z, r_i, r_o$
are memory mixing: they make $h_{t-1}$ an argument of the gates.

**mLSTM.** Projections $q_t = W_q x_t + b_q$,
$k_t = \tfrac{1}{\sqrt{d}} W_k x_t + b_k$, $v_t = W_v x_t + b_v$, gates depending
on $x_t$ alone, and

$$
C_t = f_t\, C_{t-1} + i_t\, v_t k_t^\top, \qquad
n_t = f_t\, n_{t-1} + i_t\, k_t, \qquad
h_t = o_t \odot \frac{C_t q_t}{\max\!\left(\lvert n_t^\top q_t \rvert,\, 1\right)} .
$$

Because the gates do not read $h_{t-1}$, unrolling gives the closed form
$C_t = \sum_{s \le t} \big(\prod_{r=s+1}^{t} f_r\big) i_s v_s k_s^\top$, so with
$Q, K, V \in \mathbb{R}^{T \times d}$ and the lower-triangular decay mask
$\bar D_{ts} = i_s \prod_{r=s+1}^{t} f_r$,

$$
S = (QK^\top) \odot \bar D, \qquad
H = \operatorname{diag}\!\big(\max(\lvert S\mathbf{1}\rvert, 1)\big)^{-1} S V .
$$

This is attention with a causal decay mask in place of a softmax. It costs
$O(T^2 d)$ time and $O(T^2)$ memory per head; the recurrent form costs
$O(T d^2)$ time and $O(d^2)$ memory. Training may use either; generation uses the
recurrent one.

**Stabilisation.** Both cells carry $m_t = \max(\log f_t + m_{t-1}, \log i_t)$ and
replace $i_t \mapsto \exp(\log i_t - m_t)$, $f_t \mapsto \exp(\log f_t + m_{t-1} - m_t)$.
Both $c_t$ and $n_t$ are scaled by the same $e^{-m_t}$, so $h_t$ is unchanged:
this is the max-subtraction trick of a stable softmax, applied to a recurrence.

## Assumptions and requirements

The stabiliser is not optional: an exponential input gate with pre-activation
$100$ overflows float32 in one step, and exponential forget gates compound. The
invariance above is what makes discarding the common factor legal.

The parallel form assumes the gates read $x_t$ only; any state-dependence
destroys the closed form, which is why exactly one block is parallelisable — a
structural fact, not an engineering gap.

The matrix memory assumes $d^2$ entries per head suffice and that stored keys are
near enough to orthogonal for retrieval to separate them; both degrade silently
as pairs accumulate. The forget gate governs long-span retention, and the paper
initialises its bias so gates start near $1$ — without that, long memory must be
learned from a regime where it has already decayed.

## Uses and applicability

Reach for xLSTM when the inference-time state must be bounded — long-running
generation, streaming inputs, deployment where a key-value cache proportional to
context is the binding constraint — and when sequences are long enough that
quadratic attention hurts.

Do not, when the task needs exact recall of arbitrary earlier tokens: a key-value
cache is a lossless record, a $d \times d$ matrix is lossy compression, and
retrieval-style tasks expose the difference. Nor when tooling matters.

## Limitations and common mistakes

The most common error is saying "xLSTM is parallelisable". Only mLSTM is. sLSTM
is sequential by construction, so any stack containing sLSTM blocks trains with
sequential blocks in it; the authors' hand-written CUDA kernel narrows the
constant factor but cannot change the dependency structure.

The second is expecting the parallel form to be cheap. It is $O(T^2)$ in sequence
length, like attention: the asymptotic win is at inference, not necessarily in
training throughput.

The third is treating the reported comparisons as settled. Beck et al. report
favourable validation perplexity and downstream scores against Transformer, Mamba
and RWKV baselines at around $10^8$ to $10^9$ parameters on SlimPajama, plus
associative-recall and formal-language probes — the method's authors, at one
scale, with one recipe. That is evidence of competitiveness in that regime, not
of a general win, and independent replication remains thin.

A subtler mistake is assuming the matrix memory retires the capacity question. It
moves capacity from $O(d)$ to $O(d^2)$ per head — larger, still finite, and a far
bigger state to push through memory at each generation step than a diagonal
state-space model carries.

## Variants and alternatives

Within xLSTM the free choice is the mix: the paper writes `xLSTM[a:b]` for a
stack with $a$ mLSTM blocks per $b$ sLSTM blocks, so `xLSTM[1:0]` is mLSTM-only
and fully parallelisable while `xLSTM[7:1]` interleaves one sequential block in
eight. The cells sit in different residual blocks — sLSTM in a post-up-projection
block, like a Transformer's attention-then-MLP, mLSTM in a pre-up-projection
block, like a state-space model's.

Outside it, mLSTM belongs to the gated-linear-attention family, which is the
honest framing of the alternatives. RWKV-style models, retention-style models and
Mamba all replace softmax attention with a recurrence admitting a parallel
training form, differing in the shape of the state (dense matrix, diagonal,
structured) and in what the gates may depend on. Mamba pays for input-dependent
state-space parameters with a hardware-aware scan; mLSTM reaches
input-dependence more directly and pays with a dense state. Plain attention gives
up bounded state for exact access. Blocks from this family have since been
applied outside language modelling and larger xLSTM models released, but that
work is outside what this page cites.

## History and attribution

xLSTM was introduced by Beck, Pöppel, Spanring, Auer, Prudnikova, Kopp,
Klambauer, Brandstetter and Hochreiter in a May 2024 preprint from JKU Linz and
NXAI — Hochreiter being a co-author of the 1997 LSTM paper. The motivating
question is direct: how far does the LSTM go when scaled to billions of
parameters with modern language-model technique and its known deficits fixed?

It arrived after the Transformer had displaced recurrent models and after several
2023 attempts to reclaim the ground with linear-time recurrences — a late,
careful entry in that wave, arguing that the LSTM's defeat was about parallelism
rather than gating. Neither ingredient is new alone: log-space stabilisation is
standard for softmax, and outer-product associative memory long predates deep
learning. The contribution is the combination, and the observation that dropping
memory mixing is the price of admission to GPU-scale training.

## Sources

The **xLSTM preprint** is the source for everything here — the two cells, the
stabilisation, the block structure, the experiments — and is also where the
architecture comparisons are reported, which is why this page labels them as
reported. The **1997 Long Short-Term Memory paper** is the architecture being
extended; **Attention Is All You Need** the baseline whose cost profile xLSTM
argues against; the **Mamba** paper the nearest competing design and the clearest
statement of the selective-state-space alternative.

## Prerequisites and next connections

Read [LSTM](./lstm.md) first — its gates, cell state and additive recurrence are
assumed on every line here. [Recurrent Neural Networks](./recurrent-neural-networks.md)
supplies backpropagation through time, and [Attention](./attention.md) the
parallel-form comparison. [Transformers](./transformers.md) is the architecture
xLSTM is positioned against, and Mamba and RWKV are the neighbours to read next:
the three make almost the same bet and differ in the places this page marks.
