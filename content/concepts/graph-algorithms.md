---
concept_id: concept.algorithms.graph_algorithms
title: Graph Algorithms
slug: /concepts/graph-algorithms
kind: concept
tier: 1
review_state: generated-draft
summary: The family of procedures — traversal, shortest paths, spanning trees, topological order, connectivity — that extract structure from vertices and edges in time linear or near-linear in the graph, together with the representation choices that decide whether they actually run that fast.
categories:
  - Programming/Data Structures & Algorithms
primary_category: Programming/Data Structures & Algorithms
relationships:
  - type: requires
    target: concept.algorithms.core_data_structures
    note: Every algorithm here is a traversal rule plus a container — a queue, a stack, a priority queue or a disjoint-set forest — and the container's cost is the algorithm's cost.
  - type: requires
    target: concept.algorithms.complexity_analysis
    note: The entire case for adjacency lists over matrices, and for Dijkstra over Bellman-Ford, is stated in asymptotic running times and is unreadable without them.
  - type: used_to_solve
    target: concept.optimization.combinatorial_optimization
    note: Shortest path, minimum spanning tree and maximum flow are the combinatorial optimisation problems that turn out to be solvable exactly in polynomial time, and these are the algorithms that solve them.
  - type: contrasts_with
    target: concept.computation.computational_complexity
    note: Changing one word in a graph problem's statement — shortest walk to longest, spanning tree to Hamiltonian cycle — moves it from near-linear time to NP-hard, and complexity theory is where that boundary is drawn.
sources:
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.vonluxburg2007.spectral_clustering
    title: A Tutorial on Spectral Clustering
    url: https://arxiv.org/abs/0711.0189
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Graph algorithms** are procedures that compute on a graph $G = (V, E)$: a set
of vertices $V$ and a set of edges $E \subseteq V \times V$, each edge possibly
directed and possibly carrying a weight $w(e)$. The canonical family is small
and worth knowing whole — traversal (breadth-first and depth-first search),
single-source shortest paths (Dijkstra, Bellman-Ford), minimum spanning tree
(Kruskal, Prim), topological sort, and connected components.

The representation is not an implementation detail but part of the algorithm.
An **adjacency list** stores, for each vertex, the list of its out-neighbours;
an **adjacency matrix** stores an $n \times n$ table $A$ with $A_{uv} \ne 0$
when the edge exists. The same traversal costs $O(n + m)$ on the first and
$\Theta(n^2)$ on the second, where $n = |V|$ and $m = |E|$.

## Why it matters

A graph is what you get whenever the data is things and relations between them:
road networks, build dependencies, citations, call graphs, the reachable heap
of a running program. The reason the field exists is that these problems look
combinatorially hopeless and are not. A graph on 20 vertices can have
astronomically many distinct paths between two of them, yet the shortest falls
out in time proportional to the number of edges, because shortest paths have
optimal substructure: a prefix of a shortest path is itself a shortest path, so
you never enumerate. That gap between the apparent and the actual cost is the
payoff.

## Intuition

Breadth-first search is a flood released at the source, spreading outward one
edge-length per tick; the tick on which it reaches a vertex is that vertex's
hop distance. Depth-first search is a single explorer with a thread, walking as
far as possible and backtracking only when stuck. Dijkstra is the flood again,
but each edge now takes $w(e)$ ticks to cross, so the priority queue is just a
clock that tells you which vertex the water reaches next.

The analogy pins down exactly where Dijkstra fails. Water reaching a vertex
early can never be beaten later, because every further edge only adds time.
That is _why_ Dijkstra may finalise a vertex the moment it leaves the queue —
and why a negative edge destroys the argument. A negative edge is a pipe that
runs backwards in time; the first arrival is no longer the earliest, and the
algorithm's central invariant is simply false.

## Concrete example

Take a directed weighted graph on five vertices with six edges:

```text
A→B 4    A→C 1    C→B 2    B→D 5    C→D 8    D→E 3
```

Dijkstra from $A$ extracts $A$ (0), then $C$ (1), which relaxes $C \to B$ down
to $3$; then $B$ (3), which relaxes $B \to D$ down to $8$; then $D$ (8) and
$E$ (11). Final distances: $A{=}0$, $C{=}1$, $B{=}3$, $D{=}8$, $E{=}11$.

Breadth-first search from $A$ ignores the weights and returns layers
$\{A\}, \{B, C\}, \{D\}, \{E\}$. The two disagree, and that is the point: a
fewest-edge path to $D$ is $A \to B \to D$ (2 edges, weight 9) — as is
$A \to C \to D$, also weight 9 — while the minimum-weight path is
$A \to C \to B \to D$ (3 edges, weight 8). The graph is
acyclic, so a topological order exists — $A, C, B, D, E$ — and every edge points
forward in it. Undirected, the graph is one connected component; directed, it
has five strongly connected components, one per vertex, because no cycle exists
to merge any of them.

Here is breadth-first search in full:

```python
from collections import deque

def bfs(adj, source):
    """Hop distances and BFS-tree parents from `source`, O(V + E)."""
    dist = {source: 0}
    parent = {source: None}
    queue = deque([source])
    while queue:
        u = queue.popleft()
        for v in adj.get(u, ()):
            if v not in dist:          # first arrival is the shortest
                dist[v] = dist[u] + 1
                parent[v] = u
                queue.append(v)
    return dist, parent
```

Every vertex enters the queue at most once and every edge is scanned once,
which is the whole running-time argument.

## Formal treatment

Write $n = |V|$, $m = |E|$, and $\delta(s, u)$ for the true shortest-path
weight from $s$ to $u$.

**Representations.** Adjacency lists use $\Theta(n + m)$ space, iterate the
neighbours of $u$ in $\Theta(\deg u)$, and answer "is $uv$ an edge?" in
$O(\deg u)$. An adjacency matrix uses $\Theta(n^2)$ space, answers edge queries
in $O(1)$, and costs $\Theta(n)$ to list one vertex's neighbours. Matrices win
on dense graphs ($m = \Theta(n^2)$), on tiny graphs, and when you want linear
algebra — $(A^k)_{uv}$ counts walks of length $k$. Lists win everywhere else,
and real graphs are almost always sparse.

**Traversal.** BFS and DFS both visit every reachable vertex in $O(n + m)$;
BFS computes $\delta$ for unit weights, and DFS yields finish times whose
nesting classifies edges, a back edge to a vertex still on the stack being
exactly a cycle.

**Shortest paths.** Dijkstra maintains $d[u] \ge \delta(s,u)$ and repeatedly
extracts the unfinalised vertex of minimum $d$, relaxing its out-edges via
$d[v] \leftarrow \min(d[v],\, d[u] + w(u,v))$. With a binary heap this is
$O((n + m)\log n)$; with a Fibonacci heap, $O(m + n \log n)$. Correctness needs

$$
w(e) \ge 0 \quad \text{for every } e \in E ,
$$

because the proof that $d[u] = \delta(s,u)$ at extraction time argues that any
alternative path must leave the finalised set through some vertex $x$ with
$d[x] \ge d[u]$, and then _only grows_. Bellman-Ford drops the assumption: it
relaxes all $m$ edges $n - 1$ times, costing $O(nm)$, and an $n$-th round that
still improves some $d[v]$ certifies a reachable negative cycle.

**Spanning trees.** On a connected undirected graph the cut property holds: for
any partition of $V$, a minimum-weight edge crossing it lies in some minimum
spanning tree. Kruskal sorts the edges and adds any that joins two disjoint-set
components, $O(m \log m)$; Prim grows one tree with a priority queue,
$O(m + n\log n)$.

**Order and connectivity.** A topological order exists if and only if the
directed graph is acyclic, and Kahn's queue of in-degree-zero vertices or the
reverse of DFS finish times produces one in $O(n + m)$. Connected components of
an undirected graph come from repeated traversal from unvisited vertices;
strongly connected components of a directed graph need Tarjan's or Kosaraju's
algorithm, still $O(n + m)$.

## Assumptions and requirements

Dijkstra requires non-negative weights — not merely bounded-below weights.
Bellman-Ford requires only that no negative cycle is reachable from the source;
if one is, "shortest path" is not a well-posed question, since you can loop
forever getting cheaper. Minimum spanning tree requires an undirected graph; on
a disconnected one you get a spanning forest, and the directed analogue is the
minimum arborescence (Chu-Liu/Edmonds), which greedy MST algorithms do not
solve. Distinct edge weights make the MST unique; with ties it need not be, so
two correct implementations can legitimately disagree. Topological sort requires
acyclicity. Every $O(n+m)$ bound above assumes random access to the whole graph
in memory: on a graph that does not fit, or is sharded across machines, the cost
is dominated by I/O and the algorithms are redesigned.

## Uses and applicability

Reach for graph algorithms whenever the structure of the relation matters and
the relation is sparse: routing, build systems and package managers
(topological sort over a dependency DAG, with cycle detection as the error
message), reachability-based garbage collection, dataflow analysis in
compilers, deduplication by connected components, and bipartite matching or
max-flow formulations of assignment problems.

Do not reach for them when the relation is dense and numeric — pointer chasing
over a dense matrix loses to linear algebra — or when the problem is one of the
NP-hard graph problems, where the right move is an approximation, an
integer-programming solver, or a heuristic rather than a textbook algorithm
that does not exist.

## Limitations and common mistakes

**Running Dijkstra on negative edges.** This is the error that shows up in real
systems, usually when weights encode costs that can be rebates or gains. Three
vertices suffice: $S \to A$ of weight $1$, $S \to B$ of weight $2$,
$B \to A$ of weight $-2$. Dijkstra extracts $A$ at key $1$ and finalises it;
only afterwards does $B$ come off the queue and offer $A$ a path of weight $0$.
The answer reported is $1$; the truth is $0$. Note that the algorithm does not
crash, loop or warn — it returns a plausible wrong number.

The tempting fix, adding a constant $M$ to every weight to make them
non-negative, does not work: it charges $M$ per _edge_, so it biases against
paths with many edges. With $M = 2$ above, $S \to A$ costs $3$ and
$S \to B \to A$ costs $4$, so the shifted graph has a different shortest path
from the real one. The correct repairs are Bellman-Ford, or Johnson's
reweighting $w'(u,v) = w(u,v) + h(u) - h(v)$ with potentials $h$ from
Bellman-Ford, which works precisely because the correction telescopes along any
path and so shifts all $s$-$t$ paths equally.

**Confusing the minimum spanning tree with the shortest-path tree.** They are
different objects. On the triangle with $AB = 1$, $BC = 1$, $AC = 1.9$, the MST
is $\{AB, BC\}$ of weight $2$, while the shortest-path tree from $A$ is
$\{AB, AC\}$, because $A \to C$ directly costs $1.9$ and via $B$ costs $2$. MST
minimises the total; a shortest-path tree minimises each distance from the root.

**Using an adjacency matrix on a sparse graph.** A million vertices means
$10^{12}$ entries, and a traversal that should have been near-linear becomes
quadratic. **Treating weak and strong connectivity as the same thing** — the
worked example above is one weakly connected component and five strongly
connected ones. **Assuming recursion is free**: recursive DFS on a path graph of
$10^6$ vertices overflows the stack in most languages, and Python's default
limit is about a thousand frames, so use an explicit stack.

Finally, the family stops where NP-hardness begins. Shortest path is easy;
longest simple path is NP-hard. Spanning tree is easy; Hamiltonian cycle is
NP-complete. Two-colouring is a BFS; three-colouring is NP-complete. Nothing in
the graph's appearance tells you which side you are on.

## Variants and alternatives

Within shortest paths: **A\*** is Dijkstra with an admissible heuristic added to
the key and is the default for navigation; **bidirectional search** meets in the
middle; **contraction hierarchies** preprocess road networks for millisecond
queries. For all pairs, **Floyd-Warshall** is $\Theta(n^3)$ and trivially
simple, while **Johnson's** costs $O(nm + n^2 \log n)$ and wins on sparse
graphs. **Borůvka's** algorithm parallelises far better than Kruskal or Prim,
and an incremental **union-find** answers connectivity queries online as edges
arrive where BFS answers them in batch.

A genuinely different approach is spectral: the graph Laplacian $L = D - A$ is
positive semi-definite, and the multiplicity of its eigenvalue $0$ equals the
number of connected components, the indicator vectors of those components
spanning the kernel. This buys a continuous relaxation of partitioning problems
that combinatorial algorithms find hard, at the cost of eigenvector computation
and an approximation where the traversal was exact. Graph neural networks are a
third family again — learned and approximate, aimed at prediction on graphs
rather than at exact combinatorial answers.

## History and attribution

Graph theory starts with Euler's 1736 analysis of the bridges of Königsberg,
where he showed the walk was impossible by counting vertex degrees rather than
by searching for a route. The algorithmic layer arrived with computing.
Dijkstra published his algorithm in 1959, having devised it a few years earlier
as a demonstration problem for a Dutch machine. The negative-weight algorithm
has several independent origins — Bellman, Ford and Moore, around 1956-1959 —
which is why its name varies by textbook. The minimum spanning tree has an older
and messier history: Borůvka gave an algorithm in 1926 for laying out an
electrical network in Moravia, decades before Kruskal's and Prim's
rediscoveries in the mid-1950s. Tarjan's linear-time
strongly-connected-components algorithm dates from the early 1970s, part of the
period that established depth-first search as a general technique rather than
an ad hoc trick.

## Sources

**MIT 6.006** is the backbone: graph representations, BFS and DFS, topological
sort, Bellman-Ford and Dijkstra, with the correctness arguments and running
times used throughout this page. **Arora and Barak** is where the boundary
drawn at the end of the limitations section is made precise — NP-completeness,
reductions, and the graph problems sitting just past the tractable ones. **A
Tutorial on Spectral Clustering** is the reference for the Laplacian facts,
including the eigenvalue-zero characterisation of connected components.
**MacTutor** supplies the biographical and historical detail.

## Prerequisites and next connections

Come with the containers already understood — queue, stack, priority queue,
disjoint-set forest — because each algorithm above is a traversal rule wrapped
around one of them, and with enough asymptotic notation to read $O(n + m)$
against $\Theta(n^2)$ as the argument it is.

Three directions open from here. [Order Theory](./order-theory.md) says what a
topological sort actually produces: a linear extension of the partial order a
directed acyclic graph encodes. [Matrix Theory](./matrix-theory.md) and
[Spectral Theory](./spectral-theory.md) develop the adjacency matrix and the
Laplacian into a continuous account of the same objects, where counting walks
becomes matrix powers and counting components becomes an eigenvalue
multiplicity. [Probability and Computing](./probability-and-computing.md)
covers the randomised side — algorithms that contract random edges or sample
random walks and are correct with high probability rather than always.
