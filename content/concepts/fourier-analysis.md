---
concept_id: concept.analysis.fourier_analysis
title: Fourier Analysis
slug: /concepts/fourier-analysis
kind: concept
tier: 1
review_state: generated-draft
summary: The study of functions decomposed into complex exponentials, which turns differentiation into multiplication by frequency and convolution into a pointwise product.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: equivalent_under
    target: concept.analysis.convolution
    note: Under the Fourier transform, convolving two functions is exactly multiplying their transforms pointwise, which is why the FFT computes convolutions.
  - type: requires
    target: concept.analysis.real_analysis
    note: Whether a Fourier series or inversion integral converges, and in what sense, is a question only the convergence machinery of real analysis can answer.
  - type: used_to_solve
    target: concept.analysis.partial_differential_equations
    note: Exponentials are eigenfunctions of differentiation, so a linear constant-coefficient PDE becomes an algebraic or ordinary differential equation frequency by frequency.
  - type: specializes
    target: concept.analysis.harmonic_analysis
    note: Fourier analysis on the circle and the line is the classical special case of harmonic analysis on a locally compact abelian group.
sources:
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.partial_differential_equations
    title: MIT 18.152 Introduction to Partial Differential Equations (Fall 2011)
    url: https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
    checked_on: 2026-09-17
  - source_id: source.dlmf.nist
    title: NIST Digital Library of Mathematical Functions
    url: https://dlmf.nist.gov/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Fourier analysis** decomposes a function into a superposition of complex
exponentials $e^{i\omega x}$ — equivalently, of sines and cosines — and studies
what that decomposition preserves and what it destroys. Two settings dominate. On
a circle or bounded interval it is a countable sum, the **Fourier series**, with
one coefficient per integer frequency; on the whole line it is an integral, the
**Fourier transform**, with a coefficient for every real frequency. The
exponentials are eigenfunctions both of differentiation and of translation, and
essentially everything in the subject follows from that.

## Why it matters

Differentiation becomes multiplication by frequency, so a linear
constant-coefficient differential equation becomes algebra one frequency at a
time. That was Fourier's own use: the heat equation on a rod separates into
independent modes, each decaying at its own rate.

[Convolution](./convolution.md) becomes a pointwise product, so a
translation-invariant filter is just a multiplier, and an $O(MN)$ direct
convolution becomes an $O(N \log N)$ computation through the FFT.

And the transform is an isometry, so least-squares and energy arguments can be
made in whichever domain is easier and carried back unchanged.

## Intuition

Treat the exponentials as an orthonormal basis and the Fourier coefficient as an
inner product: the amount of the signal lying along one pure tone. Analysis
resolves the vector into coordinates; synthesis adds them back up. The prism is
the usual analogy — white light in, a spectrum out.

The analogy breaks on localisation. A prism separates light that is already
there all at once; a Fourier component $e^{i\omega x}$ has the same magnitude at
every point of the line, so a single click in a recording is spread across every
frequency, encoded entirely in the phases. Fourier analysis tells you which
frequencies are present, not when they happened.

## Concrete example

Take the square wave: $f(x) = 1$ on $(0, \pi)$, $f(x) = -1$ on $(-\pi, 0)$,
extended with period $2\pi$. It is odd, so only sine terms survive:

$$
b_k = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x) \sin(kx)\, dx
   = \frac{2}{\pi}\int_{0}^{\pi} \sin(kx)\, dx
   = \frac{2\left(1 - \cos k\pi\right)}{\pi k},
$$

which is $4/(\pi k)$ for odd $k$ and $0$ for even $k$. So

$$
f(x) = \frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \cdots\right),
$$

with coefficients $1.2732,\ 0.4244,\ 0.2546, \ldots$ Parseval checks out
exactly: the mean square of $f$ is $1$, and
$\tfrac{1}{2}\sum_k b_k^2 = \tfrac{8}{\pi^2}\sum_{k \text{ odd}} k^{-2}
= \tfrac{8}{\pi^2}\cdot\tfrac{\pi^2}{8} = 1$.

Two things to notice at the jump. At $x = 0$ every partial sum is $0$ — the
series converges to the midpoint of the jump, not to either one-sided value. And
just beside the jump every partial sum overshoots, by about $9\%$ of the jump
height, no matter how many terms are kept.

## Formal treatment

**Series.** Let $\mathbb{T} = \mathbb{R}/2\pi\mathbb{Z}$ and
$f \in L^2(\mathbb{T})$. Define

$$
\hat{f}(n) = \frac{1}{2\pi}\int_{-\pi}^{\pi} f(x)\, e^{-inx}\, dx ,
\qquad
S_N f(x) = \sum_{|n| \le N} \hat{f}(n)\, e^{inx} .
$$

With the inner product $\langle f, g\rangle = \frac{1}{2\pi}\int_{-\pi}^{\pi} f\bar{g}$,
the family $\{e^{inx}\}_{n \in \mathbb{Z}}$ is a complete orthonormal system, so
$\lVert f - S_N f\rVert_2 \to 0$ and **Parseval's identity** holds:
$\frac{1}{2\pi}\int_{-\pi}^{\pi}|f|^2 = \sum_{n}|\hat{f}(n)|^2$.

**Transform.** On the line, in one common convention,

$$
\hat{f}(\xi) = \int_{\mathbb{R}} f(x)\, e^{-2\pi i x \xi}\, dx ,
\qquad
f(x) = \int_{\mathbb{R}} \hat{f}(\xi)\, e^{2\pi i x \xi}\, d\xi .
$$

Here $\lVert f \rVert_2 = \lVert \hat{f} \rVert_2$ (**Plancherel's theorem**),
$\widehat{f'}(\xi) = 2\pi i \xi\, \hat{f}(\xi)$, and the **convolution theorem**
reads $\widehat{f * g} = \hat{f}\,\hat{g}$ with no constant at all.

**The constants are conventions, not facts.** With the angular-frequency
convention $\hat{f}(\omega) = \int f(x) e^{-i\omega x} dx$ the inversion integral
and Plancherel both carry a $1/2\pi$, while the convolution theorem stays clean;
with the symmetric convention, $(2\pi)^{-1/2}$ in front of both directions, the
convolution theorem picks up a factor $\sqrt{2\pi}$. The sign in the exponent is
a choice too: electrical engineering writes the forward transform with
$e^{-j\omega t}$, and parts of physics use $e^{+i\omega t}$ for time dependence,
which conjugates and reflects the spectrum. Mixing formulas from two conventions
inside one derivation is the ordinary way a spurious $2\pi$ appears.

## Assumptions and requirements

For $f \in L^1(\mathbb{R})$ the transform integral converges absolutely and
$\hat{f}$ is bounded, continuous, and tends to $0$ at infinity (Riemann–Lebesgue).
That is not enough for pointwise inversion: $\hat{f}$ need not itself be in
$L^1$, so the inversion integral may fail to converge, and recovering $f$
pointwise needs an extra hypothesis such as $\hat{f} \in L^1$. The $L^2$ theory
is not given by the integral at all — it is defined on $L^1 \cap L^2$ and
extended by density, so there $\hat{f}$ is an equivalence class with no pointwise
values.

For series, continuity is not enough either: du Bois-Reymond exhibited a
continuous function whose Fourier series diverges at a point. Piecewise
continuous differentiability gives convergence at every point, to the midpoint at
jumps. Carleson's theorem gives almost-everywhere convergence for $L^2$
functions; Kolmogorov constructed an integrable function whose series diverges
almost everywhere. Finally, a series presumes periodicity — analysing a
non-periodic record on a finite window implicitly periodises it and manufactures
a jump at the seam.

## Uses and applicability

Reach for Fourier analysis when the operator you care about is linear and
translation-invariant, because then it is diagonal in the Fourier basis:
filtering, spectral estimation, the heat and wave equations, characteristic
functions in probability (the convolution theorem is why central-limit proofs go
through them), crystallography, and fast convolution:

```python
import numpy as np

f = np.array([1.0, 2.0, 3.0])
g = np.array([1.0, -1.0])
n = len(f) + len(g) - 1                                   # 4, the linear length
out = np.fft.irfft(np.fft.rfft(f, n) * np.fft.rfft(g, n), n)
print(np.round(out, 12))                                  # [ 1.  1.  1. -3.]
```

That is the same answer as the direct sum on the [Convolution](./convolution.md)
page, obtained by multiplying spectra.

Do not reach for it when the operator has variable coefficients, when the domain
has no translation structure, or when you need to know _when_ something
happened. And the asymptotics are not the whole story — for the short kernels
used in a [Convolutional Layer](./convolutional-layer.md), direct or
matrix-multiplication methods usually beat an FFT.

## Limitations and common mistakes

**Gibbs phenomenon.** Near a jump, the partial sums overshoot; as $N$ grows the
peak-to-peak span approaches $\frac{2}{\pi}\mathrm{Si}(\pi) \approx 1.17898$
times the jump, an overshoot of roughly $8.95\%$ on each side that never shrinks.
What this does _not_ say is that the series fails to converge. For a piecewise
smooth function it converges at every point of continuity, converges to the
midpoint at the jump, and converges in $L^2$; the overshoot does not diminish but
migrates toward the discontinuity, so the region carrying it has vanishing width.
Uniform convergence is what fails. Cesàro averaging of the partial sums (Fejér
means) removes the overshoot entirely, at the price of blurring the edge.

**The FFT is not a transform.** It is an algorithm for the discrete Fourier
transform. Multiplying two DFTs gives _circular_ convolution, so linear
convolution requires zero-padding to length $M + N - 1$ — omit that and the tail
wraps around onto the head.

**Leakage.** The DFT assumes the record is one period, so a sinusoid whose
frequency is not an exact bin multiple spills energy across all bins; window
functions trade a wider main lobe for lower side lobes and do not remove it.

**Reading a magnitude spectrum as a history.** It says nothing about ordering in
time — the phases carry that. If the question is _when_, use a spectrogram.

## Variants and alternatives

The family is organised by which domain is discrete. Fourier series: periodic
input, discrete spectrum. Discrete-time Fourier transform: discrete input,
continuous periodic spectrum. Discrete Fourier transform: finite both ways,
computed by the FFT — Cooley–Tukey for composite lengths (radix-2 when the
length is a power of two), Bluestein's or Rader's algorithm for prime ones. The
discrete cosine transform uses an even extension to avoid the seam and stay
real, which is why it sits inside JPEG. The
Laplace and $Z$ transforms add a decay factor so that growing signals become
tractable, at the cost of the clean isometry. Short-time Fourier transforms and
wavelets buy time localisation by giving up frequency resolution.
Generalisations replace the circle with another group: Pontryagin duality for
locally compact abelian groups, spherical harmonics on the sphere, the graph
Fourier transform from Laplacian eigenvectors.

## History and attribution

Trigonometric series predate Fourier — Euler, d'Alembert and Daniel Bernoulli
argued about them in the eighteenth-century vibrating-string debates. Joseph
Fourier, working on heat conduction, presented a memoir to the Paris Academy in
1807 that was not published and was contested, Lagrange among the objectors, and
then published _Théorie analytique de la chaleur_ in 1822. His claim that quite
general functions admit such an expansion was the provocation; making it precise
took the following century, beginning with Dirichlet's convergence criterion of
1829 and running through Riemann on trigonometric series, Cantor's investigation
of their uniqueness — out of which set theory grew — and the twentieth-century
$L^2$ theory. The overshoot at a jump was described by Henry Wilbraham in 1848,
rediscovered in a _Nature_ exchange involving Michelson at the end of the 1890s,
analysed there by J. Willard Gibbs, and has carried Gibbs's name since. Cooley
and Tukey published the FFT in 1965; an equivalent method used by Gauss around
1805 went unnoticed for a century and a half.

## Sources

MIT 6.003 is the most direct route to the operational content: the transform
pair, the convolution theorem, and the way a linear time-invariant system becomes
a multiplier. MIT 18.100A supplies the convergence vocabulary the assumptions
section depends on — uniform versus pointwise convergence, the distinction that
is the whole content of the Gibbs discussion. MIT 18.152 is the setting Fourier
invented the method for, with the heat and wave equations solved mode by mode.
The NIST DLMF is what to check a formula against when two books disagree about a
constant; it states its conventions explicitly and tabulates the sine integral
$\mathrm{Si}$ that gives the Gibbs constant. None of these is a history of
mathematics, so the history and attribution section cites none of them: its dates
and attributions are unsourced here, and it is the weakest part of this page.

## Prerequisites and next connections

You need integration, including improper integrals, from
[Single-Variable Calculus](./single-variable-calculus.md), and the notions of
convergence from [Real Analysis](./real-analysis.md) — a Fourier series is an
infinite sum, and almost every subtlety on this page is about in what sense it
converges. Read [Convolution](./convolution.md) first or alongside; the
convolution theorem is the reason most people come here, and it will not mean
much without the operation itself.

From here, [Harmonic Analysis](./harmonic-analysis.md) takes the construction to
general groups and asks how much survives;
[Wavelets](./wavelets.md) keep the decomposition but change the basis to one
localised in both time and frequency; and
[Hilbert Spaces](./hilbert-spaces.md) explain why the orthonormal-basis picture
above was legitimate at all.
