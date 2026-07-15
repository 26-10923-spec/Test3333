export interface User {
  id: string;
  username: string;
  points: number;
  totalEarned: number;
  clickPower: number;
  passiveIncome: number;
  level: number;
  experience: number;
  clicksCount: number;
  registeredAt: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: number;
  count: number;
  type: 'click' | 'passive';
  iconName: string;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  level: number;
  isCurrentUser?: boolean;
}
