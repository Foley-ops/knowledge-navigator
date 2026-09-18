---
concept_id: concept.symbolic_ai.knowledge_representation
title: Knowledge Representation
slug: /concepts/knowledge-representation
aliases:
  - knowledge representation and reasoning
kind: concept
tier: 1
review_state: generated-draft
summary: The study of how to encode what a system knows in a formal language it can compute over, where every choice of language is a bet on how much expressive power is worth how much reasoning cost.
categories:
  - Artificial Intelligence/Symbolic AI
primary_category: Artificial Intelligence/Symbolic AI
relationships:
  - type: requires
    target: concept.logic.first_order_logic
    note: Every formalism on this page is a syntax plus a model-theoretic semantics plus an entailment relation, and all three are first-order logic's apparatus either reused wholesale or deliberately restricted.
  - type: generalizes
    target: concept.symbolic_ai.ontologies
    note: An ontology is one product of knowledge representation — the agreed vocabulary of classes and relations for a domain — while the wider field also covers rules, defaults, and the inference machinery that runs over them.
  - type: contributes_to
    target: concept.planning.strips
    note: STRIPS is a representation decision before it is a planner, since its add and delete lists encode a persistence convention that answers the frame problem by fiat rather than by axiom.
  - type: contrasts_with
    target: concept.machine_learning.bayesian_networks
    note: Bayesian networks encode knowledge as conditional independences and numbers to be marginalised, where logical representations encode it as sentences whose consequences are fixed by entailment and carry no degree of belief.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.plato.classical_logic
    title: 'Stanford Encyclopedia of Philosophy: Classical Logic'
    url: https://plato.stanford.edu/entries/logic-classical/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-18
  - source_id: source.plato.computability
    title: 'Stanford Encyclopedia of Philosophy: Computability and Complexity'
    url: https://plato.stanford.edu/entries/computability/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.mikolov2013.word2vec
    title: Efficient Estimation of Word Representations in Vector Space
    url: https://arxiv.org/abs/1301.3781
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: Complexity results for named description logics and the OWL 2 profiles
    reason: No registry source states the complexity of concept satisfiability for specific description logics or documents the W3C OWL 2 profiles; the classes named here come from the description-logic literature and should be checked against a handbook before this page leaves draft.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: Neuro-symbolic and hybrid architectures
    reason: The registry has no survey of systems that combine learned perception with symbolic inference, so the claim that no hybrid architecture has become dominant is an assessment of the field rather than a cited one.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Knowledge representation** is the design of formal languages in which a system's
beliefs about a domain can be written down, together with the procedures that draw out
their consequences. A scheme is three things at once: a **syntax** saying which strings
are sentences, a **semantics** assigning each sentence a truth condition relative to a
structure, and a **proof procedure** that manipulates syntax alone yet is sound with
respect to that semantics. Drop the semantics and what remains is a data format.

## Why it matters

A database answers what was stored; a knowledge base answers what follows. Assert that
whales are mammals and mammals vertebrates, and a reasoner returns whales as vertebrates
though nobody wrote it. Three things follow that a learned model does not give.
Knowledge is **editable**: a changed regulation is a changed axiom, not a retraining run.
It is **auditable**: the derivation is the explanation. And it is **checkable**: a
reasoner can find a terminology inconsistent before it ships. SNOMED CT, the clinical
terminology in national health records, is maintained this way: its hierarchy over
hundreds of thousands of concepts is computed, not curated.

## Intuition

Picture a knowledge base as constraints on possible worlds: before you assert anything
every world is live, each sentence rules some out, and $\alpha$ is **entailed** when true
in every world still standing. Because adding sentences only removes worlds, classical
entailment is _monotonic_ — a conclusion once drawn is never withdrawn.

That is where the picture diverges from how people reason. Told Tweety is a bird you
conclude Tweety flies; told Tweety is a penguin you take it back. No monotonic logic
does this, which is why defaults need machinery of their own rather than a cleverer
axiom.

The second picture is a dial: more constructs draw finer distinctions and slow the
reasoner until it stops terminating. Every formalism named below is a setting of it.

## Concrete example

A description-logic knowledge base has a **TBox** of definitions and an **ABox** of
facts. Take

$$
\mathsf{Parent} \equiv \mathsf{Person} \sqcap \exists\,\mathsf{hasChild}.\mathsf{Person},
\qquad
\mathsf{Grandparent} \equiv \mathsf{Person} \sqcap \exists\,\mathsf{hasChild}.\mathsf{Parent}
$$

with the ABox $\mathsf{Person}(a)$, $\mathsf{Person}(b)$, $\mathsf{Person}(c)$,
$\mathsf{hasChild}(a,b)$, $\mathsf{hasChild}(b,c)$.

A reasoner derives $\mathsf{Parent}(b)$, then $\mathsf{Parent}(a)$, then
$\mathsf{Grandparent}(a)$ — none asserted. From the TBox alone it also derives
$\mathsf{Grandparent} \sqsubseteq \mathsf{Parent}$: anything with a child who is a
Parent has a child who is a Person. That second inference, **subsumption**, is what
builds a classification hierarchy automatically.

Note what is _not_ derived: nothing says $b \neq c$ or that $c$ is childless, so
$\mathsf{Parent}(c)$ is neither derived nor refuted — the open-world, no-unique-names
semantics that surprises people arriving from SQL.

## Formal treatment

An interpretation $\mathcal{I}$ of a language $L$ assigns a domain and denotations to its
symbols; $\mathcal{I} \models \alpha$ says $\alpha$ is true under it. For $KB \subseteq L$,

$$
KB \models \alpha \quad\text{iff}\quad \text{for every } \mathcal{I},\;
(\forall \beta \in KB.\; \mathcal{I} \models \beta) \Rightarrow \mathcal{I} \models \alpha .
$$

A procedure $\vdash$ is **sound** if $KB \vdash \alpha$ implies $KB \models \alpha$ and
**complete** if the converse holds; monotonicity is immediate, since every model of
$KB' \supseteq KB$ models $KB$.

The **expressivity–tractability trade-off** is a containment argument, not folklore. If
$L \subseteq L'$, every entailment instance in $L$ is already one in $L'$, so deciding
entailment in $L'$ is at least as hard: expressive power is monotone in the construct
set, and so is worst-case cost. Points on the dial:

- propositional Horn clauses: entailment in linear time;
- full propositional logic: entailment coNP-complete;
- the description logic $\mathcal{EL}$: subsumption in polynomial time even with a
  general TBox, which is why it classifies SNOMED-scale terminologies;
- $\mathcal{ALC}$: concept satisfiability PSPACE-complete without a TBox,
  EXPTIME-complete with a general one;
- first-order logic: validity undecidable but semi-decidable, so a complete procedure
  returns every entailment eventually and may not halt otherwise.

**Defaults** break monotonicity deliberately. A Reiter default rule
$\frac{\alpha : \beta}{\gamma}$ reads: if $\alpha$ is derived and $\beta$ is consistent
with everything believed, conclude $\gamma$. Its side condition mentions what is _not_
provable, so $\mid\!\sim$ admits $KB \mid\!\sim \alpha$ with
$KB \cup \{\delta\} \not\mid\!\sim \alpha$, and a theory may have several extensions or
none.

The **frame problem** is the representational cost of saying what does _not_ change.
Axiomatising $n$ actions and $m$ fluents in the situation calculus naively needs

$$
\mathrm{Holds}(f, s) \wedge \neg\mathrm{Affects}(a, f) \;\rightarrow\;
\mathrm{Holds}(f, \mathrm{Result}(a, s))
$$

across roughly $n \times m$ pairs. Reiter's successor-state axioms collapse this to one
axiom per fluent,
$F(\mathrm{Result}(a,s)) \leftrightarrow \gamma^{+}(a,s) \vee (F(s) \wedge \neg\gamma^{-}(a,s))$,
at the price of a completeness assumption: the listed effects are all the effects. STRIPS
takes that assumption as a convention rather than an axiom. The AI frame problem in this
sense is solved; the philosophers' version — what is _relevant_ at all — is a different
and open problem.

## Assumptions and requirements

Everything above rests on an **ontological commitment**: that the domain divides into
individuals, properties and relations stable enough to name. Where the salient
distinctions are perceptual, graded or context-dependent, that commitment fails, not the
logic on top of it.

Classical entailment also requires **consistency**. From a contradiction every sentence
follows, so one bad axiom from a merged source does not corrupt one answer, it makes
every query answer yes; assembled knowledge bases need repair or paraconsistent handling
as a matter of course.

Decidability holds for a _fragment_, not a style: combining individually harmless
constructs can cross the line, which is why standardised description logics restrict
which roles may carry number restrictions. And the semantics must be the one you
intended: open-world reasoning never concludes an unasserted fact false.

## Uses and applicability

Reach for explicit representation when the rules are stated by people rather than
inferred from examples, when an answer must be justified to a regulator or a clinician,
when knowledge changes by editing rather than retraining, and when consistency is itself
a requirement: medical terminologies, product configuration, access-control policy,
benefits calculation, planners' domain models.

Do not reach for it when the regularity is one nobody can write down — recognising a
face, judging whether a sentence is idiomatic, ranking search results. Knowledge
acquisition is skilled labour, and it limited expert systems long before any theoretical
limit bit.

## Limitations and common mistakes

The commonest error is believing a symbol means what its name says. `Aunt` means what
its axioms entail; an ontology documented only in English comments has no semantics, and
two teams will populate it differently.

The second is treating semantic networks and frames as alternatives to logic. Patrick
Hayes argued in the late 1970s that they are largely notational variants of fragments of
first-order logic; a diagram with no stated semantics is not more expressive than logic,
it is underspecified.

Third, defaults get bolted on informally. Inheritance with exceptions has more than one
defensible semantics, so settling each case by intuition makes a knowledge base
unpredictable.

Finally, the symbolic-versus-learned argument is conducted as if settled. It is not.
Hand-built knowledge is brittle, expensive, and has never scaled to open-domain
commonsense; learned representations are strong at perception and weak at auditability,
at guarantees over long chains, and at edit-one-fact updates. Claims on both sides are
benchmark results, not theorems.

## Variants and alternatives

**Logic programming** — Horn clauses under closed-world semantics with negation as
failure, as in Prolog and Datalog — buys fast, complete query answering and loses
disjunction and classical negation. **Semantic networks** and their descendant the
RDF-style knowledge graph buy cheap traversal and readable structure at the cost of
under-specified edge semantics. **Frames** add slots and default fillers, and
**description logics** reconstruct them with model-theoretic semantics and decidable
reasoning; the OWL 2 profiles offer tractable corners of that family. **Answer set
programming** is the practical home of non-monotonic reasoning. **Probabilistic**
schemes such as Bayesian networks and Markov logic buy uncertainty and lose crisp
entailment. **Learned distributed representations**, from word2vec-style embeddings to
knowledge-graph embeddings, buy graded similarity and tolerance of noise and lose the
ability to state a constraint and have it hold. Hybrids — a learned front end feeding a
symbolic engine, or a language model drafting an encoding a solver checks — are active
work with no standard architecture.

## History and attribution

McCarthy's 1959 "Programs with Common Sense" made the founding proposal: a program
should hold what it knows declaratively and derive consequences, rather than have it
compiled into procedures. Quillian's semantic networks came out of 1960s work
on human semantic memory; Minsky's frames followed in the mid-1970s from the observation
that knowledge arrives in structured chunks. McCarthy introduced the situation
calculus in 1963, and he and Hayes named the frame problem in 1969.

Non-monotonic reasoning arrived as a cluster around 1980 — Reiter's default logic,
McCarthy's circumscription, McDermott and Doyle's non-monotonic logic — independent
attacks on one gap. Expert systems of the same period turned representation
into engineering and exposed the knowledge-acquisition bottleneck. Brachman's KL-ONE and
the tractability analyses he and Levesque pursued in the mid-1980s made the trade-off an
object of study, a line running to description logics and the web ontology standards of
the 2000s.

## Sources

**Russell and Norvig** is the backbone: logical agents, ontological engineering,
semantic networks and description logics, default reasoning and circumscription, the
frame problem with its successor-state solution, and the historical attributions in its
notes. The **SEP entry on classical logic** covers entailment, soundness,
completeness and monotonicity; the **SEP entry on computability and complexity** covers
decidability and the undecidability of first-order validity. **word2vec** is cited only
as the learned-representation alternative.

## Prerequisites and next connections

Read [First-Order Logic](./first-order-logic.md) first — its entailment and models are
used here without re-derivation — or
[Propositional Logic](./propositional-logic.md) if the satisfaction relation is
unfamiliar. [Model Theory](./model-theory.md) develops the semantics side, and
[Computational Complexity](./computational-complexity.md) supplies the classes that make
the trade-off quantitative.

Onward: [Bayesian Networks](./bayesian-networks.md) answers the same question
probabilistically, [Graph Databases](./graph-databases.md) is what semantic networks
became once engineering outweighed entailment, and [Lisp](./lisp.md) is where much of
this work was built.
