---
concept_id: concept.probability.probability_and_computing
title: Probability and Computing
slug: /concepts/probability-and-computing
aliases:
  - randomized algorithms
kind: concept
tier: 1
review_state: generated-draft
summary: The use of random choices inside algorithms, and of probabilistic analysis to bound what they cost, giving simpler and faster procedures whose guarantees hold for every input.
categories:
  - Mathematics/Probability & Statistics
  - Mathematics/Combinatorics
primary_category: Mathematics/Probability & Statistics
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: Every analysis on this page is an expectation, an independence argument or a conditioning step over the algorithm's coin flips.
  - type: supported_by
    target: concept.probability.concentration_inequalities
    note: Amplification, high-probability running-time bounds and maximum-load estimates all come from Chernoff-type tail bounds rather than from expectations alone.
  - type: contributes_to
    target: concept.probability.bayesian_inference
    note: Markov chain Monte Carlo is the computational machinery that makes posterior expectations tractable when the normalising constant has no closed form.
  - type: used_to_solve
    target: concept.linear_algebra.matrix_decompositions
    note: Randomised sketching produces approximate low-rank factorisations of matrices far too large to factor deterministically.
sources:
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.probabilistic_systems
    title: MIT 6.041 Probabilistic Systems Analysis and Applied Probability (Fall 2010)
    url: https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Probability and computing** is the study of algorithms that flip coins and of
the probabilistic tools used to analyse them. An algorithm is **randomised** when
its behaviour depends on random bits drawn independently of the input. Two
guarantees are on offer, and the distinction is the whole subject:

- A **Las Vegas** algorithm is always correct; its _running time_ is a random
  variable. Randomised quicksort is the standard case.
- A **Monte Carlo** algorithm has bounded running time; its _answer_ may be
  wrong, with probability at most some $\delta$.

The error probability of a Monte Carlo algorithm is taken over its own coin
flips, **for every fixed input**: it is not an average over a distribution of
inputs and assumes nothing about which inputs arrive. That is what separates it
from average-case analysis, where the randomness lives in the input and an
adversary can therefore defeat it.

## Why it matters

Randomness buys _simplicity_: a uniformly random quicksort pivot is one line and
gives $O(n \log n)$ expected time, where the deterministic median-of-medians
pivot that matches it is an intricate routine with worse constants. It buys
_symmetry breaking_, which distributed protocols need to escape deadlocks no
deterministic rule escapes. It buys _sublinear resources_: a Bloom filter answers
membership queries in space far below an exact structure, paying a controlled
error rate.

It also buys _proofs_. The probabilistic method shows an object exists by putting
a distribution on a space and proving a random draw has the property with
positive probability — often where no construction is known.

## Intuition

Think of the coins as a private resource the adversary cannot see. A
deterministic algorithm has one behaviour per input, so its worst case is a
target: whoever writes the input can aim at it. A randomised algorithm spreads
itself over many behaviours, and an input must be bad against _all_ of them at
once. Nothing here makes a particular input easy; it makes every input easy on
average over the coins.

Where the picture breaks: the coins must really be hidden. If the adversary
learns the seed, or the same coins are reused across calls, the spread collapses
and the worst case returns.

## Concrete example

Randomised quicksort, with the randomness in the pivot and not in the data:

```python
import random

def quicksort(a):
    if len(a) <= 1:
        return a
    pivot = a[random.randrange(len(a))]
    lo = [x for x in a if x < pivot]
    mid = [x for x in a if x == pivot]
    hi = [x for x in a if x > pivot]
    return quicksort(lo) + mid + quicksort(hi)
```

For $n$ distinct keys, a quicksort whose partition compares each element to the
pivot once makes exactly $2(n+1)H_n - 4n$ comparisons in expectation, with
$H_n = \sum_{i=1}^{n} 1/i$. At $n = 1000$, $H_n \approx 7.4855$, that is about
$10{,}986$ comparisons against a worst case of $\binom{1000}{2} = 499{,}500$. The
three-scan version above rescans each block for `<`, `==` and `>` separately, so
it pays roughly three times that count — measured at about $35{,}000$ for
$n = 1000$ — with the same $\Theta(n \log n)$ growth. Sorting
`list(range(1000))` twice takes two
different pivot sequences, neither of them the quadratic case: the input no
longer selects the behaviour.

A Bloom filter makes the Monte Carlo trade concrete. At $m/n = 10$ bits per
element with $k = 7$ hash functions the false-positive rate is
$(1 - e^{-7/10})^7 \approx 0.0082$ — one negative query in $122$ reported as a
member, no false negatives ever, in 10 bits per element rather than the dozens a
hash set needs.

## Formal treatment

**Complexity classes.** Let $A(x, r)$ run in polynomial time on input $x$ with
uniform random string $r$. A language $L$ is in $\mathsf{BPP}$ if some such $A$
satisfies $\Pr_r[A(x,r) = [x \in L]] \ge 2/3$ for _every_ $x$; in $\mathsf{RP}$
if the error is one-sided, $\Pr_r[A(x,r)=1] \ge 1/2$ for $x \in L$ and
$A(x,r)=0$ always otherwise; and in $\mathsf{ZPP}$ if a Las Vegas algorithm
decides it in expected polynomial time. Then $\mathsf{ZPP} = \mathsf{RP} \cap
\mathsf{coRP}$ and $\mathsf{BPP} \subseteq \Sigma_2^p \cap \Pi_2^p$.

**Amplification.** Majority vote over $t$ runs with fresh coins drives
$\mathsf{BPP}$ error to $e^{-\Omega(t)}$ by a Chernoff bound, so the constant
$2/3$ is arbitrary; $t$ independent $\mathsf{RP}$ runs err with probability at
most $2^{-t}$. Markov's inequality converts Las Vegas to Monte Carlo — truncate
an expected-time-$T$ algorithm at $2T$ and it fails with probability at most
$1/2$ — but the converse needs an efficient verifier.

**Balls in bins.** Throwing $n$ balls independently into $n$ bins, the maximum
load is $\Theta(\log n / \log\log n)$ with high probability. The asymptotics hide
a large $o(1)$: at $n = 10^6$ that expression is $5.3$, while the Poisson
estimate $n e^{-1}/k! \approx 1$ puts the maximum load near $9$. Giving each ball
two independent choices and using the emptier bin drops it to
$\log_2 \log n + \Theta(1)$, about $4$ — the _power of two choices_.

**Bloom filters.** With $m$ bits, $n$ elements and $k$ independent hash
functions, a bit stays zero with probability $(1 - 1/m)^{kn} \approx e^{-kn/m}$,
so

$$
\Pr[\text{false positive}] \approx \left(1 - e^{-kn/m}\right)^{k},
$$

minimised at $k = (m/n)\ln 2$, where the rate is $2^{-k} \approx
0.6185^{\,m/n}$. Treating the $k$ bit tests as independent is an approximation,
not an identity; the exact rate is slightly higher.

**MCMC.** To sample from $\pi$ known only up to a constant, build a Markov chain
$P$ with stationary distribution $\pi$ by imposing detailed balance
$\pi(x)P(x,y) = \pi(y)P(y,x)$ — Metropolis–Hastings does this with acceptance
probability $\min\{1, \pi(y)q(y,x) / \pi(x)q(x,y)\}$. Convergence is measured in
total variation, $d(t) = \max_x \lVert P^t(x,\cdot) - \pi \rVert_{TV}$, with
mixing time $t_{\text{mix}}(\varepsilon) = \min\{t : d(t) \le \varepsilon\}$. For
a reversible chain with absolute spectral gap $\gamma_*$,

$$
t_{\text{mix}}(\varepsilon) \;\le\; \frac{1}{\gamma_*}\,
\log\!\frac{1}{\varepsilon\,\pi_{\min}} .
$$

## Assumptions and requirements

The coins must be independent of the input and unobservable by whoever chose it.
Drop that and the guarantee goes: a hash table whose seed is known can be fed
colliding keys and degraded to linear-time lookups — the hash-flooding denial of
service that pushed libraries to keyed hashing.

Expected-time bounds assume you can tolerate the tail. On their own they say
nothing about the $99.9$th percentile; that needs a concentration argument, which
quicksort has and a heavy-tailed Las Vegas algorithm may not.

MCMC convergence needs the chain to be irreducible and aperiodic on the support
of $\pi$, with $\pi$ stationary for it. Lose irreducibility and the sampler
reports whichever component it started in; lose aperiodicity and the
distribution oscillates forever, though time averages may still converge.
Detailed balance is sufficient for stationarity, not necessary.

## Uses and applicability

Reach for randomisation when the worst case is rare but adversarially reachable
(quicksort pivots, hash functions), when exactness is not worth its price
(streaming sketches, randomised low-rank factorisation), when no efficient
deterministic method is known (polynomial identity testing, high-dimensional
integration), or when symmetry must be broken among identical agents.

Do not, when the answer must be reproducible without recording the seed, when
the error probability cannot be bounded in terms the application cares about, or
when a deterministic algorithm of the same asymptotic cost exists — sorting a
million integers with a radix sort needs no coins.

## Limitations and common mistakes

The most common error is reading a Monte Carlo guarantee as a statement about
inputs — "wrong on 1% of cases". It is a statement about coins, holding uniformly
over inputs. The mirror error treats average-case analysis as a randomised
guarantee: deterministic quicksort is $O(n\log n)$ on random inputs and quadratic
on sorted ones.

Second, amplification requires _independent_ runs; repeating with the same seed
reduces nothing.

Third, **pseudorandom generators are not random.** A PRNG is a deterministic
function of its seed, so a guarantee over uniform coins transfers only insofar as
no efficient test distinguishes its output from uniform. Mersenne Twister fails
that badly — its state is recoverable from 624 consecutive outputs — which is
harmless in simulation and fatal against an adversary.

Fourth, MCMC diagnostics detect failure, never success. A chain that has not
found a second mode looks exactly like one that has converged; $\hat{R}$ near $1$
and a healthy effective sample size are necessary, not sufficient, and burn-in is
a heuristic rather than a correctness argument.

## Variants and alternatives

**Derandomisation** is the competing programme: the method of conditional
expectations turns probabilistic existence proofs into algorithms; $k$-wise
independent families replace full randomness with $O(k \log n)$ bits; and
pseudorandom generators built from hardness assumptions would give
$\mathsf{P} = \mathsf{BPP}$, widely believed but unproven. Primality is the clean
case — randomised tests first, a deterministic polynomial-time test decades
later.

Among samplers, Gibbs sampling needs tractable conditionals, Hamiltonian Monte
Carlo uses gradients to move far per step and needs a differentiable
log-density, and slice sampling avoids tuning a proposal width. Variational
inference is a genuinely different approach, trading asymptotic exactness for
speed. Among sketches, cuckoo and quotient filters improve on Bloom filters by
supporting deletion.

## History and attribution

The Monte Carlo method was developed at Los Alamos in the 1940s by Stanisław Ulam
and John von Neumann for neutron diffusion, and named after the casino by
Nicholas Metropolis. The Metropolis algorithm followed in 1953; Hastings
generalised it in 1970, and Geman and Geman introduced Gibbs sampling in 1984.

In parallel, Paul Erdős used counting arguments over random objects from 1947 —
his Ramsey lower bound $R(k,k) > 2^{k/2}$ is the founding example of the
probabilistic method. Randomised algorithms became a field in the 1970s with the
primality tests of Solovay and Strassen and of Rabin, Bloom's filter (1970) and
Carter and Wegman's universal hashing (1979); the term _Las Vegas algorithm_ is
due to László Babai, also in 1979.

## Sources

Arora and Barak give the complexity-theoretic frame — $\mathsf{BPP}$,
$\mathsf{RP}$, $\mathsf{ZPP}$, amplification, derandomisation — and say what a
randomised guarantee formally is. MIT 6.006 is the algorithms course behind the
hashing and expected-running-time material. MacKay is the source for Monte Carlo
and MCMC: why sampling is hard, how Metropolis and Gibbs work, how slowly they
mix, and why convergence cannot be confirmed from the output. MIT 6.041 supplies
the Markov chain conditions the mixing discussion assumes.

## Prerequisites and next connections

Read a first course in probability first — expectation, independence,
conditioning and Markov chains — since every bound here is one of those four
moves. [Measure Theory](./measure-theory.md) is not needed for the discrete
arguments, but is what makes continuous-state MCMC precise.

Next, concentration inequalities turn these expectations into high-probability
statements; martingales extend that to dependent sequences, which is how
randomised data structures are usually analysed; and stochastic processes supply
the Markov chain theory mixing times live in.
[Computability Theory](./computability-theory.md) marks the boundary randomness
does not cross — coins change what is _efficient_, not what is _decidable_ — and
[Matrix Decompositions](./matrix-decompositions.md) is where randomised sketching
pays off numerically.
