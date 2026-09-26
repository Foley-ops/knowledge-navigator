---
concept_id: concept.ai_frontiers.fuzzy_logic
title: Fuzzy Logic
slug: /concepts/fuzzy-logic
kind: concept
tier: 1
review_state: generated-draft
summary: Fuzzy logic lets propositions be true to a degree between 0 and 1, so vague predicates such as warm or tall can be reasoned with; it models vagueness, not uncertainty, and underlies both a family of many-valued logics and a widely used style of rule-based control.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: generalizes
    target: concept.logic.propositional_logic
    note: Fuzzy connectives are defined on the whole interval from 0 to 1, and restricted to the values 0 and 1 the standard ones agree with the classical truth tables, so classical propositional logic is the special case with crisp truth values.
  - type: contrasts_with
    target: concept.probability.probability_theory
    note: A probability measures uncertainty about a proposition that is either true or false, while a fuzzy truth degree measures how far a vague proposition is true, and fuzzy connectives are truth-functional where probabilities of compound events are not.
  - type: contributes_to
    target: concept.applications.control
    note: Fuzzy controllers encode an operator's rules of thumb, such as turning the fan up when it is warm, and blend them smoothly, which made them a practical way to build controllers without a precise model of the system.
sources:
  - source_id: source.plato.fuzzy_logic
    title: 'Stanford Encyclopedia of Philosophy: Fuzzy Logic'
    url: https://plato.stanford.edu/entries/logic-fuzzy/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - concrete-example
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-25
unresolved_references:
  - label: Primary fuzzy literature (Zadeh's Fuzzy Sets, Mamdani and Assilian's fuzzy controller, Hájek's Metamathematics of Fuzzy Logic)
    reason: Zadeh's 1965 paper, the first fuzzy logic controller, and Hájek's monograph on t-norm based logics are described from the wider literature and the encyclopedia entry; they are not themselves in the source registry.
    sections:
      - concrete-example
      - history-and-attribution
claims: []
---

## Definition

**Fuzzy logic** is logic in which propositions take **truth degrees** in the
interval $[0, 1]$ rather than only true or false. It is built on **fuzzy sets**,
where each element belongs to a set to a degree given by a **membership
function**: a temperature of 20°C might be warm to degree 0.7. The term covers two
things. In the narrow sense it is a family of formal many-valued logics, with
connectives, axioms and proof systems. In the broad sense it is an engineering
practice of reasoning with vague rules, most famously in fuzzy control.

## Why it matters

Many useful concepts have no sharp boundary. There is no temperature at which a
room becomes warm and no height at which a person becomes tall; forcing a
threshold makes 21.9°C and 22.1°C opposites. Fuzzy logic gives vague predicates a
precise treatment, so rules written in everyday terms can be computed with. That
made it popular for controllers in appliances and industrial systems, where an
expert's rules of thumb were easier to write down than a model of the physics.

## Intuition

Classical sets have a hard edge: an element is in or out. A fuzzy set has a
ramp. The set of warm temperatures might have membership 0 below 15°C, rising
steadily to 1 at 22°C and above. A reading of 20°C is then mostly warm and a
little not warm.

That degree is not a probability. Nobody is uncertain about the temperature; it
is exactly 20°C. The vagueness lives in the word "warm". Probability answers
"how likely is it that this crisp statement is true?", while fuzzy logic answers
"to what degree is this vague statement true?" The two can be combined, but they
are not substitutes.

## Concrete example

A fan controller has two rules: if it is **cool**, run the fan at 30%; if it is
**warm**, run it at 80%. Let warm ramp linearly from 0 at 15°C to 1 at 22°C, and
let cool be its complement.

At 20°C, warm holds to degree $(20 - 15)/(22 - 15) = 5/7 \approx 0.714$ and cool
to $1 - 5/7 = 2/7 \approx 0.286$. Both rules fire, each to its degree, and a
weighted average combines their outputs:

$$
\text{fan} = \frac{\tfrac{2}{7}\cdot 30 + \tfrac{5}{7}\cdot 80}{\tfrac{2}{7} + \tfrac{5}{7}} \approx 65.7\%.
$$

As the temperature rises the fan speeds up smoothly instead of jumping from 30%
to 80% at a threshold. This weighted average of constant outputs is the simplest
**defuzzification**; controllers with fuzzy output sets usually take a centroid
instead.

## Formal treatment

In t-norm based fuzzy logics, conjunction is interpreted by a **t-norm**: a
function $T : [0,1]^2 \to [0,1]$ that is commutative, associative, monotone in
each argument, and has 1 as identity. The three fundamental continuous t-norms
are

$$
T_{\text{Ł}}(x, y) = \max(0,\; x + y - 1), \qquad
T_{\text{G}}(x, y) = \min(x, y), \qquad
T_{\Pi}(x, y) = x\,y ,
$$

giving Łukasiewicz, Gödel and product logic. Implication is the **residuum** of
the t-norm, $x \Rightarrow y = \max\{z : T(x, z) \le y\}$, which for Łukasiewicz
logic is $\min(1,\; 1 - x + y)$. Negation is $x \Rightarrow 0$, which for
Łukasiewicz logic is $1 - x$.

With $x = 0.6$ and $y = 0.4$, the conjunction is $0$ under Łukasiewicz, $0.4$
under Gödel and $0.24$ under product, and Łukasiewicz implication gives
$x \Rightarrow y = 0.8$. The choice of t-norm is a modelling decision, not a
fact about vagueness. On the values 0 and 1 all three agree with the classical
truth table.

## Assumptions and requirements

- **Membership functions.** Every vague predicate needs a membership function,
  and its shape is a design choice, usually made by an expert or tuned to data.
- **A choice of connectives.** Different t-norms give different logics with
  different valid laws; results depend on which is used.
- **Truth-functionality.** The degree of a compound depends only on the degrees
  of its parts. This is what makes fuzzy logic computable, and also what makes
  it unsuited to modelling uncertainty.
- **Meaningful degrees.** Numbers such as 0.7 are only useful if they are used
  consistently; they are orderings more than measurements.

## Uses and applicability

Fuzzy control has been used in consumer appliances, camera autofocus, vehicle
transmissions, and industrial and transport control, where rules of thumb are
available and a smooth, interpretable controller is wanted. Fuzzy sets are used
in decision support, fuzzy clustering, where each point belongs partly to
several clusters, and database queries with vague conditions. For reasoning
under uncertainty about crisp facts, probability is the right tool instead.

## Limitations and common mistakes

**Treating degrees as probabilities.** Russell and Norvig point out that fuzzy
logic addresses vagueness rather than uncertainty. Truth-functional connectives
cannot respect correlations between propositions the way probabilities must.

**Expecting classical laws.** With a truth degree of 0.5 and Zadeh's original
operations — minimum, maximum and $1 - x$ — $A \wedge \neg A$ is $0.5$, not 0,
and $A \vee \neg A$ is $0.5$, not 1. Under Łukasiewicz's strong conjunction and
disjunction the same two formulas get 0 and 1. Which classical laws survive depends on the logic
chosen.

**Arbitrary membership functions.** Results can hinge on ramp endpoints that were
chosen by hand without justification.

**Rule explosion.** With several inputs each split into several fuzzy sets, the
number of rules grows multiplicatively.

## Variants and alternatives

- **Łukasiewicz, Gödel and product logics** are the three fundamental t-norm
  logics; Hájek's basic logic captures what is common to all continuous t-norms.
- **Mamdani controllers** use fuzzy output sets and centroid defuzzification;
  **Takagi–Sugeno controllers** use functions of the inputs as rule outputs.
- **Probability theory and Bayesian networks** handle uncertainty about crisp
  facts.
- **Supervaluationism and epistemic accounts** are philosophical alternatives
  for vagueness that keep classical logic.

## History and attribution

Jan Łukasiewicz developed many-valued logics in the 1920s. Lotfi Zadeh introduced
fuzzy sets in 1965. Ebrahim Mamdani and Sedrak Assilian built the first fuzzy
controller, for a laboratory steam engine, reported in 1974 and 1975, and fuzzy
control spread widely in
Japanese industry in the 1980s and 1990s. Petr Hájek's 1998 monograph gave
t-norm based fuzzy logic a systematic mathematical foundation.

## Sources

The Stanford Encyclopedia entry distinguishes fuzzy logic in the narrow and broad
senses, defines t-norms, residua and the fundamental fuzzy logics, discusses
their proof theory, and gives the history from Łukasiewicz and Zadeh to Hájek.
Russell and Norvig discuss fuzzy sets and fuzzy control and argue that fuzzy
logic addresses vagueness rather than uncertainty.

## Prerequisites and next connections

Read [Propositional Logic](./propositional-logic.md) for the classical logic
fuzzy logic extends, and [Probability Theory](./probability-theory.md) for the
different notion it is often confused with.

From here, [Control](./control.md) is the field where fuzzy methods found their
biggest practical use, and [Expert Systems](./expert-systems.md) shows the
rule-based tradition fuzzy rules grew alongside.
