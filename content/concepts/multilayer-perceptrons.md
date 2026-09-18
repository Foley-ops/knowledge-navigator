---
concept_id: concept.deep_learning.multilayer_perceptrons
title: Multilayer Perceptrons
slug: /concepts/multilayer-perceptrons
aliases:
  - MLP
  - feedforward neural network
kind: concept
tier: 1
review_state: generated-draft
summary: The multilayer perceptron is the baseline neural architecture — a chain of affine maps separated by elementwise nonlinearities — and the nonlinearity is the only thing that stops the whole chain collapsing into one matrix.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: generalizes
    target: concept.deep_learning.perceptron
    note: A single weight matrix with a threshold is the one-unit, no-hidden-layer case; the MLP adds hidden layers and a differentiable activation so the whole stack can be trained by gradient descent.
  - type: requires
    target: concept.linear_algebra.matrix_theory
    note: Every layer is a matrix-vector product plus a bias, and the collapse argument is a statement about products and ranks of those matrices.
  - type: prerequisite_of
    target: concept.deep_learning.transformers
    note: A transformer block is attention plus a position-wise MLP, so the block cannot be read without already knowing what the feedforward sublayer computes.
  - type: contrasts_with
    target: concept.deep_learning.convolutional_networks
    note: A dense layer imposes no locality or weight sharing, which is precisely the structural prior a convolutional network adds and pays for in parameters saved.
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
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.he2015.delving_deep_into_rectifiers
    title: 'Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification'
    url: https://arxiv.org/abs/1502.01852
    source_kind: preprint
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.liu2024.kolmogorov_arnold_networks
    title: 'KAN: Kolmogorov-Arnold Networks'
    url: https://arxiv.org/abs/2404.19756
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary statements of the universal approximation theorem
    reason: The registry has no Cybenko (1989), Hornik-Stinchcombe-White (1989) or Leshno et al. (1993), so the precise hypotheses and the non-polynomial condition are taken from a secondary text's summary rather than from the original statements.
    sections:
      - formal-treatment
      - history-and-attribution
claims: []
---

## Definition

A **multilayer perceptron** alternates two kinds of step: an affine map
$h \mapsto Wh + b$ with learned parameters, and a fixed nonlinearity applied to
each coordinate of the result independently. Layers that are neither input nor
output are **hidden layers**; the final affine map is usually left unactivated so
the output can be any real vector, the loss supplying whatever squashing is
needed. Every unit sees every unit in the layer before it, which is why these
layers are also called **dense** or **fully connected**.

## Why it matters

The MLP assumes nothing about the input beyond its length — no adjacency, no
ordering, no repeated structure — which makes it the baseline everything else is
measured against: an architecture that beats it is telling you something specific
about the task, and the size of the gap is the value of that prior.

It is also not a baseline that got replaced. The position-wise feedforward
sublayer of a transformer block is an MLP, and in most large language models
those sublayers hold the majority of the parameters; classification heads and
projections between representation spaces are MLPs too. What one can and cannot
do is what most of a modern network's weights are doing.

## Intuition

Each hidden unit computes a score $w^\top x + b$ and bends it. With a ReLU the
bend is a hinge: the unit is silent on one side of a hyperplane and linear on the
other. A layer of such units carves the input into polyhedral regions and the
next layer takes linear combinations of the hinges, so the function is piecewise
linear with the pieces placed by learning.

The analogy worth carrying is a basis you get to choose. A linear model fits
$\sum_i v_i \phi_i(x)$ with the features $\phi_i$ fixed in advance; the MLP
trains the $\phi_i$ too. The analogy breaks where it matters: because the
features move, the objective is no longer convex, and two runs from different
random starts land on genuinely different functions.

## Concrete example

XOR is not linearly separable, so no single affine map plus threshold represents
it. One hidden layer of two ReLU units does, exactly. Take

$$
W^{(1)} = \begin{bmatrix} 1 & 1 \\ 1 & 1 \end{bmatrix}, \quad
b^{(1)} = \begin{bmatrix} 0 \\ -1 \end{bmatrix}, \quad
w^{(2)} = \begin{bmatrix} 1 \\ -2 \end{bmatrix}, \quad b^{(2)} = 0 .
$$

For $x = (1,1)$ the pre-activation is $(2,1)$, the ReLU leaves it alone, and the
output is $1 \cdot 2 + (-2) \cdot 1 = 0$. All four inputs:

```python
import numpy as np

W1 = np.array([[1., 1.], [1., 1.]])
b1 = np.array([0., -1.])
w2 = np.array([1., -2.])

def mlp(x):
    return w2 @ np.maximum(W1 @ x + b1, 0.)

print([float(mlp(np.array(x))) for x in [(0, 0), (0, 1), (1, 0), (1, 1)]])
# [0.0, 1.0, 1.0, 0.0]
```

Now delete the ReLU and keep the weights. The network becomes
$w^{(2)\top}(W^{(1)}x + b^{(1)}) = -x_1 - x_2 + 2$, returning $2, 1, 1, 0$. It is
monotone in $x_1 + x_2$, and no choice of the two matrices could make it
otherwise. That is the collapse, in four numbers.

## Formal treatment

Write $d_0$ for the input dimension, $d_1, \dots, d_L$ for the widths, and
$h^{(0)} = x \in \mathbb{R}^{d_0}$. Then

$$
h^{(\ell)} = \sigma_\ell\!\left(W^{(\ell)} h^{(\ell-1)} + b^{(\ell)}\right),
\quad \ell = 1, \dots, L-1, \qquad
f(x) = W^{(L)} h^{(L-1)} + b^{(L)},
$$

where $W^{(\ell)} \in \mathbb{R}^{d_\ell \times d_{\ell-1}}$,
$b^{(\ell)} \in \mathbb{R}^{d_\ell}$, and $\sigma_\ell : \mathbb{R} \to
\mathbb{R}$ is applied coordinatewise. All the $W^{(\ell)}$ and $b^{(\ell)}$ are
trained jointly.

**Collapse.** If every $\sigma_\ell$ is the identity then $f(x) = Wx + b$ with
$W = W^{(L)} \cdots W^{(1)}$ and a bias assembled from the $b^{(\ell)}$. Depth
buys nothing but a constraint, $\operatorname{rank}(W) \le \min_\ell d_\ell$: a
narrow linear stack is a low-rank linear model, not a richer one.

**Universal approximation.** Let $K \subset \mathbb{R}^{d_0}$ be compact,
$g : K \to \mathbb{R}$ continuous, and $\sigma$ continuous, bounded and
non-constant. For every $\varepsilon > 0$ there are a width $N$ and parameters
$v_i, b_i \in \mathbb{R}$, $w_i \in \mathbb{R}^{d_0}$ with

$$
\sup_{x \in K} \left| g(x) - \sum_{i=1}^{N} v_i\, \sigma(w_i^\top x + b_i) \right| < \varepsilon .
$$

Leshno and co-authors later showed that for locally bounded, piecewise-continuous
$\sigma$ the one-hidden-layer family is dense in $C(K)$ **if and only if**
$\sigma$ is not a polynomial, which brings ReLU inside the theorem.

Read what that statement withholds. It is existence, not construction: $N$ is
unbounded, and for some target families the width needed grows exponentially in
$d_0$ at fixed $\varepsilon$. Approximation is uniform on a _compact_ set, so
extrapolation off $K$ is uncovered. It concerns a single fixed $g$ you are
assumed to have, so it says nothing about estimating $g$ from samples or about
[Generalization](./generalization.md), and nothing about optimisation: the
parameters exist, but no theorem here claims gradient descent finds them. And it
is a statement about _width_, not an argument for depth.

## Assumptions and requirements

The activation must be non-polynomial for the density result; a quadratic one
gives polynomials of bounded degree and nothing more. Gradient training also
wants $\sigma$ differentiable almost everywhere. ReLU is not differentiable at
$0$, and the value every framework picks there is a convention, not a
mathematical fact — harmless, because the kink has measure zero.

Initialisation is a requirement, not a detail. Set every weight to the same
constant and all units in a layer compute the same thing and get the same
gradient forever: the permutation symmetry is never broken. Scale matters too —
He et al. showed that for rectifier networks the forward variance is preserved by
weights of variance $2/d_{\ell-1}$, and that in very deep stacks the wrong scale
prevents convergence rather than merely slowing it. See
[Initialization](./initialization.md). Biases are load-bearing as well: a
bias-free ReLU network is positively homogeneous,
$f(\alpha x) = \alpha f(x)$ for $\alpha > 0$, forcing $f(0) = 0$.

Finally, the input must be a fixed-length vector whose coordinates the
architecture assumes nothing about. Permute them all the same way, retrain, and
you get an equivalent model.

## Uses and applicability

Reach for an MLP when the input is already a meaningful fixed-length feature
vector and no structural prior is worth encoding: tabular features, learned
embeddings, the output of another encoder. Reach for it as a _component_ almost
always — the feedforward sublayer of a transformer block, the head on a frozen
backbone.

Do not reach for it as the whole model on raw images, audio or long sequences.
Flattening destroys adjacency the architecture must then relearn, and the
parameter cost is brutal: a dense layer from a flattened $224 \times 224 \times
3$ image to $4096$ units holds $150{,}528 \times 4096 \approx 6.2 \times 10^{8}$
weights before one feature is extracted, where a
[Convolutional Layer](./convolutional-layer.md) needs thousands. On tabular
problems gradient-boosted trees remain a strong default — an empirical
regularity, not a theorem, and still argued over.

## Limitations and common mistakes

The mistake this page exists to prevent is reading universal approximation as
"MLPs can learn anything". It is an existence result about width on a compact
set: nothing in it bounds the width, promises that training converges, or
promises that a network fitting the training set does anything sensible on new
data.

The second is thinking depth is what makes the network universal — one hidden
layer already suffices, and depth is defended on separate grounds. The third is
forgetting the collapse: stacking linear layers "to add capacity", or leaving an
activation out by accident, yields an affine map with a rank ceiling that trains
happily and is still a linear model.

Then the practical ones: ReLU units negative on the whole training set are dead
and get no gradient; sigmoid and tanh saturate and pass near-zero gradients
through deep stacks; permuting hidden units gives combinatorially many equivalent
minima, so "the optimum" is a misnomer. And a "two-layer MLP" means two weight
matrices to some authors and two hidden layers to others — state the widths.

## Variants and alternatives

Most variation is in the activation. Sigmoid and tanh were the historical
default; ReLU displaced them; PReLU learns the negative slope for almost no cost;
GELU and SiLU are smooth alternatives common in transformers; gated forms such as
SwiGLU split the hidden layer and multiply the halves, buying quality at the
price of width. Structurally,
[Residual Connection](./residual-connection.md)s and
[Layer Normalization](./layer-normalization.md) make many layers trainable, and
[Regularization](./regularization.md) trades fit for lower variance.

A different parameterisation is the Kolmogorov-Arnold network, which puts
learnable univariate splines on the edges instead of fixed nonlinearities on the
nodes, motivated by the Kolmogorov-Arnold representation theorem rather than by
universal approximation. It claims better accuracy per parameter and more
interpretable components on small scientific problems, and is slower per
parameter and unproven at scale.

Outside the neural family, [Kernel Methods](./kernel-methods.md) and Gaussian
processes also approximate arbitrary continuous functions, with a convex fit and
calibrated uncertainty, at a cost growing in training points rather than
parameters; tree ensembles trade smoothness for robustness on tabular features.

## History and attribution

Rosenblatt's [Perceptron](./perceptron.md) (1958) was a single layer, and its
inability to represent XOR — made famous by Minsky and Papert's 1969 analysis —
is the concrete failure hidden layers answer. Multilayer networks were understood
long before they could be trained; what was missing was a way to assign credit to
hidden units. Reverse-mode differentiation has several independent origins, and
the 1986 paper of Rumelhart, Hinton and Williams is what made it standard
practice for neural networks, framed explicitly as learning useful internal
representations. See [Backpropagation](./backpropagation.md).

Universal approximation was proved independently around 1989 by Cybenko and by
Hornik, Stinchcombe and White, and extended in 1993 by Leshno, Lin, Pinkus and
Schocken. The modern revival owes less to theory than to rectifiers, better
initialisation, large labelled datasets and GPUs.

## Sources

**Deep Learning, Chapter 6** is the backbone of this page: the layered
definition, the XOR construction, universal approximation with an explicit
account of what it does not deliver, hidden-unit choices, and historical notes.
**Learning representations by back-propagating errors** is the primary source for
training hidden layers by gradient descent. **Delving Deep into Rectifiers**
supplies the initialisation scaling, the evidence that the wrong scale stops deep
networks converging, and PReLU. **KAN** is the spline alternative.

## Prerequisites and next connections

Read [Perceptron](./perceptron.md) first for the single-layer case and the
limitation that motivates hidden layers, and enough
[Matrix Theory](./matrix-theory.md) to see why a product of weight matrices
carries a rank ceiling. Then [Backpropagation](./backpropagation.md) for how the
gradient is computed,
[Stochastic Gradient Descent](./stochastic-gradient-descent.md) for what consumes
it, [Loss Functions](./loss-functions.md) for the objective and
[Initialization](./initialization.md) for the starting point.

From here, [Convolutional Layer](./convolutional-layer.md) shows what a
structural prior buys, and [Generalization](./generalization.md) with
[VC Dimension](./vc-dimension.md) covers the gap between approximating a function
and learning one.
