
export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING'
}

export enum Direction {
  LONG = 'Long',
  SHORT = 'Short',
  CALL = 'Call Options',
  PUT = 'Put Options'
}

export enum Outcome {
  WIN = 'WIN',
  LOSS = 'LOSS',
  BREAK_EVEN = 'BREAK_EVEN'
}

export enum Session {
  ASIA = 'Asia',
  LONDON = 'London',
  NY_AM = 'NY AM',
  NY_LUNCH = 'NY Lunch',
  NY_PM = 'NY PM',
  OTHER = 'Other'
}

export enum AccountStatus {
  EVAL_PHASE_1 = 'Eval Phase 1',
  EVAL_PHASE_2 = 'Eval Phase 2',
  FUNDED = 'Funded',
  FAILED = 'Failed',
  BREACHED = 'Breached'
}

export interface Payout {
  id: string;
  amount: number;
  date: string; // ISO String
  note?: string;
}

export interface PropAccount {
  id: string;
  firmName: string; // e.g. FTMO, Apex
  accountSize: number;
  cost: number; // Initial Signup Fee
  
  // New Expense Tracking
  isSubscription: boolean; // Is this a monthly subscription model?
  monthlyFee?: number; // The recurring monthly cost
  activationFee?: number; // One-time fee paid upon funding
  
  targetProfit?: number; // Manual target for evaluation phase
  totalPayouts: number; // Total withdrawn
  payoutCount: number; // Number of withdrawals
  payouts: Payout[]; // History of payouts
  status: AccountStatus;
  
  // Date Tracking
  dateAdded: string; // Purchased Date
  dateFunded?: string; // Passed Date
  dateEnded?: string; // If Failed/Breached, when did it happen? (Stops billing)
  
  certificate?: string; // Base64 image of the certificate
}

export interface Trade {
  id: string;
  accountId?: string; // Link to PropAccount
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  size: number;
  stopLoss?: number;
  direction: Direction;
  session: Session;
  entryDate: string; // ISO String
  exitDate: string; // ISO String
  status: TradeStatus;
  outcome?: Outcome;
  pnl: number;
  riskPercentage?: number;
  rMultiple?: number;
  setup: string;
  mistakes: string[];
  notes: string;
  commission: number;
  screenshot?: string;
}

export interface Metrics {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  bestDay: number;
  worstDay: number;
  currentStreak: number;
}

export interface ChartPoint {
  date: string;
  pnl: number;
  cumulativePnl: number;
}

export interface AnalysisResponse {
  summary: string;
  advice: string;
  rating: number; // 1-10
  tags: string[];
}