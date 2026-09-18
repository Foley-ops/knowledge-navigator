---
concept_id: concept.deep_learning.pruning
title: Pruning
slug: /concepts/pruning
aliases:
  - network pruning
kind: method
tier: 1
review_state: generated-draft
summary: Pruning removes selected parameters or structures from a trained or training model, creating sparsity or a smaller dense computation that must be evaluated and often fine-tuned.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: contributes_to
    target: concept.ml_engineering.edge_inference
    note: Structured removal can reduce stored weights and executable work when the target runtime supports the resulting representation.
  - type: contributes_to
    target: concept.ml_engineering.deployment
    note: A pruned artifact may reduce serving memory or latency, but only after it is encoded and benchmarked on the deployment stack.
  - type: contrasts_with
    target: concept.deep_learning.regularization
    note: Sparsity penalties can encourage pruning, but removal for compression and regularization for generalization are distinct goals.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.ggml.llama_cpp
    title: llama.cpp
    url: https://github.com/ggml-org/llama.cpp
    source_kind: implementation
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary neural-network pruning and sparsity literature
    reason: The registry contains no pruning-specific paper or survey, so the pruning definitions, criteria, fine-tuning procedure, accuracy comparisons, and chronology in this generated draft are not verified against a primary source.
    sections:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
  - label: Hardware support for structured and unstructured sparse neural-network inference
    reason: The registry does not document sparse accelerator formats or kernels, so runtime effects must be measured and are not quantified here.
    sections:
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Pruning** removes selected weights, units, channels, heads, blocks, or other
structures from a model. A binary mask $m$ applied to parameters $w$ produces
effective parameters

$$
\widetilde w=m\odot w,
\qquad m_j\in\{0,1\}.
$$

Unstructured pruning chooses individual entries. Structured pruning removes
whole groups that can yield smaller dense tensors. The mask may be selected once
after training, updated gradually during training, or followed by fine-tuning.
The registry has no pruning-specific source, so this technical description is a
generated working account and is explicitly unresolved rather than source-
verified.

## Why it matters

Large models store and multiply many parameters. If some can be removed without
unacceptable task degradation, the result may need less storage and, when the
runtime supports the structure, less computation. Pruning also provides an
experimental way to ask how much of a trained parameterization is essential for
its observed behavior.

Parameter count, file size, arithmetic count, and latency are different
quantities. Zeroing half the entries in a dense tensor does not make a dense
matrix kernel skip them. The compression objective must therefore name the
resource being optimized and the target hardware on which it is measured.

## Intuition

Think of a trained network as an overgrown decision mechanism. Pruning cuts
connections judged less important and then allows the remaining system to adapt.
Magnitude is a simple importance proxy: a small weight often changes its current
linear output less when set to zero than a large weight does.

The gardening analogy breaks because weights interact. Two individually small
terms may be jointly important, and scaling one layer up while scaling the next
down can preserve the same function while changing how magnitudes compare across
layers, so a single global threshold removes a different set of weights even
though each layer's internal ranking is unchanged.
Importance is conditional on data, parameterization, and the possibility of
fine-tuning.

## Concrete example

Consider

$$
W=
\begin{bmatrix}
0.8 & -0.1 & 0\\
0.3 & -0.25 & 0.02
\end{bmatrix},
\qquad
x=
\begin{bmatrix}
1\\2\\3
\end{bmatrix}.
$$

The original output is $(0.6,-0.14)$. Prune entries with magnitude strictly
below $0.25$, leaving

$$
\widetilde W=
\begin{bmatrix}
0.8 & 0 & 0\\
0.3 & -0.25 & 0
\end{bmatrix}.
$$

Three of six stored positions are now zero and the output becomes $(0.8,-0.2)$.
The output error is visible immediately. Whether it is acceptable depends on
downstream loss over representative data, not on sparsity alone. If the matrix
is still stored and multiplied densely, runtime and dense memory allocation may
remain unchanged despite the zeros.

## Formal treatment

One abstract pruning problem is

$$
\min_{m\in\{0,1\}^{p}}
L(m\odot w)
\quad\text{subject to}\quad
\|m\|_0\leq k,
$$

where $L$ is an evaluation or fine-tuning loss and $k$ is the number of retained
parameters. Searching all masks is combinatorial, so practical criteria use
proxies such as magnitude, gradients, activation statistics, or group scores.
This catalogue is not verified against a registered pruning source.

After choosing $m$, fine-tuning may solve

$$
\min_{w}L(m\odot w)
$$

with masked entries held at zero. Iterative procedures alternate removal and
fine-tuning. Structured masks constrain groups rather than scalars, potentially
turning a layer with fewer channels into a genuinely smaller dense operator.

## Assumptions and requirements

Pruning assumes a score and calibration or training data that reflect the
deployment task. Fine-tuning assumes access to data, labels or another objective,
and adequate compute. The retained architecture must remain shape-consistent,
especially across residual additions and grouped operations.

Unstructured sparsity yields a compute benefit only with a storage format and
kernels that exploit the sparsity pattern; structured removal instead produces a
genuinely smaller dense operator that ordinary kernels execute. The registered llama.cpp implementation documents practical
quantized inference formats, not a general sparse-kernel guarantee; it is cited
only as evidence that runtime representation matters. Sparse performance claims
remain unresolved until tested on the actual stack.

## Uses and applicability

Use pruning when a trained model exceeds a clear storage or compute budget and
when its target runtime can exploit a supported structured or sparse form. It is
also useful as an ablation tool when the question is which components can be
removed while preserving a measured behavior.

Do not use nominal sparsity as a proxy for speed. If hardware executes dense
operators efficiently, reducing layer width or training a smaller architecture
may be more reliable. When no fine-tuning data are available, one-shot removal
may impose an unacceptable accuracy cost that must be measured rather than
assumed small.

## Limitations and common mistakes

The main limitation is evidence: this registry has no pruning-specific primary
source, so comparative statements about criteria, recoverable sparsity, or
historical milestones would be unsupported. Even with evidence, results depend
strongly on architecture, task, sparsity pattern, and retraining budget.

Common mistakes include reporting percent zeros without file size or latency,
counting parameters that a serialization format still stores, allowing masked
weights to regrow accidentally, choosing a threshold globally across layers with
incomparable scales, evaluating on the calibration data, and pruning a branch
whose output shape is required elsewhere. Another is describing fine-tuned
accuracy as the effect of pruning alone while omitting the extra optimization.

## Variants and alternatives

Unstructured pruning acts on individual weights; structured pruning removes
groups such as channels or blocks. One-shot pruning selects a mask once, while
iterative pruning interleaves removal and recovery. Static masks stay fixed;
dynamic sparse training changes connectivity. These names are included as a
working taxonomy, not as source-verified comparisons.

Quantization reduces bits per retained value. Distillation trains another model
to imitate a teacher. Low-rank factorization changes dense operators into
products of smaller ones, but the registry does not contain a compression source
for that method. A deliberately smaller architecture is the clearest alternative
when supported dense execution matters more than preserving a particular model.

## History and attribution

Network pruning has a research history preceding current large models, but the
registry contains no primary pruning paper or survey capable of supporting
dates, named milestones, or priority. This draft therefore records the gap and
makes no historical attribution. A human source expansion should resolve this
section before the page advances beyond generated-draft.

## Sources

- Goodfellow, Bengio, and Courville support the surrounding regularization,
  sparsity, optimization, and generalization context, but are not cited here as
  a pruning chronology or hardware benchmark.
- llama.cpp supports the narrower implementation lesson that compression only
  becomes usable through concrete formats and kernels; it does not support the
  pruning taxonomy or comparative claims.

## Prerequisites and next connections

Read [Regularization](./regularization.md) to distinguish a training-time
inductive bias from a compression target, and [Deployment](./deployment.md) plus
[Edge Inference](./edge-inference.md) to define the resource budget. Distillation
and quantization are adjacent compression choices that change the model in
different ways.
