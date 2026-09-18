---
concept_id: concept.search.monte_carlo_tree_search
title: Monte Carlo Tree Search
slug: /concepts/monte-carlo-tree-search
aliases:
  - MCTS
kind: algorithm
tier: 1
review_state: generated-draft
summary: A search method that grows a lopsided tree one simulated trajectory at a time, letting a bandit rule decide where to look next, so an agent can act well in enormous state spaces with no hand-written evaluation function and no fixed search depth.
categories:
  - Artificial Intelligence/Symbolic AI/Search
primary_category: Artificial Intelligence/Symbolic AI/Search
relationships:
  - type: requires
    target: concept.reinforcement_learning.multi_armed_bandits
    note: UCT is literally UCB1 run at every node of the tree, so the exploration bonus, its logarithmic growth and the regret argument behind it are unreadable without the bandit problem first.
  - type: contrasts_with
    target: concept.search.minimax
    note: Minimax expands full width to a fixed depth and backs up a static evaluation, while MCTS expands selectively to variable depth and backs up sampled outcomes — opposite answers to the same question of where to spend a search budget.
  - type: used_to_solve
    target: concept.search.adversarial_search
    note: Choosing a move in a two-player zero-sum game is the problem MCTS was built for and the setting in which its convergence result is stated.
  - type: contributes_to
    target: concept.reinforcement_learning.model_based_reinforcement_learning
    note: Once an agent has a model it can simulate, MCTS is the standard decision-time planner that turns that model into an improved action, as in AlphaZero and MuZero.
sources:
  - source_id: source.browne2012.mcts_survey
    title: A Survey of Monte Carlo Tree Search Methods
    url: https://ieeexplore.ieee.org/document/6145622
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.silver2016.alphago
    title: Mastering the game of Go with deep neural networks and tree search
    url: https://www.nature.com/articles/nature16961
    source_kind: primary-research
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.silver2017.alphazero
    title: Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm
    url: https://arxiv.org/abs/1712.01815
    source_kind: preprint
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
unresolved_references:
  - label: Kocsis and Szepesvári (2006), the paper that introduced UCT and its convergence theorem
    reason: The registry has no entry for the primary paper, so the statement of the convergence result here is taken as reported in the Browne et al. survey rather than from the original.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: Later re-analyses of the UCT convergence proof
    reason: No registry source covers the post-2012 work revisiting the concentration argument for the non-stationary payoff sequence at a node, so the page notes only that the step was revisited and does not state a corrected rate.
    sections:
      - formal-treatment
claims: []
---

## Definition

**Monte Carlo Tree Search** estimates the value of each action at a state by
repeating one four-phase loop until a budget runs out, then playing the root
action with the best accumulated statistics.

1. **Selection.** Descend from the root through nodes already in the tree,
   choosing at each by a _tree policy_ that treats its children as a multi-armed
   bandit, until it reaches a node with an untried action or a terminal state.
2. **Expansion.** Add a child node for one untried action.
3. **Simulation** (_rollout_, _playout_). From the new node, follow a cheap
   _default policy_ — classically uniform random moves — to a terminal state
   with outcome $z$.
4. **Backpropagation.** Walk back to the root, incrementing each node's visit
   count and adding $z$ to its value.

No node holds an evaluated position, only counts and sums of outcomes that
passed through it.

## Why it matters

Classical game search needs two things MCTS does not: a static evaluation
function good enough to rank positions at the frontier, and a branching factor
small enough that full-width expansion reaches an interesting depth. Go supplies
neither — roughly 250 legal moves per position, and no compact positional score
anyone managed to hand-write. A simulator that lists legal moves and scores a
finished game is all MCTS needs.

It is also **anytime**: every iteration leaves the statistics valid, so the
search can stop after a thousand simulations or ten million. And it spends
unevenly, growing deep along lines that keep looking good and staying one node
thick elsewhere, which is what makes a huge branching factor survivable.

## Intuition

Each playthrough buys one noisy bit of evidence about one line of play, and the
selection rule decides where to spend the next one: mostly on the line that
looks best, sometimes on one whose three-game record could be an accident.

The picture is a nest of slot machines — each node a bandit whose arms are the
legal moves, pulling an arm meaning "play the rest of the game from here and
tell me who won". The analogy breaks where it matters: a real arm has a fixed
payoff distribution, whereas a child's _changes_ as the subtree beneath it
grows. That non-stationarity is the delicate step in UCT's analysis.

## Concrete example

A root node has been visited $N(s) = 100$ times, with three children:

| move  | visits $N(s,a)$ | mean value $Q(s,a)$ |
| ----- | --------------- | ------------------- |
| $a_1$ | 60              | 0.60                |
| $a_2$ | 30              | 0.55                |
| $a_3$ | 10              | 0.50                |

With $\ln 100 = 4.605$, the bonus $\sqrt{\ln N(s)/N(s,a)}$ is $0.277$, $0.392$
and $0.679$. At $c = \sqrt{2}$ — the UCB1 setting for rewards in $[0,1]$ — the
scores are $0.992$, $1.104$ and $1.460$, so $a_3$ is selected: the _worst_ child
by mean value, because it is the least explored. At $c = 0.2$ the scores become
$0.655$, $0.628$ and $0.636$ and $a_1$ wins instead. The exploration constant
decides whether the search samples or descends greedily.

If $a_3$ is selected and its simulation returns a win, $z = 1$, backpropagation
takes $N(s,a_3)$ to $11$, its accumulated value $5.0$ to $6.0$, its mean to
$0.545$, and $N(s)$ to $101$ — shrinking $a_3$'s own bonus and raising its
siblings'.

```python
import math

def uct_select(children, parent_visits, c=math.sqrt(2)):
    """children: list of (action, total_value, visits). Untried actions go first."""
    def score(child):
        _, w, n = child
        if n == 0:
            return math.inf
        return w / n + c * math.sqrt(math.log(parent_visits) / n)
    return max(children, key=score)
```

## Formal treatment

A node stores a state $s$, a visit count $N(s)$, and for each legal action
$a \in A(s)$ a count $N(s,a)$ and accumulated value $W(s,a)$, with
$Q(s,a) = W(s,a)/N(s,a)$ and rewards in $[0,1]$. **UCT** — upper confidence
bounds applied to trees — is the tree policy

$$
a_t \;=\; \arg\max_{a \in A(s)}
\left\{\; Q(s,a) \;+\; c\,\sqrt{\frac{\ln N(s)}{N(s,a)}} \;\right\},
$$

with any action having $N(s,a) = 0$ taken first. Browne et al. write the bonus
as $2C_p\sqrt{2\ln N(s)/N(s,a)}$ and report $C_p = 1/\sqrt{2}$ as the value that
satisfies Hoeffding's inequality for rewards in $[0,1]$; substituted, that is
$2\sqrt{\ln N(s)/N(s,a)}$ — $c = 2$, a more exploratory setting than UCB1's
$c = \sqrt{2}$ used above, not a restatement of it. The constant differs between
write-ups; the $\sqrt{\ln N(s)/N(s,a)}$ shape does not. In a two-player zero-sum
game the backup negates the outcome at alternate plies, so $Q(s,a)$ always reads
as good for the player to move at $s$. The action finally played is the _most
visited_ root child, not the highest-mean one: a visit count is less sensitive
to a lucky rollout.

**Convergence.** Kocsis and Szepesvári proved, as reported in the survey, that
on a finite game tree with bounded rewards UCT's root value converges to the
minimax value and the probability of choosing a suboptimal root action falls to
zero at a polynomial rate in the number of simulations. The conditions matter:
finite depth and branching, bounded rewards, and an exploration term large
enough that every child is visited infinitely often — a greedy tree policy
forfeits the guarantee. The default policy vanishes in the limit, since the tree
eventually expands everywhere, but it dominates behaviour at any real budget.
The original argument assumed exponential concentration for the non-stationary
payoff sequence at a node; that step has been revisited since, and the
asymptotic conclusion stands while the rate is contested.

**PUCT.** AlphaGo and AlphaZero use a prior-weighted bonus instead,

$$
a_t \;=\; \arg\max_a \left( Q(s,a) \;+\; c_{\text{puct}}\, P(s,a)\,
\frac{\sqrt{\sum_b N(s,b)}}{1 + N(s,a)} \right),
$$

with $P(s,a)$ a policy network's probability for $a$. Note $\sqrt{N}$ rather
than $\sqrt{\ln N}$: an empirical schedule, not UCB1, and it inherits no regret
bound.

## Assumptions and requirements

MCTS is a _planning_ algorithm and needs a generative model: given $s$ and $a$
it must produce the next state. It cannot run from logged transitions alone, and
the model must be cheap, since one move costs thousands to millions of
simulations.

Episodes must terminate, or be truncated — and truncation reintroduces the
evaluation function the method was supposed to do without. Rewards must be
bounded on a known scale, because $c$ is compared directly against $Q$: with
rewards in $[0,100]$ and $c = 1.4$ the bonus is negligible and the search
collapses to greedy descent. And statistics are keyed by node, so transpositions
need deliberate handling: sharing counts between move orders that reach the same
position makes $N(s)$ refer to several parents at once.

## Uses and applicability

Reach for MCTS when the branching factor is large, no trustworthy evaluation
function exists, simulation is cheap, and reward arrives only at the end: Go and
Hex, general game playing, combinatorial search such as synthesis routes or
scheduling, and the decision-time planner of a model-based agent.

Do not reach for it when a strong evaluation function and a modest branching
factor already exist — top chess engines remain alpha-beta searchers with
learned evaluations — when the domain turns on precise forced sequences, when
simulation is expensive, or when the problem is small enough to solve exactly by
dynamic programming.

## Limitations and common mistakes

That MCTS needs no evaluation function is true of the classical algorithm and
false of every strong modern system: random rollouts were its weakest component.

It is poor at **traps**, where one specific reply refutes an otherwise
attractive move: averaging over rollouts dilutes a single refutation, and the
tree may not visit it often enough for the mean to move. That is why MCTS did
not displace alpha-beta in tactical games, and more simulations do not fix it.

Reading $Q(s,a)$ as a minimax value is a mistake at any finite budget: it is the
average outcome under whatever mixture of policies the search sampled.
Forgetting the sign flip during backup produces a bot that plays one side well
and the other terribly. More simulations against a _biased_ rollout policy or
value network converge on the biased answer faster, not on the truth. And
vanilla MCTS assumes perfect information: search one sampled deal of a card game
and the player is acting on cards it should not know, so plans that gather
information are never found.

## Variants and alternatives

**UCT** is the default instantiation. **RAVE** and all-moves-as-first share
statistics between identical moves played anywhere in a subtree, buying fast
early estimates at the cost of bias. **PUCT with a learned prior** is the
AlphaGo family. **Progressive widening** admits children gradually, surviving
large or continuous action sets. **MCTS-Solver** backs up proven wins and losses
exactly, patching the trap weakness near the leaves.

The real alternatives are differently shaped searches: alpha-beta with iterative
deepening and a strong evaluation, proof-number search when the goal is to
_solve_ a game rather than play it, and model-free reinforcement learning, which
does no search at decision time at all.

## History and attribution

Scoring a Go position by random playouts predates the tree: it was tried in the
early 1990s and worked surprisingly well with no search structure on top. The
tree form arrived in 2006 from two directions — Coulom introduced Monte Carlo
tree search with its selectivity and backup operators, and Kocsis and
Szepesvári produced UCT by applying UCB1 at every node and proving convergence.
Go engines adopted it immediately.

The change that mattered came later. AlphaGo (2016) kept the four phases but
took move priors from a policy network and evaluated leaves with a mixture of a
value network and a fast rollout. AlphaZero (2017) dropped the rollout entirely:
the value head alone evaluates a leaf, and the search's visit counts become the
training target for the policy, making MCTS a policy-improvement operator inside
self-play reinforcement learning. The tree mechanics barely changed; what a leaf
was worth changed completely.

## Sources

The Browne et al. survey is the reference for the algorithm itself: the four
phases, UCT, the convergence result, and a taxonomy of variants up to 2012.
Russell and Norvig give the compact textbook treatment alongside alpha-beta and
are good on where playout-based search fails. AlphaGo documents the PUCT rule
and the mixed leaf evaluation; AlphaZero documents dropping rollouts and
training on visit counts.

## Prerequisites and next connections

Read [Multi-Armed Bandits](./multi-armed-bandits.md) first: UCT is UCB1 repeated
at every node, and the bonus makes no sense without the regret argument behind
it. [Monte Carlo Methods](./monte-carlo-methods.md) supplies the other half,
estimates built by averaging complete sampled returns rather than bootstrapping,
and [Markov Decision Processes](./markov-decision-processes.md) frames the
single-agent case.

From here, [Model-Based Reinforcement Learning](./model-based-reinforcement-learning.md)
is where MCTS becomes a component rather than an algorithm, and
[Dynamic Programming](./dynamic-programming.md) is the computation it
approximates when the state space is too large to sweep.
