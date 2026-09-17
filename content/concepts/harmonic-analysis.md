---
concept_id: concept.analysis.harmonic_analysis
title: Harmonic Analysis
slug: /concepts/harmonic-analysis
aliases:
  - abstract harmonic analysis
  - Fourier analysis on groups
kind: concept
tier: 1
review_state: generated-draft
summary: Fourier analysis rebuilt for an arbitrary group, where functions on a locally compact group decompose along its characters and every translation-invariant operator becomes multiplication in that basis.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: generalizes
    target: concept.analysis.fourier_analysis
    note: The classical transforms on the line, the circle and the finite cycle are the three cases where the underlying group is the reals, the torus and a finite cyclic group, and the abstract theory keeps the machinery while letting that group vary.
  - type: requires
    target: concept.analysis.measure_theory
    note: The transform is an integral against Haar measure, so the existence and essential uniqueness of a translation-invariant measure is the load-bearing hypothesis of the whole subject rather than a technicality.
  - type: requires
    target: concept.analysis.functional_analysis
    note: The dual group is recovered as the Gelfand spectrum of the commutative Banach algebra of integrable functions, and the Plancherel theorem is the statement that one specific operator between two Hilbert spaces is unitary.
  - type: contributes_to
    target: concept.analysis.translation_equivariance
    note: Harmonic analysis supplies the exact form of an equivariance claim, since the bounded operators commuting with a group action are convolutions and act diagonally on characters.
sources:
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - intuition
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Harmonic analysis** decomposes functions on a group into that group's
characters, and studies what the decomposition preserves. Let $G$ be a locally
compact Hausdorff topological group. Haar's theorem supplies a left-invariant
Radon measure $\mu$ on $G$ — $\mu(gE) = \mu(E)$ for every $g \in G$ and
measurable $E$ — unique up to a positive scalar. When $G$ is abelian, a
**character** is a continuous homomorphism $\chi \colon G \to \mathbb{T}$ into
the unit circle of $\mathbb{C}$, and the characters themselves form a group
$\hat G$, the **dual group**. The Fourier transform of $f \in L^1(G)$ is

$$
\hat f(\chi) \;=\; \int_G f(x)\,\overline{\chi(x)}\,d\mu(x), \qquad \chi \in \hat G .
$$

Classical Fourier analysis is this construction with $G$ held fixed at
$\mathbb{R}$, $\mathbb{T}$ or $\mathbb{Z}$. Harmonic analysis is what the subject
becomes when $G$ is allowed to vary.

## Why it matters

Sines and cosines diagonalise differentiation, filters and the heat kernel not
because they are smooth or oscillatory but because they are the characters of the
group that acts on the domain — translation. Once that is the stated reason, the
machinery detaches from the line. It becomes available on finite groups, on the
rotation group $\mathrm{SO}(3)$, on the $p$-adic numbers, and on any homogeneous
space a group acts on transitively.

The payoff each time is the same three facts: convolution becomes multiplication,
the transform is an isometry, and every operator commuting with the group action
is diagonalised at once. That third fact is the precise content of equivariance,
which is why symmetry arguments in geometry, physics and machine learning
eventually route through this subject.

## Intuition

Translations by the elements of $G$ form a commuting family of unitary operators
on $L^2(G)$ when $G$ is abelian. A character is a simultaneous eigenvector of that
whole family: $\chi(x + h) = \chi(h)\chi(x)$ says that translating $\chi$ by $h$
multiplies it by the scalar $\chi(h)$. The Fourier transform is the change of
basis into that shared eigenbasis, and the "frequency domain" is just the label
set for the eigenvectors.

The analogy to diagonalising a commuting family of matrices breaks in two
specific places. First, on a non-compact group like $\mathbb{R}$ the characters
$x \mapsto e^{i\xi x}$ are not in $L^2$; they are not eigenvectors in the space,
and the decomposition is a direct integral rather than a sum. Second, if $G$ is
non-abelian the translations do not commute, so no common one-dimensional
eigenbasis exists. The best available decomposition breaks $L^2(G)$ into
irreducible blocks, some of which now have dimension greater than one, and the
transform becomes matrix-valued.

## Concrete example

Take $G = \mathbb{Z}/4$. Its characters are $\chi_k(n) = i^{kn}$ for
$k = 0,1,2,3$, and $\hat G \cong \mathbb{Z}/4$. For $x = (1, 0, 0, -1)$,

$$
\hat x(k) \;=\; \sum_{n=0}^{3} x_n\, i^{-kn}
\;=\; (0,\; 1 - i,\; 2,\; 1 + i).
$$

Plancherel holds with the counting-measure normalisation: $\sum_n |x_n|^2 = 2$
and $\tfrac14 \sum_k |\hat x(k)|^2 = \tfrac14(0 + 2 + 4 + 2) = 2$. You can check
the numbers directly:

```python
import numpy as np
print(np.fft.fft([1, 0, 0, -1]))   # [0.+0.j  1.-1.j  2.+0.j  1.+1.j]
```

Now break commutativity. The symmetric group $S_3$ has three irreducible complex
representations — trivial, sign, and a two-dimensional standard representation —
and $1^2 + 1^2 + 2^2 = 6 = |S_3|$. There are only two characters in the
homomorphism-to-$\mathbb{T}$ sense, so $\hat G$ is far too small to carry the
information in a function on $S_3$; the two-dimensional block is where the rest
lives. This is the smallest case where the abelian picture visibly fails.

## Formal treatment

Convolution on $G$ is

$$
(f * h)(x) \;=\; \int_G f(y)\, h(y^{-1}x)\, d\mu(y),
$$

which makes $L^1(G)$ a Banach algebra, commutative exactly when $G$ is. For
abelian $G$ the transform satisfies $\widehat{f * h} = \hat f \, \hat h$, and
three theorems complete the picture.

**Plancherel.** With Haar measure on $\hat G$ normalised compatibly,
$f \mapsto \hat f$ extends from $L^1 \cap L^2$ to a unitary isomorphism
$L^2(G) \to L^2(\hat G)$.

**Pontryagin duality.** The map $x \mapsto (\chi \mapsto \chi(x))$ is a
topological isomorphism $G \to \hat{\hat G}$. It exchanges compact with discrete:
$\hat{\mathbb{R}} \cong \mathbb{R}$, $\hat{\mathbb{T}} \cong \mathbb{Z}$,
$\hat{\mathbb{Z}} \cong \mathbb{T}$, $\widehat{\mathbb{Z}/N} \cong \mathbb{Z}/N$.

**Peter–Weyl.** For compact $G$, abelian or not, every irreducible unitary
representation $\pi$ is finite-dimensional, of some dimension $d_\pi$, and the
scaled matrix coefficients $\sqrt{d_\pi}\,\pi_{ij}$ form an orthonormal basis of
$L^2(G)$:

$$
L^2(G) \;\cong\; \widehat{\bigoplus}_{\pi \in \hat G} \; V_\pi^{\oplus d_\pi}.
$$

For $G = \mathrm{SO}(3)$ the irreducible representations have dimensions
$2\ell + 1$, and restricting their matrix coefficients to the homogeneous space
$S^2 = \mathrm{SO}(3)/\mathrm{SO}(2)$ produces the spherical harmonics. Convolution
still turns into multiplication, but of matrices, so the transforms no longer
commute and the order in the product depends on the transform convention chosen.

The equivariance statement is then exact: a bounded operator on $L^2(G)$
commuting with all left translations is convolution with a kernel, and in the
abelian case acts on $\hat G$ as multiplication by a bounded function — a
multiplier.

## Assumptions and requirements

Local compactness is not decoration. Haar measure exists precisely for locally
compact groups; an infinite-dimensional topological vector space admits no
non-trivial translation-invariant Borel measure, and the subject simply stops
there. Unimodularity — left and right Haar measure agreeing — is automatic for
abelian and for compact groups but fails for the affine "$ax+b$" group, where
convolution identities acquire a modular function $\Delta$.

Pontryagin duality assumes commutativity. Drop it and $\hat G$ is a set of
representation classes with no group structure. Peter–Weyl assumes compactness.
Drop that and irreducible representations may be infinite-dimensional, as for
$\mathrm{SL}(2,\mathbb{R})$, and $L^2(G)$ decomposes as a direct integral. For
groups outside the type I class there is no usable Plancherel formula at all.

Analytically, the defining integral converges absolutely only for $f \in L^1(G)$;
the $L^2$ transform on a non-compact group is defined by continuous extension,
not by that integral. Inversion likewise needs a hypothesis such as
$\hat f \in L^1(\hat G)$ or a summability method — pointwise recovery of $f$ is
never free.

## Uses and applicability

Reach for harmonic analysis when the domain carries a group action with an
invariant measure and you care about operators that commute with it. That
describes analytic number theory (Dirichlet characters, Tate's treatment of
$L$-functions on the adeles), PDE on symmetric spaces, probability (the
characteristic function is the Fourier transform on $\mathbb{R}^n$, and
convolution of laws is addition of independent variables), crystallography, and
equivariant machine learning, where group convolutions and spherical networks are
the construction of this page applied to $\mathbb{Z}^2 \rtimes C_4$ or to
$\mathrm{SO}(3)$.

Do not reach for it when there is no group. A general graph or a generic manifold
has no transitive symmetry, and the right substitute is the spectrum of a
Laplacian, which generalises the eigenfunction half of Fourier analysis while
abandoning the group half — and with it the convolution theorem.

## Limitations and common mistakes

The most common mistake is reading the theory as classical Fourier analysis in
heavier notation. The abelian case genuinely is that; the non-abelian case is
different in kind, with a matrix-valued transform, no dual group, and no
pointwise product.

The second is expecting the dual to look like the original. It usually does not:
$\hat{\mathbb{Z}} \cong \mathbb{T}$, which is exactly why the discrete-time
Fourier transform is periodic. That periodicity is duality, not an artefact of
sampling.

The third is normalisation. Plancherel's constant depends on how $\mu$ is scaled
on $G$ and on $\hat G$, which is what the scattered factors of $2\pi$ in
engineering conventions really are. Nothing deep, but most sign and factor errors
live here.

The fourth is assuming that a finite implementation inherits the continuous
theory. Sampling $\mathrm{SO}(3)$ on a grid does not give a subgroup, so
equivariance holds only approximately; exact equivariance in a discrete model
requires the model to be built on an actual discrete subgroup.

## Variants and alternatives

**Euclidean harmonic analysis** — singular integrals, Calderón–Zygmund theory,
Littlewood–Paley decomposition — stays on $\mathbb{R}^n$ and pushes far past the
group-theoretic core. **Abstract harmonic analysis** is the locally compact
abelian theory described here. **Compact group representation theory** is the
Peter–Weyl branch, and **Harish-Chandra's Plancherel theory** extends it to
semisimple Lie groups at considerable cost in difficulty.

The genuine competitors decompose functions without a group. Wavelets and
time-frequency analysis trade a clean convolution theorem for localisation in
position and frequency at once, though the continuous wavelet transform is itself
harmonic analysis on the affine group and the Gabor transform on the Heisenberg
group. Spectral graph theory replaces characters with Laplacian eigenvectors and
works on domains with no symmetry at all.

## History and attribution

The idea has several independent origins that converged. Fourier's early
nineteenth-century work on heat conduction supplied the analytic half. The
algebraic half came from Frobenius's characters of finite groups in the 1890s and
Schur's and Weyl's representation theory of compact Lie groups. Peter and Weyl
proved the completeness theorem for compact groups in 1927. Haar constructed the
invariant measure in 1933, after which von Neumann and Weil established uniqueness
and generality. Pontryagin proved duality for locally compact abelian groups in
the mid-1930s, with van Kampen removing a countability restriction, and Gelfand's
theory of commutative Banach algebras gave an independent route to the dual group
in the 1940s. Harish-Chandra's Plancherel formula for semisimple Lie groups
occupied the following decades.

## Sources

MIT 18.702 supplies the finite-group representation theory behind the $S_3$
example only — characters, orthogonality relations and the dimension identity —
and nothing beyond it: it is an algebra course, with no locally compact groups and
no Haar measure. MIT 6.003 is the concrete case done properly: convolution and
transforms on the line and the cycle, which is what the general theory must
reproduce. MIT 18.100A is cited for elementary convergence discipline — modes of
convergence and the interchange of limits — and for nothing else here; it has
neither Lebesgue integration nor $L^p$ spaces, and no Haar measure. The geometric
deep learning survey is the modern applied reading, and the best of these on what
to do when no group is available.

None of the four covers abstract harmonic analysis itself, so the Definition,
Formal treatment, Assumptions and requirements and History sections are unsourced:
Haar measure, Pontryagin duality, Peter–Weyl and the attributions from Peter and
Weyl through to Harish-Chandra are stated here without cited evidence and should
be read as unverified. Closing that gap needs a source of the kind of Folland's
_A Course in Abstract Harmonic Analysis_ or Rudin's _Fourier Analysis on Groups_
added to the registry first.

## Prerequisites and next connections

Read [Fourier Analysis](./fourier-analysis.md) first, and know what
[Convolution](./convolution.md) is as an operation before meeting it as an algebra
product. From [Real Analysis](./real-analysis.md) you need modes of convergence
and the interchange of limits and integrals; measure theory supplies the integral
that Haar measure is an instance of, and functional analysis supplies the Banach
and Hilbert space language the three main theorems are stated in.

What it opens up runs two ways. Toward pure mathematics, the representation theory
of Lie groups and analytic number theory. Toward applications,
[Translation Equivariance](./translation-equivariance.md) is the case
$G = \mathbb{Z}^2$ that a [Convolutional Layer](./convolutional-layer.md)
implements, and enlarging that group is how equivariant networks are built.
