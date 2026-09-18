---
concept_id: concept.reinforcement_learning.sac
title: SAC
slug: /concepts/sac
aliases:
  - soft actor-critic
kind: algorithm
tier: 1
review_state: generated-draft
summary: An off-policy actor-critic algorithm for continuous control that pays the agent for entropy as well as reward, so the optimum it converges to is a genuinely stochastic policy rather than a deterministic one with noise bolted on.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.actor_critic
    note: SAC is the actor-critic split with soft targets substituted in; the roles of the two networks and the reason a critic is worth learning at all are established there and assumed here.
  - type: generalizes
    target: concept.reinforcement_learning.q_learning
    note: The soft Bellman backup replaces the max over actions with a log-sum-exp, and recovers the ordinary Q-learning backup exactly as the temperature goes to zero.
  - type: contrasts_with
    target: concept.reinforcement_learning.ppo
    note: PPO is on-policy and throws each batch away after a few epochs where SAC replays a buffer indefinitely, so the two are the opposite standard answers to how continuous-control data should be reused.
  - type: contributes_to
    target: concept.reinforcement_learning.offline_reinforcement_learning
    note: Several offline algorithms are SAC with a pessimism or behaviour-constraint term added, because SAC's off-policy critic is precisely the component that fails on a fixed dataset.
sources:
  - source_id: source.haarnoja2018.sac
    title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor'
    url: https://arxiv.org/abs/1801.01290
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
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
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: Haarnoja et al., the follow-up paper that introduces automatic temperature tuning (2018)
    reason: The registry holds the original SAC preprint, in which the temperature is a fixed hyperparameter. The constrained formulation, its dual, and the target-entropy heuristic come from a later paper the registry does not list, so the treatment of automatic temperature here is uncited.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: A source for the discrete-action adaptation of SAC
    reason: SAC as published is a continuous-action algorithm, and the reformulation that sums over a finite action set rests on a later paper that is not in the registry.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Soft Actor-Critic (SAC)** maximises the entropy-augmented return

$$
J(\pi) \;=\; \mathbb{E}_{\tau \sim \rho_\pi}\!\left[\, \sum_{t} \gamma^{t}\big( r(s_t, a_t) \;+\; \alpha\, \mathcal{H}(\pi(\cdot \mid s_t)) \big) \right],
$$

where $\mathcal{H}(\pi(\cdot \mid s)) = -\mathbb{E}_{a \sim \pi}[\log \pi(a \mid s)]$ and the
**temperature** $\alpha > 0$ sets the exchange rate between reward and entropy. It
learns this objective off-policy from a replay buffer, with a stochastic actor over a
continuous action space, two independently trained critics, and a reparameterised
actor gradient.

## Why it matters

Before SAC, continuous control forced an unpleasant choice. On-policy methods were
stable but discarded every batch after a handful of gradient steps, so a MuJoCo task
cost millions of environment interactions. The off-policy alternative, deterministic
policy gradient with added exploration noise, reused data but was notoriously
sensitive to hyperparameters and seeds. SAC reuses data like the latter and behaves
like the former, and the entropy term is why: a policy that is rewarded for staying
spread out does not collapse onto a narrow deterministic action early, which is the
mechanism behind most of the brittleness.

The second thing it makes possible is a principled answer to "how much should the
agent explore?". Exploration stops being a schedule bolted onto the algorithm and
becomes part of what is being optimised.

## Intuition

Ordinary RL asks for the single best action. Maximum-entropy RL asks for a
_distribution_ over actions that is as good as possible while staying as uncommitted
as possible, and the temperature says how much goodness you will trade for
uncommittedness. If two actions have nearly the same value, the agent should take
both about equally often; if one is far better, it should concentrate there.

The thermodynamic analogy is exact enough to be useful: the optimal policy is a
Boltzmann distribution whose energy is $-Q^*/\alpha$, and the soft value is a free
energy. Where the analogy stops: there is no bath, nothing is being equilibrated, and
$\alpha$ is not measured in anything physical — it carries units of reward, which is
why changing the scale of your reward function changes what a given $\alpha$ means.

## Concrete example

Take a state with two actions whose optimal soft Q-values are $Q^*(s,a_1) = 1.0$ and
$Q^*(s,a_2) = 0.9$. The optimal policy is $\pi^*(a \mid s) \propto \exp(Q^*(s,a)/\alpha)$:

| $\alpha$ | $\pi^*(a_1)$ | $\pi^*(a_2)$ | soft $V^*(s)$ |
| -------- | ------------ | ------------ | ------------- |
| $1.0$    | $0.525$      | $0.475$      | $1.644$       |
| $0.1$    | $0.731$      | $0.269$      | $1.031$       |
| $0.01$   | $0.99995$    | $0.00005$    | $1.0000$      |

The soft value exceeds $\max_a Q^*$ by at most $\alpha \log |\mathcal{A}|$, and as
$\alpha \to 0$ both the policy and the value converge to the greedy ones. This is a
discrete illustration; SAC itself integrates over a continuous action set.

The implementation detail most often got wrong is the density of the squashed action.
SAC samples $u \sim \mathcal{N}(\mu_\phi(s), \sigma_\phi(s))$ and returns
$a = \tanh(u)$ to respect a bounded action range, so the log-density needs the
change-of-variables correction:

```python
import torch

def sample(mu, log_std):
    std = log_std.exp()
    normal = torch.distributions.Normal(mu, std)
    u = normal.rsample()                                    # reparameterised sample
    a = torch.tanh(u)
    logp = normal.log_prob(u).sum(-1)
    logp = logp - torch.log(1 - a.pow(2) + 1e-6).sum(-1)    # tanh Jacobian
    return a, logp
```

Drop that second line and the reported entropy is wrong, the temperature is tuned
against a fiction, and the actor loss can be driven down without bound by inflating
$\sigma$: the unsquashed Gaussian's entropy grows without limit while the actions it
produces merely pile up at $\pm 1$.

## Formal treatment

Write $\mathcal{D}$ for the replay buffer, $Q_{\theta_1}, Q_{\theta_2}$ for the two
critics with Polyak-averaged target copies $Q_{\bar\theta_j}$, and $\pi_\phi$ for the
actor. The **soft value function** and **soft Q-function** of a policy $\pi$ satisfy

$$
V^\pi(s) = \mathbb{E}_{a \sim \pi}\!\left[ Q^\pi(s,a) - \alpha \log \pi(a \mid s) \right],
\qquad
Q^\pi(s,a) = r(s,a) + \gamma\, \mathbb{E}_{s'}\!\left[ V^\pi(s') \right].
$$

At the optimum the entropy term turns the max into a log-sum-exp,

$$
V^*(s) = \alpha \log \int_{\mathcal{A}} \exp\!\big(Q^*(s,a)/\alpha\big)\, \mathrm{d}a,
\qquad
\pi^*(a \mid s) = \exp\!\big( (Q^*(s,a) - V^*(s))/\alpha \big),
$$

which is the sense in which **entropy is not a trick**: it changes the fixed point,
not just the trajectory towards it. Haarnoja et al. prove that alternating soft policy
evaluation and soft policy improvement converges to $\pi^*$ in the tabular case.

The practical algorithm restricts $\pi_\phi$ to diagonal Gaussians, so exact
improvement is impossible and the improvement step becomes a KL projection onto that
family. Minimising that KL, dropping the intractable normaliser and reparameterising
$a = f_\phi(\epsilon; s)$ with $\epsilon \sim \mathcal{N}(0, I)$, gives the actor loss

$$
J_\pi(\phi) = \mathbb{E}_{s \sim \mathcal{D},\, \epsilon}\!\left[ \alpha \log \pi_\phi(f_\phi(\epsilon;s) \mid s) - \min_{j=1,2} Q_{\theta_j}(s, f_\phi(\epsilon;s)) \right],
$$

and the critic loss regresses each $Q_{\theta_j}$ on the soft target

$$
y = r + \gamma \Big( \min_{j=1,2} Q_{\bar\theta_j}(s', a') - \alpha \log \pi_\phi(a' \mid s') \Big),
\qquad a' \sim \pi_\phi(\cdot \mid s').
$$

Two points about this target. The $\min$ over twin critics addresses **maximisation
bias**: the actor is trained to maximise $Q$, so it seeks out exactly the states and
actions where the critic's error is most positive, and bootstrapping then propagates
that error. Taking the minimum of two independently initialised estimates biases
downwards instead, which is the lesser evil. And because $a'$ is sampled fresh from the
current policy rather than read from the buffer, the backup needs no importance
weights: this is what makes SAC off-policy in a clean way.

Later versions replace fixed $\alpha$ with a constrained problem — maximise return
subject to $\mathbb{E}[-\log \pi(a_t \mid s_t)] \ge \bar{\mathcal{H}}$ — and follow its
dual, giving $J(\alpha) = \mathbb{E}_{a \sim \pi_\phi}[-\alpha \log \pi_\phi(a \mid s) - \alpha \bar{\mathcal{H}}]$,
optimised over $\log \alpha$ to keep it positive. The usual target is
$\bar{\mathcal{H}} = -\dim(\mathcal{A})$.

## Assumptions and requirements

The convergence proof is tabular: finite state and action sets, exact policy
evaluation, and improvement over all policies. With neural critics, a Gaussian actor
and a replay buffer, none of those hold, and SAC inherits the standard instability of
off-policy bootstrapping with function approximation — the deadly triad. Target
networks and twin critics are the empirical patches, not guarantees.

The entropy in a continuous action space is _differential_ entropy. It can be
negative, and it is not invariant under rescaling the action units: doubling the range
of every action shifts $\mathcal{H}$ by $\dim(\mathcal{A}) \log 2$. So $\alpha$, and
the $-\dim(\mathcal{A})$ target-entropy heuristic, presuppose actions normalised to
roughly $[-1,1]^{\dim(\mathcal{A})}$. SAC also needs a differentiable reparameterisation
of the policy, which a Gaussian has and a discrete distribution does not.

## Uses and applicability

Reach for SAC when actions are continuous, the environment is expensive relative to
compute, and you can keep a replay buffer — robotic manipulation and locomotion,
simulated control, tuning problems with a continuous knob. It is the usual first
off-policy baseline because it works across tasks at close to default settings.

Do not reach for it when the action space is discrete without modification, when you
cannot afford to store transitions, or when the environment is so cheap that the
simplicity of an on-policy method wins. And it is off-policy, not offline: learning
from a fixed dataset collected by someone else breaks the critic, because the target
queries $Q$ at actions $a' \sim \pi_\phi$ that the dataset never contains and nothing
corrects the resulting extrapolation error.

## Limitations and common mistakes

The most common misconception is that the entropy bonus is an exploration schedule to
be annealed away. At fixed $\alpha$ it defines a different optimal policy, so the
number SAC optimises is not the environment's return; reporting entropy-augmented
values as returns compares the wrong quantity against other algorithms.

The second is thinking automatic temperature tuning removes a hyperparameter. It
replaces $\alpha$ with $\bar{\mathcal{H}}$, which is easier to set but still a choice,
and it is a constraint on _average_ entropy, not per state.

The third is expecting twin critics to give an unbiased estimate. The minimum of two
noisy estimates is biased low, and the underestimation compounds over the discount
horizon; the fix is a trade, not a cure.

Two smaller ones, both costly: forgetting the $\tanh$ Jacobian correction, and leaving
rewards unnormalised. With fixed $\alpha$, the reward scale is effectively the inverse
temperature, and the original paper found it the single most sensitive hyperparameter.

## Variants and alternatives

The **original formulation** learned a separate soft value network alongside the twin
critics; the later, more common form drops it and bootstraps from target Q-networks
directly, with **automatic temperature tuning** as the other change. **Discrete SAC**
replaces the Gaussian with a categorical distribution and integrates the expectations
exactly over actions rather than sampling.

The nearest alternatives are deterministic: **DDPG** and its twin-critic successor
**TD3**, which are cheaper per step and can be better when the optimum really is
deterministic, at the cost of needing an explicit exploration noise process. On the
on-policy side, **PPO** and **TRPO** trade sample efficiency for robustness and
parallelism, and remain the default where simulation is cheap. **Soft Q-learning**, the
direct predecessor, keeps the same objective but represents the energy-based policy with
a sampler instead of projecting onto a Gaussian.

## History and attribution

SAC was introduced by Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel and Sergey Levine in
2018, working on the sample efficiency and hyperparameter brittleness of deep
continuous control. It sits at the end of a longer line: maximum-entropy formulations of
control and of inverse reinforcement learning predate it by roughly a decade, and the
immediate ancestor is the authors' own soft Q-learning. The twin-critic minimum is
borrowed, credited in the paper to contemporaneous work on overestimation in
actor-critic methods, and rests in turn on the older observation that maximising over
noisy value estimates biases them upwards. Automatic temperature tuning arrived in a
follow-up later the same year.

## Sources

The SAC preprint is the primary reference for the objective, the soft policy iteration
proofs, the practical losses and the benchmark comparisons against DDPG, PPO and TD3.
Sutton and Barto supply the underlying machinery this page assumes — Bellman operators,
off-policy learning, the deadly triad, and maximisation bias with double learning as its
remedy. Levine et al.'s offline RL tutorial is the reference for why an off-policy
algorithm still fails on a fixed dataset. The PPO paper is cited only as the on-policy
alternative it is compared against.

## Prerequisites and next connections

Read [Actor-Critic](./actor-critic.md) first: SAC is that architecture with soft targets
substituted in. [Q-Learning](./q-learning.md) gives the backup the soft Bellman operator
modifies, and [Markov Decision Processes](./markov-decision-processes.md) the setting
both live in. The reparameterisation trick in the actor gradient is the same device used
in [Variational Autoencoders](./variational-autoencoders.md), and the Boltzmann form of
the optimal policy is the same object studied in
[Energy-Based Models](./energy-based-models.md).

Afterwards, [DQN](./dqn.md) shows the replay-buffer and target-network machinery in its
original discrete-action setting, and [Policy Gradients](./policy-gradients.md) explains
why the reparameterised gradient SAC uses has lower variance than the score-function
estimator it replaces.
