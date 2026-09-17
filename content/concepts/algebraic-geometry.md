---
concept_id: concept.geometry.algebraic_geometry
title: Algebraic Geometry
slug: /concepts/algebraic-geometry
kind: concept
tier: 1
review_state: generated-draft
summary: The study of solution sets of polynomial systems as geometric objects, built on a dictionary that turns questions about shapes into questions about ideals in a commutative ring.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.algebra.ring_theory
    note: Every object here is an ideal, a quotient ring or a localisation of a polynomial ring, so a reader without radicals, prime ideals and quotients cannot parse a single statement on this page.
  - type: requires
    target: concept.algebra.field_theory
    note: The Nullstellensatz holds only over an algebraically closed field, so knowing what an algebraic closure is and how a field can fail to be closed is what makes its hypothesis meaningful rather than decorative.
  - type: contrasts_with
    target: concept.geometry.differential_geometry
    note: Both describe spaces by the functions on them, but algebraic geometry allows only polynomials and gets a coarse non-Hausdorff topology with rigid global structure, where smooth geometry allows bump functions and gets local flexibility instead.
  - type: contributes_to
    target: concept.number_theory.elementary_number_theory
    note: Diophantine questions are polynomial systems over non-closed fields and over the integers, and the scheme-theoretic machinery of algebraic geometry is what lets them be studied geometrically.
sources:
  - source_id: source.milne.algebraic_geometry
    title: J. S. Milne, Algebraic Geometry (course notes)
    url: https://www.jmilne.org/math/CourseNotes/ag.html
    source_kind: lecture-or-course
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebraic_geometry
    title: MIT 18.725 Algebraic Geometry (Fall 2015)
    url: https://ocw.mit.edu/courses/18-725-algebraic-geometry-fall-2015/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.vakil.rising_sea_foag
    title: 'The Rising Sea: Foundations of Algebraic Geometry'
    url: https://math.stanford.edu/~vakil/216blog/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Complexity of Gröbner basis computation (Buchberger's algorithm, doubly exponential worst-case degree bounds)
    reason: No source in the registry covers the computational algebra literature on Gröbner basis complexity; the worst-case bounds are stated here from general knowledge and should be checked against a computational algebra reference before this page leaves generated-draft.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Applications of algebraic geometry (elliptic-curve cryptography, algebraic statistics, algebraic-geometry codes, point counting over finite fields)
    reason: The registry's algebraic geometry sources are purely theoretical — Milne, MIT 18.725 and Vakil cover varieties, schemes, curves and cohomology and none of them treats applications — so the applied claims in "Uses and applicability" are stated here from general knowledge and need a coding-theory, cryptography or algebraic-statistics source before this page leaves generated-draft.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

**Algebraic geometry** studies the zero sets of systems of polynomial equations
as geometric objects, and does so by translating every geometric question into
a question about ideals in a commutative ring. Fix a field $k$ and the
polynomial ring $k[x_1,\dots,x_n]$. For a set $S$ of polynomials, the **affine
algebraic set** it cuts out is

$$
V(S) \;=\; \{\, a \in k^n \;:\; f(a) = 0 \ \text{ for all } f \in S \,\},
$$

and in the other direction, for $X \subseteq k^n$,

$$
I(X) \;=\; \{\, f \in k[x_1,\dots,x_n] \;:\; f(a) = 0 \ \text{ for all } a \in X \,\},
$$

which is an ideal. The subject is what happens when these two operations are
taken seriously as inverse to one another.

## Why it matters

Polynomial systems are everywhere — robot kinematics, chemical equilibria,
error-correcting codes, elliptic curves — and solving them one by one is
hopeless. Algebraic geometry replaces solving with structure: the dimension, the
number of irreducible pieces, the singular points and the behaviour at infinity
are all readable from the ideal, without ever finding a solution.

The second payoff is that the same machinery runs over any ring. Once
"geometric object" means "commutative ring, viewed correctly", you can do
geometry over the integers or a finite field, and whole-number solutions become
a question about the shape of a space.

## Intuition

Carry two pictures at once. The first is naive: $V(y - x^2)$ is a parabola and
intersecting equations intersects shapes. The second is the dictionary: adding
equations shrinks the set, so more generators means a smaller variety and the
correspondence reverses inclusions. Irreducible pieces are primes; points are
maximal ideals; functions on the shape are the polynomial ring modulo what
vanishes on it.

The analogy to smooth geometry breaks in one place. In differential geometry you
can build a bump function supported near a point; polynomials admit nothing
local like that, so a polynomial identity is forced by behaviour on any nonempty
open set. That rigidity is why the Zariski topology can be so coarse — the
proper closed subsets of a curve are finite — and still carry everything.

## Concrete example

Work in $\mathbb{C}[x,y]$ and intersect the parabola $y = x^2$ with the line
$y = 0$. The ideal is $J = (y - x^2,\, y) = (x^2,\, y)$, and

$$
V(J) = \{(0,0)\},
$$

a single point. Now compute back: $I(\{(0,0)\}) = (x,y)$, strictly larger than
$J$. The ideal $J$ is not radical — $x \notin J$ but $x^2 \in J$ — and
$\sqrt{J} = (x,y)$, exactly as the Nullstellensatz predicts. The discarded
information is real geometry: the line is tangent to the parabola, so the
intersection has multiplicity $2$, and
$\mathbb{C}[x,y]/(x^2,y) \cong \mathbb{C}[x]/(x^2)$ is a two-dimensional
$\mathbb{C}$-vector space remembering that. The variety forgets it; the scheme
$\operatorname{Spec}\mathbb{C}[x,y]/(x^2,y)$ — a "fat point" of length $2$ —
does not.

Over $\mathbb{R}$ the dictionary breaks outright. The ideal $(x^2 + y^2)$ is
prime in $\mathbb{R}[x,y]$ and hence radical, but $V(x^2+y^2) = \{(0,0)\}$ and
$I(\{(0,0)\}) = (x,y) \neq (x^2+y^2)$. Worse, $V(x^2+y^2+1) = \varnothing$
though $(x^2+y^2+1)$ is proper, so even the weak Nullstellensatz fails.

## Formal treatment

Let $k$ be algebraically closed and write $\mathbb{A}^n = k^n$. The sets $V(S)$
are the closed sets of the **Zariski topology** on $\mathbb{A}^n$; on
$\mathbb{A}^1$ the proper closed subsets are exactly the finite ones.

**Hilbert's Nullstellensatz.** In its weak form: if $J \subsetneq
k[x_1,\dots,x_n]$ is a proper ideal, then $V(J) \neq \varnothing$. In its strong
form: for every ideal $J$,

$$
I(V(J)) \;=\; \sqrt{J} \;=\; \{\, f : f^m \in J \text{ for some } m \geq 1 \,\}.
$$

So $V$ and $I$ are mutually inverse, inclusion-reversing bijections between
radical ideals of $k[x_1,\dots,x_n]$ and affine algebraic sets in
$\mathbb{A}^n$; primes correspond to irreducible sets (the **affine
varieties**) and maximal ideals to points, every maximal ideal having the form
$(x_1 - a_1,\dots,x_n - a_n)$. The **coordinate ring**
$k[X] = k[x_1,\dots,x_n]/I(X)$ is the ring of polynomial functions on $X$, and
$\dim X$ is its Krull dimension.

Affine space is missing its points at infinity. **Projective space**
$\mathbb{P}^n$ is the set of lines through the origin in $k^{n+1}$, with
homogeneous coordinates $[X_0 : \cdots : X_n]$; a homogeneous polynomial has no
value there but does have a zero set, so projective algebraic sets are cut out
by homogeneous ideals, and $V(J) = \varnothing$ exactly when $\sqrt{J}$ contains
the irrelevant ideal $(X_0,\dots,X_n)$.
Compactness pays: parallel lines miss in $\mathbb{A}^2$ but always meet in
$\mathbb{P}^2$, and Bézout's theorem says two projective plane curves of degrees
$d$ and $e$ with no common component meet in exactly $de$ points counted with
multiplicity.

**Schemes** finish the job. For a commutative ring $A$, let
$\operatorname{Spec} A$ be its set of prime ideals with the Zariski topology and
a structure sheaf whose stalks are the localisations $A_{\mathfrak{p}}$; a
scheme is a locally ringed space covered by such affine pieces. This buys four
things: nilpotents survive, so multiplicity is recorded; generic points exist,
so "generic behaviour" is an actual point; $A$ may be $\mathbb{Z}$ or
$\mathbb{F}_q$, so arithmetic is geometry; and fibre products exist, so a family
of varieties is one morphism.

## Assumptions and requirements

The Nullstellensatz needs $k$ algebraically closed, and nothing weaker will do —
the real counterexamples above are the failure mode. It also needs finitely many
variables, and Hilbert's basis theorem, which makes every ideal finitely
generated, is what makes the topology Noetherian.

Bézout's theorem needs all three of its hypotheses: projective (so nothing
escapes to infinity), algebraically closed (so the intersections exist), and
multiplicity counted correctly (so tangency is not undercounted). Drop one and
the count becomes an inequality. Dimension needs care too: $V(f)$ for
nonconstant $f$ has dimension $n-1$, but $V(f_1,\dots,f_r)$ need not have
dimension $n-r$ — Krull's height theorem gives only $\dim \geq n - r$, and
equality defines a complete intersection.

## Uses and applicability

Reach for algebraic geometry when the objects are genuinely defined by
polynomials and you want structure rather than a numerical solution: classifying
curves and surfaces, moduli problems, intersection theory, the geometry behind
Diophantine equations and elliptic-curve cryptography, and algebraic statistics,
where model families are varieties in the simplex. Over finite fields the same
machinery counts points, which is where algebraic geometry codes get their
parameters.

Do not reach for it when the equations are not polynomial, when one approximate
real solution is all you want, or when the real solution set is the point — that
is real algebraic geometry, with different theorems.

## Limitations and common mistakes

The mistake that costs most is importing intuition from $\mathbb{R}$. The
Nullstellensatz does not hold there; the real analogue replaces the radical with
the _real radical_. Anyone who has drawn $x^2+y^2=1$ and called it "the variety"
is reasoning about a real picture of a complex object.

The second is expecting the Zariski topology to behave. It is not Hausdorff,
every nonempty open set is dense in an irreducible variety, and it is strictly
finer on $\mathbb{A}^2$ than the product topology of two copies of
$\mathbb{A}^1$ — the diagonal $V(x-y)$ is closed in the former, not the latter.

The third is treating schemes as abstraction for its own sake. The fat point
above is the honest motivation: without nilpotents there is no way to say two
curves meet _twice_ at one place. The cost — sheaves, locally ringed spaces, a
long apprenticeship before the first theorem — only pays once you need
multiplicities, families or non-closed base fields.

The fourth is computational optimism. Gröbner bases decide ideal membership and
answer "is $V(I)$ empty?" over an algebraically closed field, but the worst-case
cost of computing one is doubly exponential in the number of variables, and a
different monomial order can change a computation from seconds to never.

Finally, "variety" is not standardised: some authors require irreducibility and
some do not, so check the convention before comparing statements.

## Variants and alternatives

The internal variants are successive foundations of one subject: classical
varieties over an algebraically closed field, Serre's sheaf-theoretic varieties,
Grothendieck's **schemes**, and beyond them algebraic spaces and **stacks**, for
moduli problems where objects have automorphisms. Each buys generality at the
cost of machinery.

Neighbouring subjects trade differently. **Complex analytic geometry** studies
the same complex varieties with holomorphic rather than polynomial functions,
gaining analytic tools and losing arithmetic; GAGA-type theorems say the two
agree on projective objects. **Real algebraic geometry** allows inequalities and
gets a usable theory over $\mathbb{R}$ at the price of the ideal-variety
dictionary. **Tropical geometry** degenerates varieties to piecewise-linear
complexes, making combinatorial invariants computable and discarding almost
everything else. **Numerical algebraic geometry** solves systems by homotopy
continuation, buying speed at the cost of exactness. **Gröbner bases** are the
symbolic workhorse, while resultants handle small systems more directly.

## History and attribution

Coordinates joined algebra to geometry with Descartes and Fermat in the
seventeenth century, and the nineteenth added projective geometry and Riemann
surfaces. The Italian school around 1900 — Castelnuovo, Enriques, Severi —
produced a great deal of correct geometry on foundations that could not support
it, and much of the twentieth century was spent rebuilding. Hilbert's basis
theorem and Nullstellensatz in the 1890s supplied the algebraic core; Noether
and Krull built the commutative algebra in the 1920s and 1930s; Zariski and Weil
put varieties on rigorous foundations in the 1930s and 1940s. Serre's 1955
_Faisceaux algébriques cohérents_ brought sheaves in, and from 1960
Grothendieck, with Dieudonné, rewrote the subject around schemes in the
_Éléments de géométrie algébrique_. Gröbner bases came from Bruno Buchberger's
1965 thesis, named for his advisor Wolfgang Gröbner.

## Sources

Milne's course notes give the cleanest statement of the classical material: the
$V$–$I$ correspondence, both forms of the Nullstellensatz with the
algebraically-closed hypothesis explicit, and affine and projective varieties at
the level this page uses. MIT 18.725 covers the same ground moving into schemes
and the Zariski topology. Vakil's _The Rising Sea_ is the scheme-theoretic
reference, unusually explicit about _why_ nilpotents and generic points are
wanted. MacTutor supports the history only.

## Prerequisites and next connections

Read [Ring Theory](./ring-theory.md) first — ideals, quotients, primes and
radicals are the entire vocabulary here — and
[Field Theory](./field-theory.md) close behind, since "algebraically closed" is
the hypothesis every theorem here rests on.
[Galois Theory](./galois-theory.md) governs the passage between a field and its
closure, and so between a variety and its points over subfields.

Afterwards, [Category Theory](./category-theory.md) makes schemes readable
rather than baroque, and [Homological Algebra](./homological-algebra.md)
supplies the sheaf cohomology that does the real work in the modern subject.
Revisit [Point-Set Topology](./point-set-topology.md) for contrast: the Zariski
topology satisfies the axioms and almost none of the expectations. For the
analytic side of the same objects, [Complex Analysis](./complex-analysis.md).
