---
concept_id: concept.linear_algebra.matrix_decompositions
title: Matrix Decompositions
slug: /concepts/matrix-decompositions
kind: concept
tier: 1
review_state: generated-draft
summary: The family of factorisations — LU, QR, Cholesky, eigendecomposition and the SVD — that rewrite a matrix as a product of structured factors so that solving, least squares, rank and approximation become easy, and that differ above all in what they assume about the matrix.
categories:
  - Mathematics/Linear & Multilinear Algebra
  - Mathematics/Numerical Analysis
primary_category: Mathematics/Linear & Multilinear Algebra
relationships:
  - type: requires
    target: concept.linear_algebra.matrix_theory
    note: Rank, invertibility, the conjugate transpose and positive definiteness are the vocabulary in which each factorisation's existence hypothesis is stated, so the hypotheses are unreadable without them.
  - type: requires
    target: concept.linear_algebra.spectral_theory
    note: The unitary eigendecomposition is the spectral theorem for normal matrices, and the SVD is obtained by applying that theorem to the Hermitian positive semidefinite matrix A*A.
  - type: contributes_to
    target: concept.analysis.operators
    note: The singular value decomposition of a compact operator between Hilbert spaces is the same theorem in infinite dimensions, and the finite-dimensional construction is where it can actually be seen — an illuminating parallel rather than something an operator theorist has to read first.
  - type: prerequisite_of
    target: concept.linear_algebra.tensors
    note: CP and Tucker decompositions are defined by analogy with the SVD, and the instructive fact about them is precisely which SVD guarantees — uniqueness, nestedness, best rank-k truncation — stop holding.
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
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **matrix decomposition** rewrites a matrix as a product of factors with
special structure — triangular, unitary, diagonal, permutation — chosen so that
a question that is hard for the matrix is easy for the factors. Writing $A^{*}$
for the conjugate transpose, the five canonical ones are

- **LU with partial pivoting**, $PA = LU$, a permutation and two triangular
  factors;
- **QR**, $A = QR$, with $Q$ unitary and $R$ upper triangular;
- **Cholesky**, $A = LL^{*}$, with $L$ lower triangular, positive diagonal;
- **eigendecomposition**, $A = V \Lambda V^{-1}$, with $\Lambda$ diagonal;
- **singular value decomposition (SVD)**, $A = U \Sigma V^{*}$, with $U, V$
  unitary and $\Sigma$ diagonal, non-negative.

What decides which you may use is the hypothesis each needs: pivoted LU, QR and
the SVD exist for every matrix of the right shape, Cholesky requires Hermitian
positive definiteness, and the eigendecomposition requires diagonalisability,
which many interesting matrices lack.

## Why it matters

Almost everything numerical done with a matrix goes through a factorisation,
because a factorisation converts one expensive computation into many cheap ones.
Factoring an $n \times n$ matrix costs $O(n^3)$ once; each subsequent solve of
$Ax = b$ costs $O(n^2)$. That is why LAPACK exposes factor and solve as separate
routines.

The second reason is approximation. The SVD says what the _best_ rank-$k$
version of a matrix is, exactly and constructively — principal component
analysis, latent semantic analysis and image compression are one theorem applied
to different matrices, while low-rank adapters borrow the low-rank ansatz but
fit the factors by training, with no optimality guarantee.

## Intuition

Each decomposition is a choice of coordinates in which a linear map looks
simple. The eigendecomposition wants coordinates in which the map only scales,
and such a basis frequently does not exist. The SVD asks a weaker question that
always has an answer: orthonormal coordinates in the domain and _possibly
different_ orthonormal coordinates in the codomain that make the map diagonal.
Every linear map is therefore a rotation or reflection, an axis-aligned stretch,
and another; the unit sphere maps to an ellipsoid whose semi-axes are the
singular values.

The picture is literal only for square non-singular matrices — when
$m \neq n$ the outer factors also pad with zeros or discard coordinates. And
because the input and output bases may differ, singular values say nothing about
iterating the map: $\sigma_1(A^2)$ is not $\sigma_1(A)^2$ in general, whereas
eigenvalues do square.

LU is Gaussian elimination with the bookkeeping kept, and Cholesky is the matrix
analogue of $\sqrt{a}$.

## Concrete example

Take

$$
A = \begin{bmatrix} 3 & 0 \\ 4 & 5 \end{bmatrix}.
$$

$A$ is triangular, so its eigenvalues are $3$ and $5$. For the singular values,

$$
A^{\mathsf{T}}A = \begin{bmatrix} 25 & 20 \\ 20 & 25 \end{bmatrix}
$$

has eigenvalues $45$ and $5$ with eigenvectors
$v_1 = \tfrac{1}{\sqrt{2}}(1,1)^{\mathsf{T}}$,
$v_2 = \tfrac{1}{\sqrt{2}}(1,-1)^{\mathsf{T}}$, so $\sigma_1 = 3\sqrt{5} \approx
6.708$ and $\sigma_2 = \sqrt{5} \approx 2.236$. Two checks:
$\sigma_1\sigma_2 = 15 = |\det A|$ and $\sigma_1^2 + \sigma_2^2 = 50 =
\|A\|_F^2$. Then $u_i = Av_i/\sigma_i$ gives
$u_1 = \tfrac{1}{\sqrt{10}}(1,3)^{\mathsf{T}}$,
$u_2 = \tfrac{1}{\sqrt{10}}(3,-1)^{\mathsf{T}}$.

Eigenvalues $3, 5$; singular values $6.708, 2.236$. Neither is a rounding of the
other, and $\|A\|_2 = \sigma_1$, not the spectral radius $5$. The best rank-one
approximation is

$$
A_1 = \sigma_1 u_1 v_1^{\mathsf{T}} = \begin{bmatrix} 1.5 & 1.5 \\ 4.5 & 4.5 \end{bmatrix},
\qquad
A - A_1 = \begin{bmatrix} 1.5 & -1.5 \\ -0.5 & 0.5 \end{bmatrix},
$$

whose Frobenius norm is $\sqrt{5} = \sigma_2$, exactly as Eckart–Young predicts.

```python
import numpy as np

A = np.array([[3.0, 0.0], [4.0, 5.0]])
U, s, Vt = np.linalg.svd(A)
print(s)                             # [6.70820393 2.23606798]
A1 = s[0] * np.outer(U[:, 0], Vt[0])
print(np.linalg.norm(A - A1))        # 2.2360679... == s[1]
print(np.linalg.eigvals(A))          # [3. 5.] -- unrelated to s
```

## Formal treatment

Let $A \in \mathbb{C}^{m \times n}$ and $r = \operatorname{rank}(A)$.

**LU.** Every $A \in \mathbb{C}^{n \times n}$ admits $PA = LU$. Without pivoting,
$A = LU$ exists and is unique exactly when every leading principal submatrix is
non-singular; $\left[\begin{smallmatrix} 0 & 1 \\ 1 & 0 \end{smallmatrix}\right]$
is the smallest counterexample. Cost $\tfrac{2}{3}n^3$ flops.

**QR.** For $m \ge n$ there are a unitary $Q \in \mathbb{C}^{m \times m}$ and
upper triangular $R$ with $A = QR$; the reduced form keeps the first $n$ columns
of $Q$, and for full column rank those factors are unique once $R$ is required
to have positive diagonal. Householder QR costs $2mn^2 - \tfrac{2}{3}n^3$ flops.

**Cholesky.** $A$ is Hermitian positive definite iff $A = LL^{*}$ for a unique
lower triangular $L$ with positive diagonal. Cost $\tfrac{1}{3}n^3$, with no
pivoting needed for stability.

**Eigendecomposition.** $A = V\Lambda V^{-1}$ exists iff $A$ is diagonalisable,
equivalently iff every eigenvalue's geometric multiplicity equals its algebraic
multiplicity. It fails for
$\left[\begin{smallmatrix} 0 & 1 \\ 0 & 0 \end{smallmatrix}\right]$. The
**spectral theorem** supplies the good case: $V$ may be taken unitary exactly
when $A$ is normal ($AA^{*} = A^{*}A$), with $\Lambda$ real exactly when $A$ is
Hermitian.

**SVD.** _Every_ $A$ factors as $A = U\Sigma V^{*}$ with
$U \in \mathbb{C}^{m \times m}$, $V \in \mathbb{C}^{n \times n}$ unitary and
$\Sigma \in \mathbb{R}^{m \times n}$ diagonal,
$\sigma_1 \ge \dots \ge \sigma_p \ge 0$, $p = \min(m,n)$. There is no hypothesis.
The $\sigma_i^2$ are the eigenvalues of $A^{*}A$; $r$ is the number of non-zero
$\sigma_i$; $\|A\|_2 = \sigma_1$ and $\|A\|_F^2 = \sum_i \sigma_i^2$; the first
$r$ columns of $U$ span the range and the last $n-r$ columns of $V$ the null
space.

**Eckart–Young–Mirsky.** For $k < r$ put
$A_k = \sum_{i \le k} \sigma_i u_i v_i^{*}$. Over all $B$ of rank at most $k$,

$$
\min_B \|A - B\|_2 = \sigma_{k+1},
\qquad
\min_B \|A - B\|_F = \Big(\sum_{i>k} \sigma_i^2\Big)^{1/2},
$$

both attained at $A_k$; by Mirsky's extension the same truncation is optimal in
every unitarily invariant norm at once.

## Assumptions and requirements

Orthogonality is not free. QR, Cholesky and the SVD need $\mathbb{R}$ or
$\mathbb{C}$ with an inner product; there is no SVD over a general field, while
LU needs only a field and so survives in symbolic computation.

Positive definiteness is Cholesky's whole hypothesis. Drop it and the algorithm
meets a non-positive pivot and stops — which is why a failed Cholesky is the
standard _test_ for positive definiteness, and why a covariance matrix estimated
from too few samples must be regularised first.

Diagonalisability fails outright for defective matrices, and for
_near_-defective ones it holds but $V$ is nearly singular, so the decomposition
is numerically worthless though true. Over $\mathbb{R}$ a rotation matrix has no
real eigenvectors at all.

Eckart–Young assumes a unitarily invariant norm and that rank is the only
constraint on $B$; add non-negativity, sparsity, a weighted loss or missing
entries and truncated SVD is no longer optimal. And that partial pivoting is
stable is an empirical fact about the matrices that arise in practice, not a
theorem: the worst-case growth factor is $2^{n-1}$, and matrices attaining it
exist.

## Uses and applicability

Use LU for a general square system; Cholesky when the matrix is symmetric
positive definite, where it is the inner loop of Newton and interior-point
methods, of Gaussian sampling by $x = \mu + Lz$, and of Gaussian process
regression; QR for least squares, since with $A = \hat{Q}\hat{R}$ of full column
rank, $\min_x \|Ax - b\|_2$ reduces to the triangular solve
$\hat{R}x = \hat{Q}^{*}b$. Use the SVD when the matrix may be rank-deficient or
ill-conditioned, when you need the pseudoinverse or a minimum-norm solution, or
when the goal is approximation rather than solution — PCA is the SVD of the
column-centred data matrix.

Do not use a dense factorisation on a large sparse matrix, where dense LU fills
in catastrophically: the right tools are sparse factorisations with
fill-reducing orderings, Krylov methods for a few eigenpairs or singular
triples, and randomised SVD for a good rank-$k$ approximation. And essentially
never form $A^{-1}$.

## Limitations and common mistakes

**Eigenvalues are not singular values.** They agree in magnitude exactly when
$A$ is normal; otherwise the gap is the story, and a matrix with every
eigenvalue inside the unit disc can still have $\sigma_1 \gg 1$ and show large
transient growth before decaying.

**The normal equations are a trap.** Solving
$A^{\mathsf{T}}Ax = A^{\mathsf{T}}b$ squares the condition number, since
$\kappa_2(A^{\mathsf{T}}A) = \kappa_2(A)^2$; QR avoids it and the SVD survives
even a rank-deficient $A$.

**Singular vectors are not unique.** Signs and phases are arbitrary and a
repeated singular value admits any rotation within its subspace, so "the third
principal component" means something only when $\sigma_3$ is simple and well
separated — a caveat routinely ignored when components are interpreted.

**Rank is discontinuous.** Every matrix is within $\varepsilon$ of a full-rank
one, so numerically rank means "singular values above a threshold", and the
threshold is a modelling decision.

**The QR factorisation is not the QR algorithm**, which finds eigenvalues by
factoring repeatedly and remultiplying the factors in the opposite order.

## Variants and alternatives

The **Schur decomposition** $A = QTQ^{*}$, $Q$ unitary and $T$ upper triangular,
exists for every complex square matrix and is what libraries compute when asked
for eigenvalues: unconditional existence and stability, at the cost of not being
diagonal. The **Jordan form** is the complete theoretical answer for defective
matrices and numerically unusable, since arbitrarily small perturbations change
it. The **polar decomposition** $A = UP$ is equivalent in content to the SVD and
is the natural form for nearest-orthogonal-matrix problems. **Column-pivoted QR**
reveals rank far more cheaply than the SVD and somewhat less reliably;
**truncated and randomised SVD** trade exactness for feasibility at scale;
**CUR** uses actual rows and columns as factors, buying interpretability and
sparsity at a worse approximation; **non-negative matrix factorisation** often
yields parts-based factors but is NP-hard in general and not unique.

## History and attribution

Gaussian elimination is far older than matrix notation, and reading it as a
factorisation is due to Banachiewicz (1938), with Doolittle, Crout and Dwyer as
antecedents; Turing's 1948 paper on rounding errors supplied the modern matrix
notation and the name $LU$, along with the first rounding-error analysis and the
condition number. The Cholesky method was devised by André-Louis Cholesky, a French
geodesist, for the normal equations of surveying, and published posthumously in 1924.

The SVD genuinely has several independent origins: Beltrami (1873) and Jordan
(1874) found it for real square matrices, Autonne extended it to complex ones,
and Eckart and Young (1936) treated rectangular matrices and rediscovered, for
matrices, the low-rank approximation theorem that now carries their name —
Schmidt had proved it in 1907 for integral operators in the Hilbert–Schmidt
norm; Mirsky (1960) extended Schmidt's theorem to all unitarily invariant norms,
and the stable algorithm is due to Golub and Kahan (1965). Orthogonalisation is layered the same way: Gram–Schmidt through
Gram and Schmidt, the numerically sound versions through Householder's
reflections (1958) and Givens rotations. The QR algorithm was found
independently by Francis and by Kublanovskaya around 1961.

## Sources

MIT 18.06 is the best first pass: LU, QR, eigendecomposition and the SVD in that
order, tied to the four fundamental subspaces, which is where the geometric
reading of the SVD comes from. MIT 18.065 is the applied follow-up, developing
low-rank approximation, least squares and the data-analysis uses. Axler states
the spectral theorem, diagonalisability and the SVD carefully, from a linear-map
point of view. Boyd and Vandenberghe cover Cholesky in Newton and interior-point
methods.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) and [Matrix Theory](./matrix-theory.md)
first, for bases, rank and the conjugate transpose, and then
[Spectral Theory](./spectral-theory.md), whose spectral theorem is the engine
behind both the unitary eigendecomposition and the existence of the SVD.

Two directions lead out. In [Hilbert Spaces](./hilbert-spaces.md) the SVD
becomes the decomposition of a compact operator and orthogonal projection is the
least-squares problem solved above, while
[Functional Analysis](./functional-analysis.md) holds the general theory of when
such a diagonalisation exists. And circulant matrices are diagonalised by the
discrete Fourier basis, which is why [Convolution](./convolution.md) becomes
multiplication and why [Fourier Analysis](./fourier-analysis.md) reads as an
eigendecomposition with the eigenvectors known in advance.
