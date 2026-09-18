---
concept_id: concept.deep_learning.backpropagation
title: Backpropagation
slug: /concepts/backpropagation
aliases:
  - back-propagation
kind: algorithm
tier: 1
review_state: generated-draft
summary: Backpropagation applies reverse-mode differentiation to a computational graph, reusing local derivatives to compute a scalar objective's gradient with respect to many parameters efficiently.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: Backpropagation repeatedly applies the multivariable chain rule to compositions of differentiable operations.
  - type: generalizes
    target: concept.deep_learning.backpropagation_through_convolution
    note: The convolutional backward pass is one specialized local derivative inside the general reverse traversal.
  - type: useful_when
    target: concept.optimization.nonconvex_optimization
    note: Backpropagation supplies gradients consumed by first-order optimizers for neural-network objectives.
  - type: supported_by
    target: concept.paradigms.array_programming
    note: Tensor operations and vector-Jacobian products allow implementations to batch local derivative calculations efficiently.
sources:
  - source_id: source.deep_learning_book.mlp
    title: Deep Learning, Chapter 6 — Deep Feedforward Networks
    url: https://www.deeplearningbook.org/contents/mlp.html
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
  - source_id: source.rumelhart1986.learning_representations
    title: Learning representations by back-propagating errors
    url: https://www.nature.com/articles/323533a0
    source_kind: primary-research
    supports:
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Backpropagation** is an efficient algorithm for computing derivatives of a
scalar objective through a composition of operations. It evaluates the
computational graph forward to obtain intermediate values, then traverses the
graph backward. At each operation it multiplies the derivative arriving from
later computations by a local derivative and accumulates contributions for
every input used along multiple paths.

Backpropagation is reverse-mode automatic differentiation applied to a layered
model. It computes gradients; it is not itself an optimizer and does not decide
how parameters are updated.

## Why it matters

A neural network may have millions of parameters but only one scalar training
loss. Differentiating the complete formula separately with respect to each
parameter would repeat nearly all intermediate work. Reverse mode shares that
work: roughly one forward evaluation and one backward traversal produce all
parameter derivatives.

This efficiency makes representation learning possible. An error measured at
the output becomes a credit-assignment signal for early layers, so internal
features can be adjusted for the final task rather than designed independently.
The resulting gradient can be consumed by stochastic gradient descent, Adam, or
another first-order method.

## Intuition

In the forward pass, every node records what it computed. In the backward pass,
ask how a tiny change in each node would alter the final loss. A node sends that
sensitivity to its inputs after weighting it by its local slope. If two branches
use the same value, their sensitivities add because changing that value affects
the loss through both routes.

The picture can fail numerically even when the calculus is correct. Repeatedly
multiplying Jacobians with singular values much smaller or larger than one can
make early gradients vanish or explode. Architecture and initialization control
that transport; backpropagation merely reports it.

## Concrete example

Let one training example use

$$
a=wx,
\qquad
h=a^2,
\qquad
\widehat y=vh,
\qquad
L=\frac12(\widehat y-y)^2.
$$

Take $x=2$, $w=3$, $v=0.5$, and $y=10$. The forward pass gives
$a=6$, $h=36$, $\widehat y=18$, and $L=32$. Start backward with
$\partial L/\partial L=1$. The local calculations are

$$
\frac{\partial L}{\partial\widehat y}=\widehat y-y=8,
\qquad
\frac{\partial L}{\partial v}=8h=288,
$$

$$
\frac{\partial L}{\partial h}=8v=4,
\qquad
\frac{\partial L}{\partial a}=4(2a)=48,
$$

$$
\frac{\partial L}{\partial w}=48x=96.
$$

Direct substitution gives
$L(w)=\tfrac12(0.5(2w)^2-10)^2$; differentiating at $w=3$ also yields
$96$. The agreement is a small gradient check.

## Formal treatment

Suppose a directed acyclic computational graph has node values

$$
v_i=f_i(v_{\operatorname{pa}(i)}),
$$

and scalar output $L$. Define the adjoint
$\bar v_i=\partial L/\partial v_i$. Reverse mode initializes
$\bar L=1$ and, in reverse topological order, applies

$$
\bar v_j\mathrel{+}=
\bar v_i\frac{\partial v_i}{\partial v_j}
\quad\text{for every }j\in\operatorname{pa}(i).
$$

For vector nodes, the operation is a vector–Jacobian product; implementations
need not construct the full Jacobian. Accumulation is essential when one value
feeds several successors. Parameters are ordinary leaf nodes, so their final
adjoints are the gradient of the loss.

The computation cost is a small constant multiple of the forward graph for
common operations, but memory is needed for intermediates or they must be
recomputed. Nondifferentiable points require a documented subgradient or
implementation convention.

## Assumptions and requirements

The forward program must consist of operations with known derivative rules and
must preserve enough information for those rules. Shapes, broadcasting,
parameter sharing, branches, and mutation must be represented correctly in the
graph. The objective must be scalar for the standard reverse-mode efficiency
argument, although vector outputs can be handled with supplied cotangents.

Differentiability alone does not make the objective well conditioned. Saturated
activations, long products, discontinuous control flow, and finite-precision
arithmetic can make gradients uninformative or unstable. Random and stateful
operations require a precisely replayed forward state during recomputation.

## Uses and applicability

Backpropagation trains feedforward, convolutional, recurrent, attention-based,
and many differentiable scientific models. It also computes sensitivities for
saliency, meta-learning, and differentiable optimization components. Whenever
there are many inputs or parameters and few scalar outputs, reverse mode is the
natural derivative direction.

It is not appropriate as stated for a black-box simulator with no derivative
rules, a truly discrete decision with no differentiable relaxation, or a task
where derivatives are overwhelmed by noise. Finite differences can test a
small implementation but scale poorly as a training method.

## Limitations and common mistakes

Backpropagation can demand substantial activation memory. Long or deep graphs
can produce vanishing or exploding gradients, and a correct gradient can still
lead an optimizer to a poor stationary point in a nonconvex landscape. Gradients
also describe local sensitivity, not causal influence or reliable global
explanations.

Common mistakes include overwriting instead of summing branch gradients,
forgetting reductions introduced by broadcasting, differentiating through stale
or detached values, updating parameters before every gradient has been
computed, confusing training and evaluation behavior in stateful layers, and
declaring correctness because the loss decreases. Finite-difference checks on
small deterministic cases remain valuable.

## Variants and alternatives

Forward-mode differentiation propagates tangents with the forward computation
and is attractive when inputs are few and outputs many. Reverse mode is the
opposite regime. Gradient checkpointing saves memory by recomputing selected
activations. Truncated backpropagation through time limits recurrent history,
changing the derivative being used. Symbolic differentiation rewrites formulas,
while numerical finite differences approximate derivatives through repeated
evaluations.

[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
works out the local rules for shared convolutional kernels and inputs.

## History and attribution

Rumelhart, Hinton, and Williams' 1986 paper demonstrated that back-propagated
errors could train internal representations in multilayer networks and helped
popularize the method in neural-network research. The registered deep-learning
text notes broader roots in chain-rule differentiation and dynamic programming,
so this page does not claim that the 1986 paper invented reverse-mode
differentiation itself.

## Sources

- _Deep Learning_, Chapter 6 supports the computational-graph algorithm,
  chain-rule reuse, cost, implementation issues, and distinction between
  gradient computation and optimization.
- Rumelhart, Hinton, and Williams support the multilayer learning procedure,
  representation-learning motivation, worked derivative structure, and 1986
  neural-network attribution.
- The full _Deep Learning_ text supports optimization, numerical, and
  architecture-related qualifications around gradient use.

## Prerequisites and next connections

Read [Multivariable Calculus](./multivariable-calculus.md) and
[Array Programming](./array-programming.md), then inspect
[Backpropagation Through Convolution](./backpropagation-through-convolution.md).
Continue to [Stochastic Optimization](./stochastic-optimization.md), stochastic
gradient descent, and Adam to see how computed gradients change parameters.
