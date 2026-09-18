---
concept_id: concept.reinforcement_learning.policy_gradients
title: Policy Gradients
slug: /concepts/policy-gradients
kind: method
tier: 1
review_state: generated-draft
summary: A family of reinforcement learning methods that improve a parameterised stochastic policy by ascending an unbiased sample estimate of the gradient of expected return, obtained from the log-derivative of the policy itself.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The objective being differentiated is expected return under an MDP, and the derivation depends on the Markov factorisation of a trajectory's probability.
  - type: generalizes
    target: concept.reinforcement_learning.reinforce
    note: REINFORCE is the Monte-Carlo instance of the general estimator, using full sampled returns where the general form allows any unbiased weighting of the score.
  - type: prerequisite_of
    target: concept.reinforcement_learning.actor_critic
    note: An actor-critic is a policy gradient whose baseline and return estimate come from a learned value function, so the gradient must be understood first.
  - type: contrasts_with
    target: concept.reinforcement_learning.q_learning
    note: Q-learning learns action values and acts by maximising over actions, which policy gradients never do, so the two differ in exactly which object is parameterised.
sources:
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.schulman2015.trpo
    title: Trust Region Policy Optimization
    url: https://arxiv.org/abs/1502.05477
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - uses-and-applicability
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
  - label: Williams (1992), "Simple statistical gradient-following algorithms for connectionist reinforcement learning", Machine Learning 8
    reason: The paper that introduced the REINFORCE family and its baseline is not in the source registry, so the attribution rests on Sutton and Barto's secondary account rather than on the primary source.
    sections:
      - history-and-attribution
  - label: Sutton, McAllester, Singh and Mansour, "Policy Gradient Methods for Reinforcement Learning with Function Approximation" (1999/2000)
    reason: The registry has neither this paper nor the companion Konda and Tsitsiklis actor-critic analysis, so the statement of the policy gradient theorem and the claim of independent, near-simultaneous work rest on Sutton and Barto's account of both.
    sections:
      - formal-treatment
      - history-and-attribution
claims: []
---

## Definition

**Policy gradients** parameterise the policy itself — a differentiable
distribution $\pi_\theta(a \mid s)$ over actions — and update $\theta$ by
gradient ascent on the expected return $J(\theta)$. The gradient is never
computed exactly, because it depends on environment dynamics nobody has in
closed form; it is _estimated from sampled trajectories_, and the estimate is
unbiased. Nothing in the method requires a value function, a model, or a
maximisation over actions.

## Why it matters

Value-based methods learn $q(s,a)$ and act greedily, forcing an $\arg\max_a$ at
every step — cheap for a few discrete actions, badly behaved otherwise. A torque vector in $\mathbb{R}^{20}$ has no enumerable action
set; sampling from a Gaussian over torques costs one forward pass.

Two further things fall out. The optimal policy under partial observability or
against an adversary is often genuinely _stochastic_, which a parameterised
distribution can represent and a greedy value method cannot. And the policy
changes smoothly with $\theta$, where greedy improvement flips discontinuously
when two action values cross — a known source of oscillation under function
approximation.

So much of the work that optimises a non-differentiable objective through a
network's sampled output — continuous control, sequence generation scored by an
external reward, learning from human feedback — has a policy gradient
underneath, though it is not the only estimator available for the job.

## Intuition

The idea fits in one sentence: _take an action, see what happened, and raise the
log-probability of that action in proportion to how good the outcome was_. Scored
$10$, push up ten units of gradient; scored $-3$, push down three.

This is crude credit assignment: the estimator does not know _which_ action was
responsible, only that a batch of them co-occurred with a score. It works because
the noise averages out — good actions turn up in high-scoring trajectories more
often than chance. The analogy is a student told only their final grade.
Where it breaks: the method is blind about the _environment_, not about _itself_,
since $\nabla_\theta \log \pi_\theta(a \mid s)$ is exact — a targeted update
driven by a noisy scalar.

A baseline is grading on a curve: subtracting the average leaves only what
distinguishes one trajectory from another.

## Concrete example

Two actions, a softmax policy $\pi_\theta(a) = e^{\theta_a} / \sum_b e^{\theta_b}$
with $\theta = (0, 0)$, so $\pi = (0.5, 0.5)$. Rewards are deterministic:
$r(a_1) = 11$, $r(a_2) = 9$. Then $J(\theta) = 10$ and the true gradient with
respect to $\theta_1$ is $11(0.25) + 9(-0.25) = 0.5$.

Now the single-sample estimator $r(a)\,\nabla_{\theta_1}\log\pi_\theta(a)$, using
$\nabla_{\theta_1}\log\pi_\theta(a_1) = 0.5$ and
$\nabla_{\theta_1}\log\pi_\theta(a_2) = -0.5$:

| sampled action | probability | estimate                 |
| -------------- | ----------- | ------------------------ |
| $a_1$          | $0.5$       | $11 \times 0.5 = 5.5$    |
| $a_2$          | $0.5$       | $9 \times (-0.5) = -4.5$ |

The mean is $0.5$ — unbiased, exactly right. The standard deviation is $5.0$,
**ten times the signal**. Subtract the baseline $b = 10$ and both branches become
$(11-10)(0.5) = 0.5$ and $(9-10)(-0.5) = 0.5$: same mean, zero variance. One
sample now gives the exact gradient.

```python
import numpy as np

rng = np.random.default_rng(0)
theta = np.zeros(2)
r = np.array([11.0, 9.0])

def sample_grad(baseline):
    p = np.exp(theta) / np.exp(theta).sum()
    a = rng.choice(2, p=p)
    score = -p.copy()          # d/dtheta log pi(a)
    score[a] += 1.0
    return (r[a] - baseline) * score

raw = np.array([sample_grad(0.0)[0] for _ in range(20000)])
based = np.array([sample_grad(10.0)[0] for _ in range(20000)])
print(raw.mean(), raw.std())      # ~0.5, ~5.0
print(based.mean(), based.std())  # 0.5, 0.0
```

## Formal treatment

Take a finite-horizon MDP with initial distribution $\rho_0$, transitions
$p(s' \mid s, a)$, rewards $r_t$ and discount $\gamma \in (0,1]$. A trajectory
$\tau = (s_0, a_0, r_0, \ldots, s_T)$ has probability

$$
p_\theta(\tau) = \rho_0(s_0) \prod_{t=0}^{T-1} \pi_\theta(a_t \mid s_t)\, p(s_{t+1} \mid s_t, a_t),
$$

and the objective is $J(\theta) = \mathbb{E}_{\tau \sim p_\theta}[R(\tau)]$ with
$R(\tau) = \sum_t \gamma^t r_t$. Differentiating and applying the
**log-derivative identity** $\nabla_\theta p_\theta = p_\theta \nabla_\theta \log p_\theta$,

$$
\nabla_\theta J(\theta) = \int \nabla_\theta p_\theta(\tau) R(\tau)\, d\tau
= \mathbb{E}_{\tau \sim p_\theta}\!\left[ R(\tau) \nabla_\theta \log p_\theta(\tau) \right].
$$

The decisive step: the $\rho_0$ and transition factors do not depend on
$\theta$, so they vanish from $\nabla_\theta \log p_\theta(\tau)$, leaving

$$
\nabla_\theta \log p_\theta(\tau) = \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t \mid s_t).
$$

_This is why the method is model-free._ Since rewards before time $t$ cannot
depend on $a_t$, the estimator sharpens to

$$
\nabla_\theta J(\theta) = \mathbb{E}\!\left[ \sum_{t=0}^{T-1} \gamma^t G_t\, \nabla_\theta \log \pi_\theta(a_t \mid s_t) \right],
\qquad G_t = \sum_{k=t}^{T-1} \gamma^{k-t} r_k .
$$

The **policy gradient theorem** states the same result through the on-policy
state distribution $\mu_\pi$ and the action-value $q_\pi$:

$$
\nabla_\theta J(\theta) \;\propto\; \sum_s \mu_\pi(s) \sum_a q_\pi(s,a)\, \nabla_\theta \pi_\theta(a \mid s)
= \mathbb{E}_{s \sim \mu_\pi,\, a \sim \pi_\theta}\!\left[ q_\pi(s,a) \nabla_\theta \log \pi_\theta(a \mid s) \right].
$$

The proportionality is equality in the continuing average-reward case;
episodically the constant is the average episode length. Note that
$\nabla_\theta \mu_\pi$ appears nowhere: the state distribution shifts with the
policy, and the theorem's content is that this needs no derivative.

**Baselines.** For any $b(s)$ that does not depend on the action,

$$
\mathbb{E}_{a \sim \pi_\theta(\cdot \mid s)}\!\left[ b(s) \nabla_\theta \log \pi_\theta(a \mid s) \right]
= b(s) \sum_a \nabla_\theta \pi_\theta(a \mid s) = b(s) \nabla_\theta 1 = 0,
$$

so replacing $q_\pi(s,a)$ by $q_\pi(s,a) - b(s)$ — the advantage when
$b = v_\pi$ — leaves the expectation unchanged and the variance usually far
smaller. The common choice $b(s) = \hat{v}(s)$ is not variance-minimising —
that is the average return weighted by the _squared_ magnitude of the score —
but it is close, cheap and reusable.

**Continuous actions** need no new machinery. With
$\pi_\theta(a \mid s) = \mathcal{N}(a; \mu_\theta(s), \sigma_\theta(s)^2)$,

$$
\nabla_\theta \log \pi_\theta(a \mid s) = \frac{a - \mu_\theta(s)}{\sigma_\theta(s)^2} \nabla_\theta \mu_\theta(s) + \cdots,
$$

ordinary backpropagation through the network computing $\mu_\theta$. In code this
becomes a surrogate loss whose _gradient_, not whose value, is meaningful:
`-(logp * advantage.detach()).sum()`.

## Assumptions and requirements

$\pi_\theta$ must be differentiable in $\theta$ and give positive probability to
every action it samples, or $\log \pi_\theta$ is undefined. Exchanging gradient
and integral needs a dominated-convergence condition; it holds for softmax and
Gaussian policies and **fails when the support depends on $\theta$** — a uniform
policy on $[0, \theta]$ breaks the trick outright, because probability mass moves
across the support's boundary rather than within it.

Samples must come from $\pi_\theta$ itself; data from an older $\theta$ is biased
unless corrected by importance weights, whose variance grows with the mismatch.
The baseline must be a function of state alone, and fitting it on the very sample
it is subtracted from introduces a small bias, usually tolerated.

Unbiasedness concerns one gradient, not the optimisation: $J$ is non-convex in
$\theta$, so the guarantee is a stationary point under the usual step-size
conditions, not the optimal policy.

## Uses and applicability

Reach for policy gradients when the action space is continuous or structured,
when the optimal behaviour is stochastic, when the reward is a black box you
cannot differentiate through, or when fresh samples are affordable. Robotic
control, simulated locomotion and preference optimisation of language models all
sit here; PPO became the default because it holds up across task families without
per-task tuning.

Reach elsewhere when samples are expensive and the action set small and discrete:
a replay-based value method reuses every transition many times, while an on-policy
gradient discards a batch after a few updates. Reach elsewhere again when the
horizon is long and reward sparse, where return variance grows with the horizon.
If the dynamics are known, planning beats sampling.

## Limitations and common mistakes

**Variance is the whole story.** Everything downstream — baselines, critics,
advantage estimators, trust regions — exists to control it. One trajectory's
gradient can point almost anywhere.

The misconception to discard first is that subtracting a baseline biases the
gradient. It does not, provided the baseline does not depend on the sampled
action. The converse mistake is assuming every variance reduction is free:
normalising advantages by the batch standard deviation, as nearly every
implementation does, is a heuristic that _does_ perturb the estimator, not a
theorem.

Other recurring errors: reading the surrogate loss as a training curve, when only
its gradient is defined; forgetting to detach the advantage; dropping the
$\gamma^t$ factor in the episodic estimator, which almost everyone does, making
the implemented update not quite the gradient of the discounted objective;
and taking many steps on one batch without correction, silently turning an
on-policy estimator into an uncorrected off-policy one. That last failure is what
trust regions and clipping were built to prevent.

Reward scale matters more than people expect, since rewards multiply the gradient
directly. Entropy can also collapse early, locking in a near-deterministic policy
before exploration is done.

## Variants and alternatives

**REINFORCE** uses the full Monte-Carlo return: unbiased, highest variance.
**Actor-critic** replaces the return with a bootstrapped estimate from a learned
value function, buying a large variance reduction at the cost of the critic's
bias. **Generalised advantage estimation** interpolates between the two with a
parameter $\lambda$.

**Natural policy gradients** precondition by the inverse Fisher information,
making the step invariant to the policy's parameterisation. **TRPO** turns that
into a KL trust region with a monotonic-improvement argument; **PPO** gets much of
the same effect from a clipped surrogate at a fraction of the cost, which is why
it displaced TRPO.

Genuinely different approaches exist. **Deterministic policy gradients** replace
the score-function estimator with a pathwise derivative through a deterministic
actor and differentiable critic; **soft actor-critic** keeps a stochastic actor,
differentiates through a reparameterised sample and adds a maximum-entropy term,
gaining off-policy sample reuse. Where the objective is differentiable end to end
the reparameterisation gradient is usually much lower variance; the score function
needs nothing but a sampled score. Further out, derivative-free parameter search
treats the return as a black box.

## History and attribution

The core estimator has more than one origin. Likelihood-ratio and score-function
gradient estimators were developed in the stochastic-simulation literature before
reinforcement learning adopted them, for differentiating an expectation with
respect to its sampling distribution's parameters.
Within reinforcement learning, Williams introduced the REINFORCE family in 1992,
working on connectionist units with stochastic outputs, and already included the
baseline. The policy gradient theorem in its function-approximation form was
established by Sutton, McAllester, Singh and Mansour at the end of the 1990s,
with Konda and Tsitsiklis giving a closely related actor-critic analysis
independently at about the same time. Natural policy gradients followed in the
early 2000s. The deep learning era contributed scale and stabilisation rather
than a new estimator: TRPO in 2015, PPO in 2017, maximum-entropy off-policy
actor-critics shortly after.

## Sources

Sutton and Barto's Chapter 13 covers the formal section — the theorem, REINFORCE,
baselines, continuous-action parameterisation — and Chapter 2's gradient bandit
algorithms are the worked example above in its simplest setting. The TRPO paper
supplies the trust-region formulation and why an unconstrained step on sampled
data can be destructive; the PPO paper is its practical counterpart and the
reference for clipped surrogates. Soft Actor-Critic covers the maximum-entropy,
off-policy, reparameterised alternative.

Two sources this page wanted and the registry lacks are Williams' 1992 REINFORCE
paper and the 1999/2000 policy gradient theorem paper; the attribution above
rests on Sutton and Barto's account of both.

## Prerequisites and next connections

Understand Markov decision processes first — the objective is expected return in
an MDP, and the derivation leans on the trajectory factorisation. You also want
[Stochastic Gradient Descent](./stochastic-gradient-descent.md), since every
practical policy gradient is SGD on a noisy estimate, and enough
[Probability Theory](./probability-theory.md) to be comfortable with an
estimator's variance. [Nonconvex Optimization](./nonconvex-optimization.md)
explains what the convergence guarantee does and does not say.

From here, actor-critic methods are the natural next page: this estimator with a
learned baseline and a bootstrapped return. Hold the contrast with Q-learning in
mind throughout. [Stochastic Optimization](./stochastic-optimization.md) places
the log-derivative trick in its wider setting, and
[Variational Autoencoders](./variational-autoencoders.md) show the competing
reparameterisation gradient solving the same problem.
