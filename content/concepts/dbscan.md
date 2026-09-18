---
concept_id: concept.machine_learning.dbscan
title: DBSCAN
slug: /concepts/dbscan
aliases:
  - density-based spatial clustering of applications with noise
kind: algorithm
tier: 1
review_state: generated-draft
summary: DBSCAN forms clusters from density-connected points at a chosen neighborhood radius, labels isolated points as noise, and does not require the number of clusters in advance.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.learning.unsupervised_learning
    note: DBSCAN infers groups without target labels, so its parameters and output require unsupervised interpretation and validation.
  - type: contrasts_with
    target: concept.machine_learning.k_means
    note: DBSCAN can recover nonconvex dense regions and designate noise, whereas k-means returns a fixed number of centroid-based clusters.
  - type: contrasts_with
    target: concept.machine_learning.hierarchical_clustering
    note: DBSCAN returns one density-based partition for chosen parameters rather than a nested sequence of partitions.
  - type: assumes
    target: concept.algorithms.complexity_analysis
    note: Efficient neighborhood queries depend on dimension, indexing, and implementation; a quadratic scan can dominate large datasets.
sources:
  - source_id: source.ester1996.dbscan
    title: A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise
    url: https://cdn.aaai.org/KDD/1996/KDD96-037.pdf
    source_kind: primary-research
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
unresolved_references: []
claims: []
---

## Definition

**DBSCAN** is a density-based clustering algorithm controlled by a neighborhood
radius $\varepsilon$ and a minimum neighborhood size, conventionally called
$\operatorname{MinPts}$. A point is a **core point** when its closed
$\varepsilon$-neighborhood contains at least $\operatorname{MinPts}$ points,
usually counting the point itself. A cluster expands from a core point through
chains of neighboring core points and includes non-core points lying within a
core neighborhood. Points included in no cluster are labeled noise.

Unlike [k-Means](./k-means.md), DBSCAN does not request a cluster count and does
not describe a cluster by its mean. Its output depends on a metric and one
global density scale.

## Why it matters

Many meaningful groups are curved, elongated, or wrapped around one another, so
no partition into nearest-centroid cells describes them well. DBSCAN replaces a
shape assumption with a local-density assumption. It can trace an irregular
dense region, keep two such regions separate when a sufficiently sparse gap
lies between them, and explicitly decline to assign isolated observations.

That last behavior is important in exploratory analysis. Forcing every point
into a cluster can make outliers distort representatives and can conceal the
fact that some observations do not belong to any repeated pattern. DBSCAN makes
the noise decision visible, although it does not prove that a noise point is an
error or anomaly.

## Intuition

Imagine placing an equal-radius disk around every observation. A crowded point
can start or continue a region. From it, walk to another crowded point whose
disk overlaps the current neighborhood, then continue. All points reachable by
such steps belong to one connected dense region. A lightly populated point may
join a region if it sits in a crowded point's disk, but it cannot serve as a
bridge that expands the region further.

The picture breaks when density varies strongly. One disk radius may be large
enough to connect a sparse cluster but then merge two dense clusters, or small
enough to separate dense groups but classify the sparse group as noise.

## Concrete example

Take points $0,0.2,0.4,3.0,3.2,8.0$ on the real line, with
$\varepsilon=0.25$ and $\operatorname{MinPts}=2$, counting each point itself.
The closed neighborhoods are

$$
N_{\varepsilon}(0)=\{0,0.2\},\qquad
N_{\varepsilon}(0.2)=\{0,0.2,0.4\},
$$

$$
N_{\varepsilon}(0.4)=\{0.2,0.4\},\qquad
N_{\varepsilon}(3.0)=N_{\varepsilon}(3.2)=\{3.0,3.2\}.
$$

All five of these points are core points. The first three are connected through
the overlapping neighborhoods around $0.2$, producing cluster
$\{0,0.2,0.4\}$. The next two produce cluster $\{3.0,3.2\}$. The point $8.0$
has neighborhood $\{8.0\}$, is not within any core point's neighborhood, and is
labeled noise.

If $\operatorname{MinPts}$ were changed to $3$, only $0.2$ would be core.
Points $0$ and $0.4$ would be border points in its cluster, while $3.0$ and
$3.2$ would become noise. The arithmetic shows why the parameter is a modeling
choice, not merely a speed setting.

## Formal treatment

For a metric space $(X,d)$, define

$$
N_{\varepsilon}(p)=\{q\in X:d(p,q)\leq\varepsilon\}.
$$

A point $p$ is core when
$|N_{\varepsilon}(p)|\geq\operatorname{MinPts}$. A point $q$ is directly
density-reachable from $p$ when $p$ is core and
$q\in N_{\varepsilon}(p)$. Density reachability is the transitive closure of
that directed relation. Two points are density-connected if some point can
reach both. A DBSCAN cluster is maximal under density reachability and internally
density-connected.

The basic procedure visits each point, obtains its neighborhood, and expands a
cluster whenever the point is core. With an effective spatial index,
neighborhood queries can often be much cheaper than scanning every point; in
high dimensions or without an index, the worst practical behavior approaches
all-pairs work and $O(n^2)$ storage may be required.

## Assumptions and requirements

The metric, feature representation, and scale must make neighborhoods
meaningful. Standardizing arbitrary columns is not automatically correct: a
unit change in one feature must have an interpretable relationship to a unit
change in another. Categorical, sequence, or graph objects require a suitable
dissimilarity and a neighborhood-query implementation that respects it.

The chosen $\varepsilon$ and $\operatorname{MinPts}$ assume that clusters can be
distinguished at roughly one density level. Results should be checked for
stability across nearby values. Duplicate observations, boundary equality, and
whether the point itself counts toward $\operatorname{MinPts}$ must be handled
consistently with the implementation being used.

## Uses and applicability

Use DBSCAN for moderate-dimensional spatial or feature data when clusters may
have irregular shapes, the number of clusters is unknown, and sparse points
should remain unassigned. It is useful for geographic concentrations,
trajectory locations, and exploratory grouping after a defensible metric has
been established.

Avoid treating it as a universal anomaly detector or as a default for very
high-dimensional embeddings. When distances concentrate, a radius ceases to
separate near from far. When clusters differ sharply in density, a hierarchical
or variable-density method may fit the question better.

## Limitations and common mistakes

DBSCAN is sensitive to feature scaling and to both parameter values. Border
points reachable from more than one cluster may be assigned according to
traversal order, even though core clusters are stable. A narrow chain of core
points can connect groups that appear separate, while a small sparse gap can
split one semantic group.

Common mistakes include excluding the query point from the neighborhood when
an implementation includes it, selecting $\varepsilon$ after looking at desired
labels, interpreting every noise point as fraud, comparing cluster numbers
across parameter settings as if labels were identities, and reporting a plot
without the metric, scaling, radius, minimum size, and software convention that
produced it.

## Variants and alternatives

OPTICS orders points to expose clustering structure across multiple density
scales, and HDBSCAN develops a hierarchy before selecting stable regions; those
methods are not separately sourced by the registry used for this draft.
[Hierarchical Clustering](./hierarchical-clustering.md) supplies a general
multi-resolution tree, while k-means is simpler when roughly spherical
equal-scale groups and complete assignment are appropriate. Spectral clustering
can represent nonconvex graph-separated groups but still requires a graph and a
requested output partition.

## History and attribution

Martin Ester, Hans-Peter Kriegel, Jörg Sander, and Xiaowei Xu introduced DBSCAN
in their 1996 KDD paper. The paper framed the method around discovering
arbitrarily shaped clusters in spatial databases with minimal domain knowledge
and distinguishing noise. This draft uses that registered primary paper for the
algorithm, terminology, and attribution rather than reconstructing later
variants into the original account.

## Sources

- Ester, Kriegel, Sander, and Xu's DBSCAN paper supports the density-reachability
  definitions, expansion algorithm, parameter roles, noise treatment,
  complexity discussion, experimental motivation, and 1996 attribution used
  throughout this page.

## Prerequisites and next connections

Begin with [Unsupervised Learning](./unsupervised-learning.md), then compare
[k-Means](./k-means.md) and
[Hierarchical Clustering](./hierarchical-clustering.md). Read
[Complexity Analysis](./complexity-analysis.md) when deciding whether a
neighborhood index can make the intended dataset tractable. Spectral clustering
is the next useful comparison when connectivity is meaningful but density is
not.
