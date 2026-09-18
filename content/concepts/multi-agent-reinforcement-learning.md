---
concept_id: concept.reinforcement_learning.multi_agent_reinforcement_learning
title: Multi-Agent Reinforcement Learning
slug: /concepts/multi-agent-reinforcement-learning
aliases:
  - MARL
kind: concept
tier: 1
review_state: generated-draft
summary: Reinforcement learning when several agents learn at once in one environment, where each agent's updates change the world the others are learning about and "optimal policy" gives way to a game-theoretic solution concept.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The stochastic game that defines the setting is an MDP whose transition depends on a joint action and which pays one reward per agent, so states, transitions, discounting and returns must already be in place before the generalisation reads as anything.
  - type: requires
    target: concept.reinforcement_learning.actor_critic
    note: Centralised training with decentralised execution is stated as an actor-critic architecture in which the critic is given the joint observation and action while each actor sees only its own, which cannot be followed without knowing what a critic is and why it is fitted separately.
  - type: contrasts_with
    target: concept.reinforcement_learning.q_learning
    note: Q-learning converges under a fixed transition and reward distribution, and running one independent copy per agent voids exactly that hypothesis while still often working, which makes it the sharpest illustration of what multi-agent learning gives up.
  - type: contrasts_with
    target: concept.learning.federated_learning
    note: Both spread learning across many participants, but federated clients optimise one shared objective on separate data and never act on each other, whereas these agents have separate rewards and their actions enter each other's transitions.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.silver2017.alphazero
    title: Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm
    url: https://arxiv.org/abs/1712.01815
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.browne2012.mcts_survey
    title: A Survey of Monte Carlo Tree Search Methods
    url: https://ieeexplore.ieee.org/document/6145622
    source_kind: primary-research
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: Named deep multi-agent RL algorithms and their benchmark results (MADDPG, COMA, VDN, QMIX, MAPPO; StarCraft micromanagement and Hanabi suites)
    reason: The registry holds single-agent deep RL papers but no entry for any multi-agent algorithm or benchmark paper, so these are named for orientation and the empirical comparisons between them are described qualitatively rather than cited.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Stochastic games, equilibrium learners (minimax-Q, Nash-Q) and the complexity of computing a Nash equilibrium
    reason: No registry source states the stochastic-game model (Shapley, 1953), the independent-versus-cooperative comparison (Tan, 1993), the Markov-game framing and minimax-Q (Littman, 1994), Nash-Q, or the complexity of equilibrium computation, so those statements rest on general knowledge and should be checked against the original papers before being relied on.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: The climbing game and the relative-overgeneralisation failure of independent learners (Claus and Boutilier, 1998)
    reason: The payoff matrix worked through below and the reported tendency of independent learners on it come from a cooperative-MARL paper that the registry does not contain; the arithmetic is verifiable from the matrix, the behavioural claim is not cited.
    sections:
      - concrete-example
claims: []
---

## Definition

**Multi-agent reinforcement learning** is reinforcement learning in an
environment inhabited by $n \ge 2$ agents that act simultaneously, each receive
their own reward, and are all updating their policies at the same time. The
standard model is a **stochastic game** (equivalently a Markov game), the tuple

$$
\big(\mathcal{N}, \mathcal{S}, \{\mathcal{A}^i\}_{i \in \mathcal{N}},
P, \{R^i\}_{i \in \mathcal{N}}, \gamma\big),
$$

where $\mathcal{N} = \{1,\dots,n\}$ indexes the agents, $P(s' \mid s, \mathbf{a})$
depends on the **joint action** $\mathbf{a} = (a^1,\dots,a^n)$, and each $R^i$ is
one agent's own reward. Three regimes are distinguished: **cooperative**, where
all $R^i$ coincide; **competitive**, whose clean case is two-player zero-sum,
$R^1 = -R^2$; and **mixed** or general-sum, where interests partly align and
partly conflict.

## Why it matters

Two things make this more than an MDP with extra bookkeeping.

First, many deployed systems are irreducibly multi-agent: traffic signals on a
grid, market makers, packet routers, warehouse robot fleets, and any learned
policy deployed alongside other learned policies, copies of itself included.
Such agents often _cannot_ be centralised at execution time, because each sees
only local observations and communication is limited.

Second, self-play turns a competitive game into an automatic curriculum: the
opponent improves exactly as fast as you do, so data of the right difficulty is
generated for free. That is the mechanism behind the strongest board-game
results.

## Intuition

Fix agent $i$ and marginalise the others away. It faces an MDP whose transition
and reward functions average over what the others currently do — well defined,
and different every time anyone else takes a gradient step. The agent is fitting
a target that moves _because_ of its own learning.

The everyday analogy is learning to drive where every other driver is also a
learner changing habits weekly. It is wrong in one way: other drivers do not
adapt to you personally and learning agents do, so the non-stationarity is
correlated with your own updates and cannot be averaged out as noise. Hence the
danger of a replay buffer here — its transitions were generated against
opponents that no longer exist.

Second: "the optimal policy" stops being well formed. There is no best policy
independent of what everyone else plays, only best responses, whose mutual fixed
points are equilibria.

## Concrete example

Take the two-agent cooperative _climbing game_: both agents pick a row and a
column simultaneously and both receive the same payoff.

$$
\begin{array}{c|ccc}
 & b_1 & b_2 & b_3 \\ \hline
a_1 & 11 & -30 & 0 \\
a_2 & -30 & 7 & 6 \\
a_3 & 0 & 0 & 5
\end{array}
$$

The best joint action is $(a_1, b_1) = 11$. Now run two independent Q-learners,
each keeping a value for its own three actions only. While the partner is still
exploring uniformly, agent 1's expected payoffs are

$$
\bar{Q}(a_1) = \tfrac{11 - 30 + 0}{3} = -6.33,\quad
\bar{Q}(a_2) = \tfrac{-30 + 7 + 6}{3} = -5.67,\quad
\bar{Q}(a_3) = \tfrac{0 + 0 + 5}{3} = 1.67 .
$$

The optimal action $a_1$ looks like the _worst_ of the three, because the $-30$
it earns against $b_2$ is charged to $a_1$ rather than to the miscoordination:
credit assignment failing, since one shared scalar does not say whose choice was
wrong. Independent learners here typically settle on the safe equilibrium
$(a_2, b_2) = 7$ rather than $11$. Note that $(a_3, b_3) = 5$ is not an
equilibrium at all — against $b_3$, agent 1 prefers $a_2$, worth $6$.

A joint-action learner with one table over all nine joint actions can at least
represent that $(a_1, b_1)$ is worth $11$, though the two must still coordinate
on playing it. It also has $|\mathcal{A}|^n$ entries, which is the whole problem.

## Formal treatment

Let $\pi = (\pi^1,\dots,\pi^n)$ be the joint policy, $\pi^{-i}$ everyone but
$i$, and
$V^i_\pi(s) = \mathbb{E}_\pi\big[\sum_{t \ge 0} \gamma^t r^i_t \mid s_0 = s\big]$
agent $i$'s value. A joint policy $\pi^*$ is a **Nash equilibrium** if no agent
gains by deviating alone:

$$
V^i_{(\pi^{i*},\, \pi^{-i*})}(s) \;\ge\; V^i_{(\pi^{i},\, \pi^{-i*})}(s)
\qquad \text{for all } i,\ \text{all } \pi^i,\ \text{all } s .
$$

Non-stationarity is then precise rather than rhetorical. Agent $i$'s effective
transition kernel is

$$
P^i_{\pi^{-i}}(s' \mid s, a^i)
= \sum_{\mathbf{a}^{-i}} P(s' \mid s, a^i, \mathbf{a}^{-i})
\prod_{j \ne i} \pi^j(a^j \mid s),
$$

with the reward marginalised the same way. Both depend on $\pi^{-i}$, so $P^i$
is time-varying and $(s, a^i)$ is not a Markov state for agent $i$.

Two-player zero-sum has a clean theory: the minimax value of a finite discounted
zero-sum stochastic game exists and is unique, and value iteration with a
minimax backup converges to it. In general-sum games the object is an
equilibrium rather than a value, and uniqueness goes away.

**Centralised training with decentralised execution (CTDE)** is the standard
engineering answer. Each agent executes $\pi^i(a^i \mid o^i)$ from its own
observation, but in training a critic gets privileged information —
$Q(s, a^1,\dots,a^n)$, conditioned on global state and the joint action.
Conditioning on what the others did makes its regression target stationary given
the joint policy, which is what a decentralised critic lacks.

Two CTDE mechanisms matter. **Value decomposition** factorises the joint
action-value, additively as $Q_{\text{tot}} = \sum_i Q_i(\tau^i, a^i)$ in each
agent's own observation history $\tau^i$, or under the weaker constraint
$\partial Q_{\text{tot}} / \partial Q_i \ge 0$; either way
maximising $Q_{\text{tot}}$ agrees with each agent maximising its own $Q_i$, so
greedy execution stays decentralised. **Counterfactual credit assignment**
scores an agent against its own alternatives with the others held fixed:

$$
A^i(s, \mathbf{a}) = Q(s, \mathbf{a}) - \sum_{a'^i} \pi^i(a'^i \mid o^i)\,
Q\big(s, (\mathbf{a}^{-i}, a'^i)\big).
$$

In the climbing game this scores agent 1's row against its alternatives at the
column actually played, which strips out the variance the partner's column adds.
It does not by itself rescue $a_1$: the baseline depends only on
$\mathbf{a}^{-i}$, so averaged over the partner's play it subtracts the same
constant from every row and leaves the ranking above unchanged.

## Assumptions and requirements

Single-agent convergence results assume a fixed environment. Q-learning's
guarantee needs stationary $P$ and $R$, infinitely many visits to every
state-action pair, and Robbins-Monro step sizes; independent learners break the
first hypothesis outright. The conclusion is that the theorem is silent, not
that learning fails — independent PPO and independent Q-learning remain strong
baselines, and that gap between theory and practice is real.

CTDE further requires that the privileged state exists at training time, that
decentralisation at execution is a real constraint, and that nothing present in
centralised training is missing at deployment. Value decomposition requires its
monotonicity condition to match the payoff structure, and the climbing game is a
standard case where it does not: no monotone mixing of per-agent values
represents a matrix whose best row also carries the largest penalty. Self-play's
guarantees are a two-player zero-sum phenomenon. Equilibrium learners such as
Nash-Q need more still — observing other agents' rewards and actions, plus a
rarely checkable uniqueness condition on the stage-game equilibrium.

## Uses and applicability

Reach for multi-agent methods when decentralised execution is a hard constraint
— robot teams, traffic control, distributed energy, network routing — or when
the domain is a game and self-play supplies the curriculum, as in the systems
that reached superhuman board play from self-play alone.

Do not, when you can centralise: if one controller can observe everything and
emit the joint action at execution time, the problem is a single MDP with a
structured action space, and single-agent RL with a factored policy is simpler
and usually stronger. Nor when the "agents" are parallel workers on one
objective — that is distributed training, and no one is playing anyone.

## Limitations and common mistakes

The most common error is treating Nash equilibrium as the goal. General-sum
games can have many equilibria with no principled way to select among them, and
nothing coordinates independent learners onto the same one. Equilibria can be
Pareto-dominated: mutual defection in the prisoner's dilemma is one, and is
worse for both sides than cooperation. Learning dynamics need not reach any
equilibrium — in matching pennies, gradient play cycles indefinitely. And
computing one is believed to be intractable in general.

Second, do not treat non-stationarity as noise: replayed transitions are stale
in a way more data does not fix. Mitigations are on-policy methods, importance
correction, or conditioning stored data on the policies that made it.

Third, shared-reward training invites the _lazy agent_: one agent learns a
decent policy, the shared reward turns positive, and the other's contribution is
masked so it never improves — credit assignment again, and the reason difference
rewards and counterfactual baselines exist.

Fourth, self-play is not progress. Strategy spaces are often non-transitive, so
a policy can beat its current opponent and lose to a version of itself from ten
thousand steps ago; leagues and opponent archives keep old strategies in play.

Finally, benchmark rankings are empirical findings, not laws: the reported
ordering of the main cooperative MARL algorithms has moved with implementation
details and tuning budget, and which is best is not settled.

## Variants and alternatives

**Independent learners** run one single-agent algorithm per agent and ignore the
problem: cheap, scalable, competitive, no guarantees. **CTDE** methods add
privileged critics — a per-agent centralised critic for continuous actions, a
counterfactual baseline for credit assignment, additive or monotone value
factorisation for discrete cooperative control, a centralised value function
bolted onto PPO. **Fully centralised joint-action learners** are exactly right
and exponentially expensive. **Equilibrium learners** — minimax-Q for zero-sum,
Nash-Q and correlated-Q for general-sum — target a solution concept directly,
paying in observability assumptions and scaling. **Population and regret
methods** such as fictitious play, double oracle and counterfactual regret
minimisation come from the game-theory side and dominate imperfect-information
zero-sum games. **Mean-field** methods replace the others by a distribution,
buying scale at the cost of modelling individuals.

The genuinely different competitor is search: in perfect-information games,
alpha-beta or Monte Carlo tree search solves the problem without learning a
policy at all. Modern systems combine the two, guiding search with a learned
policy and value and training on the search's output.

## History and attribution

The field has several independent origins rather than one. Non-cooperative game
theory supplies the solution concepts: von Neumann and Morgenstern's 1944 book
and Nash's equilibrium existence results of 1950–51. Shapley's stochastic games
of 1953 are the direct ancestor of the model used here and predate the
reinforcement learning machinery they later met. Distributed artificial
intelligence contributed the framing of many interacting decision makers, and
evolutionary game theory the dynamics.

The traditions were explicitly joined in the mid-1990s: independent versus
cooperative learners were compared in 1993, and the Markov game was proposed as
the framework for multi-agent RL in 1994 alongside minimax-Q. Self-play is older
still, running from Samuel's checkers player through Tesauro's backgammon
program — both case studies in Sutton and Barto — and sharpest in the systems
that learned chess, shogi and Go from random initialisation with no human games.
Deep CTDE algorithms followed from roughly 2016.

## Sources

**Artificial Intelligence: A Modern Approach** is the reference for the
multi-agent decision-making frame — games, equilibria, cooperative versus
non-cooperative settings, and the trail back to von Neumann and Nash.
**Reinforcement Learning: An Introduction** supplies the single-agent
assumptions this setting breaks, and its case studies cover the self-play
lineage from Samuel to TD-Gammon. **Mastering Chess and Shogi by Self-Play**
shows what self-play plus search achieves in two-player zero-sum games, and
**A Survey of Monte Carlo Tree Search Methods** covers that search alternative.

## Prerequisites and next connections

Read [Markov Decision Processes](./markov-decision-processes.md) first; every
piece of notation here is that model with a joint action and a reward vector.
[Actor-Critic](./actor-critic.md), and [Policy Gradients](./policy-gradients.md)
behind it, are needed before CTDE makes sense.

Then compare with [Q-Learning](./q-learning.md), whose convergence conditions
are what independent learners give up, and [DQN](./dqn.md), whose replay buffer
multi-agent training makes unsafe.
[Monte Carlo Methods](./monte-carlo-methods.md) underpins the competing tree
search, and [Federated Learning](./federated-learning.md) is the clarifying
contrast: many participants, one objective, no game.
