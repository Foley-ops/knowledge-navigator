---
concept_id: concept.reinforcement_learning.monte_carlo_methods
title: Monte Carlo Methods
slug: /concepts/monte-carlo-methods
aliases:
  - Monte Carlo prediction
  - Monte Carlo control
kind: method
tier: 1
review_state: generated-draft
summary: The model-free way to learn what a state is worth — run the episode to the end, average the returns you actually got, and accept high variance in exchange for no bootstrapping and no model.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The return, the policy and the value functions being estimated are defined by the MDP, so the quantity a Monte Carlo average converges to cannot be stated without it.
  - type: contrasts_with
    target: concept.reinforcement_learning.dynamic_programming
    note: Both compute value functions for the same MDP, but dynamic programming sweeps a known transition model and bootstraps from its own estimates, while Monte Carlo needs only sampled episodes and bootstraps from nothing.
  - type: contrasts_with
    target: concept.reinforcement_learning.temporal_difference_learning
    note: TD replaces the remainder of the episode with a current estimate, which buys online updates and lower variance at the cost of bias; Monte Carlo is the zero-bias, high-variance end of the same spectrum, and n-step returns interpolate between them.
  - type: contributes_to
    target: concept.reinforcement_learning.reinforce
    note: REINFORCE is the policy-gradient method whose gradient sample is exactly the complete sampled return defined here, which is why it inherits Monte Carlo's unbiasedness and its variance problem.
sources:
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
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
    checked_on: 2026-09-17
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.browne2012.mcts_survey
    title: A Survey of Monte Carlo Tree Search Methods
    url: https://ieeexplore.ieee.org/document/6145622
    source_kind: primary-research
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Finite-sample bias and variance theory of the self-normalized (weighted) importance-sampling estimator
    reason: The registry has no dedicated Monte Carlo statistics or simulation text, so the claims here are limited to what Sutton and Barto assert for the reinforcement-learning estimators and what MacKay covers for normalized importance weights; neither gives the finite-sample theory.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Monte Carlo methods** in reinforcement learning estimate value functions by
averaging complete sample returns from episodes of experience: no model of the
environment's dynamics, and no bootstrapping from other value estimates. For a
policy $\pi$ and an episode $S_0, A_0, R_1, S_1, \dots, S_T$ with terminal time
$T$, the return from step $t$ is

$$
G_t \;=\; \sum_{k=0}^{T-t-1} \gamma^{k} R_{t+k+1},
$$

and the estimate of $v_\pi(s)$ is the mean of the $G_t$ observed after visits to
$s$. Two structural consequences follow immediately and are worth naming before
anything else: the episode must **end** before a single update can be made, and
the estimate for one state is computed without reference to the estimate for any
other.

## Why it matters

Monte Carlo is what you can do when you have a simulator but not a model. The
rules of blackjack are trivial to simulate and unpleasant to write down as a
transition kernel over deck states; Monte Carlo needs only the former. It is also
the only value-estimation family that makes no use of the Markov property,
because it never asks "what is the successor state worth?" — it just adds up what
happened. That makes it the natural fallback under partial observability or
aggressive state aggregation, where bootstrapping methods estimate toward a
target that the state representation cannot support.

It is also the fixed point of the corpus's bias–variance discussion for value
estimation: the unbiased, high-variance end against which temporal-difference
learning's bias is measured, and the estimator that $n$-step returns and
$\lambda$-returns interpolate toward.

## Intuition

To learn what a position is worth, play it out to the end many times and average
the scores. That is the whole idea, and the coin-flipping analogy — the sample
mean of i.i.d. draws converges to the mean — is exactly right for one state under
a fixed policy.

The analogy breaks in three places, and each break is a real effect. A single
episode supplies returns for every state it visited, so estimates across states
are correlated. If a state appears twice in one episode, the two returns share a
tail and are not independent — this is where the every-visit estimator's bias
comes from. And in control, the returns in your average were generated by
policies you have since improved away from, so the samples are stale.

## Concrete example

Take one state $A$ with $\gamma = 1$: from $A$, with probability $1/2$ you
receive reward $1$ and return to $A$; with probability $1/2$ you receive $0$ and
terminate. Let $N$ be the number of loops, so $P(N = n) = (1/2)^{n+1}$ and
$\mathbb{E}[N] = 1$. Every reward is $1$ except the last, so $v(A) = 1$.

An episode with $N = n$ visits $A$ exactly $n+1$ times, and the return from the
$i$-th visit is $n - i$ for $i = 0, \dots, n$.

- **First visit:** the single return is $n$, so the estimator averages draws of
  $N$ and its expectation is $\mathbb{E}[N] = 1 = v(A)$. Unbiased.
- **Every visit:** the episode contributes $n+1$ returns summing to $n(n+1)/2$.
  From one episode the estimate is $n/2$, with expectation $\mathbb{E}[N]/2 =
  1/2$ — half the true value.

Over many episodes the every-visit estimate is the ratio of two averages and
converges to $\mathbb{E}[N(N+1)/2] \,/\, \mathbb{E}[N+1]$. Here
$\mathbb{E}[N^2] = 3$, so this is $2/2 = 1$: biased at small samples, correct in
the limit. Concretely, two episodes with $N = 1$ and $N = 0$ give a first-visit
estimate of $(1 + 0)/2 = 0.5$ and an every-visit estimate of $(1 + 0 + 0)/3
\approx 0.33$.

## Formal treatment

Let $\mathcal{T}(s)$ be the set of time steps at which $s$ was visited, across
all episodes, counting either only first visits per episode (**first-visit MC**)
or all of them (**every-visit MC**). Both estimators are
$V(s) = \frac{1}{|\mathcal{T}(s)|}\sum_{t \in \mathcal{T}(s)} G_t$, and both
converge to $v_\pi(s)$ as $|\mathcal{T}(s)| \to \infty$. Their finite-sample
behaviour differs: first-visit returns are i.i.d. draws with mean $v_\pi(s)$, so
the estimator is unbiased with standard error $\sigma/\sqrt{n}$, while every-visit
returns within an episode are dependent and the estimator is biased, its bias
vanishing asymptotically.

The incremental form, used when the policy is changing, is
$V(S_t) \leftarrow V(S_t) + \alpha\,[\,G_t - V(S_t)\,]$ with a constant
$\alpha$, which is an exponentially weighted average rather than a plain one.

For control you need action values $q_\pi(s,a)$, because improving a policy
greedily from $v_\pi$ alone requires a model. A deterministic policy never
generates data for the actions it does not take, so **exploring starts** assumes
every episode begins in a state–action pair chosen with nonzero probability for
all pairs.

Off-policy evaluation uses episodes from a behaviour policy $b$ to estimate
$v_\pi$. With $\rho_{t:T-1} = \prod_{k=t}^{T-1} \frac{\pi(A_k|S_k)}{b(A_k|S_k)}$
— the environment's transition probabilities cancel, which is why no model is
needed — the two estimators are

$$
V_{\text{ord}}(s) = \frac{\sum_t \rho_{t:T(t)-1} G_t}{|\mathcal{T}(s)|},
\qquad
V_{\text{wt}}(s) = \frac{\sum_t \rho_{t:T(t)-1} G_t}{\sum_t \rho_{t:T(t)-1}}.
$$

Ordinary importance sampling is unbiased (first-visit) but its variance is
unbounded in general; Sutton and Barto give a one-state example where a single
left-action loop makes $\mathbb{E}[\rho^2 G^2]$ diverge, so the estimate fails to
settle after millions of episodes. Weighted importance sampling is biased — after
one episode it returns that episode's return, an estimate of $v_b$ rather than
$v_\pi$ — but its variance converges to zero for bounded returns even when the
ratios have infinite variance. It is the default in practice.

## Assumptions and requirements

Episodes must **terminate with probability one**. Discounting makes the return of
an infinite trajectory finite, but Monte Carlo cannot compute it, because nothing
is averaged until the episode ends; a continuing task must be artificially cut,
which biases the estimate by the discounted tail that was dropped — downward
when rewards are nonnegative, upward when they are costs.

Convergence needs every state (or state–action pair) visited infinitely often,
which is what exploring starts, $\varepsilon$-soft policies, or a sufficiently
random behaviour policy provide. Off-policy evaluation additionally needs
**coverage**, $b(a|s) > 0$ wherever $\pi(a|s) > 0$, and it needs $b$'s action
probabilities to be known or estimated — a deterministic or unlogged behaviour
policy makes the ratios unusable. The variance guarantee for weighted importance
sampling assumes bounded returns.

What is _not_ required is the Markov property: unlike dynamic programming or TD,
Monte Carlo never conditions on the successor state being a sufficient statistic.

## Uses and applicability

Reach for Monte Carlo when episodes are short and a simulator exists but a model
does not; when you care about a handful of states and do not want to solve the
whole MDP; when the state representation is known to be non-Markov; and when you
need an unbiased baseline to check a bootstrapping method against. Off-policy
Monte Carlo estimators are the starting point for off-policy evaluation from
logged data — the setting Levine et al. survey for offline RL — where the only
alternative to an importance-weighted average is a learned model you may not
trust.

Do not reach for it in continuing tasks, in long-horizon problems where return
variance swamps the signal, or when you need updates before the episode ends —
online control, or any setting where the episode is thousands of steps long.

## Limitations and common mistakes

The variance is the headline cost: the return accumulates every random choice
made after time $t$, so its variance grows with horizon, and credit is assigned
to the whole episode equally rather than to the step that mattered.

The common errors are specific. Assuming every-visit MC is unbiased, as the
worked example above disproves. Assuming weighted importance sampling is
unbiased, which it is not — the choice between the two estimators is a
bias–variance trade, not a free improvement. Applying importance sampling across
a long episode and being surprised when the product of ratios collapses to
numerical zero or explodes: the effective sample size degrades sharply with
horizon, which is the central difficulty of off-policy evaluation and the reason
MacKay's warnings about importance-sampling weights apply directly here.
Averaging returns with a plain mean while the policy is still improving, so the
estimate lags the policy that generated the newest data. And treating Monte Carlo
control with exploring starts as a proved algorithm: Sutton and Barto flag its
convergence as an open theoretical question with only a partial result.

## Variants and alternatives

The named variations: first-visit and every-visit prediction; incremental and
constant-$\alpha$ updates; Monte Carlo with exploring starts; on-policy control
with $\varepsilon$-soft policies, which converges to the best
$\varepsilon$-soft policy rather than the optimal one; off-policy control with
ordinary or weighted importance sampling; per-decision and discounting-aware
importance sampling, which shave variance by not weighting rewards by ratios from
steps that came after them; and doubly robust estimators, which combine an
importance-weighted correction with a learned value model to reduce variance in
off-policy evaluation.

The genuine competitors are temporal-difference learning, which updates online
and has far lower variance at the cost of bias and a Markov assumption; $n$-step
and $\lambda$-return methods, which interpolate; dynamic programming, when a
model is available; and Monte Carlo tree search, which spends Monte Carlo
simulation on decision-time planning from the current state instead of on
learning a value function for all states. The wider Monte Carlo family in
statistics — importance sampling, rejection sampling, MCMC — shares the estimator
theory but targets integrals rather than returns.

## History and attribution

The name dates to 1940s Los Alamos physics, where games of chance were simulated
to study systems too complicated to solve analytically; Sutton and Barto recount
this lineage when introducing the chapter. The reinforcement-learning form —
averaging complete returns for policy evaluation, and the exploring-starts
control algorithm built on it — was consolidated in Sutton and Barto's book,
which also credits the analysis distinguishing first-visit from every-visit
estimators to Singh and Sutton's mid-1990s work on eligibility traces, where the
two correspond to replacing and accumulating traces. Monte Carlo tree search is a
separate, later line: it emerged from computer Go in the mid-2000s and is
surveyed by Browne et al.

## Sources

Sutton and Barto's Chapter 5 is the reference for everything structural here:
first-visit and every-visit prediction, exploring starts, on- and off-policy
control, and the ordinary-versus-weighted importance sampling comparison,
including the infinite-variance example. Levine et al.'s offline RL tutorial is
where the importance-sampling estimators meet real logged data, and is the better
source on why they degrade with horizon. MacKay's chapter on Monte Carlo methods
gives the statistics of importance sampling outside the RL framing, including the
normalized-weight estimator. Browne et al.'s survey covers Monte Carlo tree
search, the decision-time cousin of these methods.

## Prerequisites and next connections

Understand Markov decision processes first — the return, the policy and the value
function are its objects, and this page only estimates them.
[Probability Theory](./probability-theory.md) supplies the law of large numbers
that makes the averaging work, and [Stochastic Processes](./stochastic-processes.md)
supplies the trajectory-level view of an episode.
[Bias and Variance](./bias-variance.md) is the frame for the two estimator
choices made here, both first-visit versus every-visit and ordinary versus
weighted importance sampling.

What this opens up: temporal-difference learning, which is what you get by
replacing the sampled tail of the return with a current estimate; dynamic
programming, which is the same value computation with a model instead of samples;
and REINFORCE, which differentiates a policy through exactly the Monte Carlo
return defined here.
