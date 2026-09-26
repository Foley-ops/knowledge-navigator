---
concept_id: concept.machine_learning.spectral_clustering
title: Spectral Clustering
slug: /concepts/spectral-clustering
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: Spectral clustering embeds a weighted similarity graph using eigenvectors of a graph Laplacian and then partitions that embedding to reveal graph-separated groups.
categories:
  - Artificial Intelligence/Classical Machine Learning
  - Mathematics/Spectral Graph Theory
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.linear_algebra.spectral_theory
    note: The method uses eigenvalues and eigenvectors of a graph Laplacian to relax a discrete graph-partition problem.
  - type: requires
    target: concept.algorithms.graph_algorithms
    note: Observations are represented as vertices joined by weighted similarity edges, and connected components explain the ideal case.
  - type: contrasts_with
    target: concept.machine_learning.k_means
    note: Spectral clustering can separate nonconvex groups in the input space, though common versions use k-means after the spectral embedding.
  - type: contrasts_with
    target: concept.machine_learning.dbscan
    note: Spectral clustering partitions a chosen similarity graph into a requested number of groups, while DBSCAN expands dense neighborhoods and can label noise.
sources:
  - source_id: source.vonluxburg2007.spectral_clustering
    title: A Tutorial on Spectral Clustering
    url: https://arxiv.org/abs/0711.0189
    source_kind: preprint
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
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Spectral clustering** converts observations into a weighted undirected graph,
uses eigenvectors of a graph Laplacian to give every vertex new coordinates,
and partitions those coordinates. Vertices are observations; a nonnegative
weight $w_{ij}$ states how similar vertices $i$ and $j$ are. The eigenvectors
expose directions in which strongly connected vertices move together while
weak connections separate them.

The name covers several related algorithms. They differ in graph construction,
choice of unnormalized or normalized Laplacian, eigenvector normalization, and
final partitioning rule. These choices alter the objective and can alter the
answer.

## Why it matters

A cluster need not be a compact cloud around a centroid. Two interlocking moons
are not linearly separable in the original plane, but each moon has strong local
connections along its arc and few connections across the gap. Spectral
clustering makes that connectivity visible before applying a simple partitioner.

The method also links a hard combinatorial problem to tractable
[Spectral Theory](./spectral-theory.md). Balanced graph-cut objectives involve
discrete memberships and are difficult to optimize directly. Relaxing those
memberships to continuous vectors yields eigenvalue problems, after which the
continuous solution can be rounded to a partition.

## Intuition

Imagine the similarity graph as masses connected by springs. Vertices joined by
heavy edges prefer to move together. Low-frequency vibration modes change
slowly across heavy edges and can change sign or level across weak bottlenecks.
Coordinates from the first few nontrivial modes therefore place well-connected
vertices near one another.

This analogy does not choose the graph. If irrelevant points receive strong
edges, the spectrum faithfully describes the wrong relationships. The elegant
eigendecomposition cannot repair an unsuitable similarity measure or bandwidth.

## Concrete example

Consider a graph with edges of weight one between vertices $1$ and $2$, and
between $3$ and $4$, with no edges between the pairs. Its adjacency and degree
matrices give the unnormalized Laplacian

$$
L=D-W=
\begin{bmatrix}
1&-1&0&0\\
-1&1&0&0\\
0&0&1&-1\\
0&0&-1&1
\end{bmatrix}.
$$

The vectors $(1,1,0,0)^T$ and $(0,0,1,1)^T$ have eigenvalue zero. Thus the
multiplicity of zero is two, matching the two connected components. Using these
vectors as columns, the row embedding sends vertices $1,2$ to $(1,0)$ and
vertices $3,4$ to $(0,1)$. A two-cluster algorithm separates them exactly.

If a weak edge of weight $\delta>0$ is inserted between vertices $2$ and $3$,
the graph becomes connected and only the constant vector remains at eigenvalue
zero. A second eigenvector still varies mainly across that weak bridge when
$\delta$ is small, turning exact components into approximately separated
clusters.

## Formal treatment

For symmetric $W=(w_{ij})$ with $w_{ij}\geq0$, let
$D=\operatorname{diag}(d_1,\ldots,d_n)$ where $d_i=\sum_jw_{ij}$. Common
Laplacians are

$$
L=D-W,
$$

$$
L_{\mathrm{sym}}=I-D^{-1/2}WD^{-1/2},
\qquad
L_{\mathrm{rw}}=I-D^{-1}W.
$$

The quadratic form

$$
f^TLf=\frac12\sum_{i,j}w_{ij}(f_i-f_j)^2
$$

is small when $f$ changes little across heavily weighted edges. Unnormalized
spectral clustering uses eigenvectors associated with the smallest eigenvalues
of $L$. Normalized versions use $L_{\mathrm{sym}}$ or the generalized problem
$Lu=\lambda Du$. Rows of the selected eigenvector matrix become vertex
features, often normalized and clustered with [k-Means](./k-means.md).

Relaxations of ratio cut lead naturally to the unnormalized Laplacian, while
normalized cut is connected to normalized Laplacians. Rounding means the final
discrete partition need not attain the relaxed optimum.

## Assumptions and requirements

Weights should be nonnegative and normally symmetric. Graph construction must
encode relevant local similarity: common choices include an
$\varepsilon$-neighborhood graph, a $k$-nearest-neighbor graph, or a fully
connected graph with Gaussian weights. The neighborhood size or kernel
bandwidth is a substantive model parameter.

The requested cluster count must usually be supplied. An eigengap can be a
diagnostic, not an automatic proof of the correct count. Isolated vertices need
special handling for normalized Laplacians because $D^{-1}$ is undefined at
zero degree. The eigenproblem and similarity graph must also fit memory and
time budgets.

## Uses and applicability

Reach for spectral clustering when local graph connectivity captures the group
structure better than Euclidean centroids, especially for nonconvex shapes,
image regions, network communities, or data already supplied as a similarity
matrix. It is most attractive at small to medium scale or when sparse graph and
eigensolver techniques make the calculation feasible.

It is less suitable when observations arrive continuously, when a cheap
out-of-sample assignment rule is required, or when graph construction is more
arbitrary than the expected clusters. A simpler method is preferable if it
answers the same question robustly.

## Limitations and common mistakes

Results can change sharply with feature scaling, graph sparsification,
bandwidth, Laplacian normalization, eigenvector selection, and randomness in the
rounding step. Dense similarity matrices cost $O(n^2)$ storage, and a full
eigendecomposition is prohibitive at large $n$. Sparse approximations help but
introduce their own connectivity choices.

Common mistakes include taking the largest rather than smallest Laplacian
eigenvectors, retaining the trivial constant eigenvector incorrectly, mixing an
eigenvector convention from one normalized algorithm with the rounding step of
another, failing to symmetrize a nearest-neighbor graph, interpreting an
embedding axis directly, and evaluating the same labels used to tune the graph.

## Variants and alternatives

Unnormalized, random-walk normalized, and symmetric normalized methods express
different balancing behavior. Nyström and landmark approximations trade exact
spectral information for scale, though this page's registered sources should be
consulted before relying on a particular error claim.
[DBSCAN](./dbscan.md) handles irregular dense regions and noise without asking
for a cluster count. Hierarchical methods retain many resolutions. Kernel
k-means gives a related nonlinear partitioning viewpoint, while ordinary
k-means remains cheaper when Euclidean compactness is appropriate.

## History and attribution

Ulrike von Luxburg's registered tutorial synthesizes spectral graph theory,
graph-cut relaxations, and the main normalized algorithms, and reviews the
field's earlier lines of development. Because the tutorial is a secondary
historical account rather than a single priority claim, this draft does not
assign invention of “spectral clustering” to one person or date. It attributes
specific modern algorithmic distinctions to the tutorial's documented account.

## Sources

- von Luxburg's tutorial supports graph construction, Laplacian definitions,
  cut relaxations, algorithm variants, consistency cautions, and the historical
  synthesis used here.
- MIT 18.06 supports the eigenvector, multiplicity, quadratic-form, and matrix
  reasoning used in the worked example and formal explanation.

## Prerequisites and next connections

Read [Graph Algorithms](./graph-algorithms.md),
[Matrix Theory](./matrix-theory.md), and
[Spectral Theory](./spectral-theory.md) first. Compare
[k-Means](./k-means.md), [DBSCAN](./dbscan.md), and
[Hierarchical Clustering](./hierarchical-clustering.md) to separate assumptions
about centroids, density, connectivity, and resolution.
