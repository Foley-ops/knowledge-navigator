---
concept_id: concept.machine_learning.kernel_methods
title: Kernel Methods
slug: /concepts/kernel-methods
aliases: []
kind: method
tier: 1
review_state: generated-draft
summary: Kernel methods express learning algorithms through pairwise inner products supplied by a positive-semidefinite kernel, enabling linear procedures in implicit nonlinear feature spaces.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: A valid kernel is interpreted as an inner product between feature vectors in a possibly implicit vector space.
  - type: contributes_to
    target: concept.machine_learning.support_vector_machines
    note: Replacing inner products in the SVM dual by kernel evaluations yields nonlinear maximum-margin classifiers.
  - type: prerequisite_of
    target: concept.machine_learning.gaussian_processes
    note: Gaussian-process covariance functions obey the same positive-semidefinite Gram-matrix condition and determine smoothness and similarity assumptions.
  - type: contrasts_with
    target: concept.machine_learning.principal_component_analysis
    note: Ordinary PCA is linear in explicit coordinates, while kernel PCA performs an analogous eigendecomposition through an implicit feature-space Gram matrix.
sources:
  - source_id: source.rasmussen.gaussian_processes
    title: Rasmussen and Williams, Gaussian Processes for Machine Learning
    url: https://gaussianprocess.org/gpml/
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
  - source_id: source.cortes1995.support_vector_networks
    title: Support-Vector Networks
    url: https://link.springer.com/article/10.1007/BF00994018
    source_kind: primary-research
    supports:
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary history of the kernel trick before support-vector machines
    reason: The registered sources support modern kernel constructions and kernelized SVMs but do not establish the earlier chronology.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **kernel method** is an algorithm written in terms of pairwise evaluations
$k(x,z)$ that act as inner products $\langle\phi(x),\phi(z)\rangle$ in some
feature space $\mathcal H$. The map $\phi$ need not be constructed explicitly.
A symmetric function is a valid positive-semidefinite kernel when every finite
Gram matrix $K_{ij}=k(x_i,x_j)$ is positive semidefinite.

The “kernel trick” is therefore conditional, not magical: an algorithm must be
expressible through inner products, and the substituted function must satisfy
the Gram-matrix condition. The result is a linear method in $\mathcal H$ whose
boundary or regression function can be nonlinear in the original inputs.

## Why it matters

Explicitly listing all nonlinear features can be impossible. A degree-$p$
polynomial expansion grows combinatorially with input dimension, while one
kernel evaluation may compute its inner product directly. This gives a uniform
way to construct nonlinear support-vector machines, ridge regressors, principal
components, and covariance models.

Kernels also encode prior knowledge as similarity. Functions for strings,
graphs, periodic signals, or spatial coordinates can state which changes should
matter without forcing each object into a generic fixed-length vector first.

## Intuition

Imagine lifting points onto a curved surface where a flat cut becomes adequate.
The algorithm needs only angles and lengths between lifted points, not their
coordinates. A kernel supplies those inner products on demand.

The picture breaks if “similarity” is chosen only because it sounds plausible.
Not every similarity is a valid inner product, and even a valid kernel can encode
the wrong invariances. A very narrow radial kernel makes almost every distinct
pair orthogonal; a very wide one makes almost every pair indistinguishable.

## Concrete example

Use the degree-two polynomial kernel $k(x,z)=(1+xz)^2$ for scalar inputs. An
explicit feature map is

$$
\phi(x)=(1,\sqrt2x,x^2),
$$

because $\phi(x)^T\phi(z)=1+2xz+x^2z^2=(1+xz)^2$. For training inputs
$x=(0,1,2)$, the Gram matrix is

$$
K=\begin{bmatrix}
1&1&1\\
1&4&9\\
1&9&25
\end{bmatrix}.
$$

For coefficients $a=(1,-2,1)$,
$a^TKa=1-4+2+16-36+25=4\ge0$, as positive semidefiniteness requires.
The represented function is

$$
f(x)=\sum_{i=1}^3a_i k(x_i,x)
=1-2(1+x)^2+(1+2x)^2=2x^2+4x,
$$

a nonlinear quadratic obtained using three kernel evaluations and no explicit
feature expansion in the algorithm.

## Formal treatment

For any points $x_1,\ldots,x_n$ and coefficients $a\in\mathbb R^n$, a valid
kernel satisfies

$$
a^TKa=\sum_{i,j}a_ia_jk(x_i,x_j)\ge0.
$$

This condition guarantees an associated Hilbert-space feature representation.
Sums and nonnegative scalar multiples of kernels are kernels; products are also
kernels. Common examples include the linear kernel $x^Tz$, polynomial kernels,
and the radial basis function kernel
$\exp(-\lVert x-z\rVert^2/(2\ell^2))$.

Regularized empirical-risk problems of the form

$$
\min_{f\in\mathcal H}\sum_iL(y_i,f(x_i))+\lambda\lVert f\rVert_\mathcal H^2
$$

have solutions in the span of evaluated kernels,
$f(\cdot)=\sum_i\alpha_i k(x_i,\cdot)$, under the usual representer-theorem
conditions. The infinite-dimensional search thereby reduces to $n$
coefficients. Computation is not free: dense methods store $O(n^2)$ Gram entries
and direct linear algebra may cost $O(n^3)$.

## Assumptions and requirements

The kernel must be symmetric and positive semidefinite for standard convex and
probabilistic interpretations. Inputs must be preprocessed consistently, and
kernel hyperparameters such as length scale or polynomial degree must be chosen
using training-only validation. Regularization remains essential because a rich
feature space can interpolate finite data.

The sample must also be small enough for the selected solver or paired with a
justified approximation. A tiny negative eigenvalue from floating-point error is
different from a substantially indefinite similarity; silently clipping the
latter changes the model rather than validating the kernel.

## Uses and applicability

Use kernels for moderate datasets where domain similarity can be expressed
pairwise, nonlinear structure matters, and the sample-size cost is acceptable.
They work particularly well with high-dimensional sparse inputs and structured
objects when a meaningful kernel already exists.

Avoid dense kernel methods when millions of training examples make the Gram
matrix impossible, when latency requires a tiny explicit model, or when learned
representations can exploit abundant data more effectively. Kernel quality, not
the word “nonlinear,” should drive the choice.

## Limitations and common mistakes

Memory and training costs scale poorly with sample count. Hyperparameters can
change the geometry drastically, and interpreting a kernel value as a calibrated
probability is incorrect. Centering for kernel PCA must occur in feature space
through the Gram matrix; centering raw inputs alone is not equivalent for a
nonlinear kernel.

Common mistakes include using an indefinite custom similarity, tuning on the
test set, omitting regularization, and claiming the implicit map makes dimension
irrelevant. It avoids constructing feature coordinates, but effective capacity
and statistical difficulty remain.

## Variants and alternatives

Kernel ridge regression uses squared loss and a Gram-matrix linear solve;
kernel SVM uses hinge loss and a quadratic program; Gaussian processes interpret
a kernel as covariance. Kernel PCA performs spectral analysis on a centered
Gram matrix. Random Fourier features and Nyström approximations produce finite
explicit features that trade exactness for scalable linear methods.

## History and attribution

The registered Cortes and Vapnik paper verifies the use of dot-product kernels
for nonlinear support-vector decision surfaces. The registry does not establish
the earlier history of kernel substitution across statistics and pattern
recognition, so this page deliberately leaves that priority question unresolved.

## Sources

- _Gaussian Processes for Machine Learning_ supports positive-semidefinite
  kernels, covariance constructions, hyperparameter roles, and computational
  limitations.
- _Support-Vector Networks_ supports kernelized maximum-margin classification
  and its paper-level attribution.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) for inner products and
[Matrix Theory](./matrix-theory.md) for positive-semidefinite Gram matrices.
Continue to [Support Vector Machines](./support-vector-machines.md) for a
discriminative use and [Gaussian Processes](./gaussian-processes.md) for a
probabilistic one. [Principal Component Analysis](./principal-component-analysis.md)
provides the linear spectral baseline for kernel PCA.
