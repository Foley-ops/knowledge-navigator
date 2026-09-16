---
concept_id: concept.deep_learning.convolutional_layer
title: Convolutional Layer
slug: /concepts/convolutional-layer
aliases:
  - convolution layer
  - conv layer
kind: method
tier: 1
review_state: generated-draft
summary: A neural-network layer that applies learned local filters with shared parameters across every spatial position of its input.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.analysis.convolution
    note: The layer's forward pass is a sliding local weighted sum over the input.
  - type: requires
    target: concept.analysis.cross_correlation
    note: The operation actually computed is cross-correlation, despite the layer's name.
  - type: requires
    target: concept.deep_learning.receptive_field
    note: Kernel size, stride and dilation of the layer determine how the receptive field grows.
  - type: requires
    target: concept.analysis.translation_equivariance
    note: Parameter sharing across positions is what makes the layer translation-equivariant.
  - type: implements
    target: concept.analysis.cross_correlation
    note: Every major framework implements the layer as a cross-correlation over learned kernels.
sources:
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.dumoulin2018.convolution_arithmetic
    title: A Guide to Convolution Arithmetic for Deep Learning
    url: https://arxiv.org/abs/1603.07285
    source_kind: preprint
    supports:
      - formal-treatment
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-16
  - source_id: source.pytorch.conv2d
    title: torch.nn.Conv2d — PyTorch Documentation
    url: https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - concrete-example
    checked_on: 2026-09-16
  - source_id: source.lecun1998.gradient_based_learning
    title: Gradient-Based Learning Applied to Document Recognition
    url: https://ieeexplore.ieee.org/document/726791
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-16
---

## Definition

A **convolutional layer** maps an input tensor of shape
$C_{\text{in}} \times H \times W$ to an output of shape
$C_{\text{out}} \times H' \times W'$ by applying $C_{\text{out}}$ learned kernels,
each of shape $C_{\text{in}} \times k_h \times k_w$, at every spatial position.
The same kernel weights are used at every position — this is **parameter
sharing** — and each output position depends only on a local window of the input
— this is **sparse connectivity**.

Notation used below: $C_{\text{in}}, C_{\text{out}}$ for input and output channel
counts, $k$ for kernel size, $s$ for stride, $p$ for padding, $d$ for dilation,
$g$ for the number of groups.

## Why it matters

A fully connected layer on a $224 \times 224 \times 3$ image with $64$ outputs per
position would need billions of weights and would have to learn the same edge
detector separately at every position. A convolutional layer with $64$ kernels of
size $3 \times 3 \times 3$ needs $1{,}728$ weights and reuses each detector
everywhere. That reduction is not only about memory: sharing is a statement that
the statistics of an image are roughly the same at every location, and it is what
makes learning from a modest number of images possible at all.

## Intuition

Think of each kernel as a small pattern template. The layer slides every template
over the whole image, and the output at a position records how strongly each
template matched there. Stacking layers means later templates are built from
earlier matches: edges into corners, corners into parts, parts into objects. The
number of kernels sets how many distinct patterns a layer can look for; the
kernel size and stride set how far it can see and how finely it reports.

## Concrete example

Take an RGB input of shape $3 \times 32 \times 32$, a layer with
$C_{\text{out}} = 16$, $k = 3$, $s = 1$, $p = 1$, $d = 1$, and a bias per output
channel.

- Output spatial size: $H' = \lfloor (32 + 2 \cdot 1 - 3)/1 \rfloor + 1 = 32$, so
  the output is $16 \times 32 \times 32$.
- Weights: $16 \times 3 \times 3 \times 3 = 432$, plus $16$ biases, so $448$
  learnable parameters.
- Multiply–accumulate operations: $32 \times 32 \times 16 \times 3 \times 3 \times 3
  = 442{,}368$.

Change only the stride to $s = 2$ and the output becomes
$16 \times 16 \times 16$: the parameter count is unchanged and the computation
falls by roughly four times.

## Formal treatment

With zero-based indexing, the layer computes, for output channel $o$ and position
$(i, j)$,

$$
y_{o,i,j} \;=\; b_o \;+\; \sum_{c=0}^{C_{\text{in}}-1} \; \sum_{u=0}^{k_h-1} \;
\sum_{v=0}^{k_w-1} w_{o,c,u,v}\; x_{c,\, s i + d u - p,\; s j + d v - p} ,
$$

with $x$ read as zero outside its bounds under zero padding. Note the **plus**
signs on the input indices: this is [Cross-Correlation](./cross-correlation.md),
not [Convolution](./convolution.md). Because $w$ is learned, the distinction does
not restrict what the layer can represent, but it does determine the correct
backward pass.

Output size in each spatial dimension is

$$
H' \;=\; \left\lfloor \frac{H + 2p - d(k - 1) - 1}{s} \right\rfloor + 1 .
$$

Parameter count is
$C_{\text{out}} \cdot \frac{C_{\text{in}}}{g} \cdot k_h k_w$ weights plus
$C_{\text{out}}$ biases. The layer is linear in both $x$ and $w$, so it composes
with non-linearities and normalisation in the usual way.

## Assumptions and requirements

The layer assumes its input has a grid structure with meaningful locality and
approximately stationary statistics: neighbouring positions are related, and a
pattern worth detecting in one place is worth detecting in another. Applied to
data without that structure — arbitrarily ordered tabular columns, say — sharing
and locality are unjustified constraints rather than useful priors.

It also assumes a fixed channel ordering, a chosen padding convention, and a
chosen data layout. Conventions differ between frameworks: `'same'` padding is
computed differently for even kernel sizes and for strides greater than one, and
`NCHW` versus `NHWC` layout changes performance though not semantics. Groups
require $C_{\text{in}}$ and $C_{\text{out}}$ to be divisible by $g$.

## Uses and applicability

Convolutional layers are the default feature extractor for images, audio
spectrograms, and any signal on a regular grid; one-dimensional versions handle
time series and text, three-dimensional versions handle volumes and video. They
are appropriate when locality and position-independence are real properties of
the data. They are a poor fit when every input position has its own distinct
meaning, or when the important dependencies are global and long-range from the
first layer onwards.

## Limitations and common mistakes

- **Only translation is handled.** The layer gives
  [Translation Equivariance](./translation-equivariance.md) and nothing else;
  rotation and scale must come from augmentation or a different architecture.
- **Reach grows slowly.** Stacking $3 \times 3$ layers widens the
  [Receptive Field](./receptive-field.md) by only two pixels per layer, and the
  _effective_ field grows more slowly still.
- **Parameter count is the wrong cost model.** Memory traffic and activation
  storage usually dominate; a $1 \times 1$ layer with many channels can cost more
  than a $3 \times 3$ layer with few.
- **The name misleads.** Loading a hand-designed asymmetric filter into a
  `Conv2d` silently applies its mirror image.
- **Padding is not free.** Zero padding fabricates a border of zeros, which the
  network can learn to use as an absolute position cue — quietly undermining the
  equivariance the layer was chosen for.

## Variants and alternatives

**Grouped** convolution splits channels into $g$ independent groups; with
$g = C_{\text{in}}$ it becomes **depthwise** convolution, which combined with a
$1 \times 1$ **pointwise** layer forms a depthwise-separable block at a fraction
of the cost. **Dilated** convolution widens the field without subsampling.
**Transposed** convolution increases spatial size. **Strided** convolution
replaces [Pooling](./pooling.md) for downsampling. **Locally connected** layers
drop parameter sharing, keeping locality but losing equivariance. Attention
layers give global mixing and learned, input-dependent weights at higher cost.

## History and attribution

Weight-shared local receptive fields appear in Fukushima's neocognitron, which
was not trained by gradient descent. The trainable convolutional layer in its
modern form — local kernels, shared weights, subsampling, trained end to end by
backpropagation — was first published by LeCun and colleagues in 1989, and
reaches its canonical, complete exposition in LeCun, Bottou, Bengio and Haffner
(1998), the paper cited here, which introduces [LeNet](./lenet.md). Later
architectures changed the kernel sizes, depth and normalisation but not the
layer's definition.

The 1989 priority claim is **not** supported by any source cited on this page;
it is recorded here so a reader does not mistake the 1998 paper for the first
publication, and it should be checked against the 1989 paper before being
relied on.

## Sources

- **Deep Learning, Chapter 9** — sparse interactions, parameter sharing,
  equivariance, and the motivation for the layer.
- **A Guide to Convolution Arithmetic for Deep Learning** — the output-size
  formula and the stride, padding, dilation and transposed variants.
- **torch.nn.Conv2d documentation** — a checkable statement of the exact
  computation, the shape formula, groups, and the cross-correlation convention.
- **Gradient-Based Learning Applied to Document Recognition** — the canonical
  exposition of the trainable layer. It is the standard reference, not the first
  publication; see History and attribution.

## Prerequisites and next connections

Read [Convolution](./convolution.md) and [Cross-Correlation](./cross-correlation.md)
for the operation, [Receptive Field](./receptive-field.md) for what a stack of
these layers can see, and
[Translation Equivariance](./translation-equivariance.md) for why sharing is the
right constraint.

Next, [Pooling](./pooling.md) covers the other classical way to reduce spatial
size, [Backpropagation Through Convolution](./backpropagation-through-convolution.md)
derives the backward pass, and [LeNet](./lenet.md) assembles these parts into a
complete network.
