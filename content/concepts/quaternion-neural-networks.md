---
concept_id: concept.deep_learning.quaternion_neural_networks
title: Quaternion Neural Networks
slug: /concepts/quaternion-neural-networks
aliases:
  - quaternion-valued neural networks
kind: concept
tier: 1
review_state: generated-draft
summary: Networks whose weights and activations are quaternions multiplied with the Hamilton product, which ties each block of sixteen real weights down to four and so trades layer capacity for a built-in four-dimensional coupling between channels.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.algebra.quaternions
    note: Every layer in the architecture is a Hamilton product, so a reader who does not already know the multiplication table, non-commutativity and the unit-quaternion sphere cannot follow what the layer computes.
  - type: specializes
    target: concept.deep_learning.clifford_neural_networks
    note: The quaternions are one particular Clifford algebra, so a quaternion layer is the fixed-signature instance of the general construction that builds a layer from geometric-algebra products.
  - type: contrasts_with
    target: concept.deep_learning.equivariance
    note: The Hamilton product constrains a layer by an internal algebraic action on the four components rather than by a transformation of the input domain, so the parameter saving looks like equivariant weight sharing but buys no invariance to any spatial symmetry.
  - type: contributes_to
    target: concept.deep_learning.geometric_deep_learning
    note: It is a worked instance of the programme's central move — derive a layer's weight sharing from structure the data already carries — and a useful test of how far that move goes when the structure is algebraic rather than geometric.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: The quaternion neural network literature
    reason: docs/source-registry.json holds no paper on quaternion, complex-valued or hypercomplex networks, so the named architectures (quaternion convolutional and recurrent layers, quaternion batch normalization, polar-form quaternion initialization, parameterized hypercomplex multiplication), the reported results on colour images and speech, and the attributions in the history section are cited to nothing in this corpus.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
  - label: Quaternionic analysis and quaternion differential calculus
    reason: No registry source covers hypercomplex analysis, so the rigidity statement that a globally quaternion-differentiable function must be affine, and the existence of HR and GHR calculi for writing gradient updates in quaternion form, rest on material this corpus cannot point at.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
---

## Definition

A **quaternion neural network** is a network whose weights, biases and
activations are elements of the quaternions $\mathbb{H}$, and whose linear layers
combine them with the Hamilton product rather than with real multiplication. A
quaternion dense layer maps $\mathbf{x} \in \mathbb{H}^m$ to
$\mathbf{y} \in \mathbb{H}^n$ by

$$
y_j \;=\; \phi\!\left( \sum_{i=1}^{m} w_{ji} \otimes x_i \;+\; b_j \right),
\qquad w_{ji}, b_j \in \mathbb{H},
$$

where $\otimes$ is quaternion multiplication and $\phi$ is applied _split_:
independently to each of the four real components. Because $\otimes$ is not
commutative, $w \otimes x$ and $x \otimes w$ define different layers, and left
multiplication is the usual convention.

The layer holds $4mn$ real numbers. A real dense layer of the same real width,
$\mathbb{R}^{4m} \to \mathbb{R}^{4n}$, holds $16mn$. See
[Quaternions](./quaternions.md) for the algebra itself.

## Why it matters

The saving is exact and easy to state: a quaternion layer at real width $4m$ by
$4n$ stores a quarter of the weights. For a layer with 512 quaternion units in
and out, that is 1,048,576 real weights against 4,194,304 for
`nn.Linear(2048, 2048)`. Where weight storage or transfer dominates — embedded
inference, a model that must be shipped — that is a real four-fold reduction.

But the saving is not compression of an existing model. It is a **weight-tying
constraint** imposed before training, exactly the same kind of move as the
parameter sharing that turns a dense layer into a convolution: the layer becomes
cheaper because it is no longer allowed to express most of the maps it used to.
The bet is that the maps it gives up were not needed, because the four real
components of each unit describe one coupled quantity — a colour, a direction, a
pose — rather than four unrelated channels.

## Intuition

Think of a real $1 \times 1$ convolution over four channels: an arbitrary
$4 \times 4$ matrix, sixteen free numbers, any mixing you like. A quaternion unit
is that same $4 \times 4$ block with twelve of its degrees of freedom spent in
advance: the block must be the matrix of "multiply by $w$", which for a unit $w$
is a rigid rotation of $\mathbb{R}^4$, and in general a rotation times a scale.

The two-dimensional version is the honest analogy. Restricting a $2\times 2$ real
matrix to $\bigl(\begin{smallmatrix} a & -b \\ b & a\end{smallmatrix}\bigr)$ makes
it complex multiplication: scale and rotate, two parameters instead of four. The
quaternion case is the same idea one Cayley–Dickson step up.

Where the analogy breaks matters. Left multiplication by a unit quaternion
rotates $\mathbb{R}^4$; it does **not** rotate the three imaginary components
among themselves, which is what conjugation $x \mapsto u x \bar{u}$ does. And
non-commutativity gives the layer a handedness the complex case does not have.

## Concrete example

Take a pixel as a pure quaternion, $x = 0 + 0.2i + 0.4j + 0.6k$, and the weight
$w = 0.5 + 0.5i + 0.5j + 0.5k$ (which has norm 1). Using
$(s_1, v_1)(s_2, v_2) = (s_1 s_2 - v_1 \cdot v_2,\; s_1 v_2 + s_2 v_1 + v_1 \times v_2)$:

- real part: $0 - (0.1 + 0.2 + 0.3) = -0.6$;
- vector part: $0.5\,(0.2, 0.4, 0.6) + (0.1, -0.2, 0.1) = (0.2,\, 0.0,\, 0.4)$,

so $w \otimes x = -0.6 + 0.2i + 0.0j + 0.4k$. Two things happened that a real
per-channel scaling could not do: the cross product mixed the three colour
components into each other, and the dot product pushed energy into the real
component, which started empty.

In code, the tied block structure is the whole implementation:

```python
import torch
from torch import nn

class QuaternionLinear(nn.Module):
    """H^n_in -> H^n_out, stored as 4 * n_in * n_out real weights."""
    def __init__(self, n_in, n_out):
        super().__init__()
        s = (n_out, n_in)
        self.wr = nn.Parameter(torch.randn(s) * 0.05)
        self.wi = nn.Parameter(torch.randn(s) * 0.05)
        self.wj = nn.Parameter(torch.randn(s) * 0.05)
        self.wk = nn.Parameter(torch.randn(s) * 0.05)

    def weight(self):                      # (4*n_out, 4*n_in), only 4*n_in*n_out free
        return torch.cat([
            torch.cat([self.wr, -self.wi, -self.wj, -self.wk], 1),
            torch.cat([self.wi,  self.wr, -self.wk,  self.wj], 1),
            torch.cat([self.wj,  self.wk,  self.wr, -self.wi], 1),
            torch.cat([self.wk, -self.wj,  self.wi,  self.wr], 1),
        ], 0)

    def forward(self, x):                  # x: (batch, 4*n_in), blocks ordered r,i,j,k
        return x @ self.weight().t()

layer = QuaternionLinear(512, 512)
print(sum(p.numel() for p in layer.parameters()))   # 1048576
```

## Formal treatment

Write $w = w_r + w_i i + w_j j + w_k k$. Left multiplication by $w$ is a real
linear map on $\mathbb{R}^4 \cong \mathbb{H}$ with matrix

$$
L(w) \;=\;
\begin{bmatrix}
w_r & -w_i & -w_j & -w_k \\
w_i & w_r & -w_k & w_j \\
w_j & w_k & w_r & -w_i \\
w_k & -w_j & w_i & w_r
\end{bmatrix},
\qquad
L(w)^{\top} L(w) \;=\; \lVert w \rVert^2 I_4 .
$$

Sixteen entries, four free numbers, each appearing four times with a fixed sign
pattern. Stacking gives the layer's real weight matrix in $\mathbb{R}^{4n \times 4m}$
as an $n \times m$ grid of such blocks, so the reachable linear maps form a
$4mn$-dimensional subspace of the $16mn$-dimensional space of all real linear
maps — a quarter of the dimension, and that is precisely where the parameter
saving comes from.

That subspace has an exact characterisation. Treating $\mathbb{H}^m$ as a right
$\mathbb{H}$-module, associativity gives $(wx)u = w(xu)$, so every quaternion
layer commutes with right multiplication by any fixed $u \in \mathbb{H}$; and
conversely the real linear maps that commute with the whole right action are
exactly the quaternion matrices. A quaternion layer is therefore the general
right-$\mathbb{H}$-linear map, and $4mn$ is the dimension of that space of
intertwiners.

Differentiability is where quaternion networks part company with real ones.
Requiring a genuine quaternion derivative — a limit independent of the direction
of approach, in the sense that mimics complex holomorphy — is so restrictive that
the only functions satisfying it globally are affine, $f(q) = a + q b$. There is
consequently no useful quaternion-analytic nonlinearity, and practice uses split
functions such as $\mathrm{ReLU}$ applied to each component. Training needs no
new calculus: the loss is real-valued and the parameters $(w_r, w_i, w_j, w_k)$
are real, so ordinary [backpropagation](./backpropagation.md) through $L(w)$
applies, with the four occurrences of each parameter accumulating four gradient
contributions. Quaternion-valued chain rules exist and are convenient for writing
update equations compactly, but they are bookkeeping over the same real
derivatives.

## Assumptions and requirements

The grouping of features into 4-tuples is a modelling decision, not a property of
the data, and results depend on it. Layer widths must be divisible by four, and
which feature becomes the real component is a choice with consequences: the real
and imaginary parts play different roles in the product.

The right-$\mathbb{H}$-linearity above holds for the linear map only. Split
activations, split normalization and split dropout do not commute with the right
action, so a stack of quaternion layers has no exact algebraic property as a
whole — the structure is a per-layer constraint, not a network-level guarantee.

The Hamilton product adds the four components together, so they must be on
comparable scales; a component a hundred times larger than the others dominates
every output. Quaternion batch normalization exists for this reason and whitens
against the full $4 \times 4$ covariance rather than four separate variances.
Initialization is a separate matter: drawing the four real parts independently
from the scheme you would use at real fan-in $4m$ already reproduces that layer's
output variance, because each output component still sums $4m$ products. The
quaternion schemes are aimed at the distribution of the weight as a whole rather
than at a variance correction: they sample a magnitude and a uniformly random
rotation axis and angle, and build $w$ in polar form.

## Uses and applicability

Reach for a quaternion layer when each site of the input genuinely carries three
or four numbers that transform together: colour pixels, 3D points and
orientations, inertial measurements, or an acoustic feature bundled with its
first and second time derivatives. Reach for it when weight count is the binding
constraint and a four-fold reduction is worth a capacity cut.

Do not reach for it for token embeddings, generic tabular features or any layer
where the grouping into fours is arbitrary. There the constraint is a pure
capacity loss with no matching structure in the data. And if the goal is simply a
smaller model, [pruning](./pruning.md), [quantization](./quantization.md) and
low-rank factorization are more general, apply to any architecture, and are far
better characterised empirically.

The published evidence is domain-specific and mostly at modest scale: gains
reported on colour imagery and on speech, at parameter counts far below current
large models. Whether the constraint helps at scale is not established, and
whether it helps at all depends on which real baseline is used — see below.

## Limitations and common mistakes

**Fewer parameters is not less compute.** The layer still performs $16mn$ real
multiply-accumulates, exactly as many as the real layer it replaces. Schemes
exist that compute a single quaternion product with eight real multiplications
instead of sixteen, at the cost of more additions, but on hardware tuned for
dense matrix multiplication a quaternion layer is usually _slower_ than the dense
layer of the same shape, because the block matrix must be assembled or the
product split into several smaller ones.

**Fewer parameters is not free capacity.** The constrained block cannot express
$\mathrm{diag}(1,2,3,4)$: forcing $L(w)$ diagonal forces $w_i = w_j = w_k = 0$
and hence $w_r I$. Most $4 \times 4$ mixings are simply unavailable.

**Comparing against the wrong baseline.** A quaternion network beating a real
network of the same _width_ has beaten a model with four times its parameters,
which is interesting. Beating a real network of the same _parameter count_ — the
one at half the real width — is a different and much stronger claim. Papers and
reimplementations differ on which they report, and the headline changes with the
choice.

**Assuming rotation equivariance.** Quaternions rotate 3D vectors by conjugation,
$x \mapsto u x \bar{u}$; a layer that only left-multiplies is not equivariant to
that action, and split activations break even the right-multiplication
equivariance it does have. A quaternion network is not a rotation-equivariant
network.

**Assuming a canonical convention.** Left versus right multiplication, and the
component ordering $(r,i,j,k)$ against $(i,j,k,r)$, differ between codebases.
Weights ported across a convention mismatch train, and train badly.

## Variants and alternatives

**Quaternion convolutions** apply the Hamilton product between quaternion kernel
entries and quaternion feature vectors, giving the same four-fold weight saving
per kernel. **Quaternion recurrent layers** and quaternion attention blocks
follow the same substitution. **Quaternion batch normalization** and polar-form
initialization are the supporting pieces a deep quaternion network needs.

**Complex-valued networks** are the two-dimensional case: a two-fold saving, a
mature signal-processing motivation, and the same rigidity problem, since
Liouville forbids a bounded non-constant entire activation.
**[Clifford algebra](./clifford-algebra.md) and
[geometric algebra](./geometric-algebra.md) networks** generalise to arbitrary
signature and dimension, buying flexibility at the cost of a much larger design
space. **Parameterized hypercomplex layers** keep the block structure but _learn_
the multiplication table instead of fixing it to Hamilton's, which recovers the
quaternion layer as a special case and allows a saving factor other than four —
at the price of losing the algebraic interpretation entirely.

## History and attribution

Hamilton found the quaternions in 1843 while trying to multiply triples; the
algebra long predates any use of it here. Neural applications began in the
1990s as an extension of complex-valued backpropagation: Nitta published a
quaternary version of the backpropagation algorithm in the mid-1990s, and Arena
and colleagues studied quaternion multilayer perceptrons and their approximation
properties over the same period. The idea then stayed marginal for two decades.

The modern revival dates to around 2018, with deep quaternion networks supplying
the normalization and initialization needed to train them at depth, quaternion
convolutional networks applied to colour images, and quaternion convolutional and
recurrent models applied to speech recognition, where the parameter saving was
the headline result. Parameterized hypercomplex layers, which learn the algebra
rather than assuming it, followed in the early 2020s. The line of work is
small and its central empirical question — whether the structural prior pays for
its lost capacity outside genuinely four-dimensional data — remains open.

## Sources

**Wolfram MathWorld** is the quickest check on the multiplication table, the
matrix representation of quaternion multiplication, and the standard account of
Hamilton's discovery. **MIT 18.701 Algebra I** supplies the algebraic setting —
rings, division algebras, modules and linear operators — that makes the
right-module characterisation of a quaternion layer precise. **Deep Learning,
Chapter 9** does not mention quaternions, but it is the clearest treatment of the
mechanism this page depends on: parameter sharing reduces a layer's parameter
count by constraining which functions it can represent. **Geometric Deep
Learning** gives the general framing in which a layer's weight sharing is derived
from structure rather than chosen, and is the reference for the equivariant
architectures that compete with this one.

## Prerequisites and next connections

Read [Quaternions](./quaternions.md) first — the Hamilton product, the
non-commutativity and the unit sphere are used on every line here. A working
knowledge of a [multilayer perceptron](./multilayer-perceptrons.md) and of the
[convolutional layer](./convolutional-layer.md) is assumed, and
[backpropagation](./backpropagation.md) explains why no special calculus is
needed to train one.

From here, [Clifford algebra](./clifford-algebra.md) and
[geometric algebra](./geometric-algebra.md) are the generalisation of the
construction beyond four dimensions, [complex numbers](./complex-numbers.md) the
two-dimensional case that motivated it, and [pruning](./pruning.md) and
[quantization](./quantization.md) the competing, architecture-agnostic answers to
the question of making a network smaller.
