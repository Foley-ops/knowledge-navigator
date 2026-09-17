---
concept_id: concept.geometry.euclidean_geometry
title: Euclidean Geometry
slug: /concepts/euclidean-geometry
kind: concept
tier: 1
review_state: generated-draft
summary: The geometry of flat space — the one model among several in which parallels stay parallel, triangle angles sum to a straight angle, and figures can be scaled without distortion.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: The modern presentation is $\mathbb{R}^n$ with an inner product, so distance, angle and the isometry group are all defined on top of the linear structure and cannot be stated before it.
  - type: contrasts_with
    target: concept.geometry.non_euclidean_geometry
    note: The two agree on Euclid's first four postulates and differ on the fifth; the existence of models of the negation is what proved the fifth independent rather than false.
  - type: specializes
    target: concept.analysis.hilbert_spaces
    note: $\mathbb{R}^n$ with the standard dot product is a finite-dimensional Hilbert space, and orthogonality, the Pythagorean identity and orthogonal projection are the same theorems in both settings.
  - type: contributes_to
    target: concept.algebra.clifford_algebra
    note: The Clifford construction takes a vector space with a quadratic form as input, and the Euclidean form $Q(x) = \lVert x \rVert^2$ is the case whose even subalgebra encodes Euclidean rotations.
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
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.joyce.euclid_elements
    title: Euclid's Elements (D. E. Joyce edition)
    url: https://mathcs.clarku.edu/~djoyce/elements/elements.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.beeson.proof_checking_euclid
    title: Proof-checking Euclid
    url: https://arxiv.org/abs/1710.00787
    source_kind: preprint
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.plato.nineteenth_century_geometry
    title: 'Stanford Encyclopedia of Philosophy: Nineteenth Century Geometry'
    url: https://plato.stanford.edu/entries/geometry-19th/
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Tarski's first-order axiomatisation of elementary Euclidean geometry and its decidability
    reason: No registry source covers the first-order theory of elementary geometry or the decision procedure for it, so the completeness and decidability claim is stated without support.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Euclidean geometry** is the geometry of flat space: the theory of points,
lines, planes, distance and angle in which exactly one parallel passes through a
point off a given line. It has two standard presentations. The **synthetic** one
is Euclid's — undefined points and lines, five postulates, everything else
proved. The **analytic** one is Descartes' — the set $\mathbb{R}^n$ with the
inner product $\langle x, y \rangle = \sum_{i=1}^n x_i y_i$, from which length,
angle and congruence are defined outright. The second is a model of the first,
and once the axioms are stated carefully enough it is the _only_ model up to
isomorphism: coordinates are not an approximation to Euclid, they are Euclid.

## Why it matters

Euclidean geometry is the default background of applied mathematics. Least
squares, principal component analysis, $k$-means and every kernel method built on
a Hilbert space measure with $\lVert \cdot \rVert_2$ and inherit its geometry:
orthogonality, projection, the Pythagorean identity. Rigid-body motion in
robotics and graphics is the special Euclidean group
$SE(n) = \mathbb{R}^n \rtimes SO(n)$, the orientation-preserving half of the
Euclidean isometry group.

Its second contribution is methodological. The _Elements_ is the prototype of the
axiomatic method, and the two-thousand-year failure to derive its fifth postulate
from the other four taught mathematics what independence means: you prove a
statement unprovable by building a structure where the other axioms hold and it
fails. That move is now standard in logic, set theory and
[model theory](./model-theory.md), and it started here.

## Intuition

Flatness — plus a consequence of flatness that is easy to miss: Euclidean
geometry has **no absolute unit of length**. Scale a triangle by $100$ and you
get a different triangle with the same angles. On a sphere or in the hyperbolic
plane you cannot: angles determine a triangle completely, so size is a fact about
a shape and "similar but not congruent" is an empty category. A drawing being to
scale only makes sense because space is flat.

The picture is an infinite drafting table where parallel rails stay a fixed
distance apart forever. The analogy fails where flatness does: on the Earth's
surface, where the available straight lines are great circles that always meet,
and in general relativity, where spacetime is curved by mass.

## Concrete example

Take $A = (0,0)$, $B = (4,0)$, $C = (4,3)$ in the plane. Then
$\lvert AB \rvert = 4$, $\lvert BC \rvert = 3$ and
$\lvert CA \rvert = \sqrt{16 + 9} = 5$ — a right triangle satisfying
$3^2 + 4^2 = 5^2$. The angle at $A$ comes from the inner product:
$\cos \alpha = \langle (4,0), (4,3) \rangle / (4 \cdot 5) = 16/20 = 0.8$, so
$\alpha \approx 36.87^\circ$. With the right angle at $B$ and
$\gamma \approx 53.13^\circ$ at $C$, the three sum to exactly $180^\circ$. Double
every coordinate: $(0,0), (8,0), (8,6)$ has the same three angles and every side
twice as long — similar, not congruent.

Now the unit sphere. The triangle with vertices at the north pole $(0,0,1)$ and
the equatorial points $(1,0,0)$ and $(0,1,0)$, joined by great-circle arcs, has
**three** right angles: its angles sum to $270^\circ$. Flatness is not
decorative; it is carrying $90^\circ$ of the answer.

## Formal treatment

Euclid's postulates, in substance: (1) a segment joins any two points; (2) a
segment extends indefinitely to a line; (3) a circle exists with any centre and
radius; (4) all right angles are equal; (5) if a line crossing two lines makes
interior angles on one side summing to less than two right angles, those two
lines meet on that side. Playfair's axiom — through a point off a line there is
exactly one parallel — is equivalent to (5) **given the other four**, and that
proviso matters.

Analytically, put $\lVert x \rVert = \sqrt{\langle x, x\rangle}$ and
$d(x,y) = \lVert x - y \rVert$. Cauchy–Schwarz,
$\lvert \langle x,y\rangle \rvert \le \lVert x \rVert \lVert y \rVert$, gives the
triangle inequality and makes

$$
\theta = \arccos \frac{\langle x, y \rangle}{\lVert x \rVert \, \lVert y \rVert}
$$

well defined. Orthogonality is $\langle x,y\rangle = 0$, and expanding
$\lVert x+y \rVert^2 = \lVert x \rVert^2 + 2\langle x,y\rangle + \lVert y \rVert^2$
gives Pythagoras in one line. A norm comes from an inner product if and only if
it satisfies the parallelogram law

$$
\lVert x+y \rVert^2 + \lVert x-y \rVert^2 = 2\lVert x \rVert^2 + 2\lVert y \rVert^2
$$

(Jordan and von Neumann), so that identity is the precise test for whether a
geometry is Euclidean.

Congruence is an orbit relation. Every distance-preserving bijection of
$\mathbb{R}^n$ is $x \mapsto Qx + b$ with $Q \in O(n)$, so the isometry group is
$E(n) = \mathbb{R}^n \rtimes O(n)$, whose planar elements are translations,
rotations, reflections and glide reflections. Figures are congruent when an
isometry carries one to the other, similar when some
$x \mapsto \lambda Q x + b$, $\lambda > 0$, does. This is Klein's Erlangen view:
a geometry is the invariant theory of a [group](./group-theory.md) acting on a
space, and Euclidean geometry is the theory of $E(n)$-invariants.

Euclid's own deductions have gaps. Proposition I.1 builds an equilateral triangle
on $AB$ from two circles of radius $\lvert AB \rvert$ — and no postulate says
those circles meet. Over the rationals with $A=(0,0)$, $B=(1,0)$, the
intersection points $(1/2, \pm\sqrt{3}/2)$ are not in $\mathbb{Q}^2$: the
rational plane satisfies the postulates as literally stated while the
construction fails in it, so a continuity axiom is required. Euclid also uses
betweenness facts he never states (Pasch's axiom: a line entering a triangle
through one side leaves through another) and proves side-angle-side congruence by
sliding one triangle onto another, a motion his postulates do not license.
Hilbert's _Grundlagen der Geometrie_ repairs this with about twenty axioms in
five groups — incidence, order, congruence, parallels, continuity — SAS among
them. Birkhoff's alternative assumes the reals up front and needs only four
postulates, about a ruler and a protractor.

## Assumptions and requirements

Three assumptions carry the theory. **Flatness** is the parallel postulate; in
differential-geometric terms it says the Gaussian curvature is identically zero,
and dropping it leaves absolute (neutral) geometry, in which Euclid's
Propositions I.1–I.28 still hold but the angle sum theorem does not.
**Continuity** — Dedekind completeness, or the weaker circle–circle intersection
principle — makes constructions land on existing points; the rational plane shows
what is lost without it, and it is the completeness that underwrites
[real analysis](./real-analysis.md). **Positive-definiteness** makes
$\langle x,x\rangle = 0$ force $x = 0$; relax it to a non-degenerate indefinite
form and you get Minkowski geometry, where non-zero vectors can have zero length.

The negation of the fifth postulate splits asymmetrically. More than one parallel
gives hyperbolic geometry, a genuine model of the first four postulates. No
parallels gives spherical or elliptic geometry — which also contradicts postulate
(2), since great circles have finite length, and contradicts the uniqueness of
the line through two points that postulate (1) is read as asserting, since on the
sphere antipodal points lie on infinitely many great circles. It breaks the
betweenness (order) axioms too, for a separate reason: great circles are closed,
so of two points there are two joining arcs and no point on a line is
unambiguously between two others. Spherical geometry is not "Euclid minus the
fifth".

## Uses and applicability

Reach for it when the domain is a bounded, flat-enough patch of space and the
operations that matter are rigid motions and scaling: CAD, computer graphics,
structural engineering, photogrammetry, classical mechanics. Reach for it in data
analysis whenever squared error is the right loss, since minimising
$\lVert y - \hat{y} \rVert_2^2$ is orthogonal projection onto a subspace and the
normal equations assert perpendicularity.

Do not reach for it for long-range navigation and geodesy, where the flat
approximation accumulates real error; for spacetime, where the form is
indefinite; or for tree-like data, where hyperbolic embeddings are used precisely
because trees cannot be embedded in $\mathbb{R}^n$ with low distortion at any
fixed dimension. In high dimension, Euclidean distances between independent
random points concentrate around a common value — not wrong, but far less
informative than the picture suggests.

## Limitations and common mistakes

The largest misconception is that Euclidean geometry is the true geometry of
physical space. It is one model among several, and general relativity says the
space we live in is not it. Non-Euclidean geometry did not show Euclid _wrong_;
it showed his fifth postulate **independent** of the other four, so that it and
its negation both yield consistent theories.

The second is that Euclid proved the _Elements_ from the postulates. He proved a
great deal, but with unstated appeals to continuity, betweenness and rigid
motion. The size of the shortfall is now measurable: a machine-checked
reconstruction of Book I needed 235 theorems to carry Euclid's 48 propositions,
the surplus being foundational preliminaries, steps he used implicitly and the
extra results required to close his gaps. Reading Euclid as a fully formal system
is a nineteenth-century achievement, not a third-century-BCE one.

A third is arithmetic: assuming any metric on $\mathbb{R}^n$ is Euclidean. The
$\ell_1$ metric has no inner product behind it — take $x = (1,0)$, $y = (0,1)$
and the parallelogram law reads $4 + 4 = 8$ against $2 + 2 = 4$ — and so carries
no consistent notion of angle. The matching error in machine learning is treating
cosine similarity and Euclidean distance as interchangeable: for unit vectors
$\lVert x - y\rVert^2 = 2 - 2\cos\theta$ makes them equivalent orderings, but for
unnormalised vectors they can rank pairs differently.

Finally, constructibility is narrower than it looks. Compass and straightedge
cannot trisect a general angle or double the cube — proved by Wantzel with
[field theory](./field-theory.md), not geometry, because the constructible
numbers form a tower of quadratic extensions and $\sqrt[3]{2}$ has degree $3$.

## Variants and alternatives

**Absolute (neutral) geometry** keeps only the first four postulates and is the
common ground with hyperbolic geometry. **Hyperbolic** and **spherical/elliptic**
geometry are the constant-curvature alternatives, negative and positive.
**Riemannian geometry** subsumes all three: Euclidean space is the flat
Riemannian manifold, and every Riemannian manifold is Euclidean to first order at
each point. **Affine geometry** drops the metric and keeps parallelism;
**projective geometry** drops parallelism by adding points at infinity;
**Minkowski geometry** drops positive-definiteness.

Among axiomatisations, Hilbert's is the classical repair, Birkhoff's is shorter
because it assumes $\mathbb{R}$, and Tarski's first-order theory of elementary
Euclidean geometry is complete and decidable — a sharp contrast with arithmetic,
possible only because "elementary" excludes quantification over sets of points.
Algebraically, quaternions and Clifford or geometric algebra re-encode rotations
and reflections without coordinates, buying composability and numerical stability
at the cost of an unfamiliar formalism.

## History and attribution

Euclid compiled the _Elements_ in Alexandria around 300 BCE, organising and
proving results already known — the Pythagorean relation was used in Babylonian
and Chinese mathematics centuries earlier, and the theory of proportion is
Eudoxus' — so the contribution is the deductive architecture, not the theorems.

The fifth postulate looked like a theorem in disguise from the start. Proclus
questioned it in late antiquity; Omar Khayyam and Nasir al-Din al-Tusi attacked
it; Saccheri in 1733 derived long chains of consequences from its denial hoping
for a contradiction and found none. Lobachevsky (around 1829) and Bolyai (1832)
published the resulting geometry as a geometry rather than a failure, Gauss
having reached similar conclusions privately, and Beltrami in 1868 gave the first
model, establishing that hyperbolic geometry is consistent if Euclidean geometry
is. Klein's Erlangen program of 1872 recast geometries as invariant theories of
groups; Pasch in 1882 identified the missing betweenness assumptions; Hilbert's
_Grundlagen der Geometrie_ of 1899 supplied the axioms that made Euclid's
reasoning formally complete. Birkhoff's metric axioms followed in 1932, Tarski's
first-order treatment in the decades after.

## Sources

Joyce's edition of the _Elements_ is the primary text: the postulates and common
notions as Euclid states them, with commentary that marks where Proposition I.1
asserts a point of intersection nothing has licensed and says what postulate
would be needed to supply it. _Proof-checking Euclid_ is that repair carried
through by machine — Book I redone in a first-order language close to Tarski's,
with Euclid's gaps filled and his errors corrected — and is the source for how
much had to be added. Wolfram MathWorld is the quickest reference for Playfair's
axiom, Hilbert's and Birkhoff's axiom groups and the construction results.
Axler's _Linear Algebra Done Right_ is the clean source for the inner-product
side — Cauchy–Schwarz, the Pythagorean identity, orthogonal projection and the
parallelogram law, all with the positive-definiteness hypothesis visible. MIT
18.701 covers the orthogonal group and the classification of plane isometries,
the group picture of congruence. MIT 18.950 supplies the curvature framing that
makes "Euclidean geometry is the flat case" a definition rather than a slogan.
For the history, the MacTutor archive carries Saccheri, Lobachevsky, Bolyai and
Beltrami, and the Stanford Encyclopedia's _Nineteenth Century Geometry_ covers
the same century from the foundational side: Pasch's betweenness axioms, Klein's
Erlangen program and Hilbert's _Grundlagen_.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) first: the analytic presentation is a
vector space plus an inner product, and none of the formal treatment parses
without it. Completeness, from [Real Analysis](./real-analysis.md), explains why
a continuity axiom is needed at all.

From here the next steps are the geometries that drop the parallel postulate —
hyperbolic and spherical — and the Riemannian setting containing all of them.
[Hilbert Spaces](./hilbert-spaces.md) carry the same orthogonality and projection
arguments into infinite dimension; [Group Theory](./group-theory.md) is where the
Erlangen view lives; and [Galois Theory](./galois-theory.md) is where the
straightedge-and-compass impossibility results are actually proved.
