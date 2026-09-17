---
concept_id: concept.software.apis
title: APIs
slug: /concepts/apis
aliases:
  - application programming interface
kind: concept
tier: 1
review_state: generated-draft
summary: An API is the contract a piece of software publishes to its callers — the calls they may make, the answers they may rely on, and the failures they must handle — and once callers exist that contract can be extended but never quietly changed.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: requires
    target: concept.systems.networking
    note: The HTTP and RPC half of this page assumes the reader already knows what a request/response exchange over an unreliable network is, including latency and partial failure.
  - type: contributes_to
    target: concept.systems.distributed_systems
    note: Every boundary between independently deployed services is an API, and compatibility across versions is precisely what allows those services to be deployed independently.
  - type: contrasts_with
    target: concept.software.version_control
    note: Version control versions an implementation's history and can rewrite it; an API version is a promise already in other people's hands and cannot be taken back.
  - type: contributes_to
    target: concept.software.design_patterns
    note: Facade, Adapter and programming-to-an-interface are API design decisions at the scale of a single object, governed by the same contract discipline as a network endpoint.
sources:
  - source_id: source.openapi.specification
    title: OpenAPI Specification
    url: https://spec.openapis.org/oas/latest.html
    source_kind: reference-documentation
    supports:
      - concrete-example
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - formal-treatment
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.semver.specification
    title: Semantic Versioning 2.0.0
    url: https://semver.org/
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Roy T. Fielding, Architectural Styles and the Design of Network-based Software Architectures (doctoral dissertation, 2000), chapter 5'
    reason: "The registry has no entry for the dissertation that defines REST's constraints, nor for Fielding's later insistence that hypertext-driven interaction is not optional; the enumeration of the six constraints and the four parts of the uniform interface rests on it."
    sections:
      - definition
      - formal-treatment
      - history-and-attribution
  - label: 'GraphQL specification and the gRPC/Protocol Buffers documentation'
    reason: "The registry has no primary source for either; claims about GraphQL's single endpoint, field deprecation in place of versioning, and gRPC's use of HTTP/2 are uncited here."
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

An **API** (application programming interface) is the set of operations a piece
of software offers to code it does not control, together with the promises those
operations carry: what arguments are accepted, what results and errors may come
back, and what the caller is entitled to assume about effects, ordering and
failure. The interface is the part that is published; everything else is
implementation, and the whole point of the distinction is that implementation may
change and the interface may not.

The word covers a wide range of scale — a function signature in a library, the
system-call table of a kernel, the endpoints of a web service — but the
engineering problem is the same at every scale, and it is not "how do I design a
nice interface". It is "how do I change this one, later, without breaking
callers I cannot see and cannot redeploy".

## Why it matters

An API is what lets two pieces of software be built, tested and deployed by
different people at different times. Without a stable boundary, a change anywhere
is a change everywhere: a team cannot ship a service independently, a library
cannot be upgraded without auditing every call site, and a distributed system
degenerates into one unit that must be released atomically. Kleppmann's framing is
the useful one — a running system is almost always in a state where old and new
code coexist, so compatibility in both directions is a precondition for rolling
upgrades, not a nicety.

The cost side is equally concrete. A published endpoint with unknown callers is a
liability that never expires. Removing a field from a response is cheap for you
and possibly fatal for somebody whose integration you have never heard of.

## Intuition

Think of an API as a promise with an unbounded audience and no recall mechanism.
You can always promise _more_ — a new endpoint, a new optional parameter — and
nobody is hurt. Promising _less_, or promising something different, hurts
everyone who took you at your word.

The analogy breaks in one instructive place. A legal contract is what the parties
agreed; an API's effective contract is whatever callers actually observed and
built on. Hyrum's Law states it flatly: with enough users, every observable
behaviour of the system becomes something somebody depends on, documented or not
— including error message text, field ordering, and response latency. Fowler's
notion of a _published interface_, distinct from a merely public one, is the same
idea from the other direction: the moment you publish, you have moved a cost from
your side of the boundary to everyone else's.

## Concrete example

A small HTTP resource, described first as OpenAPI and then exercised:

```yaml
paths:
  /orders/{orderId}:
    get:
      parameters:
        - name: orderId
          in: path
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: The order
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Order' }
        '404':
          description: No such order
```

```http
GET /orders/1042 HTTP/1.1
Host: api.example.com
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60
ETag: "9c1e"

{
  "id": 1042,
  "status": "paid",
  "total_cents": 4250,
  "links": [
    {"rel": "self",   "href": "/orders/1042"},
    {"rel": "cancel", "href": "/orders/1042/cancellation"}
  ]
}
```

That `links` array is the part almost every real API omits. With it, the client
discovers from the response that cancellation is currently available. Without it,
the client hard-codes the rule "cancel is allowed when `status` is `pending` or
`paid`" — and that rule now lives in the server _and_ in every client, so
changing the workflow means changing all of them.

Now evolve it. Adding `"currency": "GBP"` is safe for clients that ignore unknown
fields. Renaming `total_cents` to `total` breaks every client that exists.
Requiring a new `X-Idempotency-Key` header breaks them too, because the promise
about which requests are valid has been narrowed.

## Formal treatment

Model a contract $C$ as a pair $(D_C, \mathcal{A}_C)$, where $D_C \subseteq R$ is
the set of requests declared valid out of all possible requests $R$, and
$\mathcal{A}_C(r) \subseteq P$ is the set of responses the contract permits for
request $r$. An implementation, modelled for a stateless service as a map
$S : R \to P$, _satisfies_ $C$ when $S(r) \in \mathcal{A}_C(r)$ for every
$r \in D_C$. Real services are stateful, so this captures per-request shape only;
sequencing promises (idempotency, ordering) sit outside it.

Contract $C_2$ is **backward compatible** with $C_1$ when

$$
D_{C_1} \subseteq D_{C_2}
\qquad\text{and}\qquad
\mathcal{A}_{C_2}(r) \subseteq \mathcal{A}_{C_1}(r) \;\; \text{for all } r \in D_{C_1}.
$$

Accepted inputs may widen; permitted outputs must narrow. This is exactly the
variance rule for safe subtyping of a function type — contravariant in the
argument, covariant in the result — and it is why "add, never remove" is the whole
of the practical advice.

The formalism also explains the one rule practitioners get wrong. Adding a field
to a response is backward compatible _only if_ $\mathcal{A}_{C_1}$ already
permitted responses carrying unknown fields. If the published schema was closed
(`additionalProperties: false` in OpenAPI's JSON-Schema-derived vocabulary, or a
client that validates strictly), the new response is outside the old permitted
set and the addition is a breaking change. Compatibility is a property of the
contract as written, not of the diff.

Kleppmann's pair of terms names the two directions: **backward compatibility** is
new code reading old data, **forward compatibility** is old code reading new data.
A rolling deployment needs both at once, because for a window of time both
versions are live.

## Assumptions and requirements

The discipline described above assumes callers you cannot redeploy. If every
caller is in your repository and ships in the same artifact, the boundary is an
internal one and you may change it freely; treating it as published costs you
flexibility for nothing.

It assumes the contract is written down and is strictly narrower than observable
behaviour, with the slack documented as unspecified. Where it is not, Hyrum's Law
fills the gap with accidents.

Additive evolution assumes **tolerant readers**: clients that ignore fields they
do not recognise. Strict client-side validation, code generated from a closed
schema, and exhaustive pattern matches over an enum all withdraw that assumption,
which is why adding an enum value is breaking for some clients and free for
others.

Semantic Versioning assumes a public API that has been _declared_, and assumes
the maintainer can classify a change as breaking or not. The specification is
explicit that `0.y.z` carries no compatibility promise at all, and that a version
number is a statement of intent by the author — nothing verifies it.

Safe retry assumes idempotency. `GET`, `PUT` and `DELETE` are specified as
idempotent and `POST` is not, so an API that expects clients to retry after a
timeout must supply an idempotency key or accept duplicates.

## Uses and applicability

Publish a contract when the caller sits outside your deployment unit: a public
web service, a library on a package registry, a plugin surface, a service that
crosses a team boundary. Machine-readable descriptions earn their keep here —
OpenAPI for HTTP, a `.proto` file for gRPC — because they generate clients,
servers, documentation and tests from one artifact, so the description cannot
drift from the implementation as prose does.

Do not publish one inside a module that ships atomically with its callers.
Freezing an interface before you understand the domain is expensive, and the cost
is paid at exactly the moment you learn what the interface should have been.

Choose resource-shaped HTTP when clients are heterogeneous and caching matters;
RPC with a schema when the callers are your own services and latency, streaming
and code generation matter more than cacheability; GraphQL when many different
clients need different slices of a graph-shaped domain and round trips dominate.

## Limitations and common mistakes

**Calling it REST.** Fielding's REST is an architectural style defined by
constraints — client–server, statelessness, cacheability, a uniform interface, a
layered system, and optional code-on-demand — and the uniform interface itself
requires resource identification, manipulation through representations,
self-descriptive messages, and hypermedia as the engine of application state. Very
few APIs described as REST satisfy the last one. On the Richardson Maturity Model
that Fowler popularised, most sit at level 2: resources plus HTTP verbs and status
codes, no hypermedia controls. That is a defensible engineering choice —
hypermedia buys evolvability and costs client complexity — but it is a different
thing from what the word denotes, and the imprecision hides which properties you
actually have.

**Believing a version number solves evolution.** Shipping `/v2` means operating
two implementations, and clients do not migrate because you asked. Versioning
defers the break; it does not remove it. The endpoint you cannot see being used is
the endpoint you cannot delete, so usage telemetry per client is a prerequisite
for deprecation, not an afterthought.

**Treating a remote call as a local one.** This was the founding error of the RPC
tradition and the substance of the 1994 critique "A Note on Distributed
Computing": latency, partial failure and concurrency do not disappear behind a
generated stub. A call that looks like a method invocation but can time out after
succeeding needs retries, idempotency and timeouts designed in.

**Assuming a bug fix is not a breaking change.** If callers built on the buggy
behaviour, fixing it breaks them; Semantic Versioning can encode your intent but
cannot discover theirs.

**`POST` for everything**, then wondering why nothing caches and why a retried
request charged the customer twice.

## Variants and alternatives

**HTTP resource APIs** (REST-flavoured) buy uniform tooling, URL-keyed caching
and intermediaries, and cost round trips and over-fetching. **RPC** — gRPC over
HTTP/2 with Protocol Buffers, or JSON-RPC over almost anything — buys compact
encodings, streaming and generated bidirectional stubs, and costs the
transparency illusion above and weaker cacheability. **GraphQL** buys
client-specified response shapes and a single round trip across a graph, and
costs HTTP-level caching, predictable server cost (queries need complexity limits
and batched resolvers), and a query planner you now maintain.

For evolution specifically, the alternatives are: URL versioning (`/v2`, obvious,
duplicative), media-type or header negotiation (finer-grained, harder to test),
and **additive-only evolution with deprecation markers** — GraphQL's default,
and increasingly the HTTP practice too — which never breaks but accumulates
fields nobody dares remove.

**Event and message interfaces** invert the direction: the contract is the event
schema, decoupling producer and consumer in time. The schema-evolution problem is
identical, which is why schema registries look like API versioning rediscovered.
At the other extreme, **ABIs** add binary layout to the same contract idea, and
leave no room for tolerance unless it is designed in up front — a size or version
field, reserved padding, symbol versioning — because a fixed binary layout gives
an unprepared reader no way to skip data it does not recognise.

## History and attribution

Remote procedure call is the older tradition: Sun RPC, DCE and CORBA through the
1980s and 1990s, aiming at transparency between local and remote invocation, and
challenged in 1994 by Waldo, Wyant, Wollrath and Kendall's "A Note on Distributed
Computing". SOAP and the WS-\* stack carried the schema-and-toolkit approach into
the web era around 2000.

REST was named and defined by Roy Fielding in his 2000 doctoral dissertation. It
was not proposed as a way to build APIs: Fielding, a co-author of the HTTP/1.1
specification, was giving a principled account of why the Web's architecture
scaled, and derived the style by adding constraints one at a time. The gap between
that account and industry usage prompted his later insistence that an API is not
REST unless it is hypertext-driven. Leonard Richardson's maturity model, from a
2008 conference talk and written up by Martin Fowler, is the standard way to
describe where a given API actually sits.

The current alternatives are younger: gRPC was released by Google in 2015 out of
its internal Stubby system, and GraphQL was developed at Facebook from around 2012
and published publicly in 2015. Semantic Versioning was articulated by Tom
Preston-Werner and is now the default convention of most package ecosystems.

## Sources

The **OpenAPI Specification** is the reference for how an HTTP contract is written
down machine-readably — paths, parameters, response schemas, and the
open-versus-closed schema question that decides whether adding a field breaks
anyone. **Designing Data-Intensive Applications** is the best treatment of
dataflow through services and of backward versus forward compatibility during
rolling upgrades, and its chapter on encoding covers the REST-versus-RPC
comparison directly. **Martin Fowler's catalogue** supplies the Richardson
Maturity Model, published interfaces and tolerant readers. **Semantic Versioning
2.0.0** is short, normative, and worth reading in full for what it declines to
promise.

## Prerequisites and next connections

Read enough networking first to be comfortable with request/response over an
unreliable link; almost everything specific to network APIs is a consequence of
latency and partial failure.
[Object-Oriented Programming](./object-oriented-programming.md) is where the same
contract idea appears in the small, as encapsulation and the public surface of a
type.

Afterwards, [TypeScript](./typescript.md) shows a contract checked at compile time
— its _function subtyping_ rule is the variance rule from the formal treatment,
contravariant in the parameters and covariant in the return, though the compiler
enforces the parameter half only for function-typed values under
`strictFunctionTypes` and leaves method parameters deliberately bivariant.
Structural typing is a separate property of that language: compatibility is
decided by shape rather than by declared name. TypeScript is also where generated
API clients usually land.
[Operating Systems](./operating-systems.md) has the most consequential API in
practice, the system-call interface, along with the most extreme version of the
evolution rule: Linux treats any change that breaks a userspace program as a bug
in the kernel, whatever the documentation said.
