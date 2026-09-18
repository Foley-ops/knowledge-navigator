---
concept_id: concept.machine_learning.k_means
title: k-Means
slug: /concepts/k-means
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: k-Means partitions numeric observations into k groups by alternating nearest-centroid assignments with centroid updates to reduce within-cluster squared Euclidean distance.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.learning.unsupervised_learning
    note: k-Means infers a partition from unlabeled inputs and must be evaluated without treating cluster labels as observed targets.
  - type: assumes
    target: concept.linear_algebra.vector_spaces
    note: Means and squared Euclidean distances require numeric vector coordinates in which averaging is meaningful.
  - type: contrasts_with
    target: concept.machine_learning.hierarchical_clustering
    note: k-Means optimizes one flat k-partition, whereas hierarchical clustering builds a nested merge or split structure without revising earlier decisions.
  - type: contributes_to
    target: concept.machine_learning.bias_variance
    note: Choosing k controls representation granularity, with small k underfitting structure and large k fitting sampling noise.
sources:
  - source_id: source.lloyd1982.least_squares_quantization
    title: Least squares quantization in PCM
    url: https://ieeexplore.ieee.org/document/1056489
    source_kind: primary-research
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
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
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**k-Means** partitions $n$ numeric observations into exactly $k$ nonempty
clusters. Each cluster is represented by its arithmetic mean, or centroid, and
the objective is to minimize the sum of squared Euclidean distances from every
point to its assigned centroid. The standard algorithm alternates two steps:
assign each point to its nearest centroid, then replace every centroid by the
mean of the points assigned to it.

The algorithm is a local optimization procedure, not a guarantee of the globally
best $k$-partition. “Means” is literal: the input space must support meaningful
averaging and squared Euclidean distance.

## Why it matters

k-Means reduces a dataset to a partition plus $k$ representative vectors. That
simple summary supports exploratory segmentation, vector quantization,
prototype construction, and preprocessing for later models. Its iterations are
easy to implement and scale to large dense numeric datasets.

The method also provides a precise baseline for clustering claims. If a more
elaborate method cannot improve a relevant evaluation over k-means, its extra
structure may not be earning its cost. Conversely, k-means failures reveal when
shape, density, uncertainty, or categorical structure matters.

## Intuition

Place $k$ prototypes, give each observation to the closest prototype, and move
each prototype to the center of its assigned observations. Assignment improves
the objective while centers are fixed; taking a mean improves it while
assignments are fixed. Repetition descends until neither step changes the fit.

The picture breaks for elongated, nested, or unequal-density groups. Nearest-
centroid regions are convex Voronoi cells, so a ring around a central cluster
cannot be represented as two natural clusters regardless of initialization.

## Concrete example

Cluster the one-dimensional points $0,2,9,11$ with $k=2$ and initial centroids
$\mu_1=0$, $\mu_2=2$. The first assignment sends $0$ to cluster 1 and
$2,9,11$ to cluster 2. Updating gives

$$
\mu_1=0,\qquad \mu_2=(2+9+11)/3=22/3.
$$

Reassigning to $0$ and $22/3$ sends $0,2$ to cluster 1 and $9,11$ to cluster 2.
The next means are $\mu_1=1$ and $\mu_2=10$. Assignments now remain unchanged.
The final within-cluster sum of squares is

$$
J=(0-1)^2+(2-1)^2+(9-10)^2+(11-10)^2=4.
$$

The objective after the first assignment and update was
$0+(2-22/3)^2+(9-22/3)^2+(11-22/3)^2=134/3\approx44.67$,
so the computed iterations decrease it sharply. Starting elsewhere can trace a
different path, which is why multiple initializations matter.

## Formal treatment

For observations $x_i\in\mathbb R^d$, assignments $z_i\in\{1,\ldots,k\}$,
and centers $\mu_1,\ldots,\mu_k$, minimize

$$
J(z,\mu)=\sum_{i=1}^n\lVert x_i-\mu_{z_i}\rVert_2^2.
$$

With centers fixed, choosing the nearest center independently minimizes every
summand. With assignments fixed, differentiating the terms for cluster $j$
shows their unique minimizer, when nonempty, is

$$
\mu_j=\frac1{|C_j|}\sum_{i\in C_j}x_i.
$$

Thus each alternating step does not increase $J$. There are finitely many
assignments, so with deterministic tie handling the procedure terminates at a
fixed assignment, generally a local minimum or stationary configuration rather
than the global optimum. The pairwise identity

$$
\sum_{i\in C}\lVert x_i-\bar x_C\rVert^2
=\frac1{2|C|}\sum_{i,j\in C}\lVert x_i-x_j\rVert^2
$$

connects centroid compactness to within-cluster pairwise dispersion.

## Assumptions and requirements

Observations must live in a common numeric vector space, and the arithmetic mean
must be a valid representative. Squared Euclidean distance assumes spherical,
roughly comparable cluster spread after scaling. Feature units define the
objective, so standardization or domain-specific scaling must be fitted and
justified.

$k$ must be chosen externally, and results assume initialization is explored
well enough to avoid an obviously poor local solution. Missing values require a
principled treatment. Empty clusters need an explicit reinitialization rule;
silently dividing by zero is not an algorithm.

## Uses and applicability

Use k-means for compact, roughly spherical clusters in continuous features,
vector quantization, codebook construction, and fast exploratory segmentation.
It is strongest when a centroid is itself meaningful and sample size makes more
expensive clustering unattractive.

Avoid it for arbitrary categorical records, nonconvex shapes, substantial
outliers, or strongly unequal cluster sizes and densities. Do not infer that a
partition corresponds to real classes merely because the objective is low.

## Limitations and common mistakes

The result depends on $k$, initialization, scaling, and outliers. Squared
distance gives faraway points large leverage. Labels are arbitrary across runs,
and cluster number 1 has no stable semantic meaning. The objective always falls
as $k$ increases and reaches zero at $k=n$, so raw training objective cannot
select $k$ by itself.

Common mistakes include one random start, comparing objectives across differently
scaled data, applying means to category codes, reporting a visually pleasing
two-dimensional projection as validation, and treating convergence as proof of
global optimality.

## Variants and alternatives

k-means++ improves seed placement. Mini-batch k-means trades exact batch updates
for scalable stochastic ones. k-Medoids represents each cluster by an observed
point and can use broader dissimilarities. Gaussian mixtures give soft
probabilistic assignments and covariance models. Hierarchical clustering
provides nested structure; density-based methods can recover irregular shapes
and mark noise.

## History and attribution

Lloyd's registered paper presents the least-squares quantization procedure and
its alternating partition and centroid conditions. It supplies the historical
anchor used here. The broader history of closely related rediscoveries is not
expanded beyond the registered sources.

## Sources

- Lloyd's _Least squares quantization in PCM_ supports the alternating nearest-
  representative and centroid update, squared-error criterion, and attribution.
- _The Elements of Statistical Learning_ supports the statistical clustering
  treatment, limitations, initialization concerns, and alternatives.

## Prerequisites and next connections

Read [Unsupervised Learning](./unsupervised-learning.md) and
[Vector Spaces](./vector-spaces.md). Compare
[Hierarchical Clustering](./hierarchical-clustering.md) for nested partitions
and [Gaussian Processes](./gaussian-processes.md) as a reminder that probabilistic
latent structure and uncertainty require a different modeling objective.
