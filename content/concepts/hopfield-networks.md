---
concept_id: concept.deep_learning.hopfield_networks
title: Hopfield Networks
slug: /concepts/hopfield-networks
aliases:
  - Hopfield model
  - dense associative memory
kind: concept
tier: 1
review_state: generated-draft
summary: A recurrent network of symmetrically coupled binary units whose asynchronous dynamics always run downhill in an energy function, turning stored patterns into attractors that can be retrieved from a corrupted fragment.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: specializes
    target: concept.deep_learning.energy_based_models
    note: A Hopfield network is the special case in which the energy is a quadratic form in binary units and inference is coordinate-wise descent rather than sampling.
  - type: contributes_to
    target: concept.deep_learning.boltzmann_machines
    note: The Boltzmann machine keeps the symmetric energy and replaces deterministic descent with stochastic sampling and hidden units, so it is the direct descendant of this architecture.
  - type: equivalent_under
    target: concept.deep_learning.attention
    note: The one-step retrieval rule of the continuous modern Hopfield network is softmax over inner products with stored patterns, which is the same expression as dot-product attention when queries, keys and values are set accordingly.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: Both are recurrent, but a Hopfield network is run to a fixed point over a symmetric weight matrix rather than unrolled over a sequence with asymmetric weights.
sources:
  - source_id: source.hopfield1982.neural_networks
    title: Neural networks and physical systems with emergent collective computational abilities
    url: https://www.pnas.org/doi/10.1073/pnas.79.8.2554
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Amit, Gutfreund and Sompolinsky (1985); McEliece, Posner, Rodemich and Venkatesh (1987); Gardner (1988); the pseudo-inverse storage rule
    reason: The registry has no primary source for the spin-glass derivation of the 0.138N capacity, for the N/(4 log N) bound on exact recall of all patterns, for the ceiling on optimally chosen couplings, or for non-Hebbian storage rules; MacKay is cited for the statements he covers, and the derivations themselves are uncited here.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Krotov and Hopfield (2016), Demircigil et al. (2017), Ramsauer et al. (2020)
    reason: The modern dense associative memories, their exponential capacity claims and the stated correspondence between continuous Hopfield retrieval and transformer attention come from papers that are not in the source registry.
    sections:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
claims: []
---

## Definition

A **Hopfield network** is a fully connected network of $N$ units taking values
$s_i \in \{-1, +1\}$, with symmetric couplings $w_{ij} = w_{ji}$ and no
self-coupling ($w_{ii} = 0$), updated one unit at a time by
$s_i \leftarrow \operatorname{sgn}\!\big(\sum_j w_{ij} s_j + b_i\big)$. Symmetry
is what makes it more than a recurrent network: it forces the dynamics to
descend a scalar energy, so the state cannot cycle and must land in a local
minimum. Patterns written into $W$ become those minima, and the network is used
by initialising it at a corrupted cue and letting it fall into the nearest one.

## Why it matters

Ordinary computer memory is addressed by location: to read a record you must
already know where it is. A Hopfield network is **content-addressable** — hand
it a version of a pattern with a tenth of the bits flipped and the dynamics
repair the rest. Error correction and retrieval are the same operation, and
neither is programmed; both fall out of running the network downhill.

Its second contribution is theoretical. The energy is formally the Hamiltonian
of an Ising spin system, so the apparatus of statistical mechanics applies and
"how many patterns can this store before it stops working?" has an analytic
answer rather than a benchmark number. That gave neural networks one of their
first genuine theories, and opened the energy-based line that runs through
Boltzmann machines to the present.

## Intuition

Picture the $2^N$ states as a landscape whose height is the energy. Storing a
pattern digs a basin around it; retrieval drops the state on the landscape and
lets it roll, taking every unit flip that lowers the energy until it rests at
the bottom of whichever basin it started in.

The picture misleads in three ways. The landscape sits on a discrete hypercube,
so "rolling downhill" means flipping one coordinate at a time, and a state can
be a local minimum simply because no _single_ flip helps. There is no momentum:
at zero temperature the state never climbs out of a basin. And you do not get to
choose only the basins you want — the storage rule digs the ones you asked for
and, unavoidably, others you did not.

## Concrete example

Take $N = 5$ and store two patterns,
$\xi^1 = (+1,+1,+1,-1,-1)$ and $\xi^2 = (+1,-1,-1,+1,-1)$, with the unnormalised
Hebbian rule $w_{ij} = \xi^1_i \xi^1_j + \xi^2_i \xi^2_j$ for $i \neq j$. The
only non-zero couplings are $w_{15} = -2$, $w_{23} = +2$, $w_{24} = -2$ and
$w_{34} = -2$; every other pair cancels between the two patterns.

Corrupt $\xi^2$ by flipping unit 3, giving $s = (+1,-1,+1,+1,-1)$, and sweep the
units in order, keeping a unit unchanged when its field is exactly zero:

- unit 1: $h_1 = -2 s_5 = +2$, stays $+1$;
- unit 2: $h_2 = 2 s_3 - 2 s_4 = 0$, stays $-1$;
- unit 3: $h_3 = 2 s_2 - 2 s_4 = -4$, flips to $-1$ — the state is now $\xi^2$;
- units 4 and 5: fields $+4$ and $-2$, no change.

The energy $E = -\tfrac12 \sum_{i \neq j} w_{ij} s_i s_j$ went from $0$ to $-8$.
Note also that $-\xi^2 = (-1,+1,+1,-1,+1)$ has energy $-8$ as well: the reversed
state is a fixed point too, and it is not a pattern anyone stored. At $N = 5$ the
capacity results below do not apply at all — $0.138 \times 5 < 1$ — so this
example shows the mechanism, not the statistics.

## Formal treatment

The energy of a state $\mathbf{s} \in \{-1,+1\}^N$ is

$$
E(\mathbf{s}) \;=\; -\tfrac{1}{2}\sum_{i \neq j} w_{ij}\, s_i s_j \;-\; \sum_i b_i s_i .
$$

Flipping unit $i$ from $s_i$ to $s_i'$ changes the energy by
$\Delta E = -(s_i' - s_i)\,h_i$ with $h_i = \sum_{j} w_{ij}s_j + b_i$, which uses
both $w_{ij} = w_{ji}$ and $w_{ii} = 0$. The update rule chooses
$s_i' = \operatorname{sgn}(h_i)$, so $\Delta E \le 0$ always. The state space is
finite and $E$ is bounded below, so asynchronous dynamics reach a fixed point in
finitely many steps: $E$ is a Lyapunov function.

To store $P$ patterns $\xi^1, \dots, \xi^P$, the Hebbian (outer-product) rule sets

$$
w_{ij} \;=\; \frac{1}{N}\sum_{\mu=1}^{P} \xi^\mu_i \xi^\mu_j \quad (i \neq j), \qquad w_{ii} = 0 .
$$

Initialised at $\xi^\nu$, unit $i$ sees
$h^\nu_i = \tfrac{N-1}{N}\xi^\nu_i + C^\nu_i$, where the crosstalk
$C^\nu_i = \tfrac{1}{N}\sum_{\mu \neq \nu}\sum_{j \neq i} \xi^\mu_i \xi^\mu_j \xi^\nu_j$
collects the interference from the other patterns. For random independent
unbiased patterns $C^\nu_i \xi^\nu_i$ is asymptotically Gaussian with mean zero
and variance $\alpha = P/N$, so the probability that a given bit is unstable on
the first update is $\Phi(-1/\sqrt{\alpha})$ — about $0.4\%$ at
$\alpha = 0.138$.

That estimate ignores avalanches: a flipped bit changes its neighbours' fields.
The self-consistent spin-glass calculation gives the classical result — states
close to the stored patterns exist only for $\alpha < \alpha_c \approx 0.138$,
that is $P \lesssim 0.138\,N$, and at $\alpha_c$ they already differ from the
stored pattern in roughly $1.6\%$ of their bits. Above $\alpha_c$ they disappear
discontinuously, leaving spin-glass minima unrelated to anything stored.

The **modern** (continuous) version keeps the same shape and changes the energy.
With stored patterns as columns of $X \in \mathbb{R}^{d \times P}$ and state
$\xi \in \mathbb{R}^d$,

$$
E(\xi) \;=\; -\tfrac{1}{\beta}\log\!\sum_{\mu=1}^{P} \exp\!\big(\beta\, \xi^\top x_\mu\big) \;+\; \tfrac{1}{2}\xi^\top \xi \;+\; \text{const},
$$

whose associated update is $\xi \leftarrow X\,\mathrm{softmax}(\beta X^\top \xi)$.

## Assumptions and requirements

The convergence guarantee needs three things: symmetric weights, a zero (or
non-negative) diagonal, and **asynchronous** updates. Drop symmetry and no
energy function exists in general; update all units at once and the dynamics can
settle into a period-two cycle instead of a fixed point.

The $0.138N$ figure assumes far more: $N \to \infty$; patterns drawn
independently and uniformly from $\{-1,+1\}^N$, hence uncorrelated and unbiased;
full connectivity with Hebbian weights; zero-temperature deterministic dynamics;
and a retrieval criterion that tolerates a small fraction of wrong bits. It is
derived under the replica-symmetric ansatz, though correcting that shifted the
number only in the third decimal place. Require _every_ stored pattern to be
recovered exactly with high probability and the capacity falls to order
$N/(4 \log N)$, far smaller than $0.138N$ at any practical size.

## Uses and applicability

As a storage device the classical network is obsolete: $N(N-1)/2$ weights for
about $0.138N$ patterns of $N$ bits is a poor trade against simply keeping the
patterns. Reach for it when the _dynamics_ are the point — attractor memory in
neuroscience, intuition for energy-based inference, or minimising an objective
that can be written as a quadratic binary energy, which is how Hopfield and Tank
applied it to combinatorial problems.

The modern continuous form has a live engineering use: a differentiable
retrieval layer that attends over an explicit set of stored vectors inside a
larger network, keeping the network's weights and its memories separate.

## Limitations and common mistakes

**Spurious minima are guaranteed, not incidental.** Every reversed pattern
$-\xi^\mu$ is a fixed point because the energy of a bias-free network is even;
odd mixtures such as
$\operatorname{sgn}(\xi^1 + \xi^2 + \xi^3)$ are stable at low load; and the
number of spin-glass minima unrelated to any stored pattern grows exponentially
in $N$. The honest claim is retrieval from a _nearby_ cue, not from an arbitrary
start.

Four misconceptions arrive with most readers. That $0.138N$ transfers to real
data — it does not, because correlated patterns such as images overlap and
capacity collapses well below it. That capacity means exact recall — at high
load the retrieved state is merely close. That failure is graceful — retrieval
vanishes abruptly at $\alpha_c$. And that parallel updates are a harmless
optimisation — they break the convergence proof.

Finally, the exponential capacity of modern Hopfield networks is not free
storage. The patterns sit explicitly in $X$, so memory grows linearly in their
number; the exponent counts how many well-separated vectors the _retrieval
dynamics_ keep distinguishable in $d$ dimensions, a different quantity from what
$0.138N$ measures.

## Variants and alternatives

Hopfield's 1984 follow-up replaced binary units with graded, continuous ones
obeying a differential equation, preserving the energy argument. Raising the
temperature turns deterministic descent into stochastic sampling, which with
hidden units is the Boltzmann machine. The pseudo-inverse (projection) rule
stores up to $N$ patterns as exact fixed points, at the cost of non-local
weights and smaller basins; unlearning adds an anti-Hebbian step to flatten
spurious minima.

The dense associative memories replace the quadratic energy with a sharper
interaction function: polynomial energies raise capacity to roughly $N^{n-1}$
for degree $n$, and an exponential interaction pushes it to order $2^{N/2}$. The
continuous version of that line has an update rule identical in form to softmax
attention, and its authors argue on that basis that attention layers _are_
Hopfield retrieval steps. The algebraic correspondence is checkable; whether it
is the right account of what attention computes in trained models is an
interpretation, and not a settled one. As a plain alternative for
content-addressable retrieval, a nearest neighbour index over stored vectors
does the same job with no dynamics and no spurious states.

## History and attribution

John Hopfield introduced the model in 1982, working as a physicist on how
collective behaviour in a system of simple elements could produce computation.
The outer-product associative memory itself has several independent origins
around 1970 — Willshaw and colleagues, Amari, and Nakano all published related
associative networks. Hopfield's distinctive contributions were the energy
function, the convergence guarantee for asynchronous dynamics, and the framing
that let statistical mechanics be applied. His paper reported a capacity near
$0.15N$ from simulations; the analytic $0.138N$ came from the spin-glass
analysis of Amit, Gutfreund and Sompolinsky a few years later. The line of work
was recognised with the 2024 Nobel Prize in Physics, shared by Hopfield and
Geoffrey Hinton.

## Sources

**Hopfield (1982)** is the primary source for the architecture, the energy
function, the convergence argument and the original empirical capacity estimate.
**MacKay's Information Theory, Inference, and Learning Algorithms** devotes a
chapter to Hopfield networks and is the best single treatment of the Hebbian
rule, the crosstalk calculation, capacity and spurious states at this level.
**Goodfellow, Bengio and Courville** place the model in the energy-based lineage
leading to Boltzmann machines. **Attention Is All You Need** is cited only for
what dot-product attention is, not for any claim about associative memory.

## Prerequisites and next connections

[Statistical Mechanics](./statistical-mechanics.md) supplies the Ising
vocabulary — energy, temperature, frustration — the analysis is written in, and
the [Perceptron](./perceptron.md) supplies the threshold unit. Neither is needed
to follow the mechanism, but the capacity results are hard to motivate without
the first.

From here, [Attention](./attention.md) and [Transformers](./transformers.md) are
where the modern claim points, and
[Recurrent Neural Networks](./recurrent-neural-networks.md) is the useful
contrast: same recurrence, asymmetric weights, a sequence to process rather than
a fixed point to find.
