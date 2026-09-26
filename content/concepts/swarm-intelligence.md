---
concept_id: concept.ai_frontiers.swarm_intelligence
title: Swarm Intelligence
slug: /concepts/swarm-intelligence
kind: method
tier: 1
review_state: generated-draft
summary: Swarm intelligence solves problems with many simple agents that follow local rules and share information, as in particle swarm optimisation and ant colony optimisation, so that useful search behaviour emerges from the group without central control.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: contrasts_with
    target: concept.ai_frontiers.evolutionary_computation
    note: Both improve a population using only fitness scores, but evolutionary methods breed new candidates from old ones, while swarm methods keep the same agents and move them according to what they and their neighbours have found.
  - type: used_to_solve
    target: concept.optimization.combinatorial_optimization
    note: Ant colony optimisation builds solutions to routing and scheduling problems piece by piece, guided by pheromone trails that record which choices appeared in good solutions.
  - type: contrasts_with
    target: concept.optimization.stochastic_optimization
    note: Particle swarm optimisation searches continuous spaces like gradient methods do, but moves each particle toward remembered good positions instead of along a derivative, so it needs no gradient and gives no convergence guarantee to an optimum.
sources:
  - source_id: source.buontempo.genetic_algorithms_ml
    title: Genetic Algorithms and Machine Learning for Programmers
    url: https://pragprog.com/titles/fbmach/genetic-algorithms-and-machine-learning-for-programmers/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-25
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-25
unresolved_references:
  - label: Primary swarm literature (Kennedy and Eberhart's particle swarm paper, Dorigo's ant system, Reynolds's boids, Karaboga's bee colony algorithm, critiques of metaphor-based metaheuristics)
    reason: The papers introducing particle swarm optimisation, the ant system and the artificial bee colony algorithm, Reynolds's flocking model, the PSO-specific remedies for premature convergence and the critique of metaphor-based metaheuristics are described from the wider literature and are not in the source registry.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Swarm intelligence** is a family of methods in which many simple agents, each
following local rules and sharing limited information, together solve a problem
none of them could solve alone. The idea is taken from social insects and animal
groups: no ant plans the colony's route to food, yet the colony finds a short one.
The two best-known algorithms are **particle swarm optimisation** (PSO), for
continuous search spaces, and **ant colony optimisation** (ACO), for building
solutions to combinatorial problems such as routing.

## Why it matters

Swarm methods are simple to implement, need only a way to score a candidate, and
parallelise naturally, since each agent does the same small amount of work. They
are widely used heuristics for black-box optimisation where gradients are absent.
They also illustrate a broader idea in AI — **emergence**, where global behaviour
comes from local interactions rather than from a central controller — which
matters for robot swarms, distributed sensing and multi-agent systems.

## Intuition

Picture particles trying to escape a paper bag, Buontempo's running example.
Each particle remembers the best place it has been so far, and the swarm shares
the best place any particle has found. At every step a particle keeps some of its
current motion, is pulled toward its own best, and is pulled toward the swarm's
best, with some randomness in the pulls. A particle with no neighbours that
always went straight to its own best would never move; randomness and the pull of
the others keep it exploring.

Ants do something different. An ant that finds food lays pheromone on its path
home; other ants tend to follow stronger trails. Short paths are walked more
often per unit time, so their trails build up faster, while pheromone evaporates
everywhere. The colony converges on short routes without any ant comparing them.

## Concrete example

Take one step of PSO in one dimension. A particle is at $x = 2$ with velocity
$v = 0$. Its personal best is $p = 1$ and the swarm's best is $g = 0$. With
inertia $w = 0.5$, both pull weights $c_1 = c_2 = 1$, and random draws
$r_1 = r_2 = 0.5$:

$$
v' = w v + c_1 r_1 (p - x) + c_2 r_2 (g - x)
= 0 + 0.5(1 - 2) + 0.5(0 - 2) = -1.5,
$$

so the particle moves to $x' = x + v' = 0.5$. It has moved past its own best
toward the swarm's best. Had the random draws been different, the step would have
been different — which is the point, since repeated random steps explore the
region between remembered good positions.

## Formal treatment

In PSO, particle $i$ has a position $x_i$ and velocity $v_i$ in
$\mathbb{R}^d$, a personal best $p_i$, and access to a best $g$, which is either
the whole swarm's best or the best among its neighbours. Each step, per
coordinate,

$$
v_i \leftarrow w v_i + c_1 r_1 (p_i - x_i) + c_2 r_2 (g - x_i), \qquad
x_i \leftarrow x_i + v_i,
$$

with fresh uniform $r_1, r_2 \in [0, 1]$. The inertia $w$ trades exploration
against settling; $c_1$ and $c_2$ weigh individual memory against social
information. Each particle's position is then scored and $p_i$ and $g$ updated.

In ACO for a routing problem, an ant at node $a$ chooses the next node $b$ with
probability proportional to $\tau_{ab}^{\alpha} \eta_{ab}^{\beta}$, where
$\tau_{ab}$ is the pheromone on edge $ab$ and $\eta_{ab}$ a heuristic
desirability such as the inverse distance. After all ants have built tours,
pheromone evaporates, $\tau \leftarrow (1 - \rho)\tau$, and each ant deposits
pheromone on its tour's edges, more for shorter tours.

## Assumptions and requirements

- **A fitness function.** As with genetic algorithms, agents need a score that
  says which positions or solutions are better.
- **A way to share information.** PSO needs a neighbourhood structure; ACO needs
  a shared pheromone memory. For her nearest-neighbour swarm, Buontempo notes
  that the right number of neighbours to follow varies by problem, with three to
  ten a common start.
- **Parameters.** Inertia and pull weights for PSO, evaporation rate and the
  exponents for ACO, and the number of agents all shape behaviour.
- **A suitable representation.** PSO needs positions that can be added and
  scaled, so continuous spaces; ACO needs solutions built step by step from
  choices that pheromone can attach to.

## Uses and applicability

PSO is used for tuning continuous parameters of models and controllers,
engineering design and training small models without gradients. ACO is used for
routing, scheduling and network problems, where it gives reasonably good answers
quickly to problems whose exhaustive search grows factorially. Swarm ideas also
drive coordination in robot swarms and drones. They fit black-box problems of
moderate size; for large, smooth, differentiable problems, gradient methods win.

## Limitations and common mistakes

**No optimality guarantee.** Like other local search heuristics, swarm methods
can converge on a poor region and give no bound on how far they are from the
best solution.

**Premature convergence.** If every particle follows one global best, the swarm
can collapse onto it before exploring; local neighbourhoods and higher inertia
help.

**Parameter sensitivity.** Poor settings can make the swarm oscillate, diverge
or stall. Published defaults are starting points, not guarantees.

**Metaphor inflation.** Many algorithms named after animals turn out to be
variants of the same few update rules; a new metaphor is not a new method, and
comparisons should be on benchmarks, not stories.

## Variants and alternatives

- **Artificial bee colony** algorithms split agents into workers, which refine
  known food sources, scouts, which explore, and inactive bees, which wait to be
  recruited by a waggle dance that shares where the good sources are.
- **Local-best PSO** uses each particle's neighbours' best instead of the global
  best, trading speed for robustness.
- **Flocking models** simulate groups moving together from three local rules:
  separation, alignment and cohesion.
- **Evolutionary algorithms** are the other large population-based family, and
  simulated annealing a single-agent alternative.

## History and attribution

Craig Reynolds's 1987 boids model showed flocking emerging from local rules.
Marco Dorigo introduced the ant system, the first ant colony optimisation
algorithm, in his 1992 doctoral thesis, and
Dorigo and Stützle's 2004 book is the standard reference on the method. James Kennedy and
Russell Eberhart introduced particle swarm optimisation in 1995. Derviş Karaboga
proposed the artificial bee colony algorithm in 2005.

## Sources

Buontempo builds a nearest-neighbour swarm and then a particle swarm optimiser
with personal and global bests, an ant colony
optimiser with pheromone deposit and evaporation, and an artificial bee colony
with worker, scout and inactive bees, and discusses neighbourhood size and
applicability to hard combinatorial problems. Russell and Norvig's treatment of
local search supplies the general cautions about local optima.

## Prerequisites and next connections

Read [Evolutionary Computation](./evolutionary-computation.md) for the other
great family of population-based search, and
[Combinatorial Optimization](./combinatorial-optimization.md) for the problems
ant colony methods target.

From here, [Genetic Algorithms](./genetic-algorithms.md) is the closest relative
to compare against, and
[Multi-Agent Reinforcement Learning](./multi-agent-reinforcement-learning.md)
treats many interacting agents that learn rather than follow fixed rules.
