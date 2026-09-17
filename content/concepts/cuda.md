---
concept_id: concept.languages.cuda
title: CUDA
slug: /concepts/cuda
aliases:
  - Compute Unified Device Architecture
kind: tool
tier: 1
review_state: generated-draft
summary: NVIDIA's platform for general-purpose GPU programming, in which a C++ function is launched as a grid of thread blocks whose threads execute 32 at a time in warps over an explicitly managed memory hierarchy.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: implements
    target: concept.languages.gpu_kernels
    note: CUDA is the concrete vendor realisation of the GPU kernel programming model — the launch syntax, the block and warp hierarchy and the shared-memory scratchpad are where the general idea acquires an actual compiler and runtime.
  - type: contrasts_with
    target: concept.languages.assembly
    note: CUDA compiles to PTX, a virtual ISA that the driver JIT-compiles to the SASS of the installed architecture, so unlike x86 assembly the published instruction layer is deliberately not the machine's own.
  - type: contrasts_with
    target: concept.systems.operating_systems
    note: The operating system owns the device only through the driver; inside a kernel, warps are scheduled by hardware with no preemptive time-slicing, no per-thread virtual address spaces and no OS-visible thread objects.
  - type: used_to_solve
    target: concept.deep_learning.convolutional_layer
    note: Convolutional layers are executed on GPUs as CUDA kernels — usually an implicit-GEMM formulation inside cuDNN — and the practicality of training deep convolutional networks came directly from that implementation.
sources:
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.triton.documentation
    title: Triton documentation
    url: https://triton-lang.org/main/index.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.openmp.specifications
    title: OpenMP specifications
    url: https://www.openmp.org/specifications/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: ROCm/HIP, SYCL and OpenCL specifications
    reason: The registry has no AMD ROCm, Khronos SYCL or OpenCL source, so the comparison of CUDA against the portable alternatives rests on no cited document.
    sections:
      - variants-and-alternatives
  - label: The roofline model (Williams, Waterman and Patterson)
    reason: The bandwidth-versus-compute bound is named here as the roofline model, and the registry has no source for that model; the CUDA guide covers the underlying performance guidance but not the model by name.
    sections:
      - formal-treatment
  - label: Pre-CUDA GPGPU systems, in particular BrookGPU
    reason: The stream-programming lineage that CUDA inherited is not covered by any registry source; the CUDA guide gives the 2006 introduction date but no account of what preceded it.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**CUDA** is NVIDIA's parallel computing platform and programming model for
general-purpose computation on its GPUs: extensions to C++, a toolchain
(`nvcc`, which splits one source file into host code for the CPU and device
code for the GPU), and a runtime and driver that own the device. The unit of
work is a **kernel** — a function marked `__global__`, compiled for the device
and launched across a **grid** of thread **blocks** by the triple-angle-bracket
syntax `kernel<<<grid, block>>>(args)`. Every thread runs the same body and
distinguishes itself only by the built-in coordinates `blockIdx` and
`threadIdx`.

## Why it matters

A data-centre GPU delivers roughly an order of magnitude more floating-point
throughput and several times the memory bandwidth of a same-generation CPU
socket — but only for code written to its execution model. Before CUDA,
reaching that hardware meant disguising the computation as graphics — arrays as
textures, kernels as fragment shaders — which kept it to specialists. CUDA
removed the disguise.

The consequence shows up across scientific computing and decisively in deep
learning, where GPU implementation turned large networks from an idea into a
practice. Most people meet CUDA through a framework; the reason to learn it
anyway is that when the framework is slow, the explanation is in these terms.

## Intuition

A CPU core is a few fast workers with large caches and branch prediction, good
at unpredictable work. A GPU is a warehouse of simple workers in squads of 32:
you instruct the squad, not the worker. If half of it must do something
different, the other half stands idle while that happens, then they swap.

Work arrives in blocks. A block lands entirely on one streaming multiprocessor
(SM), where its threads share a fast scratchpad and a barrier. Blocks are
independent and run in any order, any number at a time — which is what lets one
binary fill a laptop GPU with 20 SMs or a data-centre GPU with over a hundred.

The analogy breaks twice: it makes memory sound free when feeding the workers
is the whole game, and since Volta (compute capability 7.0) each thread has its
own program counter, so lockstep is a tendency rather than a guarantee.

## Concrete example

A kernel computing $y \leftarrow a x + y$ over a million floats:

```cuda
__global__ void saxpy(int n, float a, const float *x, float *y) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = a * x[i] + y[i];
}

// host side
int n = 1 << 20;
float *dx, *dy;
cudaMalloc(&dx, n * sizeof(float));
cudaMalloc(&dy, n * sizeof(float));
cudaMemcpy(dx, hx, n * sizeof(float), cudaMemcpyHostToDevice);
cudaMemcpy(dy, hy, n * sizeof(float), cudaMemcpyHostToDevice);

int threads = 256;
int blocks  = (n + threads - 1) / threads;   // 4096
saxpy<<<blocks, threads>>>(n, 2.0f, dx, dy);

cudaMemcpy(hy, dy, n * sizeof(float), cudaMemcpyDeviceToHost);  // synchronises
```

The guard `if (i < n)` is there because the grid rounds up to whole blocks;
this $n$ divides exactly, but any other leaves the last block partly idle. The
launch returns immediately — the copy back is what waits. The indexing is what
makes it fast: within a warp, lane $k$ touches `x[base + k]`, so its 32 loads
cover 128 contiguous bytes, served in four 32-byte sectors. Index instead by `i
= (blockIdx.x * blockDim.x + threadIdx.x) * 32` and the warp hits 32 sectors:
1024 bytes fetched for 128 useful ones, from arithmetically identical code.

## Formal treatment

A launch instantiates a grid of $g_x \times g_y \times g_z$ blocks of $b_x
\times b_y \times b_z$ threads, with $b_x b_y b_z \le 1024$ on all current
architectures. A thread's rank within its block is

$$
t = \text{threadIdx.x} + b_x\left(\text{threadIdx.y} + b_y \cdot \text{threadIdx.z}\right),
$$

and the block is partitioned into warps of 32 consecutive ranks, so thread $t$
sits in warp $\lfloor t/32 \rfloor$ — which is why padding a tile to a multiple
of 32 changes which threads move together.

Execution is **SIMT**. A warp issues one instruction at a time, so if its lanes
take $p$ distinct paths through a branch region, the paths run serially:

$$
T_{\text{region}} \;\approx\; \sum_{j=1}^{p} T_j
\qquad\text{rather than}\qquad \max_j T_j .
$$

Divergence between _different_ warps is free; only divergence _inside_ one
serialises.

The memory hierarchy is explicit: **registers** (per thread, up to 255 each);
**shared memory** (per block, tens of kilobytes, programmer-addressed and
banked); **L1** and **L2**; and **global memory** (device DRAM, visible to the
whole grid). Spilled registers go to "local" memory, which is global memory
under a friendlier name.

With $F$ flops and $Q$ bytes moved, peak rate $\pi$ and peak bandwidth $\beta$,

$$
T \;\ge\; \max\!\left(\frac{F}{\pi}, \; \frac{Q}{\beta}\right),
$$

so a kernel is memory bound when its arithmetic intensity $I = F/Q$ falls below
the machine balance $\pi/\beta$ — the roofline picture. `saxpy` moves 12 bytes
per 2 flops, so $I = 1/6$ against a balance in the tens: memory bound by two
orders of magnitude, and no arithmetic tuning will help.

## Assumptions and requirements

CUDA requires NVIDIA hardware and its driver, and the device's **compute
capability** gates which features exist at all: independent thread scheduling,
asynchronous copies and tensor cores each arrived with a particular
architecture, so "CUDA supports it" is always a question about a version.

The workload must supply enough independent work: a device with a hundred-odd
SMs, each holding dozens of resident warps, wants hundreds of thousands of
threads in flight before latency hiding functions at all. Blocks must also be
genuinely independent, since the model guarantees neither an ordering nor
concurrent residency: a kernel in which one block spin-waits on another can
deadlock.

Data must be resident: PCIe moves tens of gigabytes per second against device
memory in the terabytes, so a kernel that copies its input in and result out
each call is bounded by the link.

The memory model is weak: visibility between threads needs `__syncthreads()`
within a block and `__threadfence()` or atomics beyond it. Results are not
guaranteed to match a CPU bit for bit either, since reduction order may differ
and fused multiply-adds may be contracted; the individual IEEE 754 operations
are correctly rounded on both, so a discrepancy comes from the sequence of
operations rather than from the arithmetic itself.

## Uses and applicability

Reach for CUDA when the work is data-parallel over large arrays, access can be
made contiguous or tiled into shared memory, and the kernel runs long enough to
amortise a launch and any transfer: dense linear algebra, convolutions, FFTs,
stencil solvers, Monte Carlo sampling.

Reach for a library first: cuBLAS, cuFFT, cuSPARSE, cuDNN, Thrust and CUB are
tuned per architecture, and a hand-written matrix multiply will not beat them.
Write your own for fusion, for an operation no library implements, or for
irregular algorithms.

Avoid it for branchy pointer-chasing, single-item latency, small arrays, and
results that must be bit-identical to a CPU computation. CUDA also stops at the
device boundary: scaling across GPUs or nodes is NCCL's or MPI's job.

## Limitations and common mistakes

The mistake that survives longest is assuming warps are lockstep. Code relying
on implicit warp synchronisation — a shared-memory reduction with no barrier
over the last 32 elements — is not correct on post-Volta hardware, where
`__syncwarp()` is required. Its cousin is believing `__syncthreads()`
synchronises the grid; it synchronises one block.

Errors are asynchronous and easy to lose: a failing launch reports nothing
until the next API call, which then looks like the culprit.
`cudaGetLastError()` after the launch plus a synchronisation is the standard
way to attribute one in code; `CUDA_LAUNCH_BLOCKING=1` or `compute-sanitizer`
locates it from outside.

Occupancy gets treated as an objective when it is only a means of hiding
latency. Asymptotic operation counts do not predict GPU runtime either — more
flops with better locality routinely wins — and tuning does not transfer, since
tile sizes and register budgets chosen for one architecture are often wrong on
the next. The largest limitation is not technical at all: CUDA runs on one
vendor's hardware.

## Variants and alternatives

Inside the stack, **PTX** is the virtual ISA the compiler emits and **SASS**
the real machine code, while **CUDA Fortran**, **Numba** and **CuPy** expose
the same model from other languages.

**Triton** is the significant higher-level option: a Python DSL in which you
write a program for a block of elements rather than a thread, leaving
coalescing, shared-memory staging and scheduling to the compiler. It buys much
less code at the cost of fine control.

The portable alternatives differ in what they surrender. **HIP/ROCm** is close
enough that porting is largely mechanical, and targets AMD. **SYCL** is
standard single-source C++ across vendors, **OpenCL** the older and more
verbose portable standard, and **OpenMP** target offload or OpenACC the
directive route — annotate a loop and let the compiler emit the device code —
cheapest to adopt, least controllable. How close each gets on a tuned kernel is
contested and keeps moving; the durable asymmetry is the depth of NVIDIA's
libraries rather than the language.

## History and attribution

NVIDIA introduced CUDA in November 2006 alongside the G80 architecture (GeForce
8800), its first design with unified shaders, where the same programmable cores
served vertex and pixel work. That unification made a general-purpose compute
mode plausible: an array of identical programmable units now existed, and CUDA
exposed it directly.

The ideas were not new: a research community was already doing GPGPU with
textures and fragment shaders, and stream-programming systems — BrookGPU at
Stanford most prominently, whose lead author Ian Buck went on to NVIDIA —
established the kernel-over-a-stream abstraction CUDA adopted. The model has
been stable since, while the hardware beneath gained dynamic parallelism,
independent thread scheduling and tensor cores.

## Sources

The **CUDA C++ Programming Guide** is the normative reference for everything
structural here — launch syntax, the thread and memory hierarchies, warp
partitioning and SIMT execution, the compute-capability tables, the guidance on
coalesced access. **Deep Learning** (Goodfellow, Bengio and Courville) covers
why this mattered to machine learning, treating GPU implementation as the
enabling practice. The **Triton documentation** argues the block-level,
compiler-managed case, and the **OpenMP specifications** define the
directive-based offload model.

## Prerequisites and next connections

You need working C or C++ and a picture of a memory hierarchy — cache lines,
latency versus bandwidth — before this reads as anything but syntax. The
companion pages on GPU Kernels and Assembly cover the vendor-neutral kernel
model and the machine layer PTX abstracts.

From here, [Complexity Analysis](./complexity-analysis.md) is worth revisiting
with the roofline bound in mind, since the two cost models disagree about which
algorithm to prefer, and [Convolutional Layer](./convolutional-layer.md) is the
workload whose CUDA implementation shaped a decade of hardware design.
