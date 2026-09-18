---
concept_id: concept.deep_learning.flow_matching
title: Flow Matching
slug: /concepts/flow-matching
aliases:
  - conditional flow matching
kind: method
tier: 1
review_state: generated-draft
summary: A way to train a continuous-time generative model by regressing a neural velocity field onto a per-example target velocity, so the model's ODE is never simulated during training.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.normalizing_flows
    note: The object flow matching trains is a continuous normalizing flow, so a reader who does not know what a flow and its change-of-variables density are cannot follow what the velocity field is for.
  - type: generalizes
    target: concept.deep_learning.diffusion_models
    note: The forward noising process of a diffusion model is one particular Gaussian conditional path in the flow matching family, and its training objective is a reparameterisation of the conditional flow matching loss on that path, up to a time-dependent loss weighting.
  - type: contrasts_with
    target: concept.optimization.optimal_transport
    note: The so-called optimal-transport path is optimal only between the two Gaussians attached to a single data point; the marginal flow the network learns is generally not the optimal transport map between noise and data.
  - type: contrasts_with
    target: concept.deep_learning.generative_adversarial_networks
    note: Both produce high-quality samples without a tractable likelihood during training, but flow matching is a stable least-squares regression that pays for it with an ODE solve at sampling time, where a GAN samples in one forward pass and pays with an unstable minimax objective.
sources:
  - source_id: source.lipman2023.flow_matching
    title: Flow Matching for Generative Modeling
    url: https://arxiv.org/abs/2210.02747
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.chen2018.neural_ode
    title: Neural Ordinary Differential Equations
    url: https://arxiv.org/abs/1806.07366
    source_kind: preprint
    supports:
      - why-it-matters
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.song2021.score_based_sde
    title: Score-Based Generative Modeling through Stochastic Differential Equations
    url: https://arxiv.org/abs/2011.13456
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.rezende2015.normalizing_flows
    title: Variational Inference with Normalizing Flows
    url: https://arxiv.org/abs/1505.05770
    source_kind: preprint
    supports:
      - history-and-attribution
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Concurrent and follow-up formulations — rectified flow, stochastic interpolants, and minibatch optimal-transport couplings
    reason: The registry contains the flow matching paper but none of the concurrent or follow-up papers, so this page names these lines of work and says what they change without citing them or quoting any of their results.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: Large-scale production systems trained with a flow-matching objective
    reason: No registered source covers recent large text-to-image, audio or video systems, so the page says only that the objective has been adopted at that scale and makes no claim about which system or what it achieved.
    sections:
      - uses-and-applicability
---

## Definition

**Flow matching** fits a time-dependent velocity field $v_\theta(t, x)$ by
least-squares regression, then generates samples by integrating the ordinary
differential equation $\dot{x} = v_\theta(t, x)$ from a noise sample at $t = 0$ to a
data sample at $t = 1$. What makes it work is the regression target: the network is
trained against a _conditional_ velocity available in closed form from one data
point and one noise sample, although the field it is being asked to learn is the
_marginal_ one, an average over the whole data distribution that is intractable
in practice.

## Why it matters

A continuous normalizing flow is an attractive generative model — invertible,
exact-likelihood, no architectural constraint on the network — and, trained by
maximum likelihood, an expensive one. The log-density along the trajectory obeys an
instantaneous change-of-variables rule, but using it means solving the ODE forward,
estimating a divergence at every solver step, and adjointing back over the whole
solve. Every gradient step contains a simulation.

Flow matching deletes the simulation. One training step is: draw $t$, a noise
sample and a data sample, interpolate, one forward pass, one squared error — the
cost of training a denoiser. The second gain is freedom: the path from noise to
data becomes something you _choose_ rather than something a noising process hands
you.

## Intuition

Pair each data point with a noise sample and build a private straight road between
them; on that road the velocity is one constant vector, the displacement from noise
to datum. Now ask the network a question it can actually be asked — standing at $x$
at time $t$, what is the average velocity of the roads passing through here?
Least-squares regression answers that, because the minimiser of a squared error
against a noisy target is the target's conditional mean.

The picture misleads in one respect worth fixing immediately: the field of averages
is not made of straight roads. Its integral curves bend, and the trajectory the
trained model follows from a noise sample does not end at the data point that
sample was paired with in training. Individual roads are straight; traffic is not.

## Concrete example

Take $d = 1$, base $p_0 = \mathcal{N}(0, 1)$, and data $q$ putting mass $1/2$ on
$x_1 = +2$ and $1/2$ on $x_1 = -2$. Use the linear path $x_t = (1 - t)x_0 + t x_1$,
whose conditional velocity is the constant $x_1 - x_0$.

Two training draws landing on the same point at $t = 0.5$:

- $x_0 = -0.2$, $x_1 = +2$ gives $x_t = 0.9$ and target $+2.2$.
- $x_0 = +3.8$, $x_1 = -2$ gives $x_t = 0.9$ and target $-5.8$.

The targets disagree violently and neither is the answer. The regression optimum at
$(t, x) = (0.5, 0.9)$ is their weighted mean, weights proportional to
$p_t(x \mid x_1) = \mathcal{N}(0.9 \mid 0.5 x_1, 0.25)$: the first draw gets
$e^{-0.02} = 0.980$, the second $e^{-7.22} = 7.3 \times 10^{-4}$, so the fitted
velocity is $0.9993 \times 2.2 + 0.0007 \times (-5.8) \approx 2.19$. The target is
enormously noisy and still unbiased for what you want.

```python
import torch

def cfm_loss(net, x1):
    """Flow matching loss on a batch x1 of shape (B, D); net(t, x) -> velocity."""
    x0 = torch.randn_like(x1)                            # p_0 = N(0, I)
    t = torch.rand(x1.shape[0], 1, device=x1.device)     # t ~ U[0, 1]
    xt = (1 - t) * x0 + t * x1                           # point on the linear path
    return ((net(t, xt) - (x1 - x0)) ** 2).mean()        # target ignores theta

@torch.no_grad()
def sample(net, n, d, steps=100):
    x = torch.randn(n, d)
    for i in range(steps):                               # forward Euler
        x = x + net(torch.full((n, 1), i / steps), x) / steps
    return x
```

Note the asymmetry the code makes plain: training never calls the solver, sampling
is nothing but the solver.

## Formal treatment

Let $q$ be the data distribution on $\mathbb{R}^d$ and $p_0$ a tractable base. A
velocity field $v_t$ generates a probability path $p_t$ if the two satisfy the
continuity equation

$$
\partial_t p_t(x) + \nabla \cdot \bigl(p_t(x)\, v_t(x)\bigr) = 0 ,
$$

that is, pushing $p_0$ through the flow of $\dot{x} = v_t(x)$ produces $p_t$. The
ideal objective is

$$
\mathcal{L}_{\mathrm{FM}}(\theta) = \mathbb{E}_{t \sim U[0,1],\; x \sim p_t}
\bigl\| v_\theta(t, x) - u_t(x) \bigr\|^2 ,
$$

for a target field $u_t$ generating some path with $p_1 \approx q$. It is unusable:
neither $p_t$ nor $u_t$ is known.

Now condition. Pick a path $p_t(x \mid x_1)$ with $p_0(\cdot \mid x_1) = p_0$ and
$p_1(\cdot \mid x_1)$ concentrated at $x_1$, a field $u_t(x \mid x_1)$ generating
it, and set $p_t(x) = \int p_t(x \mid x_1) q(x_1)\, dx_1$. The marginalisation
identity is that

$$
u_t(x) = \int u_t(x \mid x_1)\, \frac{p_t(x \mid x_1)\, q(x_1)}{p_t(x)}\, dx_1
$$

generates $p_t$: the marginal field is the posterior average of the conditional
fields. The key identity follows. With

$$
\mathcal{L}_{\mathrm{CFM}}(\theta) = \mathbb{E}_{t \sim U[0,1],\; x_1 \sim q,\;
x \sim p_t(\cdot \mid x_1)} \bigl\| v_\theta(t, x) - u_t(x \mid x_1) \bigr\|^2 ,
$$

the two objectives differ by a constant in $\theta$, hence

$$
\nabla_\theta \mathcal{L}_{\mathrm{FM}}(\theta) =
\nabla_\theta \mathcal{L}_{\mathrm{CFM}}(\theta) .
$$

Expand both squares: the $\|v_\theta\|^2$ terms are identical, the cross terms agree
by the marginalisation identity, and the leftover $\|u_t\|^2$ terms do not involve
$\theta$. Equivalently, the unconstrained minimiser of $\mathcal{L}_{\mathrm{CFM}}$
is $\mathbb{E}[u_t(x \mid x_1) \mid x_t = x]$, which is $u_t(x)$.

For Gaussian conditional paths $p_t(x \mid x_1) = \mathcal{N}(x \mid \mu_t(x_1),
\sigma_t(x_1)^2 I)$ the generating field is

$$
u_t(x \mid x_1) = \frac{\sigma_t'(x_1)}{\sigma_t(x_1)}\bigl(x - \mu_t(x_1)\bigr)
+ \mu_t'(x_1) .
$$

Two choices matter. The **optimal-transport path** takes $\mu_t = t x_1$ and
$\sigma_t = 1 - (1 - \sigma_{\min}) t$, giving the straight-line interpolation of
the example above and, as $\sigma_{\min} \to 0$, the constant target $x_1 - x_0$;
this is the displacement interpolant between $\mathcal{N}(0, I)$ and a point mass
at $x_1$. The **diffusion path** takes $\mu_t = \alpha_{1-t} x_1$ and
$\sigma_t = \sqrt{1 - \alpha_{1-t}^2}$ for the noise schedule $\alpha$, recovering
the variance-preserving process of score-based diffusion, which reaches the base
distribution only asymptotically. Since
$\nabla \log p_t(x \mid x_1) = -(x - \mu_t)/\sigma_t^2$, velocity and score are
affinely related here,
$u_t(x \mid x_1) = -\sigma_t \sigma_t' \nabla \log p_t(x \mid x_1) + \mu_t'$: on a
Gaussian path a velocity model and a score model are reparameterisations of each
other. Song et al.'s probability flow ODE is the deterministic transport with the
same marginals as their SDE; flow matching trains such an ODE directly rather than
deriving it from a learned score.

## Assumptions and requirements

The gradient identity needs $p_t(x) > 0$ for all $x$ and all $t \in [0, 1]$, so the
posterior average defining $u_t$ is well defined, plus enough regularity to
differentiate under the integral and keep the discarded constant finite. Gaussian
paths satisfy positivity whenever $\sigma_t > 0$; taking $\sigma_{\min} = 0$ makes
$t = 1$ a limiting endpoint rather than a point where the theory applies — harmless
for sampling, not for exact likelihood evaluation there.

The conditional path must have a generating field you can write down, and must
start at the base and end at (a tight Gaussian around) the data point; otherwise
the marginal endpoints are wrong and training cannot fix it. Sampling needs the
learned field Lipschitz enough in $x$ for the ODE to have a unique solution, which
smooth networks give locally but the objective does not guarantee. And the model is
a diffeomorphism of $\mathbb{R}^d$ at each $t$: data supported on a
lower-dimensional manifold can be approached but not represented, and likelihoods
diverge as it is.

## Uses and applicability

Reach for flow matching when you want a likelihood-bearing continuous generative
model and cannot afford simulation-based training: images, audio, video, molecular
structure and continuous control policies have all been approached this way, and
the objective has been adopted in large text-to-image systems. It is the natural
choice when you want to design the path — a non-Gaussian base, an interpolation
between two data distributions rather than noise and data, or a manifold where a
noising SDE is awkward.

Do not reach for it when one-step generation is required, since sampling costs a
solve; when the data is discrete with no continuous relaxation; or when a cheap
encoder is needed, since inverting the flow is itself an ODE solve.

## Limitations and common mistakes

The most common misreading is that the "optimal transport path" makes the model
learn the optimal transport map from noise to data. It does not: optimality holds
per-conditional, between two Gaussians, and the coupling the trained flow induces is
generally neither optimal nor the independent coupling used in training. The model
learns to get the marginals right, not to send the noise sample you drew to the
data point you paired it with.

The second is confusing simulation-free training with simulation-free sampling.
Sampling still needs tens to hundreds of network evaluations; few-step generation
requires distillation or trajectory straightening, which is separate work.

The third is treating flow matching and diffusion as rival objectives. On a
Gaussian path they are one regression in two coordinate systems; the real
differences are the path, the schedule, the loss weighting, and ODE versus SDE
sampling.

Two smaller traps: the loss has a nonzero floor equal to the target's conditional
variance, so its absolute value says nothing about model quality; and reports that
optimal-transport paths need fewer solver steps are empirical findings on image
benchmarks, not theorems — straight _conditional_ paths do not imply straight
marginal trajectories.

## Variants and alternatives

Within the family, the choice is the path: linear, diffusion, or other schedules,
trading endpoint behaviour against trajectory curvature. **Rectified flow** was
proposed concurrently with essentially the same linear-interpolant objective, plus a
reflow procedure that retrains on model-generated pairs to straighten trajectories.
**Stochastic interpolants** give a more general framework covering deterministic and
stochastic transports alike. **Minibatch optimal-transport couplings** replace the
independent pairing of noise and data with an OT plan computed within the batch,
reducing target variance at the cost of an assignment problem per batch. Riemannian
and discrete variants extend the construction off $\mathbb{R}^d$.

Outside the family: discrete normalizing flows buy exact, cheap likelihoods and pay
with architectural constraints on invertibility; diffusion models buy stochastic
sampling and mature tooling; GANs buy one-step sampling and pay with instability
and no likelihood; autoregressive models buy exact likelihood and pay with
sequential decoding.

## History and attribution

The lineage runs from normalizing flows — Rezende and Mohamed's invertible
transformations for variational inference (2015) — to the continuous-time version in
Chen et al.'s neural ODE paper (2018), which made density tracking a divergence
integral and training expensive. Flow matching was introduced by Lipman, Chen,
Ben-Hamu, Nickel and Le in 2022, working on that expense: the contribution is the
conditional construction and the proof that its gradient equals the intractable
one. The idea has several near-simultaneous origins — rectified flow and stochastic
interpolants arrived independently with overlapping formulations, and the
vocabulary has not settled. The comparative picture against diffusion is still
moving.

## Sources

The flow matching paper covers the construction itself: the conditional objective,
the gradient identity, the Gaussian-path family, and the derivation of both the
optimal-transport and diffusion paths within it. The neural ODE paper defines the
continuous normalizing flow and the training cost flow matching removes. The
score-based SDE paper supplies the probability flow ODE and the diffusion side of
the comparison; Rezende and Mohamed is the discrete-flow ancestor.

## Prerequisites and next connections

Read about normalizing flows first — the velocity field here is only interesting
because its flow transports a density — and be comfortable with
[Ordinary Differential Equations](./ordinary-differential-equations.md), since the
continuity equation and the sampler are both ODE statements. Nothing beyond
multivariable calculus and basic [Probability Theory](./probability-theory.md) is
needed for the derivation.

Afterwards, [Optimal Transport](./optimal-transport.md) explains what displacement
interpolation is and why the per-conditional optimality here is weaker than it
sounds, and [Variational Methods](./variational-methods.md) places the continuity
equation among dynamics derived from objectives on densities. Implementation needs
nothing special: ordinary
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) on a squared
[Loss Function](./loss-functions.md), with architectures borrowed from diffusion.
