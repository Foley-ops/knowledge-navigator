---
concept_id: concept.ai_frontiers.mechanistic_interpretability
title: Mechanistic Interpretability
slug: /concepts/mechanistic-interpretability
kind: concept
tier: 1
review_state: generated-draft
summary: Mechanistic interpretability tries to reverse-engineer the algorithms a trained neural network implements, identifying the features its activations represent and the circuits of weights that compute them, rather than only attributing outputs to inputs.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: specializes
    target: concept.ai_frontiers.interpretability
    note: Mechanistic interpretability is the part of interpretability that explains a network by its internal computations — features and the weights connecting them — rather than by how its outputs depend on its inputs.
  - type: requires
    target: concept.deep_learning.transformers
    note: Much current mechanistic work studies transformers, and its tools for them — the residual stream as a shared channel, and attention heads split into query-key and output-value circuits — are readings of the transformer's own equations.
  - type: contributes_to
    target: concept.ai_frontiers.ai_safety
    note: If a model's internal mechanisms can be read, deceptive or unintended strategies might be detected directly rather than inferred from behaviour, which is a central safety motivation for the field.
sources:
  - source_id: source.olah2020.zoom_in_circuits
    title: 'Zoom In: An Introduction to Circuits'
    url: https://distill.pub/2020/circuits/zoom-in/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.elhage2021.transformer_circuits
    title: A Mathematical Framework for Transformer Circuits
    url: https://transformer-circuits.pub/2021/framework/index.html
    source_kind: authoritative-secondary
    supports:
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Later mechanistic interpretability literature (superposition, sparse autoencoders and dictionary learning, activation patching)
    reason: The toy models of superposition, the use of sparse autoencoders to find more interpretable features, causal intervention methods such as activation patching, and analyses of models trained on algorithmic tasks are described from later papers that are not in the source registry.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Mechanistic interpretability** aims to understand a trained neural network the
way one might understand a compiled program by decompiling it: by finding what
its internal activations represent and how its weights compute one
representation from another. Its units of analysis are **features** — properties
of the input that the network represents, often as directions in activation
space — and **circuits**, the subgraphs of features and the weights connecting
them that implement some piece of behaviour. The goal is an explanation whose
parts correspond to actual computations inside the model.

## Why it matters

Behavioural testing shows what a model does on the inputs someone thought to try.
Attribution methods show which inputs mattered. Neither shows how the model gets
its answer, so neither can rule out that it uses a strategy that will fail, or
mislead, on inputs nobody tested. A mechanistic account can in principle do
that. Olah and colleagues also argue it is a scientific opportunity: trained
networks contain learned algorithms that no one designed, and studying them
closely, as biologists study cells, may reveal structure that summary
statistics hide.

## Intuition

Zoom in on an image classifier. Early neurons respond to edges and colours; a
layer later, some respond to curves of a particular orientation; later still, to
wheels, windows and car bodies. Look at the weights between layers and a **car
detector** turns out to be built from a window detector excited at the top of its
receptive field, a car-body detector in the middle and a wheel detector at the
bottom. That is a circuit: a readable algorithm, "windows above, wheels below",
written in weights.

Not every neuron is this tidy. Some are **polysemantic**, responding to
unrelated things such as cat faces and car fronts. Much of the difficulty of the
field lies there, since it means single neurons are not always the right unit.

## Concrete example

A small transformer is fed the text "Mr Dursley said ... Mr" and predicts
"Dursley". Elhage and colleagues explain this with an **induction head**, a
two-step circuit found in two-layer attention-only transformers:

```text
layer 1, previous-token head:  at the token "Dursley", write "the token before
                               me was Mr" into the residual stream
layer 2, induction head:       at the final "Mr", attend to earlier positions
                               whose previous token was "Mr" — that is, to
                               "Dursley" — and copy that token to the output
```

The second head's query is formed from the current token, and its key from
information the first head wrote. That dependence is **K-composition**, a way
one head's output changes what another attends to. Because nothing in the
mechanism depends on which tokens A and B are, it completes any repeated sequence
"A B ... A → B", which is how a model can continue text it has never seen.

## Formal treatment

Elhage and colleagues treat the transformer's **residual stream** $x \in \mathbb{R}^{d}$
as a communication channel: each layer reads from it by a linear map and adds its
output back. An attention head with weights $W_Q, W_K, W_V \in \mathbb{R}^{d_h \times d}$
and $W_O \in \mathbb{R}^{d \times d_h}$ splits into two largely independent
circuits:

$$
\text{QK circuit: } x_i^\top W_Q^\top W_K\, x_j, \qquad
\text{OV circuit: } W_O W_V\, x_j .
$$

The QK circuit decides how much position $i$ attends to position $j$; the OV
circuit decides what is written to the stream if it does. The matrices
$W_Q^\top W_K$ and $W_O W_V$ are both $d \times d$ and of rank at most $d_h$:
with $d = 512$ and $d_h = 64$, each is a $512 \times 512$ matrix of rank at
most 64. Multiplying through the embedding
$W_E$ and unembedding $W_U$ gives token-level views; a zero-layer transformer is
just $W_U W_E$, a table of bigram statistics, and a one-layer attention-only
model adds terms that implement skip-trigrams such as "A ... B → C".

## Assumptions and requirements

- **Features are meaningful directions.** Olah and colleagues state as a working
  hypothesis that features are the fundamental unit of networks and correspond to
  directions in activation space. If representations are not organised this way,
  the programme's units are wrong.
- **Circuits are readable.** The weights between features must be sparse and
  structured enough to understand.
- **Universality, loosely.** The hope that similar features and circuits recur
  across models and tasks is what would make findings transferable; Olah and
  colleagues present it as a speculative claim.
- **Access to weights and activations.** The methods need a model open to
  inspection.

## Uses and applicability

Mechanistic analysis has explained specific behaviours of small and mid-sized
models: curve and object detectors in vision networks, induction heads and
in-context copying in transformers, and particular algorithmic tasks in models
trained on them. Its framework — residual stream, QK and OV circuits, composition
between heads — gives a shared vocabulary for thinking about transformer
internals. It is most applicable when a behaviour is specific enough to trace,
and a model small enough, or a feature basis clean enough, to trace it in.

## Limitations and common mistakes

**Polysemanticity and superposition.** When neurons mix unrelated features, the
neuron basis does not reveal the circuits; finding a better basis is itself a
research problem.

**Cherry-picking.** A beautiful circuit for one behaviour does not show that the
rest of the model is equally interpretable. Explanations should be tested by
intervention, not only by inspection.

**Scale.** Hand analysis that works for a small model or one behaviour does not
obviously scale to models with billions of parameters and countless behaviours.

**Interpretability illusions.** A feature can look clean on the examples that
most activate it and behave differently across the whole input distribution.

## Variants and alternatives

- **Feature visualisation** optimises inputs to excite a neuron or direction.
- **Circuit analysis** reads the weights connecting features, as above.
- **Sparse dictionary learning** looks for a larger set of sparsely active
  directions that are more interpretable than individual neurons.
- **Causal interventions** such as activation patching test whether a component
  matters by replacing its activations.
- **Probing** trains simple classifiers on activations to test whether
  information is present — a weaker claim, since present is not the same as
  used.
- **Behavioural and attribution-based interpretability** treats the model as a
  black box.

## History and attribution

Feature visualisation of vision networks grew through the 2010s. Olah, Cammarata,
Schubert, Goh, Petrov and Carter's "Zoom In" (2020) set out the circuits
programme and its claims about features, circuits and universality. Elhage and
colleagues' mathematical framework (2021) carried the approach to transformers,
introducing the residual-stream view, QK and OV circuits, and induction heads.

## Sources

Olah and colleagues supply the definition of features and circuits, the
motivation, the car-detector and curve-detector examples, polysemantic neurons,
and the three speculative claims. Elhage and colleagues supply the residual
stream, the QK and OV decomposition, the zero- and one-layer analyses, composition
between heads and induction heads.

## Prerequisites and next connections

Read [Transformers](./transformers.md) and [Attention](./attention.md) for the
architecture being analysed, and [Interpretability](./interpretability.md) for
the broader field.

From here, [AI Safety](./ai-safety.md) is a major reason the work is done, and
[Convolutional Networks](./convolutional-networks.md) is where the circuits
programme started.
