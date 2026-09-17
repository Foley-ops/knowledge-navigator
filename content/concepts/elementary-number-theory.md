---
concept_id: concept.number_theory.elementary_number_theory
title: Elementary Number Theory
slug: /concepts/elementary-number-theory
aliases:
  - higher arithmetic
kind: concept
tier: 1
review_state: generated-draft
summary: The arithmetic of the integers — divisibility, primes, and congruences — developed with methods that stay inside the integers, and the source of almost every algorithm in public-key cryptography.
categories:
  - Mathematics/Number Theory
primary_category: Mathematics/Number Theory
relationships:
  - type: contributes_to
    target: concept.algebra.ring_theory
    note: Unique factorisation in the integers and the quotients Z/nZ are the concrete cases that ring theory abstracts into unique factorisation domains, ideals and quotient rings.
  - type: contributes_to
    target: concept.algebra.group_theory
    note: Euler's theorem is Lagrange's theorem applied to the unit group of Z/nZ, which is also where group theory gets its standard supply of explicit finite abelian groups.
  - type: contributes_to
    target: concept.algebra.field_theory
    note: Z/pZ is the finite field with p elements, the first field of positive characteristic most readers meet, and the cyclicity of its multiplicative group is a number-theoretic theorem field theory borrows.
  - type: contrasts_with
    target: concept.foundations.computability_theory
    note: Every individual question here is settled by a finite computation and primality is even in P, yet no algorithm decides whether an arbitrary Diophantine equation has an integer solution.
sources:
  - source_id: source.stein.elementary_number_theory
    title: 'Elementary Number Theory: Primes, Congruences, and Secrets'
    url: https://wstein.org/ent/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.joyce.euclid_elements
    title: Euclid's Elements (D. E. Joyce edition)
    url: https://mathcs.clarku.edu/~djoyce/elements/elements.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.agrawal2004.primes_is_in_p
    title: PRIMES is in P
    url: https://annals.math.princeton.edu/2004/160-2/p12
    source_kind: primary-research
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.rivest1978.rsa
    title: A Method for Obtaining Digital Signatures and Public-Key Cryptosystems
    url: https://people.csail.mit.edu/rivest/Rsapaper.pdf
    source_kind: primary-research
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Hilbert's tenth problem and the Davis–Putnam–Robinson–Matiyasevich theorem
    reason: The undecidability of general Diophantine solvability is asserted in the limitations section and in a relationship note; no source in the registry covers it and the corpus has no page on it.
    sections:
      - limitations-and-common-mistakes
  - label: Pre-modern and classical history of the subject — Sun Zi and Qin Jiushao on remainder problems, Fermat's 1640 correspondence, Euler's proofs and the totient, Gauss's Disquisitiones Arithmeticae (1801)
    reason: Euclid's Elements covers the Greek material and the RSA paper its own contribution, but nothing in the registry documents the Chinese remainder problem's origin or the Fermat–Euler–Legendre–Gauss line that produced congruence notation and quadratic reciprocity.
    sections:
      - history-and-attribution
  - label: The origins of public-key cryptography — Diffie–Hellman (1976) and the GCHQ non-secret encryption of Ellis (1969) and Cocks (1973)
    reason: The history section now dates the applied turn to these rather than to RSA alone. The RSA paper in the registry credits Diffie and Hellman with the public-key concept but predates the 1997 declassification, so nothing here documents the GCHQ priority or the content of the 1976 paper.
    sections:
      - history-and-attribution
  - label: Elementary results on the distribution of primes — Chebyshev's bounds, Bertrand's postulate, Mertens' theorems and the Erdős–Selberg elementary proof of the prime number theorem (1948–49)
    reason: Named in the uses section to qualify the boundary between elementary and analytic methods, because the page's own definition of "elementary" would otherwise make that boundary look like a rule about which questions are reachable. No source in the registry covers these; the Riemann hypothesis survey it holds is about the analytic side and is not cited here.
    sections:
      - uses-and-applicability
  - label: Factoring algorithms and the analytic and algebraic branches of number theory
    reason: Pollard rho, the quadratic sieve, the general number field sieve, Lenstra's elliptic curve method, Shor's algorithm, Dedekind's ideals and the prime number theorem are named as the alternatives to elementary methods; the registry holds a Riemann hypothesis survey and a DLMF chapter this page does not cite, and nothing at all on factoring algorithms.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Elementary number theory** studies the multiplicative and divisibility
structure of $\mathbb{Z}$ using arguments that stay inside the integers:
induction, the division algorithm, and counting. Its three basic notions are
divisibility, $a \mid b$ meaning $b = ac$ for some integer $c$; the greatest
common divisor $\gcd(a,b)$; and congruence, $a \equiv b \pmod{n}$ meaning
$n \mid a - b$.

The word _elementary_ names the method, not the difficulty. It means no complex
analysis, no zeta function, no modular forms — not that the results are easy.
Several of the field's plainest questions are open.

## Why it matters

Two facts carry most of the weight. First, every integer above $1$ factors into
primes in exactly one way, so the integers have atoms and arithmetic questions
can be answered atom by atom. Second, arithmetic modulo $n$ is a finite system
in which addition, multiplication and exponentiation are cheap while the inverse
problems are not obviously cheap at all.

That asymmetry is the whole basis of public-key cryptography. Rivest, Shamir and
Adleman built a cipher out of it in 1978: anyone can raise a message to a public
power modulo a public $n$, but recovering the message appears to require knowing
how $n$ factors. Every TLS handshake, signed software update and encrypted
message rests on arithmetic a reader of this page can do by hand on small
numbers.

## Intuition

Think of the primes as atoms and factorisation as chemical analysis: $360$ is
not merely a number but the compound $2^3 \cdot 3^2 \cdot 5$, and divisibility,
gcds and lcms are all read off from the formula.

For congruences, the picture is a clock. Working mod $12$, the integers collapse
to twelve positions, and $10 + 5 = 3$. The analogy breaks at division: on a real
clock you can halve an hour, but mod $12$ the element $2$ has no inverse, because
$2$ and $12$ share a factor. Only residues coprime to the modulus are invertible.

The Chinese remainder theorem then says that a composite clock is really several
independent clocks running side by side. Knowing a number mod $105$ is exactly
the same information as knowing it mod $3$, mod $5$ and mod $7$ — three dials
instead of one.

## Concrete example

Run the Euclidean algorithm on $1071$ and $462$:

$$1071 = 2 \cdot 462 + 147, \quad 462 = 3 \cdot 147 + 21, \quad 147 = 7 \cdot 21 + 0,$$

so $\gcd(1071, 462) = 21$. Back-substituting gives Bézout coefficients:
$21 = 462 - 3 \cdot 147 = 462 - 3(1071 - 2\cdot 462) = 7 \cdot 462 - 3 \cdot 1071$.
Check: $3234 - 3213 = 21$.

The same run, done forwards, and modular exponentiation by repeated squaring:

```python
def egcd(a, b):
    """Return (g, x, y) with g = gcd(a, b) and a*x + b*y == g."""
    old_r, r = a, b
    old_s, s = 1, 0
    old_t, t = 0, 1
    while r != 0:
        q = old_r // r
        old_r, r = r, old_r - q * r
        old_s, s = s, old_s - q * s
        old_t, t = t, old_t - q * t
    return old_r, old_s, old_t


def powmod(base, exp, mod):
    """Return base**exp % mod in O(log exp) multiplications."""
    result, base = 1, base % mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        base = base * base % mod
        exp >>= 1
    return result


assert egcd(1071, 462) == (21, -3, 7)
assert powmod(7, 222, 11) == 5
```

That last line is Fermat's little theorem in action: $7^{10} \equiv 1 \pmod{11}$,
$222 = 22 \cdot 10 + 2$, so $7^{222} \equiv 7^2 = 49 \equiv 5 \pmod{11}$. The
exponent reduced mod $10$, not mod $11$.

And the classical remainder problem: find $x$ with $x \equiv 2 \pmod 3$,
$x \equiv 3 \pmod 5$, $x \equiv 2 \pmod 7$. The answer is $x \equiv 23
\pmod{105}$, and it is unique mod $105$ because $3$, $5$ and $7$ are pairwise
coprime.

## Formal treatment

**Division algorithm.** For $a \in \mathbb{Z}$ and $b > 0$ there are unique
$q, r$ with $a = qb + r$ and $0 \le r < b$.

**Bézout.** For $a, b$ not both zero, $\gcd(a,b)$ is the least positive element
of $\{ax + by : x, y \in \mathbb{Z}\}$; in particular $\gcd(a,b) = ax + by$ for
some integers $x, y$, which the extended Euclidean algorithm produces.

**Euclid's lemma.** If $p$ is prime and $p \mid ab$ then $p \mid a$ or $p \mid b$.

**Fundamental theorem of arithmetic.** Every $n \ge 2$ is a product of primes,
uniquely up to order. Euclid's lemma is what makes uniqueness work; existence is
just induction.

**Congruences.** $\mathbb{Z}/n\mathbb{Z}$ is a commutative ring, and $a$ is
invertible in it exactly when $\gcd(a,n) = 1$ — the inverse being the Bézout
coefficient $x$ in $ax + ny = 1$. The unit group $(\mathbb{Z}/n\mathbb{Z})^\times$
has order $\varphi(n)$, Euler's totient.

**Chinese remainder theorem.** If $n = n_1 n_2 \cdots n_k$ with the $n_i$
pairwise coprime, then the natural map is a ring isomorphism

$$\mathbb{Z}/n\mathbb{Z} \;\cong\; \mathbb{Z}/n_1\mathbb{Z} \times \cdots \times \mathbb{Z}/n_k\mathbb{Z}.$$

**Fermat and Euler.** If $p$ is prime and $p \nmid a$ then
$a^{p-1} \equiv 1 \pmod p$. More generally, if $\gcd(a,n) = 1$ then
$a^{\varphi(n)} \equiv 1 \pmod n$; Fermat's is the case $n = p$, where
$\varphi(p) = p-1$.

**Quadratic reciprocity.** For an odd prime $p$ and $p \nmid a$, the Legendre
symbol $\left(\frac{a}{p}\right)$ is $+1$ if $a$ is a nonzero square mod $p$ and
$-1$ otherwise, and $0$ if $p \mid a$. For distinct odd primes $p, q$,

$$\left(\frac{p}{q}\right)\left(\frac{q}{p}\right) = (-1)^{\frac{p-1}{2} \cdot \frac{q-1}{2}},$$

so the two symbols agree unless $p \equiv q \equiv 3 \pmod 4$, in which case they
differ in sign. The supplements handle the cases the law excludes:
$\left(\frac{-1}{p}\right) = (-1)^{(p-1)/2}$ and
$\left(\frac{2}{p}\right) = (-1)^{(p^2-1)/8}$.

## Assumptions and requirements

Everything above is unconditional — these are theorems of ordinary arithmetic,
with no probabilistic or asymptotic hypotheses — but each has hypotheses that
matter.

Unique factorisation is a property of $\mathbb{Z}$, not a formality. In
$\mathbb{Z}[\sqrt{-5}]$ it fails: $6 = 2 \cdot 3 = (1 + \sqrt{-5})(1 - \sqrt{-5})$
with all four factors irreducible. Recognising that this is a real theorem, not a
definition, is the door into algebraic number theory.

Euler's theorem needs $\gcd(a,n) = 1$. Take $a = 2$, $n = 4$: $\varphi(4) = 2$
and $2^2 = 4 \equiv 0 \pmod 4$, not $1$. The Chinese remainder theorem needs the
moduli pairwise coprime; without it a system may have no solution at all
($x \equiv 1 \pmod 2$ and $x \equiv 0 \pmod 4$) or solutions on a coarser
modulus. Quadratic reciprocity as stated needs $p$ and $q$ distinct and odd.

## Uses and applicability

Reach for this material whenever the objects are exact integers and the question
is about divisibility, remainders or periodicity. Public-key cryptography is the
flagship case: RSA chooses $n = pq$, a public exponent $e$ coprime to
$\varphi(n)$, and $d = e^{-1} \bmod \varphi(n)$ found by the extended Euclidean
algorithm, so that $(m^e)^d \equiv m \pmod n$ by Euler's theorem. Diffie–Hellman
uses the same modular exponentiation in the opposite direction.

Beyond cryptography: hash functions and checksums use modular arithmetic for
mixing; the Chinese remainder theorem speeds RSA decryption about fourfold by
working mod $p$ and mod $q$ separately, and underlies residue number systems and
secret sharing; linear congruential generators are periodic exactly because
$(\mathbb{Z}/n\mathbb{Z})$ is finite; error-correcting codes are built over
$\mathbb{F}_p = \mathbb{Z}/p\mathbb{Z}$.

Think twice before reaching for it when the question is about how primes are
_distributed_. Counting primes below $x$, bounding gaps, or anything asymptotic
is normally analytic number theory's business: complex analysis and the zeta
function are the most powerful tools available there and usually the first
choice. But the boundary is one of effectiveness, not of subject matter, and
elementary arguments reach further across it than the name suggests —
Chebyshev's bounds on $\pi(x)$, Bertrand's postulate, and the Erdős–Selberg
elementary proof of the prime number theorem (1948–49) all count primes below
$x$ with no complex analysis and no zeta function, and the modern work on
bounded gaps rests on sieve methods, which are not complex-analytic either.

## Limitations and common mistakes

Cancellation is the first trap. From $ac \equiv bc \pmod n$ it does not follow
that $a \equiv b \pmod n$: $2 \cdot 3 \equiv 2 \cdot 0 \pmod 6$ while
$3 \not\equiv 0$. The correct rule divides the modulus too, giving
$a \equiv b \pmod{n/\gcd(c,n)}$.

The second is exponent arithmetic: exponents reduce mod $\varphi(n)$, never mod
$n$, and only when the base is coprime to $n$.

The third is believing Fermat's little theorem backwards. Passing
$a^{n-1} \equiv 1 \pmod n$ does not make $n$ prime — the Carmichael numbers pass
for every base coprime to $n$, the smallest being $561 = 3 \cdot 11 \cdot 17$.

The fourth is assuming a primitive root always exists. The group
$(\mathbb{Z}/n\mathbb{Z})^\times$ is cyclic only for $n = 1, 2, 4, p^k$ and
$2p^k$ with $p$ an odd prime; mod $8$ it is the Klein four-group.

The fifth, and the most consequential, concerns hardness. **RSA's security is an
assumption, not a theorem.** No one has proved that factoring is hard, and it is
not even known that breaking RSA is as hard as factoring — the RSA paper itself
presents the difficulty of factoring as evidence, not proof. Nor is factoring
required to _test_ primality: Agrawal, Kayal and Saxena gave a deterministic
polynomial-time primality algorithm in 2002, so PRIMES is in P, while factoring
remains open with no known polynomial-time classical algorithm and no proof that
none exists. And some number-theoretic questions are not merely hard: there is no
algorithm at all that decides whether an arbitrary Diophantine equation has an
integer solution.

Finally, "elementary" does not mean tractable. Goldbach's conjecture and the twin
prime conjecture are statable in a sentence of this page's vocabulary and remain
unsolved.

## Variants and alternatives

**Analytic number theory** trades elementarity for power, attacking the
distribution of primes with Dirichlet series and the Riemann zeta function.
**Algebraic number theory** repairs unique factorisation by replacing elements
with ideals in rings of integers of number fields. **Modular and automorphic
methods** are the modern heavy machinery, the route by which Fermat's Last
Theorem finally fell.

Computationally the alternatives are sharper. For primality: Miller–Rabin is
randomised, fast and wrong with controllable probability; the AKS algorithm is
deterministic and polynomial but slower in practice than the randomised tests it
displaced in theory; elliptic-curve primality proving produces a checkable
certificate. For factoring: trial division, Pollard rho, the quadratic sieve and
the general number field sieve are all sub-exponential at best, and Shor's
algorithm is polynomial but needs a quantum computer.

## History and attribution

The Greek core is in Euclid's _Elements_, Books VII to IX: the subtractive gcd
procedure that still carries his name, the lemma that a prime dividing a product
divides a factor, and the proof that the primes are more than any assigned
multitude. Diophantus, later, gave his name to equations sought in integers.

Remainder problems of the kind the Chinese remainder theorem solves appear in
Chinese mathematics well before their European statement. Fermat announced his
little theorem in seventeenth-century correspondence without proof; Euler proved
it and generalised it with the totient function in the eighteenth. Gauss's
_Disquisitiones Arithmeticae_ of 1801 introduced the congruence notation used
above and gave the first complete proof of quadratic reciprocity, which Euler and
Legendre had stated but not established.

The field's applied turn is recent, but harder to date to a single paper than it
is usually made to look. Diffie and Hellman published the first public-key scheme
built on modular exponentiation — key exchange — in _New Directions in
Cryptography_ in 1976. Rivest, Shamir and Adleman published the first practical
public-key encryption and signature scheme in 1978, having devised the algorithm
in 1977. Neither was the first discovery: Clifford Cocks had described an
equivalent scheme at GCHQ in 1973, building on James Ellis's 1969 proposal of
non-secret encryption, and that work stayed classified until 1997. Agrawal, Kayal
and Saxena's PRIMES is in P then settled in 2002 a question that had been open
since antiquity in one form and since the rise of complexity theory in another.

## Sources

Stein's _Elementary Number Theory: Primes, Congruences, and Secrets_ is the
single best fit for this page: it covers divisibility, the Euclidean algorithm,
unique factorisation, congruences, the Chinese remainder theorem, Fermat and
Euler, quadratic reciprocity and public-key cryptography in that order, with
computations throughout. Joyce's edition of Euclid's _Elements_ is the primary
text for the Greek results and for what Euclid actually proved, as opposed to
what is attributed to him. The AKS paper is the source for primality being in P
and surveys the primality algorithms it competes with. The original RSA paper is
both the historical record and the honest statement of what the scheme's security
does and does not rest on.

## Prerequisites and next connections

Nothing formal is required beyond induction and comfort with integers; that is
what makes this a good first serious mathematics subject. A reader who wants the
structural view should follow it into [Ring Theory](./ring-theory.md), where
$\mathbb{Z}/n\mathbb{Z}$, ideals and unique factorisation domains generalise
everything above, and [Group Theory](./group-theory.md), where Euler's theorem
becomes a one-line corollary of Lagrange's.

From there, [Field Theory](./field-theory.md) explains why
$\mathbb{Z}/p\mathbb{Z}$ is a field and $\mathbb{Z}/6\mathbb{Z}$ is not, and
[Galois Theory](./galois-theory.md) shows what the finite fields' automorphisms
do. On the computational side,
[Computability Theory](./computability-theory.md) supplies the vocabulary for the
hardness claims that cryptography leans on, and
[Probability and Computing](./probability-and-computing.md) explains why a
randomised primality test is trustworthy in practice.
