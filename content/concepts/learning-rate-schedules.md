---
concept_id: concept.deep_learning.learning_rate_schedules
title: Learning-Rate Schedules
slug: /concepts/learning-rate-schedules
aliases:
  - learning-rate decay
kind: method
tier: 1
review_state: generated-draft
summary: A learning-rate schedule makes an optimizer's global step size vary with training progress so that early updates can move quickly and later updates can settle more carefully.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: contributes_to
    target: concept.deep_learning.stochastic_gradient_descent
    note: A schedule replaces SGD's constant step size with a specified function of the update count or another observed signal.
  - type: useful_when
    target: concept.optimization.stochastic_optimization
    note: Decaying the step size is useful when persistent stochastic-gradient noise prevents a constant-rate method from settling.
  - type: contributes_to
    target: concept.deep_learning.adam
    note: Adam supplies coordinate-wise scaling, while a separate schedule still controls its global learning-rate multiplier.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
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
  - source_id: source.loshchilov2017.sgdr
    title: 'SGDR: Stochastic Gradient Descent with Warm Restarts'
    url: https://arxiv.org/abs/1608.03983
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary chronology of learning-rate decay and warmup schedules
    reason: The registry documents modern optimization and SGDR but does not establish the first uses of step decay, exponential decay, or warmup, so no priority claim is made for those families.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **learning-rate schedule** is a rule that chooses the scalar step size used by
an iterative optimizer as training proceeds. If an optimizer proposes direction
$d_t$ at update $t$, the scheduled update has the form

$$
\theta_{t+1}=\theta_t-\eta_t d_t,
$$

where $\eta_t>0$ is supplied by the schedule. The direction may be a raw
mini-batch gradient, momentum, or Adam's normalized moment estimate. A schedule
therefore does not replace the optimizer; it controls the optimizer's global
scale. A constant learning rate is the simplest schedule, while step, exponential,
cosine, and validation-triggered rules make that scale change over time.

## Why it matters

One step size rarely serves every phase of training equally well. Early updates
often need to cross a large distance in parameter space, so a tiny rate wastes
compute. Near a useful solution, stochastic gradients disagree and curvature can
make a formerly productive rate oscillate. Reducing the rate can turn coarse
progress into fine adjustment.

This is especially important for [Stochastic Gradient Descent](./stochastic-gradient-descent.md).
A constant nonzero rate leaves noise in the iterates even when the expected
gradient is small. Decay reduces that noise, although it also reduces the
distance each later update can travel. Scheduling is thus a budget decision:
spend large steps while movement is valuable, then reserve enough small steps to
settle. It cannot repair a wrong objective, biased data, or an unstable model.

## Intuition

Imagine descending a trail in fog. Long strides are efficient on the broad upper
slope but risky among rocks near the bottom. A schedule shortens the stride as
the route becomes more delicate. Cosine annealing makes the shortening smooth;
a step schedule changes stride abruptly at chosen milestones; a warm restart
lengthens it again to begin another exploratory phase.

The picture has limits. The optimizer does not know geometric distance to a
minimum, and update count is only a proxy for progress. Two runs can reach very
different regions by the same step. A time-based schedule is therefore an open-
loop controller. Validation-triggered schedules observe a signal, but that
signal is noisy and repeated use of validation data can itself bias model
selection.

## Concrete example

Suppose one-dimensional SGD sees the constant gradient $g_t=2$, begins at
$w_0=10$, and uses an initial rate $0.4$. A piecewise schedule keeps the rate for
two updates and then divides it by four:

$$
\eta_t=
\begin{cases}
0.4, & t=0,1,\\
0.1, & t=2,3.
\end{cases}
$$

The updates are $w_1=10-0.4(2)=9.2$, $w_2=8.4$, $w_3=8.2$, and
$w_4=8.0$. The first two moves cover $1.6$ units; the next two cover only $0.4$.
With a constant rate of $0.4$, four updates would reach $6.8$. Neither result is
intrinsically better: the example shows exactly what decay changes, not that
decay is always beneficial.

For a cosine segment of length $T=4$ with $\eta_{\max}=0.4$ and
$\eta_{\min}=0$, the rates at $t=0,1,2,3,4$ are approximately $0.4$, $0.3414$,
$0.2$, $0.0586$, and $0$. Their smooth reduction avoids a manually chosen jump.

## Formal treatment

A common open-loop family writes

$$
\eta_t=\eta_0\,s(t),
$$

with a nonnegative multiplier $s$. Exponential decay uses $s(t)=\gamma^t$ for
$0<\gamma<1$. Piecewise decay uses a constant within each interval. The cosine
rule used by SGDR on the $i$th run is

$$
\eta_t=\eta_{\min}^{(i)}+
\frac{1}{2}\left(\eta_{\max}^{(i)}-\eta_{\min}^{(i)}\right)
\left(1+\cos\left(\frac{T_{\mathrm{cur}}}{T_i}\pi\right)\right).
$$

$T_{\mathrm{cur}}$ counts updates since the last restart and $T_i$ is that
run's length. At a warm restart, the parameters are retained while the rate
returns upward; it is not a restart from new weights.

Classical stochastic-approximation results impose cumulative conditions such as
an infinite total step length and finite sum of squared steps. Those conditions
motivate decay but do not prove that a finite neural-network run will reach a
global optimum. A practical schedule is defined over optimizer updates, not
epochs, unless batch size and dataset size are fixed.

## Assumptions and requirements

The schedule must count the event it claims to count. Gradient accumulation,
dropped batches, distributed synchronization, and resumed checkpoints can all
make “step” ambiguous. Restoring weights without the scheduler's phase changes
the future training procedure. A schedule expressed in epochs also assumes a
stable number of updates per epoch.

Its scale must match the optimizer, batch size, loss reduction, and parameter
units. Momentum and Adam carry state across a rate change, so an abrupt drop does
not erase accumulated direction. Validation-triggered decay additionally
requires a stable metric, enough patience to distinguish noise from a plateau,
and a validation set kept separate from the final test set.

## Uses and applicability

Use schedules for long stochastic runs in which a fixed rate learns quickly but
then fluctuates, or when a known compute budget makes a deliberate high-to-low
trajectory useful. Cosine schedules are convenient when the update budget is
known. Step schedules are easy to audit. Warm restarts are an option when one
wants repeated high-rate phases without discarding learned parameters.

Do not treat scheduling as mandatory ceremony. Short fine-tuning runs, convex
problems with a line search, and streaming systems with no meaningful endpoint
may need another controller. A schedule chosen solely because it is conventional
can hide that the base learning rate is already unstable.

## Limitations and common mistakes

Schedules add hyperparameters and make comparisons easy to confound. Two
optimizers trained for equal epochs may receive different update counts; two
cosine runs with different horizons have different rates at every intermediate
checkpoint. Report the base rate, rule, horizon, warmup or restart details, batch
size, and update count.

Common errors are stepping the scheduler once per batch when it was configured
per epoch, decaying before rather than after the intended update, failing to save
its state, combining framework defaults with a second manual decay, and assuming
that a falling rate guarantees convergence. A rate that reaches zero early
freezes learning. A schedule that remains large too long can destroy a good
checkpoint. Validation-triggered rules can react to measurement noise rather
than optimization progress.

## Variants and alternatives

Step and exponential decay are simple monotone rules. Cosine annealing spends
many updates near both ends of its range. SGDR joins cosine segments with warm
restarts and can lengthen later segments. A constant rate plus iterate averaging
addresses stochastic noise differently: it averages parameters or predictions
instead of shrinking every move.

Adaptive optimizers such as [Adam](./adam.md) rescale coordinates from gradient
history, but their global multiplier can still be scheduled. Line searches and
trust-region methods choose step sizes from local objective information rather
than update count, usually at extra evaluation cost. Warmup, cyclic schedules,
and one-cycle policies are widely named alternatives, but the registry lacks
their defining sources, so this draft does not give comparative claims about
them.

## History and attribution

Learning-rate decay belongs to the older theory and practice of iterative and
stochastic optimization, but the registered sources do not establish a primary
chronology for its early named forms. Loshchilov and Hutter introduced the
registered SGDR method as a cosine-annealing schedule with warm restarts and
reported experiments on several datasets. That supports the SGDR attribution,
not a claim that they originated learning-rate scheduling generally.

## Sources

- Goodfellow, Bengio, and Courville support learning-rate control in neural-
  network optimization, stochastic-noise qualifications, and the separation
  between an optimizer's direction and its step size.
- Loshchilov and Hutter support the cosine formula, retained-parameter warm
  restarts, run-length choices, and SGDR attribution.

## Prerequisites and next connections

Read [Stochastic Optimization](./stochastic-optimization.md) for step-size and
noise reasoning, then [Stochastic Gradient Descent](./stochastic-gradient-descent.md)
and [Adam](./adam.md) for the update rules a schedule controls. Loss functions
are the next connection: changing the objective's reduction or scale changes
what a numerically identical learning rate means.
