---
concept_id: concept.ai_frontiers.neuroevolution
title: Neuroevolution
slug: /concepts/neuroevolution
kind: method
tier: 1
review_state: generated-draft
summary: Neuroevolution trains neural networks with evolutionary search instead of backpropagation, perturbing weights or architectures and keeping what scores well, which trades sample efficiency for needing no gradient and parallelising almost perfectly.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: specializes
    target: concept.ai_frontiers.evolutionary_computation
    note: Neuroevolution is evolutionary computation whose candidates are neural networks, encoded as weight vectors, architectures or both.
  - type: contrasts_with
    target: concept.deep_learning.backpropagation
    note: Backpropagation computes an exact gradient of a differentiable loss for one network, while neuroevolution estimates a search direction from the scores of perturbed networks and so works when the objective cannot be differentiated.
  - type: contrasts_with
    target: concept.reinforcement_learning.policy_gradients
    note: Policy gradient methods perturb actions and credit individual steps of an episode, whereas evolution strategies perturb the policy's parameters and score whole episodes, which ignores the time structure but tolerates sparse and delayed reward.
sources:
  - source_id: source.salimans2017.evolution_strategies
    title: Evolution Strategies as a Scalable Alternative to Reinforcement Learning
    url: https://arxiv.org/abs/1703.03864
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Topology-evolving and architecture-search literature (NEAT, HyperNEAT, evolutionary neural architecture search)
    reason: Stanley and Miikkulainen's NeuroEvolution of Augmenting Topologies, its indirect-encoding successors, and evolutionary search over deep network architectures are described from the wider literature; their papers are not in the source registry.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Neuroevolution** is the use of evolutionary algorithms to design or train
neural networks. A population of networks is scored on a task, and the
better-scoring ones are copied, perturbed and sometimes recombined to form the
next population. What evolves can be the **weights** of a network with a fixed
architecture, the **architecture** itself, or both. No gradient of the objective
is computed, so the objective can be anything that can be measured: the total
reward of an episode, a game score, the accuracy of a trained model.

## Why it matters

Backpropagation needs a differentiable loss. Many objectives in reinforcement
learning and design are not: rewards arrive once at the end of an episode, the
environment is a simulator nobody can differentiate, or the thing being chosen is
discrete, such as how many layers a network has. Neuroevolution sidesteps all of
this. Salimans and colleagues showed that a simple evolution strategy is a
competitive alternative to standard reinforcement learning on continuous-control
and Atari benchmarks, and that because it needs to communicate only scores, it can
scale to more than a thousand parallel workers.

## Intuition

Imagine tuning a robot controller by hand. You nudge the weights in some random
direction, run the robot, and see if it walked further. Try many random nudges in
parallel, and move the weights toward the average of the nudges that helped and
away from the ones that hurt. That is an **evolution strategy**: a cloud of
perturbed copies of the current network, and a step toward the good side of the
cloud. It never looks inside an episode to ask which action was good. It only
asks which version of the network did better overall.

## Concrete example

Take a single parameter $\theta = 0$, a noise scale $\sigma = 1$, and a score
$F(\theta) = 2 + \theta$, whose true gradient is $1$. With **antithetic
sampling**, each noise draw $\varepsilon$ is evaluated in both directions, and the
gradient estimate is $\bigl(F(\theta + \sigma\varepsilon) - F(\theta - \sigma\varepsilon)\bigr)\varepsilon / (2\sigma)$.

```text
epsilon = 1.0:  (F(1.0)  - F(-1.0)) * 1.0 / 2  =  (3.0 - 1.0) * 1.0 / 2  = 1.00
epsilon = 0.5:  (F(0.5)  - F(-0.5)) * 0.5 / 2  =  (2.5 - 1.5) * 0.5 / 2  = 0.25
```

Neither single draw is reliable: the first happens to be exact, the second is a
quarter of the truth. Averaged over many draws of $\varepsilon \sim N(0, 1)$ the
estimate converges to $1$, because for this linear score each draw gives
$\varepsilon^2$ and $\mathbb{E}[\varepsilon^2] = 1$. The estimator is unbiased
for the gradient of the smoothed objective, but it is noisy, which is why real runs use
populations of hundreds or thousands.

## Formal treatment

Evolution strategies as used by Salimans and colleagues optimise a Gaussian
smoothing of the score,

$$
J(\theta) = \mathbb{E}_{\varepsilon \sim N(0, I)}\bigl[F(\theta + \sigma\varepsilon)\bigr],
\qquad
\nabla_\theta J(\theta) = \frac{1}{\sigma}\,
\mathbb{E}_{\varepsilon \sim N(0, I)}\bigl[F(\theta + \sigma\varepsilon)\,\varepsilon\bigr].
$$

The gradient identity needs no derivative of $F$, only its values. With $n$
samples the update is

$$
\theta \leftarrow \theta + \frac{\alpha}{n\sigma}\sum_{i=1}^{n} F(\theta + \sigma\varepsilon_i)\,\varepsilon_i ,
$$

usually with antithetic pairs and with scores replaced by their ranks, which makes
the update insensitive to the scale of $F$. Workers share random seeds, so each
can regenerate every other worker's $\varepsilon_i$ and only the scalar scores
need to be exchanged.

## Assumptions and requirements

- **Many cheap evaluations.** The gradient estimate is noisy; progress needs
  large populations, which is affordable only when episodes are cheap and
  parallel hardware is available.
- **A smooth enough landscape.** The method follows the gradient of the
  smoothed score, so it helps when nearby parameters score similarly.
- **Moderate effective dimension.** The difficulty grows with the intrinsic
  dimension of the problem; Salimans and colleagues argue that raw parameter
  count is not what matters, and found larger networks did slightly better.
- **An encoding for architectures.** Evolving structure needs a representation
  of networks that mutation and crossover can act on.

## Uses and applicability

Neuroevolution is used for reinforcement learning tasks with sparse or delayed
reward, for training controllers and game-playing agents in simulation, for
policies with non-differentiable components, and for searching neural network
architectures. It is attractive when wall-clock time matters more than sample
count and many machines are available. For supervised learning with a
differentiable loss, backpropagation is far more efficient.

## Limitations and common mistakes

**Sample inefficiency.** Salimans and colleagues report that evolution
strategies typically needed several times more environment interaction than the
reinforcement learning methods they compared against, compensated by parallelism.

**Ignoring credit assignment.** Scoring whole episodes throws away information
about which actions mattered, which is a cost when per-step rewards are dense
and informative.

**Comparing unlike budgets.** A comparison of methods is only fair if it states
whether the budget is wall-clock time, compute or environment steps; each gives
a different winner.

**Hard high-dimensional problems.** Estimating a search direction from random
perturbations resembles finite differences in random directions, and becomes
harder as the problem's intrinsic dimension grows, even if network size alone
does not hurt.

## Variants and alternatives

- **Weight evolution** with genetic algorithms mutates and selects weight vectors
  directly.
- **Evolution strategies** adapt a search distribution: the fixed-Gaussian
  version above, from the natural evolution strategies family, moves only its
  mean, while covariance matrix adaptation also learns its shape.
- **Topology evolution** such as NEAT grows networks from minimal structure,
  adding nodes and connections by mutation and protecting new structures by
  grouping networks into species.
- **Evolutionary architecture search** evolves the design of deep networks and
  trains each candidate's weights by gradient descent.
- **Policy gradient methods** are the closest gradient-based alternative in
  reinforcement learning, adding noise to actions rather than to parameters.

## History and attribution

Evolving neural network weights dates to the late 1980s and 1990s. Stanley and
Miikkulainen introduced NEAT in 2002, making the evolution of topology practical.
Salimans, Ho, Chen, Sidor and Sutskever at OpenAI published their scalable
evolution strategies paper in 2017, reviving interest by showing competitive
results on reinforcement learning benchmarks at large scale.

## Sources

Salimans and colleagues supply the definition of evolution strategies used here,
the smoothed-objective gradient identity, antithetic sampling, rank-based
fitness shaping, shared random seeds, the scaling results and the comparison of
sample efficiency with reinforcement learning. Topology-evolving methods are
recorded as uncited.

## Prerequisites and next connections

Read [Evolutionary Computation](./evolutionary-computation.md) for the search
family, and [Backpropagation](./backpropagation.md) for the gradient method this
replaces.

From here, [Policy Gradients](./policy-gradients.md) is the reinforcement
learning counterpart that perturbs actions instead of parameters, and
[Genetic Algorithms](./genetic-algorithms.md) describes the operators weight
evolution borrows.
