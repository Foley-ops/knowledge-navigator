---
concept_id: concept.deep_learning.quantization
title: Quantization
slug: /concepts/quantization
aliases:
  - neural-network quantization
kind: method
tier: 1
review_state: generated-draft
summary: Quantization maps model values to a finite set of representable levels so weights or activations can use fewer bits, accepting approximation error in exchange for storage or execution benefits.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: contributes_to
    target: concept.ml_engineering.edge_inference
    note: Lower-bit weights can reduce the memory capacity and bandwidth required for on-device inference.
  - type: contributes_to
    target: concept.ml_engineering.deployment
    note: Quantized artifacts may reduce serving storage or latency when the deployment runtime has matching kernels.
  - type: contrasts_with
    target: concept.deep_learning.pruning
    note: Quantization reduces the representation precision of retained values, while pruning removes selected values or structures.
sources:
  - source_id: source.lloyd1982.least_squares_quantization
    title: Least squares quantization in PCM
    url: https://ieeexplore.ieee.org/document/1056489
    source_kind: primary-research
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.ggml.llama_cpp
    title: llama.cpp
    url: https://github.com/ggml-org/llama.cpp
    source_kind: implementation
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Neural-network post-training and quantization-aware training methodology
    reason: The registry has quantization theory and one implementation but no primary methodology or benchmark source for calibration, integer-only inference, straight-through estimators, or task accuracy across bit widths.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Quantization** replaces values from a large or continuous numerical domain
with values from a finite codebook. In neural-network inference, weights and
sometimes activations are stored or computed with fewer bits. A uniform affine
quantizer maps a real value $x$ to an integer code $q$ and reconstruction
$\widehat x$:

$$
q=\operatorname{clip}
\left(\left\lfloor\frac{x}{s}\right\rceil+z,
q_{\min},q_{\max}\right),
\qquad
\widehat x=s(q-z),
$$

where $s>0$ is a scale and $z$ a zero-point. Quantization is approximate unless
every value already lies on the reconstruction grid. Its benefit depends on how
codes, scales, and kernels are represented in the target runtime.

## Why it matters

Model weights can be limited more by memory capacity and bandwidth than by
arithmetic. Reducing a weight from 16 bits to roughly 4 bits can make a model fit
on a smaller device and reduce bytes read for each inference operation. The
llama.cpp implementation is registered evidence that block-quantized formats
are used for local model inference.

Bit width alone does not determine speed or accuracy. Scales and metadata add
overhead, unpacking costs compute, unsupported operators may fall back to higher
precision, and errors propagate through the model. Quantization is successful
only when an evaluated artifact meets both task and systems budgets.

## Intuition

Quantization rounds a detailed measuring scale onto a coarser ruler. A smaller
step preserves values more faithfully but needs more levels to cover a fixed
range. A larger step covers outliers but makes ordinary values less precise.
Grouping lets different portions of a tensor use different rulers.

The ruler picture breaks because the network is a composition. Small weight
errors can cancel, be damped, or be amplified depending on inputs and later
layers. Minimum error in the weights themselves need not minimize task loss.
Calibration and end-to-end evaluation therefore matter more than reconstruction
error alone.

## Concrete example

Quantize $x=(-1,-0.2,0.3,1)$ with a symmetric 3-bit signed codebook
$q\in\{-3,-2,-1,0,1,2,3\}$ and scale $s=1/3$. Rounding gives codes
$(-3,-1,1,3)$ and reconstructions

$$
\widehat x=(-1,-1/3,1/3,1).
$$

The errors are approximately $(0,0.1333,-0.0333,0)$, so mean squared
reconstruction error is

$$
\frac{0^2+0.1333^2+(-0.0333)^2+0^2}{4}
\approx0.00472.
$$

If one outlier changed the last value to $10$ and the same tensor-wide rule set
$s=10/3$, all three ordinary values would round to zero. Per-group or per-
channel scales can isolate such ranges, at the cost of additional metadata and
more complicated kernels.

## Formal treatment

For a scalar random variable $X$, a quantizer partitions its domain into cells
$C_k$ and assigns reconstruction levels $r_k$. Squared-error distortion is

$$
D=\mathbb E\left[(X-Q(X))^2\right].
$$

Lloyd's conditions for a locally optimal scalar quantizer place each
reconstruction level at the conditional mean of its cell and each boundary
midway between neighboring levels under squared error. Uniform affine grids are
easier to implement but need not minimize distortion for a nonuniform
distribution.

Neural-network schemes choose granularity: one scale per tensor, channel, or
group. Weight-only quantization reconstructs weights for higher-precision
arithmetic; weight-and-activation quantization also restricts intermediate
values. Training with simulated quantization is commonly called quantization-
aware training, but its straight-through gradient methods and comparative
accuracy are not verified by a registered methodology source here.

## Assumptions and requirements

The chosen range must represent values that occur in deployment. Activation
quantization therefore needs representative calibration or training data. A
single outlier can waste most uniform levels. To reconstruct values, a consumer
needs the scale, the zero-point (hence whether the grid is symmetric or
asymmetric), the data type, and the granularity or block layout stored alongside
the codes. Rounding and clipping are encoder-side choices already baked into the
stored integers, and accumulator precision is a property of the runtime kernel
rather than a field of the artifact, so both belong in the documented recipe for
reproducibility rather than in the serialized file.

The runtime must implement compatible kernels. Effective bits per weight include
scales, zero-points, padding, and alignment. Integer products may require wider
accumulators to avoid overflow. Task evaluation must cover rare inputs, because
aggregate reconstruction statistics do not certify decisions near a boundary.

## Uses and applicability

Use quantization when model storage or memory bandwidth is a binding constraint
and the target backend supports a tested lower-bit format. Weight-only schemes
are especially relevant when reading weights dominates and activations can
remain higher precision. Higher-bit formats may offer a safer first step when
accuracy margins are narrow.

Do not choose a bit width from model size alone. Benchmark end-to-end latency,
peak memory, energy if relevant, and task metrics on the deployment device. If
the runtime dequantizes an entire tensor before every operation, the smaller file
may not produce faster steady-state inference.

## Limitations and common mistakes

Quantization introduces clipping and rounding error. Sensitivity varies across
layers, channels, examples, and tasks. A model can preserve average loss while
changing a rare but important capability. The registry lacks a deep-learning
quantization benchmark, so no fixed accuracy cost is claimed for int8, 4-bit,
or any other precision.

Common mistakes include ignoring scale metadata in compression ratios, calibrating
on unrepresentative data, mixing incompatible zero-point conventions, allowing
accumulators to overflow, comparing file size rather than resident memory,
assuming integer arithmetic is faster on every processor, and reporting weight
reconstruction error without task evaluation. Another is confusing decimal
digits with binary precision.

## Variants and alternatives

Uniform versus nonuniform codebooks trade simple arithmetic for potentially
lower distortion. Symmetric grids simplify zero handling; asymmetric grids can
use levels more efficiently for shifted ranges. Granularity ranges from per-
tensor to per-channel or small groups. Static activation ranges are calibrated
ahead of time; dynamic schemes estimate ranges during execution.

Post-training quantization modifies a completed model, while quantization-aware
training exposes training to the simulated error. The registry gap prevents a
comparative recommendation between them. [Pruning](./pruning.md) removes values
or structures; distillation trains a separate student; a smaller architecture
avoids some compression complexity altogether.

## History and attribution

Quantization predates neural networks as a signal-representation problem.
Lloyd's registered paper, published in 1982 from earlier Bell Labs work,
supports the least-squares cell and reconstruction conditions. The registry does
not contain the primary papers that established modern post-training or
quantization-aware neural-network practice, so this page does not assign their
priority or dates.

## Sources

- Lloyd supports scalar quantization, squared-error distortion, nearest-neighbor
  cells, centroid reconstructions, and the historical qualification attached to
  that work.
- llama.cpp supports the existence and practical role of block-quantized model
  formats and matching inference implementations.
- Goodfellow, Bengio, and Courville support surrounding numerical, optimization,
  and model-capacity cautions, not the missing modern quantization benchmarks.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) for expected distortion and
[Matrix Theory](./matrix-theory.md) for the operators being approximated.
[Edge Inference](./edge-inference.md) connects bits to bandwidth and memory.
Continue to pruning and distillation for compression methods that remove
parameters or transfer behavior instead of lowering numerical precision.
