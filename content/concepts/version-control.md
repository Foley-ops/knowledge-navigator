---
concept_id: concept.software.version_control
title: Version Control
slug: /concepts/version-control
aliases:
  - revision control
  - source control
kind: concept
tier: 1
review_state: generated-draft
summary: The practice, and the systems that support it, of recording every state a project passes through so that any of them can be recovered, compared, attributed to a person, and reconciled with somebody else's concurrent work.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: specializes
    target: concept.systems.distributed_systems
    note: A distributed version control system is optimistic replication in miniature — every clone is a full replica that accepts writes while disconnected, and divergence is reconciled at merge time rather than prevented by coordination.
  - type: contrasts_with
    target: concept.systems.relational_databases
    note: Both manage durable shared state, but a database serialises concurrent writers through transactions and keeps one current value per row, whereas version control lets writers diverge on purpose and keeps every past value forever.
  - type: contributes_to
    target: concept.software.testing
    note: A test result only means something against an identified revision, and binary search over commit history is the standard way of tracing a newly failing test to the change that caused it.
sources:
  - source_id: source.git_scm.book
    title: Pro Git
    url: https://git-scm.com/book/en/v2
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.semver.specification
    title: Semantic Versioning 2.0.0
    url: https://semver.org/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Version control** records the successive states of a collection of files,
with metadata about who produced each and why, in a store where every state
stays addressable. A system built on it offers three operations: compare two
states, restore the files to one, and combine two that were derived
independently from a common ancestor.

Systems divide on where history lives. **Centralised** ones (CVS, Subversion,
Perforce) keep it on a server the client must reach to commit or read the past.
**Distributed** ones (Git, Mercurial) give every clone the whole history, so
commits, diffs and branches are local and synchronisation is a separate step.

## Why it matters

Version control turns a directory whose current contents are all you have into
an object with an interrogable past: which change made this test fail, what did
this file look like when the paper's numbers were produced, who wrote this line
and what else did they touch. It also makes concurrent editing safe, because
the system knows the common ancestor of two people's work and can say what each
did to it. Code review, continuous integration, release tagging and
reproducible research all rest on the same thing: an exact state that can be
named now and fetched back later.

## Intuition

Git's data model is simpler than its commands, and meeting them in the wrong
order is why the commands feel arbitrary. Git is a key-value store in which an
object's key is the hash of its own contents. A directory is a list of names
paired with the hashes of what they hold; a commit points at one such
directory-of-the-whole-project, at the commits it came from, and at an author
and message.

The picture to carry is a photograph album where every photograph shows the
entire project and carries an arrow back to the one before; a branch is a
sticky note on a photograph, and switching branches moves the note, which is
why branching is nearly free.

The analogy breaks twice. The photographs are deduplicated — an unchanged file
is referenced again by hash, not copied — and git repacks objects into
packfiles that store some as deltas against others, which is compression
beneath the model, not a change to it.

## Concrete example

A full branch-and-merge cycle:

```sh
git init demo && cd demo
printf 'hello\n' > a.txt
git add a.txt
git commit -m "first"

git switch -c feature          # a second pointer at the same commit
printf 'hello\nworld\n' > a.txt
git commit -am "add a line"

git switch main
git merge feature              # fast-forward: main's pointer just moves
```

What was stored, read back with git's low-level commands:

```sh
$ git hash-object a.txt
94954abda49de8615a048f8d2e64b5de848e27a1

$ git cat-file -p HEAD
tree d4e01edf1e8aa72182ed9449e7d12b5e4df8b201
parent b73f66e34e280c55dc496ba072fa74f3d425554c
author Demo <demo@example.com> 1767225600 +0000
committer Demo <demo@example.com> 1767225600 +0000

add a line

$ git cat-file -p d4e01edf1e8aa72182ed9449e7d12b5e4df8b201
100644 blob 94954abda49de8615a048f8d2e64b5de848e27a1	a.txt

$ git cat-file -p b73f66e34e280c55dc496ba072fa74f3d425554c
tree 2e81171448eb9f2ee3821e3d447aa6b2fe3ddba1
author Demo <demo@example.com> 1767225600 +0000
committer Demo <demo@example.com> 1767225600 +0000

first
```

The `parent` line is the album's arrow: the second commit names the first, which
has none because it is the root. That blob hash is the SHA-1 of the bytes `blob
12\0hello\nworld\n`, identical in every git repository holding a file whose
content is `hello\nworld\n`; the commit hashes are not, because they cover the
author name and timestamp (the parent id above is what those exact author lines
produce). The branch itself is a
forty-one byte file in a fresh repository: `cat .git/refs/heads/main` prints
one commit id.

## Formal treatment

Let $H$ be a cryptographic hash function: SHA-1 as git was designed, with a
SHA-256 object format now available. Every object is stored under the key

$$
\mathrm{id}(o) \;=\; H\big(\tau \,\Vert\, \texttt{0x20} \,\Vert\, |c| \,\Vert\, \texttt{0x00} \,\Vert\, c\big),
$$

where $\Vert$ is byte concatenation, $\texttt{0x20}$ a space, $\texttt{0x00}$ a
NUL byte, $\tau$ the object type, $c$ the content and $|c|$ its byte length in
decimal ASCII. A **blob** is file content with no name; a **tree** is a sorted
list of entries $(\text{mode}, \text{name}, \text{id})$ pointing at blobs and
other trees; a **commit** names one tree, its parent ids in order, an author, a
committer and a message.

Identity is a function of content, so objects are immutable and a commit's id
transitively covers its whole tree and all its ancestry. Commits with an edge
to each parent form a directed acyclic graph $G = (C,E)$: a root commit has no
parent, a merge commit two or more. Writing $R(c)$ for the commits reachable
from $c$ along parent edges, `git log x` enumerates $R(x)$ and `git log x ^y`
enumerates $R(x) \setminus R(y)$.

A **ref** is a mutable name for a commit id — `refs/heads/main` is a branch,
`HEAD` a symbolic ref naming the current one. Committing writes new objects and
advances one ref, the only mutation in the system.

A three-way merge of $x$ and $y$ takes a **merge base** $b$, a common ancestor
of both with no descendant that is also one, and combines the changes $b \to x$
and $b \to y$ region by region, stopping where both sides touched the same
region. Diffs are nowhere in this model: a commit stores a snapshot, and
`git diff` computes the difference between two trees on demand.

## Assumptions and requirements

Object identity assumes $H$ is collision-resistant, which weakened for SHA-1
when explicit collisions were published in 2017; git's answer was a hardened
SHA-1 that detects the known attack pattern, plus a SHA-256 format still only
partly adopted.

Three-way merging assumes line-oriented text whose lines are meaningful units.
Drop that and merging degrades to conflict reporting, which is why binary
assets, generated files and notebook JSON merge so badly.

Ordering assumes causality, not clocks: the ancestor relation is real, a commit
timestamp merely self-reported. And a clone costs the entire history, so one
multi-gigabyte binary committed once is paid for by everybody, permanently.

## Uses and applicability

Reach for version control for anything textual that evolves and whose past
matters: source code, papers, configuration, schema migrations, analysis
scripts. The commit id is the peg other practices hang from — continuous
integration builds a commit, review discusses a commit range, deployment pins a
commit, and a release tag attaches a version number, whose meaning is a
separate convention such as semantic versioning.

It is a poor fit, unaided, for large binaries and for assets that cannot be
merged and so need locking, which is what Git LFS and Perforce are for. Secrets
should never enter history at all: removing a credential later changes every
descendant hash without un-copying the bytes from anyone's clone.

## Limitations and common mistakes

**"A commit is a diff."** This sits underneath most git confusion: a commit
names a complete tree. Cherry-pick and rebase are the operations that really do
work in patches, computing the difference a commit introduced and re-applying
it elsewhere as a new commit with a new id. That is why a rebased branch is new
commits rather than the old ones relocated, and why the old ones survive in the
object store until garbage collection — which is what makes `git reflog` such
an effective recovery tool.

**Rewriting published history is a social problem, not a technical one.** Git
happily amends, rebases and force-pushes; objects are immutable but refs are
not. The cost lands on everyone else, whose branches now descend from commits
no longer on the shared branch and who must reconcile by hand;
`--force-with-lease` catches the accidental case but not the coordination
problem. Rewriting your own unpublished work is uncontroversial, and the rule
against rewriting shared history is a human agreement the tool does not
enforce.

**A clean merge is not a correct merge.** Textual merging is syntactic: two
branches can each be consistent, merge without conflict, and still produce a
broken program, because one renamed a function while the other added a call to
it. That is the general difficulty of reconciling concurrent writes to a
replicated store — detecting concurrency is mechanical, deciding what the
combination means is not — and the mitigation is integration frequency rather
than cleverness. One smaller trap: deleting a branch discards a pointer, not
commits.

## Variants and alternatives

**Subversion** is the centralised system still worth choosing: repository-wide
revision numbers, directory versioning and atomic commits, path-level
permissions and one authoritative server, bought at the price of offline work.
**Perforce** dominates where huge binary assets and file locking matter, such
as game development.

Among distributed systems, **Mercurial** has much the same snapshot-and-DAG
model with a more uniform command surface. **Darcs** and **Pijul** take a
different route — history as a set of patches with an algebra of commutation,
so independent changes carry no spurious ordering; cleaner for cherry-picking,
at the cost of a far smaller ecosystem. **Jujutsu** and **Sapling** keep git's
object store while changing the working model, in Jujutsu's case by treating
the working copy itself as a commit. Workflow varies independently: trunk-based
development, release branches and long-lived feature branches trade frequent
small conflicts against rare large ones.

## History and attribution

Version control is old. SCCS was built at Bell Labs in the early 1970s and RCS
by Walter Tichy in the early 1980s, both per-file and lock-based; CVS grew out
of RCS in the late 1980s to give a project-wide view, and Subversion arrived in
2000 as a better CVS. Monotone had already identified revisions by
cryptographic hash before git existed.

Git's own origin is unusually precise. The Linux kernel had been using
BitKeeper, a proprietary distributed system, and in April 2005 its free-use
terms were withdrawn. Linus Torvalds wrote the first version of git within
days, optimising for fast operations over a huge tree with thousands of
contributors and for cryptographic integrity of history. Mercurial was started
independently by Matt Mackall that same month, for the same reason.

## Sources

**Pro Git** covers everything specific to git here: centralised versus
distributed, the ordinary workflow, the perils of rebasing, and the internals
chapter on blobs, trees, commits, refs and packfiles. **Martin Fowler's site**
carries the branching and integration material. **Designing Data-Intensive
Applications** barely mentions version control, but its account of concurrent
writes and merging divergent replicas is the right frame for why merging is
hard. **Semantic Versioning** is the convention behind release tag numbers.

## Prerequisites and next connections

Nothing is strictly required first, but two pieces of background help. From
[Graph Algorithms](./graph-algorithms.md): directed acyclic graphs,
reachability and common ancestors, since a merge base is a graph problem and
`git log` is a traversal. From
[Core Data Structures](./core-data-structures.md): hash tables and trees, since
the object store is a map from hashes to immutable nodes — the same
share-what-did-not-change idea that [Functional
Programming](./functional-programming.md) calls a persistent data structure.

Next come the practices built on the commit identifier, and the distributed
systems view of replicas that accept writes independently and reconcile later —
which is what a set of clones is.
