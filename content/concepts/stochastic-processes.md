---
concept_id: concept.probability.stochastic_processes
title: Stochastic Processes
slug: /concepts/stochastic-processes
aliases:
  - random process
  - stochastic process
kind: concept
tier: 1
review_state: generated-draft
summary: The part of probability that models an entire random trajectory rather than a single random number, so that dependence across time, information available so far, and whole-path events like hitting times and long-run averages all become things you can compute with.
categories:
  - Mathematics/Probability & Statistics
primary_category: Mathematics/Probability & Statistics
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: A process is a family of random variables on one probability space, and its defining properties are statements about conditional expectation and joint distributions, so none of it can be stated before those are.
  - type: prerequisite_of
    target: concept.probability.martingales
    note: The martingale condition is an equation about a process adapted to a filtration, so the filtration, adaptedness and conditional-expectation machinery defined here have to exist before the definition can even be written down.
  - type: contrasts_with
    target: concept.analysis.dynamical_systems
    note: Both study long-run behaviour of trajectories under a fixed evolution rule, but there the rule is deterministic and the randomness lives only in the initial condition, which is why ergodic theory reads as the shared language of the two subjects.
  - type: contributes_to
    target: concept.probability.probability_and_computing
    note: Markov chains and their convergence rates are the analytic object behind MCMC samplers and behind the runtime analysis of randomised algorithms.
sources:
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.probabilistic_systems
    title: MIT 6.041 Probabilistic Systems Analysis and Applied Probability (Fall 2010)
    url: https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - intuition
      - concrete-example
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.rasmussen.gaussian_processes
    title: Rasmussen and Williams, Gaussian Processes for Machine Learning
    url: https://gaussianprocess.org/gpml/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - variants-and-alternatives
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.song2021.score_based_sde
    title: Score-Based Generative Modeling through Stochastic Differential Equations
    url: https://arxiv.org/abs/2011.13456
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **stochastic process** is a family $\{X_t\}_{t \in T}$ of random variables, all
on one probability space $(\Omega, \mathcal{F}, \mathbb{P})$ and all valued in one
measurable space $(E, \mathcal{E})$, indexed by a set $T$ — typically
$\mathbb{N}$, $\mathbb{Z}$ or $[0, \infty)$, read as time.

The phrase doing the work is _one probability space_. Separate random variables
have no joint behaviour; a process does, because every $X_t$ is a function of the
same $\omega$. Fixing $t$ gives a random variable; fixing $\omega$ gives the
**sample path** $t \mapsto X_t(\omega)$ — so a process is equally well described
as one random variable whose value is an entire trajectory.

## Why it matters

Ordinary probability is built for samples: draws that do not know about each
other. Almost nothing observed is like that — prices, queue lengths, word
sequences, molecule positions arrive in order, each value informative about the
next.

Processes also make a new class of question askable. "How long until the queue
first empties?", "does the walk ever return to where it started?", "does the time
average converge to the ensemble average?" — none is a function of any single
$X_t$, and none has an answer without the joint law. Filtrations formalise what
is known at time $t$, giving _the best prediction given the information so far_ a
definition rather than a gesture.

## Intuition

Carry three pictures and know they are one object: an indexed family of random
variables; a single draw of a whole random function, made at once but revealed a
page at a time; a probability measure on a space of paths. The second is the one
to use for events like "the walk returns to $0$ infinitely often" — the
trajectory already exists, you are only reading it.

It breaks in one place. The $\sigma$-algebra generated by the coordinates holds
only events depending on countably many times, and "every path is continuous" is
not one — which is why continuity of Brownian motion is a theorem about a
construction rather than a corollary of its finite-dimensional laws.

The filtration $\mathcal{F}_t$ is the envelope-opening: it grows with $t$, never
shrinks, and a process is **adapted** when $X_t$ is knowable from
$\mathcal{F}_t$.

## Concrete example

Two-state weather chain, $E = \{\text{sun}, \text{rain}\}$, transition matrix

$$
P = \begin{pmatrix} 0.9 & 0.1 \\ 0.5 & 0.5 \end{pmatrix},
$$

rows indexed by today, columns by tomorrow. The stationary distribution solves
$\pi P = \pi$: from $0.9\pi_s + 0.5\pi_r = \pi_s$, $\pi_s = 5\pi_r$, so
$\pi = (5/6, 1/6)$.

Start it raining. The law of $X_n$ runs $(0.5, 0.5)$, $(0.7, 0.3)$,
$(0.78, 0.22)$, approaching $(0.8\overline{3}, 0.1\overline{6})$ with the error
shrinking by $0.4$ each step: $0.833, 0.333, 0.133, 0.053$. That $0.4$ is the
second eigenvalue of $P$.

Started from $\pi$ instead, the chain is **strictly stationary**: every day is
marginally $\mathbb{P}(\text{rain}) = 1/6$, and no block of days has a law that
moves with the calendar. It is emphatically not independent —
$\mathbb{P}(X_1 = \text{rain} \mid X_0 = \text{rain}) = 0.5$ against an
unconditional $1/6$, and the correlation between rain indicators $k$ days apart
is exactly $0.4^{k}$, decaying but never zero. Stationary, dependent, and (being
finite, irreducible and aperiodic) ergodic: one long simulated path has rain on a
fraction of days tending to $1/6$ almost surely.

## Formal treatment

**Finite-dimensional distributions.** The laws of $(X_{t_1}, \dots, X_{t_n})$
determine the process on the cylinder $\sigma$-algebra, and Kolmogorov's
extension theorem gives the converse: any _consistent_ family of such laws — one
closed under marginalising and permuting coordinates — comes from a process on
path space when $E$ is Polish. That is what lets a Gaussian process be given by a
mean and a covariance function alone.

**Filtrations and the Markov property.** A filtration is an increasing family
$\mathcal{F}_s \subseteq \mathcal{F}_t \subseteq \mathcal{F}$ for $s \le t$. An
adapted process is **Markov** for it when, for bounded measurable $f$ and
$t, h \ge 0$,

$$
\mathbb{E}\big[f(X_{t+h}) \mid \mathcal{F}_t\big]
= \mathbb{E}\big[f(X_{t+h}) \mid X_t\big] \quad \text{a.s.}
$$

Read it precisely: given the _present_, the past is irrelevant to the future.
Independence would say the far stronger thing, that the right-hand side is the
unconditional $\mathbb{E}[f(X_{t+h})]$. A chain is usually heavily dependent; it
carries the dependence entirely through the current state.

**Stationarity** is shift-invariance of the law: $(X_{t_1 + h}, \dots, X_{t_n +
h}) \stackrel{d}{=} (X_{t_1}, \dots, X_{t_n})$ for all $h$ and all tuples. Weak
(second-order) stationarity asks only that $\mathbb{E}X_t$ be constant and
$\mathrm{Cov}(X_s, X_t)$ depend on $t - s$; it needs finite second moments and
implies the strict kind only for Gaussian processes.

**Ergodicity** is a different condition: every event invariant under the time
shift has probability $0$ or $1$. Birkhoff's theorem then gives, for stationary
ergodic $X$ and integrable $f$,

$$
\frac{1}{n}\sum_{k=0}^{n-1} f(X_k) \;\xrightarrow{\text{a.s.}}\; \mathbb{E}[f(X_0)].
$$

Neither property implies the other, and the counterexample is one line: flip a
fair coin once, set $X_t = U$ for all $t$. That process is perfectly stationary,
and its time average is $U$, not $1/2$.

**The canonical processes.** Random walk $S_n = \sum_{i \le n} \xi_i$ with i.i.d.
steps is the discrete prototype, recurrent in dimensions $1$ and $2$ and
transient from $3$ up (Pólya). The Poisson process of rate $\lambda$ has
$N_0 = 0$, independent increments and
$N_t - N_s \sim \mathrm{Poisson}(\lambda(t-s))$; equivalently its gaps are i.i.d.
$\mathrm{Exponential}(\lambda)$.
Brownian motion $B$ has $B_0 = 0$, independent increments, $B_t - B_s \sim
\mathcal{N}(0, t-s)$, and paths that are **almost surely continuous and almost
surely nowhere differentiable**, of infinite variation on every interval — which
is why stochastic integration had to be invented rather than inherited from
Riemann–Stieltjes. It is not stationary ($\mathrm{Var}(B_t) = t$) though its
increments are; the Ornstein–Uhlenbeck process repairs that with a restoring
drift,

$$
dX_t = -\theta (X_t - \mu)\, dt + \sigma\, dB_t ,
$$

whose autocovariance is $\frac{\sigma^2}{2\theta} e^{-\theta |t-s|}$ and
stationary law $\mathcal{N}(\mu, \sigma^2 / (2\theta))$. Started from that law it
is stationary, Gaussian and Markov at once.

## Assumptions and requirements

Everything above needs one probability space shared by all the $X_t$, and a state
space regular enough for the tools used: Polish for Kolmogorov extension, metric
for any statement about continuity.

The Markov property is relative to a filtration _and_ to how the state is
defined. An AR(2) sequence is not Markov in its own values but is Markov in the
pair (current, previous), so "is this process Markov?" is a question about the
chosen state, not the observed numbers. Ergodic averaging needs stationarity plus
$\mathbb{E}|f(X_0)| < \infty$; convergence of a chain to $\pi$ needs
irreducibility and aperiodicity, plus positive recurrence on infinite state
spaces. Drop aperiodicity and $\pi$ still exists but $X_n$ never settles into it;
drop irreducibility and $\pi$ is not unique.

Finite-dimensional laws constrain, but do not determine, path properties: with an
independent uniform $U$, the process $Y_t = \mathbf{1}\{t = U\}$ shares its
finite-dimensional laws with the constant zero process. That is the gap between a
**modification** and **indistinguishability**, and the reason a continuous version
needs Kolmogorov's criterion $\mathbb{E}|X_t - X_s|^\alpha \le C|t-s|^{1+\beta}$.

## Uses and applicability

Reach for a process whenever order carries information: queueing and network
traffic (Poisson arrivals), finance (geometric Brownian motion), physics (the
Langevin equation, whose velocity solution is exactly OU), speech and biological
sequences (hidden Markov models), reinforcement learning (Markov decision
processes are controlled chains), and Gaussian process regression, where the
covariance function _is_ the model. Chains also get used backwards: MCMC designs
a chain whose stationary distribution is a target you cannot sample directly,
then runs it. Diffusion generative models do this in continuous time — forward
corruption by a linear SDE of Ornstein–Uhlenbeck type, generation by a
reverse-time SDE driven by a learned score.

Do not reach for one when the uncertainty is about parameters rather than
dynamics, or when you have one short series and no way to test the stationarity
your estimator quietly assumes.

## Limitations and common mistakes

The most common error is treating stationarity and ergodicity as one property.
They are not: the constant-coin process above is stationary and not ergodic, and
estimating a law from one long trajectory is an ergodicity assumption — on a
non-ergodic process it estimates the realisation you happened to draw and nothing
else. Terminology compounds this, since in Markov chain texts "ergodic chain"
means irreducible, aperiodic and positive recurrent: sufficient for the ergodic
theorem, not the definition of ergodicity.

Second, Markov is read as _memoryless_ and then quietly as _independent_. The
weather chain remembers yesterday perfectly well; it has no use for the day
before. Third, weak stationarity is taken to imply the strict kind, which outside
the Gaussian case it does not.

Fourth, Brownian paths are expected to behave like ordinary functions. They do
not — nowhere differentiable, unbounded variation on every interval, quadratic
variation exactly $t$ on $[0,t]$ — so $\int f\, dB$ is not a pathwise Stieltjes
integral, which is the whole motivation for the Itô integral and its second-order
correction term.

## Variants and alternatives

By index and state: discrete time and state gives Markov chains, continuous time
and state gives diffusions, a multidimensional index gives random fields. **Lévy
processes** are those with stationary independent increments — Brownian motion
and the Poisson process are the two pure examples, and the Lévy–Itô decomposition
builds every other from them plus drift. **Gaussian processes** are fixed by a
mean and covariance function and need not be Markov: fractional Brownian motion
is Markov only at Hurst parameter $H = 1/2$, and for $H > 1/2$ its increments
have long-range dependence (for $H < 1/2$ they are anti-persistent, with
negative and summable correlations). **Martingales** constrain the conditional
mean rather than memory.
**Hidden Markov models** put the chain behind observations; **point processes**
generalise Poisson arrivals to clustered ones. The genuinely different approach
is deterministic dynamics, where the rule is fixed and only the initial condition
is random.

## History and attribution

The strands have separate origins. Markov introduced chains around 1906 while
arguing that laws of large numbers survive dependence, later illustrating them on
letter sequences in _Eugene Onegin_. Bachelier modelled Paris bourse prices with
what is now Brownian motion in 1900, five years before Einstein's physical
account of Brownian movement; Wiener constructed the measure rigorously in the
early 1920s, and Paley, Wiener and Zygmund proved nowhere
differentiability in 1933. Erlang's telephone-traffic work of 1909 is the
ancestor of Poisson-arrival queueing, and Uhlenbeck and Ornstein published their
velocity process in 1930. Kolmogorov supplied the measure-theoretic foundation
and the extension theorem in the _Grundbegriffe_ of 1933; Itô built the
stochastic integral in the 1940s, and Doob's _Stochastic Processes_ of 1953 fixed
filtrations and the modern style of statement.

## Sources

Durrett is the standard measure-theoretic reference, proving the extension
theorem, the Markov and strong Markov properties, the construction and path
properties of Brownian motion, and the ergodic theorems. MIT 6.041 is the
undergraduate entry point for Bernoulli and Poisson processes and finite chains,
at the level of the weather example here; it does not treat Brownian motion or
the measure-theoretic apparatus. Rasmussen and Williams define a Gaussian process
by its finite-dimensional laws and consistency, and catalogue covariance
functions including the exponential kernel that is OU. Song et al. cover the SDE
view of diffusion models.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first — random variables,
conditional expectation and modes of convergence are used without comment above.
[Measure Theory](./measure-theory.md) is what makes "a probability measure on a
space of paths" a sentence with content, and is unavoidable past the finite-state
case.

From here, [Martingales](./martingales.md) turn the conditional-expectation
structure into stopping theorems, and stochastic calculus builds the integral
Brownian paths refuse to give up by ordinary means.
[Dynamical Systems](./dynamical-systems.md) is the
deterministic mirror, asking the same long-run questions of a fixed rule, and is
where the shared vocabulary of invariant measures and ergodicity shows up. For
time-series and signal models, [Fourier Analysis](./fourier-analysis.md) comes
next: the spectral density of a weakly stationary process is the Fourier
transform of its autocovariance.
