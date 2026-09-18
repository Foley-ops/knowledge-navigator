---
concept_id: concept.deep_learning.clifford_neural_networks
title: Clifford Neural Networks
slug: /concepts/clifford-neural-networks
aliases:
  - Clifford neural layers
kind: concept
tier: 1
review_state: generated-draft
summary: A layer family in which each feature is a multivector and the linear operation is the geometric product, so that scalar, vector and bivector parts of a physical field are mixed according to the algebra rather than treated as unrelated channels.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.algebra.clifford_algebra
    note: The layer is defined by the geometric product and the grade decomposition, so a reader who does not already know what $\mathrm{Cl}_{p,q}(\mathbb{R})$ is cannot read the weight equation at all.
  - type: generalizes
    target: concept.deep_learning.quaternion_neural_networks
    note: A quaternion layer is the special case $\mathrm{Cl}_{0,2}(\mathbb{R}) \cong \mathbb{H}$, and the Hamilton-product weight sharing is exactly the left-multiplication constraint written here for a general signature.
  - type: used_to_solve
    target: concept.analysis.partial_differential_equations
    note: The layers were introduced as surrogates for time-stepping fluid and electromagnetic PDEs, where the state is a mixture of scalar and vector fields rather than a stack of independent channels.
  - type: contributes_to
    target: concept.deep_learning.equivariance
    note: The Clifford-group construction supplies a family of layers that are exactly equivariant to the orthogonal group of the quadratic form, while the plain Clifford layers are not — the distinction is one of the things this page exists to state.
sources:
  - source_id: source.nicolaescu.geometry_of_manifolds
    title: Lectures on the Geometry of Manifolds
    url: https://academicweb.nd.edu/~lnicolae/Lectures.pdf
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
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
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
    checked_on: 2026-09-17
unresolved_references:
  - label: Clifford neural layers for PDE modelling (Brandstetter, van den Berg, Welling and Gupta, 2022)
    reason: The registry has no source for the paper that introduced Clifford convolution and Clifford Fourier layers, so its architecture details and its fluid- and Maxwell-benchmark results are described here without a citation.
    sections:
      - definition
      - uses-and-applicability
      - history-and-attribution
  - label: Clifford group equivariant neural networks and geometric Clifford algebra networks (Ruhe and co-authors, 2023)
    reason: The registry has no source for the two 2023 papers that build equivariant layers from twisted conjugation and from group actions; the equivariance statement given here follows from the algebra, but the specific constructions are uncited.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: Quaternion and hypercomplex neural network literature of the 1990s and 2000s
    reason: No registry source covers Pearson and Bisset, Buchholz and Sommer, or the later quaternion CNN and RNN work, so the prehistory is stated from memory and should be checked before this page leaves draft state.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Clifford neural networks** are networks whose features are multivectors in a
Clifford algebra $\mathrm{Cl}_{p,q}(\mathbb{R})$ and whose linear operation is
the geometric product with multivector weights. Where an ordinary layer holds
one real number per channel and multiplies it by a real weight, a Clifford layer
holds $2^n$ numbers per channel ($n = p + q$), read as a scalar part, a vector
part, a bivector part and so on up to the pseudoscalar, and multiplies by a
weight multivector using the algebra's multiplication table. The algebra itself
is set out in [Clifford Algebra](./clifford-algebra.md) and, in the real
computational dress used here, in [Geometric Algebra](./geometric-algebra.md).
A _Clifford convolution_ is the same substitution inside a
[Convolutional Layer](./convolutional-layer.md): each kernel tap is a
multivector and each tap-times-input is a geometric product.

## Why it matters

The state of a fluid is a scalar pressure and a vector velocity. The state of an
electromagnetic field is a vector and a bivector. A standard network flattens
these into an undifferentiated channel stack and has to learn from data that
rotating the domain rotates the velocity but leaves the pressure alone, and that
the two interact in a particular bilinear way. A Clifford layer cannot learn
otherwise: the weight acts through the algebra, so a bivector weight rotates and
scales the vector part of the feature rather than applying an arbitrary linear
map to its coordinates.

The bet is a sample-efficiency bet of the kind that geometric deep learning
makes generally — encode the symmetry and the type structure of the data in the
layer, and less of the training budget is spent rediscovering them. Whether the
bet pays for Clifford layers specifically is an empirical question with a small
and recent evidence base, not a theorem.

## Intuition

Start with complex-valued networks. Multiplying a feature $(a, b)$ by a complex
weight is a rotation-and-scaling of the plane: two free parameters, not the four
of a general $2 \times 2$ matrix. Quaternion layers do the same in four
dimensions through the Hamilton product. Clifford layers are the general
statement: choose a quadratic form, get an algebra, and the algebra's
left-multiplication matrices become the only weight matrices the layer is
allowed.

The analogy breaks at an important place. Multiplication by a complex number is
conformal, and by a unit quaternion is orthogonal; multiplication by a general
multivector in $\mathrm{Cl}_{3,0}$ is neither. It is simply a structured
$8 \times 8$ matrix with $8$ free entries. The structure buys weight sharing and
a grade-aware coupling between parts — it does not, by itself, buy any
invariance or equivariance.

## Concrete example

Take $\mathrm{Cl}_{2,0}(\mathbb{R})$ with basis $(1, e_1, e_2, e_{12})$,
$e_1^2 = e_2^2 = 1$, $e_{12} = e_1 e_2$, $e_{12}^2 = -1$. Writing
$a = a_0 + a_1 e_1 + a_2 e_2 + a_{12} e_{12}$, the geometric product is

$$
ab =
\begin{pmatrix}
a_0 b_0 + a_1 b_1 + a_2 b_2 - a_{12} b_{12} \\
a_0 b_1 + a_1 b_0 - a_2 b_{12} + a_{12} b_2 \\
a_0 b_2 + a_2 b_0 + a_1 b_{12} - a_{12} b_1 \\
a_0 b_{12} + a_{12} b_0 + a_1 b_2 - a_2 b_1
\end{pmatrix}.
$$

```python
import numpy as np

# Cl(2,0): components ordered (1, e1, e2, e12)
def geometric_product(a, b):
    a0, a1, a2, a12 = a
    b0, b1, b2, b12 = b
    return np.array([
        a0*b0 + a1*b1 + a2*b2 - a12*b12,
        a0*b1 + a1*b0 - a2*b12 + a12*b2,
        a0*b2 + a2*b0 + a1*b12 - a12*b1,
        a0*b12 + a12*b0 + a1*b2 - a2*b1,
    ])

w = np.array([0.5, 0.0, 0.0, 1.0])    # scalar + bivector
x = np.array([0.0, 2.0, -1.0, 0.0])   # the vector 2 e1 - e2
print(geometric_product(w, x))        # [ 0.   0.  -2.5  0. ]
```

The output is the pure vector $-2.5\,e_2$: the even weight $0.5 + e_{12}$ has
rotated $(2, -1)$ by $\arctan(1/0.5) \approx 63.4^\circ$ and scaled it by
$\lVert w \rVert = \sqrt{1.25} \approx 1.118$, and $\sqrt{5} \times 1.118 = 2.5$
confirms it. Four weight numbers did what a free $4 \times 4$ matrix would have
needed sixteen for, and the output stayed a pure vector because this particular
weight is _even_: even times odd is odd. That is a property of the weight, not
of the layer. The scalar row above contains $a_1 b_1 + a_2 b_2$, so a weight
with a vector part does leak the vector part into the scalar slot — $w = e_1$
sends the same $x$ to $2 - e_{12}$.

## Formal treatment

Let $x \in \mathrm{Cl}_{p,q}(\mathbb{R})^{C_{\text{in}}}$ be a multivector
feature vector. A Clifford linear layer is

$$
y_j \;=\; \sum_{i=1}^{C_{\text{in}}} w_{ij}\, x_i \;+\; b_j ,
\qquad w_{ij}, b_j \in \mathrm{Cl}_{p,q}(\mathbb{R}) ,
$$

with $w_{ij} x_i$ the geometric product. As a real map this is linear with
$2^n C_{\text{in}} C_{\text{out}}$ parameters, against
$4^n C_{\text{in}} C_{\text{out}}$ for an unconstrained real layer on the same
$2^n C_{\text{in}}$ inputs — a factor $2^n$ fewer parameters. The multiply-add
count is unchanged: each geometric product still costs $4^n$ multiply-adds, so
the saving is in parameters, not in compute.

Equivariance is where care is needed. A rotor $R \in \mathrm{Spin}(p,q)$ acts on
multivectors by twisted conjugation, $x \mapsto R x \tilde{R}$, an action that
preserves each grade. For the layer to commute with it we need
$w R x \tilde{R} = R w x \tilde{R}$ for all $x$, that is $wR = Rw$ for every
rotor: $w$ must lie in the centraliser of the even subalgebra. In
$\mathrm{Cl}_{3,0}$ that centraliser is $\operatorname{span}\{1, e_{123}\}$ —
two of the eight parameters, and the pseudoscalar changes sign under reflections,
so even those give $\mathrm{SO}(3)$ and not $\mathrm{O}(3)$. **A Clifford layer
with free weights is not rotation-equivariant**, and the geometric product is
not what makes a network equivariant.

What the Clifford _group_ construction does instead is to keep the weights out
of the way of the group action: coefficients are restricted to scalars and to
invariants computed from the inputs, and everything else is built from geometric
products and grade projections of the features themselves. Because twisted
conjugation is an algebra automorphism that preserves grades, such a map
satisfies the equivariance condition in the sense of Cohen and Welling,

$$
\Phi(\rho_{\text{in}}(g)\, x) \;=\; \rho_{\text{out}}(g)\, \Phi(x)
\quad \text{for all } g ,
$$

with $g$ ranging over $\mathrm{O}(p,q)$, the group the Clifford group surjects
onto. Translations are not included and must be handled separately, usually by
working with relative positions.

## Assumptions and requirements

The signature $(p, q)$ is a modelling choice, not a detail:
$\mathrm{Cl}_{0,2} \cong \mathbb{H}$ while $\mathrm{Cl}_{2,0} \cong
M_2(\mathbb{R})$, so a result obtained in one does not transfer to the other.

The grade assignment must be meaningful. Putting pressure in the scalar slot and
velocity in the vector slot is what makes the algebra's coupling the right
coupling; packing arbitrary channels into multivector slots gives a constrained
weight matrix with no geometric content, and the inductive bias is then just a
restriction.

Equivariance claims additionally require the _domain_ symmetry to exist. On a
pixel grid only the discrete symmetries of the grid are available, so a layer
that is exactly equivariant in its values is still only approximately equivariant
as a map on fields. Point clouds and meshes, which carry no grid, do not have
this problem.

Finally, $2^n$ is exponential. Dimensions $2$ and $3$ give $4$- and
$8$-component features and are practical; $n = 8$ would give $256$ numbers per
channel and a geometric product costing $65\,536$ multiply-adds.

## Uses and applicability

Reach for these layers when the field being modelled genuinely has mixed
geometric type in two or three dimensions: fluid velocity with pressure or
density, electric and magnetic fields, rigid-body motion, and the
[Partial Differential Equations](./partial-differential-equations.md) that govern
them. The equivariant Clifford-group variant is worth considering for molecular
and point-cloud tasks where $\mathrm{O}(3)$ symmetry is real and data is scarce.

Do not reach for them for text, tabular data, or images whose channels are colour
rather than geometry; there is nothing for the grades to mean. And do not reach
for them as a general parameter-reduction trick — an ordinary architecture with a
well-chosen width is a stronger baseline than a Clifford layer used only for its
weight sharing.

## Limitations and common mistakes

The dominant misconception is that using a Clifford algebra makes a network
equivariant. It does not, for the reason computed above, and the original PDE
layers do not claim it. Reading "geometric" as "equivariant" here will lead to
false expectations about rotated test data.

The second is the parameter-count-as-efficiency claim inherited from the
quaternion literature. Fewer parameters, identical multiply-adds, and in practice
often slower than a plain convolution of the same shape, because the structured
kernel is assembled before the matrix multiply.

The third is the nonlinearity. A component-wise ReLU on multivector components is
not equivariant under any rotation, since rotations mix components within a grade;
equivariant constructions gate by norms and other invariants instead. Applying the
usual activation to a Clifford feature and then claiming the network respects the
symmetry is a real error.

Last, adoption. This is a small, recent literature whose gains are reported on a
handful of PDE benchmarks against particular baselines at matched parameter
counts; they are empirical findings on those benchmarks, not established scaling
behaviour, and no large-scale confirmation exists. Treat the question as open.

## Variants and alternatives

**Clifford convolution** replaces each kernel tap with a multivector;
**Clifford Fourier layers** do the analogous substitution in a spectral operator
architecture. **Geometric Clifford algebra networks** parameterise layers as
group actions — sandwich products by rotors and reflections — rather than as free
left multiplications. **Clifford group equivariant networks** give exact
$\mathrm{O}(p,q)$ equivariance by restricting coefficients to invariants.
Quaternion and complex-valued networks are the $\mathrm{Cl}_{0,2}$ and
$\mathrm{Cl}_{0,1}$ special cases; degenerate signatures such as
$\mathrm{Cl}_{3,0,1}$ bring translations into the same algebraic framework.

The competing routes to the same goal are group convolution, which lifts the
feature map to the group and convolves there; steerable networks built from
spherical harmonics; and scalarisation, which computes invariants such as
distances and multiplies them back onto vector features. Group convolution is the
best understood and costs a group integral, scalarisation is the cheapest and the
least expressive, and the Clifford route is the newest and the least tested.

## History and attribution

Hypercomplex neural computation is older than the current wave: complex- and
quaternion-valued perceptrons were studied through the 1990s, and Clifford-valued
multilayer perceptrons were developed by Buchholz and Sommer in Kiel in the
2000s, with backpropagation worked out for general signatures. Quaternion
convolutional and recurrent networks returned around 2018 with the
parameter-sharing argument.

The current line begins with Clifford neural layers for PDE modelling
(Brandstetter, van den Berg, Welling and Gupta, 2022), whose problem was
surrogate modelling of fluid dynamics and Maxwell's equations. Two 2023 follow-ups
by Ruhe and co-authors added the group-action parameterisation and the
Clifford-group equivariant construction. No registry source covers any of these
papers, so this paragraph is flagged in `unresolved_references`.

## Sources

**Lectures on the Geometry of Manifolds** is the reference for the algebraic
facts used here: the geometric product, the grade decomposition, the spin groups
and the twisted conjugation action. **Group Equivariant Convolutional Networks**
supplies the definition of layer equivariance quoted in the formal treatment and
the group-convolution alternative. **Geometric Deep Learning** frames the
symmetry-as-inductive-bias argument that motivates the whole family. **Wolfram
MathWorld** covers the Clifford-algebra definitions and the low-dimensional
isomorphisms. No registry source covers the neural-network papers themselves.

## Prerequisites and next connections

Read [Clifford Algebra](./clifford-algebra.md) first, and
[Quaternions](./quaternions.md) if the geometric product is unfamiliar — the
quaternion case is the one where the sandwich formula can be checked by hand.
[Convolutional Layer](./convolutional-layer.md) supplies the convolution that
Clifford convolution modifies, and
[Translation Equivariance](./translation-equivariance.md) supplies the notion of
equivariance the rotational case generalises.

Afterwards, [Partial Differential Equations](./partial-differential-equations.md)
gives the problems these layers were built for, and
[Graph Neural Networks](./graph-neural-networks.md) gives the message-passing
scaffolding that the equivariant point-cloud variants are usually built on.
