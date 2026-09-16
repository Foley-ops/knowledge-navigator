---
concept_id: concept.deep_learning.receptive_field
title: Receptive Field
slug: /concepts/receptive-field
aliases:
  - RF
kind: property
tier: 1
review_state: generated-draft
summary: The region of the input that can influence one unit's activation, distinguished from the much smaller effective region that actually influences it appreciably.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
  - Artificial Intelligence/Computer Vision
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.analysis.convolution
    note: The receptive field is determined by the spatial extent, stride and dilation of the convolutions a unit sits behind.
sources:
  - source_id: source.luo2016.effective_receptive_field
    title: Understanding the Effective Receptive Field in Deep Convolutional Neural Networks
    url: https://arxiv.org/abs/1701.04128
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.araujo2019.computing_receptive_fields
    title: Computing Receptive Fields of Convolutional Neural Networks
    url: https://distill.pub/2019/computing-receptive-fields/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - concrete-example
      - assumptions-and-requirements
    checked_on: 2026-09-16
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - intuition
      - uses-and-applicability
    checked_on: 2026-09-16
  - source_id: source.dumoulin2018.convolution_arithmetic
    title: A Guide to Convolution Arithmetic for Deep Learning
    url: https://arxiv.org/abs/1603.07285
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-16
---

## Definition

The **receptive field** of a unit in a deep network is the set of input
positions that can affect that unit's value. Two versions of the notion are used
and they are not interchangeable.

The **theoretical receptive field** is the set of input positions on which the
unit's value depends _at all_ — the support of the composition of the layers
below it. The **effective receptive field** is the much smaller central region
on which the unit's value depends _appreciably_, measured by the magnitude of
$\partial y / \partial x_{i}$ for input position $i$.

Throughout, $k_\ell$ is the kernel size of layer $\ell$, $s_\ell$ its stride,
$d_\ell$ its dilation, and $r_\ell$ the receptive field measured in input pixels.

## Why it matters

The receptive field bounds what a unit can possibly know. A classifier whose
final features have a theoretical receptive field smaller than the object it
must recognise cannot see the whole object, no matter how it is trained. Luo et
al. showed that the reverse error is just as common: architectures are designed
around the theoretical field while the _effective_ field is a fraction of it, so
a network that appears to cover the image in fact attends to a small central
blob.

## Intuition

Trace one output unit downwards. It reads a $k \times k$ patch of the layer
below. Each of those units reads its own $k \times k$ patch further down. The
patches overlap, so the union grows steadily rather than multiplicatively — each
additional layer of kernel size $k$ and stride $1$ widens the field by $k - 1$.
Stride changes the picture sharply: once a layer subsamples, every later layer's
kernel step covers several input pixels at once, so the field grows in jumps.

Not all of that region matters equally. Paths from the centre of the field to
the output are far more numerous than paths from the corners, so the centre
dominates — that gap between "can influence" and "does influence" is the whole
point of the effective receptive field.

## Concrete example

Three stacked $3 \times 3$ convolutions with stride $1$:

- after layer 1, $r_1 = 3$;
- after layer 2, $r_2 = 3 + (3 - 1) = 5$;
- after layer 3, $r_3 = 5 + (3 - 1) = 7$.

Three $3 \times 3$ layers therefore see the same $7 \times 7$ input window as one
$7 \times 7$ layer, using $3 \times 9 = 27$ weights per channel pair instead of
$49$ — the design argument behind [VGG](./vgg.md).

Insert a stride-$2$ layer after the first and the jump doubles: layer 2's kernel
now steps two input pixels at a time, so $r$ grows by $(k-1) \times 2 = 4$ per
subsequent $3 \times 3$ layer instead of $2$.

## Formal treatment

Let the **jump** $j_\ell$ be the input-pixel distance between neighbouring units
of layer $\ell$, with $j_0 = 1$. Then

$$
j_\ell = j_{\ell-1} \cdot s_\ell, \qquad
r_\ell = r_{\ell-1} + \bigl(k'_\ell - 1\bigr)\, j_{\ell-1}, \qquad r_0 = 1,
$$

where $k'_\ell = d_\ell (k_\ell - 1) + 1$ is the _effective_ kernel size of a
dilated kernel. Unrolling gives the closed form

$$
r_L \;=\; 1 + \sum_{\ell=1}^{L} \bigl(k'_\ell - 1\bigr) \prod_{i=1}^{\ell-1} s_i .
$$

For $L$ stride-$1$ layers of common size $k$ this is $r_L = L(k-1) + 1$: the
theoretical field grows **linearly** in depth.

Luo et al. analyse the distribution of $\partial y_{\text{centre}} / \partial x$
over the input and find that, for a stack of random-weight convolutions, it
approaches a **Gaussian** shape, and that the effective radius grows only as
$O(\sqrt{L})$. The effective field is therefore an asymptotically vanishing
fraction of the theoretical one as depth increases. They also report that the
effective field _expands_ during training, so it is a property of the trained
network and not of the architecture alone.

## Assumptions and requirements

The recurrences above assume each unit's dependence is determined by kernel
geometry alone: a feed-forward stack of convolutions, poolings and elementwise
non-linearities, with no global operation in between. Global average pooling,
fully connected layers, self-attention and normalisation over spatial extent all
make the theoretical field the whole input, at which point the formula answers
the wrong question.

Padding does not change the receptive-field _size_; it changes which output
positions exist and how much of the field falls outside the image. Skip
connections such as a [Residual Connection](./residual-connection.md) mean a unit
has several paths of different depth to the input, so its field is the union over
paths — the longest path sets the size, but the short paths carry much of the
gradient magnitude.

## Uses and applicability

Receptive-field arithmetic is the standard way to decide how deep a feature
extractor must be for a given object scale, to choose dilation rates for dense
prediction, to place detection heads at the scale their field matches, and to
diagnose a model that cannot capture long-range structure. It is cheap: the
recurrence is a few lines of arithmetic over a layer list.

## Limitations and common mistakes

The recurring mistake is quoting the theoretical field as if it were what the
model uses. A network with a $200 \times 200$ theoretical field may have an
effective field a small fraction of that width, so "the receptive field covers
the image" is not evidence that the model integrates the whole image.

Two further cautions. First, the effective field depends on the learned weights,
so it must be measured on the trained model, not derived from the architecture.
Second, receptive field describes _possible_ influence, not _achieved_ influence:
a unit whose field covers an object may still ignore it entirely.

## Variants and alternatives

**Dilation** widens the field without extra parameters or subsampling, at the
cost of gridding artefacts. **Strided convolution** and
[Pooling](./pooling.md) widen it by subsampling, at the cost of spatial
resolution. **Global pooling** and attention make the dependency global in one
step. Where a measured quantity is wanted rather than a derived one, the
effective field can be estimated empirically by backpropagating a gradient of
$1$ at a single output unit and mapping the magnitude of
$\partial y / \partial x$ over the input.

## History and attribution

The term is borrowed from visual neuroscience, where the receptive field of a
cell is the retinal region that modulates its firing; Fukushima's neocognitron
carried the idea into layered artificial networks, and
[LeNet](./lenet.md) inherited it. The explicit separation of theoretical from
effective receptive field, with the Gaussian shape and $O(\sqrt{L})$ growth
result, is due to Luo, Li, Urtasun and Zemel (2016). The neuroscience lineage in
this paragraph is **not** verified against a primary neuroscience source here.

## Sources

- **Understanding the Effective Receptive Field** — the theoretical/effective
  distinction, the Gaussian shape, the $O(\sqrt{L})$ growth rate, and expansion
  during training.
- **Computing Receptive Fields of Convolutional Neural Networks** — the closed
  form, the jump recurrence, and worked examples including dilation.
- **Deep Learning, Chapter 9** — the sparse-interaction framing and why depth
  widens the field.
- **A Guide to Convolution Arithmetic** — dilation and stride arithmetic.

## Prerequisites and next connections

Read [Convolution](./convolution.md) first for the operation whose support this
page measures.

Next, [Convolutional Layer](./convolutional-layer.md) supplies the kernel size,
stride and padding that enter the recurrence, and
[Translation Equivariance](./translation-equivariance.md) explains why the same
field applies at every position.
