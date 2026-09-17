---
concept_id: concept.logic.propositional_logic
title: Propositional Logic
slug: /concepts/propositional-logic
aliases:
  - sentential logic
  - propositional calculus
kind: concept
tier: 1
review_state: generated-draft
summary: The logic of whole statements joined by not, and, or and if-then, where meaning is fixed by two-valued truth tables — which makes validity decidable, and makes satisfiability the original NP-complete problem.
categories:
  - Mathematics/Foundations/Logic & Proof
primary_category: Mathematics/Foundations/Logic & Proof
relationships:
  - type: prerequisite_of
    target: concept.logic.first_order_logic
    note: First-order logic is this system plus predicates, variables and quantifiers, and it inherits the connectives and their truth tables unchanged.
  - type: prerequisite_of
    target: concept.logic.proof_theory
    note: The propositional fragment is where natural deduction, sequent calculus and cut elimination are first defined and first proved to behave.
  - type: prerequisite_of
    target: concept.foundations.model_theory
    note: A truth assignment is the simplest possible model, so propositional semantics is the degenerate case that model-theoretic structures generalise.
  - type: contributes_to
    target: concept.foundations.computability_theory
    note: Propositional satisfiability is the problem the Cook-Levin theorem proved NP-complete, making it the reduction target complexity theory is built on.
sources:
  - source_id: source.plato.classical_logic
    title: 'Stanford Encyclopedia of Philosophy: Classical Logic'
    url: https://plato.stanford.edu/entries/logic-classical/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.theory_of_computation
    title: MIT 18.404J Theory of Computation (Fall 2020)
    url: https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.plato.proof_theory
    title: 'Stanford Encyclopedia of Philosophy: Proof Theory'
    url: https://plato.stanford.edu/entries/proof-theory/
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Propositional logic** is the formal system whose sentences are built from
atomic propositions — statements taken as indivisible, with no internal
structure — using the connectives $\neg$ (not), $\wedge$ (and), $\vee$ (or),
$\rightarrow$ (if-then) and $\leftrightarrow$ (if and only if), and whose
semantics is fixed by assigning each atom one of two values, true or false, and
evaluating compounds by fixed truth functions.

Its defining limitation is deliberate: an atom $p$ is opaque. "Every raven is
black" and "this raven is black" are two unrelated atoms here. With no
variables, predicates or quantifiers, the logic sees only how whole statements
combine.

## Why it matters

Propositional logic is where the two central arrows of logic separate cleanly
enough to be studied. One arrow, $\models$, is about truth: does the conclusion
hold in every situation where the premises do? The other, $\vdash$, is about
symbol manipulation: can the conclusion be produced from the premises by
mechanical rules? Soundness and completeness are the theorems that the two
coincide, and this is where a reader first sees that such agreement has to be
proved rather than assumed.

It is also the practical substrate of automated reasoning: a digital circuit, a
bounded-horizon plan, a package dependency resolution and a bounded model check
of a protocol are all encoded as one enormous propositional formula and handed
to a satisfiability solver.

## Intuition

A formula with $n$ atoms describes a space of $2^n$ possible worlds — one per
assignment of true/false to the atoms — and carves that space into the worlds
where it holds and the worlds where it does not. Entailment is then set
inclusion: $\Gamma \models \varphi$ says the region cut out by the premises sits
inside the region cut out by the conclusion. Unsatisfiability says a region is
empty.

The everyday analogy is a circuit of switches, and it is a good one: $\wedge$ is
switches in series, $\vee$ in parallel. It breaks on the conditional — nothing
in the wiring corresponds to $p \rightarrow q$ being automatically true whenever
$p$ is false, or captures a temporal or causal "if". The truth-functional
conditional is a choice, not a discovery.

## Concrete example

Take the premises $p \rightarrow q$, $q \rightarrow r$ and $p$, and ask whether
$r$ follows. Instead of checking all $2^3 = 8$ rows of a truth table, negate the
conclusion, convert to conjunctive normal form — a conjunction of clauses, each
clause a disjunction of literals — and look for a contradiction. Using
$p \rightarrow q \equiv \neg p \vee q$, the clause set is

$$
\{\; \neg p \vee q, \;\; \neg q \vee r, \;\; p, \;\; \neg r \;\}.
$$

Resolution repeatedly takes two clauses containing a complementary pair and
merges the rest:

- from $p$ and $\neg p \vee q$, derive $q$;
- from $q$ and $\neg q \vee r$, derive $r$;
- from $r$ and $\neg r$, derive the empty clause $\square$.

The empty clause is unsatisfiable by construction, so the clause set has no
model, so $\{p \rightarrow q,\, q \rightarrow r,\, p\} \models r$. Three
resolution steps replaced eight truth-table rows — and that gap is the whole
reason search-based methods exist.

## Formal treatment

Fix a countable set $P$ of atoms. The formulas are the smallest set containing
$P$ and $\bot$ and closed under the grammar

$$
\varphi ::= p \;\mid\; \bot \;\mid\; \neg \varphi \;\mid\; (\varphi \wedge \varphi)
\;\mid\; (\varphi \vee \varphi) \;\mid\; (\varphi \rightarrow \varphi).
$$

A **valuation** is a function $v : P \to \{0,1\}$. It extends uniquely to all
formulas by $\hat v(\neg \varphi) = 1 - \hat v(\varphi)$,
$\hat v(\varphi \wedge \psi) = \min(\hat v \varphi, \hat v \psi)$,
$\hat v(\varphi \vee \psi) = \max(\hat v \varphi, \hat v \psi)$ and
$\hat v(\varphi \rightarrow \psi) = \max(1 - \hat v \varphi, \hat v \psi)$.
Write $v \models \varphi$ when $\hat v(\varphi) = 1$.

**Semantic entailment**: $\Gamma \models \varphi$ iff every valuation satisfying
every member of $\Gamma$ satisfies $\varphi$. **Derivability**:
$\Gamma \vdash \varphi$ iff there is a finite derivation of $\varphi$ from
$\Gamma$ in a fixed calculus — Hilbert-style, natural deduction or sequent
calculus. The two relations are defined by completely different machinery, and
are related by two theorems:

$$
\text{soundness: } \Gamma \vdash \varphi \implies \Gamma \models \varphi,
\qquad
\text{completeness: } \Gamma \models \varphi \implies \Gamma \vdash \varphi .
$$

Post proved completeness for the propositional calculus of _Principia
Mathematica_ in 1921. Because derivations are finite, completeness immediately
yields **compactness**: if $\Gamma \models \varphi$ then $\Gamma_0 \models \varphi$
for some finite $\Gamma_0 \subseteq \Gamma$. This is vacuous for finite $\Gamma$
and substantive for infinite $\Gamma$.

Decidability is immediate — evaluate all $2^n$ valuations — which makes
propositional logic tame where first-order logic is not. The cost is the
question. **SAT**, deciding whether a CNF formula has a satisfying valuation, is
NP-complete by the Cook-Levin theorem; its complement, deciding
unsatisfiability, is coNP-complete, as is **TAUT**, deciding validity of an
arbitrary formula — $\varphi$ is valid iff $\neg \varphi$ is unsatisfiable.
Validity of a formula already in CNF, by contrast, is decidable in polynomial
time: such a formula is valid iff every clause contains some atom together with
its negation. Every formula has a logically equivalent CNF, but the naive
conversion can blow up exponentially; the Tseitin transformation instead
produces an _equisatisfiable_ CNF of linear size by naming subformulas with
fresh atoms.

## Assumptions and requirements

Everything above rests on four commitments about the semantics, and each one has
a known breaking point.

**Bivalence.** A valuation is total and two-valued: every atom gets true or
false, never both and never neither. Drop it and the validities go first. In
Kleene's strong three-valued semantics, where a third value means "undefined"
and only true is designated, there are no tautologies at all — a formula whose
atoms are all undefined is itself undefined, $\varphi \vee \neg \varphi$
included. Vague predicates, partial databases and self-referential sentences are
the standard places where bivalence is the assumption people want to give up.

**Truth-functionality.** The value of a compound depends on nothing except the
values of its parts. This is what makes a truth table a definition rather than a
summary of one. "Necessarily $p$", "Alice believes $p$" and "$p$ because $q$"
are not functions of the truth values of their parts: two true sentences can
differ on whether they are necessary, so no column of a table can decide it.
That is why modal, epistemic and causal logics reach for possible worlds instead
of an extra column.

**Unique readability.** The parentheses in the grammar are load-bearing. That
$\hat v$ extends $v$ _uniquely_ is a theorem proved by induction on formulas, and
the induction needs every formula to have exactly one parse tree. Written without
brackets, $p \wedge q \vee r$ has two readings that disagree under
$v(p) = v(q) = 0$, $v(r) = 1$: one is true, the other false. Infix notation hides
this; Polish notation makes the parse unambiguous without brackets at all.

**Finiteness.** Formulas are finite strings and derivations are finite objects.
Decidability comes from the first — there are only $2^n$ rows because $n$ is
finite — and compactness from the second, since a derivation can only ever reach
finitely far into $\Gamma$. Allow infinite conjunctions and compactness fails at
once: the infinite disjunction $p_1 \vee p_2 \vee \cdots$ together with every
$\neg p_i$ is unsatisfiable while each finite subset is satisfiable. Compactness
for an uncountable set of atoms also costs something a reader rarely sees stated:
over ZF it is equivalent to the Boolean prime ideal theorem, a weak choice
principle. With countably many atoms no choice is needed.

A fifth assumption belongs to the modelling rather than the logic, and it is the
one that actually costs people time. The semantics quantifies over all $2^n$
valuations, so every combination of truth values counts as a genuine possibility
and the atoms are treated as logically independent. Encode "$x > 5$" and
"$x > 3$" as unrelated atoms and the valuation making the first true and the
second false is counted as a world, so an entailment that plainly holds of the
intended domain is simply not there. Nothing in the logic detects the omission;
the background constraints have to be added as further clauses, or a theory
solver has to enforce them outside the propositional layer.

Finally, the complexity claims assume an input measure. Size is the length of
the formula, not the number of atoms, and the reductions behind NP-completeness
are polynomial in that length under a reasonable encoding. Truth-table checking
counts as exponential only because $n$ is bounded by the length of the input.

## Uses and applicability

Reach for propositional logic when the domain is finite and already fixed and
the question is combinatorial: circuit equivalence checking, bounded model
checking, planning to a fixed horizon, scheduling, graph colouring, dependency
resolution in package managers. Modern conflict-driven clause-learning solvers
routinely dispatch industrial instances with millions of clauses — an empirical
fact about _structured_ instances, not a theorem, and not a claim about the
worst case.

Do not reach for it when the domain is unbounded or relational — "every customer
has an account" needs quantifiers, so use first-order logic — when arithmetic or
arrays are involved, where SMT solvers extend SAT with theories, or when the
answer is a degree of belief rather than a truth value.

## Limitations and common mistakes

The commonest confusion is between $\models$ and $\vdash$. They are different
relations, one semantic and one syntactic, and their agreement is a theorem
about a particular proof system. A calculus can be sound and incomplete, or
complete and unsound; neither property is free.

The second is expecting $\rightarrow$ to mean what "if" means in English.
$p \rightarrow q$ is true whenever $p$ is false, so "if the moon is cheese then
$2 + 2 = 5$" is true: no relevance requirement, no causal content. Whether that
is a defect of the material conditional or of the intuition is contested —
relevance and conditional logics exist because the question is not settled.

The third is misreading NP-completeness. That SAT is NP-complete is a worst-case
statement; that solvers succeed on hardware-verification instances is a
statement about the structure of those instances. Neither implies the other, and
neither settles P versus NP. Randomly generated 3-SAT near a clause-to-variable
ratio of roughly $4.26$ remains hard for the same solvers — the empirical hard
region, whose exact threshold for $k = 3$ is still open.

Finally, Tseitin-converted CNF is equisatisfiable, not equivalent: it has extra
atoms, and a model of it must be restricted to the original atoms before it
means anything about the original formula.

## Variants and alternatives

Three things vary independently here — the calculus, the algorithm and the
semantics — and confusing the three axes is why "an alternative to propositional
logic" is usually an ambiguous request.

**Calculi.** A Hilbert system buys a tiny metatheory: one rule, so any induction
over derivations is three lines long, which is exactly what you want when proving
soundness. It costs derivations no human wants to write. Natural deduction pairs
an introduction and an elimination rule per connective and reads like ordinary
argument, at the cost of building discharge of assumptions into the rules.
Sequent calculus buys symmetry and cut elimination, and cut elimination buys the
subformula property: a cut-free proof mentions only subformulas of what it
proves, so a search never has to invent a lemma out of nothing. That is why
automated search is organised around sequents and tableaux rather than axiom
schemas. Resolution, used in the example above, buys a single rule with a
decidable next step, and pays twice: it needs CNF up front, and it is
refutation-complete rather than complete, so it establishes that a clause set has
no model instead of deriving an arbitrary formula.

**Algorithms and representations.** Search over assignments with unit propagation
is one bet; binary decision diagrams are the opposite one. A BDD builds a
canonical representation of the whole Boolean function under a fixed variable
order, so equivalence checking becomes a pointer comparison and every model can
be counted — but the diagram is exponential for some functions, integer
multiplication being the standard example, and its size swings by orders of
magnitude with the variable order. Restricting the fragment is the third option:
2-CNF, Horn clauses and affine (XOR) constraints are each decidable in polynomial
time, by strongly connected components in an implication graph, by unit
propagation and by Gaussian elimination respectively. Schaefer's dichotomy
theorem says that this list is essentially complete — every constraint class of
this kind is in P or NP-complete, with nothing in between — so a fragment that
looks almost tractable usually is not.

**Semantics.** Intuitionistic propositional logic drops excluded middle and reads
a proof of a disjunction as a proof of one disjunct; it buys constructive content
and a correspondence with computation, and costs the truth table, which is
replaced by Kripke models. It stays decidable, but its decision problem is
PSPACE-complete rather than NP-complete. Kleene's three-valued logic buys a
treatment of undefinedness at the price of every tautology. Priest's LP pays on
the other side: it keeps exactly the classical tautologies but weakens the
consequence relation, so modus ponens and disjunctive syllogism fail — that is
the price of tolerating a contradiction without everything following from it.
Relevance logics require premise and conclusion to share an atom, which is a
direct answer to the material conditional complaint above and costs disjunctive
syllogism too. Modal, temporal and epistemic logics add operators that are not
truth-functional at all, so they are extensions rather than rivals.

There is, though, no alternative to propositional logic itself at its own level.
Boolean algebra, two-element switching circuits and the two-valued propositional
calculus are one structure in three notations, and choosing between them is
choosing packaging. The genuine choices are the three above, plus moving up to a
more expressive logic and paying for it in decidability.

## History and attribution

Reasoning over whole propositions rather than the terms inside them is old. The
Stoics — Chrysippus above all, in the third century BC — catalogued inference
schemas we would now write with $\rightarrow$, $\wedge$ and $\vee$, in explicit
contrast to Aristotle's syllogistic, which analyses a sentence into subject and
predicate. Almost none of that work survives directly; it is reconstructed from
later reports, and its propositional character was properly appreciated only in
the twentieth century.

The modern line has two roots. One is algebraic: George Boole's _The Mathematical
Analysis of Logic_ (1847) and _An Investigation of the Laws of Thought_ (1854)
put inference into equations, though Boole's calculus was as much about classes
as about propositions, and his aim was to show that logic belonged to
mathematics. Peirce and Schröder worked that algebra into something close to the
modern connectives over the following decades. The other root is Frege's
_Begriffsschrift_ (1879), the first fully formal axiomatic system, whose
propositional part needs only negation and the conditional with modus ponens —
written not for its own sake but as scaffolding for a foundation of arithmetic.
Whitehead and Russell's _Principia Mathematica_ (1910–13) gave the axiomatic
propositional calculus the shape the next generation worked on.

Truth tables are the clearest case of independent discovery on the page.
Essentially the method appears in Wittgenstein's _Tractatus_ and in Post's work
in the same year, 1921, and something very close sits in unpublished Peirce
manuscripts decades earlier; there is no single inventor to name, and accounts
that give one should be treated with suspicion. The completeness result the
formal treatment above attributes to Post has a similar complication: Bernays had
proved it in his 1918 Habilitationsschrift, which did not appear in print until
1926, so discovery order and publication order differ and both names belong in
the account.

Gentzen introduced natural deduction and the sequent calculus in 1934–35 and
proved cut elimination, and Jaśkowski published a natural-deduction system
independently in 1934. Gentzen's own problem was not propositional logic at all:
he wanted consistency proofs for arithmetic in the spirit of Hilbert's programme,
and the propositional case is simply where his rules and his cut-elimination
theorem are stated first.

The engineering history runs separately. Shannon's 1937 master's thesis showed
that relay switching circuits are Boolean algebra, which is where the circuit
reading of $\wedge$ and $\vee$ becomes an engineering method rather than an
analogy; comparable connections were drawn independently elsewhere in the same
decade. The search procedure inside modern solvers descends from Davis and
Putnam's 1960 procedure and the 1962 refinement by Davis, Logemann and Loveland,
with clause learning added in the 1990s. The subformula-naming trick of the
previous sections comes from Tseitin's 1960s work on the length of propositional
derivations. And the complexity result is the canonical independent discovery:
Cook's 1971 paper on the complexity of theorem-proving procedures and Levin's
work published in 1973 in the Soviet Union reached it separately, which is what
the hyphen in "Cook-Levin" records. Cook's question was a logician's one —
whether tautology-checking could be done efficiently — and the answer turned the
oldest decidable logic into the reference point for hardness.

## Sources

The Stanford Encyclopedia entry on classical logic is the careful reference for
the syntax, the two-valued semantics, both arrows and the soundness and
completeness theorems, and it is honest about the material conditional being a
choice. Russell and Norvig give the engineer's view: truth-table enumeration,
CNF conversion, resolution and the solver architectures. Arora and Barak state
the Cook-Levin theorem and situate SAT as the canonical NP-complete problem,
which is the right frame for the worst-case claims above; the MIT theory of
computation course covers that material as a lecture sequence and is the
gentler route in. The companion Stanford Encyclopedia entry on proof theory is
the reference for the calculi compared above and for Gentzen's work on them.

## Prerequisites and next connections

Almost nothing is needed first: basic set notation and the idea of a function
are enough, since a valuation is just a function from atoms to two values.

Three directions open from here. First-order logic keeps every connective and
truth table and adds predicates, variables and quantifiers — losing decidability
in the process, which is the most instructive contrast in elementary logic.
Proof theory takes the $\vdash$ side seriously and asks what derivations
themselves are; [Model Theory](./model-theory.md) takes the $\models$ side and
generalises the valuation into a structure. Downstream,
[Computability Theory](./computability-theory.md) and the complexity theory
built on it begin their catalogue of hard problems at SAT.
