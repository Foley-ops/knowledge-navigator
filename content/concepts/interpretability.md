---
concept_id: concept.ai_frontiers.interpretability
title: Interpretability
slug: /concepts/interpretability
aliases:
  - explainable AI
  - XAI
kind: concept
tier: 1
review_state: generated-draft
summary: Interpretability is the degree to which people can understand why a model produces its outputs, achieved either by using models simple enough to read or by explaining complex ones after training, and every explanation method answers a narrower question than it first appears to.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: Most interpretability methods explain a trained predictor as a function from input features to outputs, so what counts as a feature and what the model was trained to predict frame every explanation.
  - type: contributes_to
    target: concept.ai_frontiers.ai_safety
    note: Understanding why a model behaves as it does is one way to find failures, biases and unintended strategies before deployment, which is why interpretability is a pillar of safety research.
  - type: contrasts_with
    target: concept.ai_frontiers.causal_inference
    note: A feature attribution describes how a model's output depends on its inputs, not how the world's outcome depends on those variables, so an important feature for the model need not be a cause of the real outcome.
sources:
  - source_id: source.molnar.interpretable_ml
    title: Interpretable Machine Learning
    url: https://christophm.github.io/interpretable-ml-book/
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
    checked_on: 2026-09-25
unresolved_references: []
claims: []
---

## Definition

**Interpretability** is the degree to which a person can understand the cause of
a model's decision, or, in a related definition, consistently predict what the
model will output. A model is **intrinsically interpretable** when its structure
can be read directly, as with a short decision tree or a sparse linear model.
**Post hoc** methods explain a model after training, and are either
**model-agnostic**, treating it as a black box to be probed, or specific to one
kind of model. Explanations are **global** when they describe the model's
overall behaviour and **local** when they explain one prediction.

## Why it matters

A model's test accuracy says nothing about how it gets there. Explanations help
debug models that exploit shortcuts, such as a classifier keying on a watermark
rather than the object; audit for bias; satisfy people and regulators who need
reasons for decisions that affect them; and build justified trust, or justified
distrust. Molnar also points to scientific use: when a model predicts well, what
it learned can be a source of knowledge about the data.

## Intuition

A linear model explains itself: each weight says how much the output moves per
unit of that feature, holding the others fixed. A deep network or a large
ensemble does not, because the effect of a feature depends on all the others.

Post hoc methods simplify. Some ask what happens to the prediction when a
feature is changed or shuffled; some fit a simple model that imitates the complex
one near one input; some divide a prediction among the features like a payout
among team members. Each simplification answers one precise question — and an
explanation is only as trustworthy as the match between that question and the
one the user thinks it answers.

## Concrete example

**Shapley values** divide a prediction among features using a rule from
cooperative game theory. Take the model $f(a, b) = 2a + 3b + ab$, an input
$(a, b) = (1, 1)$, and a baseline $(0, 0)$ that stands for "feature absent". The
prediction rises from $f(0,0) = 0$ to $f(1,1) = 6$, and the question is how much of
that rise is due to each feature.

Average each feature's contribution over the orders in which features could be
added:

```text
order a then b:  a adds f(1,0) - f(0,0) = 2    b adds f(1,1) - f(1,0) = 4
order b then a:  b adds f(0,1) - f(0,0) = 3    a adds f(1,1) - f(0,1) = 3
Shapley value:   a = (2 + 3) / 2 = 2.5         b = (4 + 3) / 2 = 3.5
```

The values sum to $6$, the whole change, and the interaction term $ab$ is split
evenly between the two features. A different baseline would give different
numbers. That is the first thing to check about any Shapley explanation.

## Formal treatment

For a set of features $F$ and a value function $v(S)$ giving the model's output
when only the features in $S$ are present, the Shapley value of feature $j$ is

$$
\phi_j = \sum_{S \subseteq F \setminus \{j\}}
\frac{|S|!\,(|F| - |S| - 1)!}{|F|!}\,
\bigl(v(S \cup \{j\}) - v(S)\bigr).
$$

It is the unique attribution satisfying **efficiency** (the values sum to
$v(F) - v(\varnothing)$), **symmetry**, **dummy** (a feature that never changes
the output gets zero) and **additivity**. In practice "absent" features are
replaced by values drawn from a background dataset, and the exponential sum is
approximated by sampling or by model-specific shortcuts.

**Permutation feature importance** measures the increase in a model's error when
one feature's values are shuffled across the data, breaking its relation to the
output. **Partial dependence** averages the prediction over the data while fixing
one feature at each value, $\hat f_j(x_j) = \frac{1}{n}\sum_i f(x_j, x^{(i)}_{-j})$.

## Assumptions and requirements

- **A meaningful notion of feature.** Explanations are stated in terms of the
  inputs; for pixels or tokens, features must be grouped into something a person
  can reason about.
- **A reference or background distribution.** Attributions compare against a
  baseline, and the choice shapes the answer.
- **Weakly dependent features,** for methods that change one feature while
  holding others fixed; with correlated features these methods evaluate the
  model on unrealistic inputs.
- **An audience and a question.** A useful explanation depends on who needs it
  and for what: a debugger, a regulator and an affected person need different
  answers.

## Uses and applicability

Use interpretable models where stakes are high and they perform comparably —
often the case for tabular data. Use permutation importance and partial
dependence for a global view of what a model relies on, Shapley values and local
surrogate models for individual predictions, and counterfactual explanations to
tell a person what would have had to differ for a different outcome. For neural
networks, gradient-based saliency and feature visualisation show what inputs
drive units and outputs.

## Limitations and common mistakes

**Reading attributions causally.** An explanation describes the model, not the
world. A model can rely on a feature that has no causal effect on the true
outcome.

**Unrealistic perturbations.** Shuffling or replacing a feature that is
correlated with others creates inputs the model never saw, and its behaviour
there may say little about its behaviour on real data.

**Unstable explanations.** Local methods can give different answers for nearly
identical inputs, or for different random seeds.

**Confirmation bias.** A plausible explanation is persuasive whether or not it
is faithful to the model; explanations should be tested, not just admired.

## Variants and alternatives

- **Interpretable models:** linear and logistic regression, decision trees and
  rules, generalised additive models.
- **Model-agnostic global methods:** permutation importance, partial dependence,
  accumulated local effects, global surrogates.
- **Model-agnostic local methods:** LIME's local surrogate models, Shapley values
  and SHAP, counterfactual explanations, anchors.
- **Neural network methods:** saliency maps, feature visualisation, concept-based
  explanations.
- **Mechanistic interpretability** reverse-engineers the internal computations of
  a network, rather than attributing outputs to inputs.

## History and attribution

Interpretable models such as linear regression and decision trees long predate
the term. Shapley values come from Lloyd Shapley's 1953 work on cooperative
games. Interest in explaining black-box models grew with complex ensembles and
deep learning in the 2010s, with LIME in 2016 and SHAP in 2017 both soon
widely used. Molnar's book, first published in 2019 and since revised,
became a standard practical reference.

## Sources

Molnar's book supplies the definitions of interpretability it cites, the
taxonomy of intrinsic and post hoc, global and local, model-specific and
model-agnostic methods, the Shapley value and its axioms, permutation importance
and partial dependence, the cautions about correlated features and causal
readings, and the history of the methods.

## Prerequisites and next connections

Read [Supervised Learning](./supervised-learning.md) for the models being
explained, and [Decision Trees](./decision-trees.md) and
[Linear Regression](./linear-regression.md) for models that are interpretable by
construction.

From here, [Mechanistic Interpretability](./mechanistic-interpretability.md)
looks inside neural networks, [Causal Inference](./causal-inference.md) explains
why attributions are not causes, and [AI Safety](./ai-safety.md) is a major reason
the field exists.
