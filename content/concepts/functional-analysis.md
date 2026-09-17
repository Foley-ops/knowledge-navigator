---
concept_id: concept.analysis.functional_analysis
title: Functional Analysis
slug: /concepts/functional-analysis
kind: concept
tier: 1
review_state: generated-draft
summary: The study of infinite-dimensional vector spaces carrying a topology, where continuity of a linear map stops being automatic and four structural theorems — one from Zorn's lemma, three from Baire category — do most of the work.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.real_analysis
    note: Completeness, Cauchy sequences and the compactness arguments of the real line are exactly what a Banach space abstracts, and every proof here reuses them.
  - type: generalizes
    target: concept.analysis.hilbert_spaces
    note: A Hilbert space is a Banach space whose norm comes from an inner product; dropping the inner product loses orthogonal projection and self-duality but keeps the four core theorems.
  - type: requires
    target: concept.analysis.measure_theory
    note: The standard examples are the $L^p$ spaces, whose points are equivalence classes of measurable functions and whose completeness is a measure-theoretic theorem.
  - type: used_to_solve
    target: concept.analysis.partial_differential_equations
    note: Weak solutions are sought in Sobolev spaces, and existence is proved by functional-analytic arguments long before anything is known about smoothness.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - concrete-example
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.partial_differential_equations
    title: MIT 18.152 Introduction to Partial Differential Equations (Fall 2011)
    url: https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Functional analysis** is the study of infinite-dimensional vector spaces
carrying a topology, together with the linear maps between them that respect
that topology. Its central object is the **normed space**: a vector space $X$
over $\mathbb{R}$ or $\mathbb{C}$ with a map $\|\cdot\| : X \to [0, \infty)$
such that $\|x\| = 0$ only for $x = 0$, $\|\lambda x\| = |\lambda| \|x\|$, and
$\|x + y\| \le \|x\| + \|y\|$. If $X$ is complete in the metric
$d(x, y) = \|x - y\|$ it is a **Banach space**. Its points are usually functions
or sequences; its maps — **operators** — are things like differentiation,
[Convolution](./convolution.md) against a kernel, or the Fourier transform.

## Why it matters

A differential or integral equation asks for a function, not a number. Treating
the unknown function as a single point of a space, and the equation as an
operator on that space, turns "solve this" into "invert this map" or "find a
fixed point" — questions that have general answers. Existence theory for partial
differential equations, the spectral theory underneath quantum mechanics and the
duality that drives convex optimisation all rest on that one move. What it costs
is the geometry of $\mathbb{R}^n$, and most of the subject is the accounting of
what survives.

## Intuition

Picture $\mathbb{R}^n$ with $n$ turned up until three things break.

Linear maps stop being automatically continuous. Closed bounded sets stop being
compact, so you can no longer extract a convergent subsequence and must argue
from completeness instead. And a basis in the linear-algebra sense — finite
combinations — becomes useless: you need infinite sums, which means a topology
and a convergence proof.

The analogy breaks in one important way. Infinite dimension is not merely large
$n$; some phenomena have no finite-dimensional shadow. The multiplication
operator $(Mf)(x) = x f(x)$ on $L^2[0,1]$ is bounded and self-adjoint, its
spectrum is the whole interval $[0,1]$, and it has no eigenvectors whatsoever.
Nothing in matrix theory looks like that.

## Concrete example

In $\ell^2$, the square-summable sequences, let $e_n$ be the sequence with a $1$
in position $n$ and zeros elsewhere. Then $\|e_n\| = 1$ for every $n$ and
$\|e_n - e_m\| = \sqrt{2}$ whenever $n \ne m$, so no subsequence of $(e_n)$ is
Cauchy: the closed unit ball is closed, bounded and not compact. Riesz's lemma
shows this happens in _every_ infinite-dimensional normed space.

In $C[0,1]$ with the supremum norm, let $D$ be differentiation on the subspace
$C^1[0,1]$ and take $f_n(x) = \sin(n \pi x)/n$. Then
$\|f_n\|_\infty = 1/n \to 0$, while $(D f_n)(x) = \pi \cos(n \pi x)$ has
$\|D f_n\|_\infty = \pi$ for every $n$. So $f_n \to 0$ but $D f_n \not\to 0$:
$D$ is linear and not continuous. It is nonetheless **closed** — if
$f_n \to f$ and $f_n' \to g$ uniformly then $f \in C^1$ and $f' = g$ — the
standard warning that the closed graph theorem below needs a domain that is all
of a Banach space. $C^1[0,1]$ is dense in $C[0,1]$ and not complete in its norm.

## Formal treatment

For linear $T : X \to Y$ between normed spaces, continuity, continuity at $0$,
and boundedness are equivalent, where bounded means the **operator norm**

$$
\|T\| \;=\; \sup_{\|x\| \le 1} \|Tx\|
$$

is finite. The bounded operators form a space $B(X,Y)$, complete whenever $Y$
is; the **dual space** $X^{*} = B(X, \mathbb{K})$ is therefore always a Banach
space, whether or not $X$ is.

Four theorems carry the subject, and the differences between their hypotheses
are the point.

**Hahn–Banach.** Let $X$ be a real vector space — no norm, no topology, no
completeness — and $p : X \to \mathbb{R}$ sublinear, meaning
$p(x+y) \le p(x) + p(y)$ and $p(tx) = t\,p(x)$ for $t \ge 0$. If $f$ is linear
on a subspace $M \subseteq X$ with $f \le p$ on $M$, then $f$ extends to a
linear $F$ on all of $X$ with $F \le p$ everywhere. Taking
$p = \|f\| \, \|\cdot\|$ gives a norm-preserving extension of any bounded
functional; hence $X^{*}$ separates points and
$\|x\| = \sup_{\|f\| \le 1} |f(x)|$.

**Uniform boundedness (Banach–Steinhaus).** If $X$ is Banach, $Y$ merely
normed, and $\mathcal{F} \subseteq B(X,Y)$ satisfies
$\sup_{T \in \mathcal{F}} \|Tx\| < \infty$ for each fixed $x$, then
$\sup_{T \in \mathcal{F}} \|T\| < \infty$: pointwise bounded is uniformly
bounded.

**Open mapping.** If $X$ and $Y$ are Banach and $T \in B(X,Y)$ is surjective,
then $T$ carries open sets to open sets. Corollary: a bounded linear bijection
between Banach spaces has a bounded inverse.

**Closed graph.** If $X$ and $Y$ are Banach and $T : X \to Y$ is linear with
graph closed in $X \times Y$, then $T$ is bounded — equivalent to the open
mapping theorem.

## Assumptions and requirements

Hahn–Banach needs no completeness and no topology: only a dominating sublinear
function and Zorn's lemma. It is strictly weaker than choice — it follows from
the Boolean prime ideal theorem — but is not a theorem of ZF alone, so the
extension is genuinely non-constructive.

The other three rest on the Baire category theorem, hence on completeness of the
_domain_, and that hypothesis is not decoration. On $c_{00}$, the incomplete
space of finitely supported sequences with the supremum norm, the functionals
$f_n(x) = \sum_{k \le n} x_k$ are bounded at each fixed $x$ — only finitely many
coordinates are nonzero — while $\|f_n\| = n$. Open mapping and closed graph
additionally need the codomain complete and the operator defined on all of $X$,
which is why densely defined unbounded operators get a theory of their own.

One hypothesis is easy to lose: the scalar field. A bounded operator on a
complex Banach space always has nonempty spectrum; on a real one it can be
empty, as rotation by a quarter turn in $\mathbb{R}^2$ shows.

## Uses and applicability

Reach for it whenever the unknown is a function and the question is existence.
Weak formulations of elliptic PDE put the solution in a Sobolev space and
recover it from the Riesz representation theorem or Lax–Milgram, with regularity
argued afterwards. Quantum mechanics is the spectral theory of unbounded
self-adjoint operators on a Hilbert space. Probability uses $L^p$ spaces
throughout, conditional expectation appearing as an orthogonal projection in
$L^2$. Numerical analysis uses it to prove a discretisation converges: the
stability half of the Lax equivalence theorem is a uniform boundedness statement.

Do not reach for it when the problem is honestly finite-dimensional, and do not
expect algorithms: Hahn–Banach, Baire category and Zorn's lemma show that
objects exist without saying how to compute them.

## Limitations and common mistakes

The commonest error is importing finite-dimensional facts wholesale. Linear does
not imply continuous; closed and bounded does not imply compact; an injective
linear map need not be bounded below.

The second is confusing the two notions of basis. A Hamel basis expands every
vector as a _finite_ combination, and in an infinite-dimensional Banach space it
is necessarily uncountable. The $e_n$ form a Schauder basis of $\ell^2$ — every
element is a convergent infinite sum of them — and are nowhere near a Hamel
basis. Relatedly, nobody writes down an explicit unbounded functional on
$\ell^2$: doing so needs a Hamel basis and hence choice, and it is consistent
with ZF plus dependent choice that every linear map from a Banach space into a
normed space is bounded.

The third is assuming every Banach space behaves like a Hilbert space. $\ell^1$,
$L^1$ and $C[0,1]$ carry no inner product — the parallelogram law fails — and
have closed subspaces with no closed complement. Lindenstrauss and Tzafriri
proved the converse in 1971: if every closed subspace of a Banach space is
complemented, that space is isomorphic to a Hilbert space.

Fourth, $X^{**} = X$ is special: $\ell^p$ for $1 < p < \infty$ is reflexive,
$c_0$ and $L^1$ are not, and weak compactness arguments that assume reflexivity
fail there.

## Variants and alternatives

**Hilbert spaces** are the case where the norm comes from an inner product, and
almost everything above improves: orthogonal projection onto every closed
subspace, a self-dual structure, a full spectral theorem. **Locally convex
spaces** go the other way, replacing the norm by a family of seminorms; that
buys distributions and the weak and weak-$*$ topologies, at the cost of an
operator norm and of the Baire-based theorems, which survive only when restated
for **Fréchet spaces** (complete and metrisable). Weak topologies are how some
compactness returns: Banach–Alaoglu makes the closed unit ball of $X^{*}$
weak-$*$ compact. **Banach algebras** and **$C^{*}$-algebras** add a multiplication and turn
spectral theory into a representation theorem. A Galerkin or finite-element
discretisation goes the other way, replacing the problem by a finite one — but
the proof that the approximations converge is itself functional analysis.

## History and attribution

"Functional" comes from the calculus of variations, where the object of study is
a number depending on an entire curve: Volterra studied such "functions of
lines" in the late 1880s, Hadamard introduced the term _fonctionnelle_. The
subject then took shape around integral equations — Fredholm around 1900–1903,
Hilbert in the following decade, Riesz on $L^p$ spaces and compact operators
from 1910.

The abstract axioms of a complete normed space were given independently in 1922
by Banach, in his thesis, by Hahn and by Wiener; Banach's name attached because
he developed the theory, and his 1932 _Théorie des opérations linéaires_
consolidated the field. Hahn–Banach genuinely has
independent origins — Hahn in 1927 and Banach in 1929, with an earlier special
case due to Helly — and uniform boundedness is joint work of Banach and
Steinhaus from 1927. Von Neumann axiomatised Hilbert space in 1929 and built
quantum mechanics on it in papers from 1927, consolidated in his 1932
_Mathematische Grundlagen der Quantenmechanik_, entangling the
operator-theoretic and physical strands ever since.

## Sources

Axler states cleanly what holds in finite dimensions and what an inner product
gives — the baseline this page keeps contradicting. MIT 18.100A supplies the
completeness and compactness facts the Banach definitions abstract. Durrett is
the reference for $L^p$ spaces as they are actually used. MIT 18.152 gives the
PDE problems that motivate weak solutions. None is a functional analysis text:
these cover the surrounding material, not the four theorems. So no source cited
here supports the Formal treatment or the Assumptions and requirements section.
Both are standard in any graduate text, but nothing on this page verifies them
against a cited source.

## Prerequisites and next connections

Read [Real Analysis](./real-analysis.md) first: completeness, Cauchy sequences
and compactness are used on every page here, and the point of a Banach space is
that those arguments still work. A little [Set Theory](./set-theory.md) helps,
since Zorn's lemma and Baire category do visible work above. Linear algebra over
abstract vector spaces, not matrices, is assumed.

Next come [Hilbert Spaces](./hilbert-spaces.md), where an inner product restores
orthogonality and the spectral theorem;
[Measure Theory](./measure-theory.md), which makes $L^p$ a space rather than a
notation; and
[Partial Differential Equations](./partial-differential-equations.md), where the
existence machinery is cashed in.
[Fourier Analysis](./fourier-analysis.md) cuts across all three — the classical
continuous function whose Fourier series diverges at a point is a direct
application of uniform boundedness.
