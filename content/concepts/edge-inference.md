---
concept_id: concept.ml_engineering.edge_inference
title: Edge Inference
slug: /concepts/edge-inference
kind: concept
tier: 1
review_state: generated-draft
summary: Running a trained model's forward pass on the device that holds the data — phone, laptop, camera, vehicle — where memory bandwidth, power and heat rather than raw arithmetic decide what is possible.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: specializes
    target: concept.ml_engineering.deployment
    note: It is deployment whose serving host is the end user's device, so the artefact ships inside an application release instead of onto a fleet the operator controls and can roll back.
  - type: contrasts_with
    target: concept.ml_engineering.training_infrastructure
    note: Training buys throughput with elastic cluster capacity and tolerates a slow step; an edge device has a fixed memory pool, a battery and a thermal cap that no amount of budget enlarges.
  - type: supported_by
    target: concept.ml_engineering.ollama
    note: Ollama is a concrete realisation of the pattern described here — quantised weights, a local runtime and a model store — and is how most people meet edge inference in practice.
sources:
  - source_id: source.ggml.llama_cpp
    title: llama.cpp
    url: https://github.com/ggml-org/llama.cpp
    source_kind: implementation
    supports:
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.ollama.project
    title: Ollama
    url: https://github.com/ollama/ollama
    source_kind: implementation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.lloyd1982.least_squares_quantization
    title: Least squares quantization in PCM
    url: https://ieeexplore.ieee.org/document/1056489
    source_kind: primary-research
    supports:
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hinton2015.distilling_knowledge
    title: Distilling the Knowledge in a Neural Network
    url: https://arxiv.org/abs/1503.02531
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Measured accuracy cost of post-training and quantisation-aware quantisation
    reason: The registry holds no quantisation methodology or evaluation paper — nothing on integer-only inference pipelines, outlier-aware activation scaling, or bit-width sweeps across tasks — so every statement here about how much accuracy a given bit width costs is kept qualitative and uncited.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Mobile and embedded inference runtimes
    reason: The registry covers llama.cpp and Ollama only; the mobile and embedded stacks named alongside them are mentioned from practice, without a citable reference for their behaviour.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
  - label: Network pruning and hardware sparsity support
    reason: No registry source covers pruning or the sparsity patterns some accelerators execute natively, so the claim that unstructured sparsity rarely converts into latency is stated from engineering practice rather than cited.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Edge inference** executes a model's forward pass on the device where the input
is produced, rather than shipping the input to a remote server and the
prediction back. The device may be a microcontroller with kilobytes of SRAM, a
phone, a camera, a car, or a laptop with tens of gigabytes of unified memory;
what they share is that the budget is fixed at manufacture. There is no
autoscaling, no second replica, and no way to answer a hard request by renting a
larger machine — the model runs inside whatever memory, bandwidth and power the
device already has, while competing with everything else the user is doing.

## Why it matters

Three arguments are genuine and one is usually oversold.

The **latency** argument is real for interactive, high-rate inputs. Wake-word
detection, keyboard autocorrect, camera autofocus and on-screen segmentation must
answer within milliseconds of a continuous stream; a network round trip adds not
just its median but its tail, and the tail is what the user notices. Related, and
often more decisive: local inference works with **no connectivity at all**.

The **privacy** argument is structural rather than promissory. If raw camera
frames or keystrokes never leave the device, there is no server-side store to
breach, no retention policy to trust and no subpoena surface. This is an
architectural property, not a claim about intentions, which is why regulators and
security reviewers treat it differently from a promise to delete.

The **cost** argument is that the marginal cost of a prediction moves to the
user's battery. An application with ten million users serves them without a GPU
fleet.

What is oversold is raw speed: a datacentre accelerator will usually produce
tokens faster than a phone even after paying the round trip. Local wins on
time-to-first-response, on availability and on privacy — not generally on
throughput for a large model.

## Intuition

Carry this picture: a datacentre GPU is a compute engine fed by enormous
bandwidth, while a phone is a memory system with a modest compute engine attached
and a hard thermal cap. So count **bytes moved, not FLOPs**.

Autoregressive decoding at batch size one is the clean case. Producing one token
reads every weight from memory exactly once and does about two arithmetic
operations per weight — far too little work per byte to keep any modern
arithmetic unit busy. The generation rate is therefore set by memory bandwidth
divided by model size, and halving the bytes per weight nearly doubles the rate
even though the arithmetic is unchanged. That is why quantisation is the first
lever at the edge and why it helps even when the hardware has no faster integer
path.

The analogy breaks in two places. Prefill — processing a long prompt, or a
convolutional network over an image — is a matrix-matrix operation with high
arithmetic intensity and is genuinely compute-bound, so the same model swaps
regimes inside a single request. And a device that is compute-bound for ten
seconds may be power-bound for the next ten minutes, because sustained clocks are
lower than burst clocks.

## Concrete example

Take one $4096 \times 4096$ weight matrix. In fp32 it occupies 67.1 MB; in fp16,
33.6 MB. Quantise it to 4 bits with one fp16 scale per group of 64 weights along
each row:

```python
import numpy as np

w = np.random.default_rng(0).normal(size=(4096, 4096)).astype(np.float32)

def quantize(w, bits=4, group=64):
    g = w.reshape(w.shape[0], -1, group)
    s = np.abs(g).max(axis=2, keepdims=True) / (2 ** (bits - 1) - 1)
    s = np.maximum(s, 1e-8)                       # a group of all zeros
    q = np.clip(np.rint(g / s), -(2 ** (bits - 1)), 2 ** (bits - 1) - 1)
    return (q * s).reshape(w.shape)               # dequantised weights

wq = quantize(w)
print(np.abs(w - wq).max())                                  # 0.3817
print(np.linalg.norm(w - wq) / np.linalg.norm(w))            # 0.1076
```

The stored form is 8.4 MB of 4-bit codes plus 0.52 MB of scales: 8.9 MB, an
effective 4.25 bits per weight and a 7.5-fold reduction against fp32. The price
is a relative Frobenius error of about 11% on the weights — enormous by the
standards of numerical linear algebra, and yet models of this kind often remain
usable, because what matters is the distribution of the layer's *outputs*, not
the fidelity of its parameters.

Scale it up: a 7-billion-parameter model at fp16 needs roughly 14 GB and will not
fit in an 8 GB phone at all; at 4 bits it needs roughly 4 GB and does. On a device
with 100 GB/s of memory bandwidth, reading 4 GB per token caps generation at about
25 tokens per second, and measured rates land below that ceiling.

## Formal treatment

A uniform affine quantiser with $b$ bits maps a real weight $w$ to an integer
code and back:

$$
q = \operatorname{clip}\!\left(\left\lfloor \frac{w}{s} \right\rceil + z,\; 0,\; 2^{b}-1\right),
\qquad \hat{w} = s\,(q - z),
$$

where $\lfloor\cdot\rceil$ is round-to-nearest, $s > 0$ is the **scale** and $z$
the integer **zero-point**. The symmetric variant used for weights sets $z$ so the
grid is centred, with $q \in \{-2^{b-1},\dots,2^{b-1}-1\}$ and
$s = \max_{i \in G} |w_i| / (2^{b-1}-1)$ over a group $G$.

Under the high-resolution model the residual $w - \hat{w}$ is approximately
uniform on $[-s/2, s/2]$, so its variance is $s^2/12$ and each additional bit
halves $s$, cutting error power by about 6 dB. In the example above the mean
group scale is $0.371$, predicting a root-mean-square error of $0.108$ against a
measured $0.1076$ — the model is accurate here.

Uniform grids are not optimal. Lloyd's conditions for a minimum-mean-square
quantiser require each reconstruction level to be the conditional mean of the
values assigned to it, and each cell boundary to lie midway between adjacent
levels; codebook and $k$-means style quantisers implement exactly this, trading
a lookup for lower error at equal bit width.

**Quantisation-aware training** puts $\hat w$ in the forward pass and uses the
straight-through estimator, $\partial \hat{w}/\partial w := 1$ inside the
unclipped range, for the backward pass. This is a deliberately biased gradient
estimator justified by results rather than by a theorem.

**Distillation** trains a small student on a large teacher's softened outputs,

$$
\mathcal{L} = (1-\alpha)\,\mathrm{CE}(y, p) \;+\; \alpha T^{2}\,
\mathrm{KL}\!\left(p^{\text{teacher}}_{T} \,\|\, p^{\text{student}}_{T}\right),
\qquad p_T = \operatorname{softmax}(z/T),
$$

with logits $z$ and temperature $T$; the $T^{2}$ factor keeps the soft-target
gradients comparable in magnitude as $T$ changes.

## Assumptions and requirements

Group-wise quantisation assumes the weights in a group have comparable magnitude.
A single outlier inflates the group's scale and spends the whole grid covering
it, which is why group sizes are small (32 to 128) and why activations in
transformer models — which contain persistently large channels — need per-channel
or per-group treatment rather than one scale per tensor.

Post-training quantisation of activations needs **calibration data drawn from the
deployment distribution**: ranges estimated on clean images do not hold for night
footage. Quantisation-aware training needs the training pipeline and data, which
is frequently the real blocker rather than the compute.

The runtime must have a kernel for every operator at the chosen precision. One
unsupported operator falls back to float, and a single fallback in an inner loop
can dominate the latency the rest of the quantisation bought.

Finally, the model must fit in the memory the operating system will actually
grant an application, not the memory printed on the box, and it must sustain its
rate under thermal throttling. A ten-second benchmark does not predict minute
five.

## Uses and applicability

Reach for edge inference when the input is high-rate and local (audio, video,
sensor streams), when regulation or user expectation forbids upload, when
connectivity is unreliable, or when per-request server cost dominates at scale.
Locally hosted assistants follow the same pattern on laptops, where llama.cpp
supplies quantised formats and CPU, Metal and GPU backends and Ollama wraps model
management around them.

Do not reach for it when the capability you are shipping does not survive
shrinking — a heavily squeezed model that gets the answer wrong is not a cheaper
product, it is a different one; when usage per device is rare, so a server
amortises far better; or when the weights are the asset, because shipping a model
to a device is publishing it.

## Limitations and common mistakes

The most common error is quoting quantisation cost as a fixed number. There is no
"1% for int8". The loss depends on bit width, granularity, the model's size and
the task: 8-bit post-training quantisation is often near-lossless on
convolutional vision models, while 4-bit on a small model, or on a task with
narrow decision margins, can be severe. Worse, aggregate metrics hide it — a
language model's perplexity can move slightly while a specific capability
(arithmetic, code, long-context retrieval) degrades sharply. Evaluate the metric
you actually ship.

The second is confusing parameter count with latency. Unstructured pruning zeroes
weights but dense kernels still multiply the zeros; without structured sparsity
or specific hardware support, a 50%-sparse model runs at exactly the old speed.

The third is treating local as automatically private. The model is now in the
hands of anyone who owns the device, telemetry and crash logs can still exfiltrate
inputs, and an escalation-to-server fallback quietly undoes the property the
architecture was chosen for.

Fourth, and unglamorous: cold start. Loading four gigabytes from flash on first
use, and being killed by the operating system under memory pressure, ruin more
edge deployments than accuracy ever does.

## Variants and alternatives

**Post-training quantisation** needs only a calibration set and minutes of work;
**quantisation-aware training** costs a training run and recovers much of the
loss at low bit widths. Granularity runs per-tensor, per-channel, per-group.
Weight-only schemes (4-bit weights, 16-bit arithmetic) target the bandwidth bound
at batch one; weight-and-activation schemes (8-bit both) also cut compute and pay
off at larger batches. **Pruning** is structured (whole channels or heads, giving
genuinely smaller dense tensors) or unstructured (finer, rarely faster).
**Distillation** trains a small model outright, and is often better than
compressing a large one to three bits. **Architecture** is the alternative that
competes with all of them: a model designed small — depthwise separable
convolutions, fewer layers, a smaller vocabulary — frequently beats a large model
squeezed hard. On the runtime side, llama.cpp with its GGUF weights and Ollama
above it cover the laptop case; mobile and embedded stacks such as Core ML,
LiteRT, ONNX Runtime and ExecuTorch, plus vendor SDKs for neural accelerators,
cover phones and boards.

## History and attribution

Quantisation is much older than deep learning. Lloyd's least-squares quantiser —
work done at Bell Labs in the 1950s and published in the IEEE Transactions on
Information Theory in 1982 — already gives the centroid and nearest-neighbour
conditions that modern codebook quantisers rediscover. Distillation was named and
popularised by Hinton, Vinyals and Dean in 2015, explicitly as a way to compress
an expensive ensemble into a deployable model, and they credit earlier
model-compression work for the idea.

The edge-specific wave has several independent origins: signal-processing and
embedded-DSP practice, the mobile computer-vision effort of the mid-2010s that
produced integer inference pipelines and compact convolutional architectures,
and, from 2023, the llama.cpp project, which showed that multi-billion-parameter
language models could run on ordinary laptops with aggressive block-wise
quantisation. Ollama and its peers then made that a product rather than a
compile.

## Sources

**llama.cpp** is the reference for what edge inference looks like in code:
block-wise quantised weight formats, the backends they run on, and the trade-offs
that survive contact with real hardware. **Ollama** shows the packaging layer
above it — model store, defaults, a local server. **Least squares quantization in
PCM** is the mathematical ancestor of every weight quantiser here, and the source
for the optimality conditions in the formal treatment. **Distilling the Knowledge
in a Neural Network** supplies the temperature-softened objective and the origin
of distillation as a compression technique. None of these measures the accuracy
cost of a given bit width, which is recorded in the unresolved references.

## Prerequisites and next connections

Read [Deployment](./deployment.md) first: edge inference inherits its
vocabulary — artefact, versioning, rollback, monitoring — and then breaks each
one, because the serving host belongs to the user. [Training
Infrastructure](./training-infrastructure.md) is the useful contrast for where
the compute budget goes.

From here, [GPU Kernels](./gpu-kernels.md) and [CUDA](./cuda.md) explain the
memory hierarchy the bandwidth argument rests on, [Operating
Systems](./operating-systems.md) explains the scheduling and memory pressure that
kill on-device models, and [Containers](./containers.md) is worth reading for the
contrast: the packaging story that server deployment relies on is exactly what an
edge target cannot use.
