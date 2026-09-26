---
concept_id: concept.ai_frontiers.causal_inference
title: Causal Inference
slug: /concepts/causal-inference
aliases:
  - causal reasoning
kind: concept
tier: 1
review_state: generated-draft
summary: Causal inference asks what would happen under an intervention rather than what goes with what, and it can answer from observational data only by adding assumptions about how the data were generated, stated as a causal graph or as conditions on potential outcomes.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: requires
    target: concept.machine_learning.bayesian_networks
    note: A causal graph is a Bayesian network whose arrows are read as direct causal influence, and reading off which variables to adjust for relies on the same d-separation criterion.
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: Supervised learning predicts an outcome from features under the distribution it was trained on, while causal inference predicts what happens when that distribution is changed by an intervention, which the same data do not determine without further assumptions.
  - type: requires
    target: concept.probability.probability_theory
    note: Causal effects are defined as differences between probability distributions under different interventions, and identification results are identities between conditional probabilities.
sources:
  - source_id: source.pearl.causality
    title: 'Judea Pearl, Causality: Models, Reasoning and Inference'
    url: https://bayes.cs.ucla.edu/BOOK-2K/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.hernan_robins.causal_inference_what_if
    title: 'Causal Inference: What If'
    url: https://miguelhernan.org/whatifbook
    source_kind: authoritative-secondary
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Causal methods in machine learning (off-policy evaluation from logged decisions, invariant prediction under distribution shift)
    reason: The machine-learning applications named under Uses — learning from logged decisions and models meant to stay correct under distribution shift — come from machine-learning literature not in the source registry; Pearl and Hernán and Robins cover the epidemiological, economic and path-specific uses.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

**Causal inference** is the study of how to learn the effects of interventions:
what would happen to an outcome if we made a variable take a value, rather than
merely observed that it did. The central quantity is a **causal effect**, such as
the difference in recovery rates if everyone were treated versus if no one were.
Because each individual is seen under only one treatment, causal effects are
never directly observed. They are **identified** from data only under
assumptions about how the data arose, expressed as a **causal graph** or as
conditions on **potential outcomes**.

## Why it matters

Most questions that matter for decisions are causal. Will this drug help? Will
this policy reduce unemployment? Will changing this feature change a model's
output? Prediction from correlation cannot answer them, since the same
association can come from a cause, a common cause, or selection. Machine learning
systems that act, recommend or explain inherit this gap: a model that predicts
well can still be wrong about what happens when someone intervenes on its
inputs. Pearl argues that reasoning about interventions and counterfactuals needs
concepts, and notation, that probability alone does not supply.

## Intuition

Ice-cream sales and drownings rise together, but banning ice cream would not
prevent drownings; hot weather drives both. That is **confounding**: a common
cause produces an association that is not an effect. Observing people who ate
ice cream is not the same as making people eat it.

A randomised experiment breaks confounding by deciding treatment by coin flip,
so nothing about a person influences what they receive. Causal inference from
observational data tries to recover what the experiment would have shown, by
measuring the confounders and comparing like with like. Whether that works
depends on having measured the right variables, which the data cannot confirm.

## Concrete example

Two treatments for a condition that is either mild or severe, with the number
recovered out of the number treated:

```text
                 mild            severe          overall
treatment A      8 / 10 = 0.80   50 / 90 = 0.56  58 / 100 = 0.58
treatment B     70 / 90 = 0.78    5 / 10 = 0.50  75 / 100 = 0.75
```

A does better within each severity group yet worse overall — **Simpson's
paradox**. Doctors gave A mostly to severe cases, which recover less whatever the
treatment. If severity affects both the choice of treatment and recovery, it is
a confounder, and the effect of forcing everyone onto a treatment is the
average over the severity distribution of all 200 patients, half mild and half
severe:

$$
P(\text{recover} \mid do(A)) = 0.80 \cdot 0.5 + 0.556 \cdot 0.5 \approx 0.678,
\qquad
P(\text{recover} \mid do(B)) = 0.778 \cdot 0.5 + 0.50 \cdot 0.5 \approx 0.639.
$$

A is better. But if the grouping variable had instead been caused by the
treatment — a side effect, say — adjusting for it would be wrong and the overall
figures would be the right ones. The numbers alone do not say which; the causal
structure does.

## Formal treatment

In the **potential outcomes** framework, each unit has an outcome $Y^{a}$ for
each treatment value $a$. The average causal effect is
$\mathbb{E}[Y^{a=1}] - \mathbb{E}[Y^{a=0}]$. It is identified from observational
data under three conditions: **consistency**, $Y = Y^{a}$ for units that received
$a$; **conditional exchangeability**, $Y^{a} \perp A \mid L$ for measured
covariates $L$; and **positivity**, $P(A = a \mid L = l) > 0$ wherever
$P(L = l) > 0$. Then the **standardisation**, or g-formula, gives

$$
\mathbb{E}[Y^{a}] = \sum_{l} \mathbb{E}[Y \mid A = a, L = l]\; P(L = l).
$$

In Pearl's framework, a **structural causal model** assigns each variable a
function of its parents in a directed acyclic graph and a noise term; in the
simplest, Markovian case the noise terms are independent. The intervention $do(A = a)$ replaces $A$'s function by the constant $a$.
The **back-door criterion** says that if a set $L$ contains no descendant of $A$
and blocks every path from $A$ to $Y$ that starts with an arrow into $A$, then
$P(y \mid do(a)) = \sum_l P(y \mid a, l)\,P(l)$ — the same formula. The
**do-calculus** gives three rules that decide identification in general.

## Assumptions and requirements

- **No unmeasured confounding.** Every common cause of treatment and outcome must
  be measured and adjusted for, or blocked; this cannot be tested from the data
  alone.
- **Positivity.** Each kind of unit must have some chance of receiving each
  treatment; otherwise the comparison has nothing to compare.
- **Well-defined interventions.** "The effect of obesity" is ambiguous until it
  is said how obesity would be changed; consistency needs a precise treatment.
- **A correct causal structure.** Adjusting for the wrong variables — a
  mediator, or a collider — can create bias rather than remove it.

## Uses and applicability

Causal inference is used in epidemiology and medicine to estimate treatment
effects from records, in economics and policy evaluation, in online experiments
and their analysis, and increasingly in machine learning: for learning from
logged decisions, for fairness analyses that ask whether an attribute affects an
outcome through particular paths, and for models meant to stay correct when the
data distribution shifts. Hernán and Robins frame observational analyses as
attempts to emulate a **target trial** that would answer the question directly.

## Limitations and common mistakes

**Adjusting for everything.** Conditioning on a collider — a common effect of two
variables — creates an association between them; adding more covariates is not
automatically safer.

**Adjusting for a mediator.** Controlling for a variable on the causal path
removes part of the effect being estimated.

**Treating model fit as causal evidence.** A model that predicts the outcome
well says nothing about whether its coefficients are causal effects.

**Ignoring time.** Treatments that vary over time with confounders affected by
earlier treatment need g-methods; standard regression adjustment is biased even
when every confounder is measured.

## Variants and alternatives

- **Randomised experiments** remove confounding by design and are the benchmark
  that observational analyses try to emulate.
- **Inverse probability weighting and g-estimation** are the other g-methods
  besides standardisation, suited to time-varying treatments.
- **Instrumental variables** use a variable that affects treatment, affects the
  outcome only through treatment and shares no causes with the outcome, to
  handle some unmeasured confounding.
- **Causal discovery** tries to infer the graph itself from data, under
  assumptions such as faithfulness.
- **Counterfactual reasoning** asks what would have happened to a specific unit,
  the level above interventions in Pearl's hierarchy.

## History and attribution

Sewall Wright's path analysis in the 1920s drew causal diagrams for genetics.
Jerzy Neyman introduced potential outcomes for agricultural experiments in 1923,
and Ronald Fisher established randomisation. Donald Rubin extended potential
outcomes to observational studies in the 1970s, and James Robins developed
g-methods for time-varying treatments from 1986. Judea Pearl developed causal
graphs, the do-operator and the do-calculus in the 1990s, set out in his 2000
book.

## Sources

Pearl's book defines structural causal models, interventions and
counterfactuals, the back-door criterion and the do-calculus, argues why
causation needs its own language, and traces the history. Hernán and Robins set
out potential outcomes, identifiability conditions, standardisation, inverse
probability weighting and g-methods, the target trial, and the common errors of
adjustment.

## Prerequisites and next connections

Read [Bayesian Networks](./bayesian-networks.md) for directed graphs and
d-separation, and [Probability Theory](./probability-theory.md) for conditional
probability.

From here, [Interpretability](./interpretability.md) asks causal questions of
models themselves, and [Recommender Systems](./recommender-systems.md) is a
setting where the system's own decisions confound the data it learns from.
