---
concept_id: concept.ai_frontiers.genetic_algorithms
title: Genetic Algorithms
slug: /concepts/genetic-algorithms
aliases:
  - GA
kind: method
tier: 1
review_state: generated-draft
summary: A genetic algorithm is a guided random search that evolves a population of encoded candidate solutions by fitness-based selection, crossover and mutation, and it works only as well as its encoding, its operators and its fitness function fit the problem.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: specializes
    target: concept.ai_frontiers.evolutionary_computation
    note: Genetic algorithms are the branch of evolutionary computation that encodes candidates as fixed-length strings, often of bits, and relies most heavily on crossover to combine them.
  - type: used_to_solve
    target: concept.optimization.combinatorial_optimization
    note: Scheduling, routing and packing problems are among the commonest uses of genetic algorithms, provided the encoding and crossover keep children valid, which for orderings needs special operators.
  - type: contrasts_with
    target: concept.optimization.stochastic_optimization
    note: Stochastic gradient methods refine one candidate using noisy derivative information, while a genetic algorithm refines a population using only fitness scores, so it applies where no gradient exists but typically needs far more evaluations.
sources:
  - source_id: source.buontempo.genetic_algorithms_ml
    title: Genetic Algorithms and Machine Learning for Programmers
    url: https://pragprog.com/titles/fbmach/genetic-algorithms-and-machine-learning-for-programmers/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-25
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Primary genetic algorithm literature (Holland's Adaptation in Natural and Artificial Systems, Goldberg's textbook, permutation crossover operators)
    reason: Holland's founding monograph, Goldberg's standard textbook and the papers introducing order and partially mapped crossover are described from the wider literature and are not in the source registry.
    sections:
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

A **genetic algorithm** (GA) is a search method that keeps a **population** of
candidate solutions, each encoded as a string of **genes**, and improves it over
**generations**. Each generation, a **fitness function** scores every candidate;
**selection** picks parents, favouring higher fitness; **crossover** builds
children by combining pieces of two parents; and **mutation** changes a few genes
of the children at random. Buontempo describes it as a kind of guided random
search, or heuristic search: something random happens, and a fitness function
steers which random changes survive.

## Why it matters

A genetic algorithm needs nothing from the problem except a way to encode a
candidate and a way to score it. No gradient, no convexity, no closed form. That
makes it a practical tool for design, scheduling and search problems whose
objective is a simulation, a rule set or a program, and a common first
introduction to the idea that useful solutions can be grown rather than derived.
It is also a lesson in what makes heuristic search work, since almost every
failure of a GA traces back to a poor encoding or a poor fitness function.

## Intuition

Buontempo's first GA tries to fire a cannonball out of a paper bag. Each candidate
is a pair — a launch velocity and an angle — and the question is how to score it.
One option is pass or fail: did the ball get out? The better option scores the
height of the ball as it reaches the edge of the bag, so a shot that nearly
escaped scores well even though it failed. Graded fitness lets near-misses breed
and pass their good traits on; pass-or-fail fitness treats a near-miss the same
as a shot that barely left the ground, and gives selection nothing to climb.

That is the core intuition. Selection needs a slope to follow, crossover
combines what different candidates got right, and mutation keeps trying things
nobody in the population has tried yet.

## Concrete example

**Selection.** In **fitness-proportional**, or roulette-wheel, selection a
candidate's chance of being picked is its share of total fitness. With three
candidates of fitness 1, 3 and 6, the total is 10 and the selection probabilities
are $0.1$, $0.3$ and $0.6$.

**Crossover must respect the encoding.** Suppose candidates are tours of four
cities, encoded as orderings. Naive one-point crossover after the second gene
breaks them:

```text
parent A: 1 2 | 3 4
parent B: 4 3 | 2 1
naive child: 1 2 | 2 1     visits 1 and 2 twice, never visits 3 or 4
```

An **ordered crossover** keeps A's first two cities and then fills in the
missing cities in the order they appear in B. B's order is 4, 3, 2, 1; cities 1
and 2 are already used, so the child is `1 2 4 3` — a valid tour that keeps
A's opening and B's relative order for the rest.

```python
def ordered_crossover(a, b, cut):
    head = a[:cut]
    return head + [city for city in b if city not in head]

assert ordered_crossover([1, 2, 3, 4], [4, 3, 2, 1], 2) == [1, 2, 4, 3]
```

## Formal treatment

Let each candidate be a string $x \in \mathcal{A}^L$ over an alphabet
$\mathcal{A}$, with fitness $f(x) \ge 0$. A population $P_t$ of $N$ strings
evolves as follows:

```text
P0 <- N random strings, possibly seeded with domain knowledge
for t = 0, 1, 2, ... until a stopping condition:
    score f(x) for each x in Pt
    repeat until N children:
        pick parents x, y from Pt, with probability increasing in fitness
        with probability pc: child <- crossover(x, y), else child <- copy of x
        mutate each gene of child independently with probability pm
    Pt+1 <- children, optionally keeping the best k of Pt unchanged
```

Under fitness-proportional selection, a candidate is chosen with probability
$f(x) / \sum_{y \in P_t} f(y)$. That formula needs non-negative fitness and is
sensitive to how fitness is scaled, which is why **tournament selection** —
choose the best of $k$ candidates drawn at random — is often preferred. Keeping the
best $k$ candidates unchanged, **elitism**, guarantees that the best fitness in
the population never decreases. The stopping condition can be a fixed number of
generations or a target fitness.

## Assumptions and requirements

- **An encoding.** Every candidate must be representable as a string of genes,
  and crossover and mutation must produce valid strings, or invalid children
  must be repaired or penalised.
- **A graded fitness function.** The fitness must reward partial progress; the
  cannonball example shows how pass-or-fail scoring throws information away.
- **Building blocks that combine.** Crossover only helps if good parts of
  different parents tend to form good wholes when put together.
- **Tuning.** Population size, crossover and mutation rates and the stopping
  condition are all choices; too small a population cannot breed usefully, and
  too large wastes evaluations.

## Uses and applicability

Genetic algorithms are used for scheduling and timetabling, vehicle routing,
circuit and antenna design, feature selection for machine learning models,
tuning the parameters of simulations, and evolving game-playing rules. They are
worth trying when the objective is a black box, the search space is large and
discrete, and good solutions can be assembled from good parts. When the objective
is differentiable, or when the problem has a structure an exact algorithm can
exploit, those methods are usually far more efficient.

## Limitations and common mistakes

**Blaming the algorithm for the fitness function.** A GA optimises exactly what
it is told to. A fitness function that rewards the wrong thing gets solutions
that exploit the gap.

**Operators that break the encoding.** As the tour example shows, operators
designed for bit strings produce invalid children for orderings, trees or
constrained values.

**Premature convergence.** Strong selection can make the whole population near
copies of one early leader, after which crossover produces nothing new.
Mutation, tournament size and diversity-preserving schemes counter this.

**No guarantee.** A GA can stop at a local optimum and gives no certificate of
how far it is from the best solution.

## Variants and alternatives

- **Real-valued GAs** encode genes as real numbers and use arithmetic crossover
  and Gaussian mutation.
- **Permutation GAs** use order-preserving crossovers, such as ordered or
  partially mapped crossover, for routing and scheduling.
- **Steady-state GAs** replace a few candidates at a time rather than the whole
  generation.
- **Genetic programming** evolves programs, usually encoded as trees.
- **Simulated annealing and local beam search** are related local search
  methods: the first follows a single trajectory, and the second keeps several
  states but chooses their successors deterministically.

## History and attribution

John Holland developed genetic algorithms in the 1960s and 1970s at the
University of Michigan, and his 1975 book Adaptation in Natural and Artificial
Systems set out the framework, including the schema theorem. David Goldberg's
1989 textbook popularised GAs as an engineering tool. Russell and Norvig present
them as a variant of stochastic beam search, among the local search algorithms.

## Sources

Buontempo builds a genetic algorithm from scratch — random initial candidates,
a fitness function, crossover and mutation — around the cannonball example, and
discusses graded versus pass-or-fail fitness and the magic numbers a GA needs.
Russell and Norvig give the general algorithm, fitness-proportional selection,
crossover and mutation among local search methods, and the history.

## Prerequisites and next connections

Read [Evolutionary Computation](./evolutionary-computation.md) for the wider
family, and [Combinatorial Optimization](./combinatorial-optimization.md) for the
problems genetic algorithms are most often applied to.

From here, [Neuroevolution](./neuroevolution.md) applies evolution to neural
networks, and [Swarm Intelligence](./swarm-intelligence.md) is the other large
family of population-based, nature-inspired search.
