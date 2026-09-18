---
concept_id: concept.planning.hierarchical_planning
title: Hierarchical Planning
slug: /concepts/hierarchical-planning
aliases:
  - HTN planning
  - hierarchical task networks
kind: concept
tier: 1
review_state: generated-draft
summary: A family of planning methods in which abstract tasks are recursively decomposed into subtasks by an authored method library, so a plan is correct because it decomposes legally rather than because it reaches a goal state.
categories:
  - Artificial Intelligence/Symbolic AI/Planning
primary_category: Artificial Intelligence/Symbolic AI/Planning
relationships:
  - type: requires
    target: concept.planning.strips
    note: The primitive actions of a hierarchical domain are classical operators with preconditions and effects, and the expressivity comparison that defines the field is stated relative to STRIPS.
  - type: contrasts_with
    target: concept.search.a_star
    note: A* searches a state space for a path that satisfies a goal test and prunes with an admissible heuristic; HTN search explores decompositions of tasks and prunes with method preconditions, so nothing corresponds to the heuristic bound.
  - type: assumes
    target: concept.symbolic_ai.knowledge_representation
    note: The method library is hand-authored domain knowledge, so the planner's completeness and correctness are relative to how well that knowledge was represented.
  - type: contributes_to
    target: concept.planning.pddl
    note: Classical PDDL has no syntax for compound tasks or methods, and the hierarchical tradition is what motivated HDDL, the hierarchical extension of the PDDL family.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.planning_wiki.pddl
    title: The Planning Wiki — PDDL reference
    url: https://planning.wiki/
    source_kind: reference-documentation
    supports:
      - concrete-example
    checked_on: 2026-09-18
  - source_id: source.plato.computability
    title: 'Stanford Encyclopedia of Philosophy: Computability and Complexity'
    url: https://plato.stanford.edu/entries/computability/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: Erol, Hendler and Nau — expressivity and complexity results for HTN planning
    reason: The registry has no source covering the proofs that general HTN plan existence is undecidable, that the totally ordered case is EXPSPACE-complete, or that HTN planning is strictly more expressive than STRIPS; the results are stated here from general knowledge, with a general computability reference cited only for what undecidability means.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Bacchus and Yang — the downward refinement property
    reason: The registry has no source for the formal statement of the downward refinement property or for the analysis of when hierarchy speeds up search and when it does not.
    sections:
      - assumptions-and-requirements
      - history-and-attribution
  - label: The SHOP and SHOP2 planners, and HDDL
    reason: No registry source covers ordered task decomposition planners or the hierarchical extension of PDDL, so the descriptions of these systems and the competition track that uses them are uncited.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Hierarchical planning** searches a space of _decompositions_ rather than a space of
world states. The problem is posed as abstract tasks; a library of **methods** says how
each may be replaced by a network of subtasks; and methods are applied recursively until
only primitive actions remain. In the dominant formalisation, the **hierarchical task
network** (HTN), a problem is a triple $(w_0, s_0, D)$ — an initial task network, an
initial state, and a domain of operators and methods — and a solution is an executable
sequence of primitive actions _derivable from $w_0$ by method application_. No goal
formula appears in that statement, and the omission is the whole content of the idea.

## Why it matters

Classical planners are told what must become true and must rediscover, every time, how
people already know to do it. A hierarchical domain lets an engineer write that down:
"to deliver a package, book transport, then load, then move, then unload." Three things
follow. Search shrinks, because a method's preconditions rule out whole subtrees before
any primitive action is considered. Procedural knowledge becomes expressible — an
operating procedure, a doctrine — which classical planning cannot state. And plans
become auditable, the decomposition tree being a justification a human can read, part of
why the systems deployed in logistics, spacecraft operations and games were
hierarchical. The cost is symmetric: a plan the author did not anticipate cannot be
produced even when it would work.

## Intuition

Think of an org chart: a task is delegated downward until someone is holding something
they can actually do. The analogy is right about the shape of the search and misleading
twice over. Subtasks are not independent — siblings share state, so they can be ordered,
interleaved with other branches, and constrained by literals holding between them. And
refinement is not a one-way pipeline: if every method for a deep subtask fails, the
planner backtracks to a choice made levels above, exactly the cost hierarchy was meant
to avoid.

## Concrete example

A travel domain with two methods for the compound task $\mathit{travel}(x,y)$:

```text
method by-taxi(x, y):
  task: travel(x, y)
  precondition: distance(x, y) = d, d <= 20, cash >= 1.5 + 0.5 * d
  subtasks: call-taxi(x), ride(x, y), pay-driver(1.5 + 0.5 * d)

method by-air(x, y):
  task: travel(x, y)
  precondition: distance(x, y) > 20
  subtasks: travel(x, airport(x)), fly(airport(x), airport(y)),
            travel(airport(y), y)
```

With $\mathit{distance}(\text{home}, \text{park}) = 8$ and $\mathit{cash} = 6$ the taxi
method applies, since the fare is $1.5 + 0.5 \cdot 8 = 5.5 \le 6$, and the plan is
`[call-taxi(home), ride(home, park), pay-driver(5.5)]`. Set $\mathit{cash} = 5$: that
precondition fails, by-air fails too because $8 \not> 20$, and there is no plan — even
if the operator `walk(home, park)` exists and would get you there. The by-air method is
recursive, since $\mathit{travel}(x, \mathit{airport}(x))$ is the same compound task
again.

A PDDL problem file would instead carry an `:init` state and a `:goal` formula, with the
plan judged by whether executing it from `:init` satisfies the goal. The HTN problem has
no goal; it has a task.

## Formal treatment

A state $s$ is a set of ground atoms; a primitive operator $a$ has $\mathrm{pre}(a)$,
$\mathrm{add}(a)$, $\mathrm{del}(a)$ and the usual transition function

$$
\gamma(s,a) = \bigl(s \setminus \mathrm{del}(a)\bigr) \cup \mathrm{add}(a),
\quad \text{defined when } \mathrm{pre}(a) \subseteq s .
$$

A **task network** is $w = (T, \prec, C)$: a finite set $T$ of nodes labelled by tasks,
a partial order $\prec$, and constraints $C$ on variable bindings and on literals holding
before, after or between nodes. A **method** $m = (t_c, w_m)$ attaches a network $w_m$ to
a compound task $t_c$; applying it to a node $n$ labelled $t_c$ yields $w[n / w_m]$, with
inherited orderings and constraints propagated. Write $\mathrm{red}(w_0, D)$ for the
networks obtainable from $w_0$ by finitely many such applications.

A sequence $\pi = \langle a_1, \dots, a_k \rangle$ is a **solution** to $(w_0, s_0, D)$
iff some primitive $w' \in \mathrm{red}(w_0, D)$ has a total order equal to $\pi$ that
respects $\prec'$, satisfies $C'$, and is executable — $\gamma$ defined all the way from
$s_0$. Compare the classical condition $\gamma(s_0, \pi) \models g$: derivability has
replaced goal satisfaction, so a sequence reaching a desirable state is not a plan
unless the methods generate it, and one they generate is a plan whatever state it
reaches.

Reading the solution set $\mathrm{Sol}(P) \subseteq A^{*}$ as a formal language over the
action alphabet sharpens the comparison. For a STRIPS problem over finitely many ground
states it is regular, accepted by the state-transition automaton. HTN solution sets are
not: mutually recursive methods generate $\{a^n b^n : n \ge 1\}$, which no finite
automaton accepts. So **HTN planning is strictly more expressive than STRIPS** — every
STRIPS problem encodes as an HTN problem with the same solution set, and not conversely.
That recursion also makes plan existence **undecidable** in general; the standard proof
reduces non-emptiness of the intersection of two context-free languages to it. It stays
semi-decidable: enumerating decompositions finds a plan whenever one exists, and merely
fails to terminate when none does. Requiring every network to be totally ordered
restores decidability at EXPSPACE-complete, against PSPACE-complete for propositional
STRIPS.

## Assumptions and requirements

Hierarchy buys its idealised speedup only under the **downward refinement property**:
every abstract plan that survives at one level refines to a concrete plan at the next
without backtracking across levels. When it holds, the planner commits to high-level
structure once and the exponential in plan length factors into a product of small
searches. When it fails, an early commitment is a gamble and a failed refinement drags
the planner back through levels it thought were settled, so hierarchy can be slower
than flat search. The property rarely holds exactly in hand-written domains, and
checking it is itself hard.

The results above further assume a deterministic, fully observable, closed-world model
with instantaneous actions, a finite method library, and preconditions evaluated against
a state actually determined when the decomposition happens — true in totally ordered HTN
planning, false in partially ordered networks, where the state before a node depends on
how siblings are eventually ordered. Drop determinism and the formalism stops defining
execution; drop the closed world and preconditions stop being decidable by lookup.

## Uses and applicability

Reach for it when you will solve the same domain repeatedly, the procedures are already
known, and plans must be explainable or must follow a prescribed process — logistics,
workflow and service composition, spacecraft and robot command sequencing, and game AI,
where behaviour is authored as tasks rather than goals. It also pays when the state
space is far too large for flat search but the method library keeps branching small.

Do not reach for it when the point of the problem is _discovering_ how to do something
novel, when nobody can write the methods, when optimality matters (an HTN planner
returns a derivable plan, not a cheapest one), or when uncertainty dominates and a
stochastic model is the right object.

## Limitations and common mistakes

The mistake that matters most is reading an HTN planner as a goal achiever with a
speedup. Completeness is relative to the method library, so "no plan found" means "no
legal decomposition", never "no action sequence reaches the goal"; debugging an HTN
domain is mostly finding the method you forgot to write.

The second is assuming decomposition always helps: without the downward refinement
property, hierarchy adds backtracking rather than removing it. The third is treating
undecidability as a curiosity. A recursive method with no decreasing measure loops
forever on a solvable-looking problem, and no timeout tells you whether to wait longer;
practical planners avoid this by restricting the formalism.

Two confusions are worth naming. Abstract tasks are not subgoals: $\mathit{travel}$ is a
thing to do, not a literal to make true, and a method is not a macro, since its subtasks
can interleave with tasks from elsewhere. And _state abstraction_ hierarchies — plan
while ignoring low-criticality preconditions, then reintroduce them — are a different
idea from task decomposition, though both are called hierarchical planning.

## Variants and alternatives

**Totally ordered HTN** planning, as in SHOP, decomposes left to right so the
current state is always known; it is decidable and fast, and gives up interleaving
between branches. **Partially ordered HTN** planning with state constraints, the UMCP
line, keeps interleaving and pays in complexity. **HTN with task insertion** lets the
planner add actions no method generated, recovering some goal-directedness and changing
the decidability picture. **Angelic semantics** describes each high-level action by
optimistic and pessimistic sets of reachable states, so an abstract plan can be proved
to work, or pruned, before refinement.

Outside symbolic planning, **hierarchical reinforcement learning** attacks the same
problem statistically: an _option_ is a temporally extended action with its own policy
and termination condition, learned from reward rather than authored and usable under
stochastic dynamics, at the cost of the correctness guarantee and the readable
decomposition tree. The blunt alternative is flat heuristic search with a strong
domain-independent heuristic, which needs no authored knowledge at all.

## History and attribution

Abstraction entered planning with Sacerdoti's ABSTRIPS (1974), which planned while
ignoring preconditions below a criticality threshold, and task decomposition with his
NOAH (1975), whose procedural nets are partially ordered task networks. NONLIN (Tate,
1977), SIPE (Wilkins) and O-Plan (Currie and Tate) built the deployed systems. For two
decades the field was implementations without an agreed semantics; Erol, Hendler and Nau
supplied one in the mid-1990s with the UMCP formalisation, along with the expressivity
and complexity results above. Bacchus and Yang formalised the downward refinement
property in 1994, asking why hierarchy sometimes failed to pay. SHOP and SHOP2 (Nau and
colleagues, from 1999) made ordered task decomposition the practical default, angelic
semantics is due to Marthi, Russell and Wolfe in the late 2000s, and HDDL arrived around
2020 with a competition track to use it.

## Sources

_Artificial Intelligence: A Modern Approach_ is the reference for everything
survey-level here: high-level actions and refinements, worked decompositions, angelic
semantics and the line from ABSTRIPS onward. The _Planning Wiki_ PDDL reference supplies
the classical side of the contrast drawn in the example — what an `:init` and `:goal`
pair is. The Stanford Encyclopedia entry on computability is cited only for what
undecidability and semi-decidability mean, not for the HTN-specific theorems, which are
flagged in `unresolved_references`. Sutton and Barto's chapter on temporal abstraction
covers options.

## Prerequisites and next connections

Read the STRIPS page first: the primitive actions here are classical operators, and
"strictly more expressive than STRIPS" means nothing without it; the PDDL page gives the
encoding conventions the classical half of the comparison uses.
[Computability Theory](./computability-theory.md) supplies undecidability and reduction,
and [First-Order Logic](./first-order-logic.md) the language preconditions and state
constraints are written in.

From here: [Markov Decision Processes](./markov-decision-processes.md) replace the
deterministic model with a stochastic one and goals with rewards, which is where options
live; [Model-Based Reinforcement Learning](./model-based-reinforcement-learning.md) is
the same planning problem with a learned transition model; and
[Dynamic Programming](./dynamic-programming.md) exploits subproblem structure the other
way, by memoising overlapping subproblems rather than decomposing tasks.
