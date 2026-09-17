---
concept_id: concept.ml_engineering.pytorch
title: PyTorch
slug: /concepts/pytorch
aliases:
  - torch.autograd
kind: tool
tier: 1
review_state: generated-draft
summary: A Python library for strided array computation on CPU and GPU whose defining feature is autograd — a tape of backward functions recorded by the operations that actually execute, so the gradient of anything you can write in Python comes back without being derived by hand.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: implements
    target: concept.deep_learning.backpropagation_through_convolution
    note: The gradients derived by hand for a convolution on that page are exactly what autograd produces automatically for a Conv2d module — same chain rule, applied by a recorded graph instead of by a person.
  - type: requires
    target: concept.languages.python
    note: PyTorch's user-facing surface is a Python library, and its define-by-run design means Python's own control flow and object model are part of how a model is specified.
  - type: specializes
    target: concept.paradigms.array_programming
    note: The tensor API is array programming — broadcasting, whole-array elementwise operations, reductions — extended with a device axis and a recorded derivative for every operation.
  - type: contrasts_with
    target: concept.ml_engineering.jax
    note: Both give reverse-mode autodiff over arrays, but PyTorch records a tape from executed stateful objects while JAX traces pure functions into a graph that is then transformed and compiled.
sources:
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.mlp
    title: Deep Learning, Chapter 6 — Deep Feedforward Networks
    url: https://www.deeplearningbook.org/contents/mlp.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.rumelhart1986.learning_representations
    title: Learning representations by back-propagating errors
    url: https://www.nature.com/articles/323533a0
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.jax.documentation
    title: JAX documentation
    url: https://jax.readthedocs.io/en/latest/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: The institutional history of the PyTorch library — the Lua Torch and Chainer lineage, release dates, and the move to the PyTorch Foundation
    reason: No registry source documents the library's own history; the PyTorch reference documentation describes the current API rather than how it came to be, and the 2019 systems paper describing the design is not in the registry.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**PyTorch** is an open-source library for numerical computation on strided,
typed, device-resident arrays, in which every differentiable operation executed
on a tensor marked `requires_grad=True` appends a node to a backward graph, so
that calling `.backward()` on a scalar output walks that graph in reverse and
accumulates a gradient into the `.grad` field of every leaf tensor that
contributed. The graph is built by the operations that actually run — this is
**define-by-run** — so it is a property of one particular execution, not of the
source code, and it is discarded once it has been traversed.

## Why it matters

Before autodiff libraries, adding a layer meant deriving its gradient on paper,
implementing the backward pass separately, and checking the two against finite
differences — the work the
[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
page does for a single operation, at a day of index manipulation per layer.
Autograd makes it disappear for any composition of primitives that already have
a registered derivative. The consequence is not convenience but throughput of
ideas: an architecture change becomes an edit to a forward function, and the
gradient follows.

## Intuition

Picture each operation leaving a receipt as it runs: I was a multiplication,
these were my inputs, and here is the rule converting a gradient at my output
into gradients at my inputs. `.backward()` reads the receipts in reverse order of
issue, handing each the gradient that arrived from downstream.

The analogy breaks in two places. The tape is not a recording of your Python: it
is a DAG of C++ backward-function objects holding references to the tensors they
need, so reassigning a Python variable afterwards changes nothing, while mutating
a tensor a receipt saved is an error rather than a silently wrong answer. And the
backward pass does not replay the forward pass — it evaluates a different set of
functions, which is why a model can be cheap forward and expensive backward.

## Concrete example

```python
import torch

x = torch.tensor([1.0, 2.0, 0.5], requires_grad=True)
w = torch.tensor([0.5, -1.0, 2.0], requires_grad=True)

z = (w * x).sum()      # z = 0.5 - 2.0 + 1.0 = -0.5
y = torch.tanh(z)      # y = tanh(-0.5) = -0.462117

print(y.grad_fn)       # TanhBackward0 — the node this tensor came from

y.backward()           # seeds dy/dy = 1 and walks the tape

print(x.grad)          # tensor([ 0.3932, -0.7864,  1.5729])
print(w.grad)          # tensor([ 0.7864,  1.5729,  0.3932])
```

By hand: $\partial y/\partial z = 1 - \tanh^2(-0.5) = 0.786448$, and
$\partial z/\partial x = w$, so `x.grad` is $0.786448 \cdot w$ and `w.grad` is
$0.786448 \cdot x$. Nothing more mysterious happened. Note that the constant
depends on where we are: at $z = 4.5$ the factor is $4.935 \times 10^{-4}$, and
the gradient through a saturated `tanh` all but vanishes.

Define-by-run means the graph can differ per call:

```python
def f(x):
    while x.abs().max() < 10:   # a Python loop, run for real
        x = x * 2
    return x.sum()
```

Called on $0.1$ this records seven multiplications; on $5.0$, one. The number of
nodes exists nowhere until the function runs.

## Formal treatment

Let $f = f_L \circ \cdots \circ f_1$ with $x_k = f_k(x_{k-1})$ and
$J_k = \partial f_k / \partial x_{k-1}$ evaluated at $x_{k-1}$. The chain rule
gives $J_f = J_L J_{L-1} \cdots J_1$. Reverse-mode differentiation never forms
these matrices. Given a seed row vector $v$, it evaluates

$$
v^\top J_f \;=\; \big(\cdots\big((v^\top J_L)\, J_{L-1}\big) \cdots\big) J_1 ,
$$

left to right, so each step is a **vector-Jacobian product**: a map
$\bar{x}_k \mapsto \bar{x}_{k-1}$ that a primitive implements directly. Forward
mode associates the other way and computes $J_f u$, one column at a time.

For a scalar loss $\ell : \mathbb{R}^n \to \mathbb{R}$ the seed is $v = 1$ and one
reverse sweep yields the whole gradient $\nabla \ell$, at a small constant times
the cost of the forward evaluation regardless of $n$ — which is why reverse mode
is the right choice when $n$ is the parameter count. The price is memory: every
intermediate a backward formula needs stays alive from its forward use until the
reverse sweep reaches it.

`tensor.backward()` requires a scalar; otherwise the seed is supplied as
`tensor.backward(v)`, computing $v^\top J$. Accumulation is documented semantics:
`.grad` receives `+=`, not `=`. That is what makes gradient accumulation over
microbatches work, and why training loops call `optimizer.zero_grad()`.

## Assumptions and requirements

Autograd differentiates compositions of primitives that have registered backward
formulas. It assumes:

- **Registered derivatives.** A custom operation written in C++ or Triton is
  opaque until you supply a backward, via `torch.autograd.Function` or by
  registering an autograd formula for a custom op.
- **Floating-point or complex dtypes.** `requires_grad` is rejected on integer
  and boolean tensors. For complex tensors autograd returns the conjugate
  Wirtinger derivative — the convention that makes gradient descent on a
  real-valued loss work, not the complex derivative.
- **Differentiability is not checked.** At kinks the library returns a
  convention, not a theorem: `relu` and `abs` both get $0$ at the origin.
  Optimisation tolerates this; a proof about your objective does not follow.
- **Saved tensors are not mutated.** Every tensor carries a version counter, and
  an in-place op on something a backward node saved raises a `RuntimeError` at
  backward time rather than returning a wrong gradient.
- **The graph is single-use.** It is freed after `.backward()` unless
  `retain_graph=True`.

Drop any of these and the failure is loud — except the kink convention, which is
silent by design.

## Uses and applicability

Reach for PyTorch when the model is still changing: eager execution means a
debugger, a print statement and a stack trace all work, and a shape bug surfaces
on the line that caused it. Also when you need a hand-written backward for a
fused kernel, when the ecosystem matters, or when data-dependent control flow is
intrinsic to the model.

Reach elsewhere when you want pure-function transforms and whole-program
compilation by default (JAX), when the deployment runtime must be small
(ExecuTorch, ONNX), or when the problem is classical numerics on CPU, where NumPy
and SciPy are simpler and no gradient is wanted.

## Limitations and common mistakes

**Eager is the default, not the only mode.** Since PyTorch 2.0, `torch.compile`
captures Python bytecode into a graph, differentiates it ahead of time, and
generates fused kernels. It is not transparent: unsupported Python causes a
_graph break_ and a fallback to eager for that region, compiled code is
specialised on shapes and dtypes behind guards that force recompilation when they
fail, and fusion reorders reductions, so results are close but not bitwise
identical to eager. A graph break in the hot loop can erase the gain.

**`.grad` accumulates.** Omitting `optimizer.zero_grad()` sums gradients across
steps and produces a silent, wrong training run.

**`.grad` is populated only on leaves.** An intermediate's gradient is computed
and discarded unless you call `retain_grad()` or use `torch.autograd.grad`.

**Keeping a tensor alive keeps its whole graph alive.** `running += loss` in a
loop retains every step's activations; `running += loss.item()` does not. This is
the commonest out-of-memory report that is not really about model size.

**Autograd is neither symbolic nor numerical differentiation.** It manipulates no
expressions and takes no finite differences; it evaluates exact derivative rules
at a point, in floating point.

**A PyTorch tensor is not a tensor in the multilinear sense.** It is a strided
buffer with a shape; see [Tensors](./tensors.md).

## Variants and alternatives

Inside PyTorch, `torch.func` provides JAX-style transforms — `grad`, `vmap`,
`jacrev`, `jvp` — including genuine forward-mode AD, cheaper when the input
dimension is small. `torch.export` and AOTInductor produce ahead-of-time
artefacts for deployment. TorchScript was the earlier capture mechanism and is
now legacy.

Outside it, JAX takes the opposite default: functions must be pure, tracing
replaces recording, and `jit`, `grad` and `vmap` compose as transformations —
buying whole-program compilation at the cost of mutating state or branching on
traced values. TensorFlow began at the other end, with graphs declared before
execution, and added eager mode later. Julia's Zygote does source-to-source AD
on Julia IR at compile time, while Enzyme — an LLVM compiler plugin reached from
C++, Rust and Fortran as readily as from Julia — differentiates optimized LLVM
IR; both transform code at compile time rather than recording at run time. Below
all of them sit the alternatives to reverse mode itself: forward mode, cheap in
memory and expensive in passes; finite differences, trivial and inaccurate; and
symbolic differentiation, exact but prone to expression swell.

## History and attribution

The mathematics is older than the libraries. Reverse-mode accumulation was known
in the automatic differentiation literature before it reached neural networks;
the 1986 paper of Rumelhart, Hinton and Williams established backpropagation as
the way to train multilayer networks — the chain rule applied backwards through a
composition, which is what autograd automates.

PyTorch itself descends from the Lua-based Torch library and was released
publicly in 2017 by a team at Facebook AI Research. Its define-by-run design was
not invented there: Chainer had introduced and named the approach, and a NumPy
autograd package had demonstrated tape-based differentiation of ordinary Python.
PyTorch's contribution was a fast C++ core under that interface, and the
engineering to make it competitive with graph-first frameworks. `torch.compile`
arrived with PyTorch 2.0 in 2023, adding compilation without giving up eager
semantics. These dates come from general knowledge rather than a registry source,
and are flagged as unresolved.

## Sources

The **PyTorch documentation** is the authority for what the library does:
autograd mechanics, accumulation semantics, the in-place version counter,
complex-valued conventions, and `torch.compile`. **Deep Learning, Chapter 6**
covers computational graphs, the general backpropagation algorithm, and the cost
argument for reverse mode. **Learning representations by back-propagating
errors** is the 1986 source for backpropagation itself. The **JAX documentation**
states its own purity and transformation model, and is cited only for that
contrast.

## Prerequisites and next connections

Read [Python](./python.md) first, since define-by-run leans on Python's own
control flow. [Array Programming](./array-programming.md) explains the
broadcasting the tensor API assumes, and [Tensors](./tensors.md) clears up what
the word means here.

Next, [Backpropagation Through Convolution](./backpropagation-through-convolution.md)
derives by hand what autograd does mechanically, and
[GPU Kernels](./gpu-kernels.md) explains what the compiled backend generates and
why fusion pays; [CUDA](./cuda.md) covers the hardware model underneath.
