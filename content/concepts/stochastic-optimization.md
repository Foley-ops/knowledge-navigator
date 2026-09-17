---
concept_id: concept.optimization.stochastic_optimization
title: Stochastic Optimization
slug: /concepts/stochastic-optimization
aliases:
  - stochastic approximation
kind: concept
tier: 1
review_state: generated-draft
summary: Optimization when the objective and its gradient can only be sampled rather than evaluated, so cheap noisy steps replace exact expensive ones and the convergence rate is set by the noise instead of the curvature.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: assumes
    target: concept.probability.probability_theory
    note: The objective is an expectation over a probability space and the oracle is a random variable, so unbiasedness, finite variance and almost-sure convergence are the statements being made.
  - type: contrasts_with
    target: concept.optimization.convex_optimization
    note: With an exact gradient a smooth convex problem admits $O(1/T)$, and a smooth strongly convex one converges linearly; with a noisy oracle the floor is $\Omega(1/\sqrt{T})$ in the convex case and $\Omega(1/(\lambda T))$ in the strongly convex case, so the two settings have genuinely different complexity.
  - type: used_to_solve
    target: concept.optimization.nonconvex_optimization
    note: Stochastic gradient methods are the default tool for the nonconvex problems of large-scale machine learning, even though the convergence theorems quoted for them assume convexity.
  - type: supported_by
    target: concept.probability.martingales
    note: The noise sequence is a martingale difference with respect to the natural filtration, and the classical almost-sure convergence proofs run through supermartingale convergence theorems.
sources:
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.bubeck.convex_optimization_complexity
    title: 'Convex Optimization: Algorithms and Complexity'
    url: https://arxiv.org/abs/1405.4980
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.loshchilov2017.sgdr
    title: 'SGDR: Stochastic Gradient Descent with Warm Restarts'
    url: https://arxiv.org/abs/1608.03983
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Robbins and Monro, A Stochastic Approximation Method (1951)
    reason: The registry holds no primary source for the founding stochastic approximation paper or for the step-size conditions named after it, so the attribution and the original root-finding formulation in the history section rest on nothing cited here.
    sections:
      - history-and-attribution
  - label: Convergence rates of stochastic gradient methods on smooth nonconvex objectives
    reason: The $O(1/\sqrt{T})$ bound on the smallest expected squared gradient norm is the honest guarantee for the nonconvex case, and no registry source states it; the convex textbooks cited here stop at convexity.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Counterexample to the convergence proof of Adam on convex problems
    reason: The claim that Adam's original regret analysis is flawed, and that a simple convex counterexample exists on which it does not converge, comes from later work that the registry does not list.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Stochastic optimization** is the problem of minimising

$$
F(x) \;=\; \mathbb{E}_{\xi \sim \mathcal{D}}\!\left[f(x, \xi)\right],
\qquad x \in \mathcal{X} \subseteq \mathbb{R}^d ,
$$

when an algorithm may not evaluate $F$ or $\nabla F$ at all. It may only draw a
sample $\xi$ and evaluate $f(x, \xi)$ or $\nabla_x f(x, \xi)$ — a random
quantity whose expectation is the thing it wanted. The distribution
$\mathcal{D}$ may be a data distribution, an empirical distribution over $n$
training examples, or genuine physical randomness in a simulation.

Two traditions share the name. The one described here is _stochastic
approximation_, where noise enters through the oracle. The other is _stochastic
programming_ — two-stage problems with recourse, chance constraints — where
noise enters through the model and the resulting surrogate is solved exactly.

## Why it matters

Empirical risk minimisation over $n$ examples has $F(x) = \frac{1}{n}\sum_{i=1}^{n}
f(x, \xi_i)$, so one exact gradient costs $n$ backward passes. When $n$ is
$10^9$ a single step of ordinary gradient descent is unaffordable, while a step
using one example costs $1/n$ as much and points the right way _on average_. The
wager is that many cheap approximate steps beat few exact ones, and for the
first few digits of accuracy theory endorses it, not just practice.

It also covers objectives with no closed form at all: the expected return of a
policy, the evidence lower bound of a variational posterior, the output of a
simulator you can run but not differentiate analytically.

## Intuition

Picture rolling downhill in fog with a compass that is right on average but
individually unreliable. Far from the bottom the slope dominates the noise and
wrong readings barely matter; near the bottom the true slope goes to zero and
the noise does not, so you stop converging and mill around in a _noise ball_
whose radius is set by the step size and the variance. Shrinking the step
shrinks the ball and slows the descent, and managing that tension is what every
step-size rule is for.

The analogy breaks in one place. The noise is not an adversary adding error to a
correct answer; it is a sample from a distribution whose mean _is_ the answer.
Averaging — over a minibatch, over iterates, over time — is therefore a real
cure, in a way it would not be against an adversary.

## Concrete example

Take the simplest possible instance: estimating a mean. Let
$f(x, \xi) = \tfrac12 (x - \xi)^2$ with $\xi \sim \mathcal{N}(\mu, \sigma^2)$,
$\mu = 3$, $\sigma = 2$. Then $F(x) = \tfrac12\big((x-\mu)^2 + \sigma^2\big)$,
minimised at $x^\star = 3$, and $1$-strongly convex. The stochastic gradient is
$x - \xi$, and SGD reads $x_{t+1} = x_t - \eta_t (x_t - \xi_t)$.

With $\eta_t = 1/t$ the update is $x_{t+1} = \frac{t-1}{t} x_t + \frac{1}{t}
\xi_t$ — exactly the running sample mean. Its error is $\sigma^2/t$, which is
both the $O(1/T)$ strongly convex rate and the statistically optimal estimator.

With a constant step $\eta$ the iterate is an AR(1) process, and its stationary
variance is $\eta\sigma^2/(2 - \eta)$. At $\eta = 0.1$ and $\sigma^2 = 4$ that is
$0.21$: the iterate centres on $3$ but keeps a standard deviation of about
$0.46$ forever, however long you run.

```python
import random
mu, sigma, eta, x = 3.0, 2.0, 0.1, 0.0
for _ in range(100_000):
    xi = random.gauss(mu, sigma)
    x -= eta * (x - xi)      # x hovers near 3.0, sd ~ 0.46, and never settles
```

A minibatch of size $m$ replaces $\xi_t$ by the mean of $m$ draws, cutting the
gradient variance to $\sigma^2/m$ and the noise ball to
$\eta\sigma^2/\big((2-\eta)m\big)$. Halving the ball's radius costs a four-fold
larger batch — or, for the same number of samples drawn, a four-fold smaller
step and four times as many iterations. The two routes cost the same. Above
$\eta = 2$ the recursion diverges whatever $m$ is: noise is not the only failure
mode.

## Formal treatment

Let $\mathcal{X}$ be closed and convex, $F$ convex on $\mathcal{X}$, and let the
oracle return $g_t$ with

$$
\mathbb{E}[g_t \mid x_t] \in \partial F(x_t), \qquad \mathbb{E}\big[\|g_t\|^2 \mid x_t\big] \le G^2 .
$$

Projected SGD is $x_{t+1} = \Pi_{\mathcal{X}}(x_t - \eta_t g_t)$. With
$\|x_1 - x^\star\| \le B$, the fixed step $\eta = B/(G\sqrt{T})$ and the averaged
iterate $\bar{x}_T = \frac{1}{T}\sum_{t=1}^{T} x_t$,

$$
\mathbb{E}\big[F(\bar{x}_T)\big] - F(x^\star) \;\le\; \frac{B G}{\sqrt{T}} .
$$

If $F$ is additionally $\lambda$-strongly convex, the schedule
$\eta_t = 1/(\lambda t)$ gives

$$
\mathbb{E}\big[F(\bar{x}_T)\big] - F(x^\star) \;\le\; \frac{G^2\big(1 + \log T\big)}{2 \lambda T} ,
$$

and the logarithm can be removed by weighting the average towards later
iterates. Both bounds are dimension-free, and both are optimal up to constants:
against a noisy oracle no method can beat $\Omega(1/\sqrt{T})$ in the convex case
or $\Omega(1/(\lambda T))$ in the strongly convex one. This is the sharp
contrast with the deterministic setting, where a smooth convex objective admits
$O(1/T)$, acceleration gives $O(1/T^2)$, and strong convexity gives linear
convergence.

The asymptotic story is older and separate. The **Robbins–Monro conditions**

$$
\sum_{t=1}^{\infty} \eta_t = \infty, \qquad \sum_{t=1}^{\infty} \eta_t^2 < \infty
$$

make the steps large enough in total to reach any starting distance and small
enough in square-sum for the accumulated noise to be finite; under them, with
suitable regularity, $x_t \to x^\star$ almost surely. They are satisfied by
$\eta_t = \eta_0/t$ and $\eta_t = \eta_0/t^{0.6}$, and violated by every constant
step — which is why the example above never settles. They say nothing about how
large the error is at any finite $T$.

For minibatches of size $m$, variance falls as $\sigma^2/m$, so the smooth
convex bound behaves like $L B^2/T + \sigma B/\sqrt{mT}$. Counted in gradient
evaluations $N = mT$, the noise term is $\sigma B/\sqrt{N}$ — independent of $m$
— while the first term becomes $L B^2 m / N$. Larger batches do not buy sample
efficiency in the noise-dominated regime; they buy parallelism, and they cost
in the deterministic term.

## Assumptions and requirements

**Unbiasedness** is load-bearing. Drop it and the iterates track the minimiser
of a different function: bias does not average away and no step size fixes it.
Truncated backpropagation, stale parameters in asynchronous training and badly
weighted importance sampling all inject it.

**Finite variance** is what keeps the $1/\sqrt{T}$ term finite. Heavy-tailed
gradients break the bound; clipping restores it and introduces bias in exchange,
so the two assumptions trade against each other.

**Independent sampling** is what makes the noise a martingale difference. Data
in sorted order, or consecutive frames of an episode, violates it — hence
shuffling and replay buffers.

**Convexity** is what makes the displayed rates statements about $F(\bar{x}_T) -
F(x^\star)$ at all; without it the guarantee degrades to one about gradient
norms. **Smoothness** ($L$-Lipschitz gradient) is needed for the $LB^2/T$ term,
and a cheap projection onto $\mathcal{X}$ for the constrained version.

## Uses and applicability

Reach for it when the objective is an expectation or a large finite sum, when
moderate accuracy suffices, and when a gradient sample is cheap: empirical risk
minimisation, online and streaming learning, policy gradient methods, stochastic
variational inference, simulation-based optimization. It is the training
algorithm of essentially every modern neural network.

Do not reach for it when $n$ is small enough for exact gradients and you need
many digits — the $1/\sqrt{T}$ tail makes high precision hopeless, and L-BFGS,
Newton or an interior-point method is faster and more accurate. Avoid it when
projection onto the constraint set is expensive, and when $m$ is close to $n$,
where it is simply a worse deterministic method.

## Limitations and common mistakes

The most common error is quoting the convergence theorems in the deep learning
setting. They assume convexity; a neural network loss is not convex. The honest
guarantee there is that the smallest expected squared gradient norm over $T$
steps decays like $1/\sqrt{T}$ — convergence towards an approximately stationary
point, which may be a saddle or a poor local minimum. That SGD nevertheless
finds good solutions on real networks is an empirical finding, repeatedly
reproduced and not explained by these theorems.

The second is treating learning-rate schedules as theory. Warmup, step decay,
cosine annealing and warm restarts are heuristics justified by benchmark
results; SGDR, for instance, reports better CIFAR and ImageNet accuracy for a
restart schedule without proving anything about it. The theoretically motivated
$1/t$ schedule is rarely used, because it decays too fast to escape the early
plateau.

The third is expecting a large batch to be a free speedup: it reduces variance
per step, not per sample. The linear-scaling rule — multiply the learning rate
by the batch-size factor — is an empirical regularity that holds over a range
and then fails, at a point that is workload-specific.

A fourth is confusing optimization error with generalisation error. Driving the
training objective to zero is not the goal, and claims that SGD noise improves
generalisation are actively studied and not settled.

## Variants and alternatives

**Momentum** and **Nesterov acceleration** damp the noise by averaging past
gradients; they help far more on ill-conditioned problems than on noisy ones.
**Adaptive methods** — AdaGrad, RMSProp, Adam — rescale each coordinate by a
running second-moment estimate, buying robustness to badly scaled gradients at
the cost of extra state per parameter and a convex theory that is weaker than
usually assumed.

**Variance reduction** — SAG, SVRG, SAGA — exploits the finite-sum structure
that plain SGD ignores, recovering linear convergence for smooth strongly convex
problems in exchange for stored gradients or periodic full passes; transformative
in convex machine learning, largely disappointing for deep networks.
**Polyak–Ruppert averaging** takes larger steps and averages the iterates,
reaching asymptotically optimal behaviour without a delicate schedule.
**Stochastic mirror descent** swaps the Euclidean geometry for one matched to
the constraint set, changing the dimension dependence of the constants.

The genuinely different alternative is **sample average approximation**: draw
$n$ samples once and solve the resulting deterministic problem by any method,
trading statistical error against computational cost explicitly. Where no
gradient exists, **derivative-free** methods — evolution strategies, Bayesian
optimization, simulated annealing — apply instead, at much worse dimension
scaling.

## History and attribution

Stochastic approximation begins with Herbert Robbins and Sutton Monro in 1951,
whose problem was not optimization but root-finding: locate the level $\theta$
at which an unknown regression function attains a target value, when each
experiment returns only a noisy observation, with sequential bioassay as the
motivating application. Jack Kiefer and Jacob Wolfowitz adapted the scheme to
maximisation a year later using finite-difference gradient estimates.

The complexity-theoretic view — that $1/\sqrt{T}$ is a property of the noisy
oracle rather than an artefact of the method — comes from Nemirovski and Yudin
in the early 1980s. Iterate averaging was introduced independently by Ruppert
and by Polyak and Juditsky around 1990. SGD became the default for neural
network training through the backpropagation era; the finite-sum
variance-reduction methods arrived in the early 2010s, and the adaptive
optimizers that now dominate deep learning shortly after.

## Sources

_Understanding Machine Learning_ gives the cleanest self-contained treatment of
SGD as a learning algorithm, including the convex and strongly convex theorems
in the form quoted here. Bubeck's monograph places those rates next to their
lower bounds and covers minibatching, mirror descent and variance reduction as
one complexity story. The _Deep Learning_ book is the reference for practice —
minibatch sizing, schedules, momentum, the adaptive family — and is candid about
which parts are empirical. SGDR is a concrete instance of a schedule justified
entirely by benchmark results.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first: expectation, variance,
independence and almost-sure convergence are the vocabulary of every statement
here. Gradients and the chain rule come from
[Multivariable Calculus](./multivariable-calculus.md).

From here, [Martingales](./martingales.md) supplies the machinery behind
almost-sure convergence under the Robbins–Monro conditions, and
[Concentration Inequalities](./concentration-inequalities.md) turn statements
about expected error into high-probability ones — which is what you want before
trusting a single run. [Stochastic Processes](./stochastic-processes.md) covers
the AR(1) recursion of the example and the diffusion limits used to model
constant-step SGD, and
[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
shows where the gradient samples in a vision network come from.
