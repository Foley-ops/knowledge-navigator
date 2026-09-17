---
concept_id: concept.analysis.banach_spaces
title: Banach Spaces
slug: /concepts/banach-spaces
aliases:
  - complete normed space
  - B-space
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: A vector space with a length that loses no limits — the setting where infinite-dimensional analysis still works, but without angles, so projections and duality stop being free.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: A Banach space is a vector space first; the norm and completeness are extra structure laid on top of addition and scalar multiplication, and every statement below uses linearity.
  - type: generalizes
    target: concept.analysis.hilbert_spaces
    note: Every Hilbert space is a Banach space under the norm its inner product induces, but a norm is Hilbertian only when it obeys the parallelogram law, which $\ell^1$ and the sup norm do not.
  - type: prerequisite_of
    target: concept.analysis.operators
    note: Boundedness, the operator norm, and the open mapping and closed graph theorems are all statements about maps between Banach spaces, so the spaces have to be defined before the operators on them.
  - type: contributes_to
    target: concept.analysis.functional_analysis
    note: Banach spaces are the objects the subject is largely about, and three of its four cornerstone theorems hold precisely because the space is complete.
sources:
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
    checked_on: 2026-09-17
  - source_id: source.tao.analysis_i
    title: Terence Tao, Analysis I
    url: https://terrytao.wordpress.com/books/analysis-i/
    source_kind: authoritative-secondary
    supports:
      - definition
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **Banach space** is a vector space $X$ over $\mathbb{R}$ or $\mathbb{C}$ carrying
a norm $\|\cdot\|$ that is complete in the metric $d(x,y) = \|x - y\|$: every
Cauchy sequence in $X$ converges to a point of $X$. The norm must satisfy
$\|x\| \ge 0$ with equality only for $x = 0$, $\|\lambda x\| = |\lambda|\,\|x\|$,
and $\|x + y\| \le \|x\| + \|y\|$.

Completeness is a property of the pair, not of the vector space. The same set of
continuous functions on $[0,1]$ is complete under the supremum norm and not
complete under $\int_0^1 |f|$.

## Why it matters

Analysis is the business of producing an object as a limit of approximations.
Completeness is the licence to do that: if a construction generates a Cauchy
sequence, the answer exists. That is why Picard iteration solves an
[ordinary differential equation](./ordinary-differential-equations.md) and why an
iterative numerical scheme has something to converge to. It is not what makes the
direct method in the calculus of variations work: a minimising sequence is
bounded but need not be Cauchy, and it is reflexivity and weak compactness, not
completeness, that produce a limit.

The norm gives quantitative control — error bounds, operator norms, convergence
rates — that a bare topology does not. The combination is strong enough to
support the structural theorems of the subject and weak enough that almost every
function space people actually use is an instance:
[measure-theoretic](./measure-theory.md) $L^p$, sequence spaces, spaces of
continuous or differentiable functions, Sobolev spaces.

## Intuition

Picture $\mathbb{R}^n$ and then remove two conveniences. First, dimension is
infinite, so closed bounded sets are no longer compact and you cannot extract
convergent subsequences by Bolzano–Weierstrass. Second, and this is the part
people underestimate, there is a length but no angle. Two vectors have no dot
product, so "perpendicular" is not defined.

The useful mental image is a unit ball whose shape you do not control. In a
[Hilbert space](./hilbert-spaces.md) the ball is round, and round balls give
unique nearest points, orthogonal complements and a self-dual space. In $\ell^1$
the ball is a diamond and in $\ell^\infty$ a cube, and corners and flat faces
break exactly those properties. The analogy stops at one place: a flat face is a
finite-dimensional picture of non-uniqueness, whereas the deeper
infinite-dimensional failures — non-reflexivity, uncomplemented subspaces — have
no two-dimensional picture at all.

## Concrete example

Take $\mathbb{R}^2$ with $\|(a,b)\|_\infty = \max(|a|,|b|)$. It is a Banach
space. It is not a Hilbert space, and the parallelogram law shows why: with
$x = (1,0)$ and $y = (0,1)$,

$$
\|x+y\|_\infty^2 + \|x-y\|_\infty^2 = 1 + 1 = 2,
\qquad
2\|x\|_\infty^2 + 2\|y\|_\infty^2 = 4 .
$$

By the Jordan–von Neumann theorem, a norm comes from an inner product if and only
if that identity holds for all $x,y$. It fails here, so no inner product induces
$\|\cdot\|_\infty$. The $\ell^1$ norm fails in the other direction on the same
pair: $\|x+y\|_1 = \|x-y\|_1 = 2$, so the left side is $4 + 4 = 8$ against a
right side of $4$.

Now watch a projection die. Let $M = \{(t,0) : t \in \mathbb{R}\}$, a closed
subspace, and take the point $p = (0,1)$. Then
$\|p - (t,0)\|_\infty = \max(|t|,1)$, which equals $1$ for every $t$ with
$|t| \le 1$. The distance from $p$ to $M$ is $1$ and it is attained on a whole
segment of nearest points. The metric projection onto $M$ is therefore
set-valued, not a map, so there is no canonical nearest point to return. A linear
selection does still exist here — $(a,b) \mapsto (a,0)$ is one, of norm $1$ — and
in finite dimensions every subspace carries a bounded linear projection. The
failure with no low-dimensional picture is the infinite-dimensional one below,
where a closed subspace can admit no bounded projection at all.

Incompleteness is just as concrete. On $C[0,1]$ with $\|f\|_1 = \int_0^1|f|$, let
$f_n$ be $0$ on $[0,\tfrac12]$, rise linearly to $1$ on
$[\tfrac12, \tfrac12 + \tfrac1n]$, and equal $1$ after. Against the step function
$\mathbf{1}_{[1/2,1]}$ the error is exactly $\tfrac{1}{2n}$, so
$\|f_n - f_m\|_1 \le \tfrac{1}{2n} + \tfrac{1}{2m}$ and the sequence is Cauchy —
but its limit is discontinuous, so it leaves the space. The completion is
$L^1[0,1]$.

## Formal treatment

Write $\mathbb{K}$ for $\mathbb{R}$ or $\mathbb{C}$. For a measure space
$(\Omega,\mathcal{F},\mu)$ and $1 \le p < \infty$, $L^p(\mu)$ is the space of
equivalence classes of measurable $f$ with
$\|f\|_p = \left(\int |f|^p \, d\mu\right)^{1/p} < \infty$; $L^\infty$ uses the
essential supremum. Minkowski's inequality is the triangle inequality here, and
the Riesz–Fischer theorem says each $L^p$ is complete. Counting measure on
$\mathbb{N}$ gives the sequence spaces $\ell^p$.

Completeness has a clean series form: $X$ is a Banach space if and only if every
absolutely convergent series converges, that is $\sum_n \|x_n\| < \infty$ implies
$\sum_n x_n$ converges in $X$.

The **dual** $X^*$ is the space of bounded linear functionals $f : X \to \mathbb{K}$
with $\|f\| = \sup_{\|x\| \le 1} |f(x)|$. More generally $B(X,Y)$ is complete
whenever $Y$ is, so $X^*$ is always a Banach space even when $X$ is not. Hahn–Banach
supplies enough functionals that $\|x\| = \sup_{\|f\| \le 1} |f(x)|$, which makes
the canonical map

$$
J : X \to X^{**}, \qquad J(x)(f) = f(x)
$$

an isometry. $X$ is **reflexive** when $J$ is onto. The standard table:

- $\ell^p$ and $L^p$ for $1 < p < \infty$: dual is $\ell^q$ or $L^q$ with
  $1/p + 1/q = 1$; reflexive, and uniformly convex (Clarkson).
- $\ell^1$: dual $\ell^\infty$; not reflexive. It is separable and its dual is
  not, which is impossible for a reflexive space.
- $c_0$ (sequences tending to $0$, sup norm): dual $\ell^1$, bidual $\ell^\infty$;
  not reflexive.
- $\ell^\infty$, $L^\infty$, $C[0,1]$: not reflexive. The dual of $C[0,1]$ is a
  space of measures, by Riesz–Markov–Kakutani.
- Hilbert spaces: self-dual by Riesz representation, hence reflexive.

Completeness is what powers three of the four pillars, all via Baire category:
**Banach–Steinhaus** (a pointwise-bounded family in $B(X,Y)$ is norm-bounded),
the **open mapping theorem** (a bounded surjection between Banach spaces is open,
so a bounded bijection has bounded inverse), and the **closed graph theorem**.
The fourth, Hahn–Banach, needs no completeness at all — it needs Zorn's lemma.

## Assumptions and requirements

The absolute homogeneity and triangle inequality are not decoration. Drop the
triangle inequality to $\|x+y\| \le K(\|x\| + \|y\|)$ and you get a quasi-Banach
space; $L^p(0,1)$ for $0 < p < 1$ is one, it is not locally convex, and its dual
is $\{0\}$ — Hahn–Banach genuinely fails.

The open mapping and closed graph theorems require **both** spaces complete, and
the counterexample is immediate: the identity from $(C[0,1], \|\cdot\|_\infty)$
to $(C[0,1], \|\cdot\|_1)$ is bounded and bijective with unbounded inverse. The
target is incomplete, so nothing is violated.

Duality carries hypotheses too. $(L^p)^* = L^q$ holds for arbitrary measure
spaces when $1 < p < \infty$, but the case $p = 1$ needs $\sigma$-finiteness.
Reflexivity is the hypothesis that makes bounded sequences weakly sequentially
compact (Eberlein–Šmulian), which is why the direct method in the calculus of
variations is comfortable in $W^{1,p}$ for $1 < p < \infty$ and awkward at the
endpoints.

## Uses and applicability

Reach for the Banach setting when you need limits and quantitative bounds but the
natural norm has no inner product behind it: $L^1$ and $L^\infty$ estimates,
sup-norm arguments on continuous functions, $W^{1,p}$ Sobolev theory for
[partial differential equations](./partial-differential-equations.md) away from
$p = 2$, and the contraction mapping arguments that give existence and uniqueness
for ODEs and integral equations. In probability, $L^p$ spaces and their
inequalities are the working environment for convergence theorems.

Do not reach for it in finite dimensions, where all norms are equivalent and
every normed space is already complete, so none of the machinery says anything
new. Do not reach for it when an inner product is available — the
[Hilbert](./hilbert-spaces.md) structure is strictly stronger and gives
projections and self-duality for free. And it simply does not apply when the
natural topology is not normable: the Schwartz space, $C^\infty(\Omega)$ and the
distributions of [Fourier analysis](./fourier-analysis.md) are Fréchet or LF
spaces, defined by families of seminorms, not by a single norm.

## Limitations and common mistakes

The most common error is importing Euclidean reflexes. Closed and bounded does
not imply compact: by Riesz's lemma the closed unit ball is compact exactly when
the space is finite-dimensional. Nearest points in a closed convex set need not
exist or be unique, as the segment above shows. Not every closed subspace has a
closed complement — $c_0$ is not complemented in $\ell^\infty$ — and by a theorem
of Lindenstrauss and Tzafriri a space in which every closed subspace is
complemented is isomorphic to a Hilbert space.

The second is confusing reflexivity with being isomorphic to your bidual. James
constructed a space isometrically isomorphic to $X^{**}$ that is not reflexive,
because the isomorphism is not the canonical $J$.

The third is assuming a nice basis exists. Every vector space has a Hamel basis,
but for an infinite-dimensional Banach space it is uncountable and useless; the
relevant notion is a Schauder basis, and Enflo showed that a separable Banach
space can fail to have one.

Finally, do not read weak convergence as convergence. In $\ell^2$ the standard
unit vectors satisfy $e_n \to 0$ weakly while $\|e_n\| = 1$ for every $n$.

## Variants and alternatives

**Hilbert spaces** add an inner product and are the case to prefer when you can
get it. **Banach algebras** add a submultiplicative product $\|xy\| \le \|x\|\|y\|$
and carry spectral theory; **C\*-algebras** add an involution and an identity
tying norm to spectrum. **Uniformly convex** and **uniformly smooth** spaces are
intermediate: enough roundness to recover unique nearest points and, by
Milman–Pettis, reflexivity, without an inner product.

Going the other way, **Fréchet spaces** keep completeness but replace the norm
with a countable family of seminorms, which is what smooth function spaces need;
general **locally convex spaces** go further and are where distributions live;
**quasi-Banach** spaces keep a single functional but weaken the triangle
inequality. Each step out buys more examples and loses theorems — Fréchet spaces
keep open mapping and closed graph, quasi-Banach spaces lose Hahn–Banach.

## History and attribution

Stefan Banach axiomatised these spaces in his 1920 doctoral thesis, published in
_Fundamenta Mathematicae_ in 1922, while working on integral equations; he called
them spaces of type (B). The idea has more than one origin: Hans Hahn and Norbert
Wiener arrived at essentially the same axioms at essentially the same time, and
Wiener did not pursue them. Maurice Fréchet's 1906 abstract metric spaces were
the setting the norm was added to.

Banach's 1932 _Théorie des opérations linéaires_ consolidated the field, and the
Lwów school around him — with its Scottish Café problem book — drove it for a
decade. The Hahn–Banach theorem was proved by Hahn in 1927 and Banach in 1929,
with an earlier special case due to Eduard Helly. Jordan and von Neumann
characterised inner-product norms by the parallelogram law in 1935. Later
landmarks are negative and clarifying: James's non-reflexive space isometric to
its bidual in 1951, and Enflo's 1973 solution of the basis and approximation
problems.

## Sources

MIT 18.100A is the right place for Cauchy sequences, completeness and the
metric-space facts the definition rests on. Tao's _Analysis I_ is careful about
what completeness actually gives and where limits escape a space, which is the
point of the $C[0,1]$ example. Axler covers inner product spaces, the
parallelogram equality and orthogonal projection, and so marks exactly the line
this page is drawn against. Durrett supplies the measure-theoretic $L^p$ spaces,
Hölder and Minkowski, and their use in probability. None of these is a functional
analysis text; a reader who wants the four pillars proved should go to a
dedicated one.

## Prerequisites and next connections

Read [Real Analysis](./real-analysis.md) first, for Cauchy sequences and what
completeness means, and have linear algebra in hand — a Banach space is a vector
space before it is anything else. [Measure Theory](./measure-theory.md) is needed
for the $L^p$ examples to be more than notation, since their completeness is a
measure-theoretic theorem.

From here, [Hilbert Spaces](./hilbert-spaces.md) is the special case where the
geometry comes back, and comparing the two is the fastest way to see what the
norm alone can and cannot do. [Functional Analysis](./functional-analysis.md)
assembles the four cornerstone theorems on top of this definition.
[Partial Differential Equations](./partial-differential-equations.md) is where
the payoff is largest: weak solutions are sought in Sobolev spaces, and existence
is a functional-analytic statement long before regularity is known.
