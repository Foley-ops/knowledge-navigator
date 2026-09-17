---
concept_id: concept.linear_algebra.matrix_theory
title: Matrix Theory
slug: /concepts/matrix-theory
aliases:
  - matrix algebra
kind: concept
tier: 1
review_state: generated-draft
summary: The finite-dimensional theory of linear maps written in coordinates, where composition becomes matrix multiplication and rank, determinant and trace are the quantities that survive a change of basis.
categories:
  - Mathematics/Linear & Multilinear Algebra
primary_category: Mathematics/Linear & Multilinear Algebra
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: A matrix means nothing until a basis is chosen for the domain and the codomain, so the vector space and its bases are logically prior to the array of numbers.
  - type: prerequisite_of
    target: concept.linear_algebra.matrix_decompositions
    note: Every factorisation is a statement about writing one matrix as a product of structured ones, which presupposes the multiplication rule, rank and invertibility developed here.
  - type: prerequisite_of
    target: concept.linear_algebra.spectral_theory
    note: Eigenvalues are defined through the characteristic polynomial of a matrix and are meaningful for the underlying operator only because similarity leaves that polynomial fixed.
  - type: specializes
    target: concept.analysis.operators
    note: A matrix is the finite-dimensional case of a linear operator; in infinite dimensions an array against a basis no longer determines the operator, and determinant and trace must be rebuilt, when they exist at all.
sources:
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mathworks.matlab
    title: MATLAB documentation
    url: https://www.mathworks.com/help/matlab/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **matrix** over a field $F$ is a rectangular array $A = (a_{ij})$ with $m$ rows
and $n$ columns; **matrix theory** studies what such arrays do when you multiply,
invert and decompose them, and which of their properties belong to the array
rather than to the linear map it stands for. The bridge is this: once you fix an
ordered basis of an $n$-dimensional space $V$ and of an $m$-dimensional space
$W$, the linear maps $V \to W$ are in bijection with $m \times n$ matrices,
composition becomes matrix multiplication, and every question about the map
becomes a finite computation on numbers.

## Why it matters

The bijection is what makes linear algebra effective rather than merely elegant.
"Does $Ax = b$ have a solution, and is it unique?" is a question about a map
between abstract spaces; Gaussian elimination answers it exactly, in about
$\tfrac{2}{3}n^3$ operations. The same array then represents a Jacobian, a
Markov transition, a graph, a covariance, or a neural network layer, and one set
of machinery — rank, null space, eigenvalues, factorisation — serves all of
them. Matrix theory is also where the bookkeeping is kept honest: distinguishing
a fact about a linear map from a fact about one of its coordinate representations
is what separates mathematics that transfers from an artefact of notation.

## Intuition

Read the columns. The $j$-th column of $A$ is the image of the $j$-th basis
vector, in the basis of the target. Everything follows: $Ax$ combines the columns
with weights $x$, so the column space is the set of reachable outputs; the null
space records the combinations of columns that cancel; and $AB$ is "apply $B$,
then apply $A$", which is why multiplication is associative but not commutative.

A matrix is to a linear map what a decimal expansion is to a number: faithful
notation in a chosen system, not the thing itself. The analogy breaks in one
place. Changing basis is not a harmless re-spelling but a group action, and it
destroys structure you may be relying on — sparsity, bandedness, symmetry and
entrywise positivity belong to the array, not the map. And a matrix is often not
a map at all: a data matrix whose rows are samples has no natural "apply it to a
vector" reading.

## Concrete example

Take

$$
A = \begin{bmatrix} 1 & 2 & 3 \\ 2 & 4 & 7 \\ 3 & 6 & 10 \end{bmatrix}.
$$

Row three is row one plus row two, and column two is twice column one, so
$\operatorname{rank} A = 2$. Elimination gives the reduced rows $(1,2,0)$ and
$(0,0,1)$, so the null space is spanned by $(-2,1,0)^{\mathsf T}$ — one
dimension, and $2 + 1 = 3 = n$. The left null space is spanned by
$(1,1,-1)^{\mathsf T}$, because $r_1 + r_2 - r_3 = 0$. The column space is
$\operatorname{span}\{(1,2,3)^{\mathsf T}, (3,7,10)^{\mathsf T}\}$, and both are
orthogonal to $(1,1,-1)^{\mathsf T}$: $1 + 2 - 3 = 0$ and $3 + 7 - 10 = 0$.
Cofactor expansion confirms $\det A = 1(40-42) - 2(20-21) + 3(12-12) = 0$, while
$\operatorname{tr} A = 1 + 4 + 10 = 15$.

Now change basis, on a smaller matrix:

$$
A = \begin{bmatrix} 2 & 1 \\ 0 & 3 \end{bmatrix}, \qquad
S = \begin{bmatrix} 1 & 1 \\ 0 & 1 \end{bmatrix}, \qquad
S^{-1} A S = \begin{bmatrix} 2 & 0 \\ 0 & 3 \end{bmatrix}.
$$

Both matrices represent the _same_ operator, in two bases. Trace $5$,
determinant $6$, rank $2$ and eigenvalues $\{2,3\}$ agree, as they must. The
entries do not: the off-diagonal $1$ vanished. Nor does the Frobenius norm,
$\sqrt{14} \approx 3.742$ against $\sqrt{13} \approx 3.606$; nor do the singular
values, $\sqrt{7 \pm \sqrt{13}} \approx 3.257, 1.842$ against $3, 2$. Both pairs
multiply to $|\det| = 6$, but individually they are not invariants.

```python
import numpy as np
A = np.array([[1., 2., 3.], [2., 4., 7.], [3., 6., 10.]])
np.linalg.matrix_rank(A)   # 2 — computed from a tolerance on the singular values
np.trace(A)                # 15.0
np.linalg.det(A)           # NOT exactly 0.0: floating-point elimination leaves a
                           # tiny residue, which is why det is a bad rank test
```

## Formal treatment

Let $V, W$ be finite-dimensional over $F$ with ordered bases
$\mathcal{B} = (v_1,\dots,v_n)$ and $\mathcal{C} = (w_1,\dots,w_m)$. For linear
$T : V \to W$, the matrix $[T]_{\mathcal{C}\mathcal{B}} \in F^{m \times n}$ has
$j$-th column the $\mathcal{C}$-coordinates of $Tv_j$. Then
$[Tu]_{\mathcal{C}} = [T]_{\mathcal{C}\mathcal{B}}[u]_{\mathcal{B}}$ and
$[S \circ T] = [S][T]$, where $(AB)_{ij} = \sum_k a_{ik} b_{kj}$.

Change of basis splits in two. Allowing different bases on each side gives
**equivalence**, $A \mapsto Q^{-1} A P$ for invertible $P, Q$, whose complete
invariant is the rank alone: every $A$ of rank $r$ is equivalent to
$\begin{bmatrix} I_r & 0 \\ 0 & 0\end{bmatrix}$. Taking $V = W$ with one basis
used twice gives **similarity**, $A \mapsto S^{-1} A S$, which preserves more.

Define $\operatorname{rank} A = \dim \operatorname{col}(A)$; it equals
$\dim \operatorname{row}(A)$, and $\operatorname{rank} A + \dim \ker A = n$
(rank–nullity). The **fundamental theorem of linear algebra** places the four
subspaces of $A \in \mathbb{R}^{m \times n}$ with the standard inner product:

$$
\mathbb{R}^n = \operatorname{row}(A) \oplus \ker(A), \qquad
\mathbb{R}^m = \operatorname{col}(A) \oplus \ker(A^{\mathsf T}),
$$

with each pair orthogonal complements, of dimensions $r$ and $n-r$, and $r$ and
$m-r$. Over $\mathbb{C}$ the conjugate transpose $A^{*}$ replaces
$A^{\mathsf T}$; with the plain transpose the orthogonality statement is false.

The **determinant** is the unique function of the $n$ columns that is
multilinear, alternating, and equal to $1$ at the identity; it satisfies
$\det(AB) = \det A \det B$, and over a field $A$ is invertible exactly when
$\det A \neq 0$. The **trace** $\operatorname{tr} A = \sum_i a_{ii}$ satisfies
$\operatorname{tr}(AB) = \operatorname{tr}(BA)$ whenever both products are
defined. Multiplicativity and cyclicity give
$\det(S^{-1}AS) = \det A$ and $\operatorname{tr}(S^{-1}AS) = \operatorname{tr} A$,
so both belong to the operator — as does the characteristic polynomial
$\chi_A(\lambda) = \det(\lambda I - A)$, hence the eigenvalues, whose sum is the
trace and whose product is the determinant, counted with algebraic multiplicity
in an algebraic closure. Cayley–Hamilton adds $\chi_A(A) = 0$.

## Assumptions and requirements

The map-matrix bijection needs a field, finite dimension, and an _ordered_ basis
on each side — reorder a basis and you permute rows or columns. Over a
commutative ring the array still multiplies, but $A$ is invertible only when
$\det A$ is a unit (over $\mathbb{Z}$, $\det A = \pm 1$), and elimination stalls
for want of division by a pivot.

Rank–nullity needs $\dim V$ finite. The four-subspaces theorem needs more than
linear structure, since orthogonality is not basis-free: it is a statement about
$\mathbb{R}^n$ carrying the standard inner product, and dropping that inner
product keeps the direct sum but loses "perpendicular". Determinant and trace
require $A$ square. Eigenvalue existence requires an algebraically closed field
— the real rotation
$\begin{bmatrix} 0 & -1 \\ 1 & 0\end{bmatrix}$ has characteristic polynomial
$\lambda^2 + 1$ and no real eigenvalue. Diagonalisability is an assumption again:
$\begin{bmatrix} 1 & 1 \\ 0 & 1\end{bmatrix}$ has one eigenvalue, a
one-dimensional eigenspace, and no diagonalising basis. All of this is exact
arithmetic; in floating point, rank and determinant are decisions against a
tolerance, not computed facts.

## Uses and applicability

Reach for matrices whenever the object is a linear map on a space of modest,
known dimension: solving and least-squares-fitting linear systems, linearising
through a Jacobian, propagating a Markov chain, encoding a graph as an adjacency
or Laplacian matrix, transforming geometry, or implementing a dense layer as
$x \mapsto Wx + b$. Numerical environments are built around this: MATLAB's `A\b`
picks a solver from the detected structure rather than forming an inverse.

Do not reach for them when the natural object has more than two indices, where a
tensor formulation keeps structure that flattening destroys, nor in genuinely
infinite-dimensional settings, where an infinite array may still be written
against a basis but no longer determines the operator, supports a finite
algorithm, or carries a determinant. And for very large sparse problems, do not
form $A$ at all: Krylov methods need only the action $x \mapsto Ax$, and
materialising the matrix is often the one infeasible step.

## Limitations and common mistakes

The first mistake is identifying the matrix with the map. Two very different
arrays can be the same operator; one array is different operators under
different bases. Before calling a property meaningful, ask whether it survives
similarity.

The second is using $\det A$ to test for near-singularity. The determinant
scales like the $n$-th power: $0.1 \cdot I_{100}$ has determinant $10^{-100}$
and is perfectly well conditioned, while a matrix of determinant $1$ can be
numerically singular. The condition number or the smallest singular value is the
right diagnostic. Forming `inv(A)` and multiplying is likewise slower and less
accurate than solving directly.

The third is algebraic carelessness: $AB \neq BA$, $(AB)^{\mathsf T} =
B^{\mathsf T}A^{\mathsf T}$ with the order reversed, $(A+B)^2 \neq A^2 + 2AB +
B^2$, and trace is cyclic but not arbitrarily permutable —
$\operatorname{tr}(ABC) = \operatorname{tr}(BCA)$, yet
$\operatorname{tr}(ACB)$ generally differs.

Two more. $\det A = 0$ does not mean $Ax = b$ has no solution; it means no
_unique_ solution, so either none or infinitely many depending on $b$. And that
$AB = I$ forces $BA = I$ is a theorem about square matrices over a field in
finite dimension, not a general truth — the one-sided inverse of a shift
operator is the standard counterexample.

## Variants and alternatives

Structured families are where the algorithms live: symmetric and Hermitian,
orthogonal and unitary, triangular, banded, sparse, positive definite, Toeplitz
and circulant. Each buys speed or stability and costs generality — a circulant
matrix is diagonalised by the discrete Fourier transform in $O(n \log n)$, but
only circulants are. Matrices over finite fields underpin coding theory;
elimination works unchanged, since a finite field still has inverses, but there
is no order or magnitude, so pivoting for stability, conditioning and
inner-product geometry are given up.

Two approaches compete with the entrywise view. The coordinate-free treatment,
of which Axler's is the best-known modern exposition, develops operators,
eigenvalues and even the spectral theorem while deferring determinants; it buys
clarity about what is basis-independent and gives up computational immediacy.
The factorisation view — working with $LU$, $QR$, the eigendecomposition and the
SVD rather than with entries — buys numerical reliability, at the cost of a
decomposition step.

## History and attribution

The pieces arrived out of order. Elimination is ancient, appearing in the Chinese
_Nine Chapters on the Mathematical Art_ long before any notation for arrays
existed. Determinants came next — studied by Seki in Japan and Leibniz in Europe
in the late seventeenth century, developed by Cauchy and Jacobi in the
nineteenth — and for a century determinants _were_ the subject, matrices being
incidental bookkeeping.

James Joseph Sylvester coined the word "matrix" in 1850, and Arthur Cayley's _A
Memoir on the Theory of Matrices_ (1858) made the array an algebraic object with
its own addition, multiplication and inverse. Cayley stated the Cayley–Hamilton
theorem and verified it in low dimensions; the general proof came later. The
four-subspaces framing, under the name "the fundamental theorem of linear
algebra", was popularised by Gilbert Strang in the 1990s; the content was long
established, and Strang's contribution was the picture.

## Sources

MIT 18.06 is the entry point for the column picture, elimination and the four
subspaces, which it teaches as the organising idea. Axler's _Linear Algebra Done
Right_ is the reference for the map-versus-matrix distinction and for what can
be proved without determinants — the cleanest way to see which facts are
basis-independent. MIT 18.065 covers the numerical side: factorisations,
conditioning, and why the SVD rather than the determinant is the right tool for
rank. The MATLAB documentation is cited for computational convention, backslash
rather than explicit inversion and tolerance-based rank.

## Prerequisites and next connections

Understand [Vector Spaces](./vector-spaces.md), bases and linear independence
first; a matrix is meaningless until a basis is fixed, and most confusion about
matrices is confusion about that step. Familiarity with systems of linear
equations helps, since elimination is the computational spine of everything here.

Three directions open.
[Matrix Decompositions](./matrix-decompositions.md) turn these invariants into
algorithms, the SVD replacing the determinant as the practical measure of rank
and conditioning, and [Spectral Theory](./spectral-theory.md) develops the
eigenvalues as the similarity-invariant facts above.
[Multivariable Calculus](./multivariable-calculus.md) uses the Jacobian as the
local linear model of a nonlinear map, while
[Functional Analysis](./functional-analysis.md) and
[Hilbert Spaces](./hilbert-spaces.md) show what survives once the finite array
is gone.
A [Convolutional Layer](./convolutional-layer.md) is where structure in the array
is the point: a linear map whose matrix is Toeplitz and hugely redundant, which
is why nobody writes it down.
