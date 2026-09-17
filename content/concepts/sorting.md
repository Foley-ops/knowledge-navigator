---
concept_id: concept.algorithms.sorting
title: Sorting
slug: /concepts/sorting
aliases:
  - comparison sort
kind: problem
tier: 1
review_state: generated-draft
summary: The problem of rearranging a sequence into order, where matching upper and lower bounds of about n log n comparisons are known, and where the algorithms that actually ship are hybrids tuned for the partly ordered data real programs hand them.
categories:
  - Programming/Data Structures & Algorithms
primary_category: Programming/Data Structures & Algorithms
relationships:
  - type: assumes
    target: concept.algebra.order_theory
    note: A sort is only well defined once the comparator is a total preorder; a comparator that is not transitive has no correct answer to produce, and library sorts respond to one with undefined behaviour rather than a wrong order.
  - type: prerequisite_of
    target: concept.algorithms.searching
    note: Binary search and every interpolation variant take sortedness as a precondition, so the cost of establishing that order is part of the decision to use them.
  - type: contributes_to
    target: concept.algorithms.complexity_analysis
    note: The decision-tree argument for the n log n comparison bound is the standard first example of a proved lower bound, and of the fact that such a bound is a statement about a model rather than about a problem.
  - type: contributes_to
    target: concept.probability.probability_and_computing
    note: Randomised quicksort is the canonical opening example of a Las Vegas algorithm, where randomising the pivot moves the quadratic case from the input to the coins.
sources:
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Timsort's original description and its formal verification
    reason: No registry source documents Timsort's run detection, galloping merge and merge-stack invariant, nor the 2015 machine-checked analysis that found the Java implementation's invariant insufficient; the claims here about Timsort's internals rest on material this corpus does not cite.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Sorting** is the problem of producing, from a sequence $a_1, \dots, a_n$ and a
comparator, a permutation $\pi$ of the indices such that
$a_{\pi(1)} \preceq a_{\pi(2)} \preceq \dots \preceq a_{\pi(n)}$. Three
properties classify any algorithm that solves it:

- **Comparison-based**: the only operation on keys is asking whether one
  precedes another. Merge sort, quicksort and heapsort are comparison sorts;
  counting sort and radix sort are not, because they use a key's value as an
  array index.
- **Stable**: elements that compare equal come out in their input order. This is
  what lets you sort by one field and then another and get a lexicographic
  result.
- **In place**: extra space is $O(1)$ or $O(\log n)$ beyond the input, rather
  than a second array of size $n$.

## Why it matters

Sorting converts a linear scan into a binary search, and that single change is
why it is worth its cost: build the order once in $\Theta(n \log n)$ and every
subsequent membership query is $\Theta(\log n)$ rather than $\Theta(n)$. It also
makes duplicates adjacent, order statistics a lookup by index, set intersection a
single merge pass, and the nearest pair in one dimension a scan of neighbours.
Database engines lean on it for merge joins, grouping and index builds; external
sorting is how a dataset larger than memory is put in order at all.

It matters a second way, as a teaching case. Comparison sorting is one of the
smallest natural problems for which we have matching upper and lower bounds — in
the comparison model, which is the qualification that does all the work — so it
is where the idea that some problems have a provable floor stops being abstract.

## Intuition

Three strategies account for nearly every comparison sort that matters at scale.
_Divide blindly and work at the merge_: split the array in half regardless of
content, sort each half, then interleave — merge sort. _Work at the split and let
the merge be free_: choose a pivot, move smaller elements left and larger right,
recurse — quicksort. _Maintain a structure that yields the minimum cheaply and
drain it_: selection sort naively, heapsort with a binary heap. The insertion and
exchange sorts — insertion sort, shellsort, bubble sort — are a separate family,
quadratic in general, and one of them still earns a place in real code (below).

The lower bound is twenty questions. A comparison is one yes/no question, so it
splits the space of candidate answers in half at best. There are $n!$ possible
orderings, so no strategy can identify the right one in fewer than about
$\log_2 n!$ questions. The analogy breaks precisely where the non-comparison
sorts live: if you are allowed to _look at_ a key rather than only compare it,
an operation can carry far more than one bit — indexing a 256-entry bucket array
with a byte of the key decides among 256 possibilities at once. Radix sort does
not beat the bound; it declines to play the game the bound is about.

## Concrete example

Merge sort on `[5, 2, 9, 2, 6, 1]`. Split into `[5, 2, 9]` and `[2, 6, 1]`; those
sort to `[2, 5, 9]` and `[1, 2, 6]`; the merge compares $2$ vs $1$ (take 1),
$2$ vs $2$ (take the left one — this is where stability is decided), $5$ vs $2$,
$5$ vs $6$, $9$ vs $6$, giving `[1, 2, 2, 5, 6, 9]` in five comparisons.

```python
def merge_sort(a):
    if len(a) <= 1:
        return a[:]
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if right[j] < left[i]:      # strict: ties take from the left, so stable
            out.append(right[j])
            j += 1
        else:
            out.append(left[i])
            i += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out
```

Relax that comparison to `right[j] <= left[i]`... it still sorts, and it is no
longer stable: ties are now taken from the right, so equal elements leave in
right-then-left order. Stability is one character. Note that it has to be the
strictness that changes: writing the test as `left[i] > right[j]` is the same
predicate with its operands swapped, and changes nothing.

For the lower bound at $n = 3$: there are $3! = 6$ orderings, so a decision tree
needs at least $\lceil \log_2 6 \rceil = 3$ comparisons in the worst case, and
insertion sort achieves 3. At $n = 5$ the bound gives
$\lceil \log_2 120 \rceil = 7$, and 7 comparisons are in fact achievable — the
bound is tight here, though it is not tight for every $n$.

## Formal treatment

In the **comparison model**, an algorithm's behaviour on inputs of size $n$ is a
binary decision tree: each internal node is a comparison $a_i \preceq a_j$, each
branch a possible answer, each leaf an output permutation. Because the algorithm
must be correct on all $n!$ input orderings, and each ordering must reach a
distinct leaf, the tree has at least $n!$ leaves. A binary tree of height $h$ has
at most $2^h$ leaves, so

$$
2^{h} \ge n! \quad\Longrightarrow\quad h \ge \log_2 n! = n\log_2 n - n\log_2 e + O(\log n),
$$

using Stirling's approximation. Worst-case comparison count is therefore
$\Omega(n \log n)$, and the same argument on the average leaf depth gives the
same bound in expectation, which also covers randomised comparison sorts.

The standard algorithms sit against that floor as follows. Merge sort satisfies
$T(n) = 2T(n/2) + \Theta(n) = \Theta(n \log n)$ and uses at most
$n\lceil \log_2 n\rceil - 2^{\lceil \log_2 n\rceil} + 1$ comparisons, stable,
with $\Theta(n)$ auxiliary space. Heapsort builds a heap in $\Theta(n)$ and
extracts $n$ times at $\Theta(\log n)$ each: $\Theta(n \log n)$ worst case, in
place, not stable. Quicksort is $\Theta(n^2)$ in the worst case but makes about
$2n\ln n \approx 1.39\, n\log_2 n$ comparisons in expectation with a uniformly
random pivot, in place apart from $O(\log n)$ of recursion stack, and its
constant factors and cache behaviour make it the fastest of the three in
practice.

Counting sort takes keys in $\{0, \dots, k-1\}$, tallies occurrences, takes a
prefix sum and places each element from a backward pass, running in
$\Theta(n + k)$ and stable. Radix sort applies a stable counting sort to each of
$d$ digit positions from least significant to most, costing $\Theta(d(n+k))$;
for 32-bit keys with $k = 256$ that is four passes. Neither performs a single
comparison, so the decision-tree argument says nothing about them — the bound
constrains a model, not the problem.

## Assumptions and requirements

The comparator must be a **strict weak ordering**: irreflexive, transitive, and
with transitive incomparability. Drop any of the three — a comparator on floats
where `NaN` compares false against everything loses transitivity of
incomparability, since $1$ and `NaN` are incomparable and so are `NaN` and $2$,
while $1$ and $2$ are not; a "sort by rank, tie-break randomly" function is not
even asymmetric — and there is no correct output; C++ calls it undefined
behaviour, and `std::sort` really can run off the end of the array.

Each algorithm adds its own preconditions. Counting sort needs keys already
mapped to a bounded integer range known in advance, and $\Theta(k)$ memory,
so it is useless for 64-bit keys. LSD radix sort requires the per-digit sort to
be stable: with an unstable digit pass the result is simply wrong, not merely
unstably ordered. Merge sort's clean form requires $\Theta(n)$ scratch memory.
Quicksort's expected bound requires the randomness to be in the algorithm, not
assumed of the input.

The cost model assumes a comparison is $O(1)$. For long strings sharing prefixes
that is false, and the honest accounting includes key length.

## Uses and applicability

In application code, call the library sort. It is written by people who measured,
it is a hybrid (see below), and reimplementing it loses. Reach for counting or
radix sort only where the keys really are small bounded integers and $n$ is large
— column stores, suffix array construction, GPU and SIMD pipelines — where
avoiding comparisons wins several-fold.

Do not sort when a cheaper structure answers the question. Top-$k$ needs a
size-$k$ heap in $O(n \log k)$ or quickselect in expected $O(n)$, not a full
sort. Deduplication and grouping are hash-table work unless you need the order.
Data that arrives incrementally and is queried continuously belongs in a balanced
search tree or skip list that maintains order, not in an array re-sorted after
every insert.

Know what your language guarantees: Python's `list.sort` and `sorted` are
documented as stable and take a `key` function evaluated once per element; C++'s
`std::sort` is not stable and `std::stable_sort` is the one that is;
JavaScript's `Array.prototype.sort` has been required to be stable only since
ES2019.

## Limitations and common mistakes

**"Sorting is $\Omega(n\log n)$."** Comparison sorting is. The bound is a theorem
about decision trees, and counting and radix sort escape it in the ordinary way
that lower bounds are escaped — by using an operation the model does not have.
Lower bounds are always relative to a model of computation, and the reason they
are stated in restricted models is that unconditional bounds for general
computation are largely beyond us.

**Treating quicksort's worst case as theoretical.** A deterministic pivot rule is
a published rule, and adversarial inputs that drive it quadratic have been
constructed for real library implementations. Where inputs are attacker-supplied,
that is a denial-of-service vector, and the fix is randomisation or a fallback.

**Assuming stability.** Sorting by name and then by department gives names
grouped by department only if the second sort is stable — the multi-key idiom
runs the least significant key first, so the primary key is the last pass. This
is the most common silent bug in multi-key sorting, and it is silent because it
usually looks right on small test data.

**Reading asymptotics as speed.** Insertion sort beats every $O(n\log n)$
algorithm below roughly 16–32 elements, because its constant is tiny and it is
cache-friendly; this is a measured engineering fact on particular machines, not a
theorem, and the crossover moves with hardware. Similarly, radix sort's "linear"
time hides $d$ passes over memory and a $k$-sized table.

## Variants and alternatives

The elementary sorts — insertion, selection, bubble — are $\Theta(n^2)$ and
mostly pedagogical, with one exception: insertion sort runs in
$O(n + I)$ for $I$ inversions, so it is genuinely the right algorithm for nearly
sorted data and for the small base cases inside better algorithms.

Real library sorts are **hybrids**, and this is the point most often missed.
**Introsort** (Musser, 1997), the usual `std::sort`, runs quicksort, switches to
heapsort when recursion depth exceeds about $2\log_2 n$, and finishes small
partitions with insertion sort: quicksort's constants with heapsort's worst-case
guarantee, which is how the C++ standard can require $O(n \log n)$ comparisons.
**Timsort** (Peters, 2002) is a natural merge sort that detects existing
ascending and descending runs, merges them under a stack invariant, and galloping
through long one-sided stretches; it is stable, $O(n)$ on already-sorted input,
and is what CPython, Java's object sort and Android use. CPython adopted the
powersort merge policy in 3.11. **pdqsort** is the pattern-defeating quicksort
behind Rust's unstable sort. All three were chosen for behaviour on partly
ordered real data, not for asymptotics, which they share.

Beyond comparisons: counting, bucket and radix sort; sorting networks for fixed
small $n$ and for SIMD; parallel and external merge sorts when data exceeds
memory or one machine. In the word-RAM model integer sorting is possible in
$o(n\log n)$, and the true optimum there is not settled.

## History and attribution

Sorting is older than the stored-program computer: punched-card tabulating
machines sorted decks one digit column at a time, which is radix sort in
hardware, and mechanised census work is where the economic pressure came from.
Merge sort is commonly attributed to John von Neumann, in a program written for
the EDVAC in 1945. Donald Shell published shellsort in 1959. C. A. R. Hoare
devised quicksort in 1959 while working on machine translation, publishing it in
Communications of the ACM in 1961. J. W. J. Williams published heapsort in 1964,
and Robert Floyd gave the linear-time heap construction the same year. Knuth's
_The Art of Computer Programming_, Volume 3 (1973) collected the field, including
the decision-tree lower bound, which by then was folklore rather than any one
person's result.

The hybrid era is recent by comparison: Musser's introsort is from 1997, and Tim
Peters wrote Timsort for CPython in 2002. A machine-checked analysis in 2015
found that the merge-stack invariant in Java's port of Timsort was too weak to
bound the stack, a bug that survived years of use in a very widely deployed sort.

## Sources

MIT 6.006 covers the ground of this page in the order it is presented here:
insertion and merge sort, heaps and heapsort, the decision-tree lower bound, and
counting and radix sort as the deliberate escape from it. The Python
documentation is the authority for what `list.sort` and `sorted` guarantee —
stability, the `key` protocol, in-place versus copying — and cppreference for the
corresponding C++ guarantees, including that `std::sort` is not stable and its
required complexity. Arora and Barak is cited narrowly, for the point that a
lower bound is a statement about a model of computation and that restricted
models such as decision trees are where unconditional bounds are obtainable at
all.

## Prerequisites and next connections

Nothing deep is needed first. The comparator's requirements are exactly the
notion of a total preorder from [Order Theory](./order-theory.md), and reading
that section will explain why an inconsistent comparator has no correct answer
rather than a bad one. Familiarity with arrays, recursion and the binary heap
makes the algorithms readable; big-O notation makes the bounds readable.

From here, searching is the immediate payoff: binary search is what sortedness
buys, and the pair is the standard illustration of preprocessing cost against
query cost. Complexity analysis takes the decision-tree argument and generalises
it into what lower-bound proofs can and cannot establish.
[Probability and Computing](./probability-and-computing.md) takes randomised
quicksort apart, and is the right next page if the question that interests you is
why moving the worst case from the input to the coin flips is worth so much.
