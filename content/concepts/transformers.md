---
concept_id: concept.deep_learning.transformers
title: Transformers
slug: /concepts/transformers
aliases:
  - Transformer architecture
kind: concept
tier: 1
review_state: generated-draft
summary: A sequence architecture that replaces recurrence with stacked blocks of multi-head self-attention and a position-wise feedforward network, so every position is computed in parallel and any two positions interact in a single step.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.attention
    note: A transformer block is defined by its multi-head self-attention sublayer, so the page is unreadable without knowing what an attention operation computes.
  - type: requires
    target: concept.deep_learning.multilayer_perceptrons
    note: The second sublayer of every block is a two-layer perceptron applied independently at each position, and it holds most of the block's parameters.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: Both model sequences, but a recurrent network carries a state forward step by step while a transformer mixes all positions at once, which trades linear-time inference for parallel training.
  - type: prerequisite_of
    target: concept.deep_learning.vision_transformer
    note: A vision transformer is this architecture with image patches as tokens, so the block structure has to be understood before the vision variant makes sense.
sources:
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.brown2020.gpt3
    title: Language Models are Few-Shot Learners
    url: https://arxiv.org/abs/2005.14165
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.touvron2023.llama
    title: 'LLaMA: Open and Efficient Foundation Language Models'
    url: https://arxiv.org/abs/2302.13971
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Analysis of gradient magnitudes under pre-normalization versus post-normalization
    reason: The registry holds papers that state which normalization placement they used, but none that analyses why post-norm blocks need learning-rate warmup or measures gradient scale at initialization, so the stability claims here rest on reported practice rather than on a cited analysis.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

A **transformer** is a deep network built by stacking identical blocks over a
sequence of vectors, where each block applies two sublayers in turn: multi-head
self-attention, which lets every position read from every other, and a
position-wise feedforward network, which transforms each position on its own.
Each sublayer is wrapped in a residual connection and a layer normalization. The
block contains no recurrence and no convolution, so the only route by which
information crosses positions is attention.

## Why it matters

A recurrent network computes position $t$ only after position $t-1$, making a
training step over a length-$n$ sequence a chain of $n$ dependent operations. The
transformer removes that chain: a block's computation is a matrix multiply over
the whole sequence, so a training step is a handful of large GEMMs that saturate
a GPU. That is the practical reason the architecture took over — not that
attention is uniquely expressive, but that it turns sequence modelling into dense
linear algebra.

The second consequence is path length. Evidence at position 1 reaches position
1000 through 999 state updates in a recurrent network, and through one attention
step in a transformer, at every layer. Long-range dependence stops being a
gradient-propagation problem and becomes a resolution problem in a softmax.

## Intuition

Picture each token carrying a vector down a **residual stream**: a running sum
every sublayer reads from and adds to. Attention is the communication step —
tokens look at each other and write what they found back into their own stream.
The feedforward sublayer is the private-thinking step — each token processes what
it now holds, ignoring its neighbours. Stack the pair a few dozen times and you
get alternating rounds of gathering and refining.

The analogy to a meeting breaks in two places. The "reading" is a convex
combination of value vectors, not a selection: when attention spreads over many
positions the result is an average that may resemble none of them. And nothing
persists across the sequence dimension between blocks — there is no carried
state, and each layer re-derives what it needs.

## Concrete example

The base model of Vaswani et al. (2017) uses $N = 6$ blocks per stack,
$d_{\text{model}} = 512$, $h = 8$ heads, $d_k = d_v = 64$, and
$d_{\text{ff}} = 2048$. One block, written pre-norm:

```python
import torch
from torch import nn


class Block(nn.Module):
    def __init__(self, d_model=512, n_heads=8, d_ff=2048):
        super().__init__()
        self.norm1 = nn.LayerNorm(d_model)
        self.attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)
        self.norm2 = nn.LayerNorm(d_model)
        self.mlp = nn.Sequential(
            nn.Linear(d_model, d_ff), nn.ReLU(), nn.Linear(d_ff, d_model)
        )

    def forward(self, x, causal=True):
        mask = None
        if causal:
            n = x.shape[1]
            mask = torch.triu(
                torch.full((n, n), float("-inf"), device=x.device), diagonal=1
            )
        h = self.norm1(x)
        x = x + self.attn(h, h, h, attn_mask=mask, need_weights=False)[0]
        return x + self.mlp(self.norm2(x))


block = Block()
print(sum(p.numel() for p in block.parameters()))  # 3152384
```

Count where those parameters live. Attention holds $3 \times 512 \times 512$ for
the packed query, key and value projections plus $512 \times 512$ for the output
projection, which with biases is $1{,}050{,}624$. The feedforward sublayer holds
$512 \times 2048 + 2048 \times 512$ plus biases, which is $2{,}099{,}712$. The two
layer normalizations contribute $2{,}048$. Two thirds of the block is the
feedforward sublayer.

The causal mask is the other thing worth seeing concretely. For $n = 4$ it is

$$
M = \begin{bmatrix}
0 & -\infty & -\infty & -\infty \\
0 & 0 & -\infty & -\infty \\
0 & 0 & 0 & -\infty \\
0 & 0 & 0 & 0
\end{bmatrix},
$$

added to the scores before the softmax, so row $i$ puts exactly zero weight on
any position after $i$.

## Formal treatment

Let $X \in \mathbb{R}^{n \times d}$ hold $n$ token representations of width
$d = d_{\text{model}}$ as rows. Head $i$ computes

$$
\operatorname{head}_i(X) = \operatorname{softmax}\!\left(
\frac{X W_i^Q (X W_i^K)^{\top}}{\sqrt{d_k}} + M \right) X W_i^V ,
$$

with $W_i^Q, W_i^K \in \mathbb{R}^{d \times d_k}$,
$W_i^V \in \mathbb{R}^{d \times d_v}$, the softmax taken over each row, and
$M \in \{0, -\infty\}^{n \times n}$ the mask. Multi-head attention concatenates
the heads and projects:
$\operatorname{MHA}(X) = [\operatorname{head}_1, \dots, \operatorname{head}_h] W^O$
with $W^O \in \mathbb{R}^{h d_v \times d}$. The position-wise feedforward network
applies the same map to every row,

$$
\operatorname{FFN}(x) = W_2\, \phi(W_1 x + b_1) + b_2 ,
\qquad W_1 \in \mathbb{R}^{d_{\text{ff}} \times d},
$$

with $\phi$ a pointwise nonlinearity and, by convention,
$d_{\text{ff}} = 4d$.

The two block layouts differ in where the normalization sits. Post-norm, as
published, is $x \mapsto \operatorname{LN}(x + \operatorname{sub}(x))$; pre-norm
is $x \mapsto x + \operatorname{sub}(\operatorname{LN}(x))$. Only the pre-norm
form leaves an unnormalized identity path from the input to the output of the
stack.

Two facts about attention are worth stating exactly. It is **permutation
equivariant**: for any permutation matrix $P$,
$\operatorname{MHA}(PX) = P \operatorname{MHA}(X)$, so without position
information a transformer is a function on sets. And its cost is quadratic: the
scores take $\Theta(n^2 d)$ time and $\Theta(n^2)$ memory per head, against
$\Theta(n d^2)$ for the projections and the feedforward network. Counting
multiply-accumulates with $d_{\text{ff}} = 4d$, the quadratic term overtakes the
linear ones near $n \approx 6d$ — a few thousand tokens at $d = 512$. Below
that, attention is not the expensive part.

## Assumptions and requirements

Position must be supplied from outside. Permutation equivariance is a theorem,
not a tendency: without positional information added to the inputs or built into
the attention scores, "dog bites man" and "man bites dog" produce the same
multiset of outputs.

It assumes depth is trainable, which is what the residual connections and the
normalizations are for. Remove the residual paths and a 6-block stack, let alone
a 96-block one, does not train; post-norm stacks are in practice trained with
learning-rate warmup.

It assumes the sequence fits. Everything above is stated for a fixed context of
$n$ positions, and nothing in the block defines behaviour beyond the length the
positional scheme and the training distribution covered.

Finally, softmax attention carries no locality or recency prior. Convolution
assumes nearby inputs are related and recurrence assumes recent inputs matter
more; a transformer assumes neither and must learn any such structure from data.
That is why the architecture is data-hungry — an empirical pattern reported
across language and vision, not a proved bound.

## Uses and applicability

Three configurations cover almost all use.

**Encoder-only** stacks set $M = 0$, so every position sees the whole sequence in
both directions. This is the BERT configuration, trained by masked-token
prediction and used for classification, tagging and retrieval. It cannot generate
autoregressively, because every representation already depends on the future.

**Decoder-only** stacks apply the causal mask and predict the next token. This is
the GPT configuration and what most large language models are. Because position
$i$ never attends past $i$, one forward pass supplies a training signal at every
position at once, and at inference the keys and values of earlier positions can
be cached.

**Encoder-decoder** stacks — the original design, built for machine translation —
run an unmasked encoder over the source and a causal decoder over the target,
with an extra cross-attention sublayer in each decoder block whose queries come
from the decoder and whose keys and values come from the encoder output. Reach
for it when source and target are genuinely different objects.

Beyond text, anything serialisable into a sequence of vectors fits: image
patches, audio frames, amino acids. Reach for something else when sequences are
long and latency-bound, or when data is scarce and the structure of the problem
is already known.

## Limitations and common mistakes

The title of the original paper is the most misleading thing about it. Attention
is not all you need: two thirds of a block's parameters are in the feedforward
sublayer, and removing it does not leave a working model.

Quadratic cost is routinely assumed to bind at every scale. At short contexts it
does not — the linear projections dominate — and at long contexts the memory of
the score matrix usually bites before the arithmetic does.

Pre-norm and post-norm are treated as interchangeable. They are not: pre-norm
tolerates depth and large learning rates far better, which is why large models
adopted it, while tuned post-norm has been reported to reach slightly better
quality when it trains at all. Which is preferable at a given scale is not
settled.

Two vocabulary traps recur. "Decoder-only" does not mean a decoder in the
sequence-to-sequence sense: there is no cross-attention and no encoder, and the
name is historical. And a masked language model is masked in its _inputs_, while
a causal model is masked in its _attention_ — unrelated mechanisms sharing a
word.

Finally, attention weights are not explanations. A head can attend strongly to a
position whose value contributes little, and the gathered vector passes through
$W^O$ and every later block before anything is predicted.

## Variants and alternatives

Most modern stacks keep the block skeleton and swap components. Normalization
moves to pre-norm and often to RMS normalization; the feedforward nonlinearity
becomes GELU or a gated variant such as SwiGLU; absolute positional encodings
give way to rotary embeddings, as in LLaMA, or to relative-position biases.
Multi-query and grouped-query attention share keys and values across heads to
shrink the inference cache at a small quality cost. Mixture-of-experts replaces
the dense feedforward sublayer with routed experts, buying capacity at fixed
per-token cost and paying in routing complexity and load imbalance.
FlashAttention changes the memory traffic and none of the mathematics.

The genuine alternatives give up all-pairs attention. State-space models such as
Mamba, and linear-attention recurrences such as RWKV, run in linear time with
constant-memory decoding, at the cost of exact recall of arbitrary earlier
tokens. Recurrent and convolutional sequence models remain competitive where data
is limited or locality is real.

## History and attribution

The transformer was introduced by Vaswani et al. at Google in 2017, in a paper on
machine translation. Attention was not new — it was already standard in recurrent
encoder-decoder translation systems — and the contribution was the removal of
recurrence: attention plus position-wise feedforward layers, with residual
connections and normalization, sufficed, and trained far faster because it
parallelised.

The split into encoder-only and decoder-only families followed quickly. BERT
(Devlin et al., 2019) took the encoder stack and pretrained it bidirectionally.
The GPT line took the decoder stack, and GPT-3 (Brown et al., 2020) showed that
scaling it produced in-context few-shot behaviour without gradient updates. The
architecture then spread beyond text largely unchanged.

## Sources

**Attention Is All You Need** is the defining reference: the block structure, the
scaled dot-product and multi-head definitions, the base hyperparameters used in
the example here, and the original post-norm layout. **BERT** covers the
encoder-only configuration and bidirectional pretraining. **Language Models are
Few-Shot Learners** covers the decoder-only configuration at scale, and states
the pre-normalization inherited from GPT-2. **LLaMA** documents a modern
component set in one place: pre-normalization with RMS normalization adopted for
training stability, SwiGLU, rotary embeddings.

## Prerequisites and next connections

Read the attention page first; everything here is built on it. The
[Residual Connection](./residual-connection.md) and
[Layer Normalization](./layer-normalization.md) pages explain the two wrappers
that make a deep stack trainable, and the positional encoding page explains how
order is injected into an architecture otherwise blind to it. Training uses
[Backpropagation](./backpropagation.md) with [Adam](./adam.md) and a warmup
schedule of the kind described in
[Learning Rate Schedules](./learning-rate-schedules.md).

From here, the vision transformer page shows the same stack applied to image
patches, the cleanest comparison against [ResNet](./resnet.md)-style
convolutional design, while [Quantization](./quantization.md) and
[Distillation](./distillation.md) are what make a large transformer affordable
to serve.
