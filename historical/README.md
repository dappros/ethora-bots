# Historical bot documentation (2021 to 2023)

This folder is an **archive**, not current documentation.

It preserves the bot material that used to live on `wiki.ethora.com`, a legacy
MediaWiki site retired in 2026. The wiki was unmaintained, partly compromised by
injected spam, and carried positioning from an earlier era of the product, so it
was decommissioned. The bot pages were worth keeping: several of the patterns
below have not been rebuilt yet, and they are a useful starting point for future
bots in this repo.

**Read these as design notes and inspiration, not as an API reference.** They
describe the early Ethora engine, then known as the Dappros Platform. Endpoints,
class names and token standards referenced here are historical. The current
framework lives in [`packages/`](../packages) and [`bots/`](../bots).

## Contents

| File | What it covers |
|---|---|
| [crypto-chat-bots.md](crypto-chat-bots.md) | The overall concept: bots as first-class chat participants that hold wallets, own assets and carry smart-contract logic. Includes the original architecture diagram and the bot directory. |
| [bots-framework.md](bots-framework.md) | Framework conventions and rules for third-party bot developers. |
| [mint-bot.md](mint-bot.md) | Bot that lets end users mint their own tokens from images, sound or video through a conversation. |
| [hut-hut-bot.md](hut-hut-bot.md) | Bot holding a shared "treasure" in a chat room, with a paid reveal mechanic. Worked example of a bot custodying assets on behalf of a room. |
| [prisoner-dilemma-bot.md](prisoner-dilemma-bot.md) | Two-player game bot with a commit-and-win mechanic. Smallest complete example of a stateful multi-user bot. |

## Why these are still interesting

Stripped of the 2021 token framing, most of these are ordinary and reusable
conversational patterns:

- **Welcome Bot** — greet a new room member, hand them buttons through to other bots.
- **Notary Bot** — witness a conversation and write a tamper-evident record of it.
  Directly relevant to current audit-trail and compliance work.
- **Questionnaire Bot** — collect structured information through conversation and
  store it, with a reward for completion. A survey or intake bot in all but name.
- **Hut Hut / Prisoner Dilemma** — bots that hold state and assets on behalf of a
  room rather than an individual user, and mediate between two users.

The mechanism worth carrying forward is the shape, a bot as a room participant
with its own identity, permissions and state, rather than the specific token
standards used to implement it in 2021.

## Provenance

Source: `wiki.ethora.com`, archived 2026-08-23 (wikitext) and 2026-09-09 (media),
before the subdomain was retired. Full archive is held in the internal
`ethora-bdsm` workspace at `data/raw/wiki-ethora/`.
