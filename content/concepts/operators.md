---
concept_id: concept.analysis.operators
title: Operators
slug: /concepts/operators
aliases:
  - bounded linear operator
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The linear maps between normed spaces — differentiation, integration, convolution, the Fourier transform — treated as objects in their own right, where continuity is exactly boundedness and the set of bad $\lambda$ is far larger than the set of eigenvalues.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.banach_spaces
    note: An operator is only as good as the spaces at its ends; completeness of the target is what makes the space of operators itself complete, and completeness of the domain is the hypothesis behind the open mapping and closed graph theorems.
  - type: prerequisite_of
    target: concept.linear_algebra.spectral_theory
    note: The spectrum is defined as the set of $\lambda$ for which $T - \lambda I$ fails to be invertible as an operator, so the notions of boundedness, adjoint and invertibility have to be in place before any spectral statement can be made.
  - type: generalizes
    target: concept.linear_algebra.matrix_theory
    note: Fix bases on finite-dimensional spaces and every operator is a matrix; the infinite-dimensional theory keeps the algebra and loses the guarantees that every linear map is continuous and that non-invertibility means a vanishing determinant.
  - type: contributes_to
    target: concept.analysis.functional_analysis
    note: Operators are the objects the four structural theorems of functional analysis are about, and the subject is largely the study of what those theorems say about particular classes of them.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - concrete-example
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.partial_differential_equations
    title: MIT 18.152 Introduction to Partial Differential Equations (Fall 2011)
    url: https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

An **operator** is a linear map between vector spaces carrying norms. Given
normed spaces $X$ and $Y$ over $\mathbb{K} \in \{\mathbb{R}, \mathbb{C}\}$, a map
$T$ with $T(\alpha x + \beta z) = \alpha Tx + \beta Tz$ is **bounded** when there
is a constant $C$ with

$$
\|Tx\|_Y \le C \|x\|_X \quad \text{for all } x \in X ,
$$

and the smallest such $C$ is the **operator norm** $\|T\|$. For linear maps,
bounded and continuous are the same condition. An **unbounded operator** is not a
map on $X$ at all: it is a pair $(T, D(T))$ whose **domain** $D(T)$ is a proper,
usually dense, subspace of $X$ — part of the operator's identity, not a detail of
its presentation.

## Why it matters

Differentiation, integration, taking a Fourier transform, convolving with a
kernel, shifting a sequence: each takes a function and returns a function, and
each is linear. Naming the whole transformation $T$ turns a differential equation
into $Tu = f$, and turns a question about solutions into a question about whether
$T$ is injective, surjective, or invertible with a bounded inverse. Once $\|T\|$
is finite an error bound comes for free — $\|Tu - Tv\| \le \|T\|\,\|u - v\|$ —
which is the entire content of "this scheme is stable". Numerical analysts,
quantum physicists and PDE theorists share a language because they are all
manipulating operators.

## Intuition

An operator is the infinite matrix you decline to write down. Its norm is the
worst-case gain of an amplifier: feed in any unit signal, and $\|T\|$ is the
largest output amplitude you can provoke.

The analogy breaks in three places, and the breaks are the subject. The gain can
be infinite: differentiation multiplies $\sin(nx)$ by $n$, so no finite $C$ works
and the operator must be given a restricted domain. There need be no rows and
columns, because an infinite-dimensional space has no basis you can expand in
finitely. And — the surprise — an operator may have no eigenvectors at all and
still fail to be invertible on a whole disc of the complex plane.

## Concrete example

In finite dimensions, take

$$
A = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}
$$

on $\mathbb{R}^2$ with the Euclidean norm. Then
$A^{\mathsf T}A = \begin{pmatrix} 1 & 2 \\ 2 & 5 \end{pmatrix}$ has eigenvalues
$3 \pm 2\sqrt{2}$, so $\|A\| = \sqrt{3 + 2\sqrt{2}} = 1 + \sqrt{2} \approx 2.414$,
while both eigenvalues of $A$ itself are $1$. The norm is neither the largest
eigenvalue nor the largest entry.

Now the **Volterra operator** on $L^2[0,1]$,

$$
(Vf)(x) = \int_0^x f(t)\,\mathrm{d}t .
$$

Cauchy–Schwarz gives $|(Vf)(x)| \le \sqrt{x}\,\|f\|_2$, hence
$\|Vf\|_2^2 \le \tfrac12 \|f\|_2^2$ and $\|V\| \le 1/\sqrt{2}$. The exact value
comes from $V^{*}V$: the equation $V^{*}Vf = \lambda f$ differentiates twice into
$\lambda f'' + f = 0$ with $f'(0) = f(1) = 0$, so $f(x) = \cos(x/\sqrt{\lambda})$
with $\cos(1/\sqrt{\lambda}) = 0$. The singular values are $2/((2k-1)\pi)$ for
$k = 1, 2, \dots$, and

$$
\|V\| = \frac{2}{\pi} \approx 0.6366 .
$$

$V$ is injective — if $\int_0^x f = 0$ for every $x$ then $f = 0$ almost
everywhere — so $0$ is not an eigenvalue, and $V$ has no eigenvalues at all. Yet
$\|V^n\|^{1/n} \to 0$, so the spectrum of $V$ is exactly $\{0\}$. An operator
whose spectrum is a single point that is not an eigenvalue is the cleanest
refutation of the idea that spectrum means eigenvalue.

## Formal treatment

Write $B(X,Y)$ for the bounded operators from $X$ to $Y$, and $B(X) = B(X,X)$.

**Boundedness equals continuity.** For linear $T$ these are equivalent: $T$ is
continuous everywhere; $T$ is continuous at $0$; $T$ is Lipschitz; $T$ is
bounded. Linearity is essential — for a nonlinear map the equivalence fails.

The operator norm

$$
\|T\| \;=\; \sup_{x \neq 0} \frac{\|Tx\|_Y}{\|x\|_X} \;=\; \sup_{\|x\| \le 1} \|Tx\|_Y
$$

makes $B(X,Y)$ a normed space, complete whenever $Y$ is, and is submultiplicative:
$\|ST\| \le \|S\|\,\|T\|$.

**Adjoints.** Every $T \in B(X,Y)$ has a Banach adjoint
$T^{*} \in B(Y^{*}, X^{*})$ given by $(T^{*}g)(x) = g(Tx)$, with
$\|T^{*}\| = \|T\|$. On a Hilbert space the Riesz representation theorem
identifies $H^{*}$ with $H$, and the adjoint becomes the operator determined by
$\langle Tx, y \rangle = \langle x, T^{*}y \rangle$, satisfying
$\|T^{*}T\| = \|T\|^2$.

**Classes.** $T$ is **self-adjoint** if $T = T^{*}$; **unitary** if
$U^{*}U = UU^{*} = I$, equivalently isometric and surjective; **compact** if the
image of the unit ball is relatively compact — on a Hilbert space, equivalently a
norm limit of finite-rank operators.

**Spectrum.** For $T \in B(X)$ with $X$ a complex Banach space,

$$
\sigma(T) = \{\lambda \in \mathbb{C} : T - \lambda I \text{ has no bounded inverse}\} ,
$$

a nonempty compact set contained in the disc of radius $\|T\|$, with spectral
radius $r(T) = \lim_{n} \|T^n\|^{1/n}$. Invertibility can fail in three ways, and
only the first is an eigenvalue: $T - \lambda I$ may be non-injective (point
spectrum), injective with dense but proper range (continuous spectrum), or
injective with non-dense range (residual spectrum). In finite dimensions the
last two are empty, which is why they are invisible in linear algebra.

**Unbounded operators.** The Hellinger–Toeplitz theorem says that a symmetric
operator defined on _all_ of a Hilbert space is automatically bounded.
Consequently an unbounded self-adjoint operator — position and momentum on
$L^2(\mathbb{R})$, or a Schrödinger Hamiltonian — cannot be everywhere defined. The restricted domain is
forced by a theorem, not chosen for convenience.

## Assumptions and requirements

The operator norm presupposes norms on both spaces, and changing either changes
the number: the same matrix has different norms under $\|\cdot\|_1$,
$\|\cdot\|_2$ and $\|\cdot\|_\infty$. In finite dimensions all norms are
equivalent, so boundedness is automatic and norm-independent; that is the
guarantee lost in infinite dimensions.

A nonempty compact spectrum needs a _complex_ scalar field and a _bounded_
operator. Rotation by a quarter turn on $\mathbb{R}^2$ has empty spectrum, and
unbounded operators can have spectrum $\emptyset$ or all of $\mathbb{C}$.

For an unbounded operator the domain is a hypothesis with visible consequences.
Take $A = -i\,\mathrm{d}/\mathrm{d}x$ on $L^2[0,1]$. On $D = H^1[0,1]$, with no
boundary condition, every $\lambda \in \mathbb{C}$ is an eigenvalue via
$e^{i\lambda x}$, so $\sigma(A) = \mathbb{C}$. On
$D = \{f \in H^1 : f(0) = f(1) = 0\}$ there are no eigenvalues at all, but
$A - \lambda$ is never surjective, so again $\sigma(A) = \mathbb{C}$. On
$D = \{f \in H^1 : f(1) = e^{i\theta} f(0)\}$ for real $\theta$, the operator is
self-adjoint and $\sigma(A) = \{\theta + 2\pi n : n \in \mathbb{Z}\}$. One
formula, three operators, three different spectral pictures: the set
$\mathbb{C}$ arises twice, first as pure point spectrum and then as pure
residual spectrum, and only the third domain changes the spectrum as a set.

## Uses and applicability

Reach for operator language when the unknown is a function. Elliptic PDE theory
studies $-\Delta$ through resolvents $(\lambda - A)^{-1}$, which are compact on
bounded domains and therefore have discrete spectrum; evolution equations are
solved by semigroups $e^{tA}$ generated by unbounded $A$. A linear
time-invariant system _is_ a [Convolution](./convolution.md) operator, which
[Fourier Analysis](./fourier-analysis.md) diagonalises. The condition number
$\|A\|\,\|A^{-1}\|$ is an operator-norm statement about error amplification, and
a spectral-norm bound on a weight matrix is a Lipschitz bound on the layer.

Do not reach for it when the map is nonlinear. Almost every theorem above uses
linearity; the nonlinear theory trades these guarantees for fixed point arguments
and local statements.

## Limitations and common mistakes

The misconception worth naming first: **the spectrum of an operator on an
infinite-dimensional space is not the set of eigenvalues**. The right shift
$S(x_1, x_2, \dots) = (0, x_1, x_2, \dots)$ on $\ell^2$ has $\|S\| = 1$ and no
eigenvalues whatsoever, yet $\sigma(S)$ is the entire closed unit disc. Its
adjoint, the left shift, has every point of the open disc as an eigenvalue.
Adjoints do not preserve which kind of spectral failure occurs.

"Bounded" refers to the gain, not the image. A bounded operator has an unbounded
range as soon as it is nonzero, since $\|T(nx)\| = n\|Tx\|$.

An isometry need not be unitary: $S$ above preserves norms and is not surjective.
In finite dimensions the distinction collapses.

For unbounded operators, _symmetric_ and _self-adjoint_ are different conditions.
Symmetric means $\langle Ax, y\rangle = \langle x, Ay\rangle$ on the domain;
self-adjoint additionally requires $D(A^{*}) = D(A)$. Only self-adjointness gives
the spectral theorem, real spectrum, and a unitary group $e^{itA}$ — and the
middle example in the previous section is symmetric but not self-adjoint.

Finally, compact operators behave most like matrices, which is exactly why the
identity on an infinite-dimensional space is not compact and no compact operator
there is invertible. Expecting a compact operator to have a bounded inverse is
the recurring error behind ill-posed inverse problems.

## Variants and alternatives

Within bounded operators the sharper classes are **finite-rank** $\subset$
**trace class** $\subset$ **Hilbert–Schmidt** $\subset$ **compact**, with the
Schatten $p$-classes interpolating; each buys a stronger spectral theory and
costs generality. **Normal** operators ($TT^{*} = T^{*}T$) are the largest class
with a clean spectral theorem, and **self-adjoint**, **positive** and **unitary**
are its special cases. For unbounded operators the working notions are **closed**
and **closable** operators and **essential self-adjointness**; the alternative to
handling $A$ directly is to handle the bounded objects it generates — its
resolvent, or the semigroup $e^{tA}$. **Banach algebras** and
**$C^{*}$-algebras** drop the underlying space and keep only the algebra of
operators, making the spectrum a purely algebraic notion. **Multilinear** and
nonlinear operators are genuinely different theories.

## History and attribution

The subject grew out of integral equations, not out of algebra. Fredholm's work
around 1900 on equations $f - \lambda Kf = g$ produced the alternative that bears
his name, and Hilbert, working on integral equations in the following decade,
introduced the word _spectrum_ for the set of relevant parameter values — before
any connection to atomic spectra was known. Riesz built the theory of compact
operators on that foundation in the 1910s, and Banach's 1932 _Théorie des
opérations linéaires_ set it in the general framework of complete normed spaces.

The unbounded theory has a separate origin in quantum mechanics: von Neumann,
around 1929–1932, isolated self-adjointness as the right condition, proved the
spectral theorem for unbounded self-adjoint operators, and made explicit that the
domain is part of the operator. Marshall Stone worked the same problems in the
same years; the theorem relating one-parameter unitary groups to self-adjoint
generators carries his name.

## Sources

Axler is the finite-dimensional baseline this page keeps contradicting: linear
maps, adjoints on inner product spaces, and the spectral theorem where every
operator is bounded and the spectrum really is the eigenvalues. MIT 18.100A
supplies the continuity and compactness facts behind the boundedness–continuity
equivalence and the failure of norm equivalence in infinite dimensions. MIT
18.065 is where the operator norm appears as a singular value and as a condition
number — the finite-dimensional half of the concrete example. MIT 18.152 gives
the differential operators that motivate the unbounded theory. None is an
operator theory text: the point–continuous–residual decomposition, the
Hellinger–Toeplitz theorem, the Volterra norm and the shift spectrum are standard
in any graduate functional analysis text, but no source cited here verifies them.

## Prerequisites and next connections

Read [Real Analysis](./real-analysis.md) first — completeness, uniform
convergence and compactness are used in every proof above — with linear algebra
over abstract spaces rather than matrices.
[Functional Analysis](./functional-analysis.md) is the immediate context: the
open mapping and closed graph theorems are statements about operators.

Next, [Hilbert Spaces](./hilbert-spaces.md) is where adjoints, projections and
the spectral theorem take their sharpest form;
[Measure Theory](./measure-theory.md) makes $L^2[0,1]$ a space on which the
Volterra operator is defined at all;
[Partial Differential Equations](./partial-differential-equations.md) is where
unbounded operators are cashed in; and
[Fourier Analysis](./fourier-analysis.md) shows the one large family of operators
that can be diagonalised explicitly.
