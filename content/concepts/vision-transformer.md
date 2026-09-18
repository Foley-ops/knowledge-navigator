---
concept_id: concept.deep_learning.vision_transformer
title: Vision Transformer
slug: /concepts/vision-transformer
aliases:
  - ViT
kind: implementation
tier: 1
review_state: generated-draft
summary: Vision Transformer applies an unmodified transformer encoder to a sequence of flattened image patches, and overtakes convolutional networks on image classification only after pretraining on data far beyond ImageNet scale.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.transformers
    note: The model is the transformer encoder block used without modification, so a reader who does not already know multi-head self-attention, the residual sublayers and the normalization placement cannot follow the architecture.
  - type: contrasts_with
    target: concept.deep_learning.convolutional_networks
    note: The two solve the same task with opposite commitments about prior knowledge — hard-wired locality and weight sharing on one side, unrestricted token-to-token mixing learned from data on the other.
  - type: challenged_by
    target: concept.deep_learning.convnext
    note: A convolutional network rebuilt with the same training recipe and scaling matches transformer-based accuracy, which weakens the inference that self-attention was the cause of the 2020-2021 gains.
  - type: useful_when
    target: concept.learning.transfer_learning
    note: Its headline results are transfer results, so the architecture is chosen when a very large pretraining corpus exists and the target task is reached by fine-tuning, not when a single mid-sized dataset is all there is.
sources:
  - source_id: source.dosovitskiy2021.vision_transformer
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale'
    url: https://arxiv.org/abs/2010.11929
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.liu2022.convnext
    title: A ConvNet for the 2020s
    url: https://arxiv.org/abs/2201.03545
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Post-2020 vision transformer follow-ups (data-efficient training recipes, hierarchical and windowed attention, masked-image pretraining)
    reason: The registry has the original vision transformer paper but no entry for the follow-up papers that changed its data requirement or replaced global attention with a hierarchy, so those are named here without a citation.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

A **Vision Transformer** is an image model built by cutting the image into a
grid of non-overlapping square patches, treating each patch as one token of a
sequence, and running that sequence through a standard transformer encoder. The
four pieces that make it work are: a single learned linear **patch embedding**
shared by all patches; a learned **class token** prepended to the sequence, which
belongs to no patch and whose final state is read out as the image
representation; learned **position embeddings** added to every token, without
which the model cannot tell where a patch came from; and an otherwise unmodified
stack of encoder blocks. No convolution appears anywhere, except as an
implementation trick for the patch embedding itself.

## Why it matters

Until 2020 every competitive image classifier was convolutional, and the reason
given was that convolution builds in the right priors for images: locality,
weight sharing across positions, and translation equivariance. The Vision
Transformer showed that those priors are not necessary for state-of-the-art
classification — provided enough pretraining data. The honest form of the result
is a crossover, not a victory: the same architecture that loses to a comparable
ResNet when pretrained on ImageNet wins when pretrained on hundreds of millions
of images.

The practical consequence is that one architecture now serves text, images and
audio: shared code, shared kernels, shared scaling intuitions, and models that
consume image and text tokens in a single sequence.

## Intuition

A sentence is a sequence of word tokens; a $224 \times 224$ image with patch
size $16$ is a sequence of $196$ patch tokens. Self-attention treats a sequence
as a set, so every patch can consult every other patch in the very first layer,
where a convolutional network must stack layers before two distant pixels can
interact at all.

The analogy to language breaks in three places worth holding onto. Word
boundaries carry meaning; patch boundaries are an arbitrary grid, so an object
straddling a border is simply split. There is no vocabulary and no embedding
table, because patch content is continuous — the embedding is a projection, not
a lookup. And a sentence's order is given by the data, whereas a scrambled image
is indistinguishable from the original to the encoder unless position
embeddings supply the grid.

## Concrete example

ViT-B/16 at $224 \times 224$ resolution: patch size $P = 16$ gives
$(224/16)^2 = 196$ patches, each flattened to $16 \cdot 16 \cdot 3 = 768$
numbers. The embedding dimension is also $D = 768$, so the patch projection is a
single $768 \times 768$ matrix. With the class token the sequence has length
$197$; the encoder has $12$ blocks, $12$ heads, and MLP width $3072$; the whole
model is about 86M parameters.

The patch embedding is usually written as a strided convolution, which computes
exactly the same linear map:

```python
import torch, torch.nn as nn

P, D, B = 16, 768, 2
x = torch.randn(B, 3, 224, 224)

proj = nn.Conv2d(3, D, kernel_size=P, stride=P)       # == linear map on flattened patches
tok = proj(x).flatten(2).transpose(1, 2)              # (B, 196, 768)

cls = nn.Parameter(torch.zeros(1, 1, D))
pos = nn.Parameter(torch.zeros(1, 1 + 196, D))
z0 = torch.cat([cls.expand(B, -1, -1), tok], dim=1) + pos   # (B, 197, 768)

block = nn.TransformerEncoderLayer(D, nhead=12, dim_feedforward=4 * D,
                                   activation="gelu", norm_first=True,
                                   batch_first=True)
print(tok.shape, z0.shape, block(z0).shape)
```

Kernel size equal to stride tiles the image without overlap, so this one
convolution is the patch cut and the projection at once.

## Formal treatment

Let $x \in \mathbb{R}^{H \times W \times C}$ with $P$ dividing $H$ and $W$, so
there are $N = HW/P^2$ patches and each flattens to $x_p^i \in \mathbb{R}^{P^2C}$.
With projection $E \in \mathbb{R}^{(P^2C) \times D}$, class token
$x_{\text{cls}} \in \mathbb{R}^{D}$ and position embeddings
$E_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}$,

$$
z_0 = [\, x_{\text{cls}};\; x_p^1 E;\; \dots;\; x_p^N E \,] + E_{\text{pos}},
$$

$$
z'_\ell = \mathrm{MSA}(\mathrm{LN}(z_{\ell-1})) + z_{\ell-1},
\qquad
z_\ell = \mathrm{MLP}(\mathrm{LN}(z'_\ell)) + z'_\ell,
\qquad \ell = 1, \dots, L,
$$

$$
y = \mathrm{LN}(z_L^0)\, W_{\text{head}},
$$

where $\mathrm{MSA}$ is multi-head self-attention, $\mathrm{LN}$ is layer
normalization, $\mathrm{MLP}$ is two linear layers with a GELU between them
(hidden width normally $4D$), and $z_L^0$ is the class-token row of the final
layer. Normalization sits _before_ each sublayer, unlike the post-normalization
ordering of the original transformer.

Two facts follow directly. First, with $E_{\text{pos}}$ removed the map is
equivariant to permutations of the patch sequence, so position embeddings are
load-bearing rather than decorative; the paper's ablation shows a drop of a few
points without them, while one-dimensional, two-dimensional and relative
embeddings perform within noise of each other. Second, each attention layer
costs $O(N^2 D + N D^2)$, so cost is quadratic in the patch count: halving $P$
quadruples $N$ and multiplies the attention term by sixteen.

## Assumptions and requirements

**Pretraining scale is the binding assumption.** Dosovitskiy et al. report the
crossover directly: pretrained on ImageNet-scale data the Vision Transformer
underperforms comparable ResNets and the larger variants do worse than the
smaller ones; pretrained on ImageNet-21k (about 14M images) the two families are
comparable; pretrained on the 303M-image JFT-300M they pull ahead, with ViT-H/14
reaching 88.55% ImageNet top-1. Their own summary is that at sufficient scale
training data substitutes for inductive bias. This is an empirical finding on
particular corpora and benchmarks — not a theorem, and not a guarantee that the
crossover point is fixed.

**A fixed grid.** Patch size and input resolution are baked into the projection
and the position embeddings; fine-tuning at a higher resolution keeps $P$,
increases $N$, and requires interpolating the pretrained position embeddings
onto the new grid.

**An optimization recipe that tolerates the missing priors.** The reported
models are trained with Adam, weight decay far heavier than is usual for
convolutional networks (0.1, against the 1e-4 a ResNet would normally get),
gradient clipping at global norm 1, and — for the runs trained from scratch on
ImageNet — strong regularization, dropout after every dense layer included;
without this the model overfits sooner than a ResNet of comparable cost.
Augmentation is not the lever here: the paper inherits the plain transfer
preprocessing of the day, a resize with a random crop and a horizontal flip.
Heavy augmentation as a substitute for pretraining scale is a later
contribution, not part of this recipe.

## Uses and applicability

Reach for it when a large pretrained checkpoint already exists and the target
task is reached by fine-tuning, when the same
model must also consume text or audio tokens, or when global interactions matter
from the first layer. A pretrained backbone with a linear head is a strong
default for classification transfer.

Do not reach for it when you have one mid-sized labelled dataset and no
pretraining, when resolution is high enough that quadratic attention dominates
the budget, or when the output is dense — segmentation and detection need
spatial detail the patch grid has already discarded, and the plain encoder
yields a single-resolution sequence rather than a pyramid.

## Limitations and common mistakes

The most common error is quoting "transformers beat convolutional networks on
vision" without the data condition attached. On the paper's own evidence the
ordering reverses at ImageNet-scale pretraining, and the reason is exactly the
absent locality and translation-equivariance priors.

The second is believing the model has no inductive bias. Cutting the image into
a grid is itself a strong prior: patch interiors are mixed by a single linear
map and the grid never moves. What the model lacks is weight sharing across
_shifted_ windows, not locality altogether.

The third is treating the class token as necessary. It is a convention borrowed
from language pretraining; the paper's own ablation finds that averaging the
final patch tokens performs comparably once the learning rate is retuned.

The fourth is changing input resolution without interpolating the position
embeddings, which silently misaligns every token with its learned position.

Finally, do not read the architecture as the cause of the accuracy gains of
2020-2021. Liu et al. rebuilt a purely convolutional network with the
transformer-era training recipe and scaling, and matched transformer accuracy on
the same benchmarks — evidence that recipe and scale carried much of the credit
usually assigned to self-attention. This is not settled, and it is a comparison
on image benchmarks rather than a general claim.

## Variants and alternatives

Within the original paper the axes are model size (Base, Large, Huge) and patch
size, written as ViT-L/16 or ViT-B/32; smaller patches cost more and generally
score better. The **hybrid** variant feeds patches of a convolutional feature map
into the same encoder and is stronger at small compute budgets, with the
advantage vanishing as scale grows.

Beyond the paper, later work attacked the data requirement with heavier
augmentation and distillation recipes, replaced global attention with windowed
and hierarchical attention to serve dense prediction, and pretrained by masked
image reconstruction instead of labels; those lines are named here without
citation, as `unresolved_references` records. The genuinely different competitor
is the modernized convolutional network, which keeps locality and weight sharing
while adopting the transformer's training recipe, buying linear cost in
resolution and a feature pyramid at the price of the unified token interface.

## History and attribution

Dosovitskiy and colleagues at Google Research posted the paper in October 2020
and presented it at ICLR 2021. They were asking whether the scaling behaviour
transformers had shown in language would carry over to vision without
convolutional scaffolding; earlier attempts had attached self-attention to
convolutional networks or applied it to pixels, and the paper credits a closely
related earlier model that ran full self-attention over $2 \times 2$ patches as
its nearest predecessor. The contribution was that the blunt version works at
scale: large patches, a plain encoder, a very large corpus.

Two ingredients are inherited rather than invented: the encoder block is that of
Vaswani et al. (2017), essentially unchanged, and the class token comes from
BERT, where the `[CLS]` position serves the same read-out purpose for sentences.

## Sources

Dosovitskiy et al. is the source for everything architectural here and for the
data-scale finding, including the model configurations, the position embedding
ablation and the hybrid variant. Vaswani et al. defines the encoder block the
model reuses. Devlin et al. is where the class token convention comes from. Liu
et al. is the counterweight, and the evidence that a modernized convolutional
network matches transformer accuracy under the same recipe.

## Prerequisites and next connections

Understand the transformer encoder block first — self-attention, the residual
sublayers, and [Layer Normalization](./layer-normalization.md) with the
pre-normalization placement used here. The point of contrast is the
[Convolutional Layer](./convolutional-layer.md), and specifically
[Translation Equivariance](./translation-equivariance.md), which is the property
this architecture drops; [ResNet](./resnet.md) is the baseline it is measured
against throughout.

From here, [Transfer Learning](./transfer-learning.md) explains the
pretrain-then-fine-tune regime the results depend on, and
[Self-Supervised Learning](./self-supervised-learning.md) covers the label-free
pretraining that later removed much of the labelled-data requirement.
[Regularization](./regularization.md) is worth revisiting, since the recipe
matters more here than for a convolutional baseline of the same size.
