---
concept_id: concept.algebra.lie_algebras
title: Lie Algebras
slug: /concepts/lie-algebras
aliases:
  - infinitesimal group
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: The linearisation of a continuous symmetry group — a vector space carrying an antisymmetric bracket that records, to first order, how far two infinitesimal motions fail to commute.
categories:
  - Mathematics/Algebra
primary_category: Mathematics/Algebra
relationships:
  - type: requires
    target: concept.linear_algebra.vector_spaces
    note: A Lie algebra is a vector space before it is anything else, and bilinearity of the bracket has no meaning without that structure.
  - type: requires
    target: concept.algebra.group_theory
    note: The bracket is defined by differentiating group conjugation, and subalgebras, ideals and quotients are the infinitesimal shadows of subgroups, normal subgroups and quotient groups.
  - type: contributes_to
    target: concept.algebra.representation_theory
    note: Representations of a connected Lie group are studied on its Lie algebra, where the irreducibles of a semisimple algebra are classified by highest weight.
  - type: used_to_solve
    target: concept.analysis.ordinary_differential_equations
    note: Lie built the theory to find continuous symmetries of differential equations, and the matrix exponential that solves a linear system is the exponential map of the general linear group.
sources:
  - source_id: source.mit_ocw.algebra_i
    title: MIT 18.701 Algebra I (Fall 2010)
    url: https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - concrete-example
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **Lie algebra** over a field $k$ is a $k$-vector space $\mathfrak{g}$ with a
bilinear **bracket** $[\cdot,\cdot] : \mathfrak{g} \times \mathfrak{g} \to
\mathfrak{g}$ satisfying

$$
[x,x] = 0 \quad \text{for all } x, \qquad
[x,[y,z]] + [y,[z,x]] + [z,[x,y]] = 0 ,
$$

the second condition being the **Jacobi identity**. Bilinearity with $[x,x]=0$
forces antisymmetry; the converse holds only in characteristic $\neq 2$, which is
why the alternating form is the axiom.

The bracket is not associative and has no identity element, so this is not a ring
in disguise. What matters is where it arises: every Lie group $G$ — a group that
is also a smooth manifold, with smooth multiplication and inversion — has a Lie
algebra $\mathfrak{g} = T_e G$, the tangent space at the identity, whose bracket
comes from differentiating conjugation.

## Why it matters

Group multiplication is nonlinear: the $3 \times 3$ rotation matrices form a
curved three-dimensional surface in nine-dimensional matrix space, and two
rotations cannot be added. The Lie algebra replaces that curved object with a
flat one. $\mathfrak{so}(3)$ is an honest three-dimensional vector space, so
questions about a continuous group become linear algebra.

Simple Lie algebras over $\mathbb{C}$ are classified completely — four
infinite families $A_n, B_n, C_n, D_n$ plus five exceptional ones. This is why a rotation is optimised as three unconstrained numbers rather than
nine constrained ones, why $[J_i, J_j] = i\hbar\,\varepsilon_{ijk}J_k$ fixes the
spectrum of angular momentum, and why $e^{At}$ solves $\dot{x}=Ax$.

## Intuition

The bracket measures the failure of two flows to commute. Follow $X$ for time
$s$, then $Y$ for time $t$, then undo both; to leading order

$$
\exp(sX)\exp(tY)\exp(-sX)\exp(-tY) = \exp\!\big(st\,[X,Y] + O(3)\big).
$$

So $[X,Y]$ answers, to first order, "how much does order matter?" Two rotations
about different axes do not commute, and $[L_1,L_2]=L_3$ says the discrepancy is
infinitesimally a rotation about the third axis.

The picture is a curved surface with a tangent plane glued on at the identity.
It breaks twice: a bare tangent space is only a vector space, while the
bracket remembers second-order information about multiplication. And a tangent
plane knows nothing about global shape: the algebra sees only the identity
component, blind to how many pieces the group has and how it is connected.

## Concrete example

Take $\mathfrak{so}(3)$, the $3 \times 3$ real antisymmetric matrices, with the
commutator bracket $[A,B] = AB - BA$. A basis:

$$
L_1 = \begin{bmatrix}0&0&0\\0&0&-1\\0&1&0\end{bmatrix},\quad
L_2 = \begin{bmatrix}0&0&1\\0&0&0\\-1&0&0\end{bmatrix},\quad
L_3 = \begin{bmatrix}0&-1&0\\1&0&0\\0&0&0\end{bmatrix}.
$$

Multiplying out, $L_1L_2$ has a single nonzero entry $1$ at $(2,1)$ and $L_2L_1$
a single $1$ at $(1,2)$, so $[L_1,L_2] = L_3$; cyclically,
$[L_i,L_j] = \sum_k \varepsilon_{ijk} L_k$. Those nine numbers are the whole
algebra.

Exponentiate. Since $L_3^2 = \mathrm{diag}(-1,-1,0)$ and $L_3^3 = -L_3$, the
series $\sum_k X^k/k!$ collapses to
$\exp(\theta L_3) = I + \sin\theta\, L_3 + (1-\cos\theta) L_3^2$, which is

$$
\begin{bmatrix}\cos\theta & -\sin\theta & 0\\ \sin\theta & \cos\theta & 0 \\ 0&0&1\end{bmatrix},
$$

rotation by $\theta$ about the $z$-axis — the Rodrigues formula
$\exp(\theta \hat{n}) = I + \sin\theta\,\hat{n} + (1-\cos\theta)\hat{n}^2$ for a
unit axis $n$, where $\hat{n}v = n \times v$. Under that identification
$\mathfrak{so}(3)$ is $(\mathbb{R}^3, \times)$ and the Jacobi identity is
$a\times(b\times c) + b\times(c\times a) + c\times(a\times b) = 0$. Already
$\exp(2\pi L_3) = I$: the exponential map is not injective.

## Formal treatment

Any associative algebra becomes a Lie algebra under $[a,b] = ab - ba$; the
$n \times n$ matrices give $\mathfrak{gl}(n,k)$, and by Ado's theorem every
finite-dimensional Lie algebra embeds in one. The **adjoint** map
$\mathrm{ad}_x(y) = [x,y]$ recasts the Jacobi identity as:
$\mathrm{ad} : \mathfrak{g} \to \mathfrak{gl}(\mathfrak{g})$ is a homomorphism,
each $\mathrm{ad}_x$ a derivation.

For a Lie group $G$, the **exponential map** $\exp : \mathfrak{g} \to G$ sends
$X$ to $\gamma(1)$, where $\gamma$ is the unique one-parameter subgroup with
$\gamma'(0) = X$; for matrix groups it is the power series. Its differential at
$0$ is the identity, so $\exp$ is a diffeomorphism from a neighbourhood of $0$
onto one of $e$. That local statement is the correspondence's whole
guaranteed strength. Globally:

- $\exp$ **need not be injective**: $\exp(2\pi L_3) = I$ in $SO(3)$, and the
  kernel of $\exp : \mathbb{R} \to S^1$ is a lattice.
- $\exp$ **need not be surjective**: in $SL(2,\mathbb{R})$ the image is the
  matrices of trace $> -2$ together with $-I$, so
  $\mathrm{diag}(-2,-\tfrac12)$ lies in the group but not the image. It _is_
  surjective for $G$ compact and connected, and a diffeomorphism for $G$ simply
  connected and nilpotent.
- The algebra **does not determine the group**. Setting
  $u_k = -\tfrac{i}{2}\sigma_k$ gives $[u_i,u_j]=\varepsilon_{ijk}u_k$, so
  $\mathfrak{su}(2) \cong \mathfrak{so}(3)$ as real Lie algebras — yet
  $SU(2) \cong S^3$ is simply connected and $SO(3) \cong SU(2)/\{\pm I\}$ is not.
  Likewise $\mathbb{R}$ and $S^1$ share the one-dimensional abelian algebra.

What it does give: every finite-dimensional real Lie algebra
integrates to a unique connected, simply connected Lie group $\tilde{G}$ (Lie's
third theorem, in Cartan's global form), and every other connected group with
that algebra is $\tilde{G}/\Gamma$ for a discrete central subgroup $\Gamma$. A
group homomorphism always differentiates; the converse integrates **only when the
source group is simply connected**, and otherwise only locally. Multiplication
near the identity is recovered by Baker–Campbell–Hausdorff,

$$
\log\!\big(\exp X \exp Y\big) = X + Y + \tfrac{1}{2}[X,Y]
+ \tfrac{1}{12}\big([X,[X,Y]] + [Y,[Y,X]]\big) + \cdots,
$$

convergent for small $X, Y$: every term is a bracket, which is the precise sense
in which the algebra knows the group locally.

Structure theory rests on the **Killing form**
$\kappa(x,y) = \mathrm{tr}(\mathrm{ad}_x\,\mathrm{ad}_y)$. In characteristic $0$
and finite dimension, $\mathfrak{g}$ is semisimple iff $\kappa$ is nondegenerate
(Cartan's criterion), and a real semisimple algebra comes from a compact group
iff $\kappa$ is negative definite — as for $\mathfrak{so}(3)$, where
$\kappa(L_i,L_j) = -2\delta_{ij}$.

## Assumptions and requirements

Nearly every theorem above assumes **finite dimension** and **characteristic
zero**. In characteristic $p$ the Killing form criterion and the classification
break down; the right objects are restricted Lie algebras. In infinite dimension
Lie's third theorem fails: not every Banach or Fréchet Lie algebra integrates to
a group.

The Dynkin classification further assumes an algebraically closed field. Over
$\mathbb{R}$ one complex algebra can have several non-isomorphic **real forms** —
$\mathfrak{su}(2)$ and $\mathfrak{sl}(2,\mathbb{R})$ share the complexification
$\mathfrak{sl}(2,\mathbb{C})$, hence the same finite-dimensional complex
representations, but have entirely different unitary representation theory.

Smoothness costs little: by Hilbert's fifth problem, a locally Euclidean
topological group carries a unique compatible smooth structure.
Connectedness costs a lot: $O(3)$ and $SO(3)$ have the same Lie algebra, and no
infinitesimal argument will distinguish them.

## Uses and applicability

Reach for a Lie algebra when a symmetry is continuous and you want to compute
with it. Linear ODE systems are the smallest case: $\dot{x}=Ax$ has solution
$x(t) = e^{At}x_0$, the one-parameter subgroup of $GL(n,\mathbb{R})$ generated by
$A$, so eigenvalue analysis of $A$ is stability analysis of the flow. Lie's own use
was broader: symmetries of a differential equation, used to reduce its order.

In physics the commutation relations _are_ the model.
$\mathfrak{su}(3)\oplus\mathfrak{su}(2)\oplus\mathfrak{u}(1)$ specifies the
Standard Model's gauge structure, and representations of $\mathfrak{su}(2)$ give
half-integer spin precisely because $SU(2)$, not $SO(3)$, is simply connected. In
robotics, vision and geometric machine learning, poses live in $SE(3)$ and
updates in $\mathfrak{se}(3)$: an optimiser steps freely in the algebra and
pushes the step to the group with $\exp$, so no orthonormality constraint is
violated. Equivariant architectures turn a symmetry requirement into a linear
condition on generators.

Not when the symmetry is discrete: permutation groups and lattice symmetries have
no Lie algebra, and ordinary representation theory is the tool. Nor when the
question is global — how many components, what is $\pi_1$.

## Limitations and common mistakes

The most frequent error is writing $\exp(X)\exp(Y) = \exp(X+Y)$. It holds only when
$[X,Y]=0$; otherwise BCH supplies correction terms, and ignoring them drifts
numerical work on $SE(3)$.

The second is over-reading the correspondence. "The Lie algebra determines the
Lie group" is false: it determines the simply connected group, every other
connected group with that algebra is a quotient of it by a discrete central
subgroup, and it says nothing about components outside the identity.

The third is assuming $\exp$ is onto, or that $\log$ is well defined. Recovering
an axis-angle vector from a rotation matrix is ambiguous at $\theta = \pi$ — the
axis is fixed only up to sign — and ill-conditioned near it; libraries
special-case this, and code that does not produces garbage where rotations are
largest.

Smaller traps: the bracket is not associative and has no unit. Elements of
$\mathfrak{so}(3)$ are antisymmetric, not orthogonal — adding two algebra
elements is meaningful, adding two rotation matrices is not. And physicists
insert an $i$ to keep generators Hermitian, since the commutator of two Hermitian
matrices is anti-Hermitian; mathematicians drop it. Same algebra, perennial sign
confusion.

## Variants and alternatives

By structure: **abelian**, **nilpotent**, **solvable**, **semisimple**,
**simple** — the Levi decomposition splits any finite-dimensional algebra in
characteristic $0$ into a solvable radical and a semisimple part.

Beyond finite dimension, **Kac–Moody** and **affine** algebras extend the
construction to generalised Cartan matrices that are no longer positive
definite, producing infinite-dimensional algebras (affine algebras are the
positive-semidefinite borderline case, still of finite rank), and the
**Virasoro** algebra is a central extension of vector fields on the circle. **Lie superalgebras** are
$\mathbb{Z}/2$-graded with a bracket symmetric on the odd part; **restricted**
Lie algebras carry the $p$-th power operation characteristic $p$ demands;
**Lie algebroids** generalise to bundles over a manifold.

The **universal enveloping algebra** $U(\mathfrak{g})$ trades the bracket for an
associative algebra with the same representations (Poincaré–Birkhoff–Witt gives
its basis); **quantum groups** deform it. Competing approaches: **algebraic
groups** and their Hopf-algebra duals handle characteristic $p$, and **Jordan
algebras** take the symmetric product $ab+ba$.

## History and attribution

Sophus Lie began the subject in the 1870s, seeking an analogue of Galois theory
for differential equations: continuous transformation groups explaining when an
equation can be integrated. His _infinitesimal transformations_ are what we now
call the Lie algebra, and the three "Lie theorems" are his. The Jacobi identity
is older, from Carl Jacobi's work on Poisson brackets.

Wilhelm Killing attempted the classification of simple complex Lie algebras
around 1888–1890; Élie Cartan's 1894 thesis corrected and completed it — the four
classical families and five exceptional algebras — and Cartan later, in 1930,
supplied the global form of Lie's third theorem. The name _Lie algebra_ is
generally credited to Hermann Weyl in the 1930s; earlier authors wrote
"infinitesimal group".

## Sources

MIT 18.701's final sessions cover $SU(2)$, $SO(3)$, one-parameter groups and the
Lie algebra in the matrix-group style used above: the check on the definition and
the $\mathfrak{so}(3)$ computation. MathWorld is a quick reference for the axioms
and variant names. MIT 18.03 covers the matrix exponential — the exponential
map before anyone calls it that. The geometric deep learning proto-book shows
continuous groups constraining neural architectures.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) first: the bracket is bilinear, and
bases and linear maps are used constantly. [Group Theory](./group-theory.md) is
the other half: subalgebras, ideals and quotients are infinitesimal versions of
subgroups, normal subgroups and quotients. The matrix exponential from [Matrix
Theory](./matrix-theory.md) and tangent spaces from [Multivariable
Calculus](./multivariable-calculus.md) make $\exp$ concrete rather than formal.

From here, [Representation Theory](./representation-theory.md) is the natural
next step, and [Ordinary Differential
Equations](./ordinary-differential-equations.md) shows the exponential map at
work in the setting that motivated it.
