---
concept_id: concept.software.continuous_delivery
title: Continuous Delivery
slug: /concepts/continuous-delivery
kind: method
tier: 1
review_state: generated-draft
summary: The practice of keeping software permanently releasable by promoting every change through an automated deployment pipeline, so that shipping becomes a business decision rather than a technical event.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: requires
    target: concept.software.continuous_integration
    note: The pipeline's first stage is the integration build, and a trunk that is not continuously integrated has no green state to promote, so nothing downstream of it means anything.
  - type: contributes_to
    target: concept.ml_engineering.deployment
    note: Shipping a model to serving traffic is a release like any other, and canary rollout, rollback and the deploy-release split are borrowed wholesale from this practice.
  - type: useful_when
    target: concept.software.containers
    note: A container image is an immutable, content-addressed artifact that can be built once and run unchanged in every environment, which is exactly the property the promotion model depends on.
sources:
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - variants-and-alternatives
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.kubernetes.documentation
    title: Kubernetes documentation
    url: https://kubernetes.io/docs/concepts/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.docker.documentation
    title: Docker documentation
    url: https://docs.docker.com/
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.git_scm.book
    title: Pro Git
    url: https://git-scm.com/book/en/v2
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: DORA State of DevOps research and Accelerate
    reason: The four delivery metrics and the claim that they correlate with organisational performance come from a self-reported survey programme and the book built on it; no source in the registry covers that research, so the page describes the finding and its study design without a citation.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
  - label: Continuous Delivery (Humble and Farley, 2010)
    reason: The book that named the deployment pipeline and systematised the practice is not in the registry, so the attribution rests on general knowledge rather than on a cited source.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Continuous delivery** is the practice of keeping software in a state where any
build that has passed the pipeline could be put into production immediately, for
any change, at any time. The mechanism is the **deployment pipeline**: a commit
to trunk is compiled and packaged exactly once into a versioned artifact, and
that same artifact is promoted through increasingly production-like automated
stages — unit tests, acceptance tests, capacity checks, staging — with any
failure stopping the change dead. What comes out is a release candidate whose
deployability has been demonstrated rather than assumed.

**Continuous deployment** is a different claim: it removes the decision, so every
change that passes the pipeline goes to production automatically, with nobody in
the path. Continuous deployment therefore implies continuous delivery; the
converse is false, and plenty of teams practise continuous delivery while
deliberately keeping the button. That is the difference between "we _can_
release on demand" and "we _do_ release every commit", and conflating them makes
the first sound far more disruptive than it is.

## Why it matters

Release processes have a feedback loop that runs the wrong way. Rare deployments
are unpractised, so they are risky; risk justifies gatekeeping; gatekeeping
makes them rarer still, and each release carries months of change, so the search
space for any regression is enormous. Continuous delivery attacks the loop at
the batch size: with a pipeline on every commit, a release contains one change,
and the first suspect is the thing that just shipped.

The best-known evidence for this is the DORA survey programme, which reports
that deployment frequency, lead time for changes, change failure rate and time
to restore service cluster together, and that teams scoring well on them also
report better organisational outcomes. That is a correlational finding from
self-reported, cross-sectional survey data — not a theorem and not a controlled
experiment. Its authors argue for a causal reading using structural models; the
design cannot establish one.

## Intuition

Picture a factory line rather than a ceremony. The build is the only place raw
source becomes a product; everything after inspects that exact unit, cheap
checks first, so most bad changes die in the first few minutes.

The second idea is that **deploy and release are separate verbs**. Deploying
puts code on machines; releasing exposes behaviour to users. Feature flags drive
a wedge between them: unfinished work ships dark every day and is switched on
later by configuration. The factory analogy breaks in one place — faulty output
is simply discarded, whereas a deployment mutates a live system holding state,
which is why rollback is a design problem and not a button.

## Concrete example

A rolling update of a ten-replica service, expressed as a Kubernetes Deployment:

```yaml
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0
```

During the rollout there are never more than $10 + 2 = 12$ pods and never fewer
than $10$ ready ones, so capacity holds; each new pod must pass its readiness
probe before an old one is retired. Both versions serve traffic for the
duration, which is why each must tolerate the other's data. If it goes wrong,
`kubectl rollout undo` scales the previous ReplicaSet back up — a genuine
rollback, because no state changed.

Now the canary arithmetic. Send $1\%$ of $2{,}000$ req/s to the new version:
$20$ req/s. A catastrophic regression — error rate $0.1\%$ to $2\%$ — produces
about $0.4$ errors/s and is obvious within a minute. A subtle one, $0.1\%$ to
$0.2\%$, is not: a two-proportion test at $\alpha = 0.05$ with $80\%$ power
needs roughly $24{,}000$ requests per arm, twenty minutes at that rate, and only
if requests are independent, which they are not when errors cluster by user.
Canaries catch big failures fast and small ones slowly, if at all.

## Formal treatment

Model the pipeline as a directed acyclic graph of stages $s_1, \dots, s_n$, each
a predicate $s_i : A \times E_i \to \{\text{pass}, \text{fail}\}$ on an artifact
$a \in A$ and an environment configuration $E_i$. The **build-once** rule says
$a$ is produced by $s_1$ alone and is immutable after, so every later stage
tests the object that will ship; $a$ is a _release candidate_ once every stage
on some root-to-leaf path has passed.

The invariant: for every commit $c$ accepted on trunk, either $c$ fails a stage
within the pipeline's latency $T$, or a deployable $a(c)$ exists. With $r : A
\to \{0,1\}$ the release decision, continuous delivery constrains only the
pipeline; continuous deployment additionally fixes $r(a) = 1$ for every release
candidate.

For a rolling update with $N$ desired replicas, surge $\sigma$ and unavailable
budget $\upsilon$, the controller maintains

$$
\text{total pods} \le N + \sigma, \qquad \text{ready pods} \ge N - \upsilon ,
$$

and progress requires $\sigma + \upsilon \ge 1$: with both zero there is no room
to create a new pod or free an old one, and the rollout cannot start. Lead time
for changes is the elapsed time from commit to serving traffic, of which $T$ is
a lower bound.

## Assumptions and requirements

Everything needed to build, provision and deploy lives in version control — code,
infrastructure and pipeline definitions, migration scripts — because the
pipeline can only reproduce what it can fetch. Branches are short-lived for the
same reason: a green trunk says nothing about a six-week branch that has not
merged.

The artifact must behave identically across environments — an image built from a
pinned base and a lockfile approximates this, scripts that install packages at
deploy time defeat it — and the test suite must be trusted. Flakiness destroys
that fast: with $500$ independent tests each failing spuriously with probability
$0.001$, a clean run still shows at least one red with probability $1 -
0.999^{500} \approx 39\%$, and at that rate people re-run the build instead of
reading it.

Finally, releases must be reversible or forward-compatible. Code rollback is
cheap; a migration that dropped a column is not. Schema changes go by
expand-and-contract — add, dual-write, backfill, switch reads, drop later — so
each deploy is individually safe to undo.

## Uses and applicability

Reach for it when a system is deployed by its owners to infrastructure they
control — most web services and internal platforms — and treat it as the default
for any codebase where more than a couple of people commit.

It applies less cleanly where the release is not the deployer's to make: mobile
apps face store review, on-premises software ships to customers who upgrade on
their own schedule, and a bad firmware image can brick a device. The pipeline is
still worth building there, but the last stage is a shipment, and canarying and
rollback must be redesigned or given up.

## Limitations and common mistakes

The dominant confusion is the one above: teams reject continuous delivery
because they hear "every commit goes live", which is continuous deployment.

Next is tolerating a slow pipeline: ninety minutes of feedback teaches
developers to batch their work, reconstructing the large batches the practice
exists to eliminate. Then treating DORA metrics as targets — they are proxies
from survey research, and deployment frequency is trivial to inflate by
splitting one change across five deploys. Then assuming rollback always exists;
it does not once state has changed, and a team that has never rehearsed one
finds out during an incident.

Feature flags carry their own debt: every live flag doubles the notional
configuration space, stale flags accumulate, and a flag in the request path is a
new dependency that can fail. Delete them once the feature is permanent.

Whether a pipeline satisfies regulatory separation-of-duties requirements is
genuinely contested: that an audited, peer-reviewed pipeline is stronger
evidence than a sign-off meeting is plausible, and not universally accepted by
auditors.

## Variants and alternatives

**Blue-green deployment** runs two production environments and switches traffic
between them; rollback is another switch, paid for in double capacity during
cutover and care with shared databases. **Rolling updates** need no spare
environment but require version coexistence. **Canary releases** expose a
fraction of traffic first, and need volume and good telemetry. **Progressive
delivery** bundles canarying, flags and automated metric analysis into one
promotion decision. **GitOps** inverts the push: a reconciler pulls declared
desired state from a repository.

The honest alternatives are release trains on a fixed cadence, buying
predictability at the cost of lead time, and long-lived release branches with a
manual QA phase, buying an auditable checkpoint and paying in merge cost.

## History and attribution

The practice was named and systematised by Jez Humble and David Farley in their
2010 book _Continuous Delivery_, out of consulting work at ThoughtWorks; the
deployment pipeline had appeared in earlier form in a 2006 Agile conference
paper by Humble, Chris Read and Dan North, and the lineage runs back through
extreme programming's continuous integration in the late 1990s. Martin Fowler's
writing spread the practice and fixed the delivery versus deployment distinction
in common usage; the named rollout strategies were described in that same
early-2010s wave. The DORA reports came later and supplied the measurement
vocabulary now attached to it.

## Sources

Martin Fowler's site is the best short reference for the practice itself: the
definition, the split between delivery and deployment, and the write-ups of
blue-green deployment, canary release and feature toggles. The Kubernetes
documentation supplies the rollout mechanics — strategies, surge and
unavailability budgets, readiness gating and rollback. The Docker documentation
covers the immutable image that makes build-once promotion work, and Pro Git the
version-control assumptions, particularly branching workflows.

## Prerequisites and next connections

Understand continuous integration first: continuous delivery extends an
already-green trunk to a deployable artifact, and without it the pipeline
verifies something nobody merged into. Containers are not required but make
almost everything here easier.

The pipeline is a directed acyclic graph and scheduling its stages is a
topological sort — [Graph Algorithms](./graph-algorithms.md) covers that
machinery. The natural next step is deployment of machine learning systems,
where the artifact includes weights and data and canarying is harder because
quality regressions are statistical rather than binary.
