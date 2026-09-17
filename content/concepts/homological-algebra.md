---
concept_id: concept.algebra.homological_algebra
title: Homological Algebra
slug: /concepts/homological-algebra
aliases:
  - chain complex theory
kind: concept
tier: 1
review_state: generated-draft
summary: The study of chain complexes — sequences of maps whose consecutive composites vanish — and of the homology groups that measure exactly how far such a sequence is from being exact, turning questions of solvability and obstruction into computable invariants.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.algebra.ring_theory
    note: A chain complex is a complex of modules over a ring, and the ring controls what homology can look like — over a field it is a dimension count, over the integers it carries torsion.
  - type: generalizes
    target: concept.linear_algebra.vector_spaces
    note: For a complex of vector spaces homology is nothing but rank–nullity bookkeeping; homological algebra is what survives that bookkeeping when the modules are not free.
  - type: contributes_to
    target: concept.foundations.category_theory
    note: Categories, functors and natural transformations were introduced to say precisely what it means for the maps arising in homology to be natural, and abelian categories were axiomatised to carry homological arguments.
  - type: contributes_to
    target: concept.algebra.group_theory
    note: Group cohomology is homological algebra applied to modules over a group ring, and its low-degree groups classify group extensions.
sources:
  - source_id: source.hatcher.algebraic_topology
    title: Allen Hatcher, Algebraic Topology
    url: https://pi.math.cornell.edu/~hatcher/AT/ATpage.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebraic_topology
    title: MIT 18.905 Algebraic Topology I (Fall 2016)
    url: https://ocw.mit.edu/courses/18-905-algebraic-topology-i-fall-2016/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_ii
    title: MIT 18.702 Algebra II (Spring 2011)
    url: https://ocw.mit.edu/courses/18-702-algebra-ii-spring-2011/
    source_kind: lecture-or-course
    supports:
      - definition
    checked_on: 2026-09-17
  - source_id: source.nlab.category_theory
    title: 'nLab: category theory'
    url: https://ncatlab.org/nlab/show/category+theory
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
    checked_on: 2026-09-17
unresolved_references:
  - label: Persistent homology
    reason: The page states the interval decomposition over a field, the bottleneck stability bound, the cubic reduction algorithm and the multiparameter non-classification, but no page in this corpus covers persistent homology and docs/source-registry.json holds no topological data analysis source, so those statements are cited to nothing.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Homological algebra** is the algebra of chain complexes. A chain complex over
a ring $R$ is a sequence of $R$-modules and maps

$$
\cdots \xrightarrow{\;d_{n+2}\;} C_{n+1} \xrightarrow{\;d_{n+1}\;} C_n
\xrightarrow{\;d_{n}\;} C_{n-1} \xrightarrow{\;d_{n-1}\;} \cdots
$$

subject to one condition, $d_n \circ d_{n+1} = 0$ for every $n$. That condition
says exactly that $\operatorname{im} d_{n+1} \subseteq \ker d_n$, and the
**homology** of the complex is the quotient that measures how much room is left
between them:

$$
H_n(C_\bullet) \;=\; \ker d_n \,/\, \operatorname{im} d_{n+1}.
$$

The complex is **exact** at $n$ when $H_n = 0$. So homology is the precise
failure of exactness, and the subject is the systematic study of that failure.

## Why it matters

Exactness is how algebra states solvability. "Every element of $\ker d_n$ is
$d_{n+1}$ of something" says a certain equation always has a solution; when it
does not, $H_n$ is the group of obstructions — an object you can compute with
rather than a bare "no". That is why homology separates a disc from an annulus
and tells you which group extensions exist.

The second payoff is transfer: a short exact sequence relating three complexes
produces a _long_ exact sequence relating their homologies, so an unknown
invariant is pinned down by two known ones. Most computations in algebraic
topology, sheaf cohomology and commutative algebra are that move.

## Intuition

Read $d \circ d = 0$ as "the boundary of a boundary is empty". The boundary of a
filled triangle is its three edges; the boundary of that edge loop is nothing,
because each vertex is picked up once positively and once negatively. Boundaries
are therefore automatically cycles, and homology asks the remaining question:
which cycles are _not_ boundaries? Those are the holes. The same picture appears
in [Vector Calculus](./vector-calculus.md), where
$\operatorname{curl} \circ \operatorname{grad} = 0$ and the failure of a
curl-free field to be a gradient is a homology class of the domain.

The analogy breaks twice over. Homology counts nothing over a general ring:
$H_1(\mathbb{RP}^2;\mathbb{Z}) = \mathbb{Z}/2$, a hole you can traverse twice
and get nothing. And in group cohomology or Ext there is no space and no hole;
the geometry is gone and only the bookkeeping is left.

## Concrete example

Take the hollow triangle: vertices $v_0, v_1, v_2$ and the three edges between
them. Set $C_1 = \mathbb{Z}^3$ on the edges, $C_0 = \mathbb{Z}^3$ on the
vertices, everything else zero, and $d_1[v_i, v_j] = v_j - v_i$. In the bases
$([v_0v_1], [v_0v_2], [v_1v_2])$ and $(v_0, v_1, v_2)$,

$$
d_1 = \begin{bmatrix} -1 & -1 & 0 \\ 1 & 0 & -1 \\ 0 & 1 & 1 \end{bmatrix}.
$$

The third column is the second minus the first, so the rank is $2$ and the
kernel is generated by $z = [v_0v_1] - [v_0v_2] + [v_1v_2]$ — the loop around
the triangle. Hence $H_1 = \mathbb{Z}z / 0 = \mathbb{Z}$, and
$H_0 = \mathbb{Z}^3 / \langle v_1 - v_0,\, v_2 - v_0 \rangle = \mathbb{Z}$: one
component, one hole.

Now fill the triangle in: add $C_2 = \mathbb{Z}$ on the face with
$d_2[v_0v_1v_2] = [v_1v_2] - [v_0v_2] + [v_0v_1] = z$. The axiom checks out,
$d_1 d_2 = (v_1 - v_0) - (v_2 - v_0) + (v_2 - v_1) = 0$, and now
$\operatorname{im} d_2 = \ker d_1$, so $H_1 = 0$, while $\ker d_2 = 0$ gives
$H_2 = 0$. Filling the hole killed the class, which is what an invariant of
holes had better do.

A second computation, with no geometry in it. Resolve $\mathbb{Z}/2$ by frees,
$0 \to \mathbb{Z} \xrightarrow{\times 2} \mathbb{Z} \to \mathbb{Z}/2 \to 0$, and
apply $- \otimes_{\mathbb{Z}} \mathbb{Z}/2$ to the two-term complex
$\mathbb{Z} \xrightarrow{\times 2} \mathbb{Z}$: multiplication by $2$ becomes
the zero map $\mathbb{Z}/2 \to \mathbb{Z}/2$, so
$\operatorname{Tor}_1^{\mathbb{Z}}(\mathbb{Z}/2, \mathbb{Z}/2) = \mathbb{Z}/2$ —
the exact amount by which tensoring destroyed exactness.

## Formal treatment

Fix a ring $R$ with unit and work with left $R$-modules. Write
$Z_n = \ker d_n$ (**cycles**), $B_n = \operatorname{im} d_{n+1}$
(**boundaries**), so $B_n \subseteq Z_n$ and $H_n = Z_n / B_n$. A **chain map**
$f_\bullet : C_\bullet \to D_\bullet$ is a family $f_n$ with
$d_n^D f_n = f_{n-1} d_n^C$; it carries cycles to cycles and boundaries to
boundaries, so it induces $H_n(f) : H_n(C) \to H_n(D)$, functorially.

The central theorem is the long exact sequence. A short exact sequence of chain
complexes $0 \to A_\bullet \to B_\bullet \to C_\bullet \to 0$, exact in each
degree, has **connecting homomorphisms** $\partial : H_n(C) \to H_{n-1}(A)$,
natural in the sequence, making

$$
\cdots \to H_n(A) \to H_n(B) \to H_n(C) \xrightarrow{\;\partial\;}
H_{n-1}(A) \to H_{n-1}(B) \to \cdots
$$

exact everywhere. The construction of $\partial$ is the snake lemma: lift a
cycle of $C_n$ to $B_n$, apply $d$, observe the result comes from $A_{n-1}$, and
check the class is independent of the lift. Every step is a diagram chase.

**Derived functors** answer the next question: an additive functor $F$ need not
preserve exactness, so how badly does it fail? For right exact $F$ — the case
$- \otimes_R M$ — choose a projective resolution $P_\bullet \to A$, apply $F$
degreewise, and set $L_n F(A) = H_n(F(P_\bullet))$. The comparison theorem makes
any two resolutions chain homotopy equivalent, so this is independent of the
choice up to natural isomorphism, and $L_0 F = F$. Then
$\operatorname{Tor}^R_n(A, B) = L_n(- \otimes_R B)(A)$; dually, injective
resolutions and the left exact $\operatorname{Hom}_R(A, -)$ give
$\operatorname{Ext}^n_R(A, B)$. Each short exact sequence of modules then yields
a long exact sequence of derived functors whose first term is exactly the
correction to $F$'s exactness.

## Assumptions and requirements

Everything above needs a category where kernels, cokernels and images exist and
behave: an **abelian category**. Modules over a ring are the model case, as are
sheaves of modules. Non-abelian groups do not qualify, which is why group
homology goes through modules over the group ring $\mathbb{Z}G$ rather than
quotienting non-abelian chains.

Derived functors need **enough projectives** (on the left) or **enough
injectives** (on the right). Module categories have both — every module is a
quotient of a free one — but sheaves generally lack enough projectives, which is
why sheaf cohomology is built from injective resolutions.

Drop $d \circ d = 0$ and there is nothing to define: $B_n$ need not sit inside
$Z_n$. The long exact sequence requires exactness in every degree, not merely at
the ends. And the interval decomposition behind persistent homology requires
**field** coefficients; over $\mathbb{Z}$ the structure theorem does not apply.

## Uses and applicability

Reach for it when a question is about the gap between "locally solvable" and
"globally solvable", or when you need an obstruction you can compute. Singular
and simplicial homology, sheaf cohomology, group cohomology (where $H^2(G; M)$
classifies extensions of $G$ by $M$), Koszul complexes in commutative algebra
and Ext quivers in representation theory are one machine pointed at different
module categories.

It is the wrong tool when no abelian category is in sight, when a direct
invariant already separates your objects, or when you cannot write down a
resolution you can compute with — the theory guarantees resolutions exist, not
that they are finite or small.

## Limitations and common mistakes

Homology is lossy by design. It does not determine homotopy type: the Poincaré
homology sphere has the homology of $S^3$ and is not simply connected.

Three confusions recur. First, $d \circ d = 0$ is not exactness — every complex
satisfies it, and exactness is the strictly stronger claim $H_n = 0$. Second, a
quasi-isomorphism (an isomorphism on all homology) is a chain homotopy
equivalence only under hypotheses, such as between bounded-below complexes of
projectives. Third, indexing and sign conventions for $\partial$ differ between
texts; those are conventions, not theorems, and comparing two books' long exact
sequences without checking them wastes an afternoon.

Persistent homology needs its own warning. Its stability theorem is real — the
bottleneck distance between barcodes is bounded by the sup-norm distance between
the filtration functions — but a barcode is not a complete invariant of the
data, the standard reduction algorithm is cubic in the number of simplices in
the worst case, the multiparameter version admits no comparable classification,
and a long bar is evidence of a persistent feature of the filtration, not proof
of meaningful structure in the phenomenon underneath it.

## Variants and alternatives

**Cochain complexes** index upwards with $d$ raising degree; cohomology carries
a cup product and so is a ring, which homology is not, and that extra structure
often decides a computation. **Spectral sequences** compute homology in stages
from a filtration: powerful, but they converge to an associated graded object
and leave extension problems behind. **Derived categories** (Grothendieck and
Verdier) formally invert quasi-isomorphisms, buying functoriality and a
triangulated structure at the cost of direct computability, and **model
categories, dg-categories and stable $\infty$-categories** subsume the whole
story in a homotopical framework. **Persistent homology** applies the machinery
to a filtered family of complexes at once and outputs a barcode; it is the
descendant topological data analysis actually runs. Coarser and finer
competitors both exist: the Euler characteristic is the alternating sum of Betti
numbers, cheaper and weaker, and homotopy groups are finer and far harder.

## History and attribution

Homology begins with Poincaré's _Analysis Situs_ (1895), where Betti numbers are
attached to manifolds as numbers; torsion coefficients follow in the _Second
Complement_ (1900). Emmy Noether's insistence in the 1920s that these were
invariants of abelian _groups_ is what turned the subject into algebra. Eilenberg and Mac Lane introduced categories,
functors and natural transformations in 1945 to say precisely what was natural
about the maps appearing here; Cartan and Eilenberg's _Homological Algebra_
(1956) named and unified the field around derived functors, Ext and Tor;
Grothendieck's 1957 Tôhoku paper recast it in abelian categories, making sheaf
cohomology available; and Verdier's derived categories followed in the 1960s.
Persistent homology is far more recent, with independent precursors in the 1990s
and the papers of Edelsbrunner, Letscher and Zomorodian (2002) and Zomorodian
and Carlsson (2005) establishing the form used today.

## Sources

Hatcher's _Algebraic Topology_ is the standard free reference for chain
complexes, explicit simplicial computations, the long exact sequence and its
snake-lemma proof, and — in Chapter 3 — Ext, Tor and the universal coefficient
theorem. MIT 18.905 covers the same core as a lecture course. MIT 18.702
supplies the ring and module background the definitions assume, and MathWorld is
a quick lookup for terminology such as exact sequence and derived functor. The
nLab entry is what backs the categorical hypotheses above: abelian categories,
and having enough projectives or injectives for derived functors to exist. No
source cited here covers persistent homology, so the interval decomposition, the
stability bound and the complexity claims made about it are standard in the
topological data analysis literature but verified against nothing on this page.

## Prerequisites and next connections

Come with [Vector Spaces](./vector-spaces.md) and with modules over a ring from
[Ring Theory](./ring-theory.md): the definitions are linear algebra where
division is unavailable, and almost every difficulty traces back to that.
Reducing an integer matrix to Smith normal form, as in
[Matrix Theory](./matrix-theory.md), is what makes the homology of a finite
complex of free abelian groups computable, torsion included.

Next, [Category Theory](./category-theory.md): functoriality and naturality are
not decoration here, they are what makes derived functors well defined. Group
cohomology turns the machinery back on [Group Theory](./group-theory.md), and
the applied direction leads to persistent homology and topological data
analysis, which no page in this corpus yet covers.
