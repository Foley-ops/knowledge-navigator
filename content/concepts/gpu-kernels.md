---
concept_id: concept.languages.gpu_kernels
title: GPU Kernels
slug: /concepts/gpu-kernels
kind: concept
tier: 1
review_state: generated-draft
summary: The unit of work dispatched to a GPU — one function run by a grid of threads — whose speed is usually decided by how many bytes it moves rather than how many operations it performs.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: contrasts_with
    target: concept.languages.cuda
    note: CUDA is the vendor platform, language extension and toolchain; this page is the performance craft of arranging threads and data, which carries over to ROCm, Triton and SYCL largely unchanged.
  - type: implements
    target: concept.deep_learning.convolutional_layer
    note: A convolutional layer runs not as its mathematical definition but as a chosen kernel — im2col plus GEMM, an implicit-GEMM tiling, or a direct fused kernel — and that choice changes runtime by more than the layer's design does.
  - type: contrasts_with
    target: concept.algorithms.complexity_analysis
    note: 'Operation counting predicts GPU runtime badly: two kernels with identical FLOP counts can differ tenfold because arithmetic intensity, not operation count, decides which resource saturates.'
sources:
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.triton.documentation
    title: Triton documentation
    url: https://triton-lang.org/main/index.html
    source_kind: reference-documentation
    supports:
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Roofline performance model
    reason: The registry has no source for the roofline model of Williams, Waterman and Patterson, so the bound stated in the formal treatment and the ridge-point arithmetic are uncited.
    sections:
      - formal-treatment
  - label: FlashAttention
    reason: No registry source covers the tiled, recomputing attention kernel or its HBM-access bound, which the concrete example works through.
    sections:
      - concrete-example
      - uses-and-applicability
  - label: Accelerator hardware specifications
    reason: Peak bandwidth and peak FLOP/s figures for specific GPUs come from vendor datasheets the registry does not list; the numbers here are given as approximate orders of magnitude.
    sections:
      - formal-treatment
      - concrete-example
  - label: Non-NVIDIA execution widths
    reason: The registry has no AMD ROCm or Intel oneAPI source, so the wavefront and sub-group widths named beside NVIDIA's 32-lane warp rest on no cited document; the CUDA guide covers only the NVIDIA half of the definition.
    sections:
      - definition
  - label: Pre-CUDA stream programming, in particular BrookGPU
    reason: No registry source covers BrookGPU, Sh, Scout or the Imagine stream processor, so the pre-CUDA origin of the kernel abstraction is stated uncited; the CUDA guide gives the platform's own dates but no account of what preceded it.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **GPU kernel** is a single function compiled for the device and launched as a
grid of thread blocks, every thread executing the same program over its own
index — single program, multiple data. The hardware groups threads into lockstep
bundles — **warps** of 32 lanes on NVIDIA, **wavefronts** of 64 on AMD's CDNA
and 32 or 64 on RDNA, sub-groups of 8, 16 or 32 on Intel Xe — that issue
together, schedules blocks onto streaming
multiprocessors (SMs), and gives each block a slab of on-chip **shared memory**
visible only to its own threads. Registers, shared memory, L2 and off-chip HBM
form a hierarchy whose bandwidths differ by orders of magnitude, and the kernel
author — not a cache-replacement policy — decides what lives where. The bundle
width is a vendor's architectural convention rather than a fact about GPUs, so
the craft transfers but the constants do not: a tile width or stride tuned to 32
lanes has to be retuned for a 64-lane wavefront. The numbers below are NVIDIA's.

## Why it matters

Arithmetic throughput has grown far faster than memory bandwidth: a datacentre
GPU can perform on the order of a hundred floating-point operations in the time
it takes to fetch one byte from HBM. Most deep-learning operations —
activations, normalisations, elementwise arithmetic, softmax — do a handful of
operations per byte, so they are **memory-bound**, and a framework that
dispatches each as its own kernel pays a full HBM round trip per operation for
no arithmetic reason. Kernel craft is therefore not a micro-optimisation: fusing
an elementwise chain, or tiling a reduction so its intermediates never leave the
chip, changes the number of bytes crossing the slowest link, and for a
memory-bound kernel that number _is_ the runtime.

## Intuition

Picture a warehouse with an enormous workforce and one narrow loading dock: more
workers help only while there is freight to work on. The GPU hides memory
latency not with deep caches but with oversubscription — thousands of resident
threads, and a scheduler that switches warps at zero cost when one stalls on a
load. **Occupancy**, resident warps per SM as a fraction of the hardware
maximum, measures how much cover exists; registers per thread and shared memory
per block cap it.

Two further pictures do most of the work. **Coalescing**: when the 32 lanes of a
warp read 32 consecutive addresses the hardware serves them with a few wide
transactions; with a large stride it may issue one per lane and waste most of
each. **Shared-memory tiling**: load a tile once and let every thread in the
block reuse it, turning many HBM reads into one.

The analogy breaks twice. Shared memory is explicitly managed, not an automatic
cache — nothing arrives unless you move it. And occupancy is not monotonically
good: a tiled matrix-multiply holding a large accumulator in registers runs at
low occupancy deliberately, and beats the version that spills.

## Concrete example

A fused bias-plus-activation kernel in Triton, written at block granularity:

```python
import triton
import triton.language as tl

@triton.jit
def fused_bias_gelu(x_ptr, b_ptr, y_ptr, n, BLOCK: tl.constexpr):
    offs = tl.program_id(0) * BLOCK + tl.arange(0, BLOCK)
    mask = offs < n
    x = tl.load(x_ptr + offs, mask=mask) + tl.load(b_ptr + offs, mask=mask)
    y = x * tl.sigmoid(1.702 * x)          # sigmoid approximation to GELU
    tl.store(y_ptr + offs, y, mask=mask)
```

The offsets are contiguous, so the loads coalesce. In fp32 this kernel moves 12
bytes per element — read `x`, read `b`, write `y` — where two library calls
would move 20, the extra being a temporary written and read straight back. Both
are bandwidth-bound, so fusion buys about $20/12 \approx 1.7\times$ and saves no
arithmetic at all.

Attention is the canonical case. For sequence length $N$ and head dimension $d$,
the textbook implementation materialises $S = QK^\top/\sqrt{d}$ in HBM, reads it
back for the softmax, writes the probabilities and reads them again for $PV$: at
$N = 8192$ in fp16, $S$ alone is $8192^2 \times 2 \approx 134$ MB per head,
moved several times over. FlashAttention tiles $Q$, $K$ and $V$ into blocks that
fit in shared memory, carries a running maximum and normaliser so the softmax
completes incrementally, and never writes $S$ to HBM; the backward pass
recomputes $S$ from $Q$ and $K$ tiles instead of reading it back. HBM accesses
fall from $\Theta(N^2 + Nd)$ to $\Theta(N^2 d^2 / M)$ for on-chip memory of size
$M$ — more arithmetic, several times faster.

## Formal treatment

Let $W$ be the floating-point operations a kernel performs and $Q$ the bytes it
moves across the bottleneck level, normally HBM. Its **arithmetic intensity** is

$$
I \;=\; \frac{W}{Q} \quad \text{FLOP/byte}.
$$

With peak throughput $P_{\max}$ (FLOP/s) and peak bandwidth $\beta$ (bytes/s),
the roofline model bounds attainable performance by

$$
P \;\le\; \min\bigl(P_{\max},\; \beta I\bigr),
$$

with the **ridge point** at $I^{\star} = P_{\max}/\beta$. Below it a kernel is
memory-bound and takes time $Q/\beta$; above it, compute-bound and takes
$W/P_{\max}$. For a GPU of the A100 generation, roughly
$\beta \approx 2 \times 10^{12}$ B/s and
$P_{\max} \approx 3 \times 10^{14}$ FLOP/s in fp16 tensor-core arithmetic, so
$I^{\star} \approx 150$ FLOP/byte, while elementwise work sits near $0.1$. An
$n \times n$ fp16 GEMM with perfect blocking has $W = 2n^3$, $Q = 6n^2$ and so
$I = n/3$, compute-bound for $n \gtrsim 450$; written naively, re-reading a row
per output element, it has $I = O(1)$ and lands on the memory roof. The model
describes an implementation, never an algorithm.

Occupancy is capped by registers, by shared memory, and by the hardware limit on
warps per SM, whichever binds first. What it supplies is bytes in flight: by
Little's law, covering latency $L$ at bandwidth $\beta$ needs $\beta L$ bytes
outstanding — about a megabyte at $L \approx 500$ ns and $\beta \approx 2$ TB/s.

## Assumptions and requirements

The roofline assumes compute and transfer overlap perfectly, that one level of
the hierarchy is the bottleneck, and that peak figures are reachable; real
kernels attain perhaps 70–90% of peak bandwidth, so it is an upper bound rather
than a prediction. It ignores latency, issue limits and synchronisation, which is
why a kernel far below its roofline is often occupancy-starved rather than
bandwidth-starved.

The kernel model assumes work parallel enough to fill the device: a launch of
256 threads leaves a hundred-SM GPU idle and the few microseconds of launch
overhead dominate. Coalescing assumes you control the layout — a gather with
data-dependent indices can only be cached, not made contiguous. Tiling assumes
reuse exists, and elementwise operations have none.

## Uses and applicability

Write a custom kernel when profiling shows a memory-bound chain that could be
fused, when an operation has a shape or dtype no library covers, or when a fused
backward pass would avoid storing an activation. PyTorch exposes three routes:
custom C++/CUDA extensions, `torch.compile`, whose Inductor backend emits fused
Triton kernels for elementwise chains, and dispatch to hand-written backends such
as those behind `scaled_dot_product_attention`. Do not write one where cuBLAS or
cuDNN already applies — a tuned GEMM is years of assembly-level work — or before
checking that the GPU is the bottleneck at all: dataloader stalls and
host-device synchronisation explain a large share of slow models.

## Limitations and common mistakes

Chasing occupancy as an end in itself is the classic error: it is a means of
hiding latency, and past the covering threshold more of it only costs registers.
Counting FLOPs to predict runtime is the second, and is why an operation that
looks free can dominate a profile. Assuming fusion always wins is the third — it
raises register and shared-memory pressure, and fusing a memory-bound operation
with a compute-bound one gains at most the smaller cost. Warp divergence is the
related trap: a branch that splits a warp serialises both sides, while one
uniform across the warp is free, so treating all branching as expensive is wrong.

Two practical errors deserve naming. Kernel launches are asynchronous, so timing
without an explicit device synchronisation measures the launch, not the kernel.
And a fused or tiled kernel usually reassociates
floating-point additions: numerically defensible, but not bit-identical to what
it replaced, so tests asserting exact equality fail correctly.

## Variants and alternatives

The alternatives are layers of abstraction rather than rivals. Raw CUDA C++ or
HIP gives full control at the highest cost in effort; inline PTX buys the last
few percent; template libraries such as CUTLASS encode the tiling hierarchy for
GEMM-shaped work. Triton raises the unit of programming from the thread to the
block — you write tile loads and stores, and the compiler handles coalescing,
scheduling and register allocation within the block — at the cost of the last
increments of control. Compilers go further: `torch.compile`, XLA and TVM fuse
automatically, which is the right default. Block sizes tuned for one
architecture regress on the next, so autotuning over launch configurations is
standard at every level. OpenMP and MPI address parallelism under a different
cost model: no device memory to cross, far fewer threads to feed.

## History and attribution

General-purpose GPU computing began without a compute language: through the
early 2000s it meant hand-writing fragment shaders and disguising arrays as
textures. The kernel abstraction arrived before CUDA did. BrookGPU, presented by
Buck and colleagues at Stanford in 2004, and contemporaries such as Sh and
Scout, first made the kernel an explicit C-like function applied to a stream —
an idea carried over from the Imagine stream processor — and compiled it down to
those same fragment shaders. CUDA, released by NVIDIA in 2007 with Brook's lead
author Ian Buck by then at NVIDIA, gave that abstraction native hardware
support, an ordinary C function with a launch syntax, and the vocabulary of
grids, blocks, warps and shared memory that dates from then. The
roofline model was published by Williams, Waterman and Patterson around 2009 for
multicore CPUs and transferred to accelerators unchanged, because the imbalance
it describes only grew. Triton was introduced by Philippe Tillet and
collaborators around 2019; FlashAttention by Tri Dao and collaborators in 2022,
building on a single-pass softmax normaliser described separately a few years
earlier. Trading arithmetic for memory traffic is older than all of these, with
independent origins in the blocked algorithms of numerical linear algebra.

## Sources

The **CUDA C++ Programming Guide** is the reference for the execution and memory
model — thread hierarchy, warps, shared memory, coalescing rules, occupancy
limits — and the place to check any hardware behaviour claimed here. The
**Triton documentation** gives the block-level programming model, with tutorials
working through fused softmax and tiled matrix multiplication. The **PyTorch
documentation** covers custom extensions, compiler-driven fusion and fused
attention backends.

## Prerequisites and next connections

You need array indexing and memory layout — strides, row-major order,
contiguity — from [Tensors](./tensors.md), and matrix multiplication as the
workload everything is tuned around, from [Matrix Theory](./matrix-theory.md).
The CUDA page is this one's companion: that is the platform, this is the craft.
From here, [Convolutional Layer](./convolutional-layer.md) repays a second
reading as an implementation question, and
[Complexity Analysis](./complexity-analysis.md) is worth reading against this
page: arithmetic intensity is the cost model asymptotic operation counting
leaves out.
