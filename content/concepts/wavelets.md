---
concept_id: concept.analysis.wavelets
title: Wavelets
slug: /concepts/wavelets
aliases:
  - multiresolution analysis
  - wavelet transform
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: A family of functions built by dilating and translating one short oscillating waveform, giving a basis in which a signal is resolved by position and by scale at the same time.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: contrasts_with
    target: concept.analysis.fourier_analysis
    note: A Fourier basis resolves frequency perfectly and position not at all; a wavelet basis gives up some frequency resolution to say where in the signal each component occurred.
  - type: requires
    target: concept.analysis.hilbert_spaces
    note: Orthonormal wavelet bases, the nested approximation spaces of a multiresolution analysis and their orthogonal complements are all statements about the Hilbert space $L^2(\mathbb{R})$.
  - type: requires
    target: concept.analysis.convolution
    note: The discrete wavelet transform is computed as a cascade of convolutions with a two-filter bank followed by downsampling, not by integrating against each basis function separately.
  - type: specializes
    target: concept.analysis.harmonic_analysis
    note: Wavelet theory is the branch of harmonic analysis that decomposes functions over a dilation-and-translation family rather than over characters of a group.
sources:
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - concrete-example
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - variants-and-alternatives
    checked_on: 2026-09-17
---

## Definition

A **wavelet** is a function $\psi \in L^2(\mathbb{R})$ that oscillates, decays, and
has zero average, $\int_{\mathbb{R}} \psi(t)\,dt = 0$. From it one builds a whole
family by dilating and translating,

$$
\psi_{j,k}(t) \;=\; 2^{j/2}\,\psi\!\left(2^{j} t - k\right), \qquad j,k \in \mathbb{Z},
$$

where $j$ indexes scale (larger $j$ means narrower and higher-frequency), $k$ indexes
position, and $2^{j/2}$ keeps $\lVert \psi_{j,k}\rVert_2 = \lVert\psi\rVert_2$. For
suitable $\psi$ this countable family is an **orthonormal basis** of
$L^2(\mathbb{R})$, so every finite-energy signal expands as $f = \sum_{j,k} \langle f,
\psi_{j,k}\rangle\, \psi_{j,k}$, each coefficient attached to one scale _and_ one
location.

## Why it matters

The Fourier basis fails at an ordinary task: telling you _when_ something happened.
Each complex exponential $e^{i\omega t}$ has infinite support, so a signal that is
silent and then clicks has no small Fourier representation — the click's energy is
smeared across every frequency, and no coefficient can be pointed at and called
"the click". Transients, edges in images, seismic arrivals: exactly the data Fourier
handles worst.

Wavelets fix this with basis functions that are themselves short. A piecewise-smooth
signal with a few discontinuities has only a few large wavelet coefficients — the
ones whose support straddles a jump — and that sparsity is what compression,
denoising and fast numerical algorithms live on.

## Intuition

Think of a musical score rather than a frequency meter. The score says which note
sounds and _when_; a spectrum analyser says only which notes occur somewhere.

The essential trick is that window length is tied to the frequency being measured.
A high-frequency wavelet is narrow, so it localises a click sharply and reports
frequency coarsely; a low-frequency wavelet is wide, pinning down a slow oscillation
in frequency but only roughly in time. This is _constant relative bandwidth_: every
octave gets the same treatment.

The analogy breaks in one place. A score is a list of discrete events, while the
wavelet expansion is a change of basis — one sharp feature still produces a small
cone of coefficients across scales, not a single entry.

## Concrete example

Take the eight-sample signal $x = (1,1,1,1,1,1,1,9)$ — flat, with one spike at the
end. The Haar transform repeatedly replaces adjacent pairs by their normalised sum
and difference.

```python
from math import sqrt

def haar(x):
    out, n = list(x), len(x)
    while n > 1:
        half = n // 2
        a = [(out[2 * i] + out[2 * i + 1]) / sqrt(2) for i in range(half)]
        d = [(out[2 * i] - out[2 * i + 1]) / sqrt(2) for i in range(half)]
        out[:n] = a + d
        n = half
    return out

print(haar([1, 1, 1, 1, 1, 1, 1, 9]))
```

The result is $(4\sqrt2,\, -2\sqrt2,\, 0,\, -4,\, 0,\, 0,\, 0,\, -4\sqrt2)$, roughly
$(5.657, -2.828, 0, -4, 0, 0, 0, -5.657)$. Four coefficients are exactly zero, and
every nonzero detail coefficient sits at the right-hand end, where the spike is.
Energy is preserved: $32 + 8 + 16 + 32 = 88 = 7 \cdot 1^2 + 9^2$.

Now the discrete Fourier transform of the same vector — the constant vector's
transform plus an impulse of height $8$ at the last sample — giving $X_0 = 16$ and
$|X_k| = 8$ for every $k = 1,\dots,7$. All eight coefficients are nonzero, seven equal
in magnitude, and nothing in that list says the spike was at the end rather than the
start. Parseval still holds, $(256 + 7\cdot 64)/8 = 88$: no energy is lost, but the
_location_ is.

## Formal treatment

The standard route to orthonormal wavelets is **multiresolution analysis** (MRA): a
nested chain of closed subspaces

$$
\cdots \subset V_{-1} \subset V_0 \subset V_1 \subset \cdots \subset L^2(\mathbb{R})
$$

with $\bigcap_j V_j = \{0\}$, $\overline{\bigcup_j V_j} = L^2(\mathbb{R})$, the
scaling property $f(t) \in V_j \iff f(2t) \in V_{j+1}$, and a **scaling function**
$\varphi \in V_0$ whose integer translates $\{\varphi(t-k)\}$ are an orthonormal
basis of $V_0$. (Some texts index the chain the other way; that is a convention.)

Let $W_j$ be the orthogonal complement of $V_j$ in $V_{j+1}$. Since $\varphi \in
V_0 \subset V_1$ it satisfies a two-scale relation, and the wavelet spanning $W_0$
comes from the mirrored filter:

$$
\varphi(t) = \sqrt{2}\sum_{n} h_n\, \varphi(2t-n),
\qquad
\psi(t) = \sqrt{2}\sum_{n} g_n\, \varphi(2t-n),
\qquad
g_n = (-1)^n h_{1-n}.
$$

Then $\{\psi_{j,k}\}$ is an orthonormal basis of $L^2(\mathbb{R})$. This is also the
algorithm: convolve with $h$ and $g$, downsample by two, recurse on the low-pass
branch — $O(N)$ cost for $N$ samples.

The **continuous** wavelet transform keeps scale $a > 0$ and position
$b \in \mathbb{R}$ continuous,

$$
W_f(a,b) \;=\; \frac{1}{\sqrt{a}} \int_{\mathbb{R}} f(t)\, \overline{\psi\!\left(\frac{t-b}{a}\right)} \, dt ,
$$

and inverts whenever $\psi$ is admissible, $C_\psi = \int_0^\infty
|\hat\psi(\omega)|^2\,\omega^{-1}\,d\omega < \infty$, which for $\psi \in L^1 \cap
L^2$ forces $\hat\psi(0) = 0$ — the zero-mean requirement. The CWT is massively
redundant; the **discrete** transform is the critically sampled restriction
$a = 2^{-j}$, $b = 2^{-j}k$.

Finally the uncertainty principle: for unit-norm $\psi$ with spreads $\sigma_t,
\sigma_\omega$ about the mean time and mean frequency,

$$
\sigma_t \, \sigma_\omega \;\ge\; \tfrac{1}{2},
$$

with equality only for Gaussian-modulated atoms. This bounds the _product_; it does
not forbid joint localisation, and wavelets with enough smoothness and decay —
Meyer, Battle–Lemarié, higher-order Daubechies — have both $\sigma_t$ and
$\sigma_\omega$ finite. Some do not: the Haar wavelet has $\sigma_\omega = \infty$,
because $|\hat\psi(\omega)| = 4\sin^2(\omega/4)/|\omega|$ decays only like
$1/\omega$. Dilation multiplies $\sigma_t$ by $a$ and divides
$\sigma_\omega$ by $a$, leaving the product fixed — which is exactly why the basis
can afford sharp timing at fine scales and sharp frequency at coarse ones.

## Assumptions and requirements

Everything above sits in $L^2(\mathbb{R})$: coefficients are inner products, so the
signal must have finite energy, and convergence of $\sum_{j,k}\langle f,\psi_{j,k}
\rangle \psi_{j,k}$ is in the $L^2$ norm, not pointwise. Pointwise statements need
extra regularity.

Orthonormality requires $h$ to satisfy the quadrature-mirror conditions; an arbitrary
filter pair gives a redundant frame at best, a non-invertible transform at worst.
Sparsity is not automatic either: it requires the signal to be piecewise smooth
relative to the wavelet's number of **vanishing moments**. If $\int t^m \psi(t)\,dt =
0$ for $m < N$, the coefficients of a locally $C^N$ piece decay like
$2^{-j(N+1/2)}$, so smooth stretches cost almost nothing. Feed in broadband noise
instead and the expansion is dense, with no advantage over any other basis.

A finite signal is also not a function on $\mathbb{R}$, so a boundary rule is needed:
periodic extension, symmetric extension, or wavelets adapted to an interval. Periodic
extension on a signal whose ends do not match manufactures a large artificial edge
coefficient.

## Uses and applicability

Reach for wavelets when the structure of interest is localised and multi-scale:
image compression (JPEG 2000 uses a biorthogonal wavelet transform, and the FBI's
fingerprint standard a wavelet scheme), denoising by thresholding small coefficients,
edge and singularity detection, seismic and biomedical time series, and sparse
operator representations in numerical analysis.

Do not reach for them when the signal is stationary and narrowband. A pure sinusoid
is one Fourier coefficient and a mess of wavelet coefficients; for resonance analysis,
filter design, or anything where phase at a fixed frequency matters, Fourier is
sharper and better tooled.

## Limitations and common mistakes

The most frequent misreading is that the uncertainty principle forces a choice
between time and frequency. It bounds the product of the spreads below; it says
nothing against having both finite, which well-chosen wavelets do — Haar does not,
but Meyer, Battle–Lemarié and higher-order Daubechies wavelets do. What is genuinely
impossible is stronger: the Balian–Low theorem says a critically sampled Gabor system
whose window is well localised in both time and frequency cannot be an orthonormal
basis. Wavelets escape that obstruction, and the substantive point is exactly that
such well-localised orthonormal wavelet bases exist at all — Meyer's smooth basis,
and Daubechies' compactly supported families with any prescribed number of vanishing
moments — not that every wavelet is well localised. That is why they are not a
rearrangement of the windowed Fourier transform.

The second mistake is expecting shift invariance. The decimated DWT has none:
translating the input by one sample can redistribute the coefficients completely,
which shows up as artefacts in denoising. Use the undecimated (stationary) or
dual-tree complex transform when that matters, and pay the redundancy.

Third, symmetry. Except for Haar, no real, compactly supported, orthonormal wavelet
is symmetric, so orthonormal filters have nonlinear phase; biorthogonal wavelets buy
symmetry by dropping orthonormality, which is why image codecs use them.

Fourth, separable 2-D wavelets are products of 1-D wavelets and so favour horizontal
and vertical structure. For images whose edges are smooth curves, the best $M$-term
wavelet approximation error decays roughly like $M^{-1}$, against about $M^{-2}$ up to
logarithmic factors for directional systems such as curvelets.

## Variants and alternatives

**Haar** is the simplest: one vanishing moment, discontinuous. **Daubechies**
wavelets $\mathrm{db}N$ are compactly supported with $N$ vanishing moments and filter
length $2N$; **symlets** and **coiflets** adjust that trade for near-symmetry or for
moments on the scaling function. **Meyer** and **Battle–Lemarié** wavelets give up
compact support for smoothness, **biorthogonal** families (the 9/7 pair in JPEG 2000)
give up orthonormality for linear phase, and **wavelet packets** split the high-pass
branch too, for a finer frequency partition at extra cost. For the CWT, complex
**Morlet** and the **Mexican hat** are the usual analysing functions.

The real competitors: the short-time Fourier transform, one fixed window for all
frequencies, better when the interesting scales are known in advance; **curvelets**
and **shearlets**, which add orientation; empirical mode decomposition, adaptive but
without comparable theory; and learned dictionaries, which fit the data at the cost of
closed-form guarantees and a fast transform.

## History and attribution

Alfréd Haar introduced the step-function orthonormal system that bears his name in
1909, as an example in the theory of orthogonal function systems rather than as signal
processing. The modern subject has several partly independent origins. Jan-Olov
Strömberg constructed an orthonormal wavelet basis in the early 1980s without it being
widely noticed; the geophysicist Jean Morlet, analysing seismic traces, worked out the
dilation-translation transform with the physicist Alex Grossmann around 1984; and
Littlewood–Paley theory and Calderón's reproducing formula had supplied much of the
machinery earlier. Yves Meyer built a smooth orthonormal basis in the mid-1980s, he
and Stéphane Mallat then formulated multiresolution analysis — which connected the
mathematics to filter banks already known in signal processing — and Ingrid Daubechies
constructed the compactly supported families in 1988. Meyer received the Abel Prize in
2017 for this work.

## Sources

MIT 6.003 covers the Fourier and filter-bank background — convolution, sampling,
downsampling — that the discrete transform is assembled from, and shows why a
fixed-window transform localises poorly. MIT 18.065 treats wavelets and filter banks
from the matrix side, where the transform is an orthogonal change of basis and the
two-channel bank a factorisation of it. MIT 18.100A supplies the convergence and
completeness notions the $L^2$ statements rest on; MathWorld is for looking up a named
family and its conditions.

## Prerequisites and next connections

Read [Real Analysis](./real-analysis.md) first, for limits, completeness and what
convergence in a function space means, and
[Single Variable Calculus](./single-variable-calculus.md) for the integrals. Fourier
analysis is the natural companion — wavelets answer a specific failure of that basis —
and the filter description of the discrete transform is a statement about
[Convolution](./convolution.md).

Downstream lie sparse approximation, nonparametric denoising, fast multiresolution
algorithms for integral operators, and, in machine learning, the scattering transform,
which stacks wavelet moduli into a hand-designed network whose stability can be proved
rather than measured.
