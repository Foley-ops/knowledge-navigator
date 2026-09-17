---
concept_id: concept.geometry.point_set_topology
title: Point-Set Topology
slug: /concepts/point-set-topology
aliases:
  - general topology
  - set-theoretic topology
kind: concept
tier: 1
review_state: generated-draft
summary: The theory of spaces carrying nothing but a family of open sets, which is the least structure that still makes continuity, compactness and connectedness mean something.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.foundations.set_theory
    note: A topology is a family of subsets closed under arbitrary unions indexed by arbitrary sets, so the axioms cannot even be stated without set-theoretic language for families, unions and power sets.
  - type: generalizes
    target: concept.analysis.real_analysis
    note: The open-set axioms are an abstraction of how open intervals behave on the real line, and continuity-by-preimages is the epsilon-delta definition with the numbers deleted.
  - type: contributes_to
    target: concept.analysis.functional_analysis
    note: The weak and weak-star topologies are defined by open sets rather than a norm, and results like Banach-Alaoglu are compactness statements that only make sense in the open-cover setting.
  - type: contrasts_with
    target: concept.geometry.euclidean_geometry
    note: Euclidean geometry treats distance and angle as the primary data, while a topology remembers none of it, so congruence is invisible and only properties preserved by homeomorphism survive.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.hatcher.algebraic_topology
    title: Allen Hatcher, Algebraic Topology
    url: https://pi.math.cornell.edu/~hatcher/AT/ATpage.html
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.plato.set_theory
    title: 'Stanford Encyclopedia of Philosophy: Set Theory'
    url: https://plato.stanford.edu/entries/set-theory/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.morris.topology_without_tears
    title: Topology Without Tears
    url: https://www.topologywithouttears.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - concrete-example
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.plato.axiom_of_choice
    title: 'Stanford Encyclopedia of Philosophy: The Axiom of Choice'
    url: https://plato.stanford.edu/entries/axiom-choice/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mactutor.history_of_topology
    title: 'MacTutor: A history of Topology'
    url: https://mathshistory.st-andrews.ac.uk/HistTopics/Topology_in_mathematics/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Bourbaki's Topologie generale (1940) as the source of the open-set axioms in their usual form
    reason: MacTutor's history of topology stops well before Bourbaki, and the archive's Bourbaki biography names neither Topologie generale nor a date for it, so the claim that the open-set axioms took their present form - Hausdorffness demoted to an optional hypothesis - in Bourbaki's 1940 volume rests on no registry source.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Point-set topology** is the study of topological spaces and the continuous
maps between them. A **topological space** is a pair $(X, \tau)$ in which $X$ is
a set and $\tau$ is a family of subsets of $X$, called the _open sets_, such
that

1. $\emptyset \in \tau$ and $X \in \tau$;
2. any union $\bigcup_{i \in I} U_i$ of members of $\tau$, over any index set
   $I$, is in $\tau$;
3. any intersection $U_1 \cap \dots \cap U_n$ of finitely many members is in
   $\tau$.

A set is **closed** when its complement is open. A map $f : X \to Y$ between
spaces is **continuous** when $f^{-1}(V)$ is open in $X$ for every open
$V \subseteq Y$, and a **homeomorphism** when it is a continuous bijection with
continuous inverse. That is the whole of the primitive apparatus: no distance,
no angle, no number.

## Why it matters

The asymmetry between (2) and (3) — arbitrary unions, only finite intersections
— is the whole content of the subject, and it is what the $\varepsilon$ in an
epsilon-delta argument was doing. Isolating it buys two things.

First, continuity and convergence become available on objects with no natural
metric: the Zariski topology in algebraic geometry, the weak-star topology on a
dual space, the product topology on an uncountable product, the quotient
topology on an orbit space.

Second, the theorems transfer. "The continuous image of a compact space is
compact" and "the continuous image of a connected space is connected" are
three-line proofs from the axioms, and they specialise to the extreme value
theorem and the intermediate value theorem on $\mathbb{R}$ for free.

## Intuition

A topology is nearness with no numbers attached. The open sets tell you when you
are _arbitrarily_ close to something but never _how_ close, so everything you
can say survives any deformation that preserves them.

The rubber-sheet picture — stretch but do not tear — is a good guide for
subspaces of $\mathbb{R}^n$ and a bad guide elsewhere. It breaks in two places.
A topology can be too coarse to separate points at all, so a sequence may
converge to several limits at once; and a space is not generally determined by
its convergent sequences, since $\mathbb{N}$ is too small an index set to probe
a space with no countable neighbourhood bases. Both failures are invisible in
metric spaces, which is why metric intuition misleads.

## Concrete example

Put the **cofinite topology** on $\mathbb{Z}$: the open sets are $\emptyset$ and
every set whose complement is finite. The axioms hold — unions and finite
intersections of cofinite sets are cofinite, while an infinite intersection such
as $\bigcap_{n \ge 1} (\mathbb{Z} \setminus \{n\})$ is not, which is exactly why
(3) stops at finite intersections.

This space does real work as a counterexample.

- It is $T_1$: each $\{p\}$ is closed, because $\mathbb{Z} \setminus \{p\}$ is
  cofinite and therefore open.
- It is **not Hausdorff**: two nonempty open sets are both cofinite, so their
  intersection is cofinite in an infinite set and hence nonempty.
- Limits are not unique. The sequence $x_n = n$ converges to _every_ integer
  $p$: any open $U \ni p$ has finite complement, so all but finitely many $x_n$
  lie in $U$.
- It is **compact**: given an open cover, pick any nonempty member; it omits
  finitely many points, and one cover element for each of those finishes the job.
- It is therefore **not metrisable**, since every metric space is Hausdorff.

This is not a contrived object. On the affine line over an infinite field the
Zariski topology _is_ the cofinite topology, so a basic space of algebraic
geometry is compact, non-Hausdorff and non-metrisable.

Conversely $\mathbb{Q} \cap [0,1]$ is closed and bounded in the metric space
$\mathbb{Q}$ and is not compact: with $\alpha = 1/\sqrt{2}$, the sets
$U_n = \{x \in \mathbb{Q} \cap [0,1] : |x - \alpha| > 1/n\}$ cover it because
$\alpha$ is irrational, they increase, and none covers alone.

## Formal treatment

A **basis** $\mathcal{B}$ for $\tau$ is a subfamily whose unions give every open
set; the metric topology on $(X,d)$ is generated by the balls
$B(x,r) = \{y : d(x,y) < r\}$. The **closure** $\overline{A}$ is the smallest
closed set containing $A$. Three constructions carry the subject: the **subspace** topology
$\tau_A = \{U \cap A : U \in \tau\}$, the **product** topology on
$\prod_{i \in I} X_i$ generated by the sets $\pi_i^{-1}(U_i)$ — constraining
finitely many coordinates at a time — and the **quotient** topology, in which
$V \subseteq X/{\sim}$ is open exactly when its preimage is.

$X$ is **Hausdorff** ($T_2$) when distinct $x \ne y$ have disjoint open
neighbourhoods. Below it sit $T_0$ (some open set contains one point and not the
other) and $T_1$ (points are closed); above it, regularity separates a point
from a closed set and normality separates two closed sets. Conventions for $T_3$
and $T_4$ differ on whether $T_1$ is bundled in.

$X$ is **compact** when every open cover has a finite subcover, and in general
topology that is the definition. "Closed and bounded" is not an alternative
definition; it is the conclusion of the Heine–Borel theorem, a statement about
$\mathbb{R}^n$ and nothing more. In a general metric space the correct
characterisation is _complete and totally bounded_; in a general topological
space boundedness is not expressible at all. Compactness also interacts with
separation: a compact subset of a Hausdorff space is closed, and a continuous
bijection from a compact space to a Hausdorff space is a homeomorphism.
Tychonoff's theorem (1930) says an arbitrary product of compact spaces is
compact.

$X$ is **connected** when it is not the union of two disjoint nonempty open
sets. Path-connectedness implies connectedness; the converse fails, the standard
witness being the closure of $\{(x, \sin(1/x)) : 0 < x \le 1\}$. Metrisability
is likewise a theorem, not an assumption: by Urysohn's metrisation theorem, a
regular Hausdorff space with a countable basis is metrisable.

## Assumptions and requirements

The axioms presuppose ordinary ZFC set theory, since (2) quantifies over
arbitrary families of subsets. Choice is not idle: Tychonoff's theorem for
arbitrary spaces is equivalent to the axiom of choice, while for compact
Hausdorff spaces it is equivalent to the Boolean prime ideal theorem and so
strictly weaker, meaning a constructively minded reader gets a different theory.
Finiteness in (3) is load-bearing too — closure under arbitrary intersections
gives the Alexandrov spaces, equivalent to preorders, which cannot carry the
standard topology on $\mathbb{R}$.

The separation hypotheses in named results are doing real work. Uniqueness of
limits and "compact implies closed" need Hausdorff; Urysohn's lemma and the
Tietze extension theorem need normality; the equivalence of compactness with
sequential compactness needs a metric, since neither implication holds in
general; the equivalence of closure with sequential closure needs first
countability. Heine–Borel needs both completeness of $\mathbb{R}$ and finite
dimension: by Riesz's lemma the closed unit ball of a normed space is compact
only when the space is finite-dimensional.

## Uses and applicability

Reach for the point-set language whenever the object of interest has a useful
notion of convergence but no useful metric. Functional analysis is the clearest
case: the weak-star topology exists so that the closed unit ball of a dual space
can be compact, which in infinite dimensions the norm topology never permits.
Algebraic geometry uses the Zariski topology because it is coarse enough to be
defined by polynomials. Algebraic topology needs the machinery before it starts,
since CW complexes are built by quotient topologies on disjoint unions of cells.

It is the wrong tool when the question is quantitative — topology sees no rates,
error bounds, volumes or curvature — and unnecessary when the space is a subset
of $\mathbb{R}^n$, where the metric is more concrete and sequences suffice.

## Limitations and common mistakes

The most common error is importing "compact = closed and bounded" from a
calculus course. The two counterexamples above are standard for a reason: one is
closed and bounded without being compact, the other compact with no notion of
bounded available at all.

The second is trusting sequences. In $\{0,1\}^{[0,1]}$ with the product
topology, Tychonoff gives compactness, yet the functions sending $t$ to its
$n$-th binary digit have no pointwise-convergent subsequence: compact, not
sequentially compact.

The third is reading continuity as a condition on images. It is a statement
about _preimages_; a continuous map need not send open sets to open sets, as any
constant map shows. Relatedly, "closed" is not the negation of "open": $[0,1)$
is neither, $\{x \in \mathbb{Q} : x < \sqrt{2}\}$ is both. The fourth is
assuming Hausdorff silently, as most textbook intuition does — quotients by
group actions and the Zariski topology routinely fail it, and the theorems that
were quietly using it fail with it.

Finally, on infinite products the **box** topology — all products of open sets —
is not the product topology and is the wrong one: under it the diagonal map
$\mathbb{R} \to \mathbb{R}^{\omega}$, $x \mapsto (x, x, \dots)$, is
discontinuous and Tychonoff's theorem fails.

## Variants and alternatives

**Metric spaces** add distance, and with it quantitative statements and
sequences that suffice; the cost is that many natural spaces admit no metric.
**Uniform spaces** sit between the two, supplying Cauchy sequences and uniform
continuity without a metric. **Locales**, or pointless topology, keep the
lattice of open sets and discard the points, which behaves better without
choice. **Compactly generated weak Hausdorff spaces** are the convenient
category homotopy theorists restrict to, because the full category of spaces
behaves badly for mapping spaces. **Grothendieck topologies** abstract covers
rather than open sets, and made sheaf theory work in algebraic geometry. Inside
the subject, nets and filters describe convergence where sequences cannot.

## History and attribution

The subject has several roots rather than one. Cantor's study of point sets of
reals, driven by uniqueness questions for trigonometric series, produced the
first derived set — the set of limit points — in 1872, along with the open and
closed subsets of the line; Poincaré's _Analysis Situs_ (1895) started the
qualitative geometric side, and with it homology, the Betti numbers and the
fundamental group. Fréchet's 1906 thesis introduced metric spaces as an abstract
setting for convergence. Riesz then proposed dropping the metric altogether,
axiomatising a space through its limit points, in a paper to the 1909 congress
in Rome; and Hausdorff's _Grundzüge der Mengenlehre_ (1914) settled on the
definition that stuck, four neighbourhood axioms with no distance anywhere — the
last of them the separation property that now bears his name. Kuratowski's
closure-operator axiomatisation followed in 1922, and the open-set axioms above,
with Hausdorffness demoted to an optional hypothesis, were fixed in the form
most people learn by Bourbaki's _Topologie générale_ (1940).

## Sources

Wolfram MathWorld is the quickest reference for the definitions and the
separation-axiom vocabulary — good for checking a statement, not for proofs.
Morris's _Topology Without Tears_ is the general-topology text this page leans
on wherever a real-analysis course stops: the open-set axioms, the finite-closed
(cofinite) topology, metric spaces, compactness by open covers with Heine–Borel
as a theorem about $\mathbb{R}^n$ rather than a definition, and Tychonoff's
theorem for arbitrary products. MIT 18.100A supplies the concrete case every
definition here abstracts, but only on the real line: convergent sequences,
limits and continuity, Bolzano–Weierstrass, and the extreme value and
intermediate value theorems; it never reaches metric spaces or open covers.
Hatcher's _Algebraic Topology_ shows the apparatus in use — quotient topologies,
CW complexes, and the appendix on compactly generated spaces. The Stanford
Encyclopedia entry on set theory gives the ZFC background, and its entry on the
axiom of choice is where the product theorem's equivalence with choice is
recorded, together with the Boolean prime ideal theorem that the compact
Hausdorff case matches instead. For the history, MacTutor's _A history of
Topology_ carries Cantor's derived sets, Poincaré's _Analysis Situs_, Fréchet's
metric spaces and Hausdorff's neighbourhood axioms, and the archive's Kuratowski
biography carries the closure axioms of 1922; neither reaches Bourbaki, which is
why that one attribution stays in the unresolved references.

## Prerequisites and next connections

Read [Set Theory](./set-theory.md) first: the axioms are statements about
families of subsets, and unions over arbitrary index sets are the operation
being asked for. [Real Analysis](./real-analysis.md) is not strictly required,
but it is the concrete case every definition here abstracts.

From here, [Functional Analysis](./functional-analysis.md) is where the
non-metric topologies earn their keep, and [Banach Spaces](./banach-spaces.md)
shows why the norm topology alone is not enough in infinite dimensions.
[Measure Theory](./measure-theory.md) is the instructive contrast — a
$\sigma$-algebra is also a family of subsets with closure conditions, but
countable unions and complements rather than arbitrary unions and finite
intersections, and the Borel $\sigma$-algebra is the bridge a topology
generates. [Category Theory](./category-theory.md) recovers the subspace,
product and quotient topologies as universal constructions.
