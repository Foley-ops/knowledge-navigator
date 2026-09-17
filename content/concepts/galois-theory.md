---
concept_id: concept.algebra.galois_theory
title: Galois Theory
slug: /concepts/galois-theory
aliases:
  - Galois correspondence
kind: concept
tier: 1
review_state: generated-draft
summary: Galois theory converts questions about polynomial equations into questions about a finite group, by matching the intermediate fields of a normal separable extension one-for-one with the subgroups of its automorphism group.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.algebra.field_theory
    note: The statement is about field extensions, and its hypotheses — normality, separability, splitting fields, degree — are field-theoretic notions a reader must already have.
  - type: requires
    target: concept.algebra.group_theory
    note: The subgroup side of the correspondence is unreadable without subgroups, normal subgroups, quotient groups and solvability.
  - type: contributes_to
    target: concept.algebra.order_theory
    note: The inclusion-reversing bijection between subfields and subgroups is the original example after which order-theoretic Galois connections are named.
  - type: contributes_to
    target: concept.algebra.complex_numbers
    note: The shortest algebraic proof that the complex numbers are algebraically closed is Galois-theoretic, using Sylow subgroups plus one analytic fact about real polynomials.
sources:
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mathlib.community
    title: Lean mathlib community documentation
    url: https://leanprover-community.github.io/
    source_kind: reference-documentation
    supports:
      - formal-treatment
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Galois theory** studies a field extension through its group of symmetries, and
its central result says that for a well-behaved extension that group knows every
intermediate field. Let $L/K$ be a finite extension and $\mathrm{Aut}(L/K)$ the
group of field automorphisms of $L$ fixing $K$ pointwise. The extension is
**Galois** when it is _normal_ — every irreducible polynomial in $K[x]$ with one
root in $L$ splits into linear factors in $L$ — and _separable_ — no such minimal
polynomial has a repeated root. Equivalently, $L/K$ is Galois exactly when
$|\mathrm{Aut}(L/K)| = [L:K]$, and exactly when the only elements of $L$ fixed by
every automorphism lie in $K$. The group is then written $\mathrm{Gal}(L/K)$.

## Why it matters

Before Galois, "can this equation be solved by a formula?" meant an unbounded
search through possible formulas. After Galois it is a question about a finite
group of at most $n!$ elements, which can be written down. That change of
register settles problems that resisted direct attack for centuries: there is no
formula in radicals for the general quintic, the cube cannot be doubled with
ruler and compass, and a regular $n$-gon is constructible for exactly the $n$
Gauss identified. The same move — replace an object by its symmetry group, then
read the object off the group — became the template for covering space theory,
the étale fundamental group and class field theory.

## Intuition

Over $\mathbb{Q}$, nothing algebraic distinguishes $\sqrt{2}$ from $-\sqrt{2}$:
every polynomial identity with rational coefficients satisfied by one is
satisfied by the other. The Galois group is the group of relabellings of the
roots respecting _every_ algebraic relation over the base field. Enlarging the
base field pins down more roots and so destroys symmetry, which is why the
correspondence reverses inclusions: the bigger the intermediate field, the
smaller the subgroup fixing it.

The honest analogy is covering spaces: subgroups of the fundamental group index
intermediate covers exactly as subgroups of the Galois group index intermediate
fields, with deck transformations in the role of automorphisms. The analogy
breaks at separability, which has no topological counterpart, and at
non-normality, where $\mathrm{Aut}(L/K)$ can be far too small to see the
intermediate fields at all.

## Concrete example

Take $f(x) = x^4 - 2$ over $\mathbb{Q}$, with roots $\pm 2^{1/4}$ and $\pm i
2^{1/4}$. Its splitting field is $L = \mathbb{Q}(2^{1/4}, i)$, of degree
$[L:\mathbb{Q}] = 4 \cdot 2 = 8$. Two automorphisms generate the group:

$$
\sigma: 2^{1/4} \mapsto i\,2^{1/4},\; i \mapsto i,
\qquad
\tau: 2^{1/4} \mapsto 2^{1/4},\; i \mapsto -i ,
$$

with $\sigma^4 = \tau^2 = 1$ and $\tau \sigma \tau^{-1} = \sigma^{-1}$, so
$\mathrm{Gal}(L/\mathbb{Q}) \cong D_4$, the dihedral group of order $8$ (here
$\tau$ is complex conjugation). $D_4$ has exactly ten subgroups — the trivial
one, five of order $2$, three of order $4$, and itself — so $L$ has exactly ten
intermediate fields. The three index-$2$ subgroups are normal and give the three
quadratic subfields: $\langle \sigma \rangle$ fixes $\mathbb{Q}(i)$, $\{1,
\sigma^2, \tau, \sigma^2\tau\}$ fixes $\mathbb{Q}(\sqrt{2})$, and $\{1, \sigma^2,
\sigma\tau, \sigma^3\tau\}$ fixes $\mathbb{Q}(i\sqrt{2})$.

The instructive subgroup is $\langle \tau \rangle$, whose fixed field is $L \cap
\mathbb{R} = \mathbb{Q}(2^{1/4})$. Since $\sigma \tau \sigma^{-1} = \sigma^2 \tau
\neq \tau$, it is not normal — and correspondingly
$\mathbb{Q}(2^{1/4})/\mathbb{Q}$ is not a normal extension: it holds the two real
roots of $x^4 - 2$ but neither of the two imaginary ones.

## Formal treatment

Let $L/K$ be a finite Galois extension with $G = \mathrm{Gal}(L/K)$, so $|G| =
[L:K]$. For an intermediate field $K \subseteq F \subseteq L$ write
$\mathrm{Gal}(L/F) \le G$, and for a subgroup $H \le G$ write $L^H = \{x \in L :
\sigma(x) = x \text{ for all } \sigma \in H\}$. The **fundamental theorem of
Galois theory** states that

$$
F \longmapsto \mathrm{Gal}(L/F), \qquad H \longmapsto L^H
$$

are mutually inverse, inclusion-reversing bijections between intermediate fields
and subgroups, with $[L:F] = |\mathrm{Gal}(L/F)|$ and $[F:K] = [G :
\mathrm{Gal}(L/F)]$. Moreover $F/K$ is itself Galois if and only if
$\mathrm{Gal}(L/F)$ is normal in $G$, and then $\mathrm{Gal}(F/K) \cong G /
\mathrm{Gal}(L/F)$. It is an anti-isomorphism of lattices: compositum of fields
matches intersection of subgroups. Artin's lemma gives the converse: if $G$ is
any finite group of automorphisms of $L$ and $K = L^G$, then $L/K$ is Galois with
group $G$.

Call $L/K$ a **radical extension** if there is a tower $K = K_0 \subseteq \cdots
\subseteq K_m = L$ with $K_{j+1} = K_j(\alpha_j)$ and $\alpha_j^{n_j} \in K_j$; a
polynomial is **solvable by radicals** if its splitting field sits inside such a
tower. Galois' criterion, in characteristic $0$: $f$ is solvable by radicals over
$K$ if and only if the Galois group of its splitting field is solvable. For the
_general_ polynomial of degree $n$ — coefficients $a_1,\dots,a_n$ taken as
indeterminates over a field $k$ of characteristic $0$, $K = k(a_1,\dots,a_n)$ —
that group is the full symmetric group $S_n$. Since $A_n$ is simple for $n \ge
5$, $S_n$ is not solvable, and the general equation of degree $\ge 5$ admits no
solution formula built from the coefficients by field operations and $n$-th
roots. This is a statement about formulas, not existence: the roots exist in
$\mathbb{C}$ and can be computed to any precision.

Particular polynomials are caught the same way. $x^5 - 4x + 2$ is irreducible
over $\mathbb{Q}$ by Eisenstein at $2$; its derivative $5x^4 - 4$ shows it has
exactly three real roots, so complex conjugation acts as a transposition, and a
transitive subgroup of $S_5$ containing a transposition and an element of order
$5$ is all of $S_5$. This specific quintic therefore has no radical expression
for its roots. Lean's mathlib carries machine-checked statements of both the
Galois correspondence and the Abel–Ruffini theorem.

## Assumptions and requirements

**Normality** cannot be dropped. For $K = \mathbb{Q}$ and $L =
\mathbb{Q}(2^{1/4})$, the group $\mathrm{Aut}(L/K)$ has order $2$ and so has two
subgroups, but there are three intermediate fields; the maps are no longer
inverse to each other.

**Separability** cannot be dropped either, and failing it is a
characteristic-$p$ phenomenon only. Over $K = \mathbb{F}_p(t)$ take $L =
K(t^{1/p})$: since $x^p - t = (x - t^{1/p})^p$ has one root of multiplicity $p$,
the identity is the only $K$-automorphism of $L$, so $\mathrm{Aut}(L/K)$ is
trivial while $[L:K] = p$. Extensions of perfect fields — characteristic $0$,
finite fields, algebraically closed fields — are separable automatically, which
is why the hypothesis is invisible in a first course.

**Finiteness** matters for the bijection as stated: for an infinite Galois
extension only the subgroups closed in the Krull topology correspond to
intermediate fields. In $\mathrm{Gal}(\overline{\mathbb{F}_p}/\mathbb{F}_p) \cong
\widehat{\mathbb{Z}}$ the subgroup generated by Frobenius is proper and dense,
and its fixed field is already $\mathbb{F}_p$.

The solvability criterion additionally assumes characteristic $0$ (or degrees
prime to the characteristic), since roots of unity and Artin–Schreier extensions
behave differently in characteristic $p$.

## Uses and applicability

Reach for Galois theory when the question is which elements of a field a
restricted construction can reach. Ruler-and-compass constructions land inside
towers of quadratic extensions, so a constructible number has degree a power of
$2$ over $\mathbb{Q}$: doubling the cube needs degree $3$ and is impossible, as
is trisecting a $60^\circ$ angle, while the regular $n$-gon is constructible
exactly when $n$ is a power of two times distinct Fermat primes. In number theory
the group becomes the object of study itself, through Kronecker–Weber and Galois
representations.

It is the wrong tool for finding roots. Computing a Galois group from a given
polynomial is itself real work — resolvents, factorisation patterns modulo
primes, computer algebra — and the theory says nothing about approximation.

## Limitations and common mistakes

The headline misunderstanding is "quintics cannot be solved". Every quintic over
$\mathbb{C}$ has five roots with multiplicity, many are solvable by radicals
($x^5 - 2$ is), and the roots of any quintic can be computed to arbitrary
precision or written in closed form with elliptic modular functions, as Hermite
and Kronecker showed. The theorem forbids a _general formula in radicals_, and
radical expressions for the particular polynomials with non-solvable group.

Other recurring errors: writing $\mathrm{Gal}(L/K)$ for a non-Galois extension,
where $\mathrm{Aut}(L/K)$ is simply too small; expecting every intermediate field
to be Galois over the base, when only those matching normal subgroups are; and
assuming separability is free over an imperfect field. A subtler one: a solvable
group does not promise a usable formula. For an irreducible cubic with three real
roots, the _casus irreducibilis_ theorem says the roots cannot be written in real
radicals at all, so Cardano's formula must pass through complex numbers.

## Variants and alternatives

**Infinite Galois theory** (Krull) restores the bijection for infinite algebraic
extensions by topologising the group as a profinite group and keeping only closed
subgroups. **Grothendieck's Galois theory** recasts it as an equivalence between
finite étale algebras over $K$ and finite continuous $\mathrm{Gal}$-sets, making
field theory and covering space theory the same theorem. **Differential Galois
theory** (Picard–Vessiot) attaches a linear algebraic group to a linear
differential equation and ties solvability in quadratures to solvability of its
identity component. The neighbouring question of which integrals are _elementary_
is settled instead by Liouville's theorem on elementary integrals, which is what
rules out an elementary antiderivative for $e^{-x^2}$. The **inverse Galois
problem** asks which finite groups arise over $\mathbb{Q}$, and is open in
general. Competing routes to the same conclusions
exist: Abel's 1824 argument predates group theory, and Arnold proved insolubility
topologically, via monodromy rather than field automorphisms.

## History and attribution

Lagrange's _Réflexions_ of 1770–71 first studied how expressions in the roots
behave under permutation, which is the seed. Ruffini gave an incomplete argument
in 1799, and Abel proved in 1824 that the general quintic is not solvable by
radicals. Évariste Galois, around 1830–32, supplied what Abel had not: the group
attached to an equation, and the criterion tying solvability by radicals to
solvability of that group. He died in a duel in 1832 at twenty; Liouville
published his manuscripts in 1846. Wantzel settled the ruler-and-compass
questions in 1837. The modern formulation — automorphism groups, fixed fields,
Artin's lemma — is due to Dedekind and Artin, and Krull extended the theory to
infinite extensions in 1928.

## Sources

MIT 18.702 is the backbone: field extensions, splitting fields, the fundamental
theorem and its use on solvability and constructibility, with worked examples of
the kind used above. MIT 18.701 covers the group theory and symmetry viewpoint
the correspondence rests on. Wolfram MathWorld is a quick reference for
surrounding statements and names (Abel's impossibility theorem, constructible
polygons) and for compact historical notes. The Lean mathlib documentation earns
its place differently: its field theory library states the correspondence and
Abel–Ruffini with every hypothesis machine-checked.

## Prerequisites and next connections

Read [Field Theory](./field-theory.md) first — degrees, splitting fields,
normality and separability are the vocabulary of every statement here — and
[Group Theory](./group-theory.md) alongside it, since the correspondence is
worthless to a reader who cannot tell a normal subgroup from a subgroup. A field
extension $L/K$ is in particular a $K$-[vector space](./vector-spaces.md), and
$[L:K]$ is its dimension.

From here, [Category Theory](./category-theory.md) is where the correspondence
stops being a theorem about fields and becomes a pattern: Grothendieck's Galois
categories. [Order Theory](./order-theory.md) abstracts the reversal into Galois
connections, and [Model Theory](./model-theory.md) is the logical descendant,
where automorphism groups index definable sets.
