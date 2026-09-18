---
concept_id: concept.deep_learning.boltzmann_machines
title: Boltzmann Machines
slug: /concepts/boltzmann-machines
aliases:
  - restricted Boltzmann machine
  - harmonium
kind: concept
tier: 1
review_state: generated-draft
summary: A network of stochastic binary units whose symmetric weights define an energy, and whose bipartite restricted variant made unsupervised layer-wise pretraining of deep networks briefly practical before supervised training overtook it.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: specializes
    target: concept.deep_learning.energy_based_models
    note: A Boltzmann machine is the special case in which the units are binary and the energy is a quadratic form in the state, so its conditionals are logistic.
  - type: generalizes
    target: concept.deep_learning.hopfield_networks
    note: Replacing the Hopfield network's deterministic threshold update with a stochastic one at temperature T, and adding hidden units, gives exactly a Boltzmann machine.
  - type: used_to_solve
    target: concept.learning.unsupervised_learning
    note: Restricted Boltzmann machines were trained on unlabelled data to learn features, which is what made them the pretraining stage of the 2006 deep belief network recipe.
  - type: contrasts_with
    target: concept.deep_learning.variational_autoencoders
    note: Both fit latent-variable generative models, but the Boltzmann machine's intractable quantity is the partition function while the VAE's is the posterior, and only the latter admits an unbiased stochastic gradient of a bound.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
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
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.hopfield1982.neural_networks
    title: Neural networks and physical systems with emergent collective computational abilities
    url: https://www.pnas.org/doi/10.1073/pnas.79.8.2554
    source_kind: primary-research
    supports:
      - intuition
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: The primary Boltzmann machine papers (Ackley-Hinton-Sejnowski 1985, Smolensky 1986, Hinton 2002, Hinton-Osindero-Teh 2006)
    reason: The source registry contains none of the primary Boltzmann machine papers, so the attributions and the contrastive-divergence update here rest on the secondary textbook treatments cited instead of on the originals.
    sections:
      - history-and-attribution
      - formal-treatment
claims: []
---

## Definition

A **Boltzmann machine** is an undirected probabilistic model over binary units
$s \in \{0,1\}^n$ in which a symmetric weight matrix $W$ ($w_{ij} = w_{ji}$,
$w_{ii} = 0$) and a bias vector $b$ define an energy

$$
E(s) \;=\; -\sum_{i<j} w_{ij}\, s_i s_j \;-\; \sum_i b_i s_i ,
$$

and the states are distributed as $P(s) = e^{-E(s)}/Z$ with
$Z = \sum_{s'} e^{-E(s')}$. Units are split into **visible** units $v$, which the
data is clamped onto, and **hidden** units $h$, which are free; the model of the
data is the marginal $P(v) = \sum_h e^{-E(v,h)}/Z$.

A **restricted Boltzmann machine (RBM)** is the special case in which the graph
is bipartite: visible units connect only to hidden units and hidden units only
to visible ones, never within a layer.

## Why it matters

The general Boltzmann machine is the clean statement of what an undirected neural
network wants to be — every unit talks to every other, the model is a proper
probability distribution, and the learning rule is a difference of two
correlations. It is also close to useless in practice, because both correlations
need Markov chain Monte Carlo and the chains mix badly.

The restriction is the move that mattered. Dropping within-layer connections
makes the hidden units conditionally independent given the visible ones, so a
whole layer can be sampled in one vectorised operation. That single structural
change turned an unusable model into a trainable one, and for a few years around
2006 a stack of RBMs was the best-known way to get a deep fully connected network
to train at all — though the same greedy layer-wise recipe worked with
autoencoders in place of RBMs, and convolutional networks had been trained by
plain backpropagation for a decade.

## Intuition

Picture a system of magnets. Each unit is a spin that is up or down, each weight
is a coupling that makes two spins prefer to agree ($w_{ij} > 0$) or disagree
($w_{ij} < 0$), and the energy scores how much the current configuration
frustrates those preferences. Low energy means high probability. Hopfield's
deterministic network rolls downhill to the nearest local minimum and stops; a
Boltzmann machine keeps jittering, so it visits low-energy states often and
high-energy states rarely, in exactly the proportions the Boltzmann distribution
prescribes.

The analogy breaks in one place. In physics the couplings are given and you study
the resulting states; here the states are given — they are your data — and you
solve the inverse problem of finding couplings that make the data typical.
Learning lowers the energy of configurations the data visits and raises the
energy of configurations the model visits on its own. The second half is the hard
half: finding out what the model does on its own means sampling from it.

## Concrete example

Take an RBM with three visible and two hidden units,

$$
W = \begin{bmatrix} 1.2 & -0.5 \\ -0.8 & 0.9 \\ 0.4 & 0.4 \end{bmatrix},
\quad b = (0,0,0), \quad c = (-0.3,\ 0.2),
$$

and clamp $v = (1,0,1)$. The hidden pre-activations are
$c_1 + W_{11} + W_{31} = -0.3 + 1.2 + 0.4 = 1.3$ and
$c_2 + W_{12} + W_{32} = 0.2 - 0.5 + 0.4 = 0.1$, so
$P(h_1 = 1 \mid v) = \sigma(1.3) = 0.786$ and
$P(h_2 = 1 \mid v) = \sigma(0.1) = 0.525$ — and those two are independent, which
is the whole point of the restriction. Sampling $h = (1,0)$ and going back down
gives $P(v \mid h) = (\sigma(1.2), \sigma(-0.8), \sigma(0.4)) = (0.769, 0.310,
0.599)$. The free energy of the clamped state is
$F(v) = -\log(1+e^{1.3}) - \log(1+e^{0.1}) \approx -2.29$.

One step of contrastive divergence is then four lines:

```python
import numpy as np
rng = np.random.default_rng(0)
sig = lambda x: 1.0 / (1.0 + np.exp(-x))

def cd1(W, b, c, v0, lr=0.05):
    ph0 = sig(c + v0 @ W)                                # P(h=1 | data)
    h0  = (rng.random(ph0.shape) < ph0).astype(float)    # sample the layer
    pv1 = sig(b + h0 @ W.T)                              # reconstruct
    v1  = (rng.random(pv1.shape) < pv1).astype(float)
    ph1 = sig(c + v1 @ W)
    W += lr * (np.outer(v0, ph0) - np.outer(v1, ph1))    # positive - negative
    b += lr * (v0 - v1)
    c += lr * (ph0 - ph1)
    return W, b, c
```

## Formal treatment

Because the energy is linear in any single unit given the rest, the conditional
of one unit is logistic:

$$
P(s_i = 1 \mid s_{-i}) \;=\; \sigma\!\Big(b_i + \sum_{j \neq i} w_{ij}s_j\Big),
\qquad \sigma(x) = \frac{1}{1+e^{-x}} .
$$

The sigmoid is not a design choice here; it is what the energy difference
$\Delta E_i$ forces. With an explicit temperature $T$ the argument is
$\Delta E_i / T$, and $T \to 0$ recovers a deterministic threshold unit.

The gradient of the log-likelihood of a visible configuration is a difference of
two expectations,

$$
\frac{\partial}{\partial w_{ij}} \log P(v)
= \underbrace{\mathbb{E}_{\text{data}}[s_i s_j]}_{\text{positive phase}}
- \underbrace{\mathbb{E}_{\text{model}}[s_i s_j]}_{\text{negative phase}},
$$

where the positive phase clamps $v$ and samples the hidden units and the negative
phase samples the joint with nothing clamped. The negative phase is the
derivative of $\log Z$, and it is why training is hard: $Z$ sums over $2^n$
states.

For an RBM the energy is

$$
E(v,h) = -b^\top v - c^\top h - v^\top W h ,
$$

which contains no $v_iv_{i'}$ or $h_jh_{j'}$ term. Hence $P(h \mid v)$ factorises
as $\prod_j \mathrm{Bernoulli}\big(h_j ; \sigma(c_j + (W^\top v)_j)\big)$, and
$P(v \mid h)$ as $\prod_i \mathrm{Bernoulli}\big(v_i ; \sigma(b_i + (Wh)_i)\big)$,
so a Gibbs sweep alternates two exact block samples instead of $n$ sequential
single-unit updates. Marginalising the hidden units analytically gives the free
energy

$$
F(v) = -b^\top v - \sum_j \log\big(1 + e^{c_j + (W^\top v)_j}\big),
\qquad P(v) = e^{-F(v)}/Z .
$$

$F(v)$ is computable exactly; $Z$ is not, so an RBM assigns exact _relative_
probabilities and no absolute ones without further approximation.

**Contrastive divergence (CD-$k$)** replaces the model expectation with a sample
obtained by starting the Gibbs chain at a training example and running $k$ steps,
almost always $k=1$. It is fast and learns useful features, but it is biased: the
CD-1 update is not the gradient of the log-likelihood, and in general not the
gradient of any function. Persistent contrastive divergence (stochastic maximum
likelihood) keeps chains running across parameter updates instead of restarting
them, reducing the bias at the cost of stability.

## Assumptions and requirements

The model as stated assumes **binary units**. Real-valued data needs a modified
energy — the Gaussian–Bernoulli RBM adds a quadratic term in $v$ — and that
variant is notoriously sensitive to the variance and to input scaling. It assumes
**symmetric weights**: asymmetry destroys the energy function and with it the
guarantee that Gibbs sampling has the intended stationary distribution.

The learning rule assumes the sampler has **reached equilibrium**. It has not:
every practical run substitutes a short chain — restarted at the data in CD,
carried across parameter updates in persistent CD — for a converged one, and the
resulting bias is a structural feature of the method rather than a bug to be
tuned away. When the model develops well-separated modes the
chain mixes slowly between them, the negative phase stops finding the spurious
modes the model has invented, and training degrades.

Block Gibbs sampling requires the **bipartite structure**. Add a single
visible–visible connection and conditional independence is gone along with the
vectorised update; a deep Boltzmann machine keeps bipartiteness between adjacent
layers only, and recovers a weaker version of the trick by updating odd and even
layers alternately.

## Uses and applicability

RBMs were used for unsupervised feature learning, for initialising deep
feedforward networks, for collaborative filtering (they were a component of
strong Netflix Prize ensembles), and as building blocks of deep belief networks
and deep Boltzmann machines. They remain reasonable when you want a generative
model with interpretable binary latent structure over binary data and care more
about the energy landscape than about sample quality.

For almost everything else, reach for something else. If you want representations
for a downstream task, supervised training with modern initialisation, or
[Self-Supervised Learning](./self-supervised-learning.md), works better and is
simpler; if you want samples, diffusion models and normalizing flows beat RBMs
decisively. Their live value is conceptual: they are the cleanest concrete
instance of the partition-function problem every undirected model faces.

## Limitations and common mistakes

The dominant limitation is the intractable partition function. Everything awkward
follows from it: you cannot evaluate the likelihood you are maximising, you
cannot compare two models by their training objectives without an estimator such
as annealed importance sampling, and your gradient is biased.

The most common misconception is that an RBM is an autoencoder. The CD-1 update
runs the data down and back up and _looks_ like reconstruction, but the objective
is not reconstruction error and nothing in the procedure minimises it;
reconstruction error is a rough diagnostic that can keep falling while the model
gets worse.

The second is that a deep belief network is a stack of RBMs. A DBN is a directed
sigmoid belief network in its lower layers with an undirected RBM at the top, and
the stacked-RBM procedure is a greedy initialisation of it justified by a
variational bound, not the model itself. A deep Boltzmann machine really is
undirected throughout, and is harder to train for exactly that reason.

The third is treating layer-wise generative pretraining as a general principle of
deep learning. It was a workaround for the optimisation and overfitting problems
that saturating activations, poor initialisation and small labelled datasets
created. Once rectified units, better initialisation, large labelled corpora and
GPUs arrived, the benefit largely vanished on standard vision and speech
benchmarks and the practice was abandoned — an empirical finding about one era's
models and datasets, not a theorem. Unsupervised pretraining later returned in a
very different form, as large-scale self-supervised pretraining.

## Variants and alternatives

**Restricted** (bipartite, one hidden layer), **deep Boltzmann machine** (several
hidden layers, still fully undirected) and **deep belief network** (the
directed/undirected hybrid above) are the three named members of the family.
**Gaussian–Bernoulli** and **replicated softmax** RBMs extend the visible units
to real-valued and count data. On the training side **CD-$k$**, **persistent CD /
stochastic maximum likelihood**, **mean-field** positive phases in deep models,
**score matching** and **noise-contrastive estimation** all attack the same
obstacle with different trade-offs between bias, variance and cost.

The genuinely different competitors avoid $Z$ altogether: autoregressive models
factorise the likelihood exactly, normalizing flows make it computable by
construction, variational autoencoders optimise a bound, and diffusion models
sidestep normalisation by learning a score. All of them trained better and scaled
further, which is why the Boltzmann family is now read as history rather than as
a default.

## History and attribution

The direct ancestor is Hopfield's 1982 network: symmetric weights, an energy
function, deterministic dynamics that descend it, and an interpretation as
associative memory. Hinton and Sejnowski introduced the Boltzmann machine in the
early 1980s by making those dynamics stochastic — sampling each unit from the
Boltzmann distribution at a temperature, with annealing borrowed from the
simulated-annealing literature — and by adding hidden units, which gave it
capacity a Hopfield network lacks. The learning algorithm, with its positive and
negative phases, was published by Ackley, Hinton and Sejnowski in 1985, and
Smolensky introduced the restricted, bipartite version in 1986 as the
**harmonium**.

The restricted version sat quiet until Hinton's contrastive divergence (2002)
made it cheap to train, and then Hinton, Osindero and Teh's 2006 deep belief
network paper showed that stacking RBMs and fine-tuning trained networks that had
been untrainable. That paper is conventionally the start of the modern deep
learning revival. Within about six years better supervised training had made its
pretraining step unnecessary, and the legacy is now indirect: the energy-based
framing, and the field's willingness to believe deep networks could be trained at
all.

## Sources

The _Deep Learning_ book is the reference to read first: Chapter 16 sets up
undirected graphical models, Chapter 18 is devoted to the partition function and
the estimators that work around it, and Chapter 20 covers RBMs, DBNs and deep
Boltzmann machines together with the pretraining era. MacKay's _Information
Theory, Inference, and Learning Algorithms_ gives the compact statistical-physics
derivation — the Ising-model framing, the Gibbs sampler, and the learning rule as
a difference of correlations. Murphy's _Probabilistic Machine Learning_ places
the model in the general Markov-random-field setting. Hopfield's 1982 paper is
the deterministic network the stochastic version generalises.

## Prerequisites and next connections

Read [Statistical Mechanics](./statistical-mechanics.md) first if the Boltzmann
distribution and the partition function are unfamiliar; almost every difficulty
on this page restates the difficulty of computing $Z$. Some comfort with Markov
chains, from [Stochastic Processes](./stochastic-processes.md), makes the Gibbs
sampler and the mixing problem legible, and the logistic conditional will look
familiar from [Logistic Regression](./logistic-regression.md).

Onward, [Conditional Random Fields](./conditional-random-fields.md) is the
supervised cousin in the same undirected family, whose normaliser is tractable
for chain- and tree-structured outputs — conditioning on the input leaves only
the labels to sum over, and dynamic programming does that sum exactly — and
[Unsupervised Learning](./unsupervised-learning.md) frames what pretraining was
for. For [Multilayer Perceptrons](./multilayer-perceptrons.md) trained by
[Backpropagation](./backpropagation.md), this was for a while the standard way
to get them deep.
