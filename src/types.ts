export type ExpenseCategory =
  | 'Food & Dining'
  | 'Textbooks & Academic'
  | 'Campus Transit'
  | 'Subscriptions & Apps'
  | 'Coffee & Social'
  | 'Dorm & Essentials';

export type PaymentMethod = 'Campus Card' | 'Debit Card' | 'UPI / Wallet' | 'Cash';

export type AssetClass =
  | 'Low-Risk Savings'
  | 'Automated Index Funds'
  | 'Crypto'
  | 'P2P Lending'
  | 'Digital Gold & Silver';

export type RiskTier = 'Low' | 'Moderate' | 'High' | 'Precious Metal';

export interface BudgetProfile {
  userId: string;
  monthlyAllowance: number;
  savingsBalance: number;
  alertThresholdPercent: number;
  foodLimit: number;
  housingLimit: number;
  transitLimit: number;
  subscriptionsLimit: number;
  socialLimit: number;
  essentialsLimit: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExpenseRecord {
  id: string;
  userId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  dateStr: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  roundUpSaved: number;
  createdAt?: unknown;
}

export interface InvestmentHolding {
  id: string;
  userId: string;
  assetClass: AssetClass;
  instrumentName: string;
  investedAmount: number;
  unitsOwned: number;
  expectedApy: number;
  riskTier: RiskTier;
  autoInvestMonthly: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InvestmentInstrumentOption {
  id: string;
  assetClass: AssetClass;
  instrumentName: string;
  tickerOrUnit: string;
  unitPrice: number;
  expectedApy: number;
  riskTier: RiskTier;
  minInvestment: number;
  lockInPeriod: string;
  summary: string;
  backingDetail: string;
}

export interface SavingsSuggestion {
  id: string;
  title: string;
  category: ExpenseCategory;
  monthlySavingsPotential: number;
  reason: string;
  recommendedAssetClass: AssetClass;
  recommendedInstrument: string;
  projectedOneYearValue: number;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Textbooks & Academic',
  'Campus Transit',
  'Subscriptions & Apps',
  'Coffee & Social',
  'Dorm & Essentials',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Campus Card',
  'Debit Card',
  'UPI / Wallet',
  'Cash',
];

export const INVESTMENT_INSTRUMENTS: InvestmentInstrumentOption[] = [
  {
    id: 'savings_campus_vault',
    assetClass: 'Low-Risk Savings',
    instrumentName: 'Campus High-Yield Savings Vault',
    tickerOrUnit: 'USD Vault',
    unitPrice: 1.0,
    expectedApy: 4.85,
    riskTier: 'Low',
    minInvestment: 5,
    lockInPeriod: 'Instant Liquidity',
    summary: 'FDIC-insured partner student cash reserve with daily compounding interest and zero monthly fees.',
    backingDetail: 'Backed by short-term US Treasury bills & partner banking sweep.',
  },
  {
    id: 'savings_tbill_ladder',
    assetClass: 'Low-Risk Savings',
    instrumentName: '90-Day Student T-Bill Reserve',
    tickerOrUnit: 'T-BILL',
    unitPrice: 10.0,
    expectedApy: 5.25,
    riskTier: 'Low',
    minInvestment: 10,
    lockInPeriod: '30-Day Rolling',
    summary: 'Ultra-safe sovereign treasury ladder tailored for semester tuition and emergency reserves.',
    backingDetail: '100% Sovereign Treasury backed.',
  },
  {
    id: 'index_sp500',
    assetClass: 'Automated Index Funds',
    instrumentName: 'Vanguard S&P 500 Fractional ETF (VOO)',
    tickerOrUnit: 'Shares',
    unitPrice: 512.4,
    expectedApy: 10.4,
    riskTier: 'Moderate',
    minInvestment: 5,
    lockInPeriod: 'T+1 Settlement',
    summary: 'Automated dollar-cost averaging into the 500 largest US public companies with auto-dividend reinvestment.',
    backingDetail: '0.03% expense ratio · Fractional share routing.',
  },
  {
    id: 'index_global_tech',
    assetClass: 'Automated Index Funds',
    instrumentName: 'Global Clean Tech & Innovation Index',
    tickerOrUnit: 'Shares',
    unitPrice: 148.2,
    expectedApy: 12.1,
    riskTier: 'Moderate',
    minInvestment: 10,
    lockInPeriod: 'T+1 Settlement',
    summary: 'Broad thematic basket capturing global semiconductor, AI infrastructure, and renewable energy leaders.',
    backingDetail: 'Automated quarterly rebalancing.',
  },
  {
    id: 'crypto_bluechip',
    assetClass: 'Crypto',
    instrumentName: 'Blue-Chip Crypto Basket (70% BTC / 30% ETH)',
    tickerOrUnit: 'Basket Units',
    unitPrice: 250.0,
    expectedApy: 18.5,
    riskTier: 'High',
    minInvestment: 5,
    lockInPeriod: '24/7 Instant',
    summary: 'Institutional cold-storage digital asset allocation with automated ETH staking yield.',
    backingDetail: 'Auto-rebalanced BTC & staked ETH.',
  },
  {
    id: 'crypto_usdc_yield',
    assetClass: 'Crypto',
    instrumentName: 'Audited Stablecoin DeFi Lending Pool (USDC)',
    tickerOrUnit: 'USDC',
    unitPrice: 1.0,
    expectedApy: 8.4,
    riskTier: 'Moderate',
    minInvestment: 10,
    lockInPeriod: '24/7 Instant',
    summary: 'Over-collateralized algorithmic lending protocol yield without volatile token price exposure.',
    backingDetail: '150% over-collateralized smart contract pool.',
  },
  {
    id: 'p2p_student_micro',
    assetClass: 'P2P Lending',
    instrumentName: 'Verified Campus Peer Micro-Credit Pool',
    tickerOrUnit: 'Notes',
    unitPrice: 25.0,
    expectedApy: 11.2,
    riskTier: 'Moderate',
    minInvestment: 25,
    lockInPeriod: '60-Day Note',
    summary: 'Diversified fractional notes funding verified grad-student textbook and lab equipment microloans.',
    backingDetail: 'Spread across 40+ credit-vetted student borrowers.',
  },
  {
    id: 'p2p_sme_invoice',
    assetClass: 'P2P Lending',
    instrumentName: 'Merchant Invoice Factoring Pool',
    tickerOrUnit: 'Notes',
    unitPrice: 50.0,
    expectedApy: 13.6,
    riskTier: 'High',
    minInvestment: 25,
    lockInPeriod: '90-Day Note',
    summary: 'Short-duration fixed-income notes backed by verified university vendor receivables.',
    backingDetail: 'Monthly principal + interest distributions.',
  },
  {
    id: 'metal_digital_gold',
    assetClass: 'Digital Gold & Silver',
    instrumentName: '24K 99.99% Swiss Vaulted Digital Gold',
    tickerOrUnit: 'Grams (Au)',
    unitPrice: 86.5,
    expectedApy: 9.2,
    riskTier: 'Precious Metal',
    minInvestment: 5,
    lockInPeriod: 'Instant or Physical Redemption',
    summary: 'Fractional ownership of LBMA-accredited 24K gold bullion stored in insured Zurich vaults.',
    backingDetail: '100% allocated physical gold · Inflation hedge.',
  },
  {
    id: 'metal_digital_silver',
    assetClass: 'Digital Gold & Silver',
    instrumentName: '99.9% Fine Industrial Digital Silver',
    tickerOrUnit: 'Ounces (Ag)',
    unitPrice: 31.8,
    expectedApy: 8.7,
    riskTier: 'Precious Metal',
    minInvestment: 5,
    lockInPeriod: 'Instant or Physical Redemption',
    summary: 'Dual monetary and solar/EV industrial precious metal hedge with zero storage fees for students.',
    backingDetail: '100% allocated physical silver bars.',
  },
];
