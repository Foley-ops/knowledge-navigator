---
concept_id: concept.geometry.differential_geometry
title: Differential Geometry
slug: /concepts/differential-geometry
kind: concept
tier: 1
review_state: generated-draft
summary: The study of smooth manifolds carrying a metric and a connection, which together make length, angle, parallel transport, geodesics and curvature computable from inside the space with no surrounding space to refer to.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.geometry.manifolds
    note: Every object on this page — tangent spaces, vector fields, differential forms — lives on a smooth manifold, so a reader without charts and tangent spaces cannot parse the first definition.
  - type: contrasts_with
    target: concept.geometry.differential_topology
    note: Differential topology studies what survives any smooth deformation, while differential geometry fixes a metric and studies precisely the local invariants that deformation destroys.
  - type: contributes_to
    target: concept.geometry.curvature
    note: The Riemann tensor is assembled from the Levi-Civita connection defined here, so this page supplies the machinery that curvature is measured with.
  - type: generalizes
    target: concept.geometry.spherical_geometry
    note: The round sphere is one Riemannian manifold, and its great circles and constant curvature fall out of the general geodesic equation and curvature tensor as a special case.
sources:
  - source_id: source.nicolaescu.geometry_of_manifolds
    title: Lectures on the Geometry of Manifolds
    url: https://academicweb.nd.edu/~lnicolae/Lectures.pdf
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.sjamaar.manifolds_and_differential_forms
    title: Manifolds and Differential Forms
    url: https://pi.math.cornell.edu/~sjamaar/manifolds/manifold.pdf
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - intuition
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.riemann1854.bases_of_geometry
    title: On the Hypotheses which lie at the Bases of Geometry
    url: https://www.maths.tcd.ie/pub/HistMath/People/Riemann/Geom/WKCGeom.html
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Amari's information geometry and the natural gradient
    reason: The identification of natural gradient descent with Riemannian gradient descent in the Fisher metric, and the dual pair of flat connections on a statistical manifold, come from information geometry; the registry has no information-geometry reference, and its nearest entries use the Fisher matrix or manifold structure without establishing either claim.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
claims: []
---

## Definition

**Differential geometry** studies smooth manifolds equipped with two structures a
bare manifold lacks. A **Riemannian metric** $g$ assigns to each point $p$ an
inner product $g_p$ on the tangent space $T_pM$, varying smoothly with $p$; it
measures lengths and angles at a point. An **affine
connection** $\nabla$ says how to differentiate one vector field along another,
and therefore how to carry a tangent vector along a curve. The metric alone
cannot do this: it compares vectors at one point and says nothing about how the
ruler at $p$ relates to the ruler at $q$. Curvature is what you get when you ask
whether that comparison depends on the route.

## Why it matters

Before Gauss and Riemann, a curved object was curved _in_ something: a surface
bent inside $\mathbb{R}^3$. Differential geometry made curvature intrinsic —
measurable by an inhabitant of the surface using only lengths of curves. That is
what lets general relativity describe gravity as curvature of spacetime rather
than a force in a flat background, and what lets an optimiser treat a space of
probability distributions as a curved space with its own straight lines. It also
supplies the calculus of forms that collapses the classical integral theorems of
vector calculus into one statement.

## Intuition

Carry a ruler and protractor at every point: that is the metric. Now carry a
gyroscope and walk. Its rule for keeping a direction "the same" as you move is
the connection, and **parallel transport** is that rule applied along a path. On
a flat plane it is path-independent: any loop returns the gyroscope pointing
where it started. On a sphere it is not, and the angular discrepancy
after a loop is curvature integrated over the enclosed region. A **geodesic** is
a path that transports its own velocity: you walk without turning.

The ant-on-a-surface picture breaks at one point. Parallel transport is not "hold
the arrow fixed in the surrounding space", because intrinsically there is none.
What is a _theorem_ for a surface in $\mathbb{R}^3$ — the Gauss formula — is
infinitesimal and about the derivative, not the transport: the induced
Levi-Civita connection is the tangential part of the ambient directional
derivative, $\nabla_X Y = (D_X Y)^{\top}$, so a vector field $V$ along a curve is
parallel when $(dV/dt)^{\top} = 0$. Transport is the solution of that ODE.
Holding the arrow fixed in $\mathbb{R}^3$ and projecting at the end is a
different operation, and around a closed loop it returns the vector unchanged; it
is the ODE, not the projection, that produces the holonomy computed below.

## Concrete example

Take the sphere of radius $R$ in spherical coordinates, with $\theta$ the polar
angle from the north pole and $\phi$ the azimuth. The induced metric is

$$
g = R^2\,d\theta^2 + R^2\sin^2\theta\,d\phi^2 .
$$

Its Levi-Civita connection has only two independent nonzero Christoffel symbols,

$$
\Gamma^\theta_{\phi\phi} = -\sin\theta\cos\theta, \qquad
\Gamma^\phi_{\theta\phi} = \Gamma^\phi_{\phi\theta} = \cot\theta ,
$$

and $R$ cancels from both. The geodesic equations are therefore
$\ddot\theta - \sin\theta\cos\theta\,\dot\phi^2 = 0$ and
$\ddot\phi + 2\cot\theta\,\dot\theta\,\dot\phi = 0$. Put a circle of latitude
$\theta \equiv \theta_0$, $\phi = t$ into the first: it demands
$\sin\theta_0\cos\theta_0 = 0$, so only the equator qualifies. Parallel transport
around the circle at $\theta_0$
returns a tangent vector rotated by the enclosed area over $R^2$: the polar cap
has area $2\pi R^2(1 - \cos\theta_0)$, giving a rotation of
$2\pi(1-\cos\theta_0)$, which at $\theta_0 = 60^\circ$ is exactly $\pi$ — the
vector comes back reversed. A Foucault pendulum's swing plane is transported the
same way.

For forms, take the unit sphere and $\omega = \sin\theta\,d\theta\wedge d\phi$.
It is top-degree, hence closed, and $\int_{S^2}\omega = 4\pi$. It is not exact:
$S^2$ has no boundary, so $\omega = d\eta$ would force
$\int_{S^2}\omega = 0$ by Stokes. One integral has computed a topological
invariant.

## Formal treatment

An affine connection is a map
$\nabla : \Gamma(TM)\times\Gamma(TM)\to\Gamma(TM)$, written $(X,Y)\mapsto
\nabla_X Y$, that is $C^\infty(M)$-linear in $X$ and satisfies the Leibniz rule
$\nabla_X(fY) = (Xf)Y + f\,\nabla_X Y$. Its **torsion** is
$T(X,Y) = \nabla_X Y - \nabla_Y X - [X,Y]$, and it is **metric-compatible** when
$\nabla g = 0$, equivalently
$Z\,g(X,Y) = g(\nabla_Z X, Y) + g(X, \nabla_Z Y)$.

The fundamental theorem of Riemannian geometry: on a manifold with metric $g$
there is exactly one torsion-free metric-compatible connection, the
**Levi-Civita connection**, determined by the Koszul formula

$$
2\,g(\nabla_X Y, Z) = X g(Y,Z) + Y g(X,Z) - Z g(X,Y)
+ g([X,Y],Z) - g([X,Z],Y) - g([Y,Z],X),
$$

whose coordinate form is
$\Gamma^k_{ij} = \tfrac12 g^{kl}\big(\partial_i g_{jl} + \partial_j g_{il} -
\partial_l g_{ij}\big)$. A geodesic satisfies $\nabla_{\dot\gamma}\dot\gamma = 0$,
i.e. $\ddot\gamma^k + \Gamma^k_{ij}\dot\gamma^i\dot\gamma^j = 0$. Solutions are
locally unique given a point and a velocity, which defines the
**exponential map** $\exp_p(v) = \gamma_v(1)$ for $v \in T_pM$ small; on the unit
sphere it is $\exp_p(v) = \cos|v|\,p + \sin|v|\,v/|v|$, injective exactly on
$|v| < \pi$, since the whole sphere $|v| = \pi$ maps to the antipode. Curvature
is the commutator
$R(X,Y)Z = \nabla_X\nabla_Y Z - \nabla_Y\nabla_X Z - \nabla_{[X,Y]}Z$, a tensor,
which vanishes identically if and only if the manifold is locally isometric to
Euclidean space.

Differential forms run in parallel and need no metric. The exterior derivative
$d:\Omega^k(M)\to\Omega^{k+1}(M)$ satisfies $d^2 = 0$, and **Stokes' theorem**
states that for an oriented smooth $n$-manifold $M$ with boundary and a
compactly supported $\omega \in \Omega^{n-1}(M)$,

$$
\int_M d\omega = \int_{\partial M} \iota^*\omega ,
$$

with $\partial M$ carrying the induced orientation. Green's theorem, the
divergence theorem and the Kelvin–Stokes theorem are the cases $n = 2, 3, 2$.

## Assumptions and requirements

$M$ must be smooth, Hausdorff and second countable; the last condition gives
partitions of unity, and with them every such manifold admits _some_ Riemannian
metric. The same is false for Lorentzian metrics — a compact manifold admits one
only if its Euler characteristic vanishes — so "just put a metric on it" is a
fact about positive-definite metrics specifically.

Positive-definiteness is what makes $\inf_\gamma L(\gamma)$ a genuine distance;
drop it for signature $(-,+,+,+)$ and the Levi-Civita theorem survives, its proof
using only non-degeneracy, while "shortest path" does not. Geodesic completeness
is needed for $\exp_p$ to be defined on all of $T_pM$, and without it two points
need not be joined by a minimising geodesic. Curvature involves second
derivatives of $g$, so $C^2$ is the regularity floor, not $C^\infty$. Stokes'
theorem needs orientability — no consistent $\int_M$ of a top form exists on a
Möbius band — and compact support.

## Uses and applicability

General relativity is the canonical application: spacetime is a Lorentzian
manifold, matter determines curvature, and free particles follow geodesics.

In computation, reach for this machinery when a parameter space is curved:
optimisation under orthogonality constraints on Stiefel and Grassmann manifolds,
the Riemannian mean of covariance matrices, robot configurations on $SE(3)$. The
cleanest machine-learning instance is exact:
for a parametric family $p_\theta$, the Fisher information matrix
$F_{ij}(\theta) = \mathbb{E}_{x\sim p_\theta}\!\left[\partial_i \log p_\theta(x)\,
\partial_j \log p_\theta(x)\right]$ is a Riemannian metric wherever it is
positive definite, and the Riemannian gradient defined by
$g(\operatorname{grad}L, v) = dL(v)$ has components $g^{ij}\partial_j L$. With
$g = F$ that is $F^{-1}\nabla L$: **natural gradient descent is gradient descent
in the Fisher metric**, not an analogy but the same formula. Do not reach for it
when a vector space and Euclidean geometry already fit.

## Limitations and common mistakes

The commonest error is believing curvature describes how something is bent in a
surrounding space. The Theorema Egregium says otherwise: a cylinder has Gaussian
curvature $0$ despite looking bent, because paper rolls into a cylinder without
stretching, while no flat map of the sphere preserves distances.

The second is that geodesics minimise length. They are critical points of the
energy functional and minimise only locally: the long way round a great circle is
a perfectly good geodesic.

The third is that the metric determines the connection outright. It does so only
_given_ torsion-freeness: drop that and an infinite family of metric connections
with torsion remains.

Fourth, Christoffel symbols are not tensor components: normal coordinates make
them vanish at any chosen point, so $\Gamma = 0$ at $p$ says nothing about
flatness, and $\cot\theta$ diverging at the poles is the chart degenerating, not
the sphere. Finally, forms do not need a metric — $d$, Stokes and de Rham
cohomology are metric-free, and the Hodge star and Laplace–Beltrami operator are
where the metric enters.

## Variants and alternatives

**Pseudo-Riemannian geometry** relaxes positive-definiteness to non-degeneracy
and is the setting for relativity, at the cost of the distance function.
**Finsler geometry** replaces the inner product by a norm on each tangent space,
buying generality and losing Levi-Civita uniqueness. **Sub-Riemannian geometry**
puts the metric on a distribution only, so admissible curves are constrained —
the right model for a parallel-parking car. **Symplectic geometry** swaps the
metric for a closed non-degenerate two-form and, by Darboux's theorem, has no
local invariants at all: the sharpest possible contrast with curvature.
**Cartan's moving frames** and connections on principal bundles restate the same
content in the form that generalises to gauge theory, and **discrete differential
geometry** puts forms and curvature on meshes. In information geometry a
statistical manifold carries a dual pair of flat connections, neither
Levi-Civita.

## History and attribution

Gauss established the intrinsic viewpoint in 1827 with the Theorema Egregium,
while running the geodetic survey of Hanover, where what a surveyor can learn
without leaving the surface was a practical question. Riemann's 1854 habilitation
lecture, _On the Hypotheses which lie at the Bases of Geometry_, generalised it
to $n$ dimensions and to spaces given by a line element rather than an embedding.
The apparatus followed: Christoffel's symbols in 1869, then the absolute
differential calculus of Ricci-Curbastro and Levi-Civita around 1900. Parallel
transport was isolated by Levi-Civita in 1917, in the wake of general relativity,
which had made a coordinate-free notion of "same direction" urgent. Cartan
introduced the exterior calculus in 1899, in _Sur certaines expressions
différentielles et le problème de Pfaff_; his moving frames and theory of
connections followed in the 1910s and 1920s, with the _Leçons sur les invariants
intégraux_ in 1922. That later work, together with the mid-century formulation
on manifolds, gave forms and the general Stokes theorem their modern shape.

## Sources

Nicolaescu's _Lectures on the Geometry of Manifolds_ is the technical backbone:
connections, the Levi-Civita theorem, geodesics, curvature, and the alternatives
to the Riemannian setting. Sjamaar's _Manifolds and Differential Forms_ is the
cleaner reference for the forms half, with Stokes' hypotheses stated carefully.
MIT 18.950 develops the sphere-and-geodesics intuition on curves and surfaces,
and Riemann's 1854 lecture is where the subject begins.

## Prerequisites and next connections

[Manifolds](./manifolds.md) come first — charts, tangent spaces and vector fields
are assumed in the first paragraph — and behind them
[Multivariable Calculus](./multivariable-calculus.md),
[Vector Calculus](./vector-calculus.md), whose grad, div and curl reappear here
as the single operator $d$, and [Tensors](./tensors.md) for the index
conventions.

[Curvature](./curvature.md) is the natural next page: this one builds the
connection, that one measures with it.
[Differential Topology](./differential-topology.md) is the contrast, keeping the
smooth structure and throwing the metric away;
[Lie Groups](./lie-groups.md) are where the metric can be made group-invariant,
with [Lie Algebras](./lie-algebras.md) the infinitesimal side.
[Spherical Geometry](./spherical-geometry.md),
[Hyperbolic Geometry](./hyperbolic-geometry.md) and
[Non-Euclidean Geometry](./non-euclidean-geometry.md) are the constant-curvature
cases as the nineteenth century worked them out, and
[Calculus of Variations](./calculus-of-variations.md) treats geodesics as
critical points.
