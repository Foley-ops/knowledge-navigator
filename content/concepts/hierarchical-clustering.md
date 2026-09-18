---
concept_id: concept.machine_learning.hierarchical_clustering
title: Hierarchical Clustering
slug: /concepts/hierarchical-clustering
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: Hierarchical clustering builds a nested family of groups by repeatedly merging the closest clusters or recursively splitting them, with a dendrogram recording every level of resolution.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.learning.unsupervised_learning
    note: The hierarchy is inferred from unlabeled observations or pairwise dissimilarities and needs unsupervised validation.
  - type: contrasts_with
    target: concept.machine_learning.k_means
    note: Hierarchical clustering records a nested sequence without revising earlier merges, while k-means iteratively optimizes one flat partition for a chosen k.
  - type: assumes
    target: concept.algorithms.complexity_analysis
    note: Pairwise distances and repeated merges impose time and memory costs that determine whether an implementation fits the dataset.
  - type: useful_when
    target: concept.machine_learning.principal_component_analysis
    note: A training-only low-dimensional representation can reduce noisy dimensions before distance calculation, though it also changes the hierarchy.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
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
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary historical sources for agglomerative hierarchical clustering and named linkage criteria
    reason: The registered source supports the modern algorithms but not a primary chronology, so inventor and first-use claims are omitted.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Hierarchical clustering** constructs a nested sequence of partitions. The
common agglomerative form starts with every observation in its own cluster and
repeatedly merges the pair of clusters with smallest linkage dissimilarity until
one cluster remains. A dendrogram records each merge and its height. Cutting the
dendrogram at a chosen height produces a flat partition.

Different linkage rules define “distance between clusters,” so they define
different algorithms, not cosmetic display options. Divisive methods run in the
opposite direction, recursively splitting a cluster containing all observations.

## Why it matters

Many datasets have meaningful organization at more than one scale: species into
genera and families, documents into topics and subtopics, or customers into
broad and narrow segments. A hierarchy retains these resolutions rather than
committing immediately to one number of clusters.

The method can also operate on a pairwise dissimilarity matrix, so inputs need
not have arithmetic means. This accommodates sequences, graphs, or other objects
when a defensible dissimilarity is available, while making clear that the chosen
dissimilarity and linkage jointly determine the result.

## Intuition

Lay every object on a separate island. At each step, build a bridge between the
two closest islands and treat the connected land as one island thereafter. The
height of each bridge says how dissimilar the joined groups were. A horizontal
waterline through the final bridge diagram reveals the groups present at that
resolution.

The analogy hides a crucial irreversibility: after two clusters merge, a greedy
agglomerative algorithm never separates them. A locally plausible early bridge
can force poor later structure, and a dendrogram does not quantify posterior
certainty about those choices.

## Concrete example

For points $0,2,5,9$ on the line, single linkage defines cluster distance as the
smallest cross-cluster point distance. It first merges $\{0\}$ and $\{2\}$ at
height $2$. Distances from $\{0,2\}$ to $\{5\}$ and $\{9\}$ are $3$ and $7$, so
it next merges $\{0,2\}$ with $\{5\}$ at height $3$. Finally the distance from
$\{0,2,5\}$ to $\{9\}$ is $4$, giving heights $(2,3,4)$.

Complete linkage uses the largest cross-cluster distance. It still merges
$\{0\},\{2\}$ at $2$, but the smallest remaining distance is now between
$\{5\}$ and $\{9\}$ at $4$. The final distance between $\{0,2\}$ and
$\{5,9\}$ is $9$, giving heights $(2,4,9)$. Cutting at height $4.5$ yields one
cluster under single linkage but two clusters, $\{0,2\}$ and $\{5,9\}$, under
complete linkage. The same data and base metric therefore encode different
group notions solely through linkage.

## Formal treatment

Let $d(i,j)$ be a dissimilarity between observations. For clusters $A,B$,
common agglomerative linkages are

$$
D_{\text{single}}(A,B)=\min_{i\in A,j\in B}d(i,j),
$$

$$
D_{\text{complete}}(A,B)=\max_{i\in A,j\in B}d(i,j),
$$

$$
D_{\text{average}}(A,B)=\frac1{|A||B|}
\sum_{i\in A,j\in B}d(i,j).
$$

At each iteration, merge an argmin pair under $D$ and update distances. Ward's
method instead chooses the merge that minimally increases within-cluster sum of
squares; in its standard interpretation it belongs with squared Euclidean
geometry.

For single linkage, the hierarchy is connected to a minimum spanning tree:
thresholding tree edges at a distance yields the same connected components.
Naive implementations store $O(n^2)$ dissimilarities and repeatedly search them;
practical algorithms improve constants or exploit linkage-specific structure,
but quadratic storage itself can rule out large $n$.

## Assumptions and requirements

Pairwise dissimilarities must be meaningful, consistently computed, and usually
symmetric with zero self-distance. Feature scaling, missingness, and encoding
must be settled before distances are formed. Linkage must match the intended
cluster notion: single linkage favors connectivity, complete linkage controls
diameter, and Ward linkage favors compact variance-based groups.

The observations should be sufficiently stable that an irreversible greedy
hierarchy is informative. A cut height or number of clusters remains a model-
selection choice if a flat answer is needed. Validation must not use labels or
test structure that the final unsupervised procedure would not have.

## Uses and applicability

Use hierarchical clustering when nested organization is itself valuable, when
the number of groups is not known in advance, when a pairwise dissimilarity is
more natural than centroids, or when a dendrogram can support careful exploratory
analysis on a moderate dataset.

Avoid it when sample count makes pairwise storage prohibitive, data arrive in a
stream requiring cheap updates, or the task needs probabilistic assignment and
uncertainty. For one large flat partition, a scalable partitioning method may be
more appropriate.

## Limitations and common mistakes

The hierarchy can be highly sensitive to scaling, noise, outliers, ties, and
linkage. Single linkage can chain through thin bridges; complete linkage can
fragment elongated groups. Early merges are never revisited. Dendrogram leaf
order is not unique and can make adjacent leaves look more meaningfully related
than the tree actually asserts.

Common mistakes include choosing linkage after inspecting desired labels,
reading merge height as a probability, using Ward linkage with an arbitrary
dissimilarity, ignoring tie-breaking, and claiming that a conspicuous visual cut
proves a natural cluster count.

## Variants and alternatives

Agglomerative and divisive strategies reverse construction direction. Single,
complete, average, centroid, and Ward linkages encode different notions of group
cohesion. k-Means directly optimizes a flat centroid partition; density-based
clustering identifies irregular dense regions and noise; spectral clustering
uses graph eigenvectors before partitioning. Bootstrap stability analysis can
probe whether branches persist under resampling, but it does not turn them into
Bayesian posterior probabilities.

## History and attribution

The registered statistical-learning text supports the modern linkage algorithms
and dendrogram interpretation, but it is not used here to establish first
publication or priority for each named rule. This draft therefore leaves the
historical chronology explicit and unresolved rather than assigning names or
dates without a registered primary source.

## Sources

- _The Elements of Statistical Learning_ supports agglomerative construction,
  linkage definitions, dendrogram cuts, comparisons among linkage behaviors,
  and the broader clustering context.

## Prerequisites and next connections

Read [Unsupervised Learning](./unsupervised-learning.md) and
[Complexity Analysis](./complexity-analysis.md). Compare
[k-Means](./k-means.md) for a centroid-based flat objective and
[Principal Component Analysis](./principal-component-analysis.md) for a linear
representation that changes the distances on which a hierarchy depends.
