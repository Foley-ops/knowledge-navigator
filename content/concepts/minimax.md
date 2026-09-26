---
concept_id: concept.search.minimax
title: Minimax
slug: /concepts/minimax
aliases:
  - negamax
  - minimax search
kind: algorithm
tier: 1
review_state: generated-draft
summary: The value a position is worth when both players play perfectly, computed by backing terminal utilities up the game tree with alternating maximisation and minimisation — and, with alpha-beta pruning, computed while skipping the subtrees that cannot change it.
categories:
  - Artificial Intelligence/Symbolic AI/Search
  - Mathematics/Game Theory
primary_category: Artificial Intelligence/Symbolic AI/Search
relationships:
  - type: specializes
    target: concept.search.adversarial_search
    note: Minimax is the particular backup rule that makes adversarial search well-posed — it is what "the value of a node" means once an opponent controls half the moves.
  - type: contrasts_with
    target: concept.search.monte_carlo_tree_search
    note: MCTS replaces exhaustive backup and a hand-built evaluation function with sampled playouts averaged at each node, buying applicability where no evaluation function is trustworthy at the cost of exactness.
  - type: contrasts_with
    target: concept.reinforcement_learning.dynamic_programming
    note: Both compute exact optimal values by backing a Bellman-style recursion up from terminal states, but minimax alternates a max with an adversary's min where dynamic programming takes an expectation under a fixed transition model.
  - type: contrasts_with
    target: concept.search.uninformed_search
    note: The traversal is the same depth-first walk over a tree, but only half the branches belong to the searcher, so the answer is a guaranteed value rather than a path the agent can simply execute.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
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
    checked_on: 2026-09-18
  - source_id: source.browne2012.mcts_survey
    title: A Survey of Monte Carlo Tree Search Methods
    url: https://ieeexplore.ieee.org/document/6145622
    source_kind: primary-research
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-18
  - source_id: source.silver2017.alphazero
    title: Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm
    url: https://arxiv.org/abs/1712.01815
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: Knuth and Moore (1975), An Analysis of Alpha-Beta Pruning
    reason: The exact best-case leaf count b^ceil(d/2) + b^floor(d/2) - 1 and the formal correctness proof come from this paper; the registry has no entry for it, so the exact count stated in the formal treatment and the attribution in the history rest on an unregistered source, while the registered textbook supports only the asymptotic O(b^(d/2)) form of the result.
    sections:
      - formal-treatment
      - history-and-attribution
claims: []
---

## Definition

**Minimax** assigns to each position of a finite, two-player, zero-sum game of
perfect information the utility the first player (MAX) obtains when both sides
play optimally from there on. It is backward induction from the terminals: a
terminal node takes its own utility, a MAX node the maximum over its children, a
MIN node the minimum. The _minimax algorithm_ is the depth-first traversal that
evaluates the recursion; **alpha-beta pruning** reaches the same number while
skipping subtrees that provably cannot change it.

## Why it matters

Minimax is what "correct play" means in a game: without it a move is good
because someone says so, with it because of a number that can be computed and
checked. Every classical game-playing program is minimax plus two compromises
and one exact speedup — a fixed depth limit, a heuristic evaluation standing in
for the unreachable terminal utilities, and alpha-beta, which costs nothing in
accuracy, to roughly double the affordable depth — and
the engineering tradition lives entirely in the gap between the $b^d$ nodes the
definition demands and the nodes a machine can visit.

## Intuition

You get neither the average outcome nor your favourite one, but whatever
survives after the opponent takes the best of what you left them — so each of
your moves is worth the _worst_ thing that follows it.

Alpha-beta is the bookkeeping of a reasonable person comparing options. You hold
a move worth 3; you start on a second move and the opponent shows one reply that
holds you to 2. Stop — nothing else beneath it can make it your choice. The
analogy breaks when the game is not zero-sum: the opponent is then not trying to
hurt you, only to help themselves, and "the worst they can do" over-states the
danger.

## Concrete example

A root where MAX moves, three children B, C, D where MIN moves, three leaves
each:

```text
            A (MAX)
      /        |        \
   B(MIN)    C(MIN)    D(MIN)
   / | \     / | \     / | \
  3 12  8   2  4  6  14  5  2
```

MIN's nodes take minima: $B = 3$, $C = 2$, $D = 2$. MAX takes the maximum,
$V(A) = 3$, and the optimal move is B. MAX never gets 14 or 12; those leaves sit
in branches MIN will not allow.

Now run alpha-beta left to right. B is searched in full, giving $\alpha = 3$. At
C the first leaf is 2, so $\beta = 2 \le \alpha$ and the leaves 4 and 6 are
never generated. At D the leaves 14 and 5 do not lower $\beta$ below 3, so its
third leaf is visited too. Seven of the nine leaves are evaluated and the answer
is still 3. Reorder D so its 2 comes first and D is cut after one leaf as well:
five leaves, exactly the best case the formula below predicts for $b = 3$,
$d = 2$. A compact fail-soft implementation, on nested lists with integer
leaves:

```python
import math

def alphabeta(node, alpha=-math.inf, beta=math.inf, maximizing=True):
    if isinstance(node, int):
        return node
    if maximizing:
        v = -math.inf
        for child in node:
            v = max(v, alphabeta(child, alpha, beta, False))
            alpha = max(alpha, v)
            if v >= beta:
                break
        return v
    v = math.inf
    for child in node:
        v = min(v, alphabeta(child, alpha, beta, True))
        beta = min(beta, v)
        if v <= alpha:
            break
    return v

assert alphabeta([[3, 12, 8], [2, 4, 6], [14, 5, 2]]) == 3
```

## Formal treatment

Let $s$ be a state, $\tau(s) \in \{\mathrm{MAX}, \mathrm{MIN}\}$ the player to
move, $A(s)$ the legal actions, $\mathrm{Result}(s,a)$ the successor, and $u(s)$
the terminal utility measured from MAX's point of view. On a finite game tree,

$$
V(s) =
\begin{cases}
u(s), & s \text{ terminal},\\[2pt]
\max_{a \in A(s)} V(\mathrm{Result}(s,a)), & \tau(s) = \mathrm{MAX},\\[2pt]
\min_{a \in A(s)} V(\mathrm{Result}(s,a)), & \tau(s) = \mathrm{MIN}.
\end{cases}
$$

An optimal move at a MAX node is any
$a^\star \in \arg\max_{a} V(\mathrm{Result}(s,a))$. With uniform branching
factor $b$ and depth $d$ the traversal visits $\Theta(b^d)$ nodes in $O(bd)$
space.

Alpha-beta carries a window $(\alpha, \beta)$: $\alpha$ is a value MAX can
already force elsewhere in the tree, $\beta$ one MIN can already force. Writing
$\mathrm{AB}(s,\alpha,\beta)$ for the fail-soft return value,

$$
\mathrm{AB}(s,\alpha,\beta) = v \;\Longrightarrow\;
\begin{cases}
V(s) \le v, & v \le \alpha,\\
V(s) = v, & \alpha < v < \beta,\\
V(s) \ge v, & v \ge \beta.
\end{cases}
$$

Correctness is an induction on the tree. A cutoff at a MAX node happens when
$v \ge \beta$; since $\beta$ is a value MIN can force at an ancestor, that
ancestor's minimum is already at most $\beta$, so however large the unexamined
children make $V(s)$, the ancestor will not route through $s$ — there only the
inequality matters, not the exact value. MIN nodes are symmetric. At the root
the window is $(-\infty, +\infty)$, neither bound case can fire, and the
returned value is exactly $V(\text{root})$: **move ordering changes the cost,
never the value.**

With the best move examined first at every node, the number of leaves evaluated
is
$b^{\lceil d/2 \rceil} + b^{\lfloor d/2 \rfloor} - 1$, which is
$\Theta(b^{d/2}) = \Theta(\sqrt{b^{d}})$: the square root of the node count, so
the same budget buys twice the depth. Random ordering costs roughly
$O(b^{3d/4})$ for moderate $b$; adversarial ordering degenerates to $b^d$.

## Assumptions and requirements

**Zero-sum.** One number per node presumes MIN's utility is $-u$ (or a constant
minus $u$). With general payoffs each node needs a vector, backward induction
yields a subgame-perfect equilibrium rather than a value, and deep alpha-beta
cutoffs stop being sound: a branch bad for one player is no longer thereby good
for the other.

**Perfect information and determinism.** Add chance and the recursion needs an
expectation layer (expectiminimax), whose pruning requires bounded utilities.
Add hidden information and the tree over states is the wrong object: play is
defined over information sets, and optimal strategies may have to randomise.

**Finiteness.** The induction needs a terminal layer to start from; with cycles
it is not well-founded until repetition rules or a depth limit close it.

**An optimal opponent.** The value is a guarantee against best play, hence a
lower bound on what MAX gets against anyone — not a prediction of the score
against a weak opponent, whom minimax declines to exploit.

## Uses and applicability

Reach for minimax when the game is two-player, zero-sum and fully observable and
you have a positional evaluation you trust: chess, checkers, Othello, Connect
Four, endgames small enough to search to terminal nodes. Arithmetic decides
feasibility. Chess has $b \approx 35$, so a full-width depth-8 search is about
$35^8 \approx 2.3 \times 10^{12}$ leaves while well-ordered alpha-beta needs
about $35^4 \approx 1.5 \times 10^6$ — impossible against instant.

Do not reach for it when no cheap evaluation is reliable — the situation that
pushed Go to sampling-based search — or when the game is stochastic or
hidden-information. AlphaZero examined roughly 80 thousand positions per second
in chess against Stockfish's 70 million and still won: throughput and evaluation
quality substitute for one another.

## Limitations and common mistakes

The commonest confusion is between this algorithm and von Neumann's minimax
_theorem_. The theorem says a zero-sum matrix game has a value in mixed
strategies; the algorithm is backward induction on a perfect-information tree,
where optimal pure strategies exist and nothing needs randomising. The theorem
is not what makes alpha-beta correct.

The second is believing alpha-beta approximates. It does not: it returns the
identical root value on every tree and ordering. What _does_ change the answer
is forward pruning — null-move and late-move reductions, beam cuts — a different
mechanism often spoken of in the same breath.

The third is asking alpha-beta for more than the value. Change the example
tree's children to 3, 3 and 2: the search cuts the second after one leaf,
returns 3 as an _upper_ bound on it, and reports the first child although the
second is equally optimal. Pruned siblings come back as bounds only, and which
optimal move is reported depends on move order and tie-breaking.

The fourth is trusting a depth-limited value: a cut-off search returns the exact
minimax value of the _heuristic_ tree, not of the game, and the horizon effect
lets it postpone an unavoidable loss past the last ply. "Deeper is better" is an
empirical fact about real games, not a theorem — minimax pathology, where deeper
search under a noisy evaluation gets systematically worse, is constructible.

## Variants and alternatives

**Negamax** folds MIN into MAX by scoring every node from the point of view of
the player to move — $N(s) = V(s)$ at MAX nodes and $N(s) = -V(s)$ at MIN nodes
— so that the single rule $N(s) = \max_a -N(\mathrm{Result}(s,a))$ covers both
cases, halving the code; it works only because the game is zero-sum. **Iterative
deepening** with move-ordering heuristics — transposition-table best move,
killer moves, history — exists to feed alpha-beta the ordering its best case
assumes. **Principal variation search** proves siblings inferior with null
windows and re-searches on a fail-high, and **expectiminimax** adds chance
nodes.

The genuinely different approach is **Monte Carlo tree search**, which replaces
exhaustive backup and a hand-built evaluation with averaged playouts and a
bandit rule for where to expand: it needs no evaluation function and is anytime,
but it is statistical rather than exact and can be slow to notice a narrow
tactical refutation. Both combine with **learned evaluation** — chess engines
pair alpha-beta with a trained network, AlphaZero pairs a network with MCTS.

## History and attribution

Von Neumann and Morgenstern's _Theory of Games and Economic Behavior_ (1944)
sets out the game-tree formulation of zero-sum play; von Neumann's minimax
theorem for mixed strategies is earlier and, as noted above, a different result.
Claude Shannon's 1950 paper on programming a computer for chess gave the
algorithm the shape it still has: fixed-depth minimax with a hand-built
evaluation at the cut-off.

Alpha-beta has several independent origins in the late 1950s and early 1960s,
reached separately by groups working on chess and checkers programs, and was
used for years before anyone analysed it; Knuth and Moore's 1975 paper settled
its correctness and best-case node count. The modern turn is its displacement by
sampling in Go, and its partial return alongside learned evaluation.

## Sources

_Artificial Intelligence: A Modern Approach_ carries essentially this whole
page: the recursion, the worked three-child example, alpha-beta and its
complexity, the game model's assumptions, the failure modes of depth-limited
search, and the historical notes. _A Survey of Monte Carlo Tree Search Methods_
covers the alternative and why Go defeats exhaustive backup; the AlphaZero
preprint is the source for the node-throughput comparison against a strong
alpha-beta engine.

## Prerequisites and next connections

Start with [Dynamic Programming](./dynamic-programming.md) if backward induction
is unfamiliar — the same recursion, with an expectation where minimax has an
adversary's minimum. [Complexity Analysis](./complexity-analysis.md) makes $b^d$
against $b^{d/2}$ mean something, and
[Graph Algorithms](./graph-algorithms.md) covers the depth-first traversal
underneath the implementation.

From here, [Markov Decision Processes](./markov-decision-processes.md) is the
single-agent stochastic analogue,
[Multi-Agent Reinforcement Learning](./multi-agent-reinforcement-learning.md)
is where the minimax backup returns as a learning rule for zero-sum Markov
games, and [Monte Carlo Methods](./monte-carlo-methods.md) is the sampling that
tree search substitutes for exhaustive backup. The companion pages on
adversarial search and Monte Carlo tree search go further into each.
