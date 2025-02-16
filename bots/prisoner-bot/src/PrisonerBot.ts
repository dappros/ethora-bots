import { BaseBot, BaseBotConfig } from '@ethora/bot-core'
import crypto from 'crypto'

export interface PrisonerBotConfig extends BaseBotConfig {
  // Add any specific config if needed
}

type Move = 'COOPERATE' | 'DEFECT'
type GameState = 'WAITING_FOR_PLAYER' | 'COMMITTED' | 'FINISHED'

interface GameSession {
  playerId: string
  botMove: Move
  nonce: string
  commitment: string
  state: GameState
  rounds: Array<{
    playerMove: Move
    botMove: Move
    playerPoints: number
    botPoints: number
  }>
}

export class PrisonerBot extends BaseBot {
  private games: Map<string, GameSession> = new Map()
  
  private readonly PAYOFF_MATRIX = {
    COOPERATE: {
      COOPERATE: { player: 3, bot: 3 }, // Both cooperate
      DEFECT: { player: 5, bot: 0 }     // Player defects, bot cooperates
    },
    DEFECT: {
      COOPERATE: { player: 0, bot: 5 }, // Bot defects, player cooperates
      DEFECT: { player: 1, bot: 1 }     // Both defect
    }
  }

  constructor(config: PrisonerBotConfig) {
    super(config)
  }

  protected async onOnline(): Promise<void> {
    await super.onOnline()
    await this.sendMessage(
      "👋 I'm the Prisoner's Dilemma Bot! Let's explore game theory together.\n\n" +
      "Type 'play' to start a new game. In each round, you'll choose to either COOPERATE or DEFECT.\n\n" +
      "Payoff Matrix:\n" +
      "Both Cooperate: 3 points each\n" +
      "Both Defect: 1 point each\n" +
      "One Defects: Defector gets 5, Cooperator gets 0"
    )
  }

  private createCommitment(move: Move): { commitment: string, nonce: string } {
    const nonce = crypto.randomBytes(32).toString('hex')
    const commitment = crypto
      .createHash('sha256')
      .update(`${move}:${nonce}`)
      .digest('hex')
    return { commitment, nonce }
  }

  private verifyCommitment(move: Move, nonce: string, commitment: string): boolean {
    const computedCommitment = crypto
      .createHash('sha256')
      .update(`${move}:${nonce}`)
      .digest('hex')
    return computedCommitment === commitment
  }

  private decideBotMove(): Move {
    // For now, use a simple random strategy
    // Could be enhanced with more sophisticated strategies
    return Math.random() < 0.5 ? 'COOPERATE' : 'DEFECT'
  }

  protected async handleMessage(message: string, from: string): Promise<void> {
    const playerId = from.split('/')[1]
    const command = message.trim().toUpperCase()

    if (command === 'PLAY') {
      // Start new game
      const botMove = this.decideBotMove()
      const { commitment, nonce } = this.createCommitment(botMove)
      
      this.games.set(playerId, {
        playerId,
        botMove,
        nonce,
        commitment,
        state: 'COMMITTED',
        rounds: []
      })

      await this.sendMessage(
        `Game started! I've made my choice and here's my commitment: ${commitment}\n\n` +
        "Type 'COOPERATE' or 'DEFECT' to make your move."
      )
      return
    }

    const game = this.games.get(playerId)
    if (!game) {
      await this.sendMessage("No active game. Type 'play' to start one!")
      return
    }

    if (game.state === 'COMMITTED' && (command === 'COOPERATE' || command === 'DEFECT')) {
      const playerMove = command as Move
      const { botMove, nonce, commitment } = game

      // Calculate points
      const points = this.PAYOFF_MATRIX[botMove][playerMove]
      game.rounds.push({
        playerMove,
        botMove,
        playerPoints: points.player,
        botPoints: points.bot
      })

      // Verify and reveal
      const verificationMessage = this.verifyCommitment(botMove, nonce, commitment)
        ? "✅ Verification successful! You can check my commitment by hashing my move and nonce."
        : "❌ Something went wrong with verification!"

      await this.sendMessage(
        `Your move: ${playerMove}\n` +
        `My move: ${botMove}\n` +
        `Nonce: ${nonce}\n\n` +
        `${verificationMessage}\n\n` +
        `Points this round:\n` +
        `You: ${points.player}\n` +
        `Me: ${points.bot}\n\n` +
        "Type 'play' for another round or 'stats' to see your game history!"
      )

      game.state = 'FINISHED'
    }

    if (command === 'STATS' && game.rounds.length > 0) {
      const totalPlayerPoints = game.rounds.reduce((sum, round) => sum + round.playerPoints, 0)
      const totalBotPoints = game.rounds.reduce((sum, round) => sum + round.botPoints, 0)
      
      await this.sendMessage(
        `Game Statistics:\n` +
        `Total Rounds: ${game.rounds.length}\n` +
        `Your Total Points: ${totalPlayerPoints}\n` +
        `My Total Points: ${totalBotPoints}\n\n` +
        `Your Cooperation Rate: ${(game.rounds.filter(r => r.playerMove === 'COOPERATE').length / game.rounds.length * 100).toFixed(1)}%\n` +
        `My Cooperation Rate: ${(game.rounds.filter(r => r.botMove === 'COOPERATE').length / game.rounds.length * 100).toFixed(1)}%`
      )
    }
  }
} 