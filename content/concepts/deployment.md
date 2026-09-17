---
concept_id: concept.ml_engineering.deployment
title: Deployment
slug: /concepts/deployment
aliases:
  - model serving
kind: concept
tier: 1
review_state: generated-draft
summary: The engineering practice of putting a trained model behind a live request stream and keeping its predictions correct as traffic, features and the world underneath them change.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: requires
    target: concept.software.containers
    note: A serving replica is built from a pinned image, and without that pinning the runtime a model is validated in is not the runtime it executes in.
  - type: contrasts_with
    target: concept.ml_engineering.training_infrastructure
    note: Training optimises throughput over a fixed offline dataset where a slow step costs minutes; serving optimises tail latency over an arriving request stream where a slow step costs a user.
  - type: supported_by
    target: concept.software.continuous_delivery
    note: Staged rollout, versioned artefacts and automated rollback are continuous delivery machinery that a model release reuses rather than reinvents.
sources:
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.kubernetes.documentation
    title: Kubernetes documentation
    url: https://kubernetes.io/docs/concepts/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.hinton2015.distilling_knowledge
    title: Distilling the Knowledge in a Neural Network
    url: https://arxiv.org/abs/1503.02531
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Training-serving skew in production ML systems
    reason: No source in the registry covers the ML production-engineering literature on feature-pipeline skew, so the failure mode and its worked example are described from practice rather than from a citable reference.
    sections:
      - concrete-example
      - limitations-and-common-mistakes
  - label: Post-training quantisation formats and their accuracy cost
    reason: The registry has no source measuring the accuracy loss of int8 or 4-bit post-training quantisation for served models, so the claims here are kept qualitative and go uncited.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Deployment** is everything between a trained model and a prediction that
reaches a user: packaging the weights and their preprocessing into a versioned
artefact, running it behind an interface that answers within a latency budget,
routing a fraction of traffic to it, and monitoring inputs and outputs until it
is replaced. It is not a step at the end of training but a standing obligation,
beginning with the first request and ending when the last replica retires.

The unit deployed is the _whole prediction function_, not the network. A
tokeniser, an imputation rule, a scaler fitted on the training set and a
post-processing threshold are all part of it; weights shipped without them have
not been deployed, they have been copied.

## Why it matters

Offline, the expensive quantity is throughput and nobody is waiting. Online it is
the slow tail. Kleppmann's argument about response-time percentiles applies
directly: the mean hides the tail, and when one page issues several model calls
the user waits for the _slowest_, so a p99 ten times the median shows up in far
more than one percent of sessions. Serving budgets are written as percentiles for
this reason.

The second reason is that a deployed model is one of the few parts of a system
whose correctness decays while the code is untouched. It is not alone in this —
a hardcoded fee table, a cached third-party schema, an expiring certificate and
an upstream API that changes its semantics all rot in place — but those fail on
a date or with an error, and a model's decay is silent and statistical. A fraud
model that was 94% accurate last quarter may be worthless this quarter because
fraudsters changed tactics, and no test in the repository will fail: there is no
exception to catch, only a metric that has to be measured to be seen.

## Intuition

Training fits a function to a photograph of the world; serving applies it to the
world as it moves. Two things can go wrong. The photograph stops resembling the
scene — different customers, different devices, a campaign that shifts the input
mix. Or the _rule_ connecting scene to label changes — the customer profile that
meant "low risk" in March means "high risk" in September. The first is data
drift, the second concept drift, and they need different responses.

Where the analogy breaks: a photograph records what it saw. A model records only
what it needed in order to fit, so two very different input distributions can
produce identical accuracy while one lies outside anything it ever saw.

## Concrete example

A payments team standardises a transaction amount before scoring. The training
job fits the scaler on the training frame and pickles only the model:

```python
# training
mu, sigma = train_df["amount"].mean(), train_df["amount"].std()  # 42.10, 18.70
x_train = (train_df["amount"] - mu) / sigma
model.fit(x_train, y_train)
joblib.dump(model, "model.pkl")          # the scaler is not saved

# serving, written later by a different team
mu, sigma = live_batch["amount"].mean(), live_batch["amount"].std()  # 51.30, 25.40
x_serve = (live_batch["amount"] - mu) / sigma
scores = model.predict_proba(x_serve)
```

A £100 transaction reaches the model as $(100 - 42.10)/18.70 = 3.10$ offline and
$(100 - 51.30)/25.40 = 1.92$ online. A rule that fires above $z = 2.5$ catches it
in evaluation and misses it in production. Nothing is broken: no exception, no
alert, no drop in the held-out metric — that metric was computed with the
training scaler. Only the flag rate moves, and only if somebody is watching it.

This is **training-serving skew**: the serving path computes a feature
differently from the training path. The fix is structural — serialise the fitted
transform with the model, or compute the feature once in a shared service — not
a better test of the model.

## Formal treatment

Let $\ell$ be a loss and $f$ the deployed predictor. Risk under a distribution
$P$ is

$$
R_P(f) = \mathbb{E}_{(x,y) \sim P}\big[\ell(f(x), y)\big].
$$

A held-out set of $n$ points drawn i.i.d. from $P$ gives the unbiased estimate
$\hat R = \frac{1}{n}\sum_{i=1}^{n} \ell(f(x_i), y_i)$. **That estimate is a
statement about $P$ and nothing else.** Production traffic at time $t$ follows
some $Q_t$, and without an assumption relating $Q_t$ to $P$ there is no bound on
$R_{Q_t}(f)$ at all — the held-out number is not a weak promise about production,
it is not a promise about production.

Factor the joint distribution as $p_t(x, y) = p_t(y \mid x)\, p_t(x)$. The two
drifts are the two factors:

- **Data drift** (covariate shift): $p_t(x) \neq p_0(x)$ while
  $p_t(y \mid x) = p_0(y \mid x)$. The rule is intact; the mass has moved. Where
  $\operatorname{supp}(p_t) \subseteq \operatorname{supp}(p_0)$, reweighting old
  data by $w(x) = p_t(x)/p_0(x)$ recovers the target risk, using only
  _unlabelled_ production inputs.
- **Concept drift**: $p_t(y \mid x) \neq p_0(y \mid x)$. The target function
  changed. No reweighting of old labelled data fixes it, and detecting it
  requires labels or a delayed proxy for them.

Murphy covers this factorisation and the importance-weighting correction. The
operational consequence is sharp: a monitor watching input statistics — a
population-stability index, a per-feature Kolmogorov–Smirnov test — detects data
drift only. Concept drift can occur with $p(x)$ unchanged, so such a monitor is
blind to it by construction.

For latency, batching $B$ requests into one forward pass amortises weight
movement: $T(B)$ grows sublinearly until arithmetic intensity saturates, so
throughput $B/T(B)$ rises. The cost is a queueing wait of up to the batching
window $\tau$, making end-to-end latency roughly $\tau_{\text{wait}} + T(B)$.
Batching trades the tail for the total, and the budget is written against the
tail.

## Assumptions and requirements

Deployment assumes the artefact is reproducible — same weights, same library
versions, same numerics. Dropped, predictions differ between the evaluation run
and the replica, in the last decimal place until a threshold is near.

It assumes every feature is computable at request time with the semantics it had
in training. Dropped, you get skew, or a feature that leaks future information
offline and is unavailable online.

It assumes traffic is stationary enough that yesterday's evaluation still informs
today's behaviour, and that a health signal exists independent of the model's own
confidence. A miscalibrated model is _certain_ about inputs it has never seen, so
its scores cannot be their own alarm.

## Uses and applicability

Reach for a full serving deployment when predictions must be fresh per request:
ranking, fraud scoring, autocomplete. Kubernetes-style orchestration — replicas,
readiness probes, horizontal autoscaling, rolling updates — is the standard
substrate, and its concepts map onto model servers unchanged.

Do not reach for it when batch scoring will do. If predictions are consumed on a
daily cadence, a scheduled job writing to a table is cheaper, easier to backfill
and easier to audit than a service with an availability target. Many production
"ML systems" are a nightly job and are better for it.

## Limitations and common mistakes

The dominant mistake is treating held-out accuracy as a property of the model
rather than of a distribution. It licenses "the model is 94% accurate", which is
not a well-formed claim until the distribution is named.

The second is monitoring only inputs and calling it drift detection: as above,
that catches one of the two drifts.

The third is waiting on aggregate accuracy when labels arrive late. Chargebacks
land in 60 days, so by the time the accuracy curve bends the model has been wrong
for two months; proxy signals — score distribution, flag rate, downstream
conversion — move sooner and are what to alert on.

The fourth is optimising the mean. A median of 20 ms with a p99 of 900 ms is a
worse service than a flat 60 ms, and the tail has two components that respond
differently. Adding replicas lowers utilisation per server and so shrinks the
queueing and head-of-line-blocking share of the tail, which is the share
Kleppmann attributes much of high-percentile latency to; it does not remove the
intrinsic share, because some requests are slow for reasons correlated with
their content — the customers with the most data ask the most expensive
questions — and those stay slow on an idle replica.

The fifth is silent fallback. A feature service times out, the client substitutes
zero, and the model confidently scores a vector built from a missing feature.
Fail visibly.

## Variants and alternatives

**Online serving** answers per request; **batch scoring** precomputes; **streaming
scoring** sits between, consuming from a log. For latency, **quantisation** stores
weights and sometimes activations at reduced precision, buying memory and
bandwidth at an accuracy cost that must be measured per model rather than
assumed. **Distillation** trains a small student on the large model's softened
output distribution; Hinton, Vinyals and Dean raise the softmax temperature so
the student learns the relative probabilities of the _wrong_ classes, which carry
more information than a hard label. **Pruning** removes weights or structures.
These compose, and each changes the deployed function, so each needs its own
evaluation.

For rollout: **rolling update** replaces replicas gradually, **blue-green** keeps
two environments and flips, **canary** routes a small traffic share to the new
version and watches it, and **shadow** mode copies live traffic to the new model
while serving the old — the only one that measures the new model on real traffic
at zero user risk, at the cost of running both.

## History and attribution

Deployment as a discipline has no single origin. Its release mechanics are
inherited from web operations, where blue-green and canary rollouts and
percentile-based service objectives were established before machine learning
adopted them; its statistical half descends from the older literature on dataset
shift and non-stationary learning. What is recent is the recognition that these
are one problem — a model release is a release _and_ a statistical claim, and the
pipeline must gate on both. "MLOps" as a name for that dates from the late 2010s;
the practices are older than the word, and the field is not settled: there is no
agreed standard for how much drift justifies a retrain.

## Sources

Kleppmann's _Designing Data-Intensive Applications_ is the reference for the
latency-percentile and queueing arguments and for why tail latency is what
matters under fan-out. Murphy's _Probabilistic Machine Learning_ covers
distribution shift, the factorisation separating covariate from concept shift,
and importance-weighting corrections. The Kubernetes documentation describes the
orchestration primitives — replicas, probes, autoscaling, rolling and canary
rollouts — that serving deployments are built from. Hinton, Vinyals and Dean is
the primary source for temperature-softened distillation.

## Prerequisites and next connections

Be comfortable first with the idea that a test-set number is an estimate of an
expectation: [Frequentist Inference](./frequentist-inference.md) makes that
estimator explicit, and [Probability Theory](./probability-theory.md) supplies
the factorisation the drift taxonomy rests on. [Python](./python.md) is where
most serving glue is written.

From here, [Operating Systems](./operating-systems.md) explains the process,
memory and scheduling behaviour that decides whether a replica meets its budget,
and [GPU Kernels](./gpu-kernels.md) explains why batching helps and where the
speedup stops.
