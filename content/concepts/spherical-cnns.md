---
concept_id: concept.deep_learning.spherical_cnns
title: Spherical CNNs
slug: /concepts/spherical-cnns
aliases:
  - S2CNN
kind: method
tier: 1
review_state: generated-draft
summary: A convolutional architecture for signals on the sphere whose layers correlate over rotations instead of translations, so that rotating the input rotates every feature map exactly rather than scrambling it.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.equivariance
    note: The architecture exists only to satisfy an equivariance constraint, and its layers cannot be read as anything but the general definition applied to the rotation group.
  - type: specializes
    target: concept.deep_learning.geometric_deep_learning
    note: It is the sphere-and-rotation-group instance of the general recipe for building networks from a domain's symmetry group.
  - type: contrasts_with
    target: concept.deep_learning.convolutional_networks
    note: Both share weights across a transitive group action, but the planar network shares across translations of a grid, which is the wrong group for data on a sphere.
  - type: requires
    target: concept.analysis.harmonic_analysis
    note: The spherical-harmonic and Wigner-D expansions are what make the rotational correlation computable at all, so the formal treatment is unreadable without them.
sources:
  - source_id: source.cohen2018.spherical_cnns
    title: Spherical CNNs
    url: https://arxiv.org/abs/1801.10130
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
      - intuition
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - why-it-matters
      - intuition
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Sampling theorems and fast generalised Fourier transforms on the sphere and the rotation group
    reason: No registry source covers harmonic analysis on $S^2$ or $\mathrm{SO}(3)$, so the exactness conditions of the discrete transform and the complexity figures beyond what the Spherical CNNs paper itself reports are stated here from general knowledge and uncited.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Concurrent and successor rotation-equivariant architectures
    reason: The registry holds the two Cohen papers and the geometric deep learning proto-book but none of the spectral, point-cloud or mesh-discretisation alternatives, so the comparisons drawn in the variants section rest on nothing cited here.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

A **spherical CNN** replaces planar convolution with cross-correlation over
rotations. Its first layer takes a signal on the sphere,
$f : S^2 \to \mathbb{R}^K$, and a filter of the same type, and evaluates their
inner product after rotating the filter by every element of the rotation group
$\mathrm{SO}(3)$. The result is therefore a function on $\mathrm{SO}(3)$, not on
$S^2$; every subsequent layer correlates functions on $\mathrm{SO}(3)$ with
filters on $\mathrm{SO}(3)$. Composed with pointwise non-linearities, the whole
stack satisfies $\Phi(\Lambda_Q f) = \Lambda_Q \Phi(f)$ for every rotation $Q$,
where $\Lambda_Q$ is the action of $Q$ on functions.

## Why it matters

Much data is genuinely spherical: omnidirectional images, full-sky cosmological
maps, global climate fields, and 3D shapes or molecules rendered by casting rays
outward from a centre. The reflex is to unroll the sphere into a rectangle — an
equirectangular projection — and run an ordinary convolutional network on it.

That reflex fails on geometry, not engineering. No map from sphere to plane
preserves distances, so a fixed $3 \times 3$ filter spans a large solid angle
near the equator and a vanishingly small one near the poles: the same weights are
shared between patches that mean different things. And a rotation of the sphere
is not a translation of the projected image but a position-dependent warp, so planar
convolution — equivariant to translation and, as the standard treatment is
explicit, to neither rotation nor scale — guarantees a symmetry the data does not
have. Cohen et al. measured the cost: a planar CNN trained on unrotated spherical
digits and tested on rotated ones falls to roughly chance, around $11\%$, where a
spherical CNN of comparable size stays in the mid-nineties.

## Intuition

Planar convolution answers "slide the filter to every position and take an inner
product", the positions being the translation group. The sphere has no
translations; its transitive symmetry is rotation, so the question becomes
"rotate the filter to every orientation and take an inner product".

What surprises people is a matter of counting. A rotation has three degrees of
freedom: two say where the filter points, one says how it is spun about its own
pointing axis. All three change the inner product, so the answer is indexed by
$\mathrm{SO}(3)$, and the first layer maps a function on a two-dimensional domain
to a function on a three-dimensional one.

The camera analogy is honest — the picture depends on where you point and on how
you tilt your head — but it breaks twice. Rotations do not commute, which is why
the Fourier theory below is matrix-valued rather than scalar; and the domain
changes after the first layer, so unlike the planar stack this one is not
homogeneous.

## Concrete example

Take the degree-one harmonics, whose real basis is just the coordinate functions
$x, y, z$ restricted to the sphere. Let $f(\mathbf{u}) = \langle \hat{z},
\mathbf{u}\rangle = \cos\theta$, so its coefficient vector in the basis
$(x,y,z)$ is $(0,0,1)$.

Rotate by $R$, a quarter turn about the $y$-axis sending $\hat{z}$ to $\hat{x}$.
Then

$$
[\Lambda_R f](\mathbf{u}) = f(R^{-1}\mathbf{u}) = \langle \hat{z}, R^{-1}\mathbf{u}\rangle
= \langle R\hat{z}, \mathbf{u}\rangle = \langle \hat{x}, \mathbf{u}\rangle = \sin\theta\cos\varphi .
$$

The coefficient vector moved from $(0,0,1)$ to $(1,0,0)$ — rotated by the very
matrix $R$, because for $\ell = 1$ the irreducible representation of
$\mathrm{SO}(3)$ _is_ the defining one. No energy leaked into degree $0$ or
degree $2$, and the norm of the coefficient vector is unchanged. That last fact
is the whole trick: $\sum_m |\hat{f}^\ell_m|^2$ is a rotation-invariant number
for each $\ell$, and a rotation acts within each degree by an orthogonal matrix
and never across degrees.

## Formal treatment

Write $\Lambda_Q$ for the action $[\Lambda_Q f](x) = f(Q^{-1}x)$. The
**spherical correlation** of a filter $\psi$ with a signal $f$, both
$S^2 \to \mathbb{R}^K$, is

$$
[\psi \star f](R) \;=\; \int_{S^2} \sum_{k=1}^{K} \psi_k(R^{-1}x)\, f_k(x)\, \mathrm{d}x ,
\qquad R \in \mathrm{SO}(3),
$$

and the **rotation-group correlation**, used by every layer after the first, is

$$
[\psi \star h](R) \;=\; \int_{\mathrm{SO}(3)} \sum_k \psi_k(R^{-1}Q)\, h_k(Q)\, \mathrm{d}Q ,
$$

with $\mathrm{d}Q$ the Haar measure. Equivariance follows in one line from
invariance of the measure under the substitution $x \mapsto Qx$:
$\psi \star \Lambda_Q f = \Lambda_Q(\psi \star f)$.

The change of domain cannot be avoided by projecting the answer back to $S^2$:
that would require choosing, continuously and for every direction, a canonical
spin about it — a global section of the bundle $\mathrm{SO}(3) \to S^2$. None
exists, by the same obstruction that forbids a nowhere-zero continuous tangent
field on the sphere.

Computation goes through the generalised Fourier transform. On $S^2$,
$\hat{f}^\ell_m = \int_{S^2} f(x)\, \overline{Y^\ell_m(x)}\,\mathrm{d}x$ for the
spherical harmonics $Y^\ell_m$, $\ell \ge 0$, $|m| \le \ell$. On
$\mathrm{SO}(3)$, $\hat{h}^\ell = \int_{\mathrm{SO}(3)} h(R)\,
\overline{D^\ell(R)}\,\mathrm{d}R$, a $(2\ell+1) \times (2\ell+1)$ matrix, the
Wigner D-matrices $D^\ell$ being the irreducible representations of the group.
The convolution theorem generalises:

$$
\widehat{\psi \star f}^{\,\ell} \;=\; \hat{f}^\ell \, \big(\hat{\psi}^\ell\big)^{\dagger} ,
$$

an outer product of coefficient vectors in the $S^2$ case, a matrix product in
the $\mathrm{SO}(3)$ case. Correlation becomes per-degree linear algebra, exactly
as multiplication replaces convolution on the line.

In practice signals are band-limited to $\ell < B$ and sampled on a
$2B \times 2B$ grid on the sphere, $2B \times 2B \times 2B$ on the rotation
group. Evaluating the definition directly costs $O(B^6)$, the one complexity
figure Cohen et al. give; they use a generalised FFT instead, and the transform
they implement costs $O(B^4)$.

## Assumptions and requirements

The symmetry must really be the full rotation group. Indoor $360^\circ$
photographs and climate fields have a meaningful up direction, so their true
symmetry is $\mathrm{SO}(2)$ about the vertical; imposing $\mathrm{SO}(3)$ then
enforces an invariance the task does not want and can cost accuracy. The group is
a modelling choice, and one larger than the data's symmetry is as much an error
as one smaller.

The signal must be approximately band-limited and sampled on a grid whose
quadrature the transform assumes; the standard implementation uses an equiangular
grid, and tessellations such as HEALPix need their own machinery. Partial or
masked spheres break exactness.

Equivariance itself is exact only in the continuum. A ReLU commutes with rotation
of the domain but does not preserve band limits: projecting the result back to
degrees below $B$ aliases. Cohen et al. measure the deviation and find it larger
with ReLUs than without but flat in depth at their bandwidths, which is a finding
about their setting rather than a theorem.

## Uses and applicability

Reach for a spherical CNN when the input has no preferred orientation and the
answer must not depend on one. Cohen et al. demonstrate three settings:
recognising spherical images under arbitrary rotation, retrieving 3D shapes
rendered onto a surrounding sphere, and regressing molecular atomisation energies
from a spherical encoding of atomic environments — there ahead of every kernel
baseline they report and behind only an MLP trained on randomly permuted Coulomb
matrices. The argument covers full-sky cosmological maps and omnidirectional
imaging equally.

Do not reach for it when there is a canonical up, when the data is flat at the
scale in question, or when resolution matters more than symmetry: feature maps on
$\mathrm{SO}(3)$ grow cubically in bandwidth, which puts high-resolution
spherical networks out of reach on ordinary hardware. For a point cloud with full
Euclidean symmetry, an equivariant point network fits better.

## Limitations and common mistakes

The commonest error is to call the network rotation-invariant. It is
_equivariant_; invariance arrives only at the head, by integrating the final
feature map over $\mathrm{SO}(3)$ or by taking per-degree power spectra. Strip
that head off and the features still move with the input.

The second is to expect exact equivariance from code, for the aliasing reason
above; measure the deviation rather than assume it. The third is to forget the
domain change — the first layer's output carries an extra angular dimension, so
reading the method as if feature maps stayed on the sphere gives badly wrong cost
estimates.

The fourth is to treat random-rotation augmentation as an equivalent substitute.
It encourages invariance on the training distribution with no guarantee off it,
and does not make intermediate features transform correctly; that it needs more
data and capacity to match an equivariant model is a benchmark observation, not a
proved separation. A related trap in evaluation: rotating an equirectangular
image is not rotating a spherical signal.

## Variants and alternatives

**Group-equivariant CNNs** (Cohen and Welling, 2016) are the discrete ancestor:
weight sharing over the four- or eight-element symmetry groups of the square
grid, almost free in compute but equivariant to a handful of rotations only.
**Spectral-domain networks** keep feature maps as Fourier coefficients and build
non-linearities from Clebsch–Gordan products, making equivariance exact at the
cost of a more restricted, more expensive non-linearity. **Zonal-filter
approaches**, developed concurrently, constrain filters to be symmetric about
their axis so feature maps stay on $S^2$ — cheaper, strictly less expressive.
**Mesh and graph discretisations**, such as icosahedral grids or a HEALPix sphere
treated as a graph, scale far better but are equivariant only approximately.
**Steerable and tensor-field point networks** carry the same representation
theory into $\mathrm{E}(3)$ for point clouds. The cheapest alternative remains
augmentation, which costs nothing and guarantees nothing.

## History and attribution

Spherical CNNs were introduced by Taco Cohen, Mario Geiger, Jonas Köhler and Max
Welling in 2018, out of Cohen and Welling's 2016 group-equivariant CNNs, which
generalised weight sharing from translations to finite groups and left the
continuous case open. Closely related work appeared concurrently: the idea has
more than one 2018 origin.

The mathematics is far older. Spherical harmonics come from eighteenth-century
potential theory and the Wigner D-matrices from the quantum theory of angular
momentum; the Peter–Weyl theorem, proved in 1927, guarantees that functions on a
compact group decompose into matrix coefficients of irreducible representations,
and hence that the convolution theorem above holds at all. The sampling theorems
and fast transforms the architecture calls came from the applied harmonic
analysis literature of the 1990s.

## Sources

_Spherical CNNs_ is the reference for everything specific to this page: the two
correlations, the generalised Fourier theorem, the band-limited implementation,
the measured equivariance error and the experiments. _Group Equivariant
Convolutional Networks_ is the discrete predecessor and the clearest statement of
why weight sharing over a group generalises convolution. _Geometric Deep
Learning_ places both in one framework and supplies the discipline of choosing a
group that matches the data. _Deep Learning_, Chapter 9 is cited only for the
baseline it contradicts.

## Prerequisites and next connections

Read [Convolution](./convolution.md) and
[Translation Equivariance](./translation-equivariance.md) first: this page is
what happens when the group in that definition changes. You will also want
[Harmonic Analysis](./harmonic-analysis.md) and
[Fourier Analysis](./fourier-analysis.md) for the transform,
[Representation Theory](./representation-theory.md) for irreducible
representations, and [Spherical Geometry](./spherical-geometry.md) for why no
planar projection preserves the structure.

From here, [Lie Groups](./lie-groups.md) says what kind of object
$\mathrm{SO}(3)$ is and why it has a Haar measure,
[Convolutional Networks](./convolutional-networks.md) is the planar case to
compare against, and [Graph Neural Networks](./graph-neural-networks.md) is the
other answer to "the domain is not a grid".
