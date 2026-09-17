---
concept_id: concept.probability.concentration_inequalities
title: Concentration Inequalities
slug: /concepts/concentration-inequalities
kind: concept
tier: 1
review_state: generated-draft
summary: Explicit, non-asymptotic bounds on the chance that an average — or any well-behaved function of many independent variables — lands far from its mean, and the reason a finite sample can certify anything at all.
categories:
  - Mathematics/Probability & Statistics
primary_category: Mathematics/Probability & Statistics
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: Every inequality here is a statement about expectations, independence and moment generating functions, so a reader without those objects cannot parse the hypotheses, let alone check them.
  - type: supported_by
    target: concept.probability.martingales
    note: Azuma's inequality is stated for martingale difference sequences, and McDiarmid's is proved by applying it to the Doob martingale of the function, so the half of this page that drops independence rests on martingale machinery.
  - type: contributes_to
    target: concept.probability.high_dimensional_statistics
    note: Results such as covariance estimation in $n \ll d$ regimes and sparse recovery are proved by concentrating a sum of independent terms and then paying a union bound over dimensions.
  - type: contributes_to
    target: concept.probability.probability_and_computing
    note: Chernoff bounds are what turn a randomised algorithm's expected behaviour into a failure probability small enough to ignore, which is why repetition-and-majority amplification works.
sources:
  - source_id: source.vershynin.high_dimensional_probability
    title: Roman Vershynin, High-Dimensional Probability
    url: https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.probabilistic_systems
    title: MIT 6.041 Probabilistic Systems Analysis and Applied Probability (Fall 2010)
    url: https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - concrete-example
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **concentration inequality** is a theorem of the form: under stated hypotheses
on $X$, for every $t > 0$,

$$
\Pr\bigl(|X - \mathbb{E}X| \ge t\bigr) \le B(t),
$$

with $B$ an explicit function that holds at every sample size, not in a limit.
The name refers to the phenomenon as much as to the theorems: a function of many
weakly dependent random inputs is usually nearly constant, and these are its
quantitative statements. The standard family, ordered by how much each assumes
and how fast its bound decays:

| Inequality | Hypotheses                              | Tail                                     |
| ---------- | --------------------------------------- | ---------------------------------------- |
| Markov     | $X \ge 0$, $\mathbb{E}X < \infty$       | $\mathbb{E}X / t$                        |
| Chebyshev  | finite variance                         | $\sigma^2 / t^2$                         |
| Chernoff   | MGF finite near $0$                     | $e^{-\lambda t} \mathbb{E}e^{\lambda X}$ |
| Hoeffding  | independent, bounded                    | $e^{-2t^2 / \sum (b_i - a_i)^2}$         |
| Bernstein  | independent, bounded, small variance    | $e^{-t^2 / (2\sigma^2 + 2Mt/3)}$         |
| Azuma      | bounded martingale increments           | $e^{-t^2 / (2\sum c_k^2)}$               |
| McDiarmid  | independent inputs, bounded differences | $e^{-2t^2 / \sum c_i^2}$                 |

The ordering is real but not a straight line: Azuma buys freedom from
independence and McDiarmid freedom from the sum structure, rather than a smaller
number.

## Why it matters

The weak law of large numbers says an average converges; it does not say how
many samples buy a given accuracy. A concentration inequality does, at a fixed
$n$, with no appeal to asymptotics. That is what makes a confidence interval
honest for $n = 40$, what lets repetition drive a randomised algorithm's failure
probability below $2^{-64}$, and what makes generalisation bounds possible:
training error is an average of losses, test error is its mean, and the gap
between them is exactly a deviation event.

## Intuition

One coin flip tells you nothing. A thousand tell you the bias to within a few
percent, because for the average to be far off, many independent flips must
conspire in the same direction — and the number of ways to fail grows far more
slowly than the number of ways to be right. Markov's inequality is the crudest
version of this accounting: mass far out to the right costs expectation, so
there cannot be much of it.

The analogy breaks twice. Conspiracy is cheap when one variable can dominate:
with heavy tails a single term carries the average and no exponential bound
holds. And "independent" can be weakened to "each step changes the answer only
a little" — that is Azuma — but not to "weakly correlated" in any informal
sense.

## Concrete example

Toss a fair coin $n = 1000$ times and ask for $\Pr(|\bar{X} - 0.5| \ge 0.05)$.

Chebyshev, with $\sigma^2 = 1/4$ per toss and hence $\sigma^2/n$ for the mean:

$$
\frac{0.25}{1000 \times 0.05^2} = 0.10 .
$$

Hoeffding, with each $X_i \in [0,1]$:

$$
2\exp\!\bigl(-2 \times 1000 \times 0.05^2\bigr) = 2e^{-5} = 0.0135 .
$$

The exact binomial answer is $0.00173$. So Hoeffding is about $7.4$ times
tighter than Chebyshev here, and still overstates the truth by about a factor
of $8$ — tight enough to use, never tight enough to trust as an estimate.

Read the same numbers as sample sizes. To certify $\pm 0.05$ at failure
probability $0.01$, Chebyshev demands $n \ge 0.25/(0.01 \times 0.05^2) = 10{,}000$
and Hoeffding $n \ge \ln(200)/(2 \times 0.05^2) \approx 1060$: a tenfold saving
from one extra hypothesis, boundedness.

Now make the coin biased, $p = 0.01$, same $n$ and $t = 0.01$. Hoeffding gives
$2e^{-0.2} = 1.64$ — vacuous, because it only knows the range $[0,1]$.
Bernstein, which knows $\sigma^2 = 0.0099$, gives

$$
2\exp\!\left(-\frac{1000 \times 0.01^2}{2(0.0099) + 2(1)(0.01)/3}\right) = 0.046 .
$$

## Formal treatment

**Markov.** For $X \ge 0$ and $a > 0$, $\Pr(X \ge a) \le \mathbb{E}X / a$.
Everything below is Markov applied to a cleverer function: applied to
$(X - \mathbb{E}X)^2$ it gives **Chebyshev**,
$\Pr(|X - \mathbb{E}X| \ge t) \le \sigma^2/t^2$.

**Chernoff method.** Applied to $e^{\lambda X}$ with $\lambda > 0$ it gives
$\Pr(X \ge t) \le \inf_{\lambda>0} e^{-\lambda t}\,\mathbb{E}e^{\lambda X}$. For
independent $X_i$ and $S_n = \sum_i X_i$, $\mathbb{E}e^{\lambda S_n} =
\prod_i \mathbb{E}e^{\lambda X_i}$, so the problem reduces to one MGF.

Call $X$ **sub-Gaussian** with proxy $\sigma$ if
$\mathbb{E}e^{\lambda(X - \mathbb{E}X)} \le e^{\lambda^2\sigma^2/2}$ for all
$\lambda \in \mathbb{R}$; then $\Pr(|X - \mathbb{E}X| \ge t) \le 2e^{-t^2/(2\sigma^2)}$.
Hoeffding's lemma supplies the proxy for bounded variables: $X \in [a,b]$ is
sub-Gaussian with $\sigma = (b-a)/2$.

**Hoeffding.** For independent $X_i \in [a_i, b_i]$ and $S_n = \sum_i X_i$,

$$
\Pr\bigl(|S_n - \mathbb{E}S_n| \ge t\bigr)
\le 2\exp\!\left(\frac{-2t^2}{\sum_{i=1}^n (b_i - a_i)^2}\right).
$$

**Bernstein.** If additionally $|X_i - \mathbb{E}X_i| \le M$ and
$\sigma^2 = \frac{1}{n}\sum_i \operatorname{Var}(X_i)$, then for the mean
$\bar{X}$,

$$
\Pr\bigl(|\bar{X} - \mathbb{E}\bar{X}| \ge t\bigr)
\le 2\exp\!\left(\frac{-nt^2}{2\sigma^2 + \tfrac{2}{3}Mt}\right),
$$

a Gaussian tail $e^{-nt^2/2\sigma^2}$ for small $t$ degrading to an exponential
tail $e^{-3nt/2M}$ for large $t$ — the sub-exponential regime.

**Azuma.** Let $(M_k)_{k \le n}$ be a martingale with respect to a filtration
$(\mathcal{F}_k)$ and $|M_k - M_{k-1}| \le c_k$ almost surely. Then
$\Pr(|M_n - M_0| \ge t) \le 2\exp\bigl(-t^2/(2\sum_k c_k^2)\bigr)$. Independence
is gone; only bounded increments remain.

**McDiarmid.** Let $X_1,\dots,X_n$ be independent and let
$f: \mathcal{X}^n \to \mathbb{R}$ satisfy the bounded-differences condition: for
each $i$, changing the $i$-th coordinate alone changes $f$ by at most $c_i$.
Then

$$
\Pr\bigl(|f(X) - \mathbb{E}f(X)| \ge t\bigr)
\le 2\exp\!\left(\frac{-2t^2}{\sum_{i=1}^n c_i^2}\right).
$$

The proof runs Azuma on the Doob martingale $M_k = \mathbb{E}[f \mid \mathcal{F}_k]$.
Consistency check: take $f(x) = \frac1n\sum_i x_i$ with $x_i \in [a,b]$, so
$c_i = (b-a)/n$, and McDiarmid returns Hoeffding for the mean exactly.

## Assumptions and requirements

**Independence** is what makes the MGF factorise; drop it and Chernoff-type
bounds fail outright unless replaced by martingale structure or an explicit
mixing condition.

**Boundedness or a tail condition.** Hoeffding needs a range, Bernstein a range
and a variance, the general statement sub-Gaussianity or sub-exponentiality. For
a Pareto tail no exponential bound exists and Chebyshev is the best available;
for a Cauchy variable even the mean is undefined and none of this applies.

**Almost-sure bounds.** Azuma's $c_k$ and McDiarmid's $c_i$ must hold on every
realisation, not on average. A condition that fails on a set of probability
$10^{-6}$ invalidates the theorem, though it can often be rescued by
conditioning on a high-probability event and paying $10^{-6}$ for it.

**Identical distribution is never required**, only independence and the
per-coordinate bounds; nor need $f$ be smooth in McDiarmid, which is why it
applies to combinatorial quantities such as chromatic numbers.

## Uses and applicability

Reach for concentration when you need a guarantee at a finite $n$ with a stated
failure probability: sample-complexity statements, tests that must not lean on a
normal approximation, sketching and sampling guarantees, and the union-bound
step in high-dimensional proofs. In learning theory, Hoeffding plus a union
bound over a finite hypothesis class gives sample complexity
$O\bigl((\log|\mathcal{H}| + \log(1/\delta))/\varepsilon^2\bigr)$, and McDiarmid
concentrates the supremum in a Rademacher-complexity bound.

Do not reach for it when you want an accurate estimate of a tail probability.
These are worst-case upper bounds; for that use the central limit theorem with a
Berry–Esseen correction, a saddlepoint approximation, or simulation.

## Limitations and common mistakes

**The constants are worst case, and the gap compounds.** One factor of eight, as
in the coin example, is tolerable; a union bound over $10^6$ hypotheses on top
of a loose variance proxy is not.

**Hoeffding ignores the variance.** For rare events it is not merely loose but
vacuous, as the $p = 0.01$ calculation shows. Use Bernstein or Bennett whenever
$\sigma^2 \ll M^2$.

**Applying a bound to a hypothesis chosen from the data.** Hoeffding bounds the
deviation for a _fixed_ function fixed before the sample is drawn. The trained
model is a function of the sample, so the bound does not apply to it; this is
the error uniform convergence exists to repair, and forgetting it is the single
most common misuse in machine learning.

**Expecting generalisation bounds to be informative for neural networks.** They
usually are not. Plugging realistic parameter counts into uniform-convergence
bounds routinely yields deviation terms larger than $1$ — vacuous — while the
measured test error is a few percent. The bounds are not wrong, merely loose,
but treating them as predictions of test error is a category error. Why
over-parameterised networks generalise is not settled, and non-vacuous bounds
exist only in restricted settings.

**Bounded differences with a large constant.** If a single coordinate can swing
$f$ by $O(1)$ then $\sum_i c_i^2 = O(n)$, and McDiarmid says nothing about the
$\sqrt{n}$-scale deviations that matter. The maximum of $n$ variables is the
standard trap.

**Reading an upper bound as a lower bound.** $\Pr(\cdot) \le B(t)$ never implies
the deviation is anywhere near $t$; lower bounds on fluctuation are
anti-concentration results, proved by different means.

## Variants and alternatives

**Bennett's inequality** is slightly sharper than Bernstein in the Poisson-like
regime. **Freedman's inequality** is Bernstein for martingales, using the
predictable quadratic variation in place of a fixed variance. **Efron–Stein**
bounds the variance of $f$ by the same coordinate perturbation McDiarmid uses,
and opens the **entropy method** and log-Sobolev inequalities, which buy sharper
constants for stronger smoothness assumptions. **Talagrand's convex distance
inequality** beats McDiarmid when $f$ is convex-Lipschitz and few coordinates
matter. **Matrix Chernoff and matrix Bernstein** replace scalars with Hermitian
matrices and the exponential with a trace exponential, paying a dimension
factor. **Gaussian and spherical concentration** bound Lipschitz functions with
no sum structure at all.

The genuinely different alternative is asymptotics — the CLT, refined by a
Berry–Esseen rate, or the bootstrap — typically far tighter in practice.
Berry–Esseen is itself non-asymptotic, but its error is a uniform additive
$C/\sqrt{n}$ term, so it certifies nothing about a tail probability smaller
than that; the bootstrap offers no finite-sample guarantee at all.

## History and attribution

The idea has several origins. The inequality named for Chebyshev was published
by Bienaymé in 1853 and by Chebyshev in 1867, and is often called
Bienaymé–Chebyshev; Markov's inequality carries the name of Chebyshev's student.
Sergei Bernstein derived exponential bounds for sums of bounded variables in the
1920s and 1930s. Herman Chernoff's 1952 paper on the asymptotic efficiency of
hypothesis tests popularised the exponential-moment method, a trick Chernoff
himself credited to Herman Rubin. Wassily Hoeffding's 1963 paper gave the clean
bounded-variable statement used today and already reached beyond independent
sums, which is why the martingale form is written Azuma–Hoeffding after Kazuoki
Azuma's 1967 paper.

The bounded-differences method arrived from combinatorics, where it was used in
the 1980s to concentrate graph parameters such as chromatic numbers; Colin
McDiarmid's 1989 survey gave it the name and the form now cited. In parallel,
concentration of measure as a geometric phenomenon descends from Lévy's work on
the sphere and Vitali Milman's use of it in the local theory of Banach spaces in
the 1970s, with Michel Talagrand's product-space inequalities of the mid-1990s
the decisive later step.

## Sources

Vershynin's _High-Dimensional Probability_ is the modern reference: Hoeffding,
Chernoff and Bernstein developed through the sub-Gaussian and sub-exponential
classification, then carried into random matrices. Durrett's _Probability:
Theory and Examples_ supplies the measure-theoretic statements of Markov and
Chebyshev and the martingale framework the Azuma-type results need.
Shalev-Shwartz and Ben-David's _Understanding Machine Learning_ is where to see
them used, in sample-complexity and Rademacher arguments. MIT 6.041 is the
gentlest correct treatment of Markov, Chebyshev and the weak law.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first: expectation, variance,
independence and the moment generating function are the terms every hypothesis
here is stated in. "Almost surely" and conditional expectation are
measure-theoretic, so [Measure Theory](./measure-theory.md) sits underneath,
though these inequalities can be used before it.

From here, Martingales explains the conditional-expectation machinery behind
Azuma and McDiarmid.
[High-Dimensional Statistics](./high-dimensional-statistics.md) is where
concentration stops being a tool and becomes the subject,
[Random Matrix Theory](./random-matrix-theory.md) extends these bounds to
matrix-valued sums, and
[Probability and Computing](./probability-and-computing.md) is the algorithmic
payoff, where a Chernoff bound is what licenses calling a randomised algorithm
reliable.
