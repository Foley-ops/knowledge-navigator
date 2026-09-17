---
concept_id: concept.geometry.non_euclidean_geometry
title: Non-Euclidean Geometry
slug: /concepts/non-euclidean-geometry
kind: concept
tier: 1
review_state: generated-draft
summary: The family of geometries that deny the parallel postulate — hyperbolic, which keeps Euclid's other axioms, and elliptic, which also revises the order axioms and the second postulate — whose existence settled a two-thousand-year question by model construction rather than by proof.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: contrasts_with
    target: concept.geometry.euclidean_geometry
    note: Hyperbolic geometry keeps Euclid's remaining axioms and negates the parallel postulate; elliptic geometry additionally revises the order axioms and the second postulate, so either way the family is only intelligible against Euclidean geometry.
  - type: generalizes
    target: concept.geometry.hyperbolic_geometry
    note: Hyperbolic geometry is the case where a point off a line admits infinitely many non-intersecting lines; this page frames the family it belongs to.
  - type: generalizes
    target: concept.geometry.spherical_geometry
    note: The sphere, with antipodal points identified, realizes the elliptic case in which no parallels exist at all.
  - type: supported_by
    target: concept.foundations.model_theory
    note: The independence of the parallel postulate is a relative-consistency argument — an interpretation of one axiom system inside a model built from another.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
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
  - source_id: source.plato.model_theory
    title: 'Stanford Encyclopedia of Philosophy: Model Theory'
    url: https://plato.stanford.edu/entries/model-theory/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.plato.nineteenth_century_geometry
    title: 'Stanford Encyclopedia of Philosophy: Nineteenth Century Geometry'
    url: https://plato.stanford.edu/entries/geometry-19th/
    source_kind: authoritative-secondary
    supports:
      - history-and-attribution
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Tarski's completeness and decidability of elementary geometry
    reason: No registry source covers the first-order axiomatization of geometry or its decision procedure, so the claim is flagged rather than attached to a source that does not contain it.
    sections:
      - formal-treatment
  - label: Neutral-geometry axiomatics (Saccheri–Legendre, Legendre's theorem, the Archimedean axiom, the order axioms of an elliptic line, the reading of Euclid's second postulate)
    reason: The registry holds no text on the axiomatic foundations of geometry; MIT 18.950 is cited for this section's differential-geometric content only — constant curvature and the space-form classification — and covers none of the synthetic axiomatics, so those claims rest on general knowledge rather than on a cited source.
    sections:
      - definition
      - assumptions-and-requirements
claims: []
---

## Definition

**Non-Euclidean geometry** is the study of geometries satisfying Euclid's first
four postulates — repaired by modern axioms of incidence, order, congruence and
continuity — while denying the fifth, the parallel postulate. In Playfair's
equivalent form, through a point $P$ not on a line $\ell$ passes exactly one line
never meeting $\ell$. Denying that in either available direction gives the
classical cases: **hyperbolic geometry**, where at least two and hence infinitely
many such lines pass through $P$, and **elliptic geometry**, where there are none.
The second costs more than the fifth postulate alone: having no parallels also
forces you to abandon the infinite length of a line — the second postulate
survives only in the weaker reading that a line may always be produced further
(unbounded), not that it is infinite in extent — and, on the sphere, the
uniqueness of the line through two points, since antipodes are joined by
infinitely many great circles.

## Why it matters

Until the nineteenth century the fifth postulate was believed to be a theorem in
hiding, and generations tried to derive it from the other four; every attempt
failed or quietly assumed an equivalent. Non-Euclidean geometry ended the search
not by finding a proof but by exhibiting a structure in which the other axioms
hold and the fifth fails.

Three things follow. A method: independence shown by building a model, later the
template for the axiom of choice and the continuum hypothesis. A separation: which
geometry describes physical space became an empirical question, and Riemann's
extension to variable curvature supplied the language of general relativity. And a
toolkit, since the hyperbolic plane is the home of most Riemann surfaces and of
much of geometric group theory.

## Intuition

Carry three surfaces in your head — sphere, flat plane, saddle — with "straight
line" meaning geodesic. Great circles always intersect, so the sphere has no
parallels; a saddle runs away from itself in two directions, so many geodesics
through a nearby point diverge forever from a given one.

The diagnostic is the angle sum of a triangle: above $\pi$ where curvature is
positive, exactly $\pi$ where it is zero, below $\pi$ where it is negative. It is
intrinsic, measurable by a surveyor confined to the surface — the content of
Gauss's Theorema Egregium.

The analogy breaks in one place: an ordinary saddle has non-constant curvature,
and Hilbert proved in 1901 that no complete surface of constant negative curvature
is smoothly immersed in $\mathbb{R}^3$. Pseudospheres and crocheted hyperbolic
planes are locally honest, globally incomplete.

## Concrete example

**A spherical triangle.** On the unit sphere take the north pole and two equator
points a quarter-turn apart: three right angles, angle sum $3\pi/2$, excess
$\pi/2$. The triangle is one eighth of a sphere of area $4\pi$, so its area is
$\pi/2$ — excess equals area, as it must at curvature $1$.

**The Beltrami–Klein disc.** In the open unit disc $x^2 + y^2 < 1$, let the points
be the points and the open chords the lines. Take $\ell$ to be the horizontal
diameter and $P = (0, 0.5)$. A line through $P$ of slope $m$ crosses $y = 0$ at
$x = -0.5/m$, inside the disc only when $|m| > 0.5$, so every line through $P$
with $|m| < 0.5$ misses $\ell$ entirely: Playfair's axiom fails in a picture drawn
inside the Euclidean plane. The angles you see are not the model's — congruence
comes from a projective cross-ratio metric.

**An ideal triangle.** At curvature $-1$, a triangle with all three vertices at
infinity has three zero angles and area $\pi$ — a bound no hyperbolic triangle
reaches.

## Formal treatment

For a geodesic triangle $T$ with interior angles $\alpha, \beta, \gamma$ on a
surface of Gaussian curvature $K$, the Gauss–Bonnet theorem gives

$$
\alpha + \beta + \gamma - \pi \;=\; \iint_T K \, dA ,
$$

so at constant curvature the excess is $K \cdot \operatorname{Area}(T)$, and
$K > 0$, $K = 0$, $K < 0$ are the elliptic, Euclidean and hyperbolic cases. A
circle of radius $r$ has circumference $2\pi \sin r$ on the unit sphere, $2\pi r$
in the plane and $2\pi \sinh r$ in the hyperbolic plane of curvature $-1$, whose
exponential growth is its defining feature. Each model gives that plane an
explicit metric — on the Poincaré disc $\{|z| < 1\}$ it is
$ds^2 = 4(dx^2 + dy^2)/(1 - x^2 - y^2)^2$ — and all the models are isometric.

The independence argument is model-theoretic. Let $N$ be the neutral axioms —
everything but a parallel axiom — and $P$ Playfair's. Beltrami–Klein interprets
the primitives _point_, _line_, _between_ and _congruent_ by explicit Euclidean
objects, and under that reading every axiom of $N \cup \{\neg P\}$ becomes a
Euclidean theorem: if Euclidean geometry is consistent, so is hyperbolic geometry,
and $P$ is not derivable from $N$. The Euclidean plane models $N \cup \{P\}$, so
$\neg P$ is not derivable either. $P$ is independent of $N$ — a _relative_
consistency result. Hilbert's axioms use second-order continuity, so their
consistency reduces to that of the reals, while the first-order theory of
elementary geometry is complete and decidable — a result due to Tarski, stated
here without a cited source.

## Assumptions and requirements

Neutral geometry must be fixed first, and it needs continuity: the
Saccheri–Legendre theorem (angle sum at most $\pi$) and Legendre's theorem (if one
triangle has angle sum $\pi$, all do) both use the Archimedean axiom, without which
the trichotomy is not forced.

Elliptic geometry needs more surgery: the order axioms change, because on an
elliptic line no point separates two others, and the second postulate must be read
as "unbounded" rather than "infinite in length". Hyperbolic is the clean negation,
elliptic the awkward sibling.

Constant curvature is a further hypothesis: a general Riemannian manifold has
curvature varying point to point and no axiomatization of this kind. The complete,
simply connected constant-curvature manifolds are, up to scale, exactly $E^n$,
$S^n$ and $H^n$.

## Uses and applicability

Reach for it when the objects are homogeneous but not flat. Spherical geometry
runs navigation, geodesy and astronomy. Hyperbolic geometry is the working
geometry of complex analysis through the Poincaré metric and uniformization, of
Fuchsian and Kleinian groups, and of geometric group theory, where Gromov
hyperbolicity turns a coarse curvature condition into strong algebraic
consequences. The velocity space of special relativity is hyperbolic; general
relativity needs the variable-curvature generalization. In machine learning,
hyperbolic embeddings exploit the exponential volume growth of $H^n$ to embed
trees with low distortion — one case of learning on non-flat domains.

Do not reach for it when distances are small against the curvature radius: a
survey over a few kilometres, or a computation in a tangent space, is Euclidean to
within measurement error.

## Limitations and common mistakes

Non-Euclidean geometry did not show Euclid to be wrong. It showed one postulate
independent of the others; Euclidean geometry is as consistent after 1868 as
before.

Curved space need not be curved _inside_ anything. Curvature here is intrinsic,
and Hilbert's theorem makes an embedding of the complete hyperbolic plane in
$\mathbb{R}^3$ impossible rather than merely unnecessary.

The sphere is not quite elliptic geometry: the two differ by the identification of
antipodal points, and only after it do two points determine a unique line.

The Klein disc, the Poincaré disc, the half-plane and the hyperboloid are not four
geometries but four isometric models of one: Klein draws lines straight and
distorts angles, Poincaré preserves angles and bends lines into arcs.

In machine learning, "non-Euclidean data" usually means graphs or manifolds, not
hyperbolic or elliptic geometry in the axiomatic sense.

And hyperbolic geometry has no similarities: angle-angle-angle is a congruence
criterion, and curvature fixes an absolute unit of length, so planes of curvature
$-1$ and $-4$ are not isometric.

## Variants and alternatives

The classical branches are hyperbolic (Lobachevskian) and elliptic (Klein's term;
older sources call it Riemannian), the latter single on the projective plane and
double on the sphere. The standard models of the hyperbolic plane are Beltrami–Klein
(projective, geodesics straight), the Poincaré disc and half-plane (conformal,
suited to complex analysis and to the isometry group
$\mathrm{PSL}(2,\mathbb{R})$), and the hyperboloid model (a Lorentz form, suited to
computation).

Whole framings compete: the synthetic axiomatic approach buys logical clarity at
the cost of computational convenience; the metric-tensor approach buys variable
curvature and arbitrary dimension at the cost of the axiomatic footing; Klein's
Erlangen programme recasts a geometry as a group acting on a homogeneous space,
buying unification at the cost of the elementary picture. Riemannian geometry is
the eventual generalization, with constant curvature one case among many.

## History and attribution

Saccheri (1733) attempted a reductio, derived consequences of the acute-angle
hypothesis without reaching a contradiction, and rejected it anyway as repugnant
to the nature of the straight line; Lambert reached similar results in 1766. The
first genuine development belongs to three people independently: Gauss, who worked
it out privately and did not publish; Lobachevsky, who published from 1829 in
Kazan; and János Bolyai, whose _Appendix_ was in print by June 1831 and appeared
with his father's _Tentamen_ in 1832. Priority is genuinely contested —
Lobachevsky published first, Bolyai arrived independently and only learned of the
Kazan work in 1848, and Gauss had earlier unpublished results but declined to
defend them, replying to Farkas Bolyai that to praise the work would be to praise
himself, its content coinciding with meditations of his own of the previous thirty
to thirty-five years. None of the three proved consistency.

That came later: Beltrami (1868) gave the first models interpreting hyperbolic
geometry inside Euclidean geometry, Klein (1871) the projective metric on the
disc, and Poincaré in the 1880s the conformal models, while working on automorphic
functions. Riemann's 1854 lecture had introduced variable curvature and the
elliptic possibility, and Hilbert's _Grundlagen der Geometrie_ (1899) put the
axiomatics on a modern footing.

## Sources

Wolfram MathWorld is the quick reference for definitions, the standard models and
the historical outline. MIT 18.950 carries the curvature side — Gaussian
curvature, the Theorema Egregium, Gauss–Bonnet — where the angle-sum diagnostic
and the constant-curvature hypothesis come from; it is a course on curves and
surfaces and carries none of the axiomatics. The Stanford Encyclopedia entry on model theory covers what a model is
and what relative consistency establishes. The geometric deep learning paper is
cited only for learning on non-flat domains and the looser sense of
"non-Euclidean" used there.

The history is carried by the MacTutor archive — Saccheri's 1733 verdict, Lambert,
the three independent discoveries with their dates, Gauss's reply to Farkas
Bolyai, Bolyai's 1848 discovery of Lobachevsky's paper, Beltrami and Klein — and
by the Stanford Encyclopedia entry on nineteenth-century geometry, which also
carries Klein's projective metric, the elliptic case he found there, and the
Erlangen programme. Neither covers Tarski's completeness and decidability result
or the neutral-geometry axiomatics; both remain uncited and are listed as
unresolved references.

## Prerequisites and next connections

Read [Euclidean Geometry](./euclidean-geometry.md) first: the parallel postulate
only means something against the other four. [Model Theory](./model-theory.md)
supplies what a model is, and [First-Order Logic](./first-order-logic.md) the
derivability that independence denies.

From here the subject splits:
[Hyperbolic Geometry](./hyperbolic-geometry.md) treats the negatively curved case
and its models, [Spherical Geometry](./spherical-geometry.md) the positively
curved case. [Complex Analysis](./complex-analysis.md) is the next step for the
Poincaré models, where isometries are Möbius transformations, and
[Group Theory](./group-theory.md) for the Erlangen view.
