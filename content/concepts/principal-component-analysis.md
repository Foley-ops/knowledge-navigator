---
concept_id: concept.machine_learning.principal_component_analysis
title: Principal Component Analysis
slug: /concepts/principal-component-analysis
aliases: []
kind: method
tier: 1
review_state: generated-draft
summary: Principal component analysis rotates centered data onto orthogonal directions of decreasing sample variance, providing the optimal linear low-rank reconstruction under squared error.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.linear_algebra.matrix_decompositions
    note: PCA is computed through an eigendecomposition of the covariance matrix or, more stably, a singular value decomposition of the centered data matrix.
  - type: contributes_to
    target: concept.learning.unsupervised_learning
    note: PCA learns a lower-dimensional representation from inputs without using response labels.
  - type: contrasts_with
    target: concept.machine_learning.independent_component_analysis
    note: PCA decorrelates components and orders their variance, whereas ICA seeks statistically independent non-Gaussian sources.
  - type: useful_when
    target: concept.machine_learning.k_nearest_neighbors
    note: Validated dimensionality reduction can reduce noise and search cost before distance-based prediction, though high variance need not mean predictive relevance.
sources:
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
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
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary historical attribution for principal component analysis
    reason: The registered sources support the modern linear-algebraic treatment but are not used here to establish the original priority and dates.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Principal component analysis** (PCA) finds orthonormal directions along which
centered observations vary most. The first principal direction maximizes sample
variance among unit vectors; each later direction maximizes remaining variance
subject to being orthogonal to the earlier directions. Coordinates obtained by
projecting onto these directions are the principal-component scores.

Equivalently, retaining the first $r$ components gives the rank-$r$ linear
reconstruction with minimum squared error. PCA is a rotation followed, when used
for dimensionality reduction, by discarding low-variance coordinates.

## Why it matters

Correlated measurements often contain fewer effective degrees of freedom than
their column count suggests. PCA exposes those directions, compresses storage,
reduces computation, visualizes high-dimensional samples, and can remove noisy
low-variance variation before another model.

It also turns an informal idea—“keep most of the variation”—into a precise
optimization problem with a global solution and an exact reconstruction-error
identity. That precision makes clear what PCA preserves and, equally important,
what it ignores: labels, nonlinear structure, and any scientific meaning not
aligned with variance.

## Intuition

Fit an ellipsoid to a centered point cloud. Its longest axis is the first
principal direction, its next orthogonal axis is the second, and the squared
axis lengths are proportional to component variances. Projecting onto the first
few axes keeps the broadest spread of the cloud.

The ellipsoid picture breaks for curved manifolds, heavy outliers, and mixed
units. A single global rotation cannot flatten a curved surface, and one extreme
point can swing a squared-error axis. “Largest variance” also does not mean
“most useful for predicting a target.”

## Concrete example

Take four already centered observations:

$$
X=\begin{bmatrix}2&0\\-2&0\\0&1\\0&-1\end{bmatrix}.
$$

Using divisor $n=4$, the covariance is

$$
S=\frac14X^TX=
\begin{bmatrix}2&0\\0&1/2\end{bmatrix}.
$$

Its eigenvectors are $v_1=(1,0)^T$ and $v_2=(0,1)^T$ with eigenvalues $2$ and
$1/2$. The first component scores are $Xv_1=(2,-2,0,0)^T$. Reconstructing from
that one component gives $(2,0),(-2,0),(0,0),(0,0)$.

The discarded squared error is $1^2+(-1)^2=2$. The same result follows from the
discarded eigenvalue: $n\lambda_2=4(1/2)=2$. The retained explained-variance
ratio is $2/(2+1/2)=0.8$, or $80\%$. These values depend on scaling: multiplying
the second column by three would change its variance to $4.5$ and make it the
first component.

## Formal treatment

Let $X_c\in\mathbb R^{n\times d}$ contain rows $x_i-\bar x$. For divisor $n$,
$S=X_c^TX_c/n$. The first loading solves

$$
v_1=\arg\max_{\lVert v\rVert=1}v^TSv,
$$

so $v_1$ is an eigenvector of $S$ for its largest eigenvalue. Subsequent
loadings solve the same problem with $v_j^Tv_k=0$ for $k<j$. If
$X_c=U\Sigma V^T$ is a singular value decomposition, the loading vectors are
columns of $V$, scores are $X_cV=U\Sigma$, and covariance eigenvalues are
$\lambda_j=\sigma_j^2/n$.

The rank-$r$ approximation $X_r=U_r\Sigma_rV_r^T$ minimizes
$\lVert X_c-Z\rVert_F$ over matrices $Z$ of rank at most $r$, with squared error
$\sum_{j>r}\sigma_j^2$. Loadings are sign-indeterminate: $v$ and $-v$ describe
the same component.

## Assumptions and requirements

Rows should be comparable observations and columns numeric features for which
linear combinations make sense. Data must be centered; scale standardization is
needed when units are arbitrary and relative variance should not encode feature
importance. Missing-data handling must be chosen explicitly rather than letting
pairwise covariance estimates produce an incoherent matrix.

Dimensionality reduction assumes the desired signal lies mainly in a linear
high-variance subspace and squared reconstruction error is the relevant loss.
The retained dimension must be selected inside the training process if PCA feeds
a supervised model; fitting PCA before cross-validation leaks validation
distribution information.

## Uses and applicability

Use PCA for compression, exploratory score plots, visualization, decorrelation,
and conditioning a downstream method when features are numerous and strongly
correlated. It is particularly natural for dense measurements with comparable
semantics and approximately linear structure.

Avoid it when rare low-variance directions carry the target, components must be
directly interpretable, outliers dominate squared error, or geometry is strongly
nonlinear. Sparse count data may call for a decomposition suited to counts or
sparsity rather than centered dense PCA.

## Limitations and common mistakes

PCA is sensitive to units and outliers. Components are uncorrelated in the
sample, not generally independent. Explained variance measures reconstruction,
not causal importance or predictive value. Loadings can change substantially
when leading eigenvalues are close even when the leading subspace is stable.

Common mistakes include omitting centering, standardizing with test statistics,
mixing $n$ and $n-1$ covariance conventions while comparing eigenvalues, and
interpreting loading signs as intrinsically meaningful. A two-dimensional plot
can hide substantial structure in discarded components.

## Variants and alternatives

Standardized PCA operates on the correlation matrix. Whitening additionally
rescales component scores to unit variance. Sparse PCA encourages interpretable
loadings; robust PCA variants reduce sensitivity to outliers. Kernel PCA applies
the eigenanalysis to a centered kernel Gram matrix, while ICA seeks independent
rather than merely uncorrelated directions. Truncated SVD can operate without
explicit covariance formation.

## History and attribution

The registered course and textbook sources support the modern covariance and
SVD formulations but are not treated here as primary evidence for the original
priority of PCA. Names, dates, and competing early formulations are therefore
left for a future source-registry addition rather than reconstructed from memory.

## Sources

- MIT 18.065 supports the SVD, low-rank approximation, scores, loadings, and
  reconstruction-error treatment.
- _The Elements of Statistical Learning_ supports PCA as an unsupervised linear
  representation and its use and limitations in statistical learning.

## Prerequisites and next connections

Read [Matrix Decompositions](./matrix-decompositions.md) and
[Matrix Theory](./matrix-theory.md), then [Unsupervised Learning](./unsupervised-learning.md).
Continue to [Independent Component Analysis](./independent-component-analysis.md)
to see why decorrelation is weaker than independence, or to
[Kernel Methods](./kernel-methods.md) for nonlinear feature-space extensions.
