---
concept_id: concept.deep_learning.regularization
title: Regularization
slug: /concepts/regularization
aliases:
  - model regularisation
kind: concept
tier: 1
review_state: generated-draft
summary: Regularization changes a learning problem to favor predictors expected to behave better beyond the training sample, often by penalties, constraints, noise, or early stopping.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: contributes_to
    target: concept.machine_learning.generalization
    note: Regularization expresses an inductive bias intended to reduce out-of-sample error rather than merely minimize training loss.
  - type: mitigates
    target: concept.machine_learning.bias_variance
    note: Many regularizers trade increased bias for reduced sensitivity to the particular training sample, although the simple tradeoff is not universal.
  - type: requires
    target: concept.learning.supervised_learning
    note: The role of regularization is defined relative to empirical fitting and performance on fresh data.
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
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.srivastava2014.dropout
    title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting'
    url: https://www.jmlr.org/papers/v15/srivastava14a.html
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary chronology of weight decay and early stopping
    reason: The registered sources explain both methods but do not establish their first use, so the history section does not assign priority for them.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Regularization** is any deliberate change to a learning problem that favors
solutions expected to perform better beyond the training sample. A common form
adds a penalty $\Omega(\theta)$ to the empirical data loss:

$$
J(\theta)=\frac{1}{n}\sum_{i=1}^{n}
\ell\!\left(f_\theta(x_i),y_i\right)+\lambda\Omega(\theta).
$$

Other forms constrain parameters, inject noise, augment data, average models,
or stop training before the data-fitting loss reaches its minimum. They share
an inductive-bias role, not one formula. Regularization is judged by held-out
performance. A method that raises training loss and also raises validation loss
is not beneficial merely because it is called a regularizer.

## Why it matters

Flexible models can fit idiosyncrasies of a finite sample. Optimization alone
cannot tell a stable pattern from an accidental one when both reduce training
loss. Regularization states a preference: smaller weights, smoother functions,
robustness to missing units, invariance to transformations, or an earlier point
on the optimization path.

That preference can improve [Generalization](./generalization.md), especially
when data are scarce relative to model flexibility. It can also make fitting
easier numerically. But the preference can be wrong. Excessive regularization
causes underfitting, and a method that helps one architecture or data regime can
hurt another.

## Intuition

Imagine many curves passing through the observed points. Training error cannot
distinguish them. Regularization tilts the choice toward a curve with some
declared simplicity or stability property. The crucial word is “declared”:
simplicity is not absolute. A small parameter norm depends on parameterization,
and a data augmentation is valid only if its transformation should preserve the
target.

The usual bias-variance picture says regularization accepts bias to reduce
variation across samples. That picture is useful for classical estimators but
not universal for overparameterized networks. It should guide diagnosis, not be
treated as a law that validation error must follow a single U-shaped curve.

## Concrete example

Consider one-parameter regression with data loss

$$
L(w)=(w-3)^2.
$$

Without regularization, the minimizer is $w=3$. Add an $L_2$ penalty with
$\lambda=0.5$:

$$
J(w)=(w-3)^2+0.5w^2.
$$

Differentiating gives $J'(w)=2(w-3)+w=3w-6$, so the regularized minimizer is
$w=2$. Its data loss is $1$, worse than the unregularized value $0$, but its
parameter magnitude is smaller. Whether this improves future prediction depends
on the data-generating process; the arithmetic alone does not prove it.

With $\lambda=5$, the minimizer solves $2(w-3)+10w=0$, giving $w=0.5$.
The stronger penalty shrinks much more and likely underfits if $3$ reflects a
stable signal.

## Formal treatment

For $L_2$ regularization, $\Omega(\theta)=\tfrac12\|\theta\|_2^2$ and the
gradient gains $\lambda\theta$. In plain gradient descent,

$$
\theta_{t+1}
=\theta_t-\eta\left(\nabla L(\theta_t)+\lambda\theta_t\right)
=(1-\eta\lambda)\theta_t-\eta\nabla L(\theta_t),
$$

which explains the name weight decay in that setting. The equivalence depends
on the optimizer and implementation; adding a penalty to an adaptive optimizer
is not automatically identical to multiplying weights by a fixed decay factor.

$L_1$ uses $\|\theta\|_1$ and is nondifferentiable at zero, with a subgradient
or proximal update. Dropout samples a binary mask during training. Under the
inverted convention, an activation $h_j$ becomes

$$
\widetilde h_j=\frac{m_j}{q}h_j,
\qquad m_j\sim\operatorname{Bernoulli}(q),
$$

so its expectation is preserved and no corresponding random mask is used at
evaluation.

## Assumptions and requirements

A penalty assumes its preferred parameter geometry corresponds to useful
functions. That can fail when rescaling adjacent layers leaves the function
unchanged but changes their norms. Data augmentation assumes the label is
invariant, or transforms in a known matching way. Dropout assumes the architecture
and optimization can tolerate stochastic removal and that evaluation mode is
switched correctly.

Hyperparameters must be chosen without using the final test set. Early stopping
requires a validation metric and checkpointing. Penalties must specify which
parameters they cover; biases and normalization gains are often treated
differently, but that is a modeling choice rather than a universal rule.

## Uses and applicability

Use regularization when training performance continues improving while
validation performance degrades, when domain knowledge supplies valid
invariances, or when parameter control is part of the statistical model. Weight
penalties are cheap and explicit. Data augmentation is powerful when realistic
transformations are known. Early stopping is useful when later optimization
begins fitting sample-specific noise.

Do not add several regularizers reflexively. If both training and validation
loss are poor, more regularization usually attacks the wrong problem. First
check optimization, data quality, model capacity, and the match between loss and
metric.

## Limitations and common mistakes

Regularization does not create information. It cannot recover a missing feature,
correct mislabeled targets, or guarantee robustness outside the sampled
distribution. Validation improvements can be small, seed-dependent, or consumed
by repeated hyperparameter search.

Common mistakes include applying a penalty twice through both the loss and the
optimizer, using dropout during evaluation, augmenting inputs without transforming
spatial labels, calling any smaller model “regularized” without identifying the
preference, and tuning against the test set. Another is comparing methods at
different training budgets: early stopping saves updates, while another method
may simply have been allowed longer to fit.

## Variants and alternatives

Parameter methods include $L_2$, $L_1$, explicit constraints, and structured
penalties. Stochastic methods include dropout and other noise injection. Data-
level methods augment or perturb examples. Procedural methods include early
stopping and model averaging. Architectural restrictions reduce the hypothesis
class before optimization begins.

Bayesian priors provide a probabilistic interpretation of some penalties:
Gaussian and Laplace priors lead to familiar norm terms in maximum a posteriori
estimation. More data is often the best alternative because it constrains the
function using observations rather than a guessed preference. Pruning and
distillation may reduce a trained model, but compression and regularization are
not synonyms; their goals and evaluation criteria differ.

## History and attribution

Norm penalties and constrained estimation predate deep learning, while early
stopping and noise-based methods entered through several research traditions.
The registered sources do not establish a primary chronology for weight decay
or early stopping. Srivastava and coauthors' registered 2014 JMLR paper supports
the formulation, experiments, and attribution of dropout as presented there,
without implying that it originated regularization broadly.

## Sources

- Goodfellow, Bengio, and Courville support the broad taxonomy, penalties,
  early stopping, augmentation, noise injection, and deep-learning caveats.
- Srivastava and coauthors support dropout's mask-based training procedure,
  evaluation behavior, motivation, and attribution.
- Hastie, Tibshirani, and Friedman support penalized empirical risk, shrinkage,
  model selection, and validation-based assessment.

## Prerequisites and next connections

Read [Supervised Learning](./supervised-learning.md), [Generalization](./generalization.md),
and [Bias-Variance](./bias-variance.md). Loss functions explain the empirical
term being modified. Continue to batch normalization cautiously: its mini-batch
noise can have a regularizing effect, but normalization's main definition is
not “a regularizer.”
