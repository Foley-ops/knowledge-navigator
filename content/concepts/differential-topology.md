---
concept_id: concept.geometry.differential_topology
title: Differential Topology
slug: /concepts/differential-topology
kind: concept
tier: 1
review_state: generated-draft
summary: The study of smooth manifolds up to diffeomorphism, using calculus to extract invariants — degree, transversal intersection numbers, Morse indices — that no smooth deformation can change.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.geometry.manifolds
    note: Every statement here is about smooth manifolds, charts and tangent spaces, so a reader who does not already have those objects cannot parse a regular value or a Morse index.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: The regular value theorem is the implicit function theorem transported to manifolds, and rank, Jacobian and Hessian are used throughout without re-derivation.
  - type: contrasts_with
    target: concept.geometry.differential_geometry
    note: Both study smooth manifolds, but differential geometry measures metric quantities that a deformation changes, while differential topology keeps only what survives every diffeomorphism.
  - type: contributes_to
    target: concept.geometry.algebraic_topology
    note: Morse theory, degree and transversality compute homology, Euler characteristics and intersection numbers from smooth data, supplying algebraic topology with both invariants and general-position arguments.
sources:
  - source_id: source.benedetti.lectures_differential_topology
    title: Lectures on Differential Topology
    url: https://arxiv.org/abs/1907.10297
    source_kind: preprint
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.geometry_of_manifolds
    title: MIT 18.965 Geometry of Manifolds (Fall 2004)
    url: https://ocw.mit.edu/courses/18-965-geometry-of-manifolds-fall-2004/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.nlab.exotic_smooth_structure
    title: 'nLab: exotic smooth structure'
    url: https://ncatlab.org/nlab/show/exotic+smooth+structure
    source_kind: reference-documentation
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.nlab.smooth_manifold
    title: 'nLab: smooth manifold'
    url: https://ncatlab.org/nlab/show/smooth+manifold
    source_kind: reference-documentation
    supports:
      - definition
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: History of differential topology before Milnor
    reason: The registry has no history of the smooth-manifold lineage — its topology history entry covers the point-set and combinatorial side — so the attributions to Morse, Whitney, Sard, Brown, Thom and Smale rest on general mathematical knowledge rather than a cited source.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Differential topology** is the study of smooth manifolds and smooth maps
between them up to diffeomorphism — a topological manifold with a maximal atlas
whose chart transitions are $C^\infty$, and a smooth bijection with smooth
inverse, respectively. Its question is: which features of a smooth manifold are
unchanged by every diffeomorphism?

Crucially, there is no metric: distances, angles, geodesics and curvature are
neither available nor wanted. What is available is calculus — the differential
$df_p$ at a point — and the subject's whole technique is to use calculus to
produce answers that calculus itself cannot change.

## Why it matters

Three things come out of this that nothing else provides.

First, **general position**. Sard's theorem and transversality turn the
hand-waving "after a small perturbation the intersection is clean" into a
theorem. Every argument that begins "choose a generic ..." cashes a cheque
written here.

Second, **existence proofs by counting**. The degree of a map and the index of a
vector field are integers that cannot vary continuously, so showing one non-zero
proves something exists. The hairy ball theorem, Brouwer's fixed point theorem
and the fundamental theorem of algebra all fall out this way.

Third, and most surprising, **smooth is strictly finer than topological**: two
manifolds can be homeomorphic and not diffeomorphic. That was not expected, and
its discovery made differential topology a subject rather than a technique.

## Intuition

The familiar slogan for topology is the rubber sheet you may bend but not tear.
Differential topology is that sheet with the extra rule that every bend, and its
inverse, must be smooth — no creases, no corners.

The analogy breaks in a precise and important place. One expects the smoothness
rule to be a convenience that changes nothing. It is not: there are sheets of the
same rubber that cannot be smoothly bent into each other.

A second image is more useful day to day. Watch the level sets of a smooth
function as its value rises: they are manifolds one dimension lower, and they
change topology only when the value crosses a critical point. The manifold is
thereby assembled from a finite list of pieces, one per critical point.

## Concrete example

Take the torus $T \subset \mathbb{R}^3$ given by

$$
\left(\sqrt{x^2 + y^2} - 2\right)^2 + z^2 = 1 ,
$$

a tube of radius $1$ around the circle of radius $2$ in the $xy$-plane, and let
$f(x,y,z) = x$ — the doughnut stood on edge, measured left to right.

The critical points are the four points of $T$ with $y = z = 0$, namely
$x = -3, -1, 1, 3$. At $x = -3$, $f$ has a local minimum, index $0$; at $x = 3$ a
maximum, index $2$. At $x = \pm 1$ — the inner equator — each point is a saddle
of index $1$: at $x = 1$, moving along the inner equator decreases $x$ while
moving around the tube increases it, and at $x = -1$ the two roles are
exchanged. All four are nondegenerate, so $f$ is Morse with $c_0 = 1$,
$c_1 = 2$, $c_2 = 1$.

The level sets confirm it. For $c \in (-3,-1)$, $f^{-1}(c)$ is one circle; for
$c \in (-1,1)$, two disjoint circles (at $c = 0$, the curves
$(|y| - 2)^2 + z^2 = 1$); for $c \in (1,3)$, one circle again — each a compact
$1$-manifold, as the regular value theorem promises, with the topology changing
only at critical values.

The Morse inequalities give $b_0 \le 1$, $b_1 \le 2$, $b_2 \le 1$, and the Euler
characteristic is forced:

$$
\chi(T) = c_0 - c_1 + c_2 = 1 - 2 + 1 = 0 .
$$

$T$ is connected, closed and orientable, so $b_0 = b_2 = 1$, and $\chi = 0$ then
forces $b_1 = 2$. The inequalities are equalities — this $f$ is a _perfect_ Morse
function — giving $H_0(T) \cong \mathbb{Z}$, $H_1(T) \cong \mathbb{Z}^2$,
$H_2(T) \cong \mathbb{Z}$ from four critical points.

Lay the torus flat instead and use height $z$. The critical set is now two whole
circles, $z = \pm 1$, and nothing above applies. Genericity is not decoration.

## Formal treatment

Let $M^m$ and $N^n$ be smooth manifolds and $f : M \to N$ smooth, with
differential $df_p : T_pM \to T_{f(p)}N$.

**Regular value theorem.** $y \in N$ is a _regular value_ if $df_p$ is surjective
for every $p \in f^{-1}(y)$. Then $f^{-1}(y)$ is a smooth submanifold of $M$ of
dimension $m - n$, and $T_p f^{-1}(y) = \ker df_p$.

**Sard's theorem.** If $f$ is $C^k$ with $k \ge \max(1,\, m - n + 1)$, the set of
critical values has Lebesgue measure zero in $N$, so regular values are dense.
For $C^\infty$ maps the hypothesis is automatic.

**Transversality.** For a submanifold $Z \subseteq N$, write $f \pitchfork Z$ when

$$
\operatorname{im} df_p + T_{f(p)}Z = T_{f(p)}N
\quad \text{for every } p \in f^{-1}(Z).
$$

Then $f^{-1}(Z)$ is a submanifold with
$\operatorname{codim} f^{-1}(Z) = \operatorname{codim} Z$. Thom's transversality
theorem says the transverse maps are residual in $C^\infty(M,N)$, so a
non-transverse map can always be perturbed into one.

**Degree.** Let $M$ be compact, $M$ and $N$ oriented, $N$ connected, $m = n$. For
a regular value $y$,

$$
\deg f = \sum_{p \,\in\, f^{-1}(y)} \operatorname{sign} \det df_p ,
$$

a finite sum, independent of the regular value chosen and invariant under smooth
homotopy.

**Morse theory.** For $f : M \to \mathbb{R}$, a critical point $p$ is
_nondegenerate_ if the Hessian — chart-independent at a critical point — is
nonsingular; its _index_ $\lambda(p)$ is the number of negative eigenvalues. The
Morse lemma gives coordinates in which

$$
f = f(p) - x_1^2 - \cdots - x_\lambda^2 + x_{\lambda+1}^2 + \cdots + x_m^2 .
$$

If $M$ is compact and $f$ Morse, $M$ is homotopy equivalent to a CW complex with
one $\lambda$-cell per index-$\lambda$ critical point, whence
$b_\lambda(M) \le c_\lambda$ and $\chi(M) = \sum_\lambda (-1)^\lambda c_\lambda$.

## Assumptions and requirements

Manifolds are taken Hausdorff and second countable. Drop second countability and
partitions of unity disappear, and with them tubular neighbourhoods, the
auxiliary metrics used as scaffolding, and most perturbation arguments.

Smoothness class is not a formality. Sard's theorem genuinely fails below its
threshold when $m > n$: Whitney constructed a $C^1$ function on the plane that is
non-constant on a connected set of its critical points, so its critical values
contain an interval. For $m \le n$, $C^1$ suffices.

Degree requires $M$ compact (or $f$ proper) and both manifolds oriented; without
orientation only a mod-$2$ degree survives. Morse theory's CW conclusion needs
compact sublevel sets and every critical point nondegenerate — generic, but not
free.

## Uses and applicability

Reach for differential topology when the question is about a smooth object and
the answer should be an integer or a yes/no that no deformation disturbs: must
this vector field vanish, must these two submanifolds intersect, how many
critical points must a function have. It underwrites intersection theory,
characteristic classes, cobordism and surgery theory, and — through genericity
and structural stability — much of
[Dynamical Systems](./dynamical-systems.md). Sard's measure-zero conclusion,
read with [Measure Theory](./measure-theory.md), is why numerical path-following
works from almost every starting point.

Do not reach for it when the quantity you care about is metric — curvature,
volume, geodesic length — or when the space is not smooth. Simplicial complexes,
singular varieties and general topological spaces need combinatorial or algebraic
tools instead.

## Limitations and common mistakes

**Confusing the subject with [Differential Geometry](./differential-geometry.md).**
A curvature computation is not a differential-topology result. Gauss–Bonnet, $\int_M K \, dA = 2\pi\chi(M)$,
is famous precisely because it is the exception: a geometric integral forced to a
topological answer.

**Assuming homeomorphic implies diffeomorphic.** In 1956 Milnor exhibited
manifolds homeomorphic but not diffeomorphic to $S^7$; Kervaire and Milnor later
computed the group $\Theta_7$ of oriented smooth structures on the $7$-sphere as
$\mathbb{Z}/28$. Dimensions $1$, $2$ and $3$ do have unique smooth structures.
Dimension $4$ is the strange one: $\mathbb{R}^4$ admits uncountably many
non-diffeomorphic smooth structures while $\mathbb{R}^n$ for $n \neq 4$ admits
exactly one, and whether $S^4$ admits an exotic structure is open.

**Reading "generic" as "all", or as "few critical points".** Sard bounds the
critical _values_, not the critical points. A constant map is critical
everywhere; its single critical value is still measure zero. And a measure-zero
set can be dense.

**Treating the Morse inequalities as equalities.** The torus above happened to
admit a perfect Morse function; in general $c_\lambda$ exceeds $b_\lambda$, and
the cancellation in the Morse complex has to be computed, not assumed.

**Over-reading degree.** $\deg f = 0$ does not imply $f$ is null-homotopic
between arbitrary manifolds; only the converse always holds. For maps
$S^n \to S^n$, Hopf's theorem does make degree a complete homotopy invariant —
which is why the mistake survives.

## Variants and alternatives

Change the category and you change the subject: TOP (topological manifolds), PL
(piecewise linear) and DIFF (smooth) are genuinely different, and smoothing
theory measures the gap. Within DIFF, cobordism is coarser than diffeomorphism
and correspondingly computable from characteristic numbers.

Among competing toolkits: algebraic topology gives invariants that apply to
non-smooth spaces but is blind to smooth structure; de Rham theory computes
cohomology from forms cheaply but loses torsion. Morse–Bott theory relaxes
nondegeneracy to allow critical submanifolds — what the flat-lying torus needs;
discrete Morse theory moves the bookkeeping to combinatorial complexes; Floer
homology is Morse theory on infinite-dimensional spaces. In dimension $4$,
gauge-theoretic invariants took over where surgery stalls.

## History and attribution

The subject has several strands rather than one founder. Morse developed critical
point theory in the 1920s and 1930s, working on the calculus of variations in the
large. Whitney laid the foundations of smooth manifolds in the 1930s, including
the embedding and immersion theorems. Sard's theorem is due to Sard, with an
earlier special case by A. B. Brown. Thom's cobordism theory in the 1950s put
transversality at the centre.

The landmark is Milnor's 1956 paper on manifolds homeomorphic to the $7$-sphere.
Studying $S^3$-bundles over $S^4$, he found total spaces admitting a Morse
function with exactly two critical points — hence homeomorphic to $S^7$ — yet
distinguished from the standard $S^7$ by an invariant built from the signature
and Pontryagin classes of a coboundary. Kervaire and Milnor's 1963 work then
classified homotopy spheres above dimension $4$, and Smale's h-cobordism theorem
settled the generalised Poincaré conjecture in dimensions at least $5$ around 1960. Dimension $4$ was opened topologically by Freedman in 1982 and made
permanently strange by Donaldson soon after.

## Sources

Benedetti's _Lectures on Differential Topology_ is the working reference for the
core machinery — smooth structures, transversality, Morse theory, handle
decompositions, cobordism — at the level stated here. MIT 18.965 covers the same
ground as a course, adding de Rham cohomology and vector bundles, and is the
better guide to how the tools get used. The nLab entry on smooth manifolds pins
down the definitional conventions, including the Hausdorff and second-countability
hypotheses; the entry on exotic smooth structures backs the exotic-sphere claims
and what remains open in dimension $4$. The pre-Milnor chronology is in no
registry source and is recorded as unresolved.

## Prerequisites and next connections

Read [Manifolds](./manifolds.md) first — charts, tangent spaces, smooth maps —
and have [Multivariable Calculus](./multivariable-calculus.md) available, since
the inverse and implicit function theorems are the engine behind every local
statement here. [Point-Set Topology](./point-set-topology.md) supplies
compactness, connectedness and the meaning of a residual set.

From here, [Differential Geometry](./differential-geometry.md) puts a metric on
the same manifolds; [Algebraic Topology](./algebraic-topology.md) supplies the
homology Morse theory computes and extends it to spaces with no smooth structure
at all. The transversality habit of mind then reappears wherever "generic" is a
technical word, notably in [Dynamical Systems](./dynamical-systems.md).
