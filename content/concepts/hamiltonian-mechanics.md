---
concept_id: concept.physics.hamiltonian_mechanics
title: Hamiltonian Mechanics
slug: /concepts/hamiltonian-mechanics
aliases:
  - Hamiltonian formalism
kind: concept
tier: 1
review_state: generated-draft
summary: A reformulation of classical mechanics in which one scalar energy function generates a first-order flow on phase space, and that flow preserves a geometric structure strong enough to force conservation of volume.
categories:
  - Mathematics/Mathematical Physics
primary_category: Mathematics/Mathematical Physics
relationships:
  - type: requires
    target: concept.analysis.ordinary_differential_equations
    note: Hamilton's equations are a system of first-order ODEs, and it is Picard-Lindelof that turns them into a well-defined flow map with a maximal interval of existence.
  - type: specializes
    target: concept.analysis.dynamical_systems
    note: A Hamiltonian flow is a continuous-time dynamical system with an extra constraint — volume preservation — that rules out the attractors a general flow may have.
  - type: contributes_to
    target: concept.physics.statistical_mechanics
    note: Liouville's theorem supplies the invariant measure on phase space that the microcanonical and canonical ensembles are built on.
  - type: used_to_solve
    target: concept.probability.bayesian_inference
    note: Hamiltonian Monte Carlo treats the negative log posterior as a potential energy and uses simulated Hamiltonian trajectories as Metropolis proposals.
sources:
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - formal-treatment
      - concrete-example
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mactutor.archive
    title: MacTutor History of Mathematics Archive
    url: https://mathshistory.st-andrews.ac.uk/
    source_kind: reference-documentation
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Symplectic geometry of classical mechanics
    reason: The registry has no classical-mechanics or symplectic-geometry text, so the symplectic form, Darboux's theorem, the hyperregularity condition on the Legendre transform and Liouville's theorem are stated here from standard results without a citation that treats them directly.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Backward error analysis of symplectic integrators
    reason: The claim that a symplectic integrator exactly conserves a nearby modified Hamiltonian, and therefore shows bounded rather than drifting energy error, comes from geometric numerical integration, and the registry holds no source on that subject.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Hamiltonian mechanics** represents the state of a mechanical system as a
single point $(q, p)$ of a $2n$-dimensional **phase space** and lets one scalar
function $H(q, p, t)$ — the Hamiltonian, usually the total energy — generate the
motion through **Hamilton's equations**

$$
\dot q^{\,i} = \frac{\partial H}{\partial p_i},
\qquad
\dot p_i = -\frac{\partial H}{\partial q^{\,i}},
\qquad i = 1, \dots, n .
$$

Here $q = (q^1, \dots, q^n)$ are generalised coordinates on a configuration
space $Q$ and $p = (p_1, \dots, p_n)$ are the conjugate momenta, so phase space
is the cotangent bundle $T^{*}Q$. Newton's second law is second order in $n$
unknowns; this is first order in $2n$, and the doubling is not bookkeeping — the
$2n$-dimensional space carries a geometric structure, the symplectic form, that
the flow preserves.

## Why it matters

Three things follow from that structure and none of them is visible in Newton's
formulation.

First, **conservation is automatic**. If $H$ does not depend on time explicitly,
$H$ is constant along every trajectory, so motion is confined to a level set.
Any coordinate $q^{\,i}$ absent from $H$ makes its momentum $p_i$ constant.

Second, **the flow preserves phase-space volume** — Liouville's theorem. That
single fact is the foundation on which statistical mechanics puts a measure on
phase space: without an invariant measure there is no canonical ensemble
$\propto e^{-\beta H}$ and no equilibrium to average over.

Third, the same structure is what makes **Hamiltonian Monte Carlo** correct.
Simulated physics is used as a proposal mechanism for sampling a probability
distribution, and volume preservation is exactly the property that lets the
Metropolis acceptance ratio be written without a Jacobian correction.

## Intuition

Draw the contours of $H$ on the plane $(q, p)$. The gradient $\nabla H$ points
uphill; the Hamiltonian vector field is that gradient rotated by ninety degrees,
so the motion runs _along_ a contour instead of across it. Energy conservation
is not an extra law imposed on the system — it is the geometry of the rotation.

Now picture the whole of phase space as an incompressible fluid sliding along
those contours. A blob of initial conditions can be stretched and folded beyond
recognition, but its volume never changes: a Hamiltonian system cannot have a
sink, a limit cycle or a strange attractor, because all of those need volume to
shrink.

The fluid analogy is honest about volume and misleading about everything finer.
Symplecticity is strictly stronger than volume preservation once $n > 1$:
Gromov's non-squeezing theorem says a phase-space ball of radius $r$ can never
be mapped by a Hamiltonian flow inside a cylinder of smaller radius in a
conjugate coordinate pair, even though a volume-preserving map could do it
easily. The fluid can be stirred, but not squeezed through a narrow neck in a
$(q^{\,i}, p_i)$ plane.

## Concrete example

Take the harmonic oscillator with unit mass and unit frequency:
$H(q, p) = \tfrac{1}{2}(p^2 + q^2)$. Hamilton's equations are $\dot q = p$ and
$\dot p = -q$, whose exact flow is rotation of the $(q, p)$ plane through angle
$t$. Trajectories are circles of radius $\sqrt{2E}$; the rotation matrix has
determinant $1$, so area is preserved exactly.

Now integrate it numerically with the **leapfrog** (Störmer–Verlet) scheme at
step $\varepsilon$: a half kick, a drift, a half kick. One step is the linear
map

$$
M_\varepsilon =
\begin{bmatrix}
1 - \tfrac{\varepsilon^2}{2} & \varepsilon \\[2pt]
-\varepsilon + \tfrac{\varepsilon^3}{4} & 1 - \tfrac{\varepsilon^2}{2}
\end{bmatrix},
\qquad
\det M_\varepsilon = 1 \ \text{exactly, for every } \varepsilon .
$$

With $\varepsilon = 0.3$ and $(q_0, p_0) = (1, 0)$, one step gives
$(q_1, p_1) = (0.955,\, -0.29325)$. The true energy moved from
$H = 0.5$ to $H = 0.499010$ — it did not stay put. But the quantity
$\tilde H = \tfrac{1}{2}p^2 + \tfrac{1}{2}(1 - \tfrac{\varepsilon^2}{4})q^2$
equals $0.48875$ at both points, exactly. The numerical trajectory is the exact
trajectory of a slightly different Hamiltonian, so the energy error oscillates
inside a band of width $O(\varepsilon^2)$ forever instead of drifting. Here
$H$ stays within $[0.48875,\, 0.5]$, an error of $2.3\%$, for as many steps as
you care to take.

Push $\varepsilon$ to $2$ and $\lvert \operatorname{tr} M_\varepsilon \rvert =
\lvert 2 - \varepsilon^2 \rvert$ reaches $2$: beyond that the map is hyperbolic
and the numerical orbit diverges. Area preservation survives, accuracy does not.

## Formal treatment

Let $(M, \omega)$ be a symplectic manifold: $M$ smooth of dimension $2n$ and
$\omega$ a closed ($d\omega = 0$), non-degenerate two-form. On $T^{*}Q$ with
canonical coordinates, $\omega = \sum_i dq^{\,i} \wedge dp_i$. Given
$H \in C^\infty(M)$, the **Hamiltonian vector field** $X_H$ is defined by

$$
\iota_{X_H}\omega = dH ,
$$

which in canonical coordinates is exactly Hamilton's equations. (Sign
conventions differ between texts; the pairing above is the one that reproduces
the signs used here.)

Let $\varphi_t$ be the flow of $X_H$. By Cartan's formula,
$\mathcal{L}_{X_H}\omega = d(\iota_{X_H}\omega) + \iota_{X_H}(d\omega)
= d(dH) + 0 = 0$, so $\varphi_t^{*}\omega = \omega$: the flow is
**symplectic**. Since $\omega^n/n!$ is a volume form — Lebesgue measure
$dq\,dp$ in canonical coordinates — this gives **Liouville's theorem**: the flow
preserves phase-space volume. The elementary version is the same computation
without the forms,

$$
\nabla \cdot X_H
= \sum_i \frac{\partial}{\partial q^{\,i}}\frac{\partial H}{\partial p_i}
+ \frac{\partial}{\partial p_i}\left(-\frac{\partial H}{\partial q^{\,i}}\right)
= 0 ,
$$

by equality of mixed partials, which needs $H \in C^2$.

The **Poisson bracket** $\{f, g\} = \sum_i \partial_{q^i} f\, \partial_{p_i} g -
\partial_{p_i} f\, \partial_{q^i} g$ makes the evolution of any observable
$\dot f = \{f, H\} + \partial_t f$; taking $f = H$ gives $\dot H = \partial_t H$,
so energy is conserved precisely when $H$ has no explicit time dependence.

The bridge to the Lagrangian formulation is the **Legendre transform**. Given
$L(q, \dot q, t)$, set $p_i = \partial L / \partial \dot q^{\,i}$ and

$$
H(q, p, t) = \sum_i p_i \dot q^{\,i} - L(q, \dot q, t) ,
$$

with $\dot q$ eliminated in favour of $p$. That elimination is possible only
where the map $\dot q \mapsto p$ is invertible, which by the inverse function
theorem requires the Hessian $\partial^2 L / \partial \dot q^{\,i} \partial
\dot q^{\,j}$ to be non-singular. For $L = \tfrac12 \dot q^{\top} A \dot q -
V(q)$ with $A$ positive definite this always holds. When it fails the system is
degenerate — the case of gauge theories — and the naive transform produces
constraints rather than a Hamiltonian, requiring the constrained formalism
instead.

Darboux's theorem says every symplectic manifold looks locally like the
canonical $(\mathbb{R}^{2n}, \sum dq \wedge dp)$, so canonical coordinates
always exist locally, and symplectic geometry has no local invariants
corresponding to curvature.

## Assumptions and requirements

$H$ must be $C^2$ for the divergence argument and for $X_H$ to be locally
Lipschitz, which is what existence and uniqueness need. Without uniqueness there
is no flow map to preserve anything.

The flow must also be **complete** for $\varphi_t$ to be globally defined.
Completeness is not automatic: a potential unbounded below, such as
$H = \tfrac12 p^2 - q^4$, sends trajectories to infinity in finite time, and
$\varphi_t$ then exists only on a maximal interval. Compact energy level sets
are the usual sufficient condition.

Energy conservation requires $\partial_t H = 0$. Symplecticity does **not**:
a time-dependent $H$ still generates a symplectic flow, so Liouville's theorem
holds while energy conservation fails. These two assumptions are routinely
conflated.

The Lagrangian correspondence requires the non-degenerate Hessian above.
Dissipation is outside the framework in the sense that matters: friction
contracts phase-space volume, so no time-independent Hamiltonian on the same
phase space with the canonical structure can generate it. Rescaled variables
with an explicitly time-dependent Hamiltonian can reproduce damped equations,
but then $p$ is no longer the physical momentum.

For Hamiltonian Monte Carlo the requirement is that the target density is
positive on all of $\mathbb{R}^n$ and differentiable, so $U = -\log \pi$ has a
computable gradient. Discrete parameters have no gradient and are excluded.

## Uses and applicability

Reach for the Hamiltonian formulation when structure matters more than solving:
conserved quantities, perturbation theory, the long-time behaviour of celestial
and molecular dynamics, the passage to quantum mechanics through canonical
quantisation, and the derivation of ensembles in statistical mechanics.

The use that earns this page its place in a machine-learning corpus is
**Hamiltonian Monte Carlo**. To sample $\pi(q) \propto e^{-U(q)}$, augment the
state with a momentum $p \sim \mathcal{N}(0, M)$ and sample the joint density
$\propto \exp(-H(q,p))$ with $H(q,p) = U(q) + \tfrac12 p^{\top}M^{-1}p$, whose
$q$-marginal is exactly the target. A proposal is $L$ leapfrog steps followed by
a momentum flip, accepted with probability $\min\{1, \exp(H_{\text{old}} -
H_{\text{new}})\}$:

```python
def leapfrog(q, p, eps, steps, grad_U):
    p = p - 0.5 * eps * grad_U(q)
    for _ in range(steps):
        q = q + eps * p
        p = p - eps * grad_U(q)
    p = p + 0.5 * eps * grad_U(q)   # the last full kick was a half kick too many
    return q, -p                    # flipping p makes the map an involution
```

Detailed balance for that acceptance rule needs two properties of the map, and
energy conservation is not one of them. It needs **reversibility** — with the
flip, the map is its own inverse — and **volume preservation**, so that the
Jacobian determinant is $1$ and drops out of the ratio. A symplectic integrator
delivers both for free. The exact flow would be accepted with probability one;
the Metropolis step exists only to correct the discretisation error.

Do not reach for it when the system is dissipative, when you only want a
steady state and not a trajectory, or when the problem is stiff enough that the
explicit leapfrog step size collapses.

## Limitations and common mistakes

**"The Hamiltonian is the energy."** Only when the coordinates do not depend
explicitly on time and the potential is velocity-independent. In a rotating
frame $H$ is a different conserved quantity, and stating it as energy gets the
physics wrong.

**"Symplectic means volume-preserving."** It implies it, and for $n = 1$ it is
the same thing, but non-squeezing shows the implication is strict in higher
dimensions. Conversely, a volume-preserving integrator need not be symplectic —
HMC's correctness needs only the volume preservation, while the bounded energy
error that keeps acceptance rates high needs the symplecticity.

**"A better integrator would conserve energy exactly."** High-order
non-symplectic schemes can beat leapfrog over a few steps and still lose, because
their energy error drifts secularly instead of oscillating. In HMC the drift
shows up as an acceptance rate that decays with trajectory length.

**"Hamiltonian systems are solvable."** Integrable systems are the exception,
not the rule. Generic perturbations of an integrable system destroy most
invariant tori and produce chaos, and the fact that volume is conserved does not
make the dynamics predictable.

**Adaptive steps break the sampler.** Choosing $\varepsilon$ from the state
partway along a trajectory destroys reversibility, and the chain then converges
to the wrong distribution while looking perfectly healthy. Step size adaptation
belongs in warm-up, where the resulting chain is discarded.

## Variants and alternatives

The **Lagrangian** formulation is the same content on $TQ$ rather than $T^{*}Q$,
better suited to constraints and relativistic field theory, and converted by the
Legendre transform when that transform is regular. **Hamilton–Jacobi** theory
replaces the ODE system with a single partial differential equation for a
generating function, which pays off for integrable systems and is otherwise
harder than what it replaces. **Poisson manifolds** relax non-degeneracy, which
is how rigid-body rotation gets a bracket on an odd-dimensional space.
**Port-Hamiltonian** models add dissipation and inputs deliberately, giving up
conservation to describe real engineered systems.

Among integrators, leapfrog is second order and costs one gradient per step;
Yoshida-style compositions reach fourth order at roughly three gradients per
step and use backward substeps; implicit Gauss–Legendre Runge–Kutta methods are
symplectic at any order but require solving nonlinear equations each step.

Among samplers, the **Metropolis-adjusted Langevin algorithm** is the
single-step limit, cheaper but with a random-walk character HMC avoids; the
**No-U-Turn Sampler** removes the trajectory-length tuning parameter and is the
default in probabilistic programming systems; **Riemannian-manifold HMC** makes
the mass matrix position-dependent to handle badly conditioned targets, at the
cost of implicit integration steps.

## History and attribution

Lagrange's _Mécanique analytique_ (1788) had already recast Newtonian mechanics
variationally. William Rowan Hamilton introduced the canonical equations in two
papers on a general method in dynamics in 1834 and 1835; he arrived there from
geometrical optics, having built the same machinery of characteristic functions
for systems of rays several years earlier, and the optical–mechanical analogy is
the reason the formalism looks the way it does. Jacobi reworked and extended the
theory shortly afterwards, giving the Hamilton–Jacobi equation. Poisson's
bracket predates both, from 1809. Liouville proved the invariance of
phase-space volume in 1838, in work on the variation of arbitrary constants.
Poincaré's celestial-mechanics work at the end of the century showed that such
systems are generically non-integrable. The word _symplectic_ is much later —
Hermann Weyl coined it in 1939 as a Greek calque to avoid a clash with the word
"complex".

Hamiltonian Monte Carlo has a separate lineage. It was introduced as _hybrid
Monte Carlo_ by Duane, Kennedy, Pendleton and Roweth in 1987 for lattice quantum
chromodynamics, where the alternative was unusably slow, and was brought into
statistics and machine learning by Radford Neal in the following decade.

## Sources

MathWorld's entries on Hamilton's equations, the Legendre transformation and
Liouville's phase-space theorem cover the definitions and identities stated
here, and the harmonic oscillator worked in the example. MacKay's _Information
Theory, Inference, and Learning Algorithms_ presents Hamiltonian Monte Carlo
with the leapfrog integrator alongside the Metropolis method, and is where the
detailed-balance requirements come from. Murphy's _Probabilistic Machine
Learning_ covers the practical sampler — mass matrices, tuning, the No-U-Turn
Sampler and its relatives. The MacTutor archive is the check on the biographical
claims in the history section. Two gaps are declared in the frontmatter: no
registry source treats symplectic geometry directly, and none covers the
backward error analysis behind the shadow Hamiltonian in the example.

## Prerequisites and next connections

Read [Ordinary Differential Equations](./ordinary-differential-equations.md)
first — Hamilton's equations are an ODE system, and existence, uniqueness and
maximal intervals of existence are what make the flow well defined.
[Multivariable Calculus](./multivariable-calculus.md) supplies the partial
derivatives and the divergence computation, and
[Calculus of Variations](./calculus-of-variations.md) gives the Lagrangian side
that the Legendre transform converts from.

From here, [Dynamical Systems](./dynamical-systems.md) places Hamiltonian flows
among flows in general and shows what volume preservation forbids, while
[Chaos](./chaos.md) is what happens inside an energy level set once
integrability fails. [Manifolds](./manifolds.md) and
[Differential Geometry](./differential-geometry.md) are where the symplectic
form stops being a matrix identity and becomes geometry, and
[Lie Groups](./lie-groups.md) is where symmetries of $H$ turn into conserved
momenta. On the applied side,
[Bayesian Inference](./bayesian-inference.md) is the problem Hamiltonian Monte
Carlo attacks, and [Probability Theory](./probability-theory.md) supplies the
invariance and detailed-balance arguments that make the sampler correct.
