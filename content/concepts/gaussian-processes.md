---
concept_id: concept.machine_learning.gaussian_processes
title: Gaussian Processes
slug: /concepts/gaussian-processes
aliases: []
kind: method
tier: 1
review_state: generated-draft
summary: A Gaussian process is a probability distribution over functions whose every finite set of values is jointly Gaussian, enabling Bayesian prediction with kernel-controlled structure and explicit uncertainty.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.machine_learning.kernel_methods
    note: The covariance kernel must generate positive-semidefinite Gram matrices and encodes the process's similarity assumptions.
  - type: requires
    target: concept.probability.bayesian_inference
    note: Regression conditions a Gaussian prior over latent function values on noisy observations to obtain a posterior predictive distribution.
  - type: requires
    target: concept.linear_algebra.matrix_decompositions
    note: Stable inference uses factorizations such as Cholesky rather than explicitly inverting the covariance matrix.
  - type: contrasts_with
    target: concept.machine_learning.linear_regression
    note: Bayesian linear regression is a finite-feature special case, while common Gaussian processes work directly with potentially infinite feature spaces.
sources:
  - source_id: source.rasmussen.gaussian_processes
    title: Rasmussen and Williams, Gaussian Processes for Machine Learning
    url: https://gaussianprocess.org/gpml/
    source_kind: authoritative-secondary
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
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **Gaussian process** (GP) is a collection of random variables, indexed by
inputs, such that every finite subcollection has a multivariate Gaussian
distribution. It defines a distribution over functions and is specified by a
mean $m(x)$ and covariance [kernel](./kernel-methods.md) $k(x,x')$:

$$
f\sim\mathcal{GP}(m,k).
$$

For inputs $X=(x_1,\ldots,x_n)$, the vector of latent values obeys
$f(X)\sim\mathcal N(m(X),K)$ with $K_{ij}=k(x_i,x_j)$. GP regression combines
this prior with an observation model, commonly $y_i=f(x_i)+\epsilon_i$ with
independent Gaussian noise.

## Why it matters

GPs produce both predictions and uncertainty while allowing nonlinear functions
without selecting a fixed number of basis functions. The kernel expresses
assumptions about smoothness, periodicity, length scale, and amplitude, making
model structure explicit rather than hidden in a large parameterization.

In Gaussian regression, posterior inference is analytic. That makes the model a
valuable standard for uncertainty-aware interpolation, experiment design, and
probabilistic modeling, as well as a reference against which approximations can
be understood.

## Intuition

Before observing data, imagine drawing many plausible curves. Nearby function
values co-move according to the kernel. Conditioning discards curves inconsistent
with observations and reweights those remaining; posterior uncertainty shrinks
near informative data and usually grows away from them.

The picture must not be overread. A narrow posterior band is justified only
inside the assumed kernel, likelihood, and hyperparameters. If the kernel
excludes abrupt changes or the noise model misses outliers, the model can be
confident and wrong.

## Concrete example

Take observations $(x,y)=(0,1),(1,2)$, a zero mean, linear kernel
$k(a,b)=1+ab$, and noise variance $\sigma_n^2=1/4$. Then

$$
K+\sigma_n^2I=
\begin{bmatrix}5/4&1\\1&9/4\end{bmatrix},\qquad
(K+\sigma_n^2I)^{-1}=
\frac1{29}\begin{bmatrix}36&-16\\-16&20\end{bmatrix}.
$$

At $x_*=1/2$, $k_*=(1,3/2)^T$ and $k_{**}=5/4$. The posterior latent mean is

$$
k_*^T(K+\sigma_n^2I)^{-1}y
=(1,3/2)\begin{bmatrix}4/29\\24/29\end{bmatrix}
=40/29\approx1.379.
$$

The latent variance is

$$
5/4-k_*^T(K+\sigma_n^2I)^{-1}k_*
=5/4-33/29=13/116\approx0.112.
$$

For a future noisy observation, add $1/4$, giving variance
$42/116\approx0.362$. Separating latent uncertainty from observation noise is
essential: they answer different questions.

## Formal treatment

Let training covariance be $K=K(X,X)$, cross-covariance
$K_*=K(X,X_*)$, and test covariance $K_{**}=K(X_*,X_*)$. With zero mean and
Gaussian noise,

$$
\begin{bmatrix}y\\f_*\end{bmatrix}\sim\mathcal N\left(
0,\begin{bmatrix}K+\sigma_n^2I&K_*\\K_*^T&K_{**}\end{bmatrix}\right).
$$

Conditioning gives

$$
\mathbb E[f_*\mid y]=K_*^T(K+\sigma_n^2I)^{-1}y,
$$

$$
\operatorname{Cov}(f_*\mid y)=K_{**}-K_*^T
(K+\sigma_n^2I)^{-1}K_*.
$$

Implementations solve linear systems using a Cholesky factorization; forming the
inverse explicitly is slower and less stable. Exact dense regression costs
$O(n^3)$ time and $O(n^2)$ memory. Kernel hyperparameters are often selected by
maximizing the log marginal likelihood, which balances data fit against a
log-determinant complexity term.

## Assumptions and requirements

The kernel must be positive semidefinite and must encode plausible structure for
the problem. Gaussian regression assumes additive Gaussian noise with the stated
variance. Inputs and outputs require consistent units and preprocessing; mean
functions matter when extrapolation should not revert toward zero.

Hyperparameter optimization is nonconvex and can have local optima, so one
optimizer run is not a guarantee. Numerical conditioning may require a small
diagonal jitter distinct from modeled observation noise. Validation must respect
groups, time, and any preprocessing pipeline.

The usual zero-mean presentation is a convenience, not a claim that observed
responses average to zero everywhere. Centering targets can make it reasonable
inside the observed region, but a scientifically known trend belongs in the
mean function. Repeated or nearly repeated inputs also need care: their
covariance rows can be nearly identical, and the noise model determines whether
apparently conflicting observations are plausible measurements or evidence that
the model is wrong.

## Uses and applicability

Use exact GPs for small or medium data when calibrated uncertainty, smooth
interpolation, active sampling, or scientifically meaningful covariance design
matters. They are natural in spatial modeling, surrogate optimization, and
low-data regression.

Avoid an exact dense GP at sample sizes that make cubic fitting or quadratic
storage unacceptable. Avoid it when no defensible kernel or likelihood is
available, or when abrupt regime changes contradict the chosen prior. Large
neural or tree models may be better when prediction dominates uncertainty
quality and data are abundant.

For decision-making, inspect both posterior mean and uncertainty under the
actual loss. Choosing the point with the largest mean, the largest variance, or
the largest probability of exceeding a threshold are different policies. The GP
supplies a joint predictive distribution; the application must still say how
that distribution becomes an action.

## Limitations and common mistakes

The main computational bottleneck is covariance linear algebra. Misspecified
kernels and likelihoods yield misspecified uncertainty. Extrapolation follows
the prior mean and covariance, not a generic law of nature, and marginal-
likelihood estimates do not integrate over hyperparameter uncertainty.

Common mistakes include inverting $K$ explicitly, confusing latent variance with
future-observation variance, treating jitter as estimated noise, optimizing
hyperparameters on test data, and interpreting a credible interval as a
frequentist coverage guarantee under arbitrary misspecification.

## Variants and alternatives

GP classification uses a non-Gaussian likelihood and approximate inference.
Sparse inducing-point methods reduce computation by summarizing the process with
a smaller set of variables. Structured kernels add or multiply components for
trends, periodicity, and interactions. Bayesian linear regression is a finite-
feature GP; random-feature methods approximate stationary kernels explicitly.

## History and attribution

Rasmussen and Williams provide the registered book-length account used here,
including the function-space definition, regression equations, covariance
design, and connections to earlier spatial and Bayesian models. This page limits
historical attribution to that supported account rather than asserting a single
inventor of the broad stochastic-process construction.

## Sources

- Rasmussen and Williams' _Gaussian Processes for Machine Learning_ supports all
  core definitions, regression equations, kernel design, computation, and the
  historical framing used here.
- _Probabilistic Machine Learning_ supports the conditioning view, likelihood
  extensions, and scalable approximations.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md),
[Bayesian Inference](./bayesian-inference.md), and
[Kernel Methods](./kernel-methods.md). [Matrix Decompositions](./matrix-decompositions.md)
explains the stable solves. Compare [Linear Regression](./linear-regression.md)
for a finite parametric model and [k-Nearest Neighbors](./k-nearest-neighbors.md)
for local prediction without a global probabilistic prior.
