---
concept_id: concept.software.containers
title: Containers
slug: /concepts/containers
aliases:
  - OS-level virtualisation
  - containerisation
kind: concept
tier: 1
review_state: generated-draft
summary: Operating-system-level isolation in which an ordinary process runs on the shared host kernel with a restricted view of it, bought at near-native cost and packaged as a layered filesystem image.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: requires
    target: concept.systems.operating_systems
    note: Namespaces and cgroups are kernel mechanisms for partitioning the process table, mount table, network stack and scheduler, so a reader without the process abstraction and the user/kernel boundary cannot follow what a container actually is.
  - type: used_to_solve
    target: concept.ml_engineering.deployment
    note: An image freezes the whole userspace a service needs into one artifact that the same runtime starts identically on a laptop and on a cluster node, which is what makes deployment a matter of moving a digest rather than reinstalling dependencies.
  - type: contributes_to
    target: concept.software.continuous_delivery
    note: The immutable, content-addressed image is the artifact a delivery pipeline builds once and promotes unchanged through staging to production, so the thing tested is bit-for-bit the thing released.
  - type: contributes_to
    target: concept.ml_engineering.training_infrastructure
    note: Cluster schedulers dispatch training jobs as images carrying a pinned CUDA userspace, which is how a fleet of heterogeneous nodes runs one reproducible software stack, subject to the host GPU driver being new enough.
sources:
  - source_id: source.docker.documentation
    title: Docker documentation
    url: https://docs.docker.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.kubernetes.documentation
    title: Kubernetes documentation
    url: https://kubernetes.io/docs/concepts/
    source_kind: reference-documentation
    supports:
      - why-it-matters
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Linux kernel namespace and cgroup reference documentation
    reason: The registry has no kernel documentation, so the mechanism is described at the level Docker's documentation covers rather than per syscall flag or per cgroup controller file.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Pre-Docker container lineage and the OCI specifications
    reason: No registry source covers chroot, FreeBSD jails, Solaris Zones, LXC, or the OCI image, runtime and distribution specifications, so those names and dates are stated without a citation behind them.
    sections:
      - history-and-attribution
      - variants-and-alternatives
claims: []
---

## Definition

A **container** is one or more ordinary processes running on the host's own
kernel, started inside a fresh set of kernel **namespaces** and attached to a
**control group**, with a root filesystem unpacked from an image. Namespaces
partition a global kernel resource so the process sees only its own instance of
it — process-id space, mount table, network interfaces, hostname, IPC objects,
user-id mapping. Control groups (cgroups) cap and account for what it consumes:
CPU time, memory, block I/O, number of processes. There is no guest kernel, no
hypervisor and no emulated hardware — the container's `read` is the host
kernel's `read`.

## Why it matters

Two problems dissolve at once. First, a program's dependencies are not the
program — a service needs a particular libc, CUDA userspace and set of
certificates — and installing those onto a machine is a procedure that drifts;
an image freezes them into one artifact addressed by a hash. Second, a fleet
needs a scheduling unit. Because a container is just a process, a node can run
hundreds and start one in tens of milliseconds, cheaply enough for an
orchestrator to treat workloads as fungible: place them, restart them on
failure, scale them out, move them when a node dies. Kubernetes exists because
that unit exists.

## Intuition

An operating system already sells every process the illusion of a private
machine. Containers extend the trick to what the OS had left global: the process
table, the filesystem root, the network stack, the hostname. A container is not
a smaller computer; it is a process that has been told a smaller story.

The "lightweight virtual machine" analogy is where readers go wrong. A VM is a
separate house with its own foundations — its own kernel, talking to virtual
hardware. A container is a locked room in your house: cheap to add, and visible
from the hallway, since `ps` on the host lists every container process with a
host pid, in the host's scheduler.

## Concrete example

A correct, unremarkable image for a Python service:

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim

RUN useradd --create-home --uid 10001 app
WORKDIR /app

# Dependencies first, so editing source does not reinstall them.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=app:app src/ ./src/

USER app
EXPOSE 8000
CMD ["python", "-m", "src.server"]
```

Build and run it with `docker build -t svc:dev .` and
`docker run --rm -p 8000:8000 --memory=512m --cpus=2 svc:dev`. Editing a file
under `src/` re-runs only the final `COPY`, because the base and `pip install`
layers are cache hits — the entire reason the dependency copy comes first.
`EXPOSE 8000` publishes nothing; `-p 8000:8000` does. And `--memory=512m`
becomes the literal `536870912` in the cgroup's `memory.max`, while `--cpus=2`
becomes a `cpu.max` of `200000 100000` — 200 ms of CPU per 100 ms of wall
clock.

`FROM python:3.12-slim` is the line that costs you reproducibility. The tag is a
mutable pointer, re-published whenever the image is rebuilt upstream, so the
same Dockerfile built a month apart is a different image. Pin it by appending
`@sha256:` and the digest `docker buildx imagetools inspect python:3.12-slim`
prints, and pin versions in `requirements.txt` too.

## Formal treatment

Each namespace type $t$ — mount, pid, net, ipc, uts, user, cgroup, time —
partitions the running processes. Writing $n_t(p)$ for the namespace of type $t$
containing process $p$, the kernel resolves any name of type $t$ relative to
$n_t(p)$, so $p$ and $q$ see the same resource exactly when $n_t(p) = n_t(q)$.
Namespaces are created with `clone` or `unshare` and joined with `setns`; pid
namespaces nest, so a container's init is pid 1 inside and pid 38412 outside.

Control groups form a tree in which each process sits at one node, and
controllers enforce limits over a subtree: `memory.max` is a hard ceiling whose
breach triggers an OOM kill inside the group, `cpu.max` a pair (quota, period)
giving a bandwidth

$$
\text{CPU share} \;=\; \frac{\text{quota}}{\text{period}}
$$

that throttles rather than kills when exceeded.

An image is an ordered list of layers $L_1, \dots, L_n$, each an archive of
filesystem changes with whiteout entries for deletions, plus a JSON config
holding entrypoint, environment and user. A union filesystem — usually overlayfs
— mounts them read-only under one writable layer, resolving a path to the
topmost layer containing it; writing to a lower-layer file copies the whole file
up first. Layers and config are content-addressed by SHA-256 and the image's
identity is its manifest digest, so shared layers are stored and transferred
once. A registry serves these blobs over HTTP, addressed by digest or by a
mutable tag pointing at one.

## Assumptions and requirements

The userspace must match the host kernel. Linux keeps its syscall ABI, so an old
distribution on a new kernel is fine; a Windows userspace on a Linux kernel is
not possible at all. Architecture must match too — an amd64 image on arm64 runs
only under slow emulation. On macOS and Windows there is no Linux kernel to
share, so Docker Desktop runs one in a virtual machine: the containers are real,
the "no VM" property is not.

Isolation assumes the kernel is sound and that you have not given it away.
`--privileged`, the host's Docker socket, the host pid or network namespace, and
uid 0 without a user namespace each weaken or remove the boundary. Devices are
the other leak: a GPU container carries the CUDA userspace but uses the host's
driver through a passed-through device node, so that driver must be at least as
new as the runtime in the image.

## Uses and applicability

Reach for containers when a deployable unit has a messy userspace, when many
workloads must share nodes, when a CI job needs an identical clean environment
per run, or when a result must be re-runnable next year. They are also the
natural unit for orchestration, whose job is keeping declared replicas running.

Do not reach for them when you need a different kernel, a kernel module or a
global kernel tunable; when you are running genuinely untrusted code, where a VM
boundary is the honest choice; or when the problem is just a library version,
which a package manager solves for a fraction of the operational cost.

## Limitations and common mistakes

The first mistake is the "lightweight VM" belief, which matters because it
licenses running hostile tenants side by side. The boundary is the full Linux
syscall interface — hundreds of calls, plus `/proc`, `/sys`, ioctls and device
nodes — and a kernel bug reachable through any of them is an escape. Public
clouds run containers inside VMs for exactly this reason.

The second is expecting reproducible builds for free. An unpinned base tag,
`apt-get install` and `pip install` all resolve at build time to whatever is
current, and even fully pinned, two builds usually produce different digests
because timestamps and file ordering differ: the _same behaviour_ is achievable
with discipline, the _same bytes_ need deterministic build tooling.

Third, layers only accumulate. Deleting a file in a later `RUN` leaves its bytes
in the earlier layer — including a credential you thought you removed;
multi-stage builds and secret mounts, not `rm`, are the fix.

Fourth, cgroup limits are invisible where runtimes look: a process limited to
two CPUs may still read the host's 96 cores, size its thread pool accordingly,
and spend its life throttled. Fifth, the default user in most images is root,
which with a bind-mounted host directory writes root-owned files onto the host.

## Variants and alternatives

At the runtime layer, `runc` is the reference OCI runtime, `containerd` and
CRI-O are the daemons orchestrators drive, and Podman is daemonless and rootless
by default. Stronger isolation with the same packaging comes from gVisor, which
re-implements much of the syscall surface in userspace, and from Kata Containers
and Firecracker microVMs, which put a real kernel back underneath: both buy a
smaller attack surface and pay in startup latency, memory and device
awkwardness. Full virtual machines remain the strongest boundary and the
heaviest; WebAssembly runtimes go the other way, a far narrower interface at a
smaller footprint with a correspondingly smaller ecosystem. Nix and Guix attack
the dependency half rather than the isolation half, building reproducibly by
construction — and can emit images. Orchestration has alternatives too, from
Nomad to plain systemd units.

## History and attribution

The lineage has several independent roots. `chroot`, in Version 7 Unix (1979),
changed a process's filesystem root and nothing else; FreeBSD jails (2000) and
Solaris Zones (Solaris 10, 2005) were the first to virtualise a Unix properly at
the OS level. Linux assembled the pieces separately: mount namespaces in 2.4.19
(2002), then UTS, IPC, pid and network; cgroups, contributed by engineers at
Google as "process containers" and merged in 2.6.24 (2008); user namespaces
largely finished in 3.8 (2013). LXC packaged the result from 2008.

Docker, released in 2013, added almost none of the kernel mechanism and all of
the ergonomics — the build file, the layered image format, the registry, the
one-line run — and that packaging, not the isolation, made containers universal.
The formats went to the Open Container Initiative in 2015, and Kubernetes was
released by Google in 2014, drawing on roughly a decade of running
containerised workloads internally on Borg, which dates from around 2003.

## Sources

The **Docker documentation** is the working reference for the image format, the
build file, the cache, registries and the runtime flags, and is candid about
requirements — including that Docker Desktop supplies a Linux VM elsewhere. The
**Kubernetes documentation** covers orchestration: pods, runtimes through the
CRI, resource limits, and the Borg lineage. **Operating Systems: Three Easy
Pieces** supplies what sits underneath — the process abstraction and the
user/kernel boundary containers partition, and the trap-and-emulate machinery of
virtual machines they avoid.

## Prerequisites and next connections

Read [Operating Systems](./operating-systems.md) first. Namespaces, cgroups and
the union filesystem partition things that page introduces — the process table,
the scheduler, the mount table — and none of the mechanism here is legible
without them.

From here the thread runs to build and release pipelines, where the image is the
artifact that moves, and to deployment and cluster training infrastructure,
where it is the scheduling unit. The GPU caveat connects to [CUDA](./cuda.md)
and [GPU Kernels](./gpu-kernels.md): an image can pin the toolkit, never the
driver.
