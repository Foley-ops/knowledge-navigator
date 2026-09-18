---
concept_id: concept.machine_learning.conditional_random_fields
title: Conditional Random Fields
slug: /concepts/conditional-random-fields
aliases:
  - CRFs
kind: method
tier: 1
review_state: generated-draft
summary: A conditional random field is an undirected graphical model that directly normalizes a conditional distribution over structured outputs given observed inputs.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: CRFs define normalized conditional distributions and use marginalization, expectations, and log-likelihood.
  - type: contrasts_with
    target: concept.machine_learning.hidden_markov_models
    note: A CRF conditions on the complete observed input and need not model its distribution, while an HMM specifies a joint generative model.
  - type: generalizes
    target: concept.machine_learning.logistic_regression
    note: Logistic regression is the unstructured single-output conditional log-linear case; CRFs add dependencies among multiple outputs.
  - type: contrasts_with
    target: concept.machine_learning.bayesian_networks
    note: CRFs use undirected factors and one input-dependent global normalizer rather than locally normalized directed conditionals for a joint distribution.
sources:
  - source_id: source.sutton2010.crf_tutorial
    title: An Introduction to Conditional Random Fields
    url: https://arxiv.org/abs/1011.4088
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
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **conditional random field** (**CRF**) is an undirected probabilistic model
for a structured output $Y$ conditioned on an observed input $X$. It represents
$p(y\mid x)$ with factors over parts of $y$ and features of the complete $x$,
then uses an input-dependent partition function to normalize over all possible
output structures.

The familiar **linear-chain CRF** predicts a label sequence whose neighboring
labels interact. Unlike a [Hidden Markov Model](./hidden-markov-models.md), it
does not need to specify how the observation sequence itself was generated.

## Why it matters

Independent classification discards constraints between output decisions. In a
sentence, the likely label of one token depends on neighboring labels; in a
biological sequence, adjacent annotations obey transition patterns. A CRF scores
the whole output jointly, allowing inference to trade local evidence against
structural consistency.

Because the model is conditional, features may inspect overlapping, long-range,
and correlated properties of the input without asserting that those properties
are conditionally independent. This avoids the generative feature restrictions
that make an HMM compact but often unrealistic, while retaining exact dynamic
programming for a linear chain.

## Intuition

Imagine every possible label sequence entering a contest. Local features award
points when a label matches an observation; transition features award points
when adjacent labels form a plausible pair. Exponentiating the total score makes
it positive, and dividing by the sum of exponentiated scores over every sequence
turns scores into probabilities.

The global contest matters. A locally normalized sequence classifier can prefer
states with fewer outgoing choices regardless of later evidence, a phenomenon
known as label bias. A CRF normalizes complete structures together, although it
still cannot repair missing features or an unsuitable graph.

## Concrete example

Consider a length-two binary label sequence $y_t\in\{0,1\}$. For a fixed input,
suppose local evidence contributes $1$ each time $y_t=1$, and a transition
feature contributes $0.5$ when $y_1=y_2$. With unit weights, the four sequence
scores are

$$
s(00)=0+0+0.5=0.5,\qquad s(01)=0+1+0=1,
$$

$$
s(10)=1+0+0=1,\qquad s(11)=1+1+0.5=2.5.
$$

The partition function is

$$
Z=e^{0.5}+e^1+e^1+e^{2.5}\approx19.267.
$$

Therefore $p(11\mid x)=e^{2.5}/Z\approx0.632$, while each mixed sequence has
probability $e/Z\approx0.141$. The most probable path is $11$, but the marginal
probability that the first label equals one is
$p(10\mid x)+p(11\mid x)\approx0.773$. Path decoding and marginal prediction
are related but different questions.

## Formal treatment

For a factor graph with factors $\Psi_a$, a CRF has form

$$
p(y\mid x)=\frac{1}{Z(x)}\prod_a\Psi_a(y_a,x),
\qquad
Z(x)=\sum_{y'}\prod_a\Psi_a(y'_a,x).
$$

In a log-linear linear-chain model,

$$
p(y\mid x)=\frac{1}{Z(x)}
\exp\left(
\sum_{t=1}^{T}\sum_k\theta_k f_k(y_{t-1},y_t,x,t)
\right).
$$

Forward-backward message passing computes $Z(x)$ and node or edge marginals;
Viterbi-style max-product decoding finds a maximum-probability label sequence.
For supervised examples $(x^{(i)},y^{(i)})$, regularized conditional
log-likelihood training compares empirical feature counts with their expectations
under the model. Its gradient requires inference for each training sequence.

With $K$ labels and dense adjacent-label interactions, linear-chain inference
costs $O(TK^2)$. General graph structures may make exact partition functions and
marginals intractable.

## Assumptions and requirements

The factor graph must express the output dependencies relevant to the task, and
features must be available at prediction time. Exact linear-chain inference
assumes that factors decompose along that chain. Training requires labeled
structures and regularization, because a large correlated feature inventory can
overfit even though correlated inputs are legally represented.

The label set, tokenization or segmentation, boundary states, and treatment of
unknown input values must be fixed consistently. Numerical implementations use
log-space or scaling to avoid overflow and underflow. If neural features are
trained jointly, the overall objective may no longer retain the convexity of a
fixed-feature linear-chain CRF.

## Uses and applicability

Linear-chain CRFs suit sequence labeling problems such as named-entity
recognition, part-of-speech tagging, and biological annotation when neighboring
labels matter and rich observed features are available. Other graph structures
can express grids, trees, or general relational outputs when their inference
cost is acceptable.

Use a CRF when calibrated structured uncertainty or constrained joint decoding
matters. If labels are effectively independent, ordinary
[Logistic Regression](./logistic-regression.md) may be simpler. If a complete
generative story and simulation of observations are important, an HMM or another
joint model may be more appropriate.

## Limitations and common mistakes

Computing the partition function can be expensive or intractable outside simple
graphs. Feature engineering, labeling cost, and regularization remain central.
A linear-chain dependency only captures adjacent output interactions directly;
it does not automatically supply arbitrary long-range reasoning.

Common mistakes include confusing marginally most likely labels with the most
likely complete path, omitting the partition function during training, using
test-set labels to design features, evaluating tokens while ignoring sequence-
level failures, and assuming that “conditional” means the model is immune to
dataset shift. A CRF conditions on observed $x$; it does not model whether a new
$x$ resembles the training distribution.

## Variants and alternatives

Linear-chain, skip-chain, factorial, and general-graph CRFs vary the dependency
structure and inference burden. Semi-Markov CRFs score labeled segments rather
than individual positions. Detailed guarantees for those extensions should be
checked against sources beyond this concise treatment.
[Hidden Markov Models](./hidden-markov-models.md) provide a generative baseline;
independent logistic models omit output coupling; recurrent and transformer
encoders can produce rich features, sometimes followed by a CRF decoding layer.

## History and attribution

The registered tutorial by Charles Sutton and Andrew McCallum credits John
Lafferty, Andrew McCallum, and Fernando Pereira with introducing conditional
random fields in 2001, and situates them relative to maximum-entropy Markov
models and generative sequence models. This page relies on that documented
secondary account rather than claiming independent verification of priority.

## Sources

- Sutton and McCallum's tutorial supports the definition, log-linear and factor-
  graph forms, feature flexibility, label-bias motivation, inference, training,
  applications, variants, and historical account.
- Murphy's _Probabilistic Machine Learning_ supports the graphical-model,
  message-passing, normalization, and model-comparison framework used here.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md),
[Logistic Regression](./logistic-regression.md), and
[Bayesian Networks](./bayesian-networks.md) for conditional distributions and
graphical structure. Compare [Hidden Markov Models](./hidden-markov-models.md)
to understand the trade between joint generative modeling and conditional
structured prediction.
