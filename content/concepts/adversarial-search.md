---
concept_id: concept.search.adversarial_search
title: Adversarial Search
slug: /concepts/adversarial-search
kind: concept
tier: 1
review_state: generated-draft
summary: Search in a world where another agent chooses some of the moves, so the answer is never a path but a strategy that must survive whatever the opponent does next.
categories:
  - Artificial Intelligence/Symbolic AI/Search
primary_category: Artificial Intelligence/Symbolic AI/Search
relationships:
  - type: requires
    target: concept.search.uninformed_search
    note: The game tree is a search tree, and the vocabulary of node expansion, branching factor, depth and frontier is assumed rather than re-derived here.
  - type: contributes_to
    target: concept.search.minimax
    note: The game tree, the zero-sum condition and the depth cutoff defined on this page are exactly the objects minimax's backup rule and its optimality claim are stated over.
  - type: refined_by
    target: concept.search.monte_carlo_tree_search
    note: MCTS keeps the game-tree formulation but drops the hand-written evaluation function and the uniform depth limit, which is what made Go tractable when classical depth-limited search stalled.
  - type: contrasts_with
    target: concept.reinforcement_learning.markov_decision_processes
    note: An MDP faces a fixed stochastic environment whose transition kernel does not react, whereas here a second optimising agent picks alternate plies, and a chance node is where the two formalisms meet.
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
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.silver2016.alphago
    title: Mastering the game of Go with deep neural networks and tree search
    url: https://www.nature.com/articles/nature16961
    source_kind: primary-research
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: Counterfactual regret minimisation and the modern poker agents
    reason: The registry has no paper or survey on CFR, Libratus or DeepStack, so the claim that large imperfect-information games are now solved by regret minimisation rather than by game-tree search is stated without a citation that covers it.
    sections:
      - variants-and-alternatives
  - label: Minimax search pathology
    reason: The artificial-game results showing that deeper search can degrade decision quality are not covered by any registry source, so the remark is flagged rather than attributed.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Adversarial search** is search over a state space in which the agent controls
only some of the transitions and another agent, with opposing preferences,
controls the rest. The object searched is a **game tree**: nodes are positions,
each node is labelled with whose turn it is, edges are legal moves, and leaves
carry a utility for the searching player. The canonical setting is a two-player,
zero-sum, perfect-information, deterministic, finite game — chess, checkers, Go,
tic-tac-toe — and the output is not a sequence of moves but a **strategy**: a
choice of move at every position the opponent could steer you into.

## Why it matters

In ordinary path-finding, a plan is a promise: execute the found sequence and you
arrive. In a game that promise is void after one ply, because the second move is
not yours. Adversarial search is the formulation that makes the problem
well-posed again — it replaces "find a cheap path" with "find a move whose worst
case, over all opponent replies, is best", and that reframing is what lets you
say anything guaranteed about a decision in a contested environment.

It also matters because the resulting trees are hopeless to enumerate. Chess has
a branching factor around $35$ and games run past $80$ plies; Go is far worse.
Every practical technique here — depth cutoffs, evaluation functions, pruning,
sampling — exists because the exact answer is unreachable, and each one trades a
guarantee for a decision you can actually make in the time available.

## Intuition

Picture the ordinary search tree, then alternately paint the levels: on your
levels you get to pick the best child, on the opponent's levels you must assume
the worst child is picked. Value flows up from the leaves through this
alternation, and the number that reaches the root is what the position is worth
against perfect play.

The useful mental image for the practical version is a _fog line_ drawn across
the tree at some depth. Above the line you reason exactly; below it you cannot
see, so you guess the value of the boundary positions with a static evaluation
function. Almost everything that goes wrong in real game programs is something
happening just below that line.

The analogy breaks in one important place: the opponent is not the environment
being pessimistic. Worst-case reasoning assumes a _rational_ adversary, and a
rational adversary is a different object from an unlucky draw — it will exploit a
weakness you leave, but it will also decline a trap you set, which nature would
happily walk into.

## Concrete example

A depth-2 tree. The root is yours (MAX), its three children $A$, $B$, $C$ are the
opponent's (MIN), and each has three leaves:

$$
A: (3,\ 12,\ 8) \qquad B: (2,\ 4,\ 6) \qquad C: (14,\ 5,\ 2)
$$

The opponent minimises, so $A$ is worth $3$, $B$ is worth $2$, $C$ is worth $2$.
You maximise, so the root is worth $3$ and the move is $A$. Note that $C$
contains the best leaf in the tree, $14$, and is still a bad move: leaves are not
reachable unilaterally.

Now impose a cutoff at depth $1$ and score the three children with a material
count that happens to give $\mathrm{Eval}(A)=5$, $\mathrm{Eval}(B)=9$,
$\mathrm{Eval}(C)=11$. The shallow search plays $C$ — worth $2$ — because the
refutation of $C$ lies one ply below its horizon. That is the whole failure mode
in three numbers.

In chess the same failure has a name. A program that is losing a rook four plies
ahead can play a sequence of pointless checks or pawn sacrifices that push the
capture past its search depth; the leaf evaluations then no longer contain the
lost rook, so the program scores the delaying line above the honest one and
throws away material to postpone a loss it cannot avoid. This is the **horizon
effect**, and it is not a bug in the evaluation function — it is what a truncated
search does when the truncation point is itself a choice the search can move.

## Formal treatment

A two-player game is the tuple
$\langle S, s_0, \mathrm{Player}, \mathrm{Actions}, \mathrm{Result},
\mathrm{Terminal}, u \rangle$: states $S$, initial state $s_0$,
$\mathrm{Player}(s)$ giving whose turn it is, legal moves
$\mathrm{Actions}(s)$, a transition $\mathrm{Result}(s,a)$, a terminal test, and
a utility $u(s)$ at terminals from MAX's point of view. **Zero-sum** means
$u_{\text{MAX}}(s) + u_{\text{MIN}}(s) = 0$ at every terminal (constant-sum is
equivalent after an affine shift). The value of a state is

$$
V(s) =
\begin{cases}
u(s) & \text{$s$ terminal},\\[2pt]
\max_{a \in \mathrm{Actions}(s)} V(\mathrm{Result}(s,a)) & \mathrm{Player}(s)=\text{MAX},\\[2pt]
\min_{a \in \mathrm{Actions}(s)} V(\mathrm{Result}(s,a)) & \mathrm{Player}(s)=\text{MIN}.
\end{cases}
$$

This recursion is the specification; minimax is the depth-first algorithm that
computes it, in $O(b^m)$ time for branching factor $b$ and depth $m$, and
alpha-beta pruning computes the same value while visiting $O(b^{m/2})$ nodes
under a perfect move ordering — a doubling of reachable depth at no cost in the
answer.

Because $b^m$ is astronomical, practice replaces $V$ with a **depth-limited**
value: cut off at depth $d$ and substitute a static evaluation
$\mathrm{Eval}(s)$, typically a weighted feature sum
$\mathrm{Eval}(s) = \sum_i w_i f_i(s)$ (material, mobility, king safety). Two
properties are wanted of $\mathrm{Eval}$: it should agree with $u$ on terminals,
and it should order non-terminal positions by their expected true value.

**Quiescence search** is the standard mitigation for the horizon effect. Rather
than cutting off at a fixed $d$, the search applies $\mathrm{Eval}$ only at
_quiescent_ positions — ones with no pending captures, checks or other violent tactics — and
extends the search along forcing moves until it reaches one. The cutoff depth
becomes data-dependent, so the leaf where the evaluation is trusted is a leaf
where the evaluation is meaningful.

Dropping assumptions changes the recursion rather than breaking the idea. With
stochastic events, add **chance nodes** whose value is an expectation,
$V(s) = \sum_{r} P(r)\, V(\mathrm{Result}(s,r))$, giving expectiminimax; the
evaluation function must now be a genuine expected utility, since a merely
order-preserving rescaling of the leaf values can change the argmax — only a
positive affine transformation leaves the choice intact. With more than
two players, utilities become a vector and each node maximises its own component,
which is well defined but has no single game value and admits alliances. With
imperfect information, nodes group into information sets, the searching player
cannot know which node it is at, and optimal play may require randomisation, so
the deterministic strategy the recursion returns is no longer enough.

## Assumptions and requirements

The clean theory needs all of: exactly two players; strictly opposed (zero-sum)
utilities; perfect information, so both players see the whole state; determinism;
finiteness or at least a terminal test that fires; and alternating turns. Drop
zero-sum and "the worst case for me" stops being "the best case for you", so a
single backed-up number cannot represent the position. Drop perfect information
and the tree does not even have well-defined nodes for the searcher to be at.
Drop two players and the value becomes a vector.

The practical machinery adds assumptions of its own. Alpha-beta's speedup is
conditional on move ordering and degrades toward $O(b^m)$ when the ordering is
adversarial. Evaluation functions assume the features that predict the outcome
are cheap to compute and roughly additive, which is why they worked for chess
material and failed for Go, where no comparable local statistic tracks the
result. Iterative deepening with a transposition table assumes positions repeat
often enough to be worth caching.

## Uses and applicability

Reach for adversarial search when the opposition is real and modelled: board and
card games, security games where an attacker responds to your defence, and any
setting where you must certify a decision against a worst case rather than an
average case. It is also the right frame for self-play training loops, where the
search acts as a policy-improvement operator over a learned evaluator — the
structure behind AlphaGo's combination of a value network with tree search.

Do not reach for it when the environment does not react. Weather, hardware
failure and customer demand are chance, not malice; modelling them adversarially
produces paralysed, worst-case-obsessed behaviour and an MDP or a bandit
formulation is the honest model. It is likewise a poor fit when the opponent is
known to be weak or predictable, since worst-case play forgoes the exploitation
that a model of the actual opponent would buy.

## Limitations and common mistakes

The first confusion is terminological: in machine learning "adversarial" usually
means adversarial _examples_, a perturbation attack on a classifier. That is a
different literature. This page is about search against a move-choosing agent.

The second is believing the backed-up number is the position's worth. It is the
worth _against an optimal opponent_. Against a fallible one, the minimax move can
be strictly worse than a riskier move that sets a trap, because the recursion
gives no credit for lines the opponent might miss.

The third is trusting the evaluation function's scale. Values from a depth-limited
search are ordinal proxies calibrated by tuning, not utilities; comparing scores
from searches at different depths, or averaging them, is not supported by
anything in the formalism. Related: a deeper search is usually but not
universally better — artificial game models exist in which decision quality
degrades with depth, an effect known as search pathology.

Finally, quiescence search mitigates the horizon effect; it does not remove it.
Any fixed notion of "quiet" leaves some slow strategic loss that can still be
pushed past the boundary, and an over-eager extension rule blows up the node count
it was meant to control.

## Variants and alternatives

Within classical game-tree search: **alpha-beta** with move ordering, **iterative
deepening**, **transposition tables**, **aspiration windows** and **null-move
pruning** are the standard engineering stack, each trading a little exactness or
generality for depth. **Expectiminimax** handles chance nodes. **Max-n** handles
more than two players.

The genuinely different approach is **Monte Carlo tree search**, which estimates
node values by sampled playouts and grows the tree asymmetrically toward
promising lines, needing no evaluation function at all. It changed which games
were tractable — Go above all — and it is now most often used with a learned
policy and value network rather than random playouts. For imperfect-information
games the dominant modern methods are not tree search at all but regret
minimisation over information sets, a line of work this corpus does not yet cover
and which the sources here do not support.

## History and attribution

The idea has clear early foundations: Zermelo's 1913 analysis of chess
established that such games have a determinate value, and von Neumann's minimax
theorem of 1928 gave the general two-player zero-sum result. The computational
form is due to Shannon, whose 1950 paper on chess programming laid out the game
tree, the static evaluation function, the depth cutoff and the observation that
evaluation should be applied only to quiescent positions. Samuel's checkers
program of the late 1950s added learned evaluation weights. Alpha-beta pruning
emerged in the late 1950s and 1960s from several groups roughly independently and
was analysed rigorously later. The horizon effect was identified and named in the
chess-programming work of the early 1970s, with Berliner's analysis the usual
citation. Deep Blue's 1997 match win over Kasparov was the high-water mark of the
handcrafted-evaluation-plus-deep-search approach. Monte Carlo tree search arrived
in 2006 and reshaped computer Go, and AlphaGo's 2016 result combined it with
neural value and policy networks.

## Sources

Russell and Norvig's _Artificial Intelligence: A Modern Approach_ is the primary
reference here: its games chapter contains the formulation, the minimax
recursion, alpha-beta, evaluation functions, cutoffs, the horizon effect and
quiescence, stochastic and partially observable games, and the historical notes.
Browne et al.'s survey is the reference for Monte Carlo tree search as a family
and for why it displaced classical search in Go. The AlphaGo paper documents the
combination of tree search with learned value and policy networks.

## Prerequisites and next connections

Read a plain search page first — [Searching](./searching.md) for the basic
tree-and-frontier vocabulary — since the game tree is an ordinary search tree with
turn labels. Nothing beyond elementary probability is needed for the chance-node
material.

Next: minimax gives the exact algorithm and its pruning, and Monte Carlo tree
search gives the sampling alternative; both are separate pages in this corpus.
[Markov Decision Processes](./markov-decision-processes.md) is the right contrast
for the non-adversarial case, [Multi-Agent Reinforcement Learning](./multi-agent-reinforcement-learning.md)
is where the more-than-two-players and non-zero-sum cases are taken seriously, and
[Multi-Armed Bandits](./multi-armed-bandits.md) supplies the selection rule that
Monte Carlo tree search uses at every node.
