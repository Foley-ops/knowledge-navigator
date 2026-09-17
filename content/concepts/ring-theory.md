---
concept_id: concept.algebra.ring_theory
title: Ring Theory
slug: /concepts/ring-theory
kind: concept
tier: 1
review_state: generated-draft
summary: Ring theory studies sets carrying a compatible addition and multiplication — integers, polynomials, matrices and functions at once — together with the ideals that let you take quotients, so one argument serves every object satisfying the axioms.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.algebra.group_theory
    note: The additive structure of a ring is an abelian group, and ideals, quotient rings and the isomorphism theorems are the group-theoretic machinery of normal subgroups carried over verbatim.
  - type: generalizes
    target: concept.algebra.field_theory
    note: A field is exactly a commutative ring with 1 ≠ 0 in which every nonzero element is invertible, so field theory is ring theory with the strongest possible divisibility hypothesis.
  - type: contributes_to
    target: concept.algebra.homological_algebra
    note: Homological algebra takes modules over a fixed ring as its objects, and Ext and Tor are invariants computed from that ring's structure.
  - type: contributes_to
    target: concept.algebra.galois_theory
    note: Galois theory builds its field extensions as quotients of polynomial rings by maximal ideals, so the construction K[x]/(f) is a ring-theoretic input to it.
sources:
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathlib.community
    title: Lean mathlib community documentation
    url: https://leanprover-community.github.io/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **ring** is a set $R$ carrying two binary operations, addition and
multiplication, such that $(R, +)$ is an abelian group with identity $0$,
multiplication is associative, and both distributive laws hold:
$a(b+c) = ab + ac$ and $(b+c)a = ba + ca$ for all $a, b, c \in R$.

Whether multiplication is also required to have an identity $1$ is a
**convention, not a mathematical fact**. Most contemporary algebra texts, and
formal libraries such as Lean's mathlib, build $1$ into the definition and give
the structure without it a separate name — _rng_, or _non-unital ring_. An older
tradition, still standard in parts of functional analysis and in work on radical
theory, does not. Neither camp is wrong; a text simply has to say which it means,
and a theorem quoted across the boundary can be false. **This page assumes
$1 \in R$.** Commutativity is not part of the general definition, though
commutative-algebra and algebraic-geometry texts routinely adopt "ring means
commutative ring with $1$" as a blanket convention. A ring in which
$ab = ba$ always is a _commutative ring_, and $n \times n$
[matrices](./matrix-theory.md) over a field are the standard ring that is not.

## Why it matters

Ring theory is what lets one proof serve many objects. The division algorithm,
greatest common divisors, the Chinese remainder theorem and unique factorisation
were discovered for the integers; stated for a ring, the same arguments apply
unchanged to polynomials $k[x]$ over a field and to Gaussian integers
$\mathbb{Z}[i]$. Knowing that $k[x]$ is a principal ideal domain gives the
structure theorem for finitely generated modules over it, and out of that fall
the rational and Jordan canonical forms of a matrix, with no new work.

The second payoff is quotienting. Ideals are the sub-objects you are allowed to
collapse, and collapsing is how new rings get built: $\mathbb{Z}/n\mathbb{Z}$,
finite fields $\mathbb{F}_q$, the complex numbers as
$\mathbb{R}[x]/(x^2+1)$, and every coordinate ring in algebraic geometry.

## Intuition

Carry two pictures. The first is **number-like**: a ring is arithmetic with
addition, subtraction and multiplication, but no guaranteed division.
$\mathbb{Z}$ is the model, and much ring-theoretic vocabulary — prime,
irreducible, unit, divides — is imported from it.

The second is **function-like**: $R$ is a ring of functions on a space, and an
ideal is the set of functions vanishing on some subset. This is why ideals absorb
multiplication: if $f$ vanishes on $Z$, so does $gf$ for any $g$ at all. It is
also why the quotient $R/I$ feels like "restricting attention to $Z$".

Both analogies break. Unlike $\mathbb{Z}$, a general ring has **zero divisors**
— nonzero $a, b$ with $ab = 0$ — so you cannot cancel; multiplication may not
commute; and factorisation into irreducibles may exist but not be unique, or may
fail to terminate at all.

## Concrete example

Take $R = \mathbb{Z}/6\mathbb{Z} = \{0,1,2,3,4,5\}$ with arithmetic mod $6$.
Here $2 \cdot 3 = 0$ although neither factor is $0$: $2$ and $3$ are zero
divisors, so $R$ is not an integral domain. Its units — elements with a
multiplicative inverse — are $1$ and $5$, exactly the residues coprime to $6$.
Its ideals are $(0)$, $(2) = \{0,2,4\}$, $(3) = \{0,3\}$ and $(1) = R$, one for
each positive divisor of $6$, and $R/(2) \cong \mathbb{Z}/2\mathbb{Z}$.

Now take $\mathbb{Z}/5\mathbb{Z}$. Every nonzero element is invertible
($2 \cdot 3 = 1$, $4 \cdot 4 = 1$), so it is a field. In general
$\mathbb{Z}/n\mathbb{Z}$ is a field if and only if $n$ is prime, and for
$n \geq 2$ it is an integral domain under exactly the same condition — because
every finite integral domain is a field.

Unique factorisation can fail. In $\mathbb{Z}[\sqrt{-5}]$,

$$
6 \;=\; 2 \cdot 3 \;=\; (1 + \sqrt{-5})(1 - \sqrt{-5}).
$$

Use the multiplicative norm $N(a + b\sqrt{-5}) = a^2 + 5b^2$. Then $N(2) = 4$,
$N(3) = 9$ and $N(1 \pm \sqrt{-5}) = 6$. A proper factorisation of $2$ would need
an element of norm $2$, and $a^2 + 5b^2 = 2$ has no integer solution; norm $3$ is
likewise unattainable, which rules out proper factorisations of $3$ and of
$1 \pm \sqrt{-5}$. All four are therefore irreducible, and since $N(u) = 1$
forces $u = \pm 1$, no two differ by a unit: the two factorisations are genuinely
different. Note also that $2$ is irreducible but not prime, since it divides $6$
and neither factor on the right.

## Formal treatment

Let $R$ be a ring with $1$. A subset $I \subseteq R$ is a **two-sided ideal** if
$(I,+)$ is a subgroup and $rx \in I$, $xr \in I$ for all $r \in R$, $x \in I$.
Absorption is exactly what makes multiplication on cosets well defined:

$$
(a + I)(b + I) \;=\; ab + aI + Ib + II \;\subseteq\; ab + I ,
$$

so the **quotient ring** $R/I$ with $(a+I)+(b+I) = (a+b)+I$ and
$(a+I)(b+I) = ab + I$ is a ring. Ideals are precisely the kernels of ring
homomorphisms, and the first isomorphism theorem says
$R/\ker \varphi \cong \operatorname{im} \varphi$ for any homomorphism
$\varphi : R \to S$. In a noncommutative ring one must distinguish left, right
and two-sided ideals; only two-sided ideals give quotient rings.

For commutative $R$, a proper ideal $P$ is **prime** iff $ab \in P$ implies
$a \in P$ or $b \in P$, and **maximal** iff no proper ideal strictly contains it.
The two classifications are exactly the two quotient conditions:

$$
R/P \text{ is an integral domain} \iff P \text{ is prime},
\qquad
R/M \text{ is a field} \iff M \text{ is maximal}.
$$

Since every field is a domain, maximal implies prime. An **integral domain** is a
commutative ring with $1 \neq 0$ and no zero divisors; it embeds in its field of
fractions. The chain of specialisations is strict at every step:

$$
\text{fields} \subsetneq \text{Euclidean domains} \subsetneq \text{PIDs}
\subsetneq \text{UFDs} \subsetneq \text{domains} \subsetneq \text{commutative rings}.
$$

Witnesses: $\mathbb{Z}$ is Euclidean but not a field; $\mathbb{Z}[(1+\sqrt{-19})/2]$
is a principal ideal domain that is not Euclidean; $k[x,y]$ is a unique
factorisation domain in which the ideal $(x,y)$ is not principal;
$\mathbb{Z}[\sqrt{-5}]$ is a domain that is not a UFD; $\mathbb{Z}/6\mathbb{Z}$
is a commutative ring that is not a domain.

## Assumptions and requirements

The unital convention is load-bearing. Krull's theorem — every proper ideal lies
inside a maximal one — is proved by Zorn's lemma applied to a chain whose union
is proper _because_ it misses $1$; drop the identity and the statement fails.
Modules are also normally required to satisfy $1 \cdot m = m$.

Commutativity is assumed by most of the prime/maximal machinery above. In a
noncommutative ring, "prime ideal" is redefined in terms of products of ideals
rather than of elements, and the correspondence with domains does not survive
in the naive form.

"No zero divisors" is what buys cancellation: $ab = ac$ with $a \neq 0$ implies
$b = c$ only in a domain. The field of fractions construction needs a domain for
the same reason.

Existence of factorisations into irreducibles is guaranteed by an ascending chain
condition on principal ideals (ACCP) — Noetherian rings have it, general domains
do not — so "every element factors" is a hypothesis, not a consequence of being a
domain. ACCP is sufficient but not necessary: Grams constructed in 1974 an atomic
domain failing it. _Uniqueness_ needs strictly more: irreducible elements must be
prime.

## Uses and applicability

Reach for ring theory whenever two operations interact and you want to reason
about divisibility, congruence or quotients. Algebraic number theory recovers
unique factorisation at the level of ideals once it fails for elements — the
origin of the ideal class group. Algebraic geometry turns commutative rings and
their prime ideals into geometric spaces. Coding theory realises cyclic codes as
ideals of $\mathbb{F}_q[x]/(x^n - 1)$; cryptography lives in
$\mathbb{Z}/n\mathbb{Z}$ for RSA and in polynomial rings modulo $q$ for
lattice-based schemes; computer algebra uses Gröbner bases to decide ideal
membership in $k[x_1,\dots,x_n]$.

Do not reach for it when there is only one operation — group or monoid territory
— when multiplication is not associative, as in Lie algebras, or when additive
inverses are absent, as in $\mathbb{N}$ and tropical arithmetic, which are
semirings.

## Limitations and common mistakes

Assuming the unital convention silently is the commonest error. Under it, a
subring must contain the _same_ $1$, so $2\mathbb{Z}$ is an ideal of
$\mathbb{Z}$ but not a subring of it; under the non-unital convention it is both.
Similarly, a ring homomorphism is usually required to send $1$ to $1$, which
rules out the additive-and-multiplicative map
$\mathbb{Z} \to \mathbb{Z} \times \mathbb{Z}$, $n \mapsto (n, 0)$. Formal
libraries are useful here precisely because they cannot be vague: mathlib keeps
`Ring`, `NonUnitalRing` and `CommRing` as separate classes.

Second: **irreducible does not mean prime**. They coincide in a UFD, and the
$\mathbb{Z}[\sqrt{-5}]$ example above shows that they part company in a general
domain. Much of the nineteenth-century literature on Fermat's Last Theorem went
wrong on exactly this point.

Third: you cannot quotient by an arbitrary subring, only by an ideal — the
absorption property is what makes the multiplication well defined. And the
product $IJ$ of two ideals is the set of _finite sums_ $\sum x_i y_i$, not the
set of products $xy$, which is generally not closed under addition.

Fourth: the notation $\mathbb{Z}/n\mathbb{Z}$ hides which structure is meant. As
an additive group it is cyclic for every $n$; as a ring it is a field only for
prime $n$, and otherwise has zero divisors.

## Variants and alternatives

Weakening the axioms gives **rngs** (no $1$), **semirings** (no additive
inverses; $\mathbb{N}$ and the tropical semiring), and **near-rings** (only one
distributive law). Strengthening them gives **commutative rings**, **integral
domains**, **division rings** such as the quaternions $\mathbb{H}$, and
**fields**. Orthogonal refinements describe shape rather than strength:
**Noetherian** and **Artinian** chain conditions, **local** rings with a unique
maximal ideal, and **graded** rings.

Standard constructions supply the named variants people actually meet: polynomial
rings $R[x]$, matrix rings $M_n(R)$, group rings $R[G]$, power series and
localisations. A genuinely different framing is the **module** — study what $R$
acts on rather than $R$ itself, generalising
[vector spaces](./vector-spaces.md) from fields to arbitrary rings.
[Category theory](./category-theory.md) offers another, treating rings as monoid
objects and attending to homomorphisms rather than elements. Boolean rings are an
instructive borderline case: they are equivalent to Boolean algebras, so the same
objects yield to either ring-theoretic or lattice-theoretic tools.

## History and attribution

The subject grew out of a failure. Kummer, working on Fermat's Last Theorem in
the 1840s, found that unique factorisation breaks down in rings of cyclotomic
integers and patched it with "ideal numbers". Dedekind, in the 1870s, replaced
those with actual sets — **ideals** — and proved that factorisation into prime
ideals is unique in rings of algebraic integers. The word _Zahlring_ is Hilbert's,
from his work on algebraic number fields in the 1890s.

The abstract axiomatic treatment came later: Fraenkel gave an early
axiomatisation in 1914, and Emmy Noether's 1921 paper _Idealtheorie in
Ringbereichen_ established the chain-condition viewpoint that still organises
commutative algebra. Van der Waerden's _Moderne Algebra_ (1930–31) fixed much of
the modern presentation. The unital-versus-non-unital split dates from this
period and has never been resolved.

## Sources

**MIT 18.701 Algebra I** covers the group theory a reader needs first and
introduces rings through the integer and polynomial examples that drive the
intuition. **MIT 18.702 Algebra II** is the closer match: ideals, quotient rings,
factorisation, Euclidean domains and quadratic number rings, including the
failure of unique factorisation, then on into fields. **Wolfram MathWorld** is
the fastest place to check a definition and is explicit that the identity axiom
varies by author. **Lean mathlib** shows the same hierarchy formalised, where
every convention must be committed to by name.

## Prerequisites and next connections

Understand groups first: a ring is an abelian group with extra structure, and
ideals, quotients and the isomorphism theorems are the normal-subgroup story told
again. Familiarity with [vector spaces](./vector-spaces.md) helps too, since
modules are the ring-level analogue.

From here, fields are the next specialisation, and quotients of polynomial rings
by maximal ideals are how field extensions get built — which is where Galois
theory starts. Modules open into homological algebra, prime ideals into algebraic
geometry. For concrete landing points, [matrix theory](./matrix-theory.md)
supplies the canonical noncommutative ring and
[complex analysis](./complex-analysis.md) a natural commutative one: the
holomorphic functions on a domain, an integral domain that is neither Noetherian
nor a UFD.
