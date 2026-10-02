import React, { useMemo, useState, useEffect } from 'react';
import {
  AssetClass,
  BudgetProfile,
  INVESTMENT_INSTRUMENTS,
  InvestmentHolding,
  InvestmentInstrumentOption,
} from '../types';
import {
  Coins,
  Landmark,
  Layers,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

interface InvestmentHubProps {
  budget: BudgetProfile;
  investments: InvestmentHolding[];
  initialSelectedAssetClass?: AssetClass | 'All';
  initialSelectedInstrumentName?: string | null;
  onInvestFromSavings: (params: {
    instrument: InvestmentInstrumentOption;
    amountToInvest: number;
    autoInvestMonthly: number;
  }) => Promise<void>;
  onAddExternalSavingsDeposit: (amount: number) => Promise<void>;
}

const ASSET_CLASSES: ('All' | AssetClass)[] = [
  'All',
  'Low-Risk Savings',
  'Automated Index Funds',
  'Crypto',
  'P2P Lending',
  'Digital Gold & Silver',
];

const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  'Low-Risk Savings': '#10B981',
  'Automated Index Funds': '#3B82F6',
  Crypto: '#8B5CF6',
  'P2P Lending': '#F97316',
  'Digital Gold & Silver': '#EAB308',
};

export const InvestmentHub: React.FC<InvestmentHubProps> = ({
  budget,
  investments,
  initialSelectedAssetClass = 'All',
  initialSelectedInstrumentName = null,
  onInvestFromSavings,
  onAddExternalSavingsDeposit,
}) => {
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<
    'All' | AssetClass
  >(initialSelectedAssetClass);
  const [selectedInstrument, setSelectedInstrument] =
    useState<InvestmentInstrumentOption>(INVESTMENT_INSTRUMENTS[0]);
  const [investAmountStr, setInvestAmountStr] = useState('25');
  const [autoMonthlyStr, setAutoMonthlyStr] = useState('15');
  const [horizonYears, setHorizonYears] = useState(4); // 4-year graduation horizon
  const [isInvesting, setIsInvesting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedAssetClass) {
      setSelectedAssetFilter(initialSelectedAssetClass);
    }
    if (initialSelectedInstrumentName) {
      const match = INVESTMENT_INSTRUMENTS.find(
        (inst) => inst.instrumentName === initialSelectedInstrumentName
      );
      if (match) {
        setSelectedInstrument(match);
      }
    }
  }, [initialSelectedAssetClass, initialSelectedInstrumentName]);

  const filteredInstruments = useMemo(() => {
    if (selectedAssetFilter === 'All') return INVESTMENT_INSTRUMENTS;
    return INVESTMENT_INSTRUMENTS.filter(
      (i) => i.assetClass === selectedAssetFilter
    );
  }, [selectedAssetFilter]);

  const totalPortfolioValue = useMemo(
    () => investments.reduce((sum, i) => sum + i.investedAmount, 0),
    [investments]
  );

  const allocationByAssetClass = useMemo(() => {
    const map: Record<AssetClass, number> = {
      'Low-Risk Savings': 0,
      'Automated Index Funds': 0,
      Crypto: 0,
      'P2P Lending': 0,
      'Digital Gold & Silver': 0,
    };
    for (const inv of investments) {
      map[inv.assetClass] = (map[inv.assetClass] || 0) + inv.investedAmount;
    }
    return map;
  }, [investments]);

  const weightedPortfolioApy = useMemo(() => {
    if (totalPortfolioValue <= 0) return 8.5;
    const weighted = investments.reduce(
      (sum, i) => sum + i.investedAmount * i.expectedApy,
      0
    );
    return weighted / totalPortfolioValue;
  }, [investments, totalPortfolioValue]);

  const totalAutoMonthlyContribution = useMemo(
    () => investments.reduce((sum, i) => sum + (i.autoInvestMonthly || 0), 0),
    [investments]
  );

  // Compound growth projection over horizonYears
  const projectedGraduationBalance = useMemo(() => {
    const r = weightedPortfolioApy / 100 / 12;
    const n = horizonYears * 12;
    const pv = totalPortfolioValue;
    const pmt = totalAutoMonthlyContribution;
    if (r === 0) return pv + pmt * n;
    const futureValuePV = pv * Math.pow(1 + r, n);
    const futureValuePMT = pmt * ((Math.pow(1 + r, n) - 1) / r);
    return futureValuePV + futureValuePMT;
  }, [
    totalPortfolioValue,
    weightedPortfolioApy,
    totalAutoMonthlyContribution,
    horizonYears,
  ]);

  const handleExecuteInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);

    const amt = parseFloat(investAmountStr);
    const autoAmt = parseFloat(autoMonthlyStr) || 0;

    if (isNaN(amt) || amt < selectedInstrument.minInvestment) {
      setErrorMessage(
        `Minimum allocation for ${selectedInstrument.instrumentName} is $${selectedInstrument.minInvestment}.`
      );
      return;
    }

    if (amt > budget.savingsBalance) {
      setErrorMessage(
        `Insufficient uninvested Savings Pool balance ($${budget.savingsBalance.toFixed(
          2
        )} available). Sweep savings or top up your pool first.`
      );
      return;
    }

    setIsInvesting(true);
    try {
      await onInvestFromSavings({
        instrument: selectedInstrument,
        amountToInvest: Number(amt.toFixed(2)),
        autoInvestMonthly: Number(Math.max(0, autoAmt).toFixed(2)),
      });
      setFeedbackMessage(
        `Allocated $${amt.toFixed(2)} from your Savings Pool into ${
          selectedInstrument.instrumentName
        }.`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Investment allocation failed.'
      );
    } finally {
      setIsInvesting(false);
    }
  };

  const getAssetIcon = (assetClass: AssetClass) => {
    switch (assetClass) {
      case 'Low-Risk Savings':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'Automated Index Funds':
        return <LineChart className="w-4 h-4 text-blue-400" />;
      case 'Crypto':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'P2P Lending':
        return <Users className="w-4 h-4 text-orange-400" />;
      case 'Digital Gold & Silver':
        return <Coins className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Diversification & Multi-Asset Header */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-white">
              Multi-Asset Student Wealth & Diversification Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Deploy money saved from your monthly budget directly into Low-Risk Savings, Automated Index Funds, Crypto, P2P Lending, and Digital Gold & Silver.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 rounded-lg bg-[#0B0F17] border border-slate-800">
              <span className="text-[11px] text-slate-400 block">
                Uninvested Savings Pool
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-base font-mono tabular-nums font-semibold text-emerald-400">
                  ${budget.savingsBalance.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onAddExternalSavingsDeposit(50)}
                  className="text-[11px] font-medium text-slate-300 hover:text-white underline cursor-pointer"
                >
                  +Add $50 Saved Cash
                </button>
              </div>
            </div>

            <div className="px-4 py-2 rounded-lg bg-[#0B0F17] border border-slate-800">
              <span className="text-[11px] text-slate-400 block">
                Total Invested Portfolio
              </span>
              <span className="text-base font-mono tabular-nums font-semibold text-white">
                ${totalPortfolioValue.toFixed(2)}{' '}
                <span className="text-xs text-emerald-400 font-normal">
                  ({weightedPortfolioApy.toFixed(2)}% Avg APY)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 5-Asset Diversification Bar & Breakdown */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Asset Class Diversification Breakdown</span>
            <span className="font-mono tabular-nums">
              Auto-Invest Cadence: +${totalAutoMonthlyContribution.toFixed(0)}/mo
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            {(Object.keys(allocationByAssetClass) as AssetClass[]).map((ac) => {
              const val = allocationByAssetClass[ac];
              const pct =
                totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={ac}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: ASSET_CLASS_COLORS[ac],
                  }}
                  title={`${ac}: $${val.toFixed(2)} (${pct.toFixed(1)}%)`}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                />
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(allocationByAssetClass) as AssetClass[]).map((ac) => {
              const val = allocationByAssetClass[ac];
              const pct =
                totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;
              return (
                <div
                  key={ac}
                  className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800/80"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }}
                    />
                    <span className="truncate">{ac}</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-sm font-semibold text-white">
                      ${val.toFixed(0)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Investment Workspace: Left Catalog + Right Direct Allocation Ticket & Compound Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: 5 Asset Classes Catalog */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">
                Available Investment Vehicles
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any low-risk vault, index ETF, crypto basket, P2P pool, or vaulted gold/silver instrument to allocate saved funds.
              </p>
            </div>
          </div>

          {/* Segmented Asset Class Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            {ASSET_CLASSES.map((ac) => (
              <button
                key={ac}
                onClick={() => setSelectedAssetFilter(ac)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedAssetFilter === ac
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ac}
              </button>
            ))}
          </div>

          {/* Instrument Cards List */}
          <div className="space-y-3">
            {filteredInstruments.map((inst) => {
              const isSelected = selectedInstrument.id === inst.id;
              const existingHolding = investments.find(
                (h) => h.instrumentName === inst.instrumentName
              );

              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstrument(inst)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B0F17] border-emerald-500'
                      : 'bg-[#0B0F17]/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {getAssetIcon(inst.assetClass)}
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {inst.instrumentName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span>{inst.assetClass}</span>
                          <span aria-hidden="true">·</span>
                          <span>Risk: {inst.riskTier}</span>
                          <span aria-hidden="true">·</span>
                          <span>{inst.lockInPeriod}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono tabular-nums">
                      <span className="text-sm font-semibold text-emerald-400 block">
                        {inst.expectedApy.toFixed(2)}% Est. APY
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Min ${inst.minInvestment} · ${inst.unitPrice.toFixed(2)}/{inst.tickerOrUnit}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    {inst.summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{inst.backingDetail}</span>
                    {existingHolding ? (
                      <span className="font-mono tabular-nums text-emerald-400 font-medium">
                        Currently Held: ${existingHolding.investedAmount.toFixed(2)} (
                        {existingHolding.unitsOwned.toFixed(3)} {inst.tickerOrUnit})
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Click to allocate from Savings Pool →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Direct Savings-to-Investment Order Ticket + Graduation Projector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
            <div className="pb-4 border-b border-slate-800">
              <div className="text-xs text-emerald-400 font-medium">
                Direct Savings-to-Asset Execution
              </div>
              <h2 className="text-base font-semibold text-white mt-0.5">
                {selectedInstrument.instrumentName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{selectedInstrument.assetClass}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-emerald-400">
                  {selectedInstrument.expectedApy}% APY
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedInstrument.lockInPeriod}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteInvestment} className="mt-4 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}
              {feedbackMessage && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                  {feedbackMessage}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">
                    Amount to Invest from Savings Pool (USD)
                  </label>
                  <span className="font-mono tabular-nums text-slate-400">
                    Pool Available: ${budget.savingsBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min={selectedInstrument.minInvestment}
                    required
                    value={investAmountStr}
                    onChange={(e) => setInvestAmountStr(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setInvestAmountStr(
                        Math.max(
                          selectedInstrument.minInvestment,
                          Number(budget.savingsBalance.toFixed(2))
                        ).toString()
                      )
                    }
                    className="px-3 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Max Pool
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Automated Monthly Savings Sweep (Optional Recurring SIP)
                </label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="10000"
                  value={autoMonthlyStr}
                  onChange={(e) => setAutoMonthlyStr(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatically routes saved budget surplus each month into this position.
                </p>
              </div>

              {/* Execution Preview Math */}
              <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estimated Units / Weight</span>
                  <span className="font-mono tabular-nums text-white font-medium">
                    {(
                      (parseFloat(investAmountStr) || 0) /
                      selectedInstrument.unitPrice
                    ).toFixed(4)}{' '}
                    {selectedInstrument.tickerOrUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Projected 1-Year Yield</span>
                  <span className="font-mono tabular-nums text-emerald-400 font-medium">
                    +$
                    {(
                      ((parseFloat(investAmountStr) || 0) *
                        selectedInstrument.expectedApy) /
                      100
                    ).toFixed(2)}{' '}
                    ({selectedInstrument.expectedApy}% APY)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Remaining Savings Pool</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    $
                    {Math.max(
                      0,
                      budget.savingsBalance - (parseFloat(investAmountStr) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInvesting}
                className="w-full py-2.5 px-4 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4" />
                {isInvesting
                  ? 'Executing Allocation...'
                  : `Invest $${
                      parseFloat(investAmountStr) > 0
                        ? parseFloat(investAmountStr).toFixed(2)
                        : '0.00'
                    } into ${selectedInstrument.assetClass}`}
              </button>
            </form>
          </div>

          {/* Long-Term Compounding Simulator */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  Long-Term Student Compounding Horizon
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projects current holdings + monthly auto-invest sweeps
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                {horizonYears} Years
              </span>
            </div>

            <div className="mt-4">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={horizonYears}
                onChange={(e) => setHorizonYears(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1">
                <span>1 Yr (Next Academic Yr)</span>
                <span>4 Yrs (Graduation)</span>
                <span>10 Yrs (Post-Grad)</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">
                  Projected Portfolio Value in {horizonYears}{' '}
                  {horizonYears === 1 ? 'Year' : 'Years'}
                </span>
                <span className="text-xl font-mono tabular-nums font-semibold text-white mt-0.5 block">
                  ${projectedGraduationBalance.toFixed(2)}
                </span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="text-xs text-slate-400 block">
                  Compound Gain
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  +$
                  {Math.max(
                    0,
                    projectedGraduationBalance -
                      (totalPortfolioValue +
                        totalAutoMonthlyContribution * horizonYears * 12)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Active Holdings Ledger Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">
              Your Active Multi-Asset Positions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live breakdown across Low-Risk Savings, Index Funds, Crypto, P2P Lending, and Digital Gold & Silver
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {investments.length} active holdings
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2.5 px-3">Asset Class</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Risk Profile</th>
                <th className="py-2.5 px-3 text-right">Units / Grams / Shares</th>
                <th className="py-2.5 px-3 text-right">Target APY</th>
                <th className="py-2.5 px-3 text-right">Monthly Auto-Sweep</th>
                <th className="py-2.5 px-3 text-right">Invested Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {investments.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-200 whitespace-nowrap">
                    {inv.assetClass}
                  </td>
                  <td className="py-2.5 px-3 text-white font-medium">
                    {inv.instrumentName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {inv.riskTier}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                    {inv.unitsOwned.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400">
                    {inv.expectedApy.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                    +${inv.autoInvestMonthly.toFixed(2)}/mo
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-white">
                    ${inv.investedAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
