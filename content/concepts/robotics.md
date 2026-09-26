---
concept_id: concept.applications.robotics
title: Robotics
slug: /concepts/robotics
kind: concept
tier: 1
review_state: generated-draft
summary: Robotics builds machines that sense, decide and act in the physical world, and it combines perception, state estimation, motion planning and control under an uncertainty that a purely computational task never faces.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.applications.control
    note: Nearly every motion a robot makes is ultimately executed by feedback controllers driving its motors, so control theory sets what motion is physically achievable.
  - type: requires
    target: concept.probability.bayesian_inference
    note: A robot rarely observes its full state directly and instead estimates it by combining uncertain motion with uncertain measurements, which is recursive Bayesian updating.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-25
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-25
unresolved_references:
  - label: Probabilistic robotics and robot-learning literature (SLAM, particle filters, sim-to-real transfer)
    reason: The detailed treatment of simultaneous localisation and mapping, particle and Kalman filters for robots, and the transfer of policies learned in simulation to hardware draws on robotics literature that is not in the source registry.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Robotics** is the design and programming of machines — **robots** — that
perceive their environment through sensors, decide what to do, and act on the
world through actuators such as motors and grippers. A working robot combines
several problems that are studied separately elsewhere: **perception** (making
sense of camera, lidar and touch data), **state estimation** (knowing where it
is and what state it is in), **planning** (choosing a motion or sequence of
actions), and **control** (executing that motion on real motors).

## Why it matters

Robots move intelligence from screens into the physical world: manufacturing,
warehousing, surgery, agriculture, exploration of places people cannot go, and
assistance at home. They also test artificial intelligence harder than almost
anything else. A robot cannot pause the world to think, cannot undo a collision,
and must act on sensor data that is noisy, partial and delayed — so methods that
look solved in simulation are routinely humbled on hardware.

## Intuition

A useful picture is a loop that never stops: **sense, estimate, plan, act**.
Sensors report the world imperfectly; an estimator fuses those reports with what
the robot expected from its own motion into a belief about its state; a planner
chooses what to do next given that belief and the goal; controllers turn the plan
into motor commands; the world responds, and the loop runs again, many times a
second.

The core difficulty is that the robot is always uncertain. Wheels slip, so dead
reckoning drifts; a camera sees a corridor that looks like three others. The
robot must act well without ever knowing its state exactly, which is why
probability runs through the whole field.

## Concrete example

A planar arm with two links of length $1$ places its hand at

$$
x = \cos\theta_1 + \cos(\theta_1 + \theta_2), \qquad
y = \sin\theta_1 + \sin(\theta_1 + \theta_2),
$$

where $\theta_1$ is the shoulder angle and $\theta_2$ the elbow angle. This is
**forward kinematics**: joint angles in, hand position out, one answer.

Going the other way is harder. The point $(1, 1)$ is reached by
$\theta_1 = 90^\circ, \theta_2 = -90^\circ$ and also by
$\theta_1 = 0^\circ, \theta_2 = 90^\circ$ — elbow up and elbow down. **Inverse
kinematics**, finding joint angles for a desired position, can have two
solutions, as here, infinitely many for an arm with spare joints, or none for a
point out of reach. Choosing among them, and avoiding obstacles on the way, is
the planner's job.

## Formal treatment

Robot motion is planned in **configuration space**, the space of all joint
settings. An arm with $n$ joints has an $n$-dimensional configuration space; an
obstacle in the workspace becomes a forbidden region of it, and motion planning
becomes finding a path through the free region. Because that region is hard to
represent exactly in high dimensions, practical planners **sample**:
probabilistic roadmaps and rapidly-exploring random trees build a graph of
random collision-free configurations and search it.

State estimation maintains a belief $b_t(x) = p(x_t \mid z_{1:t}, u_{1:t})$ over
the state given measurements $z$ and controls $u$, updated recursively:

$$
b_t(x_t) \;\propto\; p(z_t \mid x_t) \int p(x_t \mid x_{t-1}, u_t)\, b_{t-1}(x_{t-1})\, dx_{t-1}.
$$

The integral predicts from the motion model; the factor in front corrects with
the measurement. A Kalman filter computes this exactly for linear Gaussian
systems; Monte Carlo localisation represents the belief with samples.

## Assumptions and requirements

- **Models of motion and sensing.** Estimation needs probabilistic models of how
  actions change the state and how the state produces measurements; errors in
  those models become errors in the belief.
- **Real-time computation.** Perception, estimation and control must keep up with
  the physical world, which bounds how much computation each step can use.
- **Safety constraints.** Physical actions carry risk to people and equipment,
  so behaviour must be bounded even when estimates or plans are wrong.
- **Calibration.** Cameras, joint encoders and the geometry relating them must be
  calibrated; small errors compound across the kinematic chain.

## Uses and applicability

Robotics methods apply to industrial manipulators in structured settings, mobile
robots for delivery and warehousing, autonomous vehicles, drones, surgical and
assistive robots, and legged locomotion. Structured, repetitive environments are
where robots are most reliable; unstructured environments shared with people are
where the open problems are.

## Limitations and common mistakes

**Simulation is not reality.** Policies learned or tuned in simulation often
degrade on hardware because friction, sensor noise and contact are modelled
imperfectly; transferring them is its own research problem.

**Ignoring uncertainty.** Planning as if the estimated state were exact produces
plans that fail when the estimate is off; robust behaviour plans with the
uncertainty.

**Sample-hungry learning on hardware.** Reinforcement learning methods that need
millions of trials are impractical on a physical robot, whose trials are slow,
costly and can break things.

**Perception under distribution shift.** Vision systems trained in one setting
can fail under different lighting, clutter or objects.

## Variants and alternatives

- **Classical pipelines** separate perception, estimation, planning and control
  into engineered modules, which are debuggable and predictable.
- **Learning-based control** trains policies by reinforcement or imitation
  learning, trading predictability for the ability to handle behaviours too
  complex to hand-engineer.
- **Simultaneous localisation and mapping** estimates the robot's pose and a map
  of an unknown environment together.
- **End-to-end models** map sensor input directly to actions, and are an active
  and unsettled area.

## History and attribution

Industrial robot arms entered factories in the 1960s. Shakey, built at SRI
International from the mid-1960s, combined perception, planning and action in
one mobile robot and gave rise to the STRIPS planner and the A* search algorithm.
Probabilistic methods came to dominate robot perception and localisation from the
1990s, and learning-based methods have grown in importance since the 2010s.

## Sources

Russell and Norvig's robotics chapter covers robot hardware and perception,
localisation and mapping with the Bayes filter, configuration space, sampling-based
motion planning, kinematics, control and robot learning. Sutton and Barto supply
the reinforcement-learning methods applied to robot control.

## Prerequisites and next connections

Read [Control](./control.md) for how motion is executed, and
[Bayesian Inference](./bayesian-inference.md) for the belief update behind
localisation.

From here, [A*](./a-star.md) and [STRIPS](./strips.md) are planning methods
first developed for a robot, [Model-Based Reinforcement Learning](./model-based-reinforcement-learning.md)
and [Imitation Learning](./imitation-learning.md) are two of the main learning routes,
and [Visual Place Recognition](./visual-place-recognition.md) is how a robot
recognises where it has been.
