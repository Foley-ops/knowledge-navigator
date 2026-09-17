---
concept_id: concept.probability.martingales
title: Martingales
slug: /concepts/martingales
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: A martingale is a process whose conditional expectation of the next value, given everything observed so far, is exactly its current value — a hypothesis weak enough to arise almost everywhere in probability and strong enough to force theorems about stopping, convergence and concentration.
categories:
  - Mathematics/Probability & Statistics
primary_category: Mathematics/Probability & Statistics
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: The defining identity is a conditional expectation given a sigma-algebra, so a reader who has not met conditional expectation cannot read the definition at all.
  - type: requires
    target: concept.analysis.measure_theory
    note: Filtrations are increasing families of sigma-algebras, stopping times are defined by a measurability condition, and uniform integrability is the measure-theoretic hypothesis that makes the limit theorems work.
  - type: specializes
    target: concept.probability.stochastic_processes
    note: A martingale is a stochastic process singled out by one condition on its conditional increments, stated in the adaptedness and filtration language the general theory supplies.
  - type: contributes_to
    target: concept.probability.concentration_inequalities
    note: Azuma-Hoeffding and the bounded-differences inequality extend concentration from independent sums to dependent sequences by routing the quantity of interest through a martingale.
sources:
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - concrete-example
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.vershynin.high_dimensional_probability
    title: Roman Vershynin, High-Dimensional Probability
    url: https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **martingale** is not a sequence of random variables on its own; it is a
sequence together with a **filtration**. On a probability space
$(\Omega, \mathcal{F}, P)$, let $\mathcal{F}_0 \subseteq \mathcal{F}_1 \subseteq
\cdots \subseteq \mathcal{F}$ be an increasing family of $\sigma$-algebras —
everything observable by time $n$. Then $(X_n)_{n \ge 0}$ is a martingale with
respect to $(\mathcal{F}_n)$ when

1. $X_n$ is $\mathcal{F}_n$-measurable for every $n$ (the process is **adapted**),
2. $E|X_n| < \infty$ for every $n$, and
3. $E[X_{n+1} \mid \mathcal{F}_n] = X_n$ almost surely.

Replacing the equality in (3) by $\ge$ gives a **submartingale** and by $\le$ a
**supermartingale**. The filtration is part of the object: "$X_n$ is a
martingale" is an incomplete sentence, and the same sequence can satisfy (3)
against one filtration and fail against a larger one.

## Why it matters

Independence, stationarity and the Markov property are strong hypotheses that
real processes usually violate. The martingale property constrains one
conditional mean and nothing else, and still forces three theorems: under
checkable conditions no rule for deciding when to stop changes the mean; an
$L^1$-bounded martingale converges almost surely; and a martingale with bounded
increments concentrates as tightly as a sum of independent bounded variables.

What makes this pay is that martingales are usually built, not found: any adapted
integrable sequence splits uniquely into a martingale plus a predictable drift
(the Doob decomposition). So the theorems reach quantities with no gambling
interpretation — a random graph's largest component, the error of a stochastic
gradient step, a likelihood ratio under a null hypothesis.

## Intuition

The picture to carry is forecasting, not gambling: your current value is already
your best forecast of every future value given what you know. The tower property
extends the one-step condition to $E[X_m \mid \mathcal{F}_n] = X_n$ for all
$m \ge n$, so the forecast is flat at every horizon.

The usual gloss is "a fair game", and that is the gloss to be careful with.
Colloquial fairness suggests symmetric, moderate risk; the condition constrains
one conditional mean, so a martingale may gain one unit with probability $0.99$
and lose ninety-nine with probability $0.01$ at every step. Worse for the
analogy: a martingale bounded below — a gambler with limited liability — must
converge almost surely, and the expected value of that limit can be strictly less
than where it started. In a fair game with a floor, money goes missing in the
limit.

## Concrete example

The doubling strategy, the betting system the word is named after. Flip a fair
coin repeatedly, bet one unit on heads, and double the stake after every loss.
Let $X_n$ be net winnings after $n$ rounds, $\mathcal{F}_n$ the $\sigma$-algebra
of the first $n$ flips — so $X$ is a martingale with $X_0 = 0$ — and $\tau$ the
first round you win.

If the first head comes on round $4$ you staked $1, 2, 4$ and lost — down $7$ —
then staked $8$ and won, netting $+1$. In general
$-(2^{k-1} - 1) + 2^{k-1} = 1$, so $X_\tau = 1$ with probability one, while
$P(\tau = k) = 2^{-k}$ gives $\tau < \infty$ almost surely and $E[\tau] = 2$. So
$E[X_\tau] = 1 \ne 0 = E[X_0]$: the mean has moved.

Look at the stopped process. $X_{n \wedge \tau}$ equals $1$ with probability
$1 - 2^{-n}$ and $-(2^n - 1)$ with probability $2^{-n}$, so

$$
E[X_{n \wedge \tau}] = (1 - 2^{-n}) \cdot 1 + 2^{-n} \cdot \big(-(2^n - 1)\big) = 0
$$

for every finite $n$, and $E|X_{n \wedge \tau}| = 2 - 2^{1-n} \le 2$, so the
family is even bounded in $L^1$. It converges almost surely to $X_\tau = 1$ and
never in mean: one atom of probability $2^{-n}$ carries value $-(2^n - 1)$ and
contributes about $-1$ however far out you truncate. That failure of uniform
integrability is the only thing that went wrong. Impose a bankroll
$B = 2^m - 1$ and the stopped process is bounded — you now lose $2^m - 1$ with
probability $2^{-m}$ — and the mean is zero again.

## Formal treatment

A **stopping time** is a random $\tau : \Omega \to \{0, 1, \dots\} \cup
\{\infty\}$ with $\{\tau \le n\} \in \mathcal{F}_n$: whether you have stopped by
time $n$ is decidable from what you have seen. For any stopping time the stopped
process $X_{n \wedge \tau}$ is again a martingale, so
$E[X_{n \wedge \tau}] = E[X_0]$ for all finite $n$. Every difficulty below is
about the limit $n \to \infty$.

**Optional stopping.** Let $X$ be a martingale and $\tau$ a stopping time. Then
$E[X_\tau] = E[X_0]$ under any one of:

- (i) $\tau \le N$ almost surely for a constant $N$;
- (ii) $\tau < \infty$ almost surely and $|X_{n \wedge \tau}| \le M$ almost
  surely for a constant $M$;
- (iii) $E[\tau] < \infty$ and $E[\,|X_{n+1} - X_n| \mid \mathcal{F}_n] \le B$
  almost surely for a constant $B$.

Each forces $\{X_{n \wedge \tau}\}$ to be uniformly integrable, which upgrades
almost sure convergence to convergence of means — and that is the general
statement. For supermartingales the equalities become $\le$, and for a
nonnegative supermartingale $E[X_\tau] \le E[X_0]$ follows from Fatou's lemma
alone.

**Martingale convergence (Doob).** If $\sup_n E[X_n^+] < \infty$ — for a
martingale, equivalently $\sup_n E|X_n| < \infty$ — then $X_n \to X_\infty$
almost surely with $E|X_\infty| < \infty$. The proof is the upcrossing
inequality: an $L^1$-bounded submartingale cannot cross a fixed interval
$[a, b]$ infinitely often. The conclusion says nothing about means;
$E[X_\infty] = E[X_0]$ needs uniform integrability, which is also exactly the
condition for $L^1$ convergence and for the martingale to be _closed_,
$X_n = E[X_\infty \mid \mathcal{F}_n]$.

**Azuma–Hoeffding.** If $|X_k - X_{k-1}| \le c_k$ almost surely for constants
$c_k$, then for every $t > 0$

$$
P\big(|X_n - X_0| \ge t\big) \;\le\; 2 \exp\!\left(\frac{-t^2}{2 \sum_{k=1}^n c_k^2}\right).
$$

With $c_k \equiv c$ this is numerically Hoeffding's bound for $n$ independent
increments of range $2c$: independence has been replaced by the martingale
property at no cost in the exponent.

## Assumptions and requirements

Integrability is not a technicality: without $E|X_n| < \infty$ the conditional
expectation in (3) is undefined, so a random walk with Cauchy increments fails to
be a martingale for want of a first moment.

Which filtration matters. Let $\xi_i$ be i.i.d. with $P(\xi_i = \pm 1) = 1/2$ and
$S_n = \xi_1 + \cdots + \xi_n$. Against
$\mathcal{F}_n = \sigma(\xi_1, \dots, \xi_n)$, $S$ is a martingale; against
$\mathcal{G}_n = \sigma(\xi_1, \dots, \xi_{n+1})$ it is not, since
$E[S_{n+1} \mid \mathcal{G}_n] = S_{n+1}$. One peek ahead destroys the property
without touching the process.

Optional stopping needs one of (i)–(iii); $\tau < \infty$ almost surely is not
one of them. Convergence needs $L^1$ boundedness and buys only almost sure
convergence. Azuma–Hoeffding needs increments bounded _almost surely_ — bounded
in probability or in $L^2$ is not enough — and otherwise the replacement bounds
are keyed to the predictable quadratic variation
$\sum_k E[(X_k - X_{k-1})^2 \mid \mathcal{F}_{k-1}]$. Nothing here assumes
independence, identical distribution, the Markov property or stationarity, and
that absence is the point.

## Uses and applicability

Reach for martingales when a quantity has a natural "no drift given the past"
structure, or when one can be manufactured. The _Doob_ or _exposure_ martingale
reveals the input one coordinate at a time,
$M_i = E[f(Z_1, \dots, Z_n) \mid Z_1, \dots, Z_i]$; if $f$ moves by at most
$c_i$ when coordinate $i$ changes, Azuma–Hoeffding yields the bounded-differences
inequality, the standard route to concentration for randomized algorithms and
random graphs. Stochastic gradient noise is a martingale difference sequence
rather than an independent one, since each iterate depends on all past noise, so
its almost sure convergence arguments go through supermartingale convergence. And
the likelihood ratio under a simple null is a nonnegative martingale of mean one,
so Ville's inequality $P(\sup_n L_n \ge 1/\alpha) \le \alpha$ makes "stop
whenever you like" a valid test.

Do not reach for them when the summands really are independent and you want a
tail bound; Hoeffding or Bernstein is shorter. Nor for a limiting distribution
rather than almost sure behaviour, which needs a martingale central limit theorem
with its own variance conditions.

## Limitations and common mistakes

**"A martingale is a fair game."** It is a statement about one conditional mean;
variance, skew and tail weight are unconstrained.

**Using optional stopping with only $\tau < \infty$.** The commonest error of
all, and the doubling strategy is its counterexample.

**Confusing almost sure convergence with convergence of means.** A symmetric
simple random walk started at $1$ and stopped on hitting $0$ is a nonnegative
martingale, so it converges almost surely, and the limit must be $0$ because the
walk hits $0$ with probability one — yet $E[X_n] = 1$ for every $n$. The limit
exists; the mean does not follow it.

**Assuming a function of a martingale is a martingale.** By Jensen's inequality
$\varphi(X_n)$ is a *sub*martingale for convex integrable $\varphi$, so
$E[X_n^2]$ is non-decreasing rather than constant.

**Expecting a clever strategy to escape.** For predictable bounded stakes $H_n$
the transform $\sum_m H_m (X_m - X_{m-1})$ is again a martingale — the theorem
behind "no gambling system beats a fair game". Boundedness is only the
convenient hypothesis — integrability of each $H_m (X_m - X_{m-1})$ suffices —
and the conclusion is about each finite $n$. The doubling strategy helps itself
to stakes growing without bound over an unbounded horizon and still satisfies
it: its winnings are a martingale at every finite time, and what fails at the
stopping time $\tau$ is uniform integrability, not the transform theorem.

## Variants and alternatives

Sub- and supermartingales are the one-sided versions and carry most of the
theory; the Doob decomposition reduces the general adapted case to them.
_Martingale difference sequences_ stand in for i.i.d. mean-zero noise in laws of
large numbers and central limit theorems, and _backwards martingales_, indexed by
a decreasing family of $\sigma$-algebras, converge under no extra hypotheses. In
continuous time the important refinement is the _local martingale_, which has the
property only up to a sequence of stopping times; strict local martingales that
are not martingales are a real phenomenon, and the distinction bites in
stochastic integration and asset pricing.

Among concentration bounds, Azuma–Hoeffding is keyed to the range of the
increments, Freedman's inequality to their predictable quadratic variation
(sharper when typical fluctuations fall far below the worst case), and
McDiarmid's bounded-differences inequality to functions of independent variables.
Competing approaches trade generality for structure: direct inequalities for
independent sums, spectral gaps for Markov chains, ergodic theory for stationary
sequences.

## History and attribution

The word is older than the mathematics: a _martingale_ was a betting system, the
doubling strategy above, and the etymology beyond that is contested. Paul Lévy
worked with the defining condition in the 1930s, as a hypothesis on sums of
dependent variables. Jean Ville introduced the term into probability in 1939, in
a critique of von Mises' theory of collectives; the inequality for nonnegative
supermartingales carries his name. Joseph Doob built the systematic theory
through the 1940s — upcrossings, convergence, maximal inequalities, optional
stopping — and set it out in his 1953 book _Stochastic Processes_. The
concentration results came later: Hoeffding's 1963 inequality for bounded
independent sums was extended to martingales with bounded increments by Azuma in
1967, and McDiarmid's 1989 survey made the bounded-differences form standard.

## Sources

Durrett's _Probability: Theory and Examples_ carries the formal treatment: its
martingale chapter builds conditional expectation, proves the upcrossing and
convergence theorems, develops uniform integrability, states the optional
stopping theorems in the graded form used here, and supplies the random walk
applications and the stopped-walk counterexample; the forecasting reading and the
fair-game caveat above come from the same chapter. MIT 6.041 is cited for
nothing here, since it covers neither measure theory nor martingales, but it is
the gentler entry point for the conditional expectation and random walks this
page assumes. Vershynin's _High-Dimensional Probability_ is cited for
the neighbouring inequalities, not for martingales: it develops Hoeffding and
Bernstein for independent sums and states McDiarmid's inequality, while saying
plainly that martingale methods are among the approaches it leaves out.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first, and conditional
expectation given a $\sigma$-algebra in particular — the definition here is one
line of it. [Measure Theory](./measure-theory.md) supplies the $\sigma$-algebras,
the almost-sure language and uniform integrability, and
[Stochastic Processes](./stochastic-processes.md) the surrounding vocabulary and
the processes martingale arguments are applied to.

What this opens up: [Concentration Inequalities](./concentration-inequalities.md)
in the dependent case; continuous-time stochastic calculus, where the martingale
property is the defining feature of the Itô integral; and sequential inference,
where Ville's inequality turns a nonnegative martingale into a test that stays
valid however long you watch it.
