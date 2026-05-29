# 90-second on-stage demo script — Narva 2027

Practice this once or twice before the talk. Timed assuming a single big
screen showing the QA frontend. Verbal narration in *italics* matches what
you do on screen.

## Pre-show checklist (5 minutes before)

- [ ] Logged into `app.chat-qa.ethora.com` as `test18491@test.ethora.com`.
- [ ] App Switcher already pointing at **AI Wargames Demo**.
- [ ] Sidebar pinned chat list visible — both **"Narva 2027 — Wargame"** and
      **"Narva 2027 — Wargame (Run 2)"** present.
- [ ] Slide deck on a second screen ready at the architecture figure.
- [ ] Browser zoom turned up so the back row can read the chat.
- [ ] Network sanity check: post a throwaway `ping` in any other room first
      and confirm it lands.

## Section 1 — "Three primitives" (0:00 – 0:25)

Cut from architecture slide to QA admin panel.

- [ ] Click the **Agents** tab.

> *"Three primitives. First — agents. Each one is a saved record: a name,
> an avatar, a system prompt, and a response-mode setting. Here are the
> five agents for the Narva scenario — Russia, NATO, Estonia, Baltic
> allies, and a Game Master."*

- [ ] Scroll the agent list. Click one agent (e.g. NATO) so the persona
      prompt is briefly visible — long enough that the audience registers
      "this is just text."

> *"You can see the system prompt is just text — the persona, the role,
> the rules. No code."*

## Section 2 — "One chat room" (0:25 – 0:40)

Switch to Chats sidebar.

- [ ] Click into **Narva 2027 — Wargame (Run 2)** (the empty room ready
      for the live demo, OR — if you ran ahead — show the existing
      transcript and skip Section 3 below).

> *"Second primitive — one chat room. All five agents are members. So is
> any human user who wants to watch. It's the same chat room any other
> product on the platform would use."*

- [ ] Point at the participant list (with the five bots + your user).

## Section 3 — "Kick it off" (0:40 – 1:10)

- [ ] Type into the message box:

```
@GameMaster, begin the Narva 2027 simulation.
```

- [ ] Press Enter.

> *"Third primitive — turn-taking. Every agent is set to respond only when
> @-mentioned. The Game Master agent is the loop driver: it evaluates
> each move, updates a structured situation log, and @-mentions whoever
> goes next. There is no orchestrator code. It's purely the prompts and
> a small response gate."*

- [ ] Wait ~10 seconds for the Game Master's opening message: scenario
      brief + TURN 0 situation log + handoff to `@Russia`.

> *"Here's the opening. Notice three things: the explicit 'fictional
> analytical exercise' disclaimer, the scenario brief with named units
> and force sizes, and the structured situation log block tracking
> Article 5 process, civilian risk, the Suwałki Gap."*

## Section 4 — "Watch a turn cycle" (1:10 – 1:30)

- [ ] As Russia's move appears: scroll to show it.

> *"Russia in command-register prose, articulating the stated rationale,
> staying inside the limited-objective frame."*

- [ ] As NATO's response appears:

> *"NATO in staff brevity — VJTF activation, NAC consultation, Article
> 4 / 5 process. Completely different speech register."*

- [ ] As Estonia's response appears:

> *"Estonia — sovereign command, decisive, won't wait on NATO for
> decisions on its own territory."*

> *"This is what's new: five distinct command voices coordinating in real
> time, with the Game Master applying the same realism standard to all
> sides. Built on a public chat platform — about thirty seconds of REST
> calls from zero to first message."*

Cut back to the architecture slide and continue the talk.

## Fallbacks

**If the chat session looks stale (no bot response within 20s):**

- Sign out and sign back in. Re-open the room. Re-post the kickoff.

**If the room itself isn't visible in the sidebar:**

- App Switcher is on the wrong app. Switch to AI Wargames Demo.

**If a bot starts speaking out of turn:**

- It's recoverable — let the Game Master correct on the next turn.
- For the demo, you can also gracefully cut to the existing Run 01 / Run 02
  transcript ([`transcripts/`](transcripts/)) and narrate from there.

**If the live simulation goes over time:**

- Cut at any point. The Game Master will continue but you don't have to
  wait for it. Mention that the full run completes in under five minutes
  and the saved transcript is in the repo for anyone who wants to read
  it later.

## Optional flourishes (if you have extra time)

- Show the `wargame-demo/figures/narva-timeline.png` chart and walk the
  audience through "this is what the Game Master tracked across the
  twelve turns of the first run."
- Open `RECIPE.md` and scroll past the verbatim system prompts to make
  the point that the whole demo is reproducible from a single document.
- Mention the upstream contribution: the run surfaced a bug in the
  response gate's mention matcher, we fixed it in `responseGate.ts`,
  shipped as release `2606`, and re-ran with measurably cleaner
  turn-taking. Platform openness.
