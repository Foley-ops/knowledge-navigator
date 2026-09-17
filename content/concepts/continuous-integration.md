---
concept_id: concept.software.continuous_integration
title: Continuous Integration
slug: /concepts/continuous-integration
kind: method
tier: 1
review_state: generated-draft
summary: The practice of merging every developer's work into one shared mainline at least daily and verifying each merge with an automated build, so integration problems surface in minutes instead of accumulating inside long-lived branches.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: prerequisite_of
    target: concept.software.continuous_delivery
    note: Continuous delivery is the claim that every mainline commit is releasable, which is only meaningful once every commit has actually been integrated and verified.
  - type: contributes_to
    target: concept.ml_engineering.deployment
    note: The artifact a deployment ships is the output of a green pipeline run, so what the pipeline gates on determines what deployment is allowed to assume.
  - type: contrasts_with
    target: concept.ml_engineering.experiment_tracking
    note: Experiment tracking records results of runs far too slow and too stochastic to gate a merge, which is exactly the regime where commit-level gating does not apply.
sources:
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.git_scm.book
    title: Pro Git
    url: https://git-scm.com/book/en/v2
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
unresolved_references:
  - label: Grady Booch, Object-Oriented Design with Applications (1991), as the first printed use of the phrase "continuous integration"
    reason: The registry has no source covering the pre-Extreme-Programming origin of the term, so this attribution is stated from general knowledge and is the one claim on the page a reader should verify elsewhere.
    sections:
      - history-and-attribution
  - label: The State of DevOps / Accelerate research associating short branch lifetimes with software delivery performance
    reason: The empirical link between trunk-based development and delivery outcomes comes from survey research the registry does not list; it is flagged in the text as a correlational finding rather than cited.
    sections:
      - why-it-matters
claims: []
---

## Definition

**Continuous integration** is the practice of every developer merging their work
into a single shared mainline frequently — in the original formulation, at least
once a day — with each merge built and tested automatically, so that a broken
mainline is detected within minutes and fixed immediately.

Two halves, and the first is the one people drop. The discipline is about
_integration frequency_: work not on the mainline is work whose compatibility with
everyone else's is unknown. The automated build is what makes that frequency
survivable; it is not itself the practice. A team running a build server against
branches that live three weeks has bought the tooling and skipped the practice.
"Our CI" now almost always means "our build service", but that is a drift in
meaning rather than a refinement, and the two arrangements behave differently.

## Why it matters

Unintegrated work is an unquantified liability. A branch that has not touched the
mainline in two weeks holds an unknown number of conflicts, and you learn how many
only when you merge — normally under deadline, when the cost is highest. Frequent
integration converts one unpredictable large cost into many small predictable ones.

It also makes failures attributable. If the mainline was green ten minutes ago, is
red now, and one commit landed between, you know which commit and the author still
has the change in their head. That is what lets a team keep a trunk anyone can
branch from or release from at any moment. Survey research on delivery performance
repeatedly finds short branch lifetimes associated with better outcomes, but that
is a correlation over self-reported data, not a theorem, and it is flagged in the
frontmatter as uncited.

## Intuition

Picture each working copy as a fork of reality that drifts further every hour.
Integration reconciles the forks, and the drift accumulates whether you look or
not, so the choice is not whether to pay but when. The debt analogy breaks in one
way: interest compounds smoothly, whereas merge pain is heavy-tailed. Most
long-lived branches merge cleanly and lull the team into thinking the risk is
imaginary; then one lands on the same module as a refactor and costs a week.

The second picture is a ratchet. Every green build advances a known-good point the
team can stand on. Anything that lets the mainline stay red — a tolerated failure,
a flaky test nobody trusts — disengages it, and that point stops moving.

## Concrete example

A small Python service, eight developers, split pipeline:

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  fast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -e ".[dev]"
      - run: ruff check .
      - run: pytest -q -m "not slow" --timeout=60
  slow:
    needs: fast
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -e ".[dev]"
      - run: pytest -q -m slow
```

The `fast` job takes three minutes and gates the merge; `slow` takes twenty-five
and runs after. The developer's half of the practice has nothing to do with YAML:

```sh
git fetch origin
git rebase origin/main            # integrate now, not on Friday
pytest -q -m "not slow"           # verify the merged result locally first
git push origin HEAD:main         # or open a PR that merges today
```

Eight people merging twelve times across a nine-hour day put about 1.3 commits per
hour against a 28-minute pipeline. Let the slow suite reach ninety minutes and the
arithmetic below turns against you.

## Formal treatment

**Conflict growth.** Model the codebase as $m$ independently editable units and a
branch of age $T$ as touching $k = \lambda T$ of them, drawn uniformly at random.
Two branches touch disjoint sets with probability

$$
\Pr[\text{no overlap}] = \frac{\binom{m-k}{k}}{\binom{m}{k}} \approx \exp\!\left(-\frac{k^2}{m}\right) = \exp\!\left(-\frac{\lambda^2 T^2}{m}\right),
$$

so for small arguments the conflict probability is $\approx \lambda^2 T^2 / m$:
quadratic in branch age. Halving the integration interval quarters expected
conflicts, and $n$ open branches give $\binom{n}{2}$ pairs to reconcile. Edits
cluster on hot files rather than spreading uniformly, so treat this as a floor.

Textual conflict is only the detectable case. Two changes can merge cleanly and
still be semantically incompatible — I change a function's contract, you add a
caller relying on the old one, `git merge` reports nothing — which is why the
definition demands the merged result be _built and tested_, not merely merged.

**Feedback latency.** Let the mainline accept commits at rate $\mu$ and the gating
pipeline take time $t$. By Little's law the expected number of merged but
unverified commits is $L = \mu t$. While $L < 1$ a red build points at one commit;
once $L \gg 1$ a failure implicates a batch, and you must bisect or serialise
behind a merge queue, which caps mainline throughput at $1/t$.

**Flakiness.** If a pipeline runs $N$ checks each failing spuriously with
probability $f$ per run, a correct commit passes with probability $(1-f)^N$. For
$N = 200$ and $f = 10^{-3}$ that is $0.999^{200} \approx 0.82$: eighteen percent of
correct commits rejected. Negligible per-test rates compound into that.

**What is worth gating on.** A check belongs in the gate when its failure is
attributable to the commit, means the commit is wrong, and arrives inside the
feedback budget. Environmental checks violate the first, coverage thresholds often
the second, two-hour end-to-end suites the third. Those belong after the merge with
a named owner, not in front of it.

## Assumptions and requirements

There must be exactly one mainline everybody integrates into and nobody may bypass;
with two competing long-lived trunks the practice degenerates into scheduled
reconciliation.

The build must be reproducible from the commit alone. If the result depends on a
mutable agent's installed packages, a red build stops being evidence about the
commit and the team learns to re-run rather than investigate. Building in a pinned
container image from a declarative file is today's standard way to buy that,
though the requirement long predates the answer: CI tooling had been mainstream
for a decade before containers arrived, and teams bought reproducibility with
dedicated or scripted build agents instead. Checks must be deterministic, and the
gate must fit the feedback budget — roughly ten minutes, a rule of thumb rather
than a measured constant.

Unfinished work must also be mergeable, which assumes a technique for shipping
dormant code: feature flags, branch by abstraction, or building the new path beside
the old. Drop this and long-lived branches return by necessity.

## Uses and applicability

Reach for it when a team shares a codebase, the checks are much faster than the
work they verify, and a broken mainline actually costs something. It pays best in
large, long-lived codebases with many contributors, where the quadratic conflict
term bites hardest.

It applies poorly wherever verification cannot be made fast or attributable.
Hardware in the loop, multi-hour simulations and model training runs all break
commit-level gating; the honest structure there is a fast gate on the deterministic
code plus scheduled verification of the rest, alerted on rather than blocking
merges. Regulated sign-off and patches from untrusted contributors also rule out
the pure trunk form — the pull-request model exists largely for that second reason.

## Limitations and common mistakes

The first mistake is definitional: believing a build server plus pull requests is
continuous integration. If branches live a week, the server verifies each island in
isolation and says nothing about whether the islands fit together. The honest
self-test is how long the oldest unmerged branch has been open.

The second is tolerating flake. A pipeline wrong eighteen percent of the time
trains everyone to hit re-run, and a real regression then lands because it looked
like the usual noise. Quarantining a flaky test — out of the gate, with an owner
and a deadline — beats leaving it in, and beats deleting it quietly.

The third is letting the gate get slow. Once feedback exceeds attention span,
developers batch work to amortise the wait, branches lengthen, and the practice
unwinds from the inside. Slowness is the mechanism by which CI dies.

Last, CI does not improve quality by itself: it runs the checks you wrote, and a
green pipeline over a thin suite is a confident statement about very little.

## Variants and alternatives

**Trunk-based development** is the strict form — commits straight to the trunk, or
branches measured in hours. **Pull-request flow** is the ubiquitous loose form,
preserving review and access control at the cost of integration delay; it
approaches real CI only as branch lifetime approaches zero.

**Gated commit** (merge queues, Bors-style bots) merges only candidates verified
against the current tip, guaranteeing a green trunk at the price of throughput; it
fixes attribution, not integration frequency. **Optimistic merge with auto-revert**
inverts that and is cheaper at high commit rates. **Affected-target selection**
computes from the dependency graph which tests a change can touch, which is how
monorepos keep gating affordable; it costs correctness wherever that graph is wrong.

The genuine alternative is **long-lived feature branching** with a scheduled
integration phase: it buys isolation and staged release control, and pays with the
conflict accumulation modelled above.

## History and attribution

The phrase predates the practice: it is generally credited to Grady Booch's 1991
book on object-oriented design, where it means incremental integration rather than
today's automated discipline. That attribution is flagged in the frontmatter.

The discipline as now understood came out of **Extreme Programming** in the late
1990s, where Kent Beck listed continuous integration among the core practices
alongside test-first development and collective code ownership — integrating many
times a day was only possible because the tests made it safe. Martin Fowler's
article, written with Matthew Foemmel from ThoughtWorks project experience, carried
it to a wide audience and remains its standard reference statement.

Tooling followed rather than created the practice. CruiseControl, open-sourced in
the early 2000s, was the first widely used CI server, and the ecosystem after it
was adopted far more widely than the discipline behind it — which is the drift.

## Sources

Martin Fowler's site is the canonical statement of what the practice is, what
separates it from feature branching, and where it came from; it also carries the
branch-management patterns behind the variants. Pro Git supplies the mechanics the
argument rests on: merge bases, three-way merge, rebase, and why a clean merge is
not a correct one. The Docker documentation covers the reproducible, declaratively
specified build environment a trustworthy gating check requires.

## Prerequisites and next connections

Understand a version control system's merge model first — what a merge base is, why
a clean merge can still be wrong, what an open branch costs. Little here makes sense
without it.

What the pipeline runs is language-specific in ways that decide whether gating is
viable. A [Rust](./rust.md) project gets strong compile-time guarantees from its
gate but pays in build minutes, so caching and incremental compilation become
load-bearing; a [Python](./python.md) project has a fast toolchain and a weaker
static gate, so the suite carries the whole burden and flakiness dominates.

Next come continuous delivery, which extends the green mainline to a releasable
artifact, and containers, which are how most teams make the build environment
reproducible enough for the checks to mean anything.
