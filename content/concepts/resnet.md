---
concept_id: concept.deep_learning.resnet
title: ResNet
slug: /concepts/resnet
aliases:
  - Residual Network
kind: implementation
tier: 1
review_state: generated-draft
summary: A family of convolutional networks built from residual blocks, which made networks of 50 to 152 layers trainable and resumed the depth trend that plain stacks had exhausted.
categories:
  - Artificial Intelligence/Computer Vision
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Computer Vision
relationships:
  - type: requires
    target: concept.deep_learning.residual_connection
    note: Every stage of a ResNet is a stack of blocks wrapped in identity shortcuts.
  - type: requires
    target: concept.deep_learning.vgg
    note: ResNet adopts VGG's 3x3 design discipline and stage structure, then adds shortcuts to get past its depth limit.
  - type: implements
    target: concept.deep_learning.residual_connection
    note: ResNet is the architecture in which the identity shortcut was introduced and evaluated.
  - type: contrasts_with
    target: concept.deep_learning.vgg
    condition: Compared at similar or greater depth on ImageNet classification.
    note: A 152-layer ResNet has lower complexity than VGG-19 and trains successfully at a depth where a plain stack degrades.
  - type: used_to_solve
    target: concept.vision.classification
    note: ResNet is a convolutional backbone for image classification; the d2l fine-tuning example pins a ResNet pretrained on ImageNet as the classifier's feature extractor.
sources:
  - source_id: source.he2016.deep_residual_learning
    title: Deep Residual Learning for Image Recognition
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.he2016.identity_mappings
    title: Identity Mappings in Deep Residual Networks
    url: https://arxiv.org/abs/1603.05027
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.russakovsky2015.imagenet_challenge
    title: ImageNet Large Scale Visual Recognition Challenge
    url: https://arxiv.org/abs/1409.0575
    source_kind: dataset-or-benchmark
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.veit2016.residual_networks_as_ensembles
    title: Residual Networks Behave Like Ensembles of Relatively Shallow Networks
    url: https://arxiv.org/abs/1605.06431
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
---

## Definition

**ResNet** is the family of convolutional networks introduced by He, Zhang, Ren
and Sun (2015), built by stacking blocks each wrapped in a
[Residual Connection](./residual-connection.md). A ResNet begins with a
$7 \times 7$ stride-$2$ convolution and a $3 \times 3$ stride-$2$ max
[Pooling](./pooling.md), continues through four stages of residual blocks, and
ends with global average pooling and a single fully connected classifier. The
published depths are **ResNet-18, -34, -50, -101 and -152**.

## Why it matters

ResNet answered a specific, well-posed question. [VGG](./vgg.md) had shown that
depth helps, and had also found that plain stacks stop improving around 19 weight
layers; deeper plain networks had _higher training_ error, which ruled out
overfitting as the cause. ResNet's identity shortcuts removed that barrier, and
ResNets won ILSVRC 2015 classification. The headline $3.57\%$ top-5 error on the
test set belongs to the winning **ensemble** of six ResNets of differing depth —
only two of them 152-layer — not to a single model; the single ResNet-152 is
reported at $4.49\%$ top-5. Quoting the ensemble figure as a single-model result
is exactly the protocol conflation the Limitations section below warns about.

The architectural pattern outlasted the benchmark result. Residual stages with
global average pooling are still the default backbone shape, and ResNet-50
remains a standard reference point for accuracy, throughput and transfer.

## Intuition

Take VGG's discipline — mostly $3 \times 3$ convolutions, halve the resolution
and double the channels at each stage — and wrap every pair or triple of
convolutions in an identity shortcut. Each block now only needs to learn a
_correction_ to what it receives, and a block that has nothing useful to add can
approximate zero and pass its input through. Depth stops being a liability
because extra blocks cost little when they are not needed.

## Concrete example

ResNet-50 on a $224 \times 224 \times 3$ input, using bottleneck blocks
($1 \times 1$ reduce, $3 \times 3$, $1 \times 1$ expand, expansion factor 4):

| Stage   | Output                     | Blocks | Block shape                                                |
| ------- | -------------------------- | ------ | ---------------------------------------------------------- |
| conv1   | $112 \times 112 \times 64$ | —      | $7 \times 7$, 64, stride 2                                 |
| pool    | $56 \times 56 \times 64$   | —      | $3 \times 3$ max, stride 2                                 |
| conv2_x | $56 \times 56 \times 256$  | 3      | $[1{\times}1, 64;\; 3{\times}3, 64;\; 1{\times}1, 256]$    |
| conv3_x | $28 \times 28 \times 512$  | 4      | $[1{\times}1, 128;\; 3{\times}3, 128;\; 1{\times}1, 512]$  |
| conv4_x | $14 \times 14 \times 1024$ | 6      | $[1{\times}1, 256;\; 3{\times}3, 256;\; 1{\times}1, 1024]$ |
| conv5_x | $7 \times 7 \times 2048$   | 3      | $[1{\times}1, 512;\; 3{\times}3, 512;\; 1{\times}1, 2048]$ |
| head    | $1000$                     | —      | global average pool, FC-1000                               |

That is $25.6$ million parameters and about $3.8 \times 10^{9}$ multiply–accumulate
operations per image — roughly a fifth of VGG-16's parameters and a quarter of
its compute, at substantially better accuracy. The first block of each stage
after conv2_x uses a stride-$2$ projection shortcut so the addition's shapes
match.

## Formal treatment

Each block computes $y = \mathcal{F}(x, \{W_i\}) + \mathcal{S}(x)$, where
$\mathcal{S}$ is the identity when shapes agree and a $1 \times 1$ strided
convolution when they do not. Within a stage, every block after the first uses
the identity, so the stage is a sum of corrections on a preserved signal path.

Two block designs are used. The **basic** block is two $3 \times 3$ convolutions
and appears in ResNet-18 and -34. The **bottleneck** block is
$1 \times 1 \to 3 \times 3 \to 1 \times 1$, where the $1 \times 1$ layers reduce
and then restore channel count so the $3 \times 3$ operates on a quarter of the
channels; this is what keeps ResNet-50 and deeper affordable. Each convolution is
followed by batch normalisation, and the original design applies ReLU after the
addition.

The depth-versus-cost comparison is the paper's headline structural claim:
ResNet-152 has **lower** computational complexity than VGG-19 despite being eight
times deeper — $11.3 \times 10^{9}$ against VGG-19's $19.6 \times 10^{9}$ and
VGG-16's $15.3 \times 10^{9}$ multiply–accumulates.

The saving comes from the trunk, not the head. The $7 \times 7$ stride-2 stem and
the stride-2 max pool drop the map to $56 \times 56$ within two layers, where
[VGG](./vgg.md) is still running 64 channels at $224 \times 224$ and 128 at
$112 \times 112$, and the bottleneck blocks keep every $3 \times 3$ convolution
narrow. Global average pooling removes roughly $90\%$ of VGG's _parameters_ but
well under $1\%$ of its arithmetic — a parameter saving, not a compute one.

The relationship to [Backpropagation Through Convolution](./backpropagation-through-convolution.md)
is what makes the depth usable: the additive shortcut contributes a term to
$\partial L / \partial x$ that is not a product of block Jacobians.

## Assumptions and requirements

ResNet as published assumes batch normalisation inside every block, which in turn
assumes batches large enough for stable batch statistics — small-batch training
typically requires group or layer normalisation instead. It assumes standard
ImageNet preprocessing and augmentation, and a step-decayed SGD-with-momentum
schedule; the reported accuracies belong to that recipe, not to the architecture
alone.

It assumes a $224 \times 224$ input in its published form, though global average
pooling makes the trunk usable at other resolutions. Reported ILSVRC numbers also
depend on the evaluation protocol — single crop, ten crop, or multi-scale — so
comparisons must hold the protocol fixed.

## Uses and applicability

ResNet backbones are appropriate for image classification, and as pretrained
feature extractors for detection, segmentation, retrieval and video. ResNet-50 is
the usual default when a well-understood, widely benchmarked backbone is wanted;
ResNet-18 and -34 suit tighter budgets; -101 and -152 suit accuracy-first work
where compute is available.

They are a weaker choice where per-FLOP efficiency on mobile hardware is the
binding constraint — depthwise-separable architectures dominate there — or where
global context from the first layer matters, which favours attention-based
models.

## Limitations and common mistakes

- **"Residual connections solve vanishing gradients."** They supply an additive,
  unattenuated path; they do not make optimisation easy, and normalisation and
  initialisation still matter.
- **Reading a ResNet as one very deep function.** Veit et al. show that residual
  networks unroll into many paths of differing lengths, that short paths carry
  most of the gradient, and that deleting a block degrades accuracy only
  gracefully. This ensemble-like reading is empirically supported but is not a
  complete theory, and it sits alongside rather than replacing the optimisation
  account.
- **Comparing across recipes.** ResNet-50 accuracies in the literature range over
  several points depending on augmentation, schedule length, label smoothing and
  resolution. A number without its recipe is not comparable.
- **Ignoring where the ReLU sits.** The original block applies ReLU after the
  addition, which is not a clean identity path; the pre-activation variant is
  usually the better starting point for very deep models.
- **Assuming deeper is always better.** Gains from -50 to -101 to -152 are real
  but diminishing, and they cost memory and latency.

## Variants and alternatives

**Pre-activation ResNet** (v2) moves normalisation and activation inside the
block, leaving a pure identity shortcut, and trains reliably at 1000 layers.
**ResNeXt** replaces the bottleneck's $3 \times 3$ with a grouped convolution.
**Wide ResNet** trades depth for width. **ResNet-D** and the "bag of tricks"
variants adjust the stem and the downsampling shortcut. **DenseNet**
concatenates rather than adds. Beyond the family, efficiency-oriented networks
and vision transformers are the main alternatives, and modern ConvNet designs
have narrowed the gap with transformers while keeping the residual stage
structure. The direct ancestors are VGG's uniform stages and, further back,
[LeNet](./lenet.md)'s alternating convolution-and-subsample pattern.

## History and attribution

He, Zhang, Ren and Sun published ResNet in December 2015 and won ILSVRC 2015 in
classification, detection and localisation, together with COCO detection and
segmentation. The follow-up identity-mappings paper (2016) analysed what belongs
on the shortcut path and introduced pre-activation. Ungated shortcuts had
predecessors — notably highway networks, which gate them — and the specific
contribution here is the ungated identity plus the degradation diagnosis that
justified it.

## Sources

- **Deep Residual Learning for Image Recognition** — the degradation experiments,
  the architecture tables for ResNet-18 through -152, the complexity comparison
  with VGG-19, and the ILSVRC 2015 results.
- **Identity Mappings in Deep Residual Networks** — pre-activation ordering and
  the analysis of the shortcut path.
- **ImageNet Large Scale Visual Recognition Challenge** — the benchmark and
  protocol the results are reported against.
- **Residual Networks Behave Like Ensembles of Relatively Shallow Networks** —
  the path-unrolling account and block-deletion evidence.

## Prerequisites and next connections

Read [Residual Connection](./residual-connection.md) for the mechanism and
[VGG](./vgg.md) for the plain-depth baseline this architecture was answering.

From here, [Pooling](./pooling.md) covers the global average pooling head that
removes VGG's dense layers, and
[Receptive Field](./receptive-field.md) explains why the theoretical field of a
152-layer network is not the same as what it actually uses.
