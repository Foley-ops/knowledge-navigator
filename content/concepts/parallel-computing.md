---
concept_id: concept.systems.parallel_computing
title: Parallel Computing
slug: /concepts/parallel-computing
aliases:
  - shared-memory parallelism
kind: concept
tier: 1
review_state: generated-draft
summary: Using several hardware execution units at the same instant to shorten the wall-clock time of one computation, which buys speed only in proportion to the part of the work that is genuinely independent.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: requires
    target: concept.systems.operating_systems
    note: Threads, processes and address spaces are kernel abstractions, and the scheduler decides when a runnable thread actually occupies a core, so the mechanics here are unreadable without them.
  - type: contrasts_with
    target: concept.systems.distributed_systems
    note: Both run many things at once, but a parallel machine assumes reliable hardware, a shared clock domain and a defined memory model, while a distributed system treats partial failure and unbounded message delay as the normal case.
  - type: contributes_to
    target: concept.systems.high_performance_computing
    note: HPC is largely this material applied at cluster scale, where the decomposition, the scaling law and the communication cost decide whether a machine-year of compute is worth buying.
  - type: contrasts_with
    target: concept.algorithms.complexity_analysis
    note: Asymptotic operation counts say nothing about the serial fraction, the memory bandwidth ceiling or the synchronisation cost, so the best sequential algorithm is often the wrong parallel one.
sources:
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.openmp.specifications
    title: OpenMP specifications
    url: https://www.openmp.org/specifications/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mpi_forum.standard
    title: 'MPI: A Message-Passing Interface Standard'
    url: https://www.mpi-forum.org/docs/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.intel.software_developer_manual
    title: Intel 64 and IA-32 Architectures Software Developer Manuals
    url: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Amdahl's law (1967), Gustafson's law (1988) and the work-span scheduling bound
    reason: No source in the registry states either scaling law or the greedy-scheduler bound, so the formulas, the numerical example and the attributions are given from standard textbook knowledge with no citation behind them.
    sections:
      - concrete-example
      - formal-treatment
      - history-and-attribution
  - label: Origins of concurrency primitives and of the industry shift to multicore
    reason: The registry holds no computer-architecture history and none of the primary papers (Flynn's taxonomy, Dijkstra's semaphores, the Brinch Hansen and Hoare formulations of monitors, Lamport's sequential consistency), so those attributions and the end-of-frequency-scaling claim are uncited.
    sections:
      - why-it-matters
      - history-and-attribution
claims: []
---

## Definition

**Parallel computing** is the execution of one computation on several hardware
units at the same instant — cores, vector lanes, sockets, accelerators — to
reduce the time it takes to finish. It is not the same as **concurrency**, and
the difference is structural:

- _Concurrency_ is a property of a program: two activities whose lifetimes may
  overlap and whose steps the program does not order. A concurrent program is
  correct only if it is correct under every allowed interleaving.
- _Parallelism_ is a property of an execution: two operations occupying distinct
  hardware units simultaneously.

Neither implies the other. A single-threaded event loop serving a thousand
sockets is concurrent and not parallel. A vector instruction multiplying eight
pairs of doubles in one cycle is parallel and not concurrent — one instruction
stream, nothing to interleave, no synchronisation. Concurrency _structures_ a
program so a parallel machine can be used; it is neither necessary nor
sufficient for using one.

Two memory organisations sit underneath. In **shared memory** every unit
addresses one address space, communication is an ordinary load or store, and the
hardware keeps caches coherent; the unit of work is a _thread_, and threads of
one process share heap and file descriptors. In **distributed memory** each unit
has a private address space and communication is an explicit message; the unit
of work is a _process_, which also exists within one machine, isolated by the
operating system rather than a network.

## Why it matters

Single-thread performance stopped improving at the old rate in the mid-2000s,
when power density ended the frequency climb while transistor budgets kept
growing, and vendors spent them on more cores and wider vector units. The
consequence is arithmetic: on a 64-core server whose cores each have a 512-bit
vector unit with fused multiply-add, scalar single-threaded code reaches about
$1/(64 \times 8 \times 2)$ of peak floating-point throughput — under 0.1%. No
compiler recovers that for anything but the simplest loops, and the hardware is
paid for whether the program uses it or not.

## Intuition

Shared memory is a crowded kitchen: many cooks, one set of counters and bowls,
and the difficulty is that two cooks may reach for the same bowl. Distributed
memory is separate kitchens whose cooks phone each other and courier ingredients
across town — no contention, but every exchange costs.

The analogy breaks where it matters. A cook notices when someone takes her bowl;
a core does not. An unsynchronised write from another thread raises no error,
rarely crashes, and often yields a plausible wrong number in one run out of a
million. Compiler and processor also reorder memory operations, so the steps you
wrote are not the steps that execute.

## Concrete example

Amdahl's law with numbers. Let $f$ be the perfectly parallelisable fraction of
runtime and $p$ the number of workers. With $f = 0.95$:

- $p = 16$: $1/(0.05 + 0.95/16) = 1/0.109375 = 9.14\times$
- $p = 64$: $1/(0.05 + 0.95/64) = 1/0.06484 = 15.42\times$
- $p \to \infty$: $1/0.05 = 20\times$

Quadrupling the hardware bought a factor of 1.69, and no machine will take this
program past 20. Take the same 95% in Gustafson's framing, where the problem
grows with the machine so runtime stays fixed, and the scaled speedup is
$0.05 + 0.95 \times 64 = 60.85\times$. Same fraction, opposite conclusion,
because the question differs.

A shared-memory reduction in OpenMP:

```c
#include <omp.h>

double total_sum(const double *x, long n) {
    double total = 0.0;
    #pragma omp parallel for reduction(+:total)
    for (long i = 0; i < n; i++)
        total += x[i];
    return total;
}
```

Delete `reduction(+:total)` and it still compiles and usually prints a number.
It is a data race: `total += x[i]` is a load, an add and a store, and concurrent
unsynchronised read-modify-write on one location has no defined behaviour under
the OpenMP memory model. In practice the sum comes out low by a different amount
each run. Note too that the correct version does not return the same bits as the
serial loop — floating-point addition is not associative, so a different
summation order rounds differently. That is a change in result, not an error.

## Formal treatment

Let $T_1$ be the runtime of the best serial implementation, $T_p$ the runtime on
$p$ workers, $S_p = T_1/T_p$ the speedup and $E_p = S_p/p$ the efficiency.

**Amdahl's law** fixes the problem and assumes a fraction $f$ of $T_1$ is
perfectly parallelisable, the rest strictly serial, coordination free:

$$
T_p = (1-f)\,T_1 + \frac{f\,T_1}{p},
\qquad
S_p = \frac{1}{(1-f) + f/p},
\qquad
\lim_{p\to\infty} S_p = \frac{1}{1-f}.
$$

**Gustafson's law** fixes the _time_. Normalise the parallel run to $T_p = 1$
with serial part $s$ and parallel part $q = 1-s$; serially that work takes
$s + qp$, so $S_p = s + qp = p - s(p-1)$ — linear in $p$, with no ceiling. The
two do not conflict. Amdahl describes _strong scaling_ (fixed problem, more
workers), Gustafson _weak scaling_ (fixed time, bigger problem), and which
applies is a fact about the workload.

Both ignore coordination. A usable model adds $T_o(p)$ — thread creation,
barriers, lock contention, communication — which grows with $p$ and is why
measured speedup curves rise, peak and fall. For task-parallel code the sharper
model is work and span: with $T_1$ the work and $T_\infty$ the critical path, a
greedy scheduler gives $T_p \le T_1/p + T_\infty$, so $T_1/T_\infty$ bounds how
many workers can be kept busy at all.

A **data race** is two accesses to one location from different threads, at least
one a write, not ordered by synchronisation. Under the OpenMP and C/C++ memory
models a program containing one has undefined behaviour — not an unpredictable
value but no defined semantics, which is why a race can be harmless in testing
and fatal after an inlining decision changes. The primitives that supply the
missing order are few: atomic read-modify-write operations, mutexes (exclusion
over a critical section), condition variables (waiting on a predicate without
spinning), counting semaphores and barriers. Each creates happens-before between
a release and the matching acquire, and that edge, not elapsed time, is what
makes a read see a write.

## Assumptions and requirements

1. **Exploitable independence.** The work must decompose into parts with known,
   sparse dependencies. A recurrence $x_{i+1} = f(x_i)$ has none; linear ones can
   sometimes be rewritten as scans, general ones cannot.
2. **A large parallel fraction.** With a ceiling of $1/(1-f)$, code that is 90%
   parallel is capped at $10\times$ on any machine.
3. **Granularity above the coordination cost.** An uncontended atomic is tens of
   nanoseconds, a lock round trip hundreds, a thread creation or barrier
   microseconds; smaller tasks lose.
4. **Headroom in the bottleneck resource.** Many loops are memory-bandwidth
   bound, and cores added past saturation contribute nothing.
5. **A defined memory model, and tolerance for non-determinism.** Correctness
   rests on the coherence protocol and the language's happens-before rules,
   never on observed behaviour; and reduction order, scheduling and work
   stealing all vary run to run.

## Uses and applicability

Reach for parallelism when the work is compute- or bandwidth-bound, large
relative to millisecond-scale overheads, and decomposable: dense linear algebra,
stencil and PDE solvers, Monte Carlo sampling, image and tensor operations,
batch processing, compilation and test suites. Shared-memory threading is the
default within one machine, message passing (MPI) across nodes, and large codes
combine them.

Do not reach for it when the program is latency-bound on I/O — that wants
concurrency, and one async event loop will beat a thread pool. Do not reach for
it when shared state is written often, since locks serialise exactly the work
you parallelised. And check the serial algorithm first: an algorithmic factor of
ten costs no debugging effort and composes with parallelism afterwards.

## Limitations and common mistakes

**Races are invisible and schedule-dependent.** One that fires once in $10^6$
iterations survives every test and appears in production. Use a detector
(ThreadSanitizer, Helgrind) rather than inspection, and do not mistake
`volatile` in C or C++ for a synchronisation primitive: it orders neither the
compiler's reordering of other accesses nor the hardware's.

**False sharing degrades performance with no visible symptom.** Coherence is
maintained at cache-line granularity — 64 bytes on current x86 — not per
variable. If eight threads each increment their own counter in an array of eight
8-byte counters, all eight share one line, and every increment invalidates that
line in the other seven cores' caches. Nothing is wrong: answers are correct, no
tool reports an error, and the loop simply runs several times slower than the
serial version. Pad or align each counter to a line, or give each thread a
private accumulator combined at the end. This is one of the common reasons a
correctly parallelised loop is slower than the code it replaced.

**Deadlock and its quieter relatives.** Two threads taking locks in opposite
order stop forever, and a global lock order prevents it; livelock, convoying and
priority inversion cost throughput without stopping anything, so they look like
a plateau, not a hang.

**Measuring speedup against yourself.** Comparing a parallel program at $p$
workers to the _same program_ at $p = 1$ hides the parallelisation overhead; the
honest baseline is the best serial implementation. Superlinear speedup, when
real, is usually aggregate cache growing with core count. And "more cores never
help beyond $1/(1-f)$" is Amdahl misquoted as a verdict: it holds only at fixed
problem size.

## Variants and alternatives

By hardware, the classical axis is Flynn's taxonomy. **SIMD** applies one
instruction to a vector register (SSE, AVX and AVX-512 on x86; NEON and SVE on
Arm), buying 2–16× on contiguous, branch-light loops with no synchronisation at
all and nothing on loops that gather, branch or carry dependencies. **MIMD**
gives each unit its own instruction stream, which is what multicore is. GPUs
occupy a **SIMT** middle ground: thousands of threads in lockstep groups, fast
when a group agrees on a branch and slow when it diverges.

By programming model: **shared-memory threading** (OpenMP directives, or threads
in C++, Rust or Go) is cheapest to adopt and hardest to get right; **fork-join
tasks with work stealing** (Cilk, TBB, Rayon) handle irregular and recursive
workloads a static loop split cannot; **multiprocessing** trades copying for
isolation and is the usual route around a global interpreter lock; **message
passing** (MPI) scales past one machine at the price of writing the data
distribution yourself. **Lock-free structures** remove blocking and are
exceptionally hard to get right. The real alternatives to parallelism are a
better algorithm, a tuned library, an accelerator, and — for I/O-bound work —
async concurrency on one thread.

## History and attribution

The machines came first: the ILLIAC IV in the late 1960s and the Cray-1's vector
registers in 1976 widened a machine rather than speeding up its clock, and Flynn
published his taxonomy of instruction and data streams in 1966. Gene Amdahl's
1967 argument was polemical rather than descriptive — he was disputing claims
that many small processors could replace one large one, and the formula now
bearing his name was the supporting calculation. John Gustafson's 1988 reply,
based on measured scaling on a 1024-processor machine at Sandia, observed that
people enlarge their problems when they get a bigger machine.

The synchronisation vocabulary came from operating systems: Dijkstra's
semaphores in the mid-1960s, monitors from Brinch Hansen (1973) and Hoare
(1974), Lamport's 1979 definition of sequential consistency. The portable
interfaces arrived in the 1990s — MPI in 1994, OpenMP in 1997 — and the subject
stopped being a specialism around 2005, when multicore became the default in
mainstream desktop and server parts.

## Sources

_Operating Systems: Three Easy Pieces_ is the best free treatment of threads,
locks, condition variables and the classic concurrency bugs, and stands behind
the race and deadlock material here. The _OpenMP specifications_ define the
shared-memory execution and memory model precisely — work-sharing constructs,
reductions, the SIMD directives — and are the reference for the code example;
the _MPI standard_ plays that role for distributed memory. The _Intel Software
Developer Manuals_ document the vector instruction sets, locked atomic
operations, memory ordering and the cache-line-granularity coherence that makes
false sharing possible.

## Prerequisites and next connections

Read [Operating Systems](./operating-systems.md) first: threads, processes,
address spaces and scheduling are its material. A systems language helps —
[C](./c-language.md) or [C++](./cpp.md) for the memory model,
[Rust](./rust.md) for a compiler that rejects data races outright,
[Go](./go.md) for concurrency as a language construct — and
[Assembly](./assembly.md) makes the vector instructions concrete.

From here, [CUDA](./cuda.md) and [GPU Kernels](./gpu-kernels.md) take these
ideas to the accelerator, where the memory hierarchy is exposed rather than
hidden, [Array Programming](./array-programming.md) is how data parallelism gets
expressed when the loops are someone else's problem, and
[Complexity Analysis](./complexity-analysis.md) is the model this one is most
usefully contrasted with.
