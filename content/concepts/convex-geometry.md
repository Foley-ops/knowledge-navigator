---
concept_id: concept.geometry.convex_geometry
title: Convex Geometry
slug: /concepts/convex-geometry
aliases:
  - theory of convex bodies
kind: concept
tier: 1
review_state: generated-draft
summary: The geometry of sets closed under line segments, where hyperplane separation, extreme points and duality do the work that distance and angle do in Euclidean geometry, and where one closure property is enough to make every local minimum global.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: Convex combinations, affine hulls and hyperplanes are all statements about a real vector space and its linear functionals, so none of the definitions can even be written without that structure.
  - type: contributes_to
    target: concept.analysis.functional_analysis
    note: The geometric Hahn-Banach theorems and Krein-Milman are the infinite-dimensional continuation of separation and extreme points, and convexity is what makes the dual space useful at all.
  - type: contrasts_with
    target: concept.geometry.euclidean_geometry
    note: Both live in the same space, but convex geometry keeps only the affine structure plus a linear functional, so its central theorems are invariant under shear while Euclidean congruence is not.
  - type: contributes_to
    target: concept.probability.high_dimensional_statistics
    note: Convex bodies are where high-dimensional concentration is stated and where estimators like the lasso get their geometry, the sparsity of its solutions coming from the vertices of the L1 ball.
sources:
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Rockafellar, Convex Analysis (1970)
    reason: The registry holds no convex analysis or convex geometry monograph. The relative-interior refinements of the separation theorems, the conjugacy calculus and the post-war attribution history are standard there and only partly covered by Boyd and Vandenberghe or by MathWorld.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
  - label: A functional analysis text covering Krein-Milman and non-locally-convex spaces
    reason: No registry source states Krein-Milman with its hypotheses or documents the failure of separation in a topological vector space that is not locally convex, such as the trivial continuous dual of L^p on the unit interval for p between 0 and 1.
    sections:
      - formal-treatment
      - assumptions-and-requirements
claims: []
---

## Definition

**Convex geometry** studies convex sets and the objects built from them. A set
$C$ in a real vector space is **convex** when it contains the whole segment
between any two of its points,

$$
x, y \in C, \ \theta \in [0,1] \ \Longrightarrow \ \theta x + (1-\theta) y \in C .
$$

A function $f$ on a convex domain is **convex** when its epigraph
$\{(x,t) : t \ge f(x)\}$ is a convex set, equivalently when
$f(\theta x + (1-\theta) y) \le \theta f(x) + (1-\theta) f(y)$. Everything else
in the subject follows from that one closure property: a point outside a closed
convex set can be cut off from it by a hyperplane, every boundary point carries
a supporting hyperplane, a compact convex set is rebuilt from its extreme
points, and a closed convex set is exactly the intersection of the half-spaces
containing it.

## Why it matters

Convexity is the dividing line in optimisation, and it buys two specific things.
**Every local minimum is global**, so a method that only ever looks locally
still finds the best value. And **certificates exist**: a feasible point of the
dual problem proves a lower bound on the optimum, and a separating hyperplane
proves that a system of inequalities has no solution at all. An algorithm can
stop and hand you evidence rather than an assertion.

The other reason is geometric. In high dimensions most pictures fail, but
separation and support do not, and they are the language in which convex bodies,
concentration of measure and high-dimensional statistics are written.

## Intuition

A convex set has no dents: from anywhere inside it you see every other point,
and its convex hull is what a rubber band snapped around a set of nails
encloses. Separation is that picture from outside — if $p$ is not in a closed
convex set $C$, walk from $p$ to the nearest point $q$ of $C$; the hyperplane
perpendicular to $p-q$ placed midway has $C$ strictly on one side and $p$ on the
other. That projection argument is the actual proof, not an illustration of one.

Two places it misleads. The nearest point exists because $C$ is closed and the
space is complete with an inner product; in a general normed space it can fail
to exist or to be unique, and separation must come from Hahn-Banach instead. And
the polytope image, in which all the action is at a few vertices, is wrong for
smooth bodies: on a disc every boundary point is extreme.

## Concrete example

Take the triangle $T = \operatorname{conv}\{(0,0),(2,0),(0,2)\}$, which is also
$\{x \ge 0,\ y \ge 0,\ x + y \le 2\}$, and the point $p = (2,2)$.

The nearest point of $T$ to $p$ is $q = (1,1)$: projecting $p$ onto the line
$x+y=2$ gives $p - \tfrac{(2+2)-2}{2}(1,1) = (1,1)$, inside the edge. Take
$a = p - q = (1,1)$ and $b = a^\top \tfrac{p+q}{2} = 3$. On $T$,
$a^\top x = x + y \le 2 < 3$; at $p$, $a^\top p = 4 > 3$. So $x + y = 3$
separates them strictly, with $\lVert p - q \rVert = \sqrt{2}$ of room, and any
$x+y=c$ with $2 < c < 4$ works too.

The same normal supports $T$: $x + y \le 2$ holds with equality at $(2,0)$ and
$(0,2)$. At the vertex $(0,0)$ both $-x \le 0$ and $-y \le 0$ support, and so
does every non-negative combination of them — supporting hyperplanes are not
unique at a corner. The extreme points of $T$ are exactly its three vertices,
and $(0.5,0.5) = 0.5\,(0,0) + 0.25\,(2,0) + 0.25\,(0,2)$ uses three of them, as
Carathéodory's bound of $n+1 = 3$ allows in the plane.

Now the hypothesis that matters. Let $C = \{(x,y) : x > 0,\ y \ge 1/x\}$ and
$D = \{(x,y) : y \le 0\}$. Both are closed, convex and disjoint, but
$(n, 1/n) \in C$ approaches $D$, so their distance is $0$ and the only
separating line is $y = 0$, which touches $D$. Closed plus closed plus disjoint
does not give strict separation; compactness of one of the two sets is precisely
what the strict theorem buys.

## Formal treatment

Work in $\mathbb{R}^n$ with the standard inner product. A **hyperplane** is
$\{x : a^\top x = b\}$ for $a \neq 0$, and it bounds two half-spaces.

**Separating hyperplane theorem.** If $C, D \subseteq \mathbb{R}^n$ are
non-empty, convex and disjoint, there exist $a \neq 0$ and $b$ with
$a^\top x \le b$ for $x \in C$ and $a^\top x \ge b$ for $x \in D$. If in
addition $C$ is closed and $D$ compact, both inequalities can be made strict.

**Supporting hyperplane theorem.** If $C$ is convex and $x_0$ is a boundary
point of $C$, there is $a \neq 0$ with $a^\top x \le a^\top x_0$ for all
$x \in C$: separate $x_0$ from the interior of $C$, and if that interior is
empty, $C$ lies in a proper affine subspace and any hyperplane containing it
works.

**Extreme points.** $x \in C$ is **extreme** if $x = \theta y + (1-\theta) z$
with $y,z \in C$ and $\theta \in (0,1)$ forces $y = z = x$. Minkowski's theorem:
a compact convex $C \subseteq \mathbb{R}^n$ equals
$\operatorname{conv}(\operatorname{ext} C)$. **Krein-Milman**: a compact convex
subset of a locally convex Hausdorff topological vector space is the _closed_
convex hull of its extreme points, and the closure cannot be dropped in general.

**Carathéodory.** Every point of $\operatorname{conv}(S)$, $S \subseteq
\mathbb{R}^n$, is a convex combination of at most $n+1$ points of $S$.

**Polytopes.** By the Minkowski-Weyl theorem a bounded intersection of finitely
many half-spaces is the convex hull of finitely many points, and conversely. The
two descriptions can differ wildly in size: the $n$-cube has $2n$ facets and
$2^n$ vertices.

**Duality.** The **support function** $h_C(a) = \sup_{x \in C} a^\top x$
determines a closed convex set, since
$C = \{x : a^\top x \le h_C(a) \text{ for all } a\}$. The **polar** is
$C^\circ = \{y : y^\top x \le 1 \text{ for all } x \in C\}$, and
$C^{\circ\circ} = C$ when $C$ is closed, convex and contains the origin. On the
function side the **Fenchel conjugate**
$f^*(a) = \sup_x \big(a^\top x - f(x)\big)$ satisfies $f^{**} = f$ exactly for
closed proper convex $f$, and Lagrange duality is that fact in disguise.

**Local implies global.** Let $f$ be convex on convex $C$ with $x^\star$ a local
minimiser. For $y \in C$ and $t \in (0,1]$,
$f\big(x^\star + t(y - x^\star)\big) \le (1-t) f(x^\star) + t f(y)$, so if
$f(y) < f(x^\star)$ the value drops below $f(x^\star)$ arbitrarily near
$x^\star$, contradicting local minimality.

## Assumptions and requirements

Scalars must be real and ordered, since $[0,1]$-combinations are the whole
definition: there is no convexity over a finite field, and $\mathbb{C}^n$ counts
only because it is $\mathbb{R}^{2n}$.

Convexity is an affine property, not a topological one. It survives affine maps,
arbitrary intersections, Minkowski sums and products; it does not survive unions
or nonlinear reparameterisation. The parabola $\{(x,y) : y = x^2\}$ is not
convex, yet $(x,y) \mapsto (x, y - x^2)$ turns it into a line.

Separation in $\mathbb{R}^n$ needs only non-empty, convex and disjoint. Strict
separation needs positive distance, which closedness alone does not give (the
$1/x$ example above); one set compact and the other closed suffices. In infinite
dimensions these theorems come from Hahn-Banach and need either a convex set
with non-empty interior or a locally convex space — where local convexity fails,
the continuous dual can be trivial and separation fails outright.

Extreme points need compactness: a half-space or a line is closed and convex and
has none, so Krein-Milman says nothing about unbounded sets. Duality needs
closedness, since polarity and conjugation return the closed convex hull of what
you started with. And statements phrased with "interior" go vacuous for a set
inside a lower-dimensional affine subspace, where the relative interior is the
right notion.

## Uses and applicability

Convex optimisation is the main consumer — linear, quadratic, second-order cone
and semidefinite programs — where the work is to express a problem using
convexity-preserving operations and the payoff is a global optimum with a dual
certificate. In statistics and machine learning, convex surrogate losses (hinge,
logistic) replace the intractable 0-1 loss so that empirical risk minimisation
becomes solvable; the support vector machine's maximum margin is literally a
separation statement; and the sparsity of the lasso comes from the $\ell_1$
ball having its extreme points on the coordinate axes. Convex relaxation is the
standard approximate attack on combinatorial problems, and convex bodies are the
setting in which high-dimensional concentration results are stated.

Do not reach for it when the distinct local optima are the phenomenon you care
about, or when the relaxation is loose enough that its optimum says nothing
about the original problem. Convexifying is a modelling decision, and a bad one
if the convex proxy answers a different question.

## Limitations and common mistakes

_Convex does not mean easy._ Convexity removes spurious local minima; it does
not promise a fast algorithm. Large semidefinite programs are expensive, and
deciding whether an arbitrary given description is convex is itself intractable
in general — which is why disciplined convex programming builds problems from
certified-convex atoms instead of testing convexity afterwards.

_Non-convex does not mean hopeless._ Deep network training objectives are wildly
non-convex and stochastic gradient descent finds useful solutions anyway; the
guarantees are gone, not the practice. Several non-convex problems, principal
component analysis among them, have benign landscapes where every local minimum
is global for structural reasons unrelated to convexity. What convexity uniquely
supplies is certificates, not sole access to good answers.

_Convex does not imply a unique minimiser._ A convex function can be flat along
a whole face. Strict convexity gives uniqueness _if_ a minimiser exists;
existence needs coercivity or compactness.

Other recurring errors: treating convex sublevel sets as evidence of a convex
objective (that is quasiconvexity, and a local minimum of a quasiconvex function
need not be global); writing an equality constraint $g(x) = 0$ with convex $g$
and expecting a convex feasible set, when convexity of $g$ guarantees nothing by
itself — affine $g$ is what standard form requires, and it is sufficient rather
than necessary; reading "separating" as "strictly separating"; and assuming the
supporting hyperplane at a boundary point is unique, when that holds only at
smooth points and the normal cone is the correct object elsewhere.

## Variants and alternatives

**Convex cones** organise the field by cone: the non-negative orthant gives
linear programming, the second-order cone and the positive semidefinite cone
give steadily more modelling power at steadily higher cost per iteration, each
with its dual cone. **Polytope theory** is the combinatorial branch, concerned
with face lattices, $f$-vectors and the cost of converting between vertex and
facet descriptions. **Brunn-Minkowski theory** is the metric branch:
$\lvert A + B\rvert^{1/n} \ge \lvert A\rvert^{1/n} + \lvert B\rvert^{1/n}$ for
non-empty compact $A, B \subseteq \mathbb{R}^n$, together with mixed volumes and
the isoperimetric inequality.

Weakenings trade theorems for coverage. **Quasiconvexity** keeps convex sublevel
sets and bisection but loses local-implies-global. **Geodesic convexity**
transports the definition to manifolds, so functions convex along geodesics on
the positive definite cone behave well even where the ambient chart is
unhelpful. **Difference-of-convex programming** handles objectives $f - g$ with
both parts convex. The discrete counterpart is **submodularity**, and the
connection is exact: a set function is submodular precisely when its Lovász
extension is convex, which is why submodular minimisation is tractable.

As alternatives for the optimisation job, local non-convex methods are cheap but
certify nothing, branch-and-bound certifies global optimality at exponential
worst-case cost, and sum-of-squares hierarchies buy tightness with rapidly
growing convex relaxations.

## History and attribution

Convexity became a subject of its own with Brunn in the 1880s and Minkowski
around 1900. Minkowski's motivation was number-theoretic — counting lattice
points in convex bodies — and along the way he introduced support functions,
mixed volumes and the gauge functional named after him. Carathéodory's bound on
convex combinations and Helly's intersection theorem followed shortly after.

The analytic turn came with the Hahn-Banach theorem, proved by Hahn in 1927 and
independently by Banach in 1929, whose geometric separation form was developed
in the 1930s, with Mazur's theorem the usual reference point. Krein and Milman
proved the extreme point theorem in 1940.

Convex analysis as a named discipline is post-war, driven by optimisation and
mathematical economics: Fenchel's conjugate duality in the late 1940s and
Rockafellar's 1970 book consolidated it, while Dantzig's simplex method (1947)
and the Kuhn-Tucker conditions (1951, anticipated in Karush's earlier thesis)
supplied the problems. Polynomial-time convex optimisation arrived with
Khachiyan's ellipsoid method (1979) and Karmarkar's interior point method
(1984), extended to general convex programs by Nesterov and Nemirovskii's
self-concordant barrier theory in the 1990s.

## Sources

Boyd and Vandenberghe's _Convex Optimization_ is the working reference for
almost all of this: convex sets and functions, the separating and supporting
hyperplane theorems with their hypotheses, polyhedra, cones and their duals,
conjugate functions, and the optimisation consequences. MathWorld supplies
statements and attributions for the named classical theorems — Carathéodory,
Helly, Krein-Milman, Brunn-Minkowski. Shalev-Shwartz and Ben-David cover the
machine learning side: convex learning problems, surrogate losses and the
support vector machine. Goodfellow, Bengio and Courville is cited only for deep
learning's non-convex objective.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) first — convex combinations, affine
hulls and hyperplanes are statements about linear structure and linear
functionals. A little [Real Analysis](./real-analysis.md) supplies the
closedness and compactness the theorems turn on.

From here, [Functional Analysis](./functional-analysis.md) is the natural
continuation, since Hahn-Banach, weak topologies and Krein-Milman are separation
and extreme points in infinite dimensions, while
[Banach Spaces](./banach-spaces.md) and [Hilbert Spaces](./hilbert-spaces.md)
are where the nearest-point projection argument does or does not survive.
[Matrix Theory](./matrix-theory.md) supplies the positive semidefinite cone, and
[High-Dimensional Statistics](./high-dimensional-statistics.md) with
[Concentration Inequalities](./concentration-inequalities.md) show what convex
bodies look like when the dimension is large.
