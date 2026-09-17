---
concept_id: concept.probability.probability_theory
title: Probability Theory
slug: /concepts/probability-theory
aliases:
  - Kolmogorov axioms
kind: concept
tier: 1
review_state: generated-draft
summary: The measure-theoretic framework in which chance is a mass-one measure, random variables are measurable functions, and the law of large numbers and the central limit theorem are theorems rather than folklore.
categories:
  - Mathematics/Probability & Statistics
primary_category: Mathematics/Probability & Statistics
relationships:
  - type: requires
    target: concept.analysis.measure_theory
    note: A probability space is a measure space of total mass one, and expectation, almost-sure convergence and conditional expectation are respectively the Lebesgue integral, convergence off a null set, and a Radon–Nikodym derivative.
  - type: prerequisite_of
    target: concept.probability.stochastic_processes
    note: A process is an indexed family of random variables carried by one probability space, and that such a space exists at all is the Kolmogorov extension theorem stated here.
  - type: contributes_to
    target: concept.probability.concentration_inequalities
    note: Concentration replaces the asymptotic limit theorems with bounds that hold at a fixed sample size, and is written entirely in the vocabulary of independence and expectation set up here.
  - type: contributes_to
    target: concept.probability.bayesian_inference
    note: Bayes' rule and the posterior are theorems about conditional expectation in this framework; what the two statistical schools disagree about is the interpretation of the prior, not the axioms.
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
  - source_id: source.vershynin.high_dimensional_probability
    title: Roman Vershynin, High-Dimensional Probability
    url: https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Probability theory** studies a measure space of total mass one together with
the structures that only become interesting at mass one: distributions,
independence, conditioning, the limit theorems. A **probability space** is a
triple $(\Omega, \mathcal{F}, \mathbb{P})$ — a **sample space** $\Omega$, a
$\sigma$-algebra $\mathcal{F}$ of **events**, and a countably additive
$\mathbb{P} : \mathcal{F} \to [0,1]$ with $\mathbb{P}(\Omega) = 1$. Those are
Kolmogorov's axioms, and they are all of them.

A **random variable** is a measurable map $X : \Omega \to \mathbb{R}$; its
**law** is the pushforward measure $\mu_X(B) = \mathbb{P}(X^{-1}(B))$ on the
Borel sets; its **expectation** is the integral $\mathbb{E}[X] = \int_\Omega X \,
d\mathbb{P}$. Events $A_1, \dots, A_n$ are **independent** when
$\mathbb{P}(A_{i_1} \cap \cdots \cap A_{i_k}) = \prod_j \mathbb{P}(A_{i_j})$ for
every subcollection. Everything up to independence is
[Measure Theory](./measure-theory.md) with one normalisation; independence itself
is what probability adds, and it has no analogue in general measure theory.

## Why it matters

Before 1933 there was no single general framework for what the probability of an
event _is_, and the gap blocked calculation rather than merely philosophy:
Bertrand's 1889 paradox showed that "a random chord of a circle" has three
defensible answers, each from a different unstated measure. Particular infinite
models were already rigorous — Borel (1909) gave infinite coin-flip sequences a
home in Lebesgue measure on $[0,1]$ read through binary expansions, and proved
there that the fraction of heads converges to $1/2$ almost surely; Steinhaus
axiomatised that model in 1923 — but each was built by hand for one experiment.
Fixing the measure in general makes the question well posed and the answer a
theorem.

The payoff is that the two facts everyone uses — averages stabilise, errors are
Gaussian — acquire checkable hypotheses and recognisable failure modes, and
everything from statistical inference to generalisation bounds inherits its
guarantees from them.

## Intuition

Picture a single draw: nature picks one point $\omega \in \Omega$, once, and
every random quantity is a _measurement_ $X(\omega)$ of that same point. That is
why $X + Y$ makes sense and why dependence is not mysterious — two functions of
the same argument need not vary independently. The $\sigma$-algebra $\mathcal{F}$
is the set of questions you may ask; a sub-$\sigma$-algebra is what a partially
informed observer can resolve.

The analogy breaks in a way worth knowing: you never construct $\Omega$. For coin
flips it is $\{0,1\}^\mathbb{N}$ under the product measure; in applied work it is
left unspecified, because what you manipulate are laws on $\mathbb{R}^d$ and
$\Omega$ merely guarantees a common domain. Independence, likewise, is a relation
between sub-$\sigma$-algebras, not a property of any one distribution.

## Concrete example

Let $X_1, \dots, X_{100}$ be independent fair coin flips, $X_i \in \{0,1\}$, and
$S = \sum_i X_i$. Then $\mathbb{E}[S] = 50$ and $\operatorname{Var}(S) = 100
\cdot \tfrac14 = 25$, so $\sigma = 5$. Ask for $\mathbb{P}(S \ge 60)$.

The exact answer is $2^{-100} \sum_{k=60}^{100} \binom{100}{k} = 0.02844$.

Chebyshev's inequality bounds the two-sided event, $\mathbb{P}(|S - 50| \ge 10)
\le 25/100 = 0.25$, against a true value of $0.0569$ — valid, and loose by more
than a factor of four. The CLT approximates $\mathbb{P}(S \ge 60) \approx 1 -
\Phi(2) = 0.02275$, which is $20\%$ low; with the continuity correction,
$1 - \Phi(1.9) = 0.02872$, within $1\%$.

Three lessons in one computation: the crude tail bound is valid at every $n$ and
loose; the CLT is sharp here but carries no error bar; and the correction that
closes most of the remaining gap is a lattice artefact, not part of the theorem.

## Formal treatment

Let $X_1, X_2, \dots$ be independent and identically distributed, with $S_n =
\sum_{i=1}^n X_i$.

**Weak law (Khinchin).** If $\mathbb{E}|X_1| < \infty$ with mean $\mu$, then
$S_n / n \to \mu$ in probability.

**Strong law (Kolmogorov).** Under the same hypothesis, $S_n / n \to \mu$ almost
surely — on a set of probability one. The converse holds: if $\mathbb{E}|X_1| =
\infty$ then $\limsup_n |S_n| / n = \infty$ almost surely, so the sample mean
does not converge slowly; it fails to converge.

**Central limit theorem.** If additionally $\sigma^2 = \operatorname{Var}(X_1)
\in (0, \infty)$, then

$$
\frac{S_n - n\mu}{\sigma \sqrt{n}} \;\Rightarrow\; N(0,1),
$$

convergence in distribution: $\mathbb{P}\big((S_n - n\mu)/(\sigma\sqrt n) \le
x\big) \to \Phi(x)$ at every $x$.

Finite variance is not decoration. If the $X_i$ have regularly varying tails of
index $\alpha \in (0,2)$, the correct normalisation is $n^{1/\alpha}$ and the
limit is an $\alpha$-**stable** law with infinite variance. For standard Cauchy
variables $S_n/n$ is again standard Cauchy — no law of large numbers, no CLT, and
a mean of $10^6$ draws is no better than one. The boundary is subtle: a variable
can have infinite variance and still be attracted to the normal law, with
normalisation $\sqrt{n} L(n)$ for slowly varying $L$.

**Conditional expectation.** For $X$ integrable and $\mathcal{G} \subseteq
\mathcal{F}$ a sub-$\sigma$-algebra, $\mathbb{E}[X \mid \mathcal{G}]$ is the
almost-surely unique $\mathcal{G}$-measurable integrable variable satisfying

$$
\int_G \mathbb{E}[X \mid \mathcal{G}] \, d\mathbb{P} = \int_G X \, d\mathbb{P}
\qquad \text{for all } G \in \mathcal{G},
$$

which exists by Radon–Nikodym. This is the only route to conditioning on a
probability-zero event — the elementary $\mathbb{P}(A \mid B) = \mathbb{P}(A \cap
B)/\mathbb{P}(B)$ is undefined there — and "almost surely unique" is the loophole
the Borel–Kolmogorov paradox exploits.

## Assumptions and requirements

**Countable additivity** is the axiom with teeth. Weaken it to finite additivity
and a uniform distribution on the integers becomes available, but the convergence
theorems, and with them both limit theorems, go.

**Mutual independence** is needed for the central limit theorem, where pairwise
independence does not suffice. The laws of large numbers ask less: Etemadi's
theorem gives the strong law for _pairwise_ independent identically distributed
variables with $\mathbb{E}|X_1| < \infty$, and the $L^2$ weak law needs only
uncorrelatedness and finite variance. Independence can be weakened further to
mixing or martingale-difference conditions, but not removed.

**Identical distribution** can go: Lindeberg–Feller replaces it with the
condition that no single summand contributes a non-negligible share of the
variance, and Kolmogorov's criterion $\sum_n \operatorname{Var}(X_n)/n^2 <
\infty$ plays that role for the strong law.

**A rich enough space.** That an infinite iid sequence exists at all is the
Kolmogorov extension theorem, needing consistent finite-dimensional laws on a
standard Borel (e.g. Polish) space. The same regularity makes **regular
conditional distributions** exist, so $\mathbb{P}(\cdot \mid
\mathcal{G})(\omega)$ is a measure for almost every $\omega$.

## Uses and applicability

Reach for the measure-theoretic framework when randomness is indexed by something
infinite — a sequence, a time parameter, a function space — or when you need
conditioning on continuous quantities, limits of random objects, or convergence
theorems. Stochastic processes, martingale arguments and the asymptotic theory
behind estimators all require it. Do not reach for it when a finite sample space
and combinatorics answer the question.

Note also that the theory is silent on where $\mathbb{P}$ comes from. Choosing
the measure is modelling, and a derivation from a wrong independence assumption
is wrong with full rigour.

## Limitations and common mistakes

**The CLT is asymptotic and says nothing at fixed $n$.** The theorem carries no
error term. Berry–Esseen supplies one — $\sup_x |F_n(x) - \Phi(x)| \le C \rho /
(\sigma^3 \sqrt{n})$ with $\rho = \mathbb{E}|X_1 - \mu|^3$ and $C$ an absolute
constant — at the cost of a third moment. This is why high-dimensional work leans
on concentration inequalities, which are non-asymptotic by construction.

**The CLT describes the centre, not the far tail.** Convergence is in fact
uniform in $x$ — Pólya's theorem, because $\Phi$ is continuous — but uniformity
controls only the _absolute_ error. For fixed $t > 0$ the probability
$\mathbb{P}(S_n \ge n\mu + tn)$ is itself vanishing, exponentially fast under a
Cramér condition, while the CLT's error decays like $1/\sqrt{n}$; the ratio of
the two is uncontrolled, so the relative error does not vanish and that regime
belongs to large-deviation theory.

**Uncorrelated is not independent, and pairwise is not mutual.** Let $X, Y$ be
independent and uniform on $\{-1, +1\}$, and $Z = XY$: the three are pairwise
independent, yet $\mathbb{P}(X = Y = Z = 1) = 1/4 \ne 1/8$.

**Conditioning on a null event is not well posed by itself** — the
Borel–Kolmogorov paradox. Take a uniform point on the sphere and condition on its
lying on a great circle: the equator gives the uniform distribution, a meridian
gives a density proportional to $\cos(\text{latitude})$, and symmetry says two
great circles should agree. The resolution is that conditional expectation is
defined only up to null sets, so you condition on a _random variable_ (latitude,
or longitude), not on the event; different variables vanishing on the same circle
give different answers, and neither is wrong.

**The law of large numbers does not correct deviations.** For fair coins $S_n -
n/2$ has standard deviation growing like $\sqrt{n}$; only the ratio $S_n/n$
converges. The gambler's fallacy is the belief that the numerator is controlled.

## Variants and alternatives

**Non-asymptotic probability** — Hoeffding, Bernstein, the sub-Gaussian machinery
— answers the limit theorems' questions at finite $n$, buying a usable guarantee
at the cost of sharp constants.

On foundations, **de Finetti** and **Cox** derive the same arithmetic from
coherent betting odds or from desiderata on degrees of belief rather than from
measure; both reach finite additivity, and countable additivity stays an extra
assumption. **Finitely additive probability** after Dubins and Savage keeps
uniform distributions on infinite sets and gives up the convergence theorems.
**Dempster–Shafer belief functions** and **imprecise probability** replace the
single measure with a set of them, representing ignorance more honestly and
losing a unique answer. **Quantum probability**, built on projections in a
Hilbert space, is genuinely not a special case. Frequentists and Bayesians, by
contrast, share the axioms and differ on interpretation alone.

## History and attribution

The subject is usually dated to the 1654 correspondence between Pascal and Fermat
on the problem of points, with Huygens publishing the first treatise in 1657;
Cardano had calculated with chances a century earlier. Jacob Bernoulli's
posthumous _Ars Conjectandi_ (1713) proved the first law of large numbers, for
Bernoulli trials; de Moivre found the normal approximation to the binomial in
1733 and Laplace generalised it in 1812. Chebyshev, Markov and Lyapunov made the
limit theorems rigorous late in the nineteenth century, Borel proved a strong law
in 1909 while studying normal numbers, and Lindeberg gave the modern condition in 1922.

Axiomatisation came last. Hilbert's sixth problem (1900) asked for it explicitly,
and Kolmogorov's _Grundbegriffe der Wahrscheinlichkeitsrechnung_ (1933) settled
it by identifying probability with a mass-one measure and conditional expectation
with a Radon–Nikodym derivative.

## Sources

Durrett's _Probability: Theory and Examples_ is the reference for everything
technical here: the axioms, independence, both laws of large numbers with their
converses, Lindeberg–Feller, stable limits under infinite variance, and
conditional expectation. MIT 6.041 does the limit theorems without measure theory
and is the better first pass at intuition and at worked numbers like the binomial
computation above. Vershynin shows why the CLT's asymptotics are inadequate at a
fixed sample size. MacKay uses probability as a calculus of inference and argues
the degree-of-belief foundation against sampling theory.

## Prerequisites and next connections

Read [Measure Theory](./measure-theory.md) first — not for culture, but because
$\sigma$-algebras, the Lebesgue integral, the convergence theorems and
Radon–Nikodym are the actual content of the definitions above — with
[Real Analysis](./real-analysis.md) under that and [Set Theory](./set-theory.md)
behind the countable-versus-arbitrary distinction in a $\sigma$-algebra.

From here, the characteristic function $\varphi_X(t) = \mathbb{E}[e^{itX}]$ is
the Fourier transform of the law, and the standard CLT proof is a
[Fourier Analysis](./fourier-analysis.md) argument. Square-integrable random
variables form a [Hilbert Space](./hilbert-spaces.md) in which conditional
expectation is orthogonal projection onto the $\mathcal{G}$-measurable subspace —
the cleanest way to see why it is the best mean-square predictor.
