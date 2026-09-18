---
concept_id: concept.learning.federated_learning
title: Federated Learning
slug: /concepts/federated-learning
kind: concept
tier: 1
review_state: generated-draft
summary: Training one shared model across data that never leaves the phones or institutions holding it, by repeatedly broadcasting the model, training locally, and averaging what comes back — which buys data minimisation at the price of a harder optimisation problem and no privacy guarantee on its own.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: requires
    target: concept.optimization.stochastic_optimization
    note: The inner loop of every federated algorithm is minibatch SGD, and the whole design question is how many local SGD steps to take between averages, so the page cannot be read without knowing what a stochastic gradient step is.
  - type: requires
    target: concept.systems.distributed_systems
    note: Partial participation, stragglers and mid-round dropouts are part of the algorithm's specification here rather than an implementation detail, and they are the standard distributed-systems failure model applied to an optimiser.
  - type: contrasts_with
    target: concept.ml_engineering.training_infrastructure
    note: Datacentre data parallelism assumes a shuffled shared dataset, a fast homogeneous interconnect and reliable workers exchanging gradients every step; federated learning drops all three, which is why it averages models instead of gradients.
sources:
  - source_id: source.mcmahan2017.federated_averaging
    title: Communication-Efficient Learning of Deep Networks from Decentralized Data
    url: https://arxiv.org/abs/1602.05629
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Privacy attacks and protections for federated model updates
    reason: The registry contains no source on privacy attacks, secure multiparty computation or differential privacy. The FedAvg paper motivates federated learning by data minimisation and notes that it composes with such mechanisms, but it does not establish that updates leak, nor state any formal guarantee, so the privacy arguments on this page are cited to nothing.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Federated optimisation under heterogeneity — client-drift convergence analyses, proximal and control-variate corrections, server-side adaptive optimisers, and update compression
    reason: No registered source covers the post-2017 federated optimisation literature; the named variants and the description of drift as a fixed-point bias rest on the worked example here and on general knowledge rather than on a cited analysis.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: Production federated systems and deployments — device eligibility rules, round deadlines and dropout handling at fleet scale, and the mobile keyboard models trained this way
    reason: The registry has nothing on deployed federated systems, so the claims about which devices participate and what has actually been trained federated in production are uncited; the distributed-systems reference covers stragglers and partial failure in general but says nothing about federated device fleets.
    sections:
      - assumptions-and-requirements
      - uses-and-applicability
claims: []
---

## Definition

**Federated learning** is the training of one shared model over data partitioned
across many holders — phones, cars, hospitals, banks — under the constraint that
the raw data never leaves its holder. Only model parameters or updates derived
from them are exchanged, usually through a coordinating server. The canonical
procedure is **federated averaging** (FedAvg): the server broadcasts the current
model to a sample of clients, each client runs several epochs of local SGD on its
own data, each returns its updated parameters, and the server replaces its model
with a weighted average of what came back. One pass of that loop is a *round*,
and rounds — not gradient steps — are the currency of the method.

## Why it matters

Three separate constraints make pooling impossible in practice. Legal and
contractual ones: patient records cannot leave a hospital's network. Practical
ones: the raw signal is enormous or continuously produced, and uploading every
keystroke or every frame is not on offer. And there is data that would simply
never exist centrally, because no one would consent to producing it — the text
you type into a phone keyboard is the motivating example in the original paper.

Federated learning changes the unit of upload from the data to a model update,
which is smaller, derived, and single-purpose. That is a real reduction in
exposure, and it is worth being exact about what it is: it is **data
minimisation**, not anonymity and not a privacy guarantee. The update is a
function of the data and carries information about it; what turns minimisation
into a guarantee is a separate mechanism, discussed below.

## Intuition

Picture a study group whose members may not show each other their notes. One copy
of the textbook — the model — goes to each member; each annotates it from their
own notes; the annotations are merged by averaging the books. Meeting to merge is
expensive, so each member works alone for a while first.

Two things follow, and they are the whole subject. The longer each member works
alone, the fewer meetings are needed. And the longer each member works alone, the
further their copy drifts toward *their* material, so the merged book is worse
than any single copy would suggest. The analogy breaks in one important place:
averaging books only makes sense if everyone started from the same edition.
Averaging two networks trained from different random initialisations produces a
model much worse than either parent, which is why every client in a round starts
from the same broadcast weights.

## Concrete example

Take two clients with equal data quantities and quadratic objectives of different
curvature: $F_1(w) = \tfrac{1}{2}\lambda_1 (w - a_1)^2$ with $\lambda_1 = 4$,
$a_1 = 1$, and $F_2$ with $\lambda_2 = 1$, $a_2 = -1$. The global objective is
$f = \tfrac12 (F_1 + F_2)$, minimised at
$w^\star = (\lambda_1 a_1 + \lambda_2 a_2)/(\lambda_1 + \lambda_2) = 0.6$. Run
FedAvg from $w_0 = 0$ with learning rate $\eta = 0.1$ and $E = 5$ local full-batch
steps. Client 1 returns $1 - 0.6^5 = 0.92224$, client 2 returns
$-1 + 0.9^5 = -0.40951$, and the average is $0.256365$ — while five *centralised*
gradient steps from the same point would have reached $0.457617$.

Worse, the gap does not close with more rounds. The round map has a fixed point at
$0.385\ldots$, and FedAvg converges there and stops:

```python
eta, E = 0.1, 5
clients = [(4.0, 1.0), (1.0, -1.0)]   # (curvature lambda_k, local optimum a_k)

def client_update(w, lam, a):
    for _ in range(E):
        w -= eta * lam * (w - a)      # grad of F_k(w) = 0.5 * lam * (w - a)^2
    return w

w = 0.0
for _ in range(200):                  # rounds
    w = sum(client_update(w, lam, a) for lam, a in clients) / len(clients)
print(w)                              # 0.38500..., not the optimum 0.6
```

Set `E = 1` and the same loop converges to exactly $0.6$. That is client drift in
its smallest honest form: with one local step FedAvg is gradient descent on the
global objective, and with five it solves a different problem.

For a non-toy instance, the original paper partitions MNIST by sorting the
training set by digit label, cutting it into 200 shards of 300 examples, and
giving each of 100 clients two shards — so most clients see only two digits. Even
on that deliberately pathological split, FedAvg reaches target accuracy in far
fewer rounds than one-step-per-round federated SGD; the paper reports reductions
of roughly 10 to 100 times in rounds of communication across its models.

## Formal treatment

Let client $k$ hold $n_k$ examples, $n = \sum_k n_k$, and let

$$
f(w) \;=\; \sum_{k=1}^{K} \frac{n_k}{n} F_k(w),
\qquad
F_k(w) \;=\; \frac{1}{n_k} \sum_{i \in \mathcal{P}_k} \ell(w; x_i, y_i),
$$

where $\mathcal{P}_k$ is client $k$'s index set and $\ell$ the per-example loss.
FedAvg has three hyperparameters beyond $\eta$: the fraction $C$ of clients
sampled per round, the local epoch count $E$, and the local minibatch size $B$.
In round $t$ the server samples $S_t$ with $|S_t| = \max(\lceil CK \rceil, 1)$,
broadcasts $w_t$, each $k \in S_t$ runs $E n_k / B$ SGD steps to produce
$w_{t+1}^k$, and the server sets

$$
w_{t+1} \;=\; \sum_{k \in S_t} \frac{n_k}{n_{S_t}} w_{t+1}^k ,
\qquad n_{S_t} = \sum_{k \in S_t} n_k .
$$

Two accounting facts drive every design decision. First, communication per round
is $2|w|$ parameters per participating client — one download, one upload —
independent of $E$ and $B$, while local computation per round scales as
$E n_k / B$. Increasing $E$ therefore buys progress per round at no communication
cost. Second, at $E = 1$, $B = n_k$ and full participation the method degenerates
to exact batch gradient descent, because
$\sum_k \tfrac{n_k}{n} \nabla F_k(w) = \nabla f(w)$: averaging models and
averaging gradients coincide when each client takes exactly one step. For $E > 1$
they do not coincide, and the discrepancy is **client drift**. The worked example
shows its sharpest form: with unequal local curvature the round map's fixed point
is not $\arg\min f$, so the bias survives any number of rounds and is removed only
by shrinking $\eta E$ or correcting the local updates.

## Assumptions and requirements

- **Shared initialisation per round.** Averaging is only meaningful for models in
  the same loss basin; clients must start each round from the broadcast weights.
- **The $n_k$-weighted mixture is the objective you want.** If the deployment
  population is not distributed like the client data — a plausible situation when
  only idle, charging, well-connected devices participate — the algorithm
  faithfully optimises the wrong function.
- **Local minibatches are drawn randomly within a client.** SGD's unbiasedness
  argument needs this; it says nothing across clients, and non-IID data across
  clients is expected rather than a violation.
- **Enough clients per round.** The aggregate is an estimate over $|S_t|$ clients;
  with a handful, a single unusual client moves the global model.
- **Tolerance of partial failure.** Clients drop mid-round, run late, or never
  return. A round has a deadline and proceeds with whoever finished, which makes
  the effective participant sample a biased one.
- **The model fits the weakest participating device**, in memory, battery and
  wall-clock time for $E n_k / B$ steps.

Drop the first and averaging is meaningless. Drop the second and every metric you
report is measured against the wrong distribution. Drop the last and the client
population silently shrinks to the fastest devices.

## Uses and applicability

The literature separates two regimes with different engineering. *Cross-device*:
up to millions of unreliable, stateless clients with tiny local datasets, only a
sliver available per round, each perhaps appearing once ever. *Cross-silo*: a
handful of institutions with large datasets, reliable availability, and
per-participant state that persists across rounds. The same objective covers both;
almost nothing else transfers.

Reach for federated learning when the data genuinely cannot be pooled and pooling
would genuinely help — many holders, each with too little data to train alone.
Do not reach for it when you can lawfully and cheaply centralise: you would pay
accuracy, engineering complexity and the ability to look at your own data for
nothing. It is also a poor fit when a few clients hold near-identical data (pool
them by agreement instead), or when the model must be audited against the raw
examples it was trained on.

## Limitations and common mistakes

**"The data stays local, therefore it is private."** This is the error that
matters. An update is a function of the data, and gradient-inversion attacks have
recovered recognisable training inputs from a single client's update, worst when
the local batch is small and the update comes from few steps. Secure aggregation
lets the server see only the sum over many clients, and differential privacy —
clipping each client's update and adding calibrated noise — bounds what the
released model reveals about any one participant. Those mechanisms give
guarantees; locality alone gives an architecture.

**Treating FedAvg as SGD with a bigger batch.** It is not, for $E > 1$; the
example above converges to the wrong point.

**Assuming more local work is free.** Raising $E$ cuts rounds until drift
dominates, then degrades the model. The optimum depends on how heterogeneous the
clients are, and is found empirically.

**Evaluating as if the population were random.** There is no central held-out set,
so metrics are computed on device and returned in aggregate, over exactly the
biased, availability-filtered population that trained the model.

**Debugging blindness.** You cannot inspect the data. Label noise, a broken
preprocessing path on one device model, an encoding bug — all of it is invisible
except through aggregate metrics, and each hyperparameter trial costs real rounds
against a live fleet.

**Security tension.** Malicious clients can poison the model or plant backdoors,
and secure aggregation, which hides individual updates, is exactly what prevents
the server from inspecting updates to filter them. Robustness and privacy pull
against each other here; this is not a solved trade-off.

## Variants and alternatives

**FedSGD** ($E = 1$, full local batch) is the unbiased but communication-hungry
baseline. **FedProx** adds a proximal term $\tfrac{\mu}{2}\|w - w_t\|^2$ to each
local objective, keeping clients near the broadcast point at the cost of slower
local progress. **SCAFFOLD**-style control variates estimate and subtract the
drift direction, which works well when clients are stateful and poorly when a
client is seen once. **Server-side adaptive optimisers** treat the averaged delta
as a pseudo-gradient and apply Adam or Yogi to it, which helps when client updates
are noisy. **Personalisation** — local fine-tuning, or mixing a global and a local
head — abandons the premise that one model should serve every client.
**Decentralised gossip** removes the server, trading a coordination point for
slower mixing. **Split learning** sends activations at a cut layer instead of
weights, changing both the communication profile and what leaks. Compression,
quantisation and sketching attack the $2|w|$ per round directly.

The genuine alternatives are not federated at all: centralise under a
differential-privacy mechanism, compute inside a trusted execution environment, or
train centrally and only *infer* on device. Each moves the trust assumption
somewhere else rather than removing it.

## History and attribution

Federated learning was named and defined by H. Brendan McMahan, Eider Moore,
Daniel Ramage, Seth Hampson and Blaise Agüera y Arcas in a 2016 preprint,
published at AISTATS in 2017, which also introduced FedAvg and the FedSGD
baseline. The problem they were working on was concrete: training language models
on text typed into mobile keyboards, data that was both too sensitive to collect
and too valuable to ignore. The algorithmic ancestor — averaging parameters of
models trained independently on data shards — predates the term in the parallel
and distributed optimisation literature; the federated contribution is the setting
(massively distributed, unbalanced, non-IID, intermittently available clients) and
the demonstration that many local steps per round work anyway.

The cross-device and cross-silo vocabulary, the drift-correcting methods, and the
privacy-attack literature all arrived after 2017 and are still moving. Whether
drift correction, personalisation or simply tuning $E$ is the right answer for a
given deployment is not settled.

## Sources

The McMahan et al. paper is the primary source for everything structural here:
the objective, the FedAvg and FedSGD algorithms, the $C$/$E$/$B$ hyperparameters,
the pathological MNIST partition, the reported reduction in communication rounds,
and the observation that averaging independently initialised models fails. The
Deep Learning book supports the SGD background — why minibatches must be sampled
randomly, and what large-scale training assumes — but contains nothing on the
federated setting. Designing Data-Intensive Applications supports the systems
half: partial failure, stragglers and unreliable networks as the normal condition
of a distributed system, which is what a round deadline is responding to. The
privacy claims, the drift-correcting variants and the production-deployment
details are flagged in `unresolved_references` because no registered source
covers them.

## Prerequisites and next connections

Read [Stochastic Optimization](./stochastic-optimization.md) first — FedAvg is
local SGD plus an averaging step, and the trade-offs here are all about how much
local SGD to do. [Distributed Systems](./distributed-systems.md) supplies the
failure model that the round structure is built around.

From here, [Training Infrastructure](./training-infrastructure.md) is the
instructive contrast: the same objective pursued with fast interconnects, reliable
workers and gradient exchange every step, which shows exactly which assumptions
federated learning is paying to drop. [Deployment](./deployment.md) matters
because the trained model usually runs on the same devices that trained it, and
[Experiment Tracking](./experiment-tracking.md) becomes harder when every metric
is an aggregate over a population you cannot inspect.
