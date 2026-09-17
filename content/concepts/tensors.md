---
concept_id: concept.linear_algebra.tensors
title: Tensors
slug: /concepts/tensors
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: One word covers three different things — a multilinear map on a vector space and its dual, an array of components obeying a fixed transformation law, and the plain multidimensional array a deep learning framework allocates — and only the first two are tensors in the mathematical sense.
categories:
  - Mathematics/Linear & Multilinear Algebra
primary_category: Mathematics/Linear & Multilinear Algebra
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: A tensor is defined on a vector space and its dual, and the whole construction rests on bases, dual bases and the change-of-basis matrix the transformation law is written in terms of.
  - type: generalizes
    target: concept.linear_algebra.matrix_theory
    note: A matrix is the order-2 case written in a basis, and the three different transformation rules for one 2x2 array of numbers are exactly what matrix notation hides by giving every such array the same name.
  - type: contrasts_with
    target: concept.linear_algebra.matrix_decompositions
    note: Almost nothing from the matrix case survives to order 3 — rank can depend on the field, best low-rank approximations can fail to exist, and computing rank is NP-hard — so tensor decomposition is a different subject rather than SVD with more indices.
  - type: prerequisite_of
    target: concept.deep_learning.convolutional_layer
    note: The four-axis arrays a convolutional layer consumes and produces are called tensors by every framework, and a reader needs to know that this usage carries none of the multilinear structure before reading the layer's index arithmetic.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - concrete-example
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **tensor** of type $(p, q)$ on a finite-dimensional vector space $V$ over a
field $\mathbb{F}$ is a map

$$
T : \underbrace{V^* \times \cdots \times V^*}_{p}
    \times \underbrace{V \times \cdots \times V}_{q} \longrightarrow \mathbb{F}
$$

that is linear in each argument when the others are held fixed, where $V^*$ is
the dual space of linear functionals on $V$. Equivalently, it is an element of
$V^{\otimes p} \otimes (V^*)^{\otimes q}$.

Three senses of the word circulate and they are not interchangeable:

1. **The multilinear map** above: no coordinates, no basis, no arrays.
2. **The transformation-law object** of physics and differential geometry: an
   indexed array that changes in a prescribed way when the basis or coordinate
   chart changes. This is (1) written in a basis.
3. **The framework array**: what `torch.Tensor`, `numpy.ndarray` and
   `jax.Array` hold — a strided block of memory with a shape, a dtype and a
   device. It is not a tensor in senses (1) or (2): nothing about it says how it
   would change under a change of basis, and it would not change.

## Why it matters

Coordinate-freedom is what makes a law of physics a law: if stress, curvature
and the metric are tensors, an equation between them that holds in one
coordinate system holds in every one, and the chart becomes a convenience rather
than a commitment. Einstein's field equations are an identity between tensor
fields for that reason, and Gaussian curvature is built invariantly from a
surface's two fundamental forms, so no choice of parameterisation changes it.
That it is moreover _intrinsic_ — computable from the first fundamental form
alone, and so unchanged by any isometry, which is what lets one call a sphere
curved without reference to the space it sits in — is a separate and deeper
fact, Gauss's Theorema Egregium, and not a consequence of coordinate-freedom:
mean curvature is assembled from the same two forms and is not intrinsic.

Sense (3) buys something else: one data structure over which vectorised kernels,
autodiff and GPU dispatch are written once. Conflating the two causes most of
the confusion around the word.

## Intuition

A tensor is a machine with slots. Feed each slot a vector (or a covector) and it
returns a number, linearly in whatever goes into any one slot: the inner product
has two vector slots, a linear map one covector slot and one vector slot.

The array of components is the machine's _lookup table_, filled in by feeding it
all combinations of basis vectors. The table depends on the basis; the machine
does not, and that is where the analogy breaks. Two people with different bases
write different tables for the same tensor, and the rule relating them is the
transformation law. A framework array has no such rule attached — it is a table
with no machine behind it.

## Concrete example

Take $V = \mathbb{R}^2$, the array
$M = \begin{bmatrix} 2 & 1 \\ 1 & 3 \end{bmatrix}$, and the sheared basis
$f_1 = e_1$, $f_2 = e_1 + e_2$, so that

$$
A = \begin{bmatrix} 1 & 1 \\ 0 & 1 \end{bmatrix}, \qquad
A^{-1} = \begin{bmatrix} 1 & -1 \\ 0 & 1 \end{bmatrix}.
$$

If $M$ holds a $(0,2)$ tensor (a bilinear form, both indices down), the new
components are $A^\top M A = \begin{bmatrix} 2 & 3 \\ 3 & 7 \end{bmatrix}$; if
it holds a $(1,1)$ tensor (a linear map, one index up, one down), they are
$A^{-1} M A = \begin{bmatrix} 1 & -1 \\ 1 & 4 \end{bmatrix}$. Same input, two
answers, because the array was never the object.

```python
import numpy as np

M = np.array([[2.0, 1.0], [1.0, 3.0]])
A = np.array([[1.0, 1.0], [0.0, 1.0]])

form = A.T @ M @ A                    # (0,2): [[2, 3], [3, 7]]
mapping = np.linalg.inv(A) @ M @ A    # (1,1): [[1, -1], [1, 4]]

np.trace(M), np.trace(mapping)        # (5.0, 5.0) — invariant
np.trace(form)                        # 9.0 — not invariant
```

The last two lines are the payoff. Summing $T^i{}_i$ over one upper and one
lower index is a contraction and gives $5$ in both bases — that is why the trace
of a linear map is well defined. Summing $g_{ii}$ over two lower indices is not,
and the number moves from $5$ to $9$. NumPy and PyTorch compute both sums
happily, because the array does not know which one it holds.

## Formal treatment

The **tensor product** $V \otimes W$ is characterised by a universal property:
it carries a bilinear map $\otimes : V \times W \to V \otimes W$ such that every
bilinear $b : V \times W \to U$ factors as $b = \tilde{b} \circ \otimes$ for a
unique linear $\tilde{b}$. This fixes $V \otimes W$ up to unique isomorphism,
and if $\{e_i\}$, $\{f_j\}$ are bases then $\{e_i \otimes f_j\}$ is one, so
$\dim(V \otimes W) = \dim V \cdot \dim W$. The slogan: it turns multilinear maps
into linear ones.

With $\dim V = n$, a basis $\{e_i\}$ and dual basis $\{e^i\}$ given by
$e^i(e_j) = \delta^i_j$, the components of a $(p,q)$ tensor are

$$
T^{i_1 \cdots i_p}{}_{j_1 \cdots j_q}
  = T\!\left(e^{i_1}, \ldots, e^{i_p}, e_{j_1}, \ldots, e_{j_q}\right),
$$

so that space has dimension $n^{p+q}$. Under a change of basis
$f_j = A^i{}_j e_i$, upper (**contravariant**) indices transform with $A^{-1}$
and lower (**covariant**) indices with $A$:

$$
\tilde{T}^{k_1 \cdots k_p}{}_{l_1 \cdots l_q}
= (A^{-1})^{k_1}{}_{i_1} \cdots (A^{-1})^{k_p}{}_{i_p}\,
  A^{j_1}{}_{l_1} \cdots A^{j_q}{}_{l_q}\,
  T^{i_1 \cdots i_p}{}_{j_1 \cdots j_q},
$$

with repeated indices summed (the Einstein convention); older texts take this
equation as the definition. **Contraction** sets one upper and one lower index
equal and sums, sending a $(p,q)$ tensor to a $(p-1,q-1)$ one; the $A$ and
$A^{-1}$ factors cancel, which is why the result is basis-independent. Matrix
trace is the contraction of a $(1,1)$ tensor, and matrix multiplication a
contraction of $(1,1) \otimes (1,1)$. Applied to each tangent space of a smooth
manifold, all of this gives a **tensor field**, with $A^{-1}$ replaced by the
Jacobian $\partial \tilde{x}^k / \partial x^i$.

## Assumptions and requirements

Finite dimension is assumed above. It is what makes $V \cong V^{**}$ canonical
and "tensor" and "array of components" interchangeable at all. In infinite
dimensions the algebraic tensor product is incomplete, and completing it
requires choosing a norm — for Banach spaces the projective and injective tensor
products differ, so there is no single $V \otimes W$ to speak of.

Raising and lowering indices needs extra structure: without a metric or inner
product, $V$ and $V^*$ are isomorphic but not canonically, and moving an index
is meaningless. In orthonormal Cartesian coordinates with orthogonal changes of
basis, $A^{-1} = A^\top$ and both index types transform identically — which is
why "Cartesian tensor" treatments ignore the distinction, and why it ambushes
readers meeting a non-Euclidean metric.

Over a general ring the tensor product exists but misbehaves:
$\mathbb{Z}/2 \otimes_{\mathbb{Z}} \mathbb{Z}/3 = 0$, so nonzero modules can
have zero tensor product and dimension counting fails.

## Uses and applicability

Reach for tensors when several vector-space arguments enter linearly and the
answer must not depend on coordinates: the stress and inertia tensors of
continuum mechanics, the metric and Riemann curvature of general relativity, the
fundamental forms of surface theory, and composite quantum systems, where a
product state is a simple tensor $\psi \otimes \phi$ and an entangled state is
one that cannot be so written.

Do not reach for it when the axes are unrelated bookkeeping: no change of basis
acts on the batch axis of a batch of images, and no contraction over it means
anything. Deep learning borrows the contraction _notation_ — `einsum` is
Einstein summation with explicit letters — without the transformation law.

## Limitations and common mistakes

The commonest error is believing a PyTorch tensor is a tensor in the
mathematical sense. It is a strided array with a shape, dtype and device,
indexed by position; nothing tracks covariance, and transposing an axis is a
metadata change, not a change of basis.

"Rank" is overloaded three ways: in physics it usually means the number of
indices, frameworks call that `ndim` or _order_, and in multilinear algebra the
**rank** of a tensor is the minimum $R$ with $T = \sum_{r=1}^{R} a_r \otimes b_r
\otimes c_r$. The last keeps almost none of the properties of matrix rank.
Computing it is NP-hard, a real tensor's rank over $\mathbb{R}$ can exceed its
rank over $\mathbb{C}$, the best rank-$R$ approximation can fail to exist
because the infimum is not attained, and no Eckart–Young theorem lets you
truncate a decomposition to get it.

Finally, not everything with indices is a tensor. The Christoffel symbols
$\Gamma^k{}_{ij}$ have three and are not one — their transformation law carries
an extra inhomogeneous term — and the partial derivative of a tensor field's
components is not one either, which is why the covariant derivative exists.

## Variants and alternatives

**Symmetric** and **antisymmetric** tensors are the invariant subspaces under
permuting slots; the antisymmetric ones form the exterior algebra, and
differential forms are the leaner alternative when antisymmetry is all you need,
buying an integration theory and Stokes' theorem at the cost of not representing
a general tensor. **Tensor networks** (matrix product states, tensor trains)
draw contractions as wires between boxes in Penrose's graphical notation, and
**abstract index notation** keeps indices that refer to no basis at all. Among
decompositions, **CP** writes a tensor as a sum of simple terms and is often
essentially unique under mild conditions — unlike matrix factorisation, unique
only up to rotation — while **Tucker** and **HOSVD** keep a dense core, more
stable but less interpretable. The genuinely different alternative is to drop
the structure: a plain array with named axes.

## History and attribution

The word arrived twice. Hamilton used _tensor_ in the 1840s for a quaternion's
stretching magnitude, a meaning now gone. The modern sense comes from elasticity
and crystal physics, where Woldemar Voigt used it late in the nineteenth century
for quantities describing directional stress, and from the **absolute
differential calculus** of Gregorio Ricci-Curbastro, set out with his student
Tullio Levi-Civita in their 1900 paper _Méthodes de calcul différentiel absolu
et leurs applications_. Einstein adopted it for general relativity around 1915
and introduced the summation convention shortly after; that theory's success
made tensor calculus standard equipment.

The algebraic side is later and separate: the universal-property definition is
usually traced to Hassler Whitney's work on tensor products of abelian groups in
the late 1930s, after which the construction became a statement about modules
rather than indices. The machine learning usage is a naming convention inherited
from numerical computing libraries.

## Sources

Axler supplies the coordinate-free substrate — vector spaces, dual spaces and
linear maps as objects rather than arrays. MathWorld is the quick reference for
the classical transformation-law definition, the summation convention and
contraction. MIT 18.950 shows order-2 tensor fields at work on surfaces. The
PyTorch documentation describes sense (3): what a framework tensor is made of,
and what it does not carry.

## Prerequisites and next connections

Understand vector spaces, bases and — usually the gap — dual spaces first. A
reader comfortable with linear maps as matrices but not with functionals as
objects will find the covariant/contravariant distinction arbitrary rather than
forced.

From here, [Multivariable Calculus](./multivariable-calculus.md) supplies the
Jacobian that turns a change of coordinates into a change of basis at each
point — the step from tensors to tensor fields.
[Category Theory](./category-theory.md) says what kind of statement the
universal property is; the infinite-dimensional completions live in
[Functional Analysis](./functional-analysis.md) and
[Hilbert Spaces](./hilbert-spaces.md); and the
[Convolutional Layer](./convolutional-layer.md) is where to watch the array
sense at work.
