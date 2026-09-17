---
concept_id: concept.optimization.combinatorial_optimization
title: Combinatorial Optimization
slug: /concepts/combinatorial-optimization
kind: concept
tier: 1
review_state: generated-draft
summary: Optimization over a feasible set that is finite but exponentially large — tours, matchings, spanning trees, subsets — where an optimum always exists and the whole difficulty is finding it without enumerating.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: requires
    target: concept.computation.computational_complexity
    note: The central fact about this field is which problems are polynomial and which are NP-hard, and neither half of that sentence means anything without the complexity classes and the notion of reduction.
  - type: contrasts_with
    target: concept.optimization.convex_optimization
    note: Both minimize a linear or convex objective, but here the feasible set is a finite point set rather than a convex body, so local optimality carries no information and duality gives bounds rather than certificates of optimality.
  - type: contributes_to
    target: concept.optimization.integer_programming
    note: Combinatorial problems are what integer programming is a general language for, and the polyhedral structure of their relaxations — total unimodularity, facets, cutting planes — is what integer programming solvers exploit.
  - type: contrasts_with
    target: concept.optimization.nonconvex_optimization
    note: Both face landscapes riddled with local optima, but a discrete feasible set has no gradients and no neighbourhood structure by default, so descent is replaced by enumeration with bounds.
sources:
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.theory_of_computation
    title: MIT 18.404J Theory of Computation (Fall 2020)
    url: https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Matroid theory and the greedy characterisation
    reason: No registry source covers matroids. The statement that the greedy algorithm is optimal for every weight function exactly when the independent sets form a matroid is given here without a citation a reader can check.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Classical polynomial algorithms for matching, flow and spanning trees
    reason: The registry has no combinatorial optimization or graph algorithms text. Max-flow min-cut, the blossom algorithm for non-bipartite matching, total unimodularity, the matching polytope and its odd-set inequalities, and the attributions for these results and for the simplex method are standard textbook material that no cited source here carries.
    sections:
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
  - label: Approximation results for metric TSP and submodular maximization
    reason: The 3/2 factor for metric TSP, its recent improvement, the 1 - 1/e greedy bound for monotone submodular maximization under a cardinality constraint, and the scale of TSP instances closed by branch and cut are stated from the general literature; no registry source covers them.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Combinatorial optimization** is the problem of minimizing (or maximizing) an
objective over a feasible set $\mathcal{F}$ that is finite and discrete, but
given implicitly — as the spanning trees of a graph, the perfect matchings of a
bipartite graph, the permutations of $n$ cities, the subsets of items fitting in
a knapsack — so that $|\mathcal{F}|$ is exponential in the size of the input that
describes it. Because $\mathcal{F}$ is finite, an optimum exists and brute force
finds it. That is exactly why the mathematical content of the field is not
existence but _algorithms_: which of these problems admit a polynomial-time
method, which do not, and what can be proved about the answers you settle for
when they do not.

## Why it matters

Scheduling, vehicle routing, network design, chip layout, register allocation and
auction clearing are all of this shape, and the reason to study the field rather
than reach straight for a solver is that the tractability boundary is not where
intuition puts it. Minimum cut is polynomial; maximum cut is NP-hard. Shortest
path is polynomial; longest simple path is NP-hard. Bipartite matching is
polynomial; three-dimensional matching is NP-hard. Minimum spanning tree is
polynomial; minimum Steiner tree is NP-hard. 2-SAT is polynomial; 3-SAT is
NP-complete. Nothing on the surface of a problem predicts which side it falls on,
so the classification is real knowledge, not bookkeeping.

## Intuition

Two pictures do most of the work.

The first is geometric. Encode each feasible solution $S$ as its indicator
vector $x^S \in \{0,1\}^E$ and take the convex hull of those points. The hull is
a polytope, the objective is linear, a linear function over a polytope attains
its minimum at a vertex, and every vertex of this particular polytope is one of
the original $x^S$. So _every_ combinatorial optimization problem is secretly a
linear program. The catch, and where the picture stops being comforting, is that
writing the polytope down may take exponentially many inequalities: the hardness
has not gone away, it has moved into the description.

The second is greedy. Sort the elements by weight and take each one if it still
leaves a feasible partial solution. On minimum spanning tree this is exactly
optimal; on the travelling salesman problem the same instinct is badly wrong.
The structure separating the two cases has a name — a matroid — and it is a
checkable axiom, not a vague property of "nice" problems.

## Concrete example

Take five nodes $a,\dots,e$ with these edge weights:

$$
ab=1,\; bc=2,\; de=3,\; cd=5,\; ac=6,\; bd=7,\; ce=8,\; be=9,\; ad=10,\; ae=20 .
$$

**Spanning tree, greedily.** Scan the edges in increasing weight and keep any
edge that does not close a cycle: $ab$, $bc$, $de$, then $cd$ (which joins
$\{a,b,c\}$ to $\{d,e\}$). Four edges, all five nodes, total weight
$1+2+3+5 = 11$. This is optimal, and not by luck — greedy is provably exact
here.

**Tour, greedily.** Run the same instinct as nearest neighbour from $a$:
$a \to b\,(1) \to c\,(2) \to d\,(5) \to e\,(3) \to a\,(20)$, total $31$.
Enumerating all $4!/2 = 12$ distinct tours gives an optimum of $24$, attained by
$a\,b\,c\,e\,d\,a$ and by $a\,b\,e\,d\,c\,a$. Greedy is $29\%$ off on five
nodes, and the failure is structural: the cheap edges it grabbed early forced it
onto the $20$-weight edge at the end.

**A bound for free.** Deleting one edge from any tour leaves a spanning path,
which is a spanning tree, so the MST weight lower-bounds the optimal tour:
$11 \le 24$. True, useful, and weak — which is the permanent situation with
relaxations.

## Formal treatment

An instance is a ground set $E$, a family $\mathcal{F} \subseteq 2^E$ of feasible
subsets given by an oracle or a compact description, and weights
$w : E \to \mathbb{R}$; the task is $\min_{S \in \mathcal{F}} \sum_{e \in S} w_e$.
Writing $P_{\mathcal{F}} = \operatorname{conv}\{x^S : S \in \mathcal{F}\}$, we
have the identity $\min_{S \in \mathcal{F}} w(S) = \min_{x \in P_{\mathcal{F}}} w^\top x$.

**Relaxation.** Replace $P_{\mathcal{F}}$ by a polyhedron $P \supseteq
P_{\mathcal{F}}$ that _is_ writable — usually the linear constraints with
$x \in \{0,1\}^E$ weakened to $x \in [0,1]^E$. Containment is the whole reason
$\min_{x \in P} w^\top x$ is a valid lower bound. The **integrality gap** is the
worst-case ratio between the integer optimum and that bound. For vertex cover
with $x_u + x_v \ge 1$ on every edge, the complete graph $K_n$ admits
$x_v = 1/2$ for all $v$, so the LP value is $n/2$ while any vertex cover needs
$n-1$ vertices: the ratio $2(n-1)/n$ tends to $2$, and on a triangle it is
already $2/1.5 = 4/3$.

**Total unimodularity.** If the constraint matrix $A$ is totally unimodular —
every square submatrix has determinant $0, \pm 1$ — and $b$ is integral, every
vertex of $\{x : Ax \ge b,\, x \ge 0\}$ is integral, so the LP solves the integer
problem outright. Edge-node incidence matrices of _bipartite_ graphs and network
flow matrices are totally unimodular, which is why matching, vertex cover and
flow are solved by their LPs there. An odd cycle breaks that integrality — the
matching polytope then needs Edmonds' odd-set inequalities — but only vertex
cover actually becomes NP-hard; matching stays polynomial via the blossom
algorithm.

**Matroids.** A pair $(E, \mathcal{I})$ with $\mathcal{I} \subseteq 2^E$
non-empty and closed downward is a matroid if for $A, B \in \mathcal{I}$ with
$|A| < |B|$ there is $e \in B \setminus A$ with $A \cup \{e\} \in \mathcal{I}$.
Greedy maximizes weight over bases _for every weight function_ precisely when
$(E, \mathcal{I})$ is a matroid; the forests of a graph form one, which is the
spanning-tree case above, and the tours of a graph do not.

**Hardness and approximation.** TSP, max-cut, set cover, graph colouring and
knapsack with binary-encoded weights are NP-hard. An algorithm is
$\rho$-approximate for a minimization problem if it always returns a solution of
cost at most $\rho \cdot \mathrm{OPT}$. Vertex cover has a $2$-approximation;
metric TSP has a $3/2$-approximation, improved very recently by a minuscule
amount; general TSP has no constant-factor approximation unless $\mathrm{P} =
\mathrm{NP}$, since a Hamiltonian-cycle instance can be encoded with huge weights
on the absent edges. PCP-based results do make some approximation ratios
provably optimal under $\mathrm{P} \ne \mathrm{NP}$ — Håstad's $7/8$ for
Max-3SAT is the standard example — but neither ratio above is one of them: the
$2$ for vertex cover is known optimal only under the Unique Games Conjecture,
and the $3/2$ for metric TSP is not optimal at all.

## Assumptions and requirements

Greedy exactness needs the matroid axiom, not a feeling that the problem is
"nicely nested"; testing greedy on small instances proves nothing, because the
theorem guarantees only that _some_ weight function defeats greedy once the
axiom fails, and in practice greedy also fails on perfectly ordinary weights, as
the five-node tour above shows. LP bounds need the relaxed set to contain
every integer feasible point, and their _usefulness_ needs a small integrality
gap, which is a separate property nobody gets for free. Integrality of the LP
optimum needs total unimodularity or another integrality property, and
bipartiteness is doing the work in most textbook cases. Approximation guarantees
carry their own hypotheses: the $3/2$ factor for TSP requires symmetric weights
obeying the triangle inequality, and both conditions are load-bearing. Hardness
results assume worst-case instances and asymptotic input size, so they say
nothing about the instance on your desk.

## Uses and applicability

Reach for the combinatorial formulation when the decisions are genuinely yes/no
or an ordering, when the constraints are linear in those decisions, and when you
want a proof of optimality or a quantified bound on how far off you are. Modern
branch-and-cut solvers close industrial models with tens of thousands of binary
variables, and TSP instances with tens of thousands of nodes have been solved to
proven optimality. Look elsewhere when the model is continuous and smooth, when
the objective is only observable through noisy samples, or when you need a decent
answer in milliseconds on an instance far beyond what an exact method can close —
at a fixed time budget, local search usually beats a truncated exact solve.

## Limitations and common mistakes

The most common mistake is reading "NP-hard" as "hopeless". It is a worst-case
statement about an infinite family; real instances have structure, and solvers
exploit it routinely. The mirror-image mistake is just as common: solving
$n = 50$ quickly says nothing about $n = 500$, because the growth that hardness
predicts is exactly the kind you cannot extrapolate from small $n$.

Second, the LP relaxation optimum is not a solution. It is fractional, rounding
it can produce an infeasible point, and for set cover the gap between the integer
and fractional optima grows like $\log n$ — no rounding scheme can recover a
constant factor from that LP.

Third, the integrality gap and the approximation ratio are different numbers. The
gap bounds what any argument based on _that_ relaxation can prove; a different
relaxation or a combinatorial argument can do better.

Fourth, tractability is fragile in both directions. Adding one side constraint to
a shortest-path problem makes it NP-hard; restricting a hard problem to planar
graphs or bounded treewidth often makes it polynomial. Check the exact variant
you have, not the family name.

## Variants and alternatives

**Exact methods**: branch and bound, branch and cut (bounds from LP relaxations
plus separation of violated valid inequalities), dynamic programming over subsets
(which solves TSP in $O(n^2 2^n)$ time, far better than $n!$ but still
exponential), constraint programming, and SAT or SMT solvers for feasibility-heavy
models. **Approximation algorithms** trade optimality for a proof: LP rounding,
primal-dual, and semidefinite relaxations, which buy a stronger bound than an LP
at a higher cost per node and give the best known guarantee for max-cut.
**Heuristics and metaheuristics** — 2-opt and Lin-Kernighan local search,
simulated annealing, tabu search, genetic algorithms — give no guarantee and are
often what actually ships. **Parameterized algorithms** move the exponential onto
a parameter $k$ rather than $n$. **Submodular maximization** is a separate
structural island where greedy again has a proof, achieving a $1 - 1/e$ factor for
monotone objectives under a cardinality constraint. Learned heuristics for
routing are an active area; the evidence that they beat tuned classical solvers
on standard benchmarks is not settled.

## History and attribution

The field has several independent origins rather than one. Linear programming and
the simplex method come from Dantzig's work on military planning in the late
1940s, with Kantorovich's 1939 work on production planning earlier and largely
unread in the West. Minimum spanning tree was solved by Borůvka in 1926 for rural
electrification, then again by Kruskal and Prim in the 1950s. Ford and Fulkerson
gave max-flow min-cut in the 1950s. Edmonds' 1965 paper "Paths, Trees, and
Flowers" solved non-bipartite matching in polynomial time and, in doing so,
argued that polynomial time is the right formal meaning of "efficient" — the
convention now called the Cobham-Edmonds thesis. The other half of the map
arrived with Cook's 1971 theorem and Levin's independent work, and with Karp's
1972 list of 21 NP-complete problems, many of them squarely combinatorial
optimization. Approximation guarantees and their limits came later, with
inapproximability sharpened substantially by the PCP theorem in the early 1990s.

## Sources

MIT 6.006 gives the working vocabulary — graphs, shortest paths, dynamic
programming, and the habit of measuring an algorithm rather than trusting it. MIT
18.404J is where the P versus NP-hard boundary is actually built, from reductions
and NP-completeness. Arora and Barak carry the same material much further and are
the reference here for approximation ratios, hardness of approximation, and the
Cook-Levin-Karp history. Boyd and Vandenberghe supply the relaxation machinery:
Boolean problems, their LP relaxations as lower bounds, and Lagrangian and
semidefinite relaxations of combinatorial objectives. What the registry does not
have, and what this page most wanted, is a dedicated combinatorial optimization
text — the results on matroids, matching, flows and total unimodularity are
flagged in `unresolved_references` for that reason.

## Prerequisites and next connections

Read complexity theory first: without reductions and NP-completeness, half of
this page is vocabulary. [Computability Theory](./computability-theory.md) sits
one level below that and settles what "no algorithm at all" means, which is a
different and stronger claim than anything here.
[Convex Geometry](./convex-geometry.md) is the right companion for the polytope
picture — faces, vertices and hulls are the objects the relaxation view
manipulates.

Going forward, integer programming is the general modelling language for
everything on this page, and convex optimization is what a relaxation lands you
in. [Probability and Computing](./probability-and-computing.md) covers the
randomized side — random rounding of LP solutions and randomized local search —
and [Order Theory](./order-theory.md) is the natural next stop for lattice and
submodular structure, which is where greedy earns a guarantee for a second time.
