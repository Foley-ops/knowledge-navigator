---
concept_id: concept.geometry.hyperbolic_geometry
title: Hyperbolic Geometry
slug: /concepts/hyperbolic-geometry
kind: concept
tier: 1
review_state: generated-draft
summary: The geometry of constant negative curvature, where a point off a line admits infinitely many parallels, triangles have angle sums below pi, and the amount of space within radius r grows exponentially rather than polynomially.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: specializes
    target: concept.geometry.non_euclidean_geometry
    note: It is the constant-negative-curvature case of the non-Euclidean programme, the half that keeps lines infinite and admits many parallels.
  - type: contrasts_with
    target: concept.geometry.euclidean_geometry
    note: Both satisfy Euclid's first four postulates; hyperbolic geometry denies the fifth, and the consequences separate them quantitatively at every scale.
  - type: contrasts_with
    target: concept.geometry.spherical_geometry
    note: Curvature $+1$ gives no parallels, angle sums above $\pi$ and finite total area; curvature $-1$ gives infinitely many parallels, angle sums below $\pi$ and exponential growth.
  - type: contributes_to
    target: concept.analysis.complex_analysis
    note: The Poincaré models are domains in $\mathbb{C}$ whose isometries are Möbius transformations, and the hyperbolic metric is the object behind the Schwarz–Pick lemma.
sources:
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
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
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: Empirical results on hyperbolic (Poincaré) embeddings of hierarchies, and low-distortion tree embeddings into the hyperbolic plane
    reason: The registry has no paper on hyperbolic representation learning or on metric embedding distortion, so the machine-learning claims here are stated qualitatively from the volume-growth argument rather than cited.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
  - label: Bourgain's lower bound on the distortion of embedding complete binary trees into Hilbert space
    reason: Named here for orientation but not covered by any registry source; the reader should verify the exact bound before relying on it.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

**Hyperbolic geometry** is the geometry of a complete, simply connected
Riemannian manifold of constant negative sectional curvature, conventionally
normalised to $K = -1$; in dimension two this space is the **hyperbolic plane**
$\mathbb{H}^2$. It satisfies Euclid's first four postulates and denies the fifth
in the strongest available way: given a line $\ell$ and a point $p \notin \ell$,
there are infinitely many lines through $p$ that never meet $\ell$.

Three consequences follow and characterise the subject. Every geodesic triangle
has angle sum strictly less than $\pi$. The area of a geodesic triangle equals
its **angle defect**, $\pi - (\alpha + \beta + \gamma)$, exactly. And the
circumference of a circle of radius $r$ is $2\pi \sinh r$, which grows like
$\pi e^{r}$ rather than like $2\pi r$.

## Why it matters

The historical reason is that hyperbolic geometry settled a two-thousand-year
question. Beltrami's models exhibit it inside Euclidean geometry, so if Euclidean
geometry is consistent then so is this one, and the parallel postulate is
therefore not a theorem. That argument — build a model, transfer consistency —
became the standard method of independence proofs in logic.

The working reason is exponential volume growth. A space whose capacity at
radius $r$ scales as $e^{r}$ can hold a branching structure that a fixed-dimensional
Euclidean space cannot hold without crowding. That is why hyperbolic space is the
natural home for trees, for the large-scale geometry of free groups, and for
embeddings of hierarchies.

## Intuition

Picture a space that keeps getting roomier as you move outward — at every point,
in every direction, by the same factor. Locally it looks like a saddle: the
surface curves away from its tangent plane in two directions at once, so a small
circle drawn around you has more circumference than $2\pi r$, and a triangle's
sides bow inward.

The Escher-style picture of tiles shrinking towards the rim of a disk is the most
common mental image, and the place the analogy breaks is worth stating plainly.
The tiles are not shrinking. They are congruent. The Poincaré disk squeezes an
infinite space into a finite picture, so the metric distortion you see belongs to
the _drawing_, not to the geometry. Hyperbolic space is homogeneous and isotropic:
every point is the centre, and the rim is infinitely far from all of them.

## Concrete example

Work in the Poincaré disk. The distance from the origin to a point at Euclidean
radius $\rho$ is $d = \log\frac{1+\rho}{1-\rho}$. So $\rho = 0.9$ sits at
$\log 19 \approx 2.94$, and $\rho = 0.99$ at $\log 199 \approx 5.29$. Ten times
closer to the rim in the picture, only $2.35$ further away in the space.

Now compare circles. With $K = -1$, circumference is $2\pi \sinh r$:

| $r$ | Euclidean $2\pi r$ | hyperbolic $2\pi\sinh r$ |
| --- | ------------------ | ------------------------ |
| 1   | 6.28               | 7.38                     |
| 5   | 31.4               | 466                      |
| 10  | 62.8               | 69 200                   |

That table is the whole story for hierarchical data. Place the root of a complete
binary tree at the origin and every node at depth $k$ on the circle of radius
$\delta k$. Depth $k$ holds $2^{k}$ nodes and the circle offers
$\approx \pi e^{\delta k}$ of room, so as long as $e^{\delta} > 2$, that is
$\delta > \ln 2 \approx 0.693$, each level has room to spare and the spacing
between siblings never degrades. In the Euclidean plane the same circle offers
only $2\pi\delta k$ of room against $2^{k}$ nodes, so sibling spacing decays like
$k\,2^{-k}$ and is already exhausted a small constant number of levels down;
holding the spacing fixed instead forces the radius at depth $k$ to grow like
$2^{k}$ rather than linearly in $k$.

Finally, a triangle with all three angles $\pi/4$ has area
$\pi - 3\pi/4 = \pi/4 \approx 0.785$, and an **ideal** triangle with all three
vertices on the boundary and all angles $0$ has area exactly $\pi$. No hyperbolic
triangle is larger than that.

## Formal treatment

Two conformal models are standard. The **Poincaré disk** is
$\mathbb{D} = \{z \in \mathbb{C} : |z| < 1\}$ with

$$
ds^2 = \frac{4\,(dx^2 + dy^2)}{\left(1 - |z|^2\right)^2},
$$

and the **upper half-plane** is
$\mathbb{H} = \{z \in \mathbb{C} : \operatorname{Im} z > 0\}$ with

$$
ds^2 = \frac{dx^2 + dy^2}{y^2}.
$$

Both have Gaussian curvature $K = -1$. The Cayley transform
$z \mapsto (z - i)/(z + i)$ is an isometry from $\mathbb{H}$ onto $\mathbb{D}$,
so the two are the same space in different coordinates. Conformal means angles in
the model equal angles in the geometry; lengths do not.

Geodesics in $\mathbb{H}$ are vertical rays and semicircles centred on the real
axis; in $\mathbb{D}$ they are diameters and circular arcs meeting the unit circle
orthogonally. Distances are

$$
\cosh d(z_1, z_2) = 1 + \frac{|z_1 - z_2|^2}{2\, y_1 y_2}
\quad (\mathbb{H}), \qquad
d(u,v) = \operatorname{arcosh}\!\left(1 + \frac{2\|u - v\|^2}{(1 - \|u\|^2)(1 - \|v\|^2)}\right)
\quad (\mathbb{D}),
$$

where $y_i = \operatorname{Im} z_i$. The orientation-preserving isometry group of
$\mathbb{H}$ is $\mathrm{PSL}(2,\mathbb{R})$ acting by Möbius maps
$z \mapsto (az+b)/(cz+d)$ with $ad - bc = 1$; adjoining $z \mapsto -\bar{z}$ gives
the full isometry group. Trigonometry replaces the Euclidean identities with
hyperbolic ones, for instance the law of cosines

$$
\cosh c = \cosh a \cosh b - \sinh a \sinh b \cos \gamma .
$$

Area comes from Gauss–Bonnet. For a geodesic triangle $T$ on a surface of
curvature $K$,
$\iint_T K \, dA + \sum_i (\pi - \theta_i^{\text{int}}) = 2\pi$, the sum being
over the exterior angles $\pi - \theta_i^{\text{int}}$, which at $K \equiv -1$
collapses to $\operatorname{Area}(T) = \pi - (\alpha+\beta+\gamma)$.
In $n$ dimensions the volume of a ball of radius $r$ is
$\omega_{n-1}\int_0^r \sinh^{n-1} t \, dt \sim C e^{(n-1)r}$.

## Assumptions and requirements

_Constant_ curvature, not merely negative, is what buys the model theory. A
manifold with variable negative curvature has no global model, no transitive
isometry group and no exact angle-defect formula — only comparison theorems
against the constant-curvature reference.

Completeness and simple connectedness are what make the space unique. By the
Killing–Hopf theorem a complete, simply connected manifold of constant curvature
$-1$ is isometric to $\mathbb{H}^n$; drop simple connectedness and you get its
quotients $\mathbb{H}^n / \Gamma$ by discrete torsion-free isometry groups, which
are locally hyperbolic but globally various — closed surfaces of genus $\ge 2$
among them.

Normalising $K = -1$ fixes an absolute unit of length, and this is a structural
fact rather than a convention: hyperbolic geometry has no non-trivial
similarities. Angle-angle-angle determines a triangle up to isometry, so "scale
invariant" arguments imported from Euclidean reasoning are simply false here.

## Uses and applicability

Reach for hyperbolic geometry when the data or the object is tree-like — a
taxonomy, a file system, a phylogeny, an entailment hierarchy, the Cayley graph of
a free group — and the thing you need is room for exponential branching at bounded
distortion. Gromov's $\delta$-hyperbolicity turns this into a measurable property
of an arbitrary metric space, and a space with small $\delta$ is a candidate.
Within machine learning the geometric-deep-learning programme makes the general
point precisely: the domain's geometry is a modelling choice, and imposing the
wrong one costs accuracy or parameters.

The empirical finding is narrower than the enthusiasm around it. On strongly
hierarchical graphs, embeddings into low-dimensional hyperbolic space reconstruct
the graph metric better than Euclidean embeddings of the same dimension — this is
a benchmark result on tree-like data, not a theorem and not a universal
improvement. On data with no hierarchy, cycles, or many weakly related clusters,
hyperbolic embeddings offer nothing and cost numerical stability.

Outside learning, it is the geometry of the velocity space of special relativity
(rapidity is hyperbolic distance), and by Thurston's geometrisation programme it
is the geometry of most three-manifolds.

## Limitations and common mistakes

The first mistake is reading the model as the space, and it takes two forms:
believing the disk has an edge (it does not — the boundary circle is at infinite
distance and is not part of $\mathbb{H}^2$), and believing objects near the rim
are small (they are not — they are drawn small).

The second is expecting a surface in $\mathbb{R}^3$. There is none: Hilbert proved
in 1901 that $\mathbb{H}^2$ admits no complete isometric immersion into Euclidean
3-space, so the pseudosphere and crocheted models realise pieces only. Negative
curvature is intrinsic; it does not require an ambient saddle.

The third is carrying Euclidean reflexes across. Parallel lines are not
equidistant: the locus of points at fixed distance from a geodesic is a
**hypercycle**, which is not itself a geodesic. Triangles can be arbitrarily thin
but never have area above $\pi$. Two triangles with equal angles are congruent,
not merely similar.

In implementations, the conformal factor $1/(1 - \|x\|^2)$ diverges at the
boundary, so gradients and distances lose precision in floating point exactly
where hierarchical embeddings want to put their leaves — a well-known practical
obstacle that projection back inside a radius $1 - \varepsilon$ only partly
mitigates. Optimisation must also be Riemannian; plain Euclidean gradient steps on
model coordinates are not steps in the geometry.

## Variants and alternatives

Among models of the same geometry: the **Klein–Beltrami** model draws geodesics as
straight chords, which is convenient for incidence arguments but distorts angles;
the **hyperboloid** (Minkowski or Lorentz) model puts $\mathbb{H}^n$ on the sheet
$\langle x, x\rangle_{\mathcal{L}} = -1$, $x_0 > 0$, of the Minkowski form, giving
$d(x,y) = \operatorname{arcosh}(-\langle x,y\rangle_{\mathcal{L}})$ with linear
isometries and better numerical behaviour; the **Poincaré half-space** model
extends the half-plane to $n$ dimensions. All are isometric — the choice is
computational, not mathematical.

Among geometries: Euclidean ($K = 0$) and spherical ($K = +1$) are the other two
constant-curvature cases, and **Gromov hyperbolicity** is the coarse
generalisation that keeps the thin-triangle behaviour while dropping smoothness
and curvature entirely. For representation learning, **product manifolds** mixing
hyperbolic, Euclidean and spherical factors are the pragmatic alternative when
data is only partly hierarchical.

## History and attribution

Saccheri in 1733 derived a long list of consequences of denying the parallel
postulate, intending a contradiction and failing to find one. The recognition that
there was no contradiction to find came independently: Lobachevsky published in
Kazan in 1829, János Bolyai as an appendix to his father's _Tentamen_ in 1832, and
Gauss had reached similar conclusions privately without publishing. Consistency
was only established later, by Beltrami in 1868, whose models include the
projective disc, in which geodesics are chords; Klein in 1871 identified its
metric with Cayley's projective metric, which is why the model carries both
names, and Poincaré's disk and half-plane models arose in the 1880s out of his
work on automorphic functions and differential equations. Gromov's coarse reformulation dates from the 1980s.

## Sources

MIT 18.950 covers the differential-geometric apparatus this page rests on — first
fundamental form, Gaussian curvature, geodesics and Gauss–Bonnet — and is the
reference for why the angle-defect formula is a curvature statement rather than a
hyperbolic curiosity. Wolfram MathWorld is the quickest check on the model
definitions, the standard distance and trigonometric formulas, the variant models,
and the attribution dates. The geometric-deep-learning survey is cited only for
the general claim that the geometry of the domain is a modelling choice with
consequences; the specific hyperbolic-embedding results are flagged as uncited in
the frontmatter.

## Prerequisites and next connections

Understand Euclidean geometry first — hyperbolic geometry is defined by which of
its postulates survive — and enough
[Multivariable Calculus](./multivariable-calculus.md) to read a Riemannian metric
as a quadratic form on tangent vectors. Everything in the formal treatment is a
line element, a geodesic and an area integral; nothing beyond that is assumed.

From here, the natural next step is the positively curved twin, spherical
geometry, and then the non-Euclidean picture that holds the three
constant-curvature cases together — they are best learned as one classification
rather than three subjects. [Complex Analysis](./complex-analysis.md) supplies the
Möbius transformations that are the isometries of both Poincaré models and the
Schwarz–Pick lemma that reads the hyperbolic metric back into function theory, and
[Group Theory](./group-theory.md) is what turns discrete subgroups of
$\mathrm{PSL}(2,\mathbb{R})$ into hyperbolic surfaces. For the machine-learning
direction, the volume-growth argument in the concrete example is the entire
justification for hyperbolic embeddings; read it before reading a paper that
claims one.
