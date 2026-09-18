---
concept_id: concept.deep_learning.diffusion_models
title: Diffusion Models
slug: /concepts/diffusion-models
aliases:
  - denoising diffusion probabilistic models
  - DDPM
kind: concept
tier: 1
review_state: generated-draft
summary: A family of generative models that destroy data with a fixed Gaussian noising process and learn to undo it one small step at a time, turning generation into a sequence of denoising regressions.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: specializes
    target: concept.deep_learning.variational_autoencoders
    note: A diffusion model is a deep latent-variable model trained on a variational bound in which the encoder is a fixed Gaussian chain rather than a learned network and the latents keep the dimension of the data.
  - type: contrasts_with
    target: concept.deep_learning.generative_adversarial_networks
    note: Both target high-fidelity sampling, but diffusion replaces the adversarial minimax game with a plain regression loss, buying stability and mode coverage at the price of hundreds of sequential network evaluations per sample.
  - type: contrasts_with
    target: concept.deep_learning.flow_matching
    note: Flow matching regresses a velocity field along a probability path chosen by the designer, and the Gaussian path a diffusion model uses is one such choice, so the two frameworks overlap on the deterministic sampler and differ on how freely the path can be picked.
  - type: requires
    target: concept.probability.stochastic_processes
    note: The forward corruption is a Markov chain whose continuous limit is an Itô diffusion, and the sampler discretises a reverse-time stochastic differential equation, so neither the construction nor its continuous form is readable without those objects.
sources:
  - source_id: source.ho2020.denoising_diffusion
    title: Denoising Diffusion Probabilistic Models
    url: https://arxiv.org/abs/2006.11239
    source_kind: preprint
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.song2021.score_based_sde
    title: Score-Based Generative Modeling through Stochastic Differential Equations
    url: https://arxiv.org/abs/2011.13456
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.kingma2014.auto_encoding_variational_bayes
    title: Auto-Encoding Variational Bayes
    url: https://arxiv.org/abs/1312.6114
    source_kind: preprint
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Song, Meng and Ermon, Denoising Diffusion Implicit Models
    reason: The registry has no entry for DDIM, so the specific non-Markovian construction and the claim that it samples acceptably in tens of steps are uncited here; Song et al. 2021 covers the probability-flow ODE, which is the continuous cousin of the idea, but not DDIM itself.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
  - label: Ho and Salimans, Classifier-Free Diffusion Guidance
    reason: The registry has no entry for classifier-free guidance; the formula and the fidelity-diversity trade-off it produces rest on that paper and on practice, not on any source cited here.
    sections:
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
  - label: Sohl-Dickstein, Weiss, Maheswaranathan and Ganguli, Deep Unsupervised Learning using Nonequilibrium Thermodynamics
    reason: The 2015 paper that introduced diffusion probabilistic models is not in the registry, so the attribution given here rests on how Ho et al. 2020 and Song et al. 2021 describe their own antecedents.
    sections:
      - history-and-attribution
  - label: Diffusion sampler distillation, including progressive distillation and consistency models
    reason: No registry source covers distilling a many-step diffusion sampler into a few-step or one-step model; the distillation source in the registry is about transferring a classifier's soft targets, which is a different construction.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

A **diffusion model** pairs a fixed forward process that adds Gaussian noise to
data with a learned reverse process that removes it. The forward process is a
Markov chain of $T$ steps with no parameters,

$$
q(x_t \mid x_{t-1}) = \mathcal{N}\!\left(x_t;\ \sqrt{1-\beta_t}\,x_{t-1},\ \beta_t I\right),
$$

where $x_0$ is a data point, $\beta_1, \dots, \beta_T \in (0,1)$ is the **noise
schedule**, and $x_T$ is nearly pure noise. Generation runs the learned chain
$p_\theta(x_{t-1} \mid x_t) = \mathcal{N}(x_{t-1}; \mu_\theta(x_t, t), \Sigma_t)$
backwards from $x_T \sim \mathcal{N}(0, I)$. Only the reverse direction is
learned; the forward direction is a design choice fixed before training.

## Why it matters

Diffusion made high-fidelity generative modelling a regression problem. Training
is a mean-squared error against noise you drew yourself: no discriminator to
balance, no invertibility constraint on the architecture, no ordering imposed on
the dimensions. That removed the instability that made adversarial training a
craft, and the same objective scales across image, audio, video and molecular
models; it is the machinery behind modern text-to-image systems.

The bill arrives at sampling time. One sample costs hundreds of sequential
forward passes, which is why so much subsequent work is about paying less.

## Intuition

Drop ink into water and watch it spread. Running that forward is easy and
requires no knowledge of the original shape; running it backwards is the hard
part, and a diffusion model learns exactly that reversal by watching millions of
corruptions. The analogy breaks in one important place: physical diffusion is
irreversible because the reverse is overwhelmingly improbable, whereas here each
step is small enough that reversing it is a well-posed, if uncertain, inference —
the model is not undoing entropy, it is guessing the conditional mean of where
the sample came from.

The second picture is the useful one. A network trained to predict the noise in
$x_t$ is a denoiser, and a denoiser's residual points, up to scale, along
$\nabla_{x} \log p_t(x)$ — the gradient of the log-density of the _blurred_ data
distribution. So the model learns a vector field that points uphill toward data,
at every level of blur, and sampling is a noisy walk up that field, coarse
structure first.

## Concrete example

Ho, Jain and Abbeel's CIFAR-10 model uses $T = 1000$ and $\beta_t$ linear from
$10^{-4}$ to $0.02$. Because the chain is Gaussian, the $t$-step marginal is
closed-form: with $\alpha_t = 1 - \beta_t$ and $\bar\alpha_t = \prod_{s \le t} \alpha_s$,

$$
x_t = \sqrt{\bar\alpha_t}\, x_0 + \sqrt{1 - \bar\alpha_t}\, \epsilon,
\qquad \epsilon \sim \mathcal{N}(0, I).
$$

Under that schedule $\sqrt{\bar\alpha_t}$ is $0.985$ at $t = 50$, $0.812$ at
$t = 200$, $0.280$ at $t = 500$ and $0.0064$ at $t = 1000$. Training needs no
chain at all — jump straight to a random $t$:

```python
import torch

betas = torch.linspace(1e-4, 0.02, 1000)
abar = torch.cumprod(1.0 - betas, dim=0)

def loss(model, x0):                       # x0: (B, C, H, W) in [-1, 1]
    t = torch.randint(0, 1000, (x0.shape[0],), device=x0.device)
    eps = torch.randn_like(x0)
    a = abar.to(x0.device)[t].view(-1, 1, 1, 1)
    xt = a.sqrt() * x0 + (1 - a).sqrt() * eps
    return ((eps - model(xt, t)) ** 2).mean()
```

That loop, with a time-conditioned U-Net, reached FID $3.17$ and Inception Score
$9.46$ on unconditional CIFAR-10 in the original paper — competitive with the
best GANs of the time.

## Formal treatment

The marginal likelihood is intractable, so training maximises a variational
bound, the same construction as in a variational autoencoder but with a fixed
posterior:

$$
\mathbb{E}\!\left[-\log p_\theta(x_0)\right] \le
\mathbb{E}_q\!\left[-\log \frac{p_\theta(x_{0:T})}{q(x_{1:T} \mid x_0)}\right]
= \underbrace{D_{\mathrm{KL}}\!\left(q(x_T | x_0) \,\|\, p(x_T)\right)}_{L_T}
+ \sum_{t>1} L_{t-1} - \underbrace{\log p_\theta(x_0 | x_1)}_{-L_0},
$$

with $L_{t-1} = D_{\mathrm{KL}}\!\left(q(x_{t-1} | x_t, x_0) \,\|\, p_\theta(x_{t-1} | x_t)\right)$.
The key tractability fact is that the forward posterior conditioned on $x_0$ is
Gaussian, $q(x_{t-1} | x_t, x_0) = \mathcal{N}(\tilde\mu_t(x_t, x_0), \tilde\beta_t I)$
with $\tilde\beta_t = \frac{1 - \bar\alpha_{t-1}}{1 - \bar\alpha_t}\beta_t$, so
each $L_{t-1}$ is a closed-form squared difference of means rather than a Monte
Carlo estimate.

Fixing $\Sigma_t = \sigma_t^2 I$ and writing $\mu_\theta$ in terms of a
noise-predicting network,

$$
\mu_\theta(x_t, t) = \frac{1}{\sqrt{\alpha_t}}\left(x_t - \frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,\epsilon_\theta(x_t, t)\right),
$$

turns $L_{t-1}$ into
$\frac{\beta_t^2}{2\sigma_t^2 \alpha_t (1-\bar\alpha_t)}\,\mathbb{E}\|\epsilon - \epsilon_\theta(x_t,t)\|^2$.
The objective people actually train, $L_{\text{simple}} = \mathbb{E}_{t,x_0,\epsilon}\|\epsilon - \epsilon_\theta(x_t,t)\|^2$
with $t$ uniform on $\{1,\dots,T\}$, **drops that weighting factor**. This is the
point most often stated loosely: $L_{\text{simple}}$ is a _reweighted_ variational
bound, not a bound itself. It down-weights the small-$t$ terms, where the
remaining noise is tiny and the task is imperceptible detail, relative to the
large-$t$ terms that set global structure. Ho et al. found the swap costs a
little codelength and buys a great deal of sample quality — FID $3.17$ against
$13.51$ for the same model trained on the full weighted bound.

The continuous-time view replaces the chain with an SDE
$dx = f(x,t)\,dt + g(t)\,dw$; DDPM's schedule is the variance-preserving case
$dx = -\tfrac{1}{2}\beta(t)x\,dt + \sqrt{\beta(t)}\,dw$. Every such diffusion has
a reverse-time SDE

$$
dx = \left[f(x,t) - g(t)^2 \nabla_x \log p_t(x)\right] dt + g(t)\, d\bar w,
$$

and a deterministic **probability-flow ODE** with the same marginals, obtained by
halving the score term and dropping the noise. The learned $\epsilon_\theta$ is a
scaled score estimate, $\nabla_x \log p_t(x) \approx -\epsilon_\theta(x,t)/\sqrt{1-\bar\alpha_t}$,
so "denoising model" and "score model" name the same network.

**Classifier-free guidance** trains one conditional network with the condition
$c$ replaced by a null token on a fraction of examples, then samples with
$\tilde\epsilon = \epsilon_\theta(x_t, \varnothing) + s\left(\epsilon_\theta(x_t, c) - \epsilon_\theta(x_t, \varnothing)\right)$
for a guidance scale $s > 1$. It sharpens conditioning by extrapolating along the
conditional-minus-unconditional direction; it is a heuristic, not sampling from
the model's own posterior.

## Assumptions and requirements

The Gaussian form of $p_\theta(x_{t-1}|x_t)$ is an approximation that is good
only when $\beta_t$ is small: the true reverse conditional $q(x_{t-1}|x_t)$,
unconditioned on $x_0$, is not Gaussian. Take fewer, larger steps with the same
parameterisation and the samples degrade for this reason alone.

The bound also assumes the schedule reaches the prior, $\bar\alpha_T \approx 0$,
so that $L_T$ is negligible and no parameters are needed there. The linear
schedule above leaves $\sqrt{\bar\alpha_T} \approx 0.0064$: a faint but real trace
of the data survives to $t = T$, and a sampler started from pure noise is
therefore starting slightly off-distribution.

The data are assumed continuous. Images are 8-bit, so the $L_0$ term uses a
discretised Gaussian likelihood; discrete or categorical data need a different
forward kernel entirely. Finally, the sampler assumes the score is accurate at
_every_ noise level, including regions the network rarely sees, because an error
at a high noise level is amplified through every subsequent step.

## Uses and applicability

Reach for diffusion when you want high-fidelity samples with broad mode coverage
and can afford the sampling budget, or amortise it offline. It is the default for
images, and strong for audio, video, 3D structure and molecular conformations. It
suits conditional inverse problems — inpainting, super-resolution, deblurring —
particularly well, because a learned prior score composes additively with the
gradient of a measurement likelihood, letting one unconditional model serve many
tasks.

Look elsewhere when latency is hard-bounded and distillation is not on the table,
when you need exact likelihoods rather than bounds, or when the data are discrete
and no adapted variant exists.

## Limitations and common mistakes

Sampling cost is the central drawback: $T$ sequential network evaluations, with
no parallelism across steps. Everything below competes with it.

Four misconceptions recur. First, that $L_{\text{simple}}$ is the ELBO — it is
not, and reported bits-per-dimension figures are bounds obtained under specific
dequantisation conventions, not comparable across papers by default. Second, that
more sampling steps always help; with guidance and a fixed schedule, quality can
plateau or degrade. Third, that guidance is a principled posterior — a large
scale visibly trades diversity and colour fidelity for prompt adherence, and
tuning it is empirical. Fourth, that a model which never stores its training set
cannot reproduce it: diffusion models can and do emit near-copies of duplicated
training images, so memorisation is a real privacy and licensing question rather
than a theoretical curiosity.

## Variants and alternatives

**DDIM** replaces the Markov forward process with a non-Markovian family sharing
the same marginals, yielding a deterministic sampler that reuses DDPM weights
with far fewer steps. Higher-order ODE solvers for the probability flow do the
same job numerically. **Distillation** goes further, training a student to take
in one or a few steps what the teacher takes in many. **Latent diffusion** runs
the whole process in an autoencoder's compressed space, cutting cost by resolution
rather than by step count. Smaller knobs: cosine schedules, learned reverse
variances, and $x_0$- or $v$-prediction instead of $\epsilon$-prediction — the
last of these being reparameterisations of the same model with different implied
loss weightings, the first two genuine changes to the forward process and to the
reverse model.
The variance-exploding SDE, which grows noise instead of shrinking signal, is the
score-matching lineage's schedule. Competing families are adversarial networks
(one-step, no likelihood), variational autoencoders (fast, historically blurry),
normalizing flows (exact likelihood, architecturally constrained) and
autoregressive models (exact likelihood, sequential in dimension).

## History and attribution

Diffusion probabilistic models were introduced in 2015 by Sohl-Dickstein, Weiss,
Maheswaranathan and Ganguli, who took the idea from nonequilibrium
thermodynamics: destroy structure with a tractable forward process, then learn
its reversal. The results were promising, not competitive. A parallel line —
Song and Ermon's 2019 noise-conditional score networks, trained by denoising
score matching and sampled with Langevin dynamics — arrived at closely related
machinery from the score-matching side.

Ho, Jain and Abbeel's 2020 paper is the hinge. Their contributions were the
noise-prediction parameterisation, the simplified unweighted loss and a careful
architecture, and together these made diffusion competitive with GANs on images.
Song et al. in 2021 then showed both lineages are discretisations of one
stochastic differential equation, leaning on Anderson's 1982 reverse-time
diffusion result and Vincent's 2011 identity between denoising autoencoders and
score matching, and added the probability-flow ODE and exact likelihood
computation.

## Sources

**Denoising Diffusion Probabilistic Models** is the paper to read first and the
source of the definition, the variational decomposition, the $\epsilon$
parameterisation, the simplified loss, the CIFAR-10 numbers and the ablation
comparing the two objectives. **Score-Based Generative Modeling through
Stochastic Differential Equations** supplies the continuous-time picture: the
forward and reverse SDEs, the VP/VE distinction and the probability-flow ODE.
**Auto-Encoding Variational Bayes** is the standard reference for the deep
latent-variable form of the variational bound the objective specialises, and **Probabilistic Machine Learning**
places diffusion among the deep generative models it competes with.

## Prerequisites and next connections

Read [Stochastic Processes](./stochastic-processes.md) first for Markov chains
and the diffusions the continuous limit lives in, and
[Probability Theory](./probability-theory.md) if Gaussian conditionals and KL
divergence are not already comfortable;
[Variational Methods](./variational-methods.md) covers the bound the objective
comes from.

From here, the practical thread runs through the backbone —
[Convolutional Networks](./convolutional-networks.md) for the U-Net that most
image models use and [Attention](./attention.md) for the layers that carry
conditioning — and through [Distillation](./distillation.md), whose general idea
of training a student to imitate a teacher is what fast samplers adapt.
