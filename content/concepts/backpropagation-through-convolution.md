---
concept_id: concept.deep_learning.backpropagation_through_convolution
title: Backpropagation Through Convolution
slug: /concepts/backpropagation-through-convolution
aliases:
  - convolution backward pass
  - conv backprop
kind: algorithm
tier: 1
review_state: generated-draft
summary: The backward pass of a convolutional layer, in which the gradient with respect to the input is a true convolution of the output gradient with the kernel and the gradient with respect to the kernel is a correlation between input and output gradient.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: The backward pass is derived from the layer's forward definition and depends on its stride, padding and dilation.
sources:
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-16
  - source_id: source.dumoulin2018.convolution_arithmetic
    title: A Guide to Convolution Arithmetic for Deep Learning
    url: https://arxiv.org/abs/1603.07285
    source_kind: preprint
    supports:
      - formal-treatment
      - concrete-example
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-16
  - source_id: source.deep_learning_book.mlp
    title: Deep Learning, Chapter 6 — Deep Feedforward Networks
    url: https://www.deeplearningbook.org/contents/mlp.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.pytorch.conv2d
    title: torch.nn.Conv2d — PyTorch Documentation
    url: https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-16
---

## Definition

Given a [Convolutional Layer](./convolutional-layer.md) computing $y = f(x, w)$
and an incoming gradient $\delta = \partial L / \partial y$ of the loss $L$ with
respect to the layer's output, **backpropagation through convolution** produces
two things:

- $\partial L / \partial x$, passed to the layer below, and
- $\partial L / \partial w$ (and $\partial L / \partial b$), used to update the
  layer's parameters.

Both are themselves sliding local weighted sums, which is why a convolutional
layer's backward pass costs roughly what its forward pass costs.

## Why it matters

Everything a convolutional network learns arrives through these two expressions.
Whether a deep stack trains at all depends on how $\partial L / \partial x$
behaves as it is passed down — the concern that motivates a
[Residual Connection](./residual-connection.md). And because the forward pass is
a correlation while the input gradient is a genuine convolution, this is the one
place where the terminology confusion between the two operations produces a
concretely wrong answer rather than a harmless relabelling.

## Intuition

Each input value contributed to several outputs — every output whose window
covered it. Its gradient is therefore the sum of the gradients of all those
outputs, each weighted by the kernel entry that multiplied it. Reading that sum
as a sliding operation over $\delta$ gives a kernel that is **spatially
reversed**, because an input at offset $+u$ inside one window sits at offset
$-u$ when viewed from the output.

Each weight, by contrast, was used at _every_ position. Its gradient is the sum
over all positions of (output gradient there) times (input value it multiplied
there) — a correlation between the input and the output gradient.

## Concrete example

One-dimensional, single channel, $s = 1$, no padding. Input $x$ of length $4$,
kernel $w = [w_0, w_1]$, so $y$ has length $3$ with
$y_n = w_0 x_n + w_1 x_{n+1}$ (correlation convention). Let
$\delta = [\delta_0, \delta_1, \delta_2]$. Then

$$
\frac{\partial L}{\partial x_0} = w_0 \delta_0, \quad
\frac{\partial L}{\partial x_1} = w_1 \delta_0 + w_0 \delta_1, \quad
\frac{\partial L}{\partial x_2} = w_1 \delta_1 + w_0 \delta_2, \quad
\frac{\partial L}{\partial x_3} = w_1 \delta_2 .
$$

That is exactly $\delta$ **full-convolved** with $w$ — equivalently, $\delta$
zero-padded by $k - 1 = 1$ on each side and correlated with the **reversed**
kernel $[w_1, w_0]$. Meanwhile

$$
\frac{\partial L}{\partial w_0} = \sum_{n} \delta_n x_n, \qquad
\frac{\partial L}{\partial w_1} = \sum_{n} \delta_n x_{n+1},
$$

which is the correlation of $x$ with $\delta$.

## Formal treatment

For the multi-channel layer
$y_{o,i,j} = b_o + \sum_{c,u,v} w_{o,c,u,v}\, x_{c,\,i+u,\,j+v}$ (stride $1$, no
padding, correlation convention), differentiating gives

$$
\frac{\partial L}{\partial w_{o,c,u,v}} \;=\; \sum_{i,j} \delta_{o,i,j}\; x_{c,\,i+u,\,j+v},
\qquad
\frac{\partial L}{\partial b_o} \;=\; \sum_{i,j} \delta_{o,i,j},
$$

$$
\frac{\partial L}{\partial x_{c,m,n}} \;=\; \sum_{o} \sum_{u,v} w_{o,c,u,v}\;
\delta_{o,\,m-u,\,n-v} ,
$$

with $\delta$ read as zero outside its bounds. The minus signs in the last
expression are the signature of a true [Convolution](./convolution.md): the input
gradient is the output gradient convolved with the kernel, or equivalently
correlated with the kernel flipped in both spatial axes and with the channel
axes transposed.

**Stride.** With stride $s$, the input-gradient operation first inserts $s - 1$
zeros between adjacent elements of $\delta$, then applies the flipped-kernel
correlation with padding $k - 1 - p$. This zero-insertion is exactly the
transposed-convolution construction catalogued by Dumoulin and Visin; a
transposed convolution _is_ the gradient of a strided convolution with respect to
its input, which is why it changes resolution in the opposite direction.

**Dilation** carries through unchanged into the backward kernel. **Groups**
restrict each sum to its own group. **Padding** $p$ in the forward pass becomes
$k - 1 - p$ in the input-gradient pass.

## Assumptions and requirements

The derivation assumes the forward convention stated above. Change the
convention — reflect the kernel, index from the other corner, use `'same'`
padding with an asymmetric split for even kernels — and the constants shift even
though the structure does not. Because frameworks differ here, a hand-written
backward pass must be checked against the exact forward pass it accompanies, not
against a textbook.

It also assumes the layer is the only consumer of $x$. When a tensor feeds
several layers, as under a skip connection, the gradients from every consumer are
**summed**; forgetting one branch is a silent and common error.

Finally it assumes exact arithmetic when reasoning about correctness. In practice
reduced-precision accumulation and non-deterministic reduction order make the
computed gradient reproducible only to a tolerance.

## Uses and applicability

Every training step of every convolutional network uses these expressions, and
every automatic differentiation framework implements them. Deriving them by hand
is still worth doing when writing a custom layer or fused kernel, when
implementing gradient checkpointing, when analysing why gradients vanish or
explode through a particular stack, and when interpreting saliency maps, which
are built from $\partial L / \partial x$.

## Limitations and common mistakes

- **Forgetting the flip.** Reusing the forward correlation for the input
  gradient, without reversing the kernel, is wrong for any asymmetric kernel and
  is easy to miss because the shapes still match.
- **Forgetting the channel transpose.** The input gradient sums over _output_
  channels, so the kernel is used with its channel axes swapped.
- **Mishandling stride.** Treating the strided backward pass as a plain
  correlation on the un-dilated $\delta$ silently produces the wrong shape or,
  worse, the right shape with wrong values.
- **Dropping padding bookkeeping.** Forward padding $p$ becomes $k - 1 - p$
  backwards; using $p$ again misaligns every value.
- **Assuming the gradient is small because the layer is.** Gradient magnitude
  through a stack is governed by the product of the layers' Jacobians, which is
  why depth alone can make training fail.

A finite-difference gradient check on a small random layer catches all of these
in a few lines, and is the standard defence.

## Variants and alternatives

The same gradients can be computed by different algorithms: **im2col** plus a
matrix multiply, **FFT-based** convolution, or **Winograd** minimal-filtering
algorithms, each with different arithmetic cost and numerical behaviour but the
same mathematical result. **Gradient checkpointing** trades recomputation for
activation memory. **Forward-mode** differentiation computes directional
derivatives without storing activations, but is inefficient for the
many-parameters-one-loss shape of network training.

## History and attribution

Backpropagation as reverse-mode differentiation applied to layered networks
predates convolutional networks; its application to a weight-shared convolutional
architecture, trained end to end on images, is set out in the work that
introduced [LeNet](./lenet.md). The systematic catalogue of shapes for strided,
padded, dilated and transposed cases used above follows Dumoulin and Visin.

## Sources

- **Deep Learning, Chapter 9** — the three operations of a convolutional layer
  (forward, input gradient, kernel gradient) and their relationship.
- **Deep Learning, Chapter 6** — reverse-mode differentiation and the chain rule
  through a layered network.
- **A Guide to Convolution Arithmetic for Deep Learning** — the transposed
  convolution construction and the exact shape bookkeeping for stride, padding
  and dilation.
- **torch.nn.Conv2d documentation** — the forward convention any hand-written
  backward pass must match.

## Prerequisites and next connections

Read [Convolutional Layer](./convolutional-layer.md) first; this page
differentiates it. [Convolution](./convolution.md) and
[Cross-Correlation](./cross-correlation.md) supply the reflection that appears in
the input gradient.

Next, [Residual Connection](./residual-connection.md) addresses what happens to
these gradients in a very deep stack, and [ResNet](./resnet.md) shows the
architecture built around that answer.
