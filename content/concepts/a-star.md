---
concept_id: concept.search.a_star
title: A*
slug: /concepts/a-star
aliases:
  - A-star search
  - A* search
kind: algorithm
tier: 1
review_state: generated-draft
summary: The best-first graph search that orders the frontier by cost-so-far plus an estimate of cost-to-go, returning a provably cheapest path whenever that estimate never overestimates — and exhausting memory long before it exhausts time.
categories:
  - Artificial Intelligence/Symbolic AI/Search
primary_category: Artificial Intelligence/Symbolic AI/Search
relationships:
  - type: requires
    target: concept.algorithms.graph_algorithms
    note: A* is a priority-queue traversal whose correctness argument is Dijkstra's relax-and-settle argument run on reweighted edge costs, so the shortest-path machinery has to be in hand first.
  - type: contrasts_with
    target: concept.search.uninformed_search
    note: Setting the heuristic to zero turns A* back into uniform-cost search exactly, so the two differ in nothing except what the priority function is allowed to know.
  - type: used_to_solve
    target: concept.planning.strips
    note: Domain-independent planners search STRIPS state spaces with A* or greedy best-first, deriving the heuristic automatically from a relaxation of the operator set.
  - type: contrasts_with
    target: concept.search.monte_carlo_tree_search
    note: Both order a tree by an estimate of what lies below, but MCTS estimates by sampling and offers statistical rather than admissible guarantees, which is the trade when no lower bound is available.
sources:
  - source_id: source.hart1968.a_star
    title: A Formal Basis for the Heuristic Determination of Minimum Cost Paths
    url: https://ieeexplore.ieee.org/document/4082128
    source_kind: primary-research
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
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
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references: []
claims: []
---

## Definition

**A\*** is a best-first search over a state graph that repeatedly expands the
frontier node minimising

$$
f(n) \;=\; g(n) + h(n),
$$

where $g(n)$ is the cost of the cheapest path from the start to $n$ found so
far and $h(n)$ is a heuristic estimate of the cheapest cost from $n$ to any
goal. The frontier is a priority queue ordered by $f$, and the goal test is
applied when a node is **removed** from the queue, never when it is generated.
Two degenerate cases bracket it: $h \equiv 0$ is uniform-cost search (Dijkstra's
algorithm), and dropping $g$ is greedy best-first search, which is fast and not
optimal. Everything else is a statement about which property of $h$ buys which
guarantee.

## Why it matters

Search cost is counted in node expansions, and the number of nodes within a
given cost of the start grows exponentially with depth. A heuristic prunes that
growth, but a merely plausible one can prune away the answer. A\* is the
resolution: when the estimate is a **lower bound** on the true remaining cost,
the pruning is free and the path returned is still cheapest. Russell and Norvig
tabulate the effect on the 8-puzzle at depth 12 — iterative-deepening search
expands millions of nodes where A\* with Manhattan distance expands on the order
of a hundred.

## Intuition

Carry two numbers for every node: what you have already spent, and an optimistic
quote for the rest. Their sum bounds from below the cost of any solution through
that node, so expanding in $f$ order is expanding in order of best case still
achievable.

Geometrically, A\* sweeps a contour of constant $f$ outward from the start: with
$h \equiv 0$ the contours are balls in the cost metric; a good $h$ stretches
them into a band aimed at the goal; a perfect $h = h^*$ collapses the band onto
one optimal path. The picture breaks in one place: the contours are nested only
when $h$ is consistent. With a merely admissible $h$, $f$ can _decrease_ along a
path and nodes leave the queue out of $f$ order — which is why the two
conditions buy different guarantees.

## Concrete example

An undirected graph with start $S$ and goal $G$:

| edge    | cost | edge    | cost |
| ------- | ---- | ------- | ---- |
| $S$–$A$ | 2    | $B$–$D$ | 5    |
| $S$–$B$ | 3    | $C$–$G$ | 4    |
| $A$–$C$ | 3    | $D$–$G$ | 2    |
| $B$–$C$ | 1    |         |      |

with heuristic $h(S)=7$, $h(A)=6$, $h(B)=4$, $h(C)=4$, $h(D)=2$, $h(G)=0$. The
true costs to the goal are $h^*(S)=8$, $h^*(A)=7$, $h^*(B)=5$, $h^*(C)=4$,
$h^*(D)=2$, so $h$ is admissible; and $|h(u)-h(v)| \le c(u,v)$ on every edge, so
it is consistent as well.

Pop $S$ ($f=7$), generating $A$ ($g=2$, $f=8$) and $B$ ($g=3$, $f=7$). Pop $B$
($f=7$), generating $C$ ($g=4$, $f=8$) and $D$ ($g=8$, $f=10$). Pop $C$ ($f=8$),
generating $G$ ($g=8$, $f=8$). Pop $G$: return $S \to B \to C \to G$ at cost
$8 = C^*$.

$D$ is never expanded, its $f=10$ exceeding $C^*$; $A$ sits exactly at
$f = 8 = C^*$ and is expanded only if tie-breaking says so. Uniform-cost search
has no such excuse for $A$: it has $g = 2 < 8$, so it is always expanded. $D$ is
a different matter — its $g = 8$ ties the goal's, so tie-breaking decides that
one, exactly as it decides $A$ here.

## Formal treatment

Let the state graph have edge costs $c(n,n') \ge 0$, let $h^*(n)$ be the cost of
a cheapest path from $n$ to a goal, and let $C^* = h^*(\text{start})$.

**Admissible**: $0 \le h(n) \le h^*(n)$ for every $n$ — the estimate never
overestimates. **Consistent** (monotone): $h(n) \le c(n,n') + h(n')$ for every
edge $n \to n'$, with $h = 0$ at goals — a triangle inequality on $h$.

Consistency implies admissibility, by induction on the number of edges from $n$
to a goal along an optimal path. The converse fails: on $S \to A \to G$ with
unit edges, $h(S)=2$, $h(A)=0$ is admissible ($h^*(S)=2$) yet
$h(S) = 2 > c(S,A) + h(A) = 1$.

**Tree search with admissible $h$ is optimal.** A suboptimal goal $G_2$ on the
queue has $f(G_2)=g(G_2) > C^*$, while some node $n$ on an optimal path is also
on the queue with $f(n)=g(n)+h(n) \le g(n)+h^*(n)=C^*$; so $n$ is popped first
and $G_2$ is never returned.

**Graph search with consistent $h$ is optimal and expands each state once.**
Consistency makes $f$ nondecreasing along any path,
$f(n')=g(n)+c(n,n')+h(n') \ge g(n)+h(n)=f(n)$, so nodes leave the queue in
nondecreasing $f$ order and a node's $g$ is already optimal when popped — a
closed set that discards repeated states is therefore safe. Equivalently, with
reduced costs $\hat c(n,n') = c(n,n') - h(n) + h(n')$, consistency says exactly
$\hat c \ge 0$, and A\* is Dijkstra's algorithm on $\hat c$.

A\* expands every node with $f(n) < C^*$, none with $f(n) > C^*$, and a
tie-break-dependent subset of those at $f(n) = C^*$.

**Optimal efficiency.** Among admissible algorithms — those guaranteed to return
an optimal solution — given the same _consistent_ heuristic, none is
_guaranteed_ to expand fewer nodes than A\*, apart from ties at $f = C^*$: a node
with $f(n) < C^*$ left unexpanded could hide a cheaper solution beneath it. Note
the conditions: the result counts expansions rather than seconds, holds against
equally informed competitors rather than a better heuristic or precomputed data,
and bounds what can be guaranteed rather than what a luckier algorithm might
happen to do on one particular graph.

**Cost.** The number of nodes with $f < C^*$ is generally exponential in
solution depth; sub-exponential growth needs the absolute error $|h(n)-h^*(n)|$
to grow no faster than $O(\log h^*(n))$, which essentially no practical
heuristic achieves. Memory is linear in nodes generated. If $h_2 \ge h_1$
pointwise with both consistent, A\* under $h_2$ expands no more nodes than under
$h_1$ — apart again from ties at $f = C^*$, where tie-breaking can hand $h_2$ a
node $h_1$ skips.

## Assumptions and requirements

Edge costs must be nonnegative: a negative edge breaks both consistency and the
pop-order argument, and Bellman-Ford is the tool there. Completeness on an
infinite graph needs step costs bounded below by some $\varepsilon > 0$ and a
finite branching factor, or the frontier grows forever without accumulating
cost.

The graph must be known, deterministic, static and fully observable, with costs
fixed in advance; once action outcomes are uncertain, the object to solve is a
Markov decision process, not a path. The heuristic must vanish at goals and must
be cheap, since total time is expansions times the cost of an expansion plus one
heuristic evaluation. Duplicate detection needs a canonical, hashable state and
memory linear in distinct states reached.

If $h$ is admissible but not consistent, graph search stays optimal only when
closed nodes are **reopened** on finding a cheaper $g$ — which restores
correctness at a worst case of exponentially many re-expansions.

## Uses and applicability

Reach for A\* when optimality matters, a cheap lower bound exists, costs are
additive and known, and the reachable space fits in memory: grid pathfinding in
games and robotics (Manhattan or octile distance), the 15-puzzle with
pattern-database heuristics, optimal domain-independent planning with heuristics
from a relaxed problem, and sequence alignment on the edit-distance lattice.

Do not reach for it when a good-enough answer is wanted fast — weighted A\* or
greedy best-first beat it by orders of magnitude; when many queries hit one
static graph, where preprocessing wins; when no admissible bound exists; or when
branching is large and the heuristic weak.

## Limitations and common mistakes

**Testing the goal on generation** returns the first path found, not the
cheapest. Test on pop.

**Assuming admissible implies consistent.** Take $S \to A$ (5), $S \to B$ (1),
$B \to A$ (1), $A \to G$ (10) with $h(S)=12$, $h(A)=0$, $h(B)=11$, $h(G)=0$, all
admissible. Graph-search A\* without reopening pops $A$ at $f=5$, closes it with
$g=5$, later finds $g=2$ through $B$, discards the improvement, and returns cost
15 against an optimum of 12. Reopening returns 12.

**Overestimating by accident.** Manhattan distance on a grid allowing unit-cost
diagonal moves is not admissible (Chebyshev distance is); straight-line distance
is not admissible when edge costs are travel times, unless divided by the
maximum speed. Learned heuristics are neither admissible nor consistent unless
built to be.

**Ignoring memory.** A\* retains every generated node, so on hard instances it
dies at the memory limit rather than running slowly.

**Reading "optimally efficient" as "fastest".** It concerns expansions relative
to equally informed admissible algorithms, not wall-clock time — and a sharper
heuristic, though it expands fewer nodes, costs more per node, so runtime can
rise. Tie-breaking across the $f = C^*$ plateau, enormous on unit-cost grids,
moves expansion counts by large constant factors; prefer larger $g$.

## Variants and alternatives

**Weighted A\***, $f = g + w\,h$ with $w > 1$, returns a solution costing at most
$w \cdot C^*$ and usually finds it far sooner; anytime variants lower $w$ as
time allows. **IDA\*** runs depth-first iterative deepening on an $f$ threshold:
memory linear in depth, at the price of re-expanding the interior each
iteration, which is excellent when few distinct $f$ values exist and poor when
every node has its own, each iteration then adding a single node. **SMA\*** and
the memory-bounded family fill memory with A\*, then drop the worst-$f$ leaf and
back its value up to the parent so the subtree can be regenerated; optimal when
the optimal path itself fits. **RBFS** buys linear space with backed-up $f$
values and
re-expansion, **D\*** and **D\* Lite** repair a path when costs change under a
moving robot, and **bidirectional** variants search from both ends.

Genuinely different: Dijkstra's algorithm when there is no heuristic; beam
search when a bounded frontier and no guarantee are acceptable; landmark (ALT)
heuristics and contraction hierarchies, which beat A\* by orders of magnitude on
road networks in exchange for a static graph and a build step; and Monte Carlo
tree search where branching is huge and no lower bound exists.

## History and attribution

A\* was introduced by Peter Hart, Nils Nilsson and Bertram Raphael in 1968 at
Stanford Research Institute, in the course of route planning for the mobile
robot Shakey. Their paper gives the $f = g + h$ formulation, admissibility, and
the consistency condition used to show no node need be re-expanded; the name
comes from the family of search algorithms called $A$ in that line of work, the
star conventionally read as marking the admissible, provably optimal member.

The paper's efficiency theorem was stated too strongly and needed a published
correction; the sharp version is due to Rina Dechter and Judea Pearl in the
mid-1980s, and Pearl's 1984 monograph _Heuristics_ is the systematic treatment.
IDA\* is Richard Korf's (1985), SMA\* Stuart Russell's (1992), and the
uninformed special case older than all of it: Dijkstra's algorithm, 1959.

## Sources

The 1968 Hart, Nilsson and Raphael paper is primary for the definition, for
admissibility and consistency, and for the original optimality proofs — read it
for what was proved then, and later treatments for what the efficiency claim
became. Russell and Norvig's _Artificial Intelligence: A Modern Approach_ covers
everything around it: worked traces, heuristic design and dominance, the
8-puzzle comparisons, the memory-bounded variants and the notes attributing
each. MIT 6.006 covers the shortest-path machinery A\* inherits.

## Prerequisites and next connections

Read [Graph Algorithms](./graph-algorithms.md) first: A\* is a priority-queue
traversal, its correctness is Dijkstra's argument on reweighted costs, and its
running time is the priority queue's — which
[Core Data Structures](./core-data-structures.md) supplies, along with the hash
set the closed list needs. [Searching](./searching.md) situates all of it
against search over ordered data.

Next come [Markov Decision Processes](./markov-decision-processes.md), what a
path problem becomes once actions have uncertain outcomes, and
[Combinatorial Optimization](./combinatorial-optimization.md), where
lower-bound-and-prune reappears as branch and bound over a space that is not
naturally a graph of states.
