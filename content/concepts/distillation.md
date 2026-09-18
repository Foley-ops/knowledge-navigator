---
concept_id: concept.deep_learning.distillation
title: Distillation
slug: /concepts/distillation
aliases:
  - knowledge distillation
kind: method
tier: 1
review_state: generated-draft
summary: Distillation trains a student model to imitate a teacher's predictive distribution, often combining softened teacher targets with the original labeled objective.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: Standard distillation fits a student from inputs paired with teacher-produced targets and often with original labels.
  - type: contributes_to
    target: concept.ml_engineering.deployment
    note: A smaller student can replace an expensive teacher or ensemble when serving cost prevents direct deployment.
  - type: contributes_to
    target: concept.learning.transfer_learning
    note: Teacher outputs transfer behavior learned by one model into another model, although the source and target tasks may be the same.
sources:
  - source_id: source.hinton2015.distilling_knowledge
    title: Distilling the Knowledge in a Neural Network
    url: https://arxiv.org/abs/1503.02531
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
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Distillation methods developed after the original soft-target formulation
    reason: The registry contains the original registered distillation paper but not later work on feature, relation, self, data-free, or sequence-level distillation, so those families are not compared here.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Distillation** trains a **student** model to match outputs produced by a
trained **teacher**, often an ensemble or a larger model. For classification,
the teacher's logits are divided by a temperature $T$ before softmax:

$$
q_i^{(T)}=
\frac{\exp(z_i^{\mathrm{teacher}}/T)}
{\sum_j\exp(z_j^{\mathrm{teacher}}/T)}.
$$

The student is trained on this distribution, usually together with the original
hard labels. The teacher is fixed in the standard procedure. Distillation is
not merely copying weights: teacher and student may have different architectures
and parameter counts because the transferred object is predictive behavior on
chosen inputs.

## Why it matters

An ensemble may predict well yet be too expensive to serve. Distillation can
move part of its behavior into one student with lower latency and memory use.
Soft targets communicate more than the winning class. If a teacher assigns
probabilities $0.55$, $0.40$, and $0.05$, it reveals that the second class is a
plausible confusion; a one-hot label discards that relationship.

The method separates training-time capacity from deployment-time capacity. It
does not make compression free. A small student may be unable to represent the
teacher, and it can inherit the teacher's systematic errors. Its success must be
measured on the actual task and resource budget.

## Intuition

A hard label is an answer key; a teacher distribution is an answer key with
hints about alternatives. The student learns both what was marked correct and
how the teacher organizes the other possibilities. Temperature exposes that
structure by flattening an overconfident distribution.

The tutoring analogy breaks because the teacher cannot explain beyond its
outputs. If it is confidently wrong, the soft target is a persuasive error. If
the transfer inputs miss an important region, the student receives no lesson
there. Distillation transfers behavior sampled on data, not the teacher's full
internal computation or a guarantee of equal performance.

## Concrete example

Suppose the true class is class 1. A teacher supplies
$q=(0.7,0.2,0.1)$ and a student supplies $p=(0.5,0.4,0.1)$. The hard-label
cross-entropy is

$$
-\log p_1=-\log(0.5)\approx0.6931.
$$

The teacher-target cross-entropy is

$$
-\sum_i q_i\log p_i
=-0.7\log(0.5)-0.2\log(0.4)-0.1\log(0.1)
\approx0.8987.
$$

The first term only asks for more mass on class 1. The second also says that
class 2 should receive twice the mass of class 3. If the student instead used
$p'=(0.5,0.1,0.4)$, hard-label loss would be unchanged, while teacher-target
loss would increase because the alternatives disagree with the teacher.

## Formal treatment

Let $p^{(T)}$ and $q^{(T)}$ be student and teacher distributions at temperature
$T$. A common combined objective is

$$
L=(1-\alpha)\operatorname{CE}(y,p^{(1)})
+\alpha T^2\operatorname{CE}(q^{(T)},p^{(T)}),
$$

where $0\leq\alpha\leq1$. Replacing the soft cross-entropy with
$\operatorname{KL}(q^{(T)}\|p^{(T)})$ changes the objective only by the teacher
entropy, which is constant with respect to student parameters. The $T^2$ factor
compensates for the temperature's reduction of logit-gradient magnitudes in the
high-temperature regime described by the registered paper.

At deployment, the student normally uses $T=1$. Training may use unlabeled
transfer inputs for the soft term because the teacher supplies targets, while
hard-label mixing requires labels. The objective is still empirical: matching
on observed transfer inputs does not imply matching everywhere.

## Assumptions and requirements

Teacher outputs must be available on inputs representative of where the student
will operate. Teacher and student class vocabularies and output semantics must
align. Logits or sufficiently precise probabilities are needed to form
temperature-softened targets; already rounded top-one labels discard the main
signal.

The teacher must be evaluated rather than presumed correct. Temperature,
$\alpha$, student capacity, and transfer-data size require validation. If soft
targets are cached, preprocessing and teacher version must be pinned. Privacy or
licensing constraints may restrict storing teacher outputs because those outputs
can encode information about the teacher or its training distribution.

## Uses and applicability

Use distillation when a teacher or ensemble is accurate enough to justify its
training cost but too expensive for production, or when soft class relationships
provide a useful signal beyond one-hot labels. It is especially relevant when a
student must meet a fixed latency, memory, or energy limit.

It is less suitable when the teacher is weak in the deployment region, when
classes or tasks differ without a mapping, or when the student is so constrained
that it cannot fit both labels and teacher behavior. Direct supervised training
may be simpler when the teacher adds little information.

## Limitations and common mistakes

Distillation can reproduce teacher bias, calibration errors, and blind spots.
A lower distillation loss is not the product objective. The student can match
average probabilities yet fail rare classes or examples where the teacher's
margin is small. Teacher inference can also make the training pipeline expensive
even though the resulting student is cheap.

Common mistakes include applying temperature to the teacher but not the student,
omitting the gradient-scale compensation without retuning the mixing weight,
using different class orders, comparing a student to the teacher at unequal
preprocessing, and evaluating only compression ratio. Another is assuming
distillation necessarily produces a smaller model; size is chosen by the student
architecture, while distillation is the training procedure.

## Variants and alternatives

The registered paper treats transfer from ensembles, mixtures of full and
specialist models, and a combined hard/soft objective. A student can also be
trained from soft targets alone when labels are absent, at the cost of trusting
the teacher completely. Different temperatures control how much nonwinning
class structure is visible.

Pruning and quantization alter an existing trained model's representation,
whereas distillation trains a separate predictor. Training a small architecture
directly is the simplest alternative. Later feature- and relation-matching
methods are outside the registry, so this draft does not claim when they improve
on output distillation.

## History and attribution

Hinton, Vinyals, and Dean's registered preprint presented the temperature-softened
formulation and popularized the term distillation for transferring ensemble
knowledge into a deployable model. Their abstract explicitly credits earlier
model-compression work. Accordingly, this page attributes the registered
formulation and terminology to them without claiming they originated the broad
idea of learning from another model's outputs.

## Sources

- Hinton, Vinyals, and Dean support the teacher/student setup, temperature,
  combined objective, gradient scaling, ensemble compression motivation,
  specialist-model experiments, and qualified attribution.
- Goodfellow, Bengio, and Courville support the surrounding supervised-learning,
  capacity, optimization, and generalization cautions.

## Prerequisites and next connections

Read [Supervised Learning](./supervised-learning.md) and loss functions for the
empirical objective, then [Transfer Learning](./transfer-learning.md) for the
broader idea of reusing learned behavior. [Deployment](./deployment.md) and
[Edge Inference](./edge-inference.md) explain the resource constraints that
often motivate a student model.
