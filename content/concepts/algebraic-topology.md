---
concept_id: concept.geometry.algebraic_topology
title: Algebraic Topology
slug: /concepts/algebraic-topology
aliases:
  - combinatorial topology
kind: concept
tier: 1
review_state: generated-draft
summary: The practice of turning spaces into groups and continuous maps into homomorphisms, so that a question about whether some map can exist becomes a question about whether some homomorphism can exist.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.geometry.point_set_topology
    note: Every object here — homotopy, path, covering map, quotient, CW complex — is defined in terms of open sets and continuity, so the open-set axioms have to be in hand before the first definition can be read.
  - type: requires
    target: concept.algebra.group_theory
    note: The invariants are groups, and the arguments are statements about homomorphisms, normal subgroups and conjugacy, so a reader without group theory cannot follow what the fundamental group is saying.
  - type: contributes_to
    target: concept.algebra.homological_algebra
    note: Chain complexes, exact sequences and derived functors were abstracted out of singular and simplicial homology, and homological algebra is what remains once the topology is deleted.
  - type: contributes_to
    target: concept.foundations.category_theory
    note: Functor and natural transformation were introduced to make precise the sense in which the invariants of algebraic topology depend naturally on the space, and functoriality is still the mechanism by which every argument here works.
sources:
  - source_id: source.hatcher.algebraic_topology
    title: Allen Hatcher, Algebraic Topology
    url: https://pi.math.cornell.edu/~hatcher/AT/ATpage.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.may.concise_course_algebraic_topology
    title: A Concise Course in Algebraic Topology
    url: https://www.math.uchicago.edu/~may/CONCISE/ConciseRevised.pdf
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebraic_topology
    title: MIT 18.905 Algebraic Topology I (Fall 2016)
    url: https://ocw.mit.edu/courses/18-905-algebraic-topology-i-fall-2016/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mactutor.history_of_topology
    title: 'MacTutor: A history of Topology'
    url: https://mathshistory.st-andrews.ac.uk/HistTopics/Topology_in_mathematics/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: The mid-century reformulation — Betti numbers as abelian groups, the Eilenberg–Steenrod axioms, Lefschetz's naming of the subject
    reason: The registry's history source is an article on the origins of topology and its coverage stops well before the 1930s–1950s reworking; May states the Eilenberg–Steenrod axioms mathematically but is not a historical source for who did what when, so the attributions in the last paragraph of the history section rest on nothing cited here.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Algebraic topology** assigns to each topological space an algebraic object —
a group, a ring, a graded module — and to each continuous map a homomorphism
between those objects, respecting composition and identities. That is to say, it
studies functors

$$
F : \mathbf{Top} \longrightarrow \mathbf{Grp},
\qquad F(g \circ f) = F(g) \circ F(f),
\qquad F(\mathrm{id}_X) = \mathrm{id}_{F(X)} .
$$

That bookkeeping is the entire trick. If $f : X \to Y$ is a homeomorphism with
inverse $g$, then $F(f)$ and $F(g)$ are mutually inverse homomorphisms, so
$F(X) \cong F(Y)$. The principal functors are the **fundamental group**
$\pi_1$, the higher **homotopy groups** $\pi_n$, **singular homology** $H_n$
and **cohomology** $H^n$, the last of which is contravariant and carries a ring
structure.

## Why it matters

Showing two spaces _are_ homeomorphic is a construction: exhibit the map.
Showing they are _not_ asserts the non-existence of any map whatsoever, over a
class too large to search. An invariant converts that into a finite computation
— compute $F$ on both sides, find the groups differ, and every map is ruled out
at once.

The same move proves results that look nothing like topology. Brouwer's fixed
point theorem, the hairy ball theorem, Borsuk–Ulam, the fundamental theorem of
algebra, and the fact that $\mathbb{R}^m \cong \mathbb{R}^n$ only when $m = n$
are all proved by computing an invariant and observing that the required
homomorphism cannot exist.

## Intuition

The working picture is hole-counting. $\pi_1$ records loops that cannot be
contracted; $H_n$ records $n$-dimensional cycles that bound nothing. A torus has
two independent one-dimensional holes and one two-dimensional cavity, and its
invariants say exactly that.

The honest analogy is the determinant: a drastic compression of a matrix, it is
computable, and $\det(AB) = \det A \det B$ means it respects composition, so
$\det A = 0$ settles that $A$ has no inverse while equal determinants settle
nothing. The analogy breaks in one place. An invariant here is not a number but
an object with internal structure, and the _maps_ between invariants usually
carry more than the invariants do — a long exact sequence is a statement about
homomorphisms, not about group sizes.

## Concrete example

Let $S^1 = \{z \in \mathbb{C} : |z| = 1\}$ with basepoint $1$, and let

$$
p : \mathbb{R} \to S^1, \qquad p(t) = e^{2\pi i t} .
$$

This is a covering map: each point of $S^1$ has a neighbourhood whose preimage
is a disjoint union of intervals mapped homeomorphically. The lifting lemmas
give every loop $\gamma$ at $1$ a unique lift $\tilde\gamma$ with
$\tilde\gamma(0) = 0$, force $\tilde\gamma(1) \in \mathbb{Z}$, and make
homotopic loops lift to the same endpoint. So $[\gamma] \mapsto \tilde\gamma(1)$
is an isomorphism

$$
\pi_1(S^1, 1) \;\cong\; \mathbb{Z},
$$

the integer being the winding number. Meanwhile $D^2$ is convex, hence
contractible, so $\pi_1(D^2) = 0$.

Now the payoff. Suppose $r : D^2 \to S^1$ were continuous with $r(x) = x$ for
$x \in S^1$. With $i : S^1 \hookrightarrow D^2$ the inclusion, $r \circ i =
\mathrm{id}_{S^1}$, so applying $\pi_1$ gives
$r_* \circ i_* = \mathrm{id}_{\mathbb{Z}}$ factored through $\pi_1(D^2) = 0$:

$$
\mathbb{Z} \xrightarrow{\;i_*\;} 0 \xrightarrow{\;r_*\;} \mathbb{Z}
$$

cannot compose to the identity. **No retraction exists.** Brouwer in dimension
two follows immediately: if $f : D^2 \to D^2$ had no fixed point, the ray from
$f(x)$ through $x$ would meet $S^1$ in a single point $r(x)$, giving a
continuous $r$ fixing $S^1$ pointwise — which we have just shown cannot exist.

## Formal treatment

Maps $f, g : X \to Y$ are **homotopic** if there is a continuous $H : X \times
[0,1] \to Y$ with $H(\cdot, 0) = f$, $H(\cdot, 1) = g$; $X$ and $Y$ are
**homotopy equivalent** if there are $f : X \to Y$, $g : Y \to X$ with
$g f \simeq \mathrm{id}_X$ and $f g \simeq \mathrm{id}_Y$. Then
$\pi_1(X, x_0)$ is the set of homotopy classes, rel endpoints, of loops at
$x_0$, with concatenation as the group law, and $\pi_n(X, x_0)$ replaces the
loop by a map $(S^n, \ast) \to (X, x_0)$ and is abelian for $n \ge 2$.

For homology, let $\Delta^n$ be the standard $n$-simplex, a **singular
$n$-simplex** a continuous $\sigma : \Delta^n \to X$, and $C_n(X)$ the free
abelian group on these. The boundary map

$$
\partial_n \sigma \;=\; \sum_{i=0}^{n} (-1)^i \, \sigma \big|_{[v_0, \dots,
\hat v_i, \dots, v_n]}
$$

satisfies $\partial_n \circ \partial_{n+1} = 0$, and

$$
H_n(X) \;=\; \ker \partial_n \big/ \operatorname{im} \partial_{n+1}.
$$

Four properties pin the theory down: homotopy invariance
($f \simeq g \Rightarrow f_* = g_*$), the long exact sequence of a pair,
excision, and the value on a point. The Eilenberg–Steenrod axioms say these
determine $H_n$ on CW complexes, which is why simplicial, cellular and singular
homology agree where all three are defined. Cohomology $H^n(X; R)$ is
contravariant, and $H^*(X; R) = \bigoplus_n H^n(X; R)$ is a graded ring under
cup product.

The central theorem: a homotopy equivalence induces isomorphisms on every
$\pi_n$ and every $H_n$. Homeomorphism implies homotopy equivalence, so the
contrapositive — differing invariants imply no homeomorphism — is the tool.

## Assumptions and requirements

$\pi_1$ depends on a basepoint. For path-connected $X$ the groups at different
basepoints are isomorphic, but the isomorphism depends on a path class and is
canonical only up to conjugation — an ambiguity that is real whenever $\pi_1$ is
non-abelian. Homology has no basepoint and no such problem.

Covering space theory needs $X$ path-connected, locally path-connected and
semi-locally simply connected before a universal cover exists; drop the last
condition and the Galois-style correspondence between covers and subgroups of
$\pi_1$ fails. Van Kampen needs an open cover by path-connected sets containing
the basepoint with path-connected intersections, and excision needs the closure
of the excised set inside the interior of the larger one.

Singular homology is defined for every space and computable for almost none:
$C_n(X)$ is free on an uncountable set, so computation needs a CW or simplicial
structure, or Mayer–Vietoris. And every invariant here is a homotopy invariant,
so none can see what a homotopy equivalence destroys: dimension, smooth
structure, metric, curvature.

## Uses and applicability

Reach for algebraic topology when the question is whether something must or
cannot exist and is invariant under deformation: fixed points of continuous
maps, zeros of vector fields, whether a knot is trivial (via the knot group),
classification of surfaces, obstructions to extending a map over a complex.
The covering-space dictionary runs the other way too, proving group-theoretic
results such as Nielsen–Schreier topologically, and persistent homology applies
the same functors to filtered complexes built from data.

Do not reach for it when the distinction you care about is not homotopy
invariant. It will not separate $\mathbb{R}^2$ from $\mathbb{R}^3$ — both are
contractible, and that separation needs the local homology
$H_n(X, X \setminus \{x\})$ — and it will not tell you whether two homeomorphic
manifolds are diffeomorphic.

## Limitations and common mistakes

The mistake that matters is reading the implication backwards. The theorem is
_homeomorphic $\Rightarrow$ isomorphic invariants_; the converse is false in
every direction, and the counterexamples are not exotic.

- The Poincaré homology sphere has exactly the homology of $S^3$ but
  $\pi_1$ of order $120$, so homology alone does not even determine the
  fundamental group.
- $S^2 \times \mathbb{RP}^3$ and $\mathbb{RP}^2 \times S^3$ have isomorphic
  homotopy groups in every degree — both are covered by $S^2 \times S^3$ — yet
  different homology, so they are not homotopy equivalent.
- $\mathbb{CP}^2$ and $S^2 \vee S^4$ have the same homology groups and are
  distinguished only by the cup product, which is nontrivial on the first and
  trivial on the second.

Three further traps. $\pi_1$ need not be abelian: for a wedge of two circles it
is free of rank two, and $H_1$ is its abelianisation, not a second copy of it.
Homology does not simply count holes, because torsion is not a hole count —
$H_1(\mathbb{RP}^2) = \mathbb{Z}/2$. And homotopy groups are not "the same thing
but for $n > 1$": $\pi_n(S^k)$ for $n > k$ is genuinely hard, $\pi_3(S^2) =
\mathbb{Z}$ is already a surprise, and the homotopy groups of spheres are not
known in general — an open problem, not a gap in this page.

## Variants and alternatives

Homotopy groups are finer in one precise sense, and harder in every other. The
sense is Whitehead's theorem: a _map_ of connected CW complexes inducing
isomorphisms on all $\pi_n$ is a homotopy equivalence, whereas a map inducing
isomorphisms on all $H_n$ need not be. What that does _not_ say is that abstract
isomorphism of homotopy groups determines homology — $S^2 \times \mathbb{RP}^3$
and $\mathbb{RP}^2 \times S^3$ above agree in every $\pi_n$ and differ in
homology, and neither family of invariants refines the other as bare groups. The
hardness is that homotopy groups satisfy no excision and no Mayer–Vietoris,
which is precisely why homology, though coarser in Whitehead's sense, is the
workhorse. Cohomology with its cup product is finer than homology as a
graded ring. Dropping the dimension axiom from Eilenberg–Steenrod gives the
**generalized (extraordinary) theories** — topological $K$-theory, cobordism,
stable homotopy — which settle problems ordinary homology cannot, at a steep
cost in computability. Among ordinary theories, simplicial, cellular, singular,
Čech and de Rham cohomology are different constructions agreeing under suitable
hypotheses; de Rham needs a smooth manifold and real coefficients but computes
by integrating differential forms. The genuinely different competitors are
[Differential Topology](./differential-topology.md), with Morse theory and
transversality, and geometric group theory, which studies groups through the
spaces they act on.

## History and attribution

The prehistory is a run of invariants found before anyone knew what an invariant
was: Euler's polyhedron formula $V - E + F = 2$ in the 1750s, Listing's coinage
of _Topologie_ in 1847, Riemann's connectivity numbers, Betti's numbers in the
1870s. Poincaré's _Analysis Situs_ of 1895 and its supplements made this a
subject, introducing the fundamental group and homology to distinguish
manifolds; his own discovery that a manifold could have the homology of the
sphere without being the sphere forced the question that became the Poincaré
conjecture.

The subject was then rebuilt in algebraic language: Betti numbers and torsion
coefficients recast as abelian groups around 1930, homology axiomatised by
Eilenberg and Steenrod in 1945 (the axioms) and 1952 (_Foundations of Algebraic
Topology_), with "algebraic topology" having already displaced "combinatorial
topology" over the preceding decade, following Lefschetz, who used the phrase in
print in 1936 and titled his 1942 Colloquium volume with it. The
frontmatter records that this paragraph rests on no cited source.

## Sources

Hatcher's _Algebraic Topology_ is the standard modern reference and covers
essentially every claim above: $\pi_1(S^1)$ by lifting, the no-retraction and
Brouwer arguments that follow, singular homology, the hypotheses on covering
spaces and van Kampen, and the counterexamples. May's _Concise Course_ is the
compressed, categorical account — good for the axiomatic view of homology and
for covering spaces and fibrations stated generally enough that the pattern
shows, and bad as a first exposure. MIT 18.905 works the computations for
singular homology, CW complexes and cohomology. MacTutor supplies the
nineteenth-century lineage from Euler to Poincaré.

## Prerequisites and next connections

Read [Point-Set Topology](./point-set-topology.md) first — homotopy, covering
maps and CW complexes are defined in its language — and
[Group Theory](./group-theory.md) alongside it, since the answers are groups.
[Complex Analysis](./complex-analysis.md) is not required, but the winding
number in the argument principle is the $\pi_1(S^1) \cong \mathbb{Z}$
computation in another costume.

What it opens up: [Homological Algebra](./homological-algebra.md), the
chain-complex machinery extracted from homology and then applied to modules,
groups and sheaves; and [Category Theory](./category-theory.md), whose basic
vocabulary was invented to state what "natural" means for these invariants.
