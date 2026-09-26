---
concept_id: concept.symbolic_ai.constraint_satisfaction
title: Constraint Satisfaction
slug: /concepts/constraint-satisfaction
aliases:
  - constraint satisfaction problem
kind: problem
tier: 1
review_state: generated-draft
summary: A constraint satisfaction problem asks for values for a set of variables that respect every stated restriction on them, and the field's methods exploit that structure — propagating constraints to prune choices before search — to solve problems too large for blind enumeration.
categories:
  - Artificial Intelligence/Symbolic AI
primary_category: Artificial Intelligence/Symbolic AI
relationships:
  - type: requires
    target: concept.search.uninformed_search
    note: The core solver is depth-first backtracking over partial assignments, so the search strategy and its costs have to be understood first.
  - type: contributes_to
    target: concept.symbolic_ai.logic_programming
    note: Constraint logic programming replaces syntactic unification over some domains with a constraint solver, so propagation techniques from this field run inside a logic program.
  - type: contrasts_with
    target: concept.optimization.integer_programming
    note: Both model discrete combinatorial problems, but integer programming reasons through linear relaxations and bounds while constraint solving reasons through propagation over domains.
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
    checked_on: 2026-09-25
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-25
unresolved_references: []
claims: []
---

## Definition

A **constraint satisfaction problem** (CSP) consists of a set of variables, a
domain of possible values for each, and a set of constraints, each restricting
the combinations of values some subset of the variables may take. A solution is
an assignment of a value to every variable that violates no constraint. The
field studies how to find one — or show there is none — by exploiting the
problem's structure rather than trying every combination.

## Why it matters

A great many practical problems are exactly this shape: timetabling, rostering,
scheduling jobs on machines, configuring products from compatible parts,
allocating registers in a compiler, laying out circuits, solving puzzles. Stating
them as a CSP separates _what_ a solution must satisfy from _how_ to find one,
and hands the second part to a general solver. Because the representation is
factored into variables and constraints, a solver can reason about parts of the
problem — rule out a value because of one constraint — instead of treating each
complete assignment as an opaque state, which is what makes large instances
tractable in practice.

## Intuition

Picture filling in a Sudoku. You do not guess whole grids; you notice that a cell
can only hold one digit given its row, column and box, write it in, and let that
shrink the options elsewhere. Only when deduction stalls do you guess, and a
guess that leads to an empty cell is undone. Constraint solvers formalise both
halves: **propagation**, which removes values that cannot appear in any
solution, and **search**, which branches when propagation runs out. The
interplay is the whole craft — more propagation means less search but more work
per node.

## Concrete example

Colour the seven regions of Australia red, green or blue so that no two
neighbours match. The variables are WA, NT, SA, Q, NSW, V and T; the neighbour
pairs are WA–NT, WA–SA, NT–SA, NT–Q, SA–Q, SA–NSW, SA–V, Q–NSW and NSW–V, and
Tasmania touches nothing.

Backtracking with **forward checking** — after each assignment, delete the
chosen colour from every unassigned neighbour — and choosing next the variable
with fewest values left solves it without a single backtrack:

```text
WA = red     NT ∈ {g,b}   SA ∈ {g,b}
SA = green   NT ∈ {b}     Q ∈ {r,b}   NSW ∈ {r,b}   V ∈ {r,b}
NT = blue    Q ∈ {r}
Q  = red     NSW ∈ {b}
NSW = blue   V ∈ {r}
V  = red     T = red
```

After the first step NT and SA tie with two values each, and SA is chosen
because it constrains the most unassigned neighbours. Every later choice but
Tasmania's is forced: each other variable is left with exactly one value when
its turn comes. Check
the nine constraints and all hold. Without forward checking, a naive order could
colour NT and Q before discovering SA has nothing left.

## Formal treatment

A CSP is a triple $(X, D, C)$ with variables $X = \{X_1, \dots, X_n\}$, domains
$D = \{D_1, \dots, D_n\}$, and constraints $C$, each a pair
$\langle \text{scope}, \text{relation} \rangle$ where the relation lists the
allowed tuples over the variables in its scope. An assignment is **consistent**
if it violates no constraint and **complete** if it assigns every variable.

Variable $X_i$ is **arc-consistent** with respect to $X_j$ when every value
$a \in D_i$ has some $b \in D_j$ with $(a, b)$ allowed by the binary constraint
between them. The AC-3 algorithm enforces arc consistency across a binary CSP by
repeatedly revising arcs from a queue, re-queuing the neighbours of any domain
that shrinks. With $e$ binary constraints and domains of size at most $d$, it
runs in $O(e\,d^3)$ time.

The standard search heuristics are **minimum remaining values** (branch on the
variable with fewest legal values, failing early), a **degree** tie-break
(prefer the variable in most constraints with unassigned variables), and
**least constraining value** (try the value that rules out the fewest options
for neighbours, succeeding early).

## Assumptions and requirements

- **Finite domains** for the classical algorithms. Continuous variables need
  interval propagation or a switch to mathematical programming.
- **Decidable, checkable constraints.** A constraint must be testable on a
  partial assignment for propagation to prune anything.
- **No free lunch on hardness.** Deciding whether a finite-domain CSP has a
  solution is NP-complete in general — graph 3-colouring is a special case — so
  propagation and heuristics buy speed on structured instances, not a
  polynomial guarantee.
- **Structure matters.** If the constraint graph is a tree, the problem is
  solvable in $O(n\,d^2)$ by making it directionally arc-consistent and then
  assigning in order without backtracking; near-tree structure can be exploited
  by conditioning on a small cutset.

## Uses and applicability

Use a constraint solver when the problem has many hard logical restrictions,
discrete choices, and structure that deduction can exploit: scheduling,
timetabling, configuration, puzzle-like combinatorics. Modern constraint
programming systems and modelling languages let you state the model and choose
propagators without writing search code.

Prefer integer programming when the objective is a linear cost and the
constraints are mostly linear, since its relaxations give strong bounds; prefer
SAT solvers when the problem encodes naturally into clauses.

## Limitations and common mistakes

**Assuming arc consistency solves the problem.** It removes values, and can
detect some unsatisfiable instances, but an arc-consistent CSP may still have no
solution; search is still required.

**Confusing propagation strength with speed.** Stronger consistency (path,
$k$-consistency) prunes more but costs more per node. The best level is
empirical and problem-dependent.

**Modelling badly.** The same problem admits encodings that differ by orders of
magnitude in solve time; global constraints such as all-different propagate far
better than their decomposition into pairwise not-equal constraints.

**Reading heuristics as guarantees.** Minimum remaining values and least
constraining value are rules of thumb that usually help, not optimality
results.

## Variants and alternatives

- **Local search** methods such as min-conflicts start from a complete, flawed
  assignment and repair it; they are fast on large, loosely constrained problems
  like $n$-queens but cannot prove unsatisfiability.
- **Constraint optimisation** adds an objective, typically solved by branch and
  bound over the same machinery.
- **Constraint logic programming** embeds solvers in a logic language.
- **SAT and SMT solvers** attack the Boolean case and its extensions with
  clause learning, and many CSPs are solved fastest by encoding into them.

## History and attribution

Constraint propagation appears in Waltz's work on labelling line drawings in the
early 1970s; Montanari formalised constraint networks in 1974, and Mackworth's
1977 paper introduced the arc consistency algorithms, including AC-3. Constraint
logic programming, integrating solvers into Prolog-style languages, followed in
the late 1980s.

## Sources

Russell and Norvig's chapter on constraint satisfaction is the source of this
page's framing, its map-colouring example, the heuristics, AC-3 and the
tree-structured result, and the history. Arora and Barak supply the complexity
background: that satisfiability and graph colouring are NP-complete, which is
why no solver is known to escape worst-case exponential time.

## Prerequisites and next connections

Read [Uninformed Search](./uninformed-search.md) for depth-first backtracking,
and [Propositional Logic](./propositional-logic.md) for satisfiability, the
Boolean special case.

From here, [Logic Programming](./logic-programming.md) shows constraints running
inside a proof search, [Integer Programming](./integer-programming.md) is the
main competing formalism, and [Computational Complexity](./computational-complexity.md)
explains why the worst case stays hard.
