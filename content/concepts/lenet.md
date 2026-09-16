---
concept_id: concept.deep_learning.lenet
title: LeNet
slug: /concepts/lenet
aliases:
  - LeNet-5
kind: implementation
tier: 1
review_state: generated-draft
summary: The 1998 convolutional network for handwritten digit recognition that established the alternating convolution-and-subsampling pattern trained end to end by gradient descent.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
  - Artificial Intelligence/Computer Vision
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: LeNet's C1, C3 and C5 stages are convolutional layers with shared weights.
  - type: requires
    target: concept.deep_learning.pooling
    note: LeNet's S2 and S4 stages are subsampling layers, the ancestor of modern pooling.
sources:
  - source_id: source.lecun1998.gradient_based_learning
    title: Gradient-Based Learning Applied to Document Recognition
    url: https://ieeexplore.ieee.org/document/726791
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.fukushima1980.neocognitron
    title: 'Neocognitron: A Self-Organizing Neural Network Model for a Mechanism of Pattern Recognition Unaffected by Shift in Position'
    url: https://link.springer.com/article/10.1007/BF00344251
    source_kind: primary-research
    supports:
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
      - variants-and-alternatives
    checked_on: 2026-09-16
---

## Definition

**LeNet** is a family of small convolutional networks for handwritten character
recognition developed at Bell Labs and described in LeCun, Bottou, Bengio and
Haffner (1998). **LeNet-5**, the best-known member, takes a $32 \times 32$
greyscale image and applies an alternating sequence of
[Convolutional Layer](./convolutional-layer.md) stages and subsampling stages,
followed by fully connected layers and a ten-way output.

Its stages are conventionally labelled C1, S2, C3, S4, C5, F6 and the output
layer, where `C` denotes convolution, `S` subsampling and `F` fully connected.

## Why it matters

LeNet is the point at which the pieces assembled elsewhere in this knowledge base
became one system that was trained end to end by gradient descent and deployed at
scale: local receptive fields, shared weights, subsampling, and a trainable
classifier on top, all optimised against a single loss. It was used in production
for reading bank cheques, which made it evidence rather than a proposal. Every
architecture later in this slice — [VGG](./vgg.md),
[ResNet](./resnet.md) — is a variation on its stage pattern.

## Intuition

Read the network as a funnel. Early stages look at small patches and report many
simple patterns at high spatial resolution. Each subsampling stage halves the
resolution, so later stages see a wider part of the digit for the same kernel
size — their [Receptive Field](./receptive-field.md) grows. By the final
convolutional stage each unit sees essentially the whole character, and the fully
connected layers turn that description into a class decision.

## Concrete example

LeNet-5 as described in the 1998 paper, on a $32 \times 32$ input:

| Stage  | Operation                                            | Output                   |
| ------ | ---------------------------------------------------- | ------------------------ |
| C1     | 6 kernels, $5 \times 5$, stride 1                    | $6 \times 28 \times 28$  |
| S2     | $2 \times 2$ subsampling, stride 2                   | $6 \times 14 \times 14$  |
| C3     | 16 kernels, $5 \times 5$, sparse channel connections | $16 \times 10 \times 10$ |
| S4     | $2 \times 2$ subsampling, stride 2                   | $16 \times 5 \times 5$   |
| C5     | 120 kernels, $5 \times 5$                            | $120 \times 1 \times 1$  |
| F6     | fully connected, 84 units                            | $84$                     |
| Output | 10 units                                             | $10$                     |

The $32 \times 32$ input is a $28 \times 28$ MNIST digit padded so that strokes
at the border still fall inside a full receptive field. The whole network has on
the order of $6 \times 10^{4}$ learnable parameters — small enough to train on
1990s hardware, which was the point.

## Formal treatment

Two details distinguish LeNet-5 from a modern network built from the same parts.

**Subsampling is not plain pooling.** Each S stage sums the four values in its
$2 \times 2$ window, multiplies by a _trainable_ coefficient, adds a _trainable_
bias, and passes the result through the non-linearity. It is therefore an average
pool with two learned parameters per channel, not the parameter-free
[Pooling](./pooling.md) used today.

**C3 is not densely connected across channels.** Rather than connecting each of
its 16 output maps to all 6 inputs, the paper uses a fixed, deliberately
asymmetric connection table in which different output maps see different subsets
of input maps. The stated motivations are to keep the parameter count down and to
break symmetry so that different maps learn different features. This is an
ancestor of modern grouped convolution.

The activation is a scaled hyperbolic tangent rather than a rectifier, and the
output layer uses radial basis function units rather than a softmax. Training
minimises a loss over the RBF outputs by gradient descent, with the gradients
computed as in
[Backpropagation Through Convolution](./backpropagation-through-convolution.md).

## Assumptions and requirements

LeNet assumes a small, roughly centred, size-normalised, single-object greyscale
input. MNIST-style preprocessing — centring by centre of mass, scaling into a
fixed box — is part of the system, not an incidental detail. The architecture
assumes the whole object fits within the final receptive field, which is why the
input is padded to $32 \times 32$.

It further assumes low intra-class variation compared to natural images. Nothing
in LeNet handles clutter, occlusion, scale variation or colour.

## Uses and applicability

LeNet is appropriate today as a teaching architecture, as a fast baseline on
small single-object grids such as MNIST and Fashion-MNIST, and as an
embedded-scale model where a few tens of thousands of parameters is the budget.
On MNIST a faithful implementation reaches roughly $99\%$ test accuracy, which is
enough to make it a meaningful baseline rather than a toy.

It is not appropriate for natural images: too few channels, too little depth, and
no mechanism for scale or clutter. Reaching for LeNet on ImageNet-scale data is a
category error, not a tuning problem.

## Limitations and common mistakes

- **The tanh and RBF details are usually dropped.** Most "LeNet-5"
  implementations use ReLU, max pooling and softmax. They are reasonable
  modernisations, but they are not the 1998 network, and results should not be
  compared as if they were.
- **The C3 connection table is usually ignored.** Fully connecting C3 changes the
  parameter count and the paper's stated design rationale.
- **Capacity is misread.** LeNet's small size reflects the hardware and data of
  its time, not a claim that small is sufficient.
- **Preprocessing is omitted.** Feeding raw, uncentred $28 \times 28$ digits
  changes the effective receptive-field coverage at the borders.

## Variants and alternatives

The paper itself describes several LeNets; LeNet-1 is smaller and LeNet-5 is the
version usually cited. Modernised variants swap in ReLU, max pooling, batch
normalisation and a softmax output. The historical alternatives it was measured
against — $k$-nearest neighbours, support vector machines, and fully connected
networks on the same task — are reported in the paper. Later convolutional
architectures keep the alternating pattern while going much deeper: VGG stacks
small kernels into uniform blocks, and ResNet adds
[Residual Connection](./residual-connection.md)s to make far greater depth
trainable.

## History and attribution

Fukushima's neocognitron (1980) introduced layered local receptive fields with
weight sharing and subsampling, motivated by Hubel and Wiesel's account of simple
and complex cells, but it was not trained by gradient descent. LeCun and
colleagues contributed exactly that: applying backpropagation to a
weight-shared convolutional architecture, from the late 1980s through the 1998
paper cited here, which also introduced the MNIST dataset that became the
standard benchmark. LeNet-based systems were deployed commercially for cheque
reading.

## Sources

- **Gradient-Based Learning Applied to Document Recognition** — the architecture
  table, the trainable subsampling layers, the C3 connection table, the RBF
  output, and the deployment record.
- **Neocognitron** — the earlier weight-shared, subsampling architecture LeNet
  builds on.
- **Deep Learning, Chapter 9** — the modern reading of the convolution-and-pool
  stage pattern.

## Prerequisites and next connections

Read [Convolutional Layer](./convolutional-layer.md) and
[Pooling](./pooling.md) first; LeNet is built from them.

Next, [VGG](./vgg.md) shows what happens when the same pattern is made deeper and
uniform, and [ResNet](./resnet.md) shows what had to change before much greater
depth would train at all.
