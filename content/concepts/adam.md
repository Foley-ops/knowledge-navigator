---
concept_id: concept.deep_learning.adam
title: Adam
slug: /concepts/adam
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: Adam combines exponential moving averages of gradients and squared gradients with bias correction to produce adaptive coordinate-wise parameter updates.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: variant_of
    target: concept.deep_learning.stochastic_gradient_descent
    note: Adam is a stochastic first-order optimizer that transforms sampled gradients using adaptive moment estimates instead of applying one shared scale directly.
  - type: requires
    target: concept.optimization.stochastic_optimization
    note: Adam operates on noisy gradients of sampled objectives and inherits the assumptions and evaluation issues of stochastic optimization.
  - type: supported_by
    target: concept.deep_learning.backpropagation
    note: In neural networks, backpropagation supplies the gradient vector whose moments Adam tracks.
  - type: assumes
    target: concept.paradigms.array_programming
    note: Adam maintains and updates elementwise first- and second-moment arrays matching every parameter tensor.
sources:
  - source_id: source.kingma2015.adam
    title: 'Adam: A Method for Stochastic Optimization'
    url: https://arxiv.org/abs/1412.6980
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
unresolved_references:
  - label: Post-publication convergence analyses and decoupled weight decay for Adam
    reason: The registry contains the original Adam preprint but not later counterexamples, AMSGrad analysis, or the AdamW paper, so this draft does not make detailed comparative claims about them.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Adam** is a stochastic first-order optimization algorithm that maintains an
exponential moving average of gradients and another of squared gradients. It
uses the first as a momentum-like direction, divides by the square root of the
second to adapt the step coordinate by coordinate, and corrects both averages
for their initialization at zero.

Adam changes how a gradient is used; it does not compute the gradient. In a
neural network, [Backpropagation](./backpropagation.md) performs differentiation
and Adam performs the parameter update.

## Why it matters

Neural-network gradients can differ greatly in scale across parameters and over
time. A single global learning rate may be too conservative for coordinates
with small gradients and unstable for coordinates with large ones. Adam
normalizes recent first-moment estimates by recent root-second-moment estimates,
often producing useful progress with less coordinate-scale tuning than plain
SGD.

The method is computationally convenient: its time is linear in the parameter
count, its state consists of two additional arrays plus a step counter, and it
works with noisy mini-batch gradients. Convenience is not a guarantee that it
will generalize better or converge under every practical setting.

## Intuition

For each parameter, keep two memories. One remembers the signed direction in
which recent gradients have pointed; the other remembers their recent squared
magnitude. Move in the remembered direction, but divide by typical magnitude so
coordinates with very different raw scales receive more comparable effective
steps.

At startup both memories are artificially small because they begin at zero.
Bias correction divides out the missing mass. Without it, especially when decay
rates are close to one, early updates would be distorted by initialization
rather than determined only by observed gradients.

## Concrete example

Use one scalar parameter with gradients $g_1=2$ and $g_2=4$, learning rate
$\alpha=0.1$, $\beta_1=0.9$, $\beta_2=0.999$, and omit the tiny $\epsilon$ only
for arithmetic clarity. Starting from $m_0=v_0=0$, after the first gradient,

$$
m_1=0.1(2)=0.2,
\qquad
v_1=0.001(2^2)=0.004.
$$

Bias correction gives $\widehat m_1=0.2/(1-0.9)=2$ and
$\widehat v_1=0.004/(1-0.999)=4$, so the update magnitude is
$0.1(2/\sqrt4)=0.1$.

After the second gradient,

$$
m_2=0.9(0.2)+0.1(4)=0.58,
$$

$$
v_2=0.999(0.004)+0.001(16)=0.019996.
$$

Thus $\widehat m_2=0.58/(1-0.9^2)\approx3.0526$ and
$\widehat v_2=0.019996/(1-0.999^2)\approx10.003$, giving update magnitude about
$0.1(3.0526/\sqrt{10.003})\approx0.0965$.

## Formal treatment

At step $t$, with stochastic gradient $g_t$, Adam computes elementwise

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,
$$

$$
v_t=\beta_2v_{t-1}+(1-\beta_2)g_t\odot g_t,
$$

then corrects initialization bias:

$$
\widehat m_t=\frac{m_t}{1-\beta_1^t},
\qquad
\widehat v_t=\frac{v_t}{1-\beta_2^t}.
$$

The update is

$$
\theta_t=\theta_{t-1}-
\alpha\frac{\widehat m_t}{\sqrt{\widehat v_t}+\epsilon}.
$$

All products, square roots, and divisions in the moment transformation are
coordinatewise. The original paper gives commonly used defaults
$\beta_1=0.9$, $\beta_2=0.999$, and $\epsilon=10^{-8}$, but these are starting
points, not universal optima. The effective update depends on the learning-rate
schedule, batch sampling, gradient scale, and numerical precision.

## Assumptions and requirements

Adam requires gradients or stochastic gradient estimates for the intended
objective, finite moment state for every parameter, and consistent step
counting for bias correction. Sparse, delayed, accumulated, or distributed
gradients must be integrated according to the implementation's documented
semantics.

The original analysis imposes bounded-gradient and step-size conditions; it
does not establish success for arbitrary nonconvex neural networks. Hyperparameters
must be validated for the task. Loss reduction, batch size, clipping,
regularization, and mixed-precision scaling alter the gradients Adam sees and
therefore the moment history.

## Uses and applicability

Adam is a strong practical starting point for noisy, large-scale differentiable
objectives, especially when parameter gradients have heterogeneous magnitudes
or sparse occurrence. It is widely applicable to neural networks, learned
embeddings, and other models trained from mini-batches.

It should be compared against a tuned
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) baseline when
final predictive quality matters. On small smooth problems, deterministic or
quasi-Newton methods may use curvature and exact gradients more effectively.

## Limitations and common mistakes

Adam stores two state values per parameter in addition to the parameters and
often their gradients, increasing optimizer memory. Coordinatewise normalization
is not invariant to arbitrary reparameterization. Rapid changes in gradient
statistics can make moving averages lag, and a small training loss still says
nothing by itself about test performance.

Common mistakes include omitting bias correction, incrementing the time index
per micro-batch when parameters update only after accumulation, placing
$\epsilon$ differently without noticing implementation semantics, restoring
weights without optimizer state, comparing optimizers at unequal compute, and
assuming the original paper guarantees convergence in every modern training
regime. Later convergence and weight-decay refinements are deliberately left as
an unresolved source gap here.

## Variants and alternatives

The original paper relates Adam to momentum and adaptive methods such as AdaGrad
and RMSProp, and presents AdaMax as an infinity-norm variant. Plain SGD with
momentum uses less optimizer state and a shared scale; it may require more
careful scheduling but remains an essential baseline. Full-batch and quasi-
Newton methods exchange more expensive steps for lower gradient noise or
curvature information.

Later variants modify the second-moment maximum or decouple weight decay, but
the registry used for this page lacks their primary papers. No detailed claim
about AMSGrad or AdamW is made here until that evidence is available.

## History and attribution

Diederik P. Kingma and Jimmy Ba introduced Adam in the registered preprint,
submitted in 2014 and associated with the 2015 conference publication. The name
is explained there as adaptive moment estimation. This page uses that primary
source for the algorithm, defaults, bias correction, complexity, related-method
comparison, and attribution.

## Sources

- Kingma and Ba's Adam paper supports the moment recurrences, bias corrections,
  update, default values, computational properties, related adaptive methods,
  experiments, and historical attribution.
- Goodfellow, Bengio, and Courville support the broader stochastic-optimization
  setting, momentum and adaptive-rate intuition, neural-network applicability,
  and practical qualification of optimizer results.

## Prerequisites and next connections

Read [Stochastic Optimization](./stochastic-optimization.md),
[Stochastic Gradient Descent](./stochastic-gradient-descent.md), and
[Backpropagation](./backpropagation.md). Next study learning-rate schedules,
regularization, and loss functions as separate training choices rather than
assuming the optimizer determines the entire learning procedure.
