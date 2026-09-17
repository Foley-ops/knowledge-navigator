---
concept_id: concept.systems.relational_databases
title: Relational Databases
slug: /concepts/relational-databases
aliases:
  - RDBMS
  - relational model
kind: concept
tier: 1
review_state: generated-draft
summary: A storage system that represents data as typed tables and answers declarative queries over them, leaving the engine free to choose access paths and to interleave concurrent writers without breaking the invariants they share.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: requires
    target: concept.algorithms.core_data_structures
    note: An index is a B-tree or a hash table on disk and a join is a hash table or a merge of sorted runs, so the physical half of the system cannot be read without those structures.
  - type: assumes
    target: concept.logic.first_order_logic
    note: The declarative half is first-order logic over finite relations — a WHERE clause is a formula, and two queries are interchangeable exactly when the formulas are logically equivalent.
  - type: contrasts_with
    target: concept.systems.graph_databases
    note: Both persist entities and the links between them, but a graph database makes multi-hop traversal a primitive where the relational model expresses it as a self-join or a recursive query.
  - type: challenged_by
    target: concept.systems.distributed_systems
    note: Single-node ACID is cheap because one process sees every write; replicating and partitioning the data turns atomicity and isolation into consensus problems with latency and availability costs.
sources:
  - source_id: source.postgresql.documentation
    title: PostgreSQL documentation
    url: https://www.postgresql.org/docs/current/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: Codd's 1970 paper and the formal relational algebra and calculus
    reason: The registry has no database-theory text and not the original CACM paper, so the operator basis and the equivalence of algebra and safe calculus are stated from standard knowledge rather than cited.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: Normalisation theory — functional dependencies, 3NF and BCNF
    reason: No registry source develops normal forms; PostgreSQL's documentation and Designing Data-Intensive Applications discuss schema design only pragmatically.
    sections:
      - formal-treatment
      - assumptions-and-requirements
claims: []
---

## Definition

A **relational database** stores data as _relations_: finite sets of tuples over
a fixed, named, typed set of attributes. A relation has no row order and, in the
pure model, no duplicate rows; anything resembling a pointer is instead a value
that appears in two places. Queries are declarative — SQL, in practice — with
their meaning given by relational algebra, and the system rather than the
programmer chooses the indexes, the join order and the execution strategy. A
**transaction** groups statements into a unit that takes effect entirely or not
at all.

## Why it matters

The original selling point was **physical data independence**: a query names
relations and predicates, not access paths, so you can add an index, reorganise
a table or swap the storage engine without editing an application query. The
navigational systems that preceded it made programs follow explicit pointers
between records, and a storage change broke the programs.

The second thing it buys is shared mutable state that many clients write to
without each reimplementing locking. Constraints — keys, foreign keys,
uniqueness, check predicates — are enforced once, by the database rather than by
every service touching the table. And because the language is general rather
than tuned to the queries you anticipated, questions nobody planned for stay
answerable.

## Intuition

Hold two pictures at once. Logically a table is a set and a query is a
set-valued expression: filter, project, pair up, aggregate. Physically a table
is a pile of 8 KB pages with a B-tree or two beside it, and a query is a tree of
operators pulling rows through memory.

The planner is the compiler between them. SQL is to relational algebra roughly
as a regular expression is to an automaton: you write the declarative thing, the
engine builds the machine. The analogy breaks in one place — a regex compiles
the same way every time, whereas a planner reads statistics gathered from live
data, so one query text can get a fast plan today and a catastrophic one
tomorrow because a table grew.

## Concrete example

```sql
CREATE TABLE author (
  id   integer PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE paper (
  id        integer PRIMARY KEY,
  author_id integer NOT NULL REFERENCES author(id),
  year      integer NOT NULL,
  citations integer NOT NULL DEFAULT 0
);

CREATE INDEX paper_by_author_year ON paper (author_id, year);

SELECT a.name,
       count(*)         AS papers,
       sum(p.citations) AS total_citations
FROM   author AS a
JOIN   paper  AS p ON p.author_id = a.id
WHERE  p.year >= 2020
GROUP  BY a.id, a.name
HAVING count(*) >= 2
ORDER  BY total_citations DESC;
```

With authors `(1, 'Ada')`, `(2, 'Grace')`, `(3, 'Alan')` and papers
`(1, 1, 2021, 10)`, `(2, 1, 2023, 4)`, `(3, 2, 2020, 7)`, `(4, 2, 2022, 1)`,
`(5, 3, 2019, 40)`, the result is `Ada | 2 | 14` and `Grace | 2 | 8`.

Alan is absent: his only paper is from 2019, so the inner join produces no row
for him and he cannot reappear after grouping. Moving the predicate into a
`LEFT JOIN ... ON p.author_id = a.id AND p.year >= 2020` keeps a row for him in
the join, though `HAVING count(*) >= 2` still removes him before the result:
`count(*)` reports `1` for his group, since the padded all-`NULL` row is still a
row, while `count(p.id)` skips `NULL`s and returns `0`.

The composite index is ordered by `author_id` first, so it serves the join key
and the `year` range within each author. An index on `(year, author_id)` would
serve the range but not the per-author lookup: in a B-tree the leading column
governs what is reachable.

## Formal treatment

Fix attribute names $A_1,\dots,A_n$ with domains $D_1,\dots,D_n$. A relation is
a finite subset

$$
R \subseteq D_1 \times \cdots \times D_n ,
$$

and the schema assigns names to domains. Relational algebra is generated by six
primitives — selection $\sigma_\varphi(R)$, projection $\pi_{A_i,\dots}(R)$,
rename $\rho$, union, set difference and Cartesian product — with join derived,

$$
R \bowtie_\varphi S \;=\; \sigma_\varphi(R \times S),
$$

as are intersection and division. A language is _relationally complete_ when it
expresses all of this; the algebra and the safe (domain-independent) relational
calculus have equal expressive power. Transitive closure is **not** expressible
in the algebra, which is why reachability needed the `WITH RECURSIVE` construct
added in SQL:1999.

**Normalisation** removes update anomalies using functional dependencies. A
schema is in Boyce–Codd normal form when every nontrivial dependency $X \to Y$
has $X$ as a superkey; third normal form also allows $Y$ to be part of some key.
Every schema decomposes losslessly into BCNF but not always while preserving
dependencies, whereas 3NF synthesis is always both — which is why 3NF survives.

**Indexes.** A B+-tree with fanout $b$ over $N$ keys has height
$\Theta(\log_b N)$. With 8 KB pages holding roughly 250 entries, three levels
address about $250^3 \approx 1.5 \times 10^7$ rows and four about
$3.9 \times 10^9$; upper levels stay cached, so a point lookup costs one or two
real reads. A B-tree serves equality, ranges and ordered scans, a hash index
equality only, and every index is also a write cost.

**Planning** is cost-based: enumerate access methods and join orders, estimate
each plan from table statistics, take the cheapest. Join-order search is
exponential in the number of relations, handled by dynamic programming over
subsets and by heuristics beyond a dozen tables.

**Transactions** promise atomicity, consistency, isolation and durability, and
isolation levels are defined by the anomalies they forbid. The SQL standard
names dirty reads, non-repeatable reads and phantoms, and defines READ
UNCOMMITTED, READ COMMITTED, REPEATABLE READ and SERIALIZABLE by which are
allowed. Implementations depart in documented ways: PostgreSQL's READ
UNCOMMITTED behaves as READ COMMITTED, and its REPEATABLE READ is snapshot
isolation, which also prevents phantoms.

Snapshot isolation is _not_ serialisable, and **write skew** is the canonical
counterexample. Take the invariant "at least one doctor is on call", with Alice
and Bob both on call. Two concurrent transactions each read the count, each see
$2$, and each take a different doctor off call. Neither writes a row the other
wrote, so first-updater-wins detects nothing, both commit, and no doctor is on
call — an outcome no serial order produces. PostgreSQL's SERIALIZABLE adds
predicate-level conflict tracking on top of snapshots and aborts one transaction
with a serialization failure, so an application there must be ready to retry.

## Assumptions and requirements

The schema must be known roughly in advance and be mostly stable, rows in a
table are assumed homogeneous, and values must be atomic with respect to the
queries you will ask: a JSON blob queried from inside gives up most of what the
model provides.

Durability rests on layers below the database. A write-ahead log flushed with
`fsync` before commit is only as good as the storage stack's honesty, and a
cache that acknowledges writes it has not persisted quietly turns a committed
transaction into a lost one. Recovery replays the log on restart, which assumes
the log survived.

Cost-based planning assumes fresh statistics and roughly independent predicates.
Correlated columns — city and postcode — break independence, the estimate is off
by orders of magnitude, and a nested-loop plan is chosen for a million-row
intermediate result. And the concurrency guarantees hold only at the level
actually in force: most systems default to READ COMMITTED, so code relying on
serialisable reasoning without asking for it has assumed a hypothesis it never
established.

## Uses and applicability

Reach for a relational database when data has stable structure, when several
writers share invariants that must not be violated, when integrity matters more
than raw write throughput, and when the queries of two years from now are
unknown. It is still the right default for most transactional application state,
and the common error is abandoning it for scale that never arrives.

It is a poor fit for a firehose of append-only events, where a log or column
store is cheaper; for workloads dominated by deep traversal of a connected
graph; for genuinely schema-free documents; and for large binary objects, which
belong in object storage with their metadata in a table.

## Limitations and common mistakes

**SQL is not the relational model**, and the differences bite. SQL tables are
multisets: `SELECT` returns duplicates unless you ask for `DISTINCT`, and
`UNION ALL` keeps them where `UNION` does not. Columns are ordered and may be
unnamed or share a name. Row order is undefined without `ORDER BY`, however
reliably the engine appears to return insertion order.

**`NULL` is the other departure.** Comparisons with it yield _unknown_ rather
than true or false, so `WHERE x = NULL` matches nothing, and
`NOT IN (SELECT ...)` returns no rows at all if the subquery yields one `NULL`.
Aggregates skip `NULL`s, which is why `count(*)` and `count(col)` differ. Yet
`GROUP BY` and `DISTINCT` treat `NULL`s as equal to each other — the same value
is indistinct here and incomparable there.

Other recurring mistakes: adding an index without reading the plan, then finding
it unused because the predicate wraps the column in a function; ORM code issuing
one query per row of a previous result; treating normalisation as an absolute
rather than a trade against read cost; and assuming "the database handles
concurrency" when the default isolation level permits exactly the anomaly your
invariant cares about.

## Variants and alternatives

Storage engines vary underneath an unchanged SQL surface. Page-and-B-tree
engines update in place; LSM-tree engines buffer writes and merge sorted runs,
buying write throughput at the cost of read amplification and compaction. Row
stores suit transactions, column stores compress and scan far better for
analytics.

Concurrency control varies too: two-phase locking, multi-version concurrency
control with snapshot reads, serialisable snapshot isolation, optimistic schemes
validating at commit. Distributed SQL systems keep the model and the
transactions while partitioning data, paying consensus latency for cross-shard
atomicity.

Other models compete at the level of the data: document stores trade joins for
locality and schema-on-read, key-value stores give up queries for speed, graph
databases make edges first-class. Within the relational family, Datalog
expresses recursion more naturally than SQL, and embedded engines such as SQLite
trade the client/server boundary for a library call.

## History and attribution

E. F. Codd proposed the relational model at IBM San Jose in 1970, in _A
Relational Model of Data for Large Shared Data Banks_. The problem he attacked
was coupling rather than expressiveness: the hierarchical and network (CODASYL)
databases of the day exposed physical access paths, so programs were written
against the storage layout and broke when it changed.

Two implementations followed in the 1970s. IBM's System R produced the language
SEQUEL, later SQL, and cost-based query optimisation; Berkeley's Ingres, under
Michael Stonebraker, produced QUEL and led to Postgres. SQL became an ANSI
standard in 1986 and has been revised repeatedly since, which is why "standard
SQL" is a moving target and every engine is a dialect. The term _write skew_,
and the analysis showing snapshot isolation to be weaker than serialisability,
come from a 1995 critique of the ANSI isolation definitions by Berenson and
co-authors.

## Sources

The **PostgreSQL documentation** is the concrete reference: its transaction
isolation chapter states the levels, the phenomena and the write-skew case
precisely and says where the implementation differs from the standard, and its
indexing and planner chapters give the index types and the cost model.
**Designing Data-Intensive Applications** supplies the comparative view —
relational against document and graph models, B-trees against LSM-trees,
isolation anomalies — and the historical framing against CODASYL. **Operating
Systems: Three Easy Pieces** is cited only for what sits below the database:
how journalling, write ordering and `fsync` make durability possible.

## Prerequisites and next connections

Read [Core Data Structures](./core-data-structures.md) first; trees, hash tables
and sorted runs are what indexes and join operators are made of.
[First-Order Logic](./first-order-logic.md) explains the semantics the query
language inherits, and [Set Theory](./set-theory.md) the vocabulary of relations
and products.

From here, [Operating Systems](./operating-systems.md) covers the persistence
layer a database fights with,
[Complexity Analysis](./complexity-analysis.md) sharpens what a planner's cost
estimates estimate, and [Searching](./searching.md) covers the lookup algorithms
an index makes available.
