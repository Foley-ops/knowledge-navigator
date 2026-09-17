---
concept_id: concept.geometry.spherical_geometry
title: Spherical Geometry
slug: /concepts/spherical-geometry
aliases:
  - spherical trigonometry
  - double elliptic geometry
kind: concept
tier: 1
review_state: generated-draft
summary: The geometry of a sphere's surface, where straight lines are great circles, no two lines are parallel, and a triangle's angles exceed a straight angle by exactly its area divided by the squared radius.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: specializes
    target: concept.geometry.non_euclidean_geometry
    note: It is the constant positive curvature member of the family of geometries obtained by changing the sign of the curvature away from zero.
  - type: contrasts_with
    target: concept.geometry.euclidean_geometry
    note: Both are two-dimensional geometries of constant curvature, but on the sphere lines are closed and finite, parallels do not exist, and angle sums exceed pi.
  - type: contrasts_with
    target: concept.geometry.hyperbolic_geometry
    note: The two are mirror images across zero curvature — excess versus defect, no parallels versus infinitely many, finite total area versus infinite.
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
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - intuition
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
  - source_id: source.cohen2018.spherical_cnns
    title: Spherical CNNs
    url: https://arxiv.org/abs/1801.10130
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary history of spherical trigonometry and of the term "elliptic geometry"
    reason: No registry source covers Menelaus, Girard, Harriot, Riemann's 1854 lecture or Klein's naming; the attributions given are standard but uncited here.
    sections:
      - history-and-attribution
  - label: Ellipsoidal geodesy (Vincenty's and Karney's algorithms, WGS-84 error magnitudes)
    reason: The registry has no geodesy reference, so the size of the sphere-versus-ellipsoid discrepancy is stated as an order of magnitude only.
    sections:
      - assumptions-and-requirements
      - variants-and-alternatives
claims: []
---

## Definition

**Spherical geometry** is the intrinsic geometry of the round sphere
$S^2_R = \{x \in \mathbb{R}^3 : \lVert x \rVert = R\}$ under the distance
measured _along the surface_. Its "straight lines" are the **great circles** —
the intersections of the sphere with planes through its centre — because these
are the geodesics. Everything else follows from that one choice: a great circle
is closed, of finite length $2\pi R$; any two distinct great circles meet in a
pair of antipodal points, so there are no parallels at all; and the surface has
constant Gaussian curvature $K = 1/R^2$.

## Why it matters

It is the first non-Euclidean geometry anyone actually uses, mostly without
noticing. Every long-haul flight path, every conversion between celestial
coordinate systems, and every distance computed from a pair of
latitude–longitude values is a spherical-trigonometry problem. It is also the
most accessible place to watch the parallel postulate fail: a concrete surface,
embedded in ordinary space, on which it plainly does. That is not a proof that
the postulate is independent of Euclid's others, since the sphere breaks his
second postulate and the order axioms as well — independence is what the
hyperbolic models of Beltrami, Klein and Poincaré established. And it
is where curvature first becomes measurable from inside — measure a triangle's
three angles, and the excess over $\pi$ gives its area without leaving the
surface.

## Intuition

Stretch a rubber band between two points on a globe and let it pull taut: it
settles onto the great circle. That is why the flight from London to Tokyo goes
over the Arctic even though the Mercator map makes the route look like a detour
— the map is lying, not the aircraft.

The picture to carry for curvature is a triangle's angles. On a plane they sum
to $\pi$ whatever the size. On a sphere they always sum to more, and the surplus
grows with area, so _there are no similar triangles_: you cannot scale a figure
up and keep its shape. Size is absolute, and the radius is the yardstick. The
flat-map analogy breaks precisely here — any chart of a spherical region must
distort angles or areas, and care does not remove the distortion.

## Concrete example

Take the triangle with one vertex at the north pole and two on the equator a
quarter turn apart. All three angles are right angles, so the sum is $3\pi/2$ and
the excess is $\pi/2$; the predicted area $R^2 \cdot \pi/2$ matches the octant
the triangle actually is, $4\pi R^2 / 8$.

Now a real distance. Take $R = 6371$ km, and the points
$\phi_1 = 40.6413^\circ\,\mathrm{N}, \lambda_1 = 73.7781^\circ\,\mathrm{W}$ (JFK)
and $\phi_2 = 51.4700^\circ\,\mathrm{N}, \lambda_2 = 0.4543^\circ\,\mathrm{W}$
(Heathrow). The triangle with the pole as third vertex has sides equal to the
two colatitudes, $49.3587^\circ$ and $38.5300^\circ$, and included angle
$\Delta\lambda = 73.3238^\circ$. The spherical law of cosines gives

$$
\cos \Delta\sigma = \sin\phi_1 \sin\phi_2 + \cos\phi_1 \cos\phi_2 \cos \Delta\lambda
= 0.645157 ,
$$

so $\Delta\sigma = 0.869567$ rad $= 49.8225^\circ$ and the surface distance is
$R\,\Delta\sigma = 5540.0$ km. The chord straight through the Earth is
$2R\sin(\Delta\sigma/2) = 5367.1$ km, 173 km shorter and not flyable.

## Formal treatment

Let side lengths $a, b, c$ denote the _central angles_ subtended by the sides (so
arc length is $R$ times the angle), and let $A, B, C$ be the interior angles at
the opposite vertices. For a spherical triangle whose sides and angles all lie in
$(0, \pi)$:

$$
\cos c = \cos a \cos b + \sin a \sin b \cos C ,
\qquad
\frac{\sin a}{\sin A} = \frac{\sin b}{\sin B} = \frac{\sin c}{\sin C} .
$$

There is a dual law of cosines for the angles,
$\cos C = -\cos A \cos B + \sin A \sin B \cos c$, which has no Euclidean
counterpart: it solves for a side from three angles, which is the formal reason
AAA is a congruence criterion on the sphere.

**Girard's theorem.** The excess $E = A + B + C - \pi$ satisfies

$$
\operatorname{area} = R^2 E .
$$

The proof is a counting argument: a lune of angle $\alpha$ has area
$2\alpha R^2$, and the three great circles carrying the sides cut the sphere into
six lunes covering the triangle and its antipodal copy three times each and the
rest once, giving $2(2A + 2B + 2C)R^2 = 4\pi R^2 + 4\,\mathrm{area}$.
Equivalently it is Gauss–Bonnet,
$\int_T K \, dA + \sum_i (\pi - \theta_i) = 2\pi$, with $K$ constant.

Expanding the law of cosines for small $a, b, c$ recovers
$c^2 = a^2 + b^2 - 2ab\cos C$ to leading order: Euclidean geometry is the
$R \to \infty$ limit, not a separate subject.

**The elliptic plane.** The sphere is _not_ a model of elliptic geometry as it
stands. Two antipodal points lie on infinitely many great circles, so "two points
determine a line" fails, and two lines meet twice rather than once. Quotienting
by the fixed-point-free isometry $x \mapsto -x$ gives the real projective plane
$\mathbb{RP}^2$ — a two-sheeted covering $S^2 \to \mathbb{RP}^2$ — which inherits
the metric and in which two distinct points do determine a unique line and two
lines meet exactly once. That quotient, non-orientable and of area $2\pi R^2$, is
the elliptic plane; the sphere itself is sometimes called _double elliptic_.

## Assumptions and requirements

The results above assume a perfect sphere of fixed radius $R$ and distances
measured along the surface. Three hypotheses do real work. Sides must be minor
arcs with all sides and angles in $(0, \pi)$; a "triangle" taking the long way
round breaks Girard's formula. The two points must not be antipodal for the
geodesic to be unique — the distance $\pi R$ is still defined, the minimiser is
not. And the arguments of the trigonometric formulae are angles in radians,
never kilometres.

Dropping the constant-radius assumption is what geodesy does. The Earth is an
oblate spheroid, and geodesic distances on the WGS-84 ellipsoid differ from
mean-radius great-circle distances by a few tenths of a percent — tens of
kilometres on an intercontinental route. Negligible for a map tile, fatal for a
survey.

## Uses and applicability

Reach for it whenever data lives on directions rather than positions: navigation,
geodetic surveying (where the spherical excess is subtracted from measured angles
before closing a traverse — a triangle enclosing $5 \times 10^5$ km$^2$ on Earth
has an excess of about 42 arcminutes), positional astronomy, crystallographic
pole figures, and global atmospheric grids whose cells are spherical polygons.

In machine learning it appears wherever vectors are $\ell_2$-normalised: unit
embeddings live on $S^{d-1}$, and the angular distance $\arccos\langle u, v
\rangle$ is exactly the great-circle distance. It appears explicitly in
rotation-equivariant architectures — spherical CNNs define correlation on $S^2$
and $\mathrm{SO}(3)$ rather than the plane, because projecting a spherical
signal onto a plane destroys the symmetry. Do not reach for it when the domain
is flat at the scale in question, or when precision on a real planet matters
more than closed-form simplicity.

## Limitations and common mistakes

The four mistakes that recur:

**"The sphere is elliptic geometry."** Only after antipodal identification, as
above. Stated of the sphere itself, two of the incidence axioms are false.

**"Spherical geometry is Euclid minus the parallel postulate."** Negating the
parallel postulate while keeping Euclid's other axioms yields _hyperbolic_
geometry, because those axioms force lines to be unbounded and force a point to
separate a line into two rays. On the sphere lines are closed curves of length
$2\pi R$ and a point separates nothing, so the order axioms must go too, not
merely the fifth postulate.

**Flat formulae on spherical coordinates.** Treating $(\phi, \lambda)$ as
Cartesian and applying Pythagoras is wrong by a factor of $\cos\phi$ in the
longitude direction, which is $0.5$ at $60^\circ$ latitude and $0$ at the pole.

**Numerically naive great-circle distance.** The $\arccos$ form is
ill-conditioned for nearby points, where $\cos\Delta\sigma$ is flat near $1$: at
a true separation of $1$ m on Earth, double precision returns about $1.005$ m,
and at $0.1$ m it returns $0.095$ m. The haversine form,
$\Delta\sigma = 2\arcsin\sqrt{\sin^2(\Delta\phi/2) + \cos\phi_1\cos\phi_2
\sin^2(\Delta\lambda/2)}$, is accurate there, though it degrades in turn for
near-antipodal pairs; an $\operatorname{atan2}$ formulation is well conditioned
across the whole range.

A subtler trap: cosine _distance_ $1 - \cos\theta$ is not a metric. Three unit
vectors at $0^\circ, 60^\circ, 120^\circ$ in a plane give $0.5 + 0.5 < 1.5$,
violating the triangle inequality. The angle $\theta$ itself, and the chord
$2\sin(\theta/2)$, are metrics.

## Variants and alternatives

The immediate neighbours are the **elliptic plane** $\mathbb{RP}^2$ (the sphere
quotiented, where the incidence axioms are clean) and **hyperbolic geometry**
($K < 0$, angle _defect_ proportional to area, infinitely many parallels). The
**$n$-sphere** generalises the construction; $S^3$ carries a group structure
related to the unit quaternions, and a spherical simplex is rigid in every
dimension — its dihedral angles determine it up to isometry, so its volume is
always a function of those angles — but only in even dimensions does that
function reduce to a rational linear combination of the angles of its faces, as
Girard's theorem does in dimension two. The tetrahedron in $S^3$ is the first
case with no such elementary closed form, needing the Schläfli differential
formula and dilogarithms instead.

For drawing the sphere on paper, the **gnomonic** projection sends great circles
to straight lines, which is why it is the navigator's plotting chart;
**stereographic** projection is conformal and sends circles to circles, and is
the bridge to the Riemann sphere; **Mercator** straightens rhumb lines, not
geodesics. For real-Earth work the alternative is ellipsoidal geodesy —
Vincenty's iterative solution and Karney's algorithms — which buys millimetre
accuracy at the price of closed form.

## History and attribution

Spherical trigonometry is older than the plane trigonometry taught first today,
because astronomy needed it: Menelaus of Alexandria's _Sphaerica_, around
100 CE, is the earliest surviving treatment of the spherical triangle as an
object in its own right, and medieval Islamic astronomers — Abu al-Wafa,
al-Biruni, Nasir al-Din al-Tusi — developed it into a self-contained discipline.
The area–excess relation is credited to Thomas Harriot, who obtained it early in
the seventeenth century, and to Albert Girard, who published it shortly
afterwards; it carries Girard's name.

Treating the sphere as a _geometry_ rather than a surface inside Euclidean space
belongs to the nineteenth century: Riemann's 1854 habilitation lecture proposed
geometries of constant positive curvature, and Klein supplied the names
elliptic, parabolic and hyperbolic and the identification of the elliptic plane
with the projective plane. Note the ordering — people computed on the sphere for
eighteen centuries before anyone treated it as a rival to Euclid.

## Sources

MathWorld is the quickest correct reference for the trigonometric identities,
Girard's formula and the projections. MIT 18.950 supplies the
differential-geometric framing — geodesics, Gaussian curvature, Gauss–Bonnet —
that makes the excess formula an instance of a general theorem. Hatcher is cited
only for the topological fact that $S^2 \to \mathbb{RP}^2$ is a two-sheeted
covering; it says nothing about elliptic geometry. _Spherical CNNs_ is the
reference for the machine-learning use.

## Prerequisites and next connections

You need little: trigonometry, and enough
[Vector Calculus](./vector-calculus.md) to be comfortable with dot products and
the unit sphere in $\mathbb{R}^3$, since the law of cosines is a statement about
inner products of unit vectors. Familiarity with Euclid's postulates makes the
contrast legible but is not technically required.

From here, hyperbolic geometry is the same construction with the curvature sign
flipped, and the two together are the content of non-Euclidean geometry. The
isometry group is $\mathrm{O}(3)$, linking to
[Group Theory](./group-theory.md) and the rotation group $\mathrm{SO}(3)$;
stereographic projection turns the sphere into the Riemann sphere and hands it to
[Complex Analysis](./complex-analysis.md), where the conformal self-maps are the
Möbius transformations. Letting $K$ vary from point to point is the start of
Riemannian geometry.
