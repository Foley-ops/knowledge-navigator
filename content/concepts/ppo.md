---
concept_id: concept.reinforcement_learning.ppo
title: PPO
slug: /concepts/ppo
aliases:
  - proximal policy optimization
  - clipped surrogate objective
kind: algorithm
tier: 1
review_state: generated-draft
summary: PPO makes on-policy reinforcement learning sample-efficient by reusing each batch of experience for several epochs of gradient ascent on an objective that clips the policy-probability ratio, a first-order heuristic that removes the incentive to move far without proving that the policy stays close.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.policy_gradients
    note: The clipped objective is a modification of the importance-sampled policy gradient surrogate, and its gradient at the sampling policy is exactly the policy gradient, so the estimator must be understood first.
  - type: specializes
    target: concept.reinforcement_learning.actor_critic
    note: PPO is one particular actor-critic recipe — a learned state-value function supplies the advantage estimates and is fit by a squared-error term inside the same loss.
  - type: contrasts_with
    target: concept.reinforcement_learning.sac
    note: Both are default choices for continuous control, but PPO is on-policy and discards each batch after a few epochs where SAC replays a buffer indefinitely, which is the same trade seen from opposite sides.
  - type: contributes_to
    target: concept.reinforcement_learning.rlhf
    note: PPO is the policy optimiser in the standard RLHF pipeline, where the reward model plays the role of the environment.
sources:
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.schulman2015.trpo
    title: Trust Region Policy Optimization
    url: https://arxiv.org/abs/1502.05477
    source_kind: preprint
    supports:
      - why-it-matters
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-18
  - source_id: source.ouyang2022.instructgpt
    title: Training language models to follow instructions with human feedback
    url: https://arxiv.org/abs/2203.02155
    source_kind: preprint
    supports:
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-18
unresolved_references:
  - label: The code-level-optimisation studies of PPO and TRPO (Engstrom et al.; Andrychowicz et al.)
    reason: The registry has no entry for either. The claim that advantage normalisation, value clipping, reward scaling, orthogonal initialisation and learning-rate annealing account for much of PPO's reported advantage — and that the clipping mechanism alone does not keep the measured KL inside the intended region — rests entirely on those studies.
    sections:
      - limitations-and-common-mistakes
      - assumptions-and-requirements
  - label: Schulman et al., the paper introducing generalised advantage estimation (2016)
    reason: The truncated GAE recursion is stated in the PPO paper cited here, but the estimator's derivation and its bias-variance analysis are not covered by any registry source.
    sections:
      - formal-treatment
  - label: Preference-optimisation and group-baseline successors to PPO for language models (DPO, GRPO)
    reason: Named here only as the direction later work took; the registry lists no source for either, so no property of them is asserted beyond what their names describe.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Proximal Policy Optimization (PPO)** is an on-policy actor-critic algorithm
that reuses each batch of collected experience for several epochs of minibatch
gradient ascent on a clipped surrogate objective. Write

$$
r_t(\theta) \;=\; \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)}
$$

for the probability ratio between the policy being optimised and the policy that
collected the data, and $\hat A_t$ for an estimate of the advantage at step $t$.
The objective is

$$
L^{\text{CLIP}}(\theta) \;=\; \hat{\mathbb{E}}_t\!\left[
\min\!\Big( r_t(\theta)\,\hat A_t,\;
\operatorname{clip}\big(r_t(\theta),\, 1-\epsilon,\, 1+\epsilon\big)\,\hat A_t \Big)
\right],
$$

with $\epsilon$ a small constant, in practice $0.1$ to $0.3$. The $\min$ makes
$L^{\text{CLIP}}$ a pessimistic lower bound on the unclipped surrogate
$\hat{\mathbb{E}}_t[r_t(\theta)\hat A_t]$.

## Why it matters

A plain [Policy Gradient](./policy-gradients.md) step consumes a batch of
on-policy trajectories, takes one gradient step, and throws the batch away. That
is enormously wasteful. Taking many steps instead is what breaks: the advantages
were computed under $\pi_{\theta_{\text{old}}}$ and stop being valid as soon as
the policy moves, so an unconstrained surrogate will happily drive some action's
probability to near zero or one and collapse the policy in a single update.

TRPO fixed this with a hard constraint on the KL divergence between old and new
policy, enforced by a conjugate-gradient solve and a backtracking line search.
That works, but it is second-order machinery and sits awkwardly with parameter
sharing between policy and value function, or with dropout. PPO reaches for the
same behaviour with an objective you can hand to Adam — roughly TRPO's
reliability, a loss function of ten lines — which is why it became the default
on-policy algorithm and the optimiser inside the standard RLHF recipe.

## Intuition

The advantage says which way to move each action's probability. The raw
surrogate $r_t \hat A_t$ says "move it as far as you can", because nothing in it
knows that $\hat A_t$ expires. Clipping flattens the objective past the ratio
range $[1-\epsilon, 1+\epsilon]$: once a good action has been made $1+\epsilon$
times more likely, that sample stops contributing gradient.

Picture a ratchet with a stop on it. The analogy breaks in two places, both
important. The stop is per-sample, not per-update: nothing bounds how far the
policy as a whole moves, and other samples in the minibatch keep pushing. And the
stop is one-sided — the clip removes the gradient pushing the ratio further out,
never the one pulling it back toward $1$.

## Concrete example

Take $\epsilon = 0.2$, so the clip range is $[0.8, 1.2]$. Four cases, one sample
each:

- $\hat A_t = +2$, $r_t = 1.5$: unclipped $3.0$, clipped $1.2 \times 2 = 2.4$,
  $\min = 2.4$. Gradient in $r_t$ is $0$ — a good action already made half again
  as likely gets no further push.
- $\hat A_t = +2$, $r_t = 0.5$: unclipped $1.0$, clipped $0.8 \times 2 = 1.6$,
  $\min = 1.0$. Gradient $+2$ — still pushing the good action up.
- $\hat A_t = -2$, $r_t = 1.5$: unclipped $-3.0$, clipped
  $1.2 \times (-2) = -2.4$, $\min = -3.0$. Gradient $-2$ — a bad action made more
  likely is pushed down at full strength, because the $\min$ selects the
  unclipped term.
- $\hat A_t = -2$, $r_t = 0.5$: unclipped $-1.0$, clipped $-1.6$, $\min = -1.6$.
  Gradient $0$ — already suppressed enough.

Rows one and three are the asymmetry. Clipping switches off the outward push and
never the restoring one. The loss itself:

```python
import torch

def ppo_loss(logp, logp_old, adv, value, value_target, entropy,
             eps=0.2, c_vf=0.5, c_ent=0.01):
    ratio = torch.exp(logp - logp_old)                  # r_t(theta)
    unclipped = ratio * adv
    clipped = torch.clamp(ratio, 1 - eps, 1 + eps) * adv
    policy_loss = -torch.min(unclipped, clipped).mean()
    value_loss = ((value - value_target) ** 2).mean()
    return policy_loss + c_vf * value_loss - c_ent * entropy.mean()
```

## Formal treatment

Fix a discounted MDP with discount $\gamma$, a stochastic policy $\pi_\theta$ and
a value function $V_\phi$. Advantages come from the truncated
generalised-advantage estimator: with
$\delta_t = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t)$ and a horizon of $T$
steps,

$$
\hat A_t \;=\; \sum_{l=0}^{T-t-1} (\gamma\lambda)^l\, \delta_{t+l},
$$

where $\lambda \in [0,1]$ trades bias against variance ($\lambda = 0$ gives the
one-step TD advantage, $\lambda = 1$ the Monte-Carlo one).

The full loss combines three terms:

$$
L^{\text{CLIP+VF+S}}_t(\theta, \phi) \;=\; \hat{\mathbb{E}}_t\!\left[
L^{\text{CLIP}}_t(\theta) \;-\; c_1\big(V_\phi(s_t) - V^{\text{targ}}_t\big)^2
\;+\; c_2\, S\big[\pi_\theta\big](s_t) \right],
$$

with $S$ the policy entropy, $c_1$ the value coefficient and $c_2$ the entropy
bonus. The algorithm runs $N$ actors for $T$ steps each, computes $\hat A_t$ over
that window, then performs $K$ epochs of minibatch ascent over the $NT$ samples
before discarding them. The paper's continuous-control settings are $T = 2048$,
$K = 10$, minibatch $64$, $\gamma = 0.99$, $\lambda = 0.95$; its Atari settings
use $T = 128$ with $8$ actors and $K = 3$.

Two properties matter. At $\theta = \theta_{\text{old}}$ every $r_t = 1$, the
clip is inactive, and $\nabla_\theta L^{\text{CLIP}}$ equals the
advantage-weighted policy gradient — and since $\theta_{\text{old}}$ is reset
once per iteration, not once per epoch, it is the first minibatch step on a
freshly collected batch that is an ordinary policy gradient step, with clipping
governing everything after it.

And what clipping does _not_ give: any bound on
$D_{\mathrm{KL}}(\pi_{\theta_{\text{old}}} \,\|\, \pi_\theta)$. A ratio can be
carried outside $[1-\epsilon, 1+\epsilon]$ by one minibatch and left there, since
a zero gradient at that sample constrains nothing about the parameter change the
rest of the batch induces. TRPO inherits a monotonic-improvement argument from a
surrogate-plus-penalty bound, and even it relaxes that in practice by swapping
the theoretical penalty coefficient for a tuned constraint radius. PPO makes no
such claim at all: the paper presents clipping as simpler than TRPO and
empirically stronger on its benchmarks, not as better founded.

## Assumptions and requirements

The ratio and the advantage are both defined relative to the sampling policy, so
PPO is on-policy: correctness of the estimates degrades as $\theta$ moves, and
the $K$ epochs are a deliberate, bounded violation. Reusing a batch across
iterations, or raising $K$ far beyond ten, breaks the premise rather than
stretching it.

The policy must be stochastic with a tractable density at the taken action — a
diagonal Gaussian for continuous control, a categorical for discrete actions.
Deterministic policies have no ratio and PPO does not apply to them.

The advantages must be usable. They inherit bias from $\lambda$, $\gamma$ and
whatever $V_\phi$ has learned, and early in training multiple epochs amplify that
error rather than extract more signal. The entropy bonus is a convention, not a
requirement: standard on Atari, often zero for continuous control. And $\epsilon$
bounds where the objective goes flat for one sample, not the step size — treating
it as the latter is the assumption that most often fails silently.

## Uses and applicability

Reach for PPO when environment samples are cheap and parallelisable — physics
simulators, games, and language-model fine-tuning where a reward model stands in
for the environment. It tolerates continuous and large discrete action spaces and
is unusually forgiving across domains without structural retuning, which makes it
a common first baseline. In the InstructGPT work it optimises the language-model
policy against the learned reward model, with a KL penalty toward the
supervised-finetuned model.

Do not reach for it when samples are expensive — a physical robot, live users —
because each batch is used for a handful of epochs and discarded, where an
off-policy method with a replay buffer keeps reusing data. Nor when you need a
guarantee you can state, nor when the problem is small enough to plan in exactly.

## Limitations and common mistakes

The dominant misconception is that PPO is a trust-region method. It is not:
there is no proof, and the measured KL between old and new policy routinely
exceeds what $\epsilon$ suggests. Relatedly, $\epsilon$ is often described as
controlling how far the policy moves; it influences that, but the epoch count,
the learning rate and the minibatch size influence it as much.

Implementation details materially change results, and this is a documented
finding rather than folklore. Per-minibatch advantage normalisation, value-loss
clipping, reward scaling, orthogonal initialisation with specific gains,
learning-rate annealing and global-norm gradient clipping are all in the
reference implementation and absent from the paper's equations. Studies
reimplementing PPO and TRPO with matched code-level optimisations found these
account for much of the reported gap between the two. A published PPO number is a
statement about a codebase as well as about an objective.

Other recurring failures: entropy collapse, where a Gaussian policy's standard
deviation shrinks, exploration ends and nothing in the clipped objective brings
it back — log entropy every run; shared policy-value trunks, where $c_1$
silently couples objectives whose gradient scales differ; and raising $K$ to
squeeze more from each batch, which usually degrades performance because the
later epochs optimise a surrogate that is no longer valid.

## Variants and alternatives

**PPO-Penalty** replaces the clip with an adaptive KL penalty,
$\hat{\mathbb{E}}_t[r_t \hat A_t - \beta\, \mathrm{KL}]$, doubling or halving
$\beta$ when the measured KL overshoots or undershoots a target by a factor of
$1.5$; the paper reports it as worse than clipping. **Early stopping** on the
measured KL is a widespread addition that supplies the trust region the clip does
not. **TRPO** remains the option when a genuine constraint matters, at the cost
of second-order machinery. Off-policy actor-critics with replay buffers buy much
better sample efficiency in continuous control and pay in moving parts. For
language models, later work moves toward group-relative baselines in place of a
learned value function, or removes the RL loop entirely in favour of direct
preference optimisation.

## History and attribution

PPO was introduced by Schulman, Wolski, Dhariwal, Radford and Klimov at OpenAI in
a 2017 preprint. It is the direct successor to TRPO, published by Schulman,
Levine, Moritz, Jordan and Abbeel in 2015, which came from asking how large a
policy step could be taken while still guaranteeing improvement. The stated goal
of PPO was to keep TRPO's data efficiency and reliability using only first-order
optimisation — the framing throughout is simplicity, not a stronger theory. It
became OpenAI's default policy-gradient baseline and, in Ouyang et al. (2022),
the optimiser in the RLHF pipeline that trained InstructGPT.

## Sources

The PPO preprint is the source for the clipped objective, the combined loss, the
algorithm's structure, the hyperparameters quoted above and the KL-penalty
variant. The TRPO paper supplies what PPO is a reaction to: the surrogate
objective, the KL constraint and the improvement bound PPO gives up. Sutton and
Barto cover the background the page assumes — advantages, on-policy versus
off-policy sampling, importance ratios, the policy gradient theorem — but not PPO
itself. Ouyang et al. document PPO's use as the optimiser in RLHF.

## Prerequisites and next connections

Read [Policy Gradients](./policy-gradients.md) first — the clipped objective is
unreadable without the score-function estimator it modifies — and then
[Actor-Critic](./actor-critic.md), since PPO's advantage estimates and value loss
are an actor-critic's. [Markov Decision Processes](./markov-decision-processes.md)
supplies the vocabulary of returns, discounting and advantages, and
[REINFORCE](./reinforce.md) shows the high-variance, one-step-per-batch extreme
that PPO's multiple epochs are a response to.

Next, [Q-Learning](./q-learning.md) and [DQN](./dqn.md) show the other family,
where the policy is recovered by maximising a learned value function — which
makes clear how much of PPO's design exists only because the policy is
parameterised directly.
