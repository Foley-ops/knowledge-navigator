---
concept_id: concept.geometry.manifolds
title: Manifolds
slug: /concepts/manifolds
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The spaces on which calculus still works without a preferred coordinate system, built by gluing pieces of Euclidean space along smooth overlaps so that curvature, topology and dynamics can be studied intrinsically.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.geometry.point_set_topology
    note: The definition is three conditions on a topological space — locally Euclidean, Hausdorff, second countable — and none of them can be read without open sets, homeomorphisms and countable bases.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: Smoothness of a manifold is smoothness of its transition maps between open subsets of R^n, and the tangent space is the chart-independent form of the total derivative.
  - type: contributes_to
    target: concept.geometry.differential_geometry
    note: A Riemannian metric, a connection and curvature are extra structure laid on top of a smooth manifold, which supplies the space they are defined on.
  - type: contributes_to
    target: concept.geometry.lie_groups
    note: A Lie group is a group whose underlying space is a smooth manifold with smooth multiplication and inversion, so the manifold axioms are half of its definition.
sources:
  - source_id: source.nicolaescu.geometry_of_manifolds
    title: Lectures on the Geometry of Manifolds
    url: https://academicweb.nd.edu/~lnicolae/Lectures.pdf
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.nlab.exotic_smooth_structure
    title: 'nLab: exotic smooth structure'
    url: https://ncatlab.org/nlab/show/exotic+smooth+structure
    source_kind: reference-documentation
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.riemann1854.bases_of_geometry
    title: On the Hypotheses which lie at the Bases of Geometry
    url: https://www.maths.tcd.ie/pub/HistMath/People/Riemann/Geom/WKCGeom.html
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mcinnes2018.umap
    title: 'UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction'
    url: https://arxiv.org/abs/1802.03426
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Intrinsic dimension estimation for natural image data
    reason: The limitations section says that measured intrinsic dimension of image datasets depends on the estimator and is not a settled number; no source cited here reports such measurements, and no page in this corpus covers dimension estimators.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

An $n$-dimensional **topological manifold** is a topological space $M$ that is
locally Euclidean of dimension $n$ — every point has an open neighbourhood
homeomorphic to an open subset of $\mathbb{R}^n$ — and is in addition Hausdorff
and second countable. Each homeomorphism $\varphi_\alpha : U_\alpha \to
\varphi_\alpha(U_\alpha) \subseteq \mathbb{R}^n$ from an open
$U_\alpha \subseteq M$ is a **chart**; a family of charts whose domains cover
$M$ is an **atlas**; and on an overlap $U_\alpha \cap U_\beta$ the **transition
map** $\varphi_\beta \circ \varphi_\alpha^{-1}$ is a homeomorphism between open
subsets of $\mathbb{R}^n$. A **smooth manifold** is a topological manifold with
an atlas whose transition maps are all $C^\infty$. Nothing here refers to an
ambient space: a manifold is a subset of nothing until you embed it.

## Why it matters

Ordinary calculus is calculus on $\mathbb{R}^n$, which comes with a global
coordinate system that most interesting spaces do not have. The rotations of
three-space, the configuration space of a linkage, the solution set of a system
of equations — all support differentiation locally, and in general none of them
comes with a single chart covering it. The manifold definition lets you
differentiate anyway: work in a chart, then prove the answer does not depend on
which chart you picked.

So "coordinate-independent" becomes a checkable condition. A quantity defined
chart-by-chart is a genuine object on $M$ exactly when it transforms correctly
under the transition maps, and that one test is what makes tensors, forms,
connections and curvature well-defined.

## Intuition

The working picture is a road atlas: flat pages covering the Earth, none showing
the whole thing, with a conversion rule wherever two pages overlap, and anything
said using the atlas must survive that conversion. The analogy breaks in one
place. A road atlas depicts a surface already sitting in three-dimensional
space, so you can fall back on the ambient picture; an abstract manifold has no
ambient space, and the charts and their transitions are all the data there is.
Whitney's theorem does supply an ambient $\mathbb{R}^{2n}$, but a proof leaning
on it hides which facts were intrinsic.

The other slogan — zoom in far enough and you cannot tell it from
$\mathbb{R}^n$ — is exactly right, and is the point: the local data is identical
for a sphere, a torus and a plane, so everything distinguishing them is global.

## Concrete example

Take the unit sphere $S^2 = \{(x,y,z) : x^2+y^2+z^2 = 1\}$ with two charts given
by stereographic projection from each pole:

$$
\varphi_N(x,y,z) = \frac{(x,y)}{1-z} \ \text{ on } U_N = S^2 \setminus \{(0,0,1)\},
\qquad
\varphi_S(x,y,z) = \frac{(x,y)}{1+z} \ \text{ on } U_S = S^2 \setminus \{(0,0,-1)\}.
$$

Each is a homeomorphism onto all of $\mathbb{R}^2$ and together they cover
$S^2$. On the overlap, a two-line computation using $x^2+y^2 = 1-z^2$ gives

$$
\varphi_S \circ \varphi_N^{-1}(u,v) = \frac{(u,v)}{u^2+v^2},
$$

inversion in the unit circle, smooth on $\mathbb{R}^2 \setminus \{0\}$ — so this
atlas is a smooth structure. Check it at $(3/5, 0, 4/5)$: $\varphi_N$ sends it
to $(3,0)$ since $(3/5)/(1/5) = 3$, $\varphi_S$ sends it to $(1/3,0)$ since
$(3/5)/(9/5) = 1/3$, and indeed $(3,0)/(3^2+0^2) = (1/3,0)$. One chart never
suffices: $S^2$ is compact and $\mathbb{R}^2$ is not.

## Formal treatment

Two smooth atlases are **compatible** when their union is again a smooth atlas;
each equivalence class contains a unique maximal atlas, and a **smooth
structure** on $M$ is such a maximal atlas. A map $F : M \to N$ is smooth when
every coordinate representative $\psi \circ F \circ \varphi^{-1}$ is smooth
between open subsets of Euclidean spaces, and a **diffeomorphism** is a smooth
bijection with smooth inverse.

The **tangent space** $T_pM$ is defined without an ambient space, as the
derivations at $p$: linear maps $v : C^\infty(M) \to \mathbb{R}$ with

$$
v(fg) = v(f)\,g(p) + f(p)\,v(g).
$$

It is a real vector space of dimension $n$, with basis
$\partial/\partial x^1|_p, \dots, \partial/\partial x^n|_p$ supplied by any
chart $\varphi = (x^1,\dots,x^n)$ around $p$. The **differential**
$dF_p : T_pM \to T_{F(p)}N$ is $(dF_p v)(f) = v(f \circ F)$; in charts it is the
Jacobian, so the chain rule of
[Multivariable Calculus](./multivariable-calculus.md) is what makes
$d(G \circ F)_p = dG_{F(p)} \circ dF_p$ true.

**Submanifolds** come most often from the regular value theorem: if $dF_p$ is
surjective at every $p \in F^{-1}(q)$, then $F^{-1}(q)$ is a closed embedded
submanifold of dimension $\dim M - \dim N$. Applied to
$f(x) = \lVert x \rVert^2$ on $\mathbb{R}^3$, whose differential
$v \mapsto 2\langle x, v\rangle$ is surjective off the origin, this makes
$S^2 = f^{-1}(1)$ a $2$-dimensional submanifold with no chart written.

## Assumptions and requirements

Locally Euclidean alone is not enough; each extra condition rules out a specific
pathology.

_Hausdorff_ rules out the line with two origins — two copies of $\mathbb{R}$
glued along $\mathbb{R}\setminus\{0\}$ — which is locally Euclidean and second
countable, yet has a sequence converging to both origins and embeds in no
$\mathbb{R}^N$. _Second countable_ rules out the long line, which is Hausdorff
and locally Euclidean but not metrizable and so carries no Riemannian metric.
With the other two conditions it forces paracompactness, hence partitions of
unity — the tool that turns local constructions into global ones, which most of
the standard theory quietly needs.

The dimension $n$ is well defined only because $\mathbb{R}^n$ and $\mathbb{R}^m$
are non-homeomorphic for $n \neq m$ (invariance of domain), and it is constant
only on each connected component. A smooth structure is a further choice: the
topology does not determine it.

## Uses and applicability

Reach for it when your states have local coordinates but no global ones:
rotation groups and other [Group Theory](./group-theory.md) objects with
continuous parameters, configuration and phase spaces, constraint surfaces cut
out by smooth equations, spacetime, and the domains of geometric
[Partial Differential Equations](./partial-differential-equations.md).
Optimization over the sphere, the Stiefel manifold or the Grassmannian uses it
directly: each update must stay on the manifold.

In machine learning it appears as the _manifold hypothesis_, the assumption that
high-dimensional data concentrates near a low-dimensional submanifold. UMAP is
explicit that it adopts this — uniform sampling from a Riemannian manifold,
locally constant metric, local connectedness — rather than verifying it.

Do not reach for it where the object has genuine singularities, such as a cone
or a nodal curve, since charts fail exactly there; nor for discrete structures
such as graphs; nor where one global chart already exists and the vocabulary
would sit idle.

## Limitations and common mistakes

**"Locally Euclidean means locally flat, so curvature is topological."** No.
Every point of a sphere has a neighbourhood homeomorphic to a disc and the
sphere is still curved. Curvature belongs to a metric, which is extra structure;
a bare manifold knows nothing of distance or angle.

**Assuming the topology determines the smooth structure.** It does not. Milnor
found smooth manifolds homeomorphic but not diffeomorphic to $S^7$; the group of
oriented smooth structures there has order $28$. In dimensions $1$, $2$ and $3$
the smooth structure is unique, so the mistake is invisible. Dimension four is
the anomaly: $\mathbb{R}^n$ has exactly one smooth structure for every
$n \neq 4$, while $\mathbb{R}^4$ admits uncountably many pairwise
non-diffeomorphic ones. **Exotic $\mathbb{R}^4$ exists in dimension four and
nowhere else.** Dimension four also holds compact topological manifolds carrying
no smooth structure at all.

**Treating the manifold hypothesis as a theorem.** It is an empirical modelling
assumption about particular datasets, not a consequence of anything above. A
finite point cloud is not a manifold in any useful sense; the claim concerns the
distribution the points came from, and the algorithms assuming it do not check
it. Measured intrinsic dimension of image data varies with the estimator, and
real data plausibly has varying dimension across the set. The assumption earns
its keep when the methods built on it work — different evidence entirely.

**Forgetting to check a coordinate formula in the other charts.** Christoffel
symbols are the standard trap: they look like a tensor and are not one.

## Variants and alternatives

Weakening the regularity of the transition maps gives $C^k$ and topological
manifolds; strengthening it gives real-analytic manifolds and, with holomorphic
transitions on $\mathbb{C}^n$, the far more rigid complex manifolds.
Piecewise-linear transitions give PL manifolds; the smooth, PL and topological
categories agree in low dimensions and come apart in high ones, which is what
makes exotic structures possible. A half-space local model
$\mathbb{H}^n = \{x^n \geq 0\}$ gives manifolds with boundary; a Banach or
Hilbert local model gives infinite-dimensional manifolds, at the cost of local
compactness. Where singularities cannot be avoided, the competitors are
orbifolds, stratified spaces, schemes and varieties, and simplicial complexes.

## History and attribution

The idea is Riemann's. His 1854 Habilitation lecture _On the Hypotheses which
lie at the Bases of Geometry_ introduced the $n$-fold extended magnitude: a
space described by $n$ varying coordinates, with length specified pointwise
rather than inherited from a surrounding space. He was asking which facts of
geometry are necessary and which contingent — the question that also produced
[Non-Euclidean Geometry](./non-euclidean-geometry.md).

The chart-and-atlas formulation, with Hausdorff and second countability written
down explicitly, was settled in the first half of the twentieth century,
alongside Whitney's embedding theorem. The gap between topological and smooth
opened in 1956, when Milnor exhibited exotic smooth structures on the
$7$-sphere; Kervaire and Milnor later computed the full group of them in high
dimensions. The four-dimensional picture came out of the early 1980s, combining
Freedman's classification of topological four-manifolds with Donaldson's
gauge-theoretic obstructions.

## Sources

_Lectures on the Geometry of Manifolds_ is the main reference: atlases, tangent
spaces, submanifolds, partitions of unity, and the proofs this page only states.
The nLab entry on exotic smooth structures covers $S^7$, dimension four and the
smooth-versus-topological gap, and points at the original papers. Riemann's 1854
lecture is the primary source for the idea's origin. UMAP is cited narrowly, for
stating the manifold hypothesis as an assumption.

## Prerequisites and next connections

Read [Point-Set Topology](./point-set-topology.md) first — the three conditions
and the counterexamples above are all in its language. Read
[Multivariable Calculus](./multivariable-calculus.md) too, since smoothness of
transition maps and the differential are statements about maps between open
subsets of $\mathbb{R}^n$, and each tangent space is a
[Vector Space](./vector-spaces.md) attached to a point.

From here, a metric on a manifold gives geodesics and curvature;
[Spherical Geometry](./spherical-geometry.md) and
[Hyperbolic Geometry](./hyperbolic-geometry.md) are the constant-curvature
examples worth carrying as intuition. A compatible group structure gives Lie
groups, and algebraic invariants distinguish a torus from a sphere when no chart
can.
