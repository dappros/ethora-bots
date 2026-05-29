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

## 2026-05-29 — Narva 2027 run-01: outcome plausible, multi-allied design half-broken

First end-to-end run of Scenario C played out cleanly start to finish in
about four and a half minutes wall-clock. Full transcript at
[`transcripts/2026-05-29-narva-2027-run-01.md`](transcripts/2026-05-29-narva-2027-run-01.md).
Backend was still on `2605` — the mention-matcher fix on `2606` had not
been deployed to QA yet — so the prompt-level hygiene was carrying alone.

**What worked.**

- **Doctrinally plausible outcome.** GM declared a controlled limited-
  war stalemate. NATO + Estonia contained the Russian incursion; Article
  5 invoked around hour 24 of incident (a realistic timeline); VJTF
  spearhead arriving in 12 hours, follow-on 24-36 hours; Suwałki Gap
  preserved throughout as the reinforcement artery; civilian evacuation
  completed under stress; Russian forces held the Narva bridgeheads but
  never expanded. The limited-warfare envelope held — no breakout.
- **Personas held in character.** Russia stayed disciplined and on
  rationale, NATO spoke in proper alliance-staff brevity (VJTF, eFP,
  NAC, weapons-tight), Estonia maintained sovereign-defense framing,
  doctrinal vocabulary throughout (NASAMS, IRIS-T, Iskander, 76th
  Guards VDV, Multinational Division Northeast, etc.).
- **Hygiene rules held.** Opening disclaimer delivered as written, no
  drift into political invective from any side, Russia's persona
  articulated the stated rationale without endorsing it outside the
  exercise. The GM never broke neutrality.
- **GM situation-log structure held.** Every turn block was emitted in
  the documented format with all fields updated.

**What didn't.**

The mention-matcher issue we saw with Hannibal in Cannae hit much harder
in a five-agent room. Message tally by speaker:

| NATO | Estonia | Russia | BalticAllies | GameMaster | Human |
|---|---|---|---|---|---|
| 16 | 9 | 5 | **1 (join notice only — zero in-character moves)** | 13 | 1 |

Two distinct failure modes from the same underlying cause:

1. **NATO and Estonia over-fired.** The display names "NATO" and "Estonia"
   appear in nearly every message in any prose about this scenario —
   "NATO Air Policing," "Estonian 1st Brigade," "NATO doctrine," and so
   on. With `@` optional in the matcher, every prose mention triggered
   a reply. NATO ended up at 16 messages including writing situation-log
   blocks itself (impersonating the GM), a persona drift caused by the
   over-firing — it saw so many GM-style outputs that it started copying
   the format.
2. **BalticAllies *under*-fired and was silent for the whole scenario.**
   The display name "BalticAllies" is one word, not two, so prose
   references like "Baltic allies" or "Latvian and Lithuanian forces"
   never match it. After its initial join notice it never spoke. One of
   the demo's headline differentiators — multiple allies on the same
   side, each making distinct decisions — was structurally invisible in
   this run.

**Loop didn't terminate at the 12-turn cap either.** GM ran to "TURN 15"
before concluding. Most likely the NATO-as-imposter-GM situation logs
disrupted the GM's own turn counter, since both bots were emitting
TURN-N blocks.

**What this run validates and what it implies for next steps.**

- The mention-matcher fix on `2606` is exactly the right fix and would
  resolve cause #1 directly (no more prose-triggered firing). For
  cause #2, the same fix is *also* the right answer — once every bot
  fires only on literal `@<Name>`, the GM's turn discipline cleanly
  rotates through all four commanders including BalticAllies. The fix
  makes the multi-allied design work as designed.
- **Cutover to deploy `2606` to QA is now the gating step** before any
  meaningful next run of Narva or any other 4+-agent scenario.
- **Smaller prompt fix worth adding:** every commander prompt should
  include "do NOT write the situation log; that is the GameMaster's
  role exclusively" — guards against the NATO-impersonating-GM drift
  even if the matcher fix lands. Will fold this into RECIPE.md.
- The five-agent multi-allied shape is sound *as a design* — Russia's
  prompt did exactly what we wanted (stayed disciplined, only spoke on
  explicit handoff). The remaining work is operational (deploy the
  fix), not design.

The scenario's analytical value showed through despite the structural
glitch: the GM's eval text, the Article 5 process tempo, the Suwałki
Gap framing, and the Russia-as-disciplined-operator persona all came
across well. Worth re-running once `2606` is in QA to get a clean
five-agent transcript with BalticAllies actually participating.

## 2026-05-26 — Scenario C provisioned: Narva 2027 (Article 5 contingency)

Third scenario, and first with the multi-allied agent shape. Pinned room
**"Narva 2027 — Wargame"** in the same app. Five agents:

- `Russia` — Commander of the fictional task force conducting a limited-
  objective operation against Narva and the Russian-speaking enclave in
  Ida-Virumaa under a stated "peacekeeping" pretext.
- `NATO` — SACEUR at SHAPE. Strategic level, NAC consultation, Article 4
  → 5 process, weapons release authority within NATO doctrine.
- `Estonia` — Commander of Estonian Defence Forces in Tallinn. Tactical
  national defense, sovereignty-conscious, fast decision cycle, civilian
  evacuation of Narva as humanitarian priority.
- `BalticAllies` — Latvian and Lithuanian joint coordinator. Suwałki
  Gap status, hybrid-threat defense, host-nation support to reinforcing
  allies.
- `GameMaster` — same arbiter role; situation log expanded to track
  Article 5 process step, Suwałki Gap status, and civilian evacuation
  in addition to forces and escalation rung.

**Why named actors here when Anchor Strait was abstracted.** Narva is a
widely-studied defense-planning contingency in NATO and allied
literature (RAND, CEPA, national wargames). Unlike Anchor Strait — a
deliberately abstract scenario for pure escalation-mechanics study —
Narva needs its real geography (the bridge crossings, the road to
Tallinn, the Russian-speaking population concentration, the Suwałki
Gap) and Article 5 political stakes to be analytically meaningful.
Abstracting it would lose the point.

**Hygiene around real actors.** Stricter rules than the other scenarios:

- GM opens with an explicit "fictional analytical defense-planning
  exercise, not a prediction, advocacy, or propaganda" disclaimer.
- All four commander personas reference role titles only; no specific
  living individuals named.
- The Russia persona articulates the stated political-military
  rationale within their own POV (standard wargame practice — a
  commander states their orders honestly) but is explicitly forbidden
  from advocating it personally or claiming it factually outside the
  exercise.
- GM rule: redirect any participant drifting into political invective
  or moral grandstanding back to operational specifics. Same realism
  standard applied to all sides.

These hygiene rules are documented in RECIPE.md §7 as the template for
any future scenario that names real-world actors.

**Multi-agent rhythm.** Turn order GM-enforced: `@Russia` moves → GM
eval → `@NATO` (alliance political) → `@Estonia` (tactical defense) →
`@BalticAllies` (regional posture, Suwałki Gap, hybrid threats) → GM
eval of the combined coalition response → back to `@Russia`. About
six messages per cycle. Will be the most demanding test yet of the
mention-matcher fix on `2606` (or the prompt-level redundancy on
`2605`) — five agents in one room means a lot of opportunity for
cross-mentions in prose.

Scenario A (Cannae) and Scenario B (Anchor Strait) are unchanged in
their own rooms. All three live in the same app.

## 2026-05-26 — Scenario B provisioned: Anchor Strait (Baltic, fictional)

Second scenario is now live in the same app as Cannae, in its own pinned
room **"Anchor Strait — Wargame"**. Three new agents:

- `North` — Maritime Component Commander of the fictional "Northern
  Coalition," a destroyer-squadron-plus-light-carrier surface action
  group conducting a freedom-of-navigation transit through a contested
  Baltic strait. NATO-style brevity, escalation-control-minded.
- `East` — Joint Defense Sector Commander of the fictional "Eastern
  Republic," coastal missile regiment + integrated air defense +
  tactical fighters + corvettes on and around the disputed island.
  Formal diplomatic-military register, defensive-sovereignty framing.
- `GameMaster` — same arbiter role as Cannae, but the situation log
  tracks ROE status, escalation rung, and civilian-shipping risk in
  addition to force counts.

**Framing.** Deliberately analytical and deliberately fictional. The
disputed island, the two state actors, the political context, and the
date (14 October 2026) are all invented. The opening prompt forces the
GameMaster to disclose "this is a fictional analytical exercise" before
the scenario brief and to reject any in-character attempt to map
participants to real-world states or leaders. Persona prompts forbid
the commanders from claiming alignment with any real-world military.
Worth keeping this hygiene for any future modern-period scenarios — the
demo is more interesting and more defensible when it's clearly a
sandbox for escalation-dynamics analysis rather than political theatre.

**Mention-matcher.** GameMaster's prompt now explicitly instructs it to
use generic prose labels ("the Northern Coalition commander" / "the
Eastern Republic commander") in evaluations and reserve "@North" /
"@East" for handoff sentences only. This is a defence in depth — the
backend fix on `2606` does the same thing at the regex level — but the
prompt-level redundancy keeps the scenario robust on `2605` installs.

Both scenarios documented in [`RECIPE.md`](RECIPE.md): Cannae as
Scenario A (§4.1-4.3), Anchor Strait as Scenario B (§4.4-4.6).
Anchor Strait simulation is ready to kick off with
`@GameMaster, begin the Anchor Strait simulation.` — no further
provisioning needed. Run-01 transcript to be saved under
`transcripts/` once it plays out.

## 2026-05-26 — Platform fix: bot-authored mentions now require literal @

The turn-hijacking issue surfaced by Cannae run-01 is now fixed upstream
in `ai-service/src/responseGate.ts`. The mention matcher takes a new
`fromBot` flag; for bot-authored messages it requires literal `@`, while
human-authored messages keep the forgiving bare-name match so end-user
UX is unchanged. Mirrors the existing bot-to-bot damping in the gate
(cooldown 2x, probability 0.6x) — same "treat bot-to-bot stricter than
human-to-bot" philosophy already wired in. Six-line change in
`isMentioned`, plus updates to four call sites to pass `message.fromBot`.

Ships on a new `2606` release branch (June iteration) on both
`ethora-backend` and `ethora-monoserver`. Cut from `2605` rather than
landing on the current YYMM, so the May line stays stable.

Adds `services/ai/ai-service/src/responseGate.test.ts` covering nine
cases (empty text, `/bot` literal, human @Name and bare-name matches,
non-boundary substring exclusion, bot @Name match, bot bare-name
rejection, case-insensitivity, regex-metacharacter escaping). The
service had no test runner wired in; the file compiles alongside the
source and runs with `npm run build && node --test dist/responseGate.test.js`.

Worth doing a Cannae run-02 once 2606 reaches QA to confirm the
turn-rhythm now plays out evenly between Hannibal and Varro.

## 2026-05-26 — Recipe doc + MCP discoverability pass

Two follow-ups after the first Cannae run played out.

**Reproducibility doc.** Added [`RECIPE.md`](RECIPE.md) — the complete
copy-pasteable setup: the four REST calls (login → create app → create
room → create three agents), the three invite-to-chat calls, the
verbatim system prompts for `Hannibal` / `Varro` / `GameMaster`, the
gating settings, transcript-retrieval options, and troubleshooting for
the two gotchas this first run hit (owner not in `User2Chats` for a
chat created via API; turn-hijacking from the mention matcher).
Structured so future scenarios slot in as new `§4.x` prompt sections.

**MCP discoverability improvements.** While provisioning Cannae from
the MCP tool catalog it was harder than it should have been to
discover that you can deploy *multiple* agents into one chat with
custom personas — exactly the differentiating use case. Three gaps
fixed in `ethora-mcp-cli`:

- Tool descriptions for `ethora-agents-create-v2` / `-update-v2` /
  `-agent-invite-to-chat` rewritten to explicitly mention the
  multi-agent scenario and point at the `ethora-agents-quickstart`
  prompt. Also corrected the misleading `(app-token auth)` note (the
  route actually requires user auth).
- Every agent-tool field now has a `.describe()` with concrete
  guidance — particularly the gating fields (`responseMode`,
  `responseProbability`, `cooldownSec`) which any AI client reading
  the schema can now surface to its user. Crucial for `responseMode`
  whose four values control quite different behaviour.
- The `ethora-agents-quickstart` recipe got a new "Controlling
  turn-taking" section explaining `responseMode: 'mentioned'`,
  single-word display-name rule, and the end-with-@-mention prompt
  pattern that lets you build orchestrator-free turn loops.

Net effect: a fresh MCP user reading the tool catalog now sees the
multi-agent capability surfaced rather than buried, and the field
docs explain the response-gate model without having to read the
ai-service code.

## 2026-05-26 — Cannae run-01: first full game

The first end-to-end run played out cleanly. Provisioning to victory in under
twenty minutes of wall-clock work on our side, of which the actual
simulation was about one minute once the kickoff message hit the room.

**What worked.**

- **Historical outcome reproduced.** Decisive Carthaginian victory in five
  turns; Roman force from 86,000 to 42,000 (~51% loss), morale "broken."
  Tactics tracked the historical engagement closely: Hannibal's
  controlled-withdrawal-then-envelopment, the Roman deep-column push into
  the trap, Carthaginian cavalry sweeping both wings.
- **Personas held.** Hannibal invoking Baal Hammon and Tanit, addressing
  Hasdrubal / Maharbal / Mago by name; Varro invoking Mars and Jupiter
  Optimus Maximus, addressing "men of Rome" and "my colleague" Paullus.
  Period-appropriate vocabulary throughout, no fourth-wall breaks.
- **GM drove the loop.** Opening brief + TURN 0 battle log → five
  evaluations with the structured log block updated each turn → victory
  declared at the right moment → graceful close. No external orchestrator
  code; the GM's prompt did all the work via the response gate.
- **Provisioning was small.** App + room + three agents + invites, all via
  ~50 lines of curl against the public REST API.

**What didn't, and the platform issue it surfaced.**

Looking at the message count by speaker: GM 7, Hannibal 8, Varro 1,
spectator 1. Varro only got one in-character turn — Hannibal's bot
interjected on the turns the GM had explicitly addressed to `@Varro`.

Root cause is in the response-gate mention matcher
(`ai-service/src/responseGate.ts`):

```js
new RegExp(`(^|\\W)@?${botName}\\b`, 'i')
```

The `@?` makes the `@` optional, so the matcher fires on any prose
reference to "Hannibal" / "Hannibal's encirclement" / etc., not just on
true `@Hannibal` handoffs. Since the GM's evaluation paragraphs
naturally describe what each commander is doing by name, every GM
message inadvertently mentions both bots — both fire — and the faster
one (Hannibal) wins the race to reply.

This will hit any multi-bot setup where the bots reference each other
by name in prose. Two ways to address:

1. **Prompt-level workaround (immediate):** instruct the GM to use
   generic labels ("the Carthaginian commander" / "the Roman commander")
   in its evaluations, reserving `@Name` strictly for the final handoff
   sentence.
2. **Platform-level fix:** tighten the regex — either drop the `@?`
   (require literal `@` for bot-to-bot triggering) or add a strict mode
   for the gate. ~1-line change.

The transcript is saved at
[`transcripts/2026-05-26-cannae-run-01.md`](transcripts/2026-05-26-cannae-run-01.md)
for case-study mining and as a baseline for tuning the next run.

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
