---
concept_id: concept.deep_learning.perceptron
title: Perceptron
slug: /concepts/perceptron
aliases:
  - perceptron classifier
kind: algorithm
tier: 1
review_state: generated-draft
summary: The perceptron is a binary linear classifier and mistake-driven learning algorithm that updates its weight vector only when a labeled example is classified incorrectly or without positive margin.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: implements
    target: concept.learning.supervised_learning
    note: The perceptron learns a binary predictor from labeled examples using prediction mistakes as its training signal.
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: Its score is an inner product between an input vector and a learned weight vector.
  - type: contrasts_with
    target: concept.machine_learning.logistic_regression
    note: Both use a linear score, but logistic regression fits a probabilistic likelihood while the perceptron applies mistake-driven updates.
sources:
  - source_id: source.rosenblatt1958.perceptron
    title: 'The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain'
    url: https://psycnet.apa.org/doi/10.1037/h0042519
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
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
unresolved_references:
  - label: Primary source for the perceptron convergence theorem
    reason: The registered learning-theory text proves a mistake bound, but this draft does not have a registered primary paper establishing the theorem's original attribution.
    sections:
      - history-and-attribution
  - label: Defining sources for the averaged and pocket perceptron variants
    reason: The registered learning-theory text covers the batch and online perceptron but not the averaging or pocket modifications, and the registry contains no source that defines either, so both are named without attribution here.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

The **perceptron** is a binary linear classifier together with a mistake-driven
training rule. For input $x\in\mathbb R^d$, weights $w$, and bias $b$, it
predicts from the sign of

$$
s(x)=w^\top x+b.
$$

Using labels $y\in\{-1,+1\}$, a training example is correct with positive
margin when $y(w^\top x+b)>0$. On a mistake or nonpositive margin, the basic
algorithm updates

$$
w\leftarrow w+yx,
\qquad
b\leftarrow b+y.
$$

The word can refer to the threshold unit, the resulting classifier, or the
learning algorithm. This page emphasizes the classifier and its classical
online update, not an arbitrary multilayer neural network.

## Why it matters

The perceptron makes several foundational ideas explicit in one small algorithm:
features become a dot product, a hyperplane separates two classes, and learning
happens by moving the separator toward a misclassified positive example and away
from a misclassified negative one. It is simple enough to prove a finite mistake
bound under linear separability.

It also marks an important boundary. A single perceptron represents only a
linear decision boundary. Problems that require combining several regions need
new features, kernels, or multiple units and layers. Understanding this limit
prevents “neural network” from obscuring what one thresholded affine map can
actually express.

## Intuition

The weight vector is perpendicular to a decision hyperplane. When a positive
example falls on the negative side, adding its feature vector rotates and shifts
the score toward classifying it positively. When a negative example is wrong,
adding $yx=-x$ pushes in the opposite direction.

This geometric picture assumes feature coordinates have meaningful scale. A
large coordinate can dominate an update regardless of its predictive value. It
also hides ordering: the online algorithm's intermediate weights and, for
nonseparable data, its continuing mistakes depend on the sequence of examples.

## Concrete example

Ignore the bias by appending a constant feature, and start with $w_0=(0,0)$.
Present positive example $x_1=(2,1)$ with $y_1=+1$. Its margin is zero, so

$$
w_1=w_0+y_1x_1=(2,1).
$$

Next present $x_2=(-1,-2)$ with $y_2=-1$. Its score is
$w_1^\top x_2=-4$, hence margin $y_2(-4)=4>0$ and no update occurs. Present
$x_3=(-2,1)$ with $y_3=+1$. Its score is $-3$, so the update gives

$$
w_2=(2,1)+(+1)(-2,1)=(0,2).
$$

The new scores are $2$, $-4$, and $2$ for the three examples, so all are
correct. This sequence illustrates updates, not a guarantee that one pass
suffices for every separable dataset.

## Formal treatment

Absorb the bias into augmented vectors when desired. Suppose there is a unit
vector $u$ and margin $\gamma>0$ such that for every training pair,

$$
y_i u^\top x_i\geq\gamma,
\qquad
\|x_i\|_2\leq R.
$$

After $M$ mistakes, repeated updates give progress
$u^\top w_M\geq M\gamma$. Meanwhile, because an update occurs only when
$y_iw^\top x_i\leq0$,

$$
\|w_M\|_2^2
=\|w_{M-1}\|_2^2
+2y_iw_{M-1}^\top x_i+\|x_i\|_2^2
\leq\|w_{M-1}\|_2^2+R^2,
$$

so $\|w_M\|_2\leq R\sqrt M$. Cauchy-Schwarz then implies
$M\gamma\leq R\sqrt M$, hence

$$
M\leq\left(\frac{R}{\gamma}\right)^2.
$$

This is a mistake bound, not a claim that the returned separator maximizes
margin or produces calibrated probabilities.

## Assumptions and requirements

The finite mistake guarantee requires strict linear separability with positive
margin and bounded input norms. If labels conflict or classes overlap, the basic
algorithm may update forever. Feature scaling changes $R$, margins, and update
magnitudes. The tie convention at score zero must be defined consistently with
the update rule.

Data order affects the path and can affect the final separator. A bias requires
an explicit update or augmented feature. Multiclass use needs a specified
extension; the binary theorem cannot simply be quoted unchanged. Evaluation
must use held-out data because convergence on a separable training set says
nothing by itself about [Generalization](./generalization.md).

## Uses and applicability

Use the perceptron as a transparent online baseline for binary classification,
as an introduction to linear decision geometry, or where rapid sparse updates
matter more than probabilistic outputs. It can be effective when features make
the classes nearly linearly separable and examples arrive sequentially.

Do not use the basic form when calibrated probabilities, nonlinear boundaries,
or stable behavior under nonseparable noise are requirements. A zero training
mistake count only establishes separation of the observed sample. If features
do not expose the needed boundary, more passes cannot repair representation.

## Limitations and common mistakes

The classifier cannot represent XOR in its original two-dimensional features
because no line separates the positive diagonal from the negative diagonal.
On nonseparable data it need not settle. Its final weights depend on order, and
the raw score is not a probability. The algorithm also optimizes mistakes
implicitly rather than minimizing a smooth likelihood.

Common mistakes include updating on correctly classified points, reversing the
label sign, forgetting the bias, interpreting score magnitude as calibrated
confidence, quoting the convergence theorem without checking separability, and
calling a single threshold unit a deep network. Another is comparing it with
logistic regression after giving the two methods differently scaled features.

## Variants and alternatives

The averaged perceptron averages weight vectors across updates to reduce
sensitivity to the final example order, and a pocket-style procedure retains the
best observed weights for nonseparable data; the registry does not contain a
defining source for either. Multiclass variants keep one weight vector per class.
Kernelization replaces explicit features with similarity evaluations, connecting
the algorithm to [Kernel Methods](./kernel-methods.md).

[Logistic Regression](./logistic-regression.md) uses the same affine score but
fits a probabilistic model with log loss. Support vector machines optimize a
margin objective. Decision trees represent nonlinear axis-aligned partitions.
Multiple threshold units arranged in layers lead toward multilayer perceptrons,
whose page belongs to the next batch and is deliberately not created here.

## History and attribution

Frank Rosenblatt's registered 1958 paper presented the perceptron as a model for
information storage and organization and is the primary source for that named
system. The modern online update and mistake-bound treatment are supported here
by Shalev-Shwartz and Ben-David. Because the registry lacks the primary source
for the convergence theorem, this page does not assign its original priority or
date.

## Sources

- Rosenblatt supports the named perceptron, its thresholded weighted-input
  framing, motivations, limitations of the historical model, and 1958
  attribution.
- Shalev-Shwartz and Ben-David support the binary online algorithm, geometric
  interpretation, separability assumptions, convergence proof, mistake bound,
  and modern alternatives.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) and [Matrix Theory](./matrix-theory.md)
for dot products and hyperplanes, then [Supervised Learning](./supervised-learning.md)
for risk and evaluation. [Logistic Regression](./logistic-regression.md) and
[Support Vector Machines](./support-vector-machines.md) are the closest existing
linear-classification comparisons. Multilayer perceptrons are the next planned
architectural connection, but Batch 19 has not been started.
