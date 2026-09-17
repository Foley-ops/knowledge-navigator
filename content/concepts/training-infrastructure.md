---
concept_id: concept.ml_engineering.training_infrastructure
title: Training Infrastructure
slug: /concepts/training-infrastructure
aliases:
  - distributed training
kind: concept
tier: 1
review_state: generated-draft
summary: The machinery that executes one optimisation run across many accelerators — how the model and batch are partitioned, what each partitioning costs in communication, how memory and precision are budgeted, and how the job survives hardware that fails mid-run.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: requires
    target: concept.languages.gpu_kernels
    note: Every trade-off on this page is a trade-off against the accelerator's arithmetic throughput and memory hierarchy, so a reader who does not know what a kernel is and where its data lives cannot tell why moving bytes is the expensive part.
  - type: used_to_solve
    target: concept.optimization.stochastic_optimization
    note: Data parallelism, gradient accumulation and sharding are all ways of forming one minibatch stochastic gradient estimate that no single device could form alone; the optimiser being served is unchanged.
  - type: contrasts_with
    target: concept.ml_engineering.deployment
    note: Serving optimises tail latency under continuous availability with independent requests, whereas a training job is one long gang-scheduled batch computation optimised for aggregate throughput — which is why their failure handling and hardware choices diverge.
  - type: contrasts_with
    target: concept.systems.operating_systems
    note: The operating system's guarantees stop at the process boundary; a training job's ranks are coupled by collective calls into a single all-or-nothing entity, so one dead process kills a job that the OS considers hundreds of healthy ones.
sources:
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mpi_forum.standard
    title: 'MPI: A Message-Passing Interface Standard'
    url: https://www.mpi-forum.org/docs/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.touvron2023.llama
    title: 'LLaMA: Open and Efficient Foundation Language Models'
    url: https://arxiv.org/abs/2302.13971
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: The parallelism and precision papers — GPipe, Megatron-LM, ZeRO, and Micikevicius et al. on mixed-precision training
    reason: No registry source covers these, so the pipeline bubble fraction, the per-layer all-reduce count of tensor parallelism, the ZeRO stage accounting and the loss-scaling recipe are stated from general knowledge and should be checked against the original papers before this page leaves generated-draft.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: Young's and Daly's optimal checkpoint-interval analysis
    reason: The square-root checkpoint interval comes from the HPC resilience literature, which the registry does not cover; the one-line derivation is given in full here so a reader can check the result rather than take a citation on trust.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Collective-library and interconnect documentation (NCCL, NVLink and InfiniBand link rates)
    reason: The bandwidth and throughput figures in the worked example are representative hardware numbers rather than quantities any cited source states, and no registry source documents collective-communication libraries or link rates.
    sections:
      - concrete-example
      - formal-treatment
claims: []
---

## Definition

**Training infrastructure** is the machinery that turns one optimisation step,
$\theta_{t+1} = \theta_t - \eta \hat g_t$, into a job keeping thousands of
accelerators busy for weeks: how model and batch are partitioned across devices,
which collective communication runs when, what precision each tensor carries,
how memory is budgeted against recomputation, and how the run survives hardware
that breaks mid-flight. Frameworks supply the pieces — PyTorch's
`DistributedDataParallel`, `FullyShardedDataParallel`, `torch.autocast` — and
the infrastructure is the choice of which to combine and how to map them onto
the hardware.

Three partitionings dominate, with communication costs differing by orders of
magnitude:

- **Data parallelism** replicates the model and splits the batch: one all-reduce
  of gradients per step, volume scaling with the **parameter count**.
- **Tensor parallelism** splits individual weight matrices: an all-reduce of
  **activations** inside every layer, forward and backward.
- **Pipeline parallelism** assigns contiguous layers to devices: only
  point-to-point sends of boundary activations, but devices idle in a bubble.

## Why it matters

Arithmetic first. A 7-billion-parameter model trained with Adam in mixed
precision carries roughly 16 bytes per parameter — 2 for the half-precision
weights, 2 for the gradients, 4 for the master weights and 8 for the two Adam
moments — so 112 GB of state before a single activation is stored. No 80 GB
accelerator holds that, and the apparatus below exists because of that sentence.

Scale turns the arithmetic into a schedule. The LLaMA authors report training
their 65B model on 2048 A100-80GB GPUs at about 380 tokens per second per GPU,
so their 1.4-trillion-token corpus takes roughly 21 days. At that size a 10%
throughput difference is two days of a large cluster, and a failure handled
badly is hours of recomputed work.

## Intuition

The devices are workers on one assembly line and an all-reduce is a meeting
every worker must attend, so step time is set by the slowest attendee: one
straggler — a throttled GPU, a stalled dataloader — taxes every device equally.
The analogy breaks at the network, which is not a corridor but a fixed-topology
fabric whose bandwidth depends on _which_ devices speak. Links inside a node are
roughly an order of magnitude faster than links between them, which is why the
chatty axis (tensor parallelism) is mapped inside a node and the quiet axes
across nodes.

Underneath is a three-way trade in which every technique buys memory by spending
something else: activation checkpointing spends FLOPs, sharding spends
communication, gradient accumulation spends wall-clock serialisation. Knowing
which currency you have spare is most of the skill.

## Concrete example

Take the 7B model above on eight 80 GB GPUs in one node. Pure data parallelism
fails immediately: 112 GB per replica against 80 GB. Shard the parameters,
gradients and optimiser state across the eight and each holds $112/8 = 14$ GB,
leaving about 66 GB for activations and the gathered weights of the executing
layer.

Sharded, each step reduce-scatters the 14 GB of half-precision gradients
($\frac{7}{8}\cdot 14 \approx 12.25$ GB per device) and all-gathers the
parameters once in the forward pass and once in the backward — about 37 GB
across each device's links, 1.5 times what a replicated all-reduce would move;
at an effective 200 GB/s that is 0.18 s. With a per-device microbatch of
32768 tokens, the step costs about $6 \times 7\times10^{9} \times
(8 \times 32768) \approx 1.1\times10^{16}$ FLOPs (the usual $6ND$ estimate for a
dense transformer), which at an achieved 300 TFLOP/s per device is 4.6 s.
Communication is 4% of the step and hides behind the backward pass.

Hold the _global_ batch fixed and move to 512 GPUs. Per-device compute falls to
0.07 s, while the same collectives now run inter-node at perhaps 50 GB/s and
take 0.84 s — from negligible to twelve times the compute, with nothing changed
about the algorithm. That is strong scaling's whole story in one pair of numbers.

The accumulation-and-precision loop is short:

```python
import contextlib, torch

scaler = torch.amp.GradScaler("cuda")   # needed for fp16, not for bf16
accum = 4

for microbatches in loader:             # yields `accum` microbatches
    for i, (x, y) in enumerate(microbatches):
        last = i == accum - 1
        # Skip the gradient all-reduce until the final microbatch.
        with model.no_sync() if not last else contextlib.nullcontext():
            with torch.autocast("cuda", dtype=torch.float16):
                loss = loss_fn(model(x.cuda()), y.cuda()) / accum
            scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad(set_to_none=True)
```

## Formal treatment

Let $N$ be the rank count, $P$ the parameter count, $b$ bytes per element, $B$
the per-device link bandwidth and $\alpha$ the per-message latency. A ring
all-reduce is a reduce-scatter followed by an all-gather, each $N-1$ steps of
$P/N$ elements, so

$$
T_{\text{all-reduce}} \;=\; 2(N-1)\alpha \;+\; 2\,\frac{N-1}{N}\,\frac{Pb}{B}.
$$

The bandwidth term approaches $2Pb/B$ and is **independent of $N$**: data
parallelism scales well at fixed per-device batch and badly at fixed global
batch, because compute per device falls as $1/N$ while this term does not. Tree
algorithms trade the $O(N)$ latency term for $O(\log N)$ at worse bandwidth, so
libraries switch algorithm by message size.

Tensor parallelism communicates activations instead: splitting a transformer
block's two matrices column-wise then row-wise leaves one all-reduce of
$b_{\text{seq}} \cdot s \cdot h$ elements per block forward and one backward,
scaling with batch and sequence length rather than $P$ and recurring tens of
times per step.

Pipeline parallelism with $p$ stages and $m$ microbatches has idle fraction

$$
f_{\text{bubble}} \;=\; \frac{p-1}{m+p-1},
$$

so $m \gg p$ is required, and the cost is activation memory for the microbatches
in flight.

For fault tolerance, let $M$ be the mean time between job-killing failures and
$\delta$ the cost of one checkpoint. With interval $\tau$, overhead is
$\delta/\tau$ and expected lost work $\tau/(2M)$ per unit time, so minimising
$f(\tau) = \delta/\tau + \tau/(2M)$ gives $f'(\tau) = -\delta/\tau^2 + 1/(2M)=0$
and

$$
\tau^{*} \;=\; \sqrt{2\,\delta\,M}.
$$

If $N$ nodes each fail independently at rate $1/T$ then $M \approx T/N$: a
thousand nodes with a one-year MTBF each fail as a group every nine hours or so.

## Assumptions and requirements

Gradient averaging assumes the loss is a mean over independent examples: exact
when every rank holds equally many examples whose losses do not interact,
silently wrong for batch normalisation (statistics are per-rank unless
synchronised), for contrastive losses coupling examples within a batch, and for
token-weighted losses over unequal-length sequences, where dividing by the
microbatch count rather than the token count misweights the shards.

Collectives assume every rank calls them, in the same order, with matching
shapes — the MPI standard is explicit that collective operations on a
communicator must be issued by all its processes in a consistent order. A rank
that branches away (an early `break` on a short dataloader, a step skipped after
a NaN check on one rank only) raises no error; it hangs until a timeout.

Restart correctness assumes the checkpoint captured optimiser state, schedule
position, RNG state and dataloader cursor; a checkpoint of weights alone
restarts a different run that happens to share its parameters.

## Uses and applicability

Reach for this machinery in order of severity. If the model fits with room to
spare, plain data parallelism with overlapped gradient reduction wins on
simplicity and speed; if it nearly fits, add activation checkpointing or shard
the optimiser state; if the parameters do not fit, shard them too. Only when a
single layer's matrices are too large, or the per-device batch too small to hide
the all-reduce, does tensor parallelism earn its bandwidth appetite — and it
should stay within a node. Pipeline parallelism enters when the model spans more
nodes than that covers; large runs combine several axes plus activation
checkpointing. LLaMA-65B, for instance, combines data, tensor and sequence
parallelism with activation checkpointing, and no pipeline stage at all.

Do not reach for it when the real constraint is data, evaluation or iteration
speed. A researcher who can fit a run on one device should, because every axis
added multiplies the ways a run can hang or silently diverge.

## Limitations and common mistakes

The word _checkpointing_ means two unrelated things and the confusion is
constant: **activation checkpointing** discards intermediate activations and
recomputes them in the backward pass, trading roughly 30% more compute for large
memory savings, while **fault-tolerance checkpointing** writes state to durable
storage. Papers use both, sometimes in one paragraph.

Gradient accumulation is not exactly a larger batch: exact for a per-example
mean loss, inexact wherever batch statistics appear. Nor does a larger batch buy
proportional progress — returns diminish past a model- and dataset-dependent
scale, an empirical finding and not a theorem.

Mixed precision is a numerical change, not a free speedup. Half precision has a
maximum of about 65504 and underflows below roughly $6\times10^{-5}$, so fp16
training needs loss scaling; bfloat16 has fp32's exponent range and needs none,
at the cost of mantissa bits. Reductions, softmax and normalisation are kept in
fp32 by convention, because that is where error accumulates. Expect no bitwise
reproducibility: reduction order varies with rank count and algorithm.

Finally, failures are not exceptional. At a thousand nodes they are scheduled
events. The failure that hurts most is the quiet one — a rank producing NaNs, a
straggler halving throughput, a corrupted shard — because the job keeps running
and reports progress.

## Variants and alternatives

Sharded data parallelism comes in stages: optimiser state, then gradients, then
parameters (ZeRO stages 1–3, of which PyTorch's `FullyShardedDataParallel` is
the third). Stage 3 gathers each layer's weights just before use and discards
them after, buying memory proportional to $1/N$ at roughly 1.5 times data
parallelism's communication volume. Among pipeline schedules, the naive
fill-and-drain wastes activation memory where one-forward-one-backward cuts it
to the stage count. Mixture-of-experts adds **expert parallelism**, whose
all-to-all has a different cost profile again, and offloading optimiser state to
host memory or NVMe trades PCIe bandwidth for device memory. Genuinely different
approaches include asynchronous parameter servers, which remove the barrier at
the price of stale gradients, and local-SGD methods communicating every few
steps; neither is standard for frontier-scale dense models, and where they are
competitive is not settled.

## History and attribution

The idea has several distinct origins. Asynchronous, parameter-server data
parallelism was established by Google's DistBelief work in 2012, on CPU clusters
where the network was slow and stale gradients were the accepted price. Ring
all-reduce came the other way, out of HPC collective communication, arriving in
deep learning around 2017 as GPU interconnects made synchronous training the
better bargain. Activation checkpointing is older still in disguise: the
checkpointing strategy of reverse-mode automatic differentiation, rediscovered
for neural networks in 2016. Mixed-precision training with fp32 master weights
and loss scaling came from NVIDIA and Baidu researchers in 2017, and pipeline
parallelism (GPipe), tensor parallelism for transformers (Megatron-LM) and the
ZeRO sharding stages between 2018 and 2020. The optimal checkpoint interval
predates all of it, from the HPC resilience literature.

## Sources

The **PyTorch documentation** is the reference for the concrete APIs — what
`DistributedDataParallel` synchronises and when, what `FullyShardedDataParallel`
gathers, how `autocast` and `GradScaler` interact, and each one's documented
pitfalls. The **MPI standard** defines the collective operations and the
conditions under which a program using them is correct. **Designing
Data-Intensive Applications** is the source for treating partial failure as the
normal regime, and the **LLaMA** paper is the cited example of a real run.

## Prerequisites and next connections

Read [GPU Kernels](./gpu-kernels.md) first, and [CUDA](./cuda.md) for the
concrete memory hierarchy; the trade-offs here make sense only once moving bytes
is visibly more expensive than multiplying them.
[Stochastic Optimization](./stochastic-optimization.md) supplies the update being
executed, and [Tensors](./tensors.md) the objects being sharded.

Afterwards, [Operating Systems](./operating-systems.md) is the useful contrast:
the scheduling, memory and failure model this machinery deliberately bypasses,
because a gang of ranks joined by collectives is not a set of independent
processes.
