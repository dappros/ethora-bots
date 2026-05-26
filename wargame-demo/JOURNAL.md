# AI Wargames Demo — Build Journal

A working log of the AI Wargames demo built on the Ethora platform: multiple
persona-driven AI agents (historical/fictional generals plus a Game Master)
play out a tactical scenario turn-by-turn inside a chat room, with spectators
watching live.

The point of this demo is twofold:

1. **Show what Ethora's multi-agent chat can do** — distinct AI personas with
   their own avatars, voices, and decision styles, conversing inside a single
   chat room with structured turn-taking, all wired together via Ethora's
   public MCP and REST APIs.
2. **Be genuinely interesting to watch.** Wargames played by famous generals
   are a popular thought experiment — "what would Hannibal do at Stalingrad?"
   "how would Sun Tzu read a modern flashpoint?" — and a multi-agent chat
   makes that thought experiment something you can run, replay, and share.

v1 ships one historical scenario (Cannae 216 BCE — Hannibal vs Varro) with
three agents (two generals + Game Master). Later iterations add more
scenarios, multi-unit command structures, and human players sharing the
room with the AI participants.

Entries below are reverse-chronological. Keep them short, factual, and
public-safe (no customer names, internal hostnames, or test credentials —
this directory is in a public repo).

---

## 2026-05-26 — Upstream contribution: MCP CLI gating fields

While preparing to provision the demo agents entirely via Ethora's MCP CLI,
we hit a small but real gap: the `ethora-agents-create-v2` and
`ethora-agents-update-v2` MCP tools didn't expose three Agent fields that
the underlying REST API already accepted —

- `responseMode` (`always` | `mentioned` | `smart` | `probability`)
- `responseProbability`
- `cooldownSec`

These control *when* an agent decides to speak in a room. For the wargame we
specifically need `responseMode: 'mentioned'` on all three agents so each one
only speaks when @-mentioned by another participant — that's how the turn
order is enforced without any extra orchestration code.

Rather than work around it by calling REST directly, we added the fields to
the MCP CLI schemas (a few-line change in `ethora-mcp-cli/src/tools.ts` and
the matching API client types). Now any future project that wants to
configure agent gating from Claude / Cursor / any MCP client can do it
in one call. Small surface fix, broadly useful.

## 2026-05-26 — Platform survey

Quick survey of what Ethora already provides for "AI agents that participate
in a chat room as personas." Takeaway: most of what we need is already
there, which keeps v1 focused on prompt design and scenario authoring
rather than building infrastructure.

What we found:

- **`Agent` + `BotInstance` data model.** An `Agent` is a reusable persona
  with `displayName`, `avatarUrl`, system prompt, LLM config, response gating
  (`responseMode`, `cooldownSec`, etc.), RAG hooks, and a Soul.md
  self-evolving identity doc. A `BotInstance` is the per-app embodiment
  that binds an `Agent` to a real XMPP user inside a tenant. Created
  lazily when an agent is invited into a chat.
- **AI service drives bots over XMPP.** A separate `ai-service` runs each
  bot as an XMPP client and listens to room traffic. Outbound messages are
  tagged with a custom `<x xmlns="urn:ethora:bot">` element so other bots
  can identify bot-authored messages (used for loop prevention).
- **Response gate handles multi-bot conversation.** Bots are explicitly
  *allowed* to reply to each other — not hard-blocked — but with damping:
  cooldowns are multiplied for bot-to-bot replies, and after several
  consecutive bot turns the room pauses briefly to give humans a chance
  to speak. Crucially, **a direct @-mention bypasses that pause** — which
  is what lets us drive a clean turn order purely through prompts.
- **MCP CLI covers the provisioning surface.** Creating apps, chat rooms,
  agents, and inviting agents into rooms are all single MCP tool calls.
  That makes the whole demo bootstrap something Claude (or any MCP client)
  can do from a chat session — itself a nice demonstration of the
  platform's reach.

The one piece the platform *doesn't* give us is structured turn-taking
between agents — the response gate is reactive, deciding per-message
whether each bot should reply. For v1 we get a clean turn order entirely
through prompt design: every agent message ends with an @-mention of the
next speaker, and the Game Master sits in the middle of the loop as the
arbiter.

## 2026-05-26 — Project kickoff & v1 scope

Decided to build a chat-based wargames simulator on Ethora as a demo
project. The pitch: deploy multiple AI agents into a single chat room,
each one a "general" representing a side in a conflict, plus a Game Master
agent acting as arbiter. Generals take turns describing their tactical
decisions in character; the GM evaluates each move for realism and
resource constraints, maintains a running battle log, and declares the
outcome. Spectators watch the whole thing unfold live.

What makes it interesting beyond the toy:

- **Persona-driven decisions.** Because each general has a distinct system
  prompt patterned on a historical commander (or a fictional archetype),
  the same scenario plays out differently depending on who you cast.
  Hannibal vs Varro reads very differently from Hannibal vs Scipio.
- **Game-theory / military-analysis use case.** History buffs, strategy
  educators, and military analysts get a low-cost way to play out
  hypothetical engagements with consistent personalities on either side.
- **Showcases multi-agent chat on Ethora.** Most "AI in chat" demos have
  one bot. This puts three (later more) in the same room with distinct
  identities and a structured conversation pattern, on the same
  platform customers can use for any chat product.

v1 scope deliberately kept small:

- **One scenario:** Cannae 216 BCE — Hannibal vs Varro. Picked because
  it's well-documented, historically decisive, has clean force structures
  and terrain, and avoids any modern-politics sensitivity.
- **Three agents:** `Hannibal`, `Varro`, `GameMaster`. Short single-word
  display names so @-mention matching is reliable.
- **No new backend code.** Turn-taking is handled by the existing response
  gate plus careful prompt design — every agent message ends with an
  @-mention of the next speaker, and the Game Master drives the loop.
- **State tracking via the Game Master.** GM maintains a structured battle
  log (turn number, forces remaining per side, terrain held, time
  elapsed) in its prompt context and re-emits it each turn. No new
  database schema for v1.
- **Provisioned entirely via Ethora's MCP CLI.** The bootstrap (create
  app, create room, create three agents, invite them into the room) runs
  as a sequence of MCP tool calls — itself a demo of MCP-driven
  platform automation.

Later iterations: more scenarios (including a near-future Baltic
flashpoint with fictional callsigns rather than naming real officials),
multi-unit command structures (multiple agents per side, each commanding
a division), and human players sharing the room with the AI generals.
