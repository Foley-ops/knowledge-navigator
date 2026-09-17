---
concept_id: concept.systems.networking
title: Networking
slug: /concepts/networking
aliases:
  - computer networks
kind: concept
tier: 1
review_state: generated-draft
summary: The layered discipline of moving data between machines over a packet-switched, best-effort substrate, where bandwidth can be bought but latency is bounded below by the speed of light.
categories:
  - Programming/Systems
primary_category: Programming/Systems
relationships:
  - type: assumes
    target: concept.systems.operating_systems
    note: The protocol stack below the application lives in the kernel, and sockets, buffering, interrupts and timers are operating-system mechanisms that the network's observable behaviour depends on.
  - type: prerequisite_of
    target: concept.systems.distributed_systems
    note: Every failure model in distributed systems — dropped messages, unbounded delay, the impossibility of distinguishing a slow node from a dead one — is a restatement of what a packet network does and does not guarantee.
  - type: contributes_to
    target: concept.software.apis
    note: A remote API call is an application-layer message carried over TCP, so the API's latency budget, timeout policy and idempotency requirements are inherited from the transport beneath it.
  - type: contrasts_with
    target: concept.systems.parallel_computing
    note: Shared-memory parallelism communicates in tens of nanoseconds while a wide-area round trip costs tens of milliseconds, so an algorithm that is communication-bound on one is fine on the other and the two demand opposite decompositions.
sources:
  - source_id: source.rfc9293.tcp
    title: 'RFC 9293: Transmission Control Protocol (TCP)'
    url: https://www.rfc-editor.org/rfc/rfc9293
    source_kind: reference-documentation
    supports:
      - definition
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
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: IP, routing protocols and DNS specifications
    reason: The registry carries RFC 9293 for TCP but no IP, BGP, OSPF or DNS reference and no networking textbook, so the addressing and routing material here is stated from standard textbook consensus without a citation behind it.
    sections:
      - definition
      - formal-treatment
  - label: The OSI reference model and the origins of packet switching
    reason: No registry source covers ISO's seven-layer model or the pre-TCP history, so those attributions rest on widely repeated accounts rather than on a source cited here.
    sections:
      - history-and-attribution
  - label: QUIC, CUBIC, BBR and the steady-state throughput model for AIMD
    reason: The registry has no source for post-1990s transports or congestion-control algorithms, so the named alternatives and the square-root-of-loss throughput approximation are given without citation.
    sections:
      - formal-treatment
      - variants-and-alternatives
---

## Definition

**Networking** is the engineering of communication between machines that share
no memory. Its organising idea is the **layer**: each offers a service to the one
above and is implemented using the one below, so a change of physical medium does
not change an application. The Internet's layers are the **link** layer (a frame
across one hop — Ethernet, Wi-Fi), the **internet** layer (IP, carrying a packet
across many hops between globally routable addresses), the **transport** layer
(TCP or UDP, demultiplexing to a process by port number and optionally adding
reliability), and the **application** layer (HTTP, DNS, SSH, whatever you write).
The substrate is **packet switching**: data is cut into packets, each carrying a
destination address and forwarded independently, with no circuit reserved in
advance.

## Why it matters

Once a program's data lives on another machine, a call can be lost, arrive
twice, arrive very late, or succeed while its reply is lost — and from the
caller's side none of these are distinguishable. Networking is where those
possibilities are created and partly tamed, and it matters because the taming is
leaky: TCP hides packet loss but cannot hide delay, so the physics reaches up
through every abstraction and surfaces as a timeout policy, a retry, an
idempotency key, a cache. Kleppmann's framing is that a distributed system's hard
problems are network problems wearing different clothes.

## Intuition

The postal service is the honest analogy. You hand over separately addressed
envelopes; the carrier promises to try, not to succeed; two posted in order may
arrive out of order. TCP is what you build on top when you want a book
delivered: number the pages, keep a copy until each is acknowledged, resend what
goes unacknowledged, slow down when the post office looks congested. That is
OSTEP's framing — the fundamental service is unreliable, and reliability is a
library built over it from acknowledgements, timeouts and sequence numbers.

The analogy breaks twice. Post has no congestion control, where senders
voluntarily cut their own rate for the shared good of the network. And postal
delay is dominated by handling, whereas network delay has an irreducible
component set by distance and the speed of light.

## Concrete example

New York to London is about 5,570 km great-circle. Light in fibre travels at
roughly $c/1.47 \approx 2.0 \times 10^8$ m/s, so one way cannot beat 27 ms and
the round trip cannot beat about 55 ms. Real paths are not great circles and add
switching delay, so 70 ms is a realistic round-trip time (RTT).

Fetch a 1 MB file over a 100 Mbit/s link with that RTT. Pushing the bits out takes
$8.39 \times 10^6 / 10^8 \approx 84$ ms. But TCP does not start at full rate:
with an initial window of 10 segments of 1460 bytes doubling each RTT, cumulative
segments go 10, 30, 70, 150, 310, 630, 1270, and 1 MB is about 718 segments — so
seven round trips of data, plus one for the TCP handshake and one for TLS 1.3.
That is roughly $9 \times 70 = 630$ ms against 84 ms of transmission. Upgrading
to 1 Gbit/s changes almost nothing; moving the server to the same continent
nearly halves the time. (An initial window of 10 is a deployed convention, not
part of TCP's definition, and this ignores overlap between windows.)

Sockets expose the layering directly:

```python
import socket

tcp = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  # IPv4 + reliable stream
udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)   # IPv4 + datagrams
tcp.connect(("example.com", 80))
print(tcp.getsockname(), tcp.getpeername())
    # ('192.0.2.11', 51544) ('203.0.113.7', 80)  -- documentation addresses
tcp.close()
```

Those four values plus the protocol are the 5-tuple that identifies the
connection at both ends.

## Formal treatment

IP provides a **best-effort datagram** service: a packet may be dropped,
duplicated, reordered or delayed arbitrarily. A router forwards by
**longest-prefix match** of the destination address against a forwarding table
built by routing protocols; forwarding is hop-by-hop and destination-based, so no
router knows the whole path.

TCP turns that into a reliable, ordered byte stream over a connection identified
by the 5-tuple. Bytes carry a 32-bit sequence number; the receiver returns a
**cumulative acknowledgement** naming the next byte it expects. A sender holds
unacknowledged data and retransmits on a **retransmission timeout** derived from
a smoothed RTT estimate and its variance, or earlier on duplicate
acknowledgements. Two windows bound the data in flight, and with it the rate:

$$
\text{in flight} \;\le\; \min(\mathit{cwnd},\, \mathit{rwnd}),
\qquad
\text{throughput} \;\le\; \frac{\min(\mathit{cwnd}, \mathit{rwnd})}{\mathrm{RTT}},
$$

where $\mathit{rwnd}$ is flow control — the receiver's advertised buffer space —
and $\mathit{cwnd}$ is congestion control, the sender's estimate of what the path
will bear. Filling a path therefore needs a window of at least the
**bandwidth-delay product** $B \cdot \mathrm{RTT}$. Classical congestion control
is **slow start** ($\mathit{cwnd}$ doubles per RTT) followed by **AIMD**:
additive increase of about one segment per RTT, multiplicative decrease
(halving) on loss. In steady state with loss rate $p$, a standard approximation
gives throughput $\approx C \cdot \mathrm{MSS} / (\mathrm{RTT}\sqrt{p})$, falling
as $1/\mathrm{RTT}$ and as $1/\sqrt{p}$.

The asymmetry to keep: $B$ is an engineering parameter, raised by adding fibre,
wavelengths or links, while $\mathrm{RTT} \ge 2d/v$ is a physical floor.

## Assumptions and requirements

TCP's guarantees hold only under stated conditions. Ordering holds **within one
connection**, not across connections or a reconnect, and the byte stream has no
message boundaries — code assuming one `send` becomes one `recv` relies on
something TCP never promised. Sequence-number arithmetic is modular and assumes
wraparound is slower than the maximum segment lifetime, which on a fast path is
what the timestamp option (PAWS) defends. Window scaling is a separate need —
the 16-bit window field caps the advertised window at 64 KiB, well below a fast
path's bandwidth-delay product — and the larger windows it permits are what make
wraparound fast enough to matter. Reliability assumes the connection survives:
after a reset, TCP reports failure and says nothing about how much of the last
write the peer processed.

Congestion control assumes loss signals congestion; on a lossy wireless link the
loss is often corruption and the sender needlessly halves its rate. It also
assumes participants cooperate, since a flow ignoring AIMD simply gets more
bandwidth — congestion control is as much a social arrangement as an algorithm.
Finally the network is **asynchronous**: delay has no bound, so a timeout is a
guess trading false failure detection against slow detection.

## Uses and applicability

Reach for TCP whenever a complete, ordered byte stream is what you want and
retransmission is cheaper than loss — file transfer, database protocols, HTTP/1
and HTTP/2, RPC. Reach for UDP when the application can do better than a
general-purpose transport: when late data is worthless (voice, video, games),
when one datagram is the whole exchange (DNS), or when you are building your own
reliability on top.

The design rule that follows from the physics is to count round trips, not bytes:
batch, pipeline, cache, colocate. A protocol needing five sequential round trips
is slow in a way no bandwidth purchase fixes.

## Limitations and common mistakes

The first mistake is treating TCP's reliability as application reliability. TCP
acknowledges receipt into a kernel buffer, not processing by your program; if the
peer crashes after acknowledgement the work is lost and your `write` returned
success. Exactly-once semantics live above TCP, in idempotency keys and
deduplication, never in the transport.

The second is confusing bandwidth with latency. "Our link is 10 Gbit/s" says
nothing about a chatty protocol, and bufferbloat makes it worse: oversized router
queues convert available bandwidth into latency, so a saturated link can show
RTTs of seconds at full throughput.

The third is believing the OSI seven-layer model describes the Internet. It does
not. It is a taxonomy from a competing protocol family, useful for vocabulary —
"layer 7 load balancer", "layer 2 switch" — and misleading as architecture: the
Internet stack has four layers by specification, five if the physical medium is
counted separately, and TLS, tunnels and QUIC fit no OSI slot cleanly.

A fourth is assuming a failed request did not happen. A lost reply is
indistinguishable from a lost request, so every retry must be safe to repeat.

## Variants and alternatives

**UDP** is the minimal alternative to TCP: ports and a checksum, no ordering, no
reliability, no congestion control. **QUIC** rebuilds TCP's services in user
space over UDP, with encryption integral and per-stream loss recovery that avoids
head-of-line blocking across multiplexed streams, at the cost of CPU and kernel
offloads. Congestion control itself varies — loss-based AIMD in the Reno family,
CUBIC, and delay- or rate-based schemes such as BBR — with different fairness and
bufferbloat behaviour. Above the transport, **RPC** frameworks hide sockets
behind function calls, which OSTEP notes buys convenience by hiding exactly the
failures that matter. In the datacentre, **RDMA** bypasses the kernel and the IP
stack for microsecond latency, trading generality for speed.

## History and attribution

Packet switching has several independent origins in the early 1960s, worked out
separately on both sides of the Atlantic, in the contexts of survivable military
communication and of sharing expensive computers. TCP comes from Cerf and Kahn's
internetworking work in the 1970s, and the decision the rest follows from is the
later split of that design into IP (addressing and forwarding) and TCP
(reliability), which is what lets a simple unreliable core carry many transports.
TCP was specified in RFC 793 in 1981 and accumulated corrections for four decades
before RFC 9293 consolidated them in 2022 — a revision history that is itself
evidence of how much of a protocol is learned in deployment. ISO standardised the
OSI model in parallel, as part of a competing suite that lost; its vocabulary
survived its protocols.

## Sources

RFC 9293 is the normative specification of TCP: segment format, state machine,
window mechanics, and the obligations of sender and receiver. Kleppmann's
_Designing Data-Intensive Applications_ is the best treatment of what unreliable
networks do to system design — timeouts, unbounded delay, and why a slow node
cannot be told from a dead one. _Operating Systems: Three Easy Pieces_ covers the
kernel side and builds reliability from scratch over UDP, the clearest way to see
what TCP is doing.

## Prerequisites and next connections

Read [Operating Systems](./operating-systems.md) first or alongside: sockets,
buffers, interrupts and scheduling are where the stack is implemented, and
several puzzling network behaviours are really kernel buffering.
[Graph Algorithms](./graph-algorithms.md) supplies the shortest-path machinery
behind routing protocols, though real routing adds policy and partial information
that shortest paths do not model.

This page comes before distributed systems, where the failure model becomes the
subject rather than the substrate, and before anything about remote APIs.
Afterwards, [Go](./go.md) is a language whose concurrency model was shaped by
writing network servers, and [Python](./python.md) runs the socket example above
unchanged.
