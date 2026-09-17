---
concept_id: concept.algorithms.complexity_analysis
title: Complexity Analysis
slug: /concepts/complexity-analysis
aliases:
  - asymptotic analysis
  - big-O notation
kind: method
tier: 1
review_state: generated-draft
summary: The practice of describing how an algorithm's running time and memory grow with input size, stated as asymptotic bounds that survive a change of machine, language or compiler.
categories:
  - Programming/Data Structures & Algorithms
primary_category: Programming/Data Structures & Algorithms
relationships:
  - type: contrasts_with
    target: concept.computation.computational_complexity
    note: Complexity analysis measures one named algorithm's resource growth, whereas computational complexity classifies problems by what every possible algorithm must spend.
  - type: contributes_to
    target: concept.algorithms.core_data_structures
    note: A data structure is chosen by the worst-case and amortised cost of its operations, and those costs are exactly what this analysis produces.
  - type: contributes_to
    target: concept.algorithms.sorting
    note: The separation between quadratic and linearithmic sorts, and the comparison lower bound that makes it final, are both statements in asymptotic notation.
  - type: contributes_to
    target: concept.algorithms.graph_algorithms
    note: Graph costs are stated in two parameters at once, and reading a bound like linear in vertices plus edges requires the multi-parameter form of the notation.
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
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.theory_of_computation
    title: MIT 18.404J Theory of Computation (Fall 2020)
    url: https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Knuth's 1976 note on big Omicron, big Omega and big Theta
    reason: The attribution of O to Bachmann and Landau, and of the computer-science senses of Omega and Theta to Knuth, rests on sources the registry does not carry; no registered source covers the history of the notation.
    sections:
      - history-and-attribution
  - label: Sources for competitive, smoothed, parameterised, output-sensitive and cache-oblivious analysis
    reason: The variants section names these frameworks, and no registered source covers them; Arora and Barak and MIT 18.404J carry only little-o, little-omega and space complexity from that list, so the rest is stated without support.
    sections:
      - variants-and-alternatives
  - label: Tarjan's amortized computational complexity
    reason: The naming of amortised analysis and the potential method is attributed here to Tarjan's 1985 paper, which is not in the source registry; the registered algorithms course teaches the technique but not its history.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Complexity analysis** counts the primitive operations (or memory cells) an
algorithm uses as a function $T(n)$ of the input size $n$, then reports only how
that function grows, discarding constant factors and lower-order terms. The
report is one of three asymptotic bounds. For functions eventually non-negative
on the positive integers,

$$
f \in O(g) \iff \exists\, c>0,\ n_0 : f(n) \le c\,g(n)\ \ \forall n \ge n_0 ,
$$

$$
f \in \Omega(g) \iff \exists\, c>0,\ n_0 : f(n) \ge c\,g(n)\ \ \forall n \ge n_0 ,
$$

and $\Theta(g) = O(g) \cap \Omega(g)$. So $O$ is an upper bound, $\Omega$ a lower
bound, and $\Theta$ a bound that is tight from both sides. The customary
"$f(n) = O(g(n))$" is an abuse of the equals sign — $O(g)$ is a set of functions,
and the relation is membership, which is why the notation does not survive being
read backwards.

## Why it matters

Growth rate is the one prediction about a program that survives a change of
machine, language and compiler. Everything else — the constant factor from your
CPU, your allocator, your interpreter — moves by a factor of ten or a hundred
between environments. The exponent does not move at all, and the gap it
describes is not a tuning matter. Sorting $10^9$ records with a
quadratic algorithm is about $10^{18}$ operations; with a linearithmic one, about
$3 \times 10^{10}$. That is the difference between decades and a minute, and no
constant factor a hardware upgrade can buy will close it. Asymptotics also gives
the vocabulary for impossibility: the $\Omega(n \log n)$ comparison lower bound
says that searching for a faster general comparison sort is wasted effort, which
is a far stronger statement than any benchmark.

## Intuition

The useful question is not "how long does this take?" but "what happens when I
double $n$?" A $\Theta(n)$ algorithm doubles, a $\Theta(n^2)$ one quadruples, a
$\Theta(\log n)$ one grows by a fixed additive step. That is also an empirical
test: time your code at $n$ and at $2n$, and a ratio near $4$ is the signature of
hidden quadratic behaviour.

The standard analogy — asymptotics describe the shape of the curve, not its
height — breaks where it matters most. On real hardware the "constant" is not
constant: a working set that fits in cache and one that does not have genuinely
different costs per operation, so the multiplier hiding inside $\Theta(\cdot)$
can itself drift by an order of magnitude as $n$ grows.

## Concrete example

A brute-force maximum-subarray scan, on a non-empty list:

```python
def max_subarray_slow(a):
    best = a[0]
    for i in range(len(a)):
        s = 0
        for j in range(i, len(a)):
            s += a[j]
            if s > best:
                best = s
    return best
```

Derive it: for a fixed $i$ the inner loop body runs $n - i$ times, so the total
count is $\sum_{i=0}^{n-1}(n-i) = n(n+1)/2$. Each body is a fixed number of
operations, so $T(n) = \Theta(n^2)$ — and it is genuinely $\Theta$, not merely
$O$, because nothing exits early and the count depends on $n$ alone. Kadane's
algorithm computes the same answer in one pass:

```python
def max_subarray(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

At $n = 10^6$ that is $5 \times 10^{11}$ inner steps against $10^6$. Note also
what the operation count misses: `a[1:]` copies the list, which is $\Theta(n)$
extra space nobody asked for. High-level languages hide costs of exactly this
kind inside innocent syntax.

## Formal treatment

Three analyses answer three different questions about the same algorithm.

**Worst case.** $T(n) = \max \{\, \mathrm{cost}(x) : |x| = n \,\}$. It needs no
assumptions about inputs, and unlike the average case it is a guarantee — as is
the amortised bound below, which guarantees a worst-case total over a sequence
rather than a per-operation cost.

**Average case.** $T(n) = \mathbb{E}_{x \sim D_n}[\mathrm{cost}(x)]$, which is
meaningless until the distribution $D_n$ is named. For a _randomised_ algorithm
the expectation is instead over the algorithm's own coin flips and holds for
every input — a stronger and quite different statement.

**Amortised.** For a sequence of $m$ operations, the worst-case total divided by
$m$. Take a dynamic array that starts with capacity $1$ and doubles when full,
copying its contents. A single `push` costs $\Theta(n)$ in the worst case, so the
worst-case-per-operation bound is $\Theta(n)$ — and it is badly pessimistic.
Aggregate the whole sequence instead: over $n$ pushes the resizes happen at sizes
$1, 2, 4, \dots, 2^{\lfloor \log_2 n \rfloor}$, and copy that many elements each,
so total copying is

$$
\sum_{i=0}^{\lfloor \log_2 n \rfloor} 2^{i} \;=\; 2^{\lfloor \log_2 n\rfloor + 1} - 1 \;<\; 2n .
$$

Total work is below $3n$, so the amortised cost per push is $\Theta(1)$. The
potential method gives the same answer locally: set
$\Phi = 2 \cdot \text{size} - \text{capacity}$ and charge
$\hat{c}_i = c_i + \Phi_i - \Phi_{i-1}$. An ordinary push costs $1$ and raises
$\Phi$ by $2$, so $\hat{c} = 3$. A push that triggers a resize at size
$m$ costs $m+1$, and $\Phi$ falls from $m$ to $2$, so
$\hat{c} = (m+1) + 2 - m = 3$ again. Because $\Phi$ never drops below its initial
value, the summed amortised cost bounds the real one. This is a worst-case
guarantee over the sequence, with no probability anywhere in it.

## Assumptions and requirements

Asymptotic statements are made in a **unit-cost RAM model**: every arithmetic
operation and every memory access costs $1$, and a machine word holds at least
$\log_2 n$ bits so an index fits in a word. Drop the first assumption and bounds
change — arithmetic on $b$-bit integers is not $O(1)$. A separate trap is the
parameter itself: trial division "in $O(\sqrt{N})$" counts iterations against the
_value_ $N$, and since complexity is measured in the _encoding length_
$b = \lceil \log_2 N \rceil$, $\sqrt{N} = 2^{b/2}$ is exponential in the input
size — regardless of what arithmetic costs. Drop the second and array indexing
stops being constant time.

The unit-cost memory assumption is the one real hardware violates hardest: caches
and a TLB make the cost of an access depend on locality, not only on the access
count.

$\Theta$ bounds are also model-dependent — a single-tape Turing machine can need
quadratically more steps than a RAM for the same task. Polynomial time is robust
across reasonable sequential models; a specific exponent is not. Amortised bounds
additionally assume one sequential timeline: a persistent structure that can be
restored to an earlier state and re-run through the expensive operation breaks
the accounting.

## Uses and applicability

Reach for complexity analysis when choosing between designs before writing them,
when specifying what a library guarantees, and when diagnosing a program that is
fine on test data and hopeless in production — accidental quadratics such as
repeated string concatenation or a linear scan inside a loop are found by
analysis far faster than by profiling.

Do not reach for it to choose between two $\Theta(n \log n)$ sorts, to predict
wall-clock time, or to decide anything at fixed small $n$. Those questions are
settled by measurement on the target machine, and asymptotics has deliberately
thrown away the information they need.

## Limitations and common mistakes

**$O$ used where $\Theta$ is meant.** This is nearly universal. Quicksort's worst
case is $O(n^2)$, and it is also $O(n^5)$ — both true, one useless. When someone
says an algorithm "is $O(n \log n)$" they almost always mean $\Theta$; when a
textbook says it, check which is claimed.

**$\Omega$ used as "at least this slow on some input".** A lower bound is only
interesting over all inputs of a size, or, for a problem, over all algorithms.

**Treating the crossover as if it were at $n = 1$.** Insertion sort beats
merge sort below a few dozen elements, which is why production sort routines
switch to it for small subarrays — an implementation convention borne out by
measurement, not a theorem. At the extreme, matrix multiplication algorithms with
exponents below $2.38$ exist and are never used, because their constants are
astronomical.

**Ignoring the memory hierarchy.** Traversing a linked list and traversing an
array of the same length are both $\Theta(n)$ accesses and are not comparable in
practice; sequential access enjoys spatial locality and prefetching, pointer
chasing does not. Loop order in a naive matrix multiply changes measured time
substantially at identical operation counts. These are empirical,
architecture-dependent facts, not corrections to the asymptotics.

**Confusing average with amortised.** Average case is an expectation over inputs
or coins and can be wrong for your input; amortised is a worst-case guarantee
over a sequence and cannot.

**Leaving $n$ undefined.** For graphs, "linear" is ambiguous until you say
whether it is in vertices, edges, or their sum.

## Variants and alternatives

**Little-o and little-omega** ($f \in o(g)$ when $f(n)/g(n) \to 0$) state strict
domination. **Soft-O**, $\tilde{O}(g)$, suppresses polylogarithmic factors.
Beyond time, **space complexity** counts cells, and the two trade against each
other. **Output-sensitive** bounds add a parameter for the answer's size, as in
$\Theta(n + k)$ for reporting $k$ results. **Parameterised complexity** isolates a
structural parameter $k$ and asks for $f(k) \cdot n^{O(1)}$, making some
intractable problems tractable when $k$ is small. **Competitive analysis** judges
an online algorithm against the best offline one on the same sequence, and
**smoothed analysis** measures cost on slightly perturbed inputs, explaining why
the simplex method is fast in practice despite exponential worst cases.
**External-memory and cache-oblivious models** count block transfers rather than
operations, putting the memory hierarchy back into the model, and **work-depth**
splits parallel cost into total work and critical path. The genuinely different
alternative is empirical — profiling with measured constants, which answers the
questions asymptotics cannot and generalises to nothing but the machine it ran
on.

## History and attribution

The $O$ symbol comes from analytic number theory, not computing: Paul Bachmann
introduced it in 1894 and Edmund Landau popularised it, which is why the family
is sometimes called the Landau symbols. Its transfer to the analysis of
algorithms is due largely to Donald Knuth, who also argued in a 1976 note for the
$\Omega$ and $\Theta$ conventions used here, precisely because $O$ was being
written where a tight bound was meant. The complementary tradition — measuring
problems rather than programs, by the resources a machine needs as a function of
input length — was established by Juris Hartmanis and Richard Stearns in 1965 and
gave computational complexity its name. Amortised analysis grew out of work on
self-adjusting data structures and was named and systematised, together with the
potential method, by Robert Tarjan in the mid-1980s. Several of these threads
developed independently before they were unified in textbooks.

## Sources

MIT 6.006 is the practical reference for most of the page: it defines the
notation, derives the cost of loops and recursive procedures, and works the
dynamic-array doubling argument in the form given above. Arora and Barak state
the asymptotic definitions precisely and cover space complexity and the
class-level variants — little-o, little-omega and the space classes — but not
the rest of the variants section: competitive, smoothed, parameterised,
output-sensitive and cache-oblivious analysis rest on no source cited here, and
are recorded as unresolved references. MIT 18.404J is the source
for model dependence — what changes when the machine is a Turing machine rather
than a RAM, and which bounds survive that change. _Operating Systems: Three Easy
Pieces_ is cited only for the memory hierarchy: its treatment of address
translation and the TLB shows why identical access counts cost different amounts
depending on locality, which is exactly what the unit-cost model assumes away.

## Prerequisites and next connections

You need very little first: the notion of a limit as in [Real
Analysis](./real-analysis.md), enough to read "eventually, up to a constant", and
comfort with summing a geometric or arithmetic series, which is where most
operation counts end up.

From here, two directions open. Into practice, the cost bounds for individual
structures and algorithms — arrays and hash tables, the sorting and searching
algorithms, graph traversal — are all written in this notation, and none of their
guarantees can be read without it. Into theory,
[Computability Theory](./computability-theory.md) asks what can be computed at
all rather than how fast, and complexity classes ask what every algorithm for a
problem must spend. For the average case done properly rather than waved at,
[Probability and Computing](./probability-and-computing.md) supplies the
expectations and tail bounds randomised analysis rests on.
