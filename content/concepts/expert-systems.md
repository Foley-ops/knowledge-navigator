---
concept_id: concept.symbolic_ai.expert_systems
title: Expert Systems
slug: /concepts/expert-systems
aliases:
  - rule-based expert system
kind: concept
tier: 1
review_state: generated-draft
summary: An expert system encodes a specialist's know-how as explicit if-then rules and derives conclusions by chaining them, which made its reasoning inspectable but tied its competence to how much knowledge people could write down by hand.
categories:
  - Artificial Intelligence/Symbolic AI
primary_category: Artificial Intelligence/Symbolic AI
relationships:
  - type: requires
    target: concept.symbolic_ai.knowledge_representation
    note: An expert system is a knowledge base plus an inference engine, so what it can know and conclude is bounded by the representation chosen for that knowledge.
  - type: contrasts_with
    target: concept.probability.bayesian_inference
    note: Early systems attached ad hoc certainty factors to rules, and Bayesian networks displaced them by reasoning about uncertainty with a coherent probability model.
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: An expert system's competence is written by hand from interviews with specialists, whereas a supervised model induces its behaviour from labelled examples.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
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
    checked_on: 2026-09-25
  - source_id: source.murphy2022.probabilistic_ml_intro
    title: 'Probabilistic Machine Learning: An Introduction'
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-25
unresolved_references:
  - label: Primary literature on MYCIN, R1/XCON and certainty factors
    reason: The accounts of MYCIN's evaluation, of R1/XCON at Digital Equipment Corporation, and of the probabilistic incoherence of certainty factors rest on the original reports (Buchanan and Shortliffe's MYCIN volume, McDermott on R1, Heckerman's analysis of certainty factors), none of which is in the source registry.
    sections:
      - history-and-attribution
      - limitations-and-common-mistakes
claims: []
---

## Definition

An **expert system** is a program that solves problems in a narrow specialist
domain by applying explicitly represented knowledge, usually as a set of
**production rules** of the form _if these conditions hold, then conclude or do
this_. It separates the **knowledge base**, which holds the rules and facts,
from the **inference engine**, which decides which rules to apply and in what
order, and it can usually explain a conclusion by replaying the rules that
produced it.

## Why it matters

Expert systems were among the first forms of artificial intelligence to do
commercially valuable work, and the first to show that narrow, deep knowledge beats general
cleverness on real tasks. They also produced the lesson that shaped everything
after them: the hard part is not reasoning but getting the knowledge in. That
**knowledge acquisition bottleneck** — the cost of interviewing experts and
turning their judgement into rules, then maintaining those rules — is a large
part of why the field turned toward learning knowledge from data.

## Intuition

Imagine a flowchart that no one drew. An expert says "if the engine turns over
but won't catch and the tank reads empty, it's fuel", and that sentence becomes a
rule. A few hundred such rules, each small and locally sensible, combine in ways
no single person enumerated. The inference engine is the part that notices which
rules now apply given what is known.

The analogy holds for competence inside the domain and breaks at its edge. A
human mechanic knows when a problem is outside their experience; a rule base
does not, and keeps producing confident conclusions from rules that were never
meant for the case in front of it.

## Concrete example

A toy car-fault system:

```text
R1: IF cranks = no  AND lights_dim = yes       THEN battery_weak
R2: IF battery_weak                            THEN advise(charge_battery)
R3: IF cranks = yes AND fuel_gauge = empty     THEN out_of_fuel
R4: IF out_of_fuel                             THEN advise(add_fuel)
```

Given the facts `cranks = no` and `lights_dim = yes`, **forward chaining** works
from the data: R1's conditions hold, so it fires and asserts `battery_weak`; now
R2 holds and asserts the advice; R3 and R4 never become applicable. The run
stops when no rule can add anything new.

**Backward chaining** works from a goal instead. Asked whether to
`advise(charge_battery)`, the engine finds R2, which needs `battery_weak`, which
R1 can supply if `cranks = no` and `lights_dim = yes` — and it can ask the user
for either fact it does not yet have. Asked _how_ it concluded, it replays the
chain R1 then R2; asked _why_ it wants to know about the lights, it names the
rule it is trying to use.

## Formal treatment

A rule base of propositional definite rules $p_1 \wedge \dots \wedge p_k \to q$,
together with a set of facts, determines the set of derivable facts as the least
set closed under the rules. Forward chaining computes it by repeatedly firing
rules whose premises are all known; with bookkeeping that counts each rule's
unsatisfied premises, this runs in time linear in the size of the rule base.
Backward chaining explores only the rules relevant to one goal, and is the
natural strategy for diagnosis, where the goal set is small.

Forward chaining in large production systems is dominated by matching rules
against working memory. The **Rete** algorithm makes this efficient by compiling
the rules into a network that caches partial matches, so each change to memory
touches only the rules it could affect.

To handle uncertainty, MYCIN attached a **certainty factor** in $[-1, 1]$ to each
rule and conclusion, combining two positive factors for the same conclusion as

$$
\mathrm{CF} = \mathrm{CF}_1 + \mathrm{CF}_2\,(1 - \mathrm{CF}_1),
$$

so evidence of $0.6$ and $0.5$ gives $0.8$.

## Assumptions and requirements

- **A narrow, stable domain.** The approach works when the relevant knowledge is
  bounded and does not change faster than people can update the rules.
- **Articulable expertise.** It requires that experts can state their knowledge
  as rules. Much expert skill is perceptual or tacit and resists being written
  down, which caps what can be encoded.
- **Consistency the builders maintain.** Nothing in the formalism stops two rules
  from contradicting each other; keeping a large base coherent is manual work.
- **Independence behind certainty factors.** Combining factors rule by rule only
  behaves sensibly under strong independence assumptions between the pieces of
  evidence, which real domains rarely satisfy.

## Uses and applicability

Rule-based reasoning remains the right tool where decisions must follow written
policy and be auditable: eligibility and compliance checks, tax and benefits
rules, configuration of products from compatible parts, and alerting logic. Modern
business rule engines are direct descendants. The explanation trace is often the
reason to choose this over a learned model.

Do not choose it where the knowledge is perceptual, statistical or fast-changing,
or where no one can state the rules — the conditions under which machine
learning does better.

## Limitations and common mistakes

**Brittleness at the boundary.** A rule base has no sense of the limits of its
own competence and degrades abruptly, not gracefully, on cases outside them.

**Mistaking fluency for understanding.** An explanation trace shows which rules
fired, not whether the rules were right.

**Certainty factors as probabilities.** They are not. They were later shown to
correspond to a probabilistic model only under restrictive independence
assumptions, and can produce incoherent results when evidence overlaps.

**Underestimating maintenance.** Large rule bases grew hard to change safely,
because a new rule could interact with hundreds of old ones in ways no one
foresaw.

## Variants and alternatives

- **Frame- and case-based systems** organise knowledge around prototypical
  objects or remembered past cases rather than rules.
- **Bayesian networks** replaced certainty factors with a coherent joint
  probability model factorised by a graph, reasoning correctly about dependent
  evidence.
- **Machine learning** induces the mapping from data instead of eliciting it,
  trading the explanation trace for coverage of cases no one wrote a rule
  for.
- **Knowledge graphs and ontologies** keep explicit knowledge but emphasise
  structured facts and shared vocabularies over diagnostic rules.

## History and attribution

DENDRAL, begun at Stanford in 1965 by Edward Feigenbaum, Bruce Buchanan and
Joshua Lederberg, inferred molecular structure from mass-spectrometry data and is
usually counted as the first expert system. MYCIN, developed at Stanford in the
1970s largely as Edward Shortliffe's doctoral work, recommended antibiotics for
blood infections; in evaluation its recommendations were rated comparable to
specialists', but it was never used in routine care. R1, later XCON, written by
John McDermott for Digital Equipment Corporation around 1980, configured
computer orders and was a commercial success. A boom through the 1980s was
followed by a collapse of the market late in the decade, one of the episodes
remembered as an AI winter.

## Sources

Russell and Norvig cover production systems, forward and backward chaining and
their efficiency, the Rete algorithm, certainty factors and their critique, and
the history from DENDRAL to the collapse of the market. Murphy's probabilistic
machine learning text is the reference for the graphical models that replaced
certainty factors.

## Prerequisites and next connections

Read [Knowledge Representation](./knowledge-representation.md) for what a
knowledge base can express, and [Propositional Logic](./propositional-logic.md)
for the inference that forward and backward chaining perform.

From here, [Logic Programming](./logic-programming.md) is the same rule chaining
with variables and a clean semantics, [Bayesian Inference](./bayesian-inference.md)
is how uncertainty came to be handled properly, and
[Supervised Learning](./supervised-learning.md) is the approach that replaced
hand-written knowledge in most domains.
