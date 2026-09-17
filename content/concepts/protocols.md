---
concept_id: concept.software.protocols
title: Protocols
slug: /concepts/protocols
aliases:
  - wire protocol
kind: concept
tier: 1
review_state: generated-draft
summary: The agreed contract — message format, legal message ordering, error handling and rules for change — that lets programs written by strangers and deployed years apart still interoperate.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: prerequisite_of
    target: concept.software.model_context_protocol
    note: MCP's initialize exchange, JSON-RPC message framing and dated version string only make sense once message format, lifecycle and version negotiation are understood in general.
  - type: contrasts_with
    target: concept.paradigms.object_oriented_programming
    note: An object interface is a contract you can change by recompiling every caller; a protocol is a contract whose other side you can never recompile, which is why the same change is trivial in one and impossible in the other.
  - type: contributes_to
    target: concept.software.continuous_delivery
    note: Shipping services independently is only safe when the protocol between them tolerates both the old and the new version at once, so a protocol's compatibility rules set the ceiling on release cadence.
sources:
  - source_id: source.rfc9293.tcp
    title: 'RFC 9293: Transmission Control Protocol (TCP)'
    url: https://www.rfc-editor.org/rfc/rfc9293
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.openapi.specification
    title: OpenAPI Specification
    url: https://spec.openapis.org/oas/latest.html
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.modelcontextprotocol.specification
    title: Model Context Protocol documentation
    url: https://modelcontextprotocol.io
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: 'HTTP/1.1 message syntax and semantics (RFC 9112, RFC 9110)'
    reason: The registry holds no HTTP specification. The textual request/response exchange shown is used only to contrast a text wire format with TCP's binary one, and its framing rules are supported by none of the cited sources.
    sections:
      - concrete-example
  - label: 'IAB, Maintaining Robust Protocols (RFC 9413, Thomson and Schinazi, 2023)'
    reason: The modern critique of the robustness principle — that leniency entrenches non-conforming implementations, and that unexercised extension points atrophy — is not covered by any registry source. RFC 9293 invokes the principle but does not argue about it.
    sections:
      - limitations-and-common-mistakes
      - history-and-attribution
claims: []
---

## Definition

A **protocol** is an agreed set of rules under which independently written,
independently deployed programs exchange messages. An implementable specification
fixes four things: the **message format** — which bytes form a legal message, and
where one ends and the next begins; the **state machine** — which messages are legal
in which state, and what each does to it; the **error handling** — what to do with a
message that is malformed, unexpected, duplicated or lost; and the **rules for
change** — how a feature is added without breaking implementations already running.
Miss one and a stranger cannot implement the document — and a stranger is who has
to.

## Why it matters

A protocol buys interoperation without coordination: a TCP endpoint written this
year exchanges data with one written in 1995 because both conform to a document
neither author negotiated over, and nobody owns the contract.

The price is that mistakes are permanent, because you cannot recompile the peer. An
ambiguous length, a field that means the wrong thing, an error case the
specification forgot — each is now behaviour somebody's deployed code depends on.

## Intuition

Two state machines holding a conversation with a fixed grammar and a fixed turn
order, over a channel that may lose, duplicate, reorder or delay what is said. The
format is the grammar, the state machine is the turn-taking, and error handling is
what you do on hearing something ungrammatical.

Air-traffic phraseology is a fair analogy: fixed phrases, mandatory readback,
ambiguity designed out rather than repaired. It breaks at the interesting point. A
controller who hears something odd asks again; an implementation that guesses what
its peer meant does not fail loudly — it succeeds, and its guess becomes behaviour
everyone else must then tolerate too.

## Concrete example

TCP's three-way handshake, with the sequence numbers from RFC 9293, Figure 6. States
are shown _after_ the segment departs or arrives.

```text
    TCP Peer A                                            TCP Peer B

1.  CLOSED                                                LISTEN
2.  SYN-SENT    --> <SEQ=100><CTL=SYN>                --> SYN-RECEIVED
3.  ESTABLISHED <-- <SEQ=300><ACK=101><CTL=SYN,ACK>   <-- SYN-RECEIVED
4.  ESTABLISHED --> <SEQ=101><ACK=301><CTL=ACK>       --> ESTABLISHED
5.  ESTABLISHED --> <SEQ=101><ACK=301><CTL=ACK><DATA> --> ESTABLISHED
```

A picks initial sequence number 100 and sends a SYN. B answers with its own, 300,
and `ACK=101`: sequence 100 is acknowledged because the SYN flag occupies a sequence
number although it carries no data. Line 5 repeats `SEQ=101` because a pure ACK
consumes no sequence space — otherwise "we would wind up ACKing ACKs".

Above TCP, formats are often text:

```text
GET /index.html HTTP/1.1
Host: example.org

HTTP/1.1 200 OK
Content-Length: 12

hello world!
```

The blank line ends the headers and `Content-Length: 12` gives the body length. TCP
delivers a byte stream with no record boundaries, so everything above it must frame
its own messages.

## Formal treatment

Model each role as a labelled transition system: for role $r$, a state set $S_r$, an
initial state $s_r^0 \in S_r$, a message alphabet $M$, and a transition relation

$$
\delta_r \;\subseteq\; S_r \times \bigl(M_{\text{in}} \cup M_{\text{out}} \cup \{\tau\}\bigr) \times S_r ,
$$

with $M_{\text{in}}$, $M_{\text{out}}$ the receive and send events and $\tau$ an
internal event such as a timeout. TCP's $S_r$ has eleven states, from CLOSED and
LISTEN through ESTABLISHED to TIME-WAIT.

Correctness belongs to the joint system, whose reachable set
$R \subseteq S_A \times S_B \times \mathcal{M}(M)$ carries the messages in flight as a
multiset. $R$ always exceeds the pairs a designer draws: simultaneous open and
half-open connections are both in it.

A change is **backward compatible** when new code reads what old code wrote,
**forward compatible** when old code reads what new code writes. The second is hard,
because the old reader predates the new field, and needs a format built for ignorable
unknowns. TCP's reserved header bits "must be zero in generated segments and must be
ignored in received segments if the corresponding future features are not
implemented", and options are (kind, length, data) triples, so an unknown option is
skipped by its length. Must-ignore rules plus self-describing lengths are the recipe;
Protocol Buffers field tags and Avro's schema resolution are the same trick a layer
up.

## Assumptions and requirements

Every protocol assumes a service beneath it and specifies what it adds: TCP assumes
IP, an unreliable datagram service that may drop, duplicate, reorder and delay, and
builds an ordered reliable stream on it. Over a different transport the argument does
not carry.

Integrity assumptions are weaker than people expect. TCP's checksum is a 16-bit ones'
complement sum over header, payload and a pseudo-header: good against ordinary
corruption, useless against a modifying adversary. RFC 9293 states that TCP has no
built-in cryptographic capabilities, so confidentiality and authentication come from
TLS above or IPsec below.

Both parties must agree on a version or be able to negotiate one; with neither, the
only upgrade path is a flag day, impossible at scale. Schema evolution further
assumes fields are optional by default and identified by a stable tag rather than by
position: recycle a retired tag or change a field's type and old readers break; add
a required field and new readers break, because the old writers never wrote it.

## Uses and applicability

Define a protocol when the parties are separately deployed, separately versioned and
cannot be upgraded atomically. Inside a single deployable, do not: a function call is
cheaper, type-checked and refactorable by a tool.

The axis that matters is not protocol versus API but whether the caller can be
rebuilt with you. An in-process API is versioned with the code and changed by
changing the callers and rebuilding; a protocol is a contract with processes you do
not control. Web APIs sit on the protocol side of that line despite the name: an
OpenAPI document describes the paths, operations and response schemas of an HTTP
service, an application contract layered on HTTP, which is the protocol carrying it.
Treating that schema like a function signature is the mistake — you can recompile
callers, but not an app installed on ten million phones.

## Limitations and common mistakes

Postel's robustness principle — be conservative in what you send, liberal in what you
accept — is the most quoted piece of protocol advice and the most contested. RFC 9293
applies it in specific places: a TCP receiver SHOULD NOT shrink its window, but a
sender MUST be robust against a peer that does anyway. Aimed at a named deviation
written into the specification, it is uncontroversial.

As general advice to parsers it has been seriously criticised. Leniency lets a
non-conforming implementation pass its own tests, ship and acquire users; what
everyone must then accept is no longer the specification but whatever the tolerant
implementations allowed. Two lenient parsers that guess _differently_ is a security
bug: HTTP request smuggling is a front end and a back end disagreeing about where a
message ends. The IAB's answer is active maintenance, updating specifications as
implementations diverge, rather than either extreme. This is not settled; what is not
in dispute is that "be liberal" was never a licence to accept anything.

The other recurring failure is specifying only the happy path: silence about an
unexpected message means every implementation invents its own answer, and the answers
disagree.

## Variants and alternatives

**Encoding.** Text (HTTP/1.1, SMTP) is readable and debuggable from a terminal, slow
to parse and easy to under-specify around whitespace. Binary (TCP segments, HTTP/2
frames, Protocol Buffers) is compact and less ambiguous, and opaque without tooling.

**Schema handling.** Schema-first interface definition languages with generated code
— Protocol Buffers, Thrift, Avro — buy compact encodings and mechanical
compatibility rules, costing a build step and a shared schema. Self-describing JSON
or XML gives up size and enforced compatibility for zero build-time coupling.

**Interaction shape.** Request/response RPC (gRPC, JSON-RPC — the Model Context
Protocol is JSON-RPC framing with a typed initialization exchange),
resource-oriented HTTP APIs of the kind OpenAPI describes, and asynchronous event
streams. RPC makes a remote call look local, which is its convenience and its trap.

**Evolution strategy.** A version number in every message is simple and fossilises.
Capability negotiation at connection time — TCP options in the SYN, TLS extensions,
MCP's initialization exchange, where each side states a protocol version and its
capabilities — costs a round trip and buys precise knowledge of the peer. Tag-based
never-break evolution has no version at all and demands that every change be
compatible on its own: cheapest to run, hardest to design.

## History and attribution

Protocols in the packet-network sense come out of ARPANET work in the 1970s. TCP was
documented in RFC 793 in 1981 and served, alongside a pile of companion RFCs, until
RFC 9293 (August 2022) collected them into one specification,
obsoleting 793 and six others — a lifespan that is itself the argument for taking
change rules seriously.

The robustness principle is generally attributed to Jon Postel, who edited the early
TCP specifications; RFC 9293 still invokes it, citing RFC 1122 (Braden, 1989). The
critique is institutional rather than fringe: the IAB published _Maintaining Robust
Protocols_ (Thomson and Schinazi, RFC 9413) in 2023. Schema evolution has several
independent origins in the RPC and serialisation systems of the 1980s and 1990s; a
single attribution would be wrong.

## Sources

**RFC 9293** supplies the worked example: the handshake, the connection states, the
reserved-bit and option rules behind forward compatibility, and the robustness
principle applied to window shrinking. **Designing Data-Intensive
Applications** covers encoding and evolution, including how Protocol Buffers, Thrift
and Avro handle schema change. The **OpenAPI Specification** shows what an
application contract over HTTP contains, and the **Model Context Protocol
documentation** is a current example of negotiated capabilities and a dated version
string.

## Prerequisites and next connections

Nothing here needs more than the fact that programs run in separate processes and
talk over a network; [Operating Systems](./operating-systems.md) covers the sockets
and buffering that decide when your bytes actually leave the machine.
[Automata](./automata.md) supplies the vocabulary for the state machine half —
states, transitions, reachability — and is the page to read next if you want to
_reason_ about a protocol rather than implement one. After that, read a real
specification end to end: RFC 9293 has a counterpart for every section above.
