---
concept_id: concept.optimization.convex_optimization
title: Convex Optimization
slug: /concepts/convex-optimization
aliases:
  - convex programming
kind: concept
tier: 1
review_state: generated-draft
summary: The class of problems in which a convex objective is minimised over a convex feasible set, where every local minimum is global and the dual problem hands back a certificate that the answer really is optimal.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: requires
    target: concept.geometry.convex_geometry
    note: The objects being optimised over are convex sets and convex functions, and the separating-hyperplane argument behind duality is a theorem of convex geometry, so the geometry has to come first.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: Gradients, Hessians and Lagrange multipliers are the language in which the optimality conditions and every algorithm here are written.
  - type: contrasts_with
    target: concept.optimization.nonconvex_optimization
    note: The same solvers run on both, but without convexity a stationary point carries no global guarantee and the duality gap need not close, which is exactly the value convexity buys.
  - type: contributes_to
    target: concept.optimization.integer_programming
    note: Branch-and-bound is only as good as its bounds, and those bounds are the optimal values of convex relaxations of the integer problem.
sources:
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.convex_analysis_and_optimization
    title: MIT 6.253 Convex Analysis and Optimization (Spring 2012)
    url: https://ocw.mit.edu/courses/6-253-convex-analysis-and-optimization-spring-2012/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.bubeck.convex_optimization_complexity
    title: 'Convex Optimization: Algorithms and Complexity'
    url: https://arxiv.org/abs/1405.4980
    source_kind: preprint
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Ahmadi, Olshevsky, Parrilo and Tsitsiklis on the NP-hardness of deciding convexity of quartic polynomials
    reason: The claim that recognising convexity is itself computationally hard is stated from memory; no registered source covers complexity results about testing convexity.
    sections:
      - limitations-and-common-mistakes
  - label: A reference for the NP-hardness of optimising over the copositive cone
    reason: Used as the example of a convex problem that is not tractable; the registered sources cover tractable conic families only.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Convex optimization** is the study of problems written in the standard form

$$
\min_{x \in \mathbb{R}^n} \; f_0(x)
\quad \text{subject to} \quad f_i(x) \le 0 \;\; (i = 1,\dots,m), \quad Ax = b,
$$

where $f_0, \dots, f_m : \mathbb{R}^n \to \mathbb{R}$ are convex, $A \in \mathbb{R}^{p \times n}$
and $b \in \mathbb{R}^p$. A function is convex when
$f(\theta x + (1-\theta) y) \le \theta f(x) + (1-\theta) f(y)$ for all $x, y$ in its domain
and $\theta \in [0,1]$.

Two details in that form do real work. The equalities must be **affine**, not merely convex:
$h(x) = 0$ for convex non-affine $h$ is excluded even when its solution set happens to be convex.
And convexity is a property of the _problem as written_, not of the feasible set it describes — a
solver reads the functions $f_i$, not the geometry they cut out.

## Why it matters

Convexity converts local information into global information. A gradient at one point lower bounds
the function everywhere; a local minimum is a global minimum; a feasible point plus a dual vector
is a _certificate_ that no better point exists, checkable in arithmetic without re-searching the
space. None of that survives without convexity.

The practical consequence is that convex problems are solved, not tuned. An interior point solver
on a well-posed problem of moderate size returns ten digits with no step size to pick, no
initialisation to worry about, and no question of whether a longer run would find something better.
That reliability is why the boundary people care about is convex versus nonconvex rather than
linear versus nonlinear — a remark usually attributed to R. T. Rockafellar.

## Intuition

Picture a bowl over a convex region: release a ball anywhere and it reaches the same bottom.
Equivalently, at every point the tangent plane lies entirely below the graph, so one local
measurement rules out whole regions at once and an algorithm never has to ask whether the valley it
found is the deep one.

The analogy breaks in three places. The bottom need not be a point — the set of minimisers can be a
flat face, so "the" solution may not be unique. It need not exist: $e^{x}$ on $\mathbb{R}$ is convex
with infimum $0$ attained nowhere. And a bowl suggests something easy, whereas convexity promises
correctness of the answer, not cheapness of finding it.

## Concrete example

Minimise $x_1^2 + x_2^2$ subject to $x_1 + x_2 \ge 2$. In standard form the constraint is
$f_1(x) = 2 - x_1 - x_2 \le 0$. The Lagrangian is
$L(x, \lambda) = x_1^2 + x_2^2 + \lambda(2 - x_1 - x_2)$. Minimising over $x$ gives
$x_i = \lambda / 2$, so the dual function is

$$
g(\lambda) \;=\; \tfrac{\lambda^2}{2} + \lambda\left(2 - \lambda\right)
\;=\; 2\lambda - \tfrac{\lambda^2}{2}, \qquad \lambda \ge 0 .
$$

This is concave; maximising gives $\lambda^\star = 2$ and $d^\star = 2$. The primal optimum is
$x^\star = (1,1)$ with $p^\star = 2$, so the gap is zero, as Slater's condition promised — the
point $(2,2)$ is strictly feasible. The KKT conditions check out: stationarity
$2x_1^\star - \lambda^\star = 0$, dual feasibility $\lambda^\star \ge 0$, and complementary
slackness $\lambda^\star(2 - x_1^\star - x_2^\star) = 0$ because the constraint is active. The
multiplier is also a sensitivity: moving the right-hand side to $2 + \epsilon$ raises the optimal
value by $2\epsilon + O(\epsilon^2)$.

Modelling languages report both halves:

```python
import cvxpy as cp

x = cp.Variable(2)
constraint = cp.sum(x) >= 2
problem = cp.Problem(cp.Minimize(cp.sum_squares(x)), [constraint])
problem.solve()
print(problem.value, x.value, constraint.dual_value)  # 2.0  [1. 1.]  2.0
```

## Formal treatment

**Local minima are global.** Suppose $x$ is feasible and minimal over a neighbourhood and some
feasible $y$ has $f_0(y) < f_0(x)$. The feasible set is convex, so $z_\theta = \theta y + (1-\theta)x$
is feasible, and convexity gives $f_0(z_\theta) \le \theta f_0(y) + (1-\theta)f_0(x) < f_0(x)$. Small
$\theta$ puts $z_\theta$ inside the neighbourhood, contradicting local minimality.

**Duality.** With $L(x,\lambda,\nu) = f_0(x) + \sum_i \lambda_i f_i(x) + \nu^\top (Ax - b)$, the
dual function $g(\lambda,\nu) = \inf_x L(x,\lambda,\nu)$ is a pointwise infimum of functions
affine in $(\lambda,\nu)$, hence concave whether or not the primal is convex. Weak duality
$g(\lambda,\nu) \le p^\star$ holds for all $\lambda \ge 0$, so any dual feasible pair is a lower
bound and the _duality gap_ $p^\star - d^\star \ge 0$ is a stopping criterion. **Slater's
condition** — there exists a strictly feasible point, with $f_i(x) < 0$ for the non-affine
constraints and $Ax = b$ — gives strong duality $p^\star = d^\star$ with the dual optimum attained.

**KKT.** For differentiable $f_i$ under Slater, $x^\star$ is optimal if and only if there are
multipliers with $f_i(x^\star) \le 0$, $Ax^\star = b$, $\lambda^\star \ge 0$,
$\lambda_i^\star f_i(x^\star) = 0$, and

$$
\nabla f_0(x^\star) + \sum_{i=1}^m \lambda_i^\star \nabla f_i(x^\star) + A^\top \nu^\star = 0 .
$$

Without convexity these conditions remain necessary under a constraint qualification but stop
being sufficient.

**Algorithms.** If $f$ is convex with $L$-Lipschitz gradient, gradient descent with step $1/L$
gives $f(x_k) - f^\star \le L\|x_0 - x^\star\|^2 / (2k)$; Nesterov acceleration improves this to
$O(1/k^2)$, and $\mu$-strong convexity gives a linear rate governed by $L/\mu$. For $f + h$ with $h$
nonsmooth but with a cheap proximal map
$\operatorname{prox}_{th}(v) = \arg\min_u \{ h(u) + \|u-v\|^2 / (2t) \}$, proximal gradient methods
keep those rates, which is what makes $\ell_1$ penalties practical. Interior point methods replace
the inequalities with a barrier $-\sum_i \log(-f_i(x))$ and follow the central path by Newton steps;
self-concordance theory bounds the step count by $O(\sqrt{\nu}\,\log(1/\epsilon))$ for a barrier of
parameter $\nu$.

## Assumptions and requirements

Everything above assumes each $f_i$ is convex on a convex domain and each equality is affine. Drop
convexity of one $f_i$ and local minima may be strictly worse than global ones, and KKT loses
sufficiency.

Strong duality needs a constraint qualification, not just convexity. Without Slater the gap can be
positive: minimising $e^{-x}$ subject to $x^2/y \le 0$ over $y > 0$ forces $x = 0$, so
$p^\star = 1$, while the dual function is identically $0$. Nothing is wrong with that problem; it
simply has no strictly feasible point.

Existence of a minimiser needs more than convexity — a closed feasible set plus coercivity or
boundedness. The rates need their own hypotheses: Lipschitz gradients, strong convexity for linear
convergence, a tractable prox, a strictly feasible starting point for a barrier method. And all of
it assumes the convex model is the problem you meant; convexity is often bought by relaxing the real
objective, which is an assumption too.

## Uses and applicability

Reach for convex optimization when the model is yours to write: least squares and ridge regression,
the lasso, support vector machines, maximum likelihood for logistic regression, portfolio selection,
model predictive control, filter and experiment design. It is also the engine underneath discrete
methods, where a linear or semidefinite relaxation supplies the bound that prunes a search tree.

It is the wrong tool when the objective is genuinely nonconvex and the convex surrogate is a poor
proxy — training a deep network, inverse problems with nonlinear physics, rank constraints that are
not being relaxed. At very large scale a convex problem may still be solved only approximately by
stochastic first-order methods, and then the certificate that makes convexity attractive is never
actually computed.

## Limitations and common mistakes

The first mistake is reading "convex" as "tractable". Polynomial-time solvability holds for the
standard families — linear, quadratic, second-order cone, semidefinite programs — where a barrier or
a separation oracle is available. Optimising a linear function over the copositive cone is convex
and NP-hard, so the class as a whole is not easy.

The second is thinking the hard step is solving. It is _recognising_: deciding whether a given
formulation is convex is NP-hard already for quartic polynomials, and the everyday version is a
modelling error — writing $x_1/x_2 \le 1$ with $x_2 > 0$ describes a convex set through a function
that is only quasiconvex, when $x_1 - x_2 \le 0$ says the same thing convexly. Disciplined convex
programming exists for exactly this reason: it restricts you to a grammar of atoms and composition
rules whose convexity is verifiable by construction, so the modelling language can certify the
problem and transform it to conic form instead of guessing.

Three smaller errors recur: applying KKT without checking a constraint qualification; assuming the
minimiser is unique, which needs strict convexity; and quoting linear convergence for a problem that
is convex but not strongly convex, where the honest rate is $O(1/k)$.

## Variants and alternatives

The tractable classes nest: linear programs inside quadratic programs, inside second-order cone
programs, inside semidefinite programs, all special cases of conic programming over a convex cone.
Geometric programs become convex after a logarithmic change of variables; quasiconvex problems
yield to bisection on convex feasibility subproblems; robust formulations keep convexity while
hedging against uncertain data, at the cost of conservatism.

Among algorithms the trade is accuracy against scale. Simplex is exponential in the worst case and
excellent in practice on linear programs. The ellipsoid method was the first polynomial-time
algorithm and is unusably slow. Interior point methods give high accuracy with dense linear algebra
per step. First-order methods — projected and proximal gradient, mirror descent, Frank-Wolfe, ADMM —
give low accuracy cheaply and scale to problems where forming a Hessian is out of the question.

## History and attribution

The analytic foundations predate the algorithms: Minkowski on convex bodies and support functions
early in the twentieth century, Fenchel's conjugate duality in the 1940s and 1950s, and
Rockafellar's _Convex Analysis_ (1970), which consolidated the field. The algorithmic line begins
with linear programming — Kantorovich in 1939, Dantzig's simplex method in 1947 — and with the
optimality conditions, derived by Karush in a 1939 master's thesis and independently by Kuhn and
Tucker in 1951, which is why they carry three names.

The modern picture arrived in two steps. Khachiyan's ellipsoid method (1979) settled that linear
programming is polynomial-time; Karmarkar's interior point method (1984) was polynomial _and_ fast,
and Nesterov and Nemirovski's theory of self-concordant barriers (1994) extended the same machinery
to general convex conic problems. Disciplined convex programming, developed by Grant, Boyd and Ye in
the mid-2000s and shipped as CVX, then made the modelling step mechanical.

## Sources

Boyd and Vandenberghe's _Convex Optimization_ is the standard reference and covers nearly this whole
page: standard form, convexity-preserving operations, duality and KKT, the problem classes,
interior point methods and applications, with historical notes at the end of each chapter. MIT 6.253
is Bertsekas's convex analysis course, the place to go for the finer duality theory — constraint
qualifications beyond Slater, saddle point results, and when strong duality fails. Bubeck's survey
is the algorithmic complement: rates and lower bounds for gradient, accelerated, mirror descent and
Frank-Wolfe methods, stated as theorems.

## Prerequisites and next connections

Read [Convex Geometry](./convex-geometry.md) first — convex sets, separating hyperplanes, extreme
points — because duality is that geometry in analytic clothing.
[Multivariable Calculus](./multivariable-calculus.md) supplies the gradients and Hessians, and
[Vector Spaces](./vector-spaces.md) the affine language of the constraints.

The infinite-dimensional continuation runs through
[Functional Analysis](./functional-analysis.md), where Hahn–Banach replaces the separating
hyperplane, and the [Calculus of Variations](./calculus-of-variations.md) for convex functionals on
function spaces; [High-Dimensional Statistics](./high-dimensional-statistics.md) is largely the
study of estimators that are convex programs. The questions that open up next are what survives when
convexity is dropped, and what changes when the objective is an expectation that can only be
sampled.
