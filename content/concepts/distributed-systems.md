---
concept_id: concept.systems.distributed_systems
title: Distributed Systems
slug: /concepts/distributed-systems
kind: concept
tier: 1
review_state: generated-draft
summary: The study of computation spread over machines that fail independently and share no clock, where the central difficulties are partial failure, agreement and what a replica is allowed to say when it cannot reach the others.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: assumes
    target: concept.systems.networking
    note: Every result here is stated against a model of what the network may do — drop, delay, duplicate and reorder messages with no bound on delivery time — so the network's actual guarantees fix which theorems apply.
  - type: contrasts_with
    target: concept.systems.parallel_computing
    note: Parallel computing splits work across cores that share memory and a clock and fail together, so its hard problem is throughput; distribution removes both the shared clock and the joint failure, and the hard problem becomes agreement.
  - type: contributes_to
    target: concept.systems.relational_databases
    note: Replication, partitioning, synchronous commit and the isolation hierarchy in any multi-node SQL deployment are distributed-systems problems, and a single-node ACID guarantee stops at the edge of the replica set.
  - type: contributes_to
    target: concept.software.apis
    note: A remote call inherits partial failure — the caller cannot distinguish a lost request from a lost response — which is why idempotency, retry policy and request deduplication are questions of API design rather than of plumbing.
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
      - formal-treatment
      - assumptions-and-requirements
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
      - why-it-matters
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.rfc9293.tcp
    title: 'RFC 9293: Transmission Control Protocol (TCP)'
    url: https://www.rfc-editor.org/rfc/rfc9293
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.postgresql.documentation
    title: PostgreSQL documentation
    url: https://www.postgresql.org/docs/current/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: The primary literature on consensus and consistency (FLP 1985, Gilbert and Lynch's CAP proof, Lamport's Paxos papers, Ongaro and Ousterhout's Raft, Herlihy and Wing on linearizability)
    reason: The registry holds no distributed-systems primary research, so the theorem statements here rest on Kleppmann's secondary account rather than on the papers themselves; the attributions are given without a citable entry.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: The fallacies of distributed computing
    reason: The list is folklore from Sun Microsystems in the 1990s and no registry source records it or its attribution.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **distributed system** is a set of independent computers that coordinate only
by passing messages, with no shared memory and no shared clock. What makes this
its own discipline is not distance but **independent failure**: on one machine a
crash stops everything at once, while here some components keep running, others
stop, and — the part that does the damage — none can tell which. That is
**partial failure**. The missing clock is the second structural fact: machines
cannot order events by clocks that drift apart, so ordering is built by the
protocol.

## Why it matters

Distribution buys capacity beyond one machine, survival of losing one, and
proximity to users, each paid for in the same currency: "the write succeeded"
stops being a fact and becomes a claim needing a definition — acknowledged by how
many replicas, visible to which readers? A function call either returns or the
process dies with it; a remote call can return, fail, or hang and then succeed
after the caller gave up.

## Intuition

You learn about another machine only from what it tells you, and silence is
ambiguous: a node that has not replied may be crashed, paused by garbage
collection, partitioned from you but not from others, or may have done the work
and had the reply dropped. Nothing distinguishes these, so a **timeout is not a
failure detector**; it is a guess that goes wrong exactly when the system is
loaded, which is when it is made most often. It is like writing to someone who
never acknowledges; the analogy breaks only in that real networks are usually
fast, so the craft is staying _safe_ when the guess is wrong.

## Concrete example

Three replicas $A$, $B$, $C$ hold $x = 0$. A write must be acknowledged by $W$
replicas, a read collects $R$ replies, and the reader takes the highest version.

With $N = 3$, $W = 2$, $R = 2$: a client writes $x = 1$, $A$ and $B$ acknowledge,
$C$ misses it during a two-second GC pause. Any later read contacts two of three,
so its reply set meets $\{A, B\}$ and the higher version wins — the read returns
$1$. The guarantee is counting, $W + R > N$: read and write sets must
intersect. With $W = 1$, $R = 1$ for latency, the write is acknowledged by $A$
alone and a read served by $C$ returns $0$ — no retry helps, because that
configuration never promised reads see the last write.

The counting assumes reads and writes use the _same_ $N$ replicas, and overlap
is not linearizability: concurrent writes can both reach quorums and conflict.

## Formal treatment

**Models.** _Synchronous_: delay and relative process speed have known bounds.
_Asynchronous_: no bounds at all. _Partially synchronous_: bounds hold after an
unknown stabilisation time. Failure models run from _crash-stop_ to _Byzantine_,
where a faulty node may lie. **Consensus** requires _agreement_ (no two correct
processes decide differently), _validity_ (a decided value was proposed) and
_termination_ (every correct process decides).

**FLP** (Fischer, Lynch, Paterson, 1985): in an _asynchronous_ system no
_deterministic_ protocol solves consensus if even one process may crash — and
this holds although no message is lost, only arbitrarily delayed, because a
crashed peer is indistinguishable from a slow one. It constrains guaranteed
termination under full asynchrony, so randomisation, failure detectors and
partial synchrony circumvent it rather than contradict it.

**CAP** (Brewer's 2000 conjecture, proved by Gilbert and Lynch in 2002) is about
one situation, not a menu. When the network _partitions_ — messages between two
groups are lost indefinitely — a service cannot both stay available on every
non-failing node and remain linearizable: a node that has not heard from the
others either answers from stale state or refuses to answer. "Pick two of three"
is wrong twice: partitions are not chosen, and with no partition there is no
forced trade.

**Consistency models.** _Linearizability_ demands one total order on operations
consistent with real time, so the replica set behaves like a single register;
_sequential consistency_ keeps the order but drops real time; _eventual
consistency_ says only that if writes stop, replicas converge — a liveness
property with no bound, saying nothing about any particular read.

**Paxos and Raft** solve one problem: keeping a replicated log identical across
$2f + 1$ nodes while up to $f$ crash. Both elect a leader, commit an entry once a
majority stores it, and use increasing ballot or term numbers to reject a stale
leader; safety rests on any two majorities intersecting and holds under full
asynchrony, while liveness needs periods of synchrony — exactly the door FLP
leaves open. Raft changes the presentation, not the guarantees: strong
leadership, an election restriction on who may win, randomised timeouts.
Byzantine agreement instead needs $3f + 1$ nodes for $f$ faults.

## Assumptions and requirements

The asynchronous results assume _fair-loss_ links: a message retransmitted
infinitely often eventually arrives. Retries then force **idempotency**, since
at-least-once delivery is what a retry buys. TCP gives reliable ordered delivery
_within one connection_, and RFC 9293 is explicit that a connection can reset or
time out with data outstanding, telling the sender nothing about what was
processed.

Clocks need their own audit: time-of-day clocks are NTP-corrected, so they drift,
step and can move backwards, and ordering writes by physical timestamp silently
drops data whenever two clocks disagree.

Crash-stop is the first assumption to break. A process frozen by garbage
collection or VM migration looks dead and may resume after its lease expired,
still believing it holds the lock; the fix is not a longer timeout but **fencing
tokens**, an increasing number issued with the lock and checked by the resource.
Majority quorums also assume fixed membership, so changing the node set is a
protocol step.

## Uses and applicability

Reach for consensus when the system needs exactly one of something — one leader,
one lock holder, one committed order — and keep that usage small: a round costs a
trip to a majority and is capped by its slowest member. Hence the common shape, a
consensus-backed service holding metadata while bulk data replicates more
cheaply.

Weaker models fit more cases than their reputation suggests: carts, counters,
caches and feeds converge without coordination and stay available during a
partition, while uniqueness constraints and balances that must not go negative
want a serialised path. And one server with local NVMe handles what needed a
cluster fifteen years ago.

## Limitations and common mistakes

The costliest misconception is CAP as "choose two", which yields designs that
discard consistency for availability they never deliver. Next is believing a
timeout detected a failure; it detected an absence of response.
Third is expecting exactly-once delivery: what exists is at-least-once plus
idempotent handling, or deduplication against a stored identifier.

Eventual consistency is oversold and under-specified: it promises something about
the limit, not about any read, and gives neither read-your-writes nor causality —
each a separate guarantee that must be implemented.

The **fallacies of distributed computing** — the network is reliable, latency is
zero, bandwidth is infinite, the network is secure, topology does not change,
there is one administrator, transport cost is zero, the network is homogeneous —
catalogue assumptions code makes by omission, and these bugs live in
interleavings ordinary tests never produce.

## Variants and alternatives

Replication has three shapes. _Single-leader_ is the relational default —
PostgreSQL streams the write-ahead log to standbys and lets a commit wait for
none, one, or a quorum of them, the CAP trade as a configuration setting.
_Multi-leader_ accepts writes in several places and must resolve conflicts, and
_leaderless_, Dynamo-style replication uses quorums and read repair.

The consensus family — Paxos and Multi-Paxos, Viewstamped Replication, Zab, Raft
— differs mainly in presentation and in how reconfiguration works;
Byzantine protocols extend the failure model; permissionless blockchains solve a
different problem, open-membership agreement. The genuinely different approach is
to avoid coordination: conflict-free replicated data types make merges
commutative, associative and idempotent, so replicas converge without agreeing on
an order — paid for in expressive power.

## History and attribution

The foundations are results of the late 1970s and 1980s, several of them Leslie
Lamport's: the 1978 work on time and clocks that introduced happens-before and
logical clocks; the Byzantine generals formulation with Shostak and Pease in
1982; and Paxos, published in 1998 as "The Part-Time Parliament". FLP is Fischer,
Lynch and Paterson, 1985. CAP began as Brewer's conjecture in a 2000 talk, was
proved by Gilbert and Lynch in 2002, and was narrowed by Brewer himself in 2012;
Raft arrived in 2014 with understandability as its stated goal. The fallacies list is Sun Microsystems
folklore, attributed to L. Peter Deutsch with a later addition by James
Gosling.

## Sources

**Designing Data-Intensive Applications** is the backbone here — partial failure,
clocks, replication, quorums, the consistency hierarchy, Paxos and Raft — and is
careful about what CAP does and does not say. **Operating Systems: Three Easy
Pieces** supplies the machinery underneath: the pausing that makes a live node
look dead, and remote procedure calls over unreliable channels. **RFC 9293**
states what TCP guarantees, and **PostgreSQL's documentation** what synchronous,
asynchronous and quorum commit mean in practice.

## Prerequisites and next connections

Read [Operating Systems](./operating-systems.md) first if processes, scheduling
and durability are unfamiliar: much confusing cluster behaviour is a local
scheduling or fsync question in a network costume, and [Go](./go.md)'s channels
show message passing without partial failure. From here, the Networking
page covers what the transport layer promises, Parallel Computing the
shared-memory sibling where nothing fails independently, and Relational Databases
the guarantees replication must rebuild.
