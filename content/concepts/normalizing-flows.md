---
concept_id: concept.deep_learning.normalizing_flows
title: Normalizing Flows
slug: /concepts/normalizing-flows
aliases:
  - invertible generative models
kind: method
tier: 1
review_state: generated-draft
summary: A generative model that builds a complicated density by pushing a simple one through a learned invertible map, so the exact log-likelihood is available as the base log-density minus a Jacobian log-determinant.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: The entire method is the multivariate change-of-variables formula, so a reader needs the Jacobian matrix and its determinant as a local volume factor before anything here parses.
  - type: contrasts_with
    target: concept.deep_learning.variational_autoencoders
    note: Both learn a latent-variable density, but a VAE uses a stochastic non-invertible encoder and optimises a lower bound, whereas a flow buys exact likelihood by forcing the map to be a bijection and the latent space to have the data's dimension.
  - type: contrasts_with
    target: concept.deep_learning.energy_based_models
    note: An energy-based model can use any architecture but leaves the normalising constant intractable; a flow constrains the architecture so that the density is normalised by construction.
  - type: refined_by
    target: concept.deep_learning.flow_matching
    note: Flow matching trains the velocity field of a continuous normalizing flow by regression against a known conditional field, removing the ODE simulation and trace estimation that made maximum-likelihood CNF training expensive.
sources:
  - source_id: source.rezende2015.normalizing_flows
    title: Variational Inference with Normalizing Flows
    url: https://arxiv.org/abs/1505.05770
    source_kind: preprint
    supports:
      - definition
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.chen2018.neural_ode
    title: Neural Ordinary Differential Equations
    url: https://arxiv.org/abs/1806.07366
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kingma2014.auto_encoding_variational_bayes
    title: Auto-Encoding Variational Bayes
    url: https://arxiv.org/abs/1312.6114
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: Likelihood-based out-of-distribution detection failures in deep generative models
    reason: The finding that flows trained on one image dataset can assign systematically higher likelihood to a different dataset is an empirical result from papers the source registry does not list, and no page in this corpus covers it.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **normalizing flow** is a probability density on $\mathbb{R}^D$ defined as the
pushforward of a simple base density through a learned diffeomorphism. Pick a base
distribution $p_Z$ that is easy to sample and evaluate — almost always
$\mathcal{N}(0, I_D)$ — and a parametric map $f_\theta : \mathbb{R}^D \to
\mathbb{R}^D$ that is invertible and differentiable with differentiable inverse.
The model is the law of $x = f_\theta(z)$ for $z \sim p_Z$. Because $f_\theta$ is a
bijection, change of variables gives the density of $x$ in closed form, with no
integral over latents and no normalising constant to estimate.

The name describes the direction of $f_\theta^{-1}$: it _normalizes_ data into the
base distribution, and the composition of many small invertible steps is the
_flow_.

## Why it matters

Most deep generative models give up exact likelihood. A
[variational method](./variational-methods.md) optimises a lower bound because
the marginal $p(x) = \int p(x \mid z) p(z)\,dz$ is intractable; an adversarial
model never writes down a density at all; an energy-based model writes one down
but cannot normalise it. A flow makes $\log p_\theta(x)$ exactly computable and
differentiable, so training is plain maximum likelihood — no bound, no adversary,
no partition function.

That matters wherever the number itself is the product: model comparison,
importance weights, likelihood ratios, and physics applications needing an unbiased
estimator of an expectation rather than pretty samples. It also matters inside
variational inference, the use that named flows in deep learning: a flow applied to a
posterior sample turns a factorised Gaussian into one with correlations and
curvature while keeping the bound's entropy term computable.

## Intuition

Think of the base density as a lump of dough of total mass one and $f_\theta$ as a
kneading of space. Stretching a region spreads the same mass over more volume, so
the density there drops; compressing concentrates it, so the density rises. The
Jacobian determinant is the local volume ratio, and dividing by it is the
bookkeeping that keeps total mass at one.

The analogy breaks in one place: kneading dough can fold it, and a flow cannot. The
map stays a bijection, so the topology of the support is preserved. A Gaussian
base, connected and supported on all of $\mathbb{R}^D$, cannot be mapped onto
genuinely disconnected data — the flow instead stretches thin, high-gradient
bridges between the clusters, and those bridges are where its density is wrong.

## Concrete example

Take $D = 2$, $p_Z = \mathcal{N}(0, I_2)$, and one affine coupling layer that
leaves the first coordinate alone:

$$
x_1 = z_1, \qquad x_2 = z_2 \, e^{s(z_1)} + t(z_1),
\qquad s(z_1) = \tfrac{1}{2} z_1, \quad t(z_1) = z_1^2 .
$$

With $z = (1.0,\, -0.5)$: $s = 0.5$, $t = 1.0$, so
$x = (1.0,\; -0.5 e^{0.5} + 1.0) = (1.0,\; 0.17564)$. The Jacobian is lower
triangular with diagonal $(1, e^{s})$, so $\log|\det J| = s = 0.5$, and

$$
\log p_X(x) = \log p_Z(z) - 0.5 = -2.46288 - 0.5 = -2.96288 .
$$

```python
import numpy as np

def forward(z):                      # z -> x, with log|det J|
    s, t = 0.5 * z[0], z[0] ** 2
    return np.array([z[0], z[1] * np.exp(s) + t]), s

def inverse(x):                      # x -> z, in closed form
    s, t = 0.5 * x[0], x[0] ** 2
    return np.array([x[0], (x[1] - t) * np.exp(-s)])

z = np.array([1.0, -0.5])
x, logdet = forward(z)
log_pz = -np.log(2 * np.pi) - 0.5 * (z @ z)
print(x, log_pz - logdet, inverse(x))   # [1. 0.17564] -2.96288 [1. -0.5]
```

Note what the code shows: $s$ and $t$ may be arbitrarily complicated networks,
because the inverse solves for $z_2$ algebraically and never inverts them. That is
the whole trick of a coupling layer.

## Formal treatment

Let $f_\theta$ be a diffeomorphism and $z = f_\theta^{-1}(x)$. The change of
variables gives

$$
p_X(x) \;=\; p_Z\!\left(f_\theta^{-1}(x)\right)
\left| \det \frac{\partial f_\theta^{-1}}{\partial x}(x) \right|,
\qquad
\log p_X(x) \;=\; \log p_Z(z) \;-\; \log\left| \det \frac{\partial f_\theta}{\partial z}(z) \right| .
$$

Flows are built by composing $K$ simple maps, $f_\theta = f_K \circ \cdots \circ
f_1$, with $z_k = f_k(z_{k-1})$ and $z_0 = z$. Determinants multiply, so
log-determinants add:

$$
\log p_X(x) \;=\; \log p_Z(z_0) \;-\; \sum_{k=1}^{K}
\log\left| \det \frac{\partial f_k}{\partial z_{k-1}} \right| .
$$

The design problem is that a general $D \times D$ determinant costs $O(D^3)$,
fatal for $D$ in the thousands, and every flow architecture is an answer to it.
**Coupling layers** split $z$ into $(z_{1:d}, z_{d+1:D})$, copy the first block
through, and transform the second elementwise with parameters computed from the
first; the Jacobian is block triangular and $\log|\det J| = \sum_{j>d} s_j(z_{1:d})$,
an $O(D)$ sum. **Autoregressive flows** use $x_i = \mu_i(x_{<i}) + \sigma_i(x_{<i})
z_i$, whose Jacobian is triangular with diagonal $\sigma_i$, so again
$\log|\det J| = \sum_i \log \sigma_i$. **Planar flows**, Rezende and Mohamed's own
form, use a rank-one update $f(z) = z + u\, h(w^\top z + b)$ and the matrix
determinant lemma: $|\det J| = |1 + h'(w^\top z + b)\, u^\top w|$.

**Continuous normalizing flows** replace the composition by an ODE,
$\dot z(t) = g_\theta(z(t), t)$. Chen et al. prove an _instantaneous change of
variables_: along a trajectory,

$$
\frac{\partial \log p(z(t))}{\partial t}
= -\operatorname{tr}\!\left( \frac{\partial g_\theta}{\partial z(t)} \right),
\qquad
\log p(z(t_1)) = \log p(z(t_0)) - \int_{t_0}^{t_1}
\operatorname{tr}\!\left( \frac{\partial g_\theta}{\partial z(t)} \right) dt .
$$

A **trace**, not a determinant — so $g_\theta$ needs no structural constraint at
all, and the trace can be estimated unbiasedly by Hutchinson's identity
$\operatorname{tr}(A) = \mathbb{E}_v[v^\top A v]$, valid for any $v$ with
$\mathbb{E}[v v^\top] = I$, with one vector-Jacobian product.
Invertibility comes free from uniqueness of ODE solutions when $g_\theta$ is
Lipschitz in $z$; the cost has moved into solving the ODE.

## Assumptions and requirements

The map must be a bijection of $\mathbb{R}^D$ onto itself, which forces
**dimension preservation**: latent and data space have the same $D$. There is no
bottleneck and no compression; this is structural, not an implementation choice.

The data must have a density with respect to Lebesgue measure on $\mathbb{R}^D$.
Two common cases violate this. Discrete data — 8-bit pixels — must be
_dequantized_, usually by adding uniform noise on $[0,1)$, which turns the
objective into a lower bound on the discrete log-likelihood. Data concentrated on a
lower-dimensional manifold has no such density at all: maximum likelihood is then
unbounded above, and the loss can improve without limit while the model collapses
volume onto the manifold.

The inverse must also be _numerically_ usable: an affine coupling with large $s$ is
invertible in exact arithmetic but ill-conditioned in float32, and residual flows
are guaranteed invertible only when a Lipschitz constraint below one is enforced. A Gaussian
base is a convention, not a requirement — a heavy-tailed base changes what tails
the model can express.

## Uses and applicability

Reach for a flow when you need a calibrated density value and not just samples:
simulation-based inference, importance sampling and MCMC proposals, and sampling
from Boltzmann distributions in molecular and lattice physics, where exact
likelihood turns biased samples into unbiased estimates by reweighting. Reach for
one as a flexible variational posterior — the use Rezende and Mohamed introduced —
because the entropy of the transformed distribution stays computable.

Choose the orientation by which direction must be fast: the masked autoregressive
form evaluates density in one pass and samples in $D$; the inverse form swaps those
costs, which is why it was used for fast neural speech synthesis.

Do not reach for a flow when you want a low-dimensional representation, when only
perceptual sample quality matters, or when the data are discrete with no natural
dequantization; diffusion and autoregressive models have dominated those regimes.

## Limitations and common mistakes

The first misconception is that the log-determinant term is an approximation. It
is exact. The approximation lives in the architecture: the constraints that make
the determinant cheap also restrict which diffeomorphisms are reachable, and a
single coupling layer changes only half the coordinates, so depth and permutation
between layers do real work.

The second is confusing exact likelihood with good likelihood. Bits-per-dimension
figures compare only across models using the same dequantization and preprocessing,
and a strong density number can coexist with poor samples. There is also a
well-known and still unsettled phenomenon in which likelihood-based deep generative
models assign higher likelihood to data from a different dataset than to their own
training distribution, making naive likelihood thresholding unreliable for
out-of-distribution detection; the corpus has no source for it, and it is recorded
in this page's unresolved references.

Third, the equal-dimension latent space is not a VAE latent space: its coordinates
carry no compression and are not automatically disentangled.

Fourth, memory: every intermediate activation lives in $\mathbb{R}^D$, so a flow
deep enough to be expressive on images costs far more than an encoder-decoder of
the same nominal size — though invertibility lets activations be recomputed rather
than stored.

## Variants and alternatives

**NICE** uses additive coupling, $x_2 = z_2 + t(z_1)$: volume preserving, so the
log-determinant is zero — free, but unable to move mass around. **RealNVP** adds
the scale term and multi-scale structure; **Glow** adds invertible $1\times1$
convolutions as learned channel permutations. **Masked** and **inverse
autoregressive flows** are the two orientations of the autoregressive design.
**Neural spline flows** replace the affine elementwise transform with a monotone
rational-quadratic spline, buying expressive power per layer. **Residual flows**
get invertibility from a Lipschitz bound and the log-determinant from a truncated
power series. **Continuous flows** drop the constraint entirely and pay in ODE
solves.

The genuine competitors are other families. Autoregressive models also give exact
likelihood — an autoregressive model _is_ a triangular flow — without needing a fast
inverse, at the cost of sequential sampling. VAEs allow a true bottleneck and pay
with a bound. GANs drop likelihood for sample quality. Diffusion models optimise a
bound (or an equivalent score-matching objective) and have empirically produced
better image samples at comparable compute. Flow matching sits closest: it keeps the
continuous-flow model and replaces maximum likelihood with a regression.

## History and attribution

The change-of-variables formula is classical analysis. Its use as a density
estimation method under the name "normalizing flow" is generally credited to Tabak
and Vanden-Eijnden and to Tabak and Turner around 2010–2013. The idea reached deep
learning along two near-simultaneous lines: Dinh, Krueger and Bengio's NICE (2014)
and its successor RealNVP, which built the coupling layer for density estimation;
and Rezende and Mohamed (2015), who introduced flows to enrich variational
posteriors and where the modern deep-learning terminology settled. Kingma et al.
added inverse autoregressive flow in 2016, Papamakarios, Pavlakou and Murray the
masked autoregressive flow in 2017, and Kingma and Dhariwal Glow in 2018. Chen,
Rubanova, Bettencourt and Duvenaud (2018) introduced the instantaneous change of
variables and with it the continuous normalizing flow.

## Sources

Rezende and Mohamed's paper is the primary reference for the definition as deep
learning uses it, for planar and radial flows, and for the variational motivation.
Murphy's _Probabilistic Machine Learning_ is the textbook treatment of the family:
coupling layers, autoregressive flows, the dimension and dequantization
requirements, and the comparison with other generative models. Chen et al.'s neural
ODE paper is the source for the instantaneous change-of-variables theorem and the
trace formulation, and _Auto-Encoding Variational Bayes_ supplies the variational
context flows were built to improve on.

## Prerequisites and next connections

Read [Multivariable Calculus](./multivariable-calculus.md) first: the Jacobian and
its determinant as a local volume factor are the whole mechanism.
[Probability Theory](./probability-theory.md) supplies the transformation of random
variables, and [Measure Theory](./measure-theory.md) explains why "has a density
with respect to Lebesgue measure" is the assumption that fails on manifold data.

From here, [Ordinary Differential Equations](./ordinary-differential-equations.md)
underlies the continuous version, and
[Optimal Transport](./optimal-transport.md) is the natural next idea: it asks which
map to pick among the many that push one distribution onto another, a question
maximum likelihood leaves open.
