---
concept_id: concept.optimization.variational_methods
title: Variational Methods
slug: /concepts/variational-methods
aliases:
  - variational inference
  - evidence lower bound
kind: method
tier: 1
review_state: generated-draft
summary: A family of techniques that replaces an intractable quantity with the optimum of a functional over a restricted family of candidates, trading exactness for an optimisation problem that can actually be solved.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: requires
    target: concept.probability.bayesian_inference
    note: The evidence lower bound is defined against a posterior and a marginal likelihood, so a reader who does not already have those objects cannot read the central derivation.
  - type: specializes
    target: concept.analysis.calculus_of_variations
    note: Variational methods take the general apparatus of stationarity over a function space and restrict the search to a parameterised or factorised family chosen for tractability.
  - type: contrasts_with
    target: concept.optimization.convex_optimization
    note: Turning inference into optimisation does not import convex guarantees — the evidence lower bound is concave in each mean-field factor with the others held fixed, so each block update is a convex problem, but it is not jointly concave in the tuple of factors, because the product parameterisation is multilinear and the mean-field family is not a convex set.
  - type: contributes_to
    target: concept.optimization.stochastic_optimization
    note: Maximising the bound on large data sets is done by stochastic gradient ascent on Monte Carlo estimates, and the search for low-variance estimators of the gradient of an expectation came largely from this setting.
sources:
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kingma2014.auto_encoding_variational_bayes
    title: Auto-Encoding Variational Bayes
    url: https://arxiv.org/abs/1312.6114
    source_kind: preprint
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: The variational principle in quantum mechanics and the Rayleigh-Ritz bound on ground-state energy
    reason: No source in the registry covers quantum mechanics or the Rayleigh-Ritz technique, so the statement that the Rayleigh quotient upper-bounds the ground-state energy is given here without a citation that supports it.
    sections:
      - uses-and-applicability
  - label: The 1990s development of variational inference for graphical models, including Hinton and van Camp's ensemble learning and the Jordan-Ghahramani-Jaakkola-Saul introduction
    reason: The registry has no source covering the history of variational methods in machine learning before the variational autoencoder, so these attributions are stated only at the level this page is confident of and are not cited.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Variational methods** obtain a quantity by exhibiting it as the optimum of a
functional — a real-valued map defined on a space of functions or probability
distributions — and then optimising that functional, exactly when possible and
over a restricted family when not. Two separable moves are involved. The
_variational principle_ asserts that the object of interest is a stationary
point of some functional $J$: a classical trajectory extremises the action, the
harmonic function on a domain minimises Dirichlet energy, the posterior
minimises a free energy. The _variational approximation_ then replaces the
search over all admissible arguments with a search over a tractable subset
$\mathcal{Q}$, and returns the best member of $\mathcal{Q}$ rather than the
true optimiser.

## Why it matters

The second move is what makes the family indispensable in statistics and
machine learning. Bayesian inference requires the marginal likelihood
$p(x) = \int p(x, z)\,dz$, an integral over everything unobserved, and for
almost any interesting model that integral has no closed form and no cheap
numerical route. Variational inference converts it into a maximisation whose
objective is a computable expectation, and optimisation is the thing modern
hardware and automatic differentiation are good at: stochastic gradients,
minibatches, and a scalar you can watch increase. The price is a bias that does
not vanish with more computation. Markov chain Monte Carlo is asymptotically
exact and practically uncertifiable; variational inference is practically
convergent and permanently wrong by an amount that is never exactly
computable — importance-weighted bounds and related diagnostics can estimate it,
but it is routinely left unmeasured.

## Intuition

The picture to carry is a floor under a ceiling you cannot see. The log
evidence $\log p(x)$ is a number you want and cannot compute. Any candidate
distribution $q$ over the latent variables gives a floor beneath it, and the
height of the gap between floor and ceiling is exactly the Kullback-Leibler
divergence from $q$ to the true posterior. Raising the floor closes the gap.
You learn that the ceiling is at least this high; you never learn exactly how
much higher it is, because computing the gap would require the very quantity you
could not compute.

The analogy fails in one important way. In a variational autoencoder the model
parameters are trained too, so the ceiling moves while the floor rises, and an
increase in the objective can come from either. That ambiguity is not a
technicality; it is the reason the objective cannot be read as a measure of
approximation quality.

## Concrete example

Take a centred bivariate Gaussian target with unit variances and correlation
$\rho$,

$$
p(z) = \mathcal{N}\!\left(0, \begin{bmatrix} 1 & \rho \\ \rho & 1\end{bmatrix}\right),
\qquad
\Lambda = \Sigma^{-1} = \frac{1}{1-\rho^{2}}\begin{bmatrix} 1 & -\rho \\ -\rho & 1\end{bmatrix},
$$

and approximate it by a product $q(z) = q_1(z_1)q_2(z_2)$. The mean-field
update makes $\log q_1(z_1)$ equal to $\mathbb{E}_{q_2}[\log p(z)]$ up to a
constant, which gives a Gaussian with variance $1/\Lambda_{11} = 1 - \rho^{2}$
and mean $-\Lambda_{12}\,\mathbb{E}_{q_2}[z_2]/\Lambda_{11} = 0$. Each factor
reproduces the _conditional_ variance of the target, not the marginal one.

With $\rho = 0.9$ the true marginal variance of $z_1$ is $1$ and the fitted
variance is $0.19$: a standard deviation of $0.436$ against $1$, so a nominal
$95\%$ interval is shrunk by more than half. The residual divergence is
$\mathrm{KL}(q \,\|\, p) = -\tfrac12\log(1-\rho^{2}) = 0.83$ nats, which for
this Gaussian case is exactly the mutual information between $z_1$ and $z_2$
under $p$ — the dependence the factorisation refused to represent. More
iterations do not help; the fixed point is the exact optimum of the objective
over product distributions.

## Formal treatment

Let $x$ be observed, $z$ latent, and $q$ any density on $z$ absolutely
continuous with respect to the posterior. Then

$$
\log p_\theta(x) \;=\; \underbrace{\mathbb{E}_{q}\!\left[\log p_\theta(x, z) - \log q(z)\right]}_{\mathcal{L}(q, \theta)} \;+\; \mathrm{KL}\!\left(q(z)\,\|\,p_\theta(z \mid x)\right).
$$

This is an identity, not a bound: multiply out $\log p_\theta(x,z) = \log
p_\theta(z\mid x) + \log p_\theta(x)$ inside the expectation. Because the
divergence is non-negative and vanishes only when $q = p_\theta(z \mid x)$
almost everywhere, $\mathcal{L}(q,\theta)$ — the **evidence lower bound** — is
a lower bound on $\log p_\theta(x)$ whose slack is precisely that divergence.
Maximising $\mathcal{L}$ over $q \in \mathcal{Q}$ is therefore identical to
minimising $\mathrm{KL}(q \,\|\, p_\theta(z\mid x))$ over $\mathcal{Q}$.

Under the **mean-field** restriction $q(z) = \prod_{j} q_j(z_j)$, a functional
derivative with a normalisation multiplier gives the coordinate-ascent update

$$
\log q_j^{\star}(z_j) \;=\; \mathbb{E}_{q_{-j}}\!\left[\log p(x, z)\right] + \text{const},
$$

cycled over $j$; each step is exact in its block and the bound increases
monotonically. In a variational autoencoder $\mathcal{Q}$ is instead a
parametric family $q_\phi(z \mid x)$ produced by a network, and the bound is
written per datapoint as
$\mathbb{E}_{q_\phi}[\log p_\theta(x \mid z)] - \mathrm{KL}(q_\phi(z\mid x)\,\|\,p(z))$.
Gradients in $\phi$ come from the reparameterisation
$z = \mu_\phi(x) + \sigma_\phi(x) \odot \epsilon$ with
$\epsilon \sim \mathcal{N}(0, I)$, which moves the parameters out of the
sampling distribution so that $\nabla_\phi$ passes through the expectation.

## Assumptions and requirements

The identity above needs $q \ll p_\theta(\cdot \mid x)$; if $q$ places mass
where the posterior has none the divergence is infinite and the bound is
vacuous, which is why a Gaussian $q$ is put on an unconstrained
reparameterisation of a positive or simplex-valued latent rather than on the
latent itself. The expectations must exist. Closed-form mean-field updates
require conditional conjugacy — each complete conditional in an exponential
family with computable expected sufficient statistics — and models without it
need black-box estimators instead. The reparameterisation gradient requires a
differentiable map from parameter-free noise to $z$, which discrete latents do
not admit, and requires dominated convergence to exchange differentiation with
expectation. On the classical side, an Euler-Lagrange equation requires enough
smoothness and admissible variations vanishing on the boundary, and delivers
only stationarity: existence of a minimiser is a separate argument requiring
coercivity and lower semicontinuity.

## Uses and applicability

Reach for variational inference when the latent space is large, the data set is
large, the model has conditional conjugacy or a differentiable
reparameterisation, and a point-plus-uncertainty answer is wanted quickly: topic
models, large hierarchical models, deep generative models. The bound doubles as
a training objective, which is why it sits inside variational autoencoders and
the diffusion-model objective rather than beside them. Outside inference, the
same principle underlies the finite element method, where a PDE is solved by
minimising an energy over a finite-dimensional space of basis functions, and
the Rayleigh-Ritz bound in quantum mechanics, where any normalised trial
wavefunction gives an upper bound on the ground-state energy.

Do not reach for it when calibrated uncertainty is the deliverable, when the
posterior is low-dimensional enough for Monte Carlo or quadrature, or when the
posterior is multimodal and losing a mode changes the conclusion.

## Limitations and common mistakes

The largest mistake is treating a high bound as evidence of a good posterior
approximation. It is not, and the identity says why: the bound is the evidence
minus the gap, and with $\theta$ free an increase can come from either term. Two
models cannot be ordered by their bounds either, since a lower bound on a larger
number can be the smaller of the two.

The second is forgetting that the direction of the divergence is chosen for
convenience and has consequences. Minimising $\mathrm{KL}(q\|p)$ is zero-forcing:
$q$ is penalised for placing mass where $p$ has little, not for missing mass $p$
has. Mean-field approximations therefore typically underestimate posterior
variance — provably so in the Gaussian case, as the worked example shows
exactly, though under-dispersion is a strong tendency rather than a theorem for
general models — and on a multimodal posterior a unimodal $q$ typically locks
onto one mode.
Posterior credible intervals from mean-field variational inference are usually
too narrow, and the relative error does not shrink with more data or more
iterations: it is a property of the family and the divergence, not of incomplete
convergence.

Third, the objective is generally non-convex in the variational parameters, so
coordinate ascent converges to a local optimum that depends on initialisation;
mixture models exhibit this plainly through label switching. Fourth, the
"variational" in variational autoencoder does not mean free-form optimisation
over all densities — the family is a fixed parametric one, and an extra
_amortisation_ gap opens between the best member of that family and what the
inference network actually outputs for a given $x$.

## Variants and alternatives

Within the family: **structured mean field** keeps some dependencies (a chain, a
tree) and buys accuracy for tractability; **stochastic variational inference**
subsamples data and uses natural gradients; **black-box variational inference**
uses score-function gradient estimates with control variates when no
reparameterisation exists; **normalising flows** replace the factorised $q$ with
an invertible transformation of a simple base density; importance-weighted
bounds tighten the objective with $k$ samples at linear cost. Alternative
divergences change the failure mode rather than remove it: expectation
propagation matches moments and over-disperses instead of under-dispersing.
Outside the family, MCMC is asymptotically exact and slower with no bound to
monitor; the Laplace approximation is cheaper and purely local; nested sampling
targets the evidence directly.

## History and attribution

The classical thread begins with Johann Bernoulli's brachistochrone problem of
1696, is systematised by Euler in 1744 and by Lagrange, whose method of
variations Euler named, and becomes a principle of physics with Hamilton's
formulation of least action in the 1830s. The mean-field approximation comes
from statistical physics, where the free energy of an interacting system is
bounded by that of a non-interacting one. These two lines met statistics in the
1990s, when variational approximations were developed for neural networks and
graphical models. The scaling to deep generative models is due to Kingma and
Welling's auto-encoding variational Bayes, with the same reparameterised
estimator arriving independently in stochastic backpropagation work at
essentially the same time — a genuine case of simultaneous discovery.

## Sources

MacKay's chapter on variational free energy is the clearest short account of why
the bound is a bound and what the mean-field approximation costs in variance.
Murphy's book carries the modern machinery: coordinate ascent, stochastic and
black-box variants, amortisation, and the comparison with sampling. Kingma and
Welling's paper is the primary source for the reparameterised estimator and the
amortised inference network. MathWorld is used only for the classical
Euler-Lagrange material and the dates in the historical section.

## Prerequisites and next connections

Read [Bayesian Inference](./bayesian-inference.md) first: without the posterior
and the marginal likelihood the central identity has no referents. The general
machinery of optimising over a function space is
[Calculus of Variations](./calculus-of-variations.md), and the mean-field update
is a functional derivative in exactly that sense.

From here, [Convex Optimization](./convex-optimization.md) says what the block
updates inherit and what the joint problem does not, and the stochastic
optimisation literature covers the gradient estimators that make the bound
trainable at scale. For the measure-theoretic
side of absolute continuity, which decides when the divergence is finite at all,
see [Measure Theory](./measure-theory.md).
