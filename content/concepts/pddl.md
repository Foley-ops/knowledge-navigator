---
concept_id: concept.planning.pddl
title: PDDL
slug: /concepts/pddl
aliases:
  - Planning Domain Definition Language
kind: tool
tier: 1
review_state: generated-draft
summary: 'The standard input language of automated planning, which splits a task into a reusable domain of typed predicates and action schemas and a problem instance of objects, an initial state and a goal.'
categories:
  - Artificial Intelligence/Symbolic AI/Planning
primary_category: Artificial Intelligence/Symbolic AI/Planning
relationships:
  - type: generalizes
    target: concept.planning.strips
    note: The `:strips` requirement is exactly the add/delete/precondition representation of STRIPS, and every other PDDL feature is layered on top of that core.
  - type: requires
    target: concept.logic.first_order_logic
    note: Preconditions and goals are formulas in a function-free first-order fragment, so a reader who cannot read quantifiers, literals and a satisfaction relation cannot read a PDDL domain.
  - type: contributes_to
    target: concept.planning.hierarchical_planning
    note: HDDL, the language used by the hierarchical track of the planning competition, is PDDL syntax extended with task and method declarations, so hierarchical planners inherit PDDL's typing and action schemas.
  - type: specializes
    target: concept.symbolic_ai.knowledge_representation
    note: PDDL is a deliberately narrow knowledge representation formalism whose only subject matter is states, actions and goals, and which gives up most of what a general representation language offers in exchange for a groundable, searchable encoding.
sources:
  - source_id: source.planning_wiki.pddl
    title: The Planning Wiki — PDDL reference
    url: https://planning.wiki/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.plato.classical_logic
    title: 'Stanford Encyclopedia of Philosophy: Classical Logic'
    url: https://plato.stanford.edu/entries/logic-classical/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-18
unresolved_references:
  - label: Undecidability of plan existence with numeric fluents
    reason: No registry source covers the complexity of numeric planning, so the claim that plan existence becomes undecidable once unbounded numeric fluents are allowed is stated here without a citation this corpus can offer.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Compilability of ADL features into the STRIPS fragment
    reason: The results on compiling conditional effects and quantifiers away, and the size blow-up that compilation costs, are not covered by any registry source.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: LLM-to-PDDL translation pipelines
    reason: Using a language model to draft a domain or problem file and a classical planner to solve it is recent practice with no source in the registry.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

**PDDL** (the Planning Domain Definition Language) is a Lisp-style declarative
notation for classical planning tasks, written as two files. The reusable
**domain file** declares types, predicates, functions and _action schemas_ —
parameterised actions with a precondition formula and an effect formula. The
**problem file** names a domain, lists the concrete objects, gives the initial
state as a set of ground atoms, and states the goal as a formula. A
`:requirements` list in the domain declares which fragments of the language the
file uses, from `:strips` at the bottom up through `:typing`,
`:conditional-effects` and `:durative-actions`. PDDL describes problems; nothing
in it says how to search.

## Why it matters

Before 1998 every planning system had its own input format, and comparing two
planners meant reimplementing one of them. PDDL made the benchmark set a shared
artefact: the same `blocksworld` or `logistics` domain feeds a partial-order
planner, a SAT compiler and a heuristic forward-search planner, and their results
are comparable because the task was identical. That is why the International
Planning Competition could exist, and why two decades of planner progress plot on
one axis. It matters to a practitioner too: writing a domain forces the modelling
decisions into the open — what a state consists of, what changes, what cannot —
and a dozen planners can then be tried without touching the model.

## Intuition

The domain file is a rulebook, the problem file the position on the board. Chess
rules say what a bishop may do without mentioning that yours is on f1; likewise
`(move ?r - robot ?from ?to - room)` is quantified over objects, and only the
problem file knows there are two robots and four rooms.

The second picture is state-as-a-set: not a record with fields but the set of
ground atoms that happen to be true, everything else being false. An action
removes some atoms and adds others, and — the STRIPS assumption, inherited into
PDDL — every atom the effect does not mention survives untouched. The analogy
breaks here, because chess rules are read by a referee who knows the implicit
physics while a planner knows nothing you did not write. Forget to delete
`(clear ?y)` when stacking onto `?y` and the planner will build a tower on an
occupied block, returning a plan correct for the rules you gave.

## Concrete example

A three-block world. Domain:

```lisp
(define (domain blocksworld)
  (:requirements :strips :typing)
  (:types block)
  (:predicates (on ?x - block ?y - block)
               (on-table ?x - block)
               (clear ?x - block)
               (holding ?x - block)
               (arm-empty))

  (:action pick-up
    :parameters (?x - block)
    :precondition (and (clear ?x) (on-table ?x) (arm-empty))
    :effect (and (holding ?x)
                 (not (clear ?x)) (not (on-table ?x)) (not (arm-empty))))

  (:action put-down
    :parameters (?x - block)
    :precondition (holding ?x)
    :effect (and (clear ?x) (on-table ?x) (arm-empty) (not (holding ?x))))

  (:action stack
    :parameters (?x - block ?y - block)
    :precondition (and (holding ?x) (clear ?y))
    :effect (and (on ?x ?y) (clear ?x) (arm-empty)
                 (not (holding ?x)) (not (clear ?y))))

  (:action unstack
    :parameters (?x - block ?y - block)
    :precondition (and (on ?x ?y) (clear ?x) (arm-empty))
    :effect (and (holding ?x) (clear ?y)
                 (not (on ?x ?y)) (not (clear ?x)) (not (arm-empty)))))
```

Problem:

```lisp
(define (problem three-blocks)
  (:domain blocksworld)
  (:objects a b c - block)
  (:init (on-table a) (on c a) (on-table b)
         (clear c) (clear b) (arm-empty))
  (:goal (and (on a b) (on b c))))
```

The optimal plan is six actions: `unstack c a`, `put-down c`, `pick-up b`,
`stack b c`, `pick-up a`, `stack a b` — six because each block must be picked up
and set down at least once. Note what `:init` does _not_ say: nothing states that
`a` is unclear, or that `(holding a)` is false. Both follow from the closed-world
reading.

## Formal treatment

Fix finite objects $O$ and predicate symbols with arities. The ground atoms are

$$
A \;=\; \{\, p(o_1,\dots,o_k) \;:\; p \text{ a } k\text{-ary predicate},\; o_i \in O \,\},
$$

and a **state** is a subset $s \subseteq A$. Truth is closed-world: $s \models p$
iff $p \in s$ and $s \models \neg p$ iff $p \notin s$, and with no function symbols
the state space $2^{A}$ is finite. Grounding a schema with $k$ parameters over $n$
objects yields at most $n^k$ ground actions.

In the `:strips` fragment a ground action $\alpha$ carries
$\mathrm{pre}(\alpha) \subseteq A$ and not necessarily disjoint
$\mathrm{add}(\alpha), \mathrm{del}(\alpha) \subseteq A$, with

$$
\alpha \text{ applicable in } s \iff \mathrm{pre}(\alpha) \subseteq s,
\qquad
\gamma(s,\alpha) \;=\; \bigl(s \setminus \mathrm{del}(\alpha)\bigr) \cup \mathrm{add}(\alpha).
$$

Deletions apply before additions, so an atom both added and deleted ends up true;
that is a convention, not a logical necessity. A **plan** is a sequence
$\alpha_1,\dots,\alpha_n$, each $\alpha_i$ applicable in $s_{i-1}$, with
$s_i = \gamma(s_{i-1},\alpha_i)$ and $s_n \models g$; its cost $\sum_i
c(\alpha_i)$ is unit unless `:action-costs` supplies `(total-cost)` and a
`(:metric minimize ...)`. Under `:conditional-effects` the effects are guarded
pairs `(when φ ψ)` whose antecedents are evaluated in $s$, the state _before_ the
action.

Deciding plan existence for a propositional STRIPS task is PSPACE-complete, and
stays so for the ADL features, which add convenience rather than power: they
compile into the `:strips` fragment, though the compilation can enlarge the
encoding sharply. For _delete-free_ tasks existence drops to polynomial time
while bounded-cost planning stays NP-complete — the gap that founds
delete-relaxation heuristics. Allow unbounded numeric fluents and plan existence
becomes undecidable.

## Assumptions and requirements

Four assumptions buy PDDL its tractability. **Closed world**: the initial state
lists every true atom. **The STRIPS frame assumption**: nothing changes unless an
effect says so, letting a domain omit the thousands of non-effects an action has.
**Finite, fixed objects**: nothing is created or destroyed, so grounding
terminates. **Determinism and full observability**: one known successor per
action, so a plan can be a sequence rather than a policy.

Drop determinism and a sequence is the wrong output — you need a policy, and a
language such as PPDDL or RDDL, or a
[Markov Decision Process](./markov-decision-processes.md). Drop full
observability and you need contingent planning. `:requirements` is a separate
contract: a promise about which features the file uses, and a planner that does
not implement a listed one may refuse the file rather than silently mis-solve it.

## Uses and applicability

Reach for PDDL when the task is discrete, the dynamics are known and writable as
add and delete lists, and the question is which sequence of actions reaches a
goal: logistics, elevator control, observation scheduling, and the symbolic layer
of a robot's task-and-motion planner, with a geometric planner underneath
supplying feasibility. A recent use is as an output format for language models:
the model drafts domain and problem from a natural-language description, a sound
planner does the search, and the plan is verified rather than sampled.

Do not reach for it when the dynamics are stochastic or unknown, the state is
continuous, or the model would have to be learned. When the real difficulty is
scheduling under rich resource constraints, a constraint or mixed-integer
formulation usually beats a PDDL encoding.

## Limitations and common mistakes

**Uneven solver support is the first wall a reader hits.** PDDL is several
languages sharing a syntax, and no planner implements all of them. Fast Downward,
the most common research planner, handles STRIPS, typing, ADL features, derived
predicates and action costs, but not durative actions or general numeric fluents;
temporal planners such as POPF and OPTIC take durative actions and some numerics
while rejecting other things. Preferences, trajectory constraints, timed initial
literals and object fluents are each supported by a handful of systems. Declaring
a requirement does not summon an implementation, parsers differ in strictness,
and the failure mode is often a cryptic parse error, so a working domain is not
thereby portable.

**Forgetting a delete effect** — the `(clear ?y)` case above — is the classic
modelling bug: plans valid against the written model, absurd against the intended
one. A validator such as VAL catches the symptom; only rereading the effects
catches the cause. **Forgetting a requirement flag** is the classic syntax bug:
`(not ...)` in a precondition needs `:negative-preconditions`, `(= ?x ?y)` needs
`:equality`.

Two misconceptions are worth naming. PDDL is not a programming language: no
control flow, no recursion outside the derived predicates of `:derived-predicates`,
and `(:functions ...)` declares numeric fluents, not
computations. And a more expressive encoding is not a better one — conditional
effects, axioms and quantifiers weaken the delete-relaxation heuristics, so a
flatter encoding often solves instances a clever one cannot. That is an empirical
regularity about current planners, not a theorem.

## Variants and alternatives

The version line: **PDDL 1.2** (1998) with STRIPS and ADL fragments; **PDDL 2.1**
adding numeric fluents, durative actions and plan metrics; **PDDL 2.2** adding
derived predicates (axioms) and timed initial literals; **PDDL 3.0** adding
state-trajectory constraints and soft goals as preferences; **PDDL 3.1** adding
object fluents, whose value is an object rather than a number. Each buys
expressiveness and costs solver support.

Branching off: **PDDL+** adds continuous processes and events for hybrid domains;
**PPDDL** adds probabilistic effects, and **RDDL** later replaced it in
probabilistic competitions with a factored-transition style better suited to
concurrency; **MA-PDDL** adds agents; **HDDL** adds tasks and decomposition
methods for hierarchical planning.

The genuine alternatives are not dialects. **SAS+ / finite-domain
representation** replaces boolean atoms with multi-valued variables and is what
most planners translate PDDL into internally, because it makes mutual exclusion
explicit. **ANML** and **NDDL** take a timeline-and-constraint view rather than a
state-transition one, suiting resource-heavy temporal domains. Encoding an
instance directly into SAT or integer programming skips the planning language
altogether.

## History and attribution

PDDL was written in 1998 by Drew McDermott with the committee organising the
first International Planning Competition at AIPS-98, to give every entrant the
same problems in the same syntax. It was a synthesis, not an invention: the core
is the precondition, add-list and delete-list representation of STRIPS (Fikes and
Nilsson, 1971), and quantifiers and conditional effects come from Pednault's ADL
(1989). The parenthesised syntax was chosen for ease of parsing.

Later versions each answer a competition's needs: Fox and Long defined PDDL 2.1
for 2002 so temporal and numeric domains could run, Edelkamp and Hoffmann PDDL
2.2 for 2004, Gerevini and Long PDDL 3.0 for 2006 to express plan quality, and
object fluents arrived with PDDL 3.1 for 2008. That explains the language's shape
— it grew by accretion, in increments someone needed that year, which is also why
its fragments are supported so unevenly.

## Sources

The Planning Wiki is the practical reference: syntax for every construct, the
requirement flags and what they gate, version-by-version notes on what arrived
when. Russell and Norvig's planning chapters give the semantics, the complexity
of plan existence, and the language's place in the field's history. The Stanford
Encyclopedia entry on classical logic is cited only for the first-order
background the formal treatment assumes; it says nothing about PDDL.

## Prerequisites and next connections

Read [First-Order Logic](./first-order-logic.md) first, or enough to be
comfortable with predicates, ground atoms and quantifiers; a PDDL precondition is
a formula and nothing else. The STRIPS representation is the other prerequisite
in spirit, and is what `:strips` names.

Then two directions. Into algorithms: a grounded task is a state-space search
problem, so [Searching](./searching.md) and heuristic search are what solve it,
and [Computational Complexity](./computational-complexity.md) explains why
PSPACE-completeness is a ceiling rather than some planner's defect. Into
modelling: hierarchical planning changes the input from a goal formula to a task
network, and [Markov Decision Processes](./markov-decision-processes.md) show
what this domain becomes once actions stop being deterministic.
