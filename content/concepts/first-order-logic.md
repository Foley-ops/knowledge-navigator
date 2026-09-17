---
concept_id: concept.logic.first_order_logic
title: First-Order Logic
slug: /concepts/first-order-logic
aliases:
  - predicate calculus
  - quantificational logic
kind: concept
tier: 1
review_state: generated-draft
summary: The logic of quantifiers, variables and predicates in which most of modern mathematics is actually written, a logic whose provability and truth-in-every-structure coincide while its validity problem stays undecidable.
categories:
  - Mathematics/Foundations/Logic & Proof
primary_category: Mathematics/Foundations/Logic & Proof
relationships:
  - type: generalizes
    target: concept.logic.propositional_logic
    note: Every propositional connective and tautology schema survives unchanged; first-order logic adds terms, predicates and quantification over domain elements on top of them.
  - type: prerequisite_of
    target: concept.foundations.model_theory
    note: Model theory takes the satisfaction relation between first-order sentences and structures as its object of study, so the syntax and semantics defined here are its starting data.
  - type: prerequisite_of
    target: concept.logic.proof_theory
    note: The derivability relation whose calculi proof theory analyses is the one first-order completeness matches against semantic consequence.
  - type: prerequisite_of
    target: concept.foundations.set_theory
    note: ZFC is presented as a first-order theory in the signature containing the single binary relation symbol for membership, and its separation and replacement axioms are first-order schemas.
sources:
  - source_id: source.plato.classical_logic
    title: 'Stanford Encyclopedia of Philosophy: Classical Logic'
    url: https://plato.stanford.edu/entries/logic-classical/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.plato.model_theory
    title: 'Stanford Encyclopedia of Philosophy: Model Theory'
    url: https://plato.stanford.edu/entries/model-theory/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.plato.proof_theory
    title: 'Stanford Encyclopedia of Philosophy: Proof Theory'
    url: https://plato.stanford.edu/entries/proof-theory/
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.turing1936.computable_numbers
    title: On Computable Numbers, with an Application to the Entscheidungsproblem
    url: https://londmathsoc.onlinelibrary.wiley.com/doi/10.1112/plms/s2-42.1.230
    source_kind: primary-research
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**First-order logic** is the formal system whose formulas are built from a
_signature_ — relation, function and constant symbols of fixed arity — using
variables, the connectives $\neg, \wedge, \vee, \rightarrow$, equality, and the
quantifiers $\forall$ and $\exists$. Those quantifiers range over _elements_ of a
domain, never over relations, functions or sets of elements: that restriction is
what "first order" names, and it buys both the good metatheory and the expressive
limits. A sentence is true or false only _in a structure_, which supplies a domain
and interprets every symbol. The domain must be non-empty, which makes
$\exists x\,(x = x)$ valid — a convention, not a theorem, and free logics drop it.

## Why it matters

Nearly all of modern mathematics is stated in it: ZFC is a first-order theory
whose signature is one binary relation symbol, Peano arithmetic one over
$(0, S, +, \times)$, and groups, rings and orders need a handful of axioms each.
Because language and semantics are pinned down exactly, "does this follow from
those axioms?" becomes a question with answers, and Gödel's completeness theorem
gives the central one: a mechanical proof calculus derives exactly the sentences
that hold in every structure. Automated provers and proof assistants rest on that,
and on knowing rather than guessing where their limits are.

## Intuition

A structure is a world: a bag of things plus tables of which tuples stand in which
relations, so a formula with free variables is a query with holes, $\forall$ a
loop over the bag that must always succeed and $\exists$ one that must succeed
once. The database picture breaks twice: a domain may be infinite, so the loop is
not runnable, and the semantics is open-world, so what the axioms fail to entail
is undetermined rather than false.

The second picture is a game. $\forall x \exists y\, \varphi$ lets your opponent
pick $x$ first and you answer with a $y$ that may depend on it;
$\exists y \forall x\, \varphi$ makes you commit to $y$ blind. Strictly harder —
which is why the orders are not interchangeable.

## Concrete example

Continuity of $f : \mathbb{R} \to \mathbb{R}$ is

$$
\forall \varepsilon > 0 \; \forall x \; \exists \delta > 0 \; \forall y \;
\bigl( |x-y| < \delta \rightarrow |f(x)-f(y)| < \varepsilon \bigr),
$$

and uniform continuity is the same formula with $\exists \delta$ moved in front of
$\forall x$. Take $f(x) = x^2$, $\varepsilon = 1$. For fixed $x$, choose
$\delta = \min\!\left(1, \tfrac{1}{2|x|+2}\right)$: if $|x-y| < \delta \le 1$ then
$|y| \le |x|+1$, so $|x^2-y^2| = |x-y|\,|x+y| < \delta(2|x|+1) < 1$. But that
$\delta$ shrinks like $1/(2|x|)$ and no single positive value survives all $x$ —
at $x = 1000$, a $y$ with $|x-y| = 0.001$ already gives $|x^2-y^2| \approx 2$.
One quantifier moved turns a true statement into a false one.

The same swap in a finite structure:

```python
D = range(1, 6)                                        # the structure ({1,...,5}, <)
forall_exists = all(any(x < y for y in D) for x in D)  # False: x = 5 has no witness
exists_forall = any(all(x < y for x in D) for y in D)  # False: no y beats itself
```

Over $(\mathbb{N}, <)$ the first becomes true and the second stays false: truth is
relative to the structure, and no finite check settles the infinite case.

## Formal treatment

Fix a signature $\sigma$. **Terms**: variables and constant symbols, and
$f(t_1,\dots,t_n)$ for an $n$-ary function symbol $f$ and terms $t_i$. **Atomic
formulas**: $R(t_1,\dots,t_n)$ for an $n$-ary relation symbol $R$, and
$t_1 = t_2$. Formulas close under the connectives and under $\forall x$,
$\exists x$; an occurrence of $x$ inside the scope of a quantifier binding it is
_bound_, otherwise _free_, and a **sentence** has no free variables.

A $\sigma$-structure $\mathcal{M}$ is a non-empty set $M$ with interpretations
$R^{\mathcal{M}} \subseteq M^n$, $f^{\mathcal{M}} : M^n \to M$,
$c^{\mathcal{M}} \in M$. Given an assignment $s$ of elements to variables,
satisfaction is defined by recursion; the quantifier clause is

$$
\mathcal{M} \models (\forall x\, \varphi)[s]
\quad\text{iff}\quad
\mathcal{M} \models \varphi[s(x \mapsto a)] \ \text{ for every } a \in M .
$$

Write $\models \varphi$ when $\varphi$ holds in every structure under every
assignment, and $\Gamma \models \varphi$ when every model of $\Gamma$ models
$\varphi$. Four results, kept apart:

**Gödel's completeness theorem (1929).** For the standard calculi,
$\Gamma \vdash \varphi$ if and only if $\Gamma \models \varphi$ — equivalently,
every consistent set of sentences has a model. Uncountable signatures need a
choice principle.

**Compactness and Löwenheim–Skolem**, corollaries of it: if every finite subset of
$\Gamma$ has a model then $\Gamma$ does, and a theory with an infinite model has
models of every infinite cardinality at least the size of its language. Hence no
first-order theory picks out $\mathbb{N}$ up to isomorphism, and "the domain is
finite", "$R$ is the transitive closure of $E$" and "this order is well-founded"
have no first-order definition.

**Church–Turing (1936).** Validity is undecidable once the signature carries a
binary relation symbol — the negative answer to the Entscheidungsproblem — but
stays semi-decidable: enumerate proofs and, by completeness, a valid sentence
eventually turns up. The valid sentences are recursively enumerable but not
recursive, so no procedure reliably reports _in_validity. Monadic first-order
logic, with only unary relation symbols and no function symbols, is decidable.

**Gödel's incompleteness theorems (1931), about theories rather than about the
logic.** If $T$ is consistent, recursively axiomatisable and interprets enough
arithmetic — Robinson's $Q$ suffices — then some arithmetic sentence $G$ has
$T \nvdash G$ and $T \nvdash \neg G$. The second theorem adds that $T$ cannot
prove its own consistency statement; it is stated for theories meeting the
Hilbert–Bernays–Löb derivability conditions, such as PA, since which sentence
counts as "$\mathrm{Con}(T)$" is not innocent. Gödel's first theorem assumed
$\omega$-consistency; Rosser weakened that to plain consistency. No tension with
completeness: $T \nvdash G$ says exactly that some model of $T$ satisfies $\neg G$
— a non-standard one.

## Assumptions and requirements

**Every term denotes, and denotes one thing.** Function symbols are interpreted
by _total_ functions, which is what makes instantiation
$\forall x\, \varphi \rightarrow \varphi(t/x)$ sound: $t$ is guaranteed to name
an element to instantiate at. Put inverse or division in a signature and the
axioms silently become claims about every element, $0$ included. The repair is to
demote the function symbol to a relation symbol and add an axiom saying it is
functional where it is defined, which moves the partiality somewhere the
quantifiers can see it. Instantiation carries a second condition — $t$ must be
free for $x$, no variable of $t$ captured by a quantifier of $\varphi$. Drop it
and $\forall x \exists y\, (x \neq y)$ yields $\exists y\, (y \neq y)$; rename
the bound variable and the inference vanishes.

**Formulas are finite and derivations are finite.** Compactness follows from
completeness only because a derivation of $\varphi$ from $\Gamma$ cites finitely
many members of $\Gamma$. Permit countable conjunctions and "every element is
some $S^n 0$" becomes writable, non-standard models disappear, and compactness
goes with them. The expressive ceiling and the good metatheory are one fact seen
from two sides.

**Equality is identity, and the semantics is extensional.** The calculus alone
forces $=$ to be no more than a congruence; the standard semantics demands real
identity on the domain, which is what makes "exactly three things satisfy $P$" a
sentence rather than an approximation — and any structure honouring the
congruence axioms quotients to one honouring identity, which is why the
assumption is cheap. Extensionality is the expensive one: a relation symbol
denotes a set of tuples, so predicates true of exactly the same things are
interchangeable everywhere. Contexts where they are not — belief, necessity,
tense, quotation — are not first-order contexts at all, and no amount of extra
axioms makes them into ones.

**Satisfaction is two-valued and everywhere defined.** Each sentence is true or
false in a structure, with no third value and no gap, which is what validates
excluded middle and double-negation elimination and lets a proof of
$\neg \forall x\, \neg \varphi$ count as a proof that something satisfies
$\varphi$ without producing it.

**The metatheorems are proved somewhere, and that somewhere costs something.**
Completeness for an uncountable signature needs a choice principle for the Henkin
construction — the Boolean prime ideal theorem suffices, strictly weaker than
full choice — while a countable language needs far less, a weak König's lemma in
the reverse-mathematics accounting. Semi-decidability assumes more than
computability: enumerating proofs requires the axioms to be effectively given, so
a prover handed a theory it cannot list has nothing to search, however decidable
its proof relation is.

## Uses and applicability

Reach for first-order logic when the subject is a fixed collection of individuals
with relations among them and the reasoning is classical: axiomatising a
structure, writing pre- and postconditions, knowledge representation, querying —
relational algebra is essentially first-order logic over finite structures.
Resolution provers and SMT solvers consume first-order formulas modulo background
theories; Prolog restricts to the Horn fragment, paying in expressiveness for an
efficient procedure.

Reach elsewhere to quantify over subsets or functions (second-order logic pins
down $\mathbb{N}$, at the cost of completeness and compactness), or when
reachability or "finitely many" is the point (fixed-point and transitive-closure
logics). Note one asymmetry: validity _in the logic_ is undecidable, yet
particular first-order theories are decidable, Presburger arithmetic
$(\mathbb{N}, 0, 1, +, <)$ among them.

## Limitations and common mistakes

The commonest error is collapsing Gödel's two results. **Completeness** is about
the logic: derivability captures semantic consequence exactly. **Incompleteness**
is about theories: no consistent, recursively axiomatisable theory interpreting
arithmetic settles every arithmetic sentence. They are compatible, and the second
takes nothing from the first.

Next, swapping quantifiers. Only $\exists y \forall x\, \varphi \rightarrow
\forall x \exists y\, \varphi$ is valid; the converse fails, as continuity versus
uniform continuity shows.

Third, expecting a theory to pin down its intended model. Skolem's paradox is the
sharp case: if ZFC is consistent it has a countable model, whose "uncountable"
sets are uncountable only from inside — the bijection counting them is not an
element of that model.

Fourth, believing incompleteness applies to any formal system whatever. Each
hypothesis does work: the complete theory of the standard model of arithmetic is
not recursively axiomatisable, while Presburger arithmetic is complete _and_
decidable, escaping because it cannot define multiplication.

Finally, semi-decidability means a prover that has not returned has told you
nothing: no timeout may be read as "invalid".

## Variants and alternatives

**Reshapings that cost nothing.** Many-sorted first-order logic gives points,
lines and scalars variables of their own; it reads far better in practice and is
free, since relativising each sort to a unary predicate translates it back. Free
logic drops the non-empty domain and lets terms fail to denote, buying honest
treatment of definite descriptions at the price of the simple instantiation rule.
Both are this logic in different clothes.

**Changing the consequence relation.** Intuitionistic first-order logic keeps the
syntax and drops excluded middle: derivations then carry witnesses, and by
Curry–Howard programs, and the calculus is complete for Kripke semantics. What it
costs is the classical duality of the quantifiers — $\exists x\, \varphi$ no
longer follows from $\neg \forall x\, \neg \varphi$ — so ordinary mathematics has
to be rewritten rather than merely re-checked.

**Buying expressive power.** Second-order logic quantifies over subsets and
relations, and with it $\mathbb{N}$ becomes categorical, $\mathbb{R}$ is pinned
down as _the_ complete ordered field, and "finite" and "well-founded" become
definable. Completeness, compactness and Löwenheim–Skolem all fail together, and
validity is not even semi-decidable. Henkin semantics restores all three by
shrinking the range of the second-order quantifiers — at which point the system
is many-sorted first-order logic again, which is the clearest statement of what
the extra strength actually cost. Infinitary $L_{\omega_1\omega}$ trades
compactness for countable conjunctions; fixed-point and transitive-closure logics
add recursion and, on ordered finite structures, capture exactly polynomial time.

**Buying decidability.** The two-variable fragment, the guarded fragment and
monadic logic are the same language under a syntactic restriction that forces
satisfiable formulas to have models of bounded shape. Description logics, the
reasoning core of OWL, are engineered fragments of this kind, tuned so that
subsumption stays tractable on large ontologies. Modal and temporal logics reach
the same end differently, replacing quantification with operators over states,
which is what makes model checking a finite computation.

**A different foundation.** Higher-order logic and dependent type theory — the
setting of Lean, Coq and Isabelle/HOL — replace structures and satisfaction with
proof terms and computation rules, buying native functions, decidable type
checking and mechanised libraries, and giving up the clean separation of syntax
from semantics on which every model-theoretic argument above depends.

There is nonetheless a sense in which no alternative exists. Lindström's theorem
(1969) says that a logic at least as expressive as this one which keeps both
compactness and the downward Löwenheim–Skolem property _is_ this one. So each
entry above is a trade at a known price rather than an improvement the subject
neglected to adopt: go up and those two properties are what you spend, go down
and expressiveness is.

## History and attribution

Quantification over a domain, with bound variables and nested scope, is Frege's,
in the _Begriffsschrift_ of 1879. He built it to make arithmetical proofs gapless
in the service of deriving arithmetic from logic — the programme Russell's
paradox wrecked in 1902 in its _Grundgesetze_ form — and his own system
quantified over concepts as well as objects, so what survives here is a fragment
of what he wrote. In the algebra-of-logic tradition C. S. Peirce arrived at a
quantifier notation independently in the 1880s and Schröder developed it; the two
lines are normally credited together. Neither notation is the one in use:
$\exists$ reaches us through Peano and $\forall$ through Gentzen.

First-order logic as a system with a boundary is Hilbert's school. The _engere
Prädikatenkalkül_ of Hilbert and Ackermann's _Grundzüge der theoretischen Logik_
(1928) is the restriction this page describes, and that book asked the two
questions that organised everything after it: is the calculus complete, and is
validity decidable — the Entscheidungsproblem. Gödel settled the first in his
1929 Vienna dissertation, though Skolem through the 1920s and Herbrand in 1930
had results close enough that the credit is genuinely shared rather than politely
shared. The second fell in 1936 to Church and to Turing independently, Church
through λ-definability and slightly earlier into print, Turing through his
machines, in the paper cited below whose title names the problem.

The semantic half is Tarski's: the recursive satisfaction clause given above
comes out of his work on truth in formalized languages (Polish, 1933; German,
1935). The limits arrived before the system they limit — Löwenheim in 1915,
Skolem in 1920 and 1922, the latter already discussing the relativity of
set-theoretic notions that became Skolem's paradox. Gentzen's natural deduction
and sequent calculus (1934–35) were written to serve Hilbert's consistency
programme rather than to present this logic, which is most of what they are used
for now.

No one chose first-order logic as the standard. It settled between the 1920s and
the 1950s, as set theory and arithmetic were axiomatised inside it and the
results above accumulated around it, and Lindström's theorem arrived in 1969 to
justify after the fact a choice that had already been made.

## Sources

The Stanford Encyclopedia entry on classical logic states the syntax, the Tarskian
semantics, the proof calculi and completeness; its model theory entry covers
structures, satisfaction, and the compactness and Löwenheim–Skolem theorems that
bound first-order expressiveness. Turing's 1936 paper is the primary source for
the undecidability half — its stated application is the unsolvability of the
Entscheidungsproblem — and Russell and Norvig treat this logic as a working
representation language, which is where the applications come from. The proof
theory entry supplies Gentzen's calculi and the consistency programme they were
built for.

## Prerequisites and next connections

Understand [Propositional Logic](./propositional-logic.md) first: connectives,
truth tables, and completeness in the easy, decidable setting. First-order logic
is that system plus terms, predicates and quantifiers, and nearly all the added
difficulty lives in the quantifiers.

From here, [Model Theory](./model-theory.md) works the structures side, asking
which classes a theory can carve out, and [Proof Theory](./proof-theory.md) the
derivation side, where cut elimination lives.
[Computability Theory](./computability-theory.md) supplies the undecidability
results above and the sense of "recursively axiomatisable" Gödel's theorems lean
on; [Set Theory](./set-theory.md) is the largest single application, ZFC being
this logic plus axioms about membership.
