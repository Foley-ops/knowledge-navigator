---
concept_id: concept.analysis.dynamical_systems
title: Dynamical Systems
slug: /concepts/dynamical-systems
aliases:
  - dynamical system
kind: concept
tier: 1
review_state: generated-draft
summary: The study of a state space carrying a fixed evolution rule, asking not what the trajectory through a point is but what the whole family of trajectories does in the long run — where it settles, what it circles, and which of that structure survives a perturbation of the rule.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.ordinary_differential_equations
    note: A continuous-time system is the solution operator of an autonomous ODE, so Picard-Lindelof existence and uniqueness is what makes the flow a well-defined map at all.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: The evolution rule in continuous time is a vector field on an open subset of $\mathbb{R}^n$, and its linearisation at a fixed point is the Jacobian of that field.
  - type: requires
    target: concept.linear_algebra.spectral_theory
    note: Stability and hyperbolicity are conditions on the spectrum of the derivative at a fixed point — real parts for flows, moduli for maps — so the local classification is an eigenvalue computation.
  - type: prerequisite_of
    target: concept.analysis.chaos
    note: Sensitive dependence, strange attractors and topological transitivity are all properties of orbits and invariant sets, which is what this page defines.
sources:
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **dynamical system** is a state space $X$ together with a time set $T$ and an
evolution rule $\Phi : T \times X \to X$ satisfying

$$
\Phi^0 = \mathrm{id}_X, \qquad \Phi^{t+s} = \Phi^t \circ \Phi^s
\quad \text{for all } t, s \in T .
$$

Here $\Phi^t(x) = \Phi(t,x)$ is the state reached from $x$ after time $t$. When
$T = \mathbb{R}$ or $\mathbb{R}_{\ge 0}$ the system is a **flow**; when
$T = \mathbb{Z}$ or $\mathbb{N}$ it is a **map**, and $\Phi^n = F^n$ is the
$n$-fold iterate of the single map $F = \Phi^1$. The group law is exactly the
statement that the rule ignores absolute time: the system is autonomous, and
where you are is all that determines where you go next.

## Why it matters

Almost no nonlinear equation of interest has a closed-form solution. The
qualitative viewpoint sidesteps that by asking questions whose answers need no
formula: does the state settle, oscillate or wander; how many long-run regimes
are there; how does that change as a parameter is turned?

Those answers are also more robust than formulas. "The origin is a saddle" is a
statement about the geometry of the orbit family, and it survives small
perturbations of the equations — which matters, because the equations are a model
and the model is wrong in the fifth decimal place. And since the same axioms cover
iterated maps, the vocabulary transfers unchanged to Newton's method or a
numerical integrator.

## Intuition

Picture $X$ as a space in which each point is a complete instantaneous
description of the system, and the rule as an arrow attached to every point. A
trajectory is the path a speck follows when dropped into this frozen fluid.
Equilibria are the stagnation points; periodic orbits are closed streamlines;
attractors are drains.

The analogy breaks in two places. First, the "fluid" need not conserve volume: a
dissipative system contracts it, which is why an attractor can be far smaller than
the space it sits in, and only divergence-free systems behave incompressibly.
Second, a map has no fluid at all — points jump, so a discrete orbit in the plane
may cross itself where a planar flow may not. That difference is why a
one-dimensional map can be chaotic and a one-dimensional flow cannot.

## Concrete example

Take the **logistic map** $f_r(x) = r x (1-x)$ on $[0,1]$. Its fixed points solve
$f_r(x)=x$: they are $x=0$ and $x^\ast = 1 - 1/r$. Since $f_r'(x) = r(1-2x)$, the
multiplier at $x^\ast$ is

$$
f_r'(x^\ast) = r\left(1 - 2\left(1 - \tfrac{1}{r}\right)\right) = 2 - r .
$$

At $r = 2.8$, $x^\ast = 0.642857\ldots$ with multiplier $-0.8$. From
$x_0 = 0.2$ the orbit runs
$0.2,\, 0.448,\, 0.69243,\, 0.59632,\, 0.67402,\, 0.61520,\ldots$, and the errors
$x_n - x^\ast$ are $0.0496,\ -0.0465,\ 0.0312,\ -0.0277$. They alternate sign, as
a negative multiplier predicts, and shrink over two steps by factors $0.63$ and
$0.59$ against the predicted $(-0.8)^2 = 0.64$; the gap is the quadratic term,
still not negligible this far out.

Turn $r$ up to $3.2$. Now $2 - r = -1.2$ has modulus above one, so
$x^\ast = 0.6875$ has gone repelling. What took over is a period-2 orbit,
$\{0.799455\ldots,\ 0.513045\ldots\}$, whose multiplier is the product of the
derivatives around the cycle, $-r^2 + 2r + 4 = 0.16$ — comfortably inside the
unit circle, so the two-cycle attracts. Nothing was solved; the long-run
behaviour came off two derivatives.

## Formal treatment

The **orbit** of $x$ is $\mathcal{O}(x) = \{\Phi^t(x) : t \in T\}$. A set $S$ is
**invariant** if $\Phi^t(S) = S$ for all $t$. The **$\omega$-limit set** collects
everything the forward orbit returns to arbitrarily late,

$$
\omega(x) = \{\, y \in X : \Phi^{t_n}(x) \to y \text{ for some } t_n \to \infty \,\},
$$

and when the forward orbit has compact closure it is nonempty, compact and
invariant — connected as well for a flow, but not in general for a map, where the
attracting two-cycle above is already a disconnected $\omega$-limit set.
Nonemptiness and compactness are the metric-space half, out of compactness of the
orbit closure; invariance, and connectedness for a flow, need continuity of
$\Phi$. A **fixed point** $p$
has $\Phi^t(p) = p$ for all $t$ (so $f(p)=0$ for a flow $\dot x = f(x)$, or
$F(p)=p$ for a map); a **periodic orbit** has $\Phi^{T}(x) = x$ for some $T>0$.

Stability has two independent halves. $p$ is **Lyapunov stable** if every
neighbourhood $V$ of $p$ contains a neighbourhood $U$ with
$\Phi^t(U) \subseteq V$ for all $t \ge 0$, and **attracting** if
$\Phi^t(x) \to p$ for all $x$ nearby. **Asymptotically stable** means both.

Local behaviour is decided by **linearisation**: for $C^1$ $f$ with $f(p)=0$, set
$A = Df(p)$, and call $p$ **hyperbolic** if no eigenvalue of $A$ has zero real
part (for a map: no eigenvalue of $DF(p)$ has modulus $1$).

> **Hartman–Grobman.** Let $f$ be $C^1$ on an open $U \subseteq \mathbb{R}^n$
> with hyperbolic equilibrium $p$, and $A = Df(p)$. Then there are neighbourhoods
> $V \ni p$, $W \ni 0$ and a homeomorphism $h : V \to W$ with $h(p)=0$ such that
> $h(\Phi^t(x)) = e^{tA} h(x)$ whenever both sides are defined.

Near a hyperbolic fixed point the nonlinear system is therefore a continuous
deformation of its own linear part, and the spectrum settles everything: all
$\operatorname{Re}\lambda < 0$ gives asymptotic stability, any
$\operatorname{Re}\lambda > 0$ instability. So $\dot x = Ax$ with
$A = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$, eigenvalues $-1$ and $-2$,
is a stable node, and the origin stays asymptotically stable under every
higher-order $C^1$ perturbation $\dot x = Ax + g(x)$ — one with $g(0)=0$ and
$Dg(0)=0$, or more generally any $g$ small enough in $C^1$ norm near the origin to
leave the eigenvalues in the left half-plane. Merely asking $g(0)=0$ is not
enough: $g(x)=3x$ moves the eigenvalues to $+2$ and $+1$ and turns the origin into
a source. But
$h$ is only a homeomorphism: differentiable conjugacy needs non-resonance
conditions on the eigenvalues. The invariant manifolds behave better — for $C^k$
$f$, the stable manifold theorem gives $C^k$ stable and unstable manifolds tangent
to the corresponding eigenspaces.

An **attractor** is, loosely, a compact invariant set $A$ with a trapping
neighbourhood $U$ where $\Phi^t(U) \subseteq U$ for $t>0$ and
$\bigcap_{t>0}\Phi^t(U) = A$, plus an indecomposability condition. That last
clause is where definitions diverge — topological transitivity, Milnor's
measure-theoretic version and others disagree on edge cases, and none is settled.

## Assumptions and requirements

**Autonomy.** The group law fails outright for $\dot x = f(t,x)$; the repair is
to add $t$ as a coordinate, at the cost of destroying every fixed point you had.

**Completeness.** For $\Phi^t$ to exist for all $t$, solutions must not escape in
finite time. $\dot x = x^2$ blows up at $t = 1/x_0$ and generates only a local
flow; compactness of $X$, or a trapping region, is the usual fix.

**Regularity.** Local Lipschitz continuity buys uniqueness, without which "the"
orbit through a point is not a thing. $C^1$ is what linearisation needs.

**Hyperbolicity.** Hartman–Grobman is false without it. The system
$\dot x = -y + a x (x^2+y^2)$, $\dot y = x + a y(x^2+y^2)$ linearises to
eigenvalues $\pm i$ for every $a$, yet in polar coordinates $\dot r = a r^3$,
$\dot\theta = 1$: a stable spiral for $a<0$, unstable for $a>0$. The linear part
cannot tell.

**Precompactness.** Drop it and $\omega(x)$ can be empty; the limit-set machinery
then says nothing.

## Uses and applicability

Reach for this view when the rule is fixed and the question is about the long run,
or about how the answer changes with a parameter: population and epidemic models,
oscillating circuits, control design via Lyapunov functions, and numerical
analysis, where a solver _is_ a map and its stability region is a statement about
that map's fixed points.

Do not reach for it when you need the solution's value at a particular time — that
is the province of
[Ordinary Differential Equations](./ordinary-differential-equations.md) and its
numerical methods — or when the forcing is genuinely non-autonomous and aperiodic.
In high dimension, phase-portrait intuition quietly stops working, and the honest
tools become invariant measures and Lyapunov exponents.

## Limitations and common mistakes

The most frequent error is trusting linearisation at a non-hyperbolic point. With
an eigenvalue on the imaginary axis the linear part is genuinely inconclusive:
$\dot x = -x^3$ and $\dot x = x^3$ share a linearisation and have opposite
stability. You need a centre manifold reduction or a Lyapunov function.

The second is conflating attraction with Lyapunov stability. They are
independent: on the circle, $\dot\theta = 1 - \cos\theta$ has a unique fixed point
at $\theta = 0$ attracting every orbit, yet points just past it travel all the way
around before returning, so it is not Lyapunov stable.

Third, assuming an attractor is a point or a cycle. Attractors can be Cantor sets,
tori or fractal invariant sets, and in a simulation a long transient is easily
mistaken for one.

Fourth, a numerically integrated trajectory of a sensitive system is not the true
trajectory through your initial condition. Shadowing results do not say otherwise:
they assert that _some_ true orbit stays near the computed one.

Finally, this subject is not "solving differential equations". A system solvable
in closed form can still have open questions about its global orbit structure.

## Variants and alternatives

**Topological dynamics** studies orbit structure with only continuity and a
metric. **Ergodic theory** adds an invariant measure and studies time averages
(Birkhoff's theorem), the right frame in high dimension where individual orbits
are hopeless. **Hyperbolic dynamics** (Anosov, Axiom A) buys strong
structural-stability theorems at the price of assumptions few real systems meet.
**Hamiltonian dynamics** conserves phase-space volume, so it has no attractors at
all. **Complex dynamics** iterates holomorphic maps and gets Julia and Mandelbrot
sets; **random dynamical systems** make the rule stochastic.

As competing approaches: direct simulation answers concrete questions and no
structural ones, while transfer-operator and Koopman methods trade a
finite-dimensional nonlinear system for an infinite-dimensional linear one —
exact, but the difficulty moves into spectral approximation.

## History and attribution

The qualitative viewpoint is Henri Poincaré's, developed through the 1880s and
1890s while he worked on the three-body problem and the stability of the solar
system. Failing to find solution formulas, he studied the geometry of the orbits
instead, introduced return maps, and found the homoclinic tangles that are the
first recognisable picture of chaos. Independently and at nearly the same time,
Aleksandr Lyapunov's 1892 thesis built the general theory of stability of motion.

George Birkhoff extended the programme through the 1910s to the 1930s and proved
the pointwise ergodic theorem in 1931. Philip Hartman and David Grobman proved the
linearisation theorem independently around 1959–1960, and Stephen Smale's
horseshoe reshaped the field in the 1960s. The logistic map became the canonical
example of complicated behaviour from a trivial rule after Robert May's 1976
survey in the ecological literature.

## Sources

**MIT 18.03** is the practical backbone: phase portraits, the classification of
planar linear systems by trace and determinant, and linearised stability at
equilibria. **MIT 18.06** supplies the eigenvalue machinery that classification
rests on. **MIT 18.100A** covers the metric-space facts — compactness, sequential
limits, contraction mapping — the limit-set and uniqueness statements are made of.
**Wolfram MathWorld** is the quick reference for named objects: the logistic map
and its bifurcation values, and Hartman–Grobman.

## Prerequisites and next connections

Read [Ordinary Differential Equations](./ordinary-differential-equations.md)
first. It is the other half of this subject: it says when a solution exists and is
unique, which is what licenses writing $\Phi^t$ at all, and it covers the solution
methods this page deliberately does not.
[Multivariable Calculus](./multivariable-calculus.md) gives the vector field and
the Jacobian, and [Real Analysis](./real-analysis.md) the limit and compactness
arguments under the limit sets.

From here the natural step is chaos — what happens when the recurrence in an
$\omega$-limit set is neither a point nor a cycle. Bifurcation theory, how the
phase portrait changes as a parameter crosses a critical value as the logistic
map's does at $r=3$, is the other main branch.
[Partial Differential Equations](./partial-differential-equations.md) generate
semiflows on infinite-dimensional spaces where much of this vocabulary survives,
and [Measure Theory](./measure-theory.md) opens ergodic theory.
