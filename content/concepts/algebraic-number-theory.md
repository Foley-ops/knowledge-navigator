---
concept_id: concept.number_theory.algebraic_number_theory
title: Algebraic Number Theory
slug: /concepts/algebraic-number-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The arithmetic of finite extensions of the rationals, where factorisation of numbers into primes breaks down and factorisation of ideals into prime ideals replaces it, with the class group measuring exactly how much was lost.
categories:
  - Mathematics/Number Theory
primary_category: Mathematics/Number Theory
relationships:
  - type: requires
    target: concept.algebra.ring_theory
    note: The whole subject is written in ideals, quotient rings, Noetherian conditions and integral closure, and none of its statements parse without them.
  - type: requires
    target: concept.algebra.field_theory
    note: A number field is by definition a finite extension of Q, so degree, minimal polynomials and embeddings into C are the vocabulary the definitions are stated in.
  - type: generalizes
    target: concept.number_theory.elementary_number_theory
    note: Divisibility, primes and congruences in Z are the degree-one case, and the theory keeps their statements while replacing elements by ideals to keep them true.
  - type: contrasts_with
    target: concept.number_theory.analytic_number_theory
    note: Both attack primes, one by algebraic structure in a fixed field and the other by complex analysis and averages, and they meet in the analytic class number formula.
sources:
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.stacks_project.browse
    title: The Stacks Project
    url: https://stacks.math.columbia.edu/browse
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Modularity of semistable elliptic curves over Q
    reason: The machinery Wiles and Taylor actually used — Galois representations, deformation rings, modular forms and level-lowering — is described here only at the level of what it is not, because no registered source covers it and no page in this corpus explains it.
    sections:
      - limitations-and-common-mistakes
      - history-and-attribution
claims: []
---

## Definition

**Algebraic number theory** studies number fields and their rings of integers. A
_number field_ $K$ is a field containing $\mathbb{Q}$ with
$n = [K : \mathbb{Q}]$ finite; its _ring of integers_ $\mathcal{O}_K$ is the set
of $\alpha \in K$ satisfying a monic polynomial with coefficients in
$\mathbb{Z}$. Everything else measures how far $\mathcal{O}_K$ is from behaving
like $\mathbb{Z}$, through three invariants: the **class group**, the **unit
group**, and the **ramification** of rational primes.

The structural theorem to carry away: elements of $\mathcal{O}_K$ need not factor
uniquely into irreducibles, but nonzero _ideals_ of $\mathcal{O}_K$ always factor
uniquely into prime ideals.

## Why it matters

Diophantine questions force you out of $\mathbb{Z}$ whether you like it or not.
To study $x^2 + y^2 = p$ you factor $p = (x+iy)(x-iy)$ in $\mathbb{Z}[i]$; to
attack $x^p + y^p = z^p$ you factor the left side as
$\prod_{i=0}^{p-1}(x + \zeta_p^i y)$ in $\mathbb{Z}[\zeta_p]$; Pell's equation
$x^2 - dy^2 = 1$ asks for units of norm $1$ in a real quadratic field. Each
argument then wants to say "the factors are coprime, so each is a $p$-th power" —
which is unique factorisation, and it is false in most of these rings. Algebraic
number theory makes such arguments legal by saying what is true instead and how
large the correction is. The same apparatus turns the question of which primes
split in $K$ into a reciprocity law.

## Intuition

Move a rational prime into a larger ring and one of three things happens: it
breaks into distinct factors, it stays whole, or it becomes a repeated factor. In
$\mathbb{Z}[i]$, $5 = (2+i)(2-i)$ splits, $7$ stays prime, and
$2 = -i\,(1+i)^2$ ramifies. Ordinary primes were never atoms; they were compounds
that $\mathbb{Z}$ was too small to resolve.

Kummer's picture is worth keeping. When $2$ and $1 + \sqrt{-5}$ have no common
factor but plainly behave as though they do, you postulate the missing divisor as
an _ideal number_. Dedekind's move was to identify that divisor with the set of
things it divides — the ideal $(2, 1+\sqrt{-5})$. The analogy has a limit: the
missing divisor is not an element of some larger subring of $K$ you forgot to
include, since $\mathcal{O}_K$ is already maximal. It becomes an actual element
in a suitable larger field — canonically the Hilbert class field, where by the
principal ideal theorem _every_ ideal of $\mathcal{O}_K$ becomes principal at
once — and that is a theorem of class field theory rather than a restatement of
the definition.

## Concrete example

In $\mathcal{O}_K = \mathbb{Z}[\sqrt{-5}]$, where $K = \mathbb{Q}(\sqrt{-5})$,

$$
6 \;=\; 2 \cdot 3 \;=\; (1 + \sqrt{-5})(1 - \sqrt{-5}).
$$

The norm $N(a + b\sqrt{-5}) = a^2 + 5b^2$ is multiplicative and integer-valued,
so units are exactly the elements of norm $1$: $\mathcal{O}_K^{\times} = \{\pm 1\}$.
Nothing has norm $2$ or $3$, because $|b| \ge 1$ already forces $N \ge 5$:

```python
# N(a + b*sqrt(-5)) = a^2 + 5*b^2, so |b| >= 1 gives N >= 5
# and this finite range settles which small norms occur.
norms = {a * a + 5 * b * b for a in range(-3, 4) for b in range(-3, 4)}
assert 2 not in norms and 3 not in norms  # 2 and 3 are irreducible
assert 6 in norms                         # N(1 + sqrt(-5)) = 6
```

So $2$, $3$ (norms $4$ and $9$) and $1 \pm \sqrt{-5}$ (norm $6$) are irreducible,
and no two are associates because associates share a norm. Unique factorisation
fails. Now factor ideals instead, with $\mathfrak{p}_2 = (2, 1+\sqrt{-5})$,
$\mathfrak{p}_3 = (3, 1+\sqrt{-5})$, $\bar{\mathfrak{p}}_3 = (3, 1-\sqrt{-5})$:

$$
(2) = \mathfrak{p}_2^{\,2}, \quad (3) = \mathfrak{p}_3 \bar{\mathfrak{p}}_3,
\quad (1+\sqrt{-5}) = \mathfrak{p}_2 \mathfrak{p}_3,
\quad (1-\sqrt{-5}) = \mathfrak{p}_2 \bar{\mathfrak{p}}_3 .
$$

Both routes give $(6) = \mathfrak{p}_2^{\,2}\mathfrak{p}_3\bar{\mathfrak{p}}_3$:
the two factorisations were two ways of pairing up four prime ideals.
$\mathfrak{p}_2$ is not principal — a generator would have norm $2$ — but
$\mathfrak{p}_2^{\,2}$ is, so $\mathrm{Cl}_K = \mathbb{Z}/2\mathbb{Z}$ and
$h_K = 2$. Since $(5) = (\sqrt{-5})^2$ as well, the ramified primes are $2$ and
$5$, the divisors of the discriminant $d_K = -20$.

## Formal treatment

$\mathcal{O}_K$ is a free $\mathbb{Z}$-module of rank $n$, and it is a **Dedekind
domain**: Noetherian, integrally closed in $K$, and of dimension one (every
nonzero prime is maximal). Unique factorisation of ideals is equivalent to those
three conditions, so it is a fact about the shape of the ring rather than a
coincidence of number fields.

Nonzero fractional ideals form a free abelian group $I_K$ on the primes. Modulo
the principal ones $P_K$,

$$
\mathrm{Cl}_K \;=\; I_K / P_K, \qquad h_K = |\mathrm{Cl}_K| < \infty .
$$

For a Dedekind domain, $h_K = 1 \iff \mathcal{O}_K$ is a principal ideal domain
$\iff$ it is a unique factorisation domain; the second equivalence is special to
dimension one.

**Dirichlet's unit theorem.** With $r_1$ real embeddings and $r_2$ conjugate
pairs of complex embeddings, $r_1 + 2r_2 = n$, the unit group is

$$
\mathcal{O}_K^{\times} \;\cong\; \mu_K \times \mathbb{Z}^{\,r_1 + r_2 - 1},
$$

$\mu_K$ being the finite group of roots of unity in $K$. For
$\mathbb{Q}(\sqrt{-5})$ the rank is $0$; for $\mathbb{Q}(\sqrt{2})$ it is $1$,
generated by $1 + \sqrt{2}$, which is why Pell solutions form an infinite tower of
powers of one unit.

**Ramification.** For a rational prime $p$,

$$
p\,\mathcal{O}_K = \prod_{i=1}^{g} \mathfrak{p}_i^{\,e_i}, \qquad
f_i = [\mathcal{O}_K/\mathfrak{p}_i : \mathbb{F}_p], \qquad
\sum_{i=1}^{g} e_i f_i = n .
$$

$p$ ramifies if some $e_i > 1$, is inert if $g = 1$ and $e_1 = 1$, and splits if
$g > 1$ with every $e_i = 1$. Exactly the primes dividing $d_K$ ramify, so only
finitely many do, and when $K/\mathbb{Q}$ is Galois the group permutes the
$\mathfrak{p}_i$ transitively, giving $efg = n$. Finiteness of $h_K$ comes from
the geometry of numbers: $\mathcal{O}_K$ embeds as a full lattice in
$\mathbb{R}^{r_1} \times \mathbb{C}^{r_2}$, and Minkowski's convex body theorem
puts an ideal of norm at most
$\left(\tfrac{4}{\pi}\right)^{r_2}\tfrac{n!}{n^n}\sqrt{|d_K|}$ in every class —
which is also the standard algorithm for computing a class group.

## Assumptions and requirements

Unique factorisation of ideals needs the _full_ ring of integers. The order
$\mathbb{Z}[\sqrt{-3}]$ is not integrally closed, since $(1+\sqrt{-3})/2$ is a
root of $x^2 - x + 1$, and the theorem fails there; the right ring is
$\mathbb{Z}[(1+\sqrt{-3})/2]$. Check which ring you are in before quoting
anything above.

Finiteness of the degree matters as much. In the ring of _all_ algebraic
integers every $\alpha$ factors as $\sqrt{\alpha}\cdot\sqrt{\alpha}$, so there are
no irreducible elements at all and the ring is not Noetherian.

Both the class number and the unit theorem consume the same input: that
$\mathcal{O}_K$ sits as a discrete lattice of finite covolume under the
archimedean embeddings. That is why the function-field analogue has to be
restated rather than copied — over $\mathbb{F}_q(t)$ there are no archimedean
places, and the corresponding finiteness is proved by different means.

## Uses and applicability

Reach for it when a Diophantine problem factors in a ring larger than
$\mathbb{Z}$, when you need the behaviour of primes in an extension, or when the
question is really about units: Pell's equation, Mordell equations
$y^2 = x^3 + k$, representability of primes by binary quadratic forms. It is the
home of reciprocity — quadratic reciprocity is the splitting law for quadratic
fields, Kronecker–Weber puts every abelian extension of $\mathbb{Q}$ inside a
cyclotomic field, and class field theory generalises both.

It is load-bearing outside pure mathematics too. The number field sieve, the
fastest known general factoring algorithm, works in the order
$\mathbb{Z}[\alpha]$ generated by a root of an auxiliary polynomial, which need
not be the full ring of integers, and has to defeat the obstructions coming from
non-maximality, the class group and the units — handled in practice by adjoining
quadratic character columns to the matrix rather than by computing those
invariants; the
ring variants of lattice cryptography are built on cyclotomic rings of integers,
where the extra structure supplies both the speed and the attack surface.

Do not reach for it to count primes or estimate densities. That is analytic
number theory's work, and the subjects meet only at specific bridges such as the
analytic class number formula and Chebotarev's density theorem.

## Limitations and common mistakes

The first mistake is writing $\mathcal{O}_K = \mathbb{Z}[\alpha]$ by reflex. For
$K = \mathbb{Q}(\sqrt{d})$ with $d \equiv 1 \pmod 4$ the ring of integers is
$\mathbb{Z}[(1+\sqrt{d})/2]$, strictly larger than $\mathbb{Z}[\sqrt{d}]$, and
some fields are not monogenic at all: Dedekind exhibited a cubic field, generated
by a root of $x^3 - x^2 - 2x - 8$, whose ring of integers is $\mathbb{Z}[\alpha]$
for no $\alpha$.

The second is conflating irreducible with prime. In $\mathbb{Z}[\sqrt{-5}]$, $2$
is irreducible but not prime: it divides $(1+\sqrt{-5})(1-\sqrt{-5}) = 6$ and
neither factor. Primality moved to the ideals and did not stay with the elements.

The third is expecting $h_K = 1$ to be typical. Exactly nine imaginary quadratic
fields have class number one, $d = -1, -2, -3, -7, -11, -19, -43, -67, -163$,
conjectured by Gauss and settled only in the 1950s and 1960s; whether infinitely
many _real_ quadratic fields have class number one is open.

The fourth concerns Fermat's Last Theorem, where the folklore errs in both
directions. The naive argument factors $x^p + y^p$ in $\mathbb{Z}[\zeta_p]$ and
concludes each factor is a $p$-th power, which needs unique factorisation; that
holds for small $p$ and fails from $p = 23$ on. Kummer's repair was real and
large — he proved the theorem for all _regular_ primes, those $p$ not dividing
$h(\mathbb{Q}(\zeta_p))$, covering every prime under $100$ except $37$, $59$ and
$67$. It was never completed and cannot be by that route: it is still unknown
whether infinitely many regular primes exist, while infinitely many irregular
primes are known to. Wiles did not finish Kummer's argument. He proved modularity
of semistable elliptic curves over $\mathbb{Q}$, which with Frey's curve and
Ribet's level-lowering theorem yields Fermat as a corollary — different machinery,
approached from a different direction.

## Variants and alternatives

**Local fields** trade the global picture for one prime at a time: complete at
$\mathfrak{p}$, work in a discrete valuation ring where everything is easy, and
recombine through local-global principles, with adeles and ideles as the
systematic packaging. **Class field theory** describes the abelian extensions of
$K$ by ray class groups, and stops there; the non-abelian case is the Langlands
programme and is not settled. **Iwasawa theory** follows class numbers up towers
$\mathbb{Q}(\zeta_{p^n})$ and turns Kummer's cyclotomic phenomena into $p$-adic
statements. **Function fields**, finite extensions of $\mathbb{F}_q(t)$, satisfy
the same Dedekind axioms with class groups replaced by Picard groups, buying
geometric tools at the cost of the archimedean places. **Arithmetic geometry**
goes the other way, treating $\mathrm{Spec}\,\mathcal{O}_K$ as a curve-like space
and elliptic curves over $K$ as the objects of interest. Historically,
Kronecker's divisor theory and Dedekind's ideals were rival formalisations of the
same repair, and valuation theory is a third.

## History and attribution

Gauss supplied the prototypes: composition of binary quadratic forms in the
_Disquisitiones Arithmeticae_ (1801) is the class group before the name, and his
1832 work on biquadratic reciprocity introduced the Gaussian integers. The
subject proper begins in the 1840s with Kummer's ideal numbers, developed mainly
in pursuit of higher reciprocity laws rather than of Fermat's equation. The
standard account has Lamé announcing a proof of Fermat's Last Theorem in 1847 on
the assumption of unique factorisation in $\mathbb{Z}[\zeta_p]$, Liouville
doubting that step at once, and Kummer already knowing it to be false. Dirichlet
proved the unit theorem in the 1840s. Dedekind replaced ideal numbers by ideals
as sets in his 1871 supplement to Dirichlet's _Vorlesungen über Zahlentheorie_,
giving the definitions still used; Kronecker developed an equivalent divisor
theory independently. Minkowski's geometry of numbers came in the 1890s,
Hilbert's _Zahlbericht_ synthesised the field in 1897, and Hensel's $p$-adic
numbers followed. Takagi and Artin built class field theory in the 1920s. Wiles
announced his proof in 1993; a gap was found, and the completed proof, with
Richard Taylor as coauthor of the supplementary argument, appeared in 1995.

## Sources

MIT 18.702, which follows Artin's _Algebra_, is the closest match: its quadratic
number fields material covers algebraic integers, ideal multiplication,
factorisation of ideals, prime ideals versus prime integers and the computation of
class groups, including the $\mathbb{Z}[\sqrt{-5}]$ example above. The Stacks
Project is the reference for the commutative algebra underneath — Dedekind
domains, discrete valuation rings, integral closure — in the generality where the
equivalences actually live. MathWorld is used for standard statements at
reference level: the unit theorem, class numbers, regular primes. MacTutor
supplies the history, including the biographies of Kummer and Dedekind and the
account of Fermat's Last Theorem.

## Prerequisites and next connections

Read [Ring Theory](./ring-theory.md) first — ideals, quotients, Noetherian rings
and unique factorisation domains appear in every sentence — and
[Field Theory](./field-theory.md) for what a finite extension of $\mathbb{Q}$ is.
[Elementary Number Theory](./elementary-number-theory.md) is the ground floor:
this subject exists to keep its theorems true in larger rings.

Next, [Galois Theory](./galois-theory.md) turns the splitting of primes into
group theory via decomposition groups and Frobenius elements, the gateway to
class field theory, and [Algebraic Geometry](./algebraic-geometry.md) supplies
the other half of the modern view, in which $\mathrm{Spec}\,\mathcal{O}_K$ and a
curve over a finite field are two instances of one object. Analytic number theory
studies the same primes with complex analysis; the analytic class number formula
is where the two accounts of $h_K$ must agree.
