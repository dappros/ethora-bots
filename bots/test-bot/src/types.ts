export interface BotUser {
  id: string;
  xmppPassword: string;
  walletAddress: string;
  accessToken: string;
}

export interface RoomListResponse {
  items: Array<{
    jid: string;
    name: string;
    description: string;
    participants: number;
  }>;
} 