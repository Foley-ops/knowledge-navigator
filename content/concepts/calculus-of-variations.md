---
concept_id: concept.analysis.calculus_of_variations
title: Calculus of Variations
slug: /concepts/calculus-of-variations
aliases:
  - variational calculus
kind: concept
tier: 1
review_state: generated-draft
summary: The branch of analysis that optimises over a space of functions rather than a space of points, converting "which curve minimises this integral?" into a differential equation the curve must satisfy.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: generalizes
    target: concept.analysis.multivariable_calculus
    note: The domain of the objective changes from a finite-dimensional space to a space of functions, and the condition $\nabla f = 0$ becomes the Euler–Lagrange equation.
  - type: requires
    target: concept.analysis.ordinary_differential_equations
    note: For a one-dimensional integral the Euler–Lagrange condition is a second-order ODE with two-point boundary data, so extracting an extremal means solving a boundary-value problem.
  - type: contributes_to
    target: concept.analysis.partial_differential_equations
    note: Energy functionals over a multidimensional domain have PDEs as their stationarity conditions, and the direct method is a standard way to prove those PDEs have solutions.
  - type: requires
    target: concept.analysis.banach_spaces
    note: The direct method is stated in a reflexive Banach space, where coercivity plus weak sequential compactness of bounded sets supplies a candidate minimiser.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - concrete-example
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - intuition
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.partial_differential_equations
    title: MIT 18.152 Introduction to Partial Differential Equations (Fall 2011)
    url: https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/
    source_kind: lecture-or-course
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

The **calculus of variations** studies optimisation problems whose unknown is an
entire function. Given a _functional_ $J$ that assigns a real number to each
function in an admissible class $\mathcal{A}$, one asks which $y \in \mathcal{A}$
makes $J$ smallest, largest, or merely stationary. The classical case is the
one-dimensional integral functional

$$
J[y] \;=\; \int_a^b L\bigl(x, y(x), y'(x)\bigr)\,dx,
\qquad
\mathcal{A} = \{\, y \in C^1([a,b]) : y(a) = \alpha,\; y(b) = \beta \,\},
$$

where the **Lagrangian** $L(x, u, p)$ is a given function of three real
arguments. There is no gradient to set to zero. Stationarity is defined one
direction at a time: $y$ is stationary if
$\tfrac{d}{d\varepsilon} J[y + \varepsilon\eta]\big|_{\varepsilon=0} = 0$ for
every perturbation $\eta$ vanishing at $a$ and $b$.

## Why it matters

Most differential equations of physics and geometry are stationarity conditions
in disguise: Newton's equations from stationary action, Laplace's equation from
the Dirichlet energy $\int |\nabla u|^2$, geodesics from arclength, minimal
surfaces from area. Stating a model as "this quantity is extremised" is often
more robust than stating the equation — coordinate changes become substitutions
in $L$, constraints become multipliers, symmetries produce conservation laws.

It also runs in both directions: forwards it turns an infinite-dimensional search
into a boundary-value problem you can solve, and backwards it proves certain PDEs
have solutions at all, by exhibiting the solution as an energy minimiser instead
of constructing it.

## Intuition

In $\mathbb{R}^n$ a point is stationary when every directional derivative
vanishes. Here the directions are functions: perturbations $\eta$ respecting the
boundary conditions. The first variation is that directional derivative, and the
Euler–Lagrange equation says the factor multiplying $\eta$ inside the integral is
zero everywhere — an infinite family of scalar equations collapsed into one
pointwise identity.

The analogy breaks in two places, and both matter. In $\mathbb{R}^n$ a
continuous coercive function attains its minimum because closed bounded sets are
compact; in infinite dimensions the closed unit ball is never compact, so a
minimising sequence may converge to nothing, or only weakly to something whose
energy is strictly larger. And "stationary" depends on which perturbations you
allow: a curve can beat all nearby curves with nearby slopes (a _weak_ minimum)
and still lose to one that wiggles steeply (no _strong_ minimum).

## Concrete example

Two coaxial rings of radius $R = 2$ sit at $x = \pm a$ with $a = 1$. What surface
of revolution spanning them has least area? Writing the profile as $y(x) > 0$,
the area is $2\pi J[y]$ with $L = y\sqrt{1 + y'^2}$. Since $L$ has no explicit
$x$, the Beltrami identity $L - y' \partial_{y'} L = c$ applies and, by symmetry
about $x = 0$, simplifies to

$$
\frac{y}{\sqrt{1 + y'^2}} = c
\quad\Longrightarrow\quad
y(x) = c \cosh\!\left(\frac{x}{c}\right) .
$$

The boundary condition $c \cosh(1/c) = 2$ has **two** roots,
$c \approx 0.4702$ and $c \approx 1.6967$. Both are extremals; the second-order
test separates them. The area of a catenoid is
$\pi c\,(2a + c \sinh(2a/c))$, giving $27.38$ for the deep neck and $23.97$ for
the shallow one. The competitor is the **Goldschmidt solution** — two flat discs
joined by a degenerate thread — with area $2\pi R^2 = 8\pi \approx 25.13$.

So the shallow catenoid wins here, the deep one is not minimising, and the disc
pair is second. Pull the rings apart and the ranking changes: past
$a/R \approx 0.5277$ the Goldschmidt solution beats either catenoid, and past
$a/R \approx 0.6627$ the equation $c \cosh(a/c) = R$ has no root, so no smooth
minimiser exists in $\mathcal{A}$ at all — where a real soap film snaps.

## Formal treatment

Assume $L \in C^2$ in all three arguments and let $y \in \mathcal{A}$ be
stationary. For $\eta \in C^1([a,b])$ with $\eta(a) = \eta(b) = 0$, put
$\phi(\varepsilon) = J[y + \varepsilon \eta]$. Differentiating under the integral
sign (legitimate by the $C^2$ hypothesis and compactness of $[a,b]$) gives

$$
\delta J[y;\eta] \;=\; \phi'(0) \;=\; \int_a^b \left( \frac{\partial L}{\partial u}\,\eta
+ \frac{\partial L}{\partial p}\,\eta' \right) dx \;=\; 0 ,
$$

with the partials evaluated at $(x, y(x), y'(x))$. Integrating the second term by
parts kills the boundary term, and the **fundamental lemma** — if
$\int_a^b f\eta = 0$ for all such $\eta$ and $f$ is continuous, then
$f \equiv 0$ — yields the **Euler–Lagrange equation**

$$
\frac{\partial L}{\partial u} - \frac{d}{dx}\!\left( \frac{\partial L}{\partial p} \right) = 0 ,
\qquad a < x < b .
$$

Writing $\tfrac{d}{dx}\partial_p L$ presumes $y \in C^2$; the du Bois-Reymond
form $\partial_p L = \int_a^x \partial_u L\,dt + C$ needs only $y \in C^1$, and
regularity theory upgrades $y$ to $C^2$ wherever $\partial^2_{pp} L \neq 0$. The
boundary term vanished only because $\eta$ was pinned: a free endpoint forces the
**natural boundary condition** $\partial_p L = 0$ there.

Euler–Lagrange is necessary but not, in general, sufficient — though when $L$ is
convex in $(u, p)$ any admissible solution is automatically a global minimiser.
The classical sufficient package for a weak local minimum is the strict
**Legendre** condition
$\partial^2_{pp} L > 0$ along the extremal plus **Jacobi's** condition that no
point conjugate to $a$ lies in the interval; strong minima need Weierstrass's
excess-function condition too.

Existence is a separate question, answered by the **direct method**. Let $X$ be a
reflexive Banach space (in practice a Sobolev space $W^{1,p}$, $1 < p < \infty$)
and $J : X \to \mathbb{R} \cup \{+\infty\}$ be

1. **coercive**: $J[u] \to \infty$ as $\|u\| \to \infty$; and
2. **sequentially weakly lower semicontinuous**: $u_k \rightharpoonup u$ implies
   $J[u] \le \liminf_k J[u_k]$.

Then $J$ attains its infimum: a minimising sequence is bounded by coercivity,
reflexivity extracts a weakly convergent subsequence, and lower semicontinuity
says the weak limit does at least as well. Tonelli's theorem supplies condition 2
from convexity of $L$ in its gradient argument plus a lower bound. What this buys
is a minimiser in a Sobolev space, not a smooth one.

## Assumptions and requirements

The derivation above needs $L$ twice continuously differentiable, the admissible
class closed under the perturbations used, and $J$ finite near $y$. Drop
differentiability of $L$ and the first variation may not exist; drop the boundary
pinning and extra terms survive. The fundamental lemma needs continuity of the
bracket — for merely integrable $f$ it holds only almost everywhere.

The direct method needs reflexivity (so $L^1$ and $W^{1,1}$ are out), coercivity
(without it the infimum can be $-\infty$), and weak lower semicontinuity, which
is where convexity in $y'$ enters. Non-convex Lagrangians genuinely fail:
minimising sequences oscillate ever faster, the infimum is not attained, and the
honest object is a relaxed problem or a Young measure, not a function.

## Uses and applicability

Reach for it when the quantity you care about is an integral over an unknown
function and you want either the equation it satisfies or a proof that a
minimiser exists: Lagrangian mechanics, geodesics, minimal surfaces, optimal
shapes, elasticity, image-processing energies such as total variation,
maximum-entropy distributions, elliptic PDEs in weak form. The adjoint-state
derivation for continuous-depth neural models is the same computation.

Do not reach for it when the objective is not differentiable in the relevant
sense, when the true unknown is a finite parameter vector, or when the minimiser
is expected to be discontinuous — free-discontinuity problems need a space that
admits jumps and a different existence theory.

## Limitations and common mistakes

The dominant mistake is reading a solution of Euler–Lagrange as a minimum. It is
a stationary point: it can be a maximum, a saddle, or a local minimum a distant
competitor beats, as the deep catenoid shows. The second is assuming a minimum
exists because the functional is bounded below. Weierstrass destroyed that with
$J[y] = \int_{-1}^{1} (x y')^2 dx$ subject to $y(\pm 1) = \pm 1$: the infimum is
$0$, approached by ever steeper transitions through the origin, and no admissible
$y$ attains it, since $xy' \equiv 0$ would force $y$ locally constant.

A third is treating the Euler–Lagrange equation as solvable just because it is an
ODE: two-point boundary-value problems routinely have no solution or several. A
fourth is expecting smoothness — the direct method delivers a Sobolev minimiser,
and promoting it to a classical solution is a separate theorem.

## Variants and alternatives

Extensions that stay inside the theory: **higher derivatives** in $L$ give
higher-order equations; **multiple integrals** give PDEs; **isoperimetric
constraints** ($\int G = \text{const}$) take one Lagrange multiplier,
**holonomic** ones a multiplier function. The **Hamiltonian** formulation applies
the Legendre transform in $y'$, turning one second-order equation into a
first-order system with conserved structure.

The genuinely different competitors: **optimal control**, whose Pontryagin
maximum principle handles constrained controls smooth variations cannot reach;
**dynamic programming** and the Hamilton–Jacobi–Bellman equation, buying a
sufficient condition and a value function at the cost of a PDE in higher
dimension; **discretise-then-optimise** methods (Ritz, Galerkin, finite
elements), which minimise over a finite-dimensional subspace and never form
Euler–Lagrange at all; and **minimax** methods such as the mountain-pass theorem,
which find saddle critical points the direct method cannot see.

## History and attribution

The subject is usually dated to Johann Bernoulli's 1696 challenge to find the
**brachistochrone**, the curve of fastest descent; Newton, Leibniz, Jakob
Bernoulli and l'Hôpital each solved it ad hoc. Euler made it a method in his 1744
treatise on curves with maximal or minimal properties, deriving the equation now
named for him by a limiting argument over polygons. Lagrange, in the 1750s,
replaced that construction with the $\delta$-calculus — perturb the whole curve
at once — and Euler adopted the name.

The second-order and existence theory came much later: Legendre's
second-variation condition, Jacobi's conjugate points, and Weierstrass's
treatment of strong minima, whose critique of Riemann's Dirichlet principle
showed that assuming the infimum is attained is not harmless. Hilbert
rehabilitated that principle around 1900 and posed the analyticity of minimisers
of regular variational problems as his nineteenth problem and the existence of
solutions of boundary-value problems as his twentieth, with the twenty-third
asking for further development of the calculus of variations itself; Tonelli's
direct method followed, and Noether's 1918 theorem tied symmetries of $L$ to
conservation laws.

## Sources

MathWorld is the quick reference for the standard statements and notation:
Euler–Lagrange, the Beltrami identity, the catenoid and the Goldschmidt solution,
the brachistochrone's history. MIT 18.02 supplies the finite-dimensional picture
this subject generalises — directional derivatives, stationary points, Lagrange
multipliers. MIT 18.100A holds the machinery behind the existence theory:
compactness, semicontinuity, and the gap between an infimum and a minimum that
Weierstrass exploited. MIT 18.152 covers the PDE side.

## Prerequisites and next connections

Read [Single Variable Calculus](./single-variable-calculus.md) and
[Multivariable Calculus](./multivariable-calculus.md) first: the first variation
is a directional derivative and nothing more. Solving what Euler–Lagrange
produces needs
[Ordinary Differential Equations](./ordinary-differential-equations.md),
specifically boundary-value rather than initial-value problems.

From here, [Partial Differential Equations](./partial-differential-equations.md)
is where multidimensional functionals lead and where the existence proofs pay
off. [Functional Analysis](./functional-analysis.md), with its Banach and Sobolev
spaces, is where the direct method is actually stated;
[Real Analysis](./real-analysis.md) and
[Measure Theory](./measure-theory.md) supply the compactness, semicontinuity and
convergence arguments that make it work.
