---
concept_id: concept.analysis.ordinary_differential_equations
title: Ordinary Differential Equations
slug: /concepts/ordinary-differential-equations
aliases:
  - ODE
kind: concept
tier: 1
review_state: generated-draft
summary: The theory of equations that pin down a function of one variable from its own rate of change, where a Lipschitz condition buys exactly one trajectory through each point and almost everything past the linear case must be computed rather than solved.
categories:
  - Mathematics/Analysis
  - Mathematics/Numerical Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.single_variable_calculus
    note: The subject is stated in derivatives, and its simplest case, $\dot y = f(t)$, is exactly the antiderivative problem calculus already solves.
  - type: requires
    target: concept.analysis.real_analysis
    note: Picard-Lindelof is a contraction-mapping argument in a complete space of continuous functions, so existence, uniqueness and continuous dependence are analysis theorems rather than calculations.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: A system is a vector field on $\mathbb{R}^n$, and the standard stability test is the Jacobian of that field at an equilibrium, which is a multivariable Taylor expansion.
  - type: prerequisite_of
    target: concept.analysis.partial_differential_equations
    note: Separation of variables and the method of characteristics both work by reducing a PDE to a family of ODEs, so the solvability and stability facts here are what those methods consume.
sources:
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

An **ordinary differential equation** relates an unknown function $y$ of one real
variable $t$ to its own derivatives, $F(t, y, y', \ldots, y^{(n)}) = 0$, where the
largest derivative appearing sets the **order** $n$. _Ordinary_ is the contrast
with _partial_: one independent variable, so no partial derivatives.

Nearly all theory is written for the first-order system in explicit form,

$$
\dot y = f(t, y), \qquad y(t_0) = y_0, \qquad y(t) \in \mathbb{R}^n ,
$$

and nothing is lost: $y^{(n)} = g(t, y, \ldots, y^{(n-1)})$ becomes such a system
in $\mathbb{R}^n$ under $u = (y, y', \ldots, y^{(n-1)})$. Equation plus data is an
**initial value problem**.

## Why it matters

An ODE writes down a local rule and asks for its global consequence. Newton's
second law gives only the acceleration right now, and the SIR model only the
current rate of new infections; the orbit and the epidemic curve are what you want.
The subject's value is the claim that the local rule determines the global
trajectory, and stating that claim precisely — with its hypothesis, and the
counterexamples when it is dropped — is the theory below.

That determination is almost never available in closed form, so past the linear
case you integrate numerically, which turns a question about mathematics into one
about step sizes and stability.

## Intuition

Draw the arrow $f(t, y)$ at every point of the state space. A solution is a curve
tangent to the arrows along its whole length: drop a leaf at $y_0$ and let the
field carry it. For an **autonomous** system, $\dot y = f(y)$ with no explicit $t$,
the arrows never move, so trajectories never cross — a crossing needs two tangents
at one point, contradicting uniqueness.

The river breaks as an analogy twice. A leaf drifts forever; a solution can reach
infinity in finite time and stop existing. And when $f$ depends on $t$ the channel
is re-cut as the leaf moves, so no-crossing survives only in the space carrying $t$
as a coordinate.

## Concrete example

Take $\dot y = 3 y^{2/3}$ with $y(0) = 0$.

The constant $y \equiv 0$ solves it. So does $y(t) = t^3$, since
$\frac{d}{dt}t^3 = 3t^2$ and $3(t^3)^{2/3} = 3t^2$. So does every glued function

$$
y_c(t) = \begin{cases} 0 & t \le c \\ (t - c)^3 & t > c \end{cases}
$$

for any $c \ge 0$: it is differentiable at $t = c$ with derivative $0$, and each
branch satisfies the equation. One initial condition, uncountably many solutions.

The right-hand side is continuous everywhere, so existence is not what fails. The
Lipschitz condition fails at the origin: $f(y) = 3y^{2/3}$ has $f'(y) = 2y^{-1/3}$,
unbounded as $y \to 0$, so no constant $L$ gives $|f(y) - f(z)| \le L|y - z|$ near
$0$. With $z = 0$ and $y = 10^{-9}$ the ratio is $3y^{-1/3} = 3000$, and it grows
without bound as $y$ shrinks.

## Formal treatment

Let $f : D \to \mathbb{R}^n$ be defined on an open
$D \subseteq \mathbb{R} \times \mathbb{R}^n$ containing $(t_0, y_0)$, with a norm
$\|\cdot\|$ fixed on $\mathbb{R}^n$.

**Picard-Lindelöf.** Let $f$ be continuous on the closed box
$R = \{|t - t_0| \le a\} \times \{\|y - y_0\| \le b\} \subseteq D$ and **Lipschitz
in $y$ uniformly in $t$**: some $L$ satisfies
$\|f(t, y) - f(t, z)\| \le L\|y - z\|$ throughout $R$. Then with
$M = \sup_R \|f\|$ and $\alpha = \min(a,\, b/M)$, the initial value problem has
exactly one solution on $[t_0 - \alpha,\, t_0 + \alpha]$.

The proof explains the hypothesis. Integrating gives the equivalent
$y(t) = y_0 + \int_{t_0}^{t} f(s, y(s))\, ds$, whose right-hand side is an operator
on the complete metric space of continuous functions into $\|y - y_0\| \le b$; the
Lipschitz constant makes it a contraction on a short enough interval, and Banach's
fixed-point theorem gives one fixed point and no more. **Peano's theorem** says
continuity alone still gives existence: uniqueness is what Lipschitz buys, and what
the example above loses.

**Linear systems.** For $\dot y = Ay$ the right-hand side is globally Lipschitz
with $L = \|A\|$, so solutions exist for all time and $y(t) = e^{At} y_0$, where

$$
e^{At} = \sum_{k=0}^{\infty} \frac{t^k A^k}{k!}
$$

converges absolutely for every $A$ and $t$. If $A = V\Lambda V^{-1}$ then
$e^{At} = V e^{\Lambda t} V^{-1}$ and solutions combine the $e^{\lambda_i t} v_i$;
a defective eigenvalue adds $t^k e^{\lambda t}$ terms, $k$ below its Jordan block
size.

**Stability.** These are theorems. The origin of $\dot y = Ay$ is asymptotically
stable exactly when every eigenvalue has $\operatorname{Re}\lambda < 0$, and
Lyapunov stable exactly when $\operatorname{Re}\lambda \le 0$ throughout with those
on the imaginary axis semisimple. For a nonlinear autonomous system an
**equilibrium** has $f(y^*) = 0$ and the test is the Jacobian $J = Df(y^*)$: if $J$
is **hyperbolic** — no eigenvalue with zero real part — Hartman-Grobman makes the
local phase portrait topologically conjugate to that of $\dot u = Ju$, so all
$\operatorname{Re}\lambda < 0$ gives local asymptotic stability and any
$\operatorname{Re}\lambda > 0$ instability. Lyapunov's direct method is the other
theorem: positive definite $V$ with $\dot V \le 0$ near $y^*$ proves stability,
$\dot V < 0$ asymptotic stability. Finding such a $V$ is a craft, not an algorithm;
that part is heuristic.

**Numerics.** Explicit Euler, $y_{n+1} = y_n + h f(t_n, y_n)$, has global error
$O(h)$; classical fourth-order Runge-Kutta averages four slopes per step for
$O(h^4)$. On the test equation $\dot y = \lambda y$ each becomes
$y_{n+1} = R(h\lambda)\, y_n$ for a **stability function** $R$, and the numerical
solution decays only where $|R(h\lambda)| < 1$. Euler has $R(z) = 1 + z$, so real
negative $\lambda$ needs $h|\lambda| < 2$; RK4's real-axis limit is about $2.78$.
Backward Euler has $R(z) = 1/(1-z)$, hence $|R| < 1$ on the whole left half-plane —
it is **A-stable**, at the price of an algebraic solve per step.

## Assumptions and requirements

Picard-Lindelöf is **local in time**, and that is not a technicality.
$\dot y = y^2$, $y(0) = 1$ has a polynomial right-hand side and the solution
$y(t) = 1/(1-t)$, which escapes to infinity as $t \to 1^-$. What always holds is
the extension theorem: a maximal solution either runs forever or leaves every
compact subset of $D$. Global Lipschitz restores global existence, which is why
linear systems never blow up.

Lipschitz also buys **continuous dependence**: Grönwall's inequality gives
$\|y(t) - z(t)\| \le \|y_0 - z_0\|\, e^{L(t-t_0)}$. That bound is exponential and
sometimes sharp, so well-posedness is not predictability — Lorenz's system is
well-posed and still loses every digit of a measurement within simulated weeks.

Hyperbolicity is the assumption under the eigenvalue test. Both $\dot y = -y^3$ and
$\dot y = +y^3$ linearise to $\dot u = 0$ at the origin, and the first is
asymptotically stable, the second unstable: without hyperbolicity the linearisation
decides nothing. RK4's $O(h^4)$ assumes $f$ is smooth enough; against a kinked or
switching right-hand side the observed order collapses toward first.

## Uses and applicability

Reach for an ODE whenever the state is a finite list of numbers evolving in one
variable, usually time: mechanics and orbits, chemical kinetics, compartment models
in pharmacokinetics and epidemiology, circuits, population dynamics, control
theory. ODEs are also the continuous-time shadow of iterative algorithms — gradient
descent is explicit Euler on the flow $\dot y = -\nabla g(y)$ — and the machinery
behind continuous-depth neural networks.

Do not, when the state is a field over space as well as time, which is a PDE; when
the rate depends on the past, a delay equation; when noise enters the dynamics,
needing the stochastic calculus; or when algebraic constraints couple the variables
into a differential-algebraic system with its own index.

## Limitations and common mistakes

Closed forms are the exception. Even $\dot y = e^{-t^2}$ has no elementary
antiderivative, and the Riccati equation $\dot y = t + y^2$ is solvable only
through Airy functions. A course of solvable examples suggests solving is normal;
it is not.

The four errors that cost real time:

- **Assuming uniqueness comes free.** It does not, and the failure is not exotic:
  $\dot y = 3y^{2/3}$ above is continuous everywhere.
- **Assuming smoothness means eternal existence.** Finite-time blow-up happens for
  polynomial right-hand sides.
- **Trusting $e^{A}e^{B} = e^{A+B}$.** It is guaranteed only when $AB = BA$.
  Negative eigenvalues likewise guarantee eventual decay, not monotone decay: for
  strongly non-normal $A$, $\|e^{At}\|$ can grow by orders of magnitude first.
- **Fighting stiffness with smaller steps.** Explicit Euler on $\dot y = -15y$,
  $y(0) = 1$ with $h = 0.2$ has $1 + h\lambda = -2$, so the iterates run
  $1, -2, 4, -8, 16, -32$ and reach $-32$ at $t = 1$, where the true value is
  $e^{-15} \approx 3.1 \times 10^{-7}$. Backward Euler at that step gives
  $y_{n+1} = y_n/4$, reaching $9.8 \times 10^{-4}$: inaccurate, but decaying.
  A-stability buys the right qualitative behaviour, not accuracy.

**Stiffness** has no universally agreed definition, and it is better to say so than
to pick one. Operationally a problem is stiff when the step size is limited by
stability rather than accuracy: the solution is smooth but an explicit method must
crawl. Widely separated eigenvalue magnitudes are the usual cause, a diagnostic
rather than a definition. Why implicit methods answer it is a theorem: an explicit
Runge-Kutta method's stability function is a polynomial in $h\lambda$, hence
unbounded, so its stability region is bounded and it cannot be A-stable.

## Variants and alternatives

The first fork is the side condition. An initial value problem fixes the whole
state at one point; a **boundary value problem** splits conditions across two and
loses uniqueness differently — $y'' + y = 0$ with $y(0) = y(\pi) = 0$ admits the
whole family $y = c \sin t$, while moving the right endpoint slightly leaves only
$y \equiv 0$. BVPs are solved by shooting or collocation, not by marching.

Among numerical families, explicit Runge-Kutta is the non-stiff default; implicit
Runge-Kutta and backward differentiation formulae are the stiff workhorses; Adams
methods reuse past steps for cheaper high order, paying with weaker stability; and
symplectic integrators trade asymptotic accuracy for conserving a modified energy,
which is why long-horizon orbital simulations use them. Dahlquist's second barrier
caps the space: an A-stable linear multistep method has order at most two.

Analytically the alternatives are the Laplace transform for constant-coefficient
problems, the Frobenius method near regular singular points, asymptotics in a small
parameter, and phase-plane analysis, which finds equilibria and limit cycles
without one.

## History and attribution

Differential equations arrive with the calculus: Newton and Leibniz in the 1670s
and 1680s, and the _Principia_ of 1687, where mechanics is posed as what we would
now call a second-order system. Euler supplied most of the eighteenth-century
methods still taught, including the polygon method behind every stepping scheme.

Rigour came in stages. Cauchy gave the first existence proof in the 1820s;
Lipschitz weakened the hypothesis in the 1870s to the condition carrying his name,
which is why French texts say Cauchy-Lipschitz where English ones say
Picard-Lindelöf, after Picard's successive approximation argument of the 1890s and
Lindelöf's contemporary work. Peano showed in the 1880s that continuity alone
suffices for existence. The qualitative theory is Poincaré's, out of the three-body
problem; modern stability theory is Lyapunov's 1892 thesis, developed largely
independently.

The numerical line is later: Runge in 1895 and Kutta in 1901; stiffness named by
Curtiss and Hirschfelder in 1952; A-stability and the order barriers Dahlquist's,
from 1963.

## Sources

MIT 18.03 is the reference course for what a first encounter needs: solution
methods, linear systems and the matrix exponential, phase portraits, numerical
stepping. MIT 18.06 holds the linear algebra underneath $e^{At}$ — diagonalisation
and the defective cases that produce $t^k e^{\lambda t}$ terms. MIT 18.100A
supplies what the Picard argument runs on: completeness, and the
contraction-mapping machinery that makes successive approximation a proof.
MathWorld is cited only for the names and dates above.

## Prerequisites and next connections

Come with [Single Variable Calculus](./single-variable-calculus.md) fluent, since
the simplest ODE is an antiderivative, and with eigenvalues and diagonalisation at
hand, because the linear theory is linear algebra wearing a time variable. The
Jacobian test is a [Multivariable Calculus](./multivariable-calculus.md)
construction, and the existence proof is a [Real Analysis](./real-analysis.md)
argument in disguise.

What it opens: dynamical systems, where the question shifts from solving to
classifying; control theory, which chooses $f$ to place the eigenvalues; numerical
analysis, where stability regions and order barriers are the subject; and
[Partial Differential Equations](./partial-differential-equations.md), which
separation of variables reduces back to ODEs.
