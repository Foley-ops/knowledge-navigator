---
concept_id: concept.deep_learning.radial_basis_function_networks
title: Radial Basis Function Networks
slug: /concepts/radial-basis-function-networks
aliases:
  - RBF network
kind: method
tier: 1
review_state: generated-draft
summary: A one-hidden-layer model whose units respond to distance from a stored centre, so that once the centres are fixed the fit reduces to linear least squares.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.machine_learning.linear_regression
    note: The output layer is fitted by ordinary or ridge least squares, so a reader who cannot solve a linear regression cannot follow the training procedure at all.
  - type: contrasts_with
    target: concept.deep_learning.multilayer_perceptrons
    note: An MLP unit responds to a dot product and so is active over a half-space, while an RBF unit responds to a distance and so is active only near one point.
  - type: equivalent_under
    target: concept.machine_learning.gaussian_processes
    note: With one centre per training point and a strictly positive definite radial kernel, the interpolating RBF network is exactly the posterior mean of noise-free Gaussian process regression with that kernel.
  - type: approximates
    target: concept.machine_learning.kernel_methods
    note: With fewer centres than data points the network is a low-rank surrogate for kernel ridge regression using the same radial kernel.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.rasmussen.gaussian_processes
    title: Rasmussen and Williams, Gaussian Processes for Machine Learning
    url: https://gaussianprocess.org/gpml/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.mlp
    title: Deep Learning, Chapter 6 — Deep Feedforward Networks
    url: https://www.deeplearningbook.org/contents/mlp.html
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: Micchelli's nonsingularity theorem for distance matrices, and the Mairhuber–Curtis theorem
    reason: No registry source states either result; the Gaussian process reference covers positive definite kernels but not the conditionally positive definite case (multiquadrics) or the impossibility of a data-independent interpolation basis in two or more dimensions.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
  - label: Park and Sandberg's universal approximation theorem for radial basis function networks
    reason: The registry covers universal approximation for sigmoidal and rectified feedforward networks, but no source states the density result for radial expansions, which is a separate theorem with different hypotheses.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: The originating papers — Broomhead and Lowe (1988), Moody and Darken (1989), Poggio and Girosi (1990)
    reason: The registry has no source on the origin of RBF networks as a neural architecture, so the attributions in the history section are uncited.
    sections:
      - history-and-attribution
  - label: Modern scattered-data approximation and meshfree (RBF-FD) literature
    reason: The claim that radial basis functions remain standard for scattered-data interpolation and for solving PDEs on unstructured node sets rests on a numerical-analysis literature that no registry source covers.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

A **radial basis function network** computes

$$
f(x) \;=\; \sum_{j=1}^{m} w_j \, \phi\!\left(\lVert x - c_j \rVert\right) \;+\; b ,
$$

where $x \in \mathbb{R}^d$ is the input, $c_1, \dots, c_m \in \mathbb{R}^d$ are
**centres**, $\phi : [0,\infty) \to \mathbb{R}$ is a fixed univariate function,
and $w \in \mathbb{R}^m$, $b \in \mathbb{R}$ are the output weights. Each hidden
unit sees only the distance from the input to its own centre — hence _radial_:
the unit's response is constant on spheres around $c_j$. The commonest choice is
the Gaussian $\phi(r) = \exp(-r^2 / 2\sigma^2)$, with the width $\sigma$ either
shared or per-unit.

The structural point is what the architecture does to training. Fix the centres
and widths and the model is linear in its remaining parameters, so fitting is a
least-squares problem with a closed-form solution — not a non-convex search.

## Why it matters

Almost every other neural architecture entangles feature learning with the fit,
which is why they need gradient descent, initialisation schemes and a schedule.
An RBF network factors the problem: choose where to put the bumps, then solve
one linear system. The second stage has a unique minimiser given full column
rank — no local optima, no learning rate, no epochs — and if you keep the
factorisation, refitting to new targets on the same inputs is nearly free.

That separation also makes the network a pivot between three literatures. Viewed
as an architecture it is a neural network; as a kernel expansion it is a close
relative of kernel ridge regression — the same predictor when every data point
is a centre and $\lambda = 0$, a low-rank surrogate otherwise; probabilistically
it is a Gaussian process with a particular covariance function. One
construction, three vocabularies.

## Intuition

Picture the fitted surface as a sum of tent poles. Each hidden unit plants a
bump of fixed shape at its centre, the output weight sets the height (possibly
negative), and the sum is the surface. Prediction asks which stored locations
the input is near, and what the target looked like there.

The analogy breaks in two places. Not every radial function is a bump: the
multiquadric $\phi(r) = \sqrt{r^2 + \varepsilon^2}$, with shape parameter
$\varepsilon > 0$, and the thin-plate spline $\phi(r) = r^2 \log r$ _grow_ with
distance and still interpolate well, so locality belongs to particular choices,
not to the architecture. And even a Gaussian stops being
local when $\sigma$ is large relative to the centre spacing: the units become
nearly constant, nearly collinear, and the weights explode into differences of
large numbers.

## Concrete example

Interpolate $\sin$ at four points with one Gaussian centre per point, so the
design matrix is square and the fit is exact.

```python
import numpy as np

X = np.array([0.0, 1.0, 2.0, 3.0])
y = np.sin(X)                                  # 0, 0.8415, 0.9093, 0.1411
sigma = 1.0

Phi = np.exp(-(X[:, None] - X[None, :]) ** 2 / (2 * sigma ** 2))
w = np.linalg.solve(Phi, y)                    # exact interpolation

def f(t):
    return np.exp(-(np.atleast_1d(t)[:, None] - X) ** 2 / (2 * sigma ** 2)) @ w
```

With $\sigma = 1$ the weights are $(-0.570,\, 0.774,\, 0.777,\, -0.429)$,
$\kappa(\Phi) = 15.8$, and $f(1.5) = 1.044$ against $\sin(1.5) = 0.997$. Shrink
to $\sigma = 0.5$ and the matrix is almost the identity ($\kappa = 1.6$), but the
bumps barely overlap and the fit degrades to $f(1.5) = 0.940$. Widen to
$\sigma = 3$ and accuracy improves to $f(1.5) = 0.988$ — while the weights grow
to $(-12.1,\, -0.77,\, 34.9,\, -24.9)$ and $\kappa$ reaches
$9.1 \times 10^{3}$.

That is the central practical trade-off: the flat, accurate regime is the
ill-conditioned regime. Note also $f(6) \approx -0.004$ at $\sigma = 1$ and
$5 \times 10^{-10}$ at $\sigma = 0.5$ — outside the centres, a Gaussian network
returns the bias, not an extrapolation.

## Formal treatment

Given data $\{(x_i, y_i)\}_{i=1}^{n}$ and centres $\{c_j\}_{j=1}^{m}$, let
$\Phi \in \mathbb{R}^{n \times m}$ with $\Phi_{ij} = \phi(\lVert x_i - c_j
\rVert)$. Ridge-regularised fitting minimises $\lVert \Phi w - y \rVert_2^2 +
\lambda \lVert w \rVert_2^2$, giving

$$
\hat w = \left(\Phi^{\!\top}\Phi + \lambda I\right)^{-1} \Phi^{\!\top} y ,
$$

computed in practice by QR or SVD on $\Phi$ rather than by forming the normal
equations, which squares the condition number.

**Exact interpolation.** Take $m = n$ and $c_j = x_j$. Then $\Phi$ is the square
_distance matrix_ $A_{ij} = \phi(\lVert x_i - x_j \rVert)$ and the question is
whether $Aw = y$ is solvable for every $y$. Two results settle it, in terms of
$g(t) = \phi(\sqrt{t})$:

- If $g$ is completely monotone on $(0,\infty)$ — $(-1)^k g^{(k)} \ge 0$ for all
  $k$ — and non-constant, then $A$ is positive definite for any distinct points
  in any dimension. This covers the Gaussian and the inverse multiquadric
  $(r^2 + \varepsilon^2)^{-1/2}$.
- If instead $g'$ is completely monotone and $g$ is non-constant, $A$ is still
  nonsingular, with one positive and $n-1$ negative eigenvalues. This is
  Micchelli's case, and it covers $\phi(r) = r$ and the multiquadric
  $\sqrt{r^2 + \varepsilon^2}$, neither of which is positive definite.

The remarkable part is the absence of any geometric hypothesis: the points need
only be distinct, and $d$ is unconstrained. By the Mairhuber–Curtis theorem, no
_fixed_ basis of dimension $\ge 2$ can interpolate at every configuration of
points in $\mathbb{R}^d$ for $d \ge 2$; the escape is exactly that the RBF basis
is built from the data locations.

**Universal approximation.** Park and Sandberg showed that if $\phi(\lVert \cdot
\rVert)$ is integrable, bounded, continuous almost everywhere and has nonzero
integral, then expansions of the above form with a common width are dense in
$L^1(\mathbb{R}^d)$. It is a density statement with no rate: the number of units
needed is unbounded and, for a general target, grows exponentially in $d$.

## Assumptions and requirements

The interpolation results need **distinct** centres; duplicate points make $A$
singular however good $\phi$ is. For radial functions that are only
_conditionally_ positive definite of order $k$ — the thin-plate spline is order
$2$ — the plain system is not guaranteed solvable, and the standard fix is to
append a polynomial of degree $< k$ with the side conditions $\sum_j w_j p(x_j)
= 0$ for every such polynomial.

Exact interpolation assumes noiseless targets; with noise it fits the noise, and
$\lambda > 0$ (equivalently a jitter term on the diagonal) is required.

Distance is Euclidean and isotropic, so the coordinates must be commensurable.
An unstandardised feature measured in millimetres will dominate every distance
and silently determine the fit. Standardise, or use a full metric $\lVert x -
c_j \rVert_M^2 = (x-c_j)^\top M (x-c_j)$.

Finally, the theory guarantees invertibility, not usable conditioning: as the
example shows, $\kappa(\Phi)$ degrades rapidly as widths grow relative to centre
spacing.

## Uses and applicability

Reach for an RBF network when the input dimension is small, the sample is
modest, the target is smooth, and you want a fit you can characterise rather
than tune. Scattered-data interpolation in two and three dimensions is the
living application — surface reconstruction, mesh deformation, warping between
point sets, and RBF-generated finite differences for PDEs on unstructured nodes,
where the mesh-free property is the whole point.

Do not reach for one in high dimensions or on structured data: images, audio and
text are exactly where features are compositional and a metric on raw inputs
carries little information. Cost is the other limit — the solve is $O(nm^2)$, or
$O(n^3)$ for full interpolation, so tens of thousands of points already demand a
compactly supported kernel or a subset of centres.

## Limitations and common mistakes

The most consequential misconception is that "no backpropagation" means "better
conditioned learning". The two-stage procedure is convex only because it solves
a different problem: centres chosen by $k$-means or a random subset describe the
_inputs_ and are blind to $y$. They cluster where data is dense rather than
where the target varies, and no amount of least squares repairs that.

The second is underestimating the curse of dimensionality for local methods.
Covering a region with bumps of radius $\sigma$ takes a number of units
exponential in $d$, which is why the local-representation lineage lost to
distributed representations rather than losing on some benchmark.

Third, gradient training of the centres and widths is not a free upgrade: a
narrow Gaussian unit gives a near-zero response and a near-zero gradient for
almost every input, so it saturates and contributes nothing.

Fourth, an RBF network is not an SVM with an RBF kernel. Both expand the
prediction over radial functions centred at points, but the SVM _selects_ its
centres — the support vectors — through a hinge-loss quadratic program, whereas
an RBF network fixes them beforehand.

Finally, Gaussian units are not a basis for extrapolation: beyond the centres
the output decays to the bias, and unnormalised expansions leave "holes" between
centres where every activation is small and the fit is numerical noise.

## Variants and alternatives

The radial function is the first choice: Gaussian and inverse multiquadric
(local, positive definite); multiquadric and $\phi(r)=r$ (conditionally positive
definite, globally supported, excellent for interpolation); thin-plate spline
(the minimiser of a bending-energy penalty); and Wendland's compactly supported
functions, which trade accuracy for a sparse, cheaply solvable system.

**Normalised RBF networks** divide by $\sum_k \phi(\lVert x - c_k \rVert)$,
forming a partition of unity that fills the holes and recovers the
Nadaraya–Watson kernel smoother. Centre selection has its own menu: all data
points, $k$-means, random subsets, or greedy forward selection by orthogonal
least squares.

Genuine competitors: kernel ridge regression (one centre per point, a principled
regulariser, $O(n^3)$); Gaussian process regression (the same posterior mean plus
calibrated uncertainty — though a _finite_-centre network is a degenerate,
finite-rank covariance whose predictive variance is misleadingly small far from
the data); $k$-nearest neighbours (local, no solve at all); and rectified-linear
MLPs, which learn features instead of placing them. The modern echo is the
random-feature model: a fixed random nonlinear layer with a linear readout,
keeping the closed-form fit and giving up the geometry of centres.

## History and attribution

The mathematics predates the neural framing. Schoenberg's work in the 1930s on
completely monotone functions and positive definite metric embeddings supplies
the analytic core; Powell and collaborators developed radial functions for
multivariable interpolation in the early 1980s; Micchelli proved nonsingularity
of the distance matrices in 1986, making interpolation at arbitrary scattered
points a theorem rather than a hope.

Broomhead and Lowe recast the construction as a neural network in 1988, when
backpropagation through multilayer networks was slow and unreliable and a
one-solve alternative was attractive. Moody and Darken (1989) introduced the
hybrid recipe that became standard practice — unsupervised placement of centres,
then a linear fit of the output weights. Poggio and Girosi (1990) derived the
same architecture from regularisation theory, and Park and Sandberg proved
universal approximation in 1991. As a deep learning architecture the idea is now
largely historical; as approximation theory it is thoroughly alive.

## Sources

_The Elements of Statistical Learning_ covers radial basis expansions among the
kernel and basis-function methods, including the normalisation fix for holes and
the argument about local methods in high dimensions. _Gaussian Processes for
Machine Learning_ gives the weight-space view of a basis expansion, positive
definite covariance functions, and the links to kernel and spline models. _Deep
Learning_, Chapter 6, is where the RBF hidden unit appears in the deep learning
literature, with the saturation argument for why it is rarely used. MIT 18.065
covers the least-squares machinery the output fit depends on.

## Prerequisites and next connections

Read [Linear Regression](./linear-regression.md) first: the output layer is
nothing but least squares, and the ridge term and its conditioning are the whole
of the training story.

From here, [Kernel Methods](./kernel-methods.md) keeps one centre per data point
and justifies it by the representer theorem, and [Gaussian
Processes](./gaussian-processes.md) reinterprets the identical predictor as a
posterior mean with error bars. [Support Vector
Machines](./support-vector-machines.md) choose the centres a different way,
[k-Means](./k-means.md) is the usual way to choose them here, and [Multilayer
Perceptrons](./multilayer-perceptrons.md) is the contrast to hold on to.
