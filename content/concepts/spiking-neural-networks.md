---
concept_id: concept.deep_learning.spiking_neural_networks
title: Spiking Neural Networks
slug: /concepts/spiking-neural-networks
aliases:
  - SNN
  - pulsed neural networks
kind: concept
tier: 1
review_state: generated-draft
summary: A network whose units carry a membrane potential through time and communicate only by discrete threshold-crossing events, trading a differentiable forward pass for event-driven computation that costs energy only when something fires.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.backpropagation
    note: Surrogate-gradient training is backpropagation through time with one derivative swapped out, so the training story here cannot be followed without the chain-rule machinery it modifies.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: Both carry state across time, but a spiking unit's state is a leaky scalar and its output is a one-bit event, which removes the gradient path that makes ordinary recurrent training work.
  - type: contrasts_with
    target: concept.deep_learning.neural_odes
    note: Both define hidden state by an ODE in continuous time; the neural ODE keeps the trajectory smooth so the adjoint gives exact gradients, while the spiking reset deliberately makes it discontinuous.
  - type: used_to_solve
    target: concept.ml_engineering.edge_inference
    note: Always-on inference under a milliwatt power budget is the deployment problem that event-driven spiking hardware is built for.
sources:
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.rosenblatt1958.perceptron
    title: 'The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain'
    url: https://psycnet.apa.org/doi/10.1037/h0042519
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.chen2018.neural_ode
    title: Neural Ordinary Differential Equations
    url: https://arxiv.org/abs/1806.07366
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary literature on spiking neuron models and surrogate-gradient learning (Lapicque, Hodgkin and Huxley, Maass, Gerstner and Kistler, Neftci and colleagues)
    reason: The registry contains no computational-neuroscience or spiking-network source, so the membrane equation, the surrogate-derivative construction and the attributions in the history section rest on nothing cited on this page.
    sections:
      - definition
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: Neuromorphic hardware documentation and energy measurements (TrueNorth, Loihi, SpiNNaker) and the synaptic-operation accounting behind the efficiency claim
    reason: No registered source documents event-driven hardware, so the energy argument is stated structurally and no picojoule or speed-up figures are quoted here.
    sections:
      - why-it-matters
      - assumptions-and-requirements
      - uses-and-applicability
  - label: Benchmark comparisons of spiking and conventional networks on static-image and event-camera datasets
    reason: No registered source reports spiking-network accuracy, so the statement that accuracy trails equivalent conventional networks is given as the general finding of that literature rather than a checkable number.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **spiking neural network** is a network of units whose only outputs are
discrete, stereotyped events — spikes — emitted at points in time. Each unit
holds a membrane potential $V(t)$ that integrates incoming spikes, leaks towards
rest between them, and fires the instant it crosses a threshold, after which it
is reset. Information is carried by _which_ unit fires and _when_, not by a real
number per unit per layer.

Two consequences define everything else here: a unit that receives nothing sends
nothing, so the network is idle by default; and emission is a step function of
$V$, whose derivative is zero almost everywhere.

## Why it matters

A conventional layer spends energy whether or not anything interesting is in the
input: the matrix multiply runs over every weight every time. A spiking layer on
hardware built for it spends energy per _spike delivered_, so cost scales with
activity rather than model size — for a microphone waiting on a wake word, the
difference between a device that lasts a day and one that lasts a year.

The second reason cuts the other way. Gradient-based learning needs a derivative
path from the loss back to the weights, and the spike has none: this is the
clearest case in deep learning of an architecture whose defining feature is what
makes it untrainable by the default method.

## Intuition

Picture a bucket with a hole in the bottom: inflow is synaptic input, the hole is
the leak, the level is the membrane potential, and when the level reaches a mark
a bell rings and the bucket empties. Constant inflow gives a metronome, faster
for a stronger stream; inflow too weak to outrun the hole never rings the bell.

The bucket is the first-order linear ODE of an RC circuit: the time constant sets
how long past input still counts, so coincident arrivals matter more than the
same spikes spread out. The analogy breaks at the reset — a real circuit does not
empty itself — and it is the bell, which rings the same however far past the mark
the level got, that costs the network its gradients.

## Concrete example

A leaky integrate-and-fire unit with $\tau_m = 20$ ms, resting potential $0$,
threshold $20$ mV, reset to $0$, driven by a constant current whose steady-state
contribution is $RI = 25$ mV, in Euler steps of $1$ ms:

```python
tau, dt = 20.0, 1.0            # ms
v_th, v_reset, ri = 20.0, 0.0, 25.0   # mV
v, spikes = 0.0, []
for step in range(200):        # 200 ms of stimulation
    v += dt / tau * (-v + ri)
    if v >= v_th:
        spikes.append((step + 1) * dt)
        v = v_reset
print(len(spikes), spikes[:3])   # 6 [32.0, 64.0, 96.0]
```

Six spikes in 200 ms, an interval of 32 ms, about 30 Hz; the closed form below
gives $\tau_m \ln\!\big(25/(25-20)\big) = 32.19$ ms, so the 1 ms step costs about
half a percent. Weaken the drive to $RI = 21$ mV and the interval jumps to
$20 \ln 21 = 60.9$ ms — 16 Hz, half the rate for a 16% smaller input — and at
$RI = 19$ mV the unit never fires at all. The input-output curve has a hard onset
and is strongly nonlinear just above it.

## Formal treatment

Subthreshold, the membrane obeys

$$
\tau_m \frac{dV}{dt} = -\big(V(t) - V_{\text{rest}}\big) + R\,I(t),
$$

with $\tau_m = RC$ the membrane time constant, $R$ the membrane resistance and
$I(t) = \sum_j w_j \sum_{t_j^{f}} \kappa(t - t_j^{f})$ the input current, summed
over presynaptic spike trains through a synaptic kernel $\kappa$. Firing and
reset are imposed on top: if $V(t^{f}) = V_{\text{th}}$ from below, the unit
spikes at $t^{f}$ and $V$ is set to $V_{\text{reset}}$, optionally held there for
a refractory period $\Delta$. For constant $I$ the interspike interval is

$$
T = \tau_m \ln \frac{R I - (V_{\text{reset}} - V_{\text{rest}})}{R I - (V_{\text{th}} - V_{\text{rest}})},
\qquad f = \frac{1}{T + \Delta},
$$

defined only above the rheobase $RI > V_{\text{th}} - V_{\text{rest}}$; below it
the rate is zero.

With step $\Delta t$ the exact update of the linear part is
$V[t{+}1] = \beta V[t] + (1-\beta) R I[t]$, $\beta = e^{-\Delta t/\tau_m}$ (here
$0.951$), and the spike is
$S[t] = \Theta(V[t] - V_{\text{th}})$ for the Heaviside step $\Theta$. In this
form an SNN _is_ a recurrent network, and backpropagation through time applies —
except that

$$
\frac{\partial S[t]}{\partial V[t]} = \delta(V[t] - V_{\text{th}})
$$

is zero everywhere but one point, so every weight gradient is exactly zero. The
**surrogate gradient** fix keeps $\Theta$ in the forward pass and substitutes a
bounded bump in the backward pass, for example

$$
\frac{\partial S}{\partial V} \;\leftarrow\; \frac{1}{\big(1 + \gamma\,|V - V_{\text{th}}|\big)^{2}} ,
$$

a straight-through-style estimator. It works empirically; no convergence
guarantee from smooth optimisation transfers to it.

## Assumptions and requirements

LIF assumes the spike is all-or-none — its shape carries nothing — so one scalar
per neuron suffices, and that the subthreshold dynamics are linear with fixed
$\tau_m$. Real neurons have voltage-dependent conductances and adaptation, and
recovering those needs a model with several state variables.

Surrogate training assumes $V$ depends smoothly on the weights, true of the
integration but not of the reset; most implementations detach the reset term from
the graph, a convention that silently changes the gradient computed.

Conversion from a trained network assumes ReLU activations, normalisation folded
into the weights, thresholds rescaled against a high percentile of observed
activations, reset by subtraction, and a stationary input held long enough for
rates to settle; its error falls like $O(1/T)$, so accuracy is bought with
latency.

The energy argument's preconditions are left unstated most often of all: activity
must be genuinely sparse, the hardware event-driven so a silent synapse draws no
dynamic power, and the weights resident in memory local to the compute. Stream
weights from DRAM and the saving is gone whatever the neuron model.

## Uses and applicability

Reach for a spiking network when the power budget is measured in milliwatts, the
input is sparse or event-driven, and latency to a _first_ decision matters more
than throughput: keyword spotting on a battery, vibration anomaly detection,
gesture recognition from an event camera whose pixels already emit address-events
asynchronously — the comparison is fairest there, because the sensor is spiking
already and a conventional pipeline must frame the events before it can start.
Reach for it too when the model is the object of study; computational
neuroscience wants the spikes, not the accuracy.

Do not, when you have a GPU and want the best accuracy per unit of engineering
effort: for dense static images or language modelling, a quantised and pruned
conventional network is the better-understood route to the same power target.

## Limitations and common mistakes

The commonest mistake is claiming the efficiency win while measuring on a GPU.
There the spikes form a dense binary tensor, the matrix multiply runs densely,
and simulating $T$ timesteps costs roughly $T$ forward passes: a spiking network
on a GPU is _more_ expensive than its conventional counterpart, not less. The
efficiency belongs to the hardware and the sparsity together, and does not
transfer.

The second is reporting accuracy without the timestep budget $T$. Energy and
latency both scale with $T$, so a figure obtained at $T = 256$ is not comparable
to one at $T = 4$, and much of the literature's apparent progress is movement
along that trade-off — the more so because most deployed networks are effectively
rate coded, counting spikes over a window, which discards the precise timing that
motivated the model in the first place.

The third is treating surrogate gradients as an approximation that sharpens as
some parameter shrinks. It does not converge to the true gradient, because the
true gradient is zero; it is a different training rule that happens to work.

Finally, accuracy. On standard static-image benchmarks spiking networks generally
trail equivalent conventional networks; the gap has narrowed and is small on easy
datasets, but it has not closed, and biological plausibility is not evidence that
it will. Claims that spiking units are strictly more powerful rest on expressivity
results about how few units can represent a function under temporal coding, which
say nothing about what current training methods can learn.

## Variants and alternatives

**Neuron models** span a cost-fidelity axis: integrate-and-fire with no leak, LIF
as above, adaptive-exponential and Izhikevich models that add bursting with one
extra state variable, and conductance-based Hodgkin-Huxley dynamics, faithful and
far more expensive. **Codes** are a separate choice: rate coding over a window,
time-to-first-spike coding, which can decide after one spike per neuron,
rank-order and population codes.

**Training** splits three ways: conversion from a trained conventional network,
easiest to get working and worst on latency; surrogate-gradient backpropagation
through time, which trains directly and shortens $T$ at $O(T)$ memory; and local
rules — spike-timing-dependent plasticity, eligibility-trace methods — which avoid
storing the trajectory and suit on-chip learning at a cost in accuracy.

Outside the spiking family, the real competitors for low-power inference are
quantised and pruned conventional networks, which reach similar power envelopes
on ordinary silicon with far better tooling; and for continuous-time modelling
without the energy motive, neural ODEs keep state smooth and recover exact
gradients by the adjoint method.

## History and attribution

The integrate-and-fire neuron is the oldest model here, introduced by Louis
Lapicque in 1907 from experiments on nerve excitation, decades before anyone knew
what an action potential was made of; Hodgkin and Huxley's 1952 conductance model
of the squid giant axon supplied the mechanism.

Artificial neural networks took the threshold and discarded the clock: the
McCulloch-Pitts unit and Rosenblatt's perceptron keep the all-or-none response,
but their units have no membrane and no time. Later networks replaced the
threshold with a differentiable nonlinearity so gradients would flow — a
deliberate trade, and one Goodfellow, Bengio and Courville describe plainly:
modern deep learning is inspired by neuroscience but not guided by it.

Wolfgang Maass reframed spiking units as a "third generation" of network models
in the 1990s, with expressivity results comparing them to threshold and sigmoidal
units, while Carver Mead's neuromorphic engineering programme of the late 1980s
argued that analogue VLSI should imitate nervous-system organisation rather than
digital logic — the event-driven chips of the 2010s descend from it. Surrogate
gradients consolidated in the late 2010s.

## Sources

MIT 18.03 covers the first-order linear ODE and RC circuit behind the membrane
equation, up to but not including the reset. Goodfellow, Bengio and Courville is
the reference for why gradient-based learning needs a usable derivative, and for
deep learning's relationship to neuroscience. Rosenblatt's 1958 paper is the
early brain-inspired threshold unit that kept the all-or-none response and
dropped the timing, and the neural ODE paper is cited only as the contrasting
continuous-time formulation with exact gradients. None covers spiking networks
themselves; what is missing is recorded in the frontmatter.

## Prerequisites and next connections

Understand [Backpropagation](./backpropagation.md) first — the training problem
here is a modification of it — and
[Recurrent Neural Networks](./recurrent-neural-networks.md), since a discretised
spiking network is one, unrolled over simulation steps rather than tokens. The
[Perceptron](./perceptron.md) and
[Multilayer Perceptrons](./multilayer-perceptrons.md) are the non-spiking
baseline this gets measured against.

From here, [Neural ODEs](./neural-odes.md) show what continuous-time state looks
like when you insist on differentiability, and
[Quantization](./quantization.md), [Pruning](./pruning.md) and
[Edge Inference](./edge-inference.md) are the competing route to the same power
budget — the comparison any efficiency claim here should be held to.
