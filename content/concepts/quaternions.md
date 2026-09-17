---
concept_id: concept.algebra.quaternions
title: Quaternions
slug: /concepts/quaternions
aliases:
  - Hamilton's quaternions
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The four-dimensional real division algebra whose multiplication is associative but not commutative, and whose unit elements act on three-dimensional space by conjugation to cover the rotation group exactly twice.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: generalizes
    target: concept.algebra.complex_numbers
    note: Every unit imaginary quaternion squares to minus one and spans a subalgebra isomorphic to C, so H contains a whole sphere of complex planes and extends conjugation, modulus and the exponential form to four dimensions at the price of commutativity.
  - type: specializes
    target: concept.algebra.clifford_algebra
    note: H is isomorphic to the Clifford algebra of a two-dimensional negative-definite space and to the even subalgebra of the Clifford algebra of Euclidean three-space, so quaternion conjugation is the three-dimensional instance of the general rotor construction.
  - type: contrasts_with
    target: concept.algebra.octonions
    note: The next Cayley-Dickson doubling buys four more dimensions but loses associativity, which is exactly what makes quaternions the largest normed real algebra whose elements can still be composed like matrices.
  - type: used_to_solve
    target: concept.geometry.euclidean_geometry
    note: Unit quaternions parameterize the orientation-preserving isometries of Euclidean three-space that fix a point, and do so with no coordinate singularity, which is the standard way rotations are stored and composed.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.hatcher.algebraic_topology
    title: Allen Hatcher, Algebraic Topology
    url: https://pi.math.cornell.edu/~hatcher/AT/ATpage.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-17
unresolved_references:
  - label: Quaternion practice in graphics, robotics and attitude estimation
    reason: The page states the spherical-linear-interpolation formula and its sign-selection step, the Hamilton-versus-JPL multiplication convention, the kinematic equation relating a quaternion derivative to angular velocity, and the operation counts that decide when to convert a quaternion to a matrix; docs/source-registry.json holds no computer-graphics, robotics or attitude-estimation source and no page in this corpus covers those fields, so those statements are cited to nothing.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

The **quaternions** $\mathbb{H}$ are the real vector space with basis
$1, i, j, k$, made into an algebra by the single relation

$$
i^2 = j^2 = k^2 = ijk = -1 .
$$

Everything else follows. Multiplying $ijk = -1$ on the right by $k$ gives
$ij = k$, and the same manipulation gives $jk = i$, $ki = j$, together with
$ji = -k$, $kj = -i$, $ik = -j$. So the product is **associative** but
**not commutative**: swapping two distinct imaginary units flips the sign.

For $q = a + bi + cj + dk$ with $a,b,c,d \in \mathbb{R}$, write the conjugate
$\bar q = a - bi - cj - dk$ and the norm $\lVert q \rVert^2 = q\bar q = a^2+b^2+c^2+d^2$.
Every nonzero $q$ has the inverse $\bar q / \lVert q \rVert^2$, so $\mathbb{H}$
is a **division ring** — a [ring](./ring-theory.md) in which division works, but
whose multiplication is noncommutative, so it is not a
[field](./field-theory.md).

## Why it matters

Three-dimensional rotations are the reason most people meet quaternions. A
rotation has three degrees of freedom, but Euler angles, yaw-pitch-roll and every
other three-angle scheme have configurations where two axes line up, a degree of
freedom disappears, and the parameterization stops being invertible. That is
gimbal lock, a defect of the coordinates rather than of rotation. The obstruction
is more general: $SO(3)$ is compact, so no three-number parameterization can be
globally nonsingular — though away from the Euler family the defect takes other
forms, such as the sign ambiguity of axis-angle vectors at a rotation by $\pi$.
Unit quaternions use four numbers with one constraint and have no singular
configuration anywhere; they also compose by a single algebraic product,
renormalize cheaply, and interpolate along geodesics.

The second reason is structural. Frobenius proved that $\mathbb{R}$,
$\mathbb{C}$ and $\mathbb{H}$ are the _only_ finite-dimensional associative
division algebras over $\mathbb{R}$. Quaternions are not one construction among
many; they are the end of a very short list.

## Intuition

Carry two pictures. Algebraically, $\mathbb{H}$ is $\mathbb{C}$ with more square
roots of $-1$: every unit imaginary quaternion $u = bi+cj+dk$ with
$b^2+c^2+d^2=1$ satisfies $u^2=-1$, so each spans a copy of the
[complex numbers](./complex-numbers.md), and there is a whole sphere of them.
Euler's formula survives verbatim, $e^{\alpha u} = \cos\alpha + u\sin\alpha$.
Where the analogy breaks: two such planes do not commute with each other.

Geometrically, the unit quaternions are the 3-sphere $S^3$ in $\mathbb{R}^4$,
and multiplication makes that sphere a group. It sits over the rotation group
$SO(3)$ two-to-one: each rotation has exactly two quaternions, $q$ and $-q$.
Going once around a loop of rotations can return you to the starting rotation
but to the _opposite_ quaternion — the sphere is one continuous sheet, the
rotation group is that sheet with antipodes glued.

## Concrete example

Rotate the $x$-axis by $90^\circ$ about the $z$-axis. Identify $\mathbb{R}^3$
with the imaginary quaternions, so the vector is $v = i$ and the axis is $k$.
The quaternion uses the **half** angle:
$q = \cos 45^\circ + k\sin 45^\circ = \tfrac{\sqrt2}{2}(1+k)$. Then

$$
qv\bar q = \tfrac{\sqrt2}{2}(1+k)\,i\,\tfrac{\sqrt2}{2}(1-k)
= \tfrac12 (i + j)(1-k) = \tfrac12 (i + j + j - i) = j ,
$$

using $ki = j$, $ik = -j$ and $jk = i$. The $x$-axis went to the $y$-axis.

Now compose. Let $p = \tfrac{\sqrt2}{2}(1+i)$, a $90^\circ$ rotation about the
$x$-axis. Then $pq = \tfrac12(1 + i - j + k)$ while
$qp = \tfrac12(1 + i + j + k)$ — the same scalar part $\tfrac12 = \cos 60^\circ$,
so both are $120^\circ$ rotations, but about the axes $(1,-1,1)/\sqrt3$ and
$(1,1,1)/\sqrt3$ respectively. Applying the first to $i$ gives
$(pq)\,i\,\overline{(pq)} = k$: rotate about $z$ first, then about $x$, and the
$x$-axis lands on the $z$-axis. The rightmost factor acts first, exactly as with
matrices.

## Formal treatment

Let $\operatorname{Im}\mathbb{H} = \{bi+cj+dk\}$, identified with $\mathbb{R}^3$.
For pure quaternions $u,v$ the product splits into the two familiar
[vector-calculus](./vector-calculus.md) operations,

$$
uv = -\,u\cdot v \;+\; u\times v .
$$

For a unit quaternion $q$, define $\rho_q(v) = qv\bar q$ (note $\bar q = q^{-1}$
when $\lVert q\rVert = 1$). Then $\rho_q$ maps $\operatorname{Im}\mathbb{H}$ to
itself, preserves the norm since $\lVert q v \bar q\rVert = \lVert v\rVert$, and
has determinant $+1$ by connectedness of $S^3$, so $\rho_q \in SO(3)$. Writing
$q = \cos(\theta/2) + u\sin(\theta/2)$ for a unit $u \in \operatorname{Im}\mathbb{H}$,
the map $\rho_q$ is the right-handed rotation by $\theta$ about $u$. The half
angle is forced: $\rho_q$ is quadratic in $q$, so the angle doubles.

Because $\rho_{pq} = \rho_p \circ \rho_q$, the map $\rho: S^3 \to SO(3)$ is a
group homomorphism ([group theory](./group-theory.md) supplies the vocabulary).
It is surjective, and its kernel is $\{\pm 1\}$, so

$$
SO(3) \;\cong\; S^3/\{\pm 1\} \;\cong\; \mathbb{RP}^3 .
$$

This is a genuine two-sheeted covering. Since $S^3$ is simply connected,
$\pi_1(SO(3)) \cong \mathbb{Z}/2$, and there is no continuous choice of
quaternion representative over all of $SO(3)$: a global section would lift the
identity map through the cover, which the lifting criterion forbids. The unit
quaternions are therefore $\mathrm{Spin}(3)$, and the same group appears in
[matrix](./matrix-theory.md) form as
$SU(2) = \left\{\begin{pmatrix} \alpha & \beta \\ -\bar\beta & \bar\alpha\end{pmatrix} : |\alpha|^2+|\beta|^2 = 1\right\}$,
which is where [representation theory](./representation-theory.md) picks the
story up.

Expanding $\rho_q$ in coordinates with $q = w + xi + yj + zk$ gives the rotation
matrix

$$
R(q) = \begin{bmatrix}
1-2(y^2+z^2) & 2(xy-wz) & 2(xz+wy)\\
2(xy+wz) & 1-2(x^2+z^2) & 2(yz-wx)\\
2(xz-wy) & 2(yz+wx) & 1-2(x^2+y^2)
\end{bmatrix}.
$$

Every entry is quadratic, which is the algebraic reason $R(q) = R(-q)$.

## Assumptions and requirements

The rotation story needs $\lVert q \rVert = 1$. For a general nonzero $q$ the map
$v \mapsto qvq^{-1}$ is still a rotation, but $v \mapsto qv\bar q$ scales by
$\lVert q\rVert^2$; the two agree only on the unit sphere, and code that skips
renormalization silently drifts into a scaled rotation.

The vector must be a _pure_ quaternion: conjugation preserves the real part, so a
nonzero scalar component rides through untouched and is not part of the geometry.

Associativity is what makes $\rho_{pq} = \rho_p\rho_q$ true, and it is exactly
what the octonions give up. The identification with $\mathbb{R}^3$ also fixes a
handedness: $ij=k$, $jk=i$, $ki=j$ encode a right-handed frame, and a left-handed
convention reverses every cross product on the page. Frobenius's classification
assumes associativity and finite dimension over $\mathbb{R}$; drop either and
other algebras appear.

## Uses and applicability

Reach for quaternions whenever orientations must be _stored, composed,
integrated or interpolated_. Attitude filters integrate the kinematic relation
between the quaternion derivative and the angular velocity, which stays smooth at
every orientation; animation systems interpolate keyframe orientations along
great circles of $S^3$; learned models that must output a rotation often regress
a four-vector and normalize it. Quaternions are also the cheapest thing to
compose repeatedly: a quaternion product costs 16 multiplications and 12
additions against 27 and 18 for a $3\times 3$ matrix product, and restoring the
constraint means dividing by a norm rather than re-orthonormalizing nine entries.

Do not reach for them when the job is _applying_ one rotation to many vectors.
A matrix-vector product is three dot products; conjugation is two quaternion
multiplications. Convert once and use the matrix. They also do not extend to
scaling, shear or translation — those need a matrix or dual quaternions — and
they say nothing about
rotations in dimensions other than three and four, where a Clifford-algebra
formulation is the right generalization.

## Limitations and common mistakes

**Thinking $qv$ rotates $v$.** Left multiplication by a unit quaternion is a
rotation of $\mathbb{R}^4$, not of $\mathbb{R}^3$; it does not preserve the pure
quaternions. Rotation is conjugation, $qv\bar q$, and the sandwich is not
decoration.

**Treating $q$ and $-q$ as different rotations.** They are the same element of
$SO(3)$. Averaging quaternions componentwise, or training a network with the loss
$\lVert q - \hat q\rVert^2$, punishes a correct answer that happened to arrive
with the opposite sign. Use $\min(\lVert q-\hat q\rVert, \lVert q+\hat q\rVert)$,
or the sign-invariant $|\langle q, \hat q\rangle|$. The angle between two
rotations is $2\arccos|\langle q_1,q_2\rangle|$ — the absolute value is the
double cover showing up in a distance function.

**Forgetting the sign choice in interpolation.** Spherical linear interpolation
between $q_0$ and $q_1$ follows the great circle between them, but if
$\langle q_0,q_1\rangle < 0$ that circle takes the long way round, so
implementations negate $q_1$ first. The topology is telling you that "between"
two rotations is not single-valued.

**Assuming one convention.** The Hamilton convention above ($ij = k$) is standard
in mathematics and graphics; the JPL convention used in parts of aerospace defines
the product so that composition order reverses. Mixing libraries that disagree
gives rotations correct individually and wrong in sequence. Storage order is a
separate trap: $(w,x,y,z)$ and $(x,y,z,w)$ are both common.

**Believing gimbal lock is impossible in principle.** Quaternions avoid it
because four parameters cover $SO(3)$ smoothly, not because the problem was
illusory. Convert to Euler angles and the singularity returns intact.

## Variants and alternatives

**Rotation matrices**: nine numbers and six constraints, cheapest to apply, most
expensive to keep orthonormal. **Euler angles**: three numbers, readable by
humans, singular somewhere. **Axis-angle vectors** — exponential coordinates on
the Lie algebra $\mathfrak{so}(3)$, the subject of
[Lie algebras](./lie-algebras.md) — are the natural minimal parameterization for
optimization in a tangent space, and are ambiguous at a rotation by $\pi$.
**Dual quaternions** extend the construction to rigid motions. **Geometric and
Clifford algebras** generalize the sandwich product to any dimension and
signature, with quaternions as the even part of the three-dimensional Euclidean
case. **Octonions** are the next Cayley-Dickson doubling: still a normed division
algebra, no longer associative.

## History and attribution

William Rowan Hamilton had spent years trying to multiply triples of numbers the
way complex numbers multiply pairs, with no success, because no such
three-dimensional algebra exists. On 16 October 1843, walking along the Royal
Canal in Dublin, he saw that a fourth dimension and the loss of commutativity
solved it, and carved $i^2=j^2=k^2=ijk=-1$ into Brougham Bridge. Priority is
genuinely layered: Olinde Rodrigues had published the composition law for
rotations in 1840 in a form equivalent to quaternion multiplication without
identifying the algebra, and an unpublished note of Gauss from around 1819
contains the same rule. Frobenius proved the classification of real associative
division algebras in 1878.

Quaternions then lost the argument. In the 1880s Gibbs and Heaviside split the
quaternion product into separate dot and cross products and built vector
analysis, which was easier to teach and sufficient for physics; quaternions
receded to a curiosity for most of a century, returning in the 1980s through
computer graphics and spacecraft attitude control — for the practical reasons in
this page rather than the algebraic ones Hamilton cared about.

## Sources

**Wolfram MathWorld** is the quickest check on the multiplication table, the
conjugate and norm identities, the quaternion-to-matrix formula, the
Cayley-Dickson construction and the standard account of Hamilton's 1843
discovery. **MIT 18.701 Algebra I** supplies the algebraic setting: rings and
division rings, group homomorphisms and kernels, the symmetry groups of
Euclidean space, and the relation between $SU(2)$ and the rotation group.
**Hatcher's Algebraic Topology** is the reference for the covering-space facts
used here — that $S^3 \to SO(3) \cong \mathbb{RP}^3$ is a two-sheeted cover,
that $\pi_1(\mathbb{RP}^3) \cong \mathbb{Z}/2$, and that the lifting criterion
rules out a continuous global choice of sign.

## Prerequisites and next connections

Read [Complex Numbers](./complex-numbers.md) first: conjugation, modulus and the
exponential form all reappear here almost unchanged, and knowing what is lost
(commutativity, and any ordering) is half the point. A little
[group theory](./group-theory.md) — homomorphism, kernel, quotient — makes the
two-to-one cover a sentence rather than a mystery, and
[ring theory](./ring-theory.md) supplies the word _division ring_.

From here, three directions open. Clifford and geometric algebra explain why the
sandwich $qv\bar q$ works and how to write it in any dimension; the octonions show
what the next doubling costs; and
[representation theory](./representation-theory.md) turns $SU(2)$ and its
two-to-one map onto $SO(3)$ into the general apparatus of spin, where a rotation
by $2\pi$ returning $-1$ stops being an inconvenience and becomes physics.
