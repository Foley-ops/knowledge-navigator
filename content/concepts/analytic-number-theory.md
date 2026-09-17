---
concept_id: concept.number_theory.analytic_number_theory
title: Analytic Number Theory
slug: /concepts/analytic-number-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The study of the integers by way of complex analysis, where arithmetic questions about primes become questions about the poles, zeros and growth of functions built from them.
categories:
  - Mathematics/Number Theory
primary_category: Mathematics/Number Theory
relationships:
  - type: requires
    target: concept.analysis.complex_analysis
    note: Analytic continuation, contour shifting and the argument principle are the actual machinery; without them the zeta function is only a divergent series and the explicit formula cannot be derived.
  - type: contrasts_with
    target: concept.number_theory.elementary_number_theory
    note: Both study the same primes, but the elementary proof of the prime number theorem by Erdos and Selberg shows the analytic route is a matter of naturalness and sharper error terms, not logical necessity.
  - type: contrasts_with
    target: concept.number_theory.algebraic_number_theory
    note: The two fields attack the same objects from opposite sides and meet at Dedekind zeta functions and the class number formula, where an analytic residue computes an algebraic invariant.
  - type: contributes_to
    target: concept.probability.random_matrix_theory
    note: Montgomery's pair correlation of zeta zeros matched the eigenvalue statistics of random Hermitian matrices, which turned a number-theoretic computation into one of random matrix theory's most-cited applications.
sources:
  - source_id: source.bombieri.riemann_hypothesis
    title: 'Problems of the Millennium: the Riemann Hypothesis'
    url: https://www.claymath.org/wp-content/uploads/2022/05/riemann.pdf
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.dlmf.functions_of_number_theory
    title: 'NIST Digital Library of Mathematical Functions, Chapter 27: Functions of Number Theory'
    url: https://dlmf.nist.gov/27
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.oeis
    title: The On-Line Encyclopedia of Integer Sequences
    url: https://oeis.org/
    source_kind: reference-documentation
    supports:
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: A dedicated analytic number theory text (Apostol, Davenport, or Iwaniec and Kowalski)
    reason: The registry has no textbook covering Dirichlet series convergence, Perron's formula, zero-free regions or the circle method, so the derivations sketched here are cited only to a survey and a reference handbook.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
claims: []
---

## Definition

**Analytic number theory** attaches to an arithmetic sequence a function of a
complex variable, and then recovers arithmetic from that function's analytic
behaviour: where it has poles, where it vanishes, and how fast it grows. The
standard encoding is the **Dirichlet series** $\sum_{n \ge 1} a(n) n^{-s}$ of an
arithmetic function $a$, and the standard example is the **Riemann zeta
function** $\zeta(s)$, whose zeros turn out to control the error in every
estimate for how many primes lie below a given bound.

## Why it matters

Counting primes is hard by elementary means. Euclid's argument gives infinitely
many; Chebyshev's gives $c_1 x/\log x < \pi(x) < c_2 x/\log x$ for explicit
constants and nothing sharper. Analytic methods deliver the asymptotic itself
and — far more valuable — an error term that is controlled by a set of complex
numbers you can in principle locate. That is the trade the subject makes: an
unruly question about integers becomes a tractable question about where a
holomorphic function vanishes.

The same move works for primes in arithmetic progressions, average divisor
counts and class numbers of number fields: once a quantity has a Dirichlet
series with an Euler product, the toolkit applies. Additive questions such as
sums of primes have no Euler product; they need a different generating function
and the circle method.

## Intuition

The Euler product

$$\zeta(s) \;=\; \sum_{n \ge 1} n^{-s} \;=\; \prod_{p \text{ prime}} \left(1 - p^{-s}\right)^{-1}$$

is unique factorisation written analytically: expand each factor as a geometric
series, multiply out, and each integer appears exactly once because it factors
into primes in exactly one way. So anything true of the function is a coded
statement about primes. The simple pole at $s = 1$ — the divergence of the
harmonic series — is the statement that there are a lot of primes; it forces
$\sum_p 1/p$ to diverge.

The second picture is the one working analysts carry. Write $\psi(x)$ for a
weighted count of prime powers up to $x$. Its deviation from $x$ is a sum of
waves, one per zero $\rho = \beta + i\gamma$ of $\zeta$: amplitude $x^\beta$,
frequency $\gamma$ in the variable $\log x$. Zeros are frequencies, primes are
the signal, and the Riemann hypothesis says every wave has the same amplitude
exponent $\tfrac12$.

The Fourier analogy breaks in two places. The frequencies $\gamma$ do not sit on
a lattice, and the sum over zeros converges only conditionally, so this is not an
expansion in an orthonormal basis. Nobody has produced an operator whose spectrum
is the set of $\gamma$ — the Hilbert–Pólya idea is a hope, not a theorem.

## Concrete example

Compare the two classical approximations to $\pi(x)$, the number of primes up to
$x$, against the exact counts (which are tabulated in the OEIS). Here
$\operatorname{li}(x) = \mathrm{PV}\!\int_0^x dt/\log t$.

| $x$       | $\pi(x)$            | $x/\log x$            | $\operatorname{li}(x)$ | $\operatorname{li}(x) - \pi(x)$ |
| --------- | ------------------- | --------------------- | ---------------------- | ------------------------------- |
| $10^{3}$  | $168$               | $144.8$               | $177.6$                | $9.6$                           |
| $10^{6}$  | $78\,498$           | $72\,382.4$           | $78\,627.5$            | $129.5$                         |
| $10^{10}$ | $455\,052\,511$     | $434\,294\,481.9$     | $455\,055\,614.6$      | $3\,103.6$                      |
| $10^{12}$ | $37\,607\,912\,018$ | $36\,191\,206\,825.3$ | $37\,607\,950\,280.8$  | $38\,262.8$                     |

Two things to read off. First, $x/\log x$ is asymptotically correct and
practically poor: at $10^{12}$ it is still off by 3.8%, because its relative
error decays only like $1/\log x$. Second, $\operatorname{li}$ is off by $38\,263$
there, while the Riemann hypothesis only promises $O(\sqrt{x}\log x)$, about
$2.8 \times 10^{7}$ — the data sits far inside the conjectured bound, and would
even if the hypothesis were false.

The first pair of nontrivial zeros sits at $\rho = \tfrac12 \pm i\gamma_1$ with
$\gamma_1 = 14.134725\ldots$, and $|\rho| = \sqrt{\tfrac14 + \gamma_1^2} =
14.1435\ldots$. That pair alone contributes to $\psi(x)$ a wave of amplitude
$2\sqrt{x}/|\rho| \approx 0.1414\sqrt{x}$ — about $141$ at $x = 10^{6}$ — and
period $2\pi/\gamma_1 \approx 0.445$ in $\log x$, that is, a factor of about
$1.56$ in $x$. Every subsequent zero adds another, smaller ripple.

## Formal treatment

Write $s = \sigma + it$. A Dirichlet series $D_a(s) = \sum_{n\ge1} a(n)n^{-s}$
that converges at $s_0$ converges for every $\sigma > \Re s_0$ and is holomorphic
there; the infimum of such $\sigma$ is the abscissa of convergence. If $a$ is
completely multiplicative and the series converges absolutely, it factors as
$\prod_p (1 - a(p)p^{-s})^{-1}$; for merely multiplicative $a$ the local factor
is $\sum_{k \ge 0} a(p^k) p^{-ks}$.

Taking $a \equiv 1$ gives $\zeta$. It continues to a meromorphic function on
$\mathbb{C}$ whose only pole is simple, at $s = 1$, with residue $1$, and the
completed function

$$\xi(s) \;=\; \tfrac12 s(s-1)\,\pi^{-s/2}\,\Gamma(s/2)\,\zeta(s)$$

is entire with $\xi(s) = \xi(1-s)$. The poles of $\Gamma(s/2)$ force the
**trivial zeros** $\zeta(-2n) = 0$ for $n \ge 1$; every other zero
$\rho = \beta + i\gamma$ lies in the open strip $0 < \beta < 1$, and the
functional equation places them symmetrically about the line $\beta = \tfrac12$.

Let $\Lambda(n) = \log p$ when $n = p^k$ and $0$ otherwise, and
$\psi(x) = \sum_{n \le x} \Lambda(n)$. For $\sigma > 1$,
$-\zeta'(s)/\zeta(s) = \sum_{n\ge1}\Lambda(n)n^{-s}$. Perron's formula writes
$\psi(x)$ as a contour integral of this against $x^s/s$; pushing the contour left
picks up the pole of $\zeta$ at $s=1$ (residue $x$) and a residue $-x^\rho/\rho$
at each zero, giving the **explicit formula**

$$\psi_0(x) \;=\; x \;-\; \sum_{\rho} \frac{x^{\rho}}{\rho} \;-\; \log 2\pi \;-\; \tfrac12 \log\!\left(1 - x^{-2}\right),$$

for $x > 1$, where $\psi_0$ takes the midpoint value at jumps and the sum over
nontrivial zeros means $\lim_{T\to\infty}\sum_{|\gamma| < T}$.

The **prime number theorem**, $\pi(x) \sim x/\log x$, is equivalent to
$\psi(x) \sim x$ and equivalent to $\zeta(1 + it) \neq 0$ for all real $t$. A
zero-free region $\sigma > 1 - c/\log(|t| + 2)$ upgrades this to
$\psi(x) = x + O\!\left(x \exp(-c'\sqrt{\log x})\right)$.

The **Riemann hypothesis** states: every zero $\rho$ of $\zeta$ with
$0 < \Re\rho < 1$ satisfies $\Re\rho = \tfrac12$. By the explicit formula it is
equivalent to $\psi(x) = x + O(x^{1/2}\log^2 x)$, and to
$\pi(x) = \operatorname{li}(x) + O(\sqrt{x}\log x)$. The equivalence runs both
ways: a single zero with $\beta > \tfrac12$ forces
$\psi(x) - x = \Omega(x^{\beta - \varepsilon})$. RH is therefore exactly the
claim of square-root cancellation in the prime count — no more and no less.

## Assumptions and requirements

Everything above needs the generating series to converge somewhere. An Euler
product additionally needs multiplicativity together with absolute convergence;
drop multiplicativity and the series may still be perfectly analytic while
saying nothing about primes.

Shifting the Perron contour is not free: it requires growth bounds on
$\zeta'/\zeta$ in vertical strips and a density estimate for the number of zeros
up to height $T$, or the truncated integrals do not vanish. And because
$\sum_\rho x^\rho/\rho$ converges only conditionally, the symmetric ordering by
$|\gamma|$ is part of the statement, not a convenience.

The prime number theorem needs non-vanishing on the entire line $\sigma = 1$,
including as $t \to \infty$; the classical proof gets it from the inequality
$3 + 4\cos\theta + \cos 2\theta \ge 0$. Nothing weaker suffices, which is why the
theorem resisted for nearly forty years after Riemann's memoir.

## Uses and applicability

Reach for analytic methods when the question is asymptotic and averaged: how
many primes below $x$, how they split between residue classes, the average
number of divisors, or how many ways a large integer is a sum of three primes.
The subject also supplies the density estimates that make randomised algorithms
work — the expected cost of generating an RSA modulus is a prime number theorem
calculation.

Do not reach for it when the question concerns one specific integer, or a
property with no multiplicative structure. Bounded gaps between primes, twin
primes and Goldbach are all resistant to zeta alone: they need sieve theory or
the circle method, taking analytic input rather than yielding analytic
conclusions.

## Limitations and common mistakes

**Analytic methods are not logically necessary.** Erdős and Selberg gave an
elementary proof of the prime number theorem in 1949 — "elementary" meaning
without complex analysis, not easy. Complex analysis is the natural language and
currently the only route to the sharpest error terms, but it is not the only
route to the theorem.

**RH would not break RSA.** It supplies no factoring algorithm. Under the
generalised hypothesis for Dirichlet $L$-functions the Miller–Rabin test becomes
deterministic in polynomial time, which is a statement about recognising primes,
not about splitting composites.

**RH would not settle the famous prime gap conjectures.** It gives
$p_{n+1} - p_n = O(\sqrt{p_n}\log p_n)$, nowhere near Cramér's conjectured
$O(\log^2 p_n)$, and it implies neither the twin prime conjecture nor Goldbach.
Nor does RH for $\zeta$ imply RH for other $L$-functions.

**Do not extrapolate the numerics.** $\operatorname{li}(x) > \pi(x)$ for every
$x$ ever computed, yet Littlewood proved in 1914 that the difference changes sign
infinitely often. No crossing point is known — only upper bounds on where the
first one lies.

## Variants and alternatives

The main generalisation replaces $\zeta$ with a family: Dirichlet $L$-functions
$L(s,\chi)$ for primes in progressions, Dedekind zeta functions for number
fields, and automorphic $L$-functions in the Langlands programme, each with its
own Riemann hypothesis (collectively GRH). The **circle method** of Hardy,
Littlewood and Ramanujan handles additive problems where Euler products do not
exist. **Sieve methods** — Brun, Selberg, the large sieve — give bounds rather
than asymptotics but reach questions, such as bounded gaps, that zeta cannot
touch. **Probabilistic models** (Cramér's random model, and random matrix
statistics for the zeros) predict answers cheaply and prove nothing. In the
**function field** setting the analogue of RH is a theorem, proved by Weil for
curves over finite fields, which is suggestive evidence and not a proof for
$\zeta$.

## History and attribution

Euler found the product formula for $\sum n^{-s}$ in the 1730s, working with real
$s$. Dirichlet's 1837 proof that every progression $a, a+q, a+2q, \ldots$ with
$\gcd(a,q)=1$ contains infinitely many primes is usually taken as the founding
result, since it needs the non-vanishing $L(1,\chi) \neq 0$ and so genuinely uses
analysis. Chebyshev introduced $\psi$ and proved the correct order of $\pi(x)$
around 1850. Riemann's memoir of 1859 — eight pages — introduced complex $s$, the
continuation and functional equation, the explicit formula, and the hypothesis.
Hadamard and de la Vallée Poussin independently proved the prime number theorem
in 1896 by establishing non-vanishing on $\sigma = 1$. Hilbert listed the
hypothesis as the eighth of his 1900 problems, and it became a Clay Millennium
Prize problem in 2000. The elementary proof by Erdős and Selberg in 1949 is
famous as much for the priority dispute between them as for the mathematics.

## Sources

Bombieri's Clay Institute description of the Riemann hypothesis is the best short
account of what the hypothesis says, what is known around it, how it sits within
the wider theory of $L$-functions, and where the random matrix connection came
from. DLMF Chapter 27 is the reference for definitions with their hypotheses
attached: multiplicative functions, Dirichlet characters, Euler products and
Dirichlet series, and the asymptotic formulas for primes. The OEIS supplies the
exact values of $\pi(10^n)$ in the table, and MacTutor the biographical history,
including the Erdős–Selberg episode.

## Prerequisites and next connections

Read [Complex Analysis](./complex-analysis.md) first — continuation, residues and
contour deformation are used on every page of this subject — with
[Elementary Number Theory](./elementary-number-theory.md) in hand for unique
factorisation and multiplicative functions, and
[Real Analysis](./real-analysis.md) for the convergence arguments underneath the
Dirichlet series manipulations.

From here, [Fourier Analysis](./fourier-analysis.md) and
[Harmonic Analysis](./harmonic-analysis.md) make the "zeros are frequencies"
picture precise and are the setting for the circle method, while
[Random Matrix Theory](./random-matrix-theory.md) is where the statistics of the
zeros now live.
