# Prisoner Dilemma Bot

> **Archived historical document.** Preserved from the retired `wiki.ethora.com`.
> It describes the early Ethora engine (then the Dappros Platform) as of 2021 to 2023.
> Endpoints, class names and token standards are historical and will not match the
> current framework in [`packages/`](../packages). Kept as design reference.
> See [historical/README.md](README.md) for context.

Two-player game bot with a commit-and-win mechanic.

Bot listens to the chat history

As soon as it detects two users who wrote "prisoner" or "dilemma" together with "play", it sends a prompt to both users asking them to make their move.

The players make their moves via DM (private messages) to the bot.

Bot publishes results in the group chat where the game was initiated.

### Participation cost
Each player needs to transfer 5 Coins to the Bot in order to play.

Depending on game outcome, the player will either lose these Coins or will gain more Coins.

### Moves
Players can choose one of the following moves:

* ✅ Cooperate 

or

* ❌ Defect 

Once moves are made by each player, Bot announced the results and issues the rewards.

### Results
Depending on the combination of the moves, players get penalised or rewarded accordingly.

{| class="wikitable"
|+
!Alice
!Bob
!Reward for Alice
!Reward for Bob
|-
|✅
|✅
|3 Coins
|3 Coins
|-
|✅
|❌ 
|0 Coins
|5 Coins
|-
|❌
|❌
|1 Coin
|1 Coin
|}
