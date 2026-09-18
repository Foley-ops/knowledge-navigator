---
concept_id: concept.reinforcement_learning.dqn
title: DQN
slug: /concepts/dqn
aliases:
  - deep Q-network
kind: algorithm
tier: 1
review_state: generated-draft
summary: The algorithm that made Q-learning work with a neural network by training on a replay buffer of past transitions and computing its regression targets from a frozen copy of the weights.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.q_learning
    note: DQN is the Q-learning update with the lookup table replaced by a network, so its loss is unreadable without the tabular update first.
  - type: specializes
    target: concept.reinforcement_learning.temporal_difference_learning
    note: The DQN loss regresses onto a one-step TD target, and its gradient is the semi-gradient form that TD methods use.
  - type: assumes
    target: concept.reinforcement_learning.markov_decision_processes
    note: Bootstrapping from the successor state is only valid when the state is Markov, which is why DQN stacks four Atari frames into one state.
  - type: contrasts_with
    target: concept.reinforcement_learning.policy_gradients
    note: DQN learns values and reads a deterministic greedy policy off them, whereas policy gradient methods optimise a parameterised stochastic policy directly and are not restricted to discrete actions.
sources:
  - source_id: source.mnih2015.human_level_control
    title: Human-level control through deep reinforcement learning
    url: https://www.nature.com/articles/nature14236
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mnih2016.a3c
    title: Asynchronous Methods for Deep Reinforcement Learning
    url: https://arxiv.org/abs/1602.01783
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.haarnoja2018.sac
    title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor'
    url: https://arxiv.org/abs/1801.01290
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: The post-2015 DQN extensions — Double DQN, prioritised experience replay, duelling architectures, distributional value learning and Rainbow
    reason: No source in the registry covers these papers; they are named from the literature and should be given proper citations when the registry gains them.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**DQN** fits an action-value function $Q(s, a; \theta)$ with a neural network
trained by the Q-learning update, plus two mechanisms without which that fit
does not hold together: an **experience replay** buffer, from which minibatches
of past transitions are drawn uniformly at random rather than using the
transition that just happened, and a **target network**, a copy $\theta^-$ of
the weights refreshed every $C$ updates and used for the regression target in
between. The network maps a state to one value per action, so the greedy action
is one forward pass and an $\arg\max$ over the output vector.

## Why it matters

Before 2015, Q-learning with a nonlinear function approximator was something you
were warned about rather than something you did: it was known to diverge, and
neural-network successes in reinforcement learning were isolated. DQN made it
routine. Mnih et al. trained one architecture with one set of hyperparameters on
49 Atari 2600 games from raw pixels and the score alone, reaching a level
comparable to a professional human games tester across the set and exceeding 75%
of the human score on 29 of them — no per-game features, no per-game tuning.

Replay buffers and target networks then became standard furniture in off-policy
deep reinforcement learning, including in methods that otherwise share little
with DQN.

## Intuition

Picture supervised regression where you write the labels yourself, and the two
ways that goes wrong.

First, the data arrives as a stream of nearly identical consecutive frames.
Training on it is like training a classifier on a dataset sorted by label: the
network fits what it sees now and forgets what it saw ten thousand steps ago.
Replay turns that stream into a shuffled, reusable dataset.

Second, the label $r + \gamma \max_{a'} Q(s', a')$ comes from the same network
being updated. Reduce the error and the label moves too — the regression chases
its own tail. Freezing a copy of the weights for $C$ updates makes each interval
an ordinary regression against fixed labels.

Where the analogy breaks: the dataset is not fixed. Old transitions came from a
policy the agent no longer follows — legitimate, because Q-learning is
off-policy, but the state distribution keeps shifting underneath the regression,
which supervised learning never has to handle.

## Concrete example

The Atari agent's state is four consecutive frames, greyscaled and downsampled
to $84 \times 84$, stacked into an $84 \times 84 \times 4$ tensor. Three
convolutional layers (32 filters of $8 \times 8$ at stride 4, then 64 of
$4 \times 4$ at stride 2, then 64 of $3 \times 3$ at stride 1), a 512-unit fully
connected layer, and one linear output per valid action — 4 to 18 by game. The
buffer holds the last million transitions, minibatches are 32, the target
network is copied every 10,000 parameter updates, the discount is $0.99$, and
$\varepsilon$ anneals from $1.0$ to $0.1$ over the first million frames. Rewards
are clipped to $\{-1, 0, +1\}$ so one learning rate spans games with wildly
different score scales.

The loss is four lines:

```python
import torch
import torch.nn.functional as F

def dqn_loss(online, target, s, a, r, s_next, done, gamma=0.99):
    q = online(s).gather(1, a.unsqueeze(1)).squeeze(1)
    with torch.no_grad():                       # the target carries no gradient
        best = target(s_next).max(dim=1).values
        y = r + gamma * (1.0 - done) * best     # no bootstrap past a terminal state
    return F.smooth_l1_loss(q, y)
```

`target.load_state_dict(online.state_dict())` every $C$ updates is the whole
target-network mechanism.

## Formal treatment

Work in a finite-action Markov decision process
$(\mathcal{S}, \mathcal{A}, P, r, \gamma)$, $\gamma \in [0, 1)$. The optimal
action-value function satisfies the Bellman optimality equation

$$
Q^*(s, a) \;=\; \mathbb{E}_{s' \sim P(\cdot \mid s, a)}
\Big[ r(s, a, s') + \gamma \max_{a' \in \mathcal{A}} Q^*(s', a') \Big].
$$

DQN parameterises $Q(s, a; \theta)$ and, at update $i$, minimises

$$
L_i(\theta_i) \;=\; \mathbb{E}_{(s, a, r, s') \sim U(\mathcal{D})}
\Big[ \big( r + \gamma \max_{a'} Q(s', a'; \theta_i^-) - Q(s, a; \theta_i) \big)^2 \Big],
$$

where $\mathcal{D}$ is the replay buffer, $U(\mathcal{D})$ the uniform
distribution over it, and $\theta_i^-$ the target parameters, set to $\theta$
every $C$ updates and fixed otherwise. When $s'$ is terminal the bootstrap term
is dropped.

Two things here are easy to misread. The gradient taken is a **semi-gradient**:
the target counts as a constant even when $\theta^- = \theta$, so the update is
not gradient descent on any fixed objective, and its fixed point is where the
expected update vanishes rather than a minimum of $L$. And the maximum is over a
finite $\mathcal{A}$ — an enumeration, not an optimisation. Mnih et al. clip the
temporal-difference error to $[-1, 1]$, equivalent to a Huber loss.

## Assumptions and requirements

The action set must be finite and enumerable. With continuous actions the inner
$\max$ becomes an optimisation inside every gradient step, and DQN as stated
does not apply.

The state must be Markov, or the bootstrapped target is biased by what the agent
cannot see. A single Atari frame carries no velocity, which is why four are
stacked; leftover partial observability needs recurrent variants.

Replay assumes an off-policy learning rule. Q-learning's max makes stale data
usable; swap in a SARSA-style target that uses the action actually taken and
uniform replay becomes unsound without correction.

Exploration must keep visiting the relevant state-action pairs. The convergence
theorem that exists is for tabular Q-learning and needs every pair visited
infinitely often under Robbins-Monro step sizes; it covers neither the nonlinear
case nor DQN, and nothing has replaced it.

Reward clipping, finally, is an assumption smuggled in as a convenience: it lets
one hyperparameter set span 49 games, and it leaves the agent unable to tell a
10-point reward from a 1000-point one.

## Uses and applicability

Reach for DQN when actions are discrete, interaction is cheap, and reusing data
matters: discrete control, game playing, and recommendation or scheduling
problems with a small action menu. A purely logged dataset with no further
interaction is a different problem: off-policy does not mean offline, and DQN
run on a fixed batch is known to degrade as its $\max$ queries actions the
logging policy never took.

Do not reach for it when actions are continuous or combinatorially large — soft
actor-critic, DDPG and TD3 exist for that — or when a stochastic policy is
needed for its own sake. And be honest about the sample budget: the Nature agent
trained for 50 million agent steps per game, about 38 days of game time, which
is only tolerable because Atari runs faster than real time.

## Limitations and common mistakes

The most common overstatement is that the target network makes DQN converge. It
does not. Function approximation, bootstrapping and off-policy training together
are Sutton and Barto's _deadly triad_, and DQN has all three; that it works well
is an empirical finding on particular benchmarks, not a theorem, and divergence
is still observed.

The $\max$ in the target sits on top of noisy estimates, and the maximum of
noisy estimates is biased upward. This **maximisation bias** is systematic, not
an artifact of the network, and it is what Double DQN addresses by using the
online network to choose the action and the target network to value it.

Uniform replay is not a free win either: it spends most of its capacity on
transitions the network already predicts well, and buffer size is a real
hyperparameter — too large and the data is too far off-policy, too small and the
correlation returns.

Implementation traps recur. Failing to mask the bootstrap at terminal states
inflates end-of-episode values; conflating a time-limit truncation with a
genuine terminal state does the opposite, since a truncated run should still
bootstrap; and computing the target without `no_grad` backpropagates through the
target network.

The Atari numbers, finally, are a benchmark result on specific games against one
human tester. DQN was near-chance where exploration is long-horizon and rewards
sparse; Montezuma's Revenge is the standard example.

## Variants and alternatives

**Double DQN** (van Hasselt et al., 2016) decouples action selection from
evaluation to cut overestimation. **Prioritised experience replay** (Schaul et
al., 2016) samples in proportion to the size of the temporal-difference error,
with importance weights correcting the induced bias. **Duelling networks** (Wang
et al., 2016) split the head into value and advantage streams. **Distributional** value
learning (Bellemare et al., 2017) predicts the return distribution rather than
its mean. **Rainbow** (Hessel et al., 2018) combines these with multi-step
returns and noisy exploration; its ablations are the usual evidence for which
pieces carry the gain.

The genuinely different approaches: A3C drops the buffer and decorrelates data
with many parallel environment copies instead, buying on-policy learning and
losing replay's data reuse. Soft actor-critic keeps a buffer but learns a
stochastic policy over continuous actions. Policy gradient methods skip
value-greedy action selection altogether.

## History and attribution

Tesauro's TD-Gammon showed in the early 1990s that a network trained by
temporal-difference learning could reach expert backgammon play, but the result
proved hard to repeat and the combination acquired a reputation for instability.
Experience replay is older than DQN: Lin introduced it in 1992, for exactly the
purpose of reusing past transitions.

DQN came from Mnih and colleagues at DeepMind, first as a 2013 workshop paper on
seven Atari games and then in the 2015 Nature paper on 49. The problem was not
Atari as such but whether one agent could learn control directly from
high-dimensional sensory input without task-specific engineering, with the
Arcade Learning Environment supplying a benchmark broad enough to make the claim
mean something.

## Sources

The Mnih et al. Nature paper is the definitive statement of the algorithm: the
loss, both mechanisms, the hyperparameter table and the 49-game evaluation.
Sutton and Barto give the background it assumes — Q-learning, semi-gradient
temporal-difference methods, maximisation bias and double learning, the deadly
triad — and carry a case study on DQN. The A3C paper argues directly against the
buffer, so it is the clearest statement of the alternative. The soft actor-critic
paper stands for the continuous-action off-policy family that DQN's $\arg\max$
cannot reach. The offline reinforcement learning survey is cited for one point:
why a fixed batch of logged data is not simply more replay.

## Prerequisites and next connections

Read Q-learning first: DQN changes how $Q$ is stored, which transitions the
update sees, and how the target is computed. Markov decision processes give the
setting the Bellman optimality equation lives in, and temporal-difference
learning explains why a bootstrapped target is a target at all. On the deep
learning side, [Stochastic Gradient Descent](./stochastic-gradient-descent.md)
is what the buffer feeds and
[Convolutional Networks](./convolutional-networks.md) covers the pixel encoder.

From here, policy gradients and actor-critic methods are where you go when the
action space stops being a short list, and
[Supervised Learning](./supervised-learning.md) repays a second look: DQN reads
as regression until you notice the model writes its own labels.
