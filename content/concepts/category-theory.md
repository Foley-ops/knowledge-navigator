---
concept_id: concept.foundations.category_theory
title: Category Theory
slug: /concepts/category-theory
aliases:
  - general abstract nonsense
kind: concept
tier: 1
review_state: generated-draft
summary: A mathematical language that describes structures by the maps between them rather than by their elements, so that constructions from algebra, topology, logic and programming turn out to be the same definition read in different settings.
categories:
  - Mathematics/Foundations
primary_category: Mathematics/Foundations
relationships:
  - type: requires
    target: concept.foundations.set_theory
    note: The standard definitions quantify over sets — a locally small category has a set of morphisms between each pair of objects — and the size distinctions that keep the subject consistent are stated set-theoretically.
  - type: contrasts_with
    target: concept.foundations.model_theory
    note: Model theory studies a structure through the formulas its elements satisfy, whereas category theory refuses to look inside an object and characterises it by the arrows around it.
  - type: contributes_to
    target: concept.logic.proof_theory
    note: Cartesian closed categories are models of intuitionistic propositional proof, which lets proofs themselves be treated as morphisms that compose rather than as mere witnesses to provability.
sources:
  - source_id: source.nlab.category_theory
    title: 'nLab: category theory'
    url: https://ncatlab.org/nlab/show/category+theory
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.hatcher.algebraic_topology
    title: Allen Hatcher, Algebraic Topology
    url: https://pi.math.cornell.edu/~hatcher/AT/ATpage.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.haskell.report
    title: The Haskell 2010 Language Report
    url: https://www.haskell.org/onlinereport/haskell2010/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Category theory** is the study of mathematical structures through the maps
between them. A _category_ $\mathcal{C}$ consists of a collection of **objects**;
for each ordered pair of objects $A, B$ a collection $\mathcal{C}(A,B)$ of
**morphisms** written $f : A \to B$; a composition operation
$\circ : \mathcal{C}(B,C) \times \mathcal{C}(A,B) \to \mathcal{C}(A,C)$; and for
each object an identity $1_A \in \mathcal{C}(A,A)$. Two axioms hold: composition
is associative, $h \circ (g \circ f) = (h \circ g) \circ f$ whenever the
composites are defined, and identities are neutral,
$1_B \circ f = f = f \circ 1_A$ for every $f : A \to B$.

Nothing there says objects are sets or morphisms are functions. In
$\mathbf{Set}$ they are; in a poset read as a category the objects are elements
and there is one morphism $a \to b$ exactly when $a \le b$.

## Why it matters

Once "structure-preserving map" is a primitive, definitions stop being restated
per field. A **product** of $A$ and $B$ is an object $P$ with projections
$p : P \to A$, $q : P \to B$ such that every pair of arrows $f : X \to A$,
$g : X \to B$ factors through $P$ by a unique arrow $X \to P$. In $\mathbf{Set}$
that is the cartesian product; in groups, the direct product; in topological
spaces, the product topology; in a poset, the greatest lower bound; in logic,
conjunction. Any two objects satisfying it are isomorphic by a unique
isomorphism, so "the" product is well defined without naming a construction.

The second payoff is transport. The fundamental group is a functor: it sends a
space to a group and a continuous map to a homomorphism, preserving composition.
That alone proves Brouwer's fixed point theorem in the plane. A retraction of the
disc onto its boundary circle — $r$ with $r \circ i = 1_{S^1}$ for the inclusion
$i$ — would, under $\pi_1$, factor the identity of $\pi_1(S^1) \cong \mathbb{Z}$
through $\pi_1(D^2) = 0$, which is impossible. The topology is hard; the algebra
it lands in is not.

## Intuition

Forget what an object is made of; keep only the arrows into and out of it and
the rule for composing them. The picture is a city known solely by its one-way
streets: never the buildings, only the routes. The analogy breaks twice over.
Two distinct arrows $A \to B$ are genuinely different
data, not one "connection" counted twice, so composition is richer than
reachability; and the identity arrow, which looks like a do-nothing loop, is
what makes isomorphism definable at all.

The subject then climbs a level at a time: functors are the maps between
categories, natural transformations the maps between functors — the claim being
that "map between maps" deserves a definition of its own.

## Concrete example

A monoid _is_ a one-object category. Take $(\mathbb{N}, +, 0)$ and build
$\mathbf{B}\mathbb{N}$: one object $\star$, morphisms
$\mathbf{B}\mathbb{N}(\star,\star) = \mathbb{N}$, composition $m \circ n = m+n$,
identity $0$. The two category axioms are exactly the two monoid axioms. A
functor $F : \mathbf{B}\mathbb{N} \to \mathbf{Set}$ is then precisely a set
$X = F(\star)$ together with one endofunction $f = F(1)$, because functoriality
forces $F(n) = f^{n}$ — so $F(3) = f \circ f \circ f$ and $F(0) = 1_X$.

In code, the list constructor is a functor from types-and-functions to itself:

```haskell
instance Functor [] where
  fmap _ []     = []
  fmap g (x:xs) = g x : fmap g xs
```

So `fmap (+1) [1,2,3]` is `[2,3,4]`, and the functor laws are `fmap id == id`
and `fmap (g . h) == fmap g . fmap h`. Then `reverse` is a natural
transformation from this functor to itself: for every finite list and every `g`,
`reverse (fmap g xs) == fmap g (reverse xs)`. That equation is the naturality
square, and the precise version of "reverse rearranges a list without looking at
the elements".

## Formal treatment

A **functor** $F : \mathcal{C} \to \mathcal{D}$ assigns an object $F(A)$ to each
object and a morphism $F(f) : F(A) \to F(B)$ to each $f : A \to B$, with
$F(g \circ f) = F(g) \circ F(f)$ and $F(1_A) = 1_{F(A)}$. A **natural
transformation** $\eta : F \Rightarrow G$ between functors
$\mathcal{C} \to \mathcal{D}$ is a family of morphisms
$\eta_A : F(A) \to G(A)$, one per object, such that

$$
\eta_B \circ F(f) \;=\; G(f) \circ \eta_A
\qquad \text{for every } f : A \to B .
$$

Size is not decoration. $\mathcal{C}$ is _locally small_ when each
$\mathcal{C}(A,B)$ is a set, and _small_ when its objects also form a set.
$\mathbf{Set}$ is locally small but not small, since there is no set of all
sets; a "category of all categories" needs universes or a class/set distinction,
and which device to use is a real technical choice, not a settled one.

For locally small $\mathcal{C}$, an object $A$ and a functor
$F : \mathcal{C} \to \mathbf{Set}$, the **Yoneda lemma** gives a bijection

$$
\mathrm{Nat}\bigl(\mathcal{C}(A,-),\, F\bigr) \;\cong\; F(A),
$$

natural in both $A$ and $F$, sending $\eta$ to $\eta_A(1_A)$. Plainly: an
operation defined uniformly for every object and compatible with every morphism
is pinned down by what it does to one identity arrow. Hence
$A \mapsto \mathcal{C}(A,-)$ is fully faithful, and an object is determined up to
isomorphism by the pattern of arrows around it.

One instance connects this corpus: for a group $G$ as a one-object category
$\mathbf{B}G$, functors $\mathbf{B}G \to \mathbf{Set}$ are exactly $G$-sets and
natural transformations between them exactly equivariant maps, since naturality
at the single object reads $\eta(g \cdot x) = g \cdot \eta(x)$.

## Assumptions and requirements

**Composition is total, and associative on the nose.** Any two composable arrows
must have a composite, and the two bracketings must be _equal_, not merely
isomorphic. Spans, cobordisms and maps taken up to homotopy compose
associatively up to a chosen isomorphism and no better. Dropping strictness does
not end the subject, it changes it: the associator becomes data, coherence
conditions have to say which of several composites a diagram means, and proofs
spend most of their length on that bookkeeping. It is the entry price of
bicategories and of the $(\infty,1)$-categories homotopy theory needs.

**The functors used above carry hypotheses of their own.** $\pi_1$ is a functor
on _pointed_ spaces: without a chosen basepoint a continuous map induces no
homomorphism, and the retraction argument in _Why it matters_ has nothing to act
on. That argument also needs $\pi_1(S^1) \cong \mathbb{Z}$ and $\pi_1(D^2) = 0$,
which are theorems of topology. Functoriality supplies the contradiction, never
the inputs.

**Diagram shapes must be small.** A category is _complete_ when it has limits of
all small diagrams, and that restriction is load-bearing. Freyd's observation:
a small category with all small products is a preorder, because if two distinct
parallel arrows $A \rightrightarrows B$ exist, a product of enough copies of $B$
admits more arrows from $A$ than the category has arrows in total. Demanding
large limits of a small category does not enrich it; it collapses it to at most
one arrow between any two objects.

**Statements must be invariant under equivalence.** A property that mentions
equality of objects — that two objects _are_ the same, that there are exactly
three of them — can hold in one category and fail in an equivalent one, so it
will not transport along the equivalences the subject runs on. Definitions are
expected to speak only of isomorphism, and that discipline is what keeps a
universal property well posed rather than tied to a construction.

**Choice is doing quiet work.** That a fully faithful, essentially surjective
functor is an equivalence requires choosing a preimage and an isomorphism for
each object of the target; so does the claim that every category is equivalent
to a skeleton. Without choice the two notions come apart, which is why
constructive and categorical-logic settings keep them as separate definitions.

## Uses and applicability

Reach for it when one construction keeps reappearing and you want to name it
once — limits, colimits, adjunctions, monads; when a problem should be moved
somewhere easier by a map that respects composition, as homology does; or when
an interface is best specified by a universal property, so any two
implementations are canonically isomorphic.

Do not reach for it when the question is about the internals of one structure.
The arrows-only view discards elements on purpose, so a numerical estimate, a
counterexample hunt or a concrete algorithm gains nothing from a categorical
restatement. Applications to machine learning exist — optics and lenses for
backpropagation, categorical accounts of equivariant architectures — though as
of 2026 they have not displaced standard practice; that last is this page's
assessment of a live research area, not a finding in any source cited here.

## Limitations and common mistakes

The most common error is believing category theory is a prerequisite for
functional programming. It is not: the Haskell Report defines `Functor` and
`Monad` as type classes with laws, and a programmer can learn them from those
laws alone. The categorical reading is genuine but imperfect — the supposed
category of Haskell types and functions is a useful fiction rather than a
theorem, because non-termination and `seq` break the equations it needs.

The second is mistaking generality for depth. A categorical restatement proves
nothing by itself; the content is in checking that some concrete construction
satisfies the universal property, which is ordinary mathematics.

The third is thinking a family of maps, one per object, is a natural
transformation. Naturality is a condition on every morphism, and it bites: a
finite-dimensional vector space is isomorphic to its dual, but not naturally,
while the isomorphism to its double dual is natural.

Finally, ignoring size produces contradictions rather than pedantry. Without
local smallness the Yoneda statement above cannot even be formed:
$\mathcal{C}(A,-)$ is no longer a functor into $\mathbf{Set}$, and the
natural transformations out of it need not form a set either. The lemma does not
thereby acquire counterexamples — recovering the statement means moving to a
larger universe, where those hom-classes are again sets.

## Variants and alternatives

The definition varies along two axes: what the hom-collections are made of, and
how strictly composition behaves.

**Enriched categories** replace each $\mathcal{C}(A,B)$ by an object of a
monoidal category $\mathcal{V}$. Abelian groups give the additive categories
homological algebra is written in, simplicial sets the setting homotopy theory
works in, and Lawvere's reading of $[0,\infty]$ under addition turns a metric
space into a category, with distance as the hom-object and the triangle
inequality as composition. Structure on hom is then present from the start
rather than bolted on; the cost is that every statement, Yoneda included, has to
be redone, since one can no longer speak of an element of a hom-set.

**Higher categories** weaken the equations instead. A strict 2-category has
morphisms between morphisms and still composes on the nose; a bicategory keeps
associativity only up to coherent isomorphism; quasicategories and the other
models of $(\infty,1)$-category carry invertible cells in every dimension. They
buy the settings where nothing composes strictly — homotopy types, derived
categories, cobordisms — and charge for it in coherence.

**Groupoids, multicategories and operads** move the other way, fixing data
rather than loosening it: every arrow invertible, or arrows with many inputs.
Each is narrower and correspondingly better behaved, and the narrowing is the
point.

Genuine competitors exist for particular jobs. For describing algebraic
structure, Lawvere theories, monads and operads are three inequivalent accounts:
a theory is finitary and independent of any presentation by generators and
relations, a monad reaches infinitary operations but no longer corresponds to
equations over a signature, an operad also records how inputs are consumed. For
foundations, a categorical axiomatisation of sets describes them by their
functions rather than by membership and stands against $\mathsf{ZFC}$ in that
role — whereas the size problem above is settled underneath, by choosing
Grothendieck universes or a class–set distinction, which is a decision about set
theory and not a variant of this one.

For the central move, though — characterising an object by the arrows around it
— there is no competing formalism, only the option of declining to make it. The
element-level view is not a rival language but the thing being given up, and
[Model Theory](./model-theory.md) is the page that says what it buys in return.

## History and attribution

Categories, functors and natural transformations were defined together by
**Samuel Eilenberg and Saunders Mac Lane** in "General Theory of Natural
Equivalences" (1945), in the reverse of the order they are now taught. What they
wanted was a precise sense of _natural_ for isomorphisms arising in algebraic
topology; the vector-space double dual noted under _Limitations_ is the example
their paper uses to make the distinction visible. Saying what natural meant
required functors, and that required categories. Their earlier joint work on
group extensions and homology (1942) already used the word informally; 1945 is
where it acquired a definition. Mac Lane's own account of the vocabulary is that
"category" came from Kant and Aristotle by way of philosophy, and "functor" from
Carnap's usage in logical syntax.

For about a decade it was a language rather than a tool and was treated as one.
The alias _general abstract nonsense_ belongs to this period and is usually
credited to Norman Steenrod, affectionately — but as remembered attribution
rather than anything he published, so take that credit as folklore. Homological
algebra changed the standing: Cartan and Eilenberg's book (1956) was written
categorically throughout, and Grothendieck's Tōhoku paper (1957) introduced
abelian categories and the AB axioms, after which the theory produced theorems
instead of restating them.

The results stated above arrived over the following decade. **Daniel Kan**
defined adjoint functors in 1958. The lemma is named for **Nobuo Yoneda** and
named by Mac Lane, who had it from him in conversation in the mid-1950s — which
is exactly why priority is blurry here: the statement is short, its proof is a
line, and pieces of it were in use before anyone thought it needed a name.
Monads are the clearest case of an idea arrived at more than once, as Godement's
"standard construction" of the late 1950s, as the "triples" of the 1960s, and in
the two resolutions into an adjunction found separately by **Kleisli** and by
**Eilenberg and Moore**, both in 1965.

Two later lines matter for the rest of this corpus. **F. William Lawvere**'s
1963 thesis treated algebraic theories as categories and their models as
functors, and he proposed the categorical axiomatisation of sets mentioned above
the year after. The correspondence between cartesian closed categories and typed
lambda calculus is due to **Joachim Lambek** around 1970, and is what
[Proof Theory](./proof-theory.md) draws on. The programming connection is later
and separate: **Eugenio Moggi** used monads for the semantics of effects at the
end of the 1980s, and **Philip Wadler** carried that into functional programming
in the early 1990s — the historical reason Haskell's vocabulary is categorical
although, as argued above, the language does not depend on the theory.

No source cited on this page is a history of mathematics. These are the
attributions this page is confident of; where a date is given as a decade rather
than a year that is deliberate, and what could not be pinned down is left out.

## Sources

The nLab entry covers the definitions, the Yoneda lemma and the size conditions,
and is the fastest way to check how a categorical term is used elsewhere. MIT
18.701 supplies the algebra behind the one-object-category example — monoids,
groups, homomorphisms. Hatcher's _Algebraic Topology_ is where
functoriality earns its keep: the fundamental group and homology are defined
there as functors. The Haskell 2010 Report backs the claim about programming,
specifying the `Functor` and `Monad` classes and their laws with no categorical
machinery.

## Prerequisites and next connections

Read [Set Theory](./set-theory.md) first, far enough to be at ease with
functions, composition and the difference between a set and a proper class; the
size conditions above are meaningless without it. Familiarity with one concrete
structure — groups, or vector spaces — is what makes the abstraction read as a
summary rather than an evasion.

What it opens up: [Proof Theory](./proof-theory.md), where cartesian closed
categories turn proofs into composable arrows;
[Model Theory](./model-theory.md), whose element-level view of a structure is
the sharpest contrast to the arrows-only one; and
[Translation Equivariance](./translation-equivariance.md), which is naturality
for the one-object category of a translation group.
