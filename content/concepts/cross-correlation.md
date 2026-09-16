---
concept_id: concept.analysis.cross_correlation
title: Cross-Correlation
slug: /concepts/cross-correlation
aliases:
  - cross correlation
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: A sliding inner product between two functions that measures their similarity at each displacement, differing from convolution only by the absence of a reflection.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.convolution
    note: Cross-correlation is defined by contrast with convolution and shares its algebra apart from the reflection.
  - type: contrasts_with
    target: concept.analysis.convolution
    condition: The two coincide exactly when the kernel is symmetric about the origin.
    note: Convolution reflects one argument before sliding; cross-correlation does not, so cross-correlation is not commutative.
sources:
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
    checked_on: 2026-09-16
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.pytorch.conv2d
    title: torch.nn.Conv2d — PyTorch Documentation
    url: https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
---

## Definition

Cross-correlation slides one function across another without reflecting it and
reports the overlap at each displacement. For real-valued functions,

$$
(f \star g)(t) \;=\; \int_{-\infty}^{\infty} f(\tau)\, g(t + \tau)\, d\tau ,
$$

and for sequences,

$$
(f \star g)[n] \;=\; \sum_{k=-\infty}^{\infty} f[k]\, g[n + k] .
$$

Here $\star$ denotes cross-correlation and $*$ denotes
[Convolution](./convolution.md). The single difference is the sign inside the
second argument: $g(t - \tau)$ for convolution, $g(t + \tau)$ for
cross-correlation. Equivalently, $f \star g = f * \tilde{g}$ where
$\tilde{g}(t) = g(-t)$ is the reflection of $g$.

For complex-valued functions the first argument is conjugated,
$(f \star g)(t) = \int \overline{f(\tau)}\, g(t + \tau)\, d\tau$, so that
$(f \star f)(0)$ is the energy of $f$.

## Why it matters

Cross-correlation is the operation a matched filter performs: it answers "where
does this template best fit this signal?" It is also, despite the name on the
function, the operation that essentially every deep learning library actually
executes inside a convolution layer. Understanding that the two differ only by a
reflection is what lets a reader move between a signal-processing text and a
deep learning codebase without deriving the wrong gradient.

## Intuition

Take the template, lay it directly over the signal — no flipping — multiply
aligned values and sum. Large output means the signal locally looks like the
template; a large negative output means it looks like the template inverted.
Convolution does the same sweep after flipping the template, which is why
convolution is commutative and cross-correlation is not: swapping the arguments
of $\star$ reflects the displacement axis.

## Concrete example

Take the signal $f = [1, 2, 3]$ and template $g = [1, -1]$ from the convolution
example. Cross-correlating gives $(f \star g) = [-1,\,-1,\,-1,\, 3]$ over the
same displacement range for which convolution gave $[1,\, 1,\, 1,\, -3]$: the
same numbers with the sign flipped and the order reversed, exactly as reflecting
the antisymmetric kernel $[1,-1]$ predicts.

Now take the symmetric kernel $g = [1, 1]$. Convolution and cross-correlation
both give $[1,\, 3,\, 5,\, 3]$. Symmetry of the kernel is precisely the condition
under which the two operations agree.

## Formal treatment

The two operations are related by reflection of one argument:

$$
(f \star g)(t) = (f * \tilde{g})(t), \qquad \tilde{g}(t) = g(-t).
$$

Consequently cross-correlation inherits bilinearity and translation-commutation
from convolution but **loses commutativity and associativity**:

$$
(f \star g)(t) = (g \star f)(-t) \quad \text{(real case)} .
$$

In the Fourier domain, for real integrable $f$ and $g$,

$$
\mathcal{F}\{f \star g\} = \overline{\mathcal{F}\{f\}} \cdot \mathcal{F}\{g\},
$$

with the conjugate replacing the plain product that the convolution theorem
gives. Autocorrelation is the special case $f \star f$; by the Wiener–Khinchin
relation its transform is the power spectral density of $f$.

## Assumptions and requirements

Convergence conditions are those of convolution: integrability in the continuous
case, finite support in the discrete case. The identities above assume the
reflection convention stated here; texts differ in which argument is shifted and
whether the conjugate sits on the first or second factor, so a formula copied
from elsewhere may differ by a sign in the displacement or by which factor is
conjugated. State the convention before relying on a derivation.

## Uses and applicability

Template matching and object localisation, time-delay estimation between two
sensors, similarity search in time series, and — most relevant here — the forward
pass of a [Convolutional Layer](./convolutional-layer.md). PyTorch's `Conv2d`
documentation states plainly that the operation it implements is a
cross-correlation, and other major frameworks behave the same way.

Cross-correlation is the right choice whenever the template's orientation is
meaningful and should be preserved. Convolution is the right choice whenever an
algebraic identity — commutativity, associativity, the convolution theorem — is
going to be used.

## Limitations and common mistakes

The dominant mistake is treating the library's `conv` function as mathematical
convolution. In a network with _learned_ kernels the distinction does not change
what the model can represent, because the optimiser can learn the reflected
kernel just as easily. It does change:

- any derivation that invokes commutativity or the convolution theorem;
- the correct form of the backward pass, which is covered in
  [Backpropagation Through Convolution](./backpropagation-through-convolution.md);
- results when a kernel is _fixed_ rather than learned, such as a hand-designed
  Sobel or Gaussian filter loaded into a layer, where the reflection silently
  flips the filter's orientation.

A second mistake is comparing raw cross-correlation scores across positions
without normalising. Unnormalised scores grow with local signal magnitude, so a
bright region can outscore a genuine match. Normalised cross-correlation divides
by the local norms to fix this.

## Variants and alternatives

**Normalised cross-correlation** divides by the product of local norms, giving a
value in $[-1, 1]$ that is invariant to local scaling. **Phase correlation**
works in the Fourier domain and is robust to illumination change. **Circular
cross-correlation** treats indices as periodic. **Convolution** itself is the
reflected alternative, preferred wherever the algebraic identities matter.

## History and attribution

Cross-correlation has been standard in statistics and signal processing since
the early twentieth century, as the natural sample analogue of a covariance
between two shifted series. The deep learning naming convention — calling a
cross-correlation "convolution" — is discussed explicitly in _Deep Learning_,
Chapter 9, which notes that the machine learning literature commonly uses the
term loosely. The dating in the first sentence is **not** verified against a
primary historical source and should be treated as background rather than as an
attribution claim.

## Sources

- **MIT 6.003 Signals and Systems** — definitions and the Fourier-domain
  relationship.
- **Deep Learning, Chapter 9** — the explicit statement that deep learning
  implementations use cross-correlation while saying convolution, and why this
  is harmless for learned kernels.
- **torch.nn.Conv2d documentation** — a current, checkable example of a library
  documenting cross-correlation under the name convolution.

## Prerequisites and next connections

Read [Convolution](./convolution.md) first; this page is defined by contrast
with it.

Next, [Convolutional Layer](./convolutional-layer.md) shows the operation
embedded in a learnable layer with channels, stride and padding, and
[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
shows where the reflection reappears in the backward pass.
