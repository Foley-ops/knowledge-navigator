---
concept_id: concept.systems.high_performance_computing
title: High-Performance Computing
slug: /concepts/high-performance-computing
kind: concept
tier: 1
review_state: generated-draft
summary: The practice of running one numerical computation across thousands of nodes that share no memory, where the binding constraint is almost never arithmetic but the cost of moving operands through the cache, DRAM and interconnect hierarchy.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: specializes
    target: concept.systems.parallel_computing
    note: HPC is parallel computing narrowed to one regime — large regular numerical workloads on dedicated hardware, where the machine is assumed reliable and the only question is efficiency.
  - type: assumes
    target: concept.systems.networking
    note: Every performance model here assumes a dedicated, non-oversubscribed, microsecond-latency fabric with hardware RDMA; on commodity TCP over Ethernet the collective costs quoted in this page are wrong by one to two orders of magnitude.
  - type: contrasts_with
    target: concept.systems.distributed_systems
    note: Distributed systems treat partial failure and asynchrony as the normal case and pay for it in coordination, while an HPC job is gang-scheduled, synchronous, and recovers from any node loss by killing the whole job and restarting from a checkpoint.
  - type: used_to_solve
    target: concept.analysis.partial_differential_equations
    note: Domain decomposition with halo exchange is the standard parallelisation of a discretised PDE, and PDE solvers are the workload most of this machinery was built for.
sources:
  - source_id: source.mpi_forum.standard
    title: 'MPI: A Message-Passing Interface Standard'
    url: https://www.mpi-forum.org/docs/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.openmp.specifications
    title: OpenMP specifications
    url: https://www.openmp.org/specifications/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: Roofline model and parallel scaling laws
    reason: The registry has no source for the roofline model, for Amdahl's and Gustafson's laws, or for the alpha-beta message cost model and collective lower bounds; these are stated here from general knowledge and are uncited.
    sections:
      - intuition
      - concrete-example
      - formal-treatment
  - label: HPL, HPCG and TOP500 benchmark results
    reason: No registry source documents the LINPACK/HPL benchmark, HPCG, the TOP500 list, or the fraction of peak real machines reach on them, so those figures are given as ranges rather than as measured results.
    sections:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: Domain decomposition and memory-latency figures for CPU architectures
    reason: The registry holds no numerical-methods text covering domain decomposition and halo exchange, and no computer-architecture reference for the cache, DRAM and interconnect latencies quoted here.
    sections:
      - intuition
      - assumptions-and-requirements
claims: []
---

## Definition

**High-performance computing** is the practice of running a single numerical
computation across many tightly coupled nodes — each with its own multicore CPUs,
its own private DRAM, often its own GPUs — joined by a dedicated low-latency
interconnect and given to the job exclusively by a batch scheduler. The
organising fact is that memory is _distributed_: process 7 cannot dereference a
pointer into process 12's address space, so anything one process needs from
another must be sent explicitly. MPI is the standard vocabulary for that sending:
each process gets a **rank** within a **communicator**, and the library supplies
point-to-point messages and **collectives** — broadcast, reduce, all-reduce,
all-to-all — in which every rank of the communicator participates.

## Why it matters

Two limits bind at once. A 10 km global climate run or a $1024^3$ turbulence
simulation holds state that does not fit in one node's memory, so patience on a
workstation does not help; and the deadline is usually hard, since a forecast
taking 30 hours to predict the next 24 is worthless.

Beyond "use more machines", the field supplies a cost model accurate enough to
predict the result before the allocation is spent: that a decomposition stops
scaling near 8,000 ranks, or that a kernel will reach 4% of peak whatever the
tuning, because it moves too many bytes per flop.

## Intuition

Do not picture a big CPU. Picture a hierarchy of distances in which arithmetic is
nearly free and moving operands is not. A register is sub-nanosecond, L1 about a
nanosecond, DRAM 80–100 ns, a message to another node 1–2 µs — four orders of
magnitude, while one core retires tens of flops per cycle. The question is never
"how many flops" but "how many bytes per flop".

The library analogy holds — desk, shelf, stacks, inter-library loan — and breaks
in one way. Requests pipeline, so _latency_ can be hidden behind computation
while _bandwidth_ cannot be hidden at all: a code stalled on latency is usually
fixable, one stalled on bandwidth only by moving fewer bytes.

## Concrete example

Take a node with 2 TFLOP/s of double-precision peak and 200 GB/s of DRAM
bandwidth: machine balance 10 flops per byte. The kernel `y[i] = a*x[i] + y[i]`
does 2 flops and touches 24 bytes — intensity 0.083 flop/byte, ceiling
$200\times10^{9}\times0.083 \approx 17$ GFLOP/s, 0.8% of peak. A blocked
$4096^2$ matrix multiply does $2n^3$ flops over $3n^2$ words, intensity
$n/12 \approx 340$ flop/byte — far right of the ridge, and able to approach
peak.

Now decompose a $1024^3$ stencil at 200 flops per cell per step, 100 GFLOP/s per
rank, 12.5 GB/s of per-rank bandwidth and 2 µs per message. Each rank holds a
cube of edge $1024/P^{1/3}$ and exchanges six halo faces per step:

| ranks  | local edge | compute | halo exchange | communication share |
| ------ | ---------- | ------- | ------------- | ------------------- |
| 512    | 128        | 4.19 ms | 75 µs         | 1.8%                |
| 4096   | 64         | 524 µs  | 28 µs         | 5.0%                |
| 32768  | 32         | 65 µs   | 16 µs         | 20%                 |
| 262144 | 16         | 8.2 µs  | 13 µs         | 61%                 |

Compute falls as the cube of the local edge, halo volume only as its square, and
below 32 cells per edge the fixed 12 µs of message latency dominates. From 512 to
262,144 ranks is 512× the hardware for 201× the speed: 39% efficiency. That is
**strong scaling**. Hold 128³ cells per rank and grow the problem with $P$
instead: compute and halo stay fixed, and only the global all-reduce grows, to
about $2\,\mu\text{s}\times\log_2 P \approx 36\ \mu\text{s}$ at
$P = 262{,}144$ — under 1% of the step. That is **weak scaling**, and it is why
weak-scaling plots look better.

```c
#include <mpi.h>
#include <stdio.h>

int main(int argc, char **argv) {
    int rank, size;
    double local, total;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    local = 1.0 / (rank + 1);
    MPI_Allreduce(&local, &total, 1, MPI_DOUBLE, MPI_SUM, MPI_COMM_WORLD);
    if (rank == 0) printf("%d ranks, sum = %.17g\n", size, total);
    MPI_Finalize();
    return 0;
}
```

Run that on 4 ranks and then on 8 and you get 2.0833333333333335 against
2.717857142857143 — sums that differ in the first digit, because each rank
contributes $1/(\text{rank}+1)$ and the two runs therefore add different terms.
The floating-point effect is a separate and much smaller one: hold the rank count
fixed and compare the all-reduce against a sequential sum of the same terms, or
force a different collective algorithm, and the last digits can move, because the
reduction tree changes shape and floating-point addition is not associative.

## Formal treatment

Model a message of $m$ bytes as $T(m) = \alpha + m/\beta$, with $\alpha$ the
latency and $\beta$ the bandwidth. An all-reduce over $P$ ranks cannot beat
$\lceil \log_2 P \rceil \alpha$ in latency, and for large $m$ a reduce-scatter
plus all-gather attains bandwidth cost about
$2\frac{P-1}{P}\cdot\frac{m}{\beta}$ — nearly independent of $P$, which is why
large all-reduces scale and small ones do not.

The roofline model bounds a kernel's rate by its arithmetic intensity $I$, in
flops per byte moved to the level in question:

$$
P_{\text{att}}(I) \;=\; \min\!\left(P_{\max},\; b \cdot I\right),
$$

with $P_{\max}$ the peak flop rate and $b$ the peak bandwidth. The ridge point
$I^{*} = P_{\max}/b$ separates memory-bound from compute-bound; below it, better
arithmetic cannot help.

Write $T(P)$ for time on $P$ ranks. Strong-scaling efficiency is
$E_s(P) = T(1)/(P\,T(P))$ at fixed problem size, weak-scaling efficiency
$E_w(P) = T_1(n_0)/T_P(P n_0)$ at fixed work per rank. With serial fraction $s$,
Amdahl's law caps strong speedup at

$$
S(P) = \frac{1}{s + (1-s)/P} \;\xrightarrow[P \to \infty]{}\; \frac{1}{s},
$$

so $s = 0.01$ allows no more than 100×. Gustafson's rebuttal is that $s$ is
rarely fixed: if the parallel work grows with $P$, the scaled speedup
$S(P) = s + (1-s)P$ is linear. Both describe real experiments.

## Assumptions and requirements

Domain decomposition assumes the operator is **local** — a stencil, a short-range
force cutoff, a sparse matrix of bounded bandwidth. Long-range interactions break
it: gravity and Coulomb forces need tree codes, fast multipole or mesh-Ewald
methods, and a distributed FFT needs an all-to-all that moves the whole array. It
assumes **static load balance** too, which adaptive mesh refinement and particle
clustering violate, forcing graph or space-filling-curve partitioning.

MPI's rules are strict and unchecked at compile time: every rank of a
communicator must call each collective, in the same order everywhere, and a
nonblocking send's buffer must not be touched until its request completes.
The standard requires no diagnostic, so violations typically surface as deadlock
or corruption at scale rather than as errors — though implementations do raise
`MPI_ERR_TRUNCATE` on a size mismatch, some check collective consistency on a
communicator, and correctness tools such as MUST exist to catch the rest.

The roofline bound assumes one bandwidth level and perfect overlap — an upper
bound and a diagnostic, not a prediction. Peak flops likewise assumes fused
multiply-add, full-width vectors and every core at boost clock at once.

## Uses and applicability

Reach for HPC when the state does not fit in one node, when the computation
decomposes statically, and when latency between the pieces sits on the critical
path every step. Do not reach for it for an ensemble of independent runs — a task
queue does that, and synchronous collectives only add a failure mode — or when
the job must survive losing a node, since the standard answer here is to kill it
and restart from a checkpoint.

Distributed deep learning inherited this machinery honestly: synchronous
data-parallel training is a gradient all-reduce per step, and the ring and
reduce-scatter/all-gather algorithms in GPU collective libraries are the
bandwidth-optimal HPC algorithms. But training tolerates asynchrony, stale
gradients and reduced precision in ways a PDE solver does not, and its headline
FLOPS are dense low-precision tensor-core operations rather than the
double-precision flops a TOP500 number counts — not comparable figures.

## Limitations and common mistakes

The commonest error is treating peak FLOPS as an expectation. It is an upper
bound from clock rate and functional-unit width; most real applications reach
single-digit percentages of it, a consequence of arithmetic intensity rather than
bad programming.

The second is assuming the benchmarks measure one thing. HPL, the LINPACK
descendant that ranks the TOP500, is a dense LU factorisation — $O(n^3)$ flops on
$O(n^2)$ data, sized to fill memory, the most compute-bound workload there is —
and tuned machines reach roughly 60–80% of peak on it. HPCG, a conjugate gradient
solve with a sparse multigrid preconditioner, is bound by bandwidth and latency,
and the same machines land between a fraction of a percent and a few percent of
peak. HPCG exists because HPL had stopped predicting application performance.

Third, time in `MPI_Allreduce` is usually not network time: a blocking collective
is an implicit barrier, so one slow rank charges its delay to everyone and the
profiler blames the network for load imbalance. Fourth, a strong-scaling plot
without absolute numbers proves nothing, because a badly optimised baseline
scales beautifully.

## Variants and alternatives

MPI is the distributed-memory standard; OpenMP handles shared memory inside a
node through compiler directives, and hybrid MPI+OpenMP is routine because it
cuts the rank count and the duplicated halo storage, at the cost of threading
overhead. PGAS models (Coarray Fortran, UPC, OpenSHMEM) and MPI's one-sided RMA
operations offer a global address space with puts and gets instead of matched
send/receive pairs. Task-based runtimes such as Charm++, Legion and HPX
over-decompose and migrate work dynamically, buying load balance with a heavier
runtime. On accelerated nodes the per-node model is CUDA, HIP, SYCL or OpenMP
target offload.

The genuinely different competitor is the data-parallel batch stack — MapReduce
and its successors — which assumes commodity hardware, re-executes lost tasks and
accepts far higher latency: right for irregular data processing, wrong for a
tightly coupled implicit solver.

## History and attribution

Two lineages merged. Vector supercomputers, emblematically the Cray-1 (1976),
gave way through the late 1980s and 1990s to distributed-memory MIMD machines and
then to commodity clusters — the Beowulf project at NASA in 1994 showed that
off-the-shelf PCs and Ethernet could do real science. Meanwhile the MPI Forum,
convened in the early 1990s to replace a proliferation of incompatible vendor
libraries, published MPI-1 in 1994; OpenMP followed in 1997.

The measurement culture is younger. The TOP500 list began in 1993, ranked by HPL,
which descends from the LINPACK library's timings; HPCG was introduced two
decades later by Jack Dongarra and Michael Heroux as a corrective. Amdahl's law
dates from 1967 and Gustafson's rebuttal from 1988, and the roofline model is due
to Williams, Waterman and Patterson in 2009. Domain decomposition is far older,
descending from Schwarz's alternating method of 1870.

## Sources

The **MPI standard** is the authority for the message-passing model itself:
communicators, ranks, completion semantics, the collective contract, and the
Forum's own revision chronology. The **OpenMP specifications** cover the
node-level shared-memory model, the **CUDA C++ Programming Guide** the
accelerator offload model, and **Deep Learning** large-scale distributed
training. The performance models, scaling laws and benchmark percentages are
flagged uncited in the frontmatter: the registry holds no roofline paper, no
architecture text and no TOP500 or HPCG reference.

## Prerequisites and next connections

Read [Operating Systems](./operating-systems.md) first — a batch allocation and a
page-locked buffer are OS objects — and [Complexity
Analysis](./complexity-analysis.md) for the asymptotics behind the
surface-to-volume argument, though the constants it discards are what a cache
miss is made of. The sibling pages on parallel computing, distributed systems and
networking sit directly around this one.

Next, [CUDA](./cuda.md) and [GPU Kernels](./gpu-kernels.md) give the node-level
model supplying most of the flops; [Partial Differential
Equations](./partial-differential-equations.md) is the workload this machinery
was built for; and [Matrix Decompositions](./matrix-decompositions.md) explains
the LU factorisation HPL measures.
