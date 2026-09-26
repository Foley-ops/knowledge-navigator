---
concept_id: concept.symbolic_ai.logic_programming
title: Logic Programming
slug: /concepts/logic-programming
kind: concept
tier: 1
review_state: generated-draft
summary: Logic programming writes a program as a set of logical sentences and runs it by proof search, so that asking a question means asking the system to prove it and every answer is a substitution that makes the proof go through.
categories:
  - Artificial Intelligence/Symbolic AI
  - Programming/Languages/Paradigms
primary_category: Artificial Intelligence/Symbolic AI
relationships:
  - type: requires
    target: concept.logic.first_order_logic
    note: A logic program is a set of Horn clauses, which are a fragment of first-order logic, and its answers are defined by first-order entailment.
  - type: contrasts_with
    target: concept.paradigms.functional_programming
    note: Both are declarative, but a functional program computes a value by evaluating expressions while a logic program searches for bindings that make a relation hold, so one query can run forwards or backwards.
  - type: contributes_to
    target: concept.symbolic_ai.expert_systems
    note: Backward-chaining expert systems reason much as a logic program does, chaining rules from a goal to the facts that support it, and Prolog was a common language for building them.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-25
unresolved_references:
  - label: Semantics of logic programs (least Herbrand models, completion, stable models)
    reason: The fixed-point semantics of van Emden and Kowalski, Clark's completion semantics for negation as failure, and the Gelfond-Lifschitz stable model semantics behind answer set programming are stated here from the standard literature; no registry source treats them directly.
    sections:
      - formal-treatment
      - variants-and-alternatives
claims: []
---

## Definition

**Logic programming** is a style of programming in which a program is a set of
logical sentences — almost always Horn clauses — and running it means searching
for a proof. A query is a statement to be proved; the answer is either a failure
or a substitution for the query's variables under which the program entails it.
Prolog is the dominant language, and the style is summed up in Kowalski's slogan
that an algorithm is logic plus control: the clauses say what is true, and a
separate, fixed strategy decides the order in which they are tried.

## Why it matters

It is the clearest working demonstration that deduction can be computation. A
program written as relations answers questions it was never explicitly
programmed for: the same clauses that compute a grandparent from a child also
find the grandchildren of a grandparent, because a relation has no built-in input or
output direction. That property made logic programming the natural home for
rule-based reasoning, parsing, theorem proving and symbolic AI, and its
function-free fragment, Datalog, now does quiet industrial work in database
queries and static program analysis.

## Intuition

Think of the program as a database of facts and rules, and of running it as a
detective working backwards. To establish a goal, find a rule whose conclusion
matches it; the rule's conditions become new goals; keep going until everything
bottoms out in facts. Variables get their values not from assignment but from
**unification** — the most general way of making two terms identical — so
binding happens as a side effect of matching.

The picture breaks at control. A detective chooses sensible leads; Prolog tries
clauses top to bottom and goals left to right, depth first, and will follow a
bad lead forever. The logic is declarative, but whether a program terminates is
not.

## Concrete example

```prolog
parent(tom, bob).
parent(bob, ann).
parent(bob, pat).

ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).

?- ancestor(tom, W).
% W = bob ;  W = ann ;  W = pat.
```

The first clause gives `bob` directly. Backtracking into the second clause binds
`Z = bob` and proves `ancestor(bob, W)`, whose first clause yields `ann` and
`pat`. The same program answers `?- ancestor(A, pat).`, returning `bob` and then
`tom`, with no change to the code.

Reorder the second clause to `ancestor(X, Y) :- ancestor(Z, Y), parent(X, Z).`
and the logical meaning is untouched. The query still returns `bob`, `ann` and
`pat`, but ask for one more answer and it calls `ancestor` with nothing bound,
recursing on itself until the stack is exhausted instead of reporting that
there are no more. Same logic, different control.

## Formal treatment

A **definite clause** has the form $A \leftarrow B_1 \wedge \dots \wedge B_n$
with $n \ge 0$, where $A$ and the $B_i$ are atoms and all variables are
universally quantified; with $n = 0$ it is a fact. A program $P$ is a finite set
of definite clauses. Its meaning is the **least Herbrand model** $M_P$, the set
of ground atoms $P$ entails, which is the least fixed point of the immediate
consequence operator

$$
T_P(I) = \{\, A \;:\; A \leftarrow B_1, \dots, B_n \text{ is a ground instance of a clause in } P,\ B_1, \dots, B_n \in I \,\}.
$$

$T_P$ is monotone on the complete lattice of Herbrand interpretations, so by the
Knaster–Tarski theorem a least fixed point exists; because $T_P$ is also
continuous, it is reached as $\bigcup_{k \ge 0} T_P^k(\emptyset)$.

Execution uses **SLD resolution**: repeatedly select a goal, unify it with the
head of a renamed clause using a most general unifier $\theta$, and replace it
with the clause body under $\theta$. Deriving the empty goal yields a computed
answer. SLD resolution is **sound** — every computed answer $\theta$ satisfies
$P \models \forall (G\theta)$ — and **complete** in the sense that every correct
answer is an instance of some computed answer. Completeness is a property of the
whole SLD tree, not of Prolog's depth-first walk through it.

## Assumptions and requirements

- **Horn form.** The completeness results hold for definite clauses. Full
  first-order logic, with disjunctive conclusions, needs general resolution and
  loses both the fixed-point semantics and the efficient procedure.
- **Sound unification.** Standard Prolog omits the _occurs check_ for speed, so
  `X = f(X)` succeeds and builds a cyclic term. Soundness then fails; the ISO
  standard provides `unify_with_occurs_check/2` for when it matters.
- **A closed world for negation.** Negation as failure, `\+ G`, succeeds when
  `G` cannot be proved. That is a sound reading of "not" only if everything true
  is derivable, and only when `G` is ground when called; with unbound variables
  it silently answers a different question.
- **Fair search for completeness.** Depth-first search is not fair, so a
  terminating proof can exist while Prolog runs forever.

## Uses and applicability

Reach for it when the problem is naturally relational or rule-shaped: parsing
with definite clause grammars, type inference and checking, symbolic rewriting,
planning in small domains, configuration and rule systems, and querying
knowledge bases. Datalog is the right tool for recursive queries over finite
data — transitive closure, points-to and taint analysis in compilers — because
without function symbols its bottom-up evaluation always terminates.

Do not reach for it for numeric work, mutable state, or problems where the
search order is doing all the work; you end up encoding an imperative algorithm
in clauses and fighting the control strategy.

## Limitations and common mistakes

**"The program means what it says."** Declaratively it does; operationally,
clause and goal order decide termination and efficiency, as the reordered
`ancestor` shows.

**Treating `\+` as logical negation.** It is failure to prove, and with an
unbound variable, `\+ member(X, [a])` fails rather than asking whether some `X`
lies outside the list.

**Overusing the cut.** `!` prunes the search tree and is often necessary for
efficiency, but a cut that changes which answers exist makes the program's
meaning depend on execution, which removes the reason for writing it in logic.

**Expecting arithmetic to be relational.** `X is Y + 1` needs `Y` bound; it is a
built-in evaluation, not a relation that runs backwards.

## Variants and alternatives

- **Datalog** drops function symbols, guaranteeing termination and polynomial
  data complexity, and is evaluated bottom-up with semi-naive iteration.
- **Constraint logic programming**, CLP(X), replaces syntactic unification over
  some domains with a constraint solver, so `X + Y #= 10` is a constraint rather
  than an error — the bridge to constraint satisfaction.
- **Answer set programming** gives negation a declarative meaning through stable
  models and hands the search to a SAT-style solver, trading Prolog's procedural
  control for completeness on finite problems.
- **Functional-logic languages** such as Curry combine the two declarative
  paradigms.

## History and attribution

Robinson's 1965 resolution principle, with unification, supplied the inference
rule. In 1972 Alain Colmerauer and Philippe Roussel created Prolog at Marseille,
and Robert Kowalski at Edinburgh gave Horn clauses their procedural
interpretation, published in 1974. Japan's Fifth Generation Computer Systems
project, running from 1982, adopted logic programming as its foundation; it did
not achieve its broader goals, and interest in the paradigm waned with it.

## Sources

Russell and Norvig treat logic programming as backward chaining over definite
clauses, cover unification, Prolog and its control strategy, and place the
paradigm in the history of symbolic AI. _Structure and Interpretation of
Computer Programs_ builds a logic-programming query system from scratch and is
unusually direct about where it departs from logic: infinite loops from clause
order and the trouble with `not`.

## Prerequisites and next connections

Read [First-Order Logic](./first-order-logic.md) first — clauses, quantifiers
and entailment are the vocabulary here — and [Proof Theory](./proof-theory.md)
for what it means to search for a derivation. [Order Theory](./order-theory.md)
supplies the fixed-point theorem behind the semantics.

From here, [Constraint Satisfaction](./constraint-satisfaction.md) generalises
unification into constraint solving, [Expert Systems](./expert-systems.md) show
rule chaining applied to real domains, and
[Functional Programming](./functional-programming.md) is the other declarative
tradition, worth reading for the contrast.
