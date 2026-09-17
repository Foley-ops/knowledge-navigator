---
concept_id: concept.analysis.chaos
title: Chaos
slug: /concepts/chaos
aliases:
  - deterministic chaos
  - Devaney chaos
kind: property
tier: 1
review_state: generated-draft
summary: The property of a deterministic system whose bounded orbits separate exponentially, spread from any region to any other, and are threaded everywhere by periodic points, so that individual trajectories become unpredictable, while under an ergodic physical measure their long-run statistics are stable.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.dynamical_systems
    note: Chaos is not a system but a property of one, predicated of a map or flow together with an invariant set it acts on.
  - type: requires
    target: concept.analysis.real_analysis
    note: Every clause of the definition is metric-topological — a uniform separation constant, density of periodic points, openness of the sets transitivity quantifies over.
  - type: requires
    target: concept.analysis.measure_theory
    note: Lyapunov exponents are guaranteed to exist only almost everywhere with respect to an invariant probability measure, which is what Oseledets' theorem is stated for.
  - type: contrasts_with
    target: concept.analysis.ordinary_differential_equations
    note: Picard-Lindelöf gives unique solutions depending continuously on data, and chaos shows that this well-posedness is compatible with total loss of predictive power.
sources:
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
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - definition
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

Let $(X, d)$ be a metric space and $f : X \to X$ continuous. Following Devaney,
$f$ is **chaotic** on $X$ when three conditions hold at once:

1. **Sensitive dependence on initial conditions.** There is a $\delta > 0$ such
   that for every $x \in X$ and every neighbourhood $U$ of $x$ there exist
   $y \in U$ and $n \ge 0$ with $d(f^n(x), f^n(y)) > \delta$.
2. **Topological transitivity.** For every pair of non-empty open
   $U, V \subseteq X$ there is an $n > 0$ with $f^n(U) \cap V \neq \emptyset$.
3. **Dense periodic points.** The set $\{x : f^p(x) = x \text{ for some } p \ge 1\}$
   is dense in $X$.

Each clause does different work: sensitivity is unpredictability, transitivity is
indecomposability — no invariant open piece the dynamics stays inside — and dense
periodicity is a skeleton of regularity running through it. The slogan keeps only
the first.

## Why it matters

A system can be finite-dimensional, deterministic, smooth, and well-posed in every
sense an [Ordinary Differential Equation](./ordinary-differential-equations.md)
course demands, and still be useless for long-range prediction. Before Lorenz,
irregular output was widely taken to mean many degrees of freedom or an external
noise source; three coupled quadratic ODEs suffice.

The consequence is a change of target: predict distributions rather than
trajectories — climate rather than weather, the shape of an attractor rather than
a point on it.

## Intuition

Take a lump of dough, stretch it to twice its length, fold it back on itself,
repeat. Two raisins a millimetre apart end up a centimetre apart after a few
kneads and on opposite sides after a few more, yet the dough stays in the bowl.
**Stretching** is the positive Lyapunov exponent, **folding** is what keeps orbits
bounded, **mixing** is transitivity.

The analogy breaks twice. Real dough homogenises; here the folding lays down
layers that never merge, which is why strange attractors have fractal
cross-sections. And kneading is irreversible in practice, while a chaotic
diffeomorphism is invertible — run it backwards and the raisins return.

## Concrete example

The logistic map at $r = 4$, $f(x) = 4x(1-x)$ on $[0,1]$. Start two orbits eight
decimal digits apart:

```python
x, y = 0.3, 0.3 + 1e-8
for n in range(1, 31):
    x, y = 4 * x * (1 - x), 4 * y * (1 - y)
    if n in (10, 20, 25, 27):
        print(n, round(x, 6), round(y, 6), abs(x - y))
```

The gap runs $4.6\times10^{-6}$ at $n = 10$, $5.5\times10^{-3}$ at $n = 20$ and
$9.0\times10^{-2}$ at $n = 25$; at $n = 27$ the orbits sit at $0.0495$ and
$0.8945$, unrelated. That is $10^{-8} \cdot 2^n$ until saturation, with
$2^{27} \approx 1.3 \times 10^{8}$.

The factor $2$ is not a coincidence. The substitution $x = \sin^2(\pi\theta)$ turns
$f$ into the doubling map $\theta \mapsto 2\theta \bmod 1$, since
$4\sin^2(\pi\theta)\cos^2(\pi\theta) = \sin^2(2\pi\theta)$, and in binary the
doubling map deletes the leading digit and shifts the rest left. All three Devaney
conditions then become statements about binary expansions: periodic points are the
$\theta = k/(2^p-1)$, which are dense; a $\theta$ whose expansion contains every
finite block has a dense orbit; and after $n$ steps the leading digit is the one
that was $n$ places down, which is sensitivity with $\lambda = \ln 2$.

It also shows what a computer does with such a map: iterated in double precision
from $\theta_0 = 0.3$ the mantissa shifts left padding with zeros, and at step
$54$ the state is exactly $0$ forever — which the true orbit never is.

## Formal treatment

**Redundancy.** On any infinite metric space, transitivity with dense periodic
points implies sensitive dependence, so the famous clause comes free; infinitude
is needed, since a cyclic permutation of a finite set satisfies the first two and
is an isometry. On an interval, transitivity alone implies the other two.

**Lyapunov exponents.** For differentiable $f$ on $\mathbb{R}^d$, with
$Df^n(x) = Df(f^{n-1}x)\cdots Df(x)$, the exponent in direction $v \neq 0$ is

$$
\lambda(x, v) \;=\; \lim_{n \to \infty} \frac{1}{n} \ln \lVert Df^n(x)\, v \rVert .
$$

Oseledets' multiplicative ergodic theorem says the limit exists for $\mu$-almost
every $x$ and every $v$, taking at most $d$ values
$\lambda_1 \ge \cdots \ge \lambda_s$, provided $\mu$ is an $f$-invariant
probability measure with $\log^+\lVert Df\rVert \in L^1(\mu)$. In one dimension it
is a time average, $\lambda = \lim_n \frac{1}{n}\sum_{k<n} \ln|f'(x_k)|$, which
Birkhoff's theorem identifies with $\int \ln|f'| \, d\mu$ for ergodic $\mu$. For
$f(x) = 4x(1-x)$ the invariant density is $\rho(x) = \pi^{-1}(x(1-x))^{-1/2}$ and
that integral is exactly $\ln 2$; a two-million-step average returns $0.69315$.

**Lorenz.** With $\sigma = 10$, $\beta = 8/3$, $\rho = 28$,

$$
\dot x = \sigma(y - x), \qquad \dot y = x(\rho - z) - y, \qquad \dot z = xy - \beta z .
$$

The divergence is the constant $-(\sigma + 1 + \beta) = -13.67$, so phase volume
contracts uniformly and the attractor has measure zero. Numerical estimates of the
exponents are $(0.906,\, 0,\, -14.57)$ — the zero is the flow direction, the sum
matches the divergence as it must, and the Kaplan-Yorke dimension
$2 + \lambda_1/|\lambda_3|$ is about $2.06$.

**Shadowing.** If $\Lambda$ is a compact hyperbolic invariant set for a
diffeomorphism $f$, then for every $\varepsilon > 0$ there is a $\delta > 0$ such
that every $\delta$-pseudo-orbit — a sequence with $d(f(x_n), x_{n+1}) < \delta$,
which is what a numerical integrator produces — is $\varepsilon$-shadowed by a
genuine orbit: some $y$ has $d(f^n(y), x_n) < \varepsilon$ for all $n$. A computed
trajectory is therefore not the orbit of the initial condition you typed, but it
is close to _an_ orbit, so what it shows about the attractor's shape and
statistics is real.

## Assumptions and requirements

Dimension is a hard constraint. A chaotic autonomous flow needs at least three
state variables, because Poincaré-Bendixson forces a bounded planar orbit to
approach an equilibrium or a closed orbit; an invertible map needs two, and one
suffices only for non-invertible maps, where the folding _is_ the non-injectivity.
Boundedness is equally non-negotiable: positive stretching on an unbounded set is
ordinary instability.

Lyapunov exponents assume an invariant measure and enough integrability for
Oseledets. Without ergodicity they depend on the starting point, so reading one
computed exponent as a property of the _system_ rather than of a measure is a real
error.

Shadowing assumes uniform hyperbolicity, which most simulated systems are not
known to have: the Lorenz attractor contains an equilibrium and is only
singular-hyperbolic, the Hénon attractor is non-uniformly hyperbolic. For these,
shadowing is established over long but finite windows, or not at all, and the
clean theorem above is being used as an analogy.

## Uses and applicability

Reach for the chaotic framing when a deterministic model produces irregular output
and you want to know whether that irregularity is intrinsic. It buys a Lyapunov
time $1/\lambda_1$ bounding the useful forecast horizon, an attractor dimension
saying how many variables the long-run behaviour really uses, and a reason to run
ensembles rather than point forecasts. It is standard in geophysical fluid
dynamics, celestial mechanics, nonlinear circuits, cardiac and neural rhythms, and
population ecology.

Do not reach for it when the system is high-dimensional and strongly stochastic —
turbulence is not usefully low-dimensional chaos — or when you have a few hundred
noisy points and no model.

## Limitations and common mistakes

**Chaos is deterministic, not random.** There is no noise term anywhere; the same
initial condition produces the same orbit forever, exactly. The doubling map makes
the point sharp: it is measure-theoretically isomorphic to fair coin flipping, and
what it "flips" is the binary digits of one fixed real number chosen at the start.
The randomness was in the initial condition; the dynamics only reads it out a
digit per step. Nor is prediction impossible in principle — the horizon grows like
$\lambda_1^{-1}\ln(\text{tolerance}/\text{initial error})$, so for Lorenz ten
extra digits buy about $25$ more time units. Prediction is expensive, at a
logarithmic exchange rate.

**Sensitive dependence alone is not chaos.** The map $f(x) = 2x$ on $\mathbb{R}$
separates nearby points exponentially and is completely trivial: one fixed point,
everything else escaping monotonically, no transitivity, no recurrence.
Transitivity alone is not chaos either — an irrational rotation of the circle is
transitive but an isometry with no periodic points. Both halves of the folklore
fail.

**A positive exponent estimated from data is not evidence of chaos.** Standard
estimators return spurious positive values for coloured noise and non-stationary
series, so surrogate-data tests are mandatory, and by the usual rule of thumb a
dimension $D$ inferred from $N$ points is credible only when $D < 2\log_{10} N$.
Much 1980s and 1990s "evidence of chaos" in economic and physiological data did
not survive these controls.

**Chaotic is not fractal, and a chaotic family is not chaotic throughout.** The
logistic map at $r = 4$ is chaotic on the ordinary interval $[0,1]$; a stable
period-three window opens in the same family at
$r = 1 + 2\sqrt{2} \approx 3.8284$, and such windows are dense in the parameter
line even though positive-exponent parameters have positive Lebesgue measure.

## Variants and alternatives

Devaney's is one definition among several and the field has not settled on one.
**Li-Yorke chaos** asks only for an uncountable scrambled set of pairs that
infinitely often come close and infinitely often separate — weaker, and implied by
positive entropy for interval maps. **Positive topological entropy** is what most
ergodic theorists prefer, being a conjugacy invariant and a single number; the
doubling map has entropy $\ln 2$. **Positive largest Lyapunov exponent** is the
working criterion in physics: easy to estimate, but a property of a measure rather
than of the map, and blind to the difference between an unbounded and a folded
system. **Mixing** and **Bernoulli** sit higher in the ergodic hierarchy, whose
weakest rung is plain ergodicity. Choosing among them is choosing what you want to
prove.

## History and attribution

Poincaré met the phenomenon in the 1890s on the three-body problem: the homoclinic
tangle he found was so intricate he declined to draw it, and he later wrote that
small differences in initial conditions can produce very large ones at the end.
Hadamard's geodesic flows on negatively curved surfaces are an independent
instance from the close of that decade.

The modern subject restarts with Lorenz in 1963, whose "Deterministic Nonperiodic
Flow" studied a severely truncated model of convection and reported a simulation
restarted from a rounded printout diverging from the original; the butterfly image
comes from a talk title of his from 1972, and Smale's horseshoe had given the
geometric mechanism in the 1960s. The word "chaos" in this sense comes from Li and
Yorke's 1975 "Period Three Implies Chaos", a special case of a theorem Sharkovskii
had proved in 1964, then unknown in the West. May's 1976 review made the logistic
map standard equipment; Feigenbaum's constant $\delta \approx 4.669$ followed,
found independently by Coullet and Tresser; Devaney's definition dates from the
late 1980s, its redundancy noted in 1992. That the Lorenz attractor exists at all,
as more than a numerical picture, was proved only in 2002, by Tucker, with a
computer-assisted argument.

## Sources

MathWorld is the reference used here for the standard definitions, the logistic
and doubling maps, and the names and dates above. MIT 18.100A supplies the
underlying analysis on the real line — convergence, continuity, density of the
rationals — on which the metric-space vocabulary of the definition is modelled.
MIT 18.03 covers the flow and phase-portrait setting these systems
live in: vector fields, equilibria, linearised stability, and the planar theory
whose failure to produce chaos is why three dimensions are needed. Durrett covers
invariant measures, ergodicity and Birkhoff's theorem, which turn a single chaotic
orbit into a statistical statement.

## Prerequisites and next connections

Read [Ordinary Differential Equations](./ordinary-differential-equations.md)
first, for flows, equilibria and the Grönwall bound that carries the seed of the
problem, and [Real Analysis](./real-analysis.md) for the metric-space apparatus
the definition assumes; [Dynamical Systems](./dynamical-systems.md) is the general
setting of which chaos is one property. Next,
[Measure Theory](./measure-theory.md) is what invariant
measures, Oseledets and Birkhoff are built from, and the gateway to ergodic
theory, where the stable statistics of a chaotic orbit become the object of study.
