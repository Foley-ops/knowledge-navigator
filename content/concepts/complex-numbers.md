---
concept_id: concept.algebra.complex_numbers
title: Complex Numbers
slug: /concepts/complex-numbers
aliases:
  - complex plane
  - Argand plane
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The two-dimensional field obtained by adjoining a root of x squared plus one to the reals, in which every polynomial equation has a solution and no ordering compatible with arithmetic survives.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: specializes
    target: concept.algebra.field_theory
    note: C is one particular field extension, a degree-two extension of R, and the general theory of extensions, irreducible polynomials and algebraic closure is what makes the construction routine rather than magical.
  - type: prerequisite_of
    target: concept.analysis.complex_analysis
    note: Holomorphy is a statement about division by a complex increment, so the field structure and the polar form must be in hand before the first definition of that subject can be read.
  - type: contrasts_with
    target: concept.algebra.order_theory
    note: C carries no total order compatible with both addition and multiplication, so the order-theoretic reasoning that works throughout the reals has no counterpart here.
  - type: contributes_to
    target: concept.linear_algebra.spectral_theory
    note: Algebraic closure makes every characteristic polynomial split, which is why every square complex matrix has an eigenvalue and real rotation matrices do not.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.dlmf.nist
    title: NIST Digital Library of Mathematical Functions
    url: https://dlmf.nist.gov/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

The **complex numbers** $\mathbb{C}$ are the set $\mathbb{R}^2$ equipped with the
usual componentwise addition and the twisted multiplication

$$
(a,b)\cdot(c,d) \;=\; (ac - bd,\; ad + bc).
$$

This is a field: the multiplicative identity is $(1,0)$, and every
$(a,b) \neq (0,0)$ has the inverse
$\bigl(a/(a^2+b^2),\, -b/(a^2+b^2)\bigr)$. Writing $a$ for $(a,0)$ embeds
$\mathbb{R}$, and writing $i$ for $(0,1)$ gives $i^2 = (-1,0) = -1$, so every
element is uniquely $a + bi$ with $a,b \in \mathbb{R}$. The twist in the product
is not arbitrary: it is exactly what $(a+bi)(c+di)$ forces once $i^2 = -1$.

## Why it matters

One theorem earns the construction. **Every non-constant polynomial with complex
coefficients has a complex root** — the fundamental theorem of algebra — so
adding a single root of one quadratic turns out to solve every polynomial
equation at once. Nothing forced that. A characteristic polynomial therefore
always splits, so every square complex matrix has an eigenvalue, while the real
rotation matrix $\begin{pmatrix} 0 & -1 \\ 1 & 0\end{pmatrix}$ has none. And
$e^{i\theta}$ packages rotation, oscillation and phase into one multiplicative
object, which is why Fourier analysis, linear differential equations and circuit
theory all move to $\mathbb{C}$ and get simpler rather than harder.

## Intuition

Carry two pictures. Additively, $z = a+bi$ is a point in the plane. But the
working picture is multiplicative: $z$ _acts_ on the plane by rotating through
$\arg z$ and scaling by $|z|$. That is literally true — the map
$a + bi \mapsto \begin{pmatrix} a & -b \\ b & a\end{pmatrix}$ is an isomorphism
onto a subring of the real $2\times 2$ matrices, and those matrices are exactly
the rotation-scalings. Complex multiplication is composition of them.

Where the plane analogy breaks: $\mathbb{C}$ is $\mathbb{R}^2$ as a real vector
space and is emphatically not $\mathbb{R}^2$ as a ring. Componentwise
multiplication on $\mathbb{R}^2$ gives $(1,0)\cdot(0,1) = (0,0)$ — zero divisors,
no field. And the plane picture invites the idea that one point is "bigger" than
another. It is not; see below.

## Concrete example

Complex numbers were forced on mathematics by cubics, not quadratics, and this
is the example that did it. Solve $x^3 = 15x + 4$. Cardano's formula for
$x^3 = px + q$ gives

$$
x = \sqrt[3]{\tfrac{q}{2} + \sqrt{(\tfrac{q}{2})^2 - (\tfrac{p}{3})^3}}
  + \sqrt[3]{\tfrac{q}{2} - \sqrt{(\tfrac{q}{2})^2 - (\tfrac{p}{3})^3}} ,
$$

and here $(q/2)^2 - (p/3)^3 = 4 - 125 = -121$. The formula demands
$\sqrt{-121} = 11i$ even though the equation has the perfectly real root
$x = 4$. Take it seriously: $(2+i)^3 = 8 + 12i - 6 - i = 2 + 11i$, so the two
cube roots are $2+i$ and $2-i$, and they sum to $4$. The imaginary parts cancel
because the two terms are conjugates.

```python
import cmath
z = 2 + 11j
r = z ** (1 / 3)          # principal cube root: 2+1j, to rounding
print(r + r.conjugate())  # (4+0j)
```

This case — three real roots, yet Cardano's route passes through $\mathbb{C}$ —
is the _casus irreducibilis_. For a cubic that is irreducible over $\mathbb{Q}$
with three real roots it is a theorem that the roots cannot be written in real
radicals at all; this one is reducible, $x^3 - 15x - 4 = (x-4)(x^2+4x+1)$ with
roots $4$ and $-2 \pm \sqrt{3}$, so here the detour is avoidable — it is
Cardano's formula, not the problem, that forces it.

## Formal treatment

The clean construction is a quotient of a polynomial ring. $x^2+1$ has no real
root, so it is irreducible in $\mathbb{R}[x]$; since $\mathbb{R}[x]$ is a
principal ideal domain, the ideal $(x^2+1)$ is maximal and

$$
\mathbb{C} \;:=\; \mathbb{R}[x]/(x^2+1)
$$

is a field. Division with remainder makes $\{1, x\}$ a basis, so
$[\mathbb{C}:\mathbb{R}] = 2$ and $i$ is the class of $x$. The $\mathbb{R}^2$
model above is this quotient in coordinates.

Define conjugation $\overline{a+bi} = a-bi$ and modulus
$|z| = \sqrt{z\bar z} = \sqrt{a^2+b^2}$. Then $|zw| = |z||w|$ and
$z^{-1} = \bar z/|z|^2$. In polar form $z = r(\cos\theta + i\sin\theta)$ with
$r = |z|$ and $\theta = \arg z$ determined only modulo $2\pi$; multiplication
multiplies moduli and adds arguments, which gives de Moivre's identity
$(\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta$. Splitting the
absolutely convergent series $\exp(z) = \sum_{n\ge 0} z^n/n!$ into even and odd
terms yields **Euler's formula**

$$
e^{i\theta} \;=\; \cos\theta + i\sin\theta ,
\qquad e^{i\pi} + 1 = 0 .
$$

The solutions of $z^n = 1$ are the $n$ **roots of unity**
$\omega_k = e^{2\pi i k/n}$, $k = 0,\dots,n-1$: the vertices of a regular
$n$-gon on the unit circle, a cyclic group of order $n$ under multiplication,
generated by any $\omega_k$ with $\gcd(k,n)=1$. For $n \ge 2$ they sum to zero,
since $z^n - 1$ has no $z^{n-1}$ term.

Two facts deserve to be stated as sharply as the rest. First, **$\mathbb{C}$ is
not an ordered field**. Suppose a total order $\le$ satisfied the usual
compatibilities. Every non-zero square would be positive, so $1 = 1^2 > 0$ and
$-1 = i^2 > 0$; adding gives $0 > 0$. There is a translation-invariant total
order on $(\mathbb{C},+)$ — lexicographic by real then imaginary part — but no
total order at all is compatible with multiplication. Inequalities in complex
work are always inequalities between the real numbers $|z|$, $\operatorname{Re}
z$, $\operatorname{Im} z$.

Second, $\arg$, $\log$ and $\sqrt{\;}$ are **multivalued**. Since
$e^{2\pi i} = 1$, the equation $e^w = z$ has the solutions
$w = \ln|z| + i(\operatorname{Arg} z + 2\pi k)$ for every $k \in \mathbb{Z}$.
The principal branch fixes $\operatorname{Arg} z \in (-\pi, \pi]$ and defines
$\operatorname{Log} z = \ln|z| + i\operatorname{Arg} z$, discontinuous across the
negative real axis. That branch cut is a convention, not a fact about
$\mathbb{C}$; powers $z^a := e^{a\operatorname{Log} z}$ inherit it, which is how
$i^i$ acquires the principal value $e^{-\pi/2} \approx 0.2079$ alongside
infinitely many others.

## Assumptions and requirements

The construction needs $x^2+1$ to be irreducible over the base field, which is a
property of $\mathbb{R}$, not a universal one. Over $\mathbb{F}_5$, where
$2^2 = 4 = -1$, the polynomial factors as $(x-2)(x-3)$ and
$\mathbb{F}_5[x]/(x^2+1) \cong \mathbb{F}_5 \times \mathbb{F}_5$ — a ring with
zero divisors, not a field. Adjoining a root of $x^2+1$ gives a field only over
a base field where $-1$ is not itself a square — over $\mathbb{F}_3$, where
$-1 = 2$ is not a square, the quotient is the field $\mathbb{F}_9$.

Algebraic closure is not free either. Every proof of the fundamental theorem of
algebra smuggles in analysis: Artin's Galois-theoretic proof still needs that
positive reals have square roots and that odd-degree real polynomials have real
roots, both consequences of the completeness of $\mathbb{R}$. There is no proof
from the field axioms alone, because the statement is false for other fields of
characteristic zero.

The two facts above are linked rather than coincidental. The Artin–Schreier
theorem says that if $\mathbb{C}$ is algebraically closed and $F \subset
\mathbb{C}$ has finite degree greater than one, then that degree is $2$ and $F$
is real closed — orderable. Losing the order is the price of closure, not bad
luck.

Finally, $i$ is a choice. Nothing distinguishes the two roots of $x^2+1$;
conjugation swaps them and is the non-trivial element of
$\operatorname{Gal}(\mathbb{C}/\mathbb{R}) \cong \mathbb{Z}/2$, so no
conjugation-invariant statement can depend on which root was named $i$.

## Uses and applicability

Reach for $\mathbb{C}$ when a problem is about rotation, oscillation or phase,
or when a polynomial must be guaranteed to factor. Eigenvalue theory is the
clearest case: over $\mathbb{C}$ every operator on a non-zero
finite-dimensional space has an eigenvalue, and Jordan form exists. Linear ODEs
with constant coefficients reduce to characteristic roots, with a complex pair
encoding damped oscillation in one exponential. Fourier analysis uses the
characters $e^{-2\pi i \xi x}$ so that a shift becomes multiplication by a
phase, and the fast Fourier transform is arithmetic in the group of $n$-th roots
of unity. Quantum mechanics uses complex Hilbert spaces non-negotiably, because
relative phase is observable.

Do not reach for it when the problem is order-theoretic — optimisation,
inequalities, monotone convergence — since the ordering you would want does not
exist. And do not use it to dress up a real computation that has no rotational
structure; you double the storage and inherit branch cuts for nothing.

## Limitations and common mistakes

The first mistake is "$i = \sqrt{-1}$" taken as a definition. There are two
square roots of $-1$ and the radical is a chosen branch, so the phrase quietly
assumes what it should define. It also licenses the classic error
$-1 = i \cdot i = \sqrt{-1}\sqrt{-1} = \sqrt{(-1)(-1)} = 1$: the identity
$\sqrt{zw} = \sqrt{z}\sqrt{w}$ simply fails on $\mathbb{C}$.

The same failure hits logarithms. $\operatorname{Log}(zw) =
\operatorname{Log} z + \operatorname{Log} w$ is false in general — take
$z = w = -1$, where the left side is $0$ and the right side is $2\pi i$ — and
$\operatorname{Log}(z^n) \neq n\operatorname{Log} z$ for the same reason. The
identities hold modulo $2\pi i$, or as equalities of sets of values, never as
principal values.

Branch-cut conventions bite in code. IEEE-754 signed zeros let implementations
distinguish the two sides of the cut, so C99 and Python's `cmath` return
$+i\pi$ for $\log(-1 + 0i)$ and $-i\pi$ for $\log(-1 - 0i)$. That is a
deliberate design, not a bug, and a function assembled from library branches can
be discontinuous where the mathematics is not.

Order errors are the subtlest. Python raises a `TypeError` on `1j < 2j`, which
is honest; NumPy sorts a complex array lexicographically, which is a convention
carrying no algebraic meaning. Writing $z < w$ in a proof is not a slip of
notation but a claim that cannot be made true.

## Variants and alternatives

Going up in dimension costs structure, and the loss is forced. Hamilton's
**quaternions** $\mathbb{H}$ are four-dimensional and non-commutative; the
**octonions** are eight-dimensional and non-associative. Frobenius's theorem
says $\mathbb{R}$, $\mathbb{C}$ and $\mathbb{H}$ are the only
finite-dimensional associative division algebras over $\mathbb{R}$; Hurwitz's
theorem admits the octonions once the requirement is a multiplicative norm
instead. Quaternions buy three-dimensional rotations without gimbal lock, at the
cost of commutativity.

Other two-dimensional algebras drop the field property on purpose.
**Split-complex numbers** take $j^2 = +1$ and have zero divisors
$(1+j)(1-j) = 0$; they model the Minkowski plane. **Dual numbers** take
$\varepsilon^2 = 0$, so $f(a + b\varepsilon) = f(a) + b f'(a)\varepsilon$ — this
is forward-mode automatic differentiation. As an alternative to $\mathbb{C}$
itself, the algebraic numbers form a countable algebraically closed subfield,
enough for pure algebra and useless for analysis, while the $p$-adic fields
complete $\mathbb{Q}$ differently and close differently.

## History and attribution

Cardano's _Ars Magna_ (1545) records $5 \pm \sqrt{-15}$ while splitting $10$
into two parts with product $40$, and dismisses the manipulation as useless.
Bombelli's _L'Algebra_ (1572) took it seriously, gave arithmetic rules for these
quantities, and used them to extract the real root of the cubic above — the
first genuine payoff. The eighteenth century used them fluently while
mistrusting them: Euler set out the exponential relation in the _Introductio_
(1748), still writing $\sqrt{-1}$ throughout; he introduced the symbol $i$ only
in a memoir of 1777, and it spread after Gauss adopted it in the
_Disquisitiones_ (1801). The geometric picture of the plane was
published by Wessel in 1799 and independently by Argand in 1806, and became
standard through Gauss, whose 1799 dissertation carries the proof of the
fundamental theorem of algebra that is conventionally cited first — though the
early proofs, d'Alembert's 1746 attempt included, have gaps by modern
standards. Hamilton's definition of complex
numbers as ordered pairs of reals, in the 1830s, is what removed the mystery: no
new entity is postulated, only a multiplication on $\mathbb{R}^2$.

## Sources

Axler's _Linear Algebra Done Right_ opens with $\mathbb{C}$ and motivates it by
eigenvalue existence, the cleanest statement of why the field is worth having.
MIT 18.702 covers rings, quotients, field extensions and algebraic closure — the
machinery behind the $\mathbb{R}[x]/(x^2+1)$ construction and its failure over
other base fields. MathWorld is a compact reference for polar form, roots of
unity, the alternative algebras and the historical notes. The NIST Digital
Library of Mathematical Functions is the authority for the principal branch and
the branch-cut conventions numerical libraries follow.

## Prerequisites and next connections

You need very little first: real arithmetic, polynomials, and the plane.
[Real Analysis](./real-analysis.md) supplies the convergence that justifies the
series manipulation behind Euler's formula and the completeness the fundamental
theorem of algebra leans on, and [Vector Spaces](./vector-spaces.md) the sense
in which $\mathbb{C}$ is two-dimensional over $\mathbb{R}$.

What it opens up is large. [Complex Analysis](./complex-analysis.md) is the
immediate sequel and cannot start without the polar form and division used here.
[Spectral Theory](./spectral-theory.md) and [Matrix Theory](./matrix-theory.md)
depend on algebraic closure for eigenvalues to exist at all,
[Fourier Analysis](./fourier-analysis.md) runs on $e^{i\theta}$ and roots of
unity, and [Ordinary Differential Equations](./ordinary-differential-equations.md)
turn oscillation into a single complex exponential.
