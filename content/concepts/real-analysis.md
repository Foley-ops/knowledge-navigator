---
concept_id: concept.analysis.real_analysis
title: Real Analysis
slug: /concepts/real-analysis
kind: concept
tier: 1
review_state: generated-draft
summary: The rigorous theory of limits on the real line, where a single axiom — completeness of the reals — is what makes continuity, convergence and integration behave.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.foundations.set_theory
    note: The reals are built as a set with structure — Dedekind cuts or equivalence classes of Cauchy sequences — and the supremum axiom quantifies over arbitrary subsets.
  - type: requires
    target: concept.analysis.single_variable_calculus
    note: Analysis takes the objects calculus already manipulates and asks which of its manipulations are actually valid, so a reader needs the computations first.
  - type: prerequisite_of
    target: concept.analysis.multivariable_calculus
    note: Many of the one-dimensional arguments about limits, continuity and integration carry over verbatim with the absolute value replaced by a norm, which is why analysis comes first — though higher dimensions add genuinely new phenomena, from partial derivatives that do not imply differentiability to Fubini and the Jacobian change of variables.
  - type: prerequisite_of
    target: concept.analysis.convolution
    note: Whether the convolution integral exists, and whether one may differentiate under it, are exactly the convergence and interchange questions real analysis answers.
sources:
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - concrete-example
      - limitations-and-common-mistakes
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.tao.analysis_i
    title: Terence Tao, Analysis I
    url: https://terrytao.wordpress.com/books/analysis-i/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.single_variable_calculus
    title: MIT 18.01 Single Variable Calculus (Fall 2006)
    url: https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Real analysis** is the theory of limiting processes on $\mathbb{R}$: sequences,
series, continuity, differentiation and integration, developed so that every
claim is proved from the axioms of the real numbers rather than read off a
picture. Its one distinctive input is the **completeness axiom**: every non-empty
set $S \subseteq \mathbb{R}$ that is bounded above has a least upper bound
$\sup S \in \mathbb{R}$. Everything else — the convergence of bounded monotone
sequences, the intermediate value theorem, the existence of the Riemann integral
for continuous functions — is a consequence.

## Why it matters

Calculus tells you how to compute; analysis tells you when the computation is
legal, and the illegal cases are not exotic. The alternating harmonic series
$1 - \tfrac12 + \tfrac13 - \tfrac14 + \cdots$ converges to
$\ln 2 \approx 0.6931$, but because it converges only conditionally, Riemann's
rearrangement theorem says its terms can be reordered to converge to $\pi$, to
$-17$, or to nothing at all. Differentiating a convergent series of functions
term by term, or swapping a limit with an integral, can likewise change the
answer. Analysis supplies the hypotheses — absolute convergence, uniform
convergence, domination — under which these moves are safe, and that machinery
is what probability, numerical error bounds and optimisation proofs rest on.

## Intuition

The rationals are already dense: between any two of them lies another, so at no
finite resolution can you see anything missing. Yet $\mathbb{Q}$ is full of holes,
and the holes are detectable only by taking limits — the sequence
$1, 1.4, 1.41, 1.414, \ldots$ is a perfectly good rational Cauchy sequence that
converges to nothing in $\mathbb{Q}$. Completeness is the assertion that
$\mathbb{R}$ has no such holes, and $\sup$ is the machine that manufactures the
missing point on demand.

The usual analogy is "the reals are the number line with no gaps." It is a good
picture for existence arguments and a bad one for cardinality: the picture
suggests the irrationals patch small cracks, whereas in fact the rationals are
countable and the reals are not, so almost every point on the line is a hole
being filled.

## Concrete example

Let $f_n : [0,1] \to \mathbb{R}$ be $f_n(x) = x^n$. Fix $x = 0.9$: the values
$0.9^{10} \approx 0.3487$ and $0.9^{100} \approx 2.66 \times 10^{-5}$ march to
zero. Fix $x = 1$: every value is $1$. So the sequence converges **pointwise** to

$$
f(x) = \begin{cases} 0 & 0 \le x < 1 \\ 1 & x = 1 . \end{cases}
$$

Each $f_n$ is continuous, a polynomial; the limit is not. Continuity was
destroyed by a limit that looked harmless.

The failure is visible in the error. For every $n$,
$\sup_{x \in [0,1]} |f_n(x) - f(x)| = 1$, because $x^n \to 1$ as $x \to 1^-$: at
$n = 100$ the point $x = 0.99$ still has $f_{100}(0.99) \approx 0.366$. The
region where $f_n$ is far from its limit slides towards $1$ but never shrinks in
height, so convergence is not **uniform** — and uniform convergence is exactly
the hypothesis that would have preserved continuity.

## Formal treatment

Write $|\cdot|$ for absolute value. A sequence $(a_n)$ **converges** to $L$ if
for every $\varepsilon > 0$ there is $N$ with $|a_n - L| < \varepsilon$ for all
$n \ge N$; it is **Cauchy** if for every $\varepsilon > 0$ there is $N$ with
$|a_n - a_m| < \varepsilon$ for all $n, m \ge N$. A function $f$ is
**continuous at** $a$ if

$$
\forall \varepsilon > 0 \; \exists \delta > 0 : \; |x - a| < \delta
\;\Longrightarrow\; |f(x) - f(a)| < \varepsilon ,
$$

for $x$ in the domain, and **uniformly continuous** if the same $\delta$ works
for every $a$ at once. The order of the quantifiers is the whole content:
$f(x) = x^2$ is continuous on $\mathbb{R}$ but not uniformly so.

Three theorems, with their hypotheses, carry most of the weight.

- **Bolzano–Weierstrass.** Every bounded sequence in $\mathbb{R}$ has a
  convergent subsequence. Boundedness is not optional, and the theorem fails in
  infinite dimensions: in $\ell^2$ the orthonormal sequence $(e_n)$ is bounded
  with no convergent subsequence.
- **Heine–Borel.** A set $K \subseteq \mathbb{R}^n$ is compact — every open cover
  has a finite subcover — if and only if it is closed and bounded. This is a
  theorem about $\mathbb{R}^n$, not a definition of compactness:
  $\mathbb{Q} \cap [0, 2]$ is closed and bounded as a subset of $\mathbb{Q}$ and
  is not compact.
- **Extreme value theorem.** If $f : [a,b] \to \mathbb{R}$ is continuous on a
  closed bounded interval, it attains a maximum and a minimum. Drop closedness
  and it fails: $f(x) = 1/x$ on $(0,1]$ is continuous and unbounded.

Completeness can be stated as the supremum axiom or as "every Cauchy sequence
converges", but these are equivalent only in the presence of the Archimedean
property; Cauchy-completeness alone is strictly weaker. The topology of the line
is correspondingly simple: open sets are unions of open intervals, and every
open subset of $\mathbb{R}$ is a countable disjoint union of them.

## Assumptions and requirements

Completeness is not one hypothesis among several. Over an Archimedean ordered
field the supremum axiom, monotone convergence, Bolzano–Weierstrass, the Cauchy
criterion, Heine–Borel and the intermediate value theorem are all equivalent, so
an argument that quietly helps itself to any one of them has assumed the whole
set. Over $\mathbb{Q}$ they fail together, and a single witness kills them all:
$f(x) = x^2 - 2$ is continuous on $[0,2] \cap \mathbb{Q}$, runs from $-2$ to $2$,
and never takes the value $0$.

The Archimedean property is the assumption that goes missing because it is
rarely invoked by name — it is the reason the two statements of completeness
above are not interchangeable. Drop it and $\varepsilon$–$\delta$ stops meaning
anything. In the field of rational functions ordered by eventual dominance, $x$
exceeds every integer, so $1/n$ does not tend to $0$ and "for every
$\varepsilon > 0$" ranges over infinitesimals that no sequence can get below.

Compactness and connectedness are separate requirements doing separate jobs, and
the phrase _closed bounded interval_ hides the difference. The extreme value
theorem and uniform continuity on $[a,b]$ need only compactness; the
intermediate value theorem needs only connectedness. On the compact set
$[0,1] \cup [2,3]$, the function equal to $0$ on the left piece and $1$ on the
right is continuous and attains both bounds while skipping every value between
them: the extreme value theorem survives, the intermediate value theorem does
not.

The interchange theorems each carry a hypothesis whose failure is cheap to
exhibit. Term-by-term integration needs uniform convergence on a domain of
finite length — $f_n = \tfrac1n \mathbf{1}_{[0,n]}$ converges to $0$ uniformly on
$[0,\infty)$ while $\int f_n = 1$ for every $n$. Dominated convergence needs an
integrable envelope, and $g_n = n\,\mathbf{1}_{(0,1/n)}$ has none: it converges
pointwise to $0$ with $\int g_n = 1$, and the smallest function above all the
$g_n$ grows like $1/x$ near the origin. The second half of the fundamental
theorem assumes what it does not say: writing $\int_a^b f' = f(b) - f(a)$
presumes $f'$ is integrable, and Volterra's function is differentiable
everywhere with a bounded derivative whose discontinuities have positive
measure, so by Lebesgue's criterion the left-hand side does not exist.

One assumption is set-theoretic. Picking a term, then another, then another —
extracting the subsequence in Bolzano–Weierstrass, or building the sequence that
witnesses a discontinuity — uses countable choice. In ZF without it, $\mathbb{R}$
can be a countable union of countable sets and the sequential characterisations
come apart from the $\varepsilon$–$\delta$ ones. Working in ZFC makes this
invisible, which is the point: invisible, not absent.

## Uses and applicability

Reach for analysis whenever a result depends on an infinite process actually
landing in the right place: proving an algorithm's iterates converge, bounding a
truncation error, justifying differentiation under an integral sign, showing an
optimisation problem attains its supremum. It is also the entry point to measure
theory, functional analysis and measure-theoretic probability.

It is the wrong tool for computation. Analysis will tell you that
$\int_0^1 e^{-x^2}\,dx$ exists and is finite; it will not evaluate it. And
results proved here are about $\mathbb{R}$: complex analysis and the theory of
metric and Banach spaces are separate developments that reuse the arguments
rather than inherit the conclusions.

## Limitations and common mistakes

The most consequential limitation is the Riemann integral itself, which does not
survive limits. Enumerate the rationals in $[0,1]$ as $q_1, q_2, \ldots$ and let
$g_n$ be the indicator of $\{q_1, \ldots, q_n\}$. Each $g_n$ has finitely many
discontinuities, so each is Riemann integrable with $\int_0^1 g_n = 0$, yet the
pointwise limit is the indicator of the rationals, whose lower and upper Riemann
sums are $0$ and $1$ for every partition — not integrable at all. Worse, the
Riemann-integrable functions are not complete under the $L^1$ norm. Lebesgue's
criterion (a bounded function is Riemann integrable exactly when its set of
discontinuities has measure zero) already points at the repair: measure theory
replaces the integral with one whose limit theorems, dominated and monotone
convergence, hold under hypotheses you can actually verify.

Four recurring errors. Treating pointwise convergence as if it were uniform —
the $x^n$ example is the standard refutation. Assuming that uniform convergence
of the $f_n$ licenses differentiating term by term; it does not, and
$f_n(x) = \sin(nx)/\sqrt{n} \to 0$ uniformly while
$f_n'(x) = \sqrt{n}\cos(nx)$ diverges. What the theorem needs is uniform
convergence of the _differentiated_ series together with convergence of the
original at a single point; uniform convergence on a bounded interval is what
licenses term-by-term _integration_. Applying the extreme value theorem on an
open or unbounded interval. And assuming "closed and bounded implies compact"
holds generally; it is Heine–Borel, and it is false in most infinite-dimensional
spaces.

## Variants and alternatives

There are three standard constructions of $\mathbb{R}$, and the choice between
them is one of convenience rather than content: any two complete ordered fields
are isomorphic, so all three build the same object. Dedekind cuts make the
supremum axiom almost a tautology — the union of the cuts _is_ the least upper
bound — and make multiplication a case analysis on signs. Equivalence classes of
rational Cauchy sequences invert that trade: arithmetic is inherited termwise,
the supremum has to be earned, and the construction generalises verbatim to the
completion of any metric space, which the cut does not. Taking "the complete
ordered field" as an axiom is the fastest route to the theorems and postpones
the question of whether such a field exists.

The live alternatives concern the integral. The Lebesgue integral buys the
convergence theorems and completeness of $L^p$, and costs measure theory up
front plus the conditionally convergent improper integrals:
$\int_0^\infty \frac{\sin x}{x}\,dx = \pi/2$ exists in the improper Riemann
sense and not in the Lebesgue sense, because $\int_0^\infty |\sin x / x| = \infty$.
The Henstock–Kurzweil or gauge integral repairs the fundamental theorem outright
— every derivative is integrable, with no side condition — and contains both of
the others; it costs the surrounding theory, since its function space is not
complete under a norm and the definition does not transfer to an abstract
measure space. The Riemann–Stieltjes integral varies the integrator instead of
the integral, which is how probability writes $\int g\,dF$ for discrete and
continuous laws in one formula.

Two further alternatives change the logic rather than the integral. Robinson's
nonstandard analysis makes infinitesimals legitimate, so continuity reads
"infinitely close inputs have infinitely close outputs" with no alternating
quantifiers; it buys short proofs and costs a model-theoretic prelude and a
non-principal ultrafilter nobody can exhibit, and by the transfer principle it
proves no standard theorem that was not provable already. Bishop's constructive
analysis demands that every existence proof carry an algorithm, takes
"continuous on $[a,b]$" to mean uniformly continuous, and pays with the
intermediate value theorem, which survives only in approximate form because a
root cannot in general be located.

The one genuine alternative to the real line is to complete $\mathbb{Q}$ in a
different absolute value. Ostrowski's theorem says there are, up to equivalence,
only the usual one and the $p$-adic one for each prime, so $\mathbb{R}$ and the
fields $\mathbb{Q}_p$ exhaust the ways of filling in the rationals — and
$\mathbb{Q}_p$ shows how different the other answers look, with a series
converging as soon as its terms tend to zero. Past that there is no competitor
to name. Metric, normed and topological spaces are not rivals but the same
arguments written once at a higher altitude, and any structure satisfying the
theorems on this page is $\mathbb{R}$ over again.

## History and attribution

The rigour on this page is a nineteenth-century repair, usually called the
arithmetisation of analysis. Calculus had been productive for a century and a
half on foundations its own practitioners knew were unsound, and what forced the
repair was teaching it and the trouble with trigonometric series.

Bolzano published a purely analytic proof of the intermediate value theorem in
1817, objecting that the received argument borrowed from geometry and motion.
The paper was barely read, and much of what it contained — including the Cauchy
criterion — was rediscovered by others. Cauchy's _Cours d'analyse_ of 1821,
written for his students at the École Polytechnique, put limits and convergence
at the centre of the subject, and carries its famous error: the claim that a
convergent series of continuous functions has a continuous sum. Abel noted the
exception in 1826, with a trigonometric series whose sum jumps. The missing
hypothesis, uniform convergence, was isolated independently by Seidel and by
Stokes in 1847 and made standard by Weierstrass.

Weierstrass is the source of the $\varepsilon$–$\delta$ formulation in the
quantifier order used above, taught in his Berlin lectures from the late 1850s
and transmitted largely through students' notes rather than his own
publications. His continuous nowhere-differentiable function, presented to the
Berlin Academy in 1872, is what settled that a picture of a curve is not
evidence about it. Riemann's integral and his rearrangement theorem both come
from the 1854 Habilitationsschrift on trigonometric series, published in 1867,
after his death.

The real numbers themselves were constructed in 1872, and more than once.
Dedekind's cuts appeared in an essay whose preface dates his dissatisfaction to
1858 and a course on the calculus at Zurich; Cantor's fundamental sequences came
out of his work on the uniqueness of trigonometric expansions. Méray had
published essentially Cantor's construction in France a few years earlier and is
usually left out of the account, and Weierstrass taught a construction of his
own in Berlin that reached print through his students. Independent discovery,
not priority, is the accurate description.

One attribution on this page is genuinely contested. Borel proved the
finite-subcover property for countable covers of a closed bounded interval in
the mid-1890s; Lebesgue and Schoenflies extended it to arbitrary covers; Heine's
name was attached afterwards on the strength of his work on uniform continuity.
French texts call the result Borel–Lebesgue, and historians generally treat
Heine's share in it as overstated.

The later dates are cleaner. Lebesgue's measure and integral are his 1902
thesis. Robinson announced nonstandard analysis in 1961 and set it out in a book
in 1966; Bishop's _Foundations of Constructive Analysis_ is 1967; and the gauge
integral was reached independently by Henstock and by Kurzweil in the 1950s,
decades after Denjoy and Perron had arrived at equivalent integrals by other
routes.

## Sources

MIT 18.100A is the canonical course treatment: the standard sequencing —
completeness first, then sequences, then continuity and compactness — and the
counterexamples. Tao's _Analysis I_ is where to read the construction of
$\mathbb{R}$ from $\mathbb{Q}$; it is unusually explicit about what each axiom
buys. MIT 18.01 is the computational layer this page assumes. Durrett's
_Probability: Theory and Examples_ develops the measure-theoretic integral
pointed toward here, and states the convergence theorems the Riemann integral
lacks. MathWorld is cited only where this page attaches a name or a date to a
theorem, and is the place to check those attributions rather than to learn the
mathematics.

## Prerequisites and next connections

Come to this with a working command of derivatives, integrals and series, and
enough set-theoretic vocabulary — arbitrary subsets, countability, equivalence
classes — to read the supremum axiom without translating.

What it opens up: measure theory and Lebesgue integration, which fix the
convergence failures above; metric and normed spaces, where the
$\varepsilon$–$\delta$ arguments are written once and apply everywhere; and the
analytic underpinnings of operations used casually elsewhere, including
[Convolution](./convolution.md), whose integral needs an existence hypothesis
and whose differentiation under the integral sign needs a domination hypothesis.
