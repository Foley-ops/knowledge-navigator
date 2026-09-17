---
concept_id: concept.software.model_context_protocol
title: Model Context Protocol
slug: /concepts/model-context-protocol
aliases:
  - MCP
kind: concept
tier: 1
review_state: generated-draft
summary: An open client-server protocol, carried over JSON-RPC, that lets a host application discover and use tools, data and prompt templates offered by separate servers on behalf of a language model.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: specializes
    target: concept.software.protocols
    note: MCP is one application-layer protocol among many, fixing a particular wire format, role split and version negotiation for the general pattern.
  - type: contrasts_with
    target: concept.software.containers
    note: Both are invoked when people talk about running a tool server safely, but a container bounds what a process can reach while MCP constrains only the messages on the wire.
  - type: contributes_to
    target: concept.ml_engineering.deployment
    note: Exposing a model-facing capability through MCP turns it into a service that has to be shipped, versioned and operated like any other deployed process.
sources:
  - source_id: source.modelcontextprotocol.specification
    title: Model Context Protocol documentation
    url: https://modelcontextprotocol.io
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.openapi.specification
    title: OpenAPI Specification
    url: https://spec.openapis.org/oas/latest.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kleppmann.data_intensive_applications
    title: Martin Kleppmann, Designing Data-Intensive Applications
    url: https://dataintensive.net/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: JSON-RPC 2.0 Specification
    reason: MCP's wire format is JSON-RPC 2.0, but the registry has no entry for that specification, so the message shapes and error semantics here are stated as the MCP documentation describes them rather than from the normative JSON-RPC document.
    sections:
      - formal-treatment
      - concrete-example
  - label: Empirical literature on indirect prompt injection against tool-using language models
    reason: No registry source studies attacks in which content returned by a tool is followed by the model as instruction; the treatment here rests on the MCP documentation's own security guidance rather than on measured attack results.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
---

## Definition

The **Model Context Protocol** is an open specification for how a host
application driving a language model connects to separate processes or services
that supply capability. It is a client-server protocol carried over JSON-RPC
2.0. A server offers three primitives — **tools** (functions with a JSON Schema
for their arguments, which the model may call via `tools/call`), **resources**
(data named by URI, fetched with `resources/read`) and **prompts** (templates a
user may invoke with `prompts/get`) — and the client discovers what is on offer
at connection time, not compile time.

MCP standardises the wire format, the lifecycle and the shape of those
primitives — and nothing about what a server does when called, what it may
reach, or whether anything it says is true.

## Why it matters

Before a shared protocol, every host application that wanted a model to read a
repository, query a database or file a ticket wired that integration into its
own tool-calling format. With $N$ applications and $M$ integrations the work is
$N \times M$, and what is built for one client is worthless to the next. MCP
makes the integration a separate artifact: write the server once, and any
conforming client can use it.

The second thing it buys is runtime discovery: a host connects, calls
`tools/list` and puts what comes back into the model's tool schema, and a server
can add a tool without either side being redeployed.

## Intuition

The protocol's own analogy is a universal port: one connector instead of a
drawer of adapters. It breaks where it matters: a cable negotiates with
hardware that cannot lie about what it is, while an MCP server's
self-description is free text that lands in the model's context window and can
be written to manipulate it.

The better mental model is the Language Server Protocol, which MCP openly takes
after: one editor speaks one protocol to many language servers, and does not
know Rust, only the protocol. Replace the editor with a model host and "go to
definition" with "call this tool" — except that the consumer is a model, so
descriptions are written to be read rather than compiled.

## Concrete example

A client connects to a weather server over stdio and lists its tools:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/list" }
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_forecast",
        "description": "Three-day forecast for a latitude/longitude.",
        "inputSchema": {
          "type": "object",
          "properties": { "lat": { "type": "number" }, "lon": { "type": "number" } },
          "required": ["lat", "lon"]
        }
      }
    ]
  }
}
```

The host hands that schema to the model; the model emits a call and the server
answers:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": { "name": "get_forecast", "arguments": { "lat": 51.5, "lon": -0.13 } }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "Wed 14C rain, Thu 17C cloud, Fri 19C sun" }],
    "isError": false
  }
}
```

Note that the text in the last message goes straight into the model's context,
and nothing in the protocol distinguishes it from an instruction.

## Formal treatment

**Messages.** Three JSON-RPC 2.0 forms are used: a request (`method`, optional
`params`, an `id`), a response (the same `id`, and `result` or `error`), and a
notification (a `method`, no `id`, no reply).

**Lifecycle.** Protocol versions are dates — `2024-11-05` was the first, then
`2025-03-26`, `2025-06-18` and later revisions — not semantic version numbers.
In the revisions the specification now calls _legacy_ (`2025-11-25` and
earlier), the client opened with `initialize`, sending the protocol version it
wanted, its capabilities and its name; the server replied with the version it
would actually use and its own; the client then sent
`notifications/initialized`, and normal traffic flowed. The current revision,
`2026-07-28`, removes that handshake and makes MCP stateless: every request
declares its own `io.modelcontextprotocol/protocolVersion`,
`io.modelcontextprotocol/clientCapabilities` and `clientInfo` in `_meta`, and
the server accepts or rejects each request independently, answering a version it
does not implement with `UnsupportedProtocolVersionError` listing the ones it
does. A client that wants to choose up front calls `server/discover`, an RPC
every server must implement, which returns supported versions, capabilities and
identity in one request.

**Capability negotiation.** Each side declares the optional features it
supports — once in the handshake under the legacy revisions, on every request
under `2026-07-28`. A server advertises `tools`, `resources`, `prompts`,
`logging` or completion, with sub-flags such as `listChanged` and `subscribe`; a
client advertises `roots` (filesystem boundaries it exposes), `sampling` (a
model completion run on the server's behalf) and, from 2025-06-18, `elicitation`
(structured input from the user). Anything not declared must not be used — this
is how one version serves implementations of differing ambition. As of
`2026-07-28` Roots, Sampling and Logging are deprecated, and a server no longer
asks the client anything on its own initiative: what it needs comes back inside
an `InputRequiredResult` whose `inputRequests` the client answers by retrying
the original call with `inputResponses` — the Multi Round-Trip Requests pattern.

**Transports.** Over **stdio** the client launches the server as a subprocess
and exchanges newline-delimited JSON on its stdin and stdout, leaving stderr for
logging. Over **Streamable HTTP** the client POSTs to one endpoint and receives
a JSON response or a server-sent-event stream scoped to that request, every POST
carrying an `MCP-Protocol-Version` and `Mcp-Method` header — and `Mcp-Name` when
it names a tool, resource or prompt — that must match the body. An
`Mcp-Session-Id` header carried server-assigned sessions from `2025-03-26`
through `2025-11-25`; `2026-07-28` removed protocol-level sessions along with
the standalone GET stream and `Last-Event-ID` resumability, told servers to
ignore that header and neither mint nor echo session IDs, and moved long-lived
change notifications onto the response stream of a `subscriptions/listen`
request. A server needing state across calls mints an explicit handle and takes
it back as an ordinary tool argument. The message layer is transport-agnostic,
so custom transports are permitted.

## Assumptions and requirements

The protocol assumes the model can be handed JSON-Schema-typed functions and
will choose sensibly among them; it inherits whatever the model is or is not
good at.

It assumes the host obtains user consent. The specification is explicit that
hosts must get approval before invoking a tool and must not transmit resource
data elsewhere without consent; separately, servers must not accept or pass
through tokens that were not issued for them, and clients must bind a token to
one server with RFC 8707 resource indicators — obligations on the implementer,
not properties the wire format enforces. Drop that and an agent takes irreversible actions unsupervised.

It assumes the server is trusted code: running a stdio server means running a
program with your user's privileges. For HTTP transports the specification
requires validating the `Origin` header and binding local servers to localhost
to blunt DNS rebinding, and remote servers use an OAuth-based authorization
framework that binds tokens to a specific server. Drop the trusted-code
assumption and the protocol gives you no recourse.

## Uses and applicability

Reach for MCP when the same capability should serve more than one host
application, when the integration is maintained by a different team or vendor
than the client, or when the tool set should be discoverable at runtime. It
suits local capability — a filesystem, a database, a build system — because the
stdio transport needs no network.

Do not reach for it when one application calls one function it already owns: a
process boundary, a handshake and a serialisation format around an in-process
call buy nothing. It fits badly where the interaction is not request-response
over a short horizon — a long-running job wants a queue.

## Limitations and common mistakes

The worst mistake is reading MCP as a security boundary; it is a calling
convention. Tool descriptions and tool results are untrusted text that
enters the model's context, so a hostile server can steer the model and a benign
server can relay an attack: a fetched web page or an issue comment containing
instructions is indirect prompt injection, and a model with a shell tool may act
on it. A server holding credentials for a downstream API is a confused deputy —
it acts for whoever asks. Treat installing a server as installing software, and
put the isolation somewhere real.

The second is forgetting the network. As Kleppmann puts it for RPC generally, a
remote call fails in ways a local call cannot: timeouts, partial execution,
retries that duplicate effects. A tool that charges a card needs idempotency the
protocol does not supply.

The third is context cost. Every tool description on every connected server is
tokens in every request; thirty tools across five servers degrade tool
selection, and no namespacing rule stops two servers both offering `search`.

The fourth is assuming uniformity: revisions changed real things — HTTP+SSE was
replaced by Streamable HTTP — so deployed implementations speak different dates.

## Variants and alternatives

Within MCP the meaningful choice is transport: stdio for a local subprocess,
Streamable HTTP for a remote service, or an in-process adapter when a host wants
the same server code without a process boundary.

Outside it, the direct competitor is the model provider's own function-calling
interface, where the application declares functions inline and executes them
itself: less machinery, no reuse. Describing an existing HTTP API with an
OpenAPI document and generating tools from its schemas reuses a contract you may
already maintain, but is HTTP-only and one-directional, with no server-initiated
messages or subscriptions. Conventional RPC frameworks handle the same
encoding-and-evolution problem for service-to-service traffic and are better at
throughput, but carry no model-facing descriptions. Agent-to-agent protocols
address a different layer and compose with MCP rather than replacing it.

## History and attribution

MCP was introduced by Anthropic in November 2024, released as an open
specification with reference implementations and SDKs, its first revision dated
`2024-11-05`. The problem was concrete: model hosts were accumulating bespoke,
unshareable integrations. The design borrows its client-server structure and
capability handshake from the Language Server Protocol, which solved the same
combinatorial problem for editors a decade earlier.

Revisions through 2025 replaced the HTTP+SSE transport with Streamable HTTP and
added an authorization framework for remote servers. Development happens
publicly, with contributors beyond Anthropic. Adoption grew quickly, but it
remains a young standard: interoperability is uneven and the security model is
still being worked out.

## Sources

The Model Context Protocol documentation is the normative reference, and the
only one here for the primitives, lifecycle, transports and the specification's
own security requirements. The OpenAPI Specification stands for
the alternative route, a declarative schema-based description of an HTTP API.
Kleppmann's _Designing Data-Intensive Applications_ gives the general account of
remote procedure calls and their failure modes, which apply to MCP as to any
other RPC.

## Prerequisites and next connections

Nothing deep is required first: a request-response exchange over JSON, and the
idea that a subprocess speaking on stdin and stdout can connect two programs, is
enough. The process and privilege machinery behind the stdio transport is
[Operating Systems](./operating-systems.md) material.

Next steps are practical. The official SDKs span ten languages — the two
released at launch, [TypeScript](./typescript.md) and [Python](./python.md),
alongside C#, Go and Rust among the most complete — and reading one shows
the primitives becoming a few lines of server code. The harder direction is
security: how a host safely exposes real capability to a model is open, and MCP
defines the interface for that question without answering it.
