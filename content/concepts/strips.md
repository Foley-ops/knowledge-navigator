---
concept_id: concept.planning.strips
title: STRIPS
slug: /concepts/strips
aliases:
  - Stanford Research Institute Problem Solver
  - STRIPS assumption
kind: method
tier: 1
review_state: generated-draft
summary: The planning formalism in which a world state is a set of ground atoms and an action is a precondition list plus an add list and a delete list, so applying an action is one set subtraction followed by one set union.
categories:
  - Artificial Intelligence/Symbolic AI/Planning
primary_category: Artificial Intelligence/Symbolic AI/Planning
relationships:
  - type: requires
    target: concept.logic.first_order_logic
    note: States are sets of ground atoms and operators are schemas made concrete by substituting constants for variables, so atoms, literals, substitution and grounding must be familiar before the representation reads as anything but notation.
  - type: prerequisite_of
    target: concept.planning.pddl
    note: PDDL's core fragment is this representation given a standard syntax, and its action blocks are precondition, add and delete lists written as one effect conjunction.
  - type: contrasts_with
    target: concept.planning.hierarchical_planning
    note: Hierarchical planners take a library of task decompositions as input and refine an abstract task downward, rather than chaining primitive operators forward from an initial state as STRIPS does.
  - type: contributes_to
    target: concept.symbolic_ai.knowledge_representation
    note: The STRIPS assumption is a specific and much-copied answer to the representation question of how to say what an action changes without saying what it leaves alone.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
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
    checked_on: 2026-09-18
  - source_id: source.planning_wiki.pddl
    title: The Planning Wiki — PDDL reference
    url: https://planning.wiki/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-18
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-18
unresolved_references:
  - label: Goal-Oriented Action Planning in commercial game AI
    reason: No source in the registry covers the game-AI descendants of STRIPS, so the claim that GOAP is a STRIPS derivative used in shipped games rests on nothing cited here.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

**STRIPS** describes a planning problem with four pieces: a finite vocabulary of
ground atoms, an initial state, a goal, and a set of operators. A state is a
finite set of ground atoms and nothing more; under the **closed-world
assumption** every atom not in that set is false, not unknown. Each operator
carries three lists of atoms — preconditions, a delete list and an add list — is
applicable in a state that contains its preconditions, and when applied removes
the delete list and then adds the add list. A plan is a sequence of ground
operators leading from the initial state to a state containing the goal.

The word now names the representation rather than the 1971 program it came from,
the Stanford Research Institute Problem Solver, whose preconditions were richer
formulas tested by a theorem prover.

## Why it matters

Write actions down in ordinary logic and you must also write, for every action
and every fact it does not touch, an axiom saying the fact survives: on the order
of $nm$ frame axioms for $n$ actions and $m$ fluents, every one of them something
to get wrong. This is the _frame problem_.

STRIPS replaces all of them with one convention outside the logic: whatever an
operator does not list, it does not change. That is the **STRIPS assumption**,
and the payoff is computational — action application becomes set arithmetic, so
successor states are cheap to generate, goals cheap to test, and operators cheap
to index by their add lists. GraphPlan, planning as satisfiability and heuristic
forward search are all built on that cheapness.

## Intuition

A state is a small database of true rows, and an operator is a guarded
transaction: check that these rows are present, delete those, insert these. Every
other row is untouched, and nobody has to say so.

The analogy is exact about bookkeeping and misleading about the world. Real
actions have _ramifications_ — shove a crate and whatever sits on it moves too —
and a STRIPS operator cannot derive that; it must spell the consequence out in
its own lists or the model quietly diverges from reality. The closed world adds
that the database is complete, so an absent row means false, not unrecorded.

## Concrete example

Blocks world, with `Table` a constant and two operator schemas:

```text
Move(b, x, y)
  pre: On(b, x), Clear(b), Clear(y)
  del: On(b, x), Clear(y)
  add: On(b, y), Clear(x)

MoveToTable(b, x)
  pre: On(b, x), Clear(b)
  del: On(b, x)
  add: On(b, Table), Clear(x)
```

Ground instances whose arguments are not distinct, and instances of `Move` with
$y = \texttt{Table}$, are excluded: `MoveToTable` covers moves onto the table,
which has room for any block, so no precondition ever tests `Clear(Table)`. The
same operator in PDDL, where the delete list is the negated half of one effect
conjunction:

```lisp
(:action move
  :parameters (?b ?x ?y)
  :precondition (and (on ?b ?x) (clear ?b) (clear ?y))
  :effect (and (on ?b ?y) (clear ?x)
               (not (on ?b ?x)) (not (clear ?y))))
```

Start from $s_0 = \{On(C,A),\, On(A,Table),\, On(B,Table),\, Clear(C),\,
Clear(B)\}$ with goal $g = \{On(A,B),\, On(B,C)\}$: C sits on A, B and A sit on
the table, and we want the tower A on B on C.

1. `MoveToTable(C, A)` gives $\{On(A,Table), On(B,Table), On(C,Table), Clear(A),
   Clear(B), Clear(C)\}$.
2. `Move(B, Table, C)` gives $\{On(A,Table), On(B,C), On(C,Table), Clear(A),
   Clear(B)\}$, plus $Clear(Table)$, which nothing reads.
3. `Move(A, Table, B)` gives $\{On(A,B), On(B,C), On(C,Table), Clear(A)\}$, again
   alongside $Clear(Table)$.

The goal is a subset of the final state, so this three-step plan solves the
problem. Step 1 makes neither goal atom true and is unavoidable.

## Formal treatment

A propositional STRIPS problem is a tuple $\Pi = (P, O, s_0, g)$: $P$ a finite
set of ground atoms, $s_0 \subseteq P$ the initial state, $g \subseteq P$ the
goal, and each $o \in O$ a triple $(\mathrm{pre}(o), \mathrm{add}(o),
\mathrm{del}(o))$ of subsets of $P$. Operator $o$ is applicable in $s \subseteq
P$ iff $\mathrm{pre}(o) \subseteq s$, and the result is

$$
\gamma(s, o) \;=\; \bigl(s \setminus \mathrm{del}(o)\bigr) \cup \mathrm{add}(o).
$$

Deleting before adding is a convention, and it matters when $\mathrm{add}(o) \cap
\mathrm{del}(o) \neq \emptyset$: this order leaves such an atom true, and some
formulations forbid the overlap instead. A plan solves $\Pi$ iff each of its
operators is applicable in the state its predecessors reach and $g$ is contained
in the final state.

Lifted, operators are schemas over a function-free first-order vocabulary with
finitely many constants $C$, so a schema with $k$ parameters has $|C|^k$ ground
instances. The closed-world assumption gives $s \models \neg p$ exactly when
$p \notin s$: negative goals and preconditions test for absence rather than being
classical negation.

Plan existence for the propositional problem $\Pi$ is PSPACE-complete, and so is
bounded-length plan existence. PSPACE rather than NP is the right class because a
shortest plan can be exponentially long in $|P|$, while a plan is still
verifiable by simulating it in polynomial space. Drop every delete list and the
picture collapses: states only grow, the reachable atoms are a monotone fixpoint
computable in polynomial time, and plan existence is in P. Finding a _shortest_
delete-free plan stays NP-hard,
which is why delete relaxation is the standard source of planning heuristics and
why they approximate it.

## Assumptions and requirements

The world must be deterministic, fully observed, static between the agent's
actions and changed only by that agent; actions are atomic and instantaneous.
Make outcomes stochastic and what you want is a policy over a Markov decision
process, not a sequence. Make the state partly known and the closed-world
assumption fails outright, since "not in the set" stops meaning "false";
conformant and contingent planning search belief states instead. Give actions
duration and you need temporal planning.

The vocabulary must be finite, function-free and ground after instantiation: no
arithmetic, no numeric resources, no objects created at run time. Every effect
must be listed explicitly, so indirect effects are hand-propagated into each
operator and derived predicates need an extension such as axioms or conditional
effects.

## Uses and applicability

Reach for STRIPS when the state is discrete and known, effects are certain, and
the difficulty is the combinatorics of ordering: the task layer above a geometric
motion planner, the benchmark domains planners are compared on, workflow and
service composition.
Goal-Oriented Action Planning, a STRIPS derivative, has been used for enemy
behaviour in commercial games.

Do not reach for it when the problem carries numbers, time windows, probabilities
or continuous geometry, or when the state is only partly known. If a standard
recipe already exists, a hierarchical planner exploits it while STRIPS
rediscovers it by search.

## Limitations and common mistakes

The **Sussman anomaly** is the classic demonstration that subgoals cannot be
planned one after another, and it is the example above. Take $On(A,B)$ first:
clear A by moving C off, then move A onto B — now B must go onto C, and B is
pinned under A, so the first subgoal must be undone. Take $On(B,C)$ first: move B
onto C — now A must go onto B, and A is trapped under the new tower. Neither
ordering reaches the three-step plan, which interleaves them, so planners
assuming subgoal independence, STRIPS's own goal-stack control among them,
stumble here. It is the standard small problem that punishes the assumption.

The second mistake is saying STRIPS _solves_ the frame problem; it sidesteps it.
Persistence is a property of the update function $\gamma$, not something the
representation entails — there is no frame axiom because no logic is doing the
work. In situation calculus the same persistence has to be reintroduced
explicitly, as successor-state axioms do.

Third, the closed-world assumption is a real expressive limit and not merely
economy: "either A or B is on C" and "I do not know where C is" are not STRIPS
states. Fourth, a compact domain says nothing about search size: grounding
explodes as $|C|^k$. Finally, a wrong delete list is the classic modelling bug —
the plan is valid in the model, nonsense in the world, and nothing in the
formalism can notice.

## Variants and alternatives

**ADL** relaxes the language with negative preconditions, disjunction,
quantification and conditional effects, buying expressiveness at the cost of a
harder successor computation. **PDDL** standardised the syntax and marks
fragments with requirement flags, so its `:strips` requirement names essentially
the representation here. **SAS+** replaces binary atoms with multi-valued
finite-domain variables, exposing structure that atom-level encodings hide.

For solving rather than describing: **GraphPlan** builds a layered reachability
structure and extracts a plan from it, **planning as satisfiability** compiles a
bounded horizon into a SAT instance, and **heuristic forward search** on delete
relaxations is the current default. **Partial-order planning**, which commits to
ordering only where it must, was the historical answer to the Sussman anomaly.
Further off, **hierarchical task network** planning takes decomposition methods
as input, **situation and event calculus** stay inside logic, and **Markov
decision processes** return policies under uncertainty.

## History and attribution

Richard Fikes and Nils Nilsson introduced STRIPS at SRI in 1971 as the planner
for the robot Shakey. Its control strategy was means-ends analysis, inherited
from Newell and Simon's General Problem Solver; what lasted was the add/delete
representation rather than the search. Follow-up work at SRI generalised plans
into reusable macro-operators stored in triangle tables. The frame problem it
dodges had been named by McCarthy and Hayes in 1969.

The Sussman anomaly is named for Gerald Sussman, who met it in the early 1970s
while building HACKER, a program that debugged its own plans; Earl Sacerdoti's
NOAH and the partial-order planners were the response. The complexity picture was
settled in the 1990s, principally by Bylander, and PDDL arrived with the 1998
planning competition.

## Sources

_Artificial Intelligence: A Modern Approach_ is the spine of this page: its
planning chapters carry the representation, the blocks world, the Sussman
anomaly, the PSPACE-completeness result, the delete relaxation and the history.
The Planning Wiki's PDDL reference shows how preconditions and effects are
actually written, and which requirement flags separate the STRIPS fragment. Arora and Barak is cited only for what PSPACE-completeness means;
it says nothing about planning.

## Prerequisites and next connections

Read [First-Order Logic](./first-order-logic.md) first, at least atoms, literals
and substitution: an operator schema is a first-order object, and grounding it
produces the propositional problem [Propositional Logic](./propositional-logic.md)
describes. State-space search from [Searching](./searching.md) makes the planning
algorithms a special case rather than a new subject.

From here, PDDL is the syntax you will actually write and hierarchical task
network planning the main alternative input language;
[Markov Decision Processes](./markov-decision-processes.md) are where to go when
determinism fails, and
[Computational Complexity](./computational-complexity.md) explains the PSPACE
claim.
