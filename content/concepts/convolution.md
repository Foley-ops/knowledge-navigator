---
concept_id: concept.analysis.convolution
title: Convolution
slug: /concepts/convolution
aliases:
  - convolution operator
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: An operation that combines two functions into a third by reflecting one, shifting it, and integrating or summing the overlap.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships: []
sources:
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-16
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.dumoulin2018.convolution_arithmetic
    title: A Guide to Convolution Arithmetic for Deep Learning
    url: https://arxiv.org/abs/1603.07285
    source_kind: preprint
    supports:
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-16
---

## Definition

Convolution takes two functions and produces a third that measures how much one
overlaps the other as it is reflected and slid across it. For real-valued
functions $f$ and $g$ of a real variable, the **continuous convolution** is

$$
(f * g)(t) \;=\; \int_{-\infty}^{\infty} f(\tau)\, g(t - \tau)\, d\tau .
$$

For sequences $f$ and $g$ indexed by the integers, the **discrete convolution**
is

$$
(f * g)[n] \;=\; \sum_{k=-\infty}^{\infty} f[k]\, g[n - k] .
$$

Throughout, $t$ is a continuous position, $n$ and $k$ are integer positions, and
$*$ denotes convolution. The argument $g(t - \tau)$ is the reason the operation
is often described as _folding_: as a function of $\tau$, the second factor is
reflected about the origin and then shifted by $t$.

## Why it matters

Convolution is the closed form of a linear, shift-invariant transformation.
Any system that is linear and behaves identically no matter when or where an
input arrives is completely described by its response to a single impulse, and
its output on any input is that impulse response convolved with the input. That
one fact is why the operation appears in signal processing, probability, partial
differential equations, and — through the
[Convolutional Layer](./convolutional-layer.md) — in modern vision models.

## Intuition

Picture the kernel $g$ printed on a transparent strip. Flip the strip
left-to-right, lay it over the signal $f$ at offset $t$, multiply the values that
line up, and add them. Slide to the next offset and repeat. Convolution is that
whole sweep: one number per offset, each summarising local agreement between the
signal and the reflected kernel.

The flip is the only thing separating convolution from
[Cross-Correlation](./cross-correlation.md), and it is exactly what buys
commutativity.

## Concrete example

Let $f = [1, 2, 3]$ at positions $0, 1, 2$ and $g = [1, -1]$ at positions
$0, 1$, with both zero elsewhere. Then

$$
(f * g)[n] = \sum_{k} f[k]\, g[n-k],
$$

giving $(f * g) = [1,\; 1,\; 1,\; -3]$ at positions $0$ through $3$. Full
convolution of sequences of length $M$ and $N$ has length $M + N - 1$; here
$3 + 2 - 1 = 4$. The kernel $[1, -1]$ is a first-difference detector, so the
interior values report where $f$ changes and the final $-3$ is the trailing edge
of the signal.

## Formal treatment

Write $\mathcal{F}$ for the Fourier transform. Convolution is bilinear,
commutative, associative, and distributes over addition:

$$
f * g = g * f, \qquad (f * g) * h = f * (g * h), \qquad f * (g + h) = f * g + f * h .
$$

It commutes with translation: if $(T_s f)(t) = f(t - s)$, then
$T_s(f * g) = (T_s f) * g$. This is the property that
[Translation Equivariance](./translation-equivariance.md) generalises.

The **convolution theorem** states that, under conditions that make both sides
well defined,

$$
\mathcal{F}\{f * g\} = \mathcal{F}\{f\} \cdot \mathcal{F}\{g\},
$$

so convolution in one domain is pointwise multiplication in the other. This
turns an $O(MN)$ direct computation into an $O(N \log N)$ transform-based one for
long sequences.

## Assumptions and requirements

The continuous integral requires conditions under which it converges; a
sufficient classical condition is $f, g \in L^1(\mathbb{R})$, in which case
$f * g \in L^1$ and $\lVert f * g \rVert_1 \le \lVert f \rVert_1 \lVert g \rVert_1$.
Discrete convolution of finitely supported sequences always converges because the
sum has finitely many non-zero terms.

Commutativity and the convolution theorem assume the reflected form above. They
do not hold for the unreflected sliding product. Finite data additionally
requires a boundary convention — zero padding, reflection, or truncation to the
valid region — and the convention changes the result near the edges.

## Uses and applicability

Convolution is the right tool when a system applies the _same_ local rule
everywhere: filtering and smoothing in signal and image processing; the density
of a sum of independent random variables, which is the convolution of their
densities; solutions of linear differential equations against a Green's
function; and feature extraction in deep networks, where a small learned kernel
is applied at every position. In that last setting the kernel's spatial extent
sets the layer's [Receptive Field](./receptive-field.md).

## Limitations and common mistakes

Three mistakes recur. First, the reflection is quietly dropped: most deep
learning libraries compute cross-correlation and call it convolution. Because
the kernel is learned, the two give equivalent models, but the naming breaks
every identity that depends on the flip, and it matters when deriving
[Backpropagation Through Convolution](./backpropagation-through-convolution.md).
Second, boundary handling is treated as an implementation detail; padding choice
visibly changes outputs at the edges and changes output length. Third, the direct
$O(MN)$ form is used where a transform-based or blocked algorithm is needed.

Convolution is also _linear_. It cannot, by itself, express a non-linear
relationship, which is why networks interleave it with non-linearities.

## Variants and alternatives

**Cross-correlation** omits the reflection. **Circular convolution** treats the
index as periodic and is what the discrete Fourier transform computes directly.
**Strided** and **dilated** forms subsample positions or spread the kernel's taps
to cover a wider extent at the same parameter count. **Transposed convolution**
(sometimes misnamed _deconvolution_) is the gradient of a strided convolution
with respect to its input, used to increase spatial resolution — it is not an
inverse. Separable kernels factor a $k \times k$ convolution into two
one-dimensional passes at $O(2k)$ instead of $O(k^2)$ multiplications per
position.

## History and attribution

Integrals of convolution form appear in eighteenth- and nineteenth-century work
on differential equations and probability, and the German term _Faltung_
("folding") was in use before the English word _convolution_ settled into place
in the twentieth century. Treat the precise attribution here as **unverified**:
none of the sources cited on this page is a history of mathematics, and this
paragraph should not be relied on for priority claims until a primary historical
source is checked.

## Sources

- **MIT 6.003 Signals and Systems** — the definition, the linear shift-invariant
  characterisation, and the convergence and boundary conditions.
- **Deep Learning, Chapter 9** — why the operation matters for neural networks,
  its applicability, and the library naming issue.
- **A Guide to Convolution Arithmetic for Deep Learning** — worked output-size
  arithmetic and the strided, dilated and transposed variants.

## Prerequisites and next connections

This page assumes only integration and summation notation; it has no
prerequisites inside this knowledge base.

Read [Cross-Correlation](./cross-correlation.md) next to see exactly what the
reflection buys and why libraries drop it, then
[Translation Equivariance](./translation-equivariance.md) for the structural
property that makes convolution the natural choice for images. From there,
[Convolutional Layer](./convolutional-layer.md) turns the operation into a
learnable layer.
