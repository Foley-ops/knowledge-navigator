---
concept_id: concept.algorithms.searching
title: Searching
slug: /concepts/searching
kind: concept
tier: 1
review_state: generated-draft
summary: Locating an item in a collection is cheap or expensive depending almost entirely on what structure the collection was given beforehand, and in high dimensions the cheap options run out.
categories:
  - Programming/Data Structures & Algorithms
primary_category: Programming/Data Structures & Algorithms
relationships:
  - type: requires
    target: concept.algorithms.sorting
    note: Binary search is correct only on a sequence already in sorted order, so a reader must know what sorting costs and guarantees before the logarithmic bound means anything.
  - type: requires
    target: concept.algorithms.core_data_structures
    note: Which search is even available is fixed by the container holding the data — array, hash table or balanced tree — so those structures have to be understood first.
  - type: unreliable_when
    target: concept.probability.high_dimensional_statistics
    note: Exact nearest-neighbour search degrades toward a full linear scan as dimension grows, for the same geometric reasons high-dimensional statistics studies.
  - type: contrasts_with
    target: concept.algorithms.graph_algorithms
    note: Graph search explores a reachability structure with no key order to exploit, so its cost is counted in vertices and edges rather than in comparisons against an ordered universe.
sources:
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: History of binary search and hashing
    reason: No registry source covers the attribution of binary search (Mauchly's 1946 lectures, the first published version correct for every n), Luhn's 1953 hashing memorandum, or Bloch's 2006 report of the midpoint overflow bug; the dates below are stated from general knowledge and should be checked against Knuth's history before this page leaves draft.
    sections:
      - history-and-attribution
      - limitations-and-common-mistakes
  - label: Approximate nearest neighbour index structures
    reason: The registry has no source on locality-sensitive hashing, inverted-file indexes with product quantization, or navigable small-world graphs, so the named ANN methods here are described without a citation that covers them.
    sections:
      - variants-and-alternatives
      - uses-and-applicability
  - label: Distance concentration in high dimensions
    reason: The claim that the ratio of farthest to nearest distance tends to one as dimension grows is a specific published result; the cited statistics text covers the volume form of the curse of dimensionality but not this theorem.
    sections:
      - formal-treatment
claims: []
---

## Definition

**Searching** is the problem of deciding whether a collection contains an item
matching a query, and returning it if so. The interesting content is not the
problem statement but the cost, and the cost is decided before the query
arrives: an unstructured collection of $n$ items admits nothing better than
looking at all of them, a sorted one answers in $O(\log n)$ comparisons, and a
hash table answers in expected $O(1)$ by giving up order entirely. Searching is
therefore best read as a question about what structure was paid for in advance.

## Why it matters

Almost every system that feels fast feels fast because of a search structure: a
database index turns a table scan into a tree descent, a compiler's symbol table
is a hash table, a filesystem directory is a B-tree, embedding retrieval is a
nearest-neighbour index. When one is missing or mismatched the symptom is not a
wrong answer but a system that works on a laptop and collapses in production,
because $O(n)$ and $O(\log n)$ are indistinguishable at $n = 1{,}000$ and differ
by more than seven orders of magnitude at $n = 10^9$, where $n / \log_2 n$ is
about $3 \times 10^7$.

## Intuition

Searching is a game of twenty questions. Locating one item among $n$
equiprobable candidates requires $\log_2 n$ bits, and each yes/no comparison
supplies at most one bit, so $\log_2 n$ comparisons is a floor rather than a
clever trick. MacKay develops this information-theoretic view of retrieval.

Linear search asks the worst questions: "is it this one?" eliminates a single
candidate. Binary search asks the best: "is it in the lower half?" halves the
space every time. Hashing sidesteps the counting argument by not comparing at
all — it computes the location from the key, buying constant time at the price
of order, so a hash table can say whether `1.5` is present but not what the next
largest key is.

## Concrete example

A sorted list of one million distinct integers. Linear search inspects about
500,000 of them on average for a key that is present, and all 1,000,000 for one
that is not. Binary search needs at most
$\lceil \log_2(1{,}000{,}001) \rceil = 20$ comparisons in either case.

```python
def binary_search(a, x):
    """Index of x in the sorted list a, or -1. a must be non-decreasing."""
    lo, hi = 0, len(a)              # invariant: if x is in a, it is in a[lo:hi]
    while lo < hi:
        mid = lo + (hi - lo) // 2   # see below: (lo + hi) // 2 is the buggy form
        if a[mid] < x:
            lo = mid + 1
        elif a[mid] > x:
            hi = mid
        else:
            return mid
    return -1
```

The half-open interval `a[lo:hi]` is what makes this terminate: every branch
strictly shrinks `hi - lo`, and the loop ends when the interval is empty.

The midpoint line is the famous one. In C or Java, `(lo + hi) / 2` forms the sum
first, and with 32-bit signed `int` that sum overflows once `lo + hi` exceeds
$2^{31}-1$ — reachable with arrays of about $2^{30}$ elements. The overflow
wraps to a negative index: in Java that throws
`ArrayIndexOutOfBoundsException`, while in C signed overflow is undefined
behaviour and the negative index is an out-of-bounds read that may crash or
quietly return nonsense. Either way the bug survived for years in widely used
library code, because it fires only on arrays of that size, which nobody was
handing the code when it was written. Writing
`lo + (hi - lo) / 2` gives the same value and cannot overflow, since `hi - lo`
never exceeds `hi`. Python's integers are arbitrary precision, so the bug cannot
occur above; the safe form is used anyway, because that shape is what transfers
to other languages.

## Formal treatment

Let $S$ be a collection of $n$ items with keys drawn from a universe $U$, and
let $q \in U$ be a query.

**Linear search** examines the items in sequence and makes at most $n$
comparisons, requiring no precondition on $S$ whatsoever.

**Binary search** requires the keys to be stored in an array $a[0..n-1]$ that is
non-decreasing under the same total order the comparisons use. It makes at most
$\lceil \log_2 (n+1) \rceil$ two-way comparisons.

This is optimal for comparison-based search. Any algorithm that touches keys
only through comparisons is a decision tree whose leaves must distinguish the
$n+1$ possible answers — $n$ positions plus "absent" — so the tree has at least
$n+1$ leaves and depth at least $\lceil \log_2(n+1) \rceil$.

**Hashing** escapes that bound by not being comparison-based. A hash function
$h : U \to \{0, \dots, m-1\}$ maps a key to a bucket. With $n$ keys in $m$
buckets the load factor is $\alpha = n/m$, and under simple uniform hashing (or,
without distributional assumptions, in expectation over a universal family of
hash functions) a lookup costs expected $O(1 + \alpha)$. The worst case is
$\Theta(n)$: every key can land in one bucket.

**Nearest-neighbour search** replaces equality with a metric: given
$P \subset \mathbb{R}^d$ with $|P| = n$ and query $q$, return
$\arg\min_{p \in P} \lVert q - p \rVert$. Here the structure that made searching
cheap stops working, and the volume argument says why. To capture a fraction $r$
of the unit cube in $d$ dimensions, a subcube needs edge length $r^{1/d}$, so
capturing $1\%$ of the data at $d = 10$ needs an edge of
$0.01^{1/10} \approx 0.63$ — nearly two thirds of every coordinate's range. A
"local" neighbourhood is not local. Space-partition structures such as $k$-d
trees inherit this: once $d$ is comparable to $\log_2 n$ the query visits most
partitions, so the index is no faster than a scan and far more complicated.

The escape is to weaken the guarantee. A $c$-approximate nearest neighbour is
any $p \in P$ with

$$
\lVert q - p \rVert \;\le\; c \cdot \min_{p' \in P} \lVert q - p' \rVert ,
\qquad c > 1,
$$

and for $c$ bounded away from $1$ there are indexes with query time sublinear in
$n$. This is why production embedding retrieval is approximate: the exact
version has no good algorithm at those dimensions, not merely no good
implementation.

## Assumptions and requirements

Binary search needs three things to be correct, and can return a wrong answer
with nothing raised when any of them fails: the data is sorted under the _same_
comparison the search uses (sorting strings by byte and searching
case-insensitively breaks it); the order is total, not partial; and no other
writer mutates the array mid-search. It needs a fourth thing for the logarithmic
bound rather than for correctness — $O(1)$ indexing — which is why binary search
on a linked list is still correct but costs $\Theta(n)$: reaching the midpoint
costs as much as scanning.

Hashing needs hash and equality to agree — two keys that compare equal must hash
equal — and needs keys that do not change after insertion; mutating a key in
place leaves it in a bucket the lookup will never visit. It also needs the
adversary to be absent or the hash to be randomized, since an attacker who can
choose keys can force every insertion into one bucket and turn expected $O(1)$
into $\Theta(n)$.

Nearest-neighbour search needs a genuine metric and, more importantly, needs the
geometry to mean something: an index returns the closest vector, which is only
the right answer if closeness in that space corresponds to the relation you
care about.

## Uses and applicability

Reach for binary search when the data is already sorted and queried many times,
or when the "array" is implicit — binary search over an answer space is the
standard way to invert a monotone predicate. Reach for a hash table when
lookups are by exact key and you never need order, successor or range queries.
Reach for a balanced tree or B-tree when you need those order queries, or when
the data lives on a storage medium with expensive random access, where a B-tree
node matches a page.

Do not build an index for a single query: sorting costs $\Theta(n \log n)$,
which is more than the $\Theta(n)$ scan it was meant to replace. The rule is
amortization over queries, not elegance.

Nearest-neighbour methods are the right tool when the relation you want is
"similar to", and they are the backbone of embedding retrieval, deduplication
and recommendation. Hastie, Tibshirani and Friedman are direct about the flip
side: nearest-neighbour methods rely on locality, and in high dimensions there
is no locality to rely on, which limits them as prediction methods as much as it
complicates them as search problems.

## Limitations and common mistakes

Binary search on unsorted data does not raise an error. It returns a confident
wrong answer, and it is close enough to right on nearly-sorted inputs to survive
casual testing.

The implementation is genuinely difficult. Besides the overflow above, the
common defects are an off-by-one that makes the interval fail to shrink and the
loop hang, and confusing "find an occurrence" with "find the first occurrence":
on data with duplicates the code above returns _some_ matching index, not the
smallest. When you want a boundary, use the lower-bound form that returns an
insertion point.

Expected $O(1)$ for a hash table is a statement about the average over hash
functions or over well-behaved key distributions, not a worst-case guarantee,
and it hides the amortized cost of resizing: a single insertion can trigger a
$\Theta(n)$ rehash. Quoting $O(1)$ as if it were a bound on every operation is
how latency-tail surprises get designed in.

For small $n$, a linear scan often beats a tree or hash lookup outright because
it is sequential in memory and predictable to the branch predictor. That is an
empirical, hardware-dependent observation rather than a theorem, and the
crossover has to be measured, not assumed.

The newest mistake is treating approximate nearest-neighbour results as exact.
An ANN index has a recall knob traded against latency, and a retrieval system
that "misses the obvious document" is often suffering an index recall failure
rather than an embedding failure. Measuring recall against an exact brute-force
scan on a sample is the only way to tell the two apart.

## Variants and alternatives

Among ordered searches: **lower-bound / upper-bound** variants return insertion
points rather than a match and are usually what is actually wanted — Python's
`bisect` module is exactly this pair. **Exponential (galloping) search** probes
$1, 2, 4, \dots$ before bisecting, which suits unbounded sequences and targets
near the front. **Interpolation search** guesses the position from the key's
value and runs in expected $O(\log \log n)$ on near-uniform data, degrading to
$O(n)$ when the distribution is skewed.

Among unordered searches: hash tables differ mainly in collision handling —
separate chaining, open addressing, cuckoo and Robin Hood hashing trade memory
against probe length. A **Bloom filter** answers membership with one-sided error
and no stored keys, which is the right trade when a false positive only costs an
extra lookup; MacKay treats hash-based retrieval in this information-theoretic
spirit. **Tries** and radix trees search string keys by prefix; **inverted
indexes** invert the problem for text.

For metric data, **$k$-d trees**, ball trees and cover trees work well in low
dimension. In high dimension the practical options are approximate:
locality-sensitive hashing, inverted-file indexes with product quantization, and
navigable small-world graphs. Brute-force scan deserves a mention as a serious
alternative — a matrix multiply over a few million vectors on a GPU is often
fast enough, exact, and much easier to reason about than an index.

## History and attribution

Searching has several independent origins, because every era rediscovered it
with its own hardware in mind. Binary search as an idea is older than stored
programs; it is usually traced to John Mauchly's 1946 Moore School lectures,
while a version published as a program correct for every $n$ — rather than only
for $n$ of the form $2^k - 1$, where every halving is exact and there is no
boundary case — took until the early 1960s. That gap is the historical
evidence for how fiddly the boundary conditions are.

Hashing arose at IBM in the early 1950s, with an internal memorandum by Hans
Peter Luhn generally named as the first description of chaining; the division
method and much of the analysis appeared in the open literature later that
decade. B-trees were introduced by Bayer and McCreight in 1972 for ordered
indexes on disk, where the cost that matters is page fetches rather than
comparisons.

The midpoint overflow bug was publicly reported by Joshua Bloch in 2006, in a
binary search that had sat in a widely used standard library for years. The
approximate framing of nearest-neighbour search, with provable sublinear query
time in exchange for a factor $c$, dates to work on locality-sensitive hashing
in the late 1990s and became infrastructure only when dense embeddings made
billion-scale vector search a routine requirement.

## Sources

**MIT 6.006** is the reference for the algorithmic core: binary search and its
precondition, the comparison lower bound, hash tables with chaining and their
expected-time analysis, and balanced search trees. **MacKay** supplies the
information-theoretic reading of search — why $\log_2 n$ questions is a floor —
and a treatment of hash codes as retrieval codes. **The Elements of Statistical
Learning** is cited specifically for the curse of dimensionality and for
nearest-neighbour methods as learners; its volume argument is the one reproduced
above. **The Python documentation** covers `bisect` and the dictionary's hashing
contract, which is where the invariants in the assumptions section are stated
for a real language.

## Prerequisites and next connections

Understand what a [Sorting](./sorting.md) algorithm costs and guarantees first,
since binary search buys its logarithmic query only by consuming sorting's
output, and read [Core Data Structures](./core-data-structures.md) for the
arrays, hash tables and trees these searches actually run on.
[Complexity Analysis](./complexity-analysis.md) supplies the asymptotic
vocabulary the whole comparison is conducted in.

From here, [Graph Algorithms](./graph-algorithms.md) shows what searching looks
like when there is no key order to exploit and the structure itself must be
explored, and [High-Dimensional Statistics](./high-dimensional-statistics.md)
explains the geometry that makes exact nearest-neighbour search collapse.
