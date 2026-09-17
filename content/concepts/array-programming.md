---
concept_id: concept.paradigms.array_programming
title: Array Programming
slug: /concepts/array-programming
aliases:
  - array-oriented programming
kind: concept
tier: 1
review_state: generated-draft
summary: A style of programming in which operations apply to whole arrays at once rather than to elements one at a time, moving the iteration out of the interpreter and into compiled kernels.
categories:
  - Programming/Languages/Paradigms
primary_category: Programming/Languages/Paradigms
relationships:
  - type: contrasts_with
    target: concept.paradigms.imperative_programming
    note: The explicit index-by-index loop is the imperative form of exactly the computation an array expression states in one line, and the two differ in who runs the loop rather than in what is computed.
  - type: useful_when
    target: concept.languages.python
    note: Python's per-element dispatch cost is large enough that array expressions are the standard way to make numerical code fast without leaving the language.
  - type: contrasts_with
    target: concept.linear_algebra.tensors
    note: An n-dimensional array is a rectangular block of numbers with a shape and strides, not a multilinear map, so the word "tensor" in array libraries means much less than it does in tensor algebra.
  - type: contrasts_with
    target: concept.algorithms.complexity_analysis
    note: Vectorisation changes the constant factor and leaves the asymptotics untouched, so the benefit that motivates the whole style is invisible to complexity analysis.
sources:
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.julia.documentation
    title: The Julia Language documentation
    url: https://docs.julialang.org/en/v1/
    source_kind: reference-documentation
    supports:
      - why-it-matters
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathworks.matlab
    title: MATLAB documentation
    url: https://www.mathworks.com/help/matlab/
    source_kind: reference-documentation
    supports:
      - definition
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.intel.software_developer_manual
    title: Intel 64 and IA-32 Architectures Software Developer Manuals
    url: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: APL and Kenneth Iverson's notation (A Programming Language, 1962; the APL implementations at IBM)
    reason: The registry contains no source on APL, Iverson, or the array-language family, so the lineage described in the history section is stated from general knowledge and should be checked against a primary source before this page leaves generated-draft.
    sections:
      - history-and-attribution
      - variants-and-alternatives
  - label: NumPy reference documentation (broadcasting rules, ufuncs, strides, views and copies)
    reason: No NumPy source is registered, so the worked example and the strided-array account of broadcasting are written from the library's documented behaviour without a citable entry; the PyTorch broadcasting semantics page states the same rule and is cited in its place.
    sections:
      - concrete-example
      - formal-treatment
claims: []
---

## Definition

**Array programming** is the style in which the unit of computation is a whole
array — a rectangular, homogeneously typed block of values — and operators apply
to arrays wholesale, producing arrays. `c = a + b` for two length-$10^6$ arrays
is one expression, not a loop; the loop still runs, inside a compiled kernel the
user never writes. Some languages make it the default (APL, MATLAB, R, J); some
libraries graft it onto a host that has none (NumPy, JAX).
**Vectorisation** is rewriting an element-by-element loop as such an expression;
**broadcasting** is the rule that makes operands of different shapes conformable
without copying.

## Why it matters

The immediate payoff is speed in a dynamically typed language. Each iteration of
a Python-level loop does interpreter bookkeeping — bytecode dispatch, reference
counting, unboxing a `float` — that dwarfs the machine multiply it performs. A
compiled kernel amortises all of it over the whole array, typically for one to
two orders of magnitude, as a constant factor rather than an algorithmic
improvement.

The other payoffs outlive that one. Julia's documentation makes the point that
even where hand-written loops are fast, `y .= 2 .* x .+ 1` is worth writing
because it says what is computed rather than how it is traversed. And whole-array
primitives are the granularity at which work can be dispatched: `matmul` on two
arrays is a request a library can route to BLAS, a SIMD unit or a GPU; a triple
loop is not.

## Intuition

Think of an array as a spreadsheet column rather than a list you walk. "Add 15%
to every price" is one instruction; the spreadsheet decides how to visit the
cells. You give up traversal order and gain a runtime free to walk contiguous
memory, use vector registers, or split the work across cores.

The analogy breaks twice. A spreadsheet recomputes lazily; an array expression is
eager and materialises every intermediate, so `x * 2.0 + 1.0` writes the whole
array twice. And a spreadsheet will not silently reinterpret a column as a
matrix. Broadcasting will.

## Concrete example

The same arithmetic, written twice:

```python
import numpy as np

x = np.random.default_rng(0).standard_normal(1_000_000)

# element by element: one interpreter iteration per element
y = np.empty_like(x)
for i in range(x.size):
    y[i] = x[i] * 2.0 + 1.0

# whole array: two kernel calls, each a C loop over contiguous memory
y = x * 2.0 + 1.0
```

Both forms perform $10^6$ multiplications and $10^6$ additions, and both are
$\Theta(n)$; only the per-element overhead changed. On CPython the second is
usually one to two orders of magnitude faster — measure rather than trust a
number, since the ratio depends on the interpreter, the dtype and the memory
bandwidth.

Now the failure mode, where prediction and target shapes disagree:

```python
y_true = np.array([1.0, 2.0, 3.0])          # shape (3,)
y_pred = np.array([[1.1], [1.9], [3.2]])    # shape (3, 1)

(y_pred - y_true).shape         # (3, 3)  -- not (3,)
np.mean((y_pred - y_true) ** 2) # 1.42     -- the intended answer is 0.02
```

No error is raised: broadcasting aligns the trailing axes, stretches the `1` of
`(3, 1)` against the `3` of `(3,)`, and returns all nine pairwise differences.
The loss comes out seventy times too large and still looks plausible.

## Formal treatment

An array is a shape $(n_1, \dots, n_d)$ with a buffer and a stride vector
$(s_1, \dots, s_d)$, the element at index $(i_1, \dots, i_d)$ sitting at buffer
offset

$$
\text{offset} \;=\; \sum_{k=1}^{d} i_k s_k .
$$

**Broadcasting rule.** Given shapes $A = (a_1, \dots, a_p)$ and
$B = (b_1, \dots, b_q)$, let $r = \max(p, q)$ and left-pad the shorter shape with
$1$s to length $r$, so the shapes are compared from the trailing axis backwards.
Axis $k$ is compatible when $a_k = b_k$, or $a_k = 1$, or $b_k = 1$; if any axis
fails, the operation is an error. Otherwise the result shape is
$c_k = \max(a_k, b_k)$. NumPy, PyTorch and JAX share this rule, and it is the
commonest source of silent shape bugs, because "compatible" is far weaker than
"what was meant".

The expansion costs no memory: an axis of extent $1$ stretched to extent $n$ is
realised by setting its stride to $0$, so $n$ reads hit one address, and an
explicitly broadcast result is exposed read-only.

For an elementwise kernel over $n$ elements a serviceable cost model is

$$
T(n) \;\approx\; C_{\text{call}} + n \cdot c ,
$$

with $C_{\text{call}}$ the fixed cost of entering the kernel and $c$ the
per-element cost inside it. Vectorising shrinks $c$ and adds $C_{\text{call}}$;
for small $n$ the loop wins.

## Assumptions and requirements

**Homogeneous element type and rectangular shape.** Ragged data has no shape, and
an array of Python objects runs at interpreter speed per element — the benefit
lost, the syntax retained.

**A dense strided layout.** The packed SIMD instructions documented in the Intel
manuals operate on several adjacent same-width values in one vector register,
which presumes contiguity and uniform width; a transposed or heavily strided view
often forces a copy first.

**Data-independent control flow.** Per-element branching must be recast as
arithmetic on masks, which evaluates both sides and discards one. A recurrence
$y_t = f(y_{t-1}, x_t)$ does not vectorise unless $f$ is associative, in which
case a scan primitive applies.

**Room for intermediates.** Every subexpression allocates, so a computation that
runs in constant extra space as a loop may need several full copies.

## Uses and applicability

Reach for it in numerical linear algebra, signal and image processing, statistics
over columns, Monte Carlo simulation and neural networks — the programming model
of MATLAB, PyTorch and JAX is shaped-buffer expressions throughout. It is the
right default when the data is rectangular, the arithmetic uniform, the arrays
large.

Avoid it when arrays are small, where dispatch cost exceeds the computation, and
for irregular structures — trees, graphs, variable-length sequences — except
through padding, which wastes work in proportion to the ragged. And never use it
to rescue a bad algorithm: a vectorised $O(n^2)$ nearest-neighbour search loses
at scale to an $O(n \log n)$ spatial index written as a loop.

## Limitations and common mistakes

The dominant mistake is the one above: **broadcasting succeeds where it should
have failed**. An `(m,)` meeting an `(m, 1)` yields an $m \times m$ matrix and no
warning. Asserting shapes at function boundaries prevents it; named axes prevent
it structurally.

The second is believing that vectorising **reduces work**. It changes who runs
the loop and what each iteration costs, never the asymptotics; a profiler reading
"8x faster" is reporting constants.

The third is **memory blow-up**. All pairwise differences of $n$ points in $d$
dimensions, formed as $(n, 1, d)$ against $(1, n, d)$, allocate $n^2 d$ floats:
at $n = 10^5$, $d = 3$ that is over 200 GB, where the loop needs almost nothing.

The fourth is confusing **views with copies**: a slice is usually a view, so
writing to it mutates the parent, and the destination of an in-place operator may
not be reshaped by broadcasting — `a += b` fails where `a = a + b` would silently
have grown the result.

Finally, "vectorised" names two things: whole-array expressions, and a compiler
emitting SIMD instructions from a scalar loop. They often coincide, but an array
expression can be entirely non-SIMD and a C loop fully SIMD.

## Variants and alternatives

**J** (and Sharp APL before it, later Dyalog APL) is rank-polymorphic: a verb
declares the rank of cell it consumes and is mapped over the remaining axes —
more general and more explicit than trailing-axis broadcasting. Earlier APL and
the K/Q line instead extend scalar functions over nested structure, without an
explicit rank declaration. **MATLAB** calls the
same rule _implicit expansion_, having previously required an explicit expansion
function. **R** recycles the shorter vector along the flat length of the longer,
warning when the lengths are not multiples: a different rule catching a different
set of bugs.

**Julia** takes the other route — dot syntax marks an operation elementwise and
the compiler fuses a chain of dotted operations into one loop with no
temporaries, removing the memory traffic that makes eager array expressions
slower than a hand-written loop. **JAX and PyTorch** offer `vmap`, adding a batch
axis to a function written for one example instead of asking the author to
broadcast by hand. **Named axes** align by name rather than position, killing the
trailing-axis bug class at the cost of verbosity. A loop in C, Rust or Fortran
still buys full control of layout and fusion, at the price of interactivity.

## History and attribution

Kenneth Iverson devised the notation in the late 1950s to describe algorithms on
paper, published it as _A Programming Language_ in 1962, and it was implemented
at IBM in the mid-1960s as APL; he received the Turing Award in 1979.
Array-at-a-time semantics were a notational choice first and a performance
technique only later. Fortran 90 brought whole-array assignment into mainstream
numerical computing; MATLAB was written by Cleve Moler in the late 1970s to give
students interactive access to LINPACK and EISPACK without writing Fortran; and
Bell Labs' S, later reimplemented as R, did the same for statistics.

The Python lineage runs through Numeric in the mid-1990s and the competing
numarray, which Travis Oliphant unified into NumPy, released as 1.0 in 2006. The
deep learning frameworks inherited that lineage's broadcasting rule essentially
unchanged — which makes it a convention with a history rather than a mathematical
necessity. The rank system of J, and of the later APLs that adopted it, solves
the same problem differently.

## Sources

The PyTorch documentation states the broadcasting semantics, the view-versus-copy
distinction and the in-place restriction precisely. The Julia manual is the best
source for vectorisation as a workaround for interpreter overhead, and for
dot-syntax fusion as the alternative. The MATLAB documentation covers the array-first language model and
implicit expansion; the Intel manuals document the packed SIMD instructions that
the contiguity assumption exists to serve.

## Prerequisites and next connections

Little is needed first: how a loop works, and enough of
[Core Data Structures](./core-data-structures.md) to tell contiguous blocks from
linked ones — this paradigm lives on the contiguous side.
Read [Complexity Analysis](./complexity-analysis.md) alongside, because it is the
tool that cannot see what vectorisation buys.

Next, [Tensors](./tensors.md) explains what a tensor is in the sense these
libraries borrowed the word from, and how much of that meaning they dropped;
[Matrix Theory](./matrix-theory.md) supplies the operations they spend most of
their time executing; and [Convolutional Layer](./convolutional-layer.md) is
array programming with a particular stride pattern, discretising
[Convolution](./convolution.md).
