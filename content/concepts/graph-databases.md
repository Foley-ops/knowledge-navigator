---
concept_id: concept.systems.graph_databases
title: Graph Databases
slug: /concepts/graph-databases
aliases:
  - graph DBMS
  - property graph database
kind: concept
tier: 1
review_state: generated-draft
summary: A class of database systems that store nodes and edges as first-class records so that following a relationship is a pointer hop rather than a join, which makes deep and variable-length traversals cheap and most other workloads no better than relational.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: requires
    target: concept.algorithms.graph_algorithms
    note: The whole design exists to make breadth-first expansion from an anchor node cheap, and the cost argument is unreadable without knowing what a traversal is and what it costs.
  - type: requires
    target: concept.algorithms.core_data_structures
    note: The comparison is literally adjacency lists of pointer records against B-tree index probes, so neither side of it can be evaluated without those two structures.
  - type: contrasts_with
    target: concept.systems.relational_databases
    note: They store the same information — entities and the links between them — but a relational engine reconstructs a link by matching key values at query time while a graph engine has it materialised as a stored pointer.
  - type: unreliable_when
    target: concept.systems.distributed_systems
    note: Index-free adjacency degrades to a network round trip as soon as the graph is partitioned across machines, and power-law graphs admit no good balanced edge cut, so the traversal advantage is weakest exactly where scale forces sharding.
sources:
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.neo4j.documentation
    title: Neo4j documentation
    url: https://neo4j.com/docs/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.postgresql.documentation
    title: PostgreSQL documentation
    url: https://www.postgresql.org/docs/current/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
unresolved_references:
  - label: W3C RDF and SPARQL 1.1 Recommendations
    reason: The registry holds no W3C source, so the triple model, the property-path syntax used in the SPARQL example and the standardisation dates are uncited; Designing Data-Intensive Applications describes triple-stores and SPARQL informally but not at specification detail.
    sections:
      - concrete-example
      - formal-treatment
      - history-and-attribution
  - label: Apache TinkerPop/Gremlin documentation and ISO/IEC 39075 (GQL)
    reason: No registry source covers Gremlin's step-based traversal language or the ISO graph query language standard, so the claims about both rest on nothing cited here.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

A **graph database** is a database management system whose stored unit is the
node and the edge rather than the row. An edge is a physical record that holds
the identities of its two endpoints, so "follow this relationship" is a
dereference of a stored reference; it is not a predicate to be evaluated against
an index at query time. This property is usually called **index-free
adjacency**, and it is a property of the storage engine, not of the data model.

Two data models dominate. The **property graph** has typed, directed edges, with
both nodes and edges carrying a label and an open set of key–value properties;
its query languages are Cypher and Gremlin. **RDF** represents everything as a
uniform triple — subject, predicate, object — with no properties on the edge; its
query language is SPARQL.

## Why it matters

The cost of a relationship hop is the whole argument. In a relational store,
`knows(from_id, to_id)` is a table, and reaching a friend-of-a-friend-of-a-friend
means three self-joins, each an index probe, with a planner estimating every
intermediate result from statistics that self-joins make unreliable. Worse, a
query of the form "everyone reachable at any distance" has no fixed join count
at all: plain relational algebra cannot express transitive closure, and SQL needs
the recursive extension added in SQL:1999. A bounded query — one to six hops —
does have a fixed join count, being the union of six fixed-length join chains, so
there the recursive form is a convenience rather than a necessity.

A graph engine answers the same question by expanding the frontier, touching
only the subgraph it actually visits. It also buys schema looseness: a hundred
sparsely-used relationship types cost nothing, where a relational schema would
need a hundred tables or one wide table full of nulls.

## Intuition

Picture the two layouts. A relational join is looking a name up in a phone book:
ordered data, a binary search, cost growing with the size of the book. An
adjacency list is a linked structure: each node already holds the addresses of
its neighbours, so expanding it costs only the degree of the node. Graph
databases are the claim that a database can be the second thing on disk.

The analogy breaks at exactly one place, and it is the important one. In memory,
a pointer dereference is nanoseconds. On disk, it is a page read, and a random
page read is not free. A relational index probe over a table whose upper B-tree
levels are cached can be cheaper than a cold pointer chase. Index-free adjacency
removes a logarithm; it does not remove I/O.

## Concrete example

Ada's acquaintances up to four hops out, in Cypher:

```cypher
MATCH (:Person {name: 'Ada'})-[:KNOWS*1..4]->(f:Person)
WHERE f.city = 'Cambridge'
RETURN DISTINCT f.name
```

The same shape in SPARQL, over triples:

```sparql
PREFIX ex: <http://example.org/>
SELECT DISTINCT ?name WHERE {
  ex:ada ex:knows+ ?f .
  ?f ex:city "Cambridge" ; ex:name ?name .
}
```

Note what changed: SPARQL 1.1 property paths offer `*`, `+` and `?` but no
bounded `{1,4}` — the range operator was in the drafts and was cut before
Recommendation — so there is no concise bounded-repetition operator. A depth
limit must instead be spelled out as an explicit alternation of path lengths
(`ex:knows|ex:knows/ex:knows|…`), and the `+` used here means "any distance".
And in PostgreSQL:

```sql
WITH RECURSIVE reach(id, depth) AS (
  SELECT id, 0 FROM person WHERE name = 'Ada'
  UNION
  SELECT k.to_id, r.depth + 1
  FROM reach r JOIN knows k ON k.from_id = r.id
  WHERE r.depth < 4
)
SELECT DISTINCT p.name FROM reach r JOIN person p ON p.id = r.id
WHERE p.city = 'Cambridge' AND r.depth > 0;
```

The `r.depth > 0` matters: the recursion is seeded with Ada herself at depth 0,
and without that filter the query would return her, where the Cypher `*1..4` and
the SPARQL `+` both demand at least one hop.

All three are correct — the SPARQL one modulo the missing depth bound just noted.
The third is longer, needs the depth column to terminate
on a cyclic graph, and re-probes an index every hop — but it runs, and with an
index on `knows(from_id)` it often runs fast.

## Formal treatment

A property graph is $G = (V, E, \mathrm{src}, \mathrm{tgt}, \lambda, \sigma)$:
$V$ the nodes, $E$ the edge identities, $\mathrm{src}, \mathrm{tgt} : E \to V$
the endpoint maps (so parallel edges are allowed), $\lambda$ assigning labels to
$V \cup E$, and $\sigma$ a partial map from $(V \cup E) \times K$ to values. RDF
instead is a set of triples

$$
T \subseteq (I \cup B) \times I \times (I \cup B \cup L),
$$

with $I$ IRIs, $B$ blank nodes and $L$ literals — no edge properties, which is
why RDF models them by reifying the edge into a node.

For cost, let $d(v)$ be the degree of $v$. Expanding $v$ under index-free
adjacency is $\Theta(d(v))$ and independent of $|V|$ and $|E|$, so a bounded
breadth-first traversal costs $\Theta\!\left(\sum_{v \in S} d(v)\right)$ over the
visited set $S$ — the standard adjacency-list traversal bound. The relational
plan visits the same frontier but pays an index probe per element:

$$
\Theta\!\left(\sum_{v \in S} \bigl(\log |E| + d(v)\bigr)\right).
$$

The asymptotic gap is a logarithm, which is small. The measured gap is mostly
constants — locality, no tuple reconstruction, no re-estimation per hop — and it
compounds with depth, which is why honest comparisons separate depth-1 lookups
from depth-6 traversals.

Pattern matching itself is a conjunctive query: fixed-pattern evaluation is
polynomial in the data, but combined complexity in the pattern size is NP-hard,
so a large `MATCH` is a join-ordering problem like any other. Semantics differ
between languages: Cypher forbids reusing a relationship within one `MATCH`,
while SPARQL uses plain homomorphism, so the two can answer the same-looking
query differently.

## Assumptions and requirements

Index-free adjacency must actually be implemented. A "graph database" layered on
a key–value or relational store resolves each hop through that store's index and
inherits its costs; the label on the product is no guarantee.

The traversal must be local, since the advantage is touching only the visited
subgraph. It evaporates when a query touches most of the graph — that is a scan,
and scan engines are better at scans.

You still need an index to find the anchor node: index-free adjacency applies to
the hops after the starting point, never to locating it.

Degrees must be moderate. A supernode with ten million edges makes $\Theta(d(v))$
the dominant term and turns a traversal into a scan of one edge list.

And the graph should fit one machine, or partition cleanly. Balanced graph
partitioning is NP-hard, and real social and web graphs are power-law, so no edge
cut is small; every cut edge converts a pointer hop into a network round trip.

## Uses and applicability

Reach for one when the queries are variable-length reachability over a densely
connected, heterogeneous dataset: fraud-ring detection, authorisation
reachability, infrastructure dependency topology, supply-chain and data-lineage
tracing, knowledge graphs with ontologies. RDF specifically buys global
identifiers and vocabulary reuse across organisations, which is the point of
publishing data on the web.

Do not reach for one for aggregation over large fractions of the data, for
analytical workloads over many attributes, for high-throughput writes of mostly
independent records, or for a schema whose joins are one or two hops deep and
already indexed.

## Limitations and common mistakes

The most common mistake is believing relational databases cannot do this. They
can, with recursive CTEs, and at depth one or two on indexed foreign keys a
mature relational engine is usually competitive or faster, with better tooling.
The graph advantage grows with depth and with unbounded path patterns; vendor
benchmarks showing enormous factors almost always measure deep traversals. The
independent comparison literature is mixed and workload-dependent, and it is fair
to say this is not settled.

The second is reading "index-free" as "no indexes needed". The third is modelling
everything as a node: turning every attribute value into a node explodes edge
counts and manufactures supernodes. The fourth is confusing a graph database
with a graph processing framework — the Pregel lineage does whole-graph iterative
analytics, a different workload from short online traversals — or with graph
neural networks, which share only the word. The fifth is underestimating the
ecosystem cost: three incompatible query languages and migration paths that are
mostly rewrites.

## Variants and alternatives

**Native property-graph engines** implement index-free adjacency directly.
**Layered engines** put a graph API over a distributed key–value store, buying
horizontal scale and losing the pointer hop. **RDF triple-stores** and
quad-stores add named graphs, RDFS/OWL entailment and SHACL validation, which no
property-graph system offers natively. **Datalog-backed stores** make recursion a
language primitive rather than a syntax extension. **Multi-model databases** ship
a graph API alongside document and relational ones.

The genuine competitor is a relational database with a well-indexed edge table
and recursive CTEs, plus the SQL/PGQ property-graph extension where available.
For a graph that fits in RAM, an in-memory library often beats either. Query
languages have been converging: Cypher was opened as openCypher, and an ISO
standard graph query language, GQL, has been published.

## History and attribution

Navigational, pointer-following databases came first: the CODASYL network model
of the late 1960s stored records linked by sets and was queried by walking those
links by hand. Codd's relational model, published in 1970, displaced it over the
following decade and a half — the research prototypes ran through the 1970s while
CODASYL and IMS held production, commercial relational systems arrived at the end
of that decade, and they took over in the 1980s — precisely because hand-written
navigation was brittle. Graph databases are best understood
as the return of navigation with a declarative language on top — Kleppmann makes
this comparison directly, noting that a graph query language says which pattern
to find rather than how to walk.

The RDF line came from W3C Semantic Web work in the late 1990s, with SPARQL
reaching Recommendation status in 2008. The property-graph line grew from
commercial engines of the 2000s: Neo4j introduced Cypher around 2011, and Gremlin
came from the TinkerPop project of roughly the same period. "Index-free
adjacency" is vendor and community vocabulary from those years, not a term of art
from a theorem.

## Sources

Designing Data-Intensive Applications, Chapter 2, treats the two data models side
by side, with Cypher, SPARQL and the equivalent recursive SQL, and supplies the
CODASYL-to-relational-to-graph history. The Neo4j documentation is the reference
for the property-graph model as implemented, and for Cypher's syntax, matching
semantics, index and dense-node behaviour. The PostgreSQL documentation covers
recursive CTEs and the index machinery that makes the relational alternative
competitive. MIT 6.006 supplies the adjacency-list representation and the
traversal cost bound the index-free adjacency argument is built on.

## Prerequisites and next connections

Read [Graph Algorithms](./graph-algorithms.md) first: breadth-first expansion and
its cost are what this system exists to make cheap.
[Core Data Structures](./core-data-structures.md) supplies the adjacency lists
and B-trees the two storage layouts are made of, and
[Complexity Analysis](./complexity-analysis.md) is where the logarithm
separating them is read correctly — a small term whose constants matter more.

Afterwards, [Computational Complexity](./computational-complexity.md) explains
why balanced partitioning has no efficient exact solution, the deepest limit on
scaling a graph database out, and [Operating Systems](./operating-systems.md)
explains why a pointer hop on disk is a page fault and not a dereference.
