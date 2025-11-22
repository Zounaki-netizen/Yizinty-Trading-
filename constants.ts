
import { Trade, TradeStatus, Direction, Outcome, ChartPoint, Session, PropAccount, AccountStatus } from './types';

export const FIRM_LOGOS: {[key: string]: string} = {
    // Optimized Favicon Calls (Size 64 or 128 for reliability)
    'apex': 'https://www.google.com/s2/favicons?domain=apextraderfunding.com&sz=64',
    'apex trader': 'https://www.google.com/s2/favicons?domain=apextraderfunding.com&sz=64',
    'apex trader funding': 'https://www.google.com/s2/favicons?domain=apextraderfunding.com&sz=64',
    
    'topstep': 'https://www.google.com/s2/favicons?domain=topstep.com&sz=128',
    'funding pips': 'https://www.google.com/s2/favicons?domain=fundingpips.com&sz=128',
    'fundednext': 'https://www.google.com/s2/favicons?domain=fundednext.com&sz=128',
    
    'alpha futures': 'https://www.google.com/s2/favicons?domain=alpha-futures.com&sz=128',
    'alpha': 'https://www.google.com/s2/favicons?domain=alpha-futures.com&sz=128',
    
    'my funded futures': 'https://www.google.com/s2/favicons?domain=myfundedfutures.com&sz=128',
    'myfundedfutures': 'https://www.google.com/s2/favicons?domain=myfundedfutures.com&sz=128',
    
    'ftmo': 'https://www.google.com/s2/favicons?domain=ftmo.com&sz=128',
    'the5ers': 'https://www.google.com/s2/favicons?domain=the5ers.com&sz=128',
    'e8': 'https://www.google.com/s2/favicons?domain=e8funding.com&sz=128',
    
    'funding ticks': 'https://www.google.com/s2/favicons?domain=fundingticks.com&sz=128',
    'fundingticks': 'https://www.google.com/s2/favicons?domain=fundingticks.com&sz=128'
};

export const MOCK_ACCOUNTS: PropAccount[] = [
  {
    id: 'acc_1',
    firmName: 'FTMO',
    accountSize: 100000,
    cost: 540,
    isSubscription: false,
    activationFee: 0,
    totalPayouts: 2500,
    payoutCount: 1,
    payouts: [
      { id: 'p1', amount: 2500, date: '2025-10-01T10:00:00Z', note: 'First withdrawal' }
    ],
    status: AccountStatus.FUNDED,
    dateAdded: '2025-01-01',
    dateFunded: '2025-02-15'
  },
  {
    id: 'acc_2',
    firmName: 'Apex',
    accountSize: 50000,
    cost: 40, // Initial cheap entry
    isSubscription: true,
    monthlyFee: 160, // Recurring
    activationFee: 140, // PA Fee
    targetProfit: 3000, 
    totalPayouts: 0,
    payoutCount: 0,
    payouts: [],
    status: AccountStatus.EVAL_PHASE_1,
    dateAdded: '2025-10-15'
  },
  {
    id: 'acc_3',
    firmName: 'Topstep',
    accountSize: 150000,
    cost: 149,
    isSubscription: true,
    monthlyFee: 149,
    totalPayouts: 0,
    payoutCount: 0,
    payouts: [],
    status: AccountStatus.FAILED,
    dateAdded: '2025-08-10',
    dateEnded: '2025-09-15' // Failed after 1 month
  }
];

// Updated dates to November 2025 as requested
export const MOCK_TRADES: Trade[] = [
  {
    id: 't1',
    accountId: 'acc_1',
    symbol: 'NVDA',
    entryPrice: 880.50,
    exitPrice: 895.20,
    size: 50,
    direction: Direction.LONG,
    session: Session.NY_AM,
    entryDate: '2025-11-20T09:30:00Z',
    exitDate: '2025-11-20T10:15:00Z',
    status: TradeStatus.CLOSED,
    outcome: Outcome.WIN,
    pnl: 735.00,
    riskPercentage: 1,
    rMultiple: 2.1,
    setup: 'Bull Flag',
    mistakes: [],
    notes: 'Strong opening drive, held through pullback.',
    commission: 5.00,
    screenshot: 'https://picsum.photos/800/400'
  },
  {
    id: 't2',
    accountId: 'acc_1',
    symbol: 'TSLA',
    entryPrice: 210.00,
    exitPrice: 208.50,
    size: 100,
    direction: Direction.LONG,
    session: Session.NY_AM,
    entryDate: '2025-11-20T11:00:00Z',
    exitDate: '2025-11-20T11:30:00Z',
    status: TradeStatus.CLOSED,
    outcome: Outcome.LOSS,
    pnl: -150.00,
    riskPercentage: 0.5,
    rMultiple: -1,
    setup: 'Reversal',
    mistakes: ['Fomo Entry'],
    notes: 'Entered too early before confirmation.',
    commission: 5.00
  },
  {
    id: 't3',
    accountId: 'acc_2',
    symbol: 'AMD',
    entryPrice: 105.20,
    exitPrice: 103.80,
    size: 200,
    direction: Direction.SHORT,
    session: Session.NY_AM,
    entryDate: '2025-11-21T09:45:00Z',
    exitDate: '2025-11-21T10:30:00Z',
    status: TradeStatus.CLOSED,
    outcome: Outcome.WIN,
    pnl: 280.00,
    riskPercentage: 1,
    rMultiple: 1.5,
    setup: 'Breakdown',
    mistakes: [],
    notes: 'Clean break of VWAP.',
    commission: 6.00
  },
  {
    id: 't4',
    accountId: 'acc_1',
    symbol: 'SPY',
    entryPrice: 420.00,
    exitPrice: 418.00,
    size: 100,
    direction: Direction.LONG,
    session: Session.NY_PM,
    entryDate: '2025-11-21T14:00:00Z',
    exitDate: '2025-11-21T15:00:00Z',
    status: TradeStatus.CLOSED,
    outcome: Outcome.LOSS,
    pnl: -200.00,
    riskPercentage: 0.8,
    rMultiple: -1,
    setup: 'Support Bounce',
    mistakes: ['Stop Moved'],
    notes: 'Market was heavy, tried to catch a falling knife.',
    commission: 2.00
  },
  {
    id: 't5',
    accountId: 'acc_2',
    symbol: 'META',
    entryPrice: 300.00,
    exitPrice: 305.00,
    size: 50,
    direction: Direction.LONG,
    session: Session.NY_LUNCH,
    entryDate: '2025-11-22T10:00:00Z',
    exitDate: '2025-11-22T12:00:00Z',
    status: TradeStatus.CLOSED,
    outcome: Outcome.WIN,
    pnl: 250.00,
    riskPercentage: 1.2,
    rMultiple: 2.5,
    setup: 'Gap Fill',
    mistakes: [],
    notes: 'Perfect execution on the gap fill strategy.',
    commission: 4.00
  },
  {
    id: 't6',
    accountId: 'acc_3',
    symbol: 'AAPL',
    entryPrice: 170.00,
    exitPrice: 169.50,
    size: 100,
    direction: Direction.LONG,
    session: Session.NY_PM,
    entryDate: '2025-11-22T13:30:00Z',
    exitDate: '2025-11-22T13:45:00Z',
    status: TradeStatus.CLOSED,
    outcome: Outcome.LOSS,
    pnl: -50.00,
    riskPercentage: 0.2,
    rMultiple: -0.5,
    setup: 'Trend Follow',
    mistakes: ['Hesitation'],
    notes: 'Got scared and cut early, it eventually worked.',
    commission: 3.00
  }
];

export const MOCK_CHART_DATA: ChartPoint[] = [
  { date: '11/15', pnl: 0, cumulativePnl: 0 },
  { date: '11/16', pnl: 150, cumulativePnl: 150 },
  { date: '11/17', pnl: -50, cumulativePnl: 100 },
  { date: '11/18', pnl: 300, cumulativePnl: 400 },
  { date: '11/19', pnl: 120, cumulativePnl: 520 },
  { date: '11/20', pnl: 585, cumulativePnl: 1105 },
  { date: '11/21', pnl: 80, cumulativePnl: 1185 },
  { date: '11/22', pnl: 200, cumulativePnl: 1385 },
];

export const SETUP_TYPES = [
  'Fair Value Gap (FVG)',
  'Order Block',
  'Silver Bullet',
  'Liquidity Sweep',
  'Judas Swing',
  'Market Structure Shift',
  'Optimal Trade Entry (OTE)',
  'Breaker Block',
  'Bull Flag', 
  'Bear Flag', 
  'Reversal', 
  'Breakout'
];

export const MISTAKE_TYPES = [
  'Fomo Entry', 
  'Revenge Trading', 
  'Stop Moved', 
  'Too Large Size', 
  'Hesitation', 
  'Exited Early', 
  'Did Not Plan',
  'Counter Trend',
  'News Trading'
];
