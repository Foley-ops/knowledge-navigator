---
concept_id: concept.analysis.partial_differential_equations
title: Partial Differential Equations
slug: /concepts/partial-differential-equations
aliases:
  - PDE
kind: concept
tier: 1
review_state: generated-draft
summary: Equations constraining an unknown function of several variables through its partial derivatives, whose second-order elliptic, parabolic and hyperbolic types behave so differently that the type decides what data may be imposed and what the solution will look like.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: The unknown is a function of several variables and the operators that appear — gradient, divergence, Laplacian — are defined by multivariable differentiation.
  - type: generalizes
    target: concept.analysis.ordinary_differential_equations
    note: An equation with a single independent variable is an ODE, and separation of variables works precisely by reducing a PDE to a family of ODEs.
  - type: requires
    target: concept.analysis.fourier_analysis
    note: The separation-of-variables solution of the heat and wave equations is a Fourier series, and whether that series converges to an actual solution is a Fourier-analytic question.
  - type: refined_by
    target: concept.analysis.functional_analysis
    note: Weak solutions live in Sobolev spaces, and the existence theorems that replace classical solvability are functional-analytic statements about operators on those spaces.
sources:
  - source_id: source.mit_ocw.partial_differential_equations
    title: MIT 18.152 Introduction to Partial Differential Equations (Fall 2011)
    url: https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **partial differential equation** relates an unknown function $u$ of two or more
independent variables to its partial derivatives. Its _order_ is the order of the
highest derivative appearing; it is _linear_ if $u$ and its derivatives enter only
through a linear operator.

The classification that organises the subject applies to second-order linear
equations. In two variables,

$$
a\,u_{xx} + 2b\,u_{xy} + c\,u_{yy} + (\text{lower-order terms}) = 0 ,
$$

the discriminant decides the type: **elliptic** when $b^2 - ac < 0$, **parabolic**
when $b^2 - ac = 0$, **hyperbolic** when $b^2 - ac > 0$. The canonical members are
Laplace's equation $\Delta u = 0$, the heat equation $u_t = k\,\Delta u$, and the wave
equation $u_{tt} = c^2 \Delta u$, where $\Delta = \sum_i \partial^2/\partial x_i^2$.

## Why it matters

The classification is not bookkeeping. It predicts whether an equation _smooths_ its
data, whether information travels at _finite speed_, and which data make the problem
well posed. Elliptic equations have no time direction and need data on the whole
boundary. Parabolic equations run one way in time, smooth instantly, and need initial
data plus boundary data for all later times. Hyperbolic equations keep the roughness
of their data, move it at speed $c$, and need both an initial value and an initial
velocity. Supply the wrong data and the problem has no solution, or infinitely many,
or one that depends discontinuously on the input.

## Intuition

Picture the three as a soap film, an ink drop and a plucked string.

The film on a bent wire loop settles into the shape whose height at every point is
the average of its neighbours'. That averaging property _is_ Laplace's equation, and
it is why the rim fixes the interior and why the maximum sits on the rim. The ink
drop spreads, blurs, and never unspreads. The string carries its kink along at fixed
speed without rounding it off.

Two places the pictures break. The film really obeys the nonlinear minimal-surface
equation, of which Laplace is the small-slope linearisation. And heat propagates at
infinite speed here — a spike at the origin warms a point a kilometre away one
nanosecond later. False physics, tolerated because the amount is
$e^{-|x|^2/4kt}$-small.

## Concrete example

Solve $u_t = u_{xx}$ on $0 \le x \le \pi$ with $u(0,t) = u(\pi,t) = 0$ and
$u(x,0) = \sin x + \tfrac12 \sin 3x$. Substituting $u = X(x)T(t)$ gives
$T'/T = X''/X = -\lambda$; the boundary conditions force $X_n = \sin(nx)$ and
$\lambda_n = n^2$, so $T_n = e^{-n^2 t}$. Matching the initial data term by term,

$$
u(x,t) = e^{-t}\sin x + \tfrac12 e^{-9t} \sin 3x .
$$

At $t = 0.1$ the first harmonic retains $e^{-0.1} = 0.905$ of its amplitude and the
third retains $e^{-0.9} = 0.407$; at $t = 1$ the amplitudes are $0.368$ and
$6.2 \times 10^{-5}$. Parabolic smoothing with a number on it: mode $n$ decays like
$e^{-n^2 t}$.

Now change one symbol. For $u_{tt} = u_{xx}$ with the same initial displacement and
zero initial velocity, the same separation gives $T_n'' = -n^2 T_n$ and

$$
u(x,t) = \cos t \,\sin x + \tfrac12 \cos 3t\, \sin 3x .
$$

No amplitude decays and the solution is $2\pi$-periodic in time. The equations differ
by one derivative; the behaviour could hardly differ more.

## Formal treatment

Write a second-order linear operator on a domain $\Omega \subseteq \mathbb{R}^n$ as

$$
Lu = \sum_{i,j=1}^{n} a_{ij}(x)\,\partial_i \partial_j u
   + \sum_{i=1}^{n} b_i(x)\,\partial_i u + c(x)\,u ,
$$

taking $a_{ij} = a_{ji}$. Classify at each point by the eigenvalues of
$A(x) = (a_{ij}(x))$: **elliptic** if all are nonzero with the same sign,
**hyperbolic** if all are nonzero with exactly one of opposite sign to the rest,
**parabolic** if exactly one vanishes. Only the second-order coefficients enter — the
_principal symbol_ — which is why $u_t$ being first order makes the heat operator
parabolic.

A problem is **well posed** in Hadamard's sense if a solution exists, is unique, and
depends continuously on the data. Three that are:

- Dirichlet problem for $\Delta u = 0$ on bounded $\Omega$ with continuous boundary
  data: a unique solution, real-analytic inside however rough the data, with $u(x)$
  equal to the average of $u$ over any sphere about $x$ lying in $\Omega$ — the mean
  value property, whence the maximum principle.
- Heat equation, **forward** in time. On the whole line the solution is convolution
  with the heat kernel $\Phi(x,t) = (4\pi k t)^{-n/2} e^{-|x|^2/4kt}$, which is
  positive everywhere for every $t > 0$ (infinite propagation speed) and $C^\infty$
  (instant smoothing) even for bounded measurable initial data.
- Cauchy problem for the wave equation. D'Alembert's formula in one dimension,
  $$u(x,t) = \tfrac12\big[u_0(x - ct) + u_0(x + ct)\big] + \frac{1}{2c}\int_{x-ct}^{x+ct} u_1(s)\,ds,$$
  shows $u(x,t)$ depends only on data in $[x - ct,\, x + ct]$: a finite domain of
  dependence, and a kink in $u_0$ stays a kink.

Hadamard's ill-posed example is the Cauchy problem for Laplace's equation:
$u_{xx} + u_{yy} = 0$ with $u(x,0) = 0$, $u_y(x,0) = n^{-1}\sin(nx)$ has solution
$u = n^{-2}\sinh(ny)\sin(nx)$. The data tend uniformly to zero, yet at $n = 100$ they
have amplitude $0.01$ while the solution at $y = 1$ has amplitude
$\sinh(100)/10^4 \approx 1.3 \times 10^{39}$. Existence and uniqueness are not enough.

**Weak solutions.** Multiply $\Delta u = 0$ by a test function
$\varphi \in C_c^\infty(\Omega)$ and integrate by parts twice:
$\int_\Omega u\,\Delta\varphi = 0$. The derivatives now sit on $\varphi$, so the
statement makes sense for $u$ merely locally integrable. This is necessary, not
fastidious: Burgers' equation develops shocks in finite time from smooth data, so
classical solutions stop existing, and existence is far easier to prove in a Sobolev
space, regularity being recovered afterwards.

## Assumptions and requirements

Classification is _pointwise_, and one equation can change type: the Tricomi equation
$y\,u_{xx} + u_{yy} = 0$ is elliptic for $y > 0$ and hyperbolic for $y < 0$, and
nothing above survives across that line.

Elliptic results usually assume _uniform ellipticity_,
$\lambda |\xi|^2 \le \sum a_{ij}\xi_i\xi_j \le \Lambda|\xi|^2$ with $\lambda > 0$.
Lower-order terms do not change the type but do change solvability: the Helmholtz
equation $\Delta u + k^2 u = 0$ is elliptic, yet its Dirichlet problem loses
uniqueness exactly when $k^2$ is an eigenvalue of $-\Delta$. Boundary-value results
also assume a reasonably regular domain; on spiky ones the classical Dirichlet
problem is not solvable.

Separation of variables needs more still: linearity, a homogeneous equation,
homogeneous boundary conditions, and a domain that is a product of coordinate ranges
in a system where the operator separates. Inhomogeneous boundary data must first be
absorbed by subtracting a steady state; an awkward domain kills the method.

## Uses and applicability

Reach for a PDE when a quantity is spread over space and you have a conservation
statement plus a constitutive law: energy conservation plus Fourier's law of heat
conduction gives the heat equation, and the pattern repeats for mass, momentum and
charge.

The reach extends past physics. Gaussian blurring is exactly the heat semigroup:
convolving with a Gaussian of standard deviation $\sigma$ is running $u_t = \Delta u$
for time $\sigma^2/2$. The density of a diffusion process obeys the Fokker–Planck
equation, a parabolic PDE — a theorem, not an analogy, and what connects score-based
generative models to this material.

Do not reach for one when the state is genuinely finite-dimensional, when the
continuum assumption fails, or when you want a data fit rather than a mechanism.

## Limitations and common mistakes

The costliest mistake is assuming a natural-looking problem is well posed. The
**backward** heat equation is not, and this is not academic: deblurring an image is
backward diffusion, amplifying mode $n$ by $e^{+n^2 t}$, so every deconvolution must
regularise or it reconstructs noise at full amplitude.

The second is imposing the wrong data — Cauchy data for an elliptic equation is
Hadamard's example, and boundary data on a closed space-time surface for a hyperbolic
equation is generally over- or under-determined.

The third is expecting hyperbolic equations to smooth. They do not, and propagation
has structure: in three space dimensions the wave equation obeys Huygens' principle,
so a flash is followed by silence, while in two the same data leave a tail.

Numerically the type dictates the scheme. An explicit scheme for $u_t = k u_{xx}$ is
unstable unless $k\,\Delta t / \Delta x^2 \le 1/2$ — stability, not accuracy, which is
why fine grids force tiny time steps; hyperbolic explicit schemes obey the CFL
condition $c\,\Delta t \le \Delta x$.

Finally, weak solutions are not a technicality. For conservation laws the weak
solution is the physical one, and weak solutions are generally _not unique_: an
entropy condition picks out the right one.

## Variants and alternatives

Beyond the three model equations: **systems** (Maxwell, Euler, Navier–Stokes),
**higher-order** equations such as the biharmonic $\Delta^2 u = 0$ for plate bending,
**conservation laws**, and **dispersive** equations. The Schrödinger equation
$i u_t = -\Delta u$ looks parabolic and is not: it is reversible, unitary, and does
not smooth.

Solution concepts form a ladder — classical, weak, and **viscosity solutions**, which
give uniqueness for fully nonlinear equations such as Hamilton–Jacobi where the weak
formulation does not.

Methods trade generality for information. Separation of variables gives exact answers
but demands symmetry; transform methods handle constant coefficients on unbounded
domains; Green's functions give a solution operator; characteristics suit hyperbolic
problems; energy methods prove uniqueness and stability while producing no solution
at all. Numerically, finite elements build on the weak formulation and handle awkward
geometry, finite volumes respect conservation, spectral methods converge fastest on
smooth problems, and learned surrogates are fastest of all and carry none of the
guarantees.

## History and attribution

The subject has no single origin. D'Alembert derived and solved the vibrating-string
equation in 1747, writing the solution as two waves travelling in opposite
directions; the dispute that followed with Euler and Daniel Bernoulli, over whether
any initial shape can be written as a trigonometric series, was an argument about
what "function" means. Laplace's equation arose in gravitational potential theory
late in the same century. Fourier, studying heat conduction, presented his method in
1807 and _Théorie analytique de la chaleur_ in 1822; his convergence claims were not
rigorous, and much of nineteenth-century analysis was the response.

Hadamard formulated well-posedness and gave the ill-posed Cauchy example early in the
twentieth century, asking which boundary-value problems have physical meaning.
Sobolev introduced generalised derivatives in the 1930s and Schwartz's distributions
systematised them in the late 1940s; the modern theory of weak solutions rests on
that.

## Sources

MIT 18.152 matches this page's arc most closely: classification, the three model
equations, maximum principles and well-posedness. MIT 18.03 covers the
separation-of-variables and Fourier-series machinery of the worked example, and the
ODE background it reduces to. MIT 18.02 supplies the operators. Wolfram MathWorld is
a quick reference for the named equations and the standard attributions.

## Prerequisites and next connections

Read [Multivariable Calculus](./multivariable-calculus.md) first — every operator here
is built from partial derivatives — and keep [Real Analysis](./real-analysis.md)
available, since convergence of the series above and the meaning of "continuous
dependence on the data" are both analysis statements. Ordinary differential equations
are the degenerate case and what separation of variables reduces to; read them
alongside rather than after.

This opens up Fourier analysis, which began as the tool for these problems and
outgrew them; functional analysis and Sobolev spaces, where the weak theory lives;
and numerical analysis, where the classification returns as the rule for which scheme
is stable.
