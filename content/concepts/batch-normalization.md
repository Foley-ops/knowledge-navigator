---
concept_id: concept.deep_learning.batch_normalization
title: Batch Normalization
slug: /concepts/batch-normalization
aliases:
  - BatchNorm
kind: method
tier: 1
review_state: generated-draft
summary: Batch normalization standardizes selected activations using mini-batch statistics during training, then applies learned scale and shift parameters and stored statistics for inference.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: supported_by
    target: concept.deep_learning.backpropagation
    note: Batch normalization is differentiated through during training, including the dependence of batch statistics on every example in the normalized group.
  - type: contributes_to
    target: concept.deep_learning.stochastic_gradient_descent
    note: Normalized activations can change the scale and conditioning of the optimization problem seen by mini-batch gradient methods.
  - type: contrasts_with
    target: concept.deep_learning.initialization
    note: Initialization controls signal scale before the first update, whereas batch normalization recomputes activation statistics throughout training.
sources:
  - source_id: source.ioffe2015.batch_normalization
    title: 'Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift'
    url: https://arxiv.org/abs/1502.03167
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
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.ba2016.layer_normalization
    title: Layer Normalization
    url: https://arxiv.org/abs/1607.06450
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Later explanations of why batch normalization improves optimization
    reason: The registry contains the original paper's internal-covariate-shift account but not later analyses that test alternative smoothing or conditioning explanations, so this draft does not present one mechanism as settled.
    sections:
      - why-it-matters
      - intuition
      - limitations-and-common-mistakes
  - label: Defining sources for frozen and synchronized batch normalization
    reason: The registry has the original paper, the layer-normalization paper, and a general textbook, but none of them defines the frozen fine-tuning convention or the cross-device synchronized variant, so this draft names them as practice without citing a defining source.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Batch normalization** normalizes selected activation coordinates with a mean
and variance computed from the current training mini-batch, then applies a
learned scale and shift. For scalar activations $x_1,\ldots,x_m$ in one
normalized group,

$$
\mu_B=\frac{1}{m}\sum_{i=1}^{m}x_i,
\qquad
\sigma_B^2=\frac{1}{m}\sum_{i=1}^{m}(x_i-\mu_B)^2,
$$

$$
\widehat x_i=\frac{x_i-\mu_B}{\sqrt{\sigma_B^2+\epsilon}},
\qquad
y_i=\gamma\widehat x_i+\beta.
$$

$\gamma$ and $\beta$ are trained. At inference, implementations normally use
stored estimates accumulated during training rather than statistics of the
current request. Training and evaluation therefore implement related but
different computations.

## Why it matters

Deep networks can develop activation scales that make optimization sensitive to
initialization and learning rate. Batch normalization inserts an explicit
control on those scales and preserves representational freedom through learned
$\gamma$ and $\beta$. The original paper reported faster training and tolerance
of larger rates in its evaluated convolutional models.

Its batch dependence also injects noise because an example's normalized value
depends on its companions. That can regularize, but it also makes behavior
depend on batch construction. The original “internal covariate shift” explanation
is historically important, yet the registry does not cover later work testing
competing explanations, so the mechanism should not be presented as settled.

## Intuition

Before a layer hands activations onward, batch normalization recenters and
rescales each normalized coordinate, then lets the model relearn whichever
scale and offset it needs. It is like placing an adjustable gauge between
layers: incoming units are put on a common temporary scale, while $\gamma$ and
$\beta$ let the next computation choose its useful calibration.

The gauge analogy breaks because each reading depends on other examples in the
batch. An example normalized beside bright images can receive a different value
than the same example beside dark images. During inference, stored statistics
remove that coupling, creating a train/evaluation distinction that must be
managed explicitly.

## Concrete example

Take one feature over a training batch $B=(1,3)$. Its mean is $2$ and its
population-form batch variance is

$$
\sigma_B^2=\frac{(1-2)^2+(3-2)^2}{2}=1.
$$

Ignoring $\epsilon$, the normalized values are $(-1,1)$. With $\gamma=2$ and
$\beta=0.5$, the outputs are $(-1.5,2.5)$. The normalization did not force the
final feature to have unit variance because the learned affine transform can
restore or change scale.

Now pair the first value with $5$ instead: $B'=(1,5)$ has mean $3$ and variance
$4$, so the first normalized value remains $-1$. For $B''=(1,1)$, variance is
zero and the first value normalizes to $0$ because of $\epsilon$. Any two-point
batch normalizes to $(-1,1)$, so batch composition is invisible here except in
the degenerate case $B''$; it takes a third value to see it otherwise. For
$B'''=(1,1,4)$ the mean is $2$ and the batch variance is $2$, so the first value
normalizes to $-1/\sqrt{2}\approx-0.71$ rather than $-1$.

## Formal treatment

In a dense layer, statistics are commonly computed per feature across the batch.
In a convolutional layer, they are commonly computed per channel across batch
and spatial positions, sharing $\gamma$ and $\beta$ for that channel. The exact
axes are part of the layer definition.

During backpropagation, $\mu_B$ and $\sigma_B^2$ depend on every $x_i$, so the
Jacobian couples examples. It is incorrect to differentiate the denominator as
if the statistics were constants. The positive $\epsilon$ prevents division by
zero and affects numerical behavior when variance is small.

For inference, a running mean $\mu_R$ and variance $\sigma_R^2$ approximate
training-population statistics:

$$
y=\gamma\frac{x-\mu_R}{\sqrt{\sigma_R^2+\epsilon}}+\beta.
$$

Because these quantities are fixed, the affine transformation can often be
folded into an adjacent linear operator for deployment, provided the operator
ordering and parameters match.

## Assumptions and requirements

Training batches must provide meaningful statistics for the chosen axes. Very
small, nonrepresentative, correlated, or class-segregated batches can make the
estimates noisy or biased. Distributed training must specify whether statistics
are local to a device or synchronized across devices; those are different
algorithms.

Evaluation requires correct stored statistics and evaluation mode. Fine-tuning
on a shifted distribution raises a choice between updating those statistics and
preserving the source model's values. Padding and variable-length data must not
silently enter the moments. Mixed precision needs adequate accumulation
precision for variance.

## Uses and applicability

Batch normalization is well suited to convolutional and feedforward training
with reasonably sized, representative mini-batches. It can make early optimization
less sensitive to activation scale and can be folded for efficient inference.
Its use should be evaluated with the actual batch size and distributed layout.

It is less natural for batch size one, online updates, or sequence computations
where batch and time axes vary or padding complicates statistics. In those
settings, per-example normalization may provide more stable semantics. It is
also unnecessary when an architecture has been designed and tuned around
another normalization scheme.

## Limitations and common mistakes

Training predictions depend on batch companions, which complicates reproducibility
and per-example interpretation. Stored statistics can become stale under
distribution shift. Small batches produce noisy moments, while a mismatch
between training and inference statistics can cause abrupt accuracy loss.

Common mistakes include leaving the model in training mode during validation,
forgetting to update stored statistics during intended fine-tuning, normalizing
over the wrong axes, using an unbiased variance formula where an implementation
expects the batch formula, omitting $\epsilon$, and assuming $\gamma$ is
redundant. Another is claiming that batch normalization eliminates the need for
careful initialization or regularization in every model; the original evidence
was architecture- and experiment-specific.

## Variants and alternatives

Layer normalization uses statistics within one example and avoids stored batch
moments. Other named alternatives normalize groups, channels, instances, or
weights, but the registry lacks their defining sources, so no detailed comparison
is made here. Removing normalization and using carefully scaled initialization,
residual paths, and tuned learning rates is also a legitimate design.

Frozen batch normalization retains stored statistics during fine-tuning. Synchronized
batch normalization enlarges the statistics group across devices at communication
cost. At inference, algebraic folding is an implementation transformation, not
a different statistical method.

## History and attribution

Sergey Ioffe and Christian Szegedy introduced batch normalization in the
registered 2015 paper. They framed it as reducing internal covariate shift,
defined the mini-batch transformation and inference procedure, and reported
faster training in their experiments. This page preserves that attribution
while leaving later debates about the causal mechanism unresolved because their
sources are absent from the registry.

## Sources

- Ioffe and Szegedy support the equations, learned affine parameters, training
  and inference distinction, convolutional axes, reported optimization effects,
  and 2015 attribution.
- Goodfellow, Bengio, and Courville support broader optimization, initialization,
  regularization, and implementation context, including the design that relies on
  careful initialization instead of a normalization layer.
- Ba, Kiros, and Hinton support the layer-normalization alternative and its
  per-example statistics. The frozen and synchronized variants are named here as
  practice and are not supported by any registered source.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) for means and variances,
[Backpropagation](./backpropagation.md) for the coupled derivative, and
[Initialization](./initialization.md) for the signal-scale problem at the first
step. Continue to layer normalization for a per-example alternative with the
same learned scale-and-shift pattern.
