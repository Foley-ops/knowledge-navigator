---
concept_id: concept.algebra.octonions
title: Octonions
slug: /concepts/octonions
aliases:
  - Cayley numbers
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The eight-dimensional real algebra in which division still works but multiplication no longer associates, and the last algebra of its kind that Hurwitz's theorem permits.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.algebra.quaternions
    note: The octonions are literally built as a pair of quaternions with a twisted product, and the eight-dimensional multiplication table is only readable as seven interlocking copies of the quaternion table.
  - type: contrasts_with
    target: concept.algebra.clifford_algebra
    note: Both answer the question of what algebra a quadratic form generates, but a Clifford algebra keeps associativity and, beyond the two smallest negative-definite cases (which are just $\mathbb{C}$ and $\mathbb{H}$), gives up division, while the octonions keep division and give up associativity.
  - type: contributes_to
    target: concept.algebra.lie_algebras
    note: The derivations of the octonions form the exceptional Lie algebra g2, and the other four exceptional simple Lie algebras are all built from octonionic data, so this algebra is what makes the exceptional series a construction rather than a list.
  - type: contrasts_with
    target: concept.algebra.ring_theory
    note: Ring theory takes an associative multiplication as an axiom, so the octonions sit outside it and none of the module, ideal or matrix-representation machinery transfers unchanged.
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
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hatcher.algebraic_topology
    title: Allen Hatcher, Algebraic Topology
    url: https://pi.math.cornell.edu/~hatcher/AT/ATpage.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: Octonionic constructions of the exceptional Lie groups, the Albert algebra and the Freudenthal-Tits magic square
    reason: The registry holds no source on exceptional Lie groups, Jordan algebras or octonionic geometry (Baez's survey "The Octonions" or Springer and Veldkamp would be the natural citations), so the statements about G2, F4, the Cayley plane and the magic square are uncited here.
    sections:
      - why-it-matters
      - uses-and-applicability
  - label: Octonions in supersymmetry and superstring theory
    reason: No registry source covers mathematical physics, so the correspondence between the four normed division algebras and the spacetime dimensions 3, 4, 6 and 10 is reported qualitatively and should be checked before being relied on.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

The **octonions** $\mathbb{O}$ are the eight-dimensional real algebra spanned by
$1, e_1, \dots, e_7$, with an $\mathbb{R}$-bilinear multiplication that has a
two-sided identity, admits an inverse for every nonzero element, and satisfies

$$
N(xy) = N(x)\,N(y), \qquad N(x) = x_0^2 + x_1^2 + \cdots + x_7^2 .
$$

An algebra with those properties is a **normed division algebra**. The octonions
are not commutative and, unlike the quaternions, not associative — but they are
_alternative_: any two elements generate an associative subalgebra, so
$x(xy) = (xx)y$ and $(yx)x = y(xx)$ hold identically while $(xy)z = x(yz)$ does
not.

## Why it matters

They matter first for what they close off. Hurwitz's theorem says the reals, the
complex numbers, the quaternions and the octonions are the _only_ normed division
algebras over $\mathbb{R}$, so anything needing multiplication, division and a
length that multiplies has exactly four choices of raw material. That is why the
dimensions $1, 2, 4, 8$ keep reappearing where no algebra is visible — the
parallelizable spheres, the Hopf fibrations.

They matter second for what they build. The five exceptional simple Lie algebras
$\mathfrak{g}_2, \mathfrak{f}_4, \mathfrak{e}_6, \mathfrak{e}_7, \mathfrak{e}_8$
are not an arbitrary supplement to the classical series: every one is
constructible from octonionic data, starting with $\mathfrak{g}_2 =
\operatorname{Der}(\mathbb{O})$, the $14$-dimensional derivation algebra of
$\mathbb{O}$.

## Intuition

Carry the doubling picture. Each step from $\mathbb{R}$ to $\mathbb{C}$ to
$\mathbb{H}$ to $\mathbb{O}$ doubles the dimension and charges a law at the gate:
ordering, then commutativity, then associativity. One more step costs division
itself. The tolls are theorems about the construction, not a poetic pattern.

The second picture is the Fano plane. The seven imaginary units $e_1, \dots, e_7$
are the points of the smallest projective plane, and its seven lines are seven
triples each multiplying exactly like $i, j, k$ in the quaternions. The octonion
table is quaternions seven times over, glued along shared points, and the gluing
is where associativity dies: three units on a common line associate, three units
off one do not.

Keep the analogy honest: "loses associativity" sounds like a matter of watching
your brackets, and it is not — associativity is what lets an algebra be
represented by matrices and what makes invertible elements a group.

## Concrete example

Fix the labelling $e_i e_{i+1} = e_{i+3}$ with indices read modulo $7$ in
$\{1,\dots,7\}$, each $e_i^2 = -1$, and each triple cyclic and anticommuting.
The seven lines are then

$$
(1,2,4),\;(2,3,5),\;(3,4,6),\;(4,5,7),\;(5,6,1),\;(6,7,2),\;(7,1,3),
$$

meaning, for the first, $e_1e_2 = e_4$, $e_2e_4 = e_1$, $e_4e_1 = e_2$, and the
reverses with a minus sign.

The units $e_1, e_2, e_3$ lie on no common line, and on them associativity fails:

$$
(e_1 e_2) e_3 = e_4 e_3 = -e_6, \qquad
e_1 (e_2 e_3) = e_1 e_5 = +e_6 .
$$

The two bracketings differ by $2e_6$, as far apart as unit octonions get. Swap
the first two arguments and the associator flips sign,
$(e_2e_1)e_3 - e_2(e_1e_3) = +2e_6$: it is an alternating trilinear map.

The norm still multiplies. Take $x = 1 + e_1$ and $y = e_2 + e_4$; using
$e_1e_2 = e_4$ and $e_1e_4 = -e_2$,

$$
xy = e_2 + e_4 + e_4 - e_2 = 2e_4 ,
$$

and indeed $N(x)N(y) = 2 \cdot 2 = 4 = N(2e_4)$, even though the product
collapsed onto a single axis.

## Formal treatment

Write $\bar{x} = x_0 - \sum_{i=1}^{7} x_i e_i$. Then $N(x) = x\bar{x} = \bar{x}x$
is positive definite, every nonzero $x$ has the two-sided inverse
$x^{-1} = \bar{x}/N(x)$, and every octonion satisfies $x^2 - 2x_0 x + N(x) = 0$.

The **Cayley–Dickson construction** produces the chain. Given a real algebra $A$
with a conjugation, define a product on $A \oplus A$ by

$$
(a,b)(c,d) = \bigl(ac - \bar{d}b,\; da + b\bar{c}\bigr), \qquad
\overline{(a,b)} = (\bar{a}, -b),
$$

where conventions for the twist differ between texts. Under this one
$\mathbb{O} = \mathbb{H} \oplus \mathbb{H}$, and the tolls are exact:

- $A \oplus A$ is commutative iff $A$ is commutative with trivial conjugation;
- $A \oplus A$ is associative iff $A$ is commutative and associative;
- $A \oplus A$ has a multiplicative norm iff $A$ is associative.

So $\mathbb{H}$ is associative because $\mathbb{C}$ is commutative, $\mathbb{O}$
is normed because $\mathbb{H}$ is associative, and the next algebra is not normed
because $\mathbb{O}$ is not associative. In code:

```python
def conj(x):
    if len(x) == 1: return x
    n = len(x) // 2
    return conj(x[:n]) + tuple(-t for t in x[n:])

def mul(x, y):
    if len(x) == 1: return (x[0] * y[0],)
    n = len(x) // 2
    a, b, c, d = x[:n], x[n:], y[:n], y[n:]
    re = tuple(p - q for p, q in zip(mul(a, c), mul(conj(d), b)))
    im = tuple(p + q for p, q in zip(mul(d, a), mul(b, conj(c))))
    return re + im
```

On random $8$-tuples `mul` satisfies $N(xy) = N(x)N(y)$; on $16$-tuples it does
not.

Alternativity is equivalent to the associator $[x,y,z] = (xy)z - x(yz)$ being
alternating, and by **Artin's theorem** to every two-generated subalgebra being
associative. The **Moufang identities**, of which $(xy)(zx) = x(yz)x$ is one,
leave enough associativity for an expression like $xyx$ to be unambiguous.

**Hurwitz's theorem.** A finite-dimensional unital real algebra carrying a
positive-definite quadratic form with $N(xy) = N(x)N(y)$ has dimension $1, 2, 4$
or $8$ and is isomorphic to $\mathbb{R}, \mathbb{C}, \mathbb{H}$ or
$\mathbb{O}$. Dropping "normed" does not extend the dimensions: a topological
argument shows $\mathbb{R}^n$ carries _any_ bilinear division structure only for
$n = 1, 2, 4, 8$, the dimensions in which $S^{n-1}$ is parallelizable.

## Assumptions and requirements

Everything above assumes the ground field is $\mathbb{R}$ and the norm form is
positive definite. Drop definiteness and you get the **split octonions**, still
eight-dimensional with a multiplicative norm but of signature $(4,4)$, so some
nonzero $x$ has $N(x) = 0$: a composition algebra with zero divisors, not a
division algebra. Over other fields of characteristic $\neq 2$, composition
algebras still have dimension $1, 2, 4$ or $8$, but an eight-dimensional one
divides only if its norm form has no nontrivial zero. Finite dimensionality and a
unit are both hypotheses of Hurwitz's theorem.

Alternativity, not associativity, licenses ordinary manipulation: inverses are
two-sided, powers are well defined, and any computation touching at most two
independent octonions may be done as if in $\mathbb{H}$. Once a third enters,
bracketing matters and the identities a first algebra course builds rings and
modules on stop applying.

## Uses and applicability

Reach for the octonions when the object you study is exceptional and you want a
reason for it. $G_2$ is the automorphism group of $\mathbb{O}$; $F_4$ is the
automorphism group of the $27$-dimensional Albert algebra of $3 \times 3$
Hermitian octonionic matrices; the remaining exceptional groups come out of the
Freudenthal–Tits magic square, whose input is a pair of division algebras. The
Cayley plane $\mathbb{OP}^2$ exists and $\mathbb{OP}^n$ for $n \ge 3$ does not,
because Desargues' theorem needs associativity. The Hopf fibration
$S^{15} \to S^8$ and the parallelizability of $S^7$ are topological shadows of
the same algebra. In physics, the four normed division algebras line up with the
spacetime dimensions $3, 4, 6, 10$ of certain supersymmetric theories.

Do not reach for them in computation. Rotations use quaternions because composing
rotations is multiplying, and that fails here: left multiplication $L_u$ by a
unit octonion is an orthogonal map of $\mathbb{R}^8$, but $L_{uv} \neq L_u L_v$.
For geometry in arbitrary dimension, Clifford and geometric algebra are the
working tools.

## Limitations and common mistakes

The most common mistake is treating nonassociativity as bookkeeping. Three
consequences follow at once: no faithful representation of $\mathbb{O}$ by
matrices over any field exists, since matrix multiplication is associative; the
unit octonions form $S^7$, closed under multiplication and inverses and still not
a group (it is a Moufang loop); and there is no octonion determinant or
characteristic polynomial inherited from a matrix model.

The second mistake is reading "alternative" as "associative enough". It buys
two-generated subalgebras and nothing more; three unit imaginaries off a common
Fano line already disagree by a full $2e_6$.

The third is expecting the pattern to continue. The Cayley–Dickson algebras of
dimension $16, 32, \dots$ are power-associative and flexible but neither
alternative nor division algebras: in the sedenions
$(e_1 + e_{10})(e_5 + e_{14}) = 0$, in the basis the doubling formula above
induces. Finally, claims that octonions explain the Standard Model or see wide
engineering use are not established; what they demonstrably explain is the
exceptional Lie groups.

## Variants and alternatives

**Split octonions** trade definiteness for zero divisors and are conveniently
written as Zorn vector matrices; **octonion algebras over other fields** are the
general eight-dimensional composition algebras; **sedenions** continue the
doubling past the point where it is useful. Genuinely different neighbours:
**Clifford algebras** keep associativity in every dimension and, from three
generators up, always acquire zero divisors (the only real ones that are
division algebras are $\mathbb{R}$, $\mathrm{Cl}_{0,1}(\mathbb{R}) \cong
\mathbb{C}$ and $\mathrm{Cl}_{0,2}(\mathbb{R}) \cong \mathbb{H}$), and **Jordan
algebras** — the Albert algebra is the exceptional one — drop associativity in
the other direction, keeping commutativity. Drop the norm
and the unit entirely and real division algebras of dimension $2, 4$ and $8$
exist in large non-isomorphic families, so the short list is a consequence of
demanding a multiplicative norm.

## History and attribution

Hamilton found the quaternions in October 1843. Within weeks his correspondent
John T. Graves described an eight-dimensional system he called the octaves, in a
letter of December 1843; Arthur Cayley found the same algebra independently and
published first, in 1845, which is why they are still called Cayley numbers.

The classification came later and in pieces. Frobenius showed in 1878 that the
only finite-dimensional _associative_ real division algebras are $\mathbb{R}$,
$\mathbb{C}$ and $\mathbb{H}$. Hurwitz, in 1898, was asking when a product of two
sums of squares is again a sum of squares; his answer — only for $1, 2, 4, 8$
squares — is the normed division algebra theorem. Ruth Moufang came from
geometry in the 1930s, studying projective planes whose coordinates need not
associate, and her identities and loops came out of that work. The identification
of $G_2$ with $\operatorname{Aut}(\mathbb{O})$ is usually credited to Élie
Cartan; the topological form of the $1, 2, 4, 8$ theorem was settled around
1958–1960 by Bott and Milnor, by Kervaire, and by Adams' Hopf invariant one
theorem.

## Sources

Wolfram MathWorld is the quickest reliable check on the multiplication table, the
Cayley–Dickson formula, Hurwitz's theorem and the Graves–Cayley priority story.
Hatcher's _Algebraic Topology_ has the topological form of the $1, 2, 4, 8$
theorem: division algebra structures on $\mathbb{R}^n$, parallelizable spheres
and Hopf invariant one together. The background assumed here rather than proved
is split between two courses: MIT 18.701 for vector spaces over a field,
bilinear forms and the classical linear groups, MIT 18.702 for the
ring-theoretic half — rings, division rings and modules, the machinery the
octonions fall outside. The
exceptional Lie groups, the Albert algebra and the physics are covered by no
registry source and are flagged in `unresolved_references`.

## Prerequisites and next connections

Read [Quaternions](./quaternions.md) first: the seven-line table makes no sense
without the three-line one. [Complex Numbers](./complex-numbers.md) is the first
step of the same doubling, and [Field Theory](./field-theory.md) fixes what is
being given up.

Afterwards, [Ring Theory](./ring-theory.md) reads as the theory of everything the
octonions are not, and [Lie Algebras](./lie-algebras.md) is the payoff, since
$\mathfrak{g}_2$ and its four exceptional siblings are octonionic in origin.
[Group Theory](./group-theory.md) supplies the contrast that makes $S^7$
interesting: all of a group's elements and inverses, none of its associativity.
