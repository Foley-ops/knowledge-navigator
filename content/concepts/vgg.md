---
concept_id: concept.deep_learning.vgg
title: VGG
slug: /concepts/vgg
aliases:
  - VGGNet
  - VGG network
kind: implementation
tier: 1
review_state: generated-draft
summary: A family of deep convolutional networks built from uniform stacks of 3x3 convolutions, showing that depth with small kernels improves accuracy at a large cost in parameters and computation.
categories:
  - Artificial Intelligence/Computer Vision
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Computer Vision
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: VGG is built almost entirely from stacked 3x3 convolutional layers.
  - type: requires
    target: concept.deep_learning.pooling
    note: Five max-pooling stages separate VGG's convolutional blocks and set its resolution schedule.
sources:
  - source_id: source.simonyan2015.very_deep_convolutional_networks
    title: Very Deep Convolutional Networks for Large-Scale Image Recognition
    url: https://arxiv.org/abs/1409.1556
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.russakovsky2015.imagenet_challenge
    title: ImageNet Large Scale Visual Recognition Challenge
    url: https://arxiv.org/abs/1409.0575
    source_kind: dataset-or-benchmark
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.ioffe2015.batch_normalization
    title: 'Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift'
    url: https://arxiv.org/abs/1502.03167
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-16
---

## Definition

**VGG** is the family of convolutional networks introduced by Simonyan and
Zisserman (2014) from the Visual Geometry Group at Oxford. Its defining choice is
uniformity: almost every
[Convolutional Layer](./convolutional-layer.md) is $3 \times 3$ with stride $1$
and padding $1$, every downsampling step is a $2 \times 2$ max
[Pooling](./pooling.md) with stride $2$, and depth is increased by adding more
convolutions per block rather than by changing their shape. The best-known
configurations are **VGG-16** and **VGG-19**, named for their number of weight
layers.

## Why it matters

VGG isolated depth as a variable. Earlier architectures differed in many ways at
once — kernel sizes, strides, normalisation, connection patterns — so it was hard
to attribute an improvement to any one of them. By fixing everything except the
number of layers, VGG showed that accuracy on ImageNet improved steadily as depth
went from 11 to 19 weight layers. It placed first in localisation and second in
classification in the ILSVRC 2014 challenge, and its features transferred so well
to other tasks that VGG-16 became a standard pretrained backbone for years.

It also marks the limit of the plain approach: beyond about 19 layers the
authors report no further gain, which is exactly the observation that motivates
a [Residual Connection](./residual-connection.md).

## Intuition

Three stacked $3 \times 3$ convolutions see the same $7 \times 7$ input window as
one $7 \times 7$ convolution, but they interleave two extra non-linearities and
use fewer weights. More decision boundaries per unit of
[Receptive Field](./receptive-field.md), at lower parameter cost — that is the
whole design argument, applied uniformly.

The counterweight is that "fewer weights per unit of receptive field" says
nothing about _activation_ cost, and VGG's early high-resolution blocks are
extremely expensive to compute.

## Concrete example

Compare covering a $7 \times 7$ field on $C$ channels in and $C$ out:

| Design                    | Weights                   | Non-linearities |
| ------------------------- | ------------------------- | --------------- |
| One $7 \times 7$ layer    | $49 C^2$                  | 1               |
| Three $3 \times 3$ layers | $3 \times 9 C^2 = 27 C^2$ | 3               |

That is a $45\%$ reduction in weights with three times the non-linearity. VGG-16
applies this everywhere:

```text
224×224×3
 ├ block1: [3×3, 64]  ×2  → pool → 112×112×64
 ├ block2: [3×3, 128] ×2  → pool →  56×56×128
 ├ block3: [3×3, 256] ×3  → pool →  28×28×256
 ├ block4: [3×3, 512] ×3  → pool →  14×14×512
 ├ block5: [3×3, 512] ×3  → pool →   7×7×512
 └ FC-4096 → FC-4096 → FC-1000 → softmax
```

Channel count doubles at each of the first **three** pooling stages — 64 to 128,
128 to 256, 256 to 512 — and then holds at 512 through the last two. While
doubling is still opposing the spatial quartering, the activation volume falls by
about half per stage; once the channel count stops growing, it falls by about a
quarter per stage. Across all five stages the volume drops by roughly $128\times$,
from $224^2 \cdot 64$ to $7^2 \cdot 512$.

## Formal treatment

Within a block, resolution is preserved: with $k = 3$, $s = 1$, $p = 1$ the
output-size formula
$H' = \lfloor (H + 2p - k)/s \rfloor + 1$ gives $H' = H$. Each pooling stage
halves both spatial dimensions, so after five stages $224 \to 7$.

Parameter accounting for VGG-16 is roughly $138$ million weights, of which about
$123$ million — close to $90\%$ — sit in the three fully connected layers, and
over $100$ million in the first of them alone, which maps $7 \times 7 \times 512$
to $4096$. The convolutional trunk is only about $15$ million weights.

Compute is distributed the opposite way. A forward pass at $224 \times 224$ costs
roughly $1.5 \times 10^{10}$ multiply–accumulate operations, of which the dense
head contributes about $1.2 \times 10^{8}$ — under $1\%$. **Parameters and
multiply–accumulates are therefore concentrated in different parts of the same
network**, which is why "reduce parameters" and "reduce compute" call for
different edits here.

Inside the trunk the cost is remarkably even rather than front-loaded. Spatial
area quarters at each pooling stage while input and output channels each double,
and the two cancel: every interior $3 \times 3$ layer in blocks 1 to 4 costs the
same $1.85 \times 10^{9}$ multiply–accumulates. Blocks 3 and 4 lead only because
they have three such layers each:

| Block | Multiply–accumulates | Share of the forward pass |
| ----- | -------------------- | ------------------------- |
| 1     | $1.94 \times 10^{9}$ | 12.5%                     |
| 2     | $2.77 \times 10^{9}$ | 17.9%                     |
| 3     | $4.62 \times 10^{9}$ | 29.9%                     |
| 4     | $4.62 \times 10^{9}$ | 29.9%                     |
| 5     | $1.39 \times 10^{9}$ | 9.0%                      |

Block 1 is the second _cheapest_ block, because its first convolution sees only
three input channels.

## Assumptions and requirements

VGG as published assumes fixed $224 \times 224$ RGB crops with the training-set
mean subtracted, and its fully connected head fixes that input size. It assumes a
large labelled dataset — ImageNet scale — and substantial compute; the authors
trained on multiple GPUs over weeks.

Crucially, it assumes **no normalisation layers**. The paper predates widespread
batch normalisation, and the deeper configurations were trained by initialising
from a shallower trained model rather than from scratch. Anyone reproducing VGG
from random initialisation without normalisation should expect optimisation
difficulty; this is a property of the original recipe, not a bug in their
implementation.

## Uses and applicability

VGG remains useful as a pretrained feature extractor where its particular feature
statistics are wanted — perceptual losses for image synthesis, style transfer and
texture models are commonly defined on VGG activations, and that usage is
entrenched enough that substituting a more efficient backbone changes results.
It is also a clean reference architecture for teaching and for controlled
depth experiments.

It is a poor choice as a general-purpose backbone today: for comparable or better
accuracy, residual and efficiency-oriented architectures use a fraction of the
parameters and compute.

## Limitations and common mistakes

- **Depth stops paying.** Past about 19 weight layers the plain stack stops
  improving and becomes harder to optimise — the degradation that residual
  connections address.
- **The parameter count is misattributed.** Blaming VGG's size on "all those
  convolutions" is wrong; the fully connected head holds roughly $90\%$ of the
  weights. Replacing it with global average pooling removes most of them.
- **The compute cost is misattributed.** Symmetrically, trimming the head barely
  changes multiply–accumulates, because the convolutional trunk carries over
  $99\%$ of them — and within the trunk the mid blocks, not the first one, are
  the largest contributors.
- **Modern reimplementations are compared as if identical.** `vgg16_bn` inserts
  batch normalisation throughout; it trains far more easily than the 2014 network
  and is not the same model.
- **Memory is underestimated.** Preserving resolution within blocks makes
  activation memory large, which constrains batch size more than the weight count
  does.

## Variants and alternatives

Configurations **A** through **E** in the paper span 11 to 19 weight layers;
**D** is VGG-16 and **E** is VGG-19. Configuration **C** inserts $1 \times 1$
convolutions, which the authors report as worse than the $3 \times 3$ version of
the same depth. Batch-normalised variants are standard in modern libraries.
Fully convolutional variants replace the dense head so that arbitrary input sizes
work. The direct successors are [ResNet](./resnet.md), which makes much greater
depth trainable, and inception-style and efficiency-oriented networks, which
attack the cost rather than the depth. The predecessor pattern is
[LeNet](./lenet.md)'s alternating convolution-and-subsample stages, scaled up.

## History and attribution

Simonyan and Zisserman submitted VGG to ILSVRC 2014, where it took first place in
localisation and second in classification behind GoogLeNet. Its combination of a
simple, uniform design and strong transferable features made VGG-16 one of the
most widely reused networks of the following years. The paper's own conclusion —
that depth is beneficial and that their configurations had reached a practical
limit — set up the question ResNet answered a year later.

## Sources

- **Very Deep Convolutional Networks for Large-Scale Image Recognition** — the
  configurations, the small-kernel argument, parameter counts, training recipe,
  and the ILSVRC 2014 results.
- **ImageNet Large Scale Visual Recognition Challenge** — the benchmark and
  evaluation protocol VGG's claims are made against.
- **Deep Learning, Chapter 9** — the general depth-versus-kernel-size reasoning.
- **Batch Normalization** — the technique absent from the original recipe and
  present in modern variants.

## Prerequisites and next connections

Read [Convolutional Layer](./convolutional-layer.md) and
[Pooling](./pooling.md) first; VGG is almost nothing but those two, repeated.

Next, [Residual Connection](./residual-connection.md) explains what stopped
plain depth from paying, and [ResNet](./resnet.md) shows the architecture that
resumed the depth trend.
