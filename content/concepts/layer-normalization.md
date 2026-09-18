---
concept_id: concept.deep_learning.layer_normalization
title: Layer Normalization
slug: /concepts/layer-normalization
aliases:
  - LayerNorm
kind: method
tier: 1
review_state: generated-draft
summary: Layer normalization standardizes a chosen set of features within each individual example, then applies learned feature-wise gains and biases with the same computation in training and inference.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: variant_of
    target: concept.deep_learning.batch_normalization
    note: Both methods normalize activations and apply learned affine parameters, but layer normalization obtains its statistics within one example instead of across a mini-batch.
  - type: supported_by
    target: concept.deep_learning.backpropagation
    note: The learned gains, biases, and normalized activations are trained through the derivatives of the layer statistics.
  - type: useful_when
    target: concept.deep_learning.stochastic_gradient_descent
    note: Per-example statistics avoid making the normalized forward computation depend on the mini-batch size used by a stochastic optimizer.
sources:
  - source_id: source.ba2016.layer_normalization
    title: Layer Normalization
    url: https://arxiv.org/abs/1607.06450
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Later layer-normalization placements and alternatives in transformer architectures
    reason: The registry contains the original layer-normalization paper but no source that compares pre-normalization, post-normalization, RMS normalization, or modern transformer placement choices.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Layer normalization** standardizes a selected vector of activations within one
example, then applies learned gains and biases. For an activation vector
$x\in\mathbb R^d$,

$$
\mu=\frac{1}{d}\sum_{j=1}^{d}x_j,
\qquad
\sigma^2=\frac{1}{d}\sum_{j=1}^{d}(x_j-\mu)^2,
$$

$$
y_j=\gamma_j\frac{x_j-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta_j.
$$

The statistics are computed separately for each example. Unlike batch
normalization, the basic operation does not need running population estimates
and does not change its formula between training and inference. The exact axes
included in the normalized vector are part of a library's layer definition and
must be checked rather than inferred from the name.

## Why it matters

When mini-batches are small, variable, or awkward to combine, statistics across
examples can be noisy or undefined. Layer normalization removes that dependency.
A single sequence position or recurrent state can be normalized from its own
features, so training and inference do not disagree merely because their batch
sizes differ.

The method also controls scale before subsequent computation while retaining a
learned feature-wise affine transformation. The original paper reported faster
training in several recurrent and feedforward experiments. That evidence does
not imply that layer normalization improves every architecture, or that its
benefit has one universally accepted mechanism.

## Intuition

Treat one example's hidden vector as a panel of gauges. Layer normalization
recenters the panel and expresses each gauge relative to the panel's spread,
then lets the model calibrate every gauge with $\gamma_j$ and $\beta_j$. Another
example gets its own center and spread; it cannot affect this one by sharing a
batch.

The picture breaks when absolute level or scale across all features carries
information. Normalization removes two degrees of freedom from the vector before
the learned affine map. The map can restore fixed feature scales and offsets,
but it cannot reconstruct an example-specific common shift that normalization
discarded unless that information is available elsewhere in the network.

## Concrete example

Let $x=(1,2,3)$, set $\epsilon=0$ for arithmetic clarity, and normalize all
three coordinates. The mean is $2$ and the variance is

$$
\sigma^2=\frac{(1-2)^2+(2-2)^2+(3-2)^2}{3}=\frac{2}{3}.
$$

The normalized vector is approximately $(-1.2247,0,1.2247)$. With
$\gamma=(1,2,0.5)$ and $\beta=(0,1,-1)$, the output is approximately
$(-1.2247,1,-0.3877)$.

Now replace the vector by $(11,12,13)$. Its normalized vector is identical,
because adding the same constant to every coordinate changes the mean but not
the centered differences. This invariance is deliberate. It is useful when the
common offset is nuisance scale, and harmful when that offset is a meaningful
signal.

## Formal treatment

Layer normalization is invariant, before the affine transform, to a common
positive rescaling and common shift of the normalized vector, apart from the
effect of $\epsilon$. For $a>0$ and scalar $c$,

$$
\frac{a x_j+c-(a\mu+c)}
{\sqrt{a^2\sigma^2+\epsilon}}
=
\frac{x_j-\mu}{\sqrt{\sigma^2+\epsilon/a^2}}.
$$

This is an exact identity for $a>0$; the rescaled vector normalizes to the
original normalized value only up to the change of the stabilizer from
$\epsilon$ to $\epsilon/a^2$, so invariance is exact precisely when
$\epsilon=0$ (or in the limit of negligible $\epsilon$). A negative $a$ also
reverses sign. During differentiation, every output depends on every input in the
normalized set through $\mu$ and $\sigma^2$, so the Jacobian is not diagonal.

In recurrent use, the paper computes statistics over the summed inputs to units
within a layer for each case and time step. The same learned gains and biases can
be reused across time while statistics are recomputed from the current hidden
vector. This avoids accumulating separate running estimates for different time
steps.

## Assumptions and requirements

The normalized axes must represent a coherent feature set. If a tensor contains
channels, spatial positions, heads, or padded elements, including or excluding
each axis changes the operation. Shapes must match the learned $\gamma$ and
$\beta$. A very small normalized dimension gives poor or degenerate variance;
$d=1$ always centers the sole value to zero.

$\epsilon$ must be positive in practice, and its placement inside the square
root is part of the definition. Mixed-precision implementations need stable
moment accumulation. Masked sequence elements require care: normalizing across
features at a valid position is different from including padded positions in a
larger normalized set.

## Uses and applicability

Layer normalization is appropriate when inference batch size differs from
training, when examples have variable sequence structure, and when recurrent
hidden states are normalized independently at each time. It is also useful when
cross-device synchronization of batch statistics would be undesirable.

It should not be inserted solely because it is common. In convolutional models,
the choice of axes changes spatial and channel information, and another
normalization scheme may better match the architecture. The registry does not
cover modern transformer placement comparisons, so this page does not recommend
pre- or post-normalization layouts.

## Limitations and common mistakes

Layer normalization adds reductions and learned parameters and couples the
features within each normalized set. It does not normalize a dataset's input
distribution, correct covariate shift, or guarantee bounded gradients. Removing
common scale can discard information, and normalization may interact with
residual branches and nonlinearities in architecture-specific ways.

Common mistakes include normalizing the batch axis by accident, assuming a
framework's `normalized_shape` names only the last feature when it can include
several trailing axes, using $\epsilon=0$, forgetting $\gamma$ and $\beta$ when
loading weights, and believing evaluation mode disables layer normalization.
Unlike batch normalization, the operation still recomputes per-example
statistics at inference.

## Variants and alternatives

[Batch Normalization](./batch-normalization.md) uses cross-example statistics
during training and stored estimates at inference. Layer normalization instead
uses one example and the same rule at both times. The original paper also
relates its construction to weight normalization and other activation-
normalization approaches.

Modern systems use further variants that omit mean subtraction, divide features
into groups, or move the operation relative to a residual branch. The registry
lacks their primary sources and comparative evidence, so they remain an
unresolved connection rather than receiving unsupported recommendations here.
Careful initialization and residual scaling are alternatives when normalization
is undesirable.

## History and attribution

Jimmy Lei Ba, Jamie Ryan Kiros, and Geoffrey Hinton introduced layer
normalization in the registered 2016 preprint. They described it as transposing
the normalization idea from statistics across a mini-batch to statistics across
the units of a layer within a single training case, and evaluated it on recurrent
and feedforward tasks. This page makes no broader priority claim about all forms
of per-example normalization.

## Sources

- Ba, Kiros, and Hinton support the equations, learned gain and bias, invariance
  discussion, recurrent application, training/inference identity, experiments,
  and 2016 attribution.

## Prerequisites and next connections

Read [Batch Normalization](./batch-normalization.md) first for the contrasting
choice of statistics and [Probability Theory](./probability-theory.md) for means
and variances. [Backpropagation](./backpropagation.md) explains the coupled
derivative through the reduction. Initialization remains relevant because layer
normalization controls only the activations and axes where it is actually placed.
