---
concept_id: concept.optimization.optimal_transport
title: Optimal Transport
slug: /concepts/optimal-transport
aliases:
  - Monge-Kantorovich problem
  - Wasserstein distance
kind: concept
tier: 1
review_state: generated-draft
summary: The problem of rearranging one probability measure into another at least total cost, whose relaxed form always has a solution and whose optimal value gives a geometry-aware distance between distributions.
categories:
  - Mathematics/Optimization
primary_category: Mathematics/Optimization
relationships:
  - type: requires
    target: concept.analysis.measure_theory
    note: The problem is posed over pushforwards and couplings of measures, so a reader needs measurable maps, pushforward measures and integration against a cost before the statement is even readable.
  - type: specializes
    target: concept.optimization.convex_optimization
    note: The Kantorovich problem is a linear program over the convex set of couplings, and Kantorovich-Rubinstein duality is its Lagrangian dual.
  - type: equivalent_under
    target: concept.optimization.combinatorial_optimization
    note: When both marginals are finitely supported the problem is exactly the classical transportation problem, a min-cost-flow instance whose linear program has integral vertices.
  - type: contributes_to
    target: concept.probability.high_dimensional_statistics
    note: Wasserstein distance between an empirical measure and its population is a standard estimand there, and its dimension-dependent convergence rate is a textbook instance of the curse of dimensionality.
sources:
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.convex_analysis_and_optimization
    title: MIT 6.253 Convex Analysis and Optimization (Spring 2012)
    url: https://ocw.mit.edu/courses/6-253-convex-analysis-and-optimization-spring-2012/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.goodfellow2014.generative_adversarial_networks
    title: Generative Adversarial Networks
    url: https://arxiv.org/abs/1406.2661
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Monge (1781), Kantorovich (1942) and the standard optimal transport monographs
    reason: The registry carries no source on optimal transport itself, so the Kantorovich existence theorem, Kantorovich-Rubinstein duality, Brenier's polar factorization theorem and the metric properties of the Wasserstein distances are stated here without a citable reference.
    sections:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
  - label: Entropic regularisation and the Sinkhorn algorithm (Sinkhorn's matrix scaling, Cuturi's Sinkhorn distances, and the complexity analyses that followed)
    reason: No registry source covers entropic optimal transport, so the fixed-point form of the regularised plan and the iteration-complexity remarks are uncited.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - uses-and-applicability
  - label: Wasserstein GAN and its gradient-penalty variant
    reason: The registry has the original GAN paper but nothing on Wasserstein GANs, so the claim about how the critic enforces the Lipschitz constraint rests on no cited source.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Optimal transport** is the problem of moving the mass of one probability
measure onto another so that the total cost of the movement is as small as
possible. Fix two probability measures $\mu$ on $X$ and $\nu$ on $Y$ and a cost
$c(x,y) \ge 0$ for moving a unit of mass from $x$ to $y$.

Monge's formulation looks for a **transport map** $T : X \to Y$ pushing $\mu$
to $\nu$, meaning $T_\#\mu(B) = \mu(T^{-1}(B))$ for every measurable $B$, that
minimises $\int_X c(x, T(x))\, d\mu(x)$.

Kantorovich's formulation drops the map and looks for a **transport plan**: a
coupling $\gamma$ on $X \times Y$, that is, a joint measure whose marginals are
$\mu$ and $\nu$, minimising $\int c \, d\gamma$. The set of couplings is written
$\Pi(\mu, \nu)$.

## Why it matters

The two formulations are not a matter of taste. A map cannot split an atom of
mass: if $\mu = \delta_0$ and $\nu = \tfrac12\delta_{-1} + \tfrac12\delta_{1}$
there is no measurable $T$ with $T_\#\mu = \nu$ at all, so Monge's problem is an
infimum over the empty set. The coupling that sends half the mass each way is
perfectly admissible, and Kantorovich's problem always has a feasible point
because the product measure $\mu \otimes \nu$ is one.

What the optimal value buys is a distance that respects the geometry of the
underlying space. Kullback-Leibler divergence and total variation are blind to
how far apart two distributions are: for $\mu = \delta_0$ and $\nu = \delta_t$
they return the same value for $t = 0.01$ and $t = 10^6$, being maximal or
infinite whenever supports are disjoint. The Wasserstein distance returns $|t|$.
That property is why optimal transport appears wherever distributions must be
compared, interpolated or matched rather than merely tested for equality.

## Intuition

The image Monge worked with is literal: a pile of earth and a hole of the same
volume, and you pay to carry each shovelful. Kantorovich's relaxation says you
do not have to decide where each grain goes as a function of where it started;
you only have to decide how much goes from each region to each other region.

The dual is a broker's view. You post a price $\varphi(x)$ for collecting mass
at $x$ and $\psi(y)$ for delivering it at $y$; nobody uses you unless
$\varphi(x) + \psi(y) \le c(x,y)$ everywhere, and you maximise revenue subject
to that. At the optimum the broker's revenue equals the cost of moving the
earth yourself.

The analogy breaks in two places. There is no congestion: cost is linear in how
much mass takes a route, so a busy route never gets more expensive. And the plan
is static — it pairs sources with destinations and never says what path mass
follows in between, which is why the dynamic reformulations are different
objects rather than restatements.

## Concrete example

Put mass at the integer points $0, 1, 2$ on the line, with
$a = (0.5, 0.2, 0.3)$ and $b = (0.2, 0.5, 0.3)$, and cost $c(i,j) = |i - j|$.
The optimal plan sends $0.2$ from $0$ to $0$, $0.3$ from $0$ to $1$, $0.2$ from
$1$ to $1$ and $0.3$ from $2$ to $2$. Only the $0.3$ moving from $0$ to $1$
costs anything, so $W_1(\mu,\nu) = 0.3$.

The dual confirms it. Take $f(0) = 0$, $f(1) = -1$, $f(2) = -2$, which is
$1$-Lipschitz. Then
$\sum_i f(i) a_i - \sum_j f(j) b_j = (-0.8) - (-1.1) = 0.3$: the same number,
so both are optimal.

Entropic regularisation on the same problem, run for a fixed iteration budget:

```python
import math

a = [0.5, 0.2, 0.3]
b = [0.2, 0.5, 0.3]
C = [[abs(i - j) for j in range(3)] for i in range(3)]
eps = 0.05
K = [[math.exp(-C[i][j] / eps) for j in range(3)] for i in range(3)]
u = [1.0] * 3
v = [1.0] * 3
for _ in range(2000):                       # Sinkhorn iterations
    u = [a[i] / sum(K[i][j] * v[j] for j in range(3)) for i in range(3)]
    v = [b[j] / sum(K[i][j] * u[i] for i in range(3)) for j in range(3)]
P = [[u[i] * K[i][j] * v[j] for j in range(3)] for i in range(3)]
print(sum(P[i][j] * C[i][j] for i in range(3) for j in range(3)))
```

At $\varepsilon = 0.05$ this prints $0.30000337$ — 2000 iterations is not full
convergence at this $\varepsilon$, and the converged entropic value rounds to
$0.300000$ — and $P$ agrees with the exact plan to about four decimals, the
largest deviation being the $1.2 \times 10^{-5}$ of mass sitting in the
$2 \to 1$ cell that the exact plan leaves empty. At $\varepsilon = 0.5$ it
prints $0.398413$ and the plan is visibly smeared — $0.028$ of mass travels the
full distance from $0$ to $2$, which the exact solution never does. The blur is
the price of the regulariser, not a numerical error.

## Formal treatment

Let $X, Y$ be Polish spaces, $\mu \in \mathcal{P}(X)$, $\nu \in \mathcal{P}(Y)$,
and $c : X \times Y \to [0, \infty]$ lower semicontinuous. The Kantorovich
problem is

$$
\mathrm{OT}_c(\mu,\nu) \;=\; \inf_{\gamma \in \Pi(\mu,\nu)} \int_{X\times Y} c(x,y)\, d\gamma(x,y),
\qquad
\Pi(\mu,\nu) = \{\gamma : \pi^1_\#\gamma = \mu,\ \pi^2_\#\gamma = \nu\}.
$$

$\Pi(\mu,\nu)$ is convex, nonempty and tight, hence weakly compact, and
$\gamma \mapsto \int c\, d\gamma$ is weakly lower semicontinuous, so the
infimum is attained. The objective and the constraints are linear in $\gamma$:
this is a linear program on an infinite-dimensional space, and the finite case
is an ordinary LP.

Duality gives

$$
\mathrm{OT}_c(\mu,\nu) \;=\; \sup \left\{ \int \varphi \, d\mu + \int \psi \, d\nu \;:\; \varphi(x) + \psi(y) \le c(x,y) \right\},
$$

over bounded continuous (or $\mu$-, $\nu$-integrable) $\varphi, \psi$. When
$X = Y$ is a metric space and $c = d$, the constraint forces $\psi = -\varphi$
with $\varphi$ $1$-Lipschitz, and the dual collapses to the
**Kantorovich-Rubinstein** form

$$
W_1(\mu,\nu) \;=\; \sup_{\mathrm{Lip}(f) \le 1} \int f\, d\mu - \int f\, d\nu .
$$

For $p \ge 1$, $W_p(\mu,\nu) = \left(\mathrm{OT}_{d^p}(\mu,\nu)\right)^{1/p}$
is a metric on $\mathcal{P}_p(X)$, the measures with finite $p$-th moment; the
triangle inequality follows from gluing two optimal couplings. On $\mathbb{R}^d$
with $c = |x-y|^2$, Brenier's theorem says that if $\mu$ is absolutely
continuous with respect to Lebesgue measure then the optimal coupling is unique
and is induced by a map $T = \nabla\varphi$ with $\varphi$ convex — Monge's
problem is solvable after all, in that setting.

Entropic regularisation replaces the LP with

$$
\min_{\gamma \in \Pi(\mu,\nu)} \int c \, d\gamma \;-\; \varepsilon H(\gamma),
\qquad H(\gamma) = -\int \left(\log \tfrac{d\gamma}{d(\mu\otimes\nu)} - 1\right) d\gamma ,
$$

which is strictly convex, so the solution is unique and has the scaling form
$\gamma_\varepsilon = \mathrm{diag}(u)\, K \,\mathrm{diag}(v)$ with
$K = e^{-C/\varepsilon}$ in the discrete case. Sinkhorn's algorithm alternates
$u \leftarrow a \oslash Kv$ and $v \leftarrow b \oslash K^\top u$, each step a
matrix-vector product costing $O(n^2)$ and trivially parallel. Exact discrete
transport by network simplex or auction methods costs roughly $O(n^3 \log n)$;
Sinkhorn reaches a fixed additive accuracy in a number of iterations that grows
as $\varepsilon$ shrinks, so the speed advantage is real but is bought with
approximation, not for free.

## Assumptions and requirements

Existence of an optimal plan needs a Polish (or at least suitably regular)
space and a lower semicontinuous cost bounded below. Drop lower semicontinuity
and the infimum can fail to be attained.

$W_p$ is a metric only on $\mathcal{P}_p$. Between two measures with infinite
$p$-th moment it can be $+\infty$, so on the whole of $\mathcal{P}(X)$ it is an
extended metric and statements like "$W_2$ metrises weak convergence" are wrong
without the moment qualification: $W_p$ convergence is equivalent to weak
convergence _plus_ convergence of $p$-th moments.

Kantorovich-Rubinstein duality in its $1$-Lipschitz form requires the cost to
be the metric itself. For $c = d^2$ there is no Lipschitz dual; the dual
potentials are $c$-concave instead. Brenier's theorem additionally requires
absolute continuity of the source: an atom of $\mu$ must be sent whole to a
single point, so no map exists unless $\nu$ has an atom of at least that mass —
as the first example, where it does not, showed. Strong duality is automatic in
the finite case, which is literally an LP; in general it is Kantorovich's
duality theorem, which again needs $c$ lower semicontinuous and bounded below —
infinite-dimensional linear programs can otherwise have a duality gap.

## Uses and applicability

Reach for optimal transport when the comparison must be geometric — when
distributions with disjoint or nearly disjoint supports should still be ranked
by how far apart they are. Concrete uses: domain adaptation, where the plan
itself gives a correspondence between source and target samples; shape and
colour matching; barycentres, which average distributions by averaging positions
rather than by mixing; and generative modelling, where the Wasserstein GAN
trains a critic to realise the Kantorovich-Rubinstein supremum. The Fréchet
inception distance is the squared $W_2$ between Gaussians fitted to two feature
sets, so a widely used evaluation metric is an optimal transport value in
disguise.

Do not reach for it when there is no meaningful ground metric — transport is
only as good as $c$, and a cost invented for convenience produces a distance
that means nothing. Avoid it too when samples are few and the dimension is high,
and when a cheaper divergence answers the actual question: for testing whether
two samples come from the same distribution, kernel two-sample statistics are
cheaper and converge faster.

## Limitations and common mistakes

The statistical rate is the limitation people meet first. For $\mu$ absolutely
continuous on $\mathbb{R}^d$, the empirical measure of $n$ samples satisfies
$\mathbb{E}\, W_1(\hat\mu_n, \mu) \asymp n^{-1/d}$ for $d > 2$: a small measured
$W_1$ between two sample sets in high dimension may say nothing about the
populations.

The regularised value is not a distance. $\mathrm{OT}_\varepsilon(\mu,\mu) \ne 0$
in general, so using the raw entropic value as a loss biases the optimum; the
Sinkhorn divergence
$\mathrm{OT}_\varepsilon(\mu,\nu) - \tfrac12\mathrm{OT}_\varepsilon(\mu,\mu) - \tfrac12\mathrm{OT}_\varepsilon(\nu,\nu)$
corrects exactly this. Small $\varepsilon$ also underflows, since
$e^{-C/\varepsilon}$ reaches zero in floating point — hence log-domain
implementations.

The Wasserstein GAN's critic enforces the Lipschitz constraint only
approximately. Weight clipping bounds the constant crudely and by an unknown
factor; the gradient penalty penalises the gradient norm only at sampled points
along interpolations between real and generated data, not everywhere. What a
WGAN reports as a "Wasserstein estimate" is a supremum over a parametric family
that is neither all $1$-Lipschitz functions nor reliably contained in them:
useful as a training signal, not as a measurement of $W_1$.

Two smaller errors: conflating the plan with a map, and assuming the optimum is
unique. It need not be — with $c = |x-y|$ on the line, mass moving in the same
direction can often be re-paired at identical cost.

## Variants and alternatives

$W_p$ for $p \ne 1$ changes which plans are penalised: $W_2$ punishes long
moves quadratically and carries the richest theory, $W_\infty$ minimises the
longest single move. **Sliced Wasserstein** averages one-dimensional $W_p$ over
random projections, where the closed form via quantile functions makes each
slice nearly free, at the cost of a weaker, projection-dependent geometry.
**Unbalanced** transport relaxes the marginal constraints with divergence
penalties so that measures of different total mass can be compared.
**Gromov-Wasserstein** compares metric-measure spaces that share no common
space at all, at the price of a nonconvex quadratic problem.
**Entropic** transport is the variant that made large problems computable.

Genuinely different approaches to comparing distributions include maximum mean
discrepancy and other kernel distances, which estimate at $n^{-1/2}$ regardless
of dimension but ignore the ground metric beyond the kernel; $f$-divergences,
which are cheaper but blind to geometry; and adversarial training against a
learned discriminator, which in its original form minimises a Jensen-Shannon
divergence rather than a transport cost.

## History and attribution

Gaspard Monge posed the problem in 1781, in a memoir on cuttings and fillings
for earthworks — the cost was literally the labour of moving soil. Leonid
Kantorovich reformulated it with couplings and found the duality in 1942, while
working on the allocation of resources in a planned economy; that line of work
brought him the Nobel Memorial Prize in Economic Sciences in 1975. The discrete
transportation problem was studied in parallel in 1940s operations research, and
the linear programming machinery developed there applies directly.

The name "Wasserstein" is a historical accident: the distance is Kantorovich's,
and the attribution travelled through later Soviet and Western literature by a
route that is often retold and not always accurately.
"Kantorovich-Rubinstein distance" is the older and better-founded name for the
$p = 1$ case. Brenier's polar factorisation result in the late 1980s revived the
map formulation and tied transport to convex analysis and partial differential
equations. The computational turn came much later, when the matrix-scaling
algorithm known from the 1960s was applied to the entropically regularised
problem.

## Sources

Boyd and Vandenberghe cover the linear programming and duality machinery the
Kantorovich problem is an instance of, including when strong duality holds. MIT
6.253 covers the same material in the convex analysis idiom, with the saddle
point and minimax theory behind the dual. Durrett supplies the measure-theoretic
background — pushforwards, joint distributions with prescribed marginals, weak
convergence and tightness — that the existence argument relies on. The original
GAN paper is cited only for the alternative it represents: adversarial training
against a discriminator, which minimises a Jensen-Shannon divergence rather than
a transport cost. No source in the registry covers optimal transport itself;
the frontmatter records what is consequently uncited.

## Prerequisites and next connections

Read [Measure Theory](./measure-theory.md) first — pushforward measures,
couplings and weak convergence are used without comment above — and
[Probability Theory](./probability-theory.md) for what a coupling means
probabilistically. Convexity is the other prerequisite: the whole subject is a
linear program in disguise, and [Convex Geometry](./convex-geometry.md) covers
the structure of the feasible set, whose extreme points are what a simplex
method returns.

From here, [High-Dimensional Statistics](./high-dimensional-statistics.md)
explains why estimating these distances from samples degrades so sharply with
dimension, and is the right next page for anyone who intends to compute a
Wasserstein distance from data rather than to prove things about one.
