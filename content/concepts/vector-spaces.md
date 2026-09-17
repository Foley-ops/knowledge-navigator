---
concept_id: concept.linear_algebra.vector_spaces
title: Vector Spaces
slug: /concepts/vector-spaces
aliases:
  - linear space
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The structure linear algebra is actually about — a set you can add and scale by a field, carrying exactly enough to define span, independence and dimension, and deliberately not enough to define length or angle.
categories:
  - Mathematics/Linear & Multilinear Algebra
primary_category: Mathematics/Linear & Multilinear Algebra
relationships:
  - type: requires
    target: concept.foundations.set_theory
    note: The definition is a set with operations, and the two headline theorems about infinite-dimensional spaces — that a basis exists and that any two have the same cardinality — are statements about ZFC and the axiom of choice rather than about algebra.
  - type: prerequisite_of
    target: concept.linear_algebra.matrix_theory
    note: A matrix is what a linear map between finite-dimensional vector spaces becomes after a basis is chosen at each end, so the basis-independent object has to be understood before the array of numbers means anything.
  - type: generalizes
    target: concept.analysis.banach_spaces
    note: A Banach space is a vector space plus a complete norm; strip the norm and exactly this structure remains, which is why no statement about length, convergence or approximation can be proved at this level.
  - type: prerequisite_of
    target: concept.linear_algebra.tensors
    note: Tensors are elements of a tensor product of vector spaces, defined by a basis-free universal property and identified with multilinear maps on them in finite dimension, so the spaces themselves have to be understood first; bases enter only when one wants components.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - concrete-example
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.plato.set_theory
    title: 'Stanford Encyclopedia of Philosophy: Set Theory'
    url: https://plato.stanford.edu/entries/set-theory/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **vector space** over a field $F$ is a set $V$ together with an addition
$V \times V \to V$ and a scalar multiplication $F \times V \to V$ such that
$(V, +)$ is an abelian group and, for all $a, b \in F$ and $u, v \in V$,

$$
a(u + v) = au + av, \quad (a + b)v = av + bv, \quad (ab)v = a(bv), \quad 1v = v .
$$

Elements of $V$ are **vectors**, elements of $F$ are **scalars**. That is the
whole of the data. There is no distinguished list of coordinates, no length, no
angle, no notion of one vector being close to another. Everything a vector space
can say is said through finite linear combinations $a_1 v_1 + \cdots + a_n v_n$.

## Why it matters

The payoff is that "the solutions form a subspace" turns a search problem into a
finite description. The solution set of a homogeneous linear ODE of order $n$ with
continuous coefficients is a vector space of dimension exactly $n$ over
$\mathbb{R}$: find $n$ independent solutions and you have proved you have all of
them, rather than merely failing to find others. The same move classifies the
solutions of $Ax = 0$ and the error-correcting codes over $\mathbb{F}_2$.

Dimension is what makes this work. It is an invariant of the space, not of any
presentation of it, so two spaces of the same dimension over the same field are
isomorphic and a map between spaces of different dimension cannot be invertible.
Rank-nullity, and why $n+1$ vectors in $F^n$ are always dependent, are dimension
arguments wearing other clothes.

## Intuition

The picture most people carry is arrows from an origin, and it is a good picture
of $\mathbb{R}^2$. It breaks in two places. Arrows have visible length and visible
angles, and the axioms supply neither; the picture silently imports a Euclidean
inner product that is extra structure. And over $\mathbb{F}_2$ there are no arrows
at all — $\mathbb{F}_2^3$ is eight bit-strings — while in a function space the
"arrow" is a whole function.

The picture that survives is a grid. A basis is a choice of grid laid over the
space; coordinates are the readings off it. The space has no preferred grid, so a
vector "is" not its coordinate tuple: changing basis changes every number while
changing nothing about the vector. That observation is what pays off downstream,
in eigenbases, in change of variables, and in every complaint that a learned
representation is "only defined up to rotation".

## Concrete example

Let $V = \mathcal{P}_2(\mathbb{R})$, the real polynomials of degree at most $2$.
It is a vector space: sums and scalar multiples of such polynomials are again
such polynomials, and the zero polynomial is the additive identity. Two bases:

$$
B = (1,\; x,\; x^2), \qquad C = \big(1,\; x - 1,\; (x-1)^2\big) .
$$

Take the single vector $p(x) = x^2$. In $B$ its coordinates are $(0, 0, 1)$. In
$C$ they are $(1, 2, 1)$, because

$$
1 + 2(x-1) + (x-1)^2 = 1 + 2x - 2 + x^2 - 2x + 1 = x^2 .
$$

Same vector, same space, entirely different tuple. Nothing was approximated; the
tuple was never a property of $p$. Both bases have three elements, as they must,
and any fourth polynomial of degree $\le 2$ is forced to be dependent on $B$.

## Formal treatment

For $S \subseteq V$, the **span** $\operatorname{span}(S)$ is the set of finite
linear combinations of elements of $S$, equivalently the smallest subspace
containing $S$. A list $(v_1, \dots, v_m)$ is **linearly independent** when
$a_1 v_1 + \cdots + a_m v_m = 0$ forces $a_1 = \cdots = a_m = 0$. A **basis** is a
list that is both independent and spanning; equivalently, every $v \in V$ has a
_unique_ expression $v = \sum_i a_i v_i$, and $v \mapsto (a_1,\dots,a_n)$ is the
coordinate isomorphism $V \cong F^n$ that the basis, and only the basis, provides.

The central lemma is the **exchange lemma**: in any vector space, the length of a
linearly independent list is at most the length of a spanning list. Applying it
twice to two bases gives each length bounded by the other, so

$$
\text{any two bases of } V \text{ have the same cardinality} =: \dim_F V .
$$

For infinite-dimensional spaces the statement holds with "cardinality" meant
literally. It and the existence of a basis both depend on choice, but by
different routes: existence is Zorn's lemma applied to the independent subsets
of $V$ ordered by inclusion, while equality of cardinalities is a counting
argument — each vector of one basis has finite support in the other, and those
supports must exhaust it — closed by cardinal arithmetic. The result is a
**Hamel basis**, in which every element of $V$ is a _finite_ combination of
basis vectors.

Two constructions round out the structure. The **direct sum** $V = U \oplus W$
holds when $U + W = V$ and $U \cap W = \{0\}$, so every $v$ splits uniquely as
$u + w$; in general $\dim(U + W) + \dim(U \cap W) = \dim U + \dim W$. The
**quotient** $V/U$ has as elements the cosets $v + U$, with
$(v + U) + (v' + U) = (v + v') + U$ and $a(v+U) = av + U$, and satisfies
$\dim(V/U) = \dim V - \dim U$ in finite dimension. The quotient forgets a subspace
without choosing a complement: many $W$ satisfy $V = U \oplus W$, but there is
only one $V/U$.

## Assumptions and requirements

$F$ must be a **field** — or, since commutativity is nowhere used here, a
division ring — and the place it is used is division. Over a general ring the
same axioms define a **module**, and the theory weakens: $\mathbb{Z}/2$ as a
$\mathbb{Z}$-module has no basis at all, since every element is annihilated by
$2$. What division buys is that every module over a field is free; without it a
module need not have a basis, and then has no dimension, though a free module
over a commutative ring still has a well-defined rank.

The characteristic of $F$ matters for arguments that divide: averaging $p$ vectors
is unavailable in characteristic $p$, which is why results like Maschke's theorem
carry a hypothesis on the characteristic.

The infinite-dimensional statements are choice-dependent. "Every vector space has
a basis" is not a theorem of ZF alone; over ZF it is _equivalent_ to the axiom of
choice, a result of Blass (1984). In ZF without choice there are models where
$\mathbb{R}$ as a $\mathbb{Q}$-vector space has no basis. Nothing in finite
dimension needs choice.

## Uses and applicability

Reach for the vector-space frame when the objects are genuinely closed under
addition and scaling and the question is about independence, rank or degrees of
freedom: solution sets of linear systems and linear differential equations,
function spaces, feature and embedding spaces, linear codes over $\mathbb{F}_q$,
and anywhere a basis of features is fitted by least squares.

Do not reach for it when the set is not closed. A probability simplex, the set of
unit-norm embeddings and an affine hyperplane missing the origin are not
subspaces, and dimension theorems do not apply to them. And do not expect answers
about size or nearness: a bare vector space cannot say one approximation beats
another. That needs a norm or an inner product — a
[Hilbert space](./hilbert-spaces.md), or the wider setting of
[functional analysis](./functional-analysis.md).

## Limitations and common mistakes

**Treating coordinates as intrinsic.** The mistake behind most confusion
downstream. A vector has coordinates only relative to a basis, so "the third
component is large" is a statement about the basis, not the vector.

**Assuming every vector space is $F^n$ in disguise.** Every $n$-dimensional space
is isomorphic to $F^n$, but not _canonically_ — the isomorphism is exactly the
choice of basis. The dual space $V^*$ is the standard example: isomorphic to $V$
in finite dimension, with no natural isomorphism to it.

**Expecting orthogonality.** Without an inner product, "orthogonal complement" is
undefined. The basis-free substitute is the annihilator
$U^\circ = \{f \in V^* : f|_U = 0\}$, which satisfies
$\dim U^\circ = \dim V - \dim U$ and needs no geometry.

**Confusing a Hamel basis with the bases used in analysis.** A Fourier or Schauder
basis allows infinite sums and so presupposes a topology; a Hamel basis allows
only finite ones. In an infinite-dimensional Banach space a Hamel basis is
necessarily uncountable, by the Baire category theorem, and none can be written
down explicitly.

**Checking the wrong thing for a subspace.** A subspace must contain $0$ and be
closed under both operations. Closure under addition alone is not enough: the
nonnegative orthant in $\mathbb{R}^n$ passes that test and is not a subspace.

## Variants and alternatives

Weakening the scalars gives **modules over a ring**, which buys generality — the
right home for lattices, abelian groups and coefficient rings in topology — and
costs dimension. Weakening the base point gives **affine spaces**, which have no
origin and where only differences of points are vectors; that is the right model
for the solution set of $Ax = b$.

Adding structure gives the analytic hierarchy: a norm, completed, gives a Banach
space; an inner product, completed, gives a Hilbert space; a compatible topology
alone gives a topological vector space. Adding a multiplication gives an
**algebra**, and adding a grading gives the exterior and tensor algebras.

The genuinely different competitor at this level of abstraction is the
**matroid**, which axiomatises independence directly, with no addition or scaling,
and keeps the combinatorics once the arithmetic is removed.

## History and attribution

The concept has several independent origins and settled late. Hermann Grassmann's
_Ausdehnungslehre_ of 1844 developed an abstract calculus of linear extension
before the language existed to receive it. Giuseppe Peano gave a recognisably
modern axiomatic definition — over the reals, with an explicit axiom list and a
notion of dimension — in his 1888 _Calcolo geometrico_, presented as a
systematisation of Grassmann. Hermann Weyl gave an axiomatisation in _Raum, Zeit,
Materie_ (1918), in the service of relativity.

Georg Hamel's 1905 construction of a basis for $\mathbb{R}$ over $\mathbb{Q}$
gives the term Hamel basis; his motivation was producing discontinuous solutions
of Cauchy's functional equation $f(x+y) = f(x) + f(y)$, and he needed the axiom of
choice to do it. Ernst Steinitz's 1910 paper on fields, _Algebraische Theorie
der Körper_, contains the exchange argument now used for the dimension theorem.
The definition reached its current form in the 1920s and 1930s, through Banach's
work on normed spaces and the algebra textbooks of that period.

## Sources

Axler's _Linear Algebra Done Right_ covers the axioms, span, independence, bases,
dimension, direct sums and quotients without determinants and without
coordinates — the emphasis this page takes. MIT 18.06 is the complementary
computational view: column space, null space, rank and change of basis on
matrices. MIT 18.701 places the definition inside abstract algebra, where the
field-versus-ring distinction and the module generalisation live. The Stanford
Encyclopedia entry on set theory is the reference for ZFC and the axiom of choice,
on which the infinite-dimensional basis theorems rest.

## Prerequisites and next connections

Read [set theory](./set-theory.md) far enough to be comfortable with functions,
cardinality and the axiom of choice; the finite-dimensional theory needs none of
it and the infinite-dimensional theory needs all of it. Familiarity with
$\mathbb{R}^n$ from [multivariable calculus](./multivariable-calculus.md) is the
concrete ground being generalised.

Adding an inner product and completeness gives
[Hilbert spaces](./hilbert-spaces.md), where projection and orthonormal bases
return; keeping a norm but no inner product is
[functional analysis](./functional-analysis.md). The dimension theorem is what
makes the structure theory of
[ordinary differential equations](./ordinary-differential-equations.md) finite,
and the spanning arguments here reappear as completeness of trigonometric systems
in [Fourier analysis](./fourier-analysis.md).
