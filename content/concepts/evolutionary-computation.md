---
concept_id: concept.ai_frontiers.evolutionary_computation
title: Evolutionary Computation
slug: /concepts/evolutionary-computation
aliases:
  - evolutionary algorithms
kind: method
tier: 1
review_state: generated-draft
summary: Evolutionary computation searches for good solutions by maintaining a population of candidates and repeatedly selecting, recombining and mutating the fittest, which needs only a way to score candidates and no gradients at all.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: contrasts_with
    target: concept.optimization.stochastic_optimization
    note: Stochastic gradient methods improve one candidate by following noisy gradient estimates, while evolutionary methods improve a population using only the scores of its members, which is why they work on objectives with no usable gradient.
  - type: used_to_solve
    target: concept.optimization.combinatorial_optimization
    note: Evolutionary algorithms are a standard heuristic for combinatorial problems such as scheduling and routing, where the search space is discrete and exact methods are too slow.
sources:
  - source_id: source.buontempo.genetic_algorithms_ml
    title: Genetic Algorithms and Machine Learning for Programmers
    url: https://pragprog.com/titles/fbmach/genetic-algorithms-and-machine-learning-for-programmers/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - concrete-example
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-25
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Primary evolutionary computation literature (Holland, Rechenberg and Schwefel, Cramer, Koza, CMA-ES, No Free Lunch)
    reason: The founding accounts of genetic algorithms, evolution strategies and genetic programming, the covariance matrix adaptation evolution strategy, and Wolpert and Macready's No Free Lunch theorems are described from the wider literature and are not in the source registry.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Evolutionary computation** is a family of search and optimisation methods
modelled loosely on natural selection. It maintains a **population** of candidate
solutions, scores each with a **fitness function**, and builds the next
generation by **selecting** fitter candidates more often, **recombining** parts of
selected parents, and **mutating** the results at random. Repeated over many
generations, the population tends to move toward better solutions. The main
branches — genetic algorithms, evolution strategies, evolutionary programming and
genetic programming — differ mainly in how they represent candidates and which
operators they emphasise.

## Why it matters

Many real objectives cannot be differentiated: a scheduling cost, the performance
of a circuit design, the score of a simulated robot, the output of a program. An
evolutionary method needs only to evaluate candidates, so it applies where
gradient-based optimisation cannot. It also searches with a population rather
than a single point, which can keep it from committing early to one region of a
rugged landscape, and it parallelises naturally, since each candidate is scored
independently.

## Intuition

Think of breeding. You cannot design a faster racehorse from first principles,
but you can breed the fastest horses, and over generations speed improves.
Selection keeps what works; recombination tries combinations of good traits from
different parents; mutation introduces variations no parent had. None of the steps
understands why a solution is good — improvement emerges from differential
survival.

The analogy is loose. Biological evolution has no objective set in advance by
anyone, while an evolutionary algorithm optimises a fitness function you chose.
And the algorithm inherits nothing of evolution's scale, so it is only as good as
its representation and operators make it.

## Concrete example

Maximise the number of ones in a five-bit string, so a string's fitness is its
count of ones. Two parents, `11000` with fitness 2 and `00111` with fitness 3,
undergo **one-point crossover** after the second bit:

```text
parent A: 11|000   fitness 2
parent B: 00|111   fitness 3
child 1:  11|111   fitness 5   (A's head, B's tail)
child 2:  00|000   fitness 0   (B's head, A's tail)
```

Crossover alone produced the optimum, `11111`, by combining the good start of one
parent with the good end of the other, and also the worst possible string.
Selection then does the rest: `11111` is far more likely to be chosen to breed than
`00000`. Mutation, flipping each bit with small probability, keeps variation
alive when the population has converged.

## Formal treatment

A generic evolutionary algorithm over a search space $\mathcal{X}$ with fitness
$f : \mathcal{X} \to \mathbb{R}$ proceeds as follows:

```text
P  <- initial population of N candidates
repeat until a stopping condition:
    evaluate f(x) for each x in P
    parents  <- select from P, favouring higher f
    children <- recombine and mutate parents
    P        <- replace some or all of P with children
```

Selection schemes include **fitness-proportional** selection, where a candidate's
chance of being chosen is its share of the population's total fitness, and
**tournament** selection, which picks the best of a few randomly drawn candidates
and is insensitive to how fitness is scaled. Replacement can be **generational**,
where children replace parents entirely, or **elitist**, where the best candidates
survive unchanged so the best fitness found never decreases.

## Assumptions and requirements

- **A fitness function that guides.** The search needs a score that rewards
  partial progress; a landscape that is flat except at the solution gives
  selection nothing to work with.
- **A representation that suits the operators.** Crossover helps only if
  combining parts of good solutions tends to give good solutions; for many
  encodings it does not.
- **Enough evaluations.** Populations over many generations need many fitness
  evaluations, which is the dominant cost when each is expensive.
- **No free lunch.** Averaged over all possible objectives, no search algorithm
  outperforms any other, including random search; an evolutionary algorithm's
  success on a problem reflects how well its operators match that problem's
  structure.

## Uses and applicability

Evolutionary methods suit black-box problems where gradients are unavailable or
misleading: design optimisation in engineering, scheduling and routing, tuning
parameters of simulations, evolving controllers and neural network architectures,
and generating programs. Evolution strategies are strong for continuous black-box
optimisation of moderate dimension. Where a gradient is available and informative,
gradient-based methods are usually far more sample-efficient.

## Limitations and common mistakes

**Expecting efficiency.** Evolutionary search typically needs many more objective
evaluations than a method that exploits gradients or problem structure.

**Premature convergence.** Strong selection can make the population uniform before
it has found a good region; diversity has to be maintained deliberately.

**Many parameters.** Population size, mutation rate, crossover rate and selection
pressure all matter, and poor settings can make the method no better than random
search.

**Overreading the theory.** Holland's schema theorem describes how short, fit
patterns are expected to spread in one generation; the building-block hypothesis
that genetic algorithms work by assembling such blocks is contested.

## Variants and alternatives

- **Genetic algorithms** use fixed-length, often binary, representations with an
  emphasis on crossover.
- **Evolution strategies** work on real-valued vectors with Gaussian mutation, and
  the covariance matrix adaptation variant learns the shape of the mutation
  distribution.
- **Genetic programming** evolves programs, usually represented as trees.
- **Neuroevolution** evolves neural network weights or architectures.
- **Swarm intelligence** methods such as particle swarm optimisation are
  population-based but model collective behaviour rather than heredity.
- **Simulated annealing and Bayesian optimisation** are the main single-solution
  and model-based alternatives for black-box optimisation.

## History and attribution

Several traditions arose independently in the 1960s and 1970s: John Holland's
genetic algorithms in the United States, Ingo Rechenberg and Hans-Paul Schwefel's
evolution strategies in Germany, and Lawrence Fogel's evolutionary programming.
John Koza developed and popularised genetic programming around 1990, after Nichael
Cramer's 1985 tree-based precursor. The traditions converged into
the field now called evolutionary computation in the 1990s.

## Sources

Buontempo's book is a practical introduction to genetic algorithms and related
nature-inspired methods, and supports this page's operators, worked example,
applications and cautions. Russell and Norvig place genetic algorithms among local
search methods, describe the generic algorithm and its selection schemes, and give
the history. The primary literature is recorded as uncited.

## Prerequisites and next connections

Read [Stochastic Optimization](./stochastic-optimization.md) for the
gradient-based methods this family contrasts with, and
[Combinatorial Optimization](./combinatorial-optimization.md) for the problems it
is most often used on.

From here, [Nonconvex Optimization](./nonconvex-optimization.md) explains the
rugged landscapes that population-based search is meant to cope with.
