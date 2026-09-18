---
concept_id: concept.reinforcement_learning.temporal_difference_learning
title: Temporal-Difference Learning
slug: /concepts/temporal-difference-learning
aliases:
  - 'TD learning'
  - 'TD(lambda)'
kind: method
tier: 1
review_state: generated-draft
summary: A family of value-estimation methods that corrects each prediction towards the next one — a sampled reward plus the current estimate of what follows — so an agent can learn online, without a model and without waiting for an episode to end.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The value function TD estimates, the Bellman equation its target approximates, and the Markov property its correctness rests on are all defined by the MDP formalism.
  - type: contrasts_with
    target: concept.reinforcement_learning.monte_carlo_methods
    note: Monte Carlo waits for the realised return and is unbiased with high variance; TD substitutes its own estimate for the tail and trades bias for variance in the other direction.
  - type: contrasts_with
    target: concept.reinforcement_learning.dynamic_programming
    note: Dynamic programming also bootstraps but sweeps the exact expectation from a known model, where TD samples one transition and needs no model.
  - type: prerequisite_of
    target: concept.reinforcement_learning.q_learning
    note: Q-learning is the off-policy control form of the TD update, so its target, its error term and its convergence conditions are unreadable without TD first.
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
  - source_id: source.mnih2015.human_level_control
    title: Human-level control through deep reinforcement learning
    url: https://www.nature.com/articles/nature14236
    source_kind: primary-research
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mnih2016.a3c
    title: Asynchronous Methods for Deep Reinforcement Learning
    url: https://arxiv.org/abs/1602.01783
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Temporal-difference learning** estimates the value function of a policy by moving each
state's prediction towards a target assembled from one observed transition plus the
learner's own current prediction of everything after it. On observing $S_t$, reward
$R_{t+1}$ and successor $S_{t+1}$, the tabular TD(0) update is

$$
V(S_t) \;\leftarrow\; V(S_t) \;+\; \alpha \bigl[\, R_{t+1} + \gamma V(S_{t+1}) - V(S_t) \,\bigr],
$$

with step size $\alpha \in (0,1]$ and discount $\gamma \in [0,1]$. The bracketed quantity
is the **TD error**

$$
\delta_t \;=\; R_{t+1} + \gamma V(S_{t+1}) - V(S_t),
$$

the difference between two consecutive predictions of the same quantity, one of which has
seen a real reward. The defining move is **bootstrapping**: the target contains
$V(S_{t+1})$, an estimate, rather than the return $G_t$ the episode eventually produced.

## Why it matters

Sampling and bootstrapping together buy three things at once. The update needs only $(S_t, R_{t+1}, S_{t+1})$,
so learning is **online and incremental**: no waiting for an episode to end, and continuing
tasks with no episode boundary become learnable. It needs no transition model, so it
applies where dynamic programming cannot. And a target built from one transition has far
less variance than the realised return.

That is why TD sits underneath nearly every model-free algorithm: SARSA and Q-learning are
TD updates on action values, the critic in actor-critic is a TD-trained value function, and
the advantage estimates that reduce policy-gradient variance are built from TD errors.

## Intuition

Picture predicting your arrival time on a drive. Monte Carlo waits until you pull into the
driveway, then revises every guess you made against the one true number. TD revises each
guess the moment the next guess exists: you leave the motorway twenty minutes late, the new
estimate jumps, and the old one is corrected towards it at once — before anyone knows the
truth.

The analogy breaks somewhere important. The driver eventually sees the truth; a TD learner
compares guesses to guesses forever. Reality enters only through the rewards and through
terminal states, where the bootstrapped value is zero by definition. Remove those anchors
and nothing in the update objects to every state holding the same value.

## Concrete example

Take the five-state random walk: states $A,B,C,D,E$ in a row, start at $C$, each step going
left or right with probability $1/2$ and terminating off either end. Reward is $1$ for
terminating on the right and $0$ elsewhere, $\gamma = 1$, true values
$v_\pi = (1/6, 2/6, 3/6, 4/6, 5/6)$. Initialise every $V(s) = 0.5$, set $\alpha = 0.1$, and
run one episode: $C \to B \to C \to D \to E \to$ right terminal, reward $1$.

Every internal transition has $\delta_t = 0 + 1 \cdot 0.5 - 0.5 = 0$, so TD(0) changes
nothing for $C$, $B$, $C$ or $D$. Only the last transition has a non-zero error,
$\delta = 1 + 1 \cdot 0 - 0.5 = 0.5$, giving $V(E) \leftarrow 0.5 + 0.1 \times 0.5 = 0.55$.

Monte Carlo on the same episode sees return $G = 1$ from every visited state and moves
$B$, $C$, $D$ and $E$ to $0.55$ at once. TD moved one state; MC moved four — and TD is not
slower for it, because on the next episode a transition into $E$ carries a non-zero error
and pushes the information back to $D$. Empirically TD(0) reaches a given error here in
fewer episodes than constant-$\alpha$ MC.

## Formal treatment

Let $v_\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]$ with $G_t = \sum_{k \ge 0} \gamma^k R_{t+k+1}$.
The Bellman expectation equation says
$v_\pi(s) = \mathbb{E}_\pi[R_{t+1} + \gamma v_\pi(S_{t+1}) \mid S_t = s]$, and TD(0) is
Robbins–Monro stochastic approximation applied to it: the TD target is an unbiased sample
of $(T^\pi V)(s)$, the Bellman operator applied to the _current_ $V$, not of $v_\pi(s)$.

This locates TD exactly. The MC target $G_t$ is unbiased for $v_\pi(S_t)$, with variance
growing in the number of rewards left in the episode; the DP target
$\sum_{a} \pi(a \mid s) \sum_{s',r} p(s',r \mid s, a)[r + \gamma V(s')]$ has no sampling
variance but needs $p$; the TD target is biased whenever $V \neq v_\pi$ and carries the variance of one
transition. Sampling replaces the model; bootstrapping replaces the return.

**n-step returns** interpolate:

$$
G_{t:t+n} \;=\; R_{t+1} + \gamma R_{t+2} + \cdots + \gamma^{n-1} R_{t+n} + \gamma^{n} V(S_{t+n}),
$$

truncated to $G_t$ when $t+n \ge T$. Here $n=1$ is TD(0) and $n \to \infty$ is Monte Carlo,
with bias falling and variance rising in $n$. **TD($\lambda$)** averages all of them
geometrically,

$$
G_t^{\lambda} \;=\; (1-\lambda)\sum_{n=1}^{\infty} \lambda^{n-1} G_{t:t+n},
\qquad \lambda \in [0,1],
$$

and is implemented without waiting for the future by **eligibility traces**; for parametric
$\hat v(s, \mathbf{w})$ the accumulating-trace form is

$$
\mathbf{z}_t = \gamma\lambda \mathbf{z}_{t-1} + \nabla \hat v(S_t, \mathbf{w}_t),
\qquad
\mathbf{w}_{t+1} = \mathbf{w}_t + \alpha \delta_t \mathbf{z}_t ,
$$

with $\mathbf{z}_{-1} = \mathbf{0}$: one TD error updates every recently visited state in
proportion to how recently it was visited. This backward view and the forward
$\lambda$-return view coincide exactly only offline.

Tabular TD(0) converges with probability one to $v_\pi$ under the Robbins–Monro conditions
$\sum_t \alpha_t = \infty$, $\sum_t \alpha_t^2 < \infty$. Under **linear** approximation
with **on-policy** sampling it converges to a fixed point $\mathbf{w}_{\mathrm{TD}}$ whose
mean-square value error obeys

$$
\overline{VE}(\mathbf{w}_{\mathrm{TD}}) \;\le\; \frac{1}{1-\gamma}\,\min_{\mathbf{w}} \overline{VE}(\mathbf{w}),
$$

— within a factor of the best the feature space allows that blows up as $\gamma \to 1$. On
a fixed batch, TD(0) run to convergence returns the value function of the
maximum-likelihood MDP fitted to that batch (certainty equivalence) while MC returns the
least-squares fit to the observed returns: different answers on the same data.

## Assumptions and requirements

The Markov property does real work. Bootstrapping treats $V(S_{t+1})$ as a sufficient
summary of the future; under partial observability it is not, and that error does not
merely add noise — it is fed back into the next target.

Convergence needs stationary dynamics and a step size that decays but not too fast. The
linear bound above additionally needs states weighted by the **on-policy** distribution: it
is a statement about training on data the evaluated policy generated. Off-policy TD needs
either importance-sampling corrections, whose variance can be unbounded when the two
policies diverge, or a method built to tolerate the mismatch. Offline RL makes this acute:
the target is queried at actions a fixed dataset never contains, and those errors accumulate
through the backup. Nonlinear approximation voids the guarantee outright.

## Uses and applicability

Reach for TD when the task is continuing or the episodes are long, when no model is
available, when updates must happen mid-episode, or when a low-variance critic matters more
than an unbiased one. Small n-step targets are routine in deep RL: A3C uses n-step returns
for the bias-variance reason, DQN the one-step target with a frozen copy of the network
supplying $V(S_{t+1})$.

Prefer Monte Carlo when episodes are short, when the state signal is clearly non-Markov, or
when unbiasedness is the point. Prefer dynamic programming when the model is known and the
state space is small enough to sweep: no reason to sample an expectation you can compute.

## Limitations and common mistakes

The headline failure is the **deadly triad**: bootstrapping, function approximation and
off-policy training. Drop any one of the three and instability can be avoided; all three
together can diverge. The standard
demonstration is **Baird's counterexample**, a small episodic MDP with an over-complete
linear feature set in which off-policy TD(0) — pure prediction, fixed target policy, no
control — sends the weights to infinity. That is a property of the update, not bad luck.

Deep RL lives inside the triad and manages it empirically. Target networks and experience
replay in DQN make training stable enough to work on particular benchmarks; they do not
convert the triad into a convergence theorem, and reading an Atari result as a guarantee is
a mistake.

One narrower misconception: the TD update is _not_ gradient descent on any objective. The
target depends on $\mathbf{w}$ and that dependence is ignored — hence **semi-gradient**.
The gradient-based alternative, residual gradient, converges but optimises a worse
criterion and needs two independent samples of the successor state.

## Variants and alternatives

**TD(0)**, **n-step TD** and **TD($\lambda$)** form the bias-variance dial; **true online
TD($\lambda$)** matches the forward view exactly online for slightly more work per step. On
action values, **SARSA** is on-policy TD control, **Q-learning** its off-policy sibling with
a $\max$ in the target, and **Expected SARSA** replaces the sampled next action with its
expectation, removing that source of variance.

Against the triad, **gradient-TD** methods (GTD2, TDC) are provably convergent off-policy
under linear approximation, paying with a second parameter vector and slower learning, and
**emphatic TD** recovers stability by reweighting updates, at higher variance. **LSTD**
solves the linear TD fixed point in closed form — far more sample-efficient, at quadratic
or cubic cost in the feature dimension.

## History and attribution

Arthur Samuel's checkers program of 1959 already adjusted a board evaluation towards the
evaluation of a later position — a TD update in all but name — and Harry Klopf's work in the
1970s pushed Barto and Sutton towards prediction-driven rules. Richard Sutton's 1988 paper
introduced the TD($\lambda$) family under that name with the first convergence results for
the linear case; Chris Watkins's 1989 thesis added Q-learning, connecting TD to optimal
control. Gerald Tesauro's
TD-Gammon, of the early 1990s, trained a network by TD($\lambda$) through self-play to
world-class backgammon and made the method famous, and Leemon Baird published the
divergence counterexample in 1995. A separate strand is neuroscientific: phasic dopamine
firing was found in the mid-1990s to track a reward prediction error, giving the TD error a
biological correlate.

## Sources

**Sutton and Barto** covers essentially everything here: the update and the TD error, the
random-walk example, n-step returns and eligibility traces, the batch certainty-equivalence
result, the on-policy linear bound, the deadly triad with Baird's counterexample, and the
history. **Human-level control** is the canonical bootstrapped target trained off-policy
with replay and a neural network, **Asynchronous Methods** is n-step returns as a
bias-variance choice, and **Offline Reinforcement Learning** is bootstrapping under
distribution shift.

## Prerequisites and next connections

Understand Markov decision processes first: the value function, the Bellman equation and
the Markov property all come from there. A reader who knows
[Stochastic Processes](./stochastic-processes.md) will recognise the Markov chain
underneath, and [Stochastic Gradient Descent](./stochastic-gradient-descent.md) supplies
the stochastic-approximation intuition behind the step-size conditions. The trade-off
against Monte Carlo instantiates [Bias–Variance](./bias-variance.md), except that the bias
comes from the learner's own estimates rather than a restricted hypothesis class.

From here, Q-learning and SARSA apply the TD update to action values and turn prediction
into control, actor-critic uses a TD-trained critic to cut policy-gradient variance, and
DQN is the same target meeting a deep network.
