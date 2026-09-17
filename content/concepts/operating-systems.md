---
concept_id: concept.systems.operating_systems
title: Operating Systems
slug: /concepts/operating-systems
kind: concept
tier: 1
review_state: generated-draft
summary: The privileged software layer that multiplexes CPUs, memory and devices among mutually distrusting programs, giving each the illusion of a private machine through a narrow, hardware-enforced call boundary.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: requires
    target: concept.algorithms.core_data_structures
    note: A multi-level page table, an inode index and a scheduler run queue are trees, arrays and queues under other names, and the mechanisms cannot be read without them.
  - type: assumes
    target: concept.languages.assembly
    note: The user/kernel boundary is an instruction-set feature — privilege levels, trap and return-from-trap instructions, and a control register naming the current page table — so the whole design rests on what the machine architecture provides.
  - type: contributes_to
    target: concept.languages.cuda
    note: Every CUDA allocation, kernel launch and host transfer is a system call into a driver, and unified memory is implemented on top of the host page-fault path.
  - type: contrasts_with
    target: concept.algorithms.complexity_analysis
    note: Scheduling and page-replacement policies are judged by measured latency, throughput and fairness on real workloads rather than by asymptotic cost, and the constant factors asymptotics discard are exactly what a cache miss is made of.
sources:
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.intel.software_developer_manual
    title: Intel 64 and IA-32 Architectures Software Developer Manuals
    url: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
    source_kind: reference-documentation
    supports:
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.go.documentation
    title: The Go Programming Language documentation
    url: https://go.dev/doc/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Quantitative context-switch and TLB-miss cost measurements
    reason: No source in the registry reports microbenchmark numbers, so the costs here are stated as orders of magnitude rather than measured figures.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Microkernel, exokernel and unikernel designs (Mach, L4, seL4)
    reason: The registry covers the monolithic UNIX-style design only; the alternatives are named without a citable reference.
    sections:
      - variants-and-alternatives
  - label: Transient-execution attacks on the user/kernel boundary (Meltdown, Spectre)
    reason: No registry source documents speculative side channels, so the claim is kept general.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
claims: []
---

## Definition

An **operating system** is the privileged software layer that multiplexes a
machine's processors, memory and devices among programs that do not trust each
other, presenting each program with a private virtual machine: an address space
of its own, one or more threads of control, and named persistent storage. It is
conventionally organised around three jobs — **virtualisation** of the CPU and
memory, **concurrency**, and **persistence** — and it exposes all of them
through a single narrow interface, the **system call**, which is not a function
call but a trap that changes the processor's privilege level.

## Why it matters

Without this layer, every program is a co-tenant of every other: one stray
pointer corrupts the whole machine, one infinite loop hangs it, and every
program needs its own driver for every disk. With it, a wild write earns a
segmentation fault that kills one process; a runaway loop is preempted by a
timer interrupt; and a program that says `open("/etc/hosts")` does not know
whether the bytes come from an SSD, a network share or a RAM disk.

The second reason is performance you cannot see in your own source. The OS
decides which of your threads runs and on which core, which of your pages are
resident, and when your writes actually reach the medium. A program whose
working set exceeds what the TLB can map, or whose threads outnumber the cores
they fight over, is slow for reasons that live entirely below its own code.

## Intuition

The kernel is not a supervisor process watching yours run. Almost all of the
time, **your** code is on the CPU at full hardware speed, and the kernel is
inert. It regains control only when something traps: a deliberate system call, a
page fault, or a timer interrupt. This is _limited direct execution_ — run
directly, but with a leash the hardware holds.

The useful picture for memory is that every load and store your program issues
is rewritten in flight. The address in your register is a fiction; a hardware
unit rewrites it against a per-process table before it reaches the cache. The
landlord-with-a-master-key analogy captures the privilege but misses this: no
landlord edits the address on your envelopes as you post them. That rewriting is
what buys isolation — two processes can both use address `0x400000` and never
touch the same byte of DRAM — and the illusion of a large contiguous space is a
side effect of the same mechanism, not its main point.

## Concrete example

Take x86-64 four-level paging with 4 KiB pages, and the virtual address
`0x00007F3C5A1B2C48`. The hardware splits it into four 9-bit table indices and a
12-bit offset:

| field      | bits  | value   |
| ---------- | ----- | ------- |
| PML4 index | 47:39 | 254     |
| PDPT index | 38:30 | 241     |
| PD index   | 29:21 | 208     |
| PT index   | 20:12 | 434     |
| offset     | 11:0  | `0xC48` |

The `CR3` register holds the physical address of the top-level table. The MMU
reads entry 254 of it to find the next table, entry 241 of that, entry 208 of
that, and finally entry 434 of the leaf page table, which holds a page frame
number and permission bits. If that frame number is `0x21A`, the physical
address is `0x21A << 12 | 0xC48 = 0x0021AC48`.

```python
PAGE_SHIFT, PAGE_SIZE = 12, 1 << 12

def split(va):
    return [(va >> s) & 0x1FF for s in (39, 30, 21, 12)] + [va & (PAGE_SIZE - 1)]

def translate(va, tables, root):
    *idx, off = split(va)
    node = root
    for i in idx:
        if i not in tables[node]:
            raise MemoryError("page fault")
        node = tables[node][i]
    return (node << PAGE_SHIFT) | off

tables = {"pml4": {254: "pdpt"}, "pdpt": {241: "pd"},
          "pd": {208: "pt"}, "pt": {434: 0x21A}}
assert translate(0x00007F3C5A1B2C48, tables, "pml4") == 0x0021AC48
```

Note the cost: that is four dependent memory reads before the one the program
asked for. The translation lookaside buffer exists to make this rare — on a TLB
hit, none of the four happen.

## Formal treatment

Let $P = 2^{p}$ be the page size. A virtual address $a$ decomposes as
$a = \mathrm{VPN} \cdot P + o$ with $\mathrm{VPN} = \lfloor a/P \rfloor$ and
$o = a \bmod P$. A page table is a partial map
$T : \mathrm{VPN} \rightharpoonup (\mathrm{PFN}, \text{bits})$, and translation
is

$$
\mathrm{translate}(a) \;=\; \mathrm{PFN}\big(\lfloor a/P \rfloor\big)\cdot P \;+\; (a \bmod P),
$$

defined only where $T$ is defined and the access is permitted by the bits;
elsewhere the hardware raises a page fault and the kernel decides what it means.
Because $o$ passes through untouched, translation is page-granular: an entire
page is mapped or not, readable or not, together.

A flat table is infeasible, which is why $T$ is stored as a radix tree. For a
48-bit space with $p = 12$, the VPN is 36 bits, so a flat array would need
$2^{36}$ entries of 8 bytes — $2^{39}$ bytes, 512 GiB, **per process**. Four
levels of radix $2^{9}$ store only the subtrees that exist, at the price of
$k = 4$ dependent reads per miss. With TLB hit rate $h$ and memory access time
$t_m$, the effective time per access is about

$$
t \;\approx\; t_m + (1 - h)\, k \, t_m ,
$$

so at $h = 0.99$ and $k = 4$ the walk adds about 4% — and at $h = 0.9$ it adds
40%.

A **context switch** saves the architectural registers of the outgoing thread
and restores the incoming one's; if the two are in different processes it also
reloads `CR3`. The register save is the cheap part, on the order of hundreds of
cycles. The expensive part is invisible in the switch code: the incoming thread
finds L1 and L2 holding the _other_ thread's data, a TLB that no longer
describes its address space, and a cold branch predictor. Address-space
identifiers (PCIDs on x86-64) let entries from several address spaces coexist in
the TLB so a `CR3` reload need not flush it, but nothing tags the data caches.

## Assumptions and requirements

The design assumes specific hardware. It needs at least two privilege levels and
a trap table installed at boot while privileged, so that user code cannot
redirect traps. It needs an MMU with a register naming the current translation
root and hardware that checks permission bits on every access. It needs a timer
interrupt: without one, scheduling is cooperative and a process that never
yields owns the machine — which is exactly how early systems behaved. And it
needs interrupts for devices, or every I/O is a busy wait.

Drop the MMU and you lose isolation but not the rest; small embedded systems run
real schedulers and file systems in a single physical address space. Drop
privilege levels and the system call boundary becomes a convention rather than a
wall.

The deeper assumption is that the kernel is trusted and correct, and that the
hardware's architectural checks are the whole story. The second half of that has
been shown to be too strong: speculative execution can leak the contents of
kernel memory through timing channels even when the architectural permission
check correctly fails.

## Uses and applicability

Reach for this material when behaviour you cannot explain from your source has a
systems cause: latency spikes that track garbage collection or page faults,
throughput that collapses when thread count passes core count, memory that
`malloc` reports as allocated but `top` does not, writes that survive a process
crash but not a power cut. It is also what you need to decide whether to bypass
the kernel — huge pages, `io_uring`, pinned memory, user-space networking — all
of which trade generality for the removal of a specific OS cost.

It is not the right lens for a pure numerical kernel inside one process on one
core, where the memory hierarchy and the ISA explain everything and the OS is
merely absent.

## Limitations and common mistakes

The most common misconception is that virtual memory exists to run programs
larger than RAM. That was the original motivation, but on a modern server
swapping is often disabled outright and the mechanism earns its keep through
isolation, relocation and sharing — copy-on-write `fork`, shared libraries
mapped once into many processes, `mmap` of a file.

The second is that a context switch costs what the switch code costs. It costs
that plus the cache and TLB working set the new thread destroys, which can
dominate by an order of magnitude for a thread with a large footprint, and which
is why oversubscribing threads to cores makes things slower rather than fairer.

Others worth naming: assuming `malloc` returning non-null means the memory
exists (demand paging means the page arrives on first touch, and under
overcommit the failure surfaces later and elsewhere); confusing the page, the
cache line and the disk block, which have different sizes and different owners;
assuming a write to a mapped file is durable without an `fsync`; and treating a
system call as a cheap function call when it is a mode transition with real
overhead.

## Variants and alternatives

Kernels differ in structure. The **monolithic** kernel runs drivers and file
systems in kernel mode; a **microkernel** pushes them into user processes and
keeps only IPC, scheduling and address spaces privileged, buying fault isolation
and verifiability at the cost of IPC on hot paths. **Hypervisors**
virtualise the hardware interface rather than the system call interface, so the
guest is a whole OS; **unikernels** discard the boundary entirely, linking one
application with library OS components into a single address space. **Real-time**
systems replace throughput-oriented scheduling with bounded worst-case latency.

Within the mechanisms there are further choices: segmentation versus paging,
inverted and hashed page tables, huge pages that trade internal fragmentation
for TLB reach; multi-level feedback queues versus proportional-share schedulers;
journaling, log-structured and copy-on-write file systems. Threads themselves
have an alternative: language runtimes such as Go multiplex many lightweight
goroutines onto a smaller pool of kernel threads, making a switch a user-space
register swap with no mode transition, at the cost of a runtime that must
cooperate with blocking system calls.

## History and attribution

Paging and the one-level store came from the Atlas machine at Manchester in the
early 1960s, built to make a small core memory and a drum look like one large
address space. **Multics**, from MIT, Bell Labs and GE in the mid-1960s,
contributed segmented virtual memory, a hierarchical file system and protection
rings, and its perceived complexity provoked the reaction that mattered most:
**UNIX**, written by Ken Thompson and Dennis Ritchie at Bell Labs around
1969–1970, which kept the hierarchical file system and the idea that devices are
files while shedding most of the rest. Dijkstra's THE system (1968) introduced
the layered structure, and was the first system built on the semaphore, which
Dijkstra had introduced years earlier in _Cooperating Sequential Processes_
(1965). Much of what a working engineer touches today — processes, the file
descriptor, `fork` and `exec`, the shell — is UNIX's shape rather than a
necessity of the problem.

## Sources

_Operating Systems: Three Easy Pieces_ is the main reference here: it is
organised exactly around virtualisation, concurrency and persistence, works the
page-table and scheduling mechanisms in detail, and is honest about which
policies are principled and which are heuristics that happen to work. The Intel
Software Developer Manuals are the authority for the concrete translation
example — the four-level paging format, the page-table entry bits, `CR3`, and
the TLB and its invalidation. The Go documentation is cited narrowly, for the
user-space threading model contrasted in the variants section.

## Prerequisites and next connections

Read [Core Data Structures](./core-data-structures.md) first: page tables are
radix trees, run queues are priority queues, and inode indices are trees with a
fan-out chosen for a block size. Some comfort with machine-level execution helps
too, since privilege levels and traps are instruction-set features.

Afterwards, [Complexity Analysis](./complexity-analysis.md) is worth revisiting
with this page in hand, because OS policies are the clearest case where the
asymptotically irrelevant constants — a cache miss, a TLB miss, a mode switch —
are the entire performance story. The concurrency half of the subject opens onto
locks, deadlock and memory models; the persistence half onto crash consistency
and, beyond a single machine, distributed storage.
