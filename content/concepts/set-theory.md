---
concept_id: concept.foundations.set_theory
title: Set Theory
slug: /concepts/set-theory
aliases:
  - axiomatic set theory
kind: concept
tier: 1
review_state: generated-draft
summary: The study of collections under a single membership relation, rebuilt on explicit axioms after naive comprehension turned out to be contradictory, and now the standard foundation in which most other mathematics can be encoded.
categories:
  - Mathematics/Foundations
primary_category: Mathematics/Foundations
relationships:
  - type: requires
    target: concept.logic.first_order_logic
    note: ZFC is stated as a first-order theory with one binary relation symbol, and two of its axioms are schemas over first-order formulas.
  - type: prerequisite_of
    target: concept.analysis.real_analysis
    note: Real analysis works with a set of reals whose existence, completeness and uncountability are set-theoretic facts about that construction.
  - type: contributes_to
    target: concept.foundations.model_theory
    note: Independence results are proved by constructing models of the axioms, so the questions set theory cannot settle internally are settled model-theoretically.
  - type: contrasts_with
    target: concept.foundations.category_theory
    note: Both are offered as foundations, but one identifies objects by what they contain and the other by the maps between them.
sources:
  - source_id: source.plato.set_theory
    title: 'Stanford Encyclopedia of Philosophy: Set Theory'
    url: https://plato.stanford.edu/entries/set-theory/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.tao.analysis_i
    title: Terence Tao, Analysis I
    url: https://terrytao.wordpress.com/books/analysis-i/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.plato.model_theory
    title: 'Stanford Encyclopedia of Philosophy: Model Theory'
    url: https://plato.stanford.edu/entries/model-theory/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mathlib.community
    title: Lean mathlib community documentation
    url: https://leanprover-community.github.io/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nlab.category_theory
    title: 'nLab: category theory'
    url: https://ncatlab.org/nlab/show/category+theory
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Set theory** studies collections under one primitive relation, $x \in A$
("$x$ is an element of $A$"), and one identity criterion, **extensionality**:

$$
A = B \;\iff\; \forall x\,(x \in A \leftrightarrow x \in B).
$$

A set is therefore nothing but its members: no order, no repetition, no
structure of its own. **Naive set theory** takes _unrestricted comprehension_ —
for any property $P$, the collection $\{x : P(x)\}$ is a set. **Axiomatic set
theory** replaces that with axioms stating exactly which sets exist, the
standard list being Zermelo–Fraenkel with Choice (ZFC). The split exists because
naive comprehension is not merely risky but inconsistent.

## Why it matters

Set theory does two jobs. It is a universal encoding: ordered pairs, functions,
$\mathbb{N}$, $\mathbb{R}$, groups and measure spaces are all definable as sets,
so "does this object exist?" and "is this argument legitimate?" become questions
about one short axiom list. It is also where the limits of that reduction showed
up: the same subject proves that a natural question — how many real numbers
there are — gets no answer from the axioms.

## Intuition

The working picture is the **cumulative hierarchy**: sets are built in stages
from nothing. $V_0 = \emptyset$; $V_{\alpha+1} = \mathcal{P}(V_\alpha)$, all
subsets of what you have; at a limit stage, the union of everything below. Every
set appears at some stage, and its members appear strictly earlier.

That one rule explains most of what feels strange: there is no set of all sets,
because it would have to appear after every stage, and no set is a member of
itself, because a member is always older. Think of a library where a book may
cite only books written earlier. The analogy breaks at the indexing: the stages
are numbered by ordinals, which are themselves sets, so this describes the
axioms from inside rather than a procedure you could run.

## Concrete example

Run Russell's paradox. Under unrestricted comprehension, form
$R = \{x : x \notin x\}$ and ask whether $R \in R$. Either answer refutes
itself: if $R \in R$ then $R$ meets the membership condition $x \notin x$, so
$R \notin R$; if $R \notin R$ then it meets that condition, so $R \in R$. Hence
$R \in R \leftrightarrow R \notin R$, a contradiction
from no extra assumptions: naive set theory is inconsistent, and everything is
provable in it.

ZFC's repair is **Separation**: a property does not conjure a set, it only
carves a subset out of a set you already have, $\{x \in A : P(x)\}$. Rerun
Russell under that restriction. For any set $A$, put
$R_A = \{x \in A : x \notin x\}$; if $R_A \in A$ then $R_A \in R_A
\leftrightarrow R_A \notin R_A$, so $R_A \notin A$. The paradox has become a
theorem: no set contains everything.

Encoding is equally concrete. Von Neumann's numerals are $0 = \emptyset$,
$1 = \{\emptyset\}$, $2 = \{\emptyset, \{\emptyset\}\}$, with
$n+1 = n \cup \{n\}$, so each $n$ has exactly $n$ elements and $m < n$ means
$m \in n$. Kuratowski's $(a,b) = \{\{a\},\{a,b\}\}$ then gives ordered pairs,
and functions follow as sets of pairs.

## Formal treatment

ZFC is a first-order theory with equality whose only non-logical symbol is
$\in$. Its axioms are Extensionality, Pairing, Union, Power Set, Infinity,
Foundation, Choice, and the schemas of Separation and Replacement — _schema_
meaning one axiom per formula, so ZFC has infinitely many axioms and, if it is
consistent, no finite subset axiomatises it: a theorem, not a convention.

Cardinality is comparison by bijection: $|A| = |B|$ when a bijection $A \to B$
exists, $|A| \le |B|$ when an injection does. **Cantor's theorem** says
$|A| < |\mathcal{P}(A)|$ for every set $A$. Proof: let
$f : A \to \mathcal{P}(A)$ be any function and put

$$
D = \{a \in A : a \notin f(a)\}.
$$

Then $D \subseteq A$, so $D \in \mathcal{P}(A)$. If $D = f(a_0)$ for some
$a_0 \in A$, then $a_0 \in D \leftrightarrow a_0 \notin f(a_0) = D$, a
contradiction. So no $f$ is surjective, while $a \mapsto \{a\}$ is injective.
Take $A = \mathbb{N}$ and read subsets as binary sequences: $D$ is the sequence
built by flipping the $n$-th digit of the $n$-th sequence — the diagonal
argument, and the reason $\mathbb{R}$ is uncountable.

Write $\aleph_0 = |\mathbb{N}|$ and $2^{\aleph_0} = |\mathbb{R}|$; the
**Continuum Hypothesis** (CH) says no cardinality lies strictly between them.
Gödel (1938) built the constructible universe $L$, an inner model of ZF in which
Choice and CH both hold, so neither is refutable from ZF. Cohen (1963) invented
forcing and built models of ZFC where CH fails and models of ZF where Choice
fails, so neither is provable. **Independence** means exactly that: if ZF is
consistent, ZF proves neither AC nor its negation, and ZFC proves neither CH nor
its negation — conditional, always, on a consistency that by Gödel's second
incompleteness theorem ZFC cannot establish about itself.

## Assumptions and requirements

The axioms are the assumptions, and they do not stand or fall together. Most of
the results above need some of them and not others, and knowing which needs what
is what tells you whether an argument survives a move to a weaker or stranger
theory. Remove Infinity and $V_\omega$ models everything left; that theory is
mutually interpretable with Peano arithmetic, so every distinctively
set-theoretic phenomenon here rests on the assumption that a completed infinite
collection is itself an object.

**Classical logic underneath.** Excluded middle is available in every proof,
including the ones that produce an object by refuting its non-existence.
Intuitionistic set theories drop it and keep more than one would expect —
Cantor's diagonal argument is constructive and survives intact. What does not
survive is Choice as a harmless addition: given Extensionality and Separation,
Choice _entails_ excluded middle (Diaconescu's theorem), so a constructive set
theory cannot quietly help itself to it.

**Replacement is load-bearing, and not only at exotic heights.** Drop it and
$V_{\omega+\omega}$ models everything remaining, which suffices for nearly all
of ordinary mathematics; what goes is any set assembled by a transfinite
recursion longer than the stages already in hand, beginning with the union of
$\mathbb{N}, \mathcal{P}(\mathbb{N}), \mathcal{P}(\mathcal{P}(\mathbb{N})),
\ldots$. The loss is not confined to large objects. Borel determinacy is a
statement about sets of reals that $V_{\omega+\omega}$ already contains, it is
true, and Harvey Friedman showed it is unprovable without Replacement: Martin's
proof climbs $\omega_1$ power sets to reach a conclusion about objects sitting
far below them.

**Foundation, and what it quietly pays for.** Foundation is what makes the
cumulative picture exhaustive rather than merely available, and with it comes
definition and proof by recursion on rank — the warrant behind most
set-theoretic constructions. Drop it and an anti-foundation axiom is
equiconsistent with ZF; sets satisfying $x = \{x\}$ then exist and are useful
for modelling streams and bisimulation rather than being pathologies, but rank
recursion is gone. Foundation also does unadvertised work: it is what lets you
define $|A|$ as a set, via Scott's trick, when no well-ordering is available.

**Choice as a tracked hypothesis, not a background assumption.** Cantor's
theorem above uses none of it, and neither does Cantor–Schröder–Bernstein.
Comparability does: that for any $A$ and $B$ either $|A| \le |B|$ or
$|B| \le |A|$ is _equivalent_ to Choice over ZF. Without it cardinals need not be
linearly ordered and the continuum need not be an aleph at all, so "how many
reals are there" is already awkward before independence is reached; with it,
$|A|$ is simply the least ordinal in bijection with $A$.

**Purity: everything is a set.** There are no urelements, no atoms that have
members but are not themselves collections; membership bottoms out at
$\emptyset$. Mathematics needs no atom, but the assumption was not free
historically. Fraenkel's permutation models, the first proof that Choice is
unprovable, required atoms, and so established the result only for set theory
with them; pure ZF had to wait for Cohen.

**Consistency strength is imported, never earned.** ZFC does not prove that any
_set_ is a model of ZFC. To get one, you need an inaccessible cardinal $\kappa$,
and then $V_\kappa \models \mathrm{ZFC}$ — an assumption strictly stronger than
the consistency of ZFC, and therefore not obtainable from it. This is the
requirement a category theorist takes on when reaching for a Grothendieck
universe to make "the set of all small sets" legitimate: the convenience is
bought with a large-cardinal axiom.

## Uses and applicability

Reach for it when existence is the question: whether a construction is
legitimate, whether two infinite collections are comparable in size, or which
choice principle an argument silently used. Zorn's lemma — equivalent to AC over
ZF — is what supplies maximal ideals and bases for infinite-dimensional vector
spaces, and AC also produces non-measurable sets, so measure theory has to know
it is there.

Do not reach for it as working practice. No analyst unfolds $\pi$ into von
Neumann ordinals: the encoding is an existence proof, not a method, and its
arbitrary choices produce junk theorems such as the truth of "$2 \in 3$", an
artefact of the coding rather than arithmetic. Lean's mathlib instead formalises
a large body of mathematics on dependent type theory, where that question is not
even well-formed.

## Limitations and common mistakes

**"Russell's paradox broke mathematics."** It refuted unrestricted
comprehension, which ordinary mathematics never needed; ZFC keeps the useful
constructions and blocks the paradox.

**Confusing independence with ignorance.** A sentence independent of ZFC is not
an open problem awaiting a cleverer proof, nor undecidable in the computability
sense: it is settled that the axioms do not settle it. Whether CH has a
determinate truth value anyway is contested — large-cardinal, forcing-axiom and
inner-model programmes disagree.

**Treating AC as exotic.** It is standard in mainstream mathematics, and
finitely many choices are already a theorem of ZF; the axiom is needed only for
infinitely many simultaneous ones. Its cost is non-constructivity —
Banach–Tarski is the famous consequence — which is why constructive schools
reject it.

**Reading "uncountable" as "enormous."** It means only that no bijection with
$\mathbb{N}$ exists. Because ZFC is first-order, Löwenheim–Skolem gives it
countable models if it has any model at all, and in one of those
"$\mathcal{P}(\mathbb{N})$ is uncountable" holds internally while the model is
countable from outside — Skolem's paradox, which makes "uncountable" relative to
the functions a model contains.

**Assuming ZFC is the foundation.** It is _a_ foundation, the most widely
assumed. Type-theoretic foundations are a live alternative, used by most modern
proof assistants, and categorical ones exist too; they are not drop-in
equivalents, and choosing between them is a matter of purpose, not correctness.

## Variants and alternatives

Within the membership picture, the variants are what you add or subtract.
**ZF alone**, with Choice removed, is the honest setting for asking which
theorems depend on it; push further to the **Axiom of Determinacy** and every
set of reals becomes Lebesgue measurable and the Choice-driven pathologies
vanish — bought at the price of contradicting Choice outright, so AD is studied
as the theory of the inner model $L(\mathbb{R})$ rather than as a replacement
for the universe. **Class theories** go the other way and make proper classes
objects: NBG adds them, is finitely axiomatisable, and proves exactly the same
theorems about sets as ZFC, so "the class of all groups" costs nothing but
vocabulary; Morse–Kelley strengthens class comprehension to impredicative and
proves the consistency of ZFC, so it costs real strength.

**Sharpenings that decide things** are the interesting extensions. $V = L$
settles CH affirmatively and much of the rest of combinatorics with it, at the
cost of ruling out measurable cardinals (Scott). Forcing axioms push the
opposite way: the Proper Forcing Axiom implies $2^{\aleph_0} = \aleph_2$ and
brings a rich structure theory, at the cost of a supercompact-level consistency
assumption. Large cardinals buy the linear scale on which consistency strengths
are compared, and settle projective statements, but by the Lévy–Solovay theorem
they cannot settle CH: small forcing preserves them, so CH stays independent
however large the cardinal. **Quine's New Foundations** is the one genuine
alternative diagnosis of Russell's paradox — comprehension is restricted by
stratification rather than by stage, so $x \notin x$ is simply ill-formed and a
universal set is legitimate. It buys a universe with a top; it costs a great
deal, since Specker showed NF refutes Choice, its consistency resisted proof for
decades and was settled only recently and with machine assistance, and the
well-behaved variant NFU regains Choice only by readmitting urelements.

The genuinely different approaches abandon membership. **Structural set
theory**, Lawvere's ETCS, axiomatises sets and functions instead: an element is
a map from a one-point set, there is no global $\in$, and asking whether one set
is an element of another is not expressible. It buys isomorphism-invariance by
construction; as stated it costs strength, being no stronger than a bounded form
of Zermelo set theory with Choice until a replacement scheme is added.
Elementary toposes generalise that into a whole landscape of universes — sheaves,
realisability models — each carrying an intuitionistic internal logic, which
buys a plurality of mathematical worlds at the price of classical reasoning
inside any one of them. **Dependent type theory** is the alternative
with the largest working constituency: propositions are types and proofs are
terms, so checking a proof is type-checking, and mathlib is the evidence it
scales. It costs the primitiveness of equality — quotients, function
extensionality and truncation have to be assumed or constructed — and classical
mathematics arrives only once excluded middle and Choice are added as axioms,
which mathlib does.

None of this is a choice between a correct foundation and mistaken ones; each is
adequate for ordinary mathematics and each makes different things cheap. What no
alternative removes is the obstructions: Cantor's theorem, incompleteness and
the hierarchy of consistency strengths reappear in every one of them,
reformulated rather than escaped.

## History and attribution

Set theory has a founder, and he was not looking for one. **Georg Cantor**
created it in the 1870s while working on the uniqueness of trigonometric-series
representations; asking which sets of exceptional points still leave a
uniqueness theorem standing led him to iterate the "derived set" operation past
every finite stage, and the first transfinite ordinals arrived as indices for
that iteration. In 1874 he proved the algebraic numbers countable and the reals
not — by nested intervals; the diagonal argument came only in 1891 — and in 1878
he stated the Continuum Hypothesis, which Hilbert made the first of his 1900
problems. **Richard Dedekind** worked alongside him and contributed, in _Was
sind und was sollen die Zahlen?_ (1888), the definition of an infinite set as
one in bijection with a proper part, together with the recursion theorem.
Bolzano's posthumous _Paradoxien des Unendlichen_ (1851) is the nearest genuine
precursor.

The paradoxes were not one shock but several, and priority is properly
contested. Burali-Forti published the ordinal paradox in 1897; Cantor had
already written to Dedekind in 1899 about the trouble with the collection of all
cardinals; **Bertrand Russell** found his argument in 1901 and sent it to Frege
in 1902. **Ernst Zermelo** had found the same argument independently and
slightly earlier in Hilbert's Göttingen circle and never published it — the
evidence for that is secondhand, so "before 1902" is as precise as the
attribution should get.

Axiomatisation was driven as much by defence as by repair. Zermelo's 1904 proof
that every set can be well-ordered made Choice explicit and provoked immediate
objection, and his 1908 axiom system was written to show exactly what the proof
had used, as well as to block the paradoxes. It left "definite property"
undefined; **Thoralf Skolem** fixed it as a first-order formula in 1922, and in
that same year Skolem and **Abraham Fraenkel** independently proposed
Replacement — the second case on this page of one idea arriving twice, and the
third is **Kuratowski**'s ordered pair of 1921, anticipated by Norbert Wiener in 1914. **John von Neumann** supplied the ordinals as sets of their predecessors
(1923) and, following Mirimanoff, the well-founded picture of the universe;
Zermelo's 1930 paper gave the $V_\alpha$ hierarchy and the inaccessible
cardinals in the form still used. Who first wrote the axiom list in exactly its
modern shape is not attributable to one person — "ZFC" names a consensus that
settled gradually, and the term _naive set theory_ owes its currency to Halmos's
1960 textbook of that name.

The two independence results came from opposite directions. Gödel's
constructible universe extended his own work on incompleteness and arrived from
within logic; forcing came from Paul Cohen, who approached the continuum problem
from outside the field, and won the Fields Medal for it in 1966 — still the only
one given for work in logic.

## Sources

The Stanford Encyclopedia entry on set theory is the best single orientation to
the axioms, the paradoxes and the independence results. Tao's _Analysis I_
develops the axioms a working analyst uses and builds the number systems from
them, comprehension restricted and cardinality put to work. The Stanford entry
on model theory supplies the model-theoretic meaning of independence and the
Löwenheim–Skolem machinery behind Skolem's paradox. Lean's mathlib
documentation shows serious mathematics formalised on a non-set-theoretic
foundation. The nLab entry on category theory is the reference for the
structural and topos-theoretic foundations set against ZFC above.

## Prerequisites and next connections

Read [First-Order Logic](./first-order-logic.md) first: ZFC is written in it,
its schemas are schemas of first-order formulas, and independence is a claim
about first-order provability. Nothing else is required; set theory sits near
the bottom of the stack.

From here, [Model Theory](./model-theory.md) explains how a sentence can be true
in one model of the axioms and false in another, which is the honest way to
understand independence. [Real Analysis](./real-analysis.md) cashes out the
construction: the reals are a particular set, and their uncountability is
Cantor's theorem. [Category Theory](./category-theory.md) is the alternative
worth meeting next, since it identifies an object by its maps rather than its
elements.
