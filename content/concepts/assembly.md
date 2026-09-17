---
concept_id: concept.languages.assembly
title: Assembly
slug: /concepts/assembly
aliases:
  - assembly language
kind: concept
tier: 1
review_state: generated-draft
summary: The symbolic notation for one processor's instruction set, where a line of text names a single machine instruction and an assembler turns it into the bytes the hardware decodes.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: contributes_to
    target: concept.systems.operating_systems
    note: Every kernel keeps a small irreducible core of assembly — boot entry, context switch, trap and system-call entry — because those sequences run where no compiled language's assumptions hold yet.
  - type: contrasts_with
    target: concept.languages.gpu_kernels
    note: PTX and SASS are the GPU's assembly layers, but a GPU kernel is written against thousands of concurrent threads rather than the single instruction stream that CPU assembly presents.
  - type: contrasts_with
    target: concept.algorithms.complexity_analysis
    note: Asymptotic analysis deliberately discards the constants — instruction count, cache behaviour, branch prediction — that are exactly what reading assembly makes visible.
sources:
  - source_id: source.intel.software_developer_manual
    title: Intel 64 and IA-32 Architectures Software Developer Manuals
    url: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: System V AMD64 ABI (processor supplement)
    reason: The registry has no ABI or calling-convention specification. The Intel manuals define the instructions but not the argument registers, stack alignment rule or red zone described here.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Arm Architecture Reference Manual for A-profile
    reason: The registry holds no Arm architecture reference, so every AArch64 statement on this page — register file, fixed instruction width, weak memory ordering — rests on no cited source.
    sections:
      - concrete-example
      - variants-and-alternatives
      - assumptions-and-requirements
  - label: Histories of the first assemblers (Booth's ARC work, Wheeler's EDSAC initial orders)
    reason: No registry source covers the origin of symbolic assembly notation or of the assembler program itself.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Assembly** is a text notation in which each statement normally denotes exactly
one instruction of a _particular_ instruction set architecture (ISA), written as
a mnemonic and operands — `addl (%rdi,%rcx,4), %eax` rather than the three
bytes (`03 04 8f`) that instruction actually is. An **assembler** translates the text into object
code, resolving labels into addresses and leaving relocations for the linker. A
file also carries _directives_ (`.globl`, `.align`) describing sections, symbols
and data, and usually macros.

There is no such thing as "assembly" in the singular: x86-64 and AArch64
assembly share no register names, no instruction widths and no calling
convention, and even where a mnemonic is spelled the same (`add`, `cmp`, `ret`)
the operand forms and the semantics differ. Every example below names its
architecture.

## Why it matters

Assembly is where the tower of abstractions stops. Every compiler, interpreter
and JIT is ultimately defined by what it emits here, so this is the level at
which you can answer questions with no answer higher up: did the compiler
vectorise that loop, what does this stripped binary do.

Certain code also _cannot_ be written anywhere else. A context switch saves the
exact register set and swaps stacks, so the instruction after the swap returns
onto a different stack than it was called from; no C expression means that. The
same holds for trap entry, boot before a stack exists, and instructions such as
`cpuid` that no source language has syntax for.

## Intuition

Picture a very fast, very literal clerk with sixteen named scratch slots (the
registers), an enormous numbered filing cabinet (memory), a bookmark saying
which instruction is next, and a few status bits recording whether the last
arithmetic came out zero. Every instruction is a variation on: move this there,
combine these two, compare, jump if.

The analogy breaks at timing. A modern processor does not execute one
instruction at a time in program order — it decodes into micro-operations,
renames registers, executes out of order and speculates past branches. Assembly
is a contract about architectural results, the state a programmer can observe,
not about events inside the core; hence two sequences of equal length differing
in speed by an order of magnitude.

## Concrete example

Summing an integer array, in x86-64 assembly for the System V ABI, in GNU
assembler (AT&T) syntax, where the destination is the _last_ operand:

```asm
        .text
        .globl  sum
sum:                                 # int sum(const int *a, long n)
        xorl    %eax, %eax           # total = 0
        testq   %rsi, %rsi
        jle     .Ldone               # n <= 0: nothing to add
        xorl    %ecx, %ecx           # i = 0
.Lloop:
        addl    (%rdi,%rcx,4), %eax  # total += a[i]
        incq    %rcx
        cmpq    %rsi, %rcx
        jl      .Lloop
.Ldone:
        ret
```

The arguments arrived in `%rdi` and `%rsi` and the result leaves in `%eax`
because the ABI says so, not because the ISA does. `(%rdi,%rcx,4)` is one
addressing mode computing `a + 4*i` inside the instruction. `xorl %eax, %eax` is
the idiomatic zero: two bytes, `31 c0`, where `movl $0, %eax` needs five. `ret`
is the single byte `c3`, popping the return address the caller's `call` pushed.

The same load on AArch64 is `ldr w3, [x0, x2, lsl #2]`. Nothing carries over.

## Formal treatment

An ISA specifies a machine state $\sigma = (R, F, M, \mathrm{pc})$ — register
file, condition flags, memory, program counter — and gives each instruction
$\iota$ a _partial_ transition
$\llbracket \iota \rrbracket : \sigma \mapsto \sigma'$, partial because an
instruction may fault instead of completing.

x86-64 has sixteen general-purpose registers, addressable at 64, 32, 16 and 8
bits (`%rax`, `%eax`, `%ax`, `%al`), and computes a memory operand's effective
address as

$$\mathrm{EA} \;=\; \mathrm{Base} \;+\; \mathrm{Index} \times \mathrm{Scale} \;+\; \mathrm{Disp},$$

with $\mathrm{Scale} \in \{1,2,4,8\}$ and $\mathrm{Disp}$ a signed 8- or 32-bit
constant; the base may instead be the instruction pointer, giving
position-independent `%rip`-relative access. Instructions run one to fifteen
bytes. AArch64 has 31 general registers plus a zero register and a separate
stack pointer, and every instruction is exactly four bytes.

The stack rests on one register: `%rsp` points at the most recently pushed
8-byte slot, `push` decrements it and stores, `call` pushes the return address
and jumps, `ret` pops into the program counter. The ABI fixes the rest — integer
arguments in `%rdi, %rsi, %rdx, %rcx, %r8, %r9`, return in `%rax`, `%rbx`,
`%rbp` and `%r12`–`%r15` preserved across a call, `%rsp` 16-byte aligned
immediately before a `call`, and a 128-byte _red zone_ below `%rsp` usable by a
leaf function. Microsoft's x64 convention instead uses `%rcx, %rdx, %r8, %r9`
and 32 bytes of shadow space, with no red zone: same processor, incompatible
object code.

## Assumptions and requirements

Assembly is written against a _target triple_ — ISA, ABI, operating system,
object format — not a machine in the abstract. The Intel manuals define
semantics per operating mode, and an instruction legal in 64-bit long mode may
be invalid in 32-bit protected mode.

It assumes you uphold every invariant the surrounding code relies on. Clobber a
callee-saved register and the caller misbehaves arbitrarily later; misalign
`%rsp` before calling code that uses aligned SSE moves and the program faults;
assume a red zone inside a kernel, where interrupt frames land on the current
stack, and it is silently overwritten.

It assumes a memory-ordering model. x86-64 is strongly ordered — only
store-then-load reordering is permitted, so a `lock`-prefixed read-modify-write
or `mfence` is often the only barrier needed — while AArch64 is weakly ordered
and needs explicit barriers or acquire/release forms. Porting lock-free code
between them without revisiting this produces a bug that shows up once a week
under load.

## Uses and applicability

Reach for assembly when the task is defined by the machine rather than the
algorithm: boot, the context switch (_Operating Systems: Three Easy Pieces_
walks through a real one), interrupt and system-call entry, stack manipulation
like `setjmp`, and constant-time cryptography, where the property you need is
about emitted instructions and an optimiser is free to destroy it. Reach for it
to _read_: disassembly is ground truth for a miscompilation, a crash dump, or a
binary without source.

Do not reach for it for application code, or a loop you merely suspect is slow.
Measure, then read what the compiler already emitted — often the fix is a
missing `restrict` or a bad memory layout. When you need one specific
instruction, intrinsics beat hand-written assembly: you name it and keep
register allocation and inlining.

## Limitations and common mistakes

The belief that hand-written assembly is faster is, in most measured cases,
false today. Compilers allocate registers and schedule across a whole function
and know the target's latencies and port pressure. Humans still win in a narrow
band — small hot kernels where you know something the compiler cannot prove,
constant-time code, sequences with no expression in the source language — and
how wide that band is remains genuinely contested. That it is far narrower than
in 1990 is not.

"Portable assembly" is not a thing: supporting two architectures means writing
and testing the routine twice. Instruction count is not a proxy for time either
— a ten-instruction loop that misses cache loses to a forty-instruction one that
does not.

Syntax confusion is endemic: AT&T writes `mov %rax, %rbx` for what Intel writes
`mov rbx, rax`, so reading a manual in one notation and code in the other
inverts every data movement in your head. And disassembly is not unambiguous —
x86 instructions are variable length, so starting from the wrong offset yields a
plausible but entirely different instruction stream, and separating code from
inline data in a stripped binary is undecidable in general.

## Variants and alternatives

**Syntax and assembler variants** — AT&T versus Intel; GNU `as`, NASM, MASM,
LLVM's integrated assembler — differ in spelling, not in the machine. **Inline
assembly** embeds instructions in C or C++ through the `asm` declaration, the
extended GCC form declaring operand constraints and clobbers so the compiler
still allocates registers around you: more convenient than a standalone file,
and much easier to get subtly wrong. **Intrinsics** go further, exposing
instructions as ordinary functions.

**Virtual instruction sets** look like assembly but are not. LLVM IR, JVM
bytecode, WebAssembly and NVIDIA's PTX are notations for abstract machines,
compiled or JIT-ed further before execution — the CUDA toolchain emits PTX and
then a particular GPU's SASS. They buy portability by not being a real
processor's ISA, and cost the control that is assembly's point. The broadest
alternative is to stay in a systems language and read `gcc -S` output, which is
how most practitioners now get what they once got from writing it.

## History and attribution

The idea has more than one origin, and the record is thinner than the
attributions suggest. Kathleen Booth is generally credited with devising a
symbolic notation for machine instructions in the late 1940s, working on the ARC
machine at Birkbeck College in London. David Wheeler's "initial orders" for the
EDSAC, in 1949, is usually described as the first assembler: a bootstrap routine
that read symbolic orders and relocated subroutines as it loaded them. The word
_assembly_ comes from that job rather than from any property of the notation.
FORTRAN, in 1957, began a displacement that has never quite finished.

## Sources

The **Intel 64 and IA-32 Architectures Software Developer Manuals** are the
authority for everything x86-64 here: registers, effective addresses, encodings,
stack instructions, operating modes, memory ordering. **Operating Systems: Three
Easy Pieces** covers where a kernel genuinely needs assembly, including a real
context-switch routine. **cppreference** documents the `asm` declaration, and the
**CUDA C++ Programming Guide** describes PTX and the path to device code.
Nothing cited covers the calling conventions, the Arm architecture or the
history; those gaps are in the unresolved references.

## Prerequisites and next connections

There is no formal prerequisite, but this page lands better on a reader who has
written C and can picture pointers, arrays and a stack frame. Read
[Core Data Structures](./core-data-structures.md) first if the stack is not yet
an object you can picture: here it is not a library type but a register and a
convention.

[Complexity Analysis](./complexity-analysis.md) is the useful contrast — the
cost model that throws away everything assembly makes visible — while
[Automata](./automata.md) and
[Computability Theory](./computability-theory.md) ask what a machine is with the
hardware gone. The natural continuations are the pages on operating systems and
on CUDA and GPU kernels.
