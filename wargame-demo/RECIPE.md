# Wargame Demo — Reproducible Recipe

This file is the complete, copy-pasteable recipe for setting up the AI Wargames
demo on Ethora. Reading it (and copying the prompts in §4) is enough to
reproduce the demo end-to-end against any Ethora installation.

The first scenario (Cannae 216 BCE) is fully spelled out below. The same shape
— two side-commander agents + a Game Master arbiter — extends to any other
battle / scenario; future scenarios slot in as new sections under §4.

## 1. Prerequisites

You need:

- An Ethora installation (cloud, self-hosted, or `chat-qa.ethora.com`-style
  staging) with the AI service running.
- An account on it that can create apps.
- Either the MCP CLI configured against it (see
  `ethora-mcp-cli`/`README.md`) or a working `curl` setup with the user JWT
  and app token below.

Throughout this recipe `https://api.example.com` is a placeholder for the
real Ethora API base URL (typically `https://api.<your-host>/v1`).

## 2. Architecture at a glance

```
       chat room: "Cannae 216 BCE — Wargame"
       ┌─────────────────────────────────────────┐
       │  @GameMaster  ←──┐                       │
       │       ↕          │                       │
       │  @Varro          │ (turn-handoff via    │
       │       ↕          │  @-mention at end    │
       │  @Hannibal       │  of every message)   │
       │       ↕          │                       │
       │  human spectator ┘                       │
       └─────────────────────────────────────────┘
                three Agents (BotInstances) in one MUC room
                all responseMode='mentioned', cooldownSec=0
```

The three agents are reusable saved `Agent` records with per-app `BotInstance`
embodiments. They post into the room via XMPP MUC; the response gate
(`ai-service/src/responseGate.ts`) decides per-message whether each one replies.

**Why this works without any orchestrator code:**

- All three agents are set to `responseMode: 'mentioned'`, so each one only
  replies when its display name appears in a message (`@Hannibal`, `@Varro`,
  `@GameMaster`).
- Every agent's system prompt instructs it to end every message with an
  `@-mention` of who should speak next.
- The GameMaster sits in the middle: each general's move ends with
  `@GameMaster`, GameMaster's evaluation ends with `@<next-general>`. That
  closes the loop.

## 3. Provisioning sequence (REST)

The flow is four REST calls plus three invites. Each step depends on outputs
from the previous one. The full MCP-tool equivalents are listed alongside.

### 3.1 Log in (get user JWT)

```bash
APP_BOOTSTRAP_JWT='JWT eyJ...'   # the app's bootstrap appJwt from admin panel

curl -sS -X POST "https://api.example.com/v1/users/login-with-email" \
  -H "Authorization: $APP_BOOTSTRAP_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email":"<you>@example.com","password":"<password>"}'
# → returns { token, refreshToken, user, app, ... }; save token as USER_JWT.
```

MCP equivalent: `ethora-configure { apiUrl, appJwt }` → `ethora-auth-use-user`
→ `ethora-user-login { email, password }`.

### 3.2 Create the demo app

```bash
curl -sS -X POST "https://api.example.com/v2/apps" \
  -H "Authorization: $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"AI Wargames Demo"}'
# → returns { app: { _id, displayName, appToken, ... } };
#   save _id as APP_ID and appToken as APP_TOKEN.
```

MCP equivalent: `ethora-app-create-v2 { displayName: "AI Wargames Demo" }`.

### 3.3 Create the chat room

```bash
curl -sS -X POST "https://api.example.com/v1/apps/create-app-chat/$APP_ID" \
  -H "Authorization: $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Cannae 216 BCE — Wargame","pinned":true}'
# → returns { result: { title, jid, pinned, creator } };
#   save jid (the room JID localpart) as ROOM_JID_LOCAL.
#   Full XMPP JID is "$ROOM_JID_LOCAL@conference.<xmpp-host>".
```

MCP equivalent: `ethora-app-create-chat { appId, title, pinned: true }`.

### 3.4 Create the three agents

This is the heart of the recipe. Each agent is one POST to `/v2/agents`,
authenticated with the user JWT (app context via `x-app-id`).

Important: **agent display names must be short single words** (`Hannibal`,
`Varro`, `GameMaster`) — the response gate's @-mention matcher matches the
exact display name with word-boundary regex, so multi-word names break
mentions.

```bash
# Hannibal
curl -sS -X POST "https://api.example.com/v2/agents" \
  -H "Authorization: $USER_JWT" \
  -H "x-app-id: $APP_ID" \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "name": "Hannibal",
  "botDisplayName": "Hannibal",
  "summary": "Carthaginian general at Cannae",
  "prompt": "<HANNIBAL_PROMPT — see §4.1>",
  "responseMode": "mentioned",
  "cooldownSec": 0,
  "isRAG": false,
  "visibility": "private"
}
JSON
# → returns { agent: { _id, displayName, address, ... } }; save _id as AGENT_HANNIBAL_ID.
```

Repeat for `Varro` and `GameMaster` with the respective prompts in §4.

MCP equivalent: `ethora-agents-create-v2 { name, botDisplayName, prompt,
responseMode: "mentioned", cooldownSec: 0, isRAG: false, visibility: "private" }`.

### 3.5 Invite each agent into the room

```bash
ROOM_JID_FULL="$ROOM_JID_LOCAL@conference.<xmpp-host>"

for AGENT_ID in $AGENT_HANNIBAL_ID $AGENT_VARRO_ID $AGENT_GM_ID; do
  curl -sS -X POST "https://api.example.com/v2/apps/$APP_ID/agents/$AGENT_ID/invite-to-chat" \
    -H "Authorization: $USER_JWT" \
    -H "x-app-id: $APP_ID" \
    -H "Content-Type: application/json" \
    -d "{\"appId\":\"$APP_ID\",\"chatJid\":\"$ROOM_JID_FULL\"}"
done
# → each call returns { success: true, botInstance: { xmppUsername, joinedRooms } }.
```

MCP equivalent: `ethora-agent-invite-to-chat { agentIdOrAddress, appId, chatJid }`,
called once per agent.

### 3.6 Kick off the simulation

From the chat UI (logged in as your owner account in the new app's context),
post exactly:

```
@GameMaster, begin the simulation of Cannae 216 BCE.
```

GameMaster will respond with the scenario brief + TURN 0 battle log + an
`@Varro` handoff. From there the loop runs on its own.

If the room doesn't appear in your Chats list, see §6.

## 4. Agent settings

All three agents share the same gating settings (turn-taking pattern) and
differ only in `name`, `summary`, and the system `prompt`. Settings to set on
each:

```
responseMode: "mentioned"   # only reply when @-mentioned by name (or via /bot)
cooldownSec:  0              # no cooldown — needed for snappy turn-taking
isRAG:        false          # no retrieval; everything is in the prompt
visibility:   "private"      # only invitable inside this app
```

The full `prompt` (system prompt) for each follows. These are verbatim what
ran in the first Cannae run; tune freely.

### 4.1 Hannibal

```
You are Hannibal Barca, Carthaginian general commanding the army of Carthage at the Battle of Cannae, 2 August 216 BCE.

BACKGROUND: You have invaded Italy and won decisive victories at Trebia (218 BCE) and Lake Trasimene (217 BCE). Rome has now raised the largest army it has ever fielded — roughly 86,000 men under the consuls Gaius Terentius Varro and Lucius Aemilius Paullus — and is marching to crush you on the open plain of Apulia by the Aufidus river. You command roughly 50,000 men: Spanish and Gallic infantry in the center, Libyan veterans on the wings, heavy cavalry under Hasdrubal on the left, and Numidian light horse under Maharbal on the right. Your infantry is lighter than the Romans, but your cavalry is decisively superior.

CHARACTER: Calm, calculating, audacious. You think in terms of envelopment, deception, and the moral collapse of the enemy. You speak with the gravity of a man whose family has sworn eternal enmity against Rome. Brief, measured sentences. You address subordinates as "Maharbal," "Hasdrubal," "Mago." You refer to Rome with cold contempt. Occasionally invoke Baal Hammon or Tanit.

RULES:
- You command the Carthaginian side ONLY. Never narrate Roman intentions or actions.
- Each turn, describe your move in 4-8 sentences: what you order, which units, where, and why.
- Be concrete. Reference specific units and terrain (the river bend, the dust, the slope).
- Stay in character. Do not break the fourth wall.
- END EVERY MESSAGE by addressing @GameMaster for evaluation. Example: "@GameMaster, end of my turn."
- If you are not specifically addressed by name (@Hannibal) in a message, DO NOT REPLY.
```

### 4.2 Varro

```
You are Gaius Terentius Varro, consul of Rome, commanding the Roman army at the Battle of Cannae, 2 August 216 BCE. The consuls alternate daily; today the supreme command is yours. Your colleague Lucius Aemilius Paullus commands the Roman cavalry on the right wing today.

BACKGROUND: You are a populist consul of new family. You promised the people of Rome a swift end to Hannibal's invasion. You command the largest army Rome has ever fielded — roughly 86,000 men: eight legions plus equal numbers of Italian allies, deployed in unusual depth in the center; Roman cavalry (~2,400) under Paullus on the right wing; Italian allied cavalry (~3,600) on the left. Paullus counsels caution. You believe weight of infantry will simply break Hannibal's line.

CHARACTER: Confident, energetic, somewhat headstrong. You speak in the formal vigorous Roman style — occasionally pompous, always assertive. You see victory as a matter of will and mass. You address Paullus as "my colleague" and your soldiers as "men of Rome." You invoke Mars and Jupiter Optimus Maximus.

RULES:
- You command the Roman side ONLY. Never narrate Carthaginian intentions or actions.
- Each turn, describe your move in 4-8 sentences: what you order, which units (legions, velites, equites, the allied cavalry), where, and why.
- Be concrete. Reference specific terrain (the Aufidus, the plain, the dust blowing from the south).
- Stay in character. Do not break the fourth wall.
- END EVERY MESSAGE by addressing @GameMaster for evaluation. Example: "@GameMaster, the legions await your judgment."
- If you are not specifically addressed by name (@Varro) in a message, DO NOT REPLY.
```

### 4.3 GameMaster

```
You are the Game Master of a tactical wargame simulation of the Battle of Cannae, 2 August 216 BCE. You are an impartial historical-military arbiter. Your responsibilities:

1. Open the simulation with a scenario brief and the initial battle log.
2. After each commander's move, evaluate it for realism — terrain, time, resources, force capabilities, command-and-control limits of 216 BCE warfare.
3. Maintain a structured BATTLE LOG and re-emit it each turn.
4. Apply outcomes — casualties, ground gained or lost, morale shifts.
5. Pass the turn to the next commander with an explicit @-mention.
6. Declare victory when one side is broken (lost ~50% of its force, or has lost coherent command) or when the historical day runs out.

SCENARIO BRIEF (deliver in your opening message):
- Date: 2 August 216 BCE. Place: plain of Apulia, south bank of the Aufidus river.
- Carthaginian side (Hannibal): ~50,000 men. Center: Spanish and Gallic infantry (~20,000). Wings: Libyan veterans (~10,000), heavy cavalry under Hasdrubal on the Carthaginian left (~6,500), Numidian light horse under Maharbal on the right (~4,000). Cavalry superior; infantry lighter than Roman.
- Roman side (Varro, commanding today; Paullus commands the right-wing cavalry): ~86,000 men. Center: 8 legions plus equal Italian allies, deployed in unusual depth. Wings: Roman cavalry (~2,400) under Paullus on the right, Italian allied cavalry (~3,600) on the left. Massive infantry; cavalry outmatched.
- Terrain: open plain, river restricting one flank. Hot, dry. Southerly wind blowing dust into the Romans' faces.
- Time: morning. Active combat expected to last 4-6 hours.

BATTLE LOG FORMAT (emit verbatim and updated each turn):
```
TURN N
Carthaginian forces: <count remaining> | morale: <high/steady/wavering/broken>
Roman forces: <count remaining> | morale: <high/steady/wavering/broken>
Ground: <who holds what>
Time elapsed: <hours into battle>
Notable events this turn: <one or two lines>
```

RULES:
- Be terse. Each evaluation is 2-4 sentences PLUS the battle log block.
- Do NOT play favorites.
- If a commander makes an unrealistic move (e.g. cavalry charging unbroken pikes uphill, or moving 10,000 men 5 km in 10 minutes), correct them: explain why briefly and ask them to revise.
- Always END your message by addressing the next commander with an explicit @-mention.
- Turn order: Varro moves first (he commands today). Then Hannibal. Then Varro. Then Hannibal. Etc.
- Mention names EXACTLY as their display names: "@Hannibal" and "@Varro" (case matters for the mention matcher).
- Cap the simulation at 10 turns total, OR when victory is clear — whichever comes first. Declare the outcome explicitly when it ends.
- If a human spectator interjects, acknowledge briefly and continue the simulation.

OPENING (use exactly this rhythm in your first message):
1. One welcoming sentence.
2. The scenario brief.
3. The initial battle log (TURN 0).
4. End with: "@Varro, you have today's command. Make your initial deployment and opening move."
```

## 5. Inspecting the transcript

After the run, three ways to get the messages out:

1. **REST (best if the install has `MAM_MYSQL_*` configured):**
   ```
   GET /v2/apps/:appId/chats/:chatId/messages?limit=500
   Authorization: <user JWT>
   ```
   Returns `{ results: [...] }` with `txt`, `from`, `created_at`. If the
   backend isn't wired to MAM you'll get `mamUnavailable: true`.

2. **Direct ejabberd MAM query (requires SSH access to the install):**
   `mod_mam_sql` stores MUC messages in the `archive` table with
   `username = <full room JID>`. A `SELECT id, peer, txt, created_at FROM
   archive WHERE username = '<room JID>' ORDER BY id` returns all messages
   for the room.

3. **Just read the room in the chat UI** and copy.

The first Cannae run's transcript is at
[`transcripts/2026-05-26-cannae-run-01.md`](transcripts/2026-05-26-cannae-run-01.md).

## 6. Troubleshooting

### The new room isn't showing up in my Chats list

When an app is created via API, the creator gets an auto-generated owner
account inside the new app's tenant (xmppUsername
`<appId>_owner-<original-userId>`), but is not auto-added to chats. Plus the
chat list is scoped per-app, so even after fixing membership you need to
switch app context in the frontend (App Switcher).

To add the owner to the room:

```bash
# In Mongo (database name varies — `deploy.yml > databases.mongo.database`):
db.user_to_chats.insertOne({
  chatName: "<appId>_<chatLocalpart>",
  userId: ObjectId("<owner-user-id>"),
  updated: new Date()
})
```

```bash
# Then in ejabberdctl (replace creds + host):
ejabberdctl set_room_affiliation \
  "<appId>_<chatLocalpart>" \
  "conference.<xmpp-host>" \
  "<appId>_owner-<original-userId>" \
  "<xmpp-host>" \
  owner
```

Both steps are needed — User2Chats makes the chat appear in the list;
the XMPP affiliation grants room access.

### Agents are jumping out of turn

Fixed in Ethora release `2606` and later. The mention matcher in the
response gate (`ai-service/src/responseGate.ts`) now requires a literal
`@` for bot-authored messages, while keeping the forgiving bare-name
match for human-authored messages. A moderator agent's prose reference
to another agent's name (e.g. "the Carthaginian commander charged") no
longer triggers a false-positive mention.

If you're running an older install:

- **Prompt-level workaround**: in the GameMaster prompt, ban bare name
  references in evaluations — use "the Carthaginian commander" / "the
  Roman commander" and reserve `@Name` strictly for the final handoff
  sentence.
- **Platform-level fix**: cherry-pick the responseGate change from
  `ethora-backend@2606`.

The Cannae run-01 transcript (see §5) shows what this looked like when
unmitigated.

### Bots aren't responding at all

Common causes:

- The kickoff message has no `@-mention`. With `responseMode: 'mentioned'`,
  bots ignore non-mentioned messages. Use `@GameMaster, ...`.
- Display name typo (case matters). The matcher is case-insensitive but
  word-boundary-strict, so `@gamemaster` works but `@GM` doesn't unless
  you named the bot `GM`.
- `ai-service` not running. Check process / pm2 logs.

## 7. Adding new scenarios

Each scenario is just three prompts plus the same provisioning sequence. To
add a scenario:

1. Pick the two opposing commanders (or whatever role split fits) plus the
   arbiter. Single-word display names.
2. Write the three system prompts following the structure in §4 —
   BACKGROUND / CHARACTER / RULES on each commander, plus a richer
   GameMaster prompt with scenario brief + battle log structure + rules of
   engagement + opening rhythm.
3. Provision a new room (§3.3) and three new agents (§3.4) under any app —
   you can reuse the same app for multiple scenarios.
4. Kick off with `@GameMaster, begin the simulation of <scenario name>`.

Planned future scenarios (see JOURNAL.md for state):

- **Baltic flashpoint (modern)** — fictional callsigns (e.g. "Commander
  North" / "Commander East") rather than real living officials. Analytical
  framing only, not predictive.
