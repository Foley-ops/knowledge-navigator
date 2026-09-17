---
concept_id: concept.foundations.model_theory
title: Model Theory
slug: /concepts/model-theory
kind: concept
tier: 1
review_state: generated-draft
summary: The branch of mathematical logic that studies which structures satisfy which formal sentences, and what a theory can and cannot pin down about the structures satisfying it.
categories:
  - Mathematics/Foundations
primary_category: Mathematics/Foundations
relationships:
  - type: requires
    target: concept.logic.first_order_logic
    note: Model theory interprets first-order syntax; without the formal language of quantifiers and terms there is nothing for a structure to satisfy.
  - type: contrasts_with
    target: concept.logic.proof_theory
    note: Proof theory studies what is derivable from axioms by rules; model theory studies what is true in structures, and the completeness theorem is the bridge between the two.
  - type: requires
    target: concept.foundations.set_theory
    note: A structure is a set with distinguished relations and functions, and the cardinality arguments behind Lowenheim-Skolem are set-theoretic.
  - type: contributes_to
    target: concept.foundations.computability_theory
    note: Model-theoretic completeness plus a recursive axiomatisation yields decidability, which is how quantifier elimination produces decision procedures for real closed and algebraically closed fields.
sources:
  - source_id: source.plato.model_theory
    title: 'Stanford Encyclopedia of Philosophy: Model Theory'
    url: https://plato.stanford.edu/entries/model-theory/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.plato.classical_logic
    title: 'Stanford Encyclopedia of Philosophy: Classical Logic'
    url: https://plato.stanford.edu/entries/logic-classical/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.plato.proof_theory
    title: 'Stanford Encyclopedia of Philosophy: Proof Theory'
    url: https://plato.stanford.edu/entries/proof-theory/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.plato.set_theory
    title: 'Stanford Encyclopedia of Philosophy: Set Theory'
    url: https://plato.stanford.edu/entries/set-theory/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Model theory** is the study of the satisfaction relation: which structures make
which formal sentences true. Fix a _signature_ $\sigma$ — a list of constant,
function and relation symbols with arities. A $\sigma$-_structure_
$\mathcal{M}$ is a non-empty set $M$ together with an interpretation of every
symbol in $\sigma$ as an element, an operation, or a relation on $M$. A _theory_
$T$ is any set of $\sigma$-sentences. Writing $\mathcal{M} \models T$ says that
every sentence of $T$ is true in $\mathcal{M}$; then $\mathcal{M}$ is a **model**
of $T$. Syntax is the sentences, semantics is the structures, and $\models$ is
the relation between them.

## Why it matters

The map from theories to models is wildly many-to-one, and that is the point.
Because a first-order theory almost never determines a single structure, the
question "does $T$ prove $\varphi$?" acquires a second, geometric answer: build a
model of $T$ in which $\varphi$ fails, and $\varphi$ is not provable. That single
move is how independence is established — non-Euclidean models for the parallel
postulate, models of set theory for the continuum hypothesis — and it is what
distinguishes model theory from proof theory, which studies derivations as
syntactic objects rather than the structures they describe.

## Intuition

A theory is a specification; its models are the implementations. The analogy is
useful but breaks in a specific way: two implementations of a software
specification agree on observable behaviour and differ in cost, whereas two models
of a theory can disagree about sentences the theory never settled. They are not
the same object seen twice; they may be genuinely different mathematics that
happens to satisfy the same axioms. The picture to carry is a theory carving out
a region of structures — and the theorems below say the region is almost always
large.

## Concrete example

Take $\sigma = \{ < \}$ and the theory **DLO** of dense linear orders without
endpoints: $<$ is irreflexive and transitive, any two distinct elements are
comparable, and

$$
\forall x\, \forall y\; \bigl( x < y \rightarrow \exists z\, (x < z \wedge z < y) \bigr),
\qquad
\forall x\, \exists y\, (x < y), \qquad \forall x\, \exists y\, (y < x).
$$

Both $(\mathbb{Q}, <)$ and $(\mathbb{R}, <)$ are models. They are not isomorphic:
$|\mathbb{Q}| = \aleph_0$ while $|\mathbb{R}| = 2^{\aleph_0}$. $(\mathbb{Z}, <)$
is _not_ a model — density fails, since nothing lies between $0$ and $1$.

Now the striking part. Cantor's back-and-forth argument shows any two _countable_
models of DLO are isomorphic, so DLO is $\aleph_0$-categorical; by the
Łoś–Vaught test a theory with no finite models that is categorical in some
infinite cardinal is complete. So DLO decides every $\sigma$-sentence, and
$(\mathbb{Q}, <) \equiv (\mathbb{R}, <)$: the rationals and the reals are
_elementarily equivalent_ as orders, indistinguishable by any first-order sentence
about $<$, while differing in cardinality and in completeness — properties no such
sentence can express.

## Formal treatment

Truth is defined by recursion on formula structure (Tarski). With an assignment
$s$ of domain elements to variables:
$\mathcal{M} \models R(t_1,\dots,t_n)[s]$ iff the tuple of values of the terms
lies in $R^{\mathcal{M}}$; $\mathcal{M} \models \neg\varphi[s]$ iff not
$\mathcal{M} \models \varphi[s]$; and $\mathcal{M} \models \exists x\, \varphi[s]$
iff $\mathcal{M} \models \varphi[s(x \mapsto a)]$ for some $a \in M$. For
sentences the assignment is irrelevant. Write $T \models \varphi$ when every model
of $T$ satisfies $\varphi$, $\mathrm{Th}(\mathcal{M})$ for the set of sentences
true in $\mathcal{M}$, and $\mathcal{M} \equiv \mathcal{N}$ when those sets agree.

Two theorems do most of the work.

**Compactness.** A set of first-order sentences has a model if and only if every
finite subset has one. (Gödel for countable signatures, Malcev in general; over
ZF it needs a weak choice principle, the ultrafilter lemma.)

**Löwenheim–Skolem.** Downward: if $\mathcal{M}$ is infinite and
$X \subseteq M$, there is an elementary substructure
$\mathcal{N} \preceq \mathcal{M}$ with $X \subseteq N$ and
$|N| \le |X| + |\sigma| + \aleph_0$. Upward: a theory with an infinite model has
models of every cardinality $\kappa \ge |\sigma| + \aleph_0$.

The payoff is **non-standard arithmetic**. Let $T = \mathrm{Th}(\mathbb{N})$ in
the language $\{0, S, +, \cdot, <\}$ — every first-order sentence that is actually
true of the natural numbers. Add a fresh constant $c$ and the axioms
$\{\, \bar{n} < c : n \in \mathbb{N} \,\}$, where $\bar{n}$ is the numeral for
$n$. Any finite subset mentions finitely many numerals, so $\mathbb{N}$ itself
satisfies it with $c$ read as a large enough number. By compactness the whole set
has a model $\mathcal{M}$, in which $c$ denotes an element larger than every
numeral. So $\mathcal{M} \equiv \mathbb{N}$ yet $\mathcal{M}$ is not isomorphic to
$\mathbb{N}$. Every countable non-standard model of Peano arithmetic has order
type $\mathbb{N} + \mathbb{Z} \cdot \mathbb{Q}$: a standard initial segment,
followed by copies of the integers arranged densely.

## Assumptions and requirements

Everything above is a theorem about _finitary_ first-order logic, and each
hypothesis earns its place.

**Formulas are finite and quantifiers range over elements.** Allow countable
conjunctions — the infinitary logic $L_{\omega_1\omega}$ — and
$\forall x\, \bigvee_{n \in \mathbb{N}} (x = \bar{n})$ becomes a sentence true of
exactly the standard naturals. Add it to the non-standard construction above and
every finite subset is still satisfied by $\mathbb{N}$, while the whole set has no
model at all: compactness is simply false there, and with it every argument on
this page that builds a structure out of finite approximations.

**The domain is non-empty and every function symbol is total.** Both are
conventions with teeth. Admit the empty structure and
$\forall x\, \varphi \rightarrow \exists x\, \varphi$ stops being valid, which is
why empty domains require the apparatus of free logic rather than a footnote.
Drop totality and terms can fail to denote, so satisfaction is undefined: the
field axioms cannot simply write $x^{-1}$: inversion is carried as a relation, or
$0^{-1}$ is assigned some arbitrary value and the axioms are written around it.

**The cardinality bounds carry $|\sigma|$.** Downward Löwenheim–Skolem promises an
elementary substructure of size $|X| + |\sigma| + \aleph_0$, not a countable one.
Name a constant for every real and the smallest elementary substructure of an
ordered field already has size $2^{\aleph_0}$. "Every infinite structure has a
countable elementary substructure" is a claim about countable signatures only.

**Some choice is required.** Compactness over ZF needs the ultrafilter lemma, as
noted above; downward Löwenheim–Skolem needs to pick a witness for each
satisfied existential, so it needs choice as well, with dependent choice enough
for a countable language. Strip it all away and the basic bridge fails: over ZF
alone a consistent theory need not have a model.

**The property has to be first-order expressible at all.** An axiomatisable class
is closed under elementary equivalence and under ultraproducts, and many classes
you care about are neither: well-orderings, torsion groups, Archimedean ordered
fields, connected graphs. Compactness is the usual proof — add constants with
$c_0 > c_1 > c_2 > \cdots$, satisfy every finite subset inside a genuine
well-order, and conclude that some model of the theory has an infinite descending
chain. If the property is not expressible, no model construction will settle it,
because no sentence was ever at stake.

**The named results carry hypotheses of their own.** The Łoś–Vaught test needs
"no finite models", and not decoratively: the empty theory in the empty signature
is categorical in every infinite cardinal, since any two sets of the same size are
isomorphic, yet it fails to decide $\exists x\, \exists y\, (x \ne y)$ because its
finite models disagree with the rest. DLO passes the test only because density
forces every model to be infinite. Completeness likewise does not by itself
deliver a decision procedure: the recipe needs the axioms to be recursively
enumerable, which is why $\mathrm{Th}(\mathbb{N})$ is complete and still
undecidable, while real closed fields — complete _and_ effectively axiomatised —
give an algorithm.

## Uses and applicability

Reach for model theory when you want to show something is _not_ provable, when you
want to transfer a result between structures, or when you want a decision
procedure. Transfer: the theory of algebraically closed fields of a fixed
characteristic is complete, so a sentence true in $\mathbb{C}$ is true in every
algebraically closed field of characteristic $0$, and a compactness argument
pushes statements from characteristic $p$ up to characteristic $0$ — this is how
Ax–Grothendieck proves every injective polynomial map
$\mathbb{C}^n \to \mathbb{C}^n$ is surjective. Decidability: quantifier
elimination for real closed fields (Tarski) and for Presburger arithmetic gives
algorithms that SMT solvers still implement.

Do not reach for it when the question is about proofs as objects — their length,
their constructive content, what a weaker system can derive. And note that the two
theorems above are theorems about _infinite_ models: finite model theory, the
version relevant to databases and complexity, has neither compactness nor
Löwenheim–Skolem and is a genuinely different subject.

## Limitations and common mistakes

The most common arrival belief is that axioms pin down their subject. They do not:
by upward Löwenheim–Skolem, no first-order theory with an infinite model is
categorical, so "the" natural numbers are not first-order definable up to
isomorphism.

Second, Skolem's paradox. If ZFC has a model it has a countable one, containing an
element the model believes is uncountable. This is not a contradiction: the
bijection that would witness countability exists outside the model, and
"uncountable" is a relative notion. Third, non-standard models are not defects.
A non-standard model of $\mathrm{Th}(\mathbb{N})$ satisfies every true first-order
sentence about $\mathbb{N}$, and even for models of Peano arithmetic alone — which
is incomplete, so they need not agree with $\mathbb{N}$ — no first-order sentence
separates the standard model from all the non-standard ones, so no sentence
detects the infinite elements.

Fourth, do not conflate $\models$ with $\vdash$. Satisfiability and syntactic
consistency are different relations that _happen_ to coincide for first-order
logic, by Gödel's completeness theorem — a result with real content, not a
definition. It fails for second-order logic under full semantics, which is
categorical for $\mathbb{N}$ precisely because it has no complete effective proof
system and no compactness. The power and the tools are traded against each other.

Finally, "model" here is a structure satisfying sentences, not a fitted predictor;
the machine-learning sense of the word is unrelated.

## Variants and alternatives

**Finite model theory** keeps the syntax and admits only finite structures. It
buys the subject a grip on databases and complexity — Fagin's theorem identifies
NP with existential second-order definability — and pays by losing compactness,
completeness and Löwenheim–Skolem at once, so the replacement tools are
combinatorial: zero-one laws and Ehrenfeucht–Fraïssé games instead of ultraproducts
and elementary chains.

**Infinitary logic** $L_{\omega_1\omega}$ buys a Scott sentence for every countable
structure — one sentence pinning that structure down among countable structures,
which first-order logic can never do — and a completeness theorem for countable
fragments; the price is compactness, and so every transfer argument above.

**Second-order logic with Henkin semantics** lets set quantifiers range over a
designated family rather than the full power set. That buys compactness,
completeness and Löwenheim–Skolem back, because the result is many-sorted
first-order logic wearing a disguise, and it costs exactly the categoricity that
was the reason for leaving first-order logic; full semantics makes the opposite
trade, noted above.

**Continuous logic** replaces two truth values with the interval $[0, 1]$ and
structures with bounded metric structures — Banach spaces, probability algebras,
C*-algebras. It buys ultraproducts and compactness for the objects of analysis,
and costs the crisp satisfaction relation: definability becomes uniform
approximability, and equality becomes a metric.

**Boolean-valued models** interpret a sentence as an element of a complete Boolean
algebra rather than as true or false. They buy a presentation of forcing in which
an independence proof is an algebraic computation; they cost nothing and add
nothing in strength, being a repackaging of the same construction rather than a
rival to it. **Kripke models and topos-theoretic semantics** generalise
satisfaction further, to intuitionistic and other non-classical logics, buying
uniformity across logics at the cost of the element-by-element truth definition
that makes the arguments here so direct.

**Stability and classification theory** is less an alternative than the modern
shape of the subject: sort theories by how many models they have and by which
configurations they can define — stable, simple, NIP, o-minimal. It buys genuine
structure theory, with notions of dimension and independence and the applications
to algebraic geometry and number theory that follow, and it costs generality,
since a theory that interprets arithmetic is unstable and the machinery has
nothing to say about it.

The one place where there is no real alternative is the original job. To show
$T \nvdash \varphi$, completeness says that unprovability just _is_ the existence
of a model of $T \cup \{\neg\varphi\}$, so any successful argument produces one at
least implicitly. **Proof theory** is the honest competitor, and it answers
different questions — consistency strength, ordinal analysis, constructive
content, the cost of a derivation — and can reach unprovability without naming a
structure, by cut elimination; it buys what model theory cannot state, at
considerably more labour per theorem.

## History and attribution

**Leopold Löwenheim (1915)** proved, inside Schröder's calculus of relatives, that
a satisfiable first-order sentence has a countable model. He was not studying
models in the later sense; the question was one about the algebra of relations.

**Thoralf Skolem** repaired and extended the proof through the 1920s, introducing
the normal form and the choice functions that carry his name, and in a 1922
address to the Scandinavian mathematicians drew the conclusion he cared about:
since the axioms of set theory have a countable model, their notions are
_relative_. He meant this as an objection to set theory as a foundation, not as a
paradox awaiting dissolution.

**Kurt Gödel** proved completeness in his 1929 dissertation, published in 1930,
answering a question Hilbert and Ackermann had put in print in 1928; compactness
for countable languages falls out of the proof. Skolem's papers of the 1920s
contain a great deal of the argument, and why he did not state the theorem is a
standing question in the historical literature — but the result and its
formulation are Gödel's. **Anatoly Mal'tsev (1936)** removed the countability
restriction from compactness and, characteristically, spent it on group theory:
local theorems, where a property of every finitely generated subgroup becomes a
property of the group.

**Alfred Tarski** gave the recursive definition of satisfaction in _The Concept of
Truth in Formalized Languages_ (Polish 1933, German 1935), as an analysis of truth
and the semantic paradoxes rather than as a tool for algebra. His
quantifier-elimination decision procedure for real closed fields was done in the
1930s and published only in 1948, as a RAND report; Presburger, out of the same
Warsaw seminar, had settled the additive fragment of arithmetic in 1929. The
subject took its name from Tarski's Berkeley school, whose _Contributions to the
theory of models_ appeared in 1954–55. Whether Tarski's 1936 account of logical
consequence already is the modern model-theoretic one, with the domain varying
from model to model, is genuinely contested among historians of logic; the dispute
concerns what the 1936 paper says, not which reading is preferable.

**Abraham Robinson**, from the late 1940s, pushed the other way — logic as an
instrument for algebra, giving model completeness and model-theoretic proofs of
field-theoretic results — and in 1961 turned the same compactness machinery on
infinitesimals, producing non-standard analysis, published as a book in 1966.
Robinson and Tarski reached the algebraic side of the subject largely
independently, which is why so much of its vocabulary exists in two versions.
**Jerzy Łoś (1955)** established the fundamental theorem on ultraproducts; the
test used above is named for work Łoś and **Robert Vaught** did independently in
the mid-1950s. **Michael Morley (1965)** proved that a countable theory
categorical in one uncountable cardinal is categorical in all of them, answering a
conjecture of Łoś, and that proof more than any other result turned a collection
of techniques into classification theory, which **Saharon Shelah** built out from
the early 1970s.

One caution about the example above: the uniqueness of the countable dense linear
order is Cantor's, from 1895, but the symmetric back-and-forth presentation the
argument now carries is a later refinement, and its attribution is not settled.

## Sources

The Stanford Encyclopedia entry on **Model Theory** is the short orientation to
structures, satisfaction and what the classical theorems buy; **Classical Logic**
states the Tarskian semantics, completeness, compactness and Löwenheim–Skolem
precisely. **Proof Theory** is the other half of the contrast drawn here. **Set
Theory** supplies the cardinal arithmetic behind Löwenheim–Skolem and the
independence results that model construction establishes.

## Prerequisites and next connections

Read first-order logic first — signatures, terms, quantifiers, free and bound
variables — because model theory is the semantics of exactly that language.
[Propositional Logic](./propositional-logic.md) is the smaller case, where a truth
assignment already does the job a structure does here, and
[Set Theory](./set-theory.md) supplies the cardinals and the sets-with-relations
that every structure is built from.

From here the natural next steps are the completeness theorem and its
proof-theoretic half, where derivability and consequence are shown to coincide;
[Computability Theory](./computability-theory.md), where a complete recursively
axiomatised theory becomes a decision procedure and Gödel's incompleteness
theorems mark the limit; and set theory itself, where forcing builds models of
ZFC that disagree about the continuum hypothesis.
