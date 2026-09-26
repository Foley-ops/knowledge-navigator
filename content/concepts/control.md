---
concept_id: concept.applications.control
title: Control
slug: /concepts/control
aliases:
  - control theory
kind: concept
tier: 1
review_state: generated-draft
summary: Control is the design of inputs that make a dynamical system behave as intended, usually by feeding its measured output back to correct its course — the idea behind thermostats, autopilots and robot joints.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.analysis.dynamical_systems
    note: A controller acts on a system whose state evolves by its own dynamics, so stability, equilibria and how perturbations grow or decay are the language control is written in.
  - type: contrasts_with
    target: concept.reinforcement_learning.model_based_reinforcement_learning
    note: Classical optimal control assumes the system's dynamics are known and designs the controller from them, while model-based reinforcement learning has to learn those dynamics from interaction before it can plan.
sources:
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-25
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: State-space, optimal and predictive control literature (state-space models, PID tuning, LQR and the Kalman filter, model predictive control)
    reason: The state-space form of linear systems, the linear-quadratic regulator and its Riccati equation, the Kalman filter, and model predictive control are described from the control-engineering literature; the registry holds a signals-and-systems course and a reinforcement learning text, neither of which develops them.
    sections:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Control** is the discipline of choosing the inputs to a dynamical system so
that its behaviour meets a goal: holding a temperature, following a trajectory,
keeping an aircraft level. A **controller** computes those inputs. In
**open-loop** control the inputs are fixed in advance; in **closed-loop**, or
**feedback**, control the controller measures what the system is actually doing
and corrects the input accordingly. Nearly all practical control is feedback
control, because it is what copes with disturbances and imperfect models.

## Why it matters

Control is everywhere machines act on the physical world: engines and power
grids, chemical plants, disk drives, aircraft, cars, and every joint of every
robot. It is also the older twin of reinforcement learning — both are about
choosing actions over time to steer a system — and ideas pass freely between
them. Understanding control explains why a learned policy that works in
simulation can still oscillate or diverge on hardware.

## Intuition

Steering a car along a lane is feedback control. You compare where the car is
with where it should be and turn the wheel in proportion to the error. Turn too
little and you drift; turn too much and you overshoot, then overcorrect, and the
car weaves. Good control is the balance between responding fast enough to fix
errors and not so aggressively that the correction becomes the problem.

Feedback can also make an unstable system stable. A pencil balanced on a
fingertip falls on its own, but constant small corrections keep it upright — the
closed loop has different dynamics from the system alone.

## Concrete example

Take a discrete-time system $x_{k+1} = a x_k + b u_k$ with $a = 1.2$ and $b = 1$.
Left alone, any deviation grows by 20% a step:

```text
no control (u = 0):        10.0   12.0   14.4   17.28   ...  diverges
feedback u = -0.7 x:       10.0    5.0    2.5    1.25   ...  converges
```

With the feedback law $u_k = -k x_k$ the closed loop becomes
$x_{k+1} = (a - bk)\,x_k$, so choosing $k = 0.7$ moves the multiplier from $1.2$
to $0.5$ and the deviation halves every step. The closed loop is stable exactly
when $|1.2 - k| < 1$, that is for $0.2 < k < 2.2$. A gain near the upper end
makes the multiplier negative, so the state flips sign each step while shrinking
— the discrete-time version of the weaving car.

## Formal treatment

A linear time-invariant system in state-space form is

$$
\dot{x}(t) = A x(t) + B u(t), \qquad y(t) = C x(t),
$$

with state $x$, input $u$ and measured output $y$. Under state feedback
$u = -Kx$ the closed loop is $\dot{x} = (A - BK)x$, and it is asymptotically
stable exactly when every eigenvalue of $A - BK$ has negative real part; in
discrete time the condition is that every eigenvalue lies strictly inside the
unit circle, which is the $|a - bk| < 1$ of the example.

The **proportional–integral–derivative** controller, the workhorse of
industry, acts on the error $e(t)$ between setpoint and output:

$$
u(t) = K_p\, e(t) + K_i \int_0^t e(\tau)\, d\tau + K_d\, \frac{de}{dt}.
$$

The proportional term reacts to the present error, the integral term removes
steady-state offset, and the derivative term damps the response by reacting to
how fast the error is changing.

## Assumptions and requirements

- **A model good enough for the design.** Classical design assumes the dynamics
  are known, often linear and time-invariant; real systems are nonlinear and
  drift, and designs must be robust to the mismatch.
- **Measurement.** Feedback needs the output, or the state, measured with
  adequate accuracy and delay; noisy or delayed sensing limits achievable
  performance, and an unobserved state must be estimated.
- **Actuator limits.** Inputs saturate. A controller designed as if they did not
  can wind up and behave badly when they do.
- **Controllability.** The inputs must be able to influence every part of the
  state that needs correcting; for a linear system this is a rank condition on
  $A$ and $B$.

## Uses and applicability

Use PID control for single-loop regulation where a simple, tunable controller
suffices — temperatures, speeds, pressures. Use state-space methods for
multivariable systems, optimal control where a cost trades performance against
effort, and model predictive control where constraints on states and inputs must
be respected. Reach for learning-based control when the dynamics are too complex
to model but can be experienced safely, as in simulation.

## Limitations and common mistakes

**More gain is not better.** Increasing gain speeds the response until it causes
overshoot, oscillation and then instability, as the example shows above
$k = 2.2$.

**Ignoring delay.** Delay in the loop erodes stability margins; a controller that
is stable on paper can oscillate once sensing and actuation take time.

**Designing to the model, deploying to the plant.** A controller tuned to a
nominal model can fail on the real system unless robustness to model error is
designed in.

**Derivative action on noisy measurements.** Differentiating a noisy signal
amplifies the noise, which is why derivative terms are usually filtered.

## Variants and alternatives

- **Optimal control** chooses inputs minimising a cost; for linear systems with
  quadratic cost the linear–quadratic regulator gives an optimal state-feedback
  gain.
- **Estimation and control** pair a controller with a state estimator such as the
  Kalman filter when the state is not measured directly.
- **Model predictive control** repeatedly solves an optimisation over a finite
  horizon and applies only the first input.
- **Reinforcement learning** addresses the same sequential decision problem when
  the dynamics are unknown and a policy must be learned from reward, and dynamic
  programming is common ground between the two.

## History and attribution

Feedback regulation long predates its theory; Watt's centrifugal governor
regulated steam engines in the eighteenth century, and Maxwell analysed governor
stability in 1868. Frequency-domain methods grew up around feedback amplifiers
and servomechanisms in the first half of the twentieth century, and state-space
methods, optimal control and the Kalman filter around 1960. Sutton and Barto trace
reinforcement learning's roots partly to optimal control and Bellman's dynamic
programming.

## Sources

MIT's signals and systems course covers feedback, closed-loop dynamics and
stability, the pole-placement view of the example, and discrete-time systems.
Sutton and Barto connect control to reinforcement learning and trace the shared
history through optimal control and dynamic programming.

## Prerequisites and next connections

Read [Dynamical Systems](./dynamical-systems.md) for stability and equilibria,
and [Ordinary Differential Equations](./ordinary-differential-equations.md) for
the continuous-time models.

From here, [Robotics](./robotics.md) applies control to machines that move,
[Forecasting](./forecasting.md) supplies the predictions predictive control
needs, and [Model-Based Reinforcement Learning](./model-based-reinforcement-learning.md)
is control when the model has to be learned.
