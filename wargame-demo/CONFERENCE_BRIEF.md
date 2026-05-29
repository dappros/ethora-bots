# AI Wargames Demo — Conference Brief

Self-contained reference for presenting the AI Wargames demo at conferences
or other talks. Focuses on the **Narva 2027** scenario as a single deep-dive.
Bilingual (English first, Ukrainian after). Diagrams under
[`figures/`](figures/).

Companion materials in this directory: [`RECIPE.md`](RECIPE.md) for the full
reproducible setup, [`JOURNAL.md`](JOURNAL.md) for the engineering log,
[`transcripts/`](transcripts/) for full saved runs.

---

# English

## TL;DR

A multi-agent persona-driven wargame inside a single chat room on the
**Ethora** platform. "Narva 2027" — a fictional Article 5 contingency exercise
— is played out by **five AI agents** (Russia, NATO command, Estonia,
Baltic allies, Game Master) in **real time, in under five minutes
wall-clock**. Built end-to-end on a public chat platform, no bespoke wargame
engine. ~30 seconds of REST calls from zero to first message.

## What we are showing

1. **Multi-agent AI chat that works as a wargame.** Each agent is a distinct
   persona with its own voice, decision style, and command level (strategic
   vs national tactical vs regional vs operational). They take turns inside
   a single chat room. A "Game Master" agent arbitrates moves and tracks
   state. **No orchestrator code** — turn-taking is enforced entirely by
   prompt design and the platform's response gate.
2. **Built end-to-end on a public chat platform.** App, room, agents,
   invitations, messaging — all standard REST or MCP calls against Ethora.
   Provisioning is **2N+3 calls** (where N is the agent count). For Narva's
   five agents that is **13 calls**, ~30 seconds to first message.
3. **Useful for analytical exploration of contingencies.** Narva 2027
   tracked Article 5 process timing, Suwałki Gap status, ROE state, civilian
   evacuation, and force commitment in parallel. The Game Master applied
   realism evenly to all sides and redirected any drift toward political
   invective.

## Architecture

See [`figures/architecture.png`](figures/architecture.png) for the slide
graphic.

```
                    Single chat room  (XMPP MUC)
        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        │     @Russia ──────────────────  @NATO                │
        │        │                          │                  │
        │        └─→ @GameMaster ←──────────┘                  │
        │             │      │                                 │
        │             ↓      ↓                                 │
        │         @Estonia    @BalticAllies                    │
        │                                                      │
        │   Each agent = an Ethora Agent record:               │
        │     • persona system prompt                          │
        │     • avatar + display name                          │
        │     • responseMode = "mentioned"                     │
        │     • per-app BotInstance (XMPP user, isBot:true)    │
        │                                                      │
        └──────────────────────────────────────────────────────┘

   Turn rhythm (GM-enforced via @-mentions, no orchestrator code):
     @Russia → GM eval → @NATO → @Estonia → @BalticAllies → GM eval → @Russia → ...
```

## Scenario: Narva 2027

### Brief

A fictional Article 5 contingency drawing on a scenario class widely studied
in NATO and allied defense-planning circles. Date: 15 October 2027
(fictional). Trigger: Russian "peacekeeping operation" crosses the Narva
river under the rhetoric of "protecting Russian-speaking citizens." A
multi-allied response: NATO command (SACEUR at SHAPE), Estonia (Defence
Forces HQ Tallinn), and Latvia + Lithuania (joint coordination, watching
the Suwałki Gap).

This is an **analytical exercise** — not a prediction, not advocacy, not
propaganda. The Game Master's opening message states this explicitly and
the persona prompts forbid the agents from claiming alignment with any
real-world political position outside the exercise.

### Five agents

| Display | Role | Decision level | Decision cycle |
|---|---|---|---|
| `Russia` | Commander, Western Operational-Strategic Command | Operational (limited-objective) | Fast |
| `NATO` | SACEUR at SHAPE | Strategic (alliance political) | Slow — NAC consultation |
| `Estonia` | Commander, Estonian Defence Forces | National tactical | Fast |
| `BalticAllies` | Latvia + Lithuania joint coordinator | Regional (Suwałki Gap, host-nation support) | Medium |
| `GameMaster` | Impartial arbiter | — | Per-turn |

### Outcome (Run 01, 2026-05-29)

**Limited-war stalemate.** Article 5 invoked at hour 24 of incident
(turn 6 of simulation). Russian forces held the Narva bridgeheads but did
not expand. Suwałki Gap preserved throughout as the reinforcement artery.
Civilian evacuation completed under stress. No breakout — the
limited-warfare envelope held.

Full transcript:
[`transcripts/2026-05-29-narva-2027-run-01.md`](transcripts/2026-05-29-narva-2027-run-01.md)

Engineering analysis of what worked and what didn't in Run 01 (the
multi-agent shape exposed a mention-matcher edge-case in the response gate
that the GM kept the scenario coherent through, and that we then fixed
upstream in release `2606`):
see [`JOURNAL.md`](JOURNAL.md).

### Sample voice (transcript excerpts)

**Russia (operational orders, in command register):**
> Pursuant to Moscow's directive and standing operational orders for
> Operation "Russian World — Narva": consolidate all airborne elements
> holding the Narva river bridgeheads. Authorize limited
> reconnaissance-in-force operations by 25th Motor Rifle Brigade patrols
> probing south toward the E20 corridor. Maintain restrictive Rules of
> Engagement strictly limiting fires to self-defense and tactical
> interdiction in accordance with authorization.

**NATO / SACEUR (alliance political, staff brevity):**
> Article 4 consultations remain in progress; expect NAC decision on
> Article 5 invocation within next hours. Activate VJTF readiness:
> spearhead units (French-led mechanized elements, airborne battalion) to
> prepare airlift and sealift options to Lithuania and Estonia borders.
> Multinational Division Northeast (Poland) to coordinate immediate
> reinforcement planning with eFP battlegroups.

**Estonia (national tactical, sovereignty-conscious):**
> Commander Estonia to all units. Estonian national forces hold sovereign
> command and act decisively within our borders. First priority: immediate
> containment of Russian forces across the Narva river. No further bridge
> crossings must be allowed. Order 1st Infantry Brigade at Tapa to deploy
> its 1st Battalion and mechanized companies to defensive positions near
> the E20 highway corridor south of Narva. NATO still finalizing Article 5
> response; we cannot wait.

### What the Game Master tracked

Every turn, the Game Master emitted an updated structured situation log:

```
TURN N
Russia forces: <units + posture>
Estonia forces: <units + posture>
NATO forces: <units + Article-process step>
Baltic allies: <units + Suwałki Gap status>
Article 5 status: <not invoked / Article 4 consulted / Article 5 invoked>
Escalation rung: <descriptive>
Civilian risk: <low / elevated / high / severe>
Suwałki Gap: <open / threatened / closed>
Time elapsed: <hours>
Notable events: <one-line summary>
```

This is not a hard-coded dashboard — it is a structured narrative the LLM
emits each turn from prompt instructions. The fields are the dimensions a
defense planner would care about. See
[`figures/narva-timeline.png`](figures/narva-timeline.png) for how those
fields evolved across the Run 01 turns.

## The multi-agent angle (what is new here)

A single AI bot can play a character. **Five agents with different command
levels playing the same scenario** is what is new:

- **Different speech registers** — Russian command formal, NATO staff-
  officer brevity, Estonian clipped and direct, Baltic measured and
  coordinative.
- **Different decision speeds** — Estonia acts decisively in hours; NATO
  requires NAC consultation; Russia operates under General Staff political
  release for cross-border action.
- **Different priorities** — Russia: secure a fait accompli before Article
  5; NATO: alliance cohesion; Estonia: sovereignty and civilian
  evacuation; BalticAllies: don't lose the Suwałki Gap.

The Game Master's job is to keep these distinct decision cycles
synchronized into a coherent turn rhythm — and to apply realism evenly to
all sides.

## What the platform gave us (zero bespoke code)

| Need | Ethora primitive |
|---|---|
| Multi-agent chat room | XMPP MUC + ai-service |
| Persona configuration | `Agent` record (system prompt, avatar, LLM config) |
| Per-app embodiment | `BotInstance` (XMPP user with `isBot:true`) |
| Turn-taking control | `responseMode: "mentioned"` + response gate |
| Programmatic provisioning | REST API + MCP CLI tools |
| Spectator participation | Same chat UI any human user already uses |
| Persistent transcript | XMPP MAM archive |

**Five agents from zero install to first message — about 30 seconds of REST
calls.**

## What we improved while building this (platform hackability)

Demonstrations of the platform's openness, all done during the demo
sessions themselves:

1. **MCP CLI gating fields** — small upstream gap (agent response-gate
   fields not exposed in the MCP tool schemas) → diagnosed → patched →
   PR-ready in one session.
2. **MCP CLI multi-agent discoverability** — restructured tool descriptions
   so an MCP client (Claude, Cursor) reading the tool catalog now
   immediately surfaces the multi-agent capability; added `.describe()` on
   every field; extended the quickstart prompt with a "controlling
   turn-taking" recipe.
3. **Backend mention-matcher fix** — a real edge-case (multi-agent rooms
   where a moderator agent referenced others by name in prose caused
   turn-hijacking) → diagnosed via Run 01 transcript → fixed in
   `responseGate.ts` → tested → shipped as release `2606`. Result: clean
   turn rotation across 4+ agent rooms with no orchestrator code.

See [`JOURNAL.md`](JOURNAL.md) for chronological detail on each.

## Roadmap

- **Multi-unit command within a single side** — a brigade and its
  battalion commanders as separate agents under the national commander.
- **Hybrid human / AI rooms** — human players share the room with AI
  commanders; both react to each other.
- **Public spectator URL** — read-only audience view of a live simulation.
- **Replay / training datasets** — saved transcripts become reusable
  training material for human exercises.

## Live demo plan (~90 seconds on stage)

1. Open the QA admin panel, briefly show the five `Agent` records (15s).
2. Open the chat room, point out the five bots in the participant list
   (10s).
3. Type the kickoff: `@GameMaster, begin the Narva 2027 simulation.` (5s).
4. Wait ~10 seconds for the GM opening (15s).
5. Scroll through the first 3 turns as they appear (~40s) — point out
   character voice differences as you go, the situation log updating each
   turn, the Article-5 process progressing, the Suwałki Gap line.
6. Cut to the architecture slide while the simulation continues, summarize
   what they just saw is "five AI agents in a chat room on a public
   platform" (~10s).

The full simulation completes in under five minutes if you want to leave
it running. Spectator audience can watch the projected room in real time.

---

# Українською

## Стисло

Багатоагентний персонажно-керований варгейм у єдиному чаті на платформі
**Ethora**. Сценарій «Нарва 2027» — гіпотетична вправа з контингенцією
Статті 5 НАТО — програється **п'ятьма ШІ-агентами** (Росія, командування
НАТО, Естонія, балтійські союзники, гейм-майстер) у **реальному часі,
менш ніж за п'ять хвилин**. Реалізовано повністю на публічній чат-
платформі, без жодного спеціалізованого варгейм-двигуна. ~30 секунд
REST-викликів від нуля до першого повідомлення.

## Що показуємо

1. **Багатоагентний ШІ-чат як варгейм.** Кожен агент — окрема персона зі
   своїм голосом, стилем рішень та рівнем командування (стратегічний vs
   національний тактичний vs регіональний vs оперативний). Вони ходять по
   черзі в одній чат-кімнаті. Агент-«гейм-майстер» виступає арбітром і
   веде журнал бою. **Жодного коду оркестрації** — порядок ходів
   забезпечується виключно дизайном промптів та механізмом response gate
   на платформі.
2. **Реалізовано на публічній чат-платформі.** App, кімната, агенти,
   запрошення, повідомлення — все це стандартні REST/MCP виклики до
   Ethora. Розгортання — це **2N+3 виклики** (де N — кількість агентів).
   Для Нарви (5 агентів) — **13 викликів**, ~30 секунд до першого
   повідомлення.
3. **Корисно для аналітичного дослідження контингенцій.** «Нарва 2027»
   одночасно відстежував графік процесу Статті 5, статус Сувальського
   коридору, ROE, цивільну евакуацію та зобов'язання сил. Гейм-майстер
   застосовував однаковий стандарт реалізму до всіх сторін і
   перенаправляв будь-яку політичну риторику до операційних деталей.

## Сценарій: Нарва 2027

### Опис

Гіпотетична вправа з контингенцією Статті 5 на основі класу сценаріїв,
широко вивчених у колах НАТО та союзних оборонних планувальників.
Дата: 15 жовтня 2027 (вигадана). Тригер: російська «миротворча операція»
переходить річку Нарва під риторикою «захисту російськомовного населення».
Багатосторонній союзницький відгук: командування НАТО (SACEUR у SHAPE),
Естонія (штаб Сил оборони в Таллінні), Латвія + Литва (спільна
координація, спостереження за Сувальським коридором).

Це **аналітична вправа** — не прогноз, не пропаганда, не агітація.
Гейм-майстер відкривав сесію цим явним застереженням, а промпти
персонажів забороняють агентам стверджувати причетність до будь-яких
реальних політичних позицій поза вправою.

### П'ять агентів

| Імʼя | Роль | Рівень рішень | Цикл рішень |
|---|---|---|---|
| `Russia` | Командувач Західного оперативно-стратегічного командування | Оперативний (обмежені цілі) | Швидкий |
| `NATO` | SACEUR у SHAPE | Стратегічний (альянсова політика) | Повільний — консультації NAC |
| `Estonia` | Командувач Сил оборони Естонії | Національний тактичний | Швидкий |
| `BalticAllies` | Спільна координація Латвії та Литви | Регіональний (Сувальський коридор, host-nation support) | Середній |
| `GameMaster` | Неупереджений арбітр | — | Щохода |

### Результат (Прогон 01, 2026-05-29)

**Стимат обмеженої війни.** Стаття 5 активована на 24-й годині інциденту
(хід 6 симуляції). Російські сили утримали плацдарм у Нарві, але не
розширили його. Сувальський коридор лишався відкритим протягом усього
сценарію як артерія підкріплення. Цивільну евакуацію завершено в умовах
напруги. Виходу за межі обмеженого конфлікту не сталося.

### Голос персонажів (фрагменти стенограми)

**Росія (оперативні директиви, у командному регістрі):**
> Відповідно до директиви Москви та чинних оперативних наказів для
> операції «Російський світ — Нарва»: консолідувати всі повітрянодесантні
> елементи, що утримують плацдарми річки Нарва. Дозволити обмежені
> розвідувально-силові операції патрулів 25-ї мотострілецької бригади з
> просуванням на південь до коридору E20. Підтримувати обмежувальні
> правила ведення вогню (ROE), що суворо обмежують стрільбу самозахистом
> та тактичним перешкодженням відповідно до санкції.

**НАТО / SACEUR (альянсова політика, штабна стислість):**
> Консультації за Статтею 4 тривають; очікуйте рішення NAC щодо активації
> Статті 5 протягом найближчих годин. Активувати готовність VJTF —
> передові підрозділи (французькі механізовані елементи, повітрянодесантний
> батальйон) готують варіанти повітряного та морського перекидання до
> кордонів Литви та Естонії. Багатонаціональна дивізія «Північний схід»
> (Польща) координує негайне планування підкріплення з eFP-батальйонними
> групами.

**Естонія (національний тактичний, з усвідомленням суверенітету):**
> Командувач Естонія до всіх підрозділів. Естонські національні сили
> утримують суверенне командування і діють рішуче в межах наших кордонів.
> Пріоритет перший: негайне стримування російських сил по той бік річки
> Нарва. Жодних нових переходів через мости не допустити. Наказати 1-й
> піхотній бригаді в Тапа розгорнути 1-й батальйон та механізовані роти
> на оборонних позиціях біля коридору E20 на південь від Нарви. НАТО ще
> опрацьовує відгук за Статтею 5 — ми не можемо чекати.

### Що відстежував гейм-майстер

Щохода гейм-майстер видавав оновлений структурований журнал ситуації:

```
TURN N
Russia forces: <підрозділи + поза>
Estonia forces: <підрозділи + поза>
NATO forces: <підрозділи + крок процесу Статті 5>
Baltic allies: <підрозділи + статус Сувальського коридору>
Article 5 status: <не активовано / Стаття 4 / Стаття 5 активовано>
Escalation rung: <описово>
Civilian risk: <низький / підвищений / високий / надкритичний>
Suwałki Gap: <відкритий / під загрозою / закритий>
Time elapsed: <годин>
Notable events: <одна-дві лінії>
```

Це не жорстко закодована панель — це структурована наративна форма, яку
LLM видає щохода згідно з інструкціями промпту. Поля — це виміри, важливі
для оборонного планувальника. Графік прогресу цих вимірів за прогоном 01
див. у [`figures/narva-timeline.png`](figures/narva-timeline.png).

## Багатоагентний вимір (що тут нового)

Одинокий ШІ-бот може зіграти персонажа. **П'ять агентів з різними рівнями
командування, що грають один сценарій,** — ось що тут нове:

- **Різні мовні регістри** — російське командне формальне, штабна
  стислість НАТО, естонське стримане і пряме, балтійське виважено-
  координативне.
- **Різні швидкості рішень** — Естонія діє рішуче за години; НАТО потребує
  консультацій NAC; Росія діє під політичним дозволом Генштабу на
  транскордонні дії.
- **Різні пріоритети** — Росія: забезпечити доконаний факт до Статті 5;
  НАТО: цілісність альянсу; Естонія: суверенітет та цивільна евакуація;
  BalticAllies: не втратити Сувальський коридор.

Робота гейм-майстра — синхронізувати ці різні цикли рішень у когерентний
ритм ходів та застосовувати однаковий стандарт реалізму до всіх сторін.

## Що дала платформа (нуль спеціалізованого коду)

| Потреба | Примітив Ethora |
|---|---|
| Багатоагентна чат-кімната | XMPP MUC + ai-service |
| Конфігурація персони | запис `Agent` (системний промпт, аватар, LLM-конфіг) |
| Втілення на рівні застосунку | `BotInstance` (XMPP-користувач з `isBot:true`) |
| Контроль ходів | `responseMode: "mentioned"` + response gate |
| Програмне розгортання | REST API + MCP CLI tools |
| Участь глядачів | Той самий чат-UI, що й для будь-якого людського користувача |
| Постійна стенограма | XMPP MAM archive |

**П'ять агентів від нульової інсталяції до першого повідомлення — близько
30 секунд REST-викликів.**

## Дорожня карта

- **Багатопідрозділна структура командування на одному боці** — бригада
  та її батальйонні командири як окремі агенти під національним
  командуванням.
- **Гібридні людино-ШІ кімнати** — людські гравці поділяють кімнату з
  ШІ-командирами; обидві сторони реагують одна на одну.
- **Публічна URL для глядачів** — лише-читання-вид аудиторії за прямою
  трансляцією симуляції.
- **Реплеї / навчальні набори даних** — збережені стенограми стають
  багаторазовим матеріалом для людських навчань.
