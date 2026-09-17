---
concept_id: concept.analysis.measure_theory
title: Measure Theory
slug: /concepts/measure-theory
aliases:
  - Lebesgue integration
kind: concept
tier: 1
review_state: generated-draft
summary: The theory that assigns a consistent size to sets and builds an integral on top of it, so that limits and integrals can be exchanged under hypotheses a working mathematician can actually check.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.real_analysis
    note: The construction assumes completeness of the reals and the epsilon-delta machinery, and the failure of the Riemann integral under limits — a real-analysis result — is the problem measure theory exists to fix.
  - type: requires
    target: concept.foundations.set_theory
    note: A sigma-algebra is a closure condition on a family of subsets, and whether non-measurable sets exist at all is a question about the axiom of choice rather than about analysis.
  - type: prerequisite_of
    target: concept.analysis.functional_analysis
    note: The standard examples of Banach spaces are the $L^p(\mu)$ spaces, and their completeness is the Riesz–Fischer theorem, proved from the convergence theorems on this page.
  - type: prerequisite_of
    target: concept.analysis.hilbert_spaces
    note: $L^2(\mu)$ is the canonical infinite-dimensional Hilbert space, and it only becomes one once the Lebesgue integral supplies an inner product whose induced norm is complete.
sources:
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - concrete-example
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.plato.set_theory
    title: 'Stanford Encyclopedia of Philosophy: Set Theory'
    url: https://plato.stanford.edu/entries/set-theory/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
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

**Measure theory** is the study of measure spaces and the integral built on them.
A **measure space** is a triple $(X, \mathcal{F}, \mu)$: a set $X$; a
**$\sigma$-algebra** $\mathcal{F}$ of subsets of $X$, meaning $X \in \mathcal{F}$
and $\mathcal{F}$ is closed under complement and countable union; and a
**measure** $\mu : \mathcal{F} \to [0, \infty]$ with $\mu(\emptyset) = 0$ that is
**countably additive**,

$$
\mu\Big(\bigcup_{n=1}^{\infty} A_n\Big) = \sum_{n=1}^{\infty} \mu(A_n)
\qquad \text{for pairwise disjoint } A_n \in \mathcal{F}.
$$

A function $f : X \to \mathbb{R}$ is **measurable** when $f^{-1}(B) \in
\mathcal{F}$ for every Borel set $B \subseteq \mathbb{R}$, and the **Lebesgue
integral** $\int_X f \, d\mu$ is defined for such $f$. The word _countable_ in
both clauses is the entire design decision: it is exactly strong enough to make
limits behave and exactly weak enough to be consistent.

## Why it matters

The Riemann integral does not survive limits, and the damage is structural: the
Riemann-integrable functions on $[0,1]$ are not complete under the $L^1$ norm, so
a Cauchy sequence of them can converge to nothing in the space. Measure theory
replaces that space with $L^p(\mu)$, which is complete — the Riesz–Fischer
theorem — and makes $L^2$ a Hilbert space, which is what lets one say that the
Fourier series of _every_ square-integrable function converges to it. That
statement cannot even be posed with Riemann's integral.

It is also the foundation probability is built on. Kolmogorov's axioms are
literally "a measure with $\mu(X) = 1$": an event is a measurable set, a random
variable is a measurable function, expectation is an integral, and conditional
expectation is a Radon–Nikodym derivative. Countable additivity is the axiom
doing the work there: it is what fixes the probability of a Borel event as the
limit of its finite approximations, and what yields the convergence theorems
that let an expectation and a limit be exchanged. It also decides what is
possible — a uniform distribution on a countably infinite sample space, say the
rationals of $[0,1]$, exists finitely additively and cannot exist countably
additively, since countably many equal numbers sum to $0$ or to $\infty$.

## Intuition

Riemann slices the domain; Lebesgue slices the range. Lebesgue's own picture: to
total a pile of coins you can count them in the order you pull them out of your
pocket, or sort them into denominations and multiply. The second is
$\int f \approx \sum_k y_k \, \mu(\{x : y_k \le f(x) < y_{k+1}\})$.

The analogy breaks at the one place that matters. Sorting coins is free; sorting
a function's values is not, because the level sets $\{x : y_k \le f(x) <
y_{k+1}\}$ can be dense, nowhere dense or fractal, and the technical burden of the
subject is arranging that they have a size at all. That is what the
$\sigma$-algebra is for, and why "measurable function" is a condition on
preimages rather than on smoothness.

A measure is also just a way of distributing stuff over $X$. Lebesgue measure on
$\mathbb{R}$, counting measure on $\mathbb{N}$ and a point mass $\delta_0$ are
all measures, so one proof of dominated convergence governs integrals, infinite
series and expectations at once.

## Concrete example

Work in $([0,1], \mathcal{L}, \lambda)$, Lebesgue measure on the unit interval.

Enumerate the rationals of $[0,1]$ as $q_1, q_2, \dots$ and cover $q_n$ by an
open interval of length $\varepsilon 2^{-n}$. The total length is at most
$\varepsilon$: with $\varepsilon = 10^{-3}$, a set containing every rational sits
inside open intervals of total length $0.001$. So
$\lambda(\mathbb{Q} \cap [0,1]) = 0$ and $\int \mathbf{1}_{\mathbb{Q}} \, d\lambda
= 0$, while the lower and upper Riemann sums are $0$ and $1$ for every partition.

Now a bounded function on a compact interval that Riemann cannot touch. Remove
from $[0,1]$ the open middle interval of length $1/4$; from each of the two
survivors remove the middle interval of length $1/16$; at stage $n$ remove
$2^{n-1}$ intervals of length $4^{-n}$. The removed total is

$$
\sum_{n=1}^{\infty} 2^{n-1} 4^{-n} = \tfrac12 \sum_{n=1}^{\infty} 2^{-n} = \tfrac12 ,
$$

so the remaining set $K$ — the Smith–Volterra–Cantor, or "fat Cantor", set — is
closed, has empty interior, and has $\lambda(K) = 1/2$. Because $K$ is nowhere
dense, $\mathbf{1}_K$ is discontinuous at exactly the points of $K$, a set of
measure $1/2$, so by Lebesgue's criterion it is not Riemann integrable. It is
Borel measurable, and $\int \mathbf{1}_K \, d\lambda = 1/2$.

## Formal treatment

The integral is built in three steps. For a **simple** function $s = \sum_{i=1}^n
a_i \mathbf{1}_{A_i}$ with $a_i \ge 0$ and $A_i \in \mathcal{F}$, set $\int s \,
d\mu = \sum_i a_i \mu(A_i)$ under the convention $0 \cdot \infty = 0$. For
measurable $f \ge 0$, set $\int f \, d\mu = \sup \{\int s \, d\mu : s
\text{ simple}, \, 0 \le s \le f\} \in [0,\infty]$. For general $f$, write $f =
f^+ - f^-$; $f$ is **integrable** when $\int |f| \, d\mu < \infty$, and then
$\int f = \int f^+ - \int f^-$.

Three theorems carry the subject, and their hypotheses are the content.

- **Monotone convergence (Beppo Levi).** If $f_n$ are measurable with $0 \le f_1
  \le f_2 \le \cdots$ and $f_n \to f$ pointwise, then $\int f_n \to \int f$. No
  integrability is assumed and both sides may be $+\infty$. Non-negativity is not
  decoration: $f_n = -\tfrac1n \mathbf{1}_{[0,\infty)}$ on $\mathbb{R}$ increases
  to $0$ while $\int f_n = -\infty$ for every $n$.
- **Fatou's lemma.** For measurable $f_n \ge 0$, $\int \liminf_n f_n \le \liminf_n
  \int f_n$. There is no convergence hypothesis at all, and strict inequality is
  the normal case.
- **Dominated convergence.** If $f_n \to f$ $\mu$-almost everywhere and there is a
  single $g$ with $\int g \, d\mu < \infty$ and $|f_n| \le g$ a.e. for every $n$,
  then $f$ is integrable, $\int f_n \to \int f$, and moreover $\int |f_n - f| \,
  d\mu \to 0$.

Domination is the hypothesis that fails in practice. Take $f_n = n
\mathbf{1}_{(0,1/n)}$ on $[0,1]$. Then $f_n \to 0$ at every point, yet $\int f_n
= 1$ for all $n$. Any dominating $g$ must exceed $h = \sup_n f_n$, and for $x \in
(\tfrac{1}{k+1}, \tfrac1k)$ we have $f_k(x) = k > \tfrac1x - 1$, so $h(x) >
\tfrac1x - 1$ throughout $(0,1)$ and $\int_0^1 (\tfrac1x - 1) \, dx = \infty$. No
integrable envelope exists, the conclusion is false, Fatou still holds with
strict inequality $0 < 1$, and monotone convergence does not apply because the
family is not monotone. The picture is mass escaping upward through a narrowing
spike; it can also escape sideways, as with $f_n = \mathbf{1}_{[n,n+1]}$ on
$\mathbb{R}$. Domination is sufficient, not necessary: the sharp condition is
uniform integrability with convergence in measure, which is Vitali's theorem.

## Assumptions and requirements

Countable additivity cannot be extended to all subsets of $\mathbb{R}$. Vitali's
construction: on $[0,1)$ declare $x \sim y$ when $x - y \in \mathbb{Q}$, and
choose one representative from each class to form $V$. The translates of $V$
modulo $1$ by the countably many rationals in $[0,1)$ are disjoint and cover
$[0,1)$, so a translation-invariant countably additive $\lambda$ would need
countably many copies of $\lambda(V)$ to sum to $1$ — impossible, since that sum
is $0$ if $\lambda(V) = 0$ and $\infty$ otherwise. This is why Lebesgue measure
lives on the Lebesgue $\sigma$-algebra and not on the power set.

That construction uses the axiom of choice, and the dependence is real rather
than cosmetic: Solovay showed it is consistent with ZF plus dependent choice
(granting the consistency of an inaccessible cardinal) that _every_ set of reals
is Lebesgue measurable, and Shelah showed the large-cardinal assumption cannot be
dropped. The existence of a non-measurable set is not a theorem of ZF.

Two further hypotheses go missing in practice. $\sigma$-finiteness is required by
Fubini–Tonelli and Radon–Nikodym: on $[0,1]^2$ with Lebesgue measure against
counting measure, the indicator of the diagonal has iterated integrals $1$ and
$0$, because counting measure on $[0,1]$ is not $\sigma$-finite. And
_completeness_ — every subset of a null set being measurable — is what makes
"modify on a null set" harmless; the Lebesgue $\sigma$-algebra is the completion
of the Borel one, and the Borel one is not complete.

## Uses and applicability

Reach for measure theory whenever limits and integration meet: probability and
stochastic processes, ergodic theory, weak solutions of PDEs and the Sobolev
spaces they live in, and $L^2$ convergence of Fourier series. In machine learning
it is the language in which population risk is an expectation against an unknown
measure, importance sampling is a Radon–Nikodym derivative, and Kullback–Leibler
divergence is defined only when one measure is absolutely continuous with respect
to the other.

It is the wrong tool for computing a number: quadrature is Riemann-flavoured, and
measure theory will tell you an integral exists without evaluating it. For
continuous integrands on compact intervals the Riemann theory is lighter, and for
conditionally convergent improper integrals it is strictly better.

## Limitations and common mistakes

"Lebesgue generalises Riemann" is only half true. A proper Riemann integral
agrees with the Lebesgue integral, but $\int_0^{\infty} \frac{\sin x}{x} \, dx =
\pi/2$ exists as an improper Riemann integral and not as a Lebesgue integral,
since $\int_0^{\infty} |\sin x / x| \, dx = \infty$ and Lebesgue's theory is
absolute by construction.

"Measure zero" is not "small". The Cantor set is uncountable with measure zero,
the fat Cantor set above is nowhere dense with measure $1/2$, and the rationals
are dense with measure zero: topological and measure-theoretic smallness are
independent, and $[0,1]$ splits into a meagre set of full measure and a comeagre
null set.

Lebesgue measurable is strictly weaker than Borel — every subset of the Cantor
set is measurable, giving $2^{\mathfrak{c}}$ measurable sets against
$\mathfrak{c}$ Borel sets — and the difference bites in compositions. If $f$ is
Lebesgue measurable and $g$ continuous then $g \circ f$ is Lebesgue measurable,
but $f \circ g$ need not be; the standard counterexample routes a non-measurable
set through the Cantor function. Composition on the inside needs $f$ Borel.

Finally, the modes of convergence are not interchangeable. The "typewriter"
sequence of indicators of $[0,\tfrac12], [\tfrac12,1], [0,\tfrac13], \dots$
converges in $L^1$ and in measure, and at no point pointwise; $n
\mathbf{1}_{(0,1/n)}$ converges almost everywhere and not in $L^1$. Convergence
in measure yields an almost-everywhere convergent subsequence, nothing stronger.

## Variants and alternatives

Carathéodory's outer-measure construction is the standard route from a premeasure
on a small family of sets to a complete measure on a $\sigma$-algebra; the
Daniell integral reverses the order, starting from a positive linear functional on
a lattice of functions and never mentioning measures, and the Riesz
representation theorem shows the two views agree. Specialisations are cheap once
the framework exists: signed and complex measures, product measures, Hausdorff
measures (which make fractional dimension meaningful), and Haar measure on a
locally compact group.

The genuine competitors are other integrals. The Henstock–Kurzweil gauge integral
takes every derivative and recovers the improper Riemann integrals Lebesgue
loses, at the cost of a function space that is not norm-complete and a definition
that does not transfer to an abstract measure space. Finitely additive theory
buys the ability to measure every subset — in dimensions one and two,
translation-invariant finitely additive extensions of Lebesgue measure to all
subsets do exist, which is why Banach–Tarski needs three dimensions — and pays
with every convergence theorem on this page.

## History and attribution

The nineteenth-century notions of content — Peano's and Jordan's — were finitely
additive and could not measure the rationals sensibly. Borel, in his 1898
_Leçons sur la théorie des fonctions_, insisted on countable operations and
defined what are now the Borel sets. Lebesgue's 1902 thesis _Intégrale, longueur,
aire_ supplied the measure and the integral together; the motivating problems
were term-by-term integration of trigonometric series and the question of which
functions are derivatives. W. H. Young reached an essentially equivalent integral
independently at nearly the same time.

The convergence theorems followed quickly: Lebesgue's own theorem in the thesis
assumed a uniform bound, the dominating-function form came shortly after, Beppo
Levi proved monotone convergence and Pierre Fatou his lemma both in 1906, and
Vitali produced the non-measurable set in 1905. The abstract measure space has
several independent origins rather than one, with Radon (1913), Carathéodory
(1914) and Fréchet (1915) each pushing past $\mathbb{R}^n$ from a different
direction, and Kolmogorov's _Grundbegriffe der Wahrscheinlichkeitsrechnung_
(1933) identified probability with a measure of total mass one.

## Sources

Durrett's _Probability: Theory and Examples_ opens with a compact, complete
measure-theoretic chapter — $\sigma$-algebras, construction of measures,
measurable functions, the integral and all three convergence theorems — written
for readers who want the machinery in order to use it, and it is the best single
reference for the formal treatment here; its appendix carries the Carathéodory
extension, the one construction under variants it covers. MIT 18.100A supplies
the Riemann theory this page reacts against, including Lebesgue's criterion for
Riemann integrability, which is what makes the fat Cantor example bite. The
Stanford Encyclopedia entry on set theory is where to check the choice-theoretic
claims: what Vitali's construction uses, and what Solovay's and Shelah's results
say about it. MathWorld is cited for the names and dates attached to theorems
here, and for the alternatives named under variants — the Daniell integral, the
Riesz representation theorem, Hausdorff and Haar measure, the Henstock–Kurzweil
integral, Banach–Tarski — and is where to verify those rather than where to
learn the mathematics.

## Prerequisites and next connections

Read [Real Analysis](./real-analysis.md) first — completeness, uniform
convergence and the Riemann integral's failures are the setup for everything
here — and have enough [Set Theory](./set-theory.md) to read a closure condition
on families of subsets and to see why the axiom of choice is a live issue. The
integral being replaced is the one taught in
[Single-Variable Calculus](./single-variable-calculus.md).

What it opens up is most of modern analysis: $L^p$ spaces and the functional
analysis built on them, $L^2$ as a Hilbert space with Fourier series as an
orthonormal expansion, and measure-theoretic probability, where every object of
statistics is a measurable function in disguise. It also retrospectively
justifies what [Multivariable Calculus](./multivariable-calculus.md) does on
faith: exchanging the order of a double integral is Fubini's theorem, and Fubini
has hypotheses.
