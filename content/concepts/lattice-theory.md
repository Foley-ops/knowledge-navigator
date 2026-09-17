---
concept_id: concept.algebra.lattice_theory
title: Lattice Theory
slug: /concepts/lattice-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The algebra of partial orders in which any two elements have a greatest lower bound and a least upper bound, giving one vocabulary for intersection and union, gcd and lcm, conjunction and disjunction, and the fixed points that program analyses compute.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.algebra.order_theory
    note: A lattice is a partially ordered set with extra existence hypotheses, so partial orders, upper bounds and monotone maps have to be in hand before any of this parses.
  - type: specializes
    target: concept.foundations.category_theory
    note: A poset is a category with at most one arrow between any two objects, and under that reading meets and joins are limits and colimits and Galois connections are adjunctions.
  - type: contributes_to
    target: concept.logic.propositional_logic
    note: The Lindenbaum–Tarski algebra of classical propositional logic is a Boolean algebra, so lattice theory supplies the algebraic semantics of the connectives.
  - type: contributes_to
    target: concept.algebra.group_theory
    note: The subgroups of a group form a complete lattice, and the modular law was abstracted from the behaviour of that lattice for normal subgroups and modules.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nlab.category_theory
    title: 'nLab: category theory'
    url: https://ncatlab.org/nlab/show/category+theory
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathlib.community
    title: Lean mathlib community documentation
    url: https://leanprover-community.github.io/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.plato.set_theory
    title: 'Stanford Encyclopedia of Philosophy: Set Theory'
    url: https://plato.stanford.edu/entries/set-theory/
    source_kind: authoritative-secondary
    supports:
      - concrete-example
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **lattice** is a partially ordered set $(L, \le)$ in which every pair of
elements $x, y$ has a least upper bound $x \vee y$ (the **join**) and a greatest
lower bound $x \wedge y$ (the **meet**). **Lattice theory** studies these
structures and the maps between them.

There is a second, purely algebraic definition: a set $L$ with two binary
operations $\wedge$ and $\vee$, each idempotent, commutative and associative,
linked by the **absorption laws**

$$
x \wedge (x \vee y) = x, \qquad x \vee (x \wedge y) = x .
$$

The two definitions describe the same objects: given the operations, set
$x \le y$ exactly when $x \wedge y = x$, and absorption makes that a partial
order whose meets and joins are the operations you started with.

A warning that belongs here rather than in a footnote: in number theory,
cryptography and physics, _lattice_ means a discrete subgroup of $\mathbb{R}^n$,
such as $\mathbb{Z}^n$. Lattice-based cryptography, lattice reduction and lattice
gauge theory all concern that object, which has no meets or joins of its own.

## Why it matters

Meet and join are what "greatest common" and "least common" have in common.
Intersection and union, gcd and lcm, conjunction and disjunction, the largest
subgroup inside two subgroups and the smallest containing both, infimum and
supremum — one construction in six costumes, and lattice theory holds its shared
theorems.

The payoff a researcher hits most often is fixed points. Once a domain is known
to be a _complete_ lattice and an operator on it monotone, a least fixed point
exists, with no continuity or finiteness assumption at all. That one theorem is
the engine under dataflow analysis, abstract interpretation, the semantics of
recursive definitions, and the usual proof of Cantor–Schröder–Bernstein.

## Intuition

Draw the Hasse diagram — points for elements, an edge upward from $x$ to a
$y > x$ with nothing between. To join $x$ and $y$, walk upward from both and stop
at the _lowest_ common point; to meet them, walk down. A lattice is a diagram in
which both searches always succeed.

The honest analogy is divisibility: meet is gcd, join is lcm. It breaks in two
places. Divisibility on positive integers is distributive and most lattices are
not; and the picture suggests a top and a bottom, which a lattice need not have —
$\mathbb{Z}$ under $\le$ is a lattice with $\min$ and $\max$ and no extremes. A
lattice knows nothing of size or distance, only which pairs are comparable.

## Concrete example

Take the divisors of $30$, ordered by divisibility:
$\{1, 2, 3, 5, 6, 10, 15, 30\}$, with $x \wedge y = \gcd(x, y)$ and
$x \vee y = \operatorname{lcm}(x, y)$. The bottom is $1$, the top is $30$, and
$n \mapsto 30/n$ is a complement, since $\gcd(n, 30/n) = 1$ and
$\operatorname{lcm}(n, 30/n) = 30$. It is isomorphic to the power set of
$\{2, 3, 5\}$ under $\subseteq$ — the eight-element Boolean algebra.
Distributivity on one case:
$\gcd(6, \operatorname{lcm}(10,15)) = \gcd(6,30) = 6$, and
$\operatorname{lcm}(\gcd(6,10), \gcd(6,15)) = \operatorname{lcm}(2,3) = 6$.

Now a lattice that fails. Let $M_3$ have a bottom $0$, a top $1$ and three
pairwise incomparable elements $a, b, c$ between. Then
$a \wedge (b \vee c) = a \wedge 1 = a$, while
$(a \wedge b) \vee (a \wedge c) = 0 \vee 0 = 0$. This is no curiosity: $M_3$ is
the subgroup lattice of the Klein four-group
$\mathbb{Z}/2 \times \mathbb{Z}/2$, whose three order-two subgroups are pairwise
incomparable. $M_3$ is still modular; the pentagon $N_5$ — a chain
$0 < a < b < 1$ plus one $c$ incomparable to both — is not, since with $a \le b$,
$$a \vee (c \wedge b) = a \vee 0 = a \ne b = 1 \wedge b = (a \vee c) \wedge b .$$

## Formal treatment

Write $\bigvee S$ and $\bigwedge S$ for the supremum and infimum of $S \subseteq L$
when they exist. Pairwise meets and joins extend by induction to all _finite_
non-empty subsets, and no further.

- $L$ is **bounded** if it has a least element $0$ and a greatest element $1$.
- $L$ is **distributive** if $x \wedge (y \vee z) = (x \wedge y) \vee (x \wedge z)$
  for all $x,y,z \in L$; in a lattice this law implies its dual.
- $L$ is **modular** if $x \le z$ implies
  $x \vee (y \wedge z) = (x \vee y) \wedge z$. Distributive implies modular;
  $M_3$ shows the converse fails. Dedekind's criterion: modular iff no sublattice
  is isomorphic to $N_5$ (Dedekind, 1900); Birkhoff's: distributive iff none is
  isomorphic to $N_5$ or $M_3$ (Birkhoff, 1934).
- A **Boolean algebra** is a bounded distributive lattice in which every $x$ has
  a complement $\neg x$ with $x \wedge \neg x = 0$ and $x \vee \neg x = 1$;
  distributivity forces that complement to be unique.
- $L$ is **complete** if $\bigvee S$ and $\bigwedge S$ exist for _every_ subset,
  including $\emptyset$, whence $\bigvee \emptyset = 0$ and
  $\bigwedge \emptyset = 1$. All suprema force all infima, since $\bigwedge S$ is
  the supremum of the lower bounds of $S$.

The central theorem is **Knaster–Tarski**: if $L$ is complete and $f : L \to L$
is monotone, the fixed points of $f$ form a complete lattice, and the least of
them is

$$
\operatorname{lfp}(f) = \bigwedge \{x \in L : f(x) \le x\} .
$$

A **Galois connection** between complete lattices $L$ and $M$ is a pair of
monotone maps $\alpha : L \to M$, $\gamma : M \to L$ with
$\alpha(x) \le y \iff x \le \gamma(y)$, making $\gamma \circ \alpha$ a closure
operator on $L$. That is the frame of abstract interpretation — $L$ the concrete
semantics, $M$ the abstract domain — and, after reversing the order on one side,
the shape of the correspondence between subgroups and subfields in Galois
theory. That correspondence is itself antitone, larger subgroups fixing smaller
fields: it is the original and eponymous case of the antitone variant
$x \le \gamma(y) \iff y \le \alpha(x)$, in which both maps reverse order.

## Assumptions and requirements

Finite meets and joins come free from the binary ones; infinite ones do not.
Completeness is an extra hypothesis, and it fails in ordinary examples:
$\mathbb{Q}$ under $\le$ is a lattice and the finite-and-cofinite subsets of
$\mathbb{N}$ form a bounded Boolean algebra, yet neither is complete.

Knaster–Tarski needs completeness and monotonicity and nothing else — not
continuity, not finite height. Extra hypotheses buy _computability_ of the fixed
point: Kleene iteration, $\operatorname{lfp}(f) = \bigvee_n f^n(0)$, requires $f$
to preserve suprema of ascending chains, and a merely monotone $f$ may have to be
iterated through the ordinals. A dataflow analysis terminates because its domain
also satisfies the ascending chain condition; drop that and you need a widening
operator to force convergence.

Distributivity is an assumption, not a fact. It holds for sets and divisors and
fails for subgroups of a group and for closed subspaces of a
[Hilbert space](./hilbert-spaces.md), which form an orthomodular lattice — the
technical content of "quantum logic". Formalisations keep the layers apart
deliberately: mathlib gives `Lattice`, `DistribLattice`, `IsModularLattice`,
`BooleanAlgebra` and `CompleteLattice` separate definitions because each
assumption is independently droppable.

## Uses and applicability

Reach for lattice theory when objects are ordered by _information_ or
_containment_ and you need a canonical best approximation from one side. Static
program analysis is the flagship case: the abstract domain is a complete lattice
ordered by precision, transfer functions are monotone, and the result is a least
fixed point. Logic is the other: Boolean algebras are the algebraic semantics of
classical [propositional logic](./propositional-logic.md), Heyting algebras that
of intuitionistic logic, and a $\sigma$-algebra in
[measure theory](./measure-theory.md) is a Boolean algebra closed under countable
operations. Lattices also order security labels, subtyping hierarchies, and
state-based CRDTs, where a join-semilattice makes replica merges idempotent and
insensitive to arrival order.

Do not reach for it when the structure of interest is metric, linear or
probabilistic. Lattice order records no magnitudes, so "how far apart" and "how
much more likely" cannot be asked of it.

## Limitations and common mistakes

The name collision does real damage, and $\mathbb{Z}^n$ being an order lattice
under the componentwise order makes it worse rather than better: that is a
coincidence of the product order, not a fact about discrete subgroups.

Three technical errors recur. Assuming a lattice is distributive, or that
complements exist and are unique, when neither is given. Confusing _bounded_ with
_complete_: a $0$ and a $1$ say nothing about arbitrary suprema. And confusing a
monotone map with a lattice homomorphism, when a monotone map need not satisfy
$f(x \vee y) = f(x) \vee f(y)$.

The last trap is computational. "The least fixed point exists" and "iterating
from the bottom reaches it" have different hypotheses; an analysis built on the
first while assuming the second silently fails to terminate on a domain of
infinite height.

## Variants and alternatives

**Semilattices** keep one operation, the right weakening when only merges matter.
**Modular** and **distributive** lattices and **Boolean algebras** form a tower
of increasing strength; **orthomodular** lattices branch off it, weakening
distributivity while keeping an orthocomplement, and Boolean algebras are
exactly the distributive ones. **Heyting algebras** drop excluded middle and are
the lattice-theoretic face of intuitionistic logic; **frames** carry point-free
topology; **residuated lattices** serve substructural logics. Scott's **directed-complete partial
orders** are the standard alternative in denotational semantics: they demand only
directed suprema, enough for recursion and available where completeness is not.
In program analysis the different competitors are constraint- and SMT-based
formulations and type-and-effect systems, which trade the fixed-point machinery
for a solver.

## History and attribution

The subject has two independent origins. Boole's algebra of logic (1847, 1854),
developed by Peirce and Schröder, produced the axioms of what we now call Boolean
algebra. Separately, Dedekind, studying modules and ideals in the 1890s,
introduced _Dualgruppen_ and found the modular law. The strands were unified and
named in the 1930s, chiefly by Garrett Birkhoff, whose _Lattice Theory_ (1940)
defined the field; Øystein Ore developed the same objects as "structures".
Stone's representation theorem (1936) showed every Boolean algebra is an algebra
of sets; Birkhoff and von Neumann's "The logic of quantum mechanics" (1936)
proposed the non-distributive lattice of subspaces as a logic. Tarski's fixed
point theorem appeared in 1955, generalising a result he obtained with Knaster in 1928. Computational uses came later: Kildall on dataflow analysis (1973), Scott's
domain theory, and Cousot and Cousot's abstract interpretation (1977).

## Sources

MathWorld is the quickest reliable check on the definitions and the standard
counterexamples — the axioms, the distributive and modular laws, $M_3$ and $N_5$,
and a separate entry for the unrelated point-lattice sense. The nLab's category
theory material gives the structural reading: posets as thin categories, meets
and joins as limits and colimits, adjunctions, frames and locales. The mathlib
documentation is useful in a way a textbook is not, because the order hierarchy
is formalised there and the hypotheses separating semilattice from lattice from
complete lattice are machine-checked. The Stanford Encyclopedia set theory entry
covers the power-set background.

## Prerequisites and next connections

Read about partial orders first: this page is unreadable without upper bounds,
lower bounds and monotone maps, and order theory is where those live.
[Set theory](./set-theory.md) is assumed throughout, since power sets are the
motivating complete Boolean algebra.

Three directions open from here.
[Propositional logic](./propositional-logic.md) becomes algebra once you see the
Lindenbaum–Tarski construction. [Category theory](./category-theory.md) recovers
all of the above as the thin case, the cheapest place to build intuition about
limits, colimits and adjoints. And
[computability theory](./computability-theory.md) meets lattices at the
fixed-point theorems, where the same monotone-operator argument generates an
inductively defined set.
