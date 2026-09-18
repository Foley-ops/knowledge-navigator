---
concept_id: concept.reinforcement_learning.reinforce
title: REINFORCE
slug: /concepts/reinforce
kind: algorithm
tier: 1
review_state: generated-draft
summary: REINFORCE estimates the gradient of expected return by weighting each action's score function by the return that actually followed it, giving an unbiased policy update that requires complete episodes and has notoriously high variance.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: specializes
    target: concept.reinforcement_learning.policy_gradients
    note: REINFORCE is the Monte Carlo instance of the general policy gradient, obtained by substituting the sampled return for the action-value it estimates.
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The update is defined over trajectories, returns and a discount factor, all of which are the MDP's vocabulary and undefined without it.
  - type: contributes_to
    target: concept.reinforcement_learning.actor_critic
    note: Replacing REINFORCE's constant baseline with a learned state-value function, and then its sampled return with a bootstrapped one, is exactly how actor-critic is derived.
  - type: contrasts_with
    target: concept.reinforcement_learning.temporal_difference_learning
    note: Both estimate the same quantities, but REINFORCE waits for a terminal state and accepts the variance, where TD bootstraps from its own estimate and accepts the bias.
sources:
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mnih2016.a3c
    title: Asynchronous Methods for Deep Reinforcement Learning
    url: https://arxiv.org/abs/1602.01783
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Williams (1992), "Simple statistical gradient-following algorithms for connectionist reinforcement learning", Machine Learning 8
    reason: The paper that introduced REINFORCE and coined the name is not in the source registry, so the history section names it from the secondary literature rather than citing it directly.
    sections:
      - history-and-attribution
  - label: Silver, Lever, Heess, Degris, Wierstra and Riedmiller (2014), "Deterministic Policy Gradient Algorithms", ICML 31
    reason: The deterministic policy gradient paper is not in the source registry, so the statement that the deterministic gradient is the zero-variance limit of the stochastic one names it from Sutton and Barto's citation of it rather than citing it directly.
    sections:
      - assumptions-and-requirements
  - label: Multi-sample and leave-one-out baselines used in recent language-model policy optimisation
    reason: The registry has no paper on group-relative or leave-one-out baselines, so that variant is described qualitatively and should be checked against a primary source before being relied on.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**REINFORCE** is a Monte Carlo policy gradient algorithm: it samples a complete
episode from the current policy $\pi_\theta$, and for every time step nudges the
parameters in the direction that makes the action taken there more likely, scaled
by the discounted return that followed it. The update at step $t$ is

$$
\theta \;\leftarrow\; \theta \;+\; \alpha \, \gamma^{t} \, G_t \,
\nabla_\theta \log \pi_\theta(a_t \mid s_t),
\qquad
G_t \;=\; \sum_{k=t}^{T-1} \gamma^{\,k-t} r_{k+1}.
$$

Here $\alpha$ is a step size, $\gamma \in [0,1]$ the discount factor, $T$ the
episode length, and $G_t$ the return **from time $t$ onward** — not the return of
the whole episode. The factor $\gamma^{t}$ belongs to the unbiased estimator and
is the piece almost every implementation drops.

## Why it matters

REINFORCE answers a question value-based methods cannot ask: how do you improve a
policy when you cannot differentiate through the environment? When the reward
comes from a simulator, a physical system or a human rater, there is no gradient
of reward with respect to the action. REINFORCE differentiates the _sampling
distribution_ instead of the reward, which needs only $\log \pi_\theta(a \mid s)$
and its gradient — something any neural network policy gives you for free.

That makes it the base case for essentially every modern policy optimisation
method: actor-critic, A3C, TRPO and PPO are all REINFORCE with a better estimate
of the scaling term, a constraint on the step, or both.

## Intuition

Trial-and-error credit assignment with no model of why anything worked. The
policy rolls out an episode; the episode returns $+12$; REINFORCE makes every
action in it more likely, in proportion to the reward that came after. It has no
idea which action was the good one. It relies on the fact that _on average,
across many episodes_, actions that genuinely cause high return appear more often
in the high-return rollouts.

Where the analogy breaks: this is not "reinforcing what worked" in any per-action
sense. A terrible action that happened to precede a lucky windfall is reinforced
just as hard. The algorithm is correct only in expectation, and how many samples
that expectation needs is the whole practical story.

## Concrete example

Two actions, a softmax policy over logits $\theta = (\theta_1, \theta_2)$, one
step per episode, $\theta = (0,0)$ so $\pi = (0.5, 0.5)$. The score is
$\nabla_{\theta_j} \log \pi(a) = \mathbb{1}[j = a] - \pi_j$. Take $\alpha = 0.1$
and rewards $r(a_1) = 1$, $r(a_2) = 0$.

- Sample $a_1$: $\Delta\theta = 0.1 \cdot 1 \cdot (0.5, -0.5) = (0.05, -0.05)$.
- Sample $a_2$: $\Delta\theta = 0.1 \cdot 0 \cdot (-0.5, 0.5) = (0, 0)$.

Expected update $(0.025, -0.025)$, per-sample standard deviation $0.025$ in each
coordinate. Now add $10$ to both rewards, $r = (11, 10)$: nothing about the
problem has changed and the optimal policy is identical.

- Sample $a_1$: $\Delta\theta = 0.1 \cdot 11 \cdot (0.5, -0.5) = (0.55, -0.55)$.
- Sample $a_2$: $\Delta\theta = 0.1 \cdot 10 \cdot (-0.5, 0.5) = (-0.5, 0.5)$.

The expected update is still exactly $(0.025, -0.025)$ — unbiased either way —
but the standard deviation is now $0.525$, twenty-one times larger. Subtract the
mean reward as a baseline, $b = 10.5$, and both samples give $(0.025, -0.025)$
exactly: the variance collapses to zero and every sample is the true gradient.
That is the whole argument for baselines, on numbers you can check by hand.

## Formal treatment

Let $\tau = (s_0, a_0, r_1, \dots, s_{T})$ be a trajectory with density
$p_\theta(\tau) = \rho(s_0) \prod_t P(s_{t+1} \mid s_t, a_t)\, \pi_\theta(a_t \mid s_t)$,
and let the objective be $J(\theta) = \mathbb{E}_{\tau \sim p_\theta}[R(\tau)]$
with $R(\tau) = \sum_{t} \gamma^{t} r_{t+1}$. The likelihood-ratio identity
$\nabla_\theta p_\theta = p_\theta \nabla_\theta \log p_\theta$ gives

$$
\nabla_\theta J(\theta)
= \mathbb{E}_{\tau \sim p_\theta}\!\left[ R(\tau)\, \nabla_\theta \log p_\theta(\tau) \right].
$$

The transitions and $\rho$ do not depend on $\theta$, so they vanish under the
gradient of the log and the estimator is model-free:
$\nabla_\theta \log p_\theta(\tau) = \sum_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)$.
Rewards earned _before_ step $t$ contribute zero in expectation and can be
dropped, leaving

$$
\nabla_\theta J(\theta)
= \mathbb{E}\!\left[ \sum_{t=0}^{T-1} \gamma^{t} \, G_t \,
\nabla_\theta \log \pi_\theta(a_t \mid s_t) \right].
$$

**Baselines.** For any $b(s_t)$ not depending on $a_t$,
$\mathbb{E}_{a \sim \pi}[\,b(s)\nabla_\theta \log \pi_\theta(a\mid s)\,]
= b(s)\,\nabla_\theta \sum_a \pi_\theta(a \mid s) = b(s)\,\nabla_\theta 1 = 0$.
So replacing $G_t$ by $G_t - b(s_t)$ leaves the estimator unbiased while changing
its variance; the natural choice is $b(s_t) \approx v_{\pi}(s_t)$, which is cheap
to learn but not the variance-minimising baseline.

A minimal implementation, with the discount weight explicit:

```python
import torch

def reinforce_loss(logps, rewards, gamma=0.99, baseline=0.0, discount_weight=True):
    """logps[t] is log pi_theta(a_t | s_t) as a 0-dim tensor; rewards[t] is r_{t+1}."""
    T = len(rewards)
    G, returns = 0.0, [0.0] * T
    for t in reversed(range(T)):          # G_t = r_{t+1} + gamma * G_{t+1}
        G = rewards[t] + gamma * G
        returns[t] = G
    returns = torch.tensor(returns)
    w = torch.tensor([gamma ** t for t in range(T)]) if discount_weight else torch.ones(T)
    # gradient ASCENT on J, so minimise the negative
    return -(w * (returns - baseline) * torch.stack(logps)).sum()
```

## Assumptions and requirements

The policy must be **stochastic and differentiable** in $\theta$, with
$\pi_\theta(a \mid s) > 0$ for every action you need to learn about: an action
never sampled receives no gradient, and a policy that collapses to near-determinism
cannot recover. The score is undefined for a deterministic policy, which is why
the deterministic policy gradient has a form of its own — the expected
action-gradient of $Q$ rather than a score — although Silver et al. (2014) prove
that form is exactly the zero-variance limit of the stochastic policy gradient.

Sampling must be **on-policy**: the expectation is over $p_\theta$ at the current
$\theta$, so a second gradient step on the same batch is already biased unless
importance weights correct it. The task must be **episodic**, or truncated in a
way you are willing to be biased about, because $G_t$ is unavailable until
termination. And the dynamics must not depend on $\theta$ — that is the step
where the transition terms dropped out, and it fails in self-play where the
opponent is the same network.

## Uses and applicability

Reach for REINFORCE when the action space is discrete or the reward is a black
box: combinatorial decisions, discrete latent variables, sampling from sequence
models, architecture search, anything with a simulator or a human between action
and score. It is also the right baseline to debug against, having no moving parts
beyond the estimator.

Avoid it when episodes are long or unbounded, when sample efficiency matters, or
when a value function is cheap to fit — there the bootstrapped critic of an
actor-critic method, as used at scale in A3C, buys more than the bias costs. Do
not use it at all when the reward is differentiable through a known path.

## Limitations and common mistakes

**The variance is the algorithm's defining problem.** It grows with the horizon,
because each of the $T$ score terms is multiplied by a return that itself
aggregates $T$ noisy rewards. Thousands of episodes to get a usable gradient
direction is normal, not a sign of a bug.

**The dropped $\gamma^{t}$.** The unbiased estimator carries $\gamma^{t}$ on the
step-$t$ term, so later steps count for less. Nearly every implementation omits
it and applies $\gamma$ only inside $G_t$. Sutton and Barto flag this explicitly;
most tutorials do not. The omission is not neutral: the resulting estimator is
biased for the discounted objective. It is usually defended as targeting an
undiscounted objective with $\gamma$ as a variance-reduction knob, and it does
tend to work better, but it is a substitution rather than an identity, and
presenting the common form as _the_ REINFORCE gradient is wrong.

**The surrogate loss is not a loss.** Only its gradient carries meaning; watching
its value fall tells you nothing about policy quality.

**Baseline errors.** A baseline is unbiased only if it does not depend on the
action taken. Normalising returns across a batch is the common half-mistake:
subtracting the batch mean is a legitimate baseline, but dividing by the batch
standard deviation rescales the gradient and is an adaptive step size, not part
of the estimator.

**Whole-trajectory returns.** Scaling every score term by the full episode return
$R(\tau)$ instead of $G_t$ is also unbiased but strictly worse: it credits each
action with rewards collected before it was taken.

## Variants and alternatives

**REINFORCE with baseline** subtracts $b(s_t)$, most usefully a learned
$\hat v(s_t; w)$ fitted by regression on the same returns: unbiased, much lower
variance, still needs full episodes. **Actor-critic** goes further and replaces
$G_t$ with a bootstrapped target, trading unbiasedness for online updates and
continuing tasks; A3C's advantage estimate is exactly this, plus an entropy bonus
against policy collapse. **TRPO and PPO** keep the estimator but constrain how far
the policy may move per update, which is what makes several epochs on one batch
safe; PPO's clipped ratio is the pragmatic form. Recent language-model work often
computes the baseline from several samples of the same prompt instead of a value
network.

Genuinely different approaches: **pathwise (reparameterisation) gradients**, far
lower variance but needing a differentiable reward and a continuous,
reparameterisable distribution; **evolution strategies**, which perturb parameters
rather than actions and parallelise trivially while ignoring within-episode
structure; and **value-based methods**, which learn $Q$ and never represent a
policy at all.

## History and attribution

REINFORCE was introduced by Ronald J. Williams in 1992, in _Machine Learning_,
as "Simple statistical gradient-following algorithms for connectionist
reinforcement learning". The name is an acronym for the shape of the update:
REward Increment = Nonnegative Factor × Offset Reinforcement × Characteristic
Eligibility — the step size, the return minus a baseline, and the score. Williams
was working on connectionist networks with stochastic units, where
backpropagation did not apply because the training signal was a scalar evaluation
rather than a target output; the results predate the framing of the problem as an
MDP.

The same identity was developed independently in simulation optimisation under
the names likelihood-ratio and score-function gradient estimation, and it is the
estimator that appears in variational inference with discrete latents. Its
extension to function approximation with a learned critic — the policy gradient
theorem — came around 2000 and is what connects Williams' algorithm to modern
actor-critic methods.

## Sources

Sutton and Barto's Chapter 13 is the reference treatment: it derives the policy
gradient theorem, gives REINFORCE and REINFORCE-with-baseline as pseudocode with
the $\gamma^{t}$ factor in place, and is one of the few sources to note that the
factor is routinely omitted. The A3C paper states most clearly how a learned
baseline turns the algorithm into actor-critic. The PPO paper is best on the
failure mode — why the raw estimator cannot safely take large steps or reuse
data — and on the standard remedy.

## Prerequisites and next connections

Understand expectations and variance first
([Probability Theory](./probability-theory.md)) and gradient updates from noisy
samples ([Stochastic Gradient Descent](./stochastic-gradient-descent.md)), since
REINFORCE is SGD on an objective whose gradient you can only sample; the score is
computed by ordinary [Backpropagation](./backpropagation.md) through the policy
network.

From here, the general policy gradient theorem explains why the sampled return
can be swapped for anything that estimates $q_\pi$, and actor-critic follows
immediately. For the sharpest contrast, see
[Variational Autoencoders](./variational-autoencoders.md), where the
reparameterisation trick displaced this same score-function estimator because its
variance was intolerable — the same choice, made in a different field.
