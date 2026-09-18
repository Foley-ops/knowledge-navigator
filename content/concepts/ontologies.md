---
concept_id: concept.symbolic_ai.ontologies
title: Ontologies
slug: /concepts/ontologies
aliases:
  - formal ontology
kind: concept
tier: 1
review_state: generated-draft
summary: A machine-readable specification of a domain's classes, properties and individuals whose axioms act as premises for a reasoner rather than as constraints on what may be stored, so a query can return facts nobody ever wrote down.
categories:
  - Artificial Intelligence/Symbolic AI
primary_category: Artificial Intelligence/Symbolic AI
relationships:
  - type: specializes
    target: concept.symbolic_ai.knowledge_representation
    note: An ontology is one particular discipline of knowledge representation — declarative, class-and-property shaped, and committed to model-theoretic entailment rather than to procedures.
  - type: requires
    target: concept.logic.first_order_logic
    note: Description logic semantics is first-order semantics restricted to unary and binary predicates, so interpretations, satisfaction and entailment have to be understood before a subsumption axiom means anything.
  - type: contrasts_with
    target: concept.systems.relational_databases
    note: A relational schema is a constraint that rejects rows under complete information, whereas an ontology axiom is a premise that generates conclusions under incomplete information — the same declaration behaves oppositely in the two systems.
  - type: contributes_to
    target: concept.systems.graph_databases
    note: RDF triple stores are graph databases whose edges carry an ontology's declared semantics, which is what lets a query answer be inferred rather than only matched.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
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
  - source_id: source.plato.model_theory
    title: 'Stanford Encyclopedia of Philosophy: Model Theory'
    url: https://plato.stanford.edu/entries/model-theory/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-18
  - source_id: source.neo4j.documentation
    title: Neo4j documentation
    url: https://neo4j.com/docs/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: The W3C recommendations themselves — RDF 1.1, RDF Schema, OWL 2 and its EL, QL and RL profiles, SPARQL and SHACL
    reason: The registry contains no standards documents, so every specific claim about RDF syntax, RDFS entailment rules, the OWL 2 profiles and their intended trade-offs, and the standardisation dates in the history section is written here from general knowledge and needs checking against the specifications before this page leaves generated-draft.
    sections:
      - definition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: Complexity results for description logics (ALC, SROIQ, EL++ and DL-Lite)
    reason: No registered source covers the description logic complexity literature; these are stated from general knowledge and are the load-bearing justification for the claim that OWL profiles exist to buy tractability.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: Empirical results on ontology matching and alignment, including the Ontology Alignment Evaluation Initiative
    reason: The claim that automatic alignment on realistic ontology pairs still requires human curation is an empirical finding from the matching literature, and the registry has nothing covering it.
    sections:
      - limitations-and-common-mistakes
      - uses-and-applicability
claims: []
---

## Definition

An **ontology** is a formal vocabulary for a domain together with logical axioms
over it: _classes_ (unary predicates denoting sets of things), _properties_ or
_roles_ (binary predicates denoting relations between things), and _individuals_
(constants denoting particular things). Its characteristic axiom is
**subsumption**, written $C \sqsubseteq D$ and read "every instance of $C$ is an
instance of $D$", which orders the classes into a hierarchy. An ontology
_language_ fixes which axioms may be written; a _reasoner_ offers a standard set
of services over them — consistency (does any model of these axioms exist?),
classification (compute every subsumption the axioms imply, not just the asserted
ones), instance retrieval and query answering.

## Why it matters

Every large data estate has meaning that lives outside the data: that a
cardiologist is a kind of physician, that `treats` runs from clinicians to
patients, that `parent_of` and `child_of` are two views of one edge. That
knowledge usually sits in application code or in somebody's head, where it is
neither checkable nor reusable. An ontology moves it into the data layer as
axioms a machine can act on, which buys two things: integration, since parties
committed to the same hierarchy can merge data without agreeing on table layouts;
and _inference_, since an ontology answers questions whose answers were never
stored. Write axioms once instead of writing the same case analysis into every
query.

## Intuition

The useful picture is a Venn diagram that reasons. Each class is a set of
individuals, subsumption is containment, and a reasoner works out every
containment forced by the ones you asserted, then places each individual into
every set it must belong to.

The tempting analogy — "an ontology is a schema" — is worth stating precisely
because of where it breaks. A schema is a _constraint_: a row violating it is
rejected. An axiom is a _premise_: data that appears to violate it is used rather
than refused. Assert that Alice treats Bob, having declared that `treats` has
range `Patient`, and a relational system asks whether Bob is in the patients
table; an ontology concludes that Bob _is_ a patient. The declaration that looks
like validation is a generator.

## Concrete example

A small RDF graph in Turtle, using RDFS and OWL vocabulary:

```turtle
@prefix ex:   <http://example.org/> .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .

ex:Cardiologist rdfs:subClassOf ex:Physician .
ex:Physician    rdfs:subClassOf ex:Person .
ex:treats       rdfs:domain     ex:Physician ;
                rdfs:range      ex:Patient .
ex:hasSupervisor a owl:FunctionalProperty .

ex:alice rdf:type ex:Cardiologist .
ex:alice ex:treats ex:bob .
ex:alice ex:hasSupervisor ex:dr_chen , ex:c_chen .
```

A reasoner adds to this. From subclass transitivity: `ex:alice rdf:type
ex:Physician` and `ex:alice rdf:type ex:Person`. From the range of `treats`:
`ex:bob rdf:type ex:Patient` — Bob was never typed by hand. From functionality of
`hasSupervisor`, which says each thing has at most one: `ex:dr_chen owl:sameAs
ex:c_chen`, so two identifiers a database would have kept as two rows name one
person.

Now ask whether Alice is a surgeon. The answer is neither yes nor no but
_unknown_: nothing rules it out. Add
`ex:Cardiologist owl:disjointWith ex:Surgeon` and it becomes no. Whoever expected
"no" from the first graph imported an assumption the language does not make.

## Formal treatment

Ontology languages in the OWL family, OWL Full excepted, are **description
logics**: decidable fragments of [First-Order Logic](./first-order-logic.md)
restricted to unary and binary predicates, with variables suppressed. In the base language
$\mathcal{ALC}$, over concept names $N_C$, role names $N_R$ and individual names
$N_I$, concepts are built by

$$
C, D \;::=\; \top \mid \bot \mid A \mid \neg C \mid C \sqcap D \mid C \sqcup D
\mid \exists r.C \mid \forall r.C ,
$$

for $A \in N_C$, $r \in N_R$. An interpretation $\mathcal{I} =
(\Delta^{\mathcal{I}}, \cdot^{\mathcal{I}})$ has a non-empty domain and sends each
$A$ to a subset of $\Delta^{\mathcal{I}}$, each $r$ to a subset of
$\Delta^{\mathcal{I}} \times \Delta^{\mathcal{I}}$, and each $a \in N_I$ to an
element. The Boolean constructors are read as complement, intersection and union,
and the quantifiers as

$$
(\exists r.C)^{\mathcal{I}} = \{\, x : \exists y.\, (x,y) \in r^{\mathcal{I}}
\ \text{and}\ y \in C^{\mathcal{I}} \,\}, \qquad
(\forall r.C)^{\mathcal{I}} = \{\, x : \forall y.\, (x,y) \in r^{\mathcal{I}}
\Rightarrow y \in C^{\mathcal{I}} \,\}.
$$

A knowledge base $\mathcal{K} = (\mathcal{T}, \mathcal{A})$ pairs a _TBox_ of
subsumptions $C \sqsubseteq D$, satisfied when $C^{\mathcal{I}} \subseteq
D^{\mathcal{I}}$, with an _ABox_ of assertions $C(a)$ and $r(a,b)$. A model
satisfies everything in both, and $\mathcal{K} \models \alpha$ means every model
of $\mathcal{K}$ satisfies $\alpha$ — model-theoretic consequence, not
derivability in some procedure. Every service reduces to consistency:
$\mathcal{K} \models C \sqsubseteq D$ exactly when $\mathcal{K} \cup \{(C \sqcap
\neg D)(x)\}$ is inconsistent for a fresh $x$, which is why implemented reasoners
are satisfiability engines.

The W3C stack layers three levels on this. **RDF** is the data model: a graph of
triples $\langle$subject, predicate, object$\rangle$, with no ontology vocabulary
of its own. **RDFS** adds `rdfs:subClassOf`, `rdfs:subPropertyOf`, `rdfs:domain`
and `rdfs:range`, whose entailments follow from a fixed finite rule set.
**OWL 2 DL** corresponds to the description logic $\mathcal{SROIQ}$, adding
nominals, inverse and transitive roles, qualified cardinality restrictions and
role chains.

Expressivity is paid for in complexity: subsumption in $\mathcal{ALC}$ with
general TBoxes is ExpTime-complete, and for $\mathcal{SROIQ}$ it is
N2ExpTime-complete. The **OWL 2 profiles** exist for precisely this reason. EL
(the $\mathcal{EL}^{++}$ family) drops disjunction, negation and universal
restriction and classifies in polynomial time; QL is built so conjunctive queries
rewrite into first-order queries a SQL engine can run; RL is the fragment
implementable by forward-chaining rules over triples. Each is a deliberate
amputation of the logic bought in exchange for a tractability guarantee. OWL Full,
which lets the vocabulary be used without restriction over RDF, is undecidable.

## Assumptions and requirements

The **open-world assumption** is the one that catches people. An absent fact is
not a false fact: $\mathcal{K} \not\models \alpha$ and $\mathcal{K} \models \neg
\alpha$ are different situations and only the second is a denial. A conclusion
must hold in _every_ model, so anything the axioms leave open stays open.

OWL also makes **no unique name assumption**: two IRIs may denote the same
individual unless `owl:differentFrom` says otherwise. Drop this and the `sameAs`
inference above becomes an error report instead. Entailment is **monotone** —
adding axioms never withdraws a conclusion — so defaults and exceptions have no
home in the logic, and bolting rules onto a description logic destroys
decidability unless they are restricted to named individuals. The domain must
also admit crisp classes: there is no native degree of membership and no
probability, so a boundary case is either forced into a class or left unknown.

## Uses and applicability

Ontologies earn their keep where a shared vocabulary must outlive any one
application: biomedical terminologies such as SNOMED CT and the Gene Ontology,
whose hierarchies are large enough that automatic classification catches
incoherences hand maintenance misses; `schema.org` markup, a lightweight ontology giving web
pages machine-readable types; and data integration, where OWL 2 QL supports
querying a conceptual model while the data stays in a relational store.

Reach for one when the rules of the domain are stable, agreed and awkward to
encode in application logic, when several systems must exchange meaning rather
than bytes, or when derivations must be auditable. Do not, when the knowledge is
statistical, when the interesting relationships must be learned rather than
declared, or when what you want is validation — rejecting bad records is a
closed-world job OWL is the wrong tool for.

## Limitations and common mistakes

The dominant mistake is reading OWL as a constraint language. `rdfs:domain` does
not check types, it assigns them; a cardinality restriction does not reject an
extra edge, it either merges individuals or makes the knowledge base
inconsistent — and inconsistency is global, so one bad triple can make every
query return everything. The fix is a different tool, not a cleverer axiom: SHACL
or ShEx for closed-world validation of a graph's shape, OWL for what follows from
it.

The second is confusing the relations. `rdf:type` is membership,
`rdfs:subClassOf` is containment, and part-of is neither: a finger is part of a
hand, not a kind of hand, and asserting the subclass axiom lets a reasoner
conclude that every finger is a hand. Hierarchies built by conflating these are
formally consistent and factually absurd.

The third is expecting the reasoner to scale by hope. Worst-case complexity does
not describe typical behaviour — large EL-profile ontologies classify
routinely — but a few disjunctions or qualified cardinalities can move an
ontology into a regime where classification stops finishing, and that failure
arrives suddenly.

The practical difficulty, though, is **alignment**. Two ontologies for one domain,
built independently, almost never agree on granularity, on where a distinction is
drawn, or on whether something is a class or a property. Mapping between them with
`owl:equivalentClass` or `owl:sameAs` asserts an exactness that is usually false,
and because these are transitive and substitutive, one wrong mapping propagates
across both hierarchies at once. Automatic matching helps and does not finish the
job; realistic alignments are still curated by people, and no choice of language
removes that cost.

## Variants and alternatives

Within the family the ladder runs from RDFS (cheap, rule-computable, weak)
through the OWL 2 profiles EL, QL and RL, each trading a different piece of the
logic for a different guarantee, to OWL 2 DL and then undecidable OWL Full. Upper
ontologies — BFO, DOLCE, SUMO, and the hand-built commonsense base Cyc — fix the
top of the hierarchy so domain ontologies can hang off it; adoption is uneven.

Genuinely different approaches compete. **Property graphs**, the model behind
Neo4j and its Cypher query language, put attributes directly on nodes and edges
and offer traversal rather than entailment: far easier to start, with no
reasoning guarantees and no standard semantics for what an edge means. Datalog-style
rules express patterns over several variables that description logics cannot, at
the cost of the open-world model theory. **Knowledge graph embeddings** learn
vectors that score plausible edges, degrading gracefully where an ontology is
silent but unable to guarantee or explain a conclusion; large language models now
serve as soft, uncurated substitutes with the same loss.

## History and attribution

The word is borrowed from philosophy, where ontology is the study of what exists;
the computational sense is narrower and names an artefact rather than a theory.
The direct ancestor is the frame and semantic network tradition of the 1970s, and
the pivotal system is Brachman and Schmolze's KL-ONE (1985), which gave a network
notation a precise model-theoretic reading. Just before it, Brachman and Levesque
showed that a small increase in a frame language's expressive power could push
subsumption from tractable to intractable — the finding that turned the field into
the systematic study of the expressivity–complexity trade-off, and the reason the
OWL profiles look the way they do. In parallel, Lenat's Cyc project, begun in
1984, bet on scale instead.

Tom Gruber's definition from the early 1990s — an ontology as an explicit
specification of a conceptualisation — is the one the AI literature settled on.
Standardisation followed the Semantic Web programme: RDF became a W3C
recommendation in the late 1990s, OWL in 2004, and OWL 2, which introduced the
profiles, in 2009. That the profiles arrived only in the second version is the
history's own comment on the first.

## Sources

Russell and Norvig is the general reference for the arc: what a representation of
this kind is for, how description logics relate to first-order logic, why
subsumption and classification are the services on offer, and where the KL-ONE
lineage sits. The two Stanford Encyclopedia entries supply the logical foundation
the formal treatment rests on — Classical Logic for interpretations and the
consequence relation, Model Theory for what it means for a sentence to hold in
all models, which is exactly what an ontology's entailment asserts. The Neo4j
documentation is cited only for the property graph model and its traversal-based
querying.

## Prerequisites and next connections

Read [First-Order Logic](./first-order-logic.md) first: description logics are a
fragment of it, and satisfaction and entailment are its notions before they are an
ontology's. [Model Theory](./model-theory.md) sharpens the same machinery if
"true in every model" is unfamiliar.

From here, [Relational Databases](./relational-databases.md) is the productive
contrast — the same declaration is a constraint there and a premise here.
[Graph Databases](./graph-databases.md) covers storage and querying, including the
property graph model that competes with RDF, and
[Propositional Logic](./propositional-logic.md) the habit of settling a question by
testing satisfiability, which is the shape every reasoning service here takes —
over a description logic knowledge base rather than a propositional formula, and
at a far higher cost.
