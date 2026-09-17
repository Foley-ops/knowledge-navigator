---
concept_id: concept.geometry.lie_groups
title: Lie Groups
slug: /concepts/lie-groups
aliases:
  - continuous transformation group
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: A symmetry you can differentiate — a group whose elements form a smooth manifold, so rotations, rigid motions and gauge transformations can be reached by calculus rather than enumeration.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.geometry.manifolds
    note: '"Multiplication is smooth" is a statement about charts and tangent spaces, and none of it parses without the manifold definition first.'
  - type: requires
    target: concept.algebra.group_theory
    note: Subgroups, quotients, homomorphisms and conjugation are the algebraic content being made smooth; the geometry only constrains what those constructions may look like.
  - type: equivalent_under
    target: concept.algebra.lie_algebras
    note: Differentiating at the identity is an equivalence of categories only after restricting to simply connected groups; without that restriction the correspondence is purely local, as SU(2) and SO(3) show.
  - type: generalizes
    target: concept.analysis.translation_equivariance
    note: Translation equivariance is equivariance under the Lie group $(\mathbb{R}^n,+)$, and replacing that group by SO(3) or SE(2) is what group-equivariant architectures do.
sources:
  - source_id: source.hall.groups_and_representations
    title: An Elementary Introduction to Groups and Representations
    url: https://arxiv.org/abs/math-ph/0005032
    source_kind: preprint
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.kirillov.intro_lie_groups_lie_algebras
    title: Introduction to Lie Groups and Lie Algebras
    url: https://www.math.stonybrook.edu/~kirillov/mat552/liegroups.pdf
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.plato.nineteenth_century_geometry
    title: 'Stanford Encyclopedia of Philosophy: Nineteenth Century Geometry'
    url: https://plato.stanford.edu/entries/geometry-19th/
    source_kind: authoritative-secondary
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.cohen2018.spherical_cnns
    title: Spherical CNNs
    url: https://arxiv.org/abs/1801.10130
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: Hilbert's fifth problem and its 1952 solution by Gleason and by Montgomery and Zippin
    reason: No registry source covers the topological-group side of the theory, so the claim that a locally Euclidean topological group carries a unique compatible smooth structure is stated here without support.
    sections:
      - assumptions-and-requirements
      - history-and-attribution
claims: []
---

## Definition

A **Lie group** is a set $G$ carrying two structures at once — a group structure
and the structure of a smooth manifold — subject to one compatibility condition:
the multiplication map $m : G \times G \to G$, $m(g,h) = gh$, and the inversion
map $i : G \to G$, $i(g) = g^{-1}$, are smooth. (Smoothness of $m$ alone forces
$i$ to be smooth, by the implicit function theorem, so many texts state only the
first condition.) The **dimension** of $G$ is its dimension as a manifold, not
the number of its elements.

The examples to hold in mind are matrices. $GL(n,\mathbb{R})$ is an open subset
of $\mathbb{R}^{n^2}$, so a manifold of dimension $n^2$, on which multiplication
is polynomial and inversion rational. Inside it sit $SO(3)$ (dimension $3$),
$SU(2)$ ($3$ over $\mathbb{R}$), $SE(3)$ (rigid motions, dimension $6$) and the
rest of the classical groups. That these are manifolds at all is **Cartan's
closed subgroup theorem**: a closed subgroup of a Lie group is automatically an
embedded Lie subgroup.

## Why it matters

A finite group is handled by listing its elements; a continuous group cannot be,
and the manifold structure replaces the list. You differentiate along the group,
take tangent vectors to families of symmetries, and turn symmetry into linear
algebra.

The payoff is concrete. A rotation has nine matrix entries and six constraints;
an optimiser stepping in $\mathbb{R}^9$ leaves the group immediately, while one
stepping in the three-dimensional tangent space and pushing the step back with
$\exp$ never does — which is why pose estimation, SLAM and geometric integrators
are written in $SE(3)$ rather than in raw coordinates. In physics the same
structure gives Noether's theorem its teeth: a one-parameter group of symmetries
of an action yields a conserved quantity, and "one-parameter group" means exactly
a smooth homomorphism $\mathbb{R} \to G$.

## Intuition

A Lie group is a space that looks the same from every point. Left translation
$L_g(x) = gx$ is a diffeomorphism carrying $e$ to $g$, so a local fact proved at
the identity transports everywhere, and all the local information sits in one
tangent space $T_eG$ — which is why [Lie Algebras](./lie-algebras.md) is a
separate subject that can say so much with only a bracket.

The picture to carry: $SO(3)$ is a solid ball of radius $\pi$ whose points are
axis-angle vectors, with antipodal boundary points glued, since a rotation by
$\pi$ about $n$ equals one about $-n$. $SU(2)$ is the $3$-sphere, wrapping twice
around that ball.

The analogy to a flat vector space breaks twice. The group's curvature shows up
algebraically: $\exp(X)\exp(Y) \neq \exp(X+Y)$ unless $X$ and $Y$ commute. And
the tangent space knows nothing about global shape — how many components the
group has, or whether a loop in it contracts.

## Concrete example

The homomorphism $\Phi : SU(2) \to SO(3)$ is the example everything else is
checked against. Write $x \in \mathbb{R}^3$ as a traceless Hermitian matrix
$X = x_1\sigma_1 + x_2\sigma_2 + x_3\sigma_3$ in the Pauli basis. For
$U \in SU(2)$, $UXU^\dagger$ is again traceless Hermitian and
$\det X = -\lVert x \rVert^2$ is unchanged, so $U$ acts on $\mathbb{R}^3$ by a
rotation, $\Phi(U)_{ij} = \tfrac{1}{2}\operatorname{tr}(\sigma_i U \sigma_j U^\dagger)$.

```python
import numpy as np

theta = np.pi / 3                      # 60 degrees about the z-axis
U = np.diag([np.exp(-1j * theta / 2), np.exp(1j * theta / 2)])
s = [np.array([[0, 1], [1, 0]]),
     np.array([[0, -1j], [1j, 0]]),
     np.array([[1, 0], [0, -1]])]
R = np.array([[0.5 * np.trace(s[i] @ U @ s[j] @ U.conj().T).real
               for j in range(3)] for i in range(3)])
print(np.round(R, 3))    # [[0.5, -0.866, 0], [0.866, 0.5, 0], [0, 0, 1]]; -U gives the same R
```

$\Phi$ is surjective with kernel $\{\pm I\}$: a two-to-one covering. Follow
$U(\theta) = \exp(-i\theta\sigma_3/2)$ from $\theta = 0$; at $\theta = 2\pi$ the
rotation has returned to the identity but $U = -I$, and only at $\theta = 4\pi$
does the $SU(2)$ element come home. Two groups, one Lie algebra, different global
topology — $SU(2) \cong S^3$ is simply connected, $\pi_1(SO(3)) = \mathbb{Z}/2$ —
and half-integer spin is that difference made physical.

## Formal treatment

A vector field $X$ on $G$ is **left-invariant** if $(dL_g)X = X$ for all $g$.
Such fields are determined by their value at $e$, so they form a vector space
isomorphic to $T_eG$ closed under the bracket of vector fields: the Lie algebra
$\mathfrak{g}$. A left-invariant field is complete, so each
$X \in \mathfrak{g}$ has a unique integral curve through $e$ — a one-parameter
subgroup $\gamma_X : \mathbb{R} \to G$ — and the **exponential map** is
$\exp(X) = \gamma_X(1)$, which for matrix groups is $\sum_{k\ge 0} X^k/k!$.

Since $d(\exp)_0 = \mathrm{id}$, $\exp$ is a diffeomorphism from a neighbourhood
of $0$ onto one of $e$ — a canonical chart — and it is natural: for any smooth
homomorphism $\phi : G \to H$,

$$
\phi(\exp X) = \exp\big(d\phi_e X\big).
$$

Conjugation $C_g(x) = gxg^{-1}$ differentiates to the **adjoint representation**
$\mathrm{Ad}: G \to GL(\mathfrak{g})$, and $\mathrm{Ad}$ differentiates to
$\mathrm{ad}_X Y = [X,Y]$.

The correspondence, stated exactly: $\mathfrak{g}$ determines the **simply
connected** group $\tilde{G}$ uniquely, and every connected group with that
algebra is $\tilde{G}/\Gamma$ for a discrete central $\Gamma$. A homomorphism
$\mathfrak{g} \to \mathfrak{h}$ integrates to $G \to H$ when $G$ is simply
connected, and otherwise only near the identity.

Every Lie group carries a left-invariant **Haar measure**, unique up to scale. A
compact group has finite volume, so one may average over it — the reason its
representations decompose into finite-dimensional irreducibles, and the reason
integration over $SO(3)$ is a usable operation.

## Assumptions and requirements

**Connectedness.** $O(3)$ and $SO(3)$ have the same Lie algebra; nothing
infinitesimal distinguishes them. Every statement of the correspondence is about
the identity component.

**Simple connectedness.** Drop it and lifting fails: there is no continuous
homomorphism $SO(3) \to SU(2)$ inverting $\Phi$, because a section of a
nontrivial covering cannot exist.

**Closedness of subgroups.** The closed subgroup theorem needs closed. The line
of irrational slope winding densely on the torus $T^2$ is a subgroup and an
immersed submanifold, but not embedded and not closed.

**Compactness.** Haar averaging needs finite volume, unavailable for
$\mathbb{R}^n$ and for the Lorentz group, and what breaks differs. For
$(\mathbb{R}^n,+)$ the irreducibles stay one-dimensional — the characters
$x \mapsto e^{i\langle \xi,x\rangle}$ — but the decomposition becomes a direct
integral of them rather than a direct sum: the Fourier transform in place of a
Peter–Weyl sum. For the Lorentz group, and non-compact semisimple groups
generally, there are no non-trivial finite-dimensional unitary representations
at all, so the unitary theory is infinite-dimensional and much harder.

**Finite dimension and smoothness.** The theory above is finite-dimensional.
Assuming only continuity costs nothing — a locally Euclidean topological group
admits a unique compatible smooth structure — but that is a deep theorem, not a
definition.

## Uses and applicability

Reach for Lie groups when a symmetry is continuous and you must compute with it:
rigid-body kinematics and state estimation on $SE(3)$; integrators that stay
exactly on the group; gauge theory, whose group is
$SU(3) \times SU(2) \times U(1)$ and whose field takes values in $\mathfrak{g}$.

In machine learning the use is equivariance. A layer is $G$-equivariant if
$L(g \cdot x) = g \cdot L(x)$; for $G = (\mathbb{R}^n,+)$ that is ordinary
convolution, and for a larger group the correlation is taken over $G$ itself.
Spherical CNNs do this for $SO(3)$ through a generalised Fourier transform on the
group. Steerable and $E(n)$-equivariant networks instead work in a basis of
irreducible representations, so the weights satisfy a linear constraint rather
than the features being lifted to the group.

Not when the symmetry is finite — permutations, lattice symmetries — where
ordinary representation theory applies, nor when it is only approximate, since a
hard constraint then costs capacity for nothing.

## Limitations and common mistakes

The first mistake is treating group and algebra as interchangeable. Isomorphic
algebras do not give isomorphic groups, and $\exp$ is in general neither
injective ($\exp(2\pi L_3) = I$) nor surjective (in $SL(2,\mathbb{R})$ it misses
$\mathrm{diag}(-2,-\tfrac12)$) — it is surjective for compact connected groups,
which is why the rotation case misleads.

The second is confusing a chart with the group. Gimbal lock is a defect of Euler
angles, not of $SO(3)$: no compact $3$-manifold has a global chart. The practical
consequence is sharp — because $SU(2) \to SO(3)$ is a nontrivial double cover, a
network regressing a unit quaternion cannot depend continuously on the rotation
everywhere, and the sign ambiguity appears as discontinuity in the learned map.

The third is expecting to average over a group of infinite volume. "Average the
prediction over all translations" is not a finite operation on $\mathbb{R}^n$:
either the group is compact or the average runs over a sampled subset, which
makes the invariance approximate.

Finally, discretisation erodes exact equivariance. It is a theorem about the
continuous transform; once the sphere or the group is sampled, equivariance holds
only up to discretisation error — an engineering fact about implementations, not
a flaw in the mathematics.

## Variants and alternatives

**Matrix Lie groups** — closed subgroups of $GL(n,\mathbb{C})$ — cover almost
everything used in practice, but not everything: the universal cover of
$SL(2,\mathbb{R})$ has no faithful finite-dimensional representation. Groups are
sorted as **compact** or not, **abelian**, **solvable**, **nilpotent**,
**semisimple**; **algebraic groups** move the same ideas to other fields,
**$p$-adic Lie groups** to other topologies. Going larger gives **Banach** and
**Fréchet Lie groups** — loop and diffeomorphism groups. Banach ones keep the
inverse function theorem and with it most of the local theory; Fréchet ones such
as $\mathrm{Diff}(M)$ do not, $\exp$ there need not even be locally surjective,
and the theory must be rebuilt. Sideways gives **Lie
groupoids** and, as deformations of the enveloping algebra, **quantum groups**.

For rotations specifically, the alternatives are parametrisations rather than
different mathematics: unit [Quaternions](./quaternions.md) are literally
$SU(2)$, rotors in [Geometric Algebra](./geometric-algebra.md) the same object in
other notation, and rotation matrices the group itself.

## History and attribution

Sophus Lie began the theory in the 1870s, seeking an analogue of Galois theory
for differential equations: continuous groups of transformations explaining when
an equation can be integrated. His collaboration with Felix Klein is at the root
of both projects, and Klein's Erlangen programme of 1872 made a transformation
group the defining datum of a geometry.

Wilhelm Killing and Élie Cartan classified the simple complex Lie algebras
between about 1888 and 1894. The global, manifold-based definition used today is
a twentieth-century reformulation: Weyl's work on compact groups in the 1920s,
Cartan's global form of Lie's third theorem, and Chevalley's 1946 textbook are
the usual landmarks. Hilbert's fifth problem of 1900 asked whether smoothness
could be dropped from the hypotheses; it was answered affirmatively in 1952.

## Sources

Hall's _An Elementary Introduction to Groups and Representations_ is the one to
read first: it builds the theory for matrix groups, does $SU(2) \to SO(3)$ and
the covering-group story explicitly, and is careful about where $\exp$ fails.
Kirillov's notes give the manifold-level treatment — left-invariant fields, the
exponential map, Haar measure, the classification. The Stanford Encyclopedia
entry on nineteenth-century geometry covers Lie's and Klein's actual motivations
rather than the tidied-up modern account. _Spherical CNNs_ is a continuous group
used as an architectural constraint.

## Prerequisites and next connections

Read [Manifolds](./manifolds.md) and [Group Theory](./group-theory.md) first;
this page is the intersection of the two. The matrix exponential from [Matrix Theory](./matrix-theory.md) and tangent
spaces from [Multivariable Calculus](./multivariable-calculus.md) make $\exp$
concrete rather than formal.

From here, [Lie Algebras](./lie-algebras.md) is the algebraic half of the
correspondence and where computation happens, and
[Representation Theory](./representation-theory.md) is what these groups are
usually used _for_. [Quaternions](./quaternions.md) is $SU(2)$ reached from
another direction, and [Translation Equivariance](./translation-equivariance.md)
the $(\mathbb{R}^n,+)$ case convolutional networks already rely on.
