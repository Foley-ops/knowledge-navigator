---
concept_id: concept.deep_learning.convnext
title: ConvNeXt
slug: /concepts/convnext
kind: implementation
tier: 1
review_state: generated-draft
summary: A convolutional network rebuilt out of a ResNet-50 by adopting transformer-era design and training choices one change at a time, which matches hierarchical vision transformers at equal compute and so shows how much of their advantage was never attention.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: variant_of
    target: concept.deep_learning.resnet
    note: ConvNeXt is literally a ResNet-50 with its stem, stage ratios, block interior, normalisation and activations replaced in sequence; the residual stage layout survives the whole procedure.
  - type: specializes
    target: concept.deep_learning.convolutional_networks
    note: It is one particular convolutional architecture family, and its interest lies in which of the general convnet design choices it abandons.
  - type: contrasts_with
    target: concept.deep_learning.vision_transformer
    note: The architecture exists as a controlled comparison against vision transformers at matched FLOPs, so the two are best read against each other rather than separately.
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: Every step in the modernisation is a change to kernel size, grouping, width or stride, none of which can be read without knowing what a convolution computes.
sources:
  - source_id: source.liu2022.convnext
    title: A ConvNet for the 2020s
    url: https://arxiv.org/abs/2201.03545
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
  - source_id: source.dosovitskiy2021.vision_transformer
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale'
    url: https://arxiv.org/abs/2010.11929
    source_kind: preprint
    supports:
      - why-it-matters
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.he2016.deep_residual_learning
    title: Deep Residual Learning for Image Recognition
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.ba2016.layer_normalization
    title: Layer Normalization
    url: https://arxiv.org/abs/1607.06450
    source_kind: preprint
    supports:
      - formal-treatment
    checked_on: 2026-09-17
unresolved_references:
  - label: AdamW and decoupled weight decay
    reason: The registry has SGDR and the Adam line but not Loshchilov and Hutter's decoupled-weight-decay paper, so this page names AdamW as part of the recipe without evidencing why decoupling the decay from the adaptive update matters.
    sections:
      - assumptions-and-requirements
  - label: Concurrent ResNet re-training studies and ConvNeXt V2
    reason: The 2021 papers that re-trained ResNets under modern recipes, and the 2023 ConvNeXt V2 follow-up with global response normalisation and masked autoencoding, are not in the registry, so both are mentioned without a citation to check.
    sections:
      - history-and-attribution
      - variants-and-alternatives
---

## Definition

**ConvNeXt** is a family of purely convolutional image models obtained by
applying, to a [ResNet](./resnet.md)-50, the design and training choices that
had accumulated in vision transformers, one modification at a time with the
accuracy measured after each. The resulting block is a $7 \times 7$ depthwise
convolution, a [Layer Normalization](./layer-normalization.md), a pointwise
expansion to four times the width, a single GELU, and a pointwise projection
back — wrapped in a [Residual Connection](./residual-connection.md). There is no
attention anywhere in it.

## Why it matters

By 2021 vision transformers had overtaken convolutional networks on ImageNet and
on the downstream detection and segmentation benchmarks, and the natural reading
was that self-attention's global receptive field and data-dependent weighting
were doing the work. But the transformer papers changed many things at once:
they changed the operator, and also the optimiser, the epoch budget, the
augmentation stack, the normalisation, the activation, the stage widths and the
stem. ConvNeXt separates those. It holds the operator fixed as convolution,
imports everything else, and reports what each import is worth. The answer
matters because it tells you where to spend effort: on better operators, or on
the training protocol you are already free to change.

## Intuition

Think of the gap between a 2016 ResNet and a 2021 transformer as a bill with
many line items, only one of which is labelled "attention". The modernisation
roadmap pays the bill line by line and writes down the running total. By the
time the recipe, the stage ratios, the patchify stem, the depthwise kernel, the
inverted bottleneck, the larger kernel and the thinned-out normalisation and
activation layers have all been paid, the total is settled and the attention
line was never reached.

The analogy breaks in one place worth naming: the items are not independent, and
they are not paid in an arbitrary order. A depthwise convolution is a bad idea at
ResNet-50's width and a good one once the network is widened; the large kernel
only helps after the depthwise layer has been moved ahead of the expansion.
Reordering the steps would give different intermediate numbers.

## Concrete example

The roadmap, as reported in the paper, runs on ImageNet-1K top-1 accuracy at
matched compute with Swin-T:

| step                                                                                                                  | top-1 |
| --------------------------------------------------------------------------------------------------------------------- | ----- |
| ResNet-50, original 90-epoch recipe                                                                                   | 76.1  |
| modern recipe only (300 epochs, AdamW, Mixup, CutMix, RandAugment, random erasing, stochastic depth, label smoothing) | 78.8  |
| stage ratio $(3,4,6,3) \to (3,3,9,3)$                                                                                 | 79.4  |
| patchify stem: $4\times4$ stride-4 convolution replaces $7\times7$ stride-2 plus max-pool                             | 79.5  |
| depthwise convolution, width $64 \to 96$                                                                              | 80.5  |
| inverted bottleneck                                                                                                   | 80.6  |
| depthwise layer moved up, kernel $3\times3 \to 7\times7$                                                              | 80.6  |
| one GELU per block instead of a ReLU after every layer                                                                | 81.3  |
| one normalisation per block, and it is LayerNorm                                                                      | 81.5  |
| separate $2\times2$ stride-2 downsampling layers                                                                      | 82.0  |

Swin-T scores 81.3 at the same 4.5 GFLOPs. Note the shape of the table: the
single largest jump, $+2.7$, is the training recipe, before a line of
architecture is touched.

## Formal treatment

Write $x \in \mathbb{R}^{C \times H \times W}$ for a block's input. The ConvNeXt
block computes

$$
\begin{aligned}
u &= \mathrm{DWConv}_{7\times 7}(x), \\
v &= W_2\,\phi\!\left(W_1\,\mathrm{LN}(u)\right), \\
y &= x + \mathrm{DropPath}\!\left(\gamma \odot v\right),
\end{aligned}
$$

where $\mathrm{DWConv}_{7\times7}$ applies one $7\times7$ kernel per channel with
no mixing across channels, $W_1 \in \mathbb{R}^{4C \times C}$ and
$W_2 \in \mathbb{R}^{C \times 4C}$ act independently at each spatial location,
$\phi$ is GELU, $\gamma \in \mathbb{R}^{C}$ is a per-channel layer-scale
parameter initialised at $10^{-6}$, and $\mathrm{DropPath}$ zeroes the whole
branch for a sampled subset of examples. Layer normalization, in Ba, Kiros and
Hinton's definition, takes its statistics over the units of a layer rather than
over the batch; ConvNeXt adopts the transformer's version of that, in which the
statistics are taken over the channel axis at each spatial position,

$$
\mathrm{LN}(u)_{c,i,j} = g_c \,\frac{u_{c,i,j} - \mu_{i,j}}{\sqrt{\sigma^2_{i,j} + \epsilon}} + b_c,
\qquad
\mu_{i,j} = \frac{1}{C}\sum_{c} u_{c,i,j},
$$

so no statistic is shared across examples or across positions. The axis choice
is the transformer convention rather than a result carried over from the
original paper: Ba, Kiros and Hinton pool over all the units of a layer, which
for a convolutional layer means over channels _and_ positions, and they report
that form underperforming batch normalization in convnets.

The cost accounting explains why a $7\times7$ kernel is affordable. The depthwise
layer holds $49C$ weights; the two pointwise layers hold $8C^2$. At $C=96$ that
is 4,704 against 73,728: the large kernel is about six per cent of the block.
Widening it to $11\times11$ adds little cost, and the paper reports that accuracy
saturates by $7\times7$ anyway.

In PyTorch, the block is short enough to read in full:

```python
import torch
from torch import nn

class ConvNeXtBlock(nn.Module):
    def __init__(self, dim, layer_scale_init=1e-6):
        super().__init__()
        self.dwconv = nn.Conv2d(dim, dim, kernel_size=7, padding=3, groups=dim)
        self.norm = nn.LayerNorm(dim, eps=1e-6)
        self.pwconv1 = nn.Linear(dim, 4 * dim)
        self.act = nn.GELU()
        self.pwconv2 = nn.Linear(4 * dim, dim)
        self.gamma = nn.Parameter(layer_scale_init * torch.ones(dim))

    def forward(self, x):              # x: (N, C, H, W)
        h = self.dwconv(x)
        h = h.permute(0, 2, 3, 1)      # (N, H, W, C), so LayerNorm is over channels
        h = self.pwconv2(self.act(self.pwconv1(self.norm(h))))
        h = (self.gamma * h).permute(0, 3, 1, 2)
        return x + h                   # stochastic depth wraps the branch in full models
```

The permutes are not incidental. Channel-last is the layout in which the
pointwise layers and the LayerNorm are cheapest, and it is one reason ConvNeXt's
measured throughput is better than its FLOP count alone suggests.

## Assumptions and requirements

The accuracy figures above assume the whole recipe: 300 epochs, AdamW, cosine
decay with warmup, and the full augmentation and regularisation stack. Train
ConvNeXt for 90 epochs with SGD and step decay and it will not reach 82.0 — the
architecture and the recipe are not separable claims, and the first row of the
table is the evidence.

The comparison assumes matched FLOPs against a specific competitor at a specific
scale. ConvNeXt-T is compared with Swin-T at 4.5 GFLOPs; the conclusion is a
statement about that regime, not about all scales or all budgets.

Layer scale and heavier stochastic depth are load-bearing for the deeper members
of the family. The extra normalisation layers — after the stem, before each
downsampling layer, and after the final global average pooling — are needed at
the ConvNeXt-T scale itself: the paper reports that adding separate
downsampling layers diverged in training until those layers were put in.

Finally, the whole procedure assumes the data scale of ImageNet-1K or 22K. The
ViT paper's central finding is that the ranking between convolutional inductive
bias and attention depends on how much pretraining data there is, so a result
established at these scales does not transfer automatically to much larger
corpora.

## Uses and applicability

ConvNeXt is a reasonable default backbone for image classification, object
detection and semantic segmentation at ImageNet-scale supervision, and the paper
reports it matching or beating Swin on COCO and ADE20K as well as on
classification. It is particularly attractive when input resolution is high or
variable: cost grows linearly in the number of pixels rather than quadratically
as dense self-attention does, and a fully convolutional model needs no
interpolation of position embeddings to change resolution.

Reach for a transformer instead when you need cross-modal fusion with text or
audio through a shared attention mechanism, when you want to exploit an existing
large-scale pretrained transformer checkpoint, or when the task genuinely calls
for data-dependent long-range routing rather than a fixed local kernel.

## Limitations and common mistakes

The most common misreading is the strong one: that ConvNeXt shows attention is
unnecessary, or that convolution has been proven superior. The paper does not
claim this and the evidence does not support it. It shows that a convnet can be
made competitive at these scales on these benchmarks, which undercuts the
inference from "transformers win" to "attention is why".

The mirror-image mistake is to dismiss the result as "just a better training
recipe". The recipe accounts for $+2.7$ of roughly $+5.9$; the architectural
changes account for the rest, and they are not cosmetic.

The methodological caveat that deserves more attention than it gets: the
roadmap is a greedy sequential path, not a factorial design. Each step is
evaluated only in the context of the steps already taken, so the individual
deltas are not clean attributions. The variance is reported — every accuracy in
the roadmap is a mean over three random seeds, quoted with its standard
deviation in the appendix — and that is what makes the point: the spreads run
from about $0.02$ to $0.18$ points, so the $+0.1$ and $+0.2$ steps sit inside
the seed-to-seed scatter. The aggregate conclusion is robust; the per-line
credit assignment is softer than the headline table's precision suggests.

Two practical traps. First, the LayerNorm is over channels at each spatial
position — the direct analogue of a language transformer's per-token
normalisation over the feature axis, which is why the block permutes to
channel-last; implementing it over the wrong axes, jointly over $C$, $H$ and $W$
say, silently trains a different model. Second,
FLOP-matched does not mean latency-matched — depthwise convolutions have low
arithmetic intensity and are often memory-bound, so wall-clock comparisons must
be measured, not inferred.

## Variants and alternatives

The family scales by width and depth: ConvNeXt-T, -S, -B, -L and -XL, from 4.5
to 60 GFLOPs, with ConvNeXt-XL pretrained on ImageNet-22K and fine-tuned at
$384^2$ reaching 87.8 top-1. The paper also builds an _isotropic_ ConvNeXt with
no downsampling stages, to compare against ViT directly with the hierarchy
removed.

The genuine alternatives are the vision transformer
line — plain ViT, which buys global mixing and scale-friendliness at the cost of
weak inductive bias and quadratic attention, and the hierarchical windowed
transformers such as Swin, which restore a pyramid and linear cost at the price
of considerable implementation complexity. Among convolutional designs, ResNet
and ResNeXt remain the baselines, and the efficient-mobile lineage
(MobileNet-style separable convolutions, EfficientNet-style compound scaling)
targets a different point on the accuracy-latency curve. ConvNeXt V2, a later
follow-up by an overlapping group, adds a global response normalisation layer
and pairs the architecture with masked-autoencoder pretraining.

## History and attribution

ConvNeXt was introduced by Zhuang Liu, Hanzi Mao, Chao-Yuan Wu, Christoph
Feichtenhofer, Trevor Darrell and Saining Xie in _A ConvNet for the 2020s_
(2022, Facebook AI Research and UC Berkeley). Its starting point is He, Zhang,
Ren and Sun's ResNet (2016); its provocation is Dosovitskiy et al.'s ViT (2021)
and the hierarchical transformers that followed it. The authors were not trying
to invent a new operator — several of the ingredients, including depthwise
convolutions, inverted bottlenecks and large kernels, had been published years
earlier — but to run the controlled experiment nobody had run.

The training-recipe finding was in the air: at least two 2021 papers independently
re-trained ResNets under modern recipes and reported large gains, so ConvNeXt's
first row confirms a result others had reached rather than discovering it. What
ConvNeXt added was the full trajectory from one architecture to the other.

## Sources

**A ConvNet for the 2020s** is the primary source for everything specific here:
the block, the roadmap table, the training recipe, the downstream results and
the authors' own statement of what they are and are not claiming. **An Image is
Worth 16x16 Words** is the architecture ConvNeXt is arguing with, and the place
to read the data-scale-dependence argument. **Deep Residual Learning** is the
starting point of the modernisation and the source of the stage structure that
survives it. **Layer Normalization** defines the normalisation that replaces
batch statistics in the block.

## Prerequisites and next connections

Read [Convolutional Layer](./convolutional-layer.md) first, then
[Residual Connection](./residual-connection.md) and [ResNet](./resnet.md) — the
page is a description of what happens to a ResNet, and will not mean much
otherwise. [Layer Normalization](./layer-normalization.md) and
[Batch Normalization](./batch-normalization.md) explain the substitution the
block makes, and why one travels better across batch sizes and resolutions
than the other.

Afterwards, [Receptive Field](./receptive-field.md) quantifies what the
$7\times7$ kernel actually buys over stacked $3\times3$s as in
[VGG](./vgg.md), [Pooling](./pooling.md) covers the max-pool that the patchify
stem discards, [Regularization](./regularization.md) covers the stochastic depth
and label smoothing the recipe depends on, and [Adam](./adam.md) covers the
optimiser family the recipe's AdamW belongs to. [PyTorch](./pytorch.md) is where
the block above runs.
