---
concept_id: concept.deep_learning.attention
title: Attention
slug: /concepts/attention
kind: method
tier: 1
review_state: generated-draft
summary: Attention lets a model read a whole collection of items at once by blending their value vectors in proportions it computes from how well each key matches a query, giving content-dependent, differentiable lookup.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: prerequisite_of
    target: concept.deep_learning.transformers
    note: A transformer block is attention plus a position-wise feedforward network and normalisation, so its architecture cannot be read without knowing what the attention sublayer computes.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: A recurrent network reaches distant context by propagating a fixed-size state through every intervening step, while attention reaches it in one operation at quadratic cost.
  - type: contrasts_with
    target: concept.deep_learning.convolutional_layer
    note: A convolution applies weights that are fixed after training and local in extent, whereas attention computes its mixing weights from the input at run time and over the whole set.
  - type: contributes_to
    target: concept.deep_learning.positional_encoding
    note: Attention is invariant to permuting its keys and values, so order information has to be injected into the representations separately — which is the problem positional encoding exists to solve.
sources:
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.graves2013.generating_sequences
    title: Generating Sequences With Recurrent Neural Networks
    url: https://arxiv.org/abs/1308.0850
    source_kind: preprint
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.elhage2021.transformer_circuits
    title: A Mathematical Framework for Transformer Circuits
    url: https://transformer-circuits.pub/2021/framework/index.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Bahdanau, Cho and Bengio, "Neural Machine Translation by Jointly Learning to Align and Translate" (2014 preprint, ICLR 2015)
    reason: The registry has no entry for the paper that introduced attention, so the origin claim rests on the secondary account in the Deep Learning book rather than on the primary source.
    sections:
      - history-and-attribution
  - label: The attention-as-explanation debate — Jain and Wallace, "Attention is not Explanation"; Wiegreffe and Pinter, "Attention is not not Explanation"; Serrano and Smith, "Is Attention Interpretable?"
    reason: No registry source covers this literature, so the claim that attention weights are contested as explanations is stated from the mechanistic side only.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Attention** maps one query vector and a set of key–value pairs to a single
output vector: the output is a convex combination of the values, with
coefficients obtained by scoring the query against each key and normalising the
scores with a softmax. Writing $q$ for the query, $(k_j, v_j)$ for the $j$-th
pair and $s$ for a scalar scoring function,

$$
\alpha_j = \frac{\exp s(q, k_j)}{\sum_{l} \exp s(q, k_l)},
\qquad
\mathrm{out} = \sum_j \alpha_j v_j .
$$

Nothing there mentions words, images or even neural networks. It is a dictionary
read made differentiable: rather than return the entry whose key matches, it
returns a blend of every entry, weighted by match quality. The dominant choice of
$s$ is the scaled dot product, below.

## Why it matters

Attention was invented to remove a specific bottleneck. A sequence-to-sequence
translator encodes the whole source sentence into one fixed-length vector and
decodes from it, so quality degrades as sentences lengthen. Attention lets the
decoder look back at the entire encoder output at every step.

Two properties made it general beyond translation. The path between any two
positions is one operation, so a gradient connecting position $1$ to position
$1000$ need not survive $999$ multiplications as in a recurrent network. And the
mixing weights are computed from the input at run time: a convolution's weights
are frozen after training, while attention's are a function of the data, so one
parameter set routes differently for every example.

## Intuition

Each position broadcasts a key saying "this is what I am" and a value saying
"this is what you get if you read me"; a reader emits a query saying "this is
what I want". The three are separate learned projections of the same vector, and
keeping them separate is the trick: what makes a token findable need not be what
it hands over.

The lookup analogy breaks in one place. A real lookup can return one entry, or
none. Softmax attention always returns a blend and its weights must sum to one,
so a head with nothing useful to fetch cannot abstain. Trained models often park
that mass on one uninformative token, frequently the first — a robust empirical
observation, not a theorem.

## Concrete example

Take $d_k = 2$, one query and three key–value pairs.

```python
import numpy as np

def attention(Q, K, V):
    scores = Q @ K.T / np.sqrt(K.shape[-1])
    scores = scores - scores.max(axis=-1, keepdims=True)   # numerical safety
    w = np.exp(scores)
    w /= w.sum(axis=-1, keepdims=True)
    return w @ V, w

Q = np.array([[1.0, 0.0]])
K = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
V = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
out, w = attention(Q, K, V)
```

The raw scores are $q \cdot k_j = (1, 0, 1)$; dividing by $\sqrt{2}$ gives
$(0.707, 0, 0.707)$; the softmax gives weights $(0.401, 0.198, 0.401)$ and the
output $(0.802, 0.599)$. The query matches keys 1 and 3 equally and still takes
about a fifth of its output from the key it does not match at all — softmax
attention is dense by construction. Drop the $\sqrt{d_k}$ and the weights become
$(0.422, 0.155, 0.422)$: barely different, because $d_k = 2$.

## Formal treatment

Stack $n$ queries into $Q \in \mathbb{R}^{n \times d_k}$, and $m$ keys and values
into $K \in \mathbb{R}^{m \times d_k}$ and $V \in \mathbb{R}^{m \times d_v}$.
Scaled dot-product attention is

$$
\mathrm{Attention}(Q, K, V) \;=\; \mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right) V
\;\in\; \mathbb{R}^{n \times d_v},
$$

the softmax taken over each row. Masking is additive: set entries to $-\infty$
before the softmax to forbid a read — upper-triangular for autoregressive
decoding, or padded positions in a batch.

**Why $\sqrt{d_k}$.** Suppose the components of $q$ and $k$ are independent with
mean $0$ and variance $1$. Then $q \cdot k = \sum_{i=1}^{d_k} q_i k_i$ has mean
$0$ and variance $d_k$, so logits have standard deviation $\sqrt{d_k}$. At
$d_k = 64$ typical logit gaps are around $8$, and $e^{8} \approx 3000$: the
softmax is effectively one-hot and its Jacobian
$\partial \alpha_i / \partial s_j = \alpha_i(\delta_{ij} - \alpha_j)$ collapses
toward zero, so gradients stop flowing. Dividing by $\sqrt{d_k}$ restores unit
logit variance at any head size. The assumption is an idealisation true at best
at initialisation; the factor is a well-motivated convention, not a theorem that
holds throughout training.

**Multi-head attention** runs $h$ attentions in parallel on learned projections
and concatenates:

$$
\mathrm{MHA}(X) = \big[\mathrm{head}_1, \dots, \mathrm{head}_h\big] W^{O},
\qquad
\mathrm{head}_i = \mathrm{Attention}(XW_i^{Q},\, XW_i^{K},\, XW_i^{V}).
$$

With $d_k = d_v = d_{\text{model}}/h$ the total cost matches one full-width head,
but each head gets its own low-rank subspace and can attend to a different
relation. Note that $W_i^{Q}(W_i^{K})^{\top}$ acts as one bilinear form on pairs
of positions while $W_i^{V}W_i^{O}$ decides what is written out: where a head
reads and what it writes are separate low-rank factors, a decomposition made
explicit in the transformer-circuits framework.

**Cost.** $QK^\top$ is $O(nmd_k)$, and self-attention takes $m = n$, so time is
$\Theta(n^2 d)$ and the score matrix is $\Theta(n^2)$ entries. That quadratic term
dominates the $O(nd^2)$ projection cost only once $n \gtrsim d$ — which is why
short-context models are not bound by it and long-context ones are.

## Assumptions and requirements

Queries and keys must share a $d_k$-dimensional space at comparable scale for a
dot product to mean anything; the learned projections and the normalisation layer
before them keep that roughly true. Remove the normalisation and logit magnitudes
drift until the softmax saturates.

Attention assumes the whole key–value set is available at once. In autoregressive
decoding that is disciplined by the causal mask rather than by architecture, and
a wrong mask leaks future tokens without raising an error — the loss simply comes
out suspiciously low.

The operation is permutation invariant in keys and values: permuting the rows of
$K$ and $V$ together leaves every output row unchanged, while permuting $Q$
permutes the outputs. Attention alone therefore cannot know word order. Finally,
the softmax needs max-subtraction, and in half precision unscaled logits can
overflow — a purely numerical second reason for the scaling.

## Uses and applicability

Reach for attention when the useful context is variable in length, unknown in
position, or relational: cross-attention from a decoder to an encoded source,
self-attention within a sequence, attention over image patches, graph
neighbourhoods, or a retrieved memory. Its permutation invariance also makes it a
natural layer for genuinely unordered inputs such as sets of objects.

Reach for something else when the structure is known and local — a
[Convolutional Layer](./convolutional-layer.md) encodes locality and weight
sharing as a prior and usually learns such problems from less data — or when
sequences are long enough that $n^2$ dominates.

## Limitations and common mistakes

**Attention weights are not explanations.** This is the misconception to unlearn
first. A high weight says a value was mixed in, not that it caused the
prediction: a head's effect is its attention pattern composed with what it
writes, the result lands in a residual stream alongside every other head, and
later layers may ignore it. Published experiments have found alternative weight
distributions that leave a text classifier's prediction essentially unchanged;
the counter-argument, that such adversarially constructed weights are not the
ones the model learned, is also on the record. The debate is not settled, and a
heatmap is not a faithful account of the computation under either reading.

**Quadratic cost is about memory as much as time.** Materialising an $n \times n$
score matrix per head is what exhausts memory first; kernels that avoid
materialising it leave the $\Theta(n^2 d)$ arithmetic unchanged, but they do cut
peak attention memory from $\Theta(n^2)$ to $\Theta(nd)$ and reduce traffic to
device memory, which is why they extend usable context length without changing
the compute asymptotics. See [GPU Kernels](./gpu-kernels.md).

**Attention is not sparse.** Every weight is strictly positive, so near-zero does
not mean "not read", and many small weights can sum to most of the output.

**Self-attention and cross-attention are different layers.** The first projects
$Q$, $K$ and $V$ from one sequence; the second takes its query from another.

## Variants and alternatives

The scoring function is the first axis. **Additive (Bahdanau) attention** scores
with a small MLP, $s(q,k) = w^{\top}\tanh(W_q q + W_k k)$; it needs no shared
dimension and is more robust unscaled, but it is not a single matrix multiply and
is slower on accelerators. **Dot-product (Luong) attention** drops the MLP, and
the scaled version adds $1/\sqrt{d_k}$.

Head layout is the second. **Multi-query** and **grouped-query** attention share
keys and values across heads, shrinking the decoding cache at some cost in
quality. **Hard attention** samples one position instead of blending: cheaper,
but not differentiable, so it needs a gradient estimator.

Cost is the third. **Local, windowed and sparse** attention restricts which pairs
are scored; **linear attention** replaces the softmax with a kernel feature map so
$(QK^\top)V$ can be re-associated as $Q(K^\top V)$ in $O(n)$, trading exactness
for scale; FlashAttention-style kernels keep exact attention and change only
memory traffic and footprint, not the arithmetic. State-space sequence models
are the genuinely different alternative: linear-time mixing through an
input-dependent recurrent state rather than all-pairs scoring.

## History and attribution

Attention entered neural machine translation with Bahdanau, Cho and Bengio, whose
2014 preprint (ICLR 2015) proposed learning a soft alignment so the decoder need
not read the source through one fixed-length vector — three years before
transformers, and inside a recurrent encoder-decoder. The Deep Learning book
records both the mechanism and that motivation.

It had precursors. Graves's 2013 handwriting synthesis work used a differentiable,
location-based attention window — a mixture of Gaussians over input positions — to
align text with pen strokes, and memory-augmented architectures of the same period
used content-based addressing that is recognisably the same weighted read. The
idea had several near-simultaneous origins in the problem of making a discrete
lookup trainable by gradient descent.

Luong, Pham and Manning simplified the scoring to a dot product in 2015. Vaswani
et al. (2017) contributed the scaled dot product, multi-head attention, and the
claim in their title: once you have attention, the recurrence can go.

## Sources

**Attention Is All You Need** specifies scaled dot-product and multi-head
attention exactly, gives the variance argument for $\sqrt{d_k}$ and the per-layer
complexity comparison, and contrasts dot-product with additive scoring. The
**Deep Learning** book says why attention was introduced for translation and by
whom. **Generating Sequences With Recurrent Neural Networks** is the primary
source for the attention window that predates it. **A Mathematical Framework for
Transformer Circuits** sets out the query–key and value–output factorisation.

## Prerequisites and next connections

You need matrix multiplication and inner products from
[Matrix Theory](./matrix-theory.md), the softmax and its Jacobian, and enough
[Backpropagation](./backpropagation.md) to see why a saturated softmax stops
learning. [Layer Normalization](./layer-normalization.md) is worth reading
alongside: it keeps the inputs to the query and key projections in range.

From here, the transformer page assembles attention into a block, positional
encoding supplies the order information attention discards, and the vision
transformer applies the layer to image patches. For contrast, read recurrent
networks, which buy linear cost with a compressed state; for speed, read
[GPU Kernels](./gpu-kernels.md).
