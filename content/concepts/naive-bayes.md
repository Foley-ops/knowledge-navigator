---
concept_id: concept.machine_learning.naive_bayes
title: Naive Bayes
slug: /concepts/naive-bayes
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: Naive Bayes classifies by applying Bayes' rule under a conditional-independence assumption that factorizes a high-dimensional class likelihood into simple feature-wise terms.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: The classifier is a direct application of conditional probability, product rules, and Bayes' rule.
  - type: contributes_to
    target: concept.learning.supervised_learning
    note: Class priors and class-conditional feature distributions are estimated from labeled examples for supervised classification.
  - type: contrasts_with
    target: concept.machine_learning.logistic_regression
    note: Naive Bayes models class-conditional feature distributions and derives the posterior, whereas logistic regression models the posterior class odds directly.
  - type: useful_when
    target: concept.probability.high_dimensional_statistics
    note: Its strong factorization greatly reduces the number of parameters in sparse high-dimensional problems, at the cost of misspecification.
sources:
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
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
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary historical sources for the naive Bayes classifier
    reason: The registered sources support the modern probabilistic treatment but not a reliable priority history, so this page avoids names and dates.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Naive Bayes** is a family of probabilistic classifiers that combines a class
prior with feature likelihoods using Bayes' rule. Its defining approximation is
that features $X_1,\ldots,X_d$ are conditionally independent given the class
$Y$:

$$
p(x\mid Y=c)=\prod_{j=1}^d p(x_j\mid Y=c).
$$

The predicted class maximizes
$p(Y=c)\prod_jp(x_j\mid Y=c)$. “Naive” describes the factorization, not the use
of Bayes' rule, and does not mean the observed features are marginally
independent.

## Why it matters

Without factorization, a binary model over $d$ features needs a probability for
every one of $2^d$ feature configurations per class. Naive Bayes needs only a
small number of parameters per feature and class. That reduction makes fitting
fast and statistically possible even when the vocabulary or feature count is
large relative to the number of labeled examples.

The model is also transparent: a prediction is a prior plus a sum of feature
log-evidence. This makes it a useful baseline and a diagnostic for whether a
complex model gains anything beyond independent feature contributions.

## Intuition

Begin with prior odds, then let every observed feature multiply those odds by a
likelihood ratio. A word common in spam but rare in ordinary mail pushes the
odds toward spam; an ordinary word pushes them back. In log space, multiplying
evidence becomes adding evidence.

The picture breaks when features repeat the same information. Two near-duplicate
signals are counted as two independent pieces of evidence even though observing
one makes the other unsurprising. The resulting class can still be correct, but
the posterior is often much more confident than the evidence warrants.

## Concrete example

Suppose $P(S)=0.25$ for spam and $P(H)=0.75$ for ham. Two binary features record
whether a message contains “offer” ($O$) and “meeting” ($M$):

$$
P(O=1\mid S)=0.8,\quad P(M=1\mid S)=0.1,
$$

$$
P(O=1\mid H)=0.1,\quad P(M=1\mid H)=0.6.
$$

For a message containing “offer” but not “meeting”, the unnormalized scores are

$$
s_S=0.25(0.8)(1-0.1)=0.18,
$$

$$
s_H=0.75(0.1)(1-0.6)=0.03.
$$

Normalizing gives $P(S\mid O=1,M=0)=0.18/(0.18+0.03)=6/7\approx0.857$,
so the predicted class is spam. Equivalently, prior odds $1:3$ are multiplied by
likelihood ratios $0.8/0.1=8$ and $0.9/0.4=2.25$, producing posterior odds
$6:1$. Both calculations agree and expose each feature's contribution.

## Formal treatment

For classes $c\in\{1,\ldots,K\}$, define priors $\pi_c=P(Y=c)$ and feature
models $p_j(x_j\mid c)$. Then

$$
P(Y=c\mid x)=
\frac{\pi_c\prod_jp_j(x_j\mid c)}
 {\sum_{k=1}^K\pi_k\prod_jp_j(x_j\mid k)}.
$$

Classification needs only the numerator. Implement it as

$$
\hat y=\arg\max_c\left[\log\pi_c+
\sum_j\log p_j(x_j\mid c)\right]
$$

to avoid numerical underflow. Bernoulli naive Bayes models binary presence;
multinomial naive Bayes models counts with class-specific category
probabilities; Gaussian naive Bayes gives each continuous feature a univariate
Gaussian within each class.

For a categorical feature with $V$ values, additive smoothing estimates
$P(X_j=v\mid c)=(N_{jvc}+\alpha)/(N_c+\alpha V)$. With $\alpha>0$, an unseen
feature value does not make the entire class likelihood zero.

## Assumptions and requirements

The formal model assumes conditional independence given the class and that each
chosen feature likelihood family is appropriate. Gaussian variants additionally
assume a single univariate Gaussian per feature and class. These assumptions
need not be literally true for useful classification, but violations invalidate
the posterior as a faithful probability model.

Training and deployment must use the same tokenization, units, missing-value
handling, and category vocabulary. Class priors must match the intended
population or be adjusted when sampling changes them. Smoothing strength is a
hyperparameter and belongs inside the validation process.

## Uses and applicability

Naive Bayes is well suited to sparse count or binary features, quick text
baselines, small labeled datasets, and settings where very cheap incremental
updates matter. It is useful when a compact generative model is valuable and
the ranking or class decision matters more than calibrated probabilities.

Avoid it when interactions are the signal—for example, when two harmless
features become predictive only jointly—or when strong redundancy makes
probability quality essential. A discriminative model can be preferable once
enough labeled data are available.

## Limitations and common mistakes

Correlated features are double-counted, continuous likelihoods can be badly
misspecified, and probability estimates are often overconfident. Zero counts
without smoothing can annihilate a class score. Multiplying many probabilities
in ordinary floating-point arithmetic underflows, so log probabilities are not
an optional implementation refinement.

Common mistakes include estimating preprocessing statistics before splitting,
using multinomial likelihoods on negative feature values, ignoring class-prior
shift, and calling the model “Bayesian” evidence that all uncertainty has been
integrated. Standard parameter estimates are commonly point estimates; the
name refers to Bayes' rule in prediction.

## Variants and alternatives

Bernoulli, multinomial, categorical, and Gaussian variants differ in their
feature likelihoods. Complement naive Bayes modifies count estimates for
imbalanced text classification. Logistic regression uses the same additive
shape in log-odds for common naive Bayes families but estimates the conditional
boundary directly. Bayesian networks relax the full conditional-independence
assumption by encoding a structured dependency graph.

## History and attribution

The registered sources give modern derivations and applications but do not
establish a primary-source chronology for the classifier. This draft therefore
does not assign a single inventor or date. Any such attribution should be added
only after a primary historical source enters the registry.

## Sources

- _Probabilistic Machine Learning_ supports the generative-classifier
  formulation, likelihood families, smoothing, and practical trade-offs.
- MacKay's _Information Theory, Inference, and Learning Algorithms_ supports the
  Bayesian odds view, factorization, and warnings about probabilistic modeling.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) for conditional probability
and Bayes' rule, then [Supervised Learning](./supervised-learning.md) for model
selection. Compare [Logistic Regression](./logistic-regression.md), which models
conditional class odds without specifying a distribution for every feature.
[High-Dimensional Statistics](./high-dimensional-statistics.md) gives broader
context for why drastic parameter reduction can be valuable.
