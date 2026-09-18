---
concept_id: concept.deep_learning.positional_encoding
title: Positional Encoding
slug: /concepts/positional-encoding
aliases:
  - sinusoidal positional encoding
kind: method
tier: 1
review_state: generated-draft
summary: The mechanism that tells a transformer where each token sits, because self-attention on its own treats its input as a set rather than a sequence.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.attention
    note: The permutation equivariance that positional encoding exists to repair is a property of the attention operation, so its definition has to be in hand first.
  - type: contributes_to
    target: concept.deep_learning.transformers
    note: A transformer's entire sensitivity to word order comes from the positional signal; remove it from an unmasked stack and the model computes a set function.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: A recurrent network encodes order implicitly in the sequence of its state updates and needs no positional signal, which is exactly what parallel attention gives up.
  - type: contributes_to
    target: concept.deep_learning.vision_transformer
    note: Image patches arrive as an unordered set, so a vision transformer has to add position embeddings to recover the spatial grid.
sources:
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.dosovitskiy2021.vision_transformer
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale'
    url: https://arxiv.org/abs/2010.11929
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.touvron2023.llama
    title: 'LLaMA: Open and Efficient Foundation Language Models'
    url: https://arxiv.org/abs/2302.13971
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Relative and rotary position scheme papers
    reason: The registry has no paper for relative position representations, rotary embeddings or linear attention biases, so the definitions and claimed properties of those schemes here are attested only indirectly, through the LLaMA report that adopts rotary embeddings by reference.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: Measured length-extrapolation behaviour of position schemes
    reason: The findings that absolute encodings degrade beyond the trained length, and that causal decoders can learn order with no explicit encoding at all, are empirical results from papers the registry does not list; only the original extrapolation hypothesis is cited.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Positional encoding** is any scheme that makes a model's computation depend on
where a token sits in a sequence, in an architecture whose other components
cannot see order. The property it repairs is precise. Write the input as
$X \in \mathbb{R}^{n \times d}$, one row per token. A stack of unmasked
self-attention, position-wise feedforward layers and normalisation is
**permutation-equivariant**:

$$
f(PX) = P\,f(X) \quad \text{for every } n \times n \text{ permutation matrix } P .
$$

Shuffle the input rows and the output rows shuffle identically: such a network
computes a function of the _set_ of tokens. Positional encoding breaks that
symmetry, either by adding a position-dependent vector $p_i$ to each token
embedding or by making the attention logit between positions $i$ and $j$ depend
on $i - j$.

## Why it matters

"The dog bit the man" and "the man bit the dog" are the same multiset of
tokens. Without a positional signal an unmasked transformer produces the same
representations for both, up to the permutation, and therefore cannot prefer
either reading. The bug is not subtle; it is total.

A recurrent network never has this
problem: order is built into its sequence of state updates. Nor does a
convolution, whose kernel layout encodes relative offset — the source of its
[Translation Equivariance](./translation-equivariance.md). The transformer gave
up both so every position could be computed in parallel, and positional encoding
is the bill for that trade.

It matters a second time for a reason the 2017 paper could not have anticipated:
the scheme chosen largely decides how a model behaves beyond its training
length, and so how much context it can actually use.

## Intuition

Picture the position written on a bank of clocks: each pair of encoding
dimensions is one hand turning at its own rate, with wavelengths from about
$2\pi$ tokens up to $2\pi \times 10^4$. Fast hands separate neighbours; slow
hands barely move across the whole context and separate distant regions. A fixed
offset of $k$ turns every hand by a fixed angle wherever you started, so "five
tokens later" is one linear map that works at every position.

The analogy breaks in two places. The encoding is _added_ to the token embedding
rather than concatenated, so position and content share one vector space with no
partition between them; that works because in several hundred dimensions two
arbitrary subspaces interfere little — an observation about trained models, not a
theorem. And "a linear map from position to position exists" does not mean
attention learns to use it.

## Concrete example

The sinusoidal encoding at $d_{\text{model}} = 4$, so there are two
frequencies, with wavelength factors $1$ and $10^{4 \cdot 2/4} = 100$:

```python
import numpy as np

def sinusoidal(n_pos, d_model):
    pos = np.arange(n_pos)[:, None]
    i = np.arange(d_model // 2)[None, :]
    angle = pos / (10000 ** (2 * i / d_model))
    pe = np.zeros((n_pos, d_model))
    pe[:, 0::2] = np.sin(angle)
    pe[:, 1::2] = np.cos(angle)
    return pe

print(np.round(sinusoidal(4, 4), 4))
# [[ 0.      1.      0.      1.    ]
#  [ 0.8415  0.5403  0.01    1.    ]
#  [ 0.9093 -0.4161  0.02    0.9998]
#  [ 0.1411 -0.99    0.03    0.9996]]
```

Columns 0–1 swing through a full cycle every $2\pi \approx 6.3$ positions;
columns 2–3 have barely moved after four. Because
$\sin a \sin b + \cos a \cos b = \cos(a-b)$, the dot product of two of these
vectors depends only on the gap $k$, not on where the pair sits:
$\text{PE}(pos) \cdot \text{PE}(pos+k) = \cos k + \cos(k/100)$. That gives
$1.540$ at $k=1$, $0.584$ at $k=2$, $0.010$ at $k=3$ — and $1.958$ at
$k=6$, _larger_ than at $k=1$, because the fast hand has come back round. With
256 frequencies instead of two the oscillations largely cancel and the
similarity falls off with distance, but it is still not monotone.

## Formal treatment

**Equivariance.** For
$\mathrm{Attn}(X) = \mathrm{softmax}\!\big(XW_Q(XW_K)^\top/\sqrt{d_k}\big)XW_V$
and a permutation matrix $P$, the logits become
$P\,XW_Q(XW_K)^\top P^\top$; the row-wise softmax commutes with that conjugation
and $P^\top P = I$ collapses the middle, giving
$\mathrm{Attn}(PX) = P\,\mathrm{Attn}(X)$. Feedforward and normalisation layers
act row-wise, so they commute with $P$ outright and the stack inherits the
property.

**The causal exception.** A decoder's mask $M_{ij} = -\infty$ for $j > i$ is
not permutation-equivariant, so a masked stack is _not_ a set function: how many
tokens each position can see is itself a positional signal. "A transformer cannot
see order without positional encoding" is exactly true for bidirectional encoders
and false as stated for causal decoders.

**Sinusoidal encoding.** For $i = 0, \dots, d_{\text{model}}/2 - 1$,

$$
\text{PE}_{(pos,\,2i)} = \sin\!\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right),
\qquad
\text{PE}_{(pos,\,2i+1)} = \cos\!\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right),
$$

added to the token embedding. Writing $\theta_i = 10000^{-2i/d_{\text{model}}}$,
the $i$-th pair at $pos+k$ is the $2 \times 2$ rotation $R(k\theta_i)$ applied
to the pair at $pos$, so $\text{PE}(pos+k) = M_k\,\text{PE}(pos)$ for a
block-diagonal $M_k$ that does not depend on $pos$. That is the paper's stated
reason for choosing sinusoids.

**Rotary encoding (RoPE)** applies the same rotations to the queries and keys
instead of adding anything to the input. With $R_{\Theta,m}$ block-diagonal in
blocks $R(m\theta_i)$,

$$
(R_{\Theta,m}W_Q x_m)^\top (R_{\Theta,n}W_K x_n)
= (W_Q x_m)^\top R_{\Theta,\,n-m} (W_K x_n),
$$

exactly, because each block is orthogonal and
$R(\alpha)^\top R(\beta) = R(\beta-\alpha)$. The attention logit therefore
depends on the offset alone, with no $n \times n$ bias matrix and no change to
vector norms.

## Assumptions and requirements

Additive absolute encodings assume content and position coexist in one vector
without destructive interference. Nothing guarantees that; it is a property of
trained models in high dimension.

Learned absolute embeddings require a maximum length fixed before training —
BERT allocates 512 rows — and position 513 simply has no parameters. Sinusoidal
encodings are _defined_ at every position, which is why they were hoped to
extrapolate; but being defined beyond the training range and working there are
different claims, and the second has not held up in measurement.

Purely relative schemes assume the task is translation-invariant: only offsets
matter, never absolute index. When "first token of the document" carries meaning,
a relative encoder must recover it elsewhere — in a causal decoder, from the
mask.

RoPE assumes queries and keys are split into two-dimensional pairs with the
_same_ rotation applied to both. Rotating only queries, or rotating the values
too, destroys the offset-only property above.

## Uses and applicability

Every bidirectional transformer needs one of these, and nearly every decoder
uses one in practice; the question is which. Large language
models have converged on rotary encodings — LLaMA removes absolute position
embeddings and applies RoPE at each layer instead — because the offset dependence
is exact, the cost is one elementwise rotation, and it composes with fused
attention kernels.

In vision the input is a grid rather than a line. ViT flattens patches and adds
_learned one-dimensional_ position embeddings; its ablations report that
two-dimensional-aware variants bring no significant gain over the 1-D version
while removing the embeddings entirely costs a great deal, so the model
apparently learns the grid from a raster index. Fine-tuning at higher resolution
interpolates that table to the new patch layout.

Do _not_ reach for positional encoding on set-structured input — molecules,
point clouds, unordered records — where permutation equivariance is the symmetry
you want to keep. Adding position there teaches an order that does not exist.

## Limitations and common mistakes

The most-repeated error is citing sinusoidal extrapolation as a result. The
original paper offers it as a hypothesis, in as many words; subsequent
measurement found that vanilla absolute encodings degrade sharply past the
trained length. It is a conjecture that did not pan out, quoted as a property.

The second is believing an additive absolute encoding makes attention relative.
Expand the logit for $x_i + p_i$ and $x_j + p_j$ and four terms appear:
content–content, content–position twice, and position–position. Only the last
can depend on $j - i$, and only when the query–key product is the identity. Real
attention mixes all four.

Third, RoPE's decay argument is not a guarantee. Its authors argue for long-range
decay using a summation bound under assumptions about the magnitudes involved —
a claim about a bound, not about trained networks, which still fail to use their
full nominal context reliably.

Fourth, implementation slips hidden by short-sequence loss curves: dropping the
$\sqrt{d_{\text{model}}}$ scaling of token embeddings before the encoding is
added, or restarting the position index mid-sequence after padding.

## Variants and alternatives

**Fixed sinusoidal** and **learned absolute** were both tried in the original
work, which reported nearly identical results; BERT and ViT took the learned
route. **Relative position representations** add a learned vector or scalar
keyed by clipped offset inside the attention computation, buying translation
invariance at the cost of an extra logit term and a harder time with fused
kernels. **T5-style bucketed biases** reduce that to one learned scalar per
offset bucket per head. **ALiBi** replaces learning with a fixed linear penalty
proportional to distance: cheapest, with measured extrapolation at the price of a
hard recency prior. **RoPE** is the current default in open language models.
**No positional encoding at all** is a live option for causal decoders,
exploiting the mask. To extend a trained model, **position interpolation** and
**base rescaling** adjust the frequencies rather than the architecture.

## History and attribution

The sinusoidal form is introduced in the 2017 Transformer paper, which gives
both it and the learned table, notes that the two performed almost identically,
and chooses sinusoids on the hypothesis that they might let the model
extrapolate past the training length. The device itself is older: for learned
position embeddings the paper cites the convolutional sequence-to-sequence work
of Gehring and co-authors, published months earlier, which already added them to
an order-blind architecture for the same reason.

The rest is a sequence of named schemes: relative position representations by
Shaw and co-authors in 2018, the bucketed biases of T5, rotary embeddings by Su
and co-authors in 2021, ALiBi by Press and co-authors in 2022. That attribution
comes from those papers' own accounts; the registry holds none of them, so they
are recorded as unresolved references rather than cited.

## Sources

**Attention Is All You Need** gives the sinusoidal formula, the reason the
mechanism is needed, and the learned-versus-fixed comparison. **BERT** documents
the learned embedding table and its fixed maximum length. **An Image is Worth
16x16 Words** supplies the vision case and the 1-D against 2-D ablation.
**LLaMA** records the shift to rotary embeddings at every layer.

## Prerequisites and next connections

Read the attention page first: everything above is a statement about what the
attention operation does and does not distinguish. A little
[Fourier Analysis](./fourier-analysis.md) helps too — the sinusoidal encoding is
a multi-scale frequency representation of an integer, and the identity making its
inner product a function of offset is the angle subtraction formula.

From here, the transformer page shows where the encoding enters the residual
stream alongside [Layer Normalization](./layer-normalization.md), and the vision
transformer page applies the same device to a grid. For contrast, a
[Convolutional Layer](./convolutional-layer.md) gets relative position free and
pays with a bounded receptive field.
