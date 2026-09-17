---
concept_id: concept.formal_verification.lean
title: Lean
slug: /concepts/lean
aliases:
  - Lean 4
  - Lean theorem prover
kind: tool
tier: 1
review_state: generated-draft
summary: Lean is an interactive theorem prover and programming language in which a statement is a type and its proof is a term, checked by a small kernel, with mathlib as the shared library that makes formalising real mathematics practical rather than merely possible.
categories:
  - Mathematics/Foundations/Formal Verification
primary_category: Mathematics/Foundations/Formal Verification
relationships:
  - type: implements
    target: concept.logic.proof_theory
    note: Lean turns the proof-theoretic idea of a derivation into a running artefact — the proof term is the derivation, and kernel type-checking is the mechanical check that its rules were applied correctly.
  - type: contrasts_with
    target: concept.formal_verification.coq
    note: Both are proof assistants over a calculus of inductive constructions, but they differ in their treatment of proof irrelevance and quotients, in their metaprogramming, and in the culture of their mathematical libraries.
  - type: contrasts_with
    target: concept.foundations.set_theory
    note: Lean founds mathematics on dependent type theory rather than ZFC, so a set is a predicate on a type instead of a primitive, and membership is typed rather than global.
sources:
  - source_id: source.leanprover.documentation
    title: Lean language documentation
    url: https://lean-lang.org/documentation/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mathlib.community
    title: Lean mathlib community documentation
    url: https://leanprover-community.github.io/
    source_kind: reference-documentation
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.coq.documentation
    title: The Coq Proof Assistant documentation
    url: https://coq.inria.fr/documentation
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.beeson.proof_checking_euclid
    title: Proof-checking Euclid
    url: https://arxiv.org/abs/1710.00787
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Lean 4 design and metatheory papers
    reason: The claims about Lean 4 as a self-hosted, macro-extensible redesign and about the consistency strength of its type theory come from conference papers and a thesis on Lean's metatheory that the source registry does not list; only the language's own documentation is available to cite.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
  - label: Measurements of the de Bruijn factor
    reason: The figure of roughly four for the ratio of formal to informal length comes from published measurements on a handful of formalisations, beginning with Wiedijk's study of the quantity; the source registry lists none of them, so the number is stated here without a citation and should be checked against the measurement papers before this page rises above generated-draft.
    sections:
      - uses-and-applicability
  - label: Large Lean formalisation projects
    reason: Named research-level formalisations are the evidence that Lean scales beyond exercises, but no registry source documents any of them; the specific projects and dates should be checked against their repositories before this page rises above generated-draft.
    sections:
      - why-it-matters
      - uses-and-applicability
---

## Definition

**Lean** is an interactive theorem prover and a general-purpose functional
programming language built on dependent type theory. A mathematical statement is
encoded as a type, a proof of it is a term of that type, and a declaration is
accepted only when a small trusted **kernel** successfully checks that term
against that type. Everything else — the tactic language, the elaborator, the
editor integration — exists to help a human build such a term, and none of it is
trusted. The current version is Lean 4; Lean 3 is a different, retired language
with different syntax, and that distinction matters more in practice than any
other fact on this page.

## Why it matters

A Lean proof is checked without appeal to anyone's judgment about what is
"obvious". That buys three things. First, certainty for arguments too long or too
case-heavy for a referee to check by hand. Second, a shared library —
**mathlib** — in which a group, a topological space or a measure is defined once,
so that new work builds on old work instead of restating it. Single-foundation
libraries are not new — Mizar's MML and Metamath's set.mm long predate mathlib —
and what is distinctive about mathlib is its scale for dependent type theory, its
single tightly curated repository, and a refactoring culture willing to rework the
whole library at once; the contrast case is Coq, whose mathematics is spread
across independently maintained libraries.
Third, a machine-checkable target for automated systems, which is why Lean has
become the substrate for benchmarks of machine-generated mathematics.

## Intuition

Think of a pedantic compiler for mathematics. Where a typed programming language
refuses to compile `length(42)`, Lean refuses to accept a proof term whose type
is not the theorem you claimed. The type `2 + 2 = 4` is a proposition, and a
value of that type is a proof of it. Writing the proof is programming.

The analogy breaks in two places worth remembering. A compiler that accepts your
program says nothing about whether the program does what you wanted; neither does
Lean. And unlike ordinary programming, failure is usually not a bug in your
reasoning but a gap — a step you thought was one move and which is five.

## Concrete example

The same theorem twice, first as a term, then as a tactic script. This is Lean 4.

```lean
theorem and_swap (p q : Prop) (h : p ∧ q) : q ∧ p :=
  ⟨h.right, h.left⟩

theorem and_swap' (p q : Prop) (h : p ∧ q) : q ∧ p := by
  constructor
  · exact h.right
  · exact h.left

#print axioms and_swap
-- 'and_swap' does not depend on any axioms
```

`⟨_, _⟩` is the anonymous constructor for the structure `And`; `h.left` and
`h.right` project out its fields. The tactic version produces the same term by a
different route — `constructor` splits the goal `q ∧ p` into two goals and the
focus dots `·` discharge them in turn. `#print axioms` reports what the finished
proof actually rests on.

The Lean 3 version of the same script would have read `:= begin split, { exact
h.right }, { exact h.left } end`, with commas between tactics, `begin`/`end`
instead of `by`, and `split` rather than `constructor`. Lean 3 also wrote
anonymous functions as `λ x, f x` where Lean 4 writes `fun x => f x`, spelled the
naturals `nat` rather than `Nat`, and imported `data.nat.basic` rather than
`Mathlib.Data.Nat.Basic`. Pasting one dialect into the other produces syntax
errors that look like deep failures and are not.

## Formal treatment

Lean's kernel implements a dependent type theory in the family of the calculus
of inductive constructions. Judgments have the form $\Gamma \vdash e : \alpha$, read as
"in context $\Gamma$, the term $e$ has type $\alpha$". Types themselves live in a
hierarchy of universes `Sort u`, with `Prop` as `Sort 0` and `Type u` as
`Sort (u+1)`. `Prop` is impredicative and definitionally proof-irrelevant — any
two proofs of the same proposition are interchangeable to the kernel — which
`Type u` is not.

The central rule is application of a dependent function type
$(x : \alpha) \to \beta\,x$, written $\forall x, \beta\,x$ when $\beta\,x$ is a
proposition:

$$
\frac{\Gamma \vdash f : (x : \alpha) \to \beta\,x \qquad \Gamma \vdash a : \alpha}
     {\Gamma \vdash f\,a : \beta\,a}
$$

Under the propositions-as-types reading this single rule is both function
application and modus ponens. Implication is a function type, conjunction is a
pair, an existential is a dependent pair, and induction is the recursor that Lean
generates automatically for each inductive type.

Beyond the type theory Lean adds three axioms intended for mathematics —
`propext` (propositions with the same truth value are equal), `Quot.sound` (for
quotient types) and `Classical.choice` — and excluded middle is derived from them
rather than assumed. Core declares escape hatches alongside them: `sorryAx`
behind `sorry`, and `Lean.ofReduceBool` behind `native_decide`. `#print axioms`
reports every axiom a proof depends on, transitively, which is what makes both
the classical content of a result and the presence of an escape hatch auditable
mechanically.

Tactics are metaprograms written in Lean that build terms. A buggy tactic can
therefore fail, loop, or build the wrong term, but it cannot make the kernel
accept an ill-typed one. That separation — the de Bruijn criterion — is why the
trusted base is a few thousand lines of kernel rather than the whole system, and
why an independently written checker can re-verify an exported Lean environment.

## Assumptions and requirements

Kernel checking guarantees that the term inhabits the stated type. It assumes,
and cannot check, that the type says what you meant. Everything upstream of the
statement — the definitions, the hypotheses, the notation you read the goal
through — is yours to get right.

It also assumes the underlying theory is consistent, which by Gödel's second
incompleteness theorem Lean cannot establish about itself; the usual move is a
relative consistency result in strong set theory.

Two practical requirements follow from `Classical.choice`. Definitions that use it
do not compute, and must be marked `noncomputable`, so Lean's roles as prover and
as programming language pull apart here. And `decide`, which closes a goal by
evaluating a decision procedure, needs a `Decidable` instance and needs the
kernel to run that procedure — feasible only for small problems. Its faster
cousin `native_decide` hands evaluation to the compiled binary, which enlarges the
trusted base from the kernel to the compiler and runtime.

## Uses and applicability

Reach for Lean when a result is long, case-heavy, or contested; when a
computational step is too large to referee; when a definition will be reused by
many later results and needs to be pinned down exactly; or when you want a
machine-checkable target for search or for a model. Formalising also functions as
a diagnostic: Beeson, Narboux and Wiedijk's proof-checking of Euclid is the
classic demonstration that turning a revered informal text into a checkable one
exposes assumptions the original used without stating them.

Do not reach for it to understand an argument for the first time, to check a
three-line computation, or in an area mathlib has not reached — the cost of
formalisation is dominated by whether the definitions you need already exist. The
ratio of formal to informal length has a name — the de Bruijn factor — and has
been measured rather than merely asserted: the published measurements put it at
roughly a factor of four on the examples tried, on small samples and with wide
variation by area. What is folklore is the much larger figures quoted for effort
rather than length. Either ratio falls sharply as the library covers your area.

## Limitations and common mistakes

The most common error is dialect confusion. A great deal of Lean on the public
internet, in older tutorials, and in the output of language models is Lean 3;
mathlib3 is frozen and Lean 3 is unmaintained. If the code has `begin` or commas
between tactics, it will not compile.

The second is believing that "verified in Lean" means "true in the sense I have in
mind". It means the written statement has a proof. A hypothesis that is secretly
contradictory proves anything; a quantifier in the wrong order proves something
weaker; and Lean's total-function conventions bite — subtraction on `Nat` is
truncated, so `2 - 3 = 0`, and division by zero yields zero, so a theorem whose
statement permits a zero denominator may be saying much less than it looks.
Reading the formal statement, not the informal gloss, is the whole job of a
reviewer.

Third, `sorry` closes any goal with a warning, and code that compiles may still
contain one. `#print axioms` exposes it as a dependency on `sorryAx`; a claim of
formalisation that has not been checked that way has not been checked.

Fourth, an unhelpful expectation of automation. `simp`, `omega`, `decide` and
`aesop` dispatch routine goals, and none of them will find your argument for you.
Large `simp` sets can also loop or explode, and elaboration time is a real cost on
a large development.

## Variants and alternatives

The nearest relative is **Coq**, now also released under the name Rocq, built on
the calculus of inductive constructions with the Ltac tactic languages and a much
longer track record in verified software and compilers. **Isabelle/HOL** uses
simply-typed higher-order logic rather than dependent types, buying strong
automation through Sledgehammer at the cost of expressiveness. **Agda** is a dependently typed
relative on a different foundation — a predicative Martin-Löf type theory,
without CIC's impredicative, proof-irrelevant `Prop` — and is the furthest from
Lean in emphasis: dependently typed programming rather than a mathematical
library. **HOL Light** pushes the small-kernel idea to
its extreme. **Metamath** and **Mizar** sit on different foundations entirely.
Fully automatic provers — SMT solvers, resolution provers — are the genuinely
different approach: no human in the loop, and a far narrower class of statements.
Within Lean itself the live choices are the version, whether to depend on mathlib,
and how much to lean on search tactics such as `aesop`.

## History and attribution

Leonardo de Moura began Lean in 2013 at Microsoft Research, coming from work on
the Z3 SMT solver, and the early versions through Lean 3 established the system
mathematicians first adopted. Lean 4 is a redesign rather than an increment — the
system is largely written in Lean itself and its syntax is user-extensible — and
it superseded Lean 3 as the supported version. mathlib grew from the community
that formed around Lean 3 in the late 2010s and was ported wholesale to Lean 4,
a multi-year community effort that ended with mathlib3 frozen. Stewardship moved
to a dedicated non-profit organisation founded in 2023 to maintain the language.
The lineage is older than Lean, running back through de Bruijn's AUTOMATH and
Milner's LCF, from which the small-trusted-kernel discipline descends.

## Sources

The **Lean language documentation** is the reference for syntax, the tactic
language, the axioms and the kernel's type theory, and is the only place to
settle a Lean 4 question authoritatively. The **mathlib community documentation**
covers the library — naming conventions, contribution practice, the state of
coverage — and is where a working formaliser actually lives. The **Coq
documentation** is cited for the comparison, not for Lean. **Proof-checking
Euclid** is a concrete study, carried out in other systems, of what formalisation
reveals about an informal text.

## Prerequisites and next connections

Read [Propositional Logic](./propositional-logic.md) and
[First-Order Logic](./first-order-logic.md) first if the idea of a formal language
with its own syntax and rules is unfamiliar. [Proof Theory](./proof-theory.md)
supplies the notion Lean makes executable — a derivation as a finite object — and
is the best preparation for understanding why type-checking is proof-checking.

Afterwards, [Set Theory](./set-theory.md) is the foundation Lean deliberately does
not use, and comparing the two is the fastest way to see what dependent type
theory buys and costs. [Computability Theory](./computability-theory.md) explains
why proof checking is decidable while proof search is not, and
[Category Theory](./category-theory.md) is both a large part of mathlib and a
source of the structures Lean's type theory is often described with.
