---
concept_id: concept.ml_engineering.jax
title: JAX
slug: /concepts/jax
kind: tool
tier: 1
review_state: generated-draft
summary: A Python library whose central idea is composable function transformations — differentiation, vectorisation, parallelisation and just-in-time compilation — applied to pure functions written against a NumPy-like array API and compiled to CPU, GPU or TPU by XLA.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: requires
    target: concept.paradigms.functional_programming
    note: Every JAX transformation is sound only on a referentially transparent function, so a reader who does not already have the idea of a pure function cannot make sense of why a stray global or a print statement silently produces the wrong program.
  - type: implements
    target: concept.paradigms.array_programming
    note: jax.numpy reproduces NumPy's whole-array interface almost operation for operation, and that array surface is precisely what the transformations rewrite — there is no scalar-loop dialect underneath for them to work on.
  - type: contrasts_with
    target: concept.ml_engineering.pytorch
    note: PyTorch records a tape over mutable tensors as an eager program runs, whereas JAX traces a pure function to an intermediate representation before anything executes, which is why one framework tolerates in-place updates and Python control flow and the other does not.
  - type: contributes_to
    target: concept.ml_engineering.training_infrastructure
    note: Large-model training in JAX is expressed by annotating arrays with shardings over a device mesh and letting the compiler partition the program, which is a different division of labour between researcher and infrastructure than manual data and pipeline parallelism.
sources:
  - source_id: source.jax.documentation
    title: JAX documentation
    url: https://jax.readthedocs.io/en/latest/
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
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
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.triton.documentation
    title: Triton documentation
    url: https://triton-lang.org/main/index.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: The JAX design paper (Frostig, Johnson and Leary, SysML 2018) and the Autograd library it descends from
    reason: The registry has no entry for either the JAX design paper or Autograd, so the attribution of the tracing design and the naming of its authors in the history section rests on general knowledge and should be checked against the paper before this page leaves generated-draft.
    sections:
      - history-and-attribution
  - label: XLA itself — its HLO representation, fusion and layout assignment, and the SPMD partitioner
    reason: No registered source documents the compiler JAX lowers to; the JAX documentation describes what jit does from the caller's side but not how HLO is optimised, so the claims here about fusion and partitioning are stated from general knowledge.
    sections:
      - formal-treatment
claims: []
---

## Definition

**JAX** is a Python library that takes a numerical function written in a
NumPy-like style and returns a new function derived from it. The derivations are
called _transformations_: `jax.grad` gives the gradient, `jax.jit` a compiled
version, `jax.vmap` the function mapped over a batch axis, `jax.pmap` the
function run in SPMD across devices. Because each takes a function and returns a
function they compose — `jit(vmap(grad(f)))` is one compiled, batched gradient —
and because each works by _tracing_, the function given to them has to behave
like a mathematical function rather than a procedure.

## Why it matters

The derived programs a researcher wants are usually not the ones the model code
expresses. A per-example gradient, needed for differentially private training or
influence functions, is not what a batched loss computes; nor is a Hessian, a
Jacobian of a simulator, or a Hessian-vector product for a second-order
optimiser. Each is a mechanical consequence of the forward model, and in most
frameworks each is a rewrite. In JAX each is one line applied to code you
already have — `jax.hessian(f)`, `jax.jvp(jax.grad(f), (x,), (v,))`.

The second thing it buys is that `jit` hands the whole traced function to XLA at
once, so the compiler sees a block of computation rather than one operation at a
time and can fuse it.

## Intuition

Treat a JAX function as a mathematical object and the transformations as
rewriting rules over it: $f \mapsto \nabla f$, $f \mapsto$ the map of $f$ over an
axis, $f \mapsto$ a compiled $f$. JAX reaches that object by running your Python
once on _tracer_ values that record the primitives applied to them instead of
computing anything. The record is a **jaxpr**, a small typed intermediate
representation, and each transformation is a rule per primitive.

The useful image is that you are writing a program that emits a program. It
breaks where beginners get caught: JAX never sees your Python, only the
primitives executed on the one trace it took. A Python `for` over a hundred
steps is not a loop in the jaxpr, it is a hundred copies; a Python `if` is
whichever side happened to be taken, frozen in.

## Concrete example

A small regression, differentiated and compiled, then differentiated per
example:

```python
import jax
import jax.numpy as jnp

def predict(w, b, x):
    return jnp.tanh(x @ w + b)

def loss(w, b, x, y):
    return jnp.mean((predict(w, b, x) - y) ** 2)

key = jax.random.key(0)
kw, kx = jax.random.split(key)
w = jax.random.normal(kw, (3, 1))
b = jnp.zeros((1,))
x = jax.random.normal(kx, (8, 3))
y = jnp.ones((8, 1))

grad_loss = jax.jit(jax.grad(loss, argnums=(0, 1)))
gw, gb = grad_loss(w, b, x, y)
print(gw.shape, gb.shape)          # (3, 1) (1,)

per_example = jax.vmap(jax.grad(loss), in_axes=(None, None, 0, 0))
print(per_example(w, b, x, y).shape)   # (8, 3, 1)
```

Three things in that snippet are the whole design. The key is an explicit
argument that had to be split before use. `grad` composed with `jit` without
either knowing about the other. And `vmap` produced eight separate gradients as
one wide computation, not a Python loop over eight calls.

## Formal treatment

Let $f : \mathbb{R}^n \to \mathbb{R}^m$ be differentiable at $x$, with Jacobian
$\partial f(x) \in \mathbb{R}^{m \times n}$. JAX exposes differentiation through
two primitives rather than through the Jacobian itself. The **Jacobian-vector
product** (forward mode) is

$$
\mathrm{jvp}(f, x, v) \;=\; \bigl(f(x),\; \partial f(x)\, v\bigr), \qquad v \in \mathbb{R}^{n},
$$

and the **vector-Jacobian product** (reverse mode) is

$$
\mathrm{vjp}(f, x, u) \;=\; \bigl(f(x),\; u^{\top} \partial f(x)\bigr), \qquad u \in \mathbb{R}^{m}.
$$

Each costs a small constant multiple of one evaluation of $f$; reverse mode
additionally stores the forward pass's intermediate values, trading memory for a
whole row of the Jacobian at once. For scalar output `jax.grad(f)(x)` is exactly
the vjp with $u = 1$. Full Jacobians are built by mapping over a basis —
`jacfwd` is `vmap` of jvp over the $n$ input basis vectors, `jacrev` is `vmap`
of vjp over the $m$ output ones — so `jacfwd` wins when $n \ll m$ and `jacrev`
when $m \ll n$, and `jax.hessian` is `jacfwd(jacrev(f))`.

`vmap` is not a loop: given $f$ it produces $\hat f$ with
$\hat f(X)_i = f(X_i)$ by rewriting each primitive into its batched form, so the
result is one set of wider operations.

`jit` traces at _abstract_ values — a `ShapedArray` carrying a shape and a dtype
and no data — lowers the jaxpr to XLA, and caches the executable keyed by input
shapes, dtypes, static argument values and the device. That abstraction is why
shapes must be known at trace time and values must not be.

Randomness is a pure function of an explicit key, under a counter-based Threefry
design in which `jax.random.split(key)` derives independent keys
deterministically, so a draw is reproducible and independent of evaluation
order.

## Assumptions and requirements

**Purity.** A transformed function must depend on its arguments alone and have
no observable side effects. Side effects run during tracing, once per cache
entry, so a `print` inside a jitted function prints when it compiles and never
again (`jax.debug.print` survives). Worse, a global read at trace time is baked
into the compiled program: change the global afterwards and nothing retraces, so
you keep computing with the old value.

**Immutability.** `x[0] = 1.0` on a `jax.numpy` array raises; `x.at[0].set(1.0)`
returns a new array, which inside `jit` the compiler usually turns into an
in-place update and outside `jit` is a copy.

**Explicit randomness.** There is no global seed, and reusing a key gives the
identical draw — two dropout masks meant to be independent and in fact equal is
the standard version of this bug.

**Static shapes and value-independent control flow.** Under `jit`, anything
branching on a traced value has to become `jax.lax.cond`, `jax.lax.while_loop`,
`jax.lax.scan` or a `jnp.where`; a plain Python `if x > 0` raises a
`ConcretizationTypeError`, because at trace time there is no value to compare.
Operations with data-dependent output shapes — boolean masking, `jnp.nonzero`,
`jnp.unique` — need a static size supplied. Ignore this and you get that error
under `jit`; outside `jit` the code runs eagerly and appears to work, which
hides the problem until the function is jitted — at which point the branch
taken, or the shape produced, on the one trace is baked into the compiled
program.

**64-bit is off by default.** Everything is float32 unless
`jax.config.update("jax_enable_x64", True)` is set before use — which matters
the moment JAX is used for scientific computing.

## Uses and applicability

Reach for JAX when derivative structure is part of the research object:
higher-order derivatives, implicit differentiation, neural ODEs, gradient-based
samplers such as Hamiltonian Monte Carlo, differentiable simulators, and
optimisation research that differentiates through the optimiser. It also suits
large-scale training on TPUs, where partitioning is expressed by sharding
annotations and the compiler does the rest.

It is the wrong tool for ragged workloads that cannot be padded into buckets,
for pipelines dominated by Python-side I/O and data-dependent branching, and for
projects that mainly load a pretrained model and serve it. JAX ships no neural
network layer library either; `Flax`, `Haiku`, `Equinox` and `Optax` are
separate packages.

## Limitations and common mistakes

Dispatch is asynchronous: an operation returns a future immediately, so timing
code without `.block_until_ready()` measures queueing rather than computation
and reports impossible speeds. The first call to a jitted function also includes
compilation, often seconds of it.

Compilation is the recurring operational cost. A Python loop that appends to an
array unrolls into the trace and can produce a jaxpr with thousands of nodes, so
XLA spends minutes on what `jax.lax.scan` expresses in one. Varying input shapes
recompile, and padding to a few bucket sizes is the usual fix.

Two differentiation traps are worth memorising. `jnp.where` evaluates both
branches, so `jax.grad(lambda x: jnp.where(x > 0, jnp.sqrt(x), 0.0))(0.0)` is
`nan` — the unused branch still contributes a `nan` cotangent, and the fix is to
make the argument safe before the call, not to guard the result. And
`jax.lax.while_loop` has a forward differentiation rule but no reverse one, so a
data-dependent trip count cannot be backpropagated through.

## Variants and alternatives

Inside JAX, `pjit` has been folded into `jit` with sharding annotations and
`shard_map` is the escape hatch for explicitly per-device code with collectives;
`pmap` is the older interface, largely superseded. `jax.checkpoint` (`remat`)
trades recomputation for activation memory, `custom_jvp` and `custom_vjp`
override a differentiation rule that is inaccurate or slow, and `Pallas` writes
tiled kernels when XLA's fusion is not enough, lowering to Triton on GPU.

Outside it, PyTorch is the direct competitor and the gap has narrowed from both
sides: `torch.compile` captures graphs from eager code and `torch.func` provides
`grad`, `vmap` and `jacrev` in a deliberately JAX-like style. PyTorch buys a
larger ecosystem and easier step-through debugging; JAX buys whole-function
compilation and transformations that compose without special cases. Triton or
CUDA buys kernel-level control no array compiler will give you, at the cost of
tuning it yourself.

## History and attribution

JAX was developed at Google and first released publicly in 2018. Its
differentiation machinery descends directly from **Autograd**, a library by
Dougal Maclaurin, David Duvenaud and Matthew Johnson that differentiated
ordinary NumPy code by tracing it; JAX kept the tracing design and added
compilation by targeting XLA, a compiler originally built for TensorFlow. The
approach is set out in a 2018 SysML paper by Roy Frostig, Matthew Johnson and
Chris Leary, "Compiling machine learning programs via high-level tracing". The
parallelism transformations came later and are the part of JAX most likely to
have moved since this page was written.

## Sources

The **JAX documentation** is the reference throughout; three of its pages are
load-bearing here — sharp bits for the purity, immutability and control-flow
constraints, the autodiff cookbook for jvp and vjp, and the PRNG design note.
**Deep Learning**, chapter 6.5, is the framework-independent background for
forward- versus reverse-mode accumulation. The **PyTorch documentation** is
cited only for the comparison, and the **Triton documentation** for the kernel
layer Pallas targets on GPU.

## Prerequisites and next connections

Read [Python](./python.md) and [Array Programming](./array-programming.md)
first — JAX's surface is NumPy's, and no transformation makes sense without
whole-array thinking. [Functional Programming](./functional-programming.md)
supplies the purity every transformation depends on, and
[Multivariable Calculus](./multivariable-calculus.md) the Jacobian that `grad`,
`jacfwd` and `jacrev` are three ways of touching.

From here, [GPU Kernels](./gpu-kernels.md) and [CUDA](./cuda.md) explain what
XLA is ultimately emitting, and [Tensors](./tensors.md) what the
multidimensional arrays being pushed around are and are not.
