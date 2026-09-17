---
concept_id: concept.geometry.curvature
title: Curvature
slug: /concepts/curvature
aliases:
  - Gaussian curvature
  - Riemann curvature tensor
kind: concept
tier: 1
review_state: generated-draft
summary: The family of local invariants measuring how far a curve, surface or Riemannian manifold departs from the flat model — a single number for a plane curve, a pair for a surface, and a four-index tensor whose evaluation on 2-planes gives the sectional curvature and whose successive traces give the Ricci and scalar curvature in higher dimensions.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.linear_algebra.tensors
    note: The Riemann curvature tensor is a multilinear object, sectional curvature is its evaluation on a 2-plane and Ricci and scalar curvature are contractions of it, so a reader who cannot read index notation or take a trace cannot follow the higher-dimensional half of this page.
  - type: assumes
    target: concept.geometry.manifolds
    note: Beyond curves and surfaces in space, curvature is defined only on a smooth manifold carrying a metric; charts, tangent spaces and tensor fields are the setting the definition lives in, not a consequence of it.
  - type: contributes_to
    target: concept.geometry.differential_geometry
    note: Curvature is the central local invariant differential geometry computes, and most of its theorems relate curvature to geodesics, volume or topology.
  - type: contributes_to
    target: concept.geometry.non_euclidean_geometry
    note: The sign of the constant curvature is what quantitatively separates the model geometries — positive for spherical, zero for Euclidean, negative for hyperbolic.
sources:
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.nicolaescu.geometry_of_manifolds
    title: Lectures on the Geometry of Manifolds
    url: https://academicweb.nd.edu/~lnicolae/Lectures.pdf
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.riemann1854.bases_of_geometry
    title: On the Hypotheses which lie at the Bases of Geometry
    url: https://www.maths.tcd.ie/pub/HistMath/People/Riemann/Geom/WKCGeom.html
    source_kind: primary-research
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.li2018.loss_landscape
    title: Visualizing the Loss Landscape of Neural Nets
    url: https://arxiv.org/abs/1712.09913
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: General relativity — the Einstein field equations, and Ricci-flat but non-flat solutions such as Schwarzschild
    reason: The registry holds no source on general relativity or Lorentzian geometry, so the physical interpretation of the Ricci and Weyl parts is stated from general knowledge rather than from a cited text.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
  - label: Information geometry — the Fisher information metric and natural gradient
    reason: No registry source covers information geometry, so the claim that a statistical model carries a genuinely curved Riemannian metric is flagged rather than attached to an optimisation or deep learning source that does not contain it.
    sections:
      - limitations-and-common-mistakes
  - label: Curvature without smoothness — Alexandrov and CAT(k) comparison bounds, and Ollivier and Forman Ricci curvature on graphs
    reason: The registry has no metric-geometry or discrete-curvature source; these are named as existing alternatives only, with no claim beyond their existence and the quantity each generalises.
    sections:
      - variants-and-alternatives
  - label: Ricci flow and the geometrization of three-manifolds
    reason: Mentioned in one sentence as the most consequential modern use of Ricci curvature; this page's four cited sources do not cover it, and the claim rests on general knowledge.
    sections:
      - uses-and-applicability
  - label: Pre-Riemannian history — Huygens and the osculating circle, Euler on principal curvatures, Gauss's 1827 memoir and his geodetic survey, Bonnet's boundary term, Chern's intrinsic proof
    reason: The registry holds no history-of-mathematics source covering these, and MIT 18.950 is cited for the mathematics of curves and surfaces, not for its attribution.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Curvature** is the local invariant measuring the rate at which a geometric
object bends away from the flat model of its own dimension. For a plane curve it
is one signed number at each point: the turning rate of the unit tangent per unit
arc length, the reciprocal of the osculating circle's radius. For a surface in
$\mathbb{R}^3$ it is the pair of principal curvatures $\kappa_1, \kappa_2$ and
the symmetric functions built from them, the Gaussian curvature
$K = \kappa_1 \kappa_2$ and the mean curvature $H = (\kappa_1 + \kappa_2)/2$. For
a Riemannian manifold of any dimension it is the Riemann curvature tensor,
recording the failure of covariant derivatives to commute, with its contractions.

Cutting across that hierarchy is the distinction the subject turns on.
**Extrinsic** curvature describes how an object sits inside an ambient space and
is visible only from outside. **Intrinsic** curvature is measurable by an
inhabitant who can only measure lengths and angles within the object itself.

## Why it matters

Curvature is an obstruction with consequences you can hold in your hand. It is
what stops a sphere from being flattened onto a plane without stretching, which
is why every world map must choose a distortion to accept, and why a flat sheet
of paper rolls into a cylinder but never into a dome.

It is also the bridge from local measurement to global conclusion. Gauss–Bonnet
integrates a purely local quantity over a closed surface and returns a topological
invariant, so an insect confined to the surface could determine, by intrinsic
measurements alone — surveying $K$ over the whole surface and integrating — that
it lives on a torus rather than a sphere. Riemann's 1854
lecture drew the conclusion that made curvature central to physics: the metric
relations of physical space are not given a priori but are an empirical question,
to be settled by measurement rather than by axiom. Sixty years later general
relativity made that concrete, writing gravitation as the curvature of spacetime.

## Intuition

The picture to carry is parallel transport. Carry a vector around the boundary of
a small region, keeping it as parallel as the surface allows. On a plane nothing
happens; on a sphere it comes back rotated. The rotation angle divided by the
enclosed area tends to the Gaussian curvature as the loop shrinks: curvature is
holonomy per unit area, measurable without ever leaving the surface.

Equivalently, curvature is a comparison of circles. A geodesic circle of radius
$r$ has circumference $2\pi r \left(1 - K r^2/6 + O(r^4)\right)$, so positive
curvature means small circles are shorter than Euclid predicts and negative
curvature means they are longer.

The analogy that misleads is "curvature is how bent it looks". That is extrinsic
intuition, and a cylinder refutes it: obviously bent in space, perfectly flat to
anything living on it. The intuition breaks a second time at dimension three,
where a space is not curved by one amount but differently in different
two-dimensional directions.

## Concrete example

Take the ellipse $x = 3\cos t$, $y = 2\sin t$. With
$\kappa = |x'y'' - y'x''| / ((x')^2 + (y')^2)^{3/2}$ the numerator is constantly
$6$, so $\kappa(t) = 6 / (9\sin^2 t + 4\cos^2 t)^{3/2}$. At the end of the major
axis $\kappa = 6/8 = 0.75$, an osculating circle of radius $4/3$; at the end of
the minor axis $\kappa = 6/27 \approx 0.222$, radius $4.5$.

Now two surfaces. A cylinder of radius $2$ has principal curvatures $1/2$ and
$0$, so $K = 0$ and $H = 1/4$. A sphere of radius $2$ has both principal
curvatures $1/2$, so $K = 1/4$ and $H = 1/2$. They agree on one principal
curvature and disagree on $K$ — and it is $K$, not $H$, that an inhabitant can
measure, which is why a cylinder cuts and unrolls flat with no distortion and a
sphere does not.

Finally the global statement. For that sphere,
$\int_M K \, dA = \tfrac14 \cdot 16\pi = 4\pi = 2\pi \chi$ with $\chi(S^2) = 2$.
For a torus $\chi = 0$, so the total curvature is exactly zero: the positive
curvature of the outer rim and the negative curvature of the inner hole cancel
exactly, however the torus is shaped.

## Formal treatment

**Curves.** For a regular unit-speed curve $\gamma : I \to \mathbb{R}^3$ with
tangent $T = \gamma'$, the curvature is $\kappa = |T'| \ge 0$. Where $\kappa > 0$
set $N = T'/\kappa$ and $B = T \times N$; the Frenet–Serret equations
$T' = \kappa N$, $N' = -\kappa T + \tau B$, $B' = -\tau N$ define the torsion
$\tau$, and $\kappa$ with $\tau$ determine the curve up to a rigid motion.

**Surfaces.** Let $S \subset \mathbb{R}^3$ be regular with unit normal field $N$.
The shape operator $\mathcal{S}_p = -dN_p : T_pS \to T_pS$ is self-adjoint for
the induced inner product; its eigenvalues are the principal curvatures, and

$$
K = \det \mathcal{S}_p = \kappa_1 \kappa_2,
\qquad
H = \tfrac12 \operatorname{tr} \mathcal{S}_p = \tfrac12 (\kappa_1 + \kappa_2).
$$

The **Theorema Egregium** states that $K$ is a function of the first fundamental
form $g_{ij}$ and its first and second derivatives alone. Hence $K$ is preserved
by every local isometry, while $H$ is not; $H$ also flips sign when the normal is
reversed, and $K$ does not.

**Gauss–Bonnet.** For a compact oriented Riemannian $2$-manifold $M$ with
piecewise-smooth boundary, geodesic curvature $\kappa_g$ along the boundary and
exterior angles $\theta_i$ at the corners,

$$
\int_M K \, dA \;+\; \int_{\partial M} \kappa_g \, ds \;+\; \sum_i \theta_i
\;=\; 2\pi \chi(M),
$$

with $\chi$ the Euler characteristic. Closed $M$ gives
$\int_M K\,dA = 2\pi\chi(M)$; a geodesic triangle gives
$\int K\,dA = \alpha + \beta + \gamma - \pi$.

**Higher dimensions.** On a Riemannian manifold $(M,g)$ with Levi-Civita
connection $\nabla$ — the unique torsion-free metric-compatible connection — the
Riemann tensor is

$$
R(X,Y)Z = \nabla_X \nabla_Y Z - \nabla_Y \nabla_X Z - \nabla_{[X,Y]} Z .
$$

Its symmetries leave $n^2(n^2-1)/12$ independent components: one in dimension
two, six in three, twenty in four. Three derived quantities follow. The
**sectional curvature** of the plane $\sigma \subset T_pM$ spanned by orthonormal
$u,v$ is
$K(\sigma) = g(R(u,v)v, u)$; it generalises Gaussian curvature and loses nothing,
since $\sigma \mapsto K(\sigma)$ determines $R_p$. The **Ricci curvature** is the
first trace: for an orthonormal frame with $e_1 = u$,
$\operatorname{Ric}(u,u) = \sum_{i=2}^{n} K(\operatorname{span}(u,e_i))$, a sum
over the planes containing $u$, controlling how a bundle of geodesics leaving $p$
in direction $u$ focuses. The **scalar curvature** $S = g^{ij} R_{ij}$ is the
second trace, one number per point, fixed by the volume of small geodesic balls:

$$
\frac{\operatorname{vol} B_r(p)}{\operatorname{vol} B_r^{\text{eucl}}}
= 1 - \frac{S(p)}{6(n+2)} r^2 + O(r^4).
$$

Each trace discards information. For $n \ge 4$ the Riemann tensor splits into a
part built from $\operatorname{Ric}$ and $S$ plus a trace-free **Weyl** tensor
invisible to both; for $n = 3$ the Weyl tensor vanishes identically so
$\operatorname{Ric}$ determines $R$; for $n = 2$ everything reduces to $S = 2K$.

## Assumptions and requirements

Curvature requires two derivatives. A $C^1$ curve has a tangent but no curvature,
and at a cusp, where $\gamma' = 0$, the definition fails outright. A polyhedron
has no curvature in the smooth sense: it is concentrated at the vertices as angle
defect and zero everywhere else.

For a manifold, curvature is a property of a connection, not of the underlying
smooth structure. A bare smooth manifold has no curvature; a metric buys the
Levi-Civita connection, and it is that choice — torsion-free and
metric-compatible — that makes "the" curvature well defined. Change the metric
and the curvature changes; drop the torsion-free requirement and a second tensor
appears alongside it.

The Frenet frame needs $\kappa > 0$ to define $N$, so torsion is undefined along
a straight segment. Gauss–Bonnet needs compactness, orientability, and corners
with well-defined exterior angles. Sign conventions for $R$ differ between texts,
which is a real hazard when combining two sources' formulas.

## Uses and applicability

Reach for curvature whenever deviation from flat is itself the quantity of
interest: cartography, the mechanics of plates and shells, geodesic navigation,
surface design. In Riemannian geometry, curvature bounds are the standard
hypothesis of comparison theorems, which turn a local inequality into a global
statement about diameter, volume or topology. Its most consequential modern use
is Ricci flow, the evolution $\partial_t g = -2\operatorname{Ric}$ behind the
proof of the geometrization conjecture for three-manifolds.

In machine learning it appears in two unrelated roles. Hyperbolic embedding
spaces exploit negative curvature because ball volume grows exponentially with
radius there, which suits tree-like data. Separately, the second-order behaviour
of a loss function is routinely called "curvature", the language Li et al. use
when visualising loss surfaces and relating sharpness to generalisation.

Do not reach for it when the object is not smooth, when only topology is wanted,
or when the ambient embedding is arbitrary — extrinsic curvature of an embedding
chosen for convenience tells you about your choice.

## Limitations and common mistakes

The first mistake is conflating intrinsic and extrinsic. A cylinder is
intrinsically flat; "looks curved" is not a geometric statement, and $H$ falls on
the extrinsic side.

The second is expecting one number in higher dimensions. Ricci-flat does not mean
flat: the Schwarzschild solution has $\operatorname{Ric} = 0$ everywhere outside
the source and is emphatically curved, all the information sitting in the Weyl
tensor. Nor does curvature determine a metric; only in the constant-curvature
case does a curvature value pin the geometry down locally.

The third concerns the deep learning analogy. The Hessian $\nabla^2 L(\theta)$ is
not the Riemann tensor of anything. Parameter space is flat $\mathbb{R}^p$; the
Hessian is second-fundamental-form data for the graph of $L$ in
$\mathbb{R}^{p+1}$, an extrinsic object tied to a particular parametrisation, and
away from critical points it does not even transform as a tensor. This has teeth:
Li et al. note that the weight-scaling invariances of a rectified network let you
rescale apparent sharpness without changing the function computed, and they
introduce filter-wise normalisation so that loss-surface plots can be compared at
all. Sharpness is a coordinate-dependent diagnostic, not an invariant. The
genuinely Riemannian construction on a statistical model is the Fisher
information metric, a different object from the loss Hessian and the reason
natural-gradient methods are not simply Newton's method.

A fourth is over-generalising Gauss–Bonnet. It relates curvature to $\chi$ in
even dimensions only; closed odd-dimensional manifolds have $\chi = 0$ and the
theorem says nothing.

## Variants and alternatives

Within surface theory, **mean curvature** is the extrinsic counterpart of $K$,
governing minimal surfaces and soap films, where $H = 0$. **Normal** and
**geodesic curvature** split the curvature of a curve on a surface into the part
forced by the surface and the part due to the curve's own turning, and **torsion**
is the curve invariant orthogonal to curvature entirely.

In the Riemannian setting, sectional curvature and the two successive traces of
$R$ — Ricci and scalar curvature — form a ladder, each of the last two cheaper
and weaker than the one before, with the **Weyl** tensor as the conformally
invariant remainder. More generally, curvature belongs to any
connection on a vector bundle, given by $F = d\omega + \omega \wedge \omega$; the
Levi-Civita case is one instance and the same formula is a gauge field strength.

Where smoothness fails there are substitutes. Angle defect at a vertex is the
discrete Gaussian curvature, and the defects of a convex polyhedron sum to
$2\pi\chi$; Alexandrov and CAT(k) comparison bounds work in metric spaces with no
differentiable structure; Ollivier and Forman Ricci curvature carry the Ricci
idea to graphs. Each buys rough objects at the price of the tensor.

## History and attribution

Curvature of a plane curve as the reciprocal of the osculating circle's radius
dates from seventeenth-century work on evolutes, and Euler introduced the
principal curvatures of a surface in the eighteenth. The decisive step is Gauss's
memoir on curved surfaces of 1827, which defines $K$, proves it intrinsic — the
result he called _egregium_, remarkable — and proves the local Gauss–Bonnet
theorem for geodesic triangles; Bonnet supplied the boundary term in the
following decades. The work grew out of Gauss's geodetic survey, where how a
curved Earth's measurements relate to a flat map was an entirely practical
question.

Riemann's habilitation lecture of 1854, _On the Hypotheses which lie at the Bases
of Geometry_, extended curvature to $n$ dimensions, introduced the idea of a
manifold carrying a metric, and argued that which geometry physical space has is
a question for measurement rather than philosophy. The tensor calculus that made
his curvature computable was assembled later by Christoffel, Ricci and
Levi-Civita, the Ricci contraction being named for the second of them. Chern gave
an intrinsic proof of the generalised Gauss–Bonnet theorem in the 1940s.

## Sources

MIT 18.950 is the classical curves-and-surfaces course, covering the shape
operator, the Theorema Egregium and Gauss–Bonnet; it is the reference for the
concrete half of this page. Nicolaescu's notes carry the same ideas to arbitrary
dimension: the Levi-Civita connection, the Riemann tensor and its symmetries, and
the derived curvatures. Riemann's 1854 lecture is the primary document for the
$n$-dimensional notion and for the claim that the geometry of space is empirical;
written for a general faculty, it contains almost no formulas. Li et al. is cited
only for the loss-landscape material.

## Prerequisites and next connections

You need [Multivariable Calculus](./multivariable-calculus.md) for the
derivatives and [Tensors](./tensors.md) for the higher-dimensional half, since
Ricci and scalar curvature are traces. Curves and surfaces in $\mathbb{R}^3$ need
no more than calculus, so a reader can go a long way before meeting a manifold.

From here, [Euclidean Geometry](./euclidean-geometry.md) is the zero-curvature
case, [Spherical Geometry](./spherical-geometry.md) the constant-positive one and
[Hyperbolic Geometry](./hyperbolic-geometry.md) the constant-negative one;
[Non-Euclidean Geometry](./non-euclidean-geometry.md) holds the three together,
and curvature turns their axiomatic differences into a number.
[Manifolds](./manifolds.md) supplies the setting for the higher-dimensional
theory, and [Differential Geometry](./differential-geometry.md) is the subject
that grows out of the local invariants sketched here.
