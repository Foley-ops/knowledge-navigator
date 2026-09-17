---
concept_id: concept.algebra.group_theory
title: Group Theory
slug: /concepts/group-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The algebraic theory of symmetry, which strips a set of transformations down to the bare facts that they compose associatively and can be undone, and gets from that surprisingly strong theorems in return.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: prerequisite_of
    target: concept.algebra.representation_theory
    note: A representation is by definition a homomorphism from a group into the invertible linear maps on a vector space, so the group axioms and homomorphisms must come first.
  - type: contributes_to
    target: concept.algebra.galois_theory
    note: Galois theory converts a question about roots of a polynomial into a question about the subgroup lattice of its automorphism group.
  - type: contributes_to
    target: concept.algebra.ring_theory
    note: A ring is an abelian group under addition, and ideals and quotient rings are the normal-subgroup and quotient machinery transplanted.
  - type: contributes_to
    target: concept.analysis.translation_equivariance
    note: Translations form a group, and equivariance is exactly the statement that a map commutes with that group's action on its input and output.
sources:
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Group theory** is the study of sets carrying a single well-behaved composition
law. A **group** is a set $G$ with a binary operation $G \times G \to G$,
written $(a,b) \mapsto ab$, such that

1. $(ab)c = a(bc)$ for all $a,b,c \in G$ (associativity),
2. there is $e \in G$ with $ea = ae = a$ for all $a$ (identity),
3. each $a \in G$ has some $a^{-1} \in G$ with $aa^{-1} = a^{-1}a = e$ (inverses).

Closure is already contained in the requirement that the operation maps into
$G$. Commutativity is _not_ assumed; a group in which $ab = ba$ always holds is
called **abelian**. The **order** $|G|$ is the number of elements.

## Why it matters

Those three axioms are what remains of the word "symmetry" once you delete
everything except that symmetries can be done one after another and can be
undone. Because so little is assumed, every theorem proved from the axioms
applies at once to permutations of roots, rigid motions of a crystal, invertible
matrices, the integers under addition, and the rotations of a pixel grid.

That reach is why equivariance in machine learning is stated group-theoretically
rather than case by case. A convolutional layer is equivariant to the group of
integer translations; Cohen and Welling's group-equivariant networks get the same
guarantee for the larger wallpaper groups $p4$ (translations plus quarter
rotations) and $p4m$ (adding reflections) by sharing weights over group elements
instead of only over positions. The geometric deep learning programme takes this
further and organises architectures by the symmetry group they respect. Stating
the property once, for an arbitrary group, is what makes those generalisations
mechanical rather than inventive.

## Intuition

Carry a group as a set of transformations of some object, with the object thrown
away and only the composition table kept. "Rotate the square by 90°" and "reflect
it across a diagonal" are things you can do in sequence and undo, and the group
records nothing about the square except which sequences agree.

The analogy is never actually wrong — Cayley's theorem says every group is a
group of permutations of some set — but it can be uninformative, because the set
being permuted may be nothing more than the group itself. For large finite simple
groups the "symmetries of what?" question has no easy answer, and the group is
studied through its subgroups and its actions rather than through a picture.

## Concrete example

Let $D_4$ be the symmetry group of a square: $r$ = rotation by $90°$, $s$ =
reflection across a fixed diagonal. Then $r^4 = s^2 = e$ and $sr = r^{-1}s$, so
the eight elements are $e, r, r^2, r^3, s, rs, r^2s, r^3s$ and every product
reduces by pushing $s$ to the right. The multiplication table (row times column):

|        | $e$    | $r$    | $r^2$  | $r^3$  | $s$    | $rs$   | $r^2s$ | $r^3s$ |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| $e$    | $e$    | $r$    | $r^2$  | $r^3$  | $s$    | $rs$   | $r^2s$ | $r^3s$ |
| $r$    | $r$    | $r^2$  | $r^3$  | $e$    | $rs$   | $r^2s$ | $r^3s$ | $s$    |
| $r^2$  | $r^2$  | $r^3$  | $e$    | $r$    | $r^2s$ | $r^3s$ | $s$    | $rs$   |
| $r^3$  | $r^3$  | $e$    | $r$    | $r^2$  | $r^3s$ | $s$    | $rs$   | $r^2s$ |
| $s$    | $s$    | $r^3s$ | $r^2s$ | $rs$   | $e$    | $r^3$  | $r^2$  | $r$    |
| $rs$   | $rs$   | $s$    | $r^3s$ | $r^2s$ | $r$    | $e$    | $r^3$  | $r^2$  |
| $r^2s$ | $r^2s$ | $rs$   | $s$    | $r^3s$ | $r^2$  | $r$    | $e$    | $r^3$  |
| $r^3s$ | $r^3s$ | $r^2s$ | $rs$   | $s$    | $r^3$  | $r^2$  | $r$    | $e$    |

Every row and every column is a permutation of the eight elements — a Latin
square — which is just the statement that left and right multiplication are
bijections. The table is not symmetric about the diagonal: $rs \neq sr = r^3s$,
so $D_4$ is not abelian.

Now read structure off it. $\langle r \rangle = \{e, r, r^2, r^3\}$ is a subgroup
of order $4$ and index $2$, so it is normal, and $D_4/\langle r \rangle$ has two
elements: "rotation" and "reflection". The subgroup $\{e, s\}$ has order $2$ and
is _not_ normal, since $rsr^{-1} = r^2s \notin \{e,s\}$.

Let $D_4$ act on the four vertices. The action is transitive, so the orbit of a
vertex has size $4$; the stabiliser of a vertex is $\{e, s\}$ where $s$ is the
reflection through the diagonal at that vertex, of order $2$. Orbit–stabiliser
then reads $8 = 4 \times 2$, which is $|G|$ recovered from geometry alone.

## Formal treatment

A **subgroup** $H \leq G$ is a nonempty subset closed under products and
inverses. For $g \in G$ the **left coset** is $gH = \{gh : h \in H\}$. The map
$h \mapsto gh$ is a bijection $H \to gH$, and $g \sim g'$ iff $g^{-1}g' \in H$
is an equivalence relation, so the left cosets partition $G$ into blocks of equal
size $|H|$. Writing $[G:H]$ for the number of blocks gives **Lagrange's
theorem**: for finite $G$,

$$
|G| \;=\; [G:H]\,|H| ,
$$

so $|H|$ divides $|G|$. Applying it to $\langle g \rangle$ shows the order of
every element divides $|G|$, hence $g^{|G|} = e$, and a group of prime order is
cyclic.

**The converse of Lagrange is false.** The alternating group $A_4$ has order
$12$ but no subgroup of order $6$. If $H \leq A_4$ had index $2$ it would be
normal with $A_4/H \cong \mathbb{Z}/2$, so $g^2 \in H$ for every $g$; but every
$3$-cycle $\sigma$ satisfies $\sigma = (\sigma^2)^2$, so all eight $3$-cycles
would lie in $H$, giving $|H| \geq 9$. Partial converses do hold: Cauchy's
theorem gives an element of order $p$ whenever the prime $p$ divides $|G|$, and
the Sylow theorems give subgroups of every prime-power order dividing $|G|$.

A **homomorphism** is $\varphi : G \to H$ with $\varphi(ab) =
\varphi(a)\varphi(b)$. Its kernel $\ker\varphi = \varphi^{-1}(e)$ is a **normal**
subgroup, meaning $gNg^{-1} = N$ for all $g$, and normality is exactly the
condition under which $(aN)(bN) = abN$ is well defined, making the quotient
$G/N$ a group. The **first isomorphism theorem** closes the loop:

$$
G/\ker\varphi \;\cong\; \operatorname{im}\varphi .
$$

A **group action** of $G$ on a set $X$ is a map $G \times X \to X$ with
$e \cdot x = x$ and $(gh)\cdot x = g\cdot(h\cdot x)$ — equivalently, a
homomorphism $G \to \operatorname{Sym}(X)$. With orbit $Gx = \{g \cdot x\}$ and
stabiliser $G_x = \{g : g\cdot x = x\} \leq G$, the map $gG_x \mapsto g \cdot x$
is a well-defined bijection from cosets to the orbit, giving the
**orbit–stabiliser theorem** $|Gx| = [G:G_x]$, and $|G| = |Gx|\,|G_x|$ when $G$
is finite. Taking $X = G$ with $g \cdot x = gx$ recovers Cayley's theorem.

## Assumptions and requirements

Associativity is carrying the weight. Drop it and $g^n$ is ambiguous, inverses
need not be unique, and essentially none of the above survives; what is left is a
quasigroup or loop, with a far thinner theory.

Drop inverses and you have a monoid. Cosets no longer partition and Lagrange has
nothing to say: $(\mathbb{N}, +)$ has submonoids of no particular size.

Lagrange and the counting form of orbit–stabiliser assume $|G| < \infty$. The
bijection $gG_x \leftrightarrow Gx$ holds for infinite groups too, but "divides"
degenerates.

Quotients require normality, not merely subgroup-hood. In $D_4$ with
$H = \{e,s\}$, the products of $rH = \{r, rs\}$ with itself are $r^2, r^2s, s, e$,
which lie in two different cosets — so coset multiplication is not even a
function.

Finally, nothing here assumes commutativity, and a great deal of it would be
trivial if it did.

## Uses and applicability

Reach for group theory whenever the objects of interest are invertible
transformations and you want to know what they preserve. In Galois theory the
solvability of a polynomial by radicals becomes solvability of its Galois group,
which is why the general quintic fails: $S_5$ is not solvable. In crystallography
the possible symmetries of a periodic pattern are classified — 17 wallpaper
groups in the plane, 230 space groups in three dimensions. In cryptography the
underlying object is a cyclic group in which the discrete logarithm is believed
hard; that hardness is a conjecture, not a theorem.

In machine learning, groups supply the vocabulary for equivariance. Cohen and
Welling reported accuracy gains on rotated-MNIST and CIFAR-10 from $p4$/$p4m$
equivariant layers — an empirical result on those benchmarks, not a guarantee
that group structure always helps.

Do not reach for it when the transformations of interest are not invertible.
Coarsening, projection and stochastic maps compose but do not undo; the honest
structure there is a monoid, a semigroup or a category.

## Limitations and common mistakes

The belief that every divisor of $|G|$ is the order of some subgroup is the most
common error, and it feels true because it _is_ true for cyclic groups. $A_4$ is
the standard counterexample.

Normality is not inherited or transitive. In $D_4$, $\{e,s\}$ is normal in
$V = \{e, r^2, s, r^2s\}$ (index $2$) and $V$ is normal in $D_4$ (index $2$), yet
$\{e,s\}$ is not normal in $D_4$. Writing $G/H$ for a non-normal $H$ gives a set
with a $G$-action, never a group.

Order does not determine a group: $\mathbb{Z}/4$ and the Klein four-group both
have order $4$ and are not isomorphic, as one has an element of order $4$ and the
other does not.

Non-commutativity trips up algebra: $(ab)^{-1} = b^{-1}a^{-1}$, with the order
reversed.

In applied settings the usual overstatement is that a network "is equivariant".
Exact equivariance holds for the discrete group that actually acts on the
sampling grid; arbitrary rotations of a pixel image are not a group action on
that grid, and boundary handling and downsampling break the property further. How
much exact symmetry is worth enforcing, versus learning approximate invariance
from augmented data, is not settled.

## Variants and alternatives

**Abelian groups** are classified when finitely generated, into cyclic factors.
**Finite simple groups** — the composition factors, the pieces every finite
group breaks into along a composition series — were classified by a
decades-long collaborative effort whose last major gap, the quasithin case, was
closed in the 2000s. **Lie groups** carry a compatible smooth structure, which
lets differentiation replace enumeration and produces Lie algebras as their
linearisation. **Representation theory** trades the abstract group for matrices
acting on a vector space, buying linear-algebraic tools at the cost of losing
whatever the representation forgets.

Weaker structures buy generality and lose theorems: monoids and semigroups drop
inverses, groupoids allow composition to be only partially defined, and a group
is exactly a groupoid with one object. In applied symmetry work, the alternatives
to building a group into the architecture are data augmentation, which is cheap
and only approximate, and canonicalisation, which maps each input to a
representative of its orbit and buys invariance at the price of a possibly
discontinuous choice.

## History and attribution

The idea has several strands. Lagrange studied permutations of the roots of a
polynomial around 1770–71, and Ruffini and Abel established that the general
quintic is not solvable by radicals. Galois, around 1830–32, introduced _groupe_
for a collection of permutations closed under composition and used it to say
exactly which equations are solvable; his manuscripts were published by Liouville
in 1846. Cauchy developed permutation groups systematically in the 1840s, and
Cayley gave an abstract definition for finite groups in 1854. Jordan's _Traité
des substitutions et des équations algébriques_ (1870) was the first full
treatise, and Klein's Erlangen programme (1872) reframed geometry itself as the
study of invariants of a transformation group. The axioms in their modern form,
covering infinite groups, settled late in the nineteenth century with von Dyck
and Weber.

## Sources

MIT 18.701 is the natural first course: it develops the axioms, subgroups,
cosets, Lagrange, homomorphisms and quotients, and group actions with
orbit–stabiliser, with symmetry groups of plane figures as running examples; it
is also where the discrete groups of plane motions behind the 17 wallpaper
groups are treated. MIT 18.702 continues into Galois theory and representation
theory, and is where the solvability criterion behind the quintic is actually
proved. Neither course reaches the 230 three-dimensional space groups or the
discrete-logarithm assumption, so both are stated above without a cited source
and should be read as **unverified** here. _Group Equivariant
Convolutional Networks_ is the paper that made $p4$ and $p4m$ equivariance a
practical architecture and is the concrete link to machine learning. _Geometric
Deep Learning_ is the broader survey that organises architectures by the symmetry
group they respect.

## Prerequisites and next connections

You need very little first: functions, bijections and composition, which
[Set Theory](./set-theory.md) treats carefully, and enough
[Matrix Theory](./matrix-theory.md) to recognise that invertible matrices under
multiplication are the standard infinite example.

From here, representation theory turns groups into matrices and is the shortest
route to using them computationally; Galois theory is the historical payoff; ring
theory reuses the quotient construction with ideals in place of normal subgroups.
Within this corpus, [Translation Equivariance](./translation-equivariance.md) is
the group-theoretic property that a
[Convolutional Layer](./convolutional-layer.md) realises, and
[Category Theory](./category-theory.md) is where the observation that a group is
a one-object groupoid leads.
