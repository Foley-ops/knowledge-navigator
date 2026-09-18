---
concept_id: concept.reinforcement_learning.markov_decision_processes
title: Markov Decision Processes
slug: /concepts/markov-decision-processes
aliases:
  - MDP
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The standard formal model of sequential decision making under uncertainty, and the setting in which nearly every reinforcement learning algorithm is stated, proved and debugged.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.probability.stochastic_processes
    note: The state sequence under a fixed policy is a Markov chain, so transition kernels, stationarity and conditional independence over time are the substrate the definition is written in.
  - type: prerequisite_of
    target: concept.reinforcement_learning.dynamic_programming
    note: Value iteration and policy iteration are algorithms that operate on a fully known MDP, and their statement and convergence proof are meaningless without the transition kernel, reward and discount.
  - type: prerequisite_of
    target: concept.reinforcement_learning.temporal_difference_learning
    note: A TD update is a sampled version of the Bellman expectation equation, so the value function it estimates is defined only once the MDP is fixed.
  - type: contrasts_with
    target: concept.machine_learning.hidden_markov_models
    note: An HMM has a hidden Markov state and no actions or rewards, an MDP has actions and rewards and an observed state, and the partially observable MDP is what you get when both complications hold at once.
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
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - uses-and-applicability
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
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.probabilistic_systems
    title: MIT 6.041 Probabilistic Systems Analysis and Applied Probability (Fall 2010)
    url: https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: Measure-theoretic MDP theory for general state and action spaces
    reason: The registry has no source covering existence of optimal policies under measurable-selection conditions, or the optimality theory for the average-reward and total-reward criteria, so this page states the finite discounted case precisely and only names the general case as harder.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
claims: []
---

## Definition

A **Markov decision process** is a tuple $(\mathcal{S}, \mathcal{A}, p, \gamma)$: states
$\mathcal{S}$, actions $\mathcal{A}$ with $\mathcal{A}(s)$ available in state $s$, a dynamics
function

$$
p(s', r \mid s, a) \;=\; \Pr\{S_{t+1} = s',\, R_{t+1} = r \mid S_t = s,\, A_t = a\},
$$

and a discount factor $\gamma \in [0,1]$. The whole content of the word _Markov_ is that this
conditional distribution is the same whatever preceded $s$ and $a$: the state is a sufficient
statistic for the future. Behaviour is a **policy** $\pi(a \mid s)$, and the problem is to find
one maximising expected discounted reward.

## Why it matters

The MDP is what makes sequential decision making computable rather than merely describable.
Optimising over behaviours means searching a tree of action sequences that grows exponentially
with the horizon; the Markov assumption collapses it, since the future depends on the past only
through the current state, so every state's optimal value satisfies one fixed-point equation in
$|\mathcal{S}|$ unknowns.

It matters again as a shared language: dynamic programming, temporal-difference learning,
Q-learning and policy gradients are statements about this one object, differing in what they
assume known — the kernel $p$, or samples from it — so a failure can be charged to a broken
assumption rather than to the algorithm.

## Intuition

Picture a labelled graph: nodes are states, each action a bundle of weighted outgoing edges with
a payout. A value function says what each node is worth to stand in and play well forever; the
Bellman equation is the local condition that this worth equals the immediate payout plus the
discounted worth of wherever you land, and solving the MDP means making it hold everywhere at
once.

The financial analogy holds up — $v(s)$ a fair price, $\gamma$ a discount rate — and breaks
twice: you choose which distribution over next states you face, by acting, so there is no
exogenous market; and an MDP optimises an expectation, so it is risk-neutral, indifferent between
a guaranteed $1$ and a coin flip between $0$ and $2$. That indifference sits in the objective,
not in the problem.

## Concrete example

A machine is `working` or `broken`. In `working` you may `run` it — reward $+10$, staying working
with probability $0.8$ and breaking with probability $0.2$ — or `service` it, for $+4$ and a
certain return to `working`. In `broken` the only action is `repair`: reward $-30$, back to
`working` with certainty.

With $\gamma = 0.9$ the optimal policy is to service. Always servicing gives
$v(\text{working}) = 4 + 0.9\,v(\text{working}) = 40$ and $v(\text{broken}) = -30 + 0.9(40) = 6$;
running scores $10 + 0.9[0.8(40) + 0.2(6)] = 39.88 < 40$, so no improvement exists and
$v_* = (40, 6)$. With $\gamma = 0.5$ the answer flips: running gives
$v(\text{working}) = 7 / 0.55 \approx 12.73$ against $8$ for servicing. Only the discount changed:
the myopic agent runs the machine into the ground, the far-sighted one pays maintenance.

```python
A = {"working": ["run", "service"], "broken": ["repair"]}
M = {  # (state, action) -> (reward, {next state: probability})
    ("working", "run"):     (10.0, {"working": 0.8, "broken": 0.2}),
    ("working", "service"): (4.0,  {"working": 1.0}),
    ("broken", "repair"):   (-30.0, {"working": 1.0}),
}
gamma, v = 0.9, {"working": 0.0, "broken": 0.0}
for _ in range(500):  # value iteration: v <- T v
    v = {s: max(r + gamma * sum(pr * v[s2] for s2, pr in T.items())
                for r, T in (M[(s, a)] for a in A[s]))
         for s in A}
print(v)  # approximately {'working': 40.0, 'broken': 6.0}
```

## Formal treatment

Let $\mathcal{S}$ and $\mathcal{A}$ be finite, rewards bounded by $R_{\max}$, and
$\gamma \in [0,1)$. The **return** $G_t = \sum_{k=0}^{\infty} \gamma^{k} R_{t+k+1}$ converges
absolutely, with $|G_t| \le R_{\max}/(1-\gamma)$. For a policy $\pi$ write
$v_\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]$ and
$q_\pi(s,a) = \mathbb{E}_\pi[G_t \mid S_t = s, A_t = a]$. Conditioning on the first step gives
the **Bellman expectation equation**, a linear system in $v_\pi$:

$$
v_\pi(s) \;=\; \sum_{a} \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a)\big[\, r + \gamma\, v_\pi(s') \,\big].
$$

The **Bellman optimality equations** replace that average with a maximum, and are nonlinear:

$$
v_*(s) \;=\; \max_{a \in \mathcal{A}(s)} \sum_{s', r} p(s', r \mid s, a)\big[\, r + \gamma\, v_*(s') \,\big],
$$

$$
q_*(s,a) \;=\; \sum_{s', r} p(s', r \mid s, a)\Big[\, r + \gamma \max_{a'} q_*(s', a') \,\Big].
$$

Write the right-hand side as an operator $T$ on $\mathbb{R}^{|\mathcal{S}|}$. A maximum of
$\gamma$-scaled averages differs by at most $\gamma$ times the largest input difference, so $T$ is
a $\gamma$-contraction in sup norm on a complete space; Banach's fixed-point theorem gives a
unique $v_*$, with $\|v_k - v_*\|_\infty \le \gamma^{k}\|v_0 - v_*\|_\infty$ for value iteration
$v_{k+1} = Tv_k$.

**Existence of an optimal deterministic stationary policy.** Under those hypotheses any policy
greedy with respect to $v_*$ — that is,
$\pi(s) \in \arg\max_a \sum_{s',r} p(s',r \mid s,a)[r + \gamma v_*(s')]$ — achieves
$v_\pi = v_*$, and $v_*(s) \ge v_{\pi'}(s)$ for every policy $\pi'$ and every $s$. Three claims
are packed in there: the optimal policy needs no memory (_stationary_) and no randomisation
(_deterministic_), and one policy is optimal from every start state at once, so there is no
trade-off between start states. Randomised policies may tie, never win. Policy iteration
terminates exactly, since there are only $\prod_s |\mathcal{A}(s)|$ deterministic policies and
each iteration strictly improves.

## Assumptions and requirements

**The Markov property is an assumption about your state variable, not about the world.** This is
the sentence to keep. Any process can be made Markov by putting enough history into the state —
in the limit, the whole trajectory — so the real questions are whether a _compact_ sufficient
state exists and whether yours is one. A single Atari frame is not: it shows where the ball is
but not which way it moves, and stacking four frames is what puts velocity in the state.

The rest: the kernel $p$ is **stationary**, not drifting while you learn; the agent **observes
the state** rather than a function of it; rewards are **bounded**; and either $\gamma < 1$ or
episodes terminate. Drop stationarity and there is no single $v_*$ to find; drop boundedness and
values can diverge, and the sup-norm argument needs a weighted norm to say anything;
drop finiteness and the contraction survives, but an optimal _measurable_ policy
needs continuity and selection conditions this page does not state. Underneath sits the _reward
hypothesis_: that goals are adequately expressed as maximisation of one scalar signal. Sutton and
Barto call it a hypothesis, and it is contested.

## Uses and applicability

Reach for an MDP when decisions have delayed, stochastic consequences that feed back into future
options: inventory and maintenance policy, queue admission control, treatment sequencing, robot
control, board games, the Atari benchmark DQN used.

Do not, when actions do not move the environment — that is a contextual bandit — or when other
actors adapt to you, since their adaptation makes your kernel non-stationary; that is a
stochastic game. Be sceptical when the state space is combinatorially large with no exploitable
structure: a sweep costs work proportional to $|\mathcal{S}|^2|\mathcal{A}|$ for a dense kernel,
and Bellman's own name for that wall was the curse of dimensionality.

## Limitations and common mistakes

The commonest error is treating the Markov property as a claim about reality, and concluding
that MDPs "assume the world is simple". It is a claim about the state representation, usually
violated because the modeller left something out.

The second is silently confusing state with observation. If the agent sees $o$ while the process
is in $s$, the problem is a **partially observable MDP**, and memoryless policies over
observations can be arbitrarily bad — the best one may even need to be stochastic, which the
existence theorem above does not cover: that theorem is about policies over states. The classical
repair is the belief state: the posterior $b(s)$ given the whole history is itself Markov, so a
POMDP is an MDP over a continuous belief simplex — exact, almost never tractable, and the reason
practice uses recurrent or history-window policies instead.

The third is treating $\gamma$ as a numerical knob: the example above changes its optimal policy
between $\gamma = 0.5$ and $\gamma = 0.9$, so the discount belongs to the problem statement, as
does the reward function. Fourth, the guarantees do not survive function approximation — the
contraction is in sup norm over exact value functions, and projecting onto a network's range
breaks it.

## Variants and alternatives

**Finite-horizon** MDPs make the optimal policy depend on time remaining — deterministic but not
stationary. **Average-reward** MDPs replace discounting with long-run reward per step for
continuing tasks, at the cost of structural conditions on the chain. **Stochastic shortest path**
uses undiscounted total reward with absorbing goals. **POMDPs** add an observation kernel.
**Constrained** MDPs add expected-cost constraints and can require a randomised optimal policy.
**Factored** MDPs write $p$ compactly as a dynamic Bayesian network; **semi-MDPs** let actions
take variable time and host temporally extended options; the linear-quadratic regulator is the
classic continuous-state case with a closed form. Genuinely different framings: contextual
bandits drop state transitions; stochastic games admit several optimising agents, where a single
optimal policy need not exist; model predictive control re-optimises an open-loop plan each step
instead.

## History and attribution

Richard Bellman formulated the value recursion and the principle of optimality at RAND in the
1950s, working on multistage decision problems, and named the method _dynamic programming_ — by
his own account, partly because the name sounded unobjectionable to sponsors. His 1957
work introduced the Markovian decision process in essentially its current form, and Ronald
Howard's _Dynamic Programming and Markov Processes_ (1960) gave policy iteration. Lloyd Shapley's
1953 work on stochastic games contains the same recursion for a two-player zero-sum setting, one
of several places the idea arrived independently. It reached machine learning through the
reinforcement learning tradition, which read temporal-difference methods as sampled dynamic
programming on an MDP with unknown kernel.

## Sources

Sutton and Barto is the source to read first and the one this page follows closely: finite MDPs,
both Bellman equations, optimal deterministic policies, worked two-state examples, the
attributions. Russell and Norvig treats POMDPs and belief states better. The DQN paper is cited
for one thing: a system whose state is stacked frames because one frame is not Markov. The MIT
course supplies the Markov chain background.

## Prerequisites and next connections

Read [Stochastic Processes](./stochastic-processes.md) first, or at least its Markov chain part:
under a fixed policy an MDP _is_ a Markov chain with rewards, and kernel, stationarity and the
Markov property mean here what they mean there. [Probability Theory](./probability-theory.md)
supplies the conditioning and expectation used above.

Sideways, [Hidden Markov Models](./hidden-markov-models.md) is the closest neighbour — same
chain, latent state, nothing to decide — and a POMDP's belief state is computed by exactly the
filtering recursion an HMM uses. [Bayesian Networks](./bayesian-networks.md) is how a factored
MDP writes a large kernel compactly.

This opens up the rest of reinforcement learning: dynamic programming solves the Bellman
equations when $p$ is known, and Monte Carlo, temporal-difference, Q-learning and policy-gradient
methods take over when it is not.
