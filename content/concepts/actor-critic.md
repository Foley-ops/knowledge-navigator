---
concept_id: concept.reinforcement_learning.actor_critic
title: Actor-Critic
slug: /concepts/actor-critic
aliases:
  - advantage actor-critic
kind: method
tier: 1
review_state: generated-draft
summary: A reinforcement learning architecture in which a parameterised policy is updated using a separately learned value function, buying a large reduction in gradient variance at the price of whatever bias that value function carries.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.policy_gradients
    note: The actor update is the policy gradient estimator with the return replaced by a critic-derived coefficient, so the theorem that licenses it is stated there and not repeated here.
  - type: requires
    target: concept.reinforcement_learning.temporal_difference_learning
    note: The critic is fit by bootstrapped TD regression, and its bias, its stability and its step-size requirements are TD's, not the policy's.
  - type: contrasts_with
    target: concept.reinforcement_learning.reinforce
    note: REINFORCE uses the full sampled return and is unbiased with high variance; actor-critic substitutes a learned estimate and moves to the opposite side of the same trade.
  - type: contrasts_with
    target: concept.reinforcement_learning.q_learning
    note: Q-learning keeps only a value function and recovers actions by maximising over them, which actor-critic avoids by carrying an explicit policy that need not be maximised over.
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
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mnih2016.a3c
    title: Asynchronous Methods for Deep Reinforcement Learning
    url: https://arxiv.org/abs/1602.01783
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - formal-treatment
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.haarnoja2018.sac
    title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor'
    url: https://arxiv.org/abs/1801.01290
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Schulman et al., the paper introducing generalised advantage estimation (2016)
    reason: The registry has no entry for it. The truncated GAE recursion is stated in the PPO paper cited here, but the attribution of the estimator and its original bias-variance analysis rest on nothing in the registry.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: Published head-to-head comparisons of synchronous A2C against asynchronous A3C
    reason: The claim that the synchronous batched variant matches A3C on the same benchmarks circulates through implementation reports rather than through any source the registry lists.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

An **actor-critic** method learns two things at once: a parameterised policy
$\pi_\theta(a \mid s)$, the _actor_, and a value function $v_w(s)$ (or
$q_w(s,a)$), the _critic_. The actor is updated by a policy gradient in which
the sampled return is replaced by a coefficient computed from the critic —
typically the advantage — and the critic is updated by bootstrapped regression
onto its own next-step estimate. What makes the pair a method is that the
actor learns from the critic's bootstrapped estimate rather than from the
observed return.

## Why it matters

The pure Monte Carlo policy gradient estimates the quality of an action by the
whole return that followed it. Every reward after the action — including those
caused by hundreds of later decisions and by environment noise — lands in the
credit assigned to it, so variance grows with the horizon and the signal for a
single early action is buried.

A critic collapses that sum into one learned number. Three things follow. The
estimator's variance drops by orders of magnitude in long-horizon tasks. The
actor can be updated _online_, after a handful of steps, instead of waiting for
an episode to end — which makes continuing, non-episodic tasks tractable at all.
And because the policy is explicit, the action space may be continuous, where
the $\max_a$ of a value-only method is itself an optimisation problem. Much of
deep RL in current use — PPO, SAC, the PPO-based policy-optimisation stage
of RLHF — is actor-critic.

## Intuition

The actor proposes; the critic grades. Instead of playing a whole game and
learning only from the final score, the actor makes a move and a coach says
"that improved your position by about a tenth of a pawn" — immediately, and far
less noisily than the score.

Where the analogy breaks is competence: this critic learns from data generated
by the very policy it grades, and at initialisation it is nearly arbitrary. A wrong critic
does not merely add noise — it adds a _systematic_ push in a wrong direction,
the actor moves there, and the new data it collects is what the critic next
learns from. That feedback loop, which has no counterpart in the coaching
picture, is why these methods are finicky.

## Concrete example

Take a three-step segment with $\gamma = 0.99$, $\lambda = 0.95$, rewards
$(0, 0, 1)$, critic values $v_w(s_0), v_w(s_1), v_w(s_2) = (0.5,\, 0.8,\, 1.0)$
and $v_w(s_3) = 1.2$. The TD errors are

$$
\delta_0 = 0 + 0.99(0.8) - 0.5 = 0.292, \quad
\delta_1 = 0 + 0.99(1.0) - 0.8 = 0.190, \quad
\delta_2 = 1 + 0.99(1.2) - 1.0 = 1.188 .
$$

Accumulating them backwards with weight $\gamma\lambda = 0.9405$ gives the
advantage estimates $\hat{A}_2 = 1.188$, $\hat{A}_1 = 1.307$,
$\hat{A}_0 = 1.521$. At $\lambda = 0$ the first would instead be
$\hat{A}_0 = \delta_0 = 0.292$; at $\lambda = 1$ it would be
$0.292 + 0.99(0.190) + 0.9801(1.188) = 1.644$, which is exactly the discounted
return of the segment plus the bootstrapped tail, minus $v_w(s_0)$. One knob
moves the estimate by a factor of five on identical data.

```python
import numpy as np

def gae(rewards, values, last_value, gamma=0.99, lam=0.95):
    """Advantages for one segment with no terminal state inside it."""
    values = np.append(values, last_value)
    advantages, running = np.zeros(len(rewards)), 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] - values[t]
        running = delta + gamma * lam * running
        advantages[t] = running
    return advantages

print(gae([0.0, 0.0, 1.0], [0.5, 0.8, 1.0], 1.2))  # [1.521 1.307 1.188]
```

A real implementation carries a `done` mask that zeroes both $\gamma v(s_{t+1})$
and the accumulator at an episode boundary; omitting it bleeds value across
episodes and is a common bug.

## Formal treatment

The policy gradient theorem gives
$\nabla_\theta J(\theta) = \mathbb{E}\!\left[\nabla_\theta \log \pi_\theta(a_t \mid s_t)\, \Psi_t\right]$
for a family of admissible coefficients $\Psi_t$; the derivation belongs to the
policy gradients page. Actor-critic is the choice of $\Psi_t$ built from a
learned value function. The natural target is the advantage

$$
A^\pi(s,a) = Q^\pi(s,a) - V^\pi(s),
$$

which asks how much better $a$ is than the policy's own average behaviour in
$s$. The one-step TD error
$\delta_t = r_{t+1} + \gamma v_w(s_{t+1}) - v_w(s_t)$ is an unbiased estimate of
it _provided the critic is exact_: if $v_w = V^\pi$ then
$\mathbb{E}[\delta_t \mid s_t, a_t] = A^\pi(s_t, a_t)$.

Generalised advantage estimation interpolates between $\delta_t$ and the full
return by an exponentially weighted average of $n$-step advantages:

$$
\hat{A}^{(\gamma,\lambda)}_t = \sum_{l \ge 0} (\gamma\lambda)^l\, \delta_{t+l},
$$

truncated at the end of the collected segment. At $\lambda = 0$ this is
$\delta_t$: minimal variance, and biased by exactly the critic's Bellman
residual. At $\lambda = 1$ it telescopes to
$\sum_{l\ge 0}\gamma^l r_{t+l+1} - v_w(s_t)$ — the Monte Carlo return with
$v_w$ acting as a pure baseline. This is the precise statement of the trade:
at $\lambda = 1$ the _gradient_ stays unbiased however wrong the critic is,
because a state-dependent baseline satisfies
$\mathbb{E}_{a \sim \pi}[\nabla_\theta \log \pi_\theta(a \mid s)\, b(s)] = 0$;
for any $\lambda < 1$ the critic's error enters through a bootstrap and biases
the gradient itself. Typical values are $\lambda \in [0.9, 0.99]$.

The critic is fit by the semi-gradient TD update
$w \leftarrow w + \alpha_w\,\delta_t\,\nabla_w v_w(s_t)$, equivalently by
regressing $v_w(s_t)$ on a target that is treated as a constant. The combined
deep-learning objective, minimised by stochastic gradient descent, is

$$
L(\theta, w) = -\sum_t \log \pi_\theta(a_t \mid s_t)\,\operatorname{sg}[\hat{A}_t]
\;+\; c_v \sum_t \big(v_w(s_t) - \hat{R}_t\big)^2
\;-\; c_e \sum_t H\!\left[\pi_\theta(\cdot \mid s_t)\right],
$$

where $\operatorname{sg}$ is the stop-gradient, $\hat{R}_t = \hat{A}_t + v_w(s_t)$
and $H$ is the policy entropy, whose bonus discourages premature collapse to a
deterministic policy.

## Assumptions and requirements

The critic is a function of state, so the state must be Markov. Under partial
observability $v_w$ regresses onto an average over the hidden variable and its
error is not noise but a persistent bias, which $\lambda < 1$ then feeds into
the actor.

The estimator is on-policy: $\hat{A}_t$ estimates the advantage of the policy
that generated the data, so reusing a batch across many gradient steps is
already off-policy and needs importance weighting, a trust region, or an
off-policy critic.

Convergence results, in the linear settings where they exist, require two
timescales — the actor's step size vanishing faster than the critic's, so the
critic tracks a policy changing slowly beneath it. Deep implementations use one
optimiser and guarantee nothing. Bootstrapping, function approximation and
off-policy data together are the deadly triad, and actor-critic with a replay
buffer sits inside it.

## Uses and applicability

Reach for actor-critic when the action space is continuous or very large, when
episodes are long or unending, or when the policy must be constrained
directly — as in RLHF, where a KL penalty against a reference policy is applied
to the actor.
A3C demonstrated the family across Atari and continuous control on CPU alone;
SAC is a standard choice for sample-efficient continuous control on robots.

Do not reach for it first in a small discrete action space with dense rewards,
where a well-tuned value method is simpler and often stronger, nor when
episodes are short enough that the full return is already low-variance — there,
REINFORCE with a baseline gives unbiasedness for free. Offline, with no
on-policy data to collect, the plain on-policy actor-critic does not apply.

## Limitations and common mistakes

The central mistake is conflating a _baseline_ with a _critic_. Subtracting
$b(s)$ from the return is exactly unbiased whatever $b$ is; bootstrapping
through $v_w$ is not. "The critic reduces variance" is half the
method; the other half is "and biases the gradient by its Bellman residual".

Second, critic errors do not average out — the actor is pushed toward whatever
the critic overvalues and collects the data that entrenches it. Value
overestimation is the standard failure of $q$-critics, and is why modern
off-policy methods carry two of them.

Third, implementation conventions get mistaken for theory. Normalising
advantages to zero mean and unit variance within a batch is an empirical trick
that rescales the effective step size, not part of any theorem. The $\gamma^t$
weighting that the policy gradient theorem places on the state distribution is
dropped by essentially every implementation, which makes the update a biased
estimator of the discounted objective — a deliberate, known inconsistency.
Forgetting the stop-gradient on $\hat{A}_t$, or letting a shared trunk's value
loss dominate the policy loss through a badly chosen $c_v$, are bugs whose
symptom is simply that learning stalls.

## Variants and alternatives

**A3C** runs many actors asynchronously against separate environment copies,
each computing $n$-step returns and applying gradients to shared parameters;
the decorrelation across workers substitutes for a replay buffer. **A2C** is
the synchronous, GPU-friendly form, and how much the asynchrony itself
contributed is contested.

**TRPO** and **PPO** keep the same actor-critic skeleton and constrain the size
of the policy update — a KL trust region and a clipped surrogate objective
respectively — buying tolerance to multiple epochs over one batch. **DDPG** and
**TD3** use a deterministic actor with a $q$-critic and a replay buffer;
**SAC** adds a maximum-entropy objective, a stochastic actor and twin critics,
and is markedly more sample-efficient than on-policy methods at the cost of
more moving parts. **Natural actor-critic** replaces the Euclidean gradient
with the natural one.

The genuine alternatives drop one half or the other: value-only methods drop
the actor, pure policy-gradient methods drop the critic and keep unbiasedness,
and planning methods replace the actor's judgement with search.

## History and attribution

The architecture is one of the oldest in reinforcement learning. Actor-critic
learning in essentially the modern two-component form appears in Witten's work
in the late 1970s, and the terms _actor_ and _critic_ were established by
Barto, Sutton and Anderson in 1983, whose adaptive-critic neuron-like elements
solved the pole-balancing problem; that lineage is set out in Sutton and
Barto's book. Interest shifted to value-only methods through the 1990s, and
returned with convergence analyses of actor-critic algorithms by Konda and
Tsitsiklis around 2000 and with the policy gradient theorem. The deep-learning
era opens with the trust-region methods and generalised advantage estimation,
and A3C in 2016 is what made the family the default for large-scale
work; PPO and SAC followed.

## Sources

Sutton and Barto is the reference for the definition, the one-step and
eligibility-trace forms, the bias of bootstrapping and the early history. The
A3C paper covers parallel actors, $n$-step returns, the entropy bonus and the
shared actor-critic network. The PPO paper states the truncated advantage
recursion used above. Soft Actor-Critic covers the off-policy, maximum-entropy
branch and the twin-critic response to overestimation.

## Prerequisites and next connections

Read the policy gradients page first — the theorem licensing the actor update
is there — then temporal-difference learning, which is what the critic runs.
Markov decision processes supply the notation;
[Bias-Variance](./bias-variance.md) is the trade this page instantiates, and
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) trains both
halves.

It opens up the trust-region and clipped-objective methods built on this
skeleton, the off-policy actor-critics used in robotics, and the RLHF stage of
language model training — an actor-critic whose environment is a learned reward
model. Implementations mostly live in [PyTorch](./pytorch.md).
