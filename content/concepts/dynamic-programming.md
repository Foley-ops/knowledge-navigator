---
concept_id: concept.reinforcement_learning.dynamic_programming
title: Dynamic Programming
slug: /concepts/dynamic-programming
kind: method
tier: 1
review_state: generated-draft
summary: Given a complete model of a Markov decision process, dynamic programming computes exact optimal values and policies by iterating the Bellman operators, which the discount factor makes contractions in the sup norm.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: Every operator, value function and convergence claim here is stated over a finite MDP, and the transition kernel and reward function are the inputs the algorithms consume.
  - type: prerequisite_of
    target: concept.reinforcement_learning.temporal_difference_learning
    note: The TD update is the DP backup with the expectation over next states replaced by a single sampled transition, so its form is unreadable before the backup it samples.
  - type: contrasts_with
    target: concept.reinforcement_learning.monte_carlo_methods
    note: Monte Carlo estimates the same value functions from complete sampled returns with no model and no bootstrapping, which is the exact complement of DP's model-based, one-step, full-width backups.
  - type: contributes_to
    target: concept.reinforcement_learning.q_learning
    note: Q-learning is value iteration on action values with sampled transitions, and its convergence proof is the stochastic-approximation version of the contraction argument given here.
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
      - concrete-example
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.probabilistic_systems
    title: MIT 6.041 Probabilistic Systems Analysis and Applied Probability (Fall 2010)
    url: https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Dynamic programming** is the family of algorithms — iterative policy
evaluation, policy iteration and value iteration — that solve a finite Markov
decision process by sweeping the Bellman operators over a table with one entry
per state, using a transition kernel and reward function that are known in
advance. Each is a fixed-point computation: the value function being sought is
the unique solution of a Bellman equation, and the algorithm reaches it by
applying the corresponding operator over and over.

The same words name an algorithm-design paradigm: solve each overlapping
subproblem once, cache the answer. The two senses share an ancestor and a
principle but not an object, and the difference is spelled out below.

## Why it matters

Dynamic programming is the one place in reinforcement learning where _optimal_
means computed rather than approached. On a problem small enough to tabulate it
returns an exactly optimal policy, with a convergence rate you can write down in
advance. That makes it both a working solver for operations-research problems —
inventory control, equipment replacement, optimal stopping — and the reference
answer a learning algorithm is debugged against: if Q-learning on a ten-state
chain does not approach the value-iteration solution, the bug is in the learner.

It also marks the boundary of the field. Dynamic programming needs
$p(s', r \mid s, a)$ in hand; reinforcement learning is what you do when you do
not have it, and nearly every method downstream is a DP backup with the
unavailable expectation replaced by something sampled or learned.

## Intuition

Carry two pictures. The first is error contraction. A backup takes the true
immediate reward and discounts everything it believes about the future by
$\gamma$, so any error in the current table reaches the next one shrunk by
$\gamma$: sweep repeatedly and the error dies geometrically from any starting
guess, with nothing to tune. The discount is not just a statement about how much
the future matters; it is the rate at which wrong beliefs decay.

The second is two processes circling each other. Evaluation drags the values
into agreement with the current policy; improvement makes the policy greedy with
respect to the current values. Each breaks what the other just achieved, and
they stop only where both hold at once, which is optimality — Sutton and Barto's
generalised policy iteration. The analogy to alternating optimisation breaks in
one place: nothing descends a joint objective, and the guarantee comes from the
policy improvement theorem and the finiteness of the policy set, not convexity.

## Concrete example

A machine is `working` or `broken`, $\gamma = 0.9$. In `working` you may `run`
(reward $10$, stays working with probability $0.8$, breaks with probability
$0.2$) or `service` (reward $4$, stays working surely). In `broken` the only
action is `repair` (reward $0$, returns to working surely).

**Value iteration** from $v_0 = (0, 0)$, writing $(v(\text{working}),
v(\text{broken}))$:

| sweep | $v_k$               | greedy action in `working` |
| ----- | ------------------- | -------------------------- |
| 1     | $(10,\ 0)$          | run                        |
| 2     | $(17.2,\ 9)$        | run                        |
| 3     | $(24.004,\ 15.48)$  | run                        |
| 86    | $(84.736,\ 76.262)$ | run                        |

The fixed point is $v_* = (84.746, 76.271)$. After three sweeps the values are
still $60.8$ away from it, and the bound
$\gamma^3 \lVert v_0 - v_* \rVert_\infty = 61.8$ is almost tight — yet the
greedy policy has been optimal since sweep one. Reaching
$\lVert v_k - v_* \rVert_\infty < 0.01$ takes 86 sweeps.

**Policy iteration** on the same problem finishes in two. Start from
$\pi_0 = (\text{service}, \text{repair})$. Solving the linear system gives
$v_{\pi_0} = (40, 36)$. Improvement compares
$q_{\pi_0}(\text{working}, \text{run}) = 10 + 0.9(0.8 \cdot 40 + 0.2 \cdot 36) =
45.28$ against $q_{\pi_0}(\text{working}, \text{service}) = 4 + 0.9 \cdot 40 =
40$, so $\pi_1 = (\text{run}, \text{repair})$. Evaluating $\pi_1$ gives $v_*$,
improvement changes nothing, and the algorithm stops with a certificate rather
than a tolerance.

```python
S, A = ["working", "broken"], {"working": ["run", "service"], "broken": ["repair"]}
R = {("working", "run"): 10.0, ("working", "service"): 4.0, ("broken", "repair"): 0.0}
P = {("working", "run"): {"working": 0.8, "broken": 0.2},
     ("working", "service"): {"working": 1.0},
     ("broken", "repair"): {"working": 1.0}}
gamma, v = 0.9, {s: 0.0 for s in S}

def backup(v, s, a):
    return R[(s, a)] + gamma * sum(p * v[s2] for s2, p in P[(s, a)].items())

while True:                                   # value iteration with a Bellman-error stop
    nv = {s: max(backup(v, s, a) for a in A[s]) for s in S}
    delta = max(abs(nv[s] - v[s]) for s in S)
    v = nv
    if delta < 0.01 * (1 - gamma) / gamma:
        break
print(v, {s: max(A[s], key=lambda a: backup(v, s, a)) for s in S})
```

## Formal treatment

Work in a finite MDP $(\mathcal{S}, \mathcal{A}, p, \gamma)$ with kernel
$p(s', r \mid s, a)$, bounded rewards, and $\gamma \in [0,1)$. Value functions
live in $\mathbb{R}^{|\mathcal{S}|}$ under the sup norm
$\lVert u \rVert_\infty = \max_s |u(s)|$. Define the Bellman expectation
operator for a policy $\pi$ and the Bellman optimality operator:

$$
(T_\pi v)(s) = \sum_a \pi(a \mid s) \sum_{s', r} p(s', r \mid s, a)\big[r + \gamma v(s')\big],
$$

$$
(T_* v)(s) = \max_a \sum_{s', r} p(s', r \mid s, a)\big[r + \gamma v(s')\big].
$$

**Both are $\gamma$-contractions in the sup norm.** For $T_*$, fix $s$ and write
$f(a), g(a)$ for the bracketed expectations under $u$ and $v$. Since
$|\max_a f(a) - \max_a g(a)| \le \max_a |f(a) - g(a)|$, and since averaging
under the probability distribution $p(\cdot \mid s,a)$ cannot exceed the largest
magnitude being averaged,

$$
\lVert T_* u - T_* v \rVert_\infty \;\le\; \gamma \lVert u - v \rVert_\infty .
$$

The modulus is exactly $\gamma$: nothing else in the backup expands anything,
and discounting is the only reason the inequality has a factor below one. Since
$\mathbb{R}^{|\mathcal{S}|}$ with the sup norm is complete, the Banach
fixed-point theorem gives a unique fixed point and geometric convergence from
any start:

$$
\lVert T_*^k v_0 - v_* \rVert_\infty \le \gamma^k \lVert v_0 - v_* \rVert_\infty .
$$

That is value iteration. The same argument on $T_\pi$ gives iterative policy
evaluation converging to $v_\pi$; because $T_\pi$ is affine, $v_\pi$ also solves
the linear system $(I - \gamma P_\pi) v_\pi = r_\pi$, where $P_\pi$ is the
state-to-state transition matrix induced by $\pi$ and $r_\pi(s)$ the expected
immediate reward. It is invertible because the row-stochastic $P_\pi$ has
spectral radius $1$, so $\gamma P_\pi$ has spectral radius $\gamma < 1$. A sweep
costs $O(|\mathcal{S}|^2 |\mathcal{A}|)$ for a dense kernel; the direct solve
costs $O(|\mathcal{S}|^3)$.

**Policy improvement theorem.** If $q_\pi(s, \pi'(s)) \ge v_\pi(s)$ for all $s$
then $v_{\pi'} \ge v_\pi$ pointwise, and strict inequality at some state carries
over. So making $\pi'$ greedy with respect to $v_\pi$ strictly improves $\pi$
unless $\pi$ was already greedy — in which case $v_\pi$ satisfies the Bellman
optimality equation and $\pi$ is optimal. Since there are at most
$|\mathcal{A}|^{|\mathcal{S}|}$ deterministic policies and each iteration
strictly improves, policy iteration terminates at an optimum in finitely many
steps.

Two stopping facts. If $\lVert v_{k+1} - v_k \rVert_\infty < \varepsilon(1-\gamma)/\gamma$
then $\lVert v_{k+1} - v_* \rVert_\infty < \varepsilon$; and if
$\lVert v - v_* \rVert_\infty \le \varepsilon$, the policy greedy with respect to
$v$ loses at most $2\gamma\varepsilon/(1-\gamma)$.

## Assumptions and requirements

The state is Markov and fully observed: the backup conditions only on $s$, so if
the true dynamics depend on history, the fixed point solves a different problem
than the one you have. The model and rewards are known exactly; an approximate
model gives the fixed point of the approximate operator, with the error
amplified by roughly $1/(1-\gamma)$.

The discount satisfies $\gamma < 1$. At $\gamma = 1$ the modulus is $1$, the
contraction argument collapses, and convergence must be recovered another way —
proper policies in stochastic shortest-path problems, or average-reward
formulations working in the span seminorm. Rewards must be bounded for the sup
norm to be finite; unbounded rewards need weighted sup norms. And the table must
fit: continuous or factored state spaces keep the contraction but lose the
sweep.

## Uses and applicability

Reach for it when the model is known and the states can be enumerated — hundreds
of thousands is comfortable, and sparse kernels push that further. Classic fits
are inventory and replacement problems, admission control, optimal stopping, and
any planning problem already written as an MDP. It is also the planning half of
model-based RL, where a learned model is handed to a DP-style solver.

Do not reach for it when the model is unavailable, when the state is an image or
a continuous vector, or when $|\mathcal{S}|$ grows exponentially in the number
of state variables — Bellman's own curse of dimensionality, and the condition
that produced sampling-based reinforcement learning.

## Limitations and common mistakes

The commonest error is calling dynamic programming a reinforcement learning
algorithm. It does no learning and takes no actions; it reads a model.

The second is expecting value iteration to terminate. It converges
asymptotically and stops on a tolerance; policy iteration is the one that
terminates exactly. Conversely, people wait for the values to converge before
trusting the policy — but as the example shows, the greedy policy is typically
optimal long before the values are close, because it depends only on the
ordering of the backed-up action values.

The third is believing sweeps must be synchronous. In-place updates that reuse
values from earlier in the same sweep are valid, often converge faster, and
generalise to asynchronous DP, which converges provided every state keeps being
updated. What is _not_ safe is dropping states permanently.

The fourth is assuming the contraction survives function approximation. $T_*$
contracts in the sup norm and a projection onto a linear class is nonexpansive
in a weighted $L_2$ norm, but the composition need not contract in either, and
off-policy value iteration with linear approximation can diverge. This deadly
triad — bootstrapping, function approximation, off-policy updates — is a real
failure, not slack in the analysis.

Finally, $\gamma$ is not free: iterations to a fixed accuracy scale like
$1/(1-\gamma)$, and the policy-loss bound degrades by the same factor.

## Variants and alternatives

**Modified (optimistic) policy iteration** runs a few evaluation sweeps instead
of solving exactly; value iteration (one sweep) and policy iteration (solve to
convergence) are its endpoints, and the middle is usually fastest. **Asynchronous
DP** updates states one at a time in any order — Gauss-Seidel, prioritised
sweeping, real-time DP along visited trajectories — which concentrates effort
where it matters. An MDP can also be solved as a **linear program**, slower in
practice but making constraints and duality available.

Giving up the model leads to Monte Carlo methods, temporal-difference learning
and Q-learning; giving up the table leads to approximate DP and fitted value
iteration; giving up the value fixed point leads to policy gradients. Monte
Carlo tree search keeps the model but refuses to sweep every state.

The **algorithmic** sense — memoised recursion over overlapping subproblems —
shares Bellman's principle of optimality, and finite-horizon DP is literally
backward induction over $t$. The difference is the dependency graph: algorithmic
DP usually has an acyclic one, so a single pass in topological order suffices,
whereas the values of an infinite-horizon MDP depend on each other cyclically
and must be iterated to a fixed point. Bellman-Ford sits on the seam.

## History and attribution

Richard Bellman introduced dynamic programming at RAND in the 1950s while
working on multistage decision processes; both the principle of optimality and
the name are his, set out at book length in his 1957 _Dynamic Programming_, and
he also coined "curse of dimensionality" for the obstacle that motivates
everything approximate. Value iteration appears in essentially modern form in
Lloyd Shapley's 1953 work on stochastic games, independently of Bellman's line. Ronald Howard's 1960 _Dynamic
Programming and Markov Processes_ introduced policy iteration. The
contraction-mapping treatment belongs to the operations-research literature of
the 1960s, and the analysis of asynchronous and distributed variants to that of
the 1980s, notably Bertsekas and Tsitsiklis.

## Sources

Sutton and Barto's chapter on dynamic programming is the closest match to this
page: the three algorithms, worked numerical examples, generalised policy
iteration, asynchronous DP, and notes crediting Bellman and Howard; their later
chapters lay out the deadly triad. Russell and Norvig give the contraction
argument for the Bellman update in max norm, the error and policy-loss bounds, a
worked grid world, and the modified-policy-iteration and linear-programming
alternatives. MIT 6.006 covers the algorithm-design sense — subproblem graphs,
memoisation, Bellman-Ford. MIT 6.041 covers the Markov chain machinery
underneath the MDP, without the control part.

## Prerequisites and next connections

Read Markov decision processes first; states, actions, the transition kernel,
returns and discounting are the vocabulary of every equation here. The
convergence argument is the Banach fixed-point theorem in a finite-dimensional
space, so [Banach Spaces](./banach-spaces.md) shows what completeness is doing,
and [Stochastic Processes](./stochastic-processes.md) covers the Markov chain a
fixed policy induces.

Next come the methods that drop the model: Monte Carlo entirely,
temporal-difference learning by sampling the expectation while keeping the
bootstrapped backup, Q-learning by doing this page's value iteration from
experience. For the other meaning of the term,
[Graph Algorithms](./graph-algorithms.md) has Bellman-Ford and
[Complexity Analysis](./complexity-analysis.md) the accounting that makes
memoisation pay.
