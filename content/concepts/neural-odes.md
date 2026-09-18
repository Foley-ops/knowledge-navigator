---
concept_id: concept.deep_learning.neural_odes
title: Neural ODEs
slug: /concepts/neural-odes
aliases:
  - neural ordinary differential equations
  - ODE-Net
kind: method
tier: 1
review_state: generated-draft
summary: A model family that replaces a stack of layers with a learned vector field, computing its output by numerically integrating an initial value problem and training it with the adjoint method at memory cost independent of how many solver steps are taken.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: generalizes
    target: concept.deep_learning.residual_connection
    note: A residual block is one explicit Euler step of a neural ODE with step size one, so the continuous model contains the residual update as a particular discretisation.
  - type: requires
    target: concept.analysis.ordinary_differential_equations
    note: The model is literally an initial value problem, and its well-posedness, its flow map and its numerical solution are ODE facts a reader needs before the architecture makes sense.
  - type: contributes_to
    target: concept.deep_learning.flow_matching
    note: Flow matching trains the same learned vector field that a neural ODE defines, replacing differentiation through the solver with regression onto a prescribed target field.
  - type: contrasts_with
    target: concept.deep_learning.state_space_models
    note: Both are continuous-time models that get discretised, but a state space model keeps the dynamics linear so the solution has a closed form, while a neural ODE takes a nonlinear field and pays for a numerical solver.
sources:
  - source_id: source.chen2018.neural_ode
    title: Neural Ordinary Differential Equations
    url: https://arxiv.org/abs/1806.07366
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.he2016.deep_residual_learning
    title: Deep Residual Learning for Image Recognition
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - intuition
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.lipman2023.flow_matching
    title: Flow Matching for Generative Modeling
    url: https://arxiv.org/abs/2210.02747
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Augmented Neural ODEs (Dupont, Doucet and Teh)
    reason: The crossing-trajectory expressivity limit, the nested disc-and-annulus counterexample and the augmentation fix come from this paper, which is not in the source registry, and no registered source covers them.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Numerical accuracy of the naive adjoint, and checkpointed or interpolated alternatives
    reason: The finding that reconstructing the forward trajectory by reverse integration can give inaccurate gradients, and the checkpointing remedies for it, are later work that the registry does not list.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **neural ODE** parameterises the _derivative_ of a hidden state with a neural
network and defines the model's output as the solution of an initial value
problem:

$$
\frac{d h(t)}{dt} \;=\; f_\theta\big(h(t), t\big), \qquad h(t_0) = x,
\qquad h(t_1) \;=\; x + \int_{t_0}^{t_1} f_\theta\big(h(t), t\big)\, dt ,
$$

where $h(t) \in \mathbb{R}^d$ is the state, $f_\theta$ is any network mapping
$(\mathbb{R}^d, \mathbb{R}) \to \mathbb{R}^d$, and $h(t_1)$ is handed to a
readout layer. The integral is evaluated by a black-box numerical solver. There
is no layer count: the number of times $f_\theta$ is evaluated is chosen by the
solver's step controller and can differ between two forward passes of the same
model.

## Why it matters

Four things follow that a discrete stack does not give you. First, gradients
can be obtained by solving a second ODE backwards in time, so training memory is
**constant in depth** — no per-layer activations are stored. Second, accuracy and
compute become a dial rather than an architecture choice: tightening the solver
tolerance at evaluation time buys precision without retraining. Third, the model
is defined in continuous time, so observations that arrive at irregular instants
need no binning; Chen et al. build a latent-ODE time-series model on exactly this.
Fourth, for a continuous flow the change-of-variables formula involves a _trace_
rather than a log-determinant, which is what made continuous normalizing flows
with unrestricted $f_\theta$ tractable.

## Intuition

The residual update $h_{t+1} = h_t + f(h_t, \theta_t)$ is an explicit Euler step
with step size one. Keep adding blocks while making each one do less, and the
sequence of states becomes a trajectory; the limit object is a velocity field.
Instead of a pile of transformations you have a flow: data points drift, and
training shapes the field so that the classes drift apart.

The analogy has two seams. A residual network has fresh parameters per block,
while a plain neural ODE reuses one $f_\theta$ for all $t$ and recovers some of
that freedom only by taking $t$ as an input. And a discrete block can do
something a flow cannot — the map a neural ODE computes is always a
homeomorphism, whereas a ReLU block can collapse and fold.

## Concrete example

Take $d = 1$ and the linear field $f(h) = -h$, with $h(0) = 2$ and $t_1 = 1$.
The exact flow gives $h(1) = 2e^{-1} = 0.7358$. Euler with four steps of $0.25$
multiplies by $0.75$ each step: $2 \times 0.75^4 = 0.6328$. With sixteen steps of
$0.0625$: $2 \times 0.9375^{16} = 0.7121$. The four-step version _is_ a
four-block residual network with tied weights; the sixteen-step version is a
deeper one; the neural ODE is the object both of them approximate, and the solver
decides which of them you actually run.

In code, using the reference implementation's adjoint solver:

```python
import torch
from torch import nn
from torchdiffeq import odeint_adjoint as odeint

class Field(nn.Module):
    def __init__(self, dim=2, hidden=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim + 1, hidden), nn.Tanh(), nn.Linear(hidden, dim)
        )

    def forward(self, t, h):                 # the solver calls f(t, h)
        return self.net(torch.cat([h, t.expand(h.shape[0], 1)], dim=1))

field = Field()
x = torch.randn(32, 2)
h1 = odeint(field, x, torch.tensor([0.0, 1.0]), rtol=1e-5, atol=1e-5)[-1]
h1.sum().backward()                          # gradients via the adjoint ODE
```

## Formal treatment

Write $L = L(h(t_1))$ for the loss and define the **adjoint**
$a(t) = \partial L / \partial h(t)$, a column vector in $\mathbb{R}^d$. It obeys its
own ODE, run backwards from $t_1$:

$$
\frac{d a(t)}{dt} \;=\; -\, a(t)^{\top} \frac{\partial f_\theta(h(t), t)}{\partial h},
\qquad
\frac{d L}{d \theta} \;=\; -\int_{t_1}^{t_0} a(t)^{\top}
\frac{\partial f_\theta(h(t), t)}{\partial \theta}\, dt .
$$

In practice one integrates the augmented state $[h(t), a(t), \partial L/\partial\theta]$
from $t_1$ back to $t_0$, initialised with the forward solve's endpoint
$h(t_1)$, with $a(t_1) = \partial L / \partial h(t_1)$, and with a zero parameter
gradient. Both integrands are vector-Jacobian products, so each costs one
reverse-mode pass through $f_\theta$ alone — never through the solver. Memory is
$O(1)$ in the number of steps: only the augmented state is held. It is emphatically
not $O(1)$ in $d$ or in the size of $f_\theta$.

Two structural facts follow from Picard–Lindelöf. If $f_\theta$ is Lipschitz in
$h$ and continuous in $t$, the solution is unique, and the map
$\varphi: x \mapsto h(t_1)$ is a homeomorphism of $\mathbb{R}^d$, invertible by
integrating backwards. Hence **trajectories cannot cross**, and $\varphi$ cannot
change the topology of the input. In one dimension $\varphi$ must be increasing,
so no neural ODE realises $x \mapsto -x$. In two dimensions, a disc surrounded by
an annulus stays surrounded, so no linear readout on $\varphi$ can separate them.
Augmented neural ODEs fix this by running the flow in $\mathbb{R}^{d+p}$ with
$h(t_0) = [x, 0]$: the lifted map is still a homeomorphism, but its projection
back to $\mathbb{R}^d$ need not be, so the trajectories may cross when viewed in
the original coordinates.

For densities, if $z(t)$ follows the ODE then

$$
\frac{\partial \log p(z(t))}{\partial t} \;=\; -\operatorname{tr}\!\left(
\frac{\partial f_\theta}{\partial z(t)} \right),
$$

a trace over $d$ terms rather than a determinant over a $d \times d$ matrix, and
the trace can be estimated stochastically.

## Assumptions and requirements

$f_\theta$ must be Lipschitz in $h$, uniformly over the interval, for a unique
solution to exist; drop it and you get non-uniqueness or blow-up in finite time.
Networks with bounded weights are locally Lipschitz, so this rarely bites in
practice, but a field whose magnitude grows superlinearly in $\|h\|$ can escape
before $t_1$.

The adjoint derivation assumes the forward trajectory $h(t)$ is available at
every $t$ on the way back. The naive implementation does not store it — it
_reconstructs_ it by integrating $f_\theta$ backwards from $h(t_1)$. That is
exact for the true ODE and only approximate for the discretised one, and the two
solves need not retrace each other. For stiff or strongly contracting dynamics
the reconstruction drifts and the gradients are wrong in a way no tolerance on
the backward solve detects.

If the loss touches intermediate times $t_i$, the adjoint is not continuous
there: it jumps by $\partial L / \partial h(t_i)$ at each observation. And for an
_autonomous_ field, the integration interval is not an extra degree of freedom —
rescaling $t_1$ is the same model as rescaling $f_\theta$.

## Uses and applicability

Reach for a neural ODE when continuous time is genuine: irregularly sampled
clinical or physical series, latent dynamics with a mechanistic reading, or
problems where the trajectory between observations matters. Reach for it when you
need an invertible map with a cheap density correction — continuous normalizing
flows are the clearest win, because $f_\theta$ needs no triangular Jacobian or
coupling structure. Reach for it when activation memory binds.

Do not reach for it for ordinary supervised vision or language work. On MNIST the
original paper reports accuracy comparable to a small residual network at roughly
a third of the parameters — comparable, not better, and a benchmark result rather
than a law. Wall-clock cost is the reason: function evaluations grow as training
makes the dynamics stiffer, so epochs slow down with nothing in the architecture
changing.

## Limitations and common mistakes

The most common error is reading "memory constant in depth" as "cheap". Time is
not constant: the backward solve roughly doubles the work of a forward pass, and
adaptive solvers pay for rejected steps too.

The second is treating the adjoint as reverse-mode autodiff in continuous
clothing. It is not. Backpropagating through the solver's steps
(discretise-then-optimise) and solving the adjoint ODE (optimise-then-discretise)
give different numbers; the adjoint's gradient error is governed by solver
tolerance, and checkpointing the forward trajectory is the usual fix when it
matters, at the memory cost the adjoint was meant to avoid.

The third is expecting arbitrary expressivity. A neural ODE flow is a
homeomorphism, so functions that require trajectories to cross are out of reach
at any width and any integration time — augmentation, a non-invertible readout,
or an input-dependent field is required.

The fourth is forgetting that tolerance is part of the model. A network trained
at `rtol=1e-3` computes a different function at `rtol=1e-7`; benchmark numbers
that do not state tolerances are not reproducible.

## Variants and alternatives

**Augmented neural ODEs** add dimensions to escape the crossing constraint and,
empirically, train with fewer function evaluations. **Regularised neural ODEs**
penalise the field so trajectories are straighter, buying lower solver cost at
the price of a modelling bias. **Neural SDEs** add a diffusion term; **neural
controlled differential equations** drive the field with an interpolated input
path, which suits irregular sequences better than conditioning on $t$ alone.
**Hamiltonian and second-order** variants impose physical structure and can be
integrated symplectically.

The genuinely different competitors: **flow matching** and probability-flow
approaches keep the learned vector field but train it by regression onto a
prescribed target field, so no solver enters the training loop — at the cost of
committing to a probability path. **Reversible residual networks** give $O(1)$
activation memory with exact discrete gradients and no solver. **Deep equilibrium
models** get constant memory from an implicit fixed point. Plain **gradient
checkpointing** buys the memory saving for any architecture at a predictable time
penalty.

## History and attribution

The residual block of He and colleagues supplied the form; several groups
observed around 2017 that iterating it is Euler's method and that the
dynamical-systems literature therefore applies. Chen, Rubanova, Bettencourt and
Duvenaud made the idea a practical model in _Neural Ordinary Differential
Equations_ (2018), which won a best-paper award at NeurIPS that year: they
treated the ODE solver as a black box, imported the adjoint for memory-constant
gradients, and used the continuous change of variables to build continuous
normalizing flows and latent-ODE time series models.

The adjoint itself is much older, and the paper says so: it is adjoint
sensitivity analysis from optimal control, associated with Pontryagin and
co-workers around 1960 and standard in PDE-constrained optimisation and data
assimilation long before it met deep learning. The novelty in 2018 was the
framing and the software, not the calculus.

## Sources

_Neural Ordinary Differential Equations_ is the reference for everything
structural here: the model, the adjoint system, the continuous change of
variables, the latent-ODE application, and the growth of function evaluations
during training. _Deep Residual Learning for Image Recognition_ supplies the
discrete update the continuous model generalises. MIT 18.03 covers the initial
value problem, existence and uniqueness, and Euler's method. _Flow Matching for
Generative Modeling_ is the reference for the simulation-free alternative. Two
topics are named without citation and recorded in `unresolved_references`: the
augmentation literature, and later work on adjoint gradient accuracy.

## Prerequisites and next connections

Read [Ordinary Differential Equations](./ordinary-differential-equations.md)
first — the initial value problem, existence and uniqueness, and what a flow is —
and then [Residual Connection](./residual-connection.md), since the construction
starts from reading that update as a step of Euler's method.
[Backpropagation](./backpropagation.md) makes the contrast with the adjoint
legible.

From here, [Normalizing Flows](./normalizing-flows.md) is the discrete
counterpart whose log-determinant constraint the continuous version removes, and
[Flow Matching](./flow-matching.md) shows how the same vector field is trained
today without calling a solver at all.
[Dynamical Systems](./dynamical-systems.md) supplies the stability and stiffness
language that explains why some learned fields become expensive to integrate.
