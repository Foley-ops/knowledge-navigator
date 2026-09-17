---
concept_id: concept.logic.proof_theory
title: Proof Theory
slug: /concepts/proof-theory
kind: concept
tier: 1
review_state: generated-draft
summary: Proof theory studies formal derivations as finite mathematical objects, asking what transformations they admit — above all the elimination of cuts — and what those transformations reveal about the strength of the theories that produce them.
categories:
  - Mathematics/Foundations/Logic & Proof
primary_category: Mathematics/Foundations/Logic & Proof
relationships:
  - type: requires
    target: concept.logic.propositional_logic
    note: The connective rules of natural deduction and the sequent calculus are stated first for the propositional fragment, which is also the fragment where cut-free proof search is a decision procedure.
  - type: requires
    target: concept.logic.first_order_logic
    note: Gentzen's calculi are proof systems for first-order languages, and the quantifier rules with their eigenvariable conditions are where the real difficulty of cut elimination lives.
  - type: contrasts_with
    target: concept.foundations.model_theory
    note: Proof theory studies the syntactic relation of derivability and model theory the semantic relation of truth in a structure; the completeness theorem is the bridge, not an identity of method.
  - type: contributes_to
    target: concept.foundations.computability_theory
    note: Ordinal analysis converts proof-theoretic strength into a class of computable functions — the functions Peano arithmetic proves total are exactly those definable by recursion below epsilon-zero.
sources:
  - source_id: source.plato.proof_theory
    title: 'Stanford Encyclopedia of Philosophy: Proof Theory'
    url: https://plato.stanford.edu/entries/proof-theory/
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
  - source_id: source.plato.classical_logic
    title: 'Stanford Encyclopedia of Philosophy: Classical Logic'
    url: https://plato.stanford.edu/entries/logic-classical/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.coq.documentation
    title: The Coq Proof Assistant documentation
    url: https://coq.inria.fr/documentation
    source_kind: reference-documentation
    supports:
      - concrete-example
      - uses-and-applicability
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.leanprover.documentation
    title: Lean language documentation
    url: https://lean-lang.org/documentation/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - uses-and-applicability
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Proof theory** is the branch of mathematical logic that treats a formal
derivation as a finite combinatorial object — a tree built by fixed inference
rules — and studies that object directly, rather than as mere evidence for its
conclusion. Two questions organise the field. _Structural_ proof theory asks
what operations a derivation admits: which rules are redundant, which permute,
what normal form it can be driven into. _Reductive_ proof theory asks what a
theory costs: by what means can one prove that a theory $T$ derives no
contradiction. Gentzen's sequent calculus answers the first; ordinal analysis
the second.

## Why it matters

Three payoffs, each concrete. Proof search becomes possible: in a cut-free
system every formula in a derivation is already a subformula of the goal, so the
search space is bounded by the goal instead of by the whole language. Proof
checking becomes mechanical: in a dependent type theory a proof is a term,
checking it is type-checking, and a large formal library can be certified by a
kernel of a few thousand lines. And theories become comparable: consistency
strength, as an ordinal, ranks arithmetic against analysis against set theory.

## Intuition

A proof is a tree: axioms at the leaves, rule applications inside, the theorem
at the root. A lemma is a **cut** — prove $A$ here, prove $B$ from $A$ there,
splice the trees. Cut elimination says every splice can be removed: inline the
lemma, and keep inlining, until the proof mentions nothing that was not already
in the statement it proves.

The compiler analogy is honest as far as it goes: cut elimination is inlining
plus partial evaluation on proofs. It breaks on the point of the exercise. A
compiler inlines to make the program faster; cut elimination usually makes the
proof enormously larger. What it buys is _analyticity_ — a derivation that
cannot appeal to anything outside its own conclusion.

## Concrete example

Here is a complete natural-deduction derivation of $A \to (B \to A)$, annotated
with the term it denotes; discharged assumptions are bracketed and numbered.

```text
       [a : A]¹
  ─────────────────────────── →I  (vacuous: nothing assumed B)
   fun (y:B) => a  :  B → A
  ────────────────────────────────── →I  (discharging 1)
   fun (a:A) => fun (y:B) => a  :  A → (B → A)
```

The derivation and the program are one object read twice: $\to$I is lambda
abstraction, $\to$E is application. Now make a detour — apply the theorem to
$c : A$ and $d : B$, an $\to$I immediately followed by an $\to$E, which is the
natural-deduction form of a cut. Normalising it is beta reduction:

$$
(\lambda a.\,\lambda y.\,a)\;c\;d \;\longrightarrow\; (\lambda y.\,c)\;d
\;\longrightarrow\; c .
$$

In Lean the proof is that program, and the kernel accepts it by type-checking:

```lean
theorem k (A B : Prop) : A → B → A := fun a _ => a
```

That is the Curry–Howard correspondence: propositions are types, proofs are
terms, normalisation is evaluation.

## Formal treatment

A **sequent** $\Gamma \vdash \Delta$ has finite multisets of formulas on each
side and reads: the conjunction of $\Gamma$ entails the disjunction of $\Delta$.
Gentzen's classical calculus **LK** derives sequents by rules such as these; the
intuitionistic calculus **LJ** is LK restricted to at most one formula on the
right.

```text
                            Γ ⊢ Δ, A      A, Σ ⊢ Π
  ───────── Ax             ───────────────────────── Cut
   A ⊢ A                         Γ, Σ ⊢ Δ, Π

   Γ ⊢ Δ, A    B, Σ ⊢ Π           A, Γ ⊢ Δ, B
  ───────────────────────── →L   ───────────────── →R
    A → B, Γ, Σ ⊢ Δ, Π            Γ ⊢ Δ, A → B

   A, Γ ⊢ Δ                       A, A, Γ ⊢ Δ
  ────────────── ∧L₁             ───────────── CL
   A ∧ B, Γ ⊢ Δ                    A, Γ ⊢ Δ

   Γ ⊢ Δ, A[y/x]                            Γ ⊢ Δ
  ─────────────── ∀R   (y not free          ───────── WL
   Γ ⊢ Δ, ∀x. A         in Γ, Δ, ∀x.A)       A, Γ ⊢ Δ
```

Cut is the only rule whose premises contain a formula, $A$, that has vanished
from the conclusion. **Gentzen's Hauptsatz** (1935) says it can always be
removed: every LK derivation becomes a cut-free derivation of the same
end-sequent, and likewise for LJ.

The payoff is the **subformula property**: in a cut-free derivation every
formula occurring anywhere is a subformula of one in the end-sequent.
Consistency of pure predicate logic follows immediately — no rule of LK other
than cut has an empty conclusion, so the empty sequent has no cut-free
derivation, hence, by the Hauptsatz, none at all. Herbrand's theorem, Craig
interpolation, and the intuitionistic disjunction property
(if $\vdash A \lor B$ then $\vdash A$ or $\vdash B$) are corollaries.

Hilbert created proof theory in the 1920s to secure infinitary mathematics by
finitary means; Gödel's second incompleteness theorem ended that program in its
original form. Gentzen's response (1936, with a second proof in 1938) made the
missing ingredient explicit: primitive recursive arithmetic _plus_
quantifier-free transfinite induction up to $\varepsilon_0 = \sup\{\omega,
\omega^{\omega}, \omega^{\omega^{\omega}}, \ldots\}$ proves the consistency of
first-order Peano arithmetic, which proves transfinite induction up to every
$\alpha < \varepsilon_0$ but not up to $\varepsilon_0$ itself. Nothing here
evades Gödel; what is traded in is the well-foundedness of one concrete ordinal
notation system.

## Assumptions and requirements

**The rules must be logical and the measure well-founded.** Every rule of LK but
cut introduces one connective, and the formulas active in its premises are
immediate subformulas of the one it introduces. Cut elimination is an induction
on the complexity of the cut formula with an inner induction on derivation
height, and both measures have to decrease under every reduction the argument
performs. A single rule whose premise carries a formula more complex than
anything in its conclusion is enough to break that induction, which is why
adding a rule and re-running the Hauptsatz is never free.

**Freshness at every quantifier step.** The eigenvariable condition on
$\forall$R is not bookkeeping. Without it, $A(y) \vdash A(y)$ yields
$A(y) \vdash \forall x.\,A(x)$ and the system is unsound before cut is in
question at all. It is equally a hypothesis of the Hauptsatz, because the
reductions that push a cut upwards rename eigenvariables; with no unbounded
supply of fresh variables a renaming becomes a capture.

**The theory must be recursively axiomatised.** Gödel's obstruction and
Gentzen's measurement both assume that a machine can recognise an axiom. True
arithmetic — every sentence true in the standard model — is consistent and
complete and escapes incompleteness entirely, and it is useless here, because it
is not a proof system: there is no derivation to take apart.

**An ordinal means something only relative to a notation system.** Ordinal
analysis needs the theory embedded in an infinitary calculus and the ordinals
presented by a primitive recursive notation system, whose well-ordering is
precisely what is being assumed. The choice of system is not innocent: as
Kreisel observed, a recursive ordering of order type $\omega$ can be rigged so
that induction along it already yields consistency, the search for a
contradiction having been encoded into the ordering itself. Ordinals therefore
compare theories only inside a notation system agreed to be natural, and
"natural" has no settled definition.

**Strong normalisation, on the type-theoretic side.** Checking a proof is
decidable only because definitional equality is, and deciding that means
normalising terms. Universe stratification and the strict positivity condition
on inductive definitions are the hypotheses that keep normalisation true: with
`Type : Type`, Girard's paradox produces a closed term of the empty type, and a
single non-strictly-positive inductive definition supplies a fixed-point
operator that does the same. A kernel that relaxes either accepts everything,
which is another way of saying it checks nothing.

## Uses and applicability

Reach for proof theory when the object of study is the derivation itself. Proof
assistants are the largest application: Coq's calculus of inductive
constructions and Lean's dependent type theory are Curry–Howard scaled up, with
a small trusted kernel checking the terms tactics build. Automated provers rest
on analytic calculi — tableaux, resolution, focused sequent systems — whose
bounded search spaces come straight from cut elimination. Programming language
theory borrows wholesale: linear logic yields resource-sensitive type systems,
and Peirce's law types `call/cc`. Proof mining extracts explicit bounds from
non-constructive proofs in analysis.

Do not reach for it when the question is semantic — which structures satisfy a
theory — that is [Model Theory](./model-theory.md); nor when the question is
whether a function is computable, which belongs to
[Computability Theory](./computability-theory.md).

## Limitations and common mistakes

**Cut elimination is not free.** The standard bound is a tower of exponentials
whose height grows with the complexity of the cut formulas, and for first-order
logic Statman and Orevkov showed no elementary function bounds the increase — so
proofs with lemmas can be non-elementarily shorter. "Cut-free is better" is a
claim about analysability, not practice; automated provers reintroduce cuts as
lemmas on purpose.

**Cut elimination is a theorem about pure logic.** Add non-logical axioms — the
induction scheme of arithmetic, say — and the naive Hauptsatz fails, because an
axiom is a leaf that need not be a subformula of anything. Arithmetic is handled
instead by infinitary derivations with the $\omega$-rule and partial cut
elimination under ordinal bounds. Expecting the subformula property inside an
axiomatic theory is a common error.

**Gentzen's proof is not consistency from nothing.** It assumes the
well-foundedness of $\varepsilon_0$, which Peano arithmetic cannot prove.
Whether that is an epistemic gain over simply believing Peano arithmetic has
been contested since 1936 and is not settled: the result is a measurement, not a
vindication.

**Curry–Howard is exact, not a slogan.** It is an isomorphism for intuitionistic
natural deduction and the simply typed lambda calculus, extending cleanly to
dependent types; classical logic fits only via control operators or a
double-negation translation, and the extracted program can be astronomically
inefficient. Finally, $\vdash$ is not $\models$: that they coincide for
first-order logic is Gödel's completeness theorem, not a definition, and it
fails for second-order logic under standard semantics.

## Variants and alternatives

One derivability relation has three standard presentations, and the trade is
always between how close a system sits to how people argue and how well it
serves search and metatheory. A **Hilbert system** has many axiom schemes and
one rule, so an induction over its derivations has almost no cases: ideal for
proving things _about_ the system, punishing to use, and with no subformula
property to exploit. **Natural deduction** buys the Curry–Howard reading and
derivations that read like reasoning, and costs proof search, since elimination
rules run away from the goal; its classical form also resists the Hauptsatz,
which is why the sequent calculus exists at all. **Sequent calculus** buys
symmetry and a bounded search space, and costs identity — derivations differing
only in the order of independent rule applications are the same proof, and
nothing in the syntax says so. **Focused** and polarised calculi quotient that
bureaucracy away in exchange for a more elaborate rule discipline, and **deep
inference** lets rules apply at any depth inside a formula, buying shorter
proofs and a better criterion of proof identity at the cost of the induction on
tree structure that most classical arguments run on.

The substructural variants come from deleting structural rules. Drop weakening
and contraction and the result is **linear logic**, in which a hypothesis is
consumed exactly once: it buys an exact accounting of the duplication that
drives cut elimination's blowup, and costs an exponential modality `!` to hand
reuse back where it is wanted. Affine and relevance logics keep one of the two
rules. **Labelled** and hypersequent calculi extend the method to modal and
intermediate logics that do not fit one connective to a rule, and **resolution**
(Robinson, 1965) abandons the subformula property altogether for a single rule
over clauses plus unification — the proof stops resembling the statement, which
is the price of scale.

The reductive side has real competitors rather than variants. **Functional
interpretations** — Gödel's Dialectica, realizability — rate a theory by the
functionals its proofs require instead of by an ordinal, and are what proof
mining actually runs on. **Reverse mathematics** rates a theorem by which
set-existence axiom is equivalent to it over a weak base, buying a comparison
stated in the mathematics people actually do and paying in granularity, since
the great majority of theorems land in one of five subsystems.

Where there is genuinely no alternative: if what is wanted is the bound, the
witness or the program latent in a non-constructive argument, only the
derivation contains it. The model-theoretic routes to the same corollaries are
shorter and more robust, and they return an existence claim with nothing to run.

## History and attribution

Hilbert named the subject, and almost every part of it was found more than once.

The programme took shape at Göttingen in the 1920s with Paul Bernays, and its
impulse was older than the foundational crisis: Hilbert's non-constructive proof
of the finite basis theorem in the 1880s drew from Gordan the reaction, reported
ever since, that this was theology rather than mathematics, and the programme
was an attempt to make such reasoning safe rather than to give it up. Wilhelm
Ackermann and John von Neumann obtained consistency proofs for fragments of
arithmetic in the mid-1920s, Ackermann by the $\varepsilon$-substitution method;
the finitist standpoint itself, and the derivability conditions that make
Gödel's second theorem precise, were written down in Hilbert and Bernays'
two-volume _Grundlagen der Mathematik_ (1934, 1939).

Gerhard Gentzen's dissertation, _Untersuchungen über das logische Schließen_
(1935), introduced both calculi at once, and the order of invention is the
interesting part: he built natural deduction to model how mathematicians argue,
could not drive the Hauptsatz through its classical form, and devised the
sequent calculus as the instrument that would carry the proof. Natural deduction
was not his alone — Stanisław Jaśkowski published a suppositional system
independently in 1934, out of Łukasiewicz's question of how to formalise
reasoning under an assumption, and it is Jaśkowski's format, by way of Fitch
(1952), that most textbooks teach today. Gentzen died in Prague in 1945, at
thirty-five. Normalisation for natural deduction, the Hauptsatz on that side of
the correspondence, was proved by Dag Prawitz in 1965.

The Curry–Howard correspondence carries two names and deserves three. Curry
noticed in the 1930s that the types of combinators are the axioms of
intuitionistic implicational logic, and worked it out with Feys by 1958;
William Howard's notes on formulae-as-types circulated from 1969 and were
printed in 1980; N. G. de Bruijn reached the same idea independently from 1967
while building AUTOMATH, the first system to check machine-readable proofs and
the ancestor of what Coq and Lean do now. Girard's System F and the
reducibility-candidates method date from the early 1970s — Reynolds found the
same calculus independently in 1974 — and linear logic from 1987.

On the reductive side, Schütte and Takeuti carried ordinal analysis past
arithmetic into subsystems of second-order arithmetic, and the limit of
predicative reasoning, $\Gamma_0$, was identified by Feferman and Schütte
independently in the early 1960s, which is why it bears both names. Gödel's
functional interpretation appeared in _Dialectica_ in 1958, and Kreisel's
question of the 1950s — what a classical existence proof actually yields — is
the ancestor of proof mining.

## Sources

The Stanford Encyclopedia entry on proof theory is the best single orientation:
the Hauptsatz, the subformula property, ordinal analysis, and a careful account
of what Gentzen's reduction assumes. Its entry on classical logic supplies the
underlying proof systems and the derivability–validity distinction. The Coq and
Lean documentation are the working references for Curry–Howard in practice: how
a proposition becomes a type and what a kernel checks.

## Prerequisites and next connections

Read [Propositional Logic](./propositional-logic.md) and
[First-Order Logic](./first-order-logic.md) first: the eigenvariable condition
on $\forall$R makes no sense without free and bound variables.

From here, [Model Theory](./model-theory.md) is the deliberate contrast — truth
in structures rather than derivability — and completeness is where the two meet.
[Computability Theory](./computability-theory.md) supplies the incompleteness
theorems, without which Gentzen's result looks like a magic trick, and receives
back a characterisation of any theory's provably total functions.
[Category Theory](./category-theory.md) continues the Curry–Howard thread:
intuitionistic proofs are the arrows of a cartesian closed category, which turns
"when are two proofs the same proof?" into a question with a precise answer.
