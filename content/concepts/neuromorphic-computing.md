---
concept_id: concept.deep_learning.neuromorphic_computing
title: Neuromorphic Computing
slug: /concepts/neuromorphic-computing
aliases:
  - neuromorphic engineering
  - neuromorphic hardware
kind: concept
tier: 1
review_state: generated-draft
summary: Computing hardware organised like nervous tissue — asynchronous events instead of a clocked instruction stream, and memory sitting inside the compute instead of across a bus — whose energy advantage is real but conditional on the activity being sparse.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: implements
    target: concept.deep_learning.spiking_neural_networks
    note: These chips realise leaky-integrate-and-fire dynamics and spike routing in silicon, so a spike is a physical event on a wire rather than a number in a simulated tensor.
  - type: useful_when
    target: concept.ml_engineering.edge_inference
    note: The advantage appears in the always-on, battery-powered, sparse-input regime that edge inference defines, and disappears in a batched datacentre setting where dense throughput is what is being bought.
  - type: contrasts_with
    target: concept.languages.gpu_kernels
    note: A GPU kernel wins by scheduling dense regular work through an explicit memory hierarchy, which is exactly the organisation neuromorphic hardware abandons — there is no shared-memory tile and no clock-synchronous inner loop to write.
  - type: contrasts_with
    target: concept.deep_learning.quantization
    note: Both attack the same energy bill, but quantisation shrinks the operands on conventional silicon while neuromorphic design changes the substrate, and the two are usually alternatives rather than complements in a given deployment.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.differential_equations
    title: MIT 18.03 Differential Equations (Spring 2010)
    url: https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.hopfield1982.neural_networks
    title: Neural networks and physical systems with emergent collective computational abilities
    url: https://www.pnas.org/doi/10.1073/pnas.79.8.2554
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary neuromorphic engineering literature (Mead's Analog VLSI and Neural Systems and Neuromorphic Electronic Systems; Mahowald's silicon retina and address-event representation)
    reason: The registry contains no hardware-engineering source at all, so the founding texts of the field and the origin of address-event representation are named from general knowledge rather than cited.
    sections:
      - history-and-attribution
      - formal-treatment
  - label: Specifications and measured energy figures for TrueNorth, SpiNNaker, BrainScaleS and Loihi
    reason: No chip paper or datasheet is in the registry, so neuron counts, process generations and per-synaptic-operation energies come from the manufacturers' published descriptions and are uncited here; treat them as approximate and vendor-supplied.
    sections:
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
      - limitations-and-common-mistakes
  - label: Measured energy cost of data movement versus arithmetic in CMOS
    reason: The registry has no circuits or computer-architecture source, so the claim that a DRAM fetch costs orders of magnitude more than the arithmetic it feeds is kept qualitative and uncited.
    sections:
      - why-it-matters
claims: []
---

## Definition

**Neuromorphic computing** builds hardware whose organisation is taken from
nervous tissue rather than from the stored-program machine. Three commitments
define it: computation is **event-driven and asynchronous**, so a unit works
only when something happens to it and no global clock steps every element in
lockstep; memory is **co-located with compute**, so a synaptic weight sits in
the core that uses it and is never fetched across a bus; and unit dynamics are
often realised in **analog or mixed-signal circuitry**, where a capacitor's leak
and a transistor's subthreshold current _are_ the neuron's differential equation
rather than a numerical approximation of it. A digital chip keeping the first
two and dropping the third still counts; a dense matrix accelerator merely
inspired by the brain does not.

## Why it matters

The binding constraint on inference energy is movement, not arithmetic. A
low-precision multiply-accumulate costs a fraction of a picojoule; fetching one
of its operands from off-chip DRAM costs two to three orders of magnitude more.
Tiling, caching, batch weight reuse and narrower operands all reduce traffic
across a boundary that exists only because memory and compute are separate
units. The _Deep Learning_ book makes the point from the software side: hardware
throughput has paced the field, and specialised low-precision hardware is
pursued because general machines spend their budget badly.

Neuromorphic design deletes that boundary rather than optimising across it, and
an event-driven pipeline responds as evidence arrives, with no frame boundary to
wait for. It is also the only substrate on which a spiking network's energy
argument is redeemed: simulated densely on a GPU, the same network costs _more_
than its non-spiking equivalent.

## Intuition

Picture a telephone switchboard rather than an assembly line. Every station on
the line runs off one clock and works whether or not anything is on the belt;
the switchboard does nothing until a call comes in, and then only the operators
on that path move.

The analogy breaks in one place. Neurons are joined by dedicated wires; silicon
neurons are not, since a planar chip cannot afford one wire per synapse at
biological fan-out. Spikes are time-multiplexed as packets over a shared fabric
instead, which makes fan-out a budgeted resource: a unit with thousands of
targets consumes routing bandwidth in proportion to its firing rate. The brain's
connectivity is free in a way the chip's is not.

## Concrete example

Take a $784 \to 256 \to 10$ classifier. Its first layer holds $784 \times 256 =
200{,}704$ synapses, so a conventional forward pass performs that many
multiply-accumulates, once, whatever the input. A spiking implementation
performs one cheap accumulate per spike per synapse, so if each input unit emits
$s$ spikes over the presentation window that layer costs $784 \times s \times
256$ synaptic operations.

```python
n_pre, n_post = 784, 256
mac_pj = 4.0   # assumed pJ for one low-precision multiply-accumulate
sop_pj = 0.4   # assumed pJ for one accumulate plus state update on an event

ann = n_pre * n_post * mac_pj
for s in (1, 5, 20):
    snn = n_pre * s * n_post * sop_pj
    print(s, round(snn / ann, 2))
# 1 0.1   5 0.5   20 2.0
```

A latency code in which each unit fires at most once wins by $10\times$; a rate
code letting each unit fire twenty times over a hundred-step window _loses_ by
$2\times$ — same chip, same weights. The constants are stand-ins, the structure
is not.

## Formal treatment

Between events, a leaky integrate-and-fire membrane obeys a first-order linear
ODE,

$$
\tau_m \frac{dV_i}{dt} \;=\; -\bigl(V_i(t) - V_{\text{rest}}\bigr) + R\, I_i(t),
$$

with $V_i$ the membrane potential of unit $i$, $\tau_m = RC$ the membrane time
constant and $I_i$ the input current. For $I_i = 0$ the solution is exact,

$$
V_i(t) \;=\; V_{\text{rest}} + \bigl(V_i(t_0) - V_{\text{rest}}\bigr)\,
e^{-(t - t_0)/\tau_m}.
$$

That closed form licenses event-driven hardware: state advances from $t_0$ to
the next spike's arrival by a single decay multiply, so nothing is stepped in
between. An arriving spike from $j$ applies $V_i \mathrel{+}= w_{ij}$, and if
$V_i \ge V_{\text{thr}}$ the unit emits its own event and resets — no clock,
only an ordering of events. Events travel as **address-event representation**
packets, which carry the firing unit's address and encode spike time by time of
transmission.

The energy claim is an accounting identity. With $N_{\text{syn}}$ synapses,
$\bar{s}$ the mean spikes a presynaptic unit emits per inference, and
per-operation energies $E_{\text{MAC}}$ and $E_{\text{SOP}}$,

$$
E_{\text{SNN}} = \bar{s}\, N_{\text{syn}} E_{\text{SOP}},
\qquad
E_{\text{ANN}} = N_{\text{syn}} E_{\text{MAC}},
$$

so neuromorphic execution is cheaper exactly when $\bar{s} < E_{\text{MAC}} /
E_{\text{SOP}}$. The right side is a property of the circuit, typically single
digits to low tens; the left is a property of the _code_, and nothing in the
architecture bounds it.

An analog crossbar of conductances $G_{ij}$ driven by voltages $V_i$ instead
yields $I_j = \sum_i V_i G_{ij}$ by Ohm's and Kirchhoff's laws: a matrix-vector
product in one settling time, $O(N^2)$ devices, no clocked arithmetic.

## Assumptions and requirements

The energy result assumes **sparse activity**; without it the chip is a poor
dense accelerator.

It assumes the **weights fit on-chip**. Co-location helps only while the model
lives in distributed local memory; a model that streams weights from DRAM has
reintroduced the bottleneck the architecture existed to remove. That, not any
deep incompatibility, is why large transformers are not a neuromorphic workload.

It assumes **fan-out fits the routing fabric**: cores have bounded synaptic
memory and outgoing bandwidth, and a layer exceeding either must be partitioned
at a cost in traffic. And it assumes the **input is already events** — feed a
frame camera into a spiking pipeline and conversion can cost what sparsity
saved.

Analog parts assume further that the task **tolerates low effective precision**,
since mismatch, drift and conductance variation leave a handful of usable bits,
and that peripheral analog-to-digital conversion, often the dominant crossbar
cost, is affordable.

## Uses and applicability

Reach for it when the workload is always-on, power-capped and genuinely sparse:
keyword spotting that must idle at microwatts, gesture and optical-flow tasks
driven by an event camera, robotic control loops where a millisecond matters
more than a point of accuracy, closed-loop biomedical implants. SpiNNaker's
original purpose, real-time simulation of biological networks, remains among the
clearest fits.

Do not reach for it when training dominates, when accuracy per parameter is the
figure of merit, when the model needs off-chip weights, or when batched dense
throughput is what you are buying. A quantised model on a conventional low-power
accelerator is then faster to build and usually more efficient.

## Limitations and common mistakes

The first mistake is treating the energy advantage as architectural. It is
conditional on $\bar{s}$ being small: a rate-coded network with a hundred-step
window is routinely _worse_ on neuromorphic silicon than its dense equivalent on
conventional silicon.

The second is accepting comparisons at face value: published wins often compare
different process generations, quote neuron-core energy while excluding host,
sensor and conversion, or set a friendly workload against an unoptimised
baseline. Whole-system joules per inference at matched accuracy is the only
honest number, and rarely the reported one.

The third is expecting biological fidelity to buy accuracy. It does not: the
best benchmark results come from surrogate-gradient training or conversion of an
ordinary trained network — from making the spiking net behave as much like a
conventional one as possible.

The fourth actually blocks adoption. There is no dominant training story:
on-chip local rules such as spike-timing-dependent plasticity do not approach
backpropagation on non-trivial tasks, so the practical path is to train off-chip
and deploy, forfeiting the on-chip-learning promise. Nor is there a portable
compilation target — each platform has its own stack, mapping a network onto
cores is a constrained partitioning problem often solved by hand, and a model
that runs on one chip does not run on the next. Analog parts add chip-in-the-loop
calibration, since a floating-point weight cannot be written exactly onto a
device.

## Variants and alternatives

**Digital event-driven** chips — IBM's TrueNorth, Intel's Loihi and Loihi 2,
Manchester's SpiNNaker — keep asynchrony and co-located memory but compute
digitally: reproducible, synthesisable and far easier to program, at the price
of the per-operation energy analog physics provides. **Analog and mixed-signal**
designs, from Mead's circuits through DYNAP-SE to Heidelberg's BrainScaleS, use
transistor physics directly in place of arithmetic; the subthreshold ones, Mead's
and DYNAP-SE's, hold biological time constants, while BrainScaleS drives its
circuits above threshold instead and so runs far faster than biological real
time, useful for studying learning but not for sensing.
**Compute-in-memory crossbars** in RRAM, phase-change memory or flash attack the
memory wall without being spiking at all, and **event cameras** supply the sparse
input the rest of the stack assumes.

The serious competition is conventional: a pruned and quantised network on a
low-power NPU is what ships in edge products today, the lineage the _Deep
Learning_ book's survey of specialised and low-precision hardware describes. The
CUDA guide documents the opposite design point — an explicit memory hierarchy
with SIMT execution, buying efficiency from regularity and reuse rather than
sparsity.

## History and attribution

Carver Mead coined _neuromorphic_ at Caltech in the late 1980s, in _Analog VLSI
and Neural Systems_ (1989) and _Neuromorphic Electronic Systems_ (1990). His
argument was physical, not metaphorical: a MOS transistor below threshold passes
a current exponential in its gate voltage — the functional form of ion-channel
population behaviour — so one transistor does what would take many digital
gates. Misha Mahowald, working with Mead, built the silicon retina and, with
Sivilotti, introduced address-event representation.

The lineage is older and has several independent strands: Rosenblatt's Mark I
Perceptron was purpose-built hardware rather than a program, and Hopfield's
1982 analysis of what a network of simple physical elements can compute made an
analog associative memory a natural next step.

The large systems arrived in the 2010s: SpiNNaker at Manchester under Steve
Furber, ARM cores on a packet-switched spike fabric; BrainScaleS at Heidelberg
under Karlheinz Meier; IBM's TrueNorth (2014), roughly a million digital neurons
under DARPA SyNAPSE; Intel's Loihi (2017) and Loihi 2 (2021), which added graded
spikes and programmable neuron models. Whether any becomes a production platform
is not settled.

## Sources

The _Deep Learning_ book covers why hardware efficiency became a first-order
concern here and the conventional answers — low precision, compression,
specialised accelerators — that neuromorphic design competes with. The CUDA C++
Programming Guide is the opposite design point, documenting the memory hierarchy
and clocked SIMT model this hardware abandons. MIT 18.03 supplies the
first-order linear ODE and its exponential solution, the fact behind lazy
event-driven updates. Hopfield's 1982 paper is cited for history alone. No
registry source covers neuromorphic hardware itself, which is what
`unresolved_references` records.

## Prerequisites and next connections

Read [Spiking Neural Networks](./spiking-neural-networks.md) first: this page is
about the machines those networks were meant to run on, and the
surrogate-gradient problem described there limits what these machines can be
given. From here, [Edge Inference](./edge-inference.md) is the deployment slot
being competed for, with [Quantization](./quantization.md) and
[Pruning](./pruning.md) the incumbent approach to it;
[GPU Kernels](./gpu-kernels.md) and [CUDA](./cuda.md) show what a memory
hierarchy buys, which clarifies what removing one costs; and
[Hopfield Networks](./hopfield-networks.md) covers the physical-systems tradition
this hardware descends from.
