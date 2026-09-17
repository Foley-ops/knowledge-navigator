---
concept_id: concept.computation.computational_complexity
title: Computational Complexity
slug: /concepts/computational-complexity
aliases:
  - computational complexity theory
kind: concept
tier: 1
review_state: generated-draft
summary: The study of how much time, space and other resources a computational problem inherently demands, and the classification of problems into classes such as P, NP and PSPACE by reduction between them.
categories:
  - Mathematics/Theory of Computation
primary_category: Mathematics/Theory of Computation
relationships:
  - type: requires
    target: concept.computation.automata
    note: Time and space are measured as resource bounds on a fixed machine model, so the Turing machine and its relatives have to be in hand before a complexity class means anything.
  - type: requires
    target: concept.foundations.computability_theory
    note: Complexity refines the decidable problems, and its basic separation technique is the diagonalisation already used to prove the halting problem undecidable.
  - type: contributes_to
    target: concept.optimization.combinatorial_optimization
    note: NP-hardness proofs are why that field is organised around approximation, cutting planes and heuristics rather than around a single exact polynomial algorithm.
  - type: contrasts_with
    target: concept.optimization.convex_optimization
    note: Convexity, not linearity or smoothness, is the practical dividing line for tractable continuous problems, and it cuts the space of problems differently from the P/NP boundary.
sources:
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.theory_of_computation
    title: MIT 18.404J Theory of Computation (Fall 2020)
    url: https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.introduction_to_algorithms
    title: MIT 6.006 Introduction to Algorithms (Spring 2020)
    url: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.agrawal2004.primes_is_in_p
    title: PRIMES is in P
    url: https://annals.math.princeton.edu/2004/160-2/p12
    source_kind: primary-research
    supports:
      - concrete-example
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Parameterised complexity and the W-hierarchy
    reason: No source in the registry covers fixed-parameter tractability, kernelisation or W[1]-hardness; the standard references (Downey and Fellows, Cygan et al.) are not registered, so the mention here is deliberately brief and uncited.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
  - label: EXPTIME-completeness of generalised board games
    reason: No source in the registry covers the EXPTIME-completeness of chess and checkers on an n by n board (Fraenkel and Lichtenstein, Robson), which is the cheapest witness that natural problems lie outside P; the fact is stated without attribution here because no registered source carries it.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Computational complexity** classifies problems, not algorithms, by the
resources any algorithm must spend to solve them. Fix a machine model and a
resource — running time, working space, randomness, nondeterminism — and ask how
that resource must grow with the length $n$ of the input, in the worst case over
all inputs of that length. A _complexity class_ is the set of problems solvable
within a stated bound: $\mathbf{P}$ is what a deterministic machine decides in
polynomial time, $\mathbf{NP}$ what a nondeterministic one decides in polynomial
time, $\mathbf{PSPACE}$ what any machine decides in polynomial space however long
it takes.

The field's real content is not the individual classes but the _reductions_
between problems, which make one algorithm or one hardness result apply to
thousands of problems at once.

## Why it matters

Before you spend a month on an exact algorithm, you want to know whether a month
is enough. Complexity gives a usable answer: show that your scheduling problem
encodes 3-SAT, and a polynomial algorithm for it would solve every problem in
$\mathbf{NP}$ — something nobody has managed in fifty years. That is not a proof
of impossibility, but it is reason enough to switch to approximation, to a
solver, or to the structure your instances happen to have.

It also runs in the other direction: public-key cryptography is the deliberate
use of a problem believed to be hard, and RSA is secure only if factoring stays
infeasible.

## Intuition

The picture to carry is _finding versus checking_. A completed Sudoku grid is
checked in seconds; filling in a blank one is another matter. $\mathbf{NP}$ is
exactly the class of problems whose "yes" answers come with a short certificate
that is easy to check — a satisfying assignment, a Hamiltonian cycle, a factor.
The P versus NP question asks whether finding is always as easy as checking.

Two places the analogy misleads. Easy-to-check does not mean hard to find:
$\mathbf{P} \subseteq \mathbf{NP}$, so sorting is in $\mathbf{NP}$ too. And the
asymmetry is real — $\mathbf{NP}$ certifies "yes" answers only. Certifying that a
formula is *un*satisfiable is the business of $\mathbf{coNP}$, and whether the
two classes coincide is open.

## Concrete example

Take the formula

$$
\varphi \;=\; (x_1 \vee \neg x_2 \vee x_3) \wedge (\neg x_1 \vee x_2 \vee x_3).
$$

Build a graph $G$ with one vertex per literal occurrence — six vertices — joining
the three literals inside each clause into a triangle, and joining any two
vertices carrying complementary literals ($x_1$ with $\neg x_1$, $x_2$ with
$\neg x_2$). A triangle admits at most one chosen vertex, so an independent set
of size $k = 2$ must pick exactly one literal per clause, and the
complementary-literal edges forbid picking $x_i$ and $\neg x_i$ together. So $G$
has an independent set of size $2$ if and only if $\varphi$ is satisfiable. The
assignment $x_1 = x_2 = \text{true}$, $x_3 = \text{false}$ corresponds to the
independent set $\{x_1 \text{ in clause } 1,\; x_2 \text{ in clause } 2\}$.

The construction takes $3k$ vertices and fewer than $9k^2$ edges — the
complementary-literal edges alone can number $\Theta(k^2)$ — and is written down
in time quadratic in the size of $\varphi$, so it is a polynomial-time
reduction: Independent Set is at least as hard as 3-SAT.

Surprises run the other way too. Primality had no known polynomial algorithm for
decades and sat in $\mathbf{NP} \cap \mathbf{coNP}$ with unclear status, until
Agrawal, Kayal and Saxena gave a deterministic polynomial-time test.

## Formal treatment

Fix a multi-tape deterministic Turing machine. For a function
$f : \mathbb{N} \to \mathbb{N}$, $\mathrm{DTIME}(f(n))$ is the set of languages
decided within $O(f(n))$ steps, $\mathrm{DSPACE}(f(n))$ within $O(f(n))$ work
tape cells, and $\mathrm{NTIME}$, $\mathrm{NSPACE}$ are the nondeterministic
analogues. Then

$$
\mathbf{P} = \bigcup_{k \ge 1} \mathrm{DTIME}(n^k), \qquad
\mathbf{NP} = \bigcup_{k \ge 1} \mathrm{NTIME}(n^k), \qquad
\mathbf{PSPACE} = \bigcup_{k \ge 1} \mathrm{DSPACE}(n^k).
$$

Equivalently and more usefully, $L \in \mathbf{NP}$ iff there are a polynomial
$p$ and a polynomial-time machine $V$ with

$$
x \in L \iff \exists\, u \in \{0,1\}^{p(|x|)} \text{ such that } V(x,u) = 1 .
$$

$\mathbf{coNP} = \{L : \overline{L} \in \mathbf{NP}\}$. A _Karp reduction_
$A \le_p B$ is a polynomial-time computable $f$ with $x \in A \iff f(x) \in B$;
$B$ is $\mathbf{NP}$-hard if $A \le_p B$ for every $A \in \mathbf{NP}$, and
$\mathbf{NP}$-complete if additionally $B \in \mathbf{NP}$. The **Cook–Levin
theorem** says SAT is $\mathbf{NP}$-complete: the accepting computation of a
nondeterministic polynomial-time machine is encoded as a tableau, and local
consistency of that tableau is expressed as a CNF formula of polynomial size.

The **polynomial hierarchy** iterates the quantifier: $\Sigma_0^p = \Pi_0^p =
\mathbf{P}$, $\Sigma_{k+1}^p = \mathbf{NP}^{\Sigma_k^p}$, $\Pi_k^p =
\mathrm{co}\Sigma_k^p$, and $\mathbf{PH} = \bigcup_k \Sigma_k^p$. If
$\Sigma_k^p = \Sigma_{k+1}^p$ for any $k$, the hierarchy collapses to level $k$;
in particular $\mathbf{P} = \mathbf{NP}$ collapses it to $\mathbf{P}$.

Savitch's theorem gives $\mathrm{NSPACE}(s(n)) \subseteq \mathrm{DSPACE}(s(n)^2)$
for space-constructible $s(n) \ge \log n$, hence
$\mathbf{NPSPACE} = \mathbf{PSPACE}$. The known chain is

$$
\mathbf{L} \subseteq \mathbf{NL} \subseteq \mathbf{P} \subseteq \mathbf{NP}
\subseteq \mathbf{PH} \subseteq \mathbf{PSPACE} \subseteq \mathbf{EXP},
$$

and the hierarchy theorems give $\mathbf{P} \subsetneq \mathbf{EXP}$ and
$\mathbf{NL} \subsetneq \mathbf{PSPACE}$, so at least one inclusion in that chain
is strict — but no single one is known to be. **P versus NP** is precisely the
question of whether $\mathbf{P} = \mathbf{NP}$, equivalently whether
$\mathrm{SAT} \in \mathbf{P}$.

## Assumptions and requirements

The classes are only as meaningful as the model. What makes $\mathbf{P}$ worth
naming is that all reasonable sequential models — multi-tape machines,
random-access machines, your favourite language — simulate each other with
polynomial overhead. Drop that and $\mathbf{P}$ stops being model-free; quantum
computation is the standing challenge to the stronger version of this thesis.

The input encoding matters. A number in binary has length $\log_2 N$, so the
classical $O(nW)$ dynamic program for Knapsack is _pseudo_-polynomial, not
polynomial; in unary the same problem is in $\mathbf{P}$. Hardness that survives
a unary encoding is called strong $\mathbf{NP}$-hardness.

The measure is worst case and asymptotic. A class says nothing about a fixed
instance, and nothing about constants: $n^{100}$ is polynomial and useless.
Identifying polynomial time with feasibility is a working convention that has
held up because natural polynomial algorithms tend to have small exponents — it
is not a theorem.

Finally, these classes are defined for decision problems; optimisation and search
versions are reached through self-reducibility, which for SAT turns finding a
solution into polynomially many yes/no queries.

## Uses and applicability

Reach for complexity when a problem is combinatorial, the instances keep coming,
and you are choosing between an exact method and a heuristic: an
$\mathbf{NP}$-hardness proof is cheap insurance against a long search for an
algorithm that probably does not exist. It also guides which special case to
restrict to, since a hardness proof usually names the structural feature causing
the blow-up.

Do not reach for it when instances are small or fixed, when the difficulty is
numerical conditioning rather than combinatorial search, or when an exponential
algorithm with good pruning is already fast enough. Parameterised complexity is
the sharper tool when instances are large but one parameter — treewidth, solution
size — stays small.

## Limitations and common mistakes

$\mathbf{NP}$ is **not** the class of problems with no polynomial algorithm. It
contains all of $\mathbf{P}$. The intended notion — problems demonstrably
requiring more than polynomial time — is $\mathbf{EXP} \setminus \mathbf{P}$,
which is nonempty by the time hierarchy theorem and does contain natural
problems: generalised chess and generalised checkers on an $n \times n$ board are
$\mathbf{EXP}$-complete, hence provably outside $\mathbf{P}$. What is missing is
a proof of that kind for the $\mathbf{NP}$ problems anyone actually cares about —
SAT, travelling salesman, factoring are all still, for all we can prove,
candidates for $\mathbf{P}$.

$\mathbf{NP}$-completeness does not mean your instances are hard. It is a
worst-case statement about an infinite family. Modern SAT solvers dispatch
industrial instances with millions of clauses, and exact travelling-salesman
solvers handle tens of thousands of cities, because real instances carry
structure the worst case does not.

"Not known to be in $\mathbf{P}$" is a statement about our knowledge: linear
programming and primality both crossed over after long stretches on the other
side. Nor is $\mathbf{NP}$-hardness the right notion of cryptographic hardness,
which needs problems hard _on average_ over an efficiently sampleable
distribution — worst-case hardness permits an algorithm that fails on a vanishing
fraction of inputs.

Two smaller slips: $\mathbf{NP}$-hard does not imply $\mathbf{NP}$-complete (the
halting problem is $\mathbf{NP}$-hard and not in $\mathbf{NP}$), and
$\mathbf{P} \ne \mathbf{NP}$ would not sort $\mathbf{NP}$ into the easy and the
complete — Ladner's theorem gives intermediate problems in that case.

## Variants and alternatives

Randomness gives $\mathbf{BPP}$ and $\mathbf{RP}$; the current expectation, from
circuit lower bound assumptions, is $\mathbf{P} = \mathbf{BPP}$ — the opposite of
the intuition that randomness adds power. Counting gives $\#\mathbf{P}$, where
the permanent is complete although the matching decision problem is in
$\mathbf{P}$. Interaction gives $\mathbf{IP}$, and $\mathbf{IP} = \mathbf{PSPACE}$
was among the first results showing relativisation is not the last word.

Non-uniform circuit complexity ($\mathbf{P/poly}$, $\mathbf{AC}^0$,
$\mathbf{TC}^0$) proves unconditional lower bounds for restricted circuit
classes, and the three known barriers — relativisation, natural proofs,
algebrization — explain why those techniques have not reached $\mathbf{P}$ versus
$\mathbf{NP}$. Fine-grained complexity works inside $\mathbf{P}$, deriving
conditional $n^{2-\epsilon}$ lower bounds from hypotheses such as SETH; quantum
complexity adds $\mathbf{BQP}$, which contains factoring and is not known to
contain $\mathbf{NP}$.

The honest responses to a hardness proof are approximation algorithms, where the
PCP theorem also tells you the limits — some problems admit a constant-factor
approximation, some a polynomial-time approximation scheme, and Håstad's results
show that beating $7/8$ on MAX-3SAT is itself $\mathbf{NP}$-hard — and
parameterised complexity, which asks for running time $f(k) \cdot n^{O(1)}$ in a
secondary parameter $k$ and gives its own hardness theory in the W-hierarchy.

## History and attribution

Hartmanis and Stearns named the subject in 1965, defining time-bounded classes on
Turing machines and proving the first hierarchy theorem. In the same year Cobham
and, independently, Edmonds — the latter while working on matching algorithms —
proposed polynomial time as the formal stand-in for "efficient". Gödel had put
essentially the P versus NP question to von Neumann in a 1956 letter that went
unnoticed until the 1980s.

Cook proved the completeness of SAT in 1971; Levin obtained an equivalent result
independently in the Soviet Union, published in 1973. Karp's 1972 paper turned
that theorem into a method by reducing SAT to twenty-one natural combinatorial
problems, and the list has grown without pause since. Savitch's theorem dates
from 1970, Ladner's from 1975. P versus NP became a Clay Millennium Prize Problem
in 2000 and remains open.

## Sources

Arora and Barak is the standard graduate reference and the backbone of this page:
class definitions, Cook–Levin, the polynomial hierarchy, the barrier results,
hardness of approximation, and the historical notes closing each chapter. MIT
18.404J covers the same material at first-contact pace and is the better route to
Cook–Levin and the reduction technique. MIT 6.006 supplies the algorithm
designer's view of why a hardness proof changes what you build. The AKS paper is
cited for the one fact it settles: PRIMES is in $\mathbf{P}$.

## Prerequisites and next connections

Read [Computability Theory](./computability-theory.md) first: complexity assumes
the Turing machine, decidability, and diagonalisation, and the hierarchy theorems
are the halting-problem argument run with a clock.
[Propositional Logic](./propositional-logic.md) supplies the CNF formulas
Cook–Levin is stated in.

From here, [Probability and Computing](./probability-and-computing.md) develops
the randomised algorithms behind $\mathbf{BPP}$,
[Elementary Number Theory](./elementary-number-theory.md) supplies the factoring
and primality problems at the strange edge of $\mathbf{NP}$, and
[Proof Theory](./proof-theory.md) leads to proof complexity, where lower bounds
on proof length are the $\mathbf{NP}$ versus $\mathbf{coNP}$ question in another
costume.
