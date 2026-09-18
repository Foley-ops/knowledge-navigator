---
concept_id: concept.deep_learning.variational_autoencoders
title: Variational Autoencoders
slug: /concepts/variational-autoencoders
aliases:
  - VAE
kind: method
tier: 1
review_state: generated-draft
summary: A deep latent-variable generative model trained by maximising a lower bound on the data log-likelihood, using a neural network to amortise posterior inference and a change of variables that makes the bound differentiable.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.optimization.variational_methods
    note: The training objective is an evidence lower bound, and a reader who has not seen a variational bound cannot follow why maximising it is a sensible substitute for maximising the likelihood.
  - type: specializes
    target: concept.deep_learning.autoencoders
    note: It keeps the encoder-decoder shape but replaces the deterministic code with a distribution and the reconstruction error with a bound on log-likelihood, which is what turns it into a generative model.
  - type: contrasts_with
    target: concept.deep_learning.generative_adversarial_networks
    note: Both learn a decoder that maps noise to data, but one maximises a likelihood bound and gets an inference network for free while the other optimises an adversarial game and gets neither likelihood nor encoder.
  - type: contributes_to
    target: concept.deep_learning.diffusion_models
    note: A diffusion model can be written as a hierarchical variational autoencoder whose encoder is fixed rather than learned, so its training objective is derived the same way.
sources:
  - source_id: source.kingma2014.auto_encoding_variational_bayes
    title: Auto-Encoding Variational Bayes
    url: https://arxiv.org/abs/1312.6114
    source_kind: preprint
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.rezende2015.normalizing_flows
    title: Variational Inference with Normalizing Flows
    url: https://arxiv.org/abs/1505.05770
    source_kind: preprint
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary papers for posterior collapse and the named VAE variants (KL annealing, free bits, beta-VAE, IWAE, VQ-VAE)
    reason: The registry has no primary source for these specific fixes and variants; the textbook citations cover the phenomenon and the family, but not the individual papers that introduced each remedy.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
---

## Definition

A **variational autoencoder** is a latent-variable model

$$
p_\theta(x) \;=\; \int p_\theta(x \mid z)\, p(z)\, \mathrm{d}z ,
$$

in which the prior $p(z)$ is fixed and simple (conventionally $\mathcal{N}(0, I)$),
the conditional $p_\theta(x \mid z)$ — the **decoder** — is a neural network
emitting the parameters of a simple distribution over $x$, and the intractable
posterior $p_\theta(z \mid x)$ is approximated by a second network
$q_\phi(z \mid x)$ — the **encoder**, or inference network. Both networks are
trained together by maximising a single objective, the evidence lower bound, with
ordinary stochastic gradient ascent.

Two ideas make this work: _amortisation_, one network computing an approximate
posterior for every $x$ rather than an optimisation per data point, and the
_reparameterisation trick_, which makes the sampled latent differentiable in
$\phi$.

## Why it matters

Before 2013 you could fit a deep generative model with a tractable likelihood, or
a flexible latent-variable model by slow per-datapoint inference, but not both.
The VAE made deep latent-variable models trainable at the speed of
backpropagation: one forward pass gives an approximate posterior, one sample gives
an unbiased gradient, and the whole thing fits in a minibatch loop.

What you get is a model that both generates (sample $z \sim p(z)$, decode) and
infers (encode $x$ to a distribution over causes), plus a bound comparable across
checkpoints of the same model. That is why VAEs remain the workhorse component for
latent-space methods: the compression stage in latent diffusion, the discrete
tokeniser in image and audio codecs.

## Intuition

Picture an autoencoder whose bottleneck has been made noisy on purpose. The
encoder no longer names a point in latent space; it names a small blob. Because
the decoder must reconstruct $x$ from _anywhere in that blob_, nearby codes decode
to similar things and the latent space fills in rather than memorising isolated
points. The KL term keeps the blobs from shrinking to points and from drifting
apart; the reconstruction term pushes them apart so they can be told from one
another. Training is that tug of war.

The analogy breaks in one place worth naming: a VAE is not "an autoencoder with
noise added for regularisation". The objective is a bound on $\log p_\theta(x)$
and every term in it is fixed by the prior and the likelihood, so you do not get
to down-weight the KL and still call the result a bound.

## Concrete example

Take a two-dimensional latent and one image $x$ for which the encoder outputs
$\mu = (0.8, -0.3)$ and $\sigma = (0.5, 1.2)$. The KL against $\mathcal{N}(0, I)$
is analytic:

$$
D_{\mathrm{KL}} = \tfrac{1}{2} \sum_{j=1}^{K}\big(\mu_j^2 + \sigma_j^2 - 1 - \log \sigma_j^2\big)
$$

which here is $\tfrac{1}{2}[(0.64 + 0.25 - 1 + 1.386) + (0.09 + 1.44 - 1 - 0.365)]
= 0.721$ nats. The second coordinate costs almost nothing ($0.083$ nats): it is
nearly the prior and carries nearly no information about this image. The first
costs $0.638$ nats — the price of telling this image apart from the others.

In code, the whole objective for a Bernoulli decoder is six lines:

```python
import torch
import torch.nn.functional as F

def reparameterise(mu, logvar):
    std = torch.exp(0.5 * logvar)
    return mu + std * torch.randn_like(std)      # z is differentiable in mu, logvar

def negative_elbo(x, x_logits, mu, logvar):
    # x: (B, D) in [0, 1]; x_logits: decoder output; mu, logvar: (B, K)
    recon = F.binary_cross_entropy_with_logits(x_logits, x, reduction="none").sum(-1)
    kl = 0.5 * (mu.pow(2) + logvar.exp() - 1.0 - logvar).sum(-1)
    return (recon + kl).mean()                   # nats per example, an upper bound on NLL
```

Predicting `logvar` rather than $\sigma$ is an implementation convention, not part
of the model: it keeps the variance positive without a clamp.

## Formal treatment

For any distribution $q_\phi(z \mid x)$ whose support is contained in that of
$p_\theta(z \mid x)$,

$$
\log p_\theta(x) = \mathbb{E}_{q_\phi(z \mid x)}\!\left[\log \frac{p_\theta(x, z)}{q_\phi(z \mid x)}\right] + D_{\mathrm{KL}}\big(q_\phi(z \mid x) \,\|\, p_\theta(z \mid x)\big).
$$

The first term is the **evidence lower bound** $\mathcal{L}(\theta, \phi; x)$. The
identity is exact, so the gap between the bound and the log-likelihood is
_precisely_ the KL from the approximate posterior to the true one — not a residual,
not an approximation error of unknown sign. Since KL is non-negative,
$\mathcal{L} \le \log p_\theta(x)$, with equality only when
$q_\phi(z \mid x) = p_\theta(z \mid x)$. Rearranged,

$$
\mathcal{L}(\theta, \phi; x) = \mathbb{E}_{q_\phi(z \mid x)}[\log p_\theta(x \mid z)] - D_{\mathrm{KL}}\big(q_\phi(z \mid x) \,\|\, p(z)\big),
$$

the reconstruction and regularisation terms of the code above.

Gradients in $\theta$ are easy: the expectation does not depend on $\theta$, so one
Monte Carlo sample suffices. Gradients in $\phi$ are the problem, because the
_measure_ depends on $\phi$ and $\nabla_\phi \mathbb{E}_{q_\phi}[f(z)]$ is not
$\mathbb{E}_{q_\phi}[\nabla_\phi f(z)]$. The score-function estimator
$\mathbb{E}_{q_\phi}[f(z)\nabla_\phi \log q_\phi(z \mid x)]$ is unbiased but its
variance is usually too large to train with.

The **reparameterisation trick** removes the dependence from the measure. Write
$z = g_\phi(\varepsilon, x) = \mu_\phi(x) + \sigma_\phi(x) \odot \varepsilon$ with
$\varepsilon \sim \mathcal{N}(0, I)$. Then

$$
\nabla_\phi \mathbb{E}_{q_\phi(z\mid x)}[f(z)] = \mathbb{E}_{\varepsilon}\big[\nabla_\phi f(g_\phi(\varepsilon, x))\big],
$$

a pathwise derivative estimator whose variance is small enough that a single
sample per data point trains the model.

## Assumptions and requirements

The trick requires a latent that can be written as a fixed base sample pushed
through a $\phi$-differentiable map — location-scale families qualify, discrete
latents do not, and with discrete $z$ you need a score-function estimator with
control variates or a continuous relaxation.

The bound is only as good as the variational family. A diagonal-Gaussian $q_\phi$
cannot represent a correlated or multimodal posterior, so the gap stays open
however long you train; amortisation adds a second gap, since one network must
output a good posterior for every $x$ at once. Flows applied to the Gaussian
sample narrow the first gap at the cost of a Jacobian determinant per layer.

The likelihood $p_\theta(x \mid z)$ must be a real, normalised density: the
"reconstruction loss" is $-\log p_\theta(x \mid z)$, and its scale relative to the
KL is fixed by that choice, not free. A Gaussian decoder with a freely learned
per-pixel variance is degenerate — the bound diverges as the variance on a
perfectly reconstructed pixel shrinks — which is why fixed or global variances are
the norm. Applying a Bernoulli likelihood to non-binary pixel intensities, as much
VAE code does, is a convention that works, not a correct likelihood.

## Uses and applicability

Reach for a VAE when you want a _learned latent space_ as much as samples:
representation learning with an explicit density, semi-supervised learning,
interpolation and attribute arithmetic, anomaly detection, or a compact code some
other model will operate in. It also gives a per-example likelihood bound for
model comparison, though a loose one. Do not reach for it when photorealistic
samples are the only goal — diffusion models and GANs are better — or when you
need exact likelihoods, which flows and autoregressive models provide and this
does not.

## Limitations and common mistakes

**Posterior collapse** is the characteristic failure. The optimiser finds
$q_\phi(z \mid x) \approx p(z)$ for all $x$, the KL term goes to zero, and the
decoder generates without using $z$ at all. It is not a bug in the code but an
optimum of the objective — a _global_ optimum whenever the decoder can model
$p(x)$ on its own, since latent information costs KL nats a self-sufficient
decoder need not pay. It is worst with autoregressive decoders, which is why text
VAEs collapse so readily. The usual mitigations — annealing the KL weight from
zero, a "free bits" budget below which the KL is not penalised, or deliberately
weakening the decoder — the first two work by changing the objective, the third
by restricting the model.

**Blurry samples** are the other well-known complaint: with comparable
convolutional decoders, VAE image samples are visibly blurrier than GAN samples.
The usual explanation is the likelihood term — a factorised Gaussian decoder is
scored by squared error, and the optimal prediction under residual ambiguity is a
conditional mean, which is a blur. Treat that as an argument, not a theorem. It is
undercut by hierarchical VAEs, VAEs with autoregressive decoders, and diffusion
models (whose objective is derived from an ELBO of this kind) all producing sharp
samples. The blur appears to belong to a particular decoder family rather than to the ELBO,
and the question is not fully settled.

Two smaller mistakes. Reporting the ELBO as "the likelihood": it is a lower bound
of unknown tightness. And treating the latent space as calibrated — the
_aggregate_ posterior $q_\phi(z) = \mathbb{E}_{x}[q_\phi(z \mid x)]$ generally
does not match the prior, so prior samples can land where the decoder never
trained. That mismatch, not the architecture, is often why unconditional samples
are worse than reconstructions.

## Variants and alternatives

**β-VAE** scales the KL term by $\beta$ to trade reconstruction against latent
compression; for $\beta \ge 1$ the objective is still a valid but looser bound on
$\log p_\theta(x)$, and for $\beta < 1$ it is not a bound at all. **IWAE** averages
$K$ importance weights inside the logarithm for a strictly tighter bound, at $K$
times the decoder cost and with weaker encoder gradients. **VQ-VAE** replaces the
continuous latent with a discrete codebook, sidestepping posterior collapse and
producing the token sequences autoregressive and diffusion priors then model.
**Hierarchical VAEs** stack many stochastic layers and close most of the
sample-quality gap. **Normalizing-flow posteriors** keep the architecture and
enrich $q_\phi$.

The genuine competitors: GANs (sharper samples, no likelihood, no encoder, harder
optimisation), normalizing flows (exact likelihood, but invertibility forces the
latent to match the data's dimension), autoregressive models (exact likelihood,
slow sampling, no compact latent), and diffusion models (best image sample
quality, many decoder evaluations per sample).

## History and attribution

Kingma and Welling introduced the estimator and the model in _Auto-Encoding
Variational Bayes_ in late 2013, published at ICLR 2014. Their stated problem was
not image generation but approximate posterior inference in directed
continuous-latent models on datasets too large for MCMC or per-datapoint
variational optimisation. Rezende, Mohamed and Wierstra arrived at essentially the
same estimator independently and at almost the same time, working on deep latent
Gaussian models; the two lines are usually credited together.

Neither piece was new in isolation. Amortising inference with a recognition
network goes back to the Helmholtz machine and wake-sleep in the mid-1990s, and
the pathwise derivative identity was long known in the simulation and
stochastic-optimisation literature. What was new was putting them together with a
deep decoder and a minibatch optimiser.

## Sources

_Auto-Encoding Variational Bayes_ is the primary source for the bound, the
estimator and the analytic Gaussian KL used in the worked example, and it states
the inference problem the authors were solving. The _Deep Learning_ book's chapter
on deep generative models gives the textbook framing, the comparison with GANs,
the blurriness discussion with its admission that the cause is not established,
and the Helmholtz-machine prehistory. Murphy's _Probabilistic Machine Learning_
covers posterior collapse, the amortisation gap and the named variants.
_Variational Inference with Normalizing Flows_ is the reference for why a
diagonal-Gaussian posterior is the binding constraint.

## Prerequisites and next connections

Read [Variational Methods](./variational-methods.md) first — the ELBO is that
page's central object. [Bayesian Inference](./bayesian-inference.md) supplies the
prior, posterior and marginal likelihood the derivation manipulates, and
[Backpropagation](./backpropagation.md) with
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) make the
reparameterised gradient usable.

From here, [Principal Component Analysis](./principal-component-analysis.md) is
worth revisiting: a VAE with a linear decoder and Gaussian likelihood recovers the
principal subspace, so the nonlinearity is what the deep version buys.
[Regularization](./regularization.md) is a useful contrast — the KL term looks
like a regulariser but is derived, not added.
