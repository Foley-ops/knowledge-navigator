---
concept_id: concept.algebra.geometric_algebra
title: Geometric Algebra
slug: /concepts/geometric-algebra
kind: concept
tier: 1
review_state: generated-draft
summary: A presentation of real Clifford algebra as a working language for geometry, in which one invertible product of vectors carries both their alignment and the oriented plane they span, and rotations are conjugations by unit elements.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: variant_of
    target: concept.algebra.clifford_algebra
    note: The algebra is literally a real Clifford algebra; what differs is the insistence on real scalars, a geometric reading of every grade, and notation built for computation rather than classification.
  - type: generalizes
    target: concept.algebra.quaternions
    note: The even subalgebra of the three-dimensional geometric algebra is isomorphic to the quaternions, and unit rotors are unit quaternions acting by the same sandwich formula.
  - type: generalizes
    target: concept.algebra.complex_numbers
    note: The even subalgebra of the two-dimensional geometric algebra is isomorphic to the complex numbers, with the unit bivector of the plane playing the role of the imaginary unit.
  - type: used_to_solve
    target: concept.geometry.euclidean_geometry
    note: Reflections, rotations and rigid motions of Euclidean space are expressed as products and conjugations in the algebra without choosing coordinates.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - intuition
      - why-it-matters
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Hestenes' geometric-algebra research programme
    reason: No registry source covers Hestenes' Space-Time Algebra, his later advocacy, or the pedagogical claims made for the formalism; the history and the assessment of those claims rest on material outside the registry.
    sections:
      - history-and-attribution
      - limitations-and-common-mistakes
  - label: Conformal and projective models of geometric algebra
    reason: No registry source covers the conformal or projective geometric algebras or their use in graphics and robotics, so the applied claims here are uncited.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
claims: []
---

## Definition

**Geometric algebra** is the real Clifford algebra $\mathcal{G}(V, Q)$ of a
finite-dimensional real vector space $V$ carrying a quadratic form $Q$, presented
as a calculus for geometry rather than an object of classification. Its defining
rule is that the square of a vector is a scalar, $v^2 = Q(v)$, from which follows
the split of the **geometric product** of two vectors into symmetric and
antisymmetric parts,

$$
ab \;=\; \underbrace{\tfrac{1}{2}(ab + ba)}_{a \cdot b \ \text{(scalar)}}
\;+\; \underbrace{\tfrac{1}{2}(ab - ba)}_{a \wedge b \ \text{(bivector)}} .
$$

Elements are **multivectors**: sums of scalars, vectors, bivectors (oriented
plane elements) and higher **blades**, up to the pseudoscalar of grade $n$.
Nothing here is mathematically distinct from Clifford algebra; the name marks a
tradition — real scalars only, every grade read geometrically, notation
optimised for calculation.

## Why it matters

Ordinary vector algebra runs out of moves. The cross product exists only in
dimensions three and seven (the seven-dimensional one built from the octonions),
is not associative, and in three dimensions returns a vector that flips sign under
reflection; rotations need a separate object — a matrix or a quaternion — that
does not multiply with vectors. Geometric algebra replaces all of this with one
associative, invertible product on one type of element. Rotations, reflections
and the objects being rotated live in the same algebra, so composing them is
multiplication, and the formulae are the same in every dimension and signature.

## Intuition

Carry the picture of a complex number: multiplying by $re^{i\theta}$ scales and
rotates, because the product of two plane vectors records both how much they
align and how much they turn. The geometric product says this is not special to
the plane. For unit vectors $a$ and $b$ separated by angle $\theta$ in a plane
with unit bivector $B$,

$$
ab = \cos\theta + B\sin\theta = e^{B\theta},
$$

so any two vectors generate their own "complex numbers" in the plane they span.
The scalar part is the familiar dot product; the bivector part is the oriented
area the cross product was standing in for, kept as the plane itself rather than
as a normal vector.

The analogy breaks in two places. A general multivector is a sum of grades and
is not a rotation of anything; and the algebra is noncommutative and has zero
divisors, so "number-like" must not be read as "field-like".

## Concrete example

Work in $\mathcal{G}_2$ with orthonormal $e_1, e_2$, so $e_1^2 = e_2^2 = 1$ and
$e_1e_2 = -e_2e_1$. With $a = e_1 + e_2$ and $b = e_1$,

$$
ab = (e_1+e_2)e_1 = 1 - e_1e_2 ,
$$

a scalar part $a \cdot b = 1$ and a bivector part $a \wedge b = -e_1e_2$: unit
signed area, negatively oriented, as $\det[a\ b] = -1$ says.

Now rotate. Put $B = e_1e_2$, so $B^2 = e_1e_2e_1e_2 = -e_1e_1e_2e_2 = -1$. A
rotation by $\theta$ in that plane is the **rotor**
$R = e^{-B\theta/2} = \cos(\theta/2) - B\sin(\theta/2)$ acting by
$x \mapsto R\,x\,\tilde{R}$, the reverse $\tilde{R}$ flipping the order of each
product. For $\theta = \pi/2$, $R = \tfrac{1}{\sqrt{2}}(1 - e_1e_2)$ and

$$
R\,e_1\,\tilde{R} = \tfrac{1}{2}(1 - e_1e_2)\,e_1\,(1 + e_1e_2)
= \tfrac{1}{2}(e_1 + e_2)(1 + e_1e_2) = e_2 .
$$

The half-angle is not a convention: $R$ appears twice, once on each side.

## Formal treatment

Let $V$ be an $n$-dimensional real vector space and $Q : V \to \mathbb{R}$ a
quadratic form with polarisation $\langle a, b\rangle = \tfrac{1}{2}(Q(a+b) - Q(a) - Q(b))$.
The geometric algebra is the quotient of the tensor algebra

$$
\mathcal{G}(V,Q) \;=\; T(V) \big/ \big\langle\, v \otimes v - Q(v)\,1 \,\big\rangle ,
$$

with the universal property that any linear $f: V \to A$ into a unital
associative algebra with $f(v)^2 = Q(v)1_A$ extends uniquely to an algebra
homomorphism. As a vector space $\mathcal{G}(V,Q) \cong \Lambda V$, so
$\dim \mathcal{G} = 2^n$; the $\mathbb{Z}$-grading by blade degree is a grading of
vector spaces only, while the even/odd split is a genuine algebra grading. For
vectors, $a \cdot b = \langle a,b\rangle$, and $ab = a\cdot b + a\wedge b$ holds
**only** between grade-1 elements.

A vector with $Q(a) \neq 0$ is invertible, $a^{-1} = a/Q(a)$, and
$x \mapsto -a\,x\,a^{-1}$ is reflection in the hyperplane orthogonal to $a$. By
Cartan–Dieudonné every orthogonal transformation of a nondegenerate space is a
product of at most $n$ reflections, so every rotation is a product of an even
number of them — exactly the sandwich $x \mapsto R x \tilde{R}$ with $R$ a
product of unit vectors, an element of $\mathrm{Spin}(Q)$. Since $R$ and $-R$ act
identically, $\mathrm{Spin}$ double-covers $\mathrm{SO}$.

Writing $\mathcal{G}_{p,q}$ for signature $(p,q)$: the even subalgebra of
$\mathcal{G}_{2,0}$ is $\mathbb{C}$, that of $\mathcal{G}_{3,0}$ is $\mathbb{H}$
(under a sign choice such as $\mathbf{i} \mapsto -e_2e_3$), and
$\mathcal{G}_{3,0} \cong M_2(\mathbb{C})$. Every finite-dimensional real Clifford
algebra of a _nondegenerate_ form is a matrix algebra over $\mathbb{R}$,
$\mathbb{C}$ or $\mathbb{H}$, or a direct sum of two such (the split case
$p - q \equiv 1 \pmod 4$, as in $\mathcal{G}_{1,0} \cong \mathbb{R}\oplus\mathbb{R}$
and $\mathcal{G}_{0,3} \cong \mathbb{H}\oplus\mathbb{H}$), the pattern periodic in
$p-q$ mod 8 — the precise sense in which geometric algebra is not a new algebraic
structure.

## Assumptions and requirements

The construction needs a quadratic form. Drop $Q$ and only the exterior algebra
survives: no inverses, no rotors, no contraction. That is the structural cost —
the framework is metric-dependent by design and identifies vectors with covectors
through that metric.

Nondegeneracy of $Q$ underwrites most of the standard results: inverses for
non-null vectors, an invertible pseudoscalar (hence duality between grades $k$
and $n-k$), and Cartan–Dieudonné. The projective model uses a degenerate form
deliberately, and there duality must be rebuilt by other means.

The compact rules $e_ie_j = -e_je_i$ presuppose an _orthogonal_ basis, whose
existence is the diagonalisation theorem for symmetric bilinear forms
(Gram–Schmidt); that the resulting signature $(p,q)$ does not depend on the basis
chosen is Sylvester's law of inertia, and it matters — $\mathcal{G}_{1,3}$ and
$\mathcal{G}_{3,1}$ are not isomorphic, so a physics metric convention is a real
choice. Finiteness of $n$ underlies both $\dim = 2^n$ and the classification.

## Uses and applicability

Reach for it when reflections and rotations are the primary objects and you want
them composable and coordinate-free: rigid-body kinematics, attitude
representation, screw motions in robotics, geometric predicates in graphics. The
conformal model represents points of $\mathbb{R}^3$ as null vectors in a
five-dimensional algebra, where spheres, planes, circles and lines are all blades
and rigid motions act by the same sandwich — this is where the language buys most.
In physics, spacetime algebra rewrites Maxwell's four equations as one and treats
the Dirac equation without matrices.

It is a poor fit when the surrounding tooling is matrix-based and translation
costs more than the notation gains; when dimension is large, because $2^n$
components is not a compact representation; and when the structure you need is
metric-free, where differential forms are the right tool.

## Limitations and common mistakes

The most common technical error is applying $ab = a \cdot b + a \wedge b$ to
anything other than two vectors. For a vector and a bivector the product splits
into grade-lowering and grade-raising parts; for general multivectors there is no
two-term split at all, and the competing definitions of "the inner product" (left
contraction, Hestenes' dot, the fat dot) disagree on grade-0 arguments.

The second is expecting division. $\mathcal{G}_{3,0}$ has zero divisors —
$(1+e_1)(1-e_1) = 0$ — so a general multivector has no inverse, even in Euclidean
signature. The third is assuming every $k$-vector is a blade: true for
$n \leq 3$, false from dimension 4, where $e_1e_2 + e_3e_4$ is the wedge of no
two vectors.

Then there are the claims made _for_ the subject, which should be separated from
the mathematics. That geometric algebra unifies complex numbers, quaternions,
vector algebra and the exterior algebra is a fact, though in different senses:
$\mathbb{C}$ and $\mathbb{H}$ are the even subalgebras of $\mathcal{G}_{2,0}$ and
$\mathcal{G}_{3,0}$, the dot and cross products are recovered from the geometric
product on grade-1 elements, and the exterior algebra appears as the associated
graded algebra — an isomorphism of graded vector spaces, not a subalgebra and not
a quotient. That it is a better way to _teach_ or _think about_ geometry is an
argument its advocates make, and it is not settled; there is no substantial
controlled evidence for the pedagogical claims, and the advocacy literature is
noticeably more confident than the mathematical one. Nor does the framework
yield theorems unavailable classically — it is a reformulation, as the
classification above shows. Adoption reflects that: Clifford algebra is standard
in index theory, spin geometry and representation theory without the
geometric-algebra framing, while the framing has real but limited uptake in
graphics, robotics and a physics subcommunity. Watch the name, too — "geometric
algebra" is also a historiographical term for reading Euclid's Book II
algebraically.

## Variants and alternatives

Named members of the family: **spacetime algebra**, $\mathcal{G}_{1,3}$, for
relativity; **conformal geometric algebra**, which embeds $\mathbb{R}^n$ as a
null cone in signature $(n+1,1)$ and makes translations rotations; **projective
geometric algebra**, whose degenerate signature lets elements at infinity behave
sensibly; and **geometric calculus**, which extends a single vector derivative to
multivector fields.

The competing languages are the real alternatives. Matrices plus quaternions
remain the industry default for 3D, with unbeatable tooling. Differential forms
with the exterior derivative and Hodge star give the same grade structure without
committing to a metric, which is why they dominate geometry and gauge theory. Lie
groups and [Lie Algebras](./lie-algebras.md), with $\mathfrak{se}(3)$ and screw
theory, cover rigid motions in the language numerical optimisation already
speaks. In machine learning the established route to building geometry into a
model is group equivariance, though Clifford-algebra-based equivariant
architectures are an active recent line.

## History and attribution

Three threads converge. Hamilton found the quaternions in 1843; Grassmann's
_Ausdehnungslehre_ of 1844 introduced the outer product; and in 1878 William
Kingdon Clifford combined the two into algebras he himself called geometric
algebras, dying the following year with the programme barely started.
Mathematics kept the algebras and dropped the name: Cartan's spinors,
Chevalley's algebraic treatment, and the Atiyah–Bott–Shapiro link to K-theory
periodicity built Clifford algebra into modern geometry.

The revival as a _language_ is due to David Hestenes, whose _Space-Time Algebra_
(1966) rewrote Dirac theory without matrices and whose later work argued for
geometric algebra as a unified formalism for physics and its teaching. The
conformal model dates from around the turn of the 2000s; the projective model has
been pushed more recently, largely by the graphics community.

## Sources

MathWorld carries the algebraic statements — the quotient construction, the
grading, the isomorphisms with $\mathbb{C}$ and $\mathbb{H}$, the attribution to
Clifford and Grassmann. MIT 18.02 is the source for the dot and cross products
and the oriented-area reading the geometric product replaces; MIT 18.06 for
orthogonal bases and signature, which the assumptions rest on. The Geometric Deep
Learning text is cited only for group equivariance being the established way
geometry enters neural architectures. The Hestenes programme and the conformal
and projective models are unresolved references; the registry covers neither.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) first, with inner products and quadratic
forms; nothing here makes sense without a bilinear form to square vectors
against. [Complex Numbers](./complex-numbers.md) supplies the picture the
geometric product generalises.

From here the rotor story leads into [Group Theory](./group-theory.md) through
the spin groups and their double cover of the rotation groups, and into
[Lie Algebras](./lie-algebras.md), where bivectors are the generators of rotation
and the exponential map is the one used above.
[Representation Theory](./representation-theory.md) is where Clifford algebras
earn their mainstream standing, as the source of spinor representations, and
[Tensors](./tensors.md) gives the tensor algebra the defining quotient starts
from.
