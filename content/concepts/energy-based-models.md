---
concept_id: concept.deep_learning.energy_based_models
title: Energy-Based Models
slug: /concepts/energy-based-models
aliases:
  - EBM
kind: concept
tier: 1
review_state: generated-draft
summary: A family of probabilistic models that define a distribution by exponentiating the negative of an unconstrained scalar function, buying total architectural freedom at the price of a normalising constant nobody can compute.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: generalizes
    target: concept.deep_learning.boltzmann_machines
    note: A Boltzmann machine is the energy-based model whose energy is a quadratic form over binary units, and its positive-phase/negative-phase learning rule is the general maximum-likelihood gradient written out for that particular energy.
  - type: specializes
    target: concept.physics.statistical_mechanics
    note: The Boltzmann form, the partition function and the free energy are taken unchanged from statistical mechanics, with the temperature fixed at one and the energy learned from data instead of given by a Hamiltonian.
  - type: contrasts_with
    target: concept.deep_learning.normalizing_flows
    note: Flows constrain the architecture to be invertible so that the normaliser is available exactly, which is the opposite trade to an energy-based model that keeps the architecture free and never learns its own normaliser.
  - type: contributes_to
    target: concept.deep_learning.diffusion_models
    note: Denoising score matching was developed to fit energy-based models without touching the partition function, and that objective — fitting the score of a noise-perturbed density — is what diffusion models train on.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
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
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
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
  - source_id: source.hopfield1982.neural_networks
    title: Neural networks and physical systems with emergent collective computational abilities
    url: https://www.pnas.org/doi/10.1073/pnas.79.8.2554
    source_kind: primary-research
    supports:
      - intuition
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Sutskever and Tieleman's result that contrastive divergence is not the gradient of any function
    reason: No registered source covers the proof; the registry's references discuss contrastive divergence as a biased estimator but not this negative result.
    sections:
      - limitations-and-common-mistakes
  - label: LeCun, Chopra, Hadsell, Ranzato and Huang's tutorial on energy-based learning
    reason: The tutorial that fixed the modern, decision-theoretic usage of the term is not in the source registry.
    sections:
      - history-and-attribution
  - label: The free-energy score for out-of-distribution detection
    reason: The observation that the log-sum-exp of a classifier's logits is a free energy usable as an OOD score comes from a 2020 paper that the registry does not list.
    sections:
      - uses-and-applicability
claims: []
---

## Definition

An **energy-based model** picks any scalar-valued function $E_\theta : \mathcal{X} \to \mathbb{R}$ — typically a neural network with one output unit — and declares the density

$$
p_\theta(x) \;=\; \frac{\exp(-E_\theta(x))}{Z(\theta)},
\qquad
Z(\theta) \;=\; \int_{\mathcal{X}} \exp(-E_\theta(x)) \, dx ,
$$

with the integral replaced by a sum when $\mathcal{X}$ is discrete. The only requirement on $E_\theta$ is that $Z(\theta)$ be finite. Low energy means high probability; the model says nothing about $x$ in isolation, only that $x$ is $\exp(E_\theta(x') - E_\theta(x))$ times as likely as $x'$.

A **conditional** energy-based model writes $E_\theta(x, y)$ and normalises over $y$ alone, which is usually the tractable direction.

## Why it matters

Every other likelihood-based generative model constrains the architecture to keep the normaliser under control: a flow must be invertible with a cheap Jacobian determinant, an autoregressive model must impose an ordering, a variational autoencoder settles for a bound. An energy-based model constrains nothing — any function from a configuration to a number is a valid model — so architectural progress transfers directly.

Energies also compose. Two models trained separately combine by adding energies, which multiplies the densities — a product of experts, where each expert can veto. A model whose output is already a normalised density cannot be composed this way, because the product of two densities is not a density.

The bill comes due at $Z(\theta)$. It is a sum over every configuration, so likelihoods cannot be evaluated, gradients cannot be computed in closed form, and everything downstream of those two facts becomes an approximation problem.

## Intuition

Picture a landscape over the space of configurations, with the data sitting in the valleys. Training digs the valleys deeper where data was observed and raises the terrain everywhere else. The second half is not optional: with only the first, the network would drive the energy to $-\infty$ uniformly and learn nothing, because the shape of a landscape, not its height, is what carries probability.

This is Hopfield's picture with a probability measure laid on top: where a Hopfield network only needs its stored patterns to be minima, an energy-based model needs the depth of each valley to be right as well.

The analogy to physics is exact in form and misleading in provenance. In statistical mechanics the Boltzmann weight is derived — it is what equilibrium under energy conservation forces. Here it is a choice, made because it turns any real-valued function into a positive normalisable one. There is no dynamics, no thermal bath, and the temperature has been absorbed into $E$.

## Concrete example

Take two binary variables, $x \in \{0,1\}^2$, with energy $E(x) = -(w x_1 x_2 + b_1 x_1 + b_2 x_2)$ and parameters $w = 1.5$, $b_1 = b_2 = -0.5$. The four unnormalised weights are $e^{0} = 1$ for $(0,0)$, $e^{-0.5} = 0.6065$ for $(1,0)$ and for $(0,1)$, and $e^{0.5} = 1.6487$ for $(1,1)$. So $Z = 3.8618$ and

$$
p(0,0) = 0.2589,\quad p(1,0) = p(0,1) = 0.1571,\quad p(1,1) = 0.4269 .
$$

The coupling makes the units want to agree; the biases make each one, alone, prefer to be off. Take the observation $x = (1,1)$ and ask for the gradient of its log-likelihood with respect to $w$:

```python
import itertools, math

w, b = 1.5, (-0.5, -0.5)
states = list(itertools.product([0, 1], repeat=2))
E = lambda x: -(w * x[0] * x[1] + b[0] * x[0] + b[1] * x[1])
Z = sum(math.exp(-E(x)) for x in states)
p = {x: math.exp(-E(x)) / Z for x in states}

dE_dw = lambda x: -x[0] * x[1]
data = (1, 1)
grad = -dE_dw(data) + sum(p[x] * dE_dw(x) for x in states)
print(Z, grad)            # 3.8618 0.5731
```

The data term contributes $1$ and the model expectation $-0.4269$, leaving $0.5731$: the data agrees more strongly than the model does, so $w$ increases. Here $Z$ is a sum of four terms; with a hundred binary units it is a sum of $2^{100}$, and that second term is the whole difficulty of the field.

## Formal treatment

Write $\ell(\theta) = \mathbb{E}_{x \sim p_{\text{data}}}[\log p_\theta(x)]$. Since $\log p_\theta(x) = -E_\theta(x) - \log Z(\theta)$ and

$$
\nabla_\theta \log Z(\theta)
= \frac{1}{Z(\theta)} \int -\nabla_\theta E_\theta(x) \, e^{-E_\theta(x)} dx
= -\,\mathbb{E}_{x \sim p_\theta}\!\left[ \nabla_\theta E_\theta(x) \right],
$$

the maximum-likelihood gradient is a difference of two expectations of the same quantity under two different distributions:

$$
\nabla_\theta \ell(\theta)
= -\,\underbrace{\mathbb{E}_{x \sim p_{\text{data}}}\!\left[\nabla_\theta E_\theta(x)\right]}_{\text{positive phase}}
\;+\; \underbrace{\mathbb{E}_{x \sim p_\theta}\!\left[\nabla_\theta E_\theta(x)\right]}_{\text{negative phase}} .
$$

The positive phase is a minibatch average and costs one backward pass. The negative phase is an expectation under the model itself, which is exactly the object that $Z$ makes intractable — so it is estimated by sampling, usually with Markov chain Monte Carlo. Langevin dynamics is the standard choice for continuous $x$:

$$
x_{t+1} = x_t - \tfrac{\varepsilon}{2} \nabla_x E_\theta(x_t) + \sqrt{\varepsilon}\, z_t,
\qquad z_t \sim \mathcal{N}(0, I),
$$

whose stationary distribution is $p_\theta$ only in the limit $\varepsilon \to 0$, $t \to \infty$, or with a Metropolis correction.

Two routes avoid the chain. **Contrastive divergence** starts the chain at a data point and runs $k$ steps — usually $k = 1$ — and uses the result as the negative sample. **Score matching** fits $\nabla_x \log p_\theta(x) = -\nabla_x E_\theta(x)$, which does not involve $Z$ at all because $\nabla_x \log Z(\theta) = 0$. Hyvärinen's integration by parts turns the intractable comparison with the data score into

$$
J(\theta) = \mathbb{E}_{x \sim p_{\text{data}}}\!\left[ \tfrac{1}{2}\left\| \nabla_x E_\theta(x) \right\|^2 - \operatorname{tr}\!\left( \nabla_x^2 E_\theta(x) \right) \right] + \text{const},
$$

computable from data alone. The Hessian trace costs $O(d)$ backward passes, which is why denoising score matching — regressing the score of a noise-perturbed density onto the added noise — replaced it in practice and became the training objective of score-based and diffusion models.

## Assumptions and requirements

$Z(\theta) < \infty$ is a real constraint, not a formality. On a finite discrete space it holds automatically; on $\mathbb{R}^d$ an unbounded network can drive $E_\theta$ to $-\infty$ fast enough that no distribution exists, and training then continues happily on an improper model. Weight decay, spectral normalisation or an explicit quadratic term are the usual guards.

The energy is identified only up to an additive constant, since $E_\theta$ and $E_\theta + c$ give the same distribution. Energy values are therefore meaningless in isolation and incomparable across models.

MCMC estimation of the negative phase assumes the chain mixes between modes in the steps you can afford; for multimodal energies in high dimension it does not, and careful implementation does not rescue it. Contrastive divergence assumes further that a chain started at the data returns quickly to equilibrium, which is false in general and is the source of its bias.

Score matching assumes $p_{\text{data}}$ has a smooth, everywhere-positive density decaying at the boundary, so the integration by parts is valid. Data on a low-dimensional manifold violates this: the score is undefined off the manifold. Adding noise repairs the assumption but changes the distribution being fitted.

## Uses and applicability

Reach for an energy-based formulation when relative plausibility is what you need and absolute likelihood is not: structured prediction and reranking, where the energy scores a candidate output; compositional generation, where several trained energies are summed; and any case where the scoring function you can build is neither invertible nor autoregressive. Linear-chain conditional random fields are conditional energy-based models whose chain structure makes $Z$ tractable by dynamic programming — the framework is at its most useful where the normaliser happens to be computable.

Any trained classifier is already an energy-based model in disguise: the softmax over logits $f_y(x)$ is a Boltzmann distribution with $E(x,y) = -f_y(x)$, and $-\log \sum_y e^{f_y(x)}$ is a free energy that behaves as an out-of-distribution score.

Do not reach for one when you need exact likelihoods, calibrated densities or fast sampling: flows give exact likelihoods, diffusion models give far more reliable samples, autoregressive models give both on discrete data.

## Limitations and common mistakes

The first mistake is treating the contrastive divergence update as a likelihood gradient. It is biased, and in general it is not the gradient of any objective function at all, so there is no objective it can be said to descend and no guarantee that it converges. It often works anyway — an empirical finding about particular models, not a theorem.

The second is trusting samples. Images produced by a short Langevin chain are samples from the chain, not from $p_\theta$, and the sampler's hyperparameters do much of the visible work; claims about EBM sample quality are joint claims about model and sampler.

The third is expecting score matching to fix everything. Seeing only $\nabla_x \log p_\theta$, it is blind to the relative mass of well-separated modes: two landscapes with the same local shape but different valley depths across a barrier give nearly the same loss. Single-scale score matching therefore gets mode weights wrong, which is why annealing across noise levels was introduced.

Finally, the training is genuinely unstable, not merely fiddly: the negative phase is a moving target computed with a biased sampler, and divergence, energy collapse and oscillation are routine. This is why practical momentum moved to score-based and diffusion formulations rather than to better samplers.

## Variants and alternatives

**Boltzmann machines** and **restricted Boltzmann machines** are the quadratic, binary special case, trained with contrastive divergence or its persistent variant, which keeps chains alive across parameter updates instead of restarting them at data. **Hopfield networks** use the same landscape without the probabilistic layer. **Conditional random fields** restrict the energy so that $Z$ is computable. **Deep energy models** trained with Langevin dynamics revived the general case around 2019. **Noise-contrastive estimation** dodges $Z$ by turning density estimation into classification against a noise distribution, **ratio matching** carries score matching over to binary data by comparing a configuration with its single-bit flips, and **annealed importance sampling** estimates $Z$ afterwards for evaluation. The different competitors are flows, which force $Z = 1$ by construction; variational autoencoders, which optimise a bound; GANs, which drop likelihood entirely; and diffusion models, which keep the score and discard the explicit energy.

## History and attribution

The Boltzmann form and the partition function come from nineteenth-century statistical mechanics and reached neural networks through the Ising model. Hopfield's 1982 paper made the energy function a modelling object for networks — an associative memory whose stored patterns are the minima of an explicit energy. The Boltzmann machine of Ackley, Hinton and Sejnowski, in the mid-1980s, added the probability distribution and derived the positive/negative phase learning rule above.

Practical progress then came from the estimators: contrastive divergence (Hinton, 2002), score matching (Hyvärinen, 2005), persistent contrastive divergence (Tieleman, 2008). The term "energy-based model" in its present broad sense, covering prediction and structured output as well as density estimation, was popularised by LeCun and colleagues in the mid-2000s. The modern thread runs through denoising score matching into score-based generative models, where Song et al.'s stochastic-differential-equation formulation unified score matching across noise levels with diffusion.

## Sources

The _Deep Learning_ book is the best single treatment of the partition function problem: its chapters on structured probabilistic models and on confronting the partition function set out the positive/negative phase decomposition, contrastive divergence, persistent CD, score matching, noise-contrastive estimation and annealed importance sampling in one notation. Murphy's _Probabilistic Machine Learning_ covers undirected models, maximum likelihood with intractable normalisers and score matching from the graphical-models direction. Song et al.'s SDE paper is the reference for score matching across noise levels and Langevin sampling, and Hopfield's 1982 paper, short and readable, is the origin of the energy landscape as a neural-network object.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first — everything here is expectations under two different distributions — and then [Statistical Mechanics](./statistical-mechanics.md), which supplies the Boltzmann distribution, the partition function and the free energy that this page borrows wholesale. The negative phase is a Markov chain problem, so [Stochastic Processes](./stochastic-processes.md) and chain mixing are the other genuine prerequisite; without them "sample from the model" sounds easy.

From here, [Conditional Random Fields](./conditional-random-fields.md) is the case where the partition function is tractable and the framework becomes an everyday tool; [Contrastive Learning](./contrastive-learning.md) shows the same push-down-here, push-up-there structure surviving without any explicit density; and [Stochastic Gradient Descent](./stochastic-gradient-descent.md) consumes the noisy gradients above.
