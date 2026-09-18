---
concept_id: concept.deep_learning.generative_adversarial_networks
title: Generative Adversarial Networks
slug: /concepts/generative-adversarial-networks
aliases:
  - GAN
kind: method
tier: 1
review_state: generated-draft
summary: A generative model trained by pitting a sample generator against a classifier that tries to tell its output from real data, so the training signal comes from a learned critic rather than from a likelihood.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.backpropagation
    note: The generator is trained by differentiating the discriminator's output with respect to the generated sample and continuing the chain rule back into the generator's weights, so the reader needs the backward pass before the training rule makes sense.
  - type: used_to_solve
    target: concept.learning.unsupervised_learning
    note: A GAN learns to sample from an unlabelled data distribution; the only supervision in the system is the real-versus-fake label the training procedure manufactures for itself.
  - type: contrasts_with
    target: concept.deep_learning.variational_autoencoders
    note: Both learn a decoder from a simple latent distribution, but the VAE maximises a likelihood bound with an explicit reconstruction term while the GAN optimises an implicitly defined divergence, which is why their failure modes are opposite — blurry means over sharp.
  - type: contrasts_with
    target: concept.deep_learning.diffusion_models
    note: Diffusion models reach comparable or better sample quality with a stable regression objective and no adversarial game, at the cost of many network evaluations per sample instead of one.
sources:
  - source_id: source.goodfellow2014.generative_adversarial_networks
    title: Generative Adversarial Networks
    url: https://arxiv.org/abs/1406.2661
    source_kind: preprint
    supports:
      - definition
      - intuition
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
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.ho2020.denoising_diffusion
    title: Denoising Diffusion Probabilistic Models
    url: https://arxiv.org/abs/2006.11239
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Arjovsky, Chintala and Bottou's Wasserstein GAN and the gradient-penalty follow-up, and the analysis of why the original objective saturates on disjoint supports
    reason: The registry holds neither the WGAN paper nor the principled-methods analysis that identifies the non-saturating loss with a different divergence combination, so the Wasserstein formulation and that identification are stated here from secondary coverage rather than from the primary sources.
    sections:
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
  - label: Empirical GAN benchmark results and the sample-quality metrics used to report them (FID, Inception Score, precision and recall for generative models)
    reason: No registry source reports the image-synthesis benchmark numbers or defines these metrics, so this page describes the empirical picture qualitatively and gives no scores.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **generative adversarial network** is a pair of networks trained against each
other: a _generator_ $G_\theta$ that maps a noise sample $z \sim p_z$ to a
candidate data point $G_\theta(z)$, and a _discriminator_ $D_\phi$ that maps a
data point to the probability it came from the training set rather than from
$G_\theta$. The discriminator is trained to classify correctly; the generator is
trained to make it fail. Neither carries a hand-written notion of what a good
sample looks like — the loss for the generator _is_ the current discriminator,
and it moves as the generator improves.

The generator defines a distribution $p_g$ implicitly, as the pushforward of
$p_z$ through $G_\theta$. No tractable density for $p_g$ exists, and the method
never needs one: everything is done with samples.

## Why it matters

Deep generative models before GANs bought tractability with a structural
concession: autoregressive models sample one coordinate at a time, variational
and flow-based models constrain the decoder so a likelihood or a bound can be
computed. Those choices have a price: sampling one coordinate at a time is slow,
and a unimodal per-pixel likelihood term rewards hedging between plausible
alternatives, which shows up in the samples as blur.

The adversarial objective removes the constraint. The generator can be any
differentiable function, sampling costs one forward pass, and the criterion for
"looks real" is learned from the data rather than specified. That is what made
sharp, high-resolution image synthesis work after 2014, and why the architecture
survives where one-pass sampling matters: super-resolution, image-to-image
translation, neural vocoders.

## Intuition

The standard picture is a counterfeiter and a detective: the counterfeiter
prints notes, the detective learns which are fake, and each improvement forces
the other. At equilibrium the notes are indistinguishable and the detective is
reduced to guessing.

The analogy breaks in a way worth holding onto. Counterfeiters and detectives
are separate agents with fixed abilities; here the detective is a differentiable
function whose _gradient_ is handed to the counterfeiter. The generator is not
told "this note is fake" — it is told which direction in pixel space would have
made it more convincing. That is why the discriminator has to remain beatable: a
detective certain that everything is fake gives a gradient of essentially zero
and teaches nothing.

## Concrete example

Take a one-dimensional example small enough to check by hand. Let the data be
uniform on $\{0, 1\}$, so $p_{\text{data}}(0) = p_{\text{data}}(1) = 0.5$, and
suppose the generator has collapsed onto a single point, $p_g(0) = 1$. The
optimal discriminator (derived below) is

$$
D^*(0) = \frac{0.5}{0.5 + 1} = \tfrac13, \qquad D^*(1) = \frac{0.5}{0.5 + 0} = 1 .
$$

The value of the game at that discriminator is
$0.5\log\tfrac13 + 0.5\log 1 + \log\tfrac23 = -0.955$. The identity in the next
section says this must equal $-\log 4 + 2\,\mathrm{JSD}(p_{\text{data}} \| p_g)$,
and indeed $\mathrm{JSD} = 0.216$ nats gives $-1.386 + 0.431 = -0.955$.

Now move the collapsed mass off the data entirely, to $p_g(2) = 1$. The supports
are disjoint, $D^*$ is $1$ on the data and $0$ on the fake, the Jensen–Shannon
divergence sits at its maximum $\log 2$, and the value of the game is exactly
$0$. The discriminator is perfect and $\log(1 - D(G(z)))$ is flat: the generator
receives no gradient telling it which way to move. Perfect discrimination is not
progress — it is a dead end.

## Formal treatment

Write the value function

$$
V(D, G) = \mathbb{E}_{x \sim p_{\text{data}}}[\log D(x)]
        + \mathbb{E}_{z \sim p_z}[\log(1 - D(G(z)))],
$$

and the game as $\min_G \max_D V(D, G)$.

**Optimal discriminator.** For a fixed $G$, the integrand at each $x$ is
$a \log y + b \log(1 - y)$ with $a = p_{\text{data}}(x)$, $b = p_g(x)$, which is
maximised over $y \in [0,1]$ at $y = a/(a+b)$ whenever $a + b > 0$. Hence

$$
D^*_G(x) = \frac{p_{\text{data}}(x)}{p_{\text{data}}(x) + p_g(x)} .
$$

**Global optimum.** Substituting $D^*_G$ back gives the generator's criterion

$$
C(G) = \max_D V(D,G) = -\log 4 + 2 \, \mathrm{JSD}(p_{\text{data}} \,\|\, p_g),
$$

where $\mathrm{JSD}(p \| q) = \tfrac12 \mathrm{KL}(p \| m) + \tfrac12
\mathrm{KL}(q \| m)$ with $m = \tfrac12(p + q)$. Since the Jensen–Shannon
divergence is non-negative and vanishes only when $p = q$, the unique global
minimum is $C(G) = -\log 4$, attained exactly when $p_g = p_{\text{data}}$.

**Training.** In practice the inner maximisation is replaced by $k$ stochastic
gradient steps on $\phi$ (often $k = 1$) between each step on $\theta$, and the
generator's own loss is changed: instead of minimising $\log(1 - D(G(z)))$, one
maximises $\log D(G(z))$. This **non-saturating** form has the same fixed point
but does not vanish when the discriminator is winning, which is the regime at
initialisation. It is a heuristic about gradients, not a reformulation of the
theorem — the gradient it follows is not the gradient of $C(G)$.

## Assumptions and requirements

The optimality result above is proved in the space of probability densities, and
three of its hypotheses fail for real GANs.

First, the maximisation is over _all_ measurable $D : \mathcal{X} \to [0,1]$, not
over a parameterised family, and $D$ is assumed to be at its optimum for the
current $G$. With $k$ finite, the generator descends against a stale critic.

Second, the convergence argument treats $p_g$ itself as the optimisation
variable and leans on convexity of $\sup_D V$ in $p_g$. The actual variable is
$\theta$, the map $\theta \mapsto p_g$ is not convex, and the paper says so:
the proof does not transfer to parameterised networks.

Third, both distributions are assumed to admit densities on a common support.
A generator pushing a $d$-dimensional noise vector into $\mathbb{R}^n$ with
$d \ll n$ concentrates $p_g$ on a set of measure zero, so early in training the
supports are effectively disjoint — the second half of the worked example, where
$\mathrm{JSD}$ is pinned at $\log 2$ and its gradient carries no information.
The Wasserstein reformulation exists to repair this.

## Uses and applicability

Reach for a GAN when you need fast sampling and perceptual quality and no
likelihood: single-pass image synthesis, super-resolution, inpainting, unpaired
image-to-image translation, audio vocoders where an autoregressive model is too
slow. The adversarial term is also useful as a _component_ — added to a
reconstruction loss it sharpens output that would otherwise regress to the
conditional mean.

Do not reach for one when you need density estimation, calibrated likelihoods,
anomaly scores or lossless compression; a GAN cannot give you $p_g(x)$. Avoid it
for small or highly multimodal tabular data, where dropping modes is both likely
and hard to detect. If a stable training curve matters more than the last
increment of sharpness, a diffusion or autoregressive model is safer.

## Limitations and common mistakes

**Mode collapse.** The generator can map many $z$ to the same output, or cover
one mode of the data and ignore the rest. Nothing in the _approximate_ game
forbids it: against an imperfect discriminator, concentrating on whatever the
critic currently finds convincing is a winning move, and the critic then chases
that mode while the generator hops to another. Goodfellow's paper already warns
of it, as the failure of training $G$ too far without refreshing $D$.

**No usable loss curve.** Both losses are measured against a moving opponent, so
a falling generator loss can mean the generator improved or the discriminator
degraded; reading GAN losses like a supervised training curve is a common
beginner mistake. Evaluation therefore leans on sample-based metrics and human
inspection, and those metrics have blind spots — a model that memorises training
data can score well.

**Mistaking the theorem for a guarantee.** "GANs minimise the Jensen–Shannon
divergence" is true of the idealised game and not of the training loop you run.
With a parameterised, under-trained discriminator and the non-saturating
substitution, the objective being descended is not $2\,\mathrm{JSD} - \log 4$.

**Fragility.** Results depend on architecture, normalisation, the learning-rate
ratio between the two networks, and initialisation to an unusual degree. Much
GAN engineering is stabilisation rather than modelling.

## Variants and alternatives

**Non-saturating** and **least-squares** GANs change the generator's loss to
avoid vanishing gradients. The **f-GAN** family generalises the derivation: any
$f$-divergence has a variational lower bound in the same shape, and the original
game is the Jensen–Shannon member. **Wasserstein GANs** replace the classifier
with a 1-Lipschitz _critic_ and use the Kantorovich–Rubinstein dual,

$$
W_1(p_{\text{data}}, p_g) = \sup_{\|f\|_L \le 1} \big(
\mathbb{E}_{p_{\text{data}}}[f] - \mathbb{E}_{p_g}[f] \big),
$$

which stays informative when supports are disjoint. Enforcing the Lipschitz
constraint — by weight clipping, then by a gradient penalty, then by spectral
normalisation — is the cost, and the critic never attains the exact supremum, so
the "loss tracks sample quality" claim is empirical rather than proved.
**Conditional** GANs feed a label or an input image to both networks.

The genuinely different approaches are the likelihood-based ones: variational
autoencoders, normalizing flows, autoregressive models, and diffusion models.
Diffusion in particular trades many network evaluations per sample for a
stable regression objective and better mode coverage, and displaced GANs as the
default for unconditional image synthesis after 2020.

## History and attribution

Goodfellow and co-authors introduced the framework in 2014, motivated by the
approximations that deep generative models then required — the intractable
partition functions of undirected models and the Markov chains used to train
them. Their contribution was to notice that a generator can be trained entirely
through a classifier's gradients, with no Markov chain and no explicit density.
The paper contains the optimal discriminator, the Jensen–Shannon identity, the
non-saturating trick and an explicit warning about generator collapse.

The idea has partial precedents — learning by discriminating against noise, and
minimax formulations in game theory and robust statistics — and 2014 is the
point at which the pieces became a practical training method for deep networks.
The instability it left behind drove the next few years of work, of which the
Wasserstein critic (2017) is a much-cited landmark.

## Sources

The **original 2014 paper** is short and worth reading directly: it carries the
value function, both propositions, and the authors' own account of what the
theory does and does not cover. The **Deep Learning** textbook places GANs among
the other deep generative models and is the better source for why implicit
models avoid the blur likelihood terms induce. **Murphy's Probabilistic Machine
Learning** gives the modern treatment — the $f$-divergence view, the Wasserstein
and integral-probability-metric formulations, mode collapse and evaluation. The
**DDPM** paper is cited only as representative of the approach that overtook
GANs on image synthesis.

## Prerequisites and next connections

You need [Backpropagation](./backpropagation.md) to follow how a gradient
travels from the discriminator's scalar output into the generator's weights, and
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) for the
alternating update loop. Divergences from
[Probability Theory](./probability-theory.md) make the Jensen–Shannon result
legible, and [Loss Functions](./loss-functions.md) explains why binary
cross-entropy appears in the value function.

From here, [Optimal Transport](./optimal-transport.md) is the right next page:
it gives the Wasserstein distance the critic variant is built on, and shows why
a metric that respects the geometry of the sample space behaves differently from
a divergence that does not.
[Unsupervised Learning](./unsupervised-learning.md) places the method among the
other ways of learning from unlabelled data.
