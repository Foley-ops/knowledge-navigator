---
concept_id: concept.analysis.multivariable_calculus
title: Multivariable Calculus
slug: /concepts/multivariable-calculus
aliases:
  - calculus of several variables
  - multivariate calculus
kind: concept
tier: 1
review_state: generated-draft
summary: The calculus of functions of several variables, in which the derivative at a point is a linear map rather than a number, and whose chain rule is the identity backpropagation implements.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: generalizes
    target: concept.analysis.single_variable_calculus
    note: Setting n = m = 1 recovers the ordinary derivative, and each partial derivative is literally a one-variable derivative taken along a coordinate line.
  - type: requires
    target: concept.analysis.real_analysis
    note: Total differentiability is a limit statement about norms on an open set, so its content depends on the notions of limit, continuity and neighbourhood that real analysis makes precise.
  - type: prerequisite_of
    target: concept.deep_learning.backpropagation_through_convolution
    note: That backward pass is the multivariable chain rule applied to a linear layer, so its formulas are transposed-Jacobian products and cannot be derived without this page.
sources:
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.jax.documentation
    title: JAX documentation
    url: https://jax.readthedocs.io/en/latest/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_geometry
    title: MIT 18.950 Differential Geometry (Fall 2008)
    url: https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/
    source_kind: lecture-or-course
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.rumelhart1986.learning_representations
    title: Learning representations by back-propagating errors
    url: https://www.nature.com/articles/323533a0
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Multivariable calculus** is the differential and integral calculus of
functions $f : U \to \mathbb{R}^m$ on an open set $U \subseteq \mathbb{R}^n$. Its
organising move is to stop treating the derivative as a number: at $a \in U$ it
is the unique _linear map_ $Df(a) : \mathbb{R}^n \to \mathbb{R}^m$ — when one
exists — satisfying

$$
\lim_{h \to 0} \frac{\lVert f(a+h) - f(a) - Df(a)\,h \rVert}{\lVert h \rVert} = 0 .
$$

When it exists, $f$ is **totally differentiable** at $a$. Its matrix in the
standard bases is the Jacobian $J_f(a) \in \mathbb{R}^{m \times n}$ with entries
$\partial f_i / \partial x_j (a)$. With $m = 1$ that matrix is a row vector whose
transpose is the gradient $\nabla f(a)$; with $n = m = 1$ it is the single number
of one-variable calculus.

## Why it matters

Gradient-based learning stands entirely on this. A network is a composition of
maps between high-dimensional spaces, and training asks for the derivative of one
scalar loss with respect to millions of coordinates; that is affordable only
because the chain rule turns a composition's derivative into a product of
Jacobians, which may be associated in whichever order is cheapest. Elsewhere the
same machinery does the work: change of variables in a
multiple integral is governed by $\lvert \det J \rvert$, the implicit function
theorem turns an invertible Jacobian block into a local solution, and propagating
measurement error is a Jacobian applied to a covariance.

## Intuition

Differentiability means that under enough magnification the graph of $f$ stops
curving and becomes affine; the Jacobian is that affine map's linear part. The
gradient of a scalar field is the arrow pointing uphill, perpendicular to the
level set, and its length is the slope in that direction.

The analogy to break is that smoothness can be checked slice by slice. Partial
derivatives probe only the $n$ coordinate directions, while differentiability
demands one linear map approximating $f$ _uniformly in every direction at once_.
A surface can be well behaved along both axes and still be torn apart along the
diagonal — the difference between a definition that supports the chain rule and
one that does not.

## Concrete example

Take $f(x,y) = x^2 + 3xy$, so $\nabla f = (2x + 3y,\; 3x)$ and at $(1,2)$ the
gradient is $(8,3)$. The directional derivative along the unit vector
$u = (3/5, 4/5)$ is $8 \cdot 0.6 + 3 \cdot 0.8 = 7.2$; steepest ascent is along
$(8,3)/\sqrt{73}$ at rate $\sqrt{73} \approx 8.544$.

Now compose with the circle $x(t) = \cos t$, $y(t) = \sin t$. The chain rule gives
$\tfrac{d}{dt} f = \nabla f \cdot (x', y')$, which at $t = 0$ is
$(2,3) \cdot (0,1) = 3$. Substituting first gives
$f = \cos^2 t + 3 \cos t \sin t$, whose derivative $-2\cos t \sin t + 3\cos 2t$
is also $3$ at $t = 0$. The routes agree, which is the whole content of the rule.

The Hessian here is constant, $\begin{pmatrix} 2 & 3 \\ 3 & 0\end{pmatrix}$, with
eigenvalues $1 \pm \sqrt{10} \approx 4.16$ and $-2.16$. It is indefinite, so the
single critical point at the origin is a saddle, not a minimum. In code:

```python
import jax
import jax.numpy as jnp

f = lambda p: p[0] ** 2 + 3 * p[0] * p[1]
p = jnp.array([1.0, 2.0])
jax.grad(f)(p)     # [8., 3.]
jax.hessian(f)(p)  # [[2., 3.], [3., 0.]]
```

## Formal treatment

The **partial derivative** is the one-variable derivative along a coordinate
direction, $\partial f_i/\partial x_j(a) = \lim_{t \to 0} \bigl(f_i(a + t e_j) -
f_i(a)\bigr)/t$, with $e_j$ the $j$-th standard basis vector. Differentiability
at $a$ implies every partial exists and $J_f(a)$ is their array. **The converse
is false.** For

$$
f(x,y) = \frac{xy}{x^2 + y^2} \ \ ((x,y) \neq 0), \qquad f(0,0) = 0,
$$

both partials at the origin are $0$, because $f$ vanishes on both axes; yet
$f \equiv 1/2$ on the line $y = x$, so $f$ is not even continuous there. A
sufficient converse: if all partials exist near $a$ and are continuous at $a$
(that is, $f$ is $C^1$), then $f$ is totally differentiable at $a$.

For scalar $f$ the **gradient** is defined by
$Df(a)h = \langle \nabla f(a), h \rangle$. Over unit vectors Cauchy–Schwarz gives
$\langle \nabla f, u \rangle \leq \lVert \nabla f \rVert_2$, with equality exactly
at the normalised gradient — the steepest-ascent property, and a statement about
the _Euclidean_ inner product. Measure step length by
$\lVert h \rVert_M^2 = h^\top M h$ for positive definite $M$ and the steepest
direction becomes $M^{-1}\nabla f$; constrain steps in $\ell_\infty$ and it
becomes $\operatorname{sign}(\nabla f)$. The gradient represents the derivative
under a metric; it is not the derivative.

The **chain rule** is the centrepiece. If $g$ is differentiable at $a$ and $f$ at
$g(a)$, then

$$
D(f \circ g)(a) = Df(g(a)) \, Dg(a),
$$

a composition of linear maps, hence a product of Jacobians. For a network
$L = f_k \circ \cdots \circ f_1$ with scalar output the gradient is a product of
$k$ matrices; associating right-to-left builds full Jacobians, associating
left-to-right propagates one covector through a sequence of vector–Jacobian
products. That second association _is_ reverse-mode differentiation, and it costs
a small constant multiple of one forward evaluation, paid for by storing
intermediates.

The **Hessian** $H_f(a)_{ij} = \partial^2 f/\partial x_i \partial x_j(a)$ is the
Jacobian of the gradient map, giving the second-order Taylor expansion
$f(a+h) = f(a) + \nabla f(a)^\top h + \tfrac12 h^\top H_f(a) h + o(\lVert h
\rVert^2)$ for $f$ twice differentiable at $a$. **Clairaut's theorem**
(Schwarz's) says mixed partials commute _provided they are continuous_: if
$\partial^2 f/\partial x_i \partial x_j$ and $\partial^2 f/\partial x_j \partial
x_i$ exist near $a$ and are continuous at $a$, they agree there, so a $C^2$
function has a symmetric Hessian. Without continuity it fails:
$f(x,y) = xy(x^2 - y^2)/(x^2+y^2)$ with $f(0,0) = 0$ has
$f_{xy}(0,0) = -1$ and $f_{yx}(0,0) = 1$.

## Assumptions and requirements

Every statement above is made on an **open** domain. The defining limit lets $h$
approach $0$ from every direction, so $a$ needs a whole ball inside $U$; at a
boundary point nothing singles out an approximating map. What breaks is less the
calculus than the conclusion usually drawn from it — a minimum may sit on the
boundary with $\nabla f \neq 0$, which is why a constrained problem is solved
with Lagrange multipliers or KKT conditions rather than by setting the gradient
to zero.

The definition also names a norm, and on $\mathbb{R}^n$ that choice costs
nothing: all norms on a finite-dimensional space are equivalent, so the quotient
vanishes for one exactly when it vanishes for all, and every linear map is
continuous for free. Both facts are what finite dimension is buying. The same
sentence read in a general normed space defines a derivative only once _linear_
is strengthened to _bounded linear_, and every statement then carries the norm
it was made in.

Continuity of the partial derivatives, not their existence, is the working
hypothesis, and dropping it is not an exotic worry: a function assembled from
branches — a clip, a case split, a `where` — routinely has partials on both
sides of a seam and no linear approximation on it. The condition is sufficient
and never necessary, so a discontinuous derivative is not evidence that no
derivative exists; the test can only confirm, not refute.

Continuity of the _second_ partials does more than make the mixed ones agree. It
is what makes the Hessian symmetric, and symmetry is what the second-derivative
test stands on: only a symmetric real matrix is guaranteed real eigenvalues and
an orthogonal eigenbasis, so "the Hessian is indefinite" has no content without
it. Quasi-Newton methods inherit the assumption wholesale, since they maintain a
symmetric approximation to an object taken to be symmetric.

Finally, differentiability is a hypothesis at a point while the estimates built
on it are hypotheses about a region. There is no mean value theorem in equality
form once $m \geq 2$ — around the circle $t \mapsto (\cos t, \sin t)$ on
$[0, 2\pi]$ the increment is zero and $Df(c)$ never is — and what survives,
$\lVert f(b) - f(a) \rVert \leq \sup \lVert Df \rVert \, \lVert b - a \rVert$,
requires the whole segment from $a$ to $b$ to lie in $U$. On a domain that is
not convex, two nearby points may have no segment inside it, and a bound on the
derivative then says nothing at all about the increment; Taylor remainders and
descent guarantees carry the same requirement. The inverse and implicit function
theorems add an invertible Jacobian, or an invertible block, and return
something strictly local in exchange: $f(x,y) = (e^x \cos y,\, e^x \sin y)$ has
$\det J = e^{2x} \neq 0$ everywhere and repeats with period $2\pi$ in $y$, and
the neighbourhood the theorem promises shrinks as the Jacobian approaches
singular.

## Uses and applicability

Reach for this whenever a quantity depends on several inputs at once: optimisation
of a differentiable objective, automatic differentiation, sensitivity and error
analysis, Lagrange multipliers, classification of critical points by the Hessian
spectrum. Frameworks expose exactly these objects: `jax.grad`, `jax.jacobian`,
`jax.hessian`.

It is the wrong tool for non-differentiable objectives (hard thresholds, hinge
losses), where subgradients or derivative-free methods take over; for discrete
parameters; and when $n$ is large enough that a Hessian's $n^2$ entries cannot be
formed, where Hessian–vector products — another application of the chain rule —
substitute.

## Limitations and common mistakes

The first mistake is the one above: taking the existence of all partial
derivatives for differentiability. It is worse than it looks, because even _every
directional_ derivative existing is not enough — $f(x,y) = x^2 y/(x^2+y^2)$,
extended by $0$, has directional derivative $u^2 v$ at the origin along $(u,v)$,
which is not linear in $(u,v)$, so no total derivative exists although $f$ is
continuous. A gradient check that perturbs one coordinate at a time can pass on
such a function.

The second is treating the gradient as coordinate-free. Rescale the inputs and
the steepest-descent direction changes, which is why preconditioning alters
optimisation trajectories at all. Relatedly, "gradient" belongs
to scalar-valued functions; for vector output the object is a Jacobian, and
whether it is stored as $\partial y_i/\partial x_j$ or its transpose is a layout
convention, not mathematics — though it causes many transpose-shaped bugs.

The third is forgetting Clairaut's hypothesis. Most losses are smooth enough, but
a ReLU network is not $C^2$ at its kinks, and what an autodiff library returns
there is an implementation convention, not a theorem. Finally, a zero gradient
marks only a _critical_ point: an indefinite Hessian means a saddle, a singular
one is inconclusive at second order.

## Variants and alternatives

There is no competing account of _what_ this derivative is. Anything that
deserves the name — meaning anything that composes — turns out to be the best
linear approximation again. What varies is the setting and the regularity
demanded, and what genuinely competes is how the object gets computed.

Weaken the definition and you have the **Gâteaux derivative**: a limit along
each direction separately, with no uniformity across directions. It exists far
more often — $x^2y/(x^2+y^2)$ has one in every direction at the origin — and
buys very little, since it need not be linear in the direction, need not force
continuity, and does not give a chain rule. Strengthen the definition instead,
by demanding that the approximating map be complex-linear on $\mathbb{C}^n$, and
a single derivative implies all of them together with the Cauchy–Riemann
equations; the cost is that hardly any function of real variables qualifies.

Change the space rather than the definition and the **Fréchet derivative** on a
Banach space reads word for word the same, which is what the calculus of
variations and PDE-constrained optimisation run on. Where the domain has no
linear structure at all — a sphere, the orthonormal frames of a Stiefel
manifold, a family of probability distributions — the derivative becomes a map
between tangent spaces, and differentiating a vector field needs a connection
supplied on top. That buys steps which respect a constraint by construction
instead of by projection or penalty, and costs the machinery plus any single
global coordinate system. In the same direction, **differential forms** replace
gradient, divergence and curl with one operator $d$, and Green's, Stokes' and
the divergence theorems with the single identity $\int_M d\omega =
\int_{\partial M} \omega$; the reward is coordinate independence in any
dimension, the price that the familiar three-vector dictionary — curl as a
vector field — is an accident of three dimensions.

Weaken what is differentiated and the **subdifferential** of a convex function,
or Clarke's generalised gradient for a locally Lipschitz one, replaces the
single linear map with a set of them. That restores optimality conditions and
convergence proofs to hinge losses, $\ell_1$ penalties and rectified networks,
at the cost of set-valued arithmetic and a chain rule that holds only as an
inclusion.

For computing the object, three approaches genuinely compete. Symbolic
differentiation returns an exact, inspectable expression and pays for it in
expression swell, since every product rule doubles a subtree. Finite differences
need nothing but evaluations of $f$ — around $n$ of them per gradient, with an
accuracy ceiling fixed by truncation error traded against cancellation, roughly
half the available digits — which is why they are the standard way to _check_ a
gradient and a poor way to train with one. Complex-step differentiation,
$f'(x) \approx \operatorname{Im} f(x + ih)/h$, removes the cancellation and
recovers full precision, on condition that every operation along the path is
holomorphic. Within automatic differentiation the choice left is the association
described above, plus what to keep: checkpointing recomputes part of the forward
pass instead of storing it, buying memory with time.

## History and attribution

The subject was assembled over roughly two centuries, and most of the names
attached to its pieces are nineteenth-century labels for eighteenth-century
practice.

Partial derivatives were in routine use by the middle of the eighteenth century
by Euler, Clairaut, d'Alembert and Lagrange, who were not building a theory of
functions of several variables but doing mechanics and what became partial
differential equations — the vibrating string, the shape of the Earth,
perturbations in celestial mechanics. The symmetry of mixed partials belongs to
that period and that style: it was used as a fact long before it was a theorem,
which is why it carries two names awkwardly. Alexis Clairaut is the name
American textbooks attach to it; Hermann Amandus Schwarz, in the nineteenth
century, is the one who supplied a proof with the continuity hypothesis actually
stated, and European texts call it Schwarz's theorem. Counterexamples to the
unconditional claim, of the kind quoted above, came after the proof rather than
before it.

The nineteenth century supplied the notation and the determinants. Carl Gustav
Jacob Jacobi's _De determinantibus functionalibus_ (1841) is the systematic
treatment of the array of partial derivatives and of the determinant that
governs change of variables, and the array carries his name. The Hessian is
named for Otto Hesse, who introduced the determinant of second partials in work
on algebraic curves rather than on optimisation; the name is usually credited to
Sylvester. The symbol $\nabla$ comes from Hamilton's quaternion work and was
propagated by Tait, and vector calculus in the form now taught — gradient,
divergence, curl, dot and cross products — was cut out of quaternion analysis
independently by Josiah Willard Gibbs and Oliver Heaviside in the 1880s, over
the objections of the quaternionists, reaching print as Gibbs's lectures written
up by Edwin Bidwell Wilson in 1901.

The definition at the top of this page is the last piece rather than the first.
It is Weierstrass's standard of rigour carried into several variables, and its
general form in normed spaces is due to Maurice Fréchet in the years around
1910; the weaker directional notion bears the name of René Gâteaux, whose work
was published posthumously after he was killed in the opening months of the
First World War. The rigorous implicit function theorem is associated with
Ulisse Dini in the same late-nineteenth-century wave of hypothesis-pinning.

The association of the chain rule this page calls reverse mode is the clearest
case of repeated independent discovery in the story. It is the adjoint method of
optimal control; it was described as a general algorithm for accumulating
derivatives through a computation, with a rounding-error analysis, in Seppo
Linnainmaa's 1970 master's thesis; it was applied to neural networks in Paul
Werbos's 1974 doctoral thesis; and it became widely known through Rumelhart,
Hinton and Williams in 1986. Priority here is genuinely divided rather than
disputed — the mathematics is only the chain rule, and it was rediscovered
whenever somebody needed the derivative of one number with respect to many.

## Sources

MIT 18.02 is the standard first course and covers this page's working material:
partial derivatives, gradients, the chain rule, second-derivative tests. MIT
18.100A supplies the rigour behind the limit definition, where the difference
between "exists" and "exists and is continuous" acquires teeth. The Deep Learning
book covers how these objects appear in training —
Jacobians, Hessians, conditioning, and why reverse mode is the right association
of the chain rule. The JAX documentation is the practical reference for computing
these derivatives. MIT 18.950 is the reference for the manifold setting listed
among the alternatives, and Rumelhart, Hinton and Williams (1986) is cited for
its own date and authorship only — the priority around it is the point being
made, not something that paper settles.

## Prerequisites and next connections

Understand single-variable calculus first, since every partial derivative is one,
and enough real analysis for limits, open sets and norms in $\mathbb{R}^n$.
Linear algebra is a genuine prerequisite: the derivative _is_ a linear map, and
reading the Jacobian and Hessian as matrices with a spectrum makes second-order
statements usable.

From here the step is backpropagation. The rules on
[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
are this chain rule specialised to a linear map: [Convolution](./convolution.md)
is linear, so it is its own derivative, its Jacobian is the Toeplitz-structured
matrix of the operator, and the backward pass is that matrix transposed — hence
an input gradient that is a convolution with the flipped kernel. The same reading
explains why a [Convolutional Layer](./convolutional-layer.md) accumulates a
weight gradient from every spatial position: sharing makes one variable appear
many times, and the chain rule sums over all of them.
