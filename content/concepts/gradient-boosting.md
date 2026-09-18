---
concept_id: concept.machine_learning.gradient_boosting
title: Gradient Boosting
slug: /concepts/gradient-boosting
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: Gradient boosting builds an additive predictor stage by stage, fitting each new weak learner to the current loss's negative gradient so that many simple corrections form a flexible model.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.machine_learning.decision_trees
    note: The standard tabular implementation uses shallow regression trees as its weak learners, so tree partitions explain how each stage makes a local correction.
  - type: contrasts_with
    target: concept.machine_learning.random_forests
    note: Random forests fit decorrelated trees independently and average them, whereas gradient boosting fits trees sequentially so each stage corrects the current ensemble.
  - type: assumes
    target: concept.machine_learning.bias_variance
    note: Tree depth, shrinkage, and the number of stages trade approximation bias against variance and overfitting.
  - type: contributes_to
    target: concept.learning.supervised_learning
    note: Gradient boosting is a general supervised strategy for regression, classification, and ranking losses.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
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
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.chen2016.xgboost
    title: 'XGBoost: A Scalable Tree Boosting System'
    url: https://arxiv.org/abs/1603.02754
    source_kind: preprint
    supports:
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Gradient boosting** constructs a prediction function as a sum of simple models,
usually shallow [decision trees](./decision-trees.md). Starting from a constant
$F_0$, stage $m$ adds a learner $h_m$ that points in a direction reducing a
chosen differentiable loss:

$$
F_m(x)=F_{m-1}(x)+\nu\rho_m h_m(x).
$$

Here $\rho_m$ is a step size and $0<\nu\leq1$ is a shrinkage rate. Unlike a
[random forest](./random-forests.md), the learners are not independently useful:
their ordered sum is the model, and each learner is trained in response to the
errors left by those before it.

## Why it matters

Boosting turns a deliberately restricted learner into a high-capacity predictor.
A depth-two tree can describe only a few regions, but hundreds of such trees can
represent nonlinearities and interactions while retaining useful controls over
complexity. Because the construction starts from a loss rather than a particular
response type, the same machinery covers squared-error regression, logistic
classification, robust losses, and ranking objectives.

This combination is especially effective for structured tabular data. It can
discover thresholds and interactions without explicitly expanding features, yet
it gives the practitioner direct regularization controls: tree size, number of
stages, learning rate, row or column subsampling, and leaf penalties.

## Intuition

Imagine writing an answer, reading the remaining error, and appending a small
correction. Under squared loss the negative gradient is exactly the residual, so
the next tree tries to predict what the current ensemble missed. Under another
loss it predicts a **pseudo-residual**: the locally best correction according to
that loss.

The picture has a limit. A tree cannot generally equal an arbitrary gradient
vector at every training point because one leaf gives the same correction to all
points in that leaf. Fitting $h_m$ is therefore a projection of the desired
gradient onto the restricted space of trees, not exact gradient descent in a
finite parameter vector.

## Concrete example

For three observations with responses $y=(1,2,5)$, use squared loss
$L(y,F)=\tfrac12(y-F)^2$. The best constant is the mean,
$F_0=8/3$. Residuals are

$$
r=y-F_0=(-5/3,-2/3,7/3).
$$

Suppose a stump separates the third observation from the first two. Its fitted
leaf values are the within-leaf residual means: $(-5/3-2/3)/2=-7/6$ on the
first leaf and $7/3$ on the second. With $\nu=1/2$, the updated predictions are

$$
F_1=(8/3,8/3,8/3)+\tfrac12(-7/6,-7/6,7/3)
=(25/12,25/12,23/6).
$$

The squared-error sum falls from
$25/9+4/9+49/9=78/9\approx8.667$ to
$(-13/12)^2+(-1/12)^2+(7/6)^2=61/24\approx2.542$. The
calculation also shows why shrinkage does not completely fit the residual in one
stage: it deliberately leaves work for later, smaller corrections.

## Formal treatment

Given data $(x_i,y_i)_{i=1}^n$ and empirical risk
$R(F)=\sum_i L(y_i,F(x_i))$, initialize

$$
F_0=\arg\min_c\sum_i L(y_i,c).
$$

At stage $m$, compute pseudo-residuals

$$
r_{im}=-\left.\frac{\partial L(y_i,F(x_i))}{\partial F(x_i)}
\right|_{F=F_{m-1}}.
$$

Fit $h_m$ by least squares to $(x_i,r_{im})$, choose
$\rho_m=\arg\min_\rho\sum_iL(y_i,F_{m-1}(x_i)+\rho h_m(x_i))$,
and update with shrinkage $\nu$. For a tree with leaves $R_{jm}$, implementations
often optimize a separate leaf value $\gamma_{jm}$ and add
$\nu\sum_j\gamma_{jm}\mathbf1[x\in R_{jm}]$.

The procedure is steepest descent in function space only relative to the values
of $F$ on the training sample and the approximation capacity of the base-learner
class. XGBoost refines the stage objective with a second-order Taylor expansion
and explicit penalties on leaf count and leaf weights; it is a regularized tree-
boosting system, not a different principle.

## Assumptions and requirements

The loss must supply a usable gradient; second-order implementations also need
curvature information that is numerically well behaved. Training examples must
make the validation scheme legitimate: random splits are inappropriate for
groups or time series. The weak learner must capture useful structure in the
pseudo-residuals without being so flexible that a stage simply memorizes them.

Performance also assumes hyperparameters are tuned jointly. A small $\nu$
usually needs more stages; comparing learning rates at a fixed tree count is not
a fair comparison. Early stopping requires a genuinely held-out validation set.
Using the test set to select the stopping iteration leaks test information.

## Uses and applicability

Use gradient-boosted trees for medium-sized tabular regression or classification
with nonlinear effects, missingness patterns, and interactions. Custom losses
make the framework useful for quantiles, counts, survival objectives, and
learning-to-rank when their assumptions match the problem.

Prefer a linear model when extrapolation, sparse high-dimensional features, or a
simple global coefficient interpretation dominates. Prefer a random forest when
minimal tuning and parallel fitting matter more than peak predictive accuracy.
For very large or continuously arriving data, the sequential dependency between
stages can be the deciding computational cost.

## Limitations and common mistakes

Boosting can overfit noisy labels, especially with deep trees, many stages, or
an aggressive learning rate. More trees are not automatically safer. Probability
scores can be poorly calibrated even when classification accuracy is strong, and
feature importance does not establish a causal effect.

Common mistakes include fitting residuals for a non-squared loss instead of its
negative gradient, reading one tree as if it were the whole model, allowing
identifiers or post-outcome features to become splits, and tuning on the test
set. Axis-aligned trees still extrapolate as constants beyond observed feature
ranges; boosting many of them does not repair that structural limitation.

## Variants and alternatives

AdaBoost changes observation weights rather than explicitly taking loss
gradients. Stochastic gradient boosting subsamples rows, reducing correlation and
computation. XGBoost adds regularized second-order objectives and systems
optimizations; histogram-based implementations quantize candidate thresholds.
Random forests average independently randomized trees and primarily reduce
variance, while boosting is a sequential additive fit that can reduce bias.

## History and attribution

The statistical-learning account in _The Elements of Statistical Learning_
connects stagewise additive modeling with numerical optimization in function
space. XGBoost later described a scalable, sparsity-aware, regularized tree-
boosting system and its engineering choices. Those are the attributions verified
against the registered sources here; this draft does not attempt a complete
priority history of boosting algorithms.

## Sources

- _The Elements of Statistical Learning_ supports the additive-model definition,
  pseudo-residual derivation, regularization trade-offs, and comparison with
  bagging and AdaBoost.
- _XGBoost: A Scalable Tree Boosting System_ supports the regularized second-
  order objective and the scalable tree-boosting variant.

## Prerequisites and next connections

Read [Decision Trees](./decision-trees.md) for the usual base learner and
[Bias-Variance](./bias-variance.md) for the capacity trade-off. Compare
[Random Forests](./random-forests.md) to separate sequential correction from
parallel averaging. [Supervised Learning](./supervised-learning.md) supplies the
training-and-evaluation setting in which the loss and validation design live.
