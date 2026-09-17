---
concept_id: concept.algebra.representation_theory
title: Representation Theory
slug: /concepts/representation-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The study of abstract algebraic structures by making their elements act as matrices, so that symmetry can be analysed with the tools of linear algebra.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.algebra.group_theory
    note: A representation is a homomorphism out of a group, so the notions of subgroup, conjugacy class and quotient are used before the first theorem is stated.
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: The target of a representation is the general linear group of a vector space, and every construction here is a statement about invariant subspaces and direct sums.
  - type: contributes_to
    target: concept.analysis.harmonic_analysis
    note: The irreducible unitary representations of a locally compact group are its Fourier modes, so Peter-Weyl and the Plancherel theorem are representation theory carried into analysis.
  - type: contributes_to
    target: concept.algebra.lie_algebras
    note: A smooth representation of a Lie group differentiates to a representation of its Lie algebra, and the irreducible representations of a semisimple Lie algebra are classified by highest weight.
sources:
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.cohen2018.spherical_cnns
    title: Spherical CNNs
    url: https://arxiv.org/abs/1801.10130
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **representation** of a group $G$ over a field $k$ is a homomorphism
$\rho : G \to \mathrm{GL}(V)$, where $V$ is a $k$-vector space and
$\mathrm{GL}(V)$ is the group of invertible linear maps on it. Concretely,
every group element is assigned a matrix, and the assignment respects the group
law: $\rho(gh) = \rho(g)\rho(h)$ and $\rho(e) = I$. The **degree** of the
representation is $\dim V$.

A subspace $W \subseteq V$ with $\rho(g)W \subseteq W$ for all $g \in G$ is a
**subrepresentation**. If the only subrepresentations are $0$ and $V$ (and
$V \neq 0$), the representation is **irreducible**. Equivalently, a
representation is a module over the group algebra $k[G]$, and irreducible means
simple; that dictionary is what lets ring-theoretic machinery apply.
**Representation theory** studies these objects — for groups, and equally for
algebras, Lie algebras and quivers.

## Why it matters

An abstract group has no numbers in it. A representation attaches numbers —
traces, eigenvalues, dimensions, multiplicities — and those numbers are rigid
enough to prove things the group definition alone will not give up. Burnside's
theorem, that every group of order $p^a q^b$ is solvable, was proved with
characters in 1904; a proof avoiding them took roughly seventy years. Character
theory was a standard instrument in the classification of finite simple groups.

It also unifies things that look unrelated. [Fourier
Analysis](./fourier-analysis.md) is the representation theory of abelian
groups: the exponentials $e^{2\pi i \xi x}$ are exactly the irreducible
representations of $\mathbb{R}$, and the DFT basis vectors are the irreducible
representations of $\mathbb{Z}/N$. In quantum mechanics, elementary particles
are labelled by irreducible unitary representations of the spacetime symmetry
group. In machine learning, "this layer must commute with a group action" is a
statement about maps between representations, which is where equivariant
architectures get their design rules.

## Intuition

Carry two pictures. The first: a group is a set of symmetries known only by how
they compose, and a representation is a choice of coordinates in which those
symmetries become matrices you can compute with. None of the choices is
canonical.

The second: decomposing a representation into irreducibles is diagonalisation
for a whole group at once. A single operator splits a space into eigenspaces; a
group splits it into blocks that every group element preserves. Normal modes of
a symmetric molecule are the physical version — the vibrations sort themselves
into symmetry types, and modes of different types do not mix.

The analogy to diagonalisation breaks in one important place. For a commutative
group the blocks really are one-dimensional, and you recover scalars, as in
[Spectral Theory](./spectral-theory.md). For a non-abelian group the
irreducible blocks can be larger, and no change of basis makes them smaller.
That is why Fourier analysis on a non-abelian group produces matrix-valued
coefficients rather than numbers.

## Concrete example

Take $G = S_3$, the permutations of three letters, of order $6$. Its conjugacy
classes are $\{e\}$, the three transpositions, and the two $3$-cycles. There are
three irreducible complex representations: the trivial one, the sign
representation, and a two-dimensional **standard** representation. Their
characters (traces, constant on each class) are

| character              | $e$ (1 elt) | $(12)$ (3 elts) | $(123)$ (2 elts) |
| ---------------------- | ----------- | --------------- | ---------------- |
| $\chi_{\mathrm{triv}}$ | 1           | 1               | 1                |
| $\chi_{\mathrm{sgn}}$  | 1           | $-1$            | 1                |
| $\chi_{\mathrm{std}}$  | 2           | 0               | $-1$             |

The degrees satisfy $1^2 + 1^2 + 2^2 = 6 = |G|$.

The standard representation is the plane $x_1 + x_2 + x_3 = 0$ inside
$\mathbb{C}^3$ with $S_3$ permuting coordinates. In the basis
$v_1 = e_1 - e_2$, $v_2 = e_2 - e_3$,

$$
\rho\big((12)\big) = \begin{bmatrix} -1 & 1 \\ 0 & 1 \end{bmatrix},
\qquad
\rho\big((123)\big) = \begin{bmatrix} 0 & -1 \\ 1 & -1 \end{bmatrix},
$$

with traces $0$ and $-1$, matching the table.

Now decompose the permutation representation on $\mathbb{C}^3$. Its character is
the number of fixed points: $\chi_{\mathrm{perm}} = (3, 1, 0)$. Using the inner
product below, weighting each class by its size,

$$
\langle \chi_{\mathrm{perm}}, \chi_{\mathrm{triv}} \rangle
= \tfrac{1}{6}\,(1\cdot 3\cdot 1 + 3\cdot 1 \cdot 1 + 2\cdot 0\cdot 1) = 1,
\qquad
\langle \chi_{\mathrm{perm}}, \chi_{\mathrm{sgn}} \rangle = 0,
\qquad
\langle \chi_{\mathrm{perm}}, \chi_{\mathrm{std}} \rangle = 1 ,
$$

so $\mathbb{C}^3 \cong \mathrm{triv} \oplus \mathrm{std}$ — the line of constant
vectors plus the zero-sum plane. Three integer inner products replaced a search
for invariant subspaces.

## Formal treatment

Fix a finite group $G$ and a field $k$.

**Maschke's theorem.** If $\mathrm{char}\,k \nmid |G|$, every finite-dimensional
representation of $G$ over $k$ is a direct sum of irreducibles. The proof
averages an arbitrary projection $\pi$ onto a subrepresentation into an
equivariant one,
$\tilde\pi = \tfrac{1}{|G|}\sum_{g} \rho(g)\pi\rho(g)^{-1}$, which is where
$|G|$ must be invertible in $k$.

**Schur's lemma.** If $V, W$ are irreducible and $\varphi : V \to W$ is
equivariant ($\varphi \rho_V(g) = \rho_W(g)\varphi$ for all $g$), then
$\varphi$ is zero or an isomorphism. If in addition $k$ is algebraically closed
and $\dim V < \infty$, then $\mathrm{End}_G(V) = k \cdot \mathrm{id}$: every
self-equivariant map is a scalar.

**Characters and orthogonality.** Over $\mathbb{C}$, define
$\chi_V(g) = \mathrm{tr}\,\rho_V(g)$ and

$$
\langle \chi, \psi \rangle = \frac{1}{|G|} \sum_{g \in G} \chi(g)\overline{\psi(g)} .
$$

The irreducible characters form an orthonormal basis of the space of class
functions. Hence the number of irreducible complex representations equals the
number of conjugacy classes; $\langle \chi_V, \chi_V\rangle = 1$ iff $V$ is
irreducible; and two representations with the same character are isomorphic. The
regular representation on $\mathbb{C}[G]$ decomposes as
$\bigoplus_i V_i^{\oplus d_i}$ with $d_i = \dim V_i$, giving
$\sum_i d_i^2 = |G|$.

**Compact groups.** Replace the average with integration against normalised Haar
measure and the statements survive: every representation is unitarisable, the
irreducibles are finite-dimensional, and the **Peter-Weyl theorem** says the
matrix coefficients span a dense subspace of $L^2(G)$, which decomposes as the
Hilbert direct sum $\bigoplus_{\pi \in \hat G} V_\pi \otimes V_\pi^{*}$. For
$G$ abelian this is ordinary Fourier analysis; see
[Hilbert Spaces](./hilbert-spaces.md) for the ambient setting.

## Assumptions and requirements

Maschke needs finiteness (or compactness plus Haar measure) and
$\mathrm{char}\,k \nmid |G|$. Both are sharp. Let $G = \mathbb{Z}/2$ act on
$\mathbb{F}_2^2$ by $g \mapsto \begin{bmatrix}1 & 1\\ 0 & 1\end{bmatrix}$. The
line spanned by $e_1$ is invariant, and it is the only invariant line, so it has
no invariant complement: the representation is indecomposable but not
irreducible. This is the doorway to modular representation theory, where the
clean picture above does not hold.

The scalar form of Schur's lemma needs $k$ algebraically closed. Over
$\mathbb{R}$, the rotation representation of $\mathbb{Z}/n$ ($n \geq 3$) on
$\mathbb{R}^2$ is irreducible but its endomorphism algebra is $\mathbb{C}$; over
$\mathbb{R}$ the endomorphism algebra of an irreducible may be $\mathbb{R}$,
$\mathbb{C}$ or $\mathbb{H}$. Character orthogonality as stated is a statement
about $\mathbb{C}$; the count "irreducibles = conjugacy classes" is no longer
guaranteed over a field that is not a splitting field for $G$, though it can
still hold — $S_3$ has three irreducible representations over $\mathbb{Q}$, as
over $\mathbb{C}$. Peter-Weyl needs compactness: for non-compact
groups such as $\mathrm{SL}_2(\mathbb{R})$ the irreducible unitary
representations are mostly infinite-dimensional and appear in continuous
families.

## Uses and applicability

Reach for representation theory when a problem has a group of symmetries and the
objects of interest are linear. Standard uses: structural theorems about finite
groups; selection rules and degeneracies in quantum mechanics and spectroscopy;
block-diagonalising symmetric linear systems, where sorting into isotypic
components turns one large eigenproblem into several small ones; and generalised
Fourier transforms on groups.

In machine learning it supplies the design language for equivariant
architectures. Insisting that a layer commute with a group action means asking
for a map in $\mathrm{Hom}_G(V, W)$, and Schur's lemma makes that space
computable: over $\mathbb{C}$ its dimension is $\sum_i m_i n_i$, the sum over
irreducible types of the product of multiplicities. Spherical CNNs use the
theory at full strength, computing correlation in the Fourier domain of $SO(3)$
with Wigner matrices. Do not reach for it when the symmetry group is trivial, or
when an approximate invariance is better handled by data augmentation.

## Limitations and common mistakes

The most common error outside algebra is a collision of vocabulary: a
"representation" here is a group acting by matrices, not a learned feature
vector. The two senses share nothing but the word.

Within the subject, the frequent mistakes are: assuming every representation
decomposes into irreducibles (false exactly when $\mathrm{char}\,k$ divides
$|G|$); conflating **irreducible** with **indecomposable**, which coincide only
in the semisimple case; and believing that the character table determines the
group. It does not — the dihedral group $D_4$ and the quaternion group $Q_8$
both have order $8$ and identical character tables, and they are not isomorphic.
Characters determine a complex representation up to isomorphism, which is a
different claim.

A practical caution for machine learning: most deployed equivariant networks use
the regular representation and group convolution, and never compute a character
or an irreducible decomposition. The theory explains why those architectures are
the general equivariant linear maps, and it becomes operationally necessary for
continuous groups like $SO(3)$; saying practitioners routinely use character
theory overstates the case.

## Variants and alternatives

**Ordinary** representation theory works over $\mathbb{C}$ with
$\mathrm{char} = 0$ and is the semisimple, well-behaved case. **Modular**
representation theory studies $\mathrm{char}\,k \mid |G|$, where Maschke fails
and the invariants become blocks, decomposition matrices and projective covers.
**Real and quaternionic** theory tracks the Frobenius-Schur indicator and matters
wherever the underlying space is genuinely real. For **compact groups**,
Peter-Weyl and the Weyl character formula give a complete finite-dimensional
theory; for **non-compact** groups one studies infinite-dimensional unitary
representations, a far harder subject with no uniform classification.
**Lie-algebraic** representation theory replaces the group with its Lie algebra
and classifies by highest weight, the practical route to $SU(2)$, $SU(3)$ and
$SO(3)$. Representations of quivers and of finite-dimensional algebras drop the
group entirely. The alternative to the whole approach is combinatorial or
invariant-theoretic argument about the group action itself: more elementary, and
rarely as sharp.

## History and attribution

Ferdinand Georg Frobenius introduced group characters in 1896, prompted by a
question of Richard Dedekind about factoring the "group determinant"; the matrix
representations followed immediately. Heinrich Maschke proved complete
reducibility in the late 1890s. William Burnside developed the finite-group
theory and used it in 1904 for the $p^a q^b$ theorem, and Issai Schur
contributed his lemma and much of the structural theory in the same period.
Hermann Weyl extended the subject to compact and Lie groups in the 1920s, and
the Peter-Weyl theorem was published by Fritz Peter and Weyl in 1927. Richard
Brauer built modular representation theory from the 1930s onward.

## Sources

MIT 18.702 covers the finite-group core — representations, characters, Schur's
lemma, orthogonality and worked character tables — and is the reference for the
definitions, the example and the formal statements here. MIT 18.701 supplies the
prior material on groups, symmetry and linear operators that the intuition leans
on. The geometric deep learning text is the reference for why symmetry groups
and their representations organise modern architecture design, and for which
groups people actually work with; it does not treat the algebraic variants.
Spherical CNNs is a concrete architecture built on the Fourier analysis of a
non-abelian compact group. Wolfram MathWorld is the reference for the names and
definitions of the variants — modular representations, characters, the Weyl
character formula and quivers — which the courses above do not reach.

## Prerequisites and next connections

Read group theory first, and be comfortable with
[Vector Spaces](./vector-spaces.md), invariant subspaces and direct sums; the
whole subject is a conversation between the two. Eigenvalues and diagonalisation
from [Matrix Theory](./matrix-theory.md) make the decomposition theorems feel
inevitable rather than surprising.

From here, [Harmonic Analysis](./harmonic-analysis.md) is the same subject in
analytic clothing, and [Fourier Analysis](./fourier-analysis.md) is its abelian
special case, worth rereading to see what is lost when the group commutes. On
the applied side,
[Translation Equivariance](./translation-equivariance.md) and the
[Convolutional Layer](./convolutional-layer.md) are the statement that
convolution is the general linear map commuting with the translation group — a
representation-theoretic fact that arrived in deep learning by a different road.
