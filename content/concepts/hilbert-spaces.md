---
concept_id: concept.analysis.hilbert_spaces
title: Hilbert Spaces
slug: /concepts/hilbert-spaces
aliases:
  - complete inner product space
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The infinite-dimensional setting in which Euclidean geometry survives — perpendiculars, coordinates and lengths all still work, because the norm comes from an inner product and no limit escapes the space.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.real_analysis
    note: Completeness, Cauchy sequences and norm convergence of series are the machinery a Hilbert space is assembled from, and the existence theorems below are proved by showing a minimising sequence is Cauchy.
  - type: requires
    target: concept.analysis.measure_theory
    note: The running example needs the Lebesgue integral and almost-everywhere equivalence classes; with the Riemann integral the same formula gives an incomplete space and none of the theorems apply.
  - type: prerequisite_of
    target: concept.analysis.fourier_analysis
    note: Mean-square convergence of Fourier series and Plancherel's theorem are the assertion that a particular orthonormal system is a basis of a particular Hilbert space, so the abstract statement comes first.
  - type: contributes_to
    target: concept.analysis.functional_analysis
    note: Hilbert space is the corner of functional analysis where duality, projection and the spectral theorem are exact rather than partial, and it supplies the model results the general Banach theory then works to imitate.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.rasmussen.gaussian_processes
    title: Rasmussen and Williams, Gaussian Processes for Machine Learning
    url: https://gaussianprocess.org/gpml/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **Hilbert space** is a vector space $H$ over $\mathbb{R}$ or $\mathbb{C}$
carrying an inner product $\langle \cdot, \cdot \rangle$ which is **complete** in
the induced norm $\|x\| = \sqrt{\langle x, x \rangle}$ — every Cauchy sequence in
$H$ converges to a point of $H$. The convention used here is that
$\langle \cdot, \cdot \rangle$ is linear in its first argument and conjugate-linear
in its second.

Both halves do work. The inner product supplies angles, so _orthogonal_ means
something; completeness supplies limits, so a construction that produces a
sequence is allowed to produce an answer. Drop completeness and you have an inner
product space, drop the inner product and you have a Banach space, and neither
remainder supports the three theorems below.

## Why it matters

Infinite-dimensional problems are hard because existence is hard. A Hilbert space
is where three existence statements hold at once: the nearest point of a closed
convex set exists and is unique; every vector is the convergent sum of its
coordinates against an orthonormal basis; every continuous linear functional _is_
an inner product with a fixed vector. Each converts an analytic question into a
geometric one, and between them they underwrite least squares, the spectral
theorem, the unitarity of the Fourier transform, the state space of quantum
mechanics, weak solutions of elliptic equations, and kernel methods.

## Intuition

Carry the picture from $\mathbb{R}^n$: to approximate a vector by a subspace,
drop a perpendicular. That survives intact, with one added hypothesis — the
subspace must be closed — and the residual still orthogonal to what you projected
onto.

The analogy breaks in three named places. The closed unit ball is not compact, so
"take a convergent subsequence" is not available. An orthonormal basis is not a
basis in the algebraic sense: the expansion is an infinite series, and only its
limit is in the span. And a vector need not be a function with values — in $L^2$
it is an equivalence class, and asking for $f(0)$ is meaningless.

## Concrete example

Work in $L^2([-\pi, \pi])$ with $\langle f, g\rangle = \int_{-\pi}^{\pi} f \bar g \, dx$,
and take the square wave $f(x) = \operatorname{sign}(x)$. The functions
$e_k(x) = \sin(kx)/\sqrt{\pi}$ for $k = 1, 2, \ldots$ are orthonormal, since
$\int_{-\pi}^{\pi} \sin(kx)\sin(\ell x)\,dx = \pi \delta_{k\ell}$. Their
coefficients are

$$
\langle f, e_k \rangle
= \frac{2}{\sqrt{\pi}} \int_{0}^{\pi} \sin(kx)\,dx
= \frac{2\,(1 - \cos k\pi)}{k\sqrt{\pi}}
= \begin{cases} 4/(k\sqrt{\pi}) & k \text{ odd} \\ 0 & k \text{ even.} \end{cases}
$$

Now check Parseval. $\|f\|^2 = \int_{-\pi}^{\pi} 1 \, dx = 2\pi$, while

$$
\sum_{k \text{ odd}} |\langle f, e_k \rangle|^2
= \frac{16}{\pi} \sum_{j \ge 0} \frac{1}{(2j+1)^2}
= \frac{16}{\pi}\cdot\frac{\pi^2}{8} = 2\pi .
$$

The two agree exactly. Truncating at $k = 5$ captures
$\tfrac{16}{\pi}(1 + \tfrac19 + \tfrac1{25}) \approx 5.8626$ of that $2\pi \approx 6.2832$,
so $\|f - S_5\|^2 \approx 0.4206$: three terms hold 93% of the energy.

Two qualifications. These $e_k$ are an orthonormal basis of the closed subspace
of odd functions, not of all of $L^2([-\pi,\pi])$; the cosines and the constant
are needed for that. And $S_5$ overshoots near the jump at $x = 0$ by roughly 9%
of the jump height — the Gibbs phenomenon — an overshoot that narrows but does
not shrink as terms are added. What the Hilbert-space theory delivers here is
norm convergence; uniform convergence is what genuinely fails, while pointwise
convergence does hold for this $f$ at every point but $x = \pm\pi$ — by
Dirichlet's theorem, which is separate machinery.

## Formal treatment

The axioms are $\langle y, x\rangle = \overline{\langle x, y\rangle}$, linearity
in the first slot, and $\langle x, x \rangle > 0$ for $x \neq 0$. They give
Cauchy–Schwarz, $|\langle x,y\rangle| \le \|x\|\,\|y\|$, and the parallelogram
law

$$
\|x+y\|^2 + \|x-y\|^2 = 2\|x\|^2 + 2\|y\|^2 .
$$

By the Jordan–von Neumann theorem that law is sufficient as well as necessary: a
norm comes from an inner product exactly when it satisfies it. That is the test
which rules out $L^p$ and $\ell^p$ for $p \neq 2$.

**Projection.** Let $C \subseteq H$ be non-empty, closed and convex. For every
$x \in H$ there is a unique $P_C x \in C$ with
$\|x - P_C x\| = \inf_{y \in C}\|x - y\|$, characterised by
$\operatorname{Re}\langle x - P_C x, \, y - P_C x\rangle \le 0$ for all $y \in C$.
The parallelogram law forces a minimising sequence to be Cauchy; completeness
supplies the limit and closedness keeps it in $C$. When $C = M$ is a closed
subspace this sharpens to $H = M \oplus M^{\perp}$, with $P_M$ linear, idempotent,
self-adjoint, of norm $1$, and the condition becomes $x - P_M x \perp M$ — the
normal equations.

**Orthonormal bases.** For any orthonormal family $(e_n)$, Bessel's inequality
$\sum_n |\langle x, e_n\rangle|^2 \le \|x\|^2$ always holds. The family is a
_basis_ when its closed linear span is $H$, and then the inequality becomes
Parseval's identity $\sum_n |\langle x, e_n\rangle|^2 = \|x\|^2$, with
$x = \sum_n \langle x, e_n\rangle e_n$ converging in norm. $H$ is separable
exactly when it has a countable orthonormal basis, in which case
$x \mapsto (\langle x, e_n\rangle)_n$ is a unitary isomorphism onto $\ell^2$: all
separable infinite-dimensional Hilbert spaces are the same space.

**Riesz representation.** Every continuous linear functional $\varphi$ on $H$ has
a unique $v \in H$ with $\varphi(x) = \langle x, v \rangle$, and
$\|\varphi\| = \|v\|$ — take a unit vector in the one-dimensional
$(\ker\varphi)^{\perp}$. So $H$ is conjugate-linearly isometric to its own dual,
which is what gives adjoints, Lax–Milgram, and conditional expectation.

The running example $L^2(X,\mathcal{M},\mu)$ consists of equivalence classes
modulo $\mu$-null sets of measurable $f$ with $\int |f|^2 d\mu < \infty$, under
$\langle f,g\rangle = \int f \bar g \, d\mu$; its completeness is the
Riesz–Fischer theorem.

The bridge to kernel methods is Riesz again. A **reproducing kernel Hilbert
space** is a Hilbert space of genuine functions on a set $X$ in which each
evaluation $f \mapsto f(x)$ is continuous, so Riesz hands back $k_x \in H$ with
$f(x) = \langle f, k_x\rangle$, and $k(x,y) = \langle k_y, k_x\rangle$ is
positive definite. Moore–Aronszajn runs this backwards: every positive-definite
kernel is the reproducing kernel of exactly one such space. $L^2(\mu)$ is _not_
one, since evaluation is not well defined on equivalence classes.

## Assumptions and requirements

Completeness is the hypothesis everything rests on, and it fails easily.
$C([-1,1])$ under the $L^2$ inner product is an inner product space and not a
Hilbert space: a sequence of continuous functions steepening towards a step is
Cauchy with no continuous limit.

The projection theorem needs closedness and convexity, and each failure breaks a
different half. The finitely supported sequences are a dense, non-closed subspace
of $\ell^2$, so for $x$ outside it the infimum is $0$ and nothing attains it and
existence fails. The unit sphere is closed and not convex, and every one of its
points is nearest to the origin, so uniqueness fails.

Riesz representation requires continuity, not merely linearity; discontinuous
linear functionals exist on every infinite-dimensional normed space, via a Hamel
basis and the axiom of choice, and are represented by nothing. Parseval requires
the orthonormal system to be complete, and applying it to half a basis is a
standard way to prove something false — Bessel's inequality is what holds
otherwise. For $L^2$, equivalence classes are a requirement rather than tidiness:
without them $\|f\| = 0$ would not imply $f = 0$.

## Uses and applicability

Reach for the Hilbert setting whenever the criterion is quadratic. Least squares
is the projection theorem in $\mathbb{R}^n$, Wiener filtering the same theorem in
$L^2$; Fourier series, wavelets, spherical harmonics and principal components are
the basis theorem with different bases. In probability,
$L^2(\Omega,\mathcal{F},P)$ turns statistics into geometry — uncorrelated means
orthogonal, variance is squared distance, and conditional expectation given a
sub-$\sigma$-algebra $\mathcal{G}$ _is_ projection onto $L^2(\mathcal{G})$ — the
geometric reading Durrett gives it in his Theorem 4.1.15, though his existence
proof goes through Radon–Nikodym rather than the projection theorem. In PDE the
weak formulation puts the problem in a Sobolev space and Lax–Milgram delivers the
solution. In machine learning the RKHS view makes the kernel trick a statement
about a function space rather than a computational accident.

Do not reach for it when the criterion is not quadratic: sparsity and robust
losses live in $L^1$, uniform approximation in the sup norm on $C(K)$, and the
projection theorem is unavailable in both. And because all separable Hilbert
spaces are isomorphic, the space itself carries no information — anything
interesting lives in the operators on it or the choice of basis.

## Limitations and common mistakes

**An orthonormal basis is not a Hamel basis.** This is the mistake that matters
most. "Basis" here is topological: a maximal orthonormal set whose _closed_ span
is $H$, with expansions as convergent series. Finite linear combinations of
$(e_n)$ in $\ell^2$ give only the finitely supported sequences. An algebraic basis
of an infinite-dimensional Banach space is necessarily uncountable, by the Baire
category theorem, so the countable $(e_n)$ could not be one.

**Norm convergence is not pointwise convergence.** That the Fourier series of an
$L^2$ function converges almost everywhere is Carleson's theorem, deep and
separate; no amount of Hilbert geometry gives it.

**Closed and bounded does not mean compact.** In $\ell^2$ the sequence $(e_n)$ is
bounded with $\|e_n - e_m\| = \sqrt{2}$, so it has no convergent subsequence.
Bounded sequences do have weakly convergent subsequences, but $e_n \rightharpoonup 0$
while $\|e_n\| = 1$, so the norm is not weakly continuous: a direct method in the
calculus of variations needs weak compactness _and_ weak lower semicontinuity.

Two smaller ones. $M^{\perp\perp}$ is the closure of $M$, not $M$. And not every
comfortable-looking normed space is Hilbert — test the parallelogram law: in
$C[0,1]$ with the sup norm, $f = 1$ and $g = x$ give $4 + 1 \ne 2 + 2$.

In machine learning the recurring error is to treat an RKHS as large. It is
typically small: the sample paths of a Gaussian process almost surely do not lie
in the RKHS of its own covariance kernel, though the posterior mean does.

## Variants and alternatives

**Inner product (pre-Hilbert) spaces** drop completeness, and every one has a
unique completion, so the distinction is about what you may assume rather than
what exists. **Banach spaces** drop the inner product: they buy $L^p$ and $C(K)$
and pay with the projection theorem and self-duality. **Non-separable** Hilbert
spaces have orthonormal bases by Zorn's lemma, but uncountable ones, and the
coordinate picture stops being useful. **RKHS** is the specialisation to function
spaces with continuous evaluation. **Krein spaces** allow an indefinite inner
product, keeping the algebra and losing the metric geometry. A **rigged Hilbert
space** $\Phi \subset H \subset \Phi'$ gives rigorous standing to objects like
Dirac's position eigenstates, which are not elements of $H$. **Frames** relax
orthonormality and even independence, buying redundancy while keeping stable
reconstruction — the setting most wavelet practice uses.

## History and attribution

The object came before the axioms. Hilbert's work on integral equations, in
papers between 1904 and 1910, operated on square-summable sequences of Fourier
coefficients rather than on an abstract space, and his student Erhard Schmidt
supplied the geometric language of orthogonality and projection shortly after. In
1907 Frigyes Riesz and Ernst Fischer independently proved that $L^2$ is complete
and isometric to $\ell^2$, which licensed thinking of functions as points; Riesz,
and independently Maurice Fréchet, gave the representation theorem the same year.

The axiomatic definition on this page — a complete inner product space,
originally also separable — is John von Neumann's, around 1929, arrived at while
putting quantum mechanics on a rigorous footing and set out in his 1932 book on
the foundations of the subject, where he also proved the spectral theorem for
unbounded self-adjoint operators. Reproducing kernel theory was synthesised by
Nachman Aronszajn in 1950, drawing on E. H. Moore, Stefan Bergman and Salomon
Bochner; it reached machine learning four decades later.

## Sources

Axler's _Linear Algebra Done Right_ is the cleanest treatment of the
finite-dimensional core — inner products, Cauchy–Schwarz, orthonormal expansions,
projection as best approximation, the representation theorem — and is where to
build the intuition this page then stresses. MIT 18.100A supplies the completeness
and compactness background, including why "closed and bounded implies compact" is
a theorem about $\mathbb{R}^n$ rather than a general fact. Durrett's _Probability:
Theory and Examples_ is where to read $L^2$ as a working space and conditional
expectation as orthogonal projection. Rasmussen and Williams cover the kernel and
RKHS side, including how a Gaussian process relates to the RKHS of its covariance
function.

## Prerequisites and next connections

Come with [Real Analysis](./real-analysis.md) — Cauchy sequences, completeness,
convergence of series — and with the geometry of the dot product from
[Multivariable Calculus](./multivariable-calculus.md), since almost every theorem
here is that picture with a closedness hypothesis attached. Lebesgue integration
is needed for the examples, not for the definitions.

What it opens up is most of modern analysis: operator and spectral theory, where
self-adjoint operators on $H$ play the part of symmetric matrices; Fourier
analysis and wavelets, which are orthonormal expansions in particular bases;
Sobolev spaces and weak solutions of partial differential equations; $L^2$
probability, where conditional expectation and martingale arguments become
geometric; and the reproducing kernel view that connects all of it to kernel
methods.
