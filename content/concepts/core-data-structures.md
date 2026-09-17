---
concept_id: concept.algorithms.core_data_structures
title: Core Data Structures
slug: /concepts/core-data-structures
kind: concept
tier: 1
review_state: generated-draft
summary: The array, linked list, stack, queue, hash table, binary search tree, balanced tree and heap are the handful of memory arrangements whose operation costs decide what a program can afford to do.
categories:
  - Programming/Data Structures & Algorithms
primary_category: Programming/Data Structures & Algorithms
relationships:
  - type: contributes_to
    target: concept.algorithms.complexity_analysis
    note: These structures supply the canonical worked examples of amortized, average-case and worst-case analysis — the dynamic array's doubling, the hash table's load factor, the degenerate search tree.
  - type: used_to_solve
    target: concept.algorithms.searching
    note: Which structure holds the collection is what decides whether a lookup is one hash probe, a logarithmic descent, or a linear scan.
  - type: contributes_to
    target: concept.algorithms.sorting
    note: Heapsort is nothing but repeated extract-min from a binary heap, and most in-place sorts assume the contiguous random-access array.
  - type: prerequisite_of
    target: concept.algorithms.graph_algorithms
    note: Breadth-first search is a queue, depth-first search a stack, Dijkstra a priority queue, and the adjacency list an array of lists — the graph algorithms are these structures with a traversal rule on top.
sources:
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Cache hierarchy and the empirical cost of pointer chasing
    reason: The claim that contiguous arrays beat linked lists in practice rests on cache line size, hardware prefetching and measured miss latencies. No registry source documents memory-hierarchy performance; the architecture and systems references in the registry cover instruction sets and GPU kernels, not this comparison.
    sections:
      - limitations-and-common-mistakes
      - assumptions-and-requirements
  - label: Primary sources for the algorithmic complexity attacks on hash tables
    reason: The named attribution of the 2003 attacks and the 2011 attacks on web application frameworks is stated from general knowledge. The registry holds no security-research source — not the USENIX Security paper, not the 2011 disclosure — so only the Python half of the paragraph, the per-process hash seed, rests on a cited source.
    sections:
      - limitations-and-common-mistakes
  - label: Primary sources for the invention of hash tables, AVL trees and B-trees
    reason: The attributions in the history section are stated from general knowledge. The registry holds no algorithms history reference and none of the original papers, so nothing cited here supports those dates and names.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Core data structures** are the small, standard set of ways to lay a collection
out in memory — array, linked list, stack, queue, hash table, binary search
tree, balanced tree and heap — each of which makes some operations cheap by
making others expensive. Keep two things apart. An _abstract data type_ is an
interface: a stack is "push, pop, and you get back what you pushed last". A
_data structure_ is an implementation of that interface at a particular price: a
stack backed by a dynamic array and one backed by a linked list answer the same
questions at different costs. Most arguments about which structure to use are
really arguments about which prices you can pay.

## Why it matters

The choice changes what is computable in the time you have. Test $10^5$ items
for membership in a collection of $10^6$: with a Python list each test is a
linear scan, roughly $10^{11}$ comparisons, which is hours; with a `set` each
test is one hash probe, roughly $10^5$ operations, which is milliseconds.
Nothing about the algorithm changed — one line of code did.

This is also why the structures come before the algorithms. Dijkstra's shortest
paths, the union-find inside Kruskal, an LRU cache, a compiler's symbol table:
each is a classical algorithm wrapped around one or two of these structures, and
its cost is usually dominated by theirs.

## Intuition

Two questions separate them: how do you find a thing — by position, by key, by
order, or by priority — and what does it cost to change the collection?

An array is a numbered street of identical houses: house $i$ sits at
`base + i * size`, so you reach it in one step, but inserting in the middle
means shifting everyone down. A linked list is a treasure hunt, each node
holding the address of the next: splicing is trivial once you stand at the right
node, but you can only get there by walking. A hash table is a filing cabinet
whose drawer is chosen by a fingerprint of the key — instant, provided the
fingerprints spread out. A search tree is twenty questions, each comparison
halving the candidates, which is also why it can answer "what is the next key
after this one" and a hash table cannot. A heap is a tournament bracket where
only the champion is known: cheap to find the winner, cheap to run a new
contender up the bracket, deliberately uninformative about everyone else.

The numbered-street picture is the one that misleads: it assumes every house is
equally far away, and on real hardware it is not.

## Concrete example

Insert $1,2,3,4,5,6,7$ into a binary search tree in that order. Each key is
larger than everything present, so each becomes the right child of the last: a
right spine of height 7, and searching for 7 takes 7 comparisons. Insert the
same keys as $4,2,6,1,3,5,7$ and you get a perfect tree of height 3, where the
search takes 3. Same keys, same code — insertion order alone is the difference
between $\Theta(n)$ and $\Theta(\log n)$.

Here is a hash set with separate chaining, short enough to read entirely:

```python
class HashSet:
    def __init__(self, capacity=8):
        self.buckets = [[] for _ in range(capacity)]
        self.size = 0

    def _index(self, key):
        return hash(key) % len(self.buckets)

    def __contains__(self, key):
        return key in self.buckets[self._index(key)]   # scans ONE bucket

    def add(self, key):
        bucket = self.buckets[self._index(key)]
        if key in bucket:
            return
        bucket.append(key)
        self.size += 1
        if self.size > 0.75 * len(self.buckets):
            self._resize()

    def _resize(self):
        old = self.buckets
        self.buckets = [[] for _ in range(2 * len(old))]
        for bucket in old:
            for key in bucket:
                self.buckets[self._index(key)].append(key)
```

With 8 buckets holding 6 keys the load factor is $0.75$ and a lookup scans a
bucket holding $0.75$ keys on average. The seventh insertion trips the resize,
and that single `add` rehashes everything — one operation costing $\Theta(n)$
in a structure advertised as constant time. Replace `_index` with `return 0`
and the code still works and still passes every test; it is now a linked list.

## Formal treatment

Let $n$ be the number of stored items. For a hash table let $m$ be the number of
slots and $\alpha = n/m$ the load factor.

| Structure        | Index  | Search by key                 | Insert                  | Delete                | Min / next key     |
| ---------------- | ------ | ----------------------------- | ----------------------- | --------------------- | ------------------ |
| Array (fixed)    | $O(1)$ | $O(n)$                        | —                       | —                     | $O(n)$             |
| Dynamic array    | $O(1)$ | $O(n)$                        | $O(1)$ amortized at end | $O(n)$ in middle      | $O(n)$             |
| Sorted array     | $O(1)$ | $O(\log n)$                   | $O(n)$                  | $O(n)$                | $O(1)$             |
| Linked list      | $O(n)$ | $O(n)$                        | $O(1)$ at a held node   | $O(1)$ at a held node | $O(n)$             |
| Hash table       | —      | $O(1)$ expected, $O(n)$ worst | $O(1)$ expected         | $O(1)$ expected       | not supported      |
| BST (unbalanced) | —      | $O(h)$                        | $O(h)$                  | $O(h)$                | $O(h)$             |
| Balanced BST     | —      | $O(\log n)$                   | $O(\log n)$             | $O(\log n)$           | $O(\log n)$        |
| Binary heap      | —      | $O(n)$                        | $O(\log n)$             | $O(\log n)$ at root   | $O(1)$ for the min |

Stacks and queues are absent because they are interfaces, both achievable at
$O(1)$ per operation on either an array or a list.

**Dynamic array.** Growing by doubling, $n$ appends copy at most
$1 + 2 + 4 + \dots < 2n$ elements in total, so the amortized cost per append is
$O(1)$ even though individual appends cost $\Theta(n)$. Growing by a fixed
increment instead gives $\Theta(n^2)$, which is the mistake this analysis exists
to rule out.

**Hash table.** Under simple uniform hashing — every key equally likely to land
in any slot, independently — a chained table answers an unsuccessful search in
expected $\Theta(1 + \alpha)$ probes, and open addressing in at most
$1/(1-\alpha)$, which blows up as $\alpha \to 1$. Holding $\alpha$ below a
constant by resizing is what produces the familiar $O(1)$. Note where the
randomness sits: under simple uniform hashing the expectation is over an
assumption about the keys, with the hash function fixed. It is _universal
hashing_ — drawing $h$ at random from a family — that moves the expectation onto
the hash function, and so holds for any fixed input, adversarially chosen
included. Either way the worst case is still $\Theta(n)$, when every key
collides.

**Trees.** All BST operations are $O(h)$ in the height $h$, and $h$ ranges from
$\lceil \log_2(n+1) \rceil$ to $n$. Random insertion order gives
$E[h] = \Theta(\log n)$; sorted input gives the spine above. Balanced variants
bound $h$ structurally: an AVL tree satisfies $h \le 1.44\log_2(n+2) - 0.33$, a
red-black tree $h \le 2\log_2(n+1)$.

**Binary heap.** Stored as an array with the children of $i$ at $2i+1$ and
$2i+2$, so it uses no pointers. Sift-up and sift-down are $O(\log n)$, but
building a heap from an unsorted array is $\Theta(n)$, not $\Theta(n\log n)$,
because most nodes start near the leaves.

## Assumptions and requirements

The table is stated in the RAM model, where every memory access costs one unit.
Real machines have a cache hierarchy, so the model predicts well which structure
_scales_ and badly which is _faster_ at a given size.

Hash tables require a hash that spreads the actual key distribution and is
consistent with equality: if `a == b` then `hash(a) == hash(b)`. They require
bounded $\alpha$, which means resizing. They require keys to stay immutable
while stored — mutate a key and it hashes to a slot it is not in, and the item
is silently lost. Ordered structures require a total order on keys; a comparator
that is not a genuine total order corrupts the tree rather than merely
misordering it.

Amortized bounds assume you care about the total cost of a sequence. If you need
a bound on every individual operation — audio callbacks, control loops — a
doubling resize is a latency spike and the amortized number does not protect
you.

Reference stability is a requirement people discover by violating it. Growing a
`std::vector` invalidates every pointer into it; `std::list` invalidates nothing
but the erased element. Code holding a pointer into a growable array is correct
until the array grows.

## Uses and applicability

Reach for a dynamic array by default: cheapest per element, friendliest to the
cache, most predictable. Reach for a hash table when you need membership or key
lookup and never need order. Reach for a balanced tree when you need order —
range queries, predecessor and successor, ordered iteration — or when you need a
worst-case guarantee rather than an expected one. Reach for a heap when you
repeatedly need the extreme element of a changing set and nothing else about the
ordering, which is exactly the shape of scheduling, Dijkstra and top-$k$.

Do not reach for a linked list because insertion is "$O(1)$". Reach for it when
you genuinely splice at nodes you already hold, when you need reference
stability across mutation, or when elements are too large to move.

## Limitations and common mistakes

**"Hash tables are $O(1)$."** They are $O(1)$ _expected_, under assumptions
about the hash function, with $\alpha$ held down by resizing. An adversary who
can choose colliding keys degrades every operation to a linear scan — the
algorithmic complexity attacks demonstrated by Crosby and Wallach in 2003
against Perl's hash tables, the Squid proxy cache and the Bro intrusion
detection system, and the 2011 attacks on web application frameworks that
followed. The response was randomization: Python seeds the hash of strings and
bytes per process (`PYTHONHASHSEED`), added in 2012 and on by default since 3.3,
which is also why iteration order of a `set` of strings varies between runs.

**"Linked lists have $O(1)$ insertion."** Only when you already hold the node.
Getting there costs $O(n)$, so inserting at a known index is $O(n)$ either way —
and the array does its $O(n)$ as one contiguous move.

**Arrays beat linked lists far more often than the asymptotics suggest.** A
sequential array scan reads whole cache lines, each holding many elements, and
the prefetcher predicts the stride. A list traversal is a dependent load per
node — the next address is known only once the current node arrives — with no
useful prefetching, plus pointer overhead and a separate allocation per node. A
doubly linked list of 8-byte integers spends 24 bytes per element to store 8.
Credit the list's advantage only where the splicing is real.

**"A BST is $O(\log n)$."** Only if balanced. Inserting sorted keys into a plain
BST — timestamps, autoincrement ids, a sorted file — produces the linear spine,
and this is the most common way a program silently loses its logarithm.

**Asymptotics at small $n$.** For a few dozen elements a linear scan over an
array usually beats a hash table on constant factors and locality. The crossover
is real and worth measuring.

**Heaps are not sorted.** The backing array of a valid heap is almost never in
sorted order; only the root is guaranteed. Iterating it and expecting order is a
bug that passes small tests.

## Variants and alternatives

For sequences: the **dynamic array** (`std::vector`, Python `list`), the
**deque** with $O(1)$ at both ends (`collections.deque`, `std::deque`), the
**circular buffer** for fixed-capacity streaming, and **unrolled** or **singly
linked** lists that trade splicing generality for less overhead.

For hashing: **separate chaining** versus **open addressing**. Open addressing
has better locality and no per-node allocation, but degrades sharply as $\alpha$
approaches 1 and makes deletion awkward. **Robin Hood**, **cuckoo** and
**Swiss-table** designs bound probe lengths at the cost of more complex
insertion.

For ordered data: **AVL** trees are more rigidly balanced, so lookups are faster
and writes rotate more; **red-black** trees rebalance less and are the usual
library choice (`std::map`). **B-trees** widen the nodes to match a disk block
or cache line, which is why databases and filesystems use them. **Treaps** and
**skip lists** get the same expected bounds from randomization with much simpler
code. **Tries** index by key prefix rather than comparison.

Genuinely different approaches: **Bloom filters** answer approximate membership
in a fraction of the space, paying in false positives; **Fibonacci** and
**pairing heaps** improve amortized decrease-key, though constant factors mean a
binary heap often wins in practice; **persistent** structures share unchanged
subtrees so old versions survive each update.

## History and attribution

These have several independent origins, most predating the field that now
teaches them together. Hashing appears in an internal IBM memorandum by Hans
Peter Luhn in the early 1950s, already using chaining, and reaches the open
literature over the following few years, with open addressing and the first
published analyses in the late 1950s. The stack discipline for evaluating
expressions and for procedure calls was worked out by Bauer and Samelson in the
same period. Adelson-Velsky and Landis published the first self-balancing search
tree, the AVL tree, in 1962. J. W. J. Williams introduced the binary heap in
1964 as the engine of heapsort. Bayer and McCreight introduced B-trees in 1972
for disk-resident indexes; the red-black tree recasts Bayer's symmetric binary
B-trees and was named by Guibas and Sedgewick in 1978. Pugh's skip list (1990)
is the late arrival, and its argument — that randomization can replace intricate
rebalancing — is still live.

## Sources

**MIT 6.006** is the entry point: it develops arrays, linked lists, hashing,
binary search trees, AVL balancing and heaps in the order used here, with the
analyses stated as theorems. **cppreference** is where to check what a structure
actually guarantees, since the C++ standard specifies the complexity and the
iterator-invalidation rules of every container. **The Python documentation**
covers the behaviour used in the example — `list`, `dict`, `set`,
`collections.deque`, `heapq` — and documents hash randomization. None is a
history of the subject, which is why the attributions above are flagged in
`unresolved_references`.

## Prerequisites and next connections

You need asymptotic notation before the cost table means anything, and enough
comfort with pointers and contiguous memory to see why an array index is
arithmetic and a list traversal is not. [Order Theory](./order-theory.md)
supplies the total order every comparison-based structure assumes and shows what
goes wrong when the order is only partial. [Set Theory](./set-theory.md) is the
abstract side of the same ideas — set, sequence, map — which these structures
implement at a price.

Three directions open from here. Sorting is mostly array manipulation plus one
heap. Searching is the question of which structure the data sits in. Graph
algorithms are these structures under a traversal rule, and the priority queue
is why Dijkstra runs in $O((V+E)\log V)$ rather than $O(V^2)$. Randomized
structures — universal hashing, skip lists, Bloom filters — need the expectation
and tail bounds developed in
[Probability and Computing](./probability-and-computing.md).
