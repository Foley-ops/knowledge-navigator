---
concept_id: concept.deep_learning.stochastic_gradient_descent
title: Stochastic Gradient Descent
slug: /concepts/stochastic-gradient-descent
aliases:
  - SGD
kind: algorithm
tier: 1
review_state: generated-draft
summary: Stochastic gradient descent updates parameters from a randomly sampled example or mini-batch, trading noisy directions for far cheaper iterations than full-gradient descent.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: implements
    target: concept.optimization.stochastic_optimization
    note: SGD is the canonical first-order algorithm for objectives whose gradients are accessed through random samples or mini-batches.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: Each update follows a sampled gradient of the objective with respect to a vector of parameters.
  - type: supported_by
    target: concept.deep_learning.backpropagation
    note: In differentiable neural networks, backpropagation efficiently computes the per-example or mini-batch gradients used by SGD.
  - type: contrasts_with
    target: concept.deep_learning.adam
    note: Plain SGD uses one shared learning-rate rule, while Adam rescales coordinates using moving first and second moments.
sources:
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
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
    checked_on: 2026-09-17
  - source_id: source.bubeck.convex_optimization_complexity
    title: 'Convex Optimization: Algorithms and Complexity'
    url: https://arxiv.org/abs/1405.4980
    source_kind: preprint
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary historical sources for stochastic gradient descent
    reason: The registered sources explain modern SGD and its stochastic-approximation context but do not establish a primary-source chronology for the named algorithm.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Stochastic gradient descent** (**SGD**) minimizes an objective expressed as an
expectation or average by updating parameters from a random sample rather than
the exact full gradient. For a sampled example or mini-batch $B_t$, it performs

$$
\theta_{t+1}=\theta_t-\eta_t g_t,
\qquad
g_t=\frac{1}{|B_t|}\sum_{i\in B_t}\nabla_{\theta}\ell_i(\theta_t).
$$

With one sampled example, this is strictly stochastic. In deep-learning usage,
“SGD” commonly includes mini-batch gradients. Full-batch gradient descent is the
limiting case in which $B_t$ contains the entire training set.

## Why it matters

If a dataset has a billion examples, evaluating the full gradient before every
parameter change wastes the useful directional information available from a
small sample. SGD makes frequent cheap updates. Early in training, when many
examples agree on a broad direction, those updates can reduce loss long before
one exact gradient would finish.

Mini-batches also map well to vectorized accelerators, and their noise can keep
successive steps from following one deterministic path. That practical benefit
does not mean noise is always desirable: near a solution, persistent variance
can prevent fine convergence unless the learning rate decays or batch size
changes.

## Intuition

Full gradient descent asks every voter before taking a step. SGD polls a random
small group and moves immediately. An individual poll can point the wrong way,
but a representative poll points correctly on average, and many inexpensive
polls can outperform rare censuses.

The metaphor breaks when sampling is biased or observations are strongly
dependent. Then the poll is not representative, and the expected update may not
equal the desired gradient. It also hides geometry: one global step size can be
too small for flat directions and too large for steep ones.

## Concrete example

Let two losses be

$$
\ell_1(w)=\frac12(w-1)^2,
\qquad
\ell_2(w)=\frac12(w-5)^2,
$$

so the empirical objective is their average. At $w_0=0$, the individual
gradients are $-1$ and $-5$, while the full gradient is $(-1-5)/2=-3$.
With learning rate $\eta=0.1$, a full-gradient step gives
$w_1=0-0.1(-3)=0.3$.

If SGD samples example one, it instead gives $w_1=0.1$; if it samples example
two, it gives $w_1=0.5$. Averaging these two possible updated values yields
$0.3$, exactly the full-gradient update. Either realized step is noisy, but the
sample gradient is unbiased under uniform sampling.

At $w=3$, the two individual gradients are $2$ and $-2$ while the full gradient
is zero. SGD continues to move unless its step size shrinks, illustrating why
variance matters most near the optimum.

## Formal treatment

For

$$
F(\theta)=\mathbb E_{\xi}[f(\theta;\xi)],
$$

SGD receives $g_t$ such that, under ideal sampling,

$$
\mathbb E[g_t\mid\theta_t]=\nabla F(\theta_t).
$$

Its expected squared error decomposes through the gradient variance, so batch
averaging reduces variance when samples are independent. Convex convergence
results require conditions such as bounded variance or gradients, an appropriate
step-size sequence, and convexity; stronger rates require stronger structure.
Those theorems do not automatically apply to a neural network's nonconvex loss.

For a finite dataset, sampling with or without replacement and reshuffling each
epoch produce related but not identical stochastic processes. An **epoch** is a
bookkeeping pass through the data, not one mathematical SGD iteration. The
update count, batch size, and examples processed should all be reported.

## Assumptions and requirements

The sampled gradient must correspond to the intended objective. Uniform
sampling yields an unbiased estimator of an unweighted empirical mean;
importance or class-balanced sampling requires matching weights if that mean is
still the target. Training examples should be shuffled enough that batches do
not systematically track acquisition order.

The learning rate is central. A rate that is too large diverges or oscillates;
one that is too small makes no useful progress. Feature scales, initialization,
loss reduction convention, batch size, numerical precision, and gradient
clipping all change the effective update and must be treated as part of the
method.

## Uses and applicability

SGD is appropriate for large finite sums, streaming objectives, and models whose
per-example gradients are cheap relative to a full pass. With
[Backpropagation](./backpropagation.md), it is a standard training method for
neural networks. It is also useful in convex classification and matrix problems
where stochastic-oracle theory more directly applies.

For small datasets or high-accuracy smooth convex problems, full-gradient,
quasi-Newton, or variance-reduced methods may converge with fewer fragile
hyperparameters. If gradients do not exist or are too noisy to estimate,
another optimization family is required.

## Limitations and common mistakes

SGD is sensitive to learning rate, schedule, batch composition, and scaling.
Noise creates a floor at constant step size. Correlated batches can produce
oscillation, and a single global rate can move poorly through anisotropic
curvature. In nonconvex problems, a small gradient does not certify a global
minimum.

Common mistakes include forgetting to zero accumulated gradients, confusing a
sum loss with a mean loss when changing batch size, evaluating on training
batches only, leaking validation data into sampling decisions, applying regularization
twice, reporting epochs without batch size, and assuming that lower training
loss implies better generalization.

## Variants and alternatives

Momentum accumulates a velocity to smooth oscillation and preserve direction;
Nesterov-style momentum evaluates its correction from a look-ahead position.
Mini-batch size trades estimator variance against parallel efficiency. Learning-
rate schedules, iterate averaging, and variance-reduced methods address
different convergence regimes.
[Adam](./adam.md) maintains coordinate-wise moment estimates and often reduces
early tuning burden, while full-batch gradient descent removes sampling noise at
greater per-step cost. Second-order and quasi-Newton methods incorporate
curvature but can be expensive at neural-network scale.

## History and attribution

The registered textbooks place SGD within stochastic approximation and modern
large-scale learning, and the deep-learning text documents its role in training
neural networks. They do not contain the primary record needed to assign a
single invention date or priority for the name. This page therefore leaves that
chronology unresolved rather than turning a textbook summary into a primary
claim.

## Sources

- Shalev-Shwartz and Ben-David support empirical-risk SGD, sampling, convex
  analysis, online-learning connections, and learning-theoretic qualifications.
- Bubeck supports stochastic first-order oracle assumptions, step-size and
  convergence reasoning, and comparisons with deterministic convex methods.
- Goodfellow, Bengio, and Courville support mini-batch practice, momentum,
  neural-network use, optimization difficulties, and the secondary historical
  framing.

## Prerequisites and next connections

Read [Stochastic Optimization](./stochastic-optimization.md),
[Multivariable Calculus](./multivariable-calculus.md), and
[Backpropagation](./backpropagation.md). Continue to [Adam](./adam.md) to see an
adaptive moment method, and to learning-rate schedules for the mechanism that
controls late-stage SGD behavior.
