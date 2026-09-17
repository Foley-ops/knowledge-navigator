---
concept_id: concept.formal_verification.coq
title: Coq
slug: /concepts/coq
aliases:
  - Rocq Prover
  - Rocq
kind: tool
tier: 1
review_state: generated-draft
summary: An interactive proof assistant, renamed the Rocq Prover in 2025, in which propositions are types and proofs are programs checked by a small kernel — the system behind the machine-checked four colour theorem and the CompCert verified C compiler.
categories:
  - Mathematics/Foundations/Formal Verification
primary_category: Mathematics/Foundations/Formal Verification
relationships:
  - type: implements
    target: concept.logic.proof_theory
    note: The kernel is a working realisation of the Curry-Howard reading of natural deduction — a derivation is a term, and checking a proof is type-checking it.
  - type: contrasts_with
    target: concept.formal_verification.lean
    note: The two proof assistants share a dependent-type-theory foundation but differ in kernel details, tactic language, axiom defaults and library culture, so a development in one does not transfer to the other.
  - type: contrasts_with
    target: concept.foundations.set_theory
    note: Coq founds mathematics on a dependent type theory rather than on ZFC, so equality, quotients and the axiom of choice behave differently from the set-theoretic account most mathematicians learn.
  - type: used_to_solve
    target: concept.geometry.euclidean_geometry
    note: Beeson, Narboux and Wiedijk machine-checked Euclid's Book I from axioms as close as possible to Euclid's own, written in a language close to Tarski's, with the proofs checked in both Coq and HOL Light, which exposed which diagrammatic steps Euclid had left unstated.
sources:
  - source_id: source.coq.documentation
    title: The Coq Proof Assistant documentation
    url: https://coq.inria.fr/documentation
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.beeson.proof_checking_euclid
    title: Proof-checking Euclid
    url: https://arxiv.org/abs/1710.00787
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.leanprover.documentation
    title: Lean language documentation
    url: https://lean-lang.org/documentation/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathlib.community
    title: Lean mathlib community documentation
    url: https://leanprover-community.github.io/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Gonthier's formalisation of the four colour theorem
    reason: No registry source covers the 2005 Coq formalisation, its published account, or the 1995 Robertson-Sanders-Seymour-Thomas proof that it follows, so those dates, attributions and the size of that development rest on no citation here.
    sections:
      - why-it-matters
      - history-and-attribution
  - label: The Mathematical Components formalisation of the Feit-Thompson theorem
    reason: The registry has nothing on the odd order theorem's 2012 machine-checked proof or on the Mathematical Components libraries built for it.
    sections:
      - why-it-matters
      - history-and-attribution
  - label: CompCert, the verified C compiler
    reason: The page leans on CompCert as the standard example of verified systems software, and the registry has no source for it or for the random-testing studies that probed it.
    sections:
      - why-it-matters
      - uses-and-applicability
  - label: Wiedijk's de Bruijn factor measurements
    reason: The registry has no source for the measured ratio of formal to informal proof length, so the Intuition section names the de Bruijn factor but quotes no figure for it.
    sections:
      - intuition
  - label: Isabelle/HOL, Agda and HOL Light as competing proof assistants
    reason: The registry carries documentation for Coq and Lean only, so the comparison with other assistants is uncited.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Coq** is an interactive theorem prover: a system in which you state a
mathematical proposition in a formal language, build a proof of it by issuing
tactics, and have a small trusted kernel verify the result. Its logic is the
**Calculus of Inductive Constructions** (CIC), a dependent type theory with
inductive definitions, under which a proposition is a type and a proof is a
well-typed term of that type. The same language is a total functional
programming language, so one development can hold a specification, a program and
a proof that the program meets it. Since 2025 the system is officially the
**Rocq Prover**; the logic, the `.v` file format and thirty years of literature
are unchanged, and most packages, tutorials and papers still say Coq.

## Why it matters

A human referee reads a proof for plausibility and stops when convinced. A
kernel reads it for correctness and stops only when every step reduces to a rule
it already trusts. That difference buys two things nothing else does.

First, it makes proofs with enormous case analyses reviewable. The four colour
theorem was proved in 1976 by Appel and Haken with computer assistance and was
disputed for decades precisely because the case check was unreadable; it was
re-proved in 1995 by Robertson, Sanders, Seymour and Thomas, with C programs
doing the case analyses. Georges Gonthier's Coq development, completed in 2005,
follows that later proof and replaces the trust in those unexamined C programs
with a single proof term the kernel rechecks. The Feit-Thompson odd
order theorem — hundreds of pages of group theory — was machine-checked by
Gonthier and the Mathematical Components team in 2012.

Second, it lets software carry a theorem instead of a test suite. CompCert, a C
compiler developed at Inria, ships with a Coq proof that the assembly it emits
refines the semantics of the source program, so an entire class of
miscompilation bugs is ruled out rather than sampled for.

It also makes hidden assumptions visible. Beeson, Narboux and Wiedijk found that
checking Euclid's Book I required stating the betweenness and continuity facts
Euclid read off his diagrams — the formalisation's real output was the list of
things the informal proof never said.

## Intuition

Think of Coq as having two layers that people constantly conflate. The layer you
type in is a scripting language of tactics: `induction`, `rewrite`, `auto`. The
layer that matters is the **proof term** those tactics quietly assemble — a
lambda term whose type is the theorem. When you write `Qed`, the tactics are
discarded and the term alone is handed to the kernel, which type-checks it from
scratch. This is the de Bruijn criterion: the thing you must trust is not the
thousands of lines of tactic machinery but the few thousand lines of kernel.

The useful analogy is a build system. The tactic script is the build file, the
proof term is the artefact, and correctness is a property of the artefact. The
analogy breaks in one place worth naming: the artefact is not human-readable and
nobody inspects it. Confidence comes from the kernel being small and
independently reimplementable, not from anyone reading the output.

The second thing to internalise is that Coq will not find your proof. It checks
what you construct. Automation exists, but a formalisation is an act of writing,
and the formal text runs several times the length of the informal proof — that
ratio is the de Bruijn factor, and it varies widely with the development and
with how much detail the informal text already carries.

## Concrete example

A total function and a theorem about it, in one language:

```coq
Fixpoint app {A : Type} (l m : list A) : list A :=
  match l with
  | nil      => m
  | cons x r => cons x (app r m)
  end.

Theorem app_assoc :
  forall (A : Type) (l m n : list A),
    app (app l m) n = app l (app m n).
Proof.
  intros A l m n.
  induction l as [| x r IH].
  - reflexivity.                  (* app (app nil m) n reduces to app m n *)
  - simpl. rewrite IH. reflexivity.
Qed.

Print Assumptions app_assoc.      (* Closed under the global context *)

Require Import Extraction.
Extraction Language OCaml.
Recursive Extraction app.
```

Three things happen here. The base case closes by `reflexivity` alone, because
`app nil m` and `m` are equal by computation, not by an appeal to a lemma —
definitional equality does real work. `Print Assumptions` reports that the proof
uses no axioms, which is the command to reach for whenever you want to know what
a theorem actually depends on. And `Recursive Extraction` emits an OCaml
function with the type argument erased, so the verified definition becomes
ordinary compilable code.

## Formal treatment

The kernel decides judgements $\Gamma \vdash t : T$, read "in context $\Gamma$,
the term $t$ has type $T$". Types and terms belong to one syntax. Sorts are
$\mathrm{Prop}$, $\mathrm{Set}$ and a hierarchy $\mathrm{Type}_i$ with
$\mathrm{Type}_i : \mathrm{Type}_{i+1}$; universe levels are inferred and
constrained rather than written by hand.

Dependent products are formed by

$$
\frac{\Gamma \vdash A : s_1 \qquad \Gamma, x{:}A \vdash B : s_2}
     {\Gamma \vdash \forall x{:}A,\ B : s_3}
$$

for permitted sort triples $(s_1, s_2, s_3)$. The characteristic choice is that
$s_2 = \mathrm{Prop}$ forces $s_3 = \mathrm{Prop}$ for every $s_1$:
$\mathrm{Prop}$ is **impredicative**, so $\forall P : \mathrm{Prop},\ P$ is
itself a proposition.

The rule that makes a type theory compute is conversion,

$$
\frac{\Gamma \vdash t : A \qquad \Gamma \vdash B : s \qquad A \equiv B}
     {\Gamma \vdash t : B},
$$

where $\equiv$ is definitional equality generated by $\beta$ (application),
$\delta$ (unfolding a definition), $\iota$ (pattern matching and fixpoint
unrolling), $\zeta$ (let-binding) and $\eta$. Because CIC terms are strongly
normalising, $\equiv$ is decidable and so is type-checking; that is why proof
checking terminates.

Under Curry-Howard, a closed term of type $P$ is a proof of $P$, and consistency
is the statement that no closed term inhabits $\forall P : \mathrm{Prop},\ P$.
Consistency of CIC is not provable within CIC, by Gödel's second incompleteness
theorem; it is established by set-theoretic models whose strength grows with the
universe hierarchy, so the metatheory assumes strictly more than ZFC.

Two restrictions keep this sound. Recursive definitions must pass a **guard
condition**: some argument is structurally smaller at every recursive call. The
criterion is syntactic, decidable and incomplete, so terminating functions are
routinely rejected and must be rewritten with well-founded recursion. And
elimination of a $\mathrm{Prop}$ into a computational sort is barred except for
a few singleton cases, which is what licenses **extraction**: proof components
carry no computational content and are erased, leaving an OCaml or Haskell
program.

## Assumptions and requirements

What you actually trust is the kernel, the OCaml compiler that built it, and the
hardware — a trusted base of thousands rather than millions of lines, but not
zero. Extraction and the parser sit outside the kernel: an extracted program is
justified by a metatheorem about erasure, not by a Coq proof of the extraction
implementation.

Coq's core logic is intuitionistic. Excluded middle, functional extensionality,
choice and proof irrelevance are consistent additions available as axioms, and
`Require Import Classical` is one line, but each has a price: an added axiom is
a term with no reduction rule, so proofs that depend on it get stuck when you
try to compute with them, and extracted code inherits the stuckness. Uniqueness
of identity proofs is consistent with CIC but contradicts univalence, so a
library that assumes it cannot later be reused in a homotopy-theoretic setting.

Everything above assumes the guard condition is respected and that universe
constraints remain satisfiable. Drop the former and you can define a
non-terminating term of type `False`; drop the latter — for instance by forcing
`Type : Type` — and Girard's paradox makes the system inconsistent.

## Uses and applicability

Reach for Coq when a proof has many mechanical cases and few conceptual ones,
when the object of study is a programming language or protocol and its metatheory
must be exact, or when software must be correct for reasons stronger than
testing. Programming-language research is where it is most entrenched: Software
Foundations teaches semantics through it, and the Iris framework for
concurrent separation logic is a Coq development.

It is a poor fit when an informal proof is short and conceptual; formalising it
buys certainty you already had at a cost of weeks. It is also the wrong tool when
the question lies in a decidable theory a dedicated solver already handles well —
bit-vectors, finite-state protocols — where an SMT solver or a model checker
answers in seconds. Coq's own `lia` and the rest of the Micromega tactics
discharge linear arithmetic goals automatically, but nothing in its libraries
matches a model checker on a protocol.

## Limitations and common mistakes

**"Verified" is always relative to a specification.** A proof establishes that
the code meets the stated property. If the property is wrong, weak, or quietly
vacuous, the proof is perfectly valid and worthless. Reviewing specifications is
the part of verification that machines do not do.

**Axioms and `Admitted` are invisible unless you look.** A development can be
built on an unproved lemma and still compile. `Print Assumptions` on the final
theorem is the check, and it is skipped far too often.

**`Qed` makes a definition opaque.** Close a computational definition with `Qed`
instead of `Defined` and later proofs will not reduce through it, producing the
classic "why will `reflexivity` not close this goal" confusion.

**`Prop` is not `bool`.** A proposition is not decidable by default; deciding it
requires a proof-carrying `sumbool` or a reflection lemma tying it to a boolean
test. Beginners write specifications in `Prop` and then discover they cannot
compute with them.

**The cost is real.** Formalisations of substantial mathematics run to person-
years and hundreds of thousands of lines, and a refactor of a definition can
invalidate a large amount of downstream work.

**The rename catches everyone.** Searching for current documentation under "Coq"
and current packages under `rocq-` both work, but mixing versions across the
boundary does not; the registry's own documentation URL still uses the old
`coq.inria.fr` address.

## Variants and alternatives

Inside the system, the main variation is the proof language. **Ltac** is the
traditional untyped tactic language, **Ltac2** a typed successor, and
**SSReflect** — written for the four colour theorem and now part of the system —
a terser style built around small-scale boolean reflection, which underpins the
Mathematical Components libraries. Extraction targets OCaml, Haskell and Scheme.
**MetaCoq** formalises CIC inside Coq itself, and is the route to a verified
kernel rather than a trusted one.

Among other assistants, the honest comparison is with **Lean**. Both rest on a
calculus of inductive constructions with impredicative `Prop`, and code in one
looks recognisable to users of the other. The differences are real: Lean's
mathematical library, mathlib, is a single tightly curated monolith with an
aggressive refactoring culture, whereas Coq's mathematics is spread across
independent libraries co-ordinated by the Coq Platform; Lean's standard library
is classical from the outset, while Coq's is constructive with classical axioms
opt-in; Lean 4 is a general-purpose language in which tactics and metaprograms
are written in Lean, while Coq's plugin layer is OCaml. Coq has the longer
track record in verified systems software; Lean has attracted much of the recent
pure-mathematics formalisation effort. Which suits a project depends on which
libraries exist for its subject, and that is not a question with a single answer.

Further afield, **Agda** and **Idris** are dependently typed languages with
lighter tactic support, **Isabelle/HOL** trades dependent types for strong
automation over simple type theory, **HOL Light** is prized for a tiny kernel,
and **ACL2** and **PVS** occupy different points on the same
expressiveness-versus-automation curve. Automated provers and SMT solvers are the
genuinely different bet: no interaction, but only within theories they decide.

## History and attribution

The Calculus of Constructions was developed by Thierry Coquand and Gérard Huet at
INRIA in the mid-1980s, and the first implementation followed shortly after.
Christine Paulin-Mohring added inductive types at the end of the decade, turning
the calculus into the Calculus of Inductive Constructions and bringing program
extraction with it. The name Coq dates from the early 1990s — a pun on Coquand,
on the calculus, and on the French for rooster. Later layers arrived from
different hands: the Ltac tactic language around 2000, and SSReflect out of
Gonthier's work on the four colour theorem. The system received the ACM Software
System Award in 2013. In 2025 the developers renamed it the Rocq Prover, in part
because the old name is an unfortunate homophone in English; the change is recent
enough that both names are in active use.

## Sources

The Coq documentation — reference manual, standard library and tutorials — is
the authority for the core language, the typing rules, the tactic and extraction
mechanisms, and the project's own account of its history; it is also where the
renaming and the current tooling names are documented. _Proof-checking Euclid_
is a concrete case study of what formalising classical mathematics in Coq
demands and reveals. The Lean documentation and the mathlib community site are
cited only for the comparison: they are the primary descriptions of the design
and library culture this page contrasts Coq with.

## Prerequisites and next connections

[Proof Theory](./proof-theory.md) is the background that makes Coq legible: the
Curry-Howard correspondence, natural deduction and normalisation are exactly what
the kernel implements. [First-Order Logic](./first-order-logic.md) supplies the
quantifier discipline, though Coq's logic is higher-order and dependent.

From here, [Set Theory](./set-theory.md) is the instructive contrast — the same
mathematics on a different foundation, with equality and choice behaving
differently — and [Category Theory](./category-theory.md) gives the third view of
the same correspondence, in which intuitionistic proofs are arrows in a cartesian
closed category. [Euclidean Geometry](./euclidean-geometry.md) is where to see a
formalisation change what we believe about a classical text, and
[Computability Theory](./computability-theory.md) explains why the guard
condition must be conservative and why consistency cannot be proved from inside.
