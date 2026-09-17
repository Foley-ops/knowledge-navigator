---
concept_id: concept.analysis.vector_calculus
title: Vector Calculus
slug: /concepts/vector-calculus
aliases:
  - vector analysis
kind: concept
tier: 1
review_state: generated-draft
summary: The calculus of vector fields — gradient, divergence and curl, together with line and surface integrals — whose three classical integral theorems are one statement that integrating a derivative over a region equals integrating the field over that region's boundary.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: Divergence and curl are assembled from the partial derivatives of a map between several variables, and every proof here uses the chain rule to pull an integral back to a parameter domain.
  - type: generalizes
    target: concept.analysis.single_variable_calculus
    note: The gradient theorem is the fundamental theorem of calculus with the interval replaced by an oriented curve, and Green, Stokes and Gauss are that same statement in two and three dimensions.
  - type: prerequisite_of
    target: concept.analysis.partial_differential_equations
    note: The heat, wave and Laplace equations are derived by applying the divergence theorem to a conservation law on an arbitrary control volume, and Green's identities are integration by parts for the Laplacian.
  - type: prerequisite_of
    target: concept.analysis.complex_analysis
    note: Green's theorem applied to a holomorphic integrand whose parts satisfy the Cauchy–Riemann equations yields Cauchy's theorem, so contour integration is a planar line integral.
sources:
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.partial_differential_equations
    title: MIT 18.152 Introduction to Partial Differential Equations (Fall 2011)
    url: https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Vector calculus** is the differential and integral calculus of vector fields on
open subsets of $\mathbb{R}^3$ and $\mathbb{R}^2$: three first-order operators
(gradient, divergence, curl), two kinds of integral (along an oriented curve,
across an oriented surface), and a family of theorems — Green, Kelvin–Stokes,
Gauss — each equating the integral of a derivative over a region to an integral
of the undifferentiated field over that region's boundary.

A **vector field** on an open $U \subseteq \mathbb{R}^3$ is a map
$F : U \to \mathbb{R}^3$, read as an arrow attached to each point rather than as
a point in space. [Multivariable Calculus](./multivariable-calculus.md) asks how
such a map changes and answers with a Jacobian; this page takes the same
derivatives and asks what happens when fields are integrated over curves,
surfaces and volumes.

## Why it matters

Physical laws are written in two dialects and this is the exact translation
between them. A conservation law in integral form says the flux out through a
closed surface equals the rate at which the contents decrease; in differential
form it says $\partial_t \rho + \nabla \cdot J = 0$ at every point. The
divergence theorem, applied to an arbitrary control volume, turns either into the
other — which is why Maxwell's equations exist in both forms, and how the heat
and Laplace equations are derived.

The operators turn up far from physics. In continuous normalizing flows the
instantaneous change-of-variables formula is a statement along the flow: for
$z(t)$ solving $\dot z = f(z,t)$,
$\tfrac{d}{dt}\log p_t(z(t)) = -\nabla \cdot f(z(t),t)$ — the log-density falls
along a trajectory at exactly the divergence of the velocity field. At a fixed
point the corresponding statement is the continuity equation,
$\partial_t \log p_t(x) + f \cdot \nabla_x \log p_t(x) = -\nabla \cdot f(x,t)$.
Score-based models learn an approximation to $\nabla_x \log p(x)$, a gradient
field — and a network with unconstrained outputs is generally the gradient of
nothing, detectable because its curl does not vanish.

## Intuition

Divergence is net outflow per unit volume: put a tiny box at a point, measure
what leaves minus what enters, divide by volume, shrink. Curl is circulation per
unit area: integrate around a tiny loop, divide by enclosed area, shrink; the
vector points along the axis of the loop that maximises this.

The paddle-wheel analogy is honest — a wheel dropped in the flow really does spin
at a rate set by the curl — but misleads if it suggests curl measures whether the
field _goes around_ something. The shear flow $F = (y,0,0)$ has straight parallel
streamlines and $\nabla \times F = (0,0,-1)$ everywhere, because the top of the
wheel is pushed harder than the bottom.

Behind the integral theorems is telescoping. Chop a region into cells and write
each cell's boundary integral; every interior face is shared by two cells that
traverse it with opposite orientation, so those terms cancel in pairs and only
the outer boundary survives. Orientation is a hypothesis, not bookkeeping: the
cancellation _is_ the theorem.

## Concrete example

Take $F(x,y,z) = (x, 2y, 3z)$ and $V$ the closed unit ball. Then
$\nabla \cdot F = 6$, so the volume integral is $6 \cdot \tfrac{4}{3}\pi = 8\pi$.
Directly: the outward normal on the unit sphere is $n = (x,y,z)$, so
$F \cdot n = x^2 + 2y^2 + 3z^2$, and by symmetry $\oint x^2\,dS$, $\oint y^2\,dS$
and $\oint z^2\,dS$ are equal and sum to $\oint 1\,dS = 4\pi$. Each is $4\pi/3$
and the flux is $(1+2+3)\cdot\tfrac{4}{3}\pi = 8\pi$.

Now take $F = (-y, x, 0)$ and $S$ the unit disc in $z = 0$ oriented by
$n = (0,0,1)$. Here $\nabla \times F = (0,0,2)$, so the flux of the curl is
$2 \times \text{area} = 2\pi$. On the boundary circle
$r(t) = (\cos t, \sin t, 0)$ we get $F(r(t)) = r'(t)$, so $F \cdot r'$ is
identically $1$ and the circulation is $2\pi$. Reverse the circle and both sides
become $-2\pi$.

## Formal treatment

For $f : U \to \mathbb{R}$ and $F = (F_1,F_2,F_3) : U \to \mathbb{R}^3$ on open
$U \subseteq \mathbb{R}^3$,

$$
\nabla f = (\partial_x f,\, \partial_y f,\, \partial_z f), \qquad
\nabla \cdot F = \partial_x F_1 + \partial_y F_2 + \partial_z F_3,
$$

$$
\nabla \times F = (\partial_y F_3 - \partial_z F_2,\;
\partial_z F_1 - \partial_x F_3,\;
\partial_x F_2 - \partial_y F_1).
$$

The **line integral** along a piecewise-$C^1$ curve $r : [a,b] \to U$ is
$\int_C F \cdot dr = \int_a^b F(r(t)) \cdot r'(t)\,dt$, invariant under
orientation-preserving reparametrisation and sign-flipping under reversal. The
**flux** across a piecewise-smooth oriented surface $r : D \to U$ is
$\iint_S F \cdot n\,dS = \iint_D F(r(u,v)) \cdot (r_u \times r_v)\,du\,dv$, the
orientation being the choice of which of $\pm(r_u \times r_v)$ is $n$.

With $f$ or $F$ of class $C^1$ on an open set containing the closed region:

- **Gradient theorem.** $\int_C \nabla f \cdot dr = f(r(b)) - f(r(a))$ for any
  piecewise-$C^1$ curve in $U$.
- **Green's theorem.** For compact $D \subset \mathbb{R}^2$ bounded by finitely
  many piecewise-$C^1$ simple closed curves, positively oriented (outer boundary
  counterclockwise, holes clockwise),
  $\oint_{\partial D} P\,dx + Q\,dy = \iint_D (\partial_x Q - \partial_y P)\,dA$.
- **Kelvin–Stokes theorem.** For oriented piecewise-smooth $S$ whose boundary
  carries the induced orientation (right-hand rule relative to $n$),
  $\iint_S (\nabla \times F)\cdot n\,dS = \oint_{\partial S} F \cdot dr$.
- **Divergence theorem.** For compact $V \subset \mathbb{R}^3$ with
  piecewise-smooth boundary and outward unit normal,
  $\iiint_V \nabla \cdot F\,dV = \oiint_{\partial V} F \cdot n\,dS$.

These are faces of one theorem. As differential forms, a $0$-form is a function,
a $1$-form encodes a field for line integration, a $2$-form one for flux, a
$3$-form a density; the exterior derivative $d$ acts as gradient, curl and
divergence respectively, and the **generalised Stokes theorem** says

$$
\int_M d\omega = \int_{\partial M} \omega
$$

for a compactly supported smooth $(k-1)$-form $\omega$ on an oriented smooth
$k$-manifold with boundary, $\partial M$ carrying the induced orientation; taking
$k = 1,2,3$ recovers the list. From $d \circ d = 0$ come
$\nabla \times \nabla f = 0$ and $\nabla \cdot (\nabla \times F) = 0$ for $C^2$
fields, both reducing to equality of mixed partials. The partial converses are
the **Poincaré lemma**: on a contractible open set a curl-free field is a
gradient and a divergence-free field is a curl.

## Assumptions and requirements

$C^1$ regularity is needed on an open set containing the _closed_ region, and
everywhere in it rather than almost everywhere. One interior singularity breaks
the conclusion: $F = r/\lVert r\rVert^3$ has $\nabla \cdot F = 0$ away from the
origin, yet its flux through any sphere enclosing the origin is $4\pi$. The
repair — excise a small ball and apply the theorem between the surfaces — is how
Gauss's law is actually derived.

Orientability is a genuine hypothesis: a Möbius band admits no continuous unit
normal, so the left side of Stokes's theorem is not defined on it. Regions must
be bounded, or the integrals shown to converge. Boundaries may have corners and
edges but must be piecewise smooth; rough ones need measure-theoretic versions.

Curl _as a vector_ is specific to three dimensions. In the plane the curl of
$(P,Q)$ is the scalar $\partial_x Q - \partial_y P$; in $\mathbb{R}^n$ the honest
object is the antisymmetric array $\partial_i F_j - \partial_j F_i$, whose
$\binom{n}{2}$ components match a vector's three only at $n = 3$, so
$\nabla \times F$ in four dimensions is meaningless. The converses above carry a
_topological_ hypothesis, not an analytic one, and smoothness cannot substitute.

## Uses and applicability

Reach for vector calculus when a quantity is transported, conserved, or derived
from a potential on a continuous domain: electromagnetism, fluid dynamics, heat
conduction, potential theory, and the derivation of the PDEs describing them. It
is the language of flux boundary conditions, of Green's identities (integration
by parts for $\Delta = \nabla \cdot \nabla$), and of the Helmholtz decomposition
into gradient and curl parts.

Do not reach for it when the domain is discrete or curved. On a graph the
counterparts are the incidence matrix and the graph Laplacian; on a curved
manifold, or wherever the metric varies, differential forms or tensor calculus
are the working tools — as they are in any dimension above three.

## Limitations and common mistakes

The commonest error is treating "curl-free" as equivalent to "conservative". On
$\mathbb{R}^2 \setminus \{0\}$ the field $F = (-y, x)/(x^2+y^2)$ has
$\partial_x Q - \partial_y P = 0$ everywhere, yet circulates $2\pi$ around the
unit circle: the domain is not simply connected, so the local potential
$\operatorname{atan2}(y,x)$ cannot be made single-valued. The mirrored mistake is
assuming a divergence-free field is a curl; the inverse-square field above is the
counterexample, obstructed by an enclosed cavity.

Orientation sign errors are the second class, and they are diagnosable: if a flux
comes out negative, check that the normal is outward and that the boundary was
traversed with the surface on the correct side. Green's theorem on a region with
holes needs the inner boundaries clockwise.

Third, $\nabla$ is not a vector, so vector-algebra reflexes fail. $\nabla \cdot F$
and $F \cdot \nabla$ are different objects — the second is an operator awaiting
an argument — and product rules pick up extra terms, as in
$\nabla \cdot (fF) = f\,\nabla \cdot F + \nabla f \cdot F$. Fourth, rigid rotation
$F = \omega \times r$ has $\nabla \times F = 2\omega$: curl is twice the angular
velocity, not equal to it.

## Variants and alternatives

**Differential forms** are the mature version of the same mathematics: one
operator, one theorem, valid in any dimension and on any oriented manifold,
bought with a new formalism and the loss of the arrow picture. **Index notation**
with $\partial_i$ and $\varepsilon_{ijk}$ makes identity proofs mechanical at the
cost of geometric meaning; **geometric algebra** packages the three operators into
one, elegantly, with a much smaller community.

Inside the classical formalism the operators must be rewritten in **curvilinear
coordinates** with scale factors — in spherical coordinates
$\nabla \cdot F = \tfrac{1}{r^2}\partial_r(r^2 F_r) + \cdots$ — and dropping
those is a routine source of wrong answers. **Discrete exterior calculus**
reproduces the structure on meshes so that $d \circ d = 0$ holds exactly in the
discretisation, which keeps fluid and electromagnetic solvers stable, and
**measure-theoretic Gauss–Green theorems** extend the divergence theorem to rough
domains and functions of bounded variation.

## History and attribution

The pieces have several independent origins, which is why the names are a poor
guide. George Green's 1828 essay on electricity and magnetism introduced Green's
functions and the three-dimensional identities from which the planar theorem
descends; the plane statement now called Green's theorem was first printed by
Cauchy in 1846 and first proved by Riemann in 1851, the name attaching to Green
by descent rather than by publication. The divergence theorem is credited jointly
to Gauss, who proved special cases while working on gravitational attraction in
the 1810s, and to Ostrogradsky, who gave a general statement in the 1820s.

"Stokes's theorem" is an accident of naming: William Thomson (Lord Kelvin) stated
the result in an 1850 letter to Stokes, who set it as a question on the Smith's
Prize examination at Cambridge in 1854. Students met it there and the name stuck,
though Stokes published no proof.

The notation is younger than the theorems. Josiah Willard Gibbs and Oliver
Heaviside independently built modern vector analysis in the 1880s by stripping
Hamilton's quaternions down to the dot and cross products, and Gibbs's lectures
were written up by E. B. Wilson as _Vector Analysis_ in 1901, largely fixing
today's notation. Élie Cartan's exterior calculus, early in the twentieth
century, later showed the separate theorems to be one.

## Sources

MIT 18.02 carries most of this page: vector fields, the operators, line and
surface integrals, and the named theorems with examples of the kind worked above.
MIT 18.152 covers how those theorems derive and analyse partial differential
equations, Green's identities included. MIT 18.950 supplies the surface theory —
parametrisation, normals, orientation — the surface-integral hypotheses rest on.
Wolfram MathWorld is the lookup for operator identities, curvilinear expressions
and attribution notes.

## Prerequisites and next connections

Read [Multivariable Calculus](./multivariable-calculus.md) first: partial
derivatives, the Jacobian and the chain rule are used throughout, and the
change-of-variables factor is what makes a surface integral independent of its
parametrisation. [Single Variable Calculus](./single-variable-calculus.md)
supplies the fundamental theorem that all of this generalises, and
[Real Analysis](./real-analysis.md) the limit and continuity notions the
smoothness hypotheses quantify over.

This opens up partial differential equations, where the divergence theorem is the
derivation tool; complex analysis, where Cauchy's theorem is Green's theorem plus
the Cauchy–Riemann equations; and differential geometry, where the topological
obstructions above become de Rham cohomology.
