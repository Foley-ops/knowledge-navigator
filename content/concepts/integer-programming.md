---
concept_id: concept.optimization.integer_programming
title: Integer Programming
slug: /concepts/integer-programming
aliases:
  - integer linear programming
  - mixed-integer programming
kind: problem
tier: 1
review_state: generated-draft
summary: Optimizing a linear objective over the integer points of a polyhedron — one extra word in the model that turns a polynomial-time linear program into an NP-hard problem, and that buys the ability to express a yes-or-no decision.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: specializes
    target: concept.optimization.combinatorial_optimization
    note: Integer programming is the particular formalism — linear objective, linear constraints, integrality — in which most combinatorial optimization problems are written down and handed to a general solver.
  - type: contrasts_with
    target: concept.optimization.convex_optimization
    note: Deleting the integrality constraint leaves a linear program solvable in polynomial time, so integer programming is the sharpest illustration of what convexity is worth.
  - type: contrasts_with
    target: concept.optimization.nonconvex_optimization
    note: Both are nonconvex, but the difficulty here is a discrete feasible set rather than a rough landscape, and the methods answer with a certified bound rather than a local minimum.
  - type: contributes_to
    target: concept.computation.computational_complexity
    note: Zero-one integer programming is one of Karp's original NP-complete problems and remains a standard target for hardness reductions.
sources:
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.convex_analysis_and_optimization
    title: MIT 6.253 Convex Analysis and Optimization (Spring 2012)
    url: https://ocw.mit.edu/courses/6-253-convex-analysis-and-optimization-spring-2012/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Total unimodularity and the Hoffman-Kruskal theorem
    reason: No registered source covers integral polyhedra, totally unimodular matrices or their graph-theoretic examples; the statement and the Cramer's-rule argument given here are standard integer-programming material, and Schrijver's Theory of Linear and Integer Programming is the reference this page wanted and could not cite.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
  - label: Cutting planes and branch and bound as algorithms
    reason: The registry has no source on Gomory cuts, Chvatal-Gomory rounding, branch and bound or branch-and-cut; the derivations and the attributions here are uncited, and a dedicated integer-programming text (Nemhauser and Wolsey, or Conforti-Cornuejols-Zambelli) is what the page needed.
    sections:
      - formal-treatment
      - concrete-example
      - history-and-attribution
  - label: Empirical performance of modern mixed-integer solvers
    reason: The claim that branch-and-cut codes routinely solve large structured instances despite NP-hardness rests on solver benchmark studies that no registered source covers, so it is stated qualitatively and no speedup figures are quoted.
    sections:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

An **integer program** asks for the best lattice point in a polyhedron:

$$
\max\; c^{\top} x \quad \text{subject to} \quad A x \le b, \quad x \ge 0, \quad x \in \mathbb{Z}^{n},
$$

with rational data $A \in \mathbb{Q}^{m \times n}$, $b \in \mathbb{Q}^{m}$,
$c \in \mathbb{Q}^{n}$. Erase $x \in \mathbb{Z}^{n}$ and a linear program is left
— the **LP relaxation**, whose optimal value is an upper bound on the integer
optimum because its feasible set is larger. If only some coordinates must be
integral the problem is a **mixed-integer program**; if the integer variables are
confined to $\{0,1\}$ it is a **binary** or **0-1 program**.

Integrality is not a convex constraint. The feasible set is a scatter of
isolated points, so nothing that makes linear programming easy — a convex
region, an optimum at a vertex, local optimality implying global — survives that
one line.

## Why it matters

Binary variables are how a model says _whether_. Build the depot or not; put
this crew on that leg or not; run job $A$ before job $B$. Selection, assignment,
covering, sequencing, fixed charges and logical disjunction all translate into
linear constraints over $\{0,1\}$ variables, so one modelling language covers
much of applied discrete decision-making and one class of solver serves all of
it. The alternative is a bespoke algorithm per problem.

The price is exact: the decision version is NP-complete, and 0-1 integer
programming sits on Karp's original list of NP-complete problems. That makes
integer programming the cleanest measure of what convexity is worth — the same
objective over the same inequalities is polynomial-time solvable without the
integrality requirement and NP-hard with it.

## Intuition

Hold two polytopes in mind: the LP region $P = \{x : Ax \le b,\, x \ge 0\}$,
whose optimum sits at a vertex, and the **integer hull**
$P_I = \operatorname{conv}(P \cap \mathbb{Z}^{n})$, whose vertices are all
integral and over which the integer program _is_ a linear program.

Everything follows from the gap between them. Cutting-plane methods shave $P$
towards $P_I$ using inequalities that no integer point violates. Branch and
bound splits $P$ at a fractional coordinate — $x_j \le \lfloor x_j^{\ast}
\rfloor$ or $x_j \ge \lceil x_j^{\ast} \rceil$ — and uses each piece's
relaxation value as a bound that can prove the piece not worth exploring.

The picture of the relaxation as a slightly blurred answer breaks quickly:
$P_I$ can require exponentially many facets, and a problem can have a perfectly
good LP optimum and no feasible integer point at all.

## Concrete example

Maximize $x_2$ subject to

$$
-2x_1 + 2x_2 \le 1, \qquad 2x_1 + 2x_2 \le 3, \qquad x_1, x_2 \ge 0 .
$$

The two constraints meet at $(0.5,\,1)$, so the relaxation has optimal value
$1$. Now look for integer points. Setting $x_2 = 1$ forces $x_1 \ge 0.5$ from the
first constraint and $x_1 \le 0.5$ from the second, and $x_2 \ge 2$ is infeasible
outright. Every feasible integer point therefore has $x_2 = 0$: the integer
optimum is $0$, at $(0,0)$ and $(1,0)$. On two variables the relaxation
overstates the answer by a full unit.

Rounding does not rescue it. Rounding $(0.5, 1)$ down to $(0,1)$ violates the
first constraint ($2 \not\le 1$); rounding up to $(1,1)$ violates the second
($4 \not\le 3$). Both roundings are infeasible, not merely suboptimal.

A cut does work. For any $u \ge 0$ the combination $u^{\top}\!A x \le u^{\top} b$
is valid; since $x \ge 0$ the coefficients may be rounded down, and the left side
is then integer-valued at integer $x$, so the right side may be rounded down too.
With $u = (\tfrac{3}{8}, \tfrac{1}{8})$ this Chvátal-Gomory step gives
$-\tfrac{1}{2} x_1 + x_2 \le \tfrac{3}{4}$ and then

$$
-x_1 + x_2 \le 0 ,
$$

which every feasible integer point satisfies and which the relaxation optimum
violates, since $-0.5 + 1 > 0$.

Branch and bound finishes in two nodes. Branch on $x_1$: the child with
$x_1 \le 0$ has relaxation value $0.5$, and so does the child with $x_1 \ge 1$.
The objective is integer-valued, so both bounds floor to $0$, matching the
incumbent $(0,0)$ — optimality proved without another LP.

## Formal treatment

With $P$ and $P_I$ as above: for rational $A$ and $b$, $P_I$ is itself a
polyhedron, so an integer program is equivalent to a linear program over $P_I$.
The difficulty is entirely that an inequality description of $P_I$ may be
exponentially large and hard to produce.

**Complexity.** Deciding whether $Ax \le b$ has an integer solution is
NP-complete: hardness by reduction from satisfiability through 0-1 programming,
and membership in NP because a feasible rational system has a solution of
polynomially bounded encoding length. Linear programming is in P. In _fixed_
dimension the picture changes — Lenstra showed in 1983 that for a constant
number of variables integer programming is polynomial-time solvable, so the
hardness is about dimension growing, not about integrality as such.

**Total unimodularity.** An integral matrix $A$ is **totally unimodular** (TU)
if every square submatrix has determinant $-1$, $0$ or $1$. If $A$ is TU and $b$
is integral, every vertex of $P$ is integral and the relaxation already solves
the integer program. The argument is Cramer's rule: a vertex solves a
nonsingular subsystem, $x_B = B^{-1} b_B$, and
$B^{-1} = \operatorname{adj}(B)/\det B$ with $\det B = \pm 1$ has integer
entries. The Hoffman-Kruskal theorem is the converse: an integral $A$ is TU
exactly when $P$ is integral for _every_ integral $b$. Incidence matrices of
directed graphs are TU, which is why min-cost flow and shortest path have
integral LP optima; bipartite incidence matrices are TU, which is why the
assignment problem is effectively a linear program. The matrix of the example
above has determinant $(-2)(2) - (2)(2) = -8$ and is nowhere near TU, and its
fractional vertex is the visible consequence.

**Algorithms.** Gomory's cutting-plane method adds rounded valid inequalities
until the relaxation optimum is integral. Branch and bound explores a tree of
restricted subproblems, pruning any node whose bound cannot beat the incumbent.
Modern codes are **branch-and-cut**: both together, plus presolve, primal
heuristics and warm-started dual simplex, stopping when the gap between the
incumbent value and the best remaining bound falls under a tolerance.

## Assumptions and requirements

Rational data is assumed throughout; both the encoding-length bound that puts
integer feasibility in NP and the finiteness arguments for cutting planes use it.

Integrality of $b$ is a real requirement: a totally unimodular $A$ with
fractional $b$ has fractional vertices and the guarantee evaporates. Total
unimodularity is also only sufficient — integral polyhedra arise for other
reasons, the matching polytope of a general graph being the standard example.

Branch and bound needs bounded integer variables, or bounds that keep improving,
or the tree need not terminate. Flooring a bound, as in the example above,
requires $c$ and the integer variables to be integral; with a continuous
variable in the objective that step is invalid.

Finally, the approach assumes the relaxation is cheap to re-solve thousands of
times. A formulation with enormous big-$M$ coefficients meets the definition but
gives weak bounds and ill-conditioned arithmetic, and that is as binding in
practice as any hypothesis above.

## Uses and applicability

Production planning, crew rostering, vehicle routing, network design, unit
commitment in power systems, facility location and cutting stock are
long-standing users, and integer programming also serves as an exact backend
wherever a combinatorial subproblem sits inside a larger pipeline.

Reach for it when the decisions are genuinely discrete, the structure is or can
be made linear, and you want a proven optimum or a certificate of how far from
optimal a solution is. That bound is often the real product: a solution
guaranteed within 1% is worth more than an unranked answer from a heuristic.

Do not reach for it when quantities are large and continuous, so relaxing and
rounding is within tolerance; when the constraints are logical rather than
arithmetic and the LP bound is therefore useless; or when a good answer in a
second beats an optimal answer in an hour.

## Limitations and common mistakes

Rounding the relaxation is the first mistake, and the example shows its strong
form: the rounded point can be infeasible in every direction, and where it is
feasible it can be arbitrarily far from optimal.

The second is reading NP-hardness as hopelessness. NP-hardness is a worst-case
statement about a family of instances; practical models are sparse and
structured, and branch-and-cut solvers routinely handle instances with very many
binary variables. There is no contradiction — the theorem says no algorithm is
fast on _every_ instance, not that none is fast on yours. The converse error is
equally common: adversarial instances with a few dozen variables defeat every
solver, so "the solver will cope" is not a plan.

Third, formulation strength dominates nearly everything else. Two formulations
with identical integer feasible sets can differ by orders of magnitude in solve
time because one has a tighter relaxation. Compactness is not the goal; an
extended formulation with more variables and a tighter hull usually wins, and a
big-$M$ set generously "to be safe" is a direct attack on the bound.

Fourth, an instance whose relaxation happens to be integral is not evidence of
total unimodularity, which is a property of the matrix for all right-hand sides.

Finally, a solver's "optimal" means optimal within a relative gap tolerance and
an integrality tolerance, so a value reported as $0.9999999$ is being treated as
$1$. And the optimum is often found early: most of the run is spent proving it,
which is why tightening a formulation pays better than chasing heuristics.

## Variants and alternatives

Mixed-integer linear programming is the everyday case; mixed-integer quadratic,
conic and general nonlinear programs keep the branching machinery and swap the
relaxation. Constraint programming replaces the LP bound with domain propagation
and is often stronger on feasibility and scheduling; SAT, pseudo-Boolean and
MaxSAT solvers dominate when the structure is logical rather than numeric.
Lagrangian relaxation dualizes the awkward constraints for a cheap bound, and
decomposition — Dantzig-Wolfe with column generation, Benders — trades one
enormous model for a coordinating master and many small subproblems.
Approximation algorithms give up optimality for a proven ratio, usually by
rounding the same relaxation. Metaheuristics such as simulated annealing and
tabu search give good solutions fast and no bound at all, which is exactly the
trade.

## History and attribution

Dantzig's simplex method, developed in 1947 for United States Air Force planning
problems, made linear programming practical and made its integer variant the
obvious next question. Gomory introduced cutting planes with a finite
termination proof in 1958, and Land and Doig published branch and bound in 1960;
the two are still the halves of every serious solver. Hoffman and Kruskal
characterized total unimodularity by integrality in 1956: an integral matrix is
TU exactly when its polyhedron is integral for every integral right-hand side.
Karp's 1972 list of NP-complete problems included 0-1 integer programming, and
Lenstra's 1983 fixed-dimension algorithm marked out where that hardness does not
bite. Cutting planes were long regarded as numerically fragile and fell out of
favour; their revival inside branch-and-cut from the 1990s is a large part of
why today's solvers are not the solvers of 1975.

## Sources

Boyd and Vandenberghe cover the linear-programming half: standard forms,
duality, and relaxing a hard problem to a convex one to obtain a bound.
Bertsekas's MIT 6.253 covers the polyhedral convexity behind the geometric
picture — extreme points, the description of a polyhedron, and why a linear
optimum sits at a vertex. Arora and Barak give NP-completeness, Karp reductions
and the worst-case reading of hardness the limitations section leans on.
MacTutor is used only for the chronology around Dantzig and the simplex method.
The integer-programming-specific material is recorded in
`unresolved_references`, because the registry has no source covering cutting
planes, branch and bound or total unimodularity.

## Prerequisites and next connections

Linear programming and the geometry of polyhedra come first:
[Convex Geometry](./convex-geometry.md) has the extreme points, hyperplane
separation and hull constructions that the integer hull imitates. The
determinant facts behind total unimodularity are in
[Matrix Theory](./matrix-theory.md), and the divisibility arguments showing that
a linear system can have rational solutions and no integer ones are in
[Elementary Number Theory](./elementary-number-theory.md).

From here, Combinatorial Optimization is the wider setting in which integer
programming is one formalism among several, Computational Complexity says what
NP-completeness does and does not assert, and Convex Optimization is the sibling
case where the relaxation is the whole story. For the undecidable neighbour —
integer solutions to _polynomial_ equations, where no algorithm exists at all —
see [Computability Theory](./computability-theory.md).
