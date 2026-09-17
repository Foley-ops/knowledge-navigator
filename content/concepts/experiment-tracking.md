---
concept_id: concept.ml_engineering.experiment_tracking
title: Experiment Tracking
slug: /concepts/experiment-tracking
kind: method
tier: 1
review_state: generated-draft
summary: The practice of recording, for every run of a machine learning experiment, the code, configuration, data version, environment and seeds that went in alongside the metrics and artefacts that came out, so results can be compared and traced instead of remembered.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: contributes_to
    target: concept.ml_engineering.training_infrastructure
    note: Tracking is the instrumentation layer a training system carries; without a per-run record, a cluster that can launch a thousand jobs produces a thousand results nobody can attribute to a change.
  - type: assumes
    target: concept.software.containers
    note: Re-deriving a recorded run assumes its software environment can be restored, which in practice means a pinned image digest rather than a list of package names.
  - type: unreliable_when
    target: concept.languages.gpu_kernels
    note: Nondeterministic GPU kernels — atomic accumulation, autotuned algorithm selection — break the bitwise re-execution people read into a complete run record, even when every seed was logged.
  - type: contrasts_with
    target: concept.software.continuous_integration
    note: Both are provenance systems over the same commits, but CI re-runs a deterministic build to gate a change, whereas tracking records a stochastic experiment whose value is comparison across runs rather than a pass or fail.
sources:
  - source_id: source.mlflow.documentation
    title: MLflow documentation
    url: https://mlflow.org/docs/latest/index.html
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - concrete-example
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.docker.documentation
    title: Docker documentation
    url: https://docs.docker.com/
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: History of experiment tracking tools
    reason: The registry has MLflow's own documentation but no source that dates the tool category or describes its origins, so the attribution here is kept to what the tools themselves document.
    sections:
      - history-and-attribution
      - variants-and-alternatives
  - label: Empirical studies of seed-to-seed variance in deep learning results
    reason: No registry source measures how much reported results move across random seeds, so the claim that seed variance is often comparable to reported effect sizes is stated as practitioner experience rather than cited.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Experiment tracking** writes down, automatically and while the run is
happening, both halves of an experiment: what determined it and what it
produced. A _run_ is one execution of a training or evaluation script. Its
inputs are the code version, the full configuration, the identity of the
dataset, the software environment, the random seeds and the hardware; its
outputs are metrics indexed by step, final evaluation numbers, and artefacts —
checkpoints, plots, prediction files. Both halves are keyed by a run id and kept
somewhere queryable, so runs can be filtered, grouped and diffed later.

The record is a claim about provenance: it says what the run was given, not that
giving the same things again yields the same numbers.

## Why it matters

Three concrete situations. After three hundred runs, "which of these beat the
baseline, and what did each change?" has a mechanical answer only if
configuration and metrics sit in the same store. When a deployed model
misbehaves, the useful question is which run produced that checkpoint, on which
data snapshot. And when a change is worth 0.3 points you need your own noise
floor: variation across random seeds alone is frequently comparable to the
effect sizes people report, and a store that makes "five seeds per config"
routine turns that from an argument into a measurement.

## Intuition

A lab notebook that writes itself. The analogy breaks in a specific place: a
notebook records what the experimenter thought worth noting, surprises included,
while a tracker records exactly what someone instrumented in advance. The
variable that explains a discrepancy is almost always the one nobody logged — a
constant edited by hand, an uncommitted diff, a data directory refreshed in
place under the same path.

The second picture is a receipt rather than a copy of the goods: it lets you
order the same thing again, without promising the kitchen cooks it the same way.

## Concrete example

A minimal tracked run, using MLflow and PyTorch:

```python
import random
import mlflow
import numpy as np
import torch

seed = 0
random.seed(seed)
np.random.seed(seed)
torch.manual_seed(seed)  # seeds CPU and all CUDA devices

mlflow.set_experiment("cifar10-baseline")
with mlflow.start_run(run_name="resnet18-lr3e-4"):
    mlflow.log_params(
        {"lr": 3e-4, "batch_size": 128, "arch": "resnet18",
         "seed": seed, "data_snapshot": "cifar10@2026-02-11"}
    )
    for epoch in range(30):
        loss, val_acc = train_one_epoch(model, loader, optimizer)
        mlflow.log_metrics({"train_loss": loss, "val_acc": val_acc}, step=epoch)
    torch.save(model.state_dict(), "final.pt")
    mlflow.log_artifact("final.pt")
```

MLflow additionally tags the run with the git commit of the entry script when it
is launched from inside a working tree. What the snippet does _not_ capture:
whether that tree was clean, the torch and CUDA versions, the GPU model, the
contents behind `cifar10@2026-02-11`, and anything read from the environment.

Suppose the same config under five seeds gives validation accuracies 92.1, 92.6,
91.8, 92.4 and 92.0 — a spread of 0.8 points. A competing config that scored
92.4 in a single run has told you nothing, and only the store makes that
obvious.

## Formal treatment

Write a run's inputs as a tuple

$$
r = (c,\ \theta,\ D,\ E,\ s,\ H),
$$

where $c$ is the code version (a commit hash of a clean tree), $\theta$ the
configuration, $D$ the dataset identity (a content hash, not a path), $E$ the
software environment, $s$ the seed state and $H$ the hardware and execution plan
— device model, device count, parallelism strategy. Outputs are the metric
series $M(r)$ and artefacts $A(r)$.

Three distinct properties get called "reproducibility":

1. **Record completeness** — the tuple names everything that varied.
2. **Bitwise reproducibility** — re-executing the same tuple yields identical
   bits, i.e. $r \mapsto (M, A)$ is a function.
3. **Statistical reproducibility** — fresh seeds yield results from the same
   distribution.

Tracking delivers (1) if you instrument well, and neither (2) nor (3) by itself.
(2) fails for an arithmetic reason before any engineering one: floating-point
addition is not associative, so in binary32
$(2^{-24} + 2^{-24}) + 1 = 1 + 2^{-23}$ while $2^{-24} + (2^{-24} + 1) = 1$,
because $1 + 2^{-24}$ rounds back to $1$. A GPU reduction that accumulates with
atomic operations applies contributions in whatever order blocks happen to
finish, and that order is not fixed between launches. Same inputs, same seed,
different sum.

Frameworks expose controls that narrow this. PyTorch has
`torch.use_deterministic_algorithms(True)`, which selects deterministic kernels
and raises an error for operations that have none, plus
`torch.backends.cudnn.deterministic = True` and
`torch.backends.cudnn.benchmark = False` to stop the autotuner picking a
different convolution algorithm on a different launch, and
`CUBLAS_WORKSPACE_CONFIG` for deterministic cuBLAS reductions. Its documentation
is explicit that even with all of this, results are not guaranteed to match
across releases, platforms, or between CPU and GPU.

## Assumptions and requirements

Record completeness requires each component of $r$ to be captured by identity
rather than by name.

- **Code.** A commit hash identifies the tree only if the tree was clean; an
  uncommitted diff makes $c$ a lie, which is why trackers that log a patch or
  refuse to start on a dirty tree are doing real work.
- **Configuration.** $\theta$ must live outside the code and be logged in full,
  defaults included. A logged config the script then overrides is worse than
  none.
- **Data.** A path is not a version. $D$ needs a content hash or an immutable
  snapshot id; a directory refreshed in place silently changes the experiment.
- **Environment.** Package versions pin behaviour and a container image pins
  more of it — but image _tags_ are mutable, so $E$ means the image digest, not
  `myrepo/train:latest`.
- **Seeds.** Every stream must be seeded, not just the framework's: Python's
  `random`, NumPy, the CPU and device generators, and data loader workers, which
  are separate processes needing explicit per-worker seeding. In JAX the seed is
  an explicit key threaded through the program, so this omission largely
  disappears.
- **Hardware.** Determinism flags do not promise identical bits across GPU
  architectures or device counts; $H$ belongs in the record.

Drop any one and the record still looks complete while no longer determining the
result.

## Uses and applicability

Reach for tracking as soon as runs outnumber what you can hold in your head; it
is worth most when runs are expensive, when a result will be reported or
shipped, and when more than one person touches the project.

The cost can be near zero: a per-run directory holding the config as JSON, a
metrics CSV and the checkpoint is already tracking, and is enough for a solo
project. A server with a database and a UI earns its keep when runs must be
compared across people and machines. A tracker is _not_ the right home for
production serving telemetry, which belongs in a monitoring system.

## Limitations and common mistakes

The central misconception is that a complete record makes a result
reproducible. It makes it _re-derivable in principle_ and comparable in
practice; the bits are a separate fight, and on GPUs one you often lose. The
related error is expecting a fixed seed to give identical numbers on a GPU:
seeds do not transfer across library versions or device types at all — the same
seed on a different GPU is a different experiment.

Turning determinism on is not free. Deterministic kernels are sometimes
substantially slower, disabling the autotuner costs convolution throughput, and
some operations have no deterministic implementation, so
`use_deterministic_algorithms(True)` converts a silent nondeterminism into a
crash — the right trade for a debugging run, often the wrong one for a long
training job.

The last failure mode is social rather than technical. A tracker makes it
effortless to compare hundreds of configurations against one validation set, and
the best of hundreds is partly selection noise: the winning number is
optimistically biased, and the defence is to re-run the leaders under fresh
seeds and report the spread rather than the maximum, with a test set touched
once as the last word.

## Variants and alternatives

The spectrum runs from a **run directory** on disk — config, metrics file,
artefacts, no query layer — through a **local file store**, to a **tracking
server** backed by a database with a separate artefact store, which is what
makes cross-machine comparison possible. **Autologging**, where the framework
integration records parameters and metrics without explicit calls, buys coverage
and costs precision about what was captured. A **model registry** sits
downstream, promoting a run's artefact to a named, versioned model and keeping
the artefact-to-run pointer alive after deployment.

Two genuinely different approaches sit alongside these: content-addressed
pipeline tools, which version data and cache stage outputs by input hash and so
attack re-execution rather than recording, and several general-purpose tracking
products competing with MLflow on similar models with different hosting
trade-offs — this page's registry documents only MLflow, so no comparison
between them is made here.

## History and attribution

The practice has several independent origins and predates any tool for it: every
researcher whose script dumped a timestamped directory with the config beside
the checkpoint was tracking experiments. The software category formed later, as
deep learning made runs numerous, expensive and stochastic enough that manual
bookkeeping stopped working. MLflow, cited here, is one of the open-source
projects that established the run–parameter–metric–artefact vocabulary the
category now shares. Framework-level determinism controls arrived separately, in
response to GPU nondeterminism becoming a recurring source of unexplained
discrepancies. No registry source dates these developments, so none are asserted
here.

## Sources

MLflow's documentation is the reference for what a run record contains — params,
metrics with steps, artefacts, tags, the automatic git commit tag, autologging,
and the file-store versus tracking-server split. PyTorch's documentation
supplies the seeding APIs and, in its reproducibility notes, which operations
are nondeterministic and what the determinism flags promise. The CUDA C++
Programming Guide covers atomics and floating-point behaviour, where bitwise
nondeterminism comes from. Docker's documentation covers image digests versus
mutable tags.

## Prerequisites and next connections

Nothing deep is required first. It helps to have written a training script in
[Python](./python.md), and to know roughly what a GPU does: the reason bitwise
reproducibility is hard lives in [GPU Kernels](./gpu-kernels.md) and concretely
in [CUDA](./cuda.md), where atomic accumulation and autotuned algorithm
selection reorder the same arithmetic between launches.

From here, the useful neighbours are the pages this practice sits between.
Training infrastructure emits the runs; containers are how the recorded
environment is pinned; deployment is where the artefact-to-run pointer survives
or is lost.
