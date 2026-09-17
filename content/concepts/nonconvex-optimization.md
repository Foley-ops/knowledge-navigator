---
concept_id: concept.optimization.nonconvex_optimization
title: Nonconvex Optimization
slug: /concepts/nonconvex-optimization
aliases:
  - non-convex optimization
  - nonconvex programming
kind: concept
tier: 1
review_state: generated-draft
summary: Minimisation without the convexity that makes a local minimum global, where algorithms can still be proved to reach stationary points but no longer certify that the point they reached is the best one.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: contrasts_with
    target: concept.optimization.convex_optimization
    note: The field is defined by the failure of the one guarantee convex optimisation provides, so every result here is read against what convexity would have given for free.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: Every statement on this page is about gradients, Hessians and critical points, which a reader has to have met before the first-order and second-order conditions mean anything.
  - type: used_to_solve
    target: concept.linear_algebra.tensor_decomposition
    note: Fitting a low-rank CP decomposition is a nonconvex least-squares problem attacked by local methods, and it is one of the few such problems whose landscape has been analysed rather than assumed benign.
  - type: contrasts_with
    target: concept.optimization.combinatorial_optimization
    note: Both give up a global certificate, but for different reasons - discreteness of the feasible set there, curvature of a continuous landscape here - and continuous relaxations are the bridge between them.
sources:
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - variants-and-alternatives
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.li2018.loss_landscape
    title: Visualizing the Loss Landscape of Neural Nets
    url: https://arxiv.org/abs/1712.09913
    source_kind: preprint
    supports:
      - intuition
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Saddle-escape theory for smooth nonconvex functions
    reason: The strict-saddle property, perturbed and noisy gradient methods, almost-sure avoidance of saddles under random initialisation, and the matching first-order oracle lower bound are stated here from the 2014-2018 literature, which the source registry does not contain.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
  - label: Computational hardness of nonconvex optimisation
    reason: The NP-hardness of checking local optimality in quadratic programming and the NP-completeness of training a small threshold network are named in the prose but no registered source covers them.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
  - label: Prevalence of saddle points in high-dimensional random landscapes
    reason: The random-matrix and spin-glass results on the index of critical points, and the measurements that imported them into neural network training, are reported as findings but have no registered source.
    sections:
      - intuition
      - limitations-and-common-mistakes
  - label: Numerical history of nonlinear programming
    reason: Damped least squares, trust-region methods and simulated annealing are attributed by name and decade; the registry has no history of numerical optimisation to cite for them.
    sections:
      - history-and-attribution
      - variants-and-alternatives
claims: []
---

## Definition

**Nonconvex optimization** is the problem

$$
\min_{x \in C} f(x), \qquad f : \mathbb{R}^n \to \mathbb{R},
$$

in which $f$ fails to be convex on $C$, or $C$ fails to be a convex set, or both.
The defining consequence is a negative one. For convex $f$ on convex $C$, every
local minimum is global and $\nabla f(x^\star) = 0$ is sufficient for optimality;
drop convexity and both implications fail. In ordinary use the phrase also names
a _regime_ — the analysis you do when convexity is not assumed — and in that
reading convex problems are the easy special case rather than the excluded one.

## Why it matters

Almost every objective a researcher actually writes down is nonconvex: neural
network training, low-rank matrix and tensor fitting, phase retrieval,
maximum-likelihood estimation for a mixture, bundle adjustment, policy
optimisation. The watershed in optimisation is convexity, not linearity — a
remark usually attributed to R. T. Rockafellar, and the framing Boyd and
Vandenberghe adopt — and crossing it costs two things.

The first is the **certificate**. A convex solver hands back a dual feasible
point proving you are within $\epsilon$ of the optimum; nothing in a nonconvex
run tells you what you missed, only that the method stopped. The second is
**identification**: a point with zero gradient is a candidate, not a solution.
Neither loss is an artefact of weak algorithms. Checking whether a given point is
a local minimum of a quadratic over a box is NP-hard, and training a three-node
threshold network to fit given data is NP-complete.

## Intuition

The convex picture is a bowl: downhill always means the same bottom. The
nonconvex picture is terrain — basins, ridges, plateaus, passes. Keep it, but
distrust the dimension count. A mountain pass in three dimensions has one
direction of descent; a critical point in $d$ dimensions has $d$ Hessian
eigendirections and is a local minimum only if _every one_ curves upward. In the
random landscape models borrowed from statistical physics that conjunction is a
rare event except at very low objective values, which is where the claim comes
from that saddles, not local minima, are what a high-dimensional method spends
its time near. That is a finding about models and measurements, not a theorem
about your loss.

Distrust the picture itself too. Li et al. plot loss surfaces by slicing along
two random directions and show that the impression of sharpness or flatness
flips depending on whether the directions are normalised filter-wise — an
unnormalised slice can make a minimum look flat purely because the weights are
large. A two-dimensional slice of a million-dimensional surface is a projection,
and projections hide things.

## Concrete example

Take

$$
f(x,y) = \tfrac12 x^2 + \tfrac14 y^4 - \tfrac12 y^2, \qquad
\nabla f(x,y) = (x,\; y^3 - y).
$$

Three critical points: $(0,0)$ with $f = 0$, and $(0,\pm 1)$ with $f = -0.25$.
The Hessian is $\mathrm{diag}(1,\; 3y^2-1)$, so at $(0,0)$ its eigenvalues are
$1$ and $-1$ — a strict saddle — and at $(0,\pm1)$ they are $1$ and $2$, two
local minima that are also global.

Gradient descent with step $\eta = 0.1$ from $(1, 0)$ has $y_{t+1} = y_t$ forever
and converges to the saddle. Perturb the start to $(1, 10^{-3})$ and near the
origin the recursion is $y_{t+1} = y_t(1 + \eta - \eta y_t^2) \approx 1.1\,y_t$,
so it takes about $\ln(10^3)/\ln(1.1) \approx 73$ steps to grow to order one, and
then it settles at $(0,1)$.

```python
import numpy as np

grad = lambda p: np.array([p[0], p[1] ** 3 - p[1]])

for start in ([1.0, 0.0], [1.0, 1e-3]):
    p = np.array(start)
    for _ in range(500):
        p = p - 0.1 * grad(p)
    print(start, "->", np.round(p, 4))
# [1.0, 0.0]  -> [0. 0.]    saddle,        f =  0.00
# [1.0, 0.001] -> [0. 1.]   local minimum, f = -0.25
```

The escape cost is logarithmic in the perturbation, which is why noise is cheap
insurance. Note also what the saddle looks like from inside: gradient norm
$10^{-8}$, loss flat, nothing local announcing that $-0.25$ exists.

## Formal treatment

Let $f$ be twice continuously differentiable. $x$ is **stationary** (a critical
point) if $\nabla f(x) = 0$. Second-order conditions, exactly as in multivariable
calculus: $\nabla^2 f(x) \succeq 0$ is necessary at a local minimum, and
$\nabla f(x) = 0$ with $\nabla^2 f(x) \succ 0$ is sufficient. When
$\lambda_{\min}(\nabla^2 f(x)) < 0$ the point is a **saddle**; when the smallest
eigenvalue is exactly zero the test is inconclusive.

Say $f$ is $L$-smooth ($\nabla f$ is $L$-Lipschitz) and bounded below by $f^\star$.
The descent lemma gives, for $\eta = 1/L$,

$$
f(x_{t+1}) \le f(x_t) - \tfrac{1}{2L}\|\nabla f(x_t)\|^2 ,
$$

and summing over $T$ steps,

$$
\min_{t < T} \|\nabla f(x_t)\| \;\le\; \sqrt{\frac{2L\,(f(x_0) - f^\star)}{T}} .
$$

So $O(\epsilon^{-2})$ iterations reach $\|\nabla f\| \le \epsilon$. This is a
theorem, it needs no convexity, and it promises nothing about optimality — only
stationarity. Matching lower bounds show the exponent cannot be improved by any
first-order method under these assumptions alone.

To say more you need landscape structure. $f$ has the **strict saddle property**
if at every critical point either $\nabla^2 f \succ 0$ or
$\lambda_{\min}(\nabla^2 f) < 0$, i.e. no critical point is a degenerate
non-minimum. Under strict saddle plus $L$-smoothness and a $\rho$-Lipschitz
Hessian, gradient descent with injected noise reaches an
$(\epsilon, \sqrt{\rho\epsilon})$-second-order stationary point —
$\|\nabla f\| \le \epsilon$ and $\lambda_{\min}(\nabla^2 f) \ge -\sqrt{\rho\epsilon}$
— in $\tilde{O}(\epsilon^{-2})$ iterations, with only polylogarithmic dependence
on dimension. Related results: stochastic gradient noise escapes strict saddles
in polynomial time, and plain gradient descent from a random start avoids strict
saddles almost surely by the stable manifold theorem — though "almost surely"
carries no rate, and constructions exist where escape takes exponentially many
steps.

## Assumptions and requirements

The rate above needs $f$ differentiable with Lipschitz gradient and bounded
below. Drop smoothness and the step $1/L$ has no meaning; drop boundedness below
and there is nothing to converge to. The second-order test needs continuous
second partials and a nondegenerate Hessian — with a zero eigenvalue, as at
$f(x)=x^3$ or $x^4$ at the origin, the test does not decide.

The saddle-escape results need more: a Lipschitz Hessian, and the strict saddle
property itself. That property is _proved_ for particular problems — orthogonal
tensor decomposition, phase retrieval, some low-rank matrix recovery — and is
not known for deep networks, which have flat directions and whole manifolds of
equivalent parameters generated by symmetries such as permuting hidden units or
rescaling across a ReLU. Where minima are non-isolated, "the minimiser" is not a
point and uniqueness arguments do not start. Stochastic variants assume unbiased
gradients with bounded variance and a step-size schedule.

## Uses and applicability

Reach for nonconvex methods when the model you want is genuinely nonconvex and
you would rather optimise the true objective approximately than a convex proxy
exactly: deep network training, factorisation and completion, EM for
latent-variable models, geometry problems in vision and chemistry.

Do not reach for them first. If a convex reformulation exists — a nuclear-norm
surrogate for rank, a semidefinite relaxation, a log transform that convexifies
a geometric program — it buys the certificate back. If the problem is small and
the global optimum genuinely matters, use a branch-and-bound global solver and
accept exponential worst-case cost rather than a local method that cannot tell
you it failed.

## Limitations and common mistakes

**"The gradient is tiny, so we converged."** A small gradient norm is equally
consistent with a saddle, a plateau, or a badly scaled coordinate. Diagnose with
curvature, or at least with a restart from a perturbed point.

**"Local minima are the problem."** That saddles dominate in high dimension is a
finding from random-landscape models and from measurements on trained networks,
not a proven property of any particular loss — and treating it as one licenses
the wrong debugging.

**"SGD finds the global minimum of deep networks."** What is observed is that
gradient methods on large networks drive _training_ loss to near zero and yield
models that generalise. That is an empirical regularity on particular
architectures and datasets, not a theorem about nonconvex objectives, and it says
nothing about test loss by itself. Supporting theory exists only in restricted
regimes, such as networks far wider than any in use.

**Reading loss plots as landscapes.** Without filter normalisation the same
minimum can be drawn sharp or flat at will.

**Single-seed comparisons.** Different initialisations land in different basins,
so one run of A beating one run of B is evidence of very little.

## Variants and alternatives

_Local first-order methods_ — gradient descent, momentum, adaptive methods — are
the default: cheap per step, stationary-point guarantees only. _Second-order and
trust-region methods_, including cubic-regularised Newton, use curvature to
reach second-order stationary points at better rates, costing Hessian
information. _Global-search heuristics_ — simulated annealing, evolution
strategies, basin hopping, multi-start — buy exploration at the price of many
evaluations and no guarantee. _Certified global methods_ — spatial branch and
bound, sum-of-squares hierarchies for polynomial objectives — buy a real
certificate at exponential cost.

Then the structural escapes. _Convex relaxation_ replaces the problem with a
convex one and bounds the gap; the _Burer–Monteiro_ move goes the other way,
factorising a convex semidefinite program into a smaller nonconvex one that is
often benign in practice. And some nonconvex functions behave like convex ones:
under the Polyak–Łojasiewicz condition
$\tfrac12\|\nabla f(x)\|^2 \ge \mu (f(x) - f^\star)$, gradient descent converges
linearly to the _global_ minimum with no convexity at all. Geodesic convexity
plays the same role when a problem is nonconvex only because its domain is
curved.

## History and attribution

There is no single origin; the category was carved out by its complement.
First-order conditions for constrained problems that never assumed convexity
came from Karush's 1939 thesis and, independently, Kuhn and Tucker in 1951.
Practical nonconvex least squares dates to Levenberg's damped iteration in 1944
and Marquardt's 1963 version, with trust-region methods following in the 1970s
and 1980s; simulated annealing arrived from statistical physics with Kirkpatrick,
Gelatt and Vecchi in 1983. The sharp convex/nonconvex framing this page takes for
granted became standard only once convex analysis matured through the work of
Fenchel, Moreau and Rockafellar, a development Boyd and Vandenberghe's history
of the subject traces. The landscape programme — asking which
nonconvex problems are benign rather than treating all as hopeless — is roughly
the last decade's work.

## Sources

Boyd and Vandenberghe is the reference for what convexity buys and therefore
what its absence costs, for the local-versus-global solver distinction, and for
the field's brief history. MIT 18.02 is where critical points, the Hessian and
the second-derivative test are first done properly, and the formal treatment
here assumes that level. The _Deep Learning_ book's optimisation chapter is the
standard account of nonconvexity as the working condition of neural network
training. Li et al. is the source for loss-landscape visualisations and, more
usefully, for why they mislead unless the directions are normalised.

## Prerequisites and next connections

Read [Multivariable Calculus](./multivariable-calculus.md) first: gradients,
Hessians and the second-derivative test are the whole vocabulary here. The
companion page on Convex Optimization is the other half of the contrast, and
this page is largely an inventory of what that one guarantees and this one
cannot.

From here, [Tensor Decomposition](./tensor-decomposition.md) is a concrete
nonconvex problem whose landscape has actually been studied;
[Random Matrix Theory](./random-matrix-theory.md) supplies the eigenvalue
heuristics behind the high-dimensional saddle picture;
[Dynamical Systems](./dynamical-systems.md) supplies the stable-manifold
argument for saddle avoidance; and [ResNet](./resnet.md) is the architecture
whose trainability became the standing evidence that landscape shape, not depth
alone, governs optimisation.
