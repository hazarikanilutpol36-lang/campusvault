import React, { useState, useEffect } from 'react';
import {
  BudgetProfile,
  ExpenseCategory,
  ExpenseRecord,
  SavingsSuggestion,
} from '../types';
import {
  CheckCircle2,
  Sliders,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface SavingsOptimizerProps {
  budget: BudgetProfile;
  expenses: ExpenseRecord[];
  suggestions: SavingsSuggestion[];
  claimedIds: string[];
  onClaimSuggestion: (suggestion: SavingsSuggestion) => Promise<void>;
  onInvestSuggestion: (suggestion: SavingsSuggestion) => void;
  onUpdateBudgetLimits: (updated: {
    monthlyAllowance: number;
    alertThresholdPercent: number;
    foodLimit: number;
    housingLimit: number;
    transitLimit: number;
    subscriptionsLimit: number;
    socialLimit: number;
    essentialsLimit: number;
  }) => Promise<void>;
}

export const SavingsOptimizer: React.FC<SavingsOptimizerProps> = ({
  budget,
  expenses,
  suggestions,
  claimedIds,
  onClaimSuggestion,
  onInvestSuggestion,
  onUpdateBudgetLimits,
}) => {
  const [allowance, setAllowance] = useState(budget.monthlyAllowance);
  const [threshold, setThreshold] = useState(budget.alertThresholdPercent);
  const [foodLimit, setFoodLimit] = useState(budget.foodLimit);
  const [housingLimit, setHousingLimit] = useState(budget.housingLimit);
  const [transitLimit, setTransitLimit] = useState(budget.transitLimit);
  const [subscriptionsLimit, setSubscriptionsLimit] = useState(
    budget.subscriptionsLimit
  );
  const [socialLimit, setSocialLimit] = useState(budget.socialLimit);
  const [essentialsLimit, setEssentialsLimit] = useState(budget.essentialsLimit);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setAllowance(budget.monthlyAllowance);
    setThreshold(budget.alertThresholdPercent);
    setFoodLimit(budget.foodLimit);
    setHousingLimit(budget.housingLimit);
    setTransitLimit(budget.transitLimit);
    setSubscriptionsLimit(budget.subscriptionsLimit);
    setSocialLimit(budget.socialLimit);
    setEssentialsLimit(budget.essentialsLimit);
  }, [budget]);

  const totalAllocatedLimits =
    foodLimit +
    housingLimit +
    transitLimit +
    subscriptionsLimit +
    socialLimit +
    essentialsLimit;

  const projectedMonthlySurplus = Math.max(0, allowance - totalAllocatedLimits);

  const totalPotentialFromPatterns = suggestions.reduce(
    (sum, s) => sum + s.monthlySavingsPotential,
    0
  );

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBudget(true);
    try {
      await onUpdateBudgetLimits({
        monthlyAllowance: Math.max(0, Math.min(1000000, Number(allowance))),
        alertThresholdPercent: Math.max(50, Math.min(100, Number(threshold))),
        foodLimit: Math.max(0, Math.min(100000, Number(foodLimit))),
        housingLimit: Math.max(0, Math.min(100000, Number(housingLimit))),
        transitLimit: Math.max(0, Math.min(100000, Number(transitLimit))),
        subscriptionsLimit: Math.max(
          0,
          Math.min(100000, Number(subscriptionsLimit))
        ),
        socialLimit: Math.max(0, Math.min(100000, Number(socialLimit))),
        essentialsLimit: Math.max(0, Math.min(100000, Number(essentialsLimit))),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const categorySpent = (cat: ExpenseCategory) =>
    expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Pattern-Based Savings Engine Section */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Smart Spending-Pattern Savings Engine
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzes your actual monthly category velocity, recurring subscriptions, and dining habits to unlock investable surplus.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block">Available Savings Pool</span>
              <span className="text-base font-mono tabular-nums font-semibold text-emerald-400">
                ${budget.savingsBalance.toFixed(2)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-slate-400 block">Monthly Optimization Potential</span>
              <span className="text-base font-mono tabular-nums font-semibold text-white">
                +${totalPotentialFromPatterns.toFixed(0)}/mo
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {suggestions.map((sug) => {
            const isClaimed = claimedIds.includes(sug.id);
            return (
              <div
                key={sug.id}
                className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {sug.category} · Pattern Audit
                    </span>
                    <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                      +${sug.monthlySavingsPotential.toFixed(2)} / month
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-white mt-2">
                    {sug.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {sug.reason}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Direct Allocation Match:{' '}
                      <strong className="text-slate-200 font-medium">
                        {sug.recommendedInstrument}
                      </strong>
                    </span>
                    <span className="font-mono tabular-nums text-emerald-400">
                      1-Yr Projected: ${sug.projectedOneYearValue.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onClaimSuggestion(sug)}
                      disabled={isClaimed}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        isClaimed
                          ? 'bg-slate-800/90 text-emerald-400 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Swept to Savings Pool
                        </>
                      ) : (
                        `Sweep +$${sug.monthlySavingsPotential} to Savings Pool`
                      )}
                    </button>

                    <button
                      onClick={() => onInvestSuggestion(sug)}
                      className="py-2 px-3.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors whitespace-nowrap flex items-center gap-1.5"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Invest Directly in {sug.recommendedAssetClass}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Caps & Alert Threshold Tuner */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Monthly Budget Limits & Spending Alert Thresholds
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize your monthly student allowance, category ceilings, and early-warning alert trigger percentage.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-300">
            Planned Monthly Surplus:{' '}
            <span className="text-emerald-400 font-semibold">
              +${projectedMonthlySurplus.toFixed(0)}/mo
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="mt-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-5 border-b border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Total Monthly Student Allowance / Income (USD)
              </label>
              <input
                type="number"
                min="100"
                max="100000"
                step="10"
                value={allowance}
                onChange={(e) => setAllowance(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Includes stipend, part-time campus job, or family allowance.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Spending Alert Warning Threshold
                </label>
                <span className="text-xs font-mono tabular-nums text-amber-400 font-semibold">
                  Trigger at {threshold}% of Category Limit
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1">
                <span>50% (Strict)</span>
                <span>75% (Balanced)</span>
                <span>100% (Hard Cap Only)</span>
              </div>
            </div>
          </div>

          {/* 6 Category Limit Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Food & Dining' as ExpenseCategory,
                val: foodLimit,
                setter: setFoodLimit,
              },
              {
                label: 'Textbooks & Academic' as ExpenseCategory,
                val: housingLimit,
                setter: setHousingLimit,
              },
              {
                label: 'Campus Transit' as ExpenseCategory,
                val: transitLimit,
                setter: setTransitLimit,
              },
              {
                label: 'Subscriptions & Apps' as ExpenseCategory,
                val: subscriptionsLimit,
                setter: setSubscriptionsLimit,
              },
              {
                label: 'Coffee & Social' as ExpenseCategory,
                val: socialLimit,
                setter: setSocialLimit,
              },
              {
                label: 'Dorm & Essentials' as ExpenseCategory,
                val: essentialsLimit,
                setter: setEssentialsLimit,
              },
            ].map((item) => {
              const spent = categorySpent(item.label);
              const pct = item.val > 0 ? (spent / item.val) * 100 : 0;
              return (
                <div
                  key={item.label}
                  className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-slate-200">
                      {item.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      Spent: ${spent.toFixed(0)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">$</span>
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      step="5"
                      value={item.val}
                      onChange={(e) => item.setter(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#111827] border border-slate-700 rounded-md text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              Total Category Budgets: ${totalAllocatedLimits.toFixed(0)} / $
              {allowance.toFixed(0)} Allowance
            </div>
            <button
              type="submit"
              disabled={isSavingBudget}
              className="px-5 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
            >
              {isSavingBudget
                ? 'Updating...'
                : savedSuccess
                ? 'Budget Caps Saved ✓'
                : 'Save Budget & Alert Rules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
