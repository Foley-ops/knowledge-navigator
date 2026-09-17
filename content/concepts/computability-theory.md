---
concept_id: concept.foundations.computability_theory
title: Computability Theory
slug: /concepts/computability-theory
aliases:
  - recursion theory
kind: concept
tier: 1
review_state: generated-draft
summary: The mathematical study of which problems admit an algorithm at all, which fixes a precise machine model and then proves that specific, clearly stated questions — the halting problem first among them — have no algorithmic answer.
categories:
  - Mathematics/Foundations
primary_category: Mathematics/Foundations
relationships:
  - type: requires
    target: concept.foundations.set_theory
    note: Its objects are sets of strings and partial functions, and the halting argument is Cantor's diagonal method applied to the countable set of machine descriptions.
  - type: contributes_to
    target: concept.logic.first_order_logic
    note: 'Church and Turing answered the Entscheidungsproblem with it: validity of first-order sentences is recognizable but not decidable.'
  - type: contributes_to
    target: concept.logic.proof_theory
    note: '"Effectively axiomatizable" is a decidability condition on a theory''s axiom set, and the incompleteness theorems are stated only for theories that satisfy it.'
sources:
  - source_id: source.plato.computability
    title: 'Stanford Encyclopedia of Philosophy: Computability and Complexity'
    url: https://plato.stanford.edu/entries/computability/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.turing1936.computable_numbers
    title: On Computable Numbers, with an Application to the Entscheidungsproblem
    url: https://londmathsoc.onlinelibrary.wiley.com/doi/10.1112/plms/s2-42.1.230
    source_kind: primary-research
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.theory_of_computation
    title: MIT 18.404J Theory of Computation (Fall 2020)
    url: https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/
    source_kind: lecture-or-course
    supports:
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.coq.documentation
    title: The Coq Proof Assistant documentation
    url: https://coq.inria.fr/documentation
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Computability theory** — classically recursion theory — studies which partial
functions on the natural numbers, and which sets of finite strings, can be computed
by a mechanical procedure, made precise as a **Turing machine**. Its central
distinction: a set is **decidable** when some machine halts on every input and
answers membership correctly, and merely **recognizable** (equivalently
_recursively enumerable_, or _semi-decidable_) when some machine accepts exactly
the members but on a non-member may reject or may run forever.

Turing machines, Church's $\lambda$-calculus and Kleene's general recursive
functions compute exactly the same partial functions; that equivalence is a
theorem, proved by mutual simulation. The **Church–Turing thesis** — that this
class is also the informal class of "effectively calculable" functions — is not,
and cannot be, because one side of the identity is informal.

## Why it matters

Before 1936, "there is no procedure for this" was a remark rather than a provable
claim: a negative about procedures needs a definition of procedure. Hilbert's
Entscheidungsproblem asked for an algorithm deciding validity of first-order
sentences, and answering _no_ is what Turing's machines were invented for.

The payoff is that impossibility becomes provable. No general termination checker
exists, no general program-equivalence checker, no sound and complete analyzer for
any non-trivial semantic property of programs — so every real type checker and
verifier is partial, conservative or bounded by construction.

## Intuition

Picture an infinite table: one row per program, one column per input, each cell
saying whether that program halts on that input. Programs are finite strings, so
both axes are countable and the table is well defined. A halting decider would
itself be a program, hence a row. Now build a program that consults the decider on
each row's diagonal cell and does the opposite. It differs from every row
somewhere, so it is no row at all — yet it is a program, so it must be one.

This is Cantor's diagonal argument, and the analogy holds through the construction
but not the conclusion. Cantor infers that the reals outnumber the naturals; here
both sides are countable and no cardinality claim follows. What is diagonalized out
of existence is the assumed _total_ decider.

## Concrete example

Assume a function `halts(src, inp)` returning `True` or `False` for every pair,
where `src` is a program's source text. Then this program exists too:

```python
def diagonal(src):
    if halts(src, src):
        while True:
            pass        # never returns
    return "done"
```

Let $d$ be the source text of `diagonal`. If `halts(d, d)` is `True`, then
`diagonal(d)` loops forever; if it is `False`, then `diagonal(d)` returns. Either
answer is wrong, so `halts` does not exist.

Undecidability then travels by reduction. Given that acceptance is undecidable, map
$\langle M, w \rangle$ to a machine $M'$ that ignores its own input, simulates $M$
on $w$, halts if $M$ accepts and loops if $M$ rejects. Emitting $\langle M',
\varepsilon \rangle$ only rewrites a finite description — nothing is simulated
while building it — so the map is total computable, and $M$ accepts $w$ exactly
when $M'$ halts on $\varepsilon$.

## Formal treatment

Fix a finite alphabet $\Sigma$ and an effective enumeration $M_0, M_1, \dots$ of
Turing machines. Write $\varphi_e$ for the partial function computed by $M_e$ and
$W_e = \{x : \varphi_e(x)\downarrow\}$ for its domain, where $\downarrow$ means
"halts". A set $A \subseteq \Sigma^*$ is **decidable** if its characteristic
function is total computable, and **recognizable** if $A = W_e$ for some $e$.

_Universality._ Turing's 1936 paper builds a machine $U$ with
$U(\langle e, x\rangle) \simeq \varphi_e(x)$: one machine simulating all of them.

_Complementation._ $A$ is decidable if and only if both $A$ and $\Sigma^* \setminus
A$ are recognizable — run both recognizers in parallel and exactly one halts. So
$\mathrm{HALT}$ is recognizable, its complement is not, and recognizability is
strictly weaker than decidability rather than a variant of it.

_Many-one reduction._ $A \le_m B$ when some **total** computable $f$ satisfies
$x \in A \iff f(x) \in B$. If $B$ is decidable then so is $A$; contrapositively, an
undecidable $A$ forces $B$ to be undecidable. Totality is not decoration — a
partial $f$ breaks the argument — and the weaker Turing reduction, which may query
$B$ as an oracle, transfers decidability but not recognizability.

Rice's theorem generalizes the pattern: for a set $P$ of partial computable
functions that is neither empty nor all of them, $\{e : \varphi_e \in P\}$ is
undecidable. Both conditions bind, and $P$ must be a property of the function
computed, not of the machine's text — "has fewer than 100 states" is decidable and
no counterexample. The conclusion is undecidability, never non-recognizability.

## Assumptions and requirements

"Fix an effective enumeration" carries more weight than its length suggests. The
numbering must be computable both ways, must admit the universal machine $U$, and
must satisfy a parametrization property: from a program and part of its input one
can _compute_ a program for the rest, without running anything. Numberings with
those properties are called **acceptable**, and any two of them are related by a
computable bijection — which is why nothing above depends on how machines are
written down. Drop parametrization and the reduction in _Concrete example_ loses
its licence: assembling $M'$ out of $\langle M, w \rangle$ is an appeal to exactly
that property, and the claim that the assembly is itself computable is the whole
content of the step.

Instances must be finite objects, presented through a computable encoding. A
question acquires a decidability status only once its inputs are strings: "is this
real number rational" is not undecidable, because as posed it has no finite input
to be handed. The everyday licence to ignore encoding details — binary or ASCII,
adjacency list or matrix — holds because honest encodings convert into each other
by total computable maps. That is a hypothesis being silently discharged, not an
irrelevance, and it fails for encodings chosen adversarially.

The resource discipline binds from both sides. Time and tape are unbounded, yet
every halting run consumes only finitely much of each. Fix the tape at $k$ cells
and halting becomes decidable: there are only $|Q| \cdot k \cdot |\Gamma|^k$
configurations, so a machine still running after that many steps has repeated one
and never will stop. This is why a laptop with finite memory is not a
counterexample, and why the observation is useless — the bound is astronomical,
and the model with unbounded tape is the one that predicts what programs actually
do. Relax the other side, permitting a machine to complete infinitely many steps
and read off the outcome, and $\mathrm{HALT}$ falls immediately. The subject is a
discipline on resources, not a fact about matter.

Finally, the decider being refuted is assumed total _and_ correct on every input.
The diagonal construction manufactures a single adversarial argument and needs the
answer to be right on that one. Correctness on all but finitely many inputs, or on
the programs people actually write, is untouched by the proof — which is why
average-case termination analysis is a live research area and not a contradiction
in terms.

## Uses and applicability

Reach for computability theory whenever someone proposes a tool meant to work on
all programs, all grammars, all Diophantine equations or all tilings. A reduction
from the halting problem often settles such a question in an afternoon, and the
list it has settled is long: first-order validity, Hilbert's tenth problem, the
word problem for finitely presented groups.

Do not reach for it to explain why one particular program resists analysis.
Undecidability is a statement about a family of instances, never a single one: a
tool answering "yes", "no" or "cannot tell" on every input is fully compatible with
the theorem. Nor does it bear on cost; a decidable problem can be hopelessly
expensive, which is complexity theory's subject.

## Limitations and common mistakes

The most common error is calling the Church–Turing thesis a theorem. What was
proved is that several independently proposed formalisms coincide; the thesis adds
that this class matches an informal notion, which no proof can establish. It is
very well supported — by that convergence, and by Turing's analysis of a human
calculator working with paper — and it remains a thesis. The separate _physical_
Church–Turing thesis, about what physical devices can compute, is empirical and
genuinely contested, and bears on the mathematical one not at all.

Second, "undecidable" does not mean unknown, open or merely difficult; it is a
proof that no algorithm exists, and it is never about one instance — whether _your_
program halts is a fixed fact, usually provable.

Third, recognizable gets used as though it meant decidable. A recognizer that has
run for an hour without accepting has told you nothing, and the asymmetry is
permanent, since the complement of a recognizable undecidable set is never
recognizable.

Fourth, and constant in practice, is reducing the wrong way. To prove $B$
undecidable, reduce a known undecidable $A$ _to_ $B$; reducing $B$ to $A$ shows
only that $B$ is no harder.

## Variants and alternatives

Swapping the machine model is the variation that changes least. Register machines,
two-counter machines, tag systems, unrestricted grammars and the cellular
automaton Rule 110 all compute exactly the partial computable functions, so
picking one buys convenience in a particular proof — grammars for questions about
languages, counter machines for short universality arguments — at no cost in
what is computable. The cost surfaces a level down: mutual simulation is not free,
a one-tape machine pays a quadratic factor against a multi-tape one, and once the
question concerns resources the choice of model stops being arbitrary.

Restricting rather than re-encoding is the genuinely different design. The
**primitive recursive** functions are built from composition and bounded
recursion, so every one of them is total and the halting question does not arise
inside the class. What that buys is termination by construction, which is why
proof assistants such as Coq admit only recursion whose termination a checker can
see. What it costs is reach, in two ways: Ackermann's function is total computable
and not primitive recursive, and no class of total functions can contain its own
interpreter, since a universal function for such a class can be diagonalized into
a total function outside it. Systems that make this trade pay for it with an
escape hatch — a termination annotation, a fuel parameter, an explicit treatment
of partiality.

Weakening the demand on the _answer_ instead of the machine gives **limit
computability**: the procedure emits a guess at every step and may revise it
finitely often, with only the final guess required to be correct. $\mathrm{HALT}$
yields to this — answer "no", and switch to "yes" if the simulation ever stops.
It buys a workable notion where no decider exists, and costs the property that
made decidability worth having, since nothing ever tells you the current guess is
the last one. **Relative computability** changes what the machine may consult
rather than what it may do: an oracle for $\mathrm{HALT}$ trivializes halting and
immediately leaves a harder halting problem above it, so unsolvability acquires
structure instead of being a single undifferentiated heap.

Two proposals are put forward as alternatives and are not. Probabilistic and
quantum Turing machines compute precisely the same partial functions as ordinary
ones; their entire interest lies in cost, and a quantum computer decides nothing
new. Models that do exceed Turing computability — infinite-time machines,
real-number machines in the Blum–Shub–Smale style — buy a coherent theory of
computation over uncountable inputs, where bit encodings have nothing to bite on,
and cost any connection to a buildable device. Undecidability reappears within
each of them regardless.

## History and attribution

The problem came first and the machines were built to answer it. Hilbert and
Ackermann set out the **Entscheidungsproblem** in _Grundzüge der theoretischen
Logik_ (1928): find a procedure deciding whether a first-order sentence is valid.
Hilbert expected one to exist. Gödel's incompleteness theorems of 1931 made that
look doubtful without settling it, because a negative answer needs a definition of
"procedure", and there was none.

Three definitions arrived within a few years and turned out to be one. Gödel, in
his 1934 Princeton lectures and following a suggestion of Jacques Herbrand,
defined the **general recursive** functions. Church, with his students Kleene and
Rosser, developed the $\lambda$-calculus, and in 1936 published the first
unsolvability result together with the proposal to identify effective
calculability with $\lambda$-definability — the claim Kleene later named Church's
thesis. Turing, at Cambridge and unaware of Church, submitted _On Computable
Numbers_ the same year, adding an appendix once he learned of the overlap that
sketched the equivalence of his machines with $\lambda$-definability. Emil Post
published an almost identical model independently in 1936 as well. Priority
between Church and Turing is a matter of months, and the genuinely accurate
account is that the notion was found three or four times over.

What set Turing's paper apart was not the theorem, which Church had, but the
argument for the definition: an analysis of what a human calculator, working with
paper and a finite set of rules and able to attend to only finitely much at once,
can do in a single step. Gödel had not been persuaded by $\lambda$-definability or
by his own general recursiveness as accounts of effective calculability, and it
was Turing's analysis that he credited with settling the question. Note also that
Turing's paper does not contain the halting problem in the form given above; what
he proves undecidable is whether a machine is _circle-free_ — whether it goes on
printing digits forever. The name and the modern phrasing are later, and are
usually credited to Martin Davis's _Computability and Unsolvability_ (1958).

The field then built outward from the negative results. Post's 1944 paper on
recursively enumerable sets asked whether an undecidable such set could be simpler
than $\mathrm{HALT}$; Richard Friedberg and Albert Muchnik answered it
independently in 1956–57 by inventing the priority method, the same idea arriving
twice again. Rice proved his theorem in 1953, out of his doctoral work. Two of the
classical unsolvable problems came from outside logic: the word problem for
finitely presented groups, settled by Pyotr Novikov in 1955 and independently by
William Boone, and Hilbert's tenth problem, where Davis, Putnam and Julia Robinson
spent two decades reducing it to the existence of a Diophantine relation of
exponential growth and Yuri Matiyasevich supplied one in 1970.

Even the name is attributable. "Recursion theory" was standard for fifty years;
Robert Soare argued in 1996 that it misdescribed the subject — recursion is a
device for defining things, computability is what the field is about — and
"computability theory" has since become usual, with both still in print.

## Sources

Turing's 1936 paper is the primary source for the machine model, the universal
machine and the diagonal argument, and is still readable. MIT 18.404J is the route
into decidability, reducibility and Rice's theorem, with worked reductions. The
Stanford Encyclopedia entry is careful about what the Church–Turing thesis does and
does not assert. Arora and Barak take over at resource-bounded computation.

## Prerequisites and next connections

Understand first what a formal language and a finite string are, and enough
[Set Theory](./set-theory.md) for countability and Cantor's diagonal argument — the
halting proof is that argument in a new costume.
[First-Order Logic](./first-order-logic.md) is what the Entscheidungsproblem was
asking about.

Three directions open from here. Gödel's incompleteness theorems, which assume a
theory whose axioms form a decidable set, turn on the same self-reference and sit
inside [Proof Theory](./proof-theory.md). Complexity theory refines the decidable
side by time and space. Degree theory refines the undecidable side with oracles,
making the halting problem the first of a hierarchy of unsolvabilities rather than
the only one.
