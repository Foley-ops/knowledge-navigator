---
concept_id: concept.linear_algebra.spectral_theory
title: Spectral Theory
slug: /concepts/spectral-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The study of what a linear operator does along its own preferred directions, and of the conditions — normality, self-adjointness, compactness — under which those directions form a coordinate system good enough to reduce the operator to multiplication by numbers.
categories:
  - Mathematics/Linear & Multilinear Algebra
primary_category: Mathematics/Linear & Multilinear Algebra
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: An eigenvector is a nonzero vector spanning a one-dimensional invariant subspace, so the whole subject presupposes the linear structure in which "invariant subspace" makes sense.
  - type: requires
    target: concept.analysis.hilbert_spaces
    note: The infinite-dimensional statement needs an inner product to define adjoints and orthogonal projections, and completeness for the projection-valued measure to converge to anything.
  - type: contributes_to
    target: concept.linear_algebra.matrix_decompositions
    note: The orthogonal eigendecomposition is the factorisation the spectral theorem licenses, and the singular value decomposition is obtained by applying it to the Hermitian matrix $A^*A$.
  - type: used_to_solve
    target: concept.analysis.ordinary_differential_equations
    note: Diagonalising the coefficient matrix decouples a linear constant-coefficient system into independent scalar equations, and the eigenvalues' real parts decide asymptotic stability.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - intuition
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.vonluxburg2007.spectral_clustering
    title: A Tutorial on Spectral Clustering
    url: https://arxiv.org/abs/0711.0189
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Spectral theory** analyses a linear operator through its **spectrum**: for $T$
on a complex vector space,

$$
\sigma(T) \;=\; \{\lambda \in \mathbb{C} \;:\; T - \lambda I \text{ is not invertible}\}.
$$

A $\lambda$ for which $Tv = \lambda v$ has a nonzero solution is an
**eigenvalue** and $v$ an **eigenvector**. In finite dimensions the two notions
coincide — a square matrix is singular exactly when its kernel is nontrivial — so
$\sigma(A)$ is the root set of $\det(A - \lambda I)$. In infinite dimensions they
come apart, and the spectrum is the durable notion.

The central results say when the eigenvectors serve as coordinates. Call
$A \in \mathbb{C}^{n \times n}$ **normal** if $A^*A = AA^*$ and **Hermitian** if
$A^* = A$ (real symmetric if $A$ is also real).

## Why it matters

Diagonalisation converts operator questions into scalar questions, one per
eigenvalue. If $A = Q \Lambda Q^*$ with $Q$ unitary, then $A^k = Q\Lambda^k Q^*$,
$e^{A} = Qe^{\Lambda}Q^*$, $A^{-1} = Q\Lambda^{-1}Q^*$ when no eigenvalue
vanishes, and $\sqrt{A} = Q\Lambda^{1/2}Q^*$ when all are non-negative. This is
the **functional calculus**, $f(A) = Qf(\Lambda)Q^*$ with $f$ applied entry by
entry along the diagonal: a hard matrix problem becomes $n$ easy scalar ones.

The payoff appears wherever a symmetric object governs a process: principal
component analysis is the eigendecomposition of a covariance matrix, a vibrating
structure decomposes into normal modes, and quantum mechanics identifies
observables with self-adjoint operators precisely so that measured values — the
spectrum — come out real.

## Intuition

Picture a symmetric matrix as a stretch. There is a set of perpendicular axes it
does not rotate; it only scales each one, by its eigenvalue, and any vector is
resolved along those axes, scaled component by component, and reassembled.

The analogy breaks in two places worth carrying. A general matrix also **shears**:
its eigenvectors need not be perpendicular and can be nearly parallel, in which
case "scale along the axes" conceals enormous amplification in between. And in
infinite dimensions the axes may not exist — multiplication by $x$ on $L^2[0,1]$
has spectrum $[0,1]$ and not one eigenvector, since $(x - \lambda)f(x) = 0$
almost everywhere forces $f = 0$. The sum over axes becomes an integral, which is
what a spectral measure is for.

## Concrete example

Take

$$
A = \begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}.
$$

Its characteristic polynomial is $(2-\lambda)^2 - 1$, so $\lambda_1 = 3$ and
$\lambda_2 = 1$, with unit eigenvectors $q_1 = \tfrac{1}{\sqrt{2}}(1,1)^\top$ and
$q_2 = \tfrac{1}{\sqrt{2}}(1,-1)^\top$ — orthogonal, as the theorem promises. The
**spectral decomposition** writes $A$ as a weighted sum of projections,

$$
A \;=\; 3\underbrace{\tfrac{1}{2}\begin{bmatrix}1 & 1\\ 1 & 1\end{bmatrix}}_{P_1}
\;+\; 1 \cdot \underbrace{\tfrac{1}{2}\begin{bmatrix}1 & -1\\ -1 & 1\end{bmatrix}}_{P_2},
\qquad P_1 + P_2 = I, \quad P_1P_2 = 0 .
$$

The functional calculus is now literal: $\sqrt{A} = \sqrt{3}\,P_1 + P_2$, with
entries $(\sqrt{3}\pm 1)/2 \approx 1.366$ and $0.366$, which square back to $2$
and $1$ exactly.

```python
import numpy as np

A = np.array([[2.0, 1.0], [1.0, 2.0]])
w, Q = np.linalg.eigh(A)              # w = [1., 3.]; Q orthogonal, ascending order
assert np.allclose(Q @ np.diag(w) @ Q.T, A)
assert np.allclose(Q.T @ Q, np.eye(2))
root = Q @ np.diag(np.sqrt(w)) @ Q.T  # the positive square root
assert np.allclose(root @ root, A)
```

Use `eigh`, not `eig`, on a symmetric matrix: `eigh` exploits symmetry and returns
real sorted eigenvalues with an orthogonal $Q$, while `eig` ignores the symmetry —
its eigenvalues come back unordered, through the general complex-valued code
path, and less accurately than `eigh`'s, and its $Q$ carries no orthogonality
guarantee.

## Formal treatment

**Finite dimensions.** $A \in \mathbb{C}^{n\times n}$ factors as
$A = U\Lambda U^*$ with $U$ unitary and $\Lambda$ diagonal **if and only if** $A$
is normal; normality is necessary, not merely convenient. If $A$ is Hermitian
every $\lambda_j$ is real, since $\lambda\|v\|^2 = \langle Av, v\rangle =
\langle v, Av\rangle = \bar{\lambda}\|v\|^2$. If $A$ is real symmetric, $U$ may
be taken real orthogonal, giving $A = Q\Lambda Q^\top$. Equivalently, with $P_j$
the orthogonal projection onto the eigenspace of the distinct $\lambda_j$,

$$
A = \sum_j \lambda_j P_j, \qquad P_jP_k = \delta_{jk}P_j, \qquad \sum_j P_j = I .
$$

**Compact operators.** If $T$ is compact and self-adjoint on a Hilbert space $H$,
the sum survives: $H$ has an orthonormal basis of eigenvectors of $T$, the
eigenvalues are real, each nonzero one has finite multiplicity, and $0$ is the
only possible accumulation point. That is the Hilbert–Schmidt theorem, and why
eigenfunction expansions work for square-integrable kernels.

**Bounded self-adjoint operators.** Compactness cannot be dropped for free — the
multiplication operator above is bounded and self-adjoint with no eigenvectors at
all — but the integral form survives. There is a unique **projection-valued
measure** $E$ on the Borel subsets of $\mathbb{R}$, supported in
$\sigma(T) \subset \mathbb{R}$, assigning each Borel set an orthogonal
projection, with $E(\mathbb{R}) = I$,
$E(\Omega_1 \cap \Omega_2) = E(\Omega_1)E(\Omega_2)$ and countable additivity in
the strong operator topology, such that

$$
T \;=\; \int_{\sigma(T)} \lambda \, dE(\lambda),
\qquad
f(T) \;=\; \int_{\sigma(T)} f(\lambda)\, dE(\lambda)
$$

for bounded Borel $f$, where $\Omega \mapsto \langle E(\Omega)x,x\rangle$ is an
ordinary finite measure. The same holds for bounded normal operators with $E$
supported in $\mathbb{C}$, and for densely defined unbounded self-adjoint
operators on the domain
$\{x : \int |\lambda|^2 d\langle E(\lambda)x,x\rangle < \infty\}$. Equivalently,
every self-adjoint $T$ is unitarily conjugate to multiplication by a real
function on some $L^2(X,\mu)$.

## Assumptions and requirements

The scalars must be complex for the normal-operator statement: the rotation
$\begin{bmatrix}0 & -1\\ 1 & 0\end{bmatrix}$ is normal, with eigenvalues $\pm i$
and no real eigenvector. Real symmetry is the hypothesis that keeps everything
inside $\mathbb{R}$.

Self-adjointness buys the real spectrum, and in infinite dimensions it is
strictly stronger than symmetry. An unbounded operator is symmetric when
$\langle Tx,y\rangle = \langle x,Ty\rangle$ on its domain, self-adjoint only when
$T$ and $T^*$ have the _same_ domain. A symmetric operator may admit many
self-adjoint extensions or none, and the theorem applies to none of them until
one is chosen — which is why boundary conditions matter in quantum mechanics.
Compactness is what turns the integral back into a sum.

"Symmetric" is also relative to a fixed inner product. A matrix not symmetric in
the standard one may be self-adjoint in a weighted one — the transition matrix of
a reversible Markov chain — with real eigenvalues and an eigenbasis orthogonal
for that weighting but not the Euclidean one.

## Uses and applicability

Reach for the spectral theorem when the operator is symmetric, Hermitian or
self-adjoint by construction: covariance and Gram matrices, Hessians, graph
Laplacians, elliptic differential operators, quantum observables. Spectral
clustering embeds a graph using the eigenvectors of the $k$ _smallest_
eigenvalues of its Laplacian — the Fiedler direction and its successors, not the
dominant ones — and that relaxation is tractable precisely because the Laplacian
is symmetric positive semidefinite. Stability analysis of $\dot{x} = Ax$ reads
asymptotics off the eigenvalue real parts.

Do not reach for it to solve $Ax = b$; LU or QR is faster and better conditioned.
For a general non-normal matrix a singular value decomposition or a Schur form
usually answers better, both always existing and both stable. And never use
eigenvalues alone to predict short-time behaviour.

## Limitations and common mistakes

**Not every matrix has an eigenbasis.** $\begin{bmatrix}0&1\\0&0\end{bmatrix}$ is
defective — eigenvalue $0$, a one-dimensional eigenspace — and nothing
diagonalises it.

**Diagonalisable does not mean well conditioned.** If $A = V\Lambda V^{-1}$,
Bauer–Fike bounds the perturbation of eigenvalues under $A \mapsto A + E$ by
$\kappa_2(V)\|E\|_2$. For normal $A$, $V$ is unitary and $\kappa_2(V) = 1$; for a
strongly non-normal $A$ that constant can be astronomical.

**Eigenvalues do not govern transients.** Take

$$
A = \begin{bmatrix} -1 & 100 \\ 0 & -2\end{bmatrix},
\qquad
e^{tA} = \begin{bmatrix} e^{-t} & 100\,(e^{-t}-e^{-2t}) \\ 0 & e^{-2t}\end{bmatrix}.
$$

Both eigenvalues are negative, so every solution decays; yet the off-diagonal
entry peaks at $t = \ln 2$ with value $25$, so the system amplifies by tens first.
This is why **pseudospectra** exist. The $\varepsilon$-pseudospectrum
$\sigma_\varepsilon(A) = \{z : \|(zI - A)^{-1}\|_2 > \varepsilon^{-1}\}$ equals,
in the spectral norm, the union of $\sigma(A+E)$ over all $\|E\|_2 < \varepsilon$.
For normal $A$ that is exactly the $\varepsilon$-neighbourhood of the spectrum;
for non-normal $A$ it can be vastly larger, and it — not the spectrum — predicts
transient growth and iterative-solver convergence.

**The characteristic polynomial is a definition, not an algorithm.** No radical
formula exists beyond degree four, and its coefficients are catastrophically
ill-conditioned; practical eigensolvers are iterative, usually QR variants.

**Eigenvectors are less unique than they look**: fixed only up to scale and
phase, and for a repeated eigenvalue only up to a basis of the eigenspace. When
two eigenvalues are close the eigenvectors are ill conditioned even though the
eigenvalues are not; only the spanned subspace is stable, its perturbation
controlled by the spectral gap.

**Spectrum is not eigenvalues** outside finite dimensions, so "no eigenvalues,
therefore nothing to say" is an early error.

## Variants and alternatives

The **Jordan normal form** is complete — every complex matrix has one — but
discontinuous in the entries and useless numerically. The **Schur decomposition**
$A = QTQ^*$, $Q$ unitary and $T$ upper triangular, always exists, is
backward-stable, and collapses to the spectral theorem exactly when $A$ is
normal; it is what library eigensolvers compute. The **singular value
decomposition** is the spectral theorem applied to $A^*A$: it costs a second
orthonormal basis but exists for every matrix, rectangular included, with
perfectly conditioned singular values. The **generalised problem**
$Ax = \lambda Bx$ keeps real eigenvalues and $B$-orthogonal eigenvectors when $A$
is symmetric and $B$ symmetric positive definite. **Pseudospectra** and the
**numerical range** substitute when normality fails, and **Lanczos** and
**Arnoldi** find a few extreme eigenvalues of a large sparse matrix cheaply.

## History and attribution

The idea is older than the vocabulary. Nineteenth-century work on the principal
axes of quadric surfaces and on linear differential systems produced the
computations, and Cauchy proved in the 1820s and 1830s that a real quadratic form
reduces to principal axes with real coefficients — the spectral theorem in
geometric dress.

The words come from David Hilbert's work on integral equations early in the
twentieth century, which introduced _Eigenwert_ and _Spektrum_ and, with Erhard
Schmidt, established the eigenfunction expansion for symmetric kernels. Hermann
Weyl's study of singular Sturm–Liouville problems made continuous spectrum
unavoidable.

The statement for unbounded self-adjoint operators — projection-valued measure,
domain conditions, the gap between symmetric and self-adjoint — is due to John
von Neumann and Marshall Stone around 1929–1932, von Neumann's motivation being
explicitly to put quantum mechanics on a rigorous footing. Pseudospectra have
several independent origins in numerical analysis and operator theory in the
1970s and 1980s, and were systematised and named in later work by Lloyd N.
Trefethen and colleagues.

## Sources

**Linear Algebra Done Right** gives the cleanest determinant-free route to the
finite-dimensional theorem and is careful about which hypothesis — normality,
self-adjointness, complex scalars — buys which conclusion. **MIT 18.06** supplies
the computational picture: characteristic polynomials, diagonalisation, symmetric
matrices and their orthogonal eigenbases. **MIT 18.065** is the applied
counterpart, better on conditioning and the SVD. **A Tutorial on Spectral
Clustering** works the apparatus through one case and is honest about what
Laplacian eigenvectors guarantee.

## Prerequisites and next connections

Understand vector spaces, bases and linear maps first, and know what an inner
product buys — orthogonality, adjoints, projections — before "normal" can mean
anything. [Hilbert Spaces](./hilbert-spaces.md) supplies that infinite
dimensionally, and its completeness is what makes the spectral measure converge.
[Real Analysis](./real-analysis.md) suffices for the compact case; the general
case also wants [Measure Theory](./measure-theory.md).

From here, [Functional Analysis](./functional-analysis.md) develops the spectrum
of a general bounded operator. [Harmonic Analysis](./harmonic-analysis.md) and
[Fourier Analysis](./fourier-analysis.md) are spectral theory for one commuting
family — translations, or the Laplacian — which is why the frequency domain is a
labelling of eigenvectors. And the second-derivative test of
[Multivariable Calculus](./multivariable-calculus.md) is where most readers first
lean on this page's theorem without being told.
