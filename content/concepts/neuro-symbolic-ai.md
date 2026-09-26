---
concept_id: concept.ai_frontiers.neuro_symbolic_ai
title: Neuro-Symbolic AI
slug: /concepts/neuro-symbolic-ai
aliases:
  - neurosymbolic AI
  - neural-symbolic integration
kind: concept
tier: 1
review_state: generated-draft
summary: Neuro-symbolic AI combines neural networks, which learn from raw data, with symbolic representations and reasoning, which are explicit, compositional and checkable, aiming for systems that both perceive and reason — but there are many ways to connect the two and no settled recipe.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: requires
    target: concept.symbolic_ai.knowledge_representation
    note: The symbolic half of a neuro-symbolic system is a knowledge representation — rules, logical formulas or a knowledge graph — and its expressiveness bounds what the combined system can reason about.
  - type: contrasts_with
    target: concept.symbolic_ai.expert_systems
    note: Expert systems reason with rules over symbols that people supply by hand, while neuro-symbolic systems learn to produce or refine those symbols from raw data such as images and text.
  - type: requires
    target: concept.deep_learning.backpropagation
    note: Many neuro-symbolic methods train their neural components end to end through the reasoning step, which needs the symbolic part relaxed or made probabilistic so that gradients can flow through it.
sources:
  - source_id: source.garcez2020.neurosymbolic_third_wave
    title: 'Neurosymbolic AI: The 3rd Wave'
    url: https://arxiv.org/abs/2012.05876
    source_kind: preprint
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
    checked_on: 2026-09-25
unresolved_references:
  - label: Specific neuro-symbolic systems and early history (DeepProbLog, Logic Tensor Networks, the Neuro-Symbolic Concept Learner, knowledge-based neural networks, the neural-symbolic workshop series)
    reason: The worked example follows the digit-addition task popularised by DeepProbLog, and the named systems are described from their own papers; knowledge-based neural networks and the 2005 start of the workshop series are from the wider literature, not the cited survey. None of these is in the source registry.
    sections:
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Neuro-symbolic AI** is the family of approaches that integrate neural networks
with symbolic knowledge representation and reasoning. Neural networks learn
statistical patterns from raw data such as pixels and text; symbolic systems
manipulate explicit structures such as logical rules, programs and knowledge
graphs, with inference that composes and can be inspected. A neuro-symbolic
system uses both. It might have a network turn perception into symbols for a
reasoner, constrain a network's training with logical knowledge, or extract rules
from a trained network. Garcez and Lamb present this integration as the third
wave of AI.

## Why it matters

Deep learning is strong at perception and pattern completion but weak at things
symbolic AI does well: generalising systematically from few examples, following
rules exactly, using prior knowledge, and explaining its conclusions. Symbolic AI
has the opposite profile — brittle on noisy raw input, and dependent on knowledge
written by hand. Garcez and Lamb argue that robust, trustworthy AI needs learning
and reasoning together, so that knowledge can be both learned from data and
stated, checked and reused.

## Intuition

A common framing borrows the psychologists' two systems of thought. System 1 is
fast, intuitive and associative — recognising a face. System 2 is slow,
deliberate and rule-following — doing long division. Neural networks look like
System 1, symbolic reasoners like System 2, and people use both at once. A child
who can read digits and knows the rules of addition can add digits in
handwriting nobody showed them before; neither skill alone would do it.

The engineering challenge is the interface. Symbols are discrete and exact;
networks are continuous and trained by gradients. Every neuro-symbolic method is
a choice about where to put the boundary and how to pass information, and
gradients, across it.

## Concrete example

A system reads two handwritten digits and must output their sum. It is trained
only on sums, never on which digit each image shows. A neural classifier gives a
distribution over digits for each image; a symbolic rule says the sum is the sum
of the digits. Suppose for one pair the classifier outputs

```text
image 1:  P(3) = 0.9, P(4) = 0.1
image 2:  P(5) = 0.8, P(4) = 0.2
```

Treating the two images as independent, the probability of each sum is found by
enumerating the digit pairs the rule allows:

```text
sum 7:  (3,4)          0.9 x 0.2 = 0.18
sum 8:  (3,5), (4,4)   0.9 x 0.8 + 0.1 x 0.2 = 0.72 + 0.02 = 0.74
sum 9:  (4,5)          0.1 x 0.8 = 0.08
```

If the label is 8, training raises $P(\text{sum} = 8)$, and the gradient flows
back through the rule into the digit classifiers. The rule turns weak
supervision on sums into a learning signal for individual digits.

## Formal treatment

One widely used pattern gives a logic program **neural predicates**, whose
truth probabilities come from a network $f_\theta$, and defines the probability
of a query $q$ as the total probability of the possible worlds in which it holds:

$$
P_\theta(q) = \sum_{w \models q} \; \prod_{i} P_\theta(\text{fact}_i \text{ as in } w),
$$

assuming the probabilistic facts are independent. Training minimises
$-\log P_\theta(q)$ over labelled queries. The sum can be exponential in the
number of facts, so systems compile it into a circuit that makes both it and its
gradient tractable for many programs.

A second pattern relaxes logic into a differentiable penalty. Truth values become
numbers in $[0, 1]$, connectives become functions such as t-norms, and a
knowledge base $K$ contributes a loss term $\lambda\,(1 - \text{sat}_\theta(K))$
that pushes the network's outputs toward satisfying the rules.

## Assumptions and requirements

- **Symbolic knowledge worth having.** The approach pays off when there are rules
  or structure — arithmetic, physics, ontologies, grammar — that are true and
  hard to learn from data alone.
- **A differentiable or probabilistic interface,** if the system is to be trained
  end to end.
- **Tractable reasoning.** Exact probabilistic inference is expensive, so models
  are limited in size or approximate.
- **A vocabulary of symbols.** Someone must decide which concepts the network
  should produce; learning the symbols themselves is still hard.

## Uses and applicability

Neuro-symbolic methods are used for visual question answering over scenes,
learning with logical constraints, program synthesis and mathematical reasoning,
knowledge-graph completion, and verification of learned components. They are
most useful when training data are scarce but domain knowledge is rich, and when
outputs must satisfy constraints or be explained. Language models that call
calculators, solvers or code interpreters are a loose, practical form of the same
idea: a learned component hands exact sub-problems to a symbolic one.

## Limitations and common mistakes

**No single architecture.** "Neuro-symbolic" names a space of designs, not a
method; claims should say which integration is meant.

**Scaling reasoning.** Exact inference over logic programs is expensive, and
relaxed logics can satisfy rules only approximately.

**Hand-specified symbols.** Many systems still need people to fix the concepts
and rules, reintroducing the knowledge-engineering cost that symbolic AI
struggled with.

**Toy benchmarks.** Striking results often come from small, clean tasks; showing
advantages on large, noisy problems is harder.

## Variants and alternatives

Kautz's six-type taxonomy, discussed by Garcez and Lamb, sorts designs by how
the parts connect: symbolic input and output with a neural core; a symbolic
solver loosely coupled with a network, as in game-tree search with a learned
evaluator; a neural front end feeding a symbolic reasoner; symbolic knowledge
compiled into a network's training data or initial weights; logical rules
embedded as soft constraints on a network's loss; and, still largely an aim,
symbolic reasoning carried out inside a neural engine. Examples include probabilistic logic
programs with neural predicates, logic tensor networks, and knowledge
extraction from trained networks. The alternatives are purely neural systems
that hope reasoning emerges with scale, and purely symbolic systems fed by
separately trained perception.

## History and attribution

Connectionist and symbolic AI were long rival camps. Work on combining them dates
to the 1990s, including knowledge-based neural networks and connectionist
inductive logic programming, and a workshop series on neural-symbolic learning
and reasoning began in 2005. The success of deep learning after 2012, and its
limits in reasoning and explanation, renewed interest from about 2019. Garcez
and Lamb's 2020 paper surveys the field and argues for it as the next wave.

## Sources

Garcez and Lamb's paper defines neuro-symbolic AI, gives its motivation in
learning with reasoning, discusses the System 1 and System 2 framing, Kautz's
taxonomy, logic tensor networks and knowledge extraction, sets out open problems,
and describes the recent revival of interest. The digit-addition example, the
named systems and the early history are recorded as uncited.

## Prerequisites and next connections

Read [Knowledge Representation](./knowledge-representation.md) for the symbolic
side, and [Backpropagation](./backpropagation.md) for how the neural side is
trained through the interface.

From here, [Logic Programming](./logic-programming.md) is the reasoning engine
many systems build on, [Fuzzy Logic](./fuzzy-logic.md) supplies the t-norms used
in relaxed logics, and [Interpretability](./interpretability.md) is one of the
motivations the field claims.
