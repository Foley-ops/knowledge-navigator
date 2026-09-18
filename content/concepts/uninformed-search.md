---
concept_id: concept.search.uninformed_search
title: Uninformed Search
slug: /concepts/uninformed-search
aliases:
  - blind search
kind: concept
tier: 1
review_state: generated-draft
summary: The family of state-space search strategies that know nothing about a problem except its successor function, its action costs and its goal test, and whose members differ only in the order they drain the frontier — which is enough to decide completeness, optimality and whether they fit in memory.
categories:
  - Artificial Intelligence/Symbolic AI/Search
primary_category: Artificial Intelligence/Symbolic AI/Search
relationships:
  - type: prerequisite_of
    target: concept.search.a_star
    note: A* is uniform-cost search with the frontier priority changed from $g$ to $g+h$, so its frontier, its reached set and its optimality argument are the ones established here.
  - type: contrasts_with
    target: concept.algorithms.graph_algorithms
    note: Classical graph algorithms are handed an explicit adjacency structure and charge time in vertices and edges, whereas uninformed search generates a state graph lazily from a successor function and usually cannot afford to store it.
  - type: contrasts_with
    target: concept.search.adversarial_search
    note: Every algorithm here assumes one agent whose chosen action fully determines the next state; adversarial search replaces alternate levels with an opponent's choice, which changes what an optimal solution even means.
  - type: contributes_to
    target: concept.planning.strips
    note: A STRIPS planner searches the space of states reachable by operator application, and the uninformed algorithms are the baseline over that space whose hopeless growth rate motivates planning heuristics.
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
    checked_on: 2026-09-18
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - concrete-example
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-18
  - source_id: source.hart1968.a_star
    title: A Formal Basis for the Heuristic Determination of Minimum Cost Paths
    url: https://ieeexplore.ieee.org/document/4082128
    source_kind: primary-research
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
unresolved_references: []
claims: []
---

## Definition

**Uninformed search** is the family of state-space search strategies that use
nothing about a problem beyond four things: an initial state, a successor
function, a cost per action, and a goal test that recognises a solution when
standing on one. No member can estimate how far a state is from a goal — that
estimate is what makes a search _informed_.

All of them share one skeleton: keep a **frontier** of generated-but-unexpanded
nodes, remove one, test it, expand it, add its children, repeat. The five
classical strategies differ only in the removal rule. A FIFO queue gives
breadth-first search; a priority queue on path cost, uniform-cost search; a LIFO
stack, depth-first search; a stack with a cutoff, depth-limited search; and a
cutoff raised by one and restarted, iterative deepening.

## Why it matters

Many problems arrive with no usable heuristic: reachability in a protocol's state
space, bug-finding in a model checker, plan existence for a domain nobody has
hand-tuned. Uninformed search is not a teaching device there, it is what you run.

These five are also the measuring stick. "This heuristic is good" is an empirical
claim about nodes saved relative to uniform-cost search, so the uninformed bounds
are the denominator, and they fix the vocabulary — complete, cost-optimal,
$O(b^d)$ — that later algorithms are described by keeping or giving up.

## Intuition

Breadth-first search is a wavefront, flooding outward one level at a time; it
finds the shallowest goal because it cannot help reaching depth $d$ before depth
$d+1$. Its cost is that the wavefront must be stored, and the wavefront _is_ the
last level, which is nearly the whole tree. Depth-first search is a single thread
pushed as deep as it will go and pulled back one step at a dead end; its cost is
that it commits, and may plunge down a branch with no goal, or no bottom.
Iterative deepening is that thread on a leash lengthening by one each time: you
re-walk the shallow part repeatedly, and it turns out not to matter, because the
bottom level of a branching tree holds more nodes than everything above it
combined.

Where the picture misleads: real state spaces are usually graphs, not trees, and
the wavefront image quietly assumes a stored _reached_ set.

## Concrete example

Take a tiny weighted graph. From $S$: an edge to $G$ of cost $10$, to $A$ of cost
$5$, to $B$ of cost $1$. Then $A \to G$ costs $5$, $B \to C$ costs $2$, and
$C \to G$ costs $3$.

Breadth-first search generates $G$ as a child of $S$ on the first expansion and
returns $S \to G$: one edge, cost $10$ — right about the edge count, wrong about
the cost. Uniform-cost search expands in order of path cost $g$: $S$ (frontier
$B{:}1$, $A{:}5$, $G{:}10$), then $B$ (adding $C{:}3$), then $C$ (reaching $G$ at
$6$, replacing the $10$), then $A$ (reaching $G$ at $10$ again, discarded), and
only then $G$ at $6$, returning $S \to B \to C \to G$. Note that $G$ sat on the
frontier throughout: goal-testing at _generation_ rather than at _expansion_
would have returned the cost-$10$ path.

For iterative deepening's overhead, take $b = 10$ and $d = 5$. Breadth-first
generates $10 + 100 + 1{,}000 + 10{,}000 + 100{,}000 = 111{,}110$ nodes below the
root; iterative deepening generates the depth-1 nodes on five iterations, the
depth-2 nodes on four, and so on, for
$50 + 400 + 3{,}000 + 20{,}000 + 100{,}000 = 123{,}450$ — about $11\%$ more work
for $O(bd)$ memory instead of $O(b^d)$. Its depth-limited core, written so a
cutoff is distinguishable from a genuine dead end:

```python
def depth_limited(node, limit, successors, is_goal, path):
    if is_goal(node):
        return path
    if limit == 0:
        return "cutoff"
    cut = False
    for child in successors(node):
        result = depth_limited(child, limit - 1, successors, is_goal, path + [child])
        if result == "cutoff":
            cut = True
        elif result is not None:
            return result
    return "cutoff" if cut else None      # None: provably nothing below here

def iterative_deepening(start, successors, is_goal):
    limit = 0
    while True:
        result = depth_limited(start, limit, successors, is_goal, [start])
        if result != "cutoff":
            return result                 # a path, or None for "no solution"
        limit += 1
```

Without the `cutoff`/`None` distinction the outer loop could never terminate on a
finite space with no solution.

## Formal treatment

Let $b$ be the branching factor (maximum successors of a state), $d$ the depth of
the shallowest goal, $m$ the maximum depth of the state space (possibly
infinite), $\ell$ the depth limit, $C^*$ the optimal solution cost, and
$\varepsilon$ a lower bound on any single action's cost.

| Strategy            | Complete?         | Cost-optimal?                      | Time                                       | Space                                      |
| ------------------- | ----------------- | ---------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Breadth-first       | yes¹              | only if all action costs are equal | $O(b^d)$                                   | $O(b^d)$                                   |
| Uniform-cost        | yes¹²             | yes                                | $O(b^{1+\lfloor C^*/\varepsilon \rfloor})$ | $O(b^{1+\lfloor C^*/\varepsilon \rfloor})$ |
| Depth-first         | no                | no                                 | $O(b^m)$                                   | $O(bm)$                                    |
| Depth-limited       | no, if $\ell < d$ | no                                 | $O(b^{\ell})$                              | $O(b\ell)$                                 |
| Iterative deepening | yes¹              | only if all action costs are equal | $O(b^d)$                                   | $O(bd)$                                    |

¹ provided $b$ is finite and either a solution exists or the state space is
finite. ² additionally requires $\varepsilon > 0$.

The two optimality claims differ in kind. Breadth-first search returns a goal of
minimum **depth**; that is minimum **cost** only when cost is a non-decreasing
function of depth, which in practice means every action costs the same.
Uniform-cost search instead satisfies the invariant that when it selects a node
for expansion it has already found an optimal path to it — a cheaper path would
have to pass through a frontier node of strictly smaller $g$, and there is none,
since $g$ never decreases along a path when costs are non-negative. That argument
is indifferent to depth, which is why uniform-cost is cost-optimal in general.
Its price: with unit costs $C^* = d$ and the bound becomes $O(b^{d+1})$, one
level worse than breadth-first — which is exactly what goal-testing at expansion
rather than at generation costs.

Iterative deepening generates a node at depth $i$ once per iteration with limit at
least $i$, so its total is

$$
N_{\mathrm{IDS}} \;=\; \sum_{i=0}^{d} (d - i + 1)\, b^{i}
\;=\; b^{d} \sum_{j=0}^{d} (j+1)\, b^{-j}
\;\le\; b^{d}\left(\frac{b}{b-1}\right)^{2},
$$

against $N_{\mathrm{BFS}} \approx b^{d} \cdot \frac{b}{b-1}$: the ratio tends to
$b/(b-1)$, which is $11\%$ at $b = 10$ but a factor of $2$ at $b = 2$.
"Re-expansion is free" is a claim about large branching factors, not a law.

## Assumptions and requirements

The table is stated for a **tree-like** search that keeps no reached set. Add one
and the space column changes completely: depth-first and iterative deepening no
longer cost $O(bm)$ and $O(bd)$ but $\Theta$(number of reached states) — usually
the very thing that did not fit in memory to begin with.

Uniform-cost search requires **non-negative** action costs, and needs
$\varepsilon > 0$ for completeness: an infinite action sequence costing
$1/2, 1/4, 1/8, \dots$ has finite total cost, so the algorithm can expand forever
without the frontier's minimum ever passing $C^*$. Negative costs break the
expansion invariant outright; Bellman-Ford-style relaxation is needed instead.
Breadth-first and iterative deepening need $b$ finite, and depth-first needs
finite $m$ or cycle detection even to terminate.

## Uses and applicability

Reach for breadth-first when actions are unit cost, $d$ is small and the frontier
fits; for uniform-cost when costs vary and no heuristic exists, which is
Dijkstra's algorithm on a lazily generated graph; for iterative deepening when
$b^d$ exceeds your memory but not your patience, which makes it the default for
large state spaces; and for depth-first when you need _a_ solution rather than the
best one and the space is finite — constraint-satisfaction and SAT backtracking
are depth-first search with pruning bolted on. Reach for none of them when an
informative admissible heuristic is available.

## Limitations and common mistakes

"Breadth-first finds the shortest path" is the most common error, and it confuses
_fewest edges_ with _least cost_: the worked example above turns a cost-$6$
solution into a cost-$10$ one on a six-edge graph. "Uniform-cost is breadth-first
with a priority queue" is nearly right and wrong in two places: the goal test
moves from generation to expansion, and a whole plateau of equal-cost nodes may
be expanded before the algorithm finishes.

The binding constraint is almost always **memory, not time**. A search running at
a million nodes per second exhausts a gigabyte of frontier in seconds — which is
why iterative deepening survives, and why "just use breadth-first" is bad advice
at scale.

One more: forgetting the reached set on a cyclic graph gives an infinite loop or
an exponential blowup of redundant paths, the most common bug in a hand-written
search.

## Variants and alternatives

**Bidirectional search** runs two frontiers, forward from the start and backward
from the goal, meeting in the middle for $O(b^{d/2})$ time and space — an enormous
win, but it needs an explicit goal state and invertible actions.

**Informed search** is the real alternative: A*, best-first and greedy search keep
this frontier machinery and add a heuristic to the priority. Hart, Nilsson and
Raphael make the relationship exact — with the heuristic identically zero, A* is
uniform-cost search — so the uninformed case is the degenerate corner of the
informed one. **IDA\*** recombines the two, iterating on an $f$-cost threshold
rather than a depth limit.

**Beam search** caps the frontier at $k$ nodes and **local search** abandons it
entirely: both buy bounded memory by giving up completeness and optimality
together. **Monte Carlo tree search** samples rather than expanding exhaustively,
which is what you do when $b$ is in the hundreds.

## History and attribution

These strategies have no single origin; they were found separately in operations
research, graph theory and artificial intelligence. Breadth-first search is
credited to Edward Moore's 1959 work on finding paths through mazes, and
uniform-cost search is Dijkstra's shortest-path algorithm of the same year,
arrived at independently of the AI tradition. Depth-first traversal is older
still and has no clean attribution: it appears in the nineteenth century as a
rule for walking mazes and reaches its modern algorithmic form in the graph
theory of the 1960s and 1970s.

Iterative deepening came from computer chess, standard tournament practice by the
late 1970s — notably Slate and Atkin's Chess 4.5, the name itself older still —
and was analysed as a general strategy by Korf in 1985, who also introduced
IDA\*. Hart, Nilsson and Raphael's 1968 paper first placed the uninformed and
informed cases in one framework.

## Sources

**Russell and Norvig's** chapter on problem-solving by search is the canonical
treatment: the problem formulation, all five strategies, the complexity table,
the assumptions behind each footnote, and the bibliographic notes the
attributions above rest on. **MIT 6.006** covers breadth-first, depth-first and
Dijkstra as graph algorithms — the other tradition, counting vertices and edges
rather than $b$ and $d$. **Hart, Nilsson and Raphael (1968)** is where the
reduction of A\* to uniform-cost at $h \equiv 0$ is made formal.

## Prerequisites and next connections

Read [Graph Algorithms](./graph-algorithms.md) first: breadth-first, depth-first
and Dijkstra appear there over an explicit graph, and seeing them that way once
makes the lazily-generated version here much easier.
[Core Data Structures](./core-data-structures.md) supplies the queue, stack and
priority queue that are the entire difference between these five algorithms, and
[Complexity Analysis](./complexity-analysis.md) is the language of the table.

The natural next step is heuristic search, which keeps all of this and changes
only the frontier priority. [Dynamic Programming](./dynamic-programming.md) is
the complementary view — memoised sub-problems rather than frontier expansion —
and when an action's successor is uncertain rather than fixed, see
[Markov Decision Processes](./markov-decision-processes.md).
