---
concept_id: concept.reinforcement_learning.q_learning
title: Q-Learning
slug: /concepts/q-learning
kind: algorithm
tier: 1
review_state: generated-draft
summary: An off-policy control algorithm that learns the optimal action-value function by bootstrapping from the best action available at the next state, regardless of which action the agent actually took.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The update is a sampled application of the Bellman optimality operator, which is only defined once states, actions, transition probabilities and discounting are in place.
  - type: specializes
    target: concept.reinforcement_learning.temporal_difference_learning
    note: Q-learning is the one-step TD control rule in which the bootstrap target is formed from the maximising action rather than the action the behaviour policy chose.
  - type: prerequisite_of
    target: concept.reinforcement_learning.dqn
    note: DQN is this update with a neural network in place of the table, so its target, its instabilities and its target-network fix are unreadable without this rule first.
  - type: contrasts_with
    target: concept.reinforcement_learning.policy_gradients
    note: Both solve control, but Q-learning derives a policy implicitly from a learned value function while policy gradients optimise a parameterised policy directly and handle continuous actions the max cannot.
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
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mnih2015.human_level_control
    title: Human-level control through deep reinforcement learning
    url: https://www.nature.com/articles/nature14236
    source_kind: primary-research
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.haarnoja2018.sac
    title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor'
    url: https://arxiv.org/abs/1801.01290
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Q-learning** estimates the optimal action-value function $q_*$ directly from
experience, using the update

$$
Q(S_t, A_t) \;\leftarrow\; Q(S_t, A_t) \;+\; \alpha
\Big[\, R_{t+1} + \gamma \max_{a} Q(S_{t+1}, a) \;-\; Q(S_t, A_t) \,\Big].
$$

Everything distinctive is in the $\max$. The agent takes some action $A_t$ under
whatever exploratory behaviour it likes, observes reward $R_{t+1}$ and next state
$S_{t+1}$, and then forms its target as if it would act greedily from $S_{t+1}$
onwards. The action it will actually take next never enters the update. That is
what makes Q-learning **off-policy**: the policy being evaluated (greedy) and the
policy generating the data (exploratory) are different, and no importance weight
is needed to reconcile them.

## Why it matters

Before Q-learning, finding an optimal policy meant either knowing the transition
model and running dynamic programming, or evaluating the policy you were actually
following and improving it in slow interleaved steps. Q-learning collapses that:
one table, one update per transition, no model, and a target that is already the
optimal one. You can behave randomly, cautiously, or by a logging policy fixed
last year, and still converge on the optimal value function — so long as that
behaviour keeps trying every state-action pair. That separation
licenses experience replay — transitions from an older policy are still valid
samples of the optimality equation — and is why off-policy methods are reached
for when interaction is expensive.

## Intuition

Think of $Q(s,a)$ as a running estimate of "how good is it to do $a$ here,
assuming I play well afterwards". Each transition improves that guess by one
step: the reward you saw, plus the discounted value of the best option now in
front of you. The gap between that and the old estimate is the TD error, and you
move a fraction $\alpha$ of the way towards it.

The picture usually carried is a chess player revising an opening evaluation
after seeing the position it leads to, judging that position under best play
rather than under their own blunders. The analogy breaks in one place: best play
from a fixed position is a judgement about something real, while
$\max_a Q(S_{t+1},a)$ maximises over _noisy estimates_, which is systematically
optimistic.

## Concrete example

The standard contrast is cliff walking: a $4 \times 12$ grid, start bottom-left,
goal bottom-right, the ten cells between them along the bottom row a cliff. Every
step costs $-1$; stepping into the cliff costs $-100$ and returns the agent to
the start. Run Q-learning and SARSA with $\varepsilon$-greedy behaviour at a fixed
$\varepsilon = 0.1$.

Q-learning learns the values of the optimal policy, which hugs the cliff edge: up
one, right eleven, down one, a return of $-13$. SARSA, whose target uses the
action actually taken next, folds the $\varepsilon$ chance of a random step into
the cliff into the value of every edge cell, and learns a route keeping a row or
more of clearance — longer, worth less under the optimal policy, safer to
_execute_ while exploring. Hence the part people remember: Q-learning's online
reward per episode is the worse of the two, though its value function is the
correct one, because it keeps walking the edge and occasionally falls off. Decay
$\varepsilon$ to zero and both reach the optimal policy.

```python
import numpy as np

def q_learning(env, episodes=500, alpha=0.5, gamma=1.0, eps=0.1):
    Q = np.zeros((env.n_states, env.n_actions))
    for _ in range(episodes):
        s, done = env.reset(), False
        while not done:
            a = env.sample_action() if np.random.rand() < eps else int(np.argmax(Q[s]))
            s2, r, done = env.step(a)
            target = r if done else r + gamma * Q[s2].max()   # no bootstrap past a terminal state
            Q[s, a] += alpha * (target - Q[s, a])
            s = s2
    return Q
```

## Formal treatment

Work in a finite MDP with transition kernel $p(s', r \mid s, a)$ and discount
$\gamma \in [0,1)$. The optimal action-value function satisfies

$$
q_*(s,a) \;=\; \sum_{s', r} p(s', r \mid s, a)
\Big[\, r + \gamma \max_{a'} q_*(s', a') \,\Big],
$$

and the target $R_{t+1} + \gamma \max_{a'} Q(S_{t+1}, a')$ is an unbiased sample
of the right-hand side with $Q$ in place of $q_*$. Q-learning is therefore
stochastic approximation on the fixed point of the Bellman optimality operator, a
$\gamma$-contraction in the sup norm.

**Convergence (Watkins and Dayan, 1992).** In a finite MDP with bounded rewards,
if $Q$ is a table with one independent entry per state-action pair, if every pair
is updated infinitely often, and if the step sizes $\alpha_n(s,a) \in [0,1)$ used
on the $n$-th update of pair $(s,a)$ satisfy the Robbins-Monro conditions

$$
\sum_{n=1}^{\infty} \alpha_n(s,a) = \infty,
\qquad
\sum_{n=1}^{\infty} \alpha_n^2(s,a) < \infty,
$$

then $Q_n(s,a) \to q_*(s,a)$ with probability 1 for every $(s,a)$. The behaviour
policy appears nowhere in the conclusion; it need only explore enough to satisfy
the visitation condition.

**Maximisation bias.** Let $\hat q(a)$ be unbiased estimates of $q(a)$. Since
$\max$ is convex, Jensen's inequality gives

$$
\mathbb{E}\big[\max_a \hat q(a)\big] \;\ge\; \max_a \mathbb{E}\big[\hat q(a)\big]
\;=\; \max_a q(a),
$$

usually strictly. The gap is not small: with eight actions of true value $0$ and
independent standard normal estimates, the expected maximum is about $1.42$.
Q-learning takes that maximum every step and bootstraps on it, so optimism
propagates backwards through the state space.

**Double Q-learning** decouples selection from evaluation. Keep two tables and,
on each transition, update one at random,

$$
Q_1(S_t,A_t) \leftarrow Q_1(S_t,A_t) + \alpha\Big[R_{t+1} + \gamma\,
Q_2\big(S_{t+1}, \arg\max_a Q_1(S_{t+1},a)\big) - Q_1(S_t,A_t)\Big],
$$

and symmetrically for $Q_2$. Since $Q_2$ played no part in picking the action,
its value there is an unbiased estimate of that action's value.

## Assumptions and requirements

The theorem is fragile in specific, well-understood ways.

- **Tabular representation.** Each $(s,a)$ needs its own entry. Under function
  approximation, updates to one pair move others, the sup-norm contraction
  argument fails, and off-policy bootstrapping can diverge outright — the
  "deadly triad" of bootstrapping, off-policy data and approximation.
- **Infinite visitation.** Drop it and the $\max$ ranges over actions never
  estimated. This is weaker than SARSA's requirement: Q-learning does _not_ need
  $\varepsilon \to 0$ to converge to $q_*$.
- **Robbins-Monro step sizes.** A constant $\alpha$ violates the second
  condition; $Q$ then tracks rather than converges, fluctuating at a scale set by
  $\alpha$ and the reward noise. That is the right choice in a non-stationary
  environment, but it is not the theorem.
- **Markov property and stationarity.** Under partial observability the update
  has no fixed point in general, and values learned from aliased states average
  over situations deserving different actions.
- **Discounting or proper termination.** $\gamma < 1$, or episodes ending with
  probability 1 and a bootstrap term of zero at terminal states, is what makes
  the operator a contraction.

## Uses and applicability

Reach for Q-learning when actions are discrete and few, when you want the optimal
policy while behaving conservatively, and when data reuse matters: logged
transitions, replay buffers, several learners sharing one stream. It is the right
default for tabular and small discrete-control problems, and the rule underneath
the DQN family. Do not reach for it when actions are continuous, since
$\max_a Q(s,a)$ becomes an inner optimisation at every step; when exploration is
itself dangerous, where SARSA's conservatism fits better; or when learning
offline from a fixed dataset, where the max selects actions the data never
covered and the overestimates cannot be corrected by interaction.

## Limitations and common mistakes

The most common bug is bootstrapping past a terminal state: the target there is
$R_{t+1}$ alone, and including $\gamma \max_a Q(S_{t+1},a)$ inflates every value
along the trajectory. Its mirror image is treating a time-limit truncation as a
true terminal — an episode cut off by a step budget should still bootstrap.

Second, the convergence theorem does not survive neural networks. DQN's target
network and replay buffer are engineering that made the update behave well enough
on particular benchmarks; they are not a proof, and divergence still happens.

Third, off-policy is often read as "works on any data". The visitation condition
is a coverage requirement, and offline datasets routinely fail it.

Finally, double Q-learning is less a bias eliminator than a bias swap: evaluating
with an estimator that is itself noisy tends to underestimate instead. That is
usually the less damaging error, since it does not compound through the
bootstrap, but "unbiased" is the wrong word for it.

## Variants and alternatives

**SARSA** replaces the $\max$ with $Q(S_{t+1}, A_{t+1})$, making it on-policy;
**Expected SARSA** uses $\sum_a \pi(a \mid S_{t+1}) Q(S_{t+1},a)$, removing the
variance of sampling $A_{t+1}$ and reducing to Q-learning exactly when $\pi$ is
greedy. **Double Q-learning** is the standard fix for maximisation bias, at the
cost of two tables and half the updates each. **$n$-step Q-learning** and
Watkins's $Q(\lambda)$ trade bias for variance by bootstrapping later, but must
cut the backup at the first exploratory action — which in $Q(\lambda)$ means
zeroing the eligibility trace there. **DQN** is Q-learning
with a convolutional network, a replay buffer and a periodically frozen target
network. Among genuinely different approaches, policy gradient and actor-critic
methods optimise a policy directly and handle continuous actions; soft
actor-critic keeps off-policy value learning but maximises an entropy-regularised
objective and takes the minimum of two Q-functions as a deliberate pessimism.

## History and attribution

Chris Watkins introduced Q-learning in his 1989 Cambridge PhD thesis _Learning
from Delayed Rewards_, working on how to act from delayed reinforcement without a
model — the point where Bellman's dynamic programming met Sutton's
temporal-difference learning. Watkins and Peter Dayan published the convergence
proof in 1992; it was among the first such results for a control algorithm, and
much of the field's confidence rests on it. It was recast in the language of
stochastic approximation in 1994 by Jaakkola, Jordan and Singh and by Tsitsiklis.
Double learning was introduced by Hado van Hasselt in 2010; deep value-based
methods reached wide attention through DQN's Atari results in 2015.

## Sources

Sutton and Barto is the source of record for nearly everything here: the update
rule, the off-policy argument, the convergence conditions, cliff walking against
SARSA, maximisation bias and double learning, and the attributions. The Nature
DQN paper is the function approximation story — what breaks, and what target
networks and replay buy. Levine et al.'s offline tutorial treats why the max over
uncovered actions is the central difficulty with a fixed dataset. The soft
actor-critic paper documents the twin-critic minimum as working practice for
pessimism.

## Prerequisites and next connections

Read Markov decision processes first: the Bellman optimality equation is what
Q-learning solves. Temporal-difference learning then makes the rule a one-line
variation rather than a new idea, and the step-size conditions will look familiar
to anyone who has met
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) — though this
update is not a gradient step on any objective.
[Probability Theory](./probability-theory.md) supplies the convergence machinery
and [Stochastic Processes](./stochastic-processes.md) the Markov chain language
underneath. Forwards, it opens onto DQN, onto actor-critic methods that recover
the maximisation with a learned actor, and onto offline reinforcement learning.
