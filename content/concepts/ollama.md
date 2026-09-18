---
concept_id: concept.ml_engineering.ollama
title: Ollama
slug: /concepts/ollama
kind: tool
tier: 1
review_state: generated-draft
summary: A local model runner that packages open-weight language model weights, their prompt template and their sampling parameters into one pullable artefact served by a daemon on localhost.
categories:
  - Programming/ML Engineering
primary_category: Programming/ML Engineering
relationships:
  - type: implements
    target: concept.ml_engineering.edge_inference
    note: Ollama is one concrete packaging of edge inference — quantised weights, a compiled runtime and no network round trip — with the hardware decisions made for you by defaults.
  - type: contrasts_with
    target: concept.ml_engineering.deployment
    note: Server deployment optimises tail latency and cost under concurrent traffic across a fleet; Ollama optimises one machine's memory budget for one user, so almost none of the fleet machinery applies.
  - type: contrasts_with
    target: concept.ml_engineering.pytorch
    note: PyTorch is a Python research stack carrying autograd and training; Ollama ships a compiled inference-only runtime with no Python, no gradients and no ability to change the model's architecture.
  - type: implements
    target: concept.software.apis
    note: Everything past the command line is an HTTP API on 127.0.0.1, including a partial OpenAI-compatible route, so editors and agents consume a local model exactly the way they consume a remote one.
sources:
  - source_id: source.ollama.project
    title: Ollama
    url: https://github.com/ollama/ollama
    source_kind: implementation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.ggml.llama_cpp
    title: llama.cpp
    url: https://github.com/ggml-org/llama.cpp
    source_kind: implementation
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.touvron2023.llama
    title: 'LLaMA: Open and Efficient Foundation Language Models'
    url: https://arxiv.org/abs/2302.13971
    source_kind: preprint
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Open-weight model licence texts and the OSI Open Source AI Definition
    reason: No registered source covers the Llama Community License, the Gemma Terms of Use or the OSI's criteria for calling an AI system open source, so the open-weight versus open-source distinction drawn here is argued from the licences themselves rather than from anything cited.
    sections:
      - limitations-and-common-mistakes
      - assumptions-and-requirements
claims: []
---

## Definition

**Ollama** is a local runner for open-weight language models: a single binary
that downloads a model as a content-addressed set of layers, keeps a background
daemon holding the loaded weights, and answers generation requests over an HTTP
API on `127.0.0.1:11434`. A **Modelfile** — deliberately shaped like a
Dockerfile — binds weights (`FROM`), sampling and context parameters
(`PARAMETER`), a system prompt (`SYSTEM`) and a chat template (`TEMPLATE`) into
one named, versioned artefact, so that `llama3.2:3b` means the same thing on
every machine that pulls it.

Underneath, inference is done by the ggml stack — the tensor library behind
[llama.cpp](https://github.com/ggml-org/llama.cpp) — reading weights in the
**GGUF** file format. Ollama is the packaging, distribution and lifecycle layer;
the numerics are ggml's.

## Why it matters

Before a local runner existed, running an open-weight model meant compiling a C++
project, finding a weight file of the right quantisation, matching it to the
right prompt template by hand, and discovering by trial which layer count fitted
in your GPU. Ollama collapses that into `ollama run`.

It matters because the LLaMA models showed that a well-trained model of 7B–13B
parameters is useful, and that is the size class that fits on a laptop. Once a
useful model fits on the machine in front of you, three constraints vanish at
once: per-token cost, the network round trip, and the requirement that your
prompt leave the building. The last is usually the deciding one — clinical notes,
unreleased code and legal documents are easier to process locally than to get
cleared for an external API.

## Intuition

Think of a Docker registry for models. A tag names an artefact; a pull fetches
layers keyed by SHA-256 and skips the ones already on disk; a Modelfile builds a
derived artefact `FROM` a base. The analogy is exact for distribution and
reproducibility, and breaks in two places: there is no isolation — Ollama is an
ordinary process with direct access to the GPU — and layers are not composable,
the only real composition being a LoRA applied over base weights via `ADAPTER`.

The other picture to carry is memory. A dense model reads every one of its
weights to produce every token, so generation speed is governed by memory
bandwidth, not arithmetic, and "will this model run?" is nearly always "do the
weights and the key-value cache fit in the fast memory?"

## Concrete example

```sh
ollama pull llama3.2:3b
ollama run llama3.2:3b "Name the three CAP properties in one line."
ollama ps      # what is loaded, how large, and CPU/GPU split
```

A Modelfile that fixes a role and a context window:

```text
FROM llama3.2:3b
PARAMETER temperature 0.2
PARAMETER num_ctx 8192
SYSTEM "Answer only from the supplied context. If it is not there, say so."
```

```sh
ollama create grounded -f Modelfile
curl http://localhost:11434/api/generate -d '{
  "model": "grounded",
  "prompt": "What did the incident report say about the retry storm?",
  "stream": false
}'
```

The tag `llama3.2:3b` resolves to a Q4_K_M quantisation of roughly 3.2 billion
parameters — about 2 GB on disk. Its 8B sibling at the same quantisation is
about 4.7 GB, against roughly 16 GB for the same weights in 16-bit floating
point.

## Formal treatment

Let $P$ be the parameter count and $b$ the effective bits per weight of the
quantisation, including the per-block scales that k-quant schemes store
alongside the packed integers. Weight memory is

$$
M_{\text{weights}} \;\approx\; \frac{P \cdot b}{8} \ \text{bytes} .
$$

For GGUF k-quants, $b \approx 4.8$ for `Q4_K_M`, $b \approx 5.7$ for `Q5_K_M`
and $b \approx 8.5$ for `Q8_0`: the label names the integer width, and the
effective figure is larger because scales and minima are stored per block.

The attention cache is the term people forget. For a model with $L$ layers,
$H_{kv}$ key-value heads after grouped-query attention, head dimension $d$, and
$T$ tokens of context held at $s$ bytes per element,

$$
M_{\text{KV}} \;=\; 2 \, L \, H_{kv} \, d \, T \, s .
$$

Llama 3 8B has $L = 32$, $H_{kv} = 8$, $d = 128$; at $s = 2$ that is 128 KiB per
token, so an 8192-token context costs 1 GiB on top of the weights — and it grows
linearly with `num_ctx`, which is why raising the context window can push a model
that previously fitted out of GPU memory.

Throughput has a hard ceiling from bandwidth. One token of a dense model reads
every weight once, so

$$
\text{tokens/s} \;\lesssim\; \frac{B}{M_{\text{weights}}},
$$

with $B$ the memory bandwidth of the device holding the weights. A 4.7 GB model
on a 200 GB/s unified-memory machine cannot exceed roughly 40 tokens per second
however fast its cores are. When the weights do not fit, Ollama offloads only
some layers to the GPU (`num_gpu`) and runs the rest on the CPU at a fraction of
the bandwidth; throughput is then set by the slow half.

## Assumptions and requirements

The binding constraint is memory, and it is a threshold rather than a gradient:
weights plus KV cache plus a working allowance must fit, or throughput collapses
by an order of magnitude when layers spill to the CPU. As a rough guide, a 3B
model at 4-bit wants about 8 GB of system memory, an 8B about 16 GB, and a 70B
model around 40 GB it can actually reach — on consumer hardware, unified memory
or multiple GPUs.

Two assumptions are easy to miss. The chat template shipped with the model must
match the one it was instruction-tuned with; a mismatch degrades output quietly,
with no error. And GGUF conversion must exist for the architecture, so a model
with a novel attention or routing scheme is not runnable until the runtime
supports it — a real lag after new releases.

Quantisation assumes the weight distribution is well behaved block by block. It
usually is, but the loss is uneven across tasks: perplexity may barely move while
arithmetic, long-context recall and code generation degrade noticeably.

## Uses and applicability

Reach for Ollama when the workload is one user or a handful, when data must not
leave the machine, when you want a pinned model version with no silent upstream
change, or when prototyping an agent loop without a per-token bill. Its
OpenAI-compatible route makes it a drop-in for code already written against that
API, which is why it is common as the local backend for editor assistants.

Do not reach for it to serve a product. It has no meaningful batching across
concurrent requests, no autoscaling and no multi-tenant scheduling; a server
stack built on paged attention and continuous batching beats it by a large factor
in aggregate throughput. It is also the wrong tool when the task needs frontier
capability — the gap between an 8B local model and the largest hosted ones is
real, and shows up fastest on multi-step reasoning.

## Limitations and common mistakes

The most consequential confusion is **open-weight versus open-source**. Ollama
itself is open source. Most models it serves are not: weights are downloadable
under bespoke licences that may restrict commercial use, redistribution or scale,
the training data is almost never disclosed, and the training code is usually
absent — so the model cannot be rebuilt, audited for provenance or forked in any
meaningful sense. "Open" here means you can run it, not that you can reproduce
it. Check each model's licence before shipping on it.

Second, reading a quantisation label as a quality grade. `Q4_K_M` is not "75% as
good"; it is a lossy compression whose damage is uneven and task-dependent, and
for a fixed memory budget a larger model at 4-bit generally beats a smaller one
at 8-bit.

Third, benchmarking a cold run: the first request loads gigabytes from disk, and
every request pays prompt processing over the whole context before the first
token. Neither is steady-state generation.

Fourth, assuming the daemon is private because it is on localhost. It is
unauthenticated by design, and binding it to `0.0.0.0` — as people do to reach it
from a container — puts an unauthenticated inference endpoint on the network.

Finally, expecting determinism. A fixed seed and zero temperature narrow
variation but do not guarantee identical text across builds, backends or batch
conditions, because floating-point reduction order differs.

## Variants and alternatives

**llama.cpp** is the layer beneath: using it directly buys fine control over
quantisation, cache types and offload, at the cost of doing the packaging
yourself. **LM Studio** and **Jan** offer similar packaging behind a GUI. **MLX**
targets Apple silicon specifically. **vLLM** and **TGI** are the server-side
alternatives — far higher aggregate throughput through continuous batching and
paged attention, but they expect GPU memory to hold the model outright. On the
format side, GGUF competes with **AWQ** and **GPTQ** weights, which target GPU
inference and are what the server stacks consume.

Ollama's runner began as a wrapper over llama.cpp and has since grown its own
engine over the same ggml library for some model families; treat "it is
llama.cpp" as true in lineage and increasingly approximate in detail.

## History and attribution

The lineage starts with Meta's release of the LLaMA weights in early 2023, which
put a capable model of laptop scale into many hands at once. Georgi Gerganov's
llama.cpp, begun days later, showed that such a model could run on a CPU in plain
C/C++ with aggressive quantisation; its ggml tensor library, and the GGUF format
that succeeded the earlier GGML file format, became the substrate for local
inference generally.

Ollama was created later in 2023 by Jeffrey Morgan and Michael Chiang to make
that stack usable without a build step, taking its mental model — pull, run, tag,
Modelfile — from container tooling. The bet was that the hard part was never the
arithmetic; it was packaging.

## Sources

The **Ollama** repository is the authority for the CLI, the Modelfile directives,
the HTTP API surface and the stated hardware guidance. The **llama.cpp**
repository documents the GGUF format, the quantisation types with their measured
size and quality trade-offs, and the backend support that decides what hardware
runs what. The **LLaMA** paper is the reference for the model family that made
local inference worth building for, and for the argument that a smaller model
trained longer is the better choice when inference cost dominates. Model
licensing and the contested definition of open-source AI are flagged in
`unresolved_references`; nothing in the registry covers them.

## Prerequisites and next connections

Read [Deployment](./deployment.md) first if you want the contrast in sharp form:
almost every concern there — replicas, rollout, tail latency under load — is
absent here, and what replaces it is a single machine's memory budget. A
familiarity with [Containers](./containers.md) makes the Modelfile and the
layer-pull model immediately legible, since both were copied deliberately.

Next, [APIs](./apis.md) covers the interface discipline that makes a local
daemon substitutable for a hosted one, and
[Model Context Protocol](./model-context-protocol.md) is the layer above: once a
model answers on localhost, the open question is how it reaches your tools and
your files. For the numerics underneath, [CUDA](./cuda.md) and
[GPU Kernels](./gpu-kernels.md) explain what ggml is actually dispatching to on
the device.
