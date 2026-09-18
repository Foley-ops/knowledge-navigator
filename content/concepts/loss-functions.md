---
concept_id: concept.deep_learning.loss_functions
title: Loss Functions
slug: /concepts/loss-functions
aliases:
  - objective losses
kind: concept
tier: 1
review_state: generated-draft
summary: A loss function assigns a numerical cost to a prediction and target, turning the behavior desired from a model into the objective that training can optimize.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: In supervised learning, the loss is defined on a prediction and its observed target and is averaged to form empirical risk.
  - type: supported_by
    target: concept.deep_learning.backpropagation
    note: Backpropagation computes how a differentiable scalar loss changes with every trainable parameter.
  - type: contributes_to
    target: concept.machine_learning.generalization
    note: The selected loss defines both the empirical risk being optimized and the population risk whose generalization is evaluated.
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
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary history of squared-error and log-loss objectives
    reason: The registered textbooks explain these losses but do not establish who first used each as a statistical or machine-learning objective, so the page avoids priority claims.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **loss function** maps a model output and a target to a scalar cost. For model
$f_\theta$, example $(x,y)$, and loss $\ell$, training commonly minimizes the
empirical objective

$$
J(\theta)=\frac{1}{n}\sum_{i=1}^{n}
\ell\!\left(f_\theta(x_i),y_i\right).
$$

The per-example loss states which errors count and how strongly. The objective
may add regularization terms, so “loss” and “objective” are related but not
always identical. Likewise, a training loss is not automatically the metric a
product reports. Classification may optimize negative log-likelihood while the
reported quantity is accuracy; the differentiable loss acts as a surrogate for
a discrete decision metric.

## Why it matters

Optimization can only pursue the scalar it receives. If two wrong predictions
have different real costs but the loss treats them equally, training has no
signal expressing that difference. Conversely, a numerically convenient loss
may emphasize rare, extreme errors more than the application does. Model
architecture determines what can be represented; the loss determines which
representable behavior is preferred.

The loss also determines gradient scale, robustness, and what a probabilistic
output means. Negative log-likelihood connects fitting to an assumed conditional
distribution. Squared error corresponds to a Gaussian observation model under
fixed variance, while absolute error has a different noise interpretation. A
good loss therefore reflects target type, uncertainty, and decision costs, not
just smoothness.

## Intuition

Think of the loss as a ruler placed on mistakes. Squared error stretches the
ruler at large residuals: doubling an error quadruples its cost. Absolute error
uses evenly spaced marks. Cross-entropy does not measure distance between class
numbers; it penalizes the probability assigned to the observed class.

The ruler metaphor breaks because training changes a shared function, not one
prediction at a time. Reducing one example's loss can increase another's, and
averaging hides who bears the error. A low mean loss can coexist with severe
failure on a small subgroup. The aggregation rule and sampling scheme are part
of the objective just as surely as the algebraic formula.

## Concrete example

For two regression targets $y=(0,10)$ and predictions $\hat y=(2,6)$, the
residuals are $2$ and $-4$. Mean squared error is

$$
\operatorname{MSE}=\frac{2^2+(-4)^2}{2}=10,
$$

while mean absolute error is

$$
\operatorname{MAE}=\frac{|2|+|-4|}{2}=3.
$$

If the second prediction changes from $6$ to $2$, its absolute residual doubles
from $4$ to $8$. MAE rises from $3$ to $5$, but MSE rises from $10$ to $34$.
The squared loss gives the enlarged error much more leverage.

For a three-class target whose correct class is second, probabilities
$(0.1,0.7,0.2)$ give cross-entropy $-\log(0.7)\approx0.357$. Probabilities
$(0.1,0.2,0.7)$ predict the wrong class and give $-\log(0.2)\approx1.609$.
Cross-entropy uses confidence in the observed class, not the numeric distance
between class labels.

## Formal treatment

Population risk under data distribution $P$ is

$$
R(\theta)=\mathbb E_{(X,Y)\sim P}
\left[\ell\!\left(f_\theta(X),Y\right)\right].
$$

Training substitutes an empirical distribution. For real-valued regression,
squared loss is $\ell(\hat y,y)=(\hat y-y)^2$ and absolute loss is
$\ell(\hat y,y)=|\hat y-y|$. For a categorical model with probabilities
$p_\theta(k\mid x)$, multiclass negative log-likelihood is

$$
\ell(\theta;x,y)=-\log p_\theta(y\mid x).
$$

With logits $z$, implementations should compute log-softmax and gather the
target class rather than explicitly form small probabilities and take their
logarithms. If examples have weights $a_i$, the normalized weighted objective
must state its denominator; a sum and a mean have gradients differing by a
factor tied to batch size.

A surrogate loss replaces a task metric that is discontinuous or difficult to
optimize. Smoothness makes gradients usable, but surrogate consistency and good
finite-sample behavior are separate questions. Minimizing training loss alone
does not guarantee low population risk.

## Assumptions and requirements

Targets must match the loss's domain: class indices or valid distributions for
cross-entropy, comparable physical units for regression, and correctly censored
or masked values where observations are missing. A probabilistic loss assumes a
model family for the conditional distribution; misspecification can make its
uncertainties misleading even when point predictions look useful.

The reduction must match sampling. Oversampling a class changes the empirical
distribution unless importance weights compensate. Sequence padding must be
masked. Distributed workers must agree whether gradients correspond to a local
sum, local mean, or global mean. Numerical implementations need stable log-sum-
exp calculations and clear behavior for impossible targets or zero weights.

## Uses and applicability

Use squared error when large residuals should receive rapidly increasing weight
and the conditional-mean target is appropriate. Use absolute-error-style losses
when linear growth better matches the decision problem. Use negative log-
likelihood when the model produces a conditional distribution and probabilistic
fit matters. Pair the training objective with task metrics that people can
interpret.

For ranking, structured prediction, representation learning, and imbalanced
decisions, a specialized loss may be needed. The registry does not justify a
single universal recommendation. Select the loss from the action and data
model, then test sensitivity to its weighting and reduction.

## Limitations and common mistakes

No scalar loss captures every consequence. Averaging can conceal tail risk and
subgroup harm. A loss can reward calibrated probabilities yet disagree with a
fixed-threshold utility, or improve accuracy while making errors more expensive.
Optimization may also exploit a proxy in ways the designer did not anticipate.

Common mistakes include applying softmax twice before a combined cross-entropy
operation, feeding integer class labels to a binary formula with the wrong
shape, averaging over padding, mixing natural and base-two logarithms when
interpreting values, comparing summed training loss across batch sizes, and
treating a lower surrogate loss as proof that the deployment metric improved.
Another error is inserting class weights without realizing that the optimum now
targets a reweighted distribution.

## Variants and alternatives

Regression alternatives include squared, absolute, and smooth combinations of
the two. Classification alternatives include negative log-likelihood, margin-
based surrogates, and direct cost-sensitive weighting. Pairwise and listwise
losses compare examples for ranking. Contrastive objectives compare related and
unrelated representations, but their detailed treatment belongs with
[Contrastive Learning](./contrastive-learning.md).

An alternative to changing the loss is to change the sampling distribution,
decision threshold, or evaluation metric. These operations are not generally
equivalent: resampling changes which gradients are observed, weighting changes
their contribution, and thresholding changes decisions after probabilities are
produced.

## History and attribution

Squared-error, absolute-error, likelihood, and margin principles come from
different mathematical and statistical traditions. The registered textbooks
document their modern formulations and uses but do not establish a reliable
priority chronology. This page therefore makes no claim that a particular
machine-learning author invented any of these broad losses.

## Sources

- Goodfellow, Bengio, and Courville support empirical objectives, surrogate
  losses, negative log-likelihood, numerical considerations, and the difference
  between optimization and generalization.
- Murphy supports the probabilistic interpretation of losses and expected risk.
- Hastie, Tibshirani, and Friedman support statistical loss choices, model
  assessment, and the distinction between training criteria and prediction
  quality.

## Prerequisites and next connections

Begin with [Supervised Learning](./supervised-learning.md) for empirical and
population risk and [Probability Theory](./probability-theory.md) for expectation
and likelihood. [Backpropagation](./backpropagation.md) explains how a scalar
loss produces parameter gradients. Continue to regularization to see how a
penalty or constraint modifies the data-fitting objective.
