import React, { useMemo } from 'react';
import {
  BudgetProfile,
  ExpenseCategory,
  ExpenseRecord,
  InvestmentHolding,
  SavingsSuggestion,
} from '../types';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsChartsProps {
  budget: BudgetProfile;
  expenses: ExpenseRecord[];
  investments: InvestmentHolding[];
  suggestions: SavingsSuggestion[];
  onClaimSuggestion: (suggestion: SavingsSuggestion) => void;
  onInvestSuggestion: (suggestion: SavingsSuggestion) => void;
  claimedIds: string[];
  onNavigateTab: (tab: 'overview' | 'expenses' | 'savings' | 'invest') => void;
  onOpenAddExpense: () => void;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Food & Dining': '#10B981',
  'Textbooks & Academic': '#3B82F6',
  'Campus Transit': '#8B5CF6',
  'Subscriptions & Apps': '#F43F5E',
  'Coffee & Social': '#F59E0B',
  'Dorm & Essentials': '#06B6D4',
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  budget,
  expenses,
  investments,
  suggestions,
  onClaimSuggestion,
  onInvestSuggestion,
  claimedIds,
  onNavigateTab,
  onOpenAddExpense,
}) => {
  const categoryLimits: Record<ExpenseCategory, number> = useMemo(
    () => ({
      'Food & Dining': budget.foodLimit,
      'Textbooks & Academic': budget.housingLimit,
      'Campus Transit': budget.transitLimit,
      'Subscriptions & Apps': budget.subscriptionsLimit,
      'Coffee & Social': budget.socialLimit,
      'Dorm & Essentials': budget.essentialsLimit,
    }),
    [budget]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      'Food & Dining': 0,
      'Textbooks & Academic': 0,
      'Campus Transit': 0,
      'Subscriptions & Apps': 0,
      'Coffee & Social': 0,
      'Dorm & Essentials': 0,
    };
    for (const exp of expenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    }
    return map;
  }, [expenses]);

  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((a, b) => a + b, 0),
    [categoryTotals]
  );

  const totalCategoryBudget = useMemo(
    () => Object.values(categoryLimits).reduce((a, b) => a + b, 0),
    [categoryLimits]
  );

  const totalRoundUps = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.roundUpSaved || 0), 0),
    [expenses]
  );

  const totalInvested = useMemo(
    () => investments.reduce((sum, i) => sum + i.investedAmount, 0),
    [investments]
  );

  const weightedApy = useMemo(() => {
    if (totalInvested <= 0) return 0;
    const weightedSum = investments.reduce(
      (sum, i) => sum + i.investedAmount * i.expectedApy,
      0
    );
    return weightedSum / totalInvested;
  }, [investments, totalInvested]);

  // Build alerts based on alertThresholdPercent
  const activeAlerts = useMemo(() => {
    const list: {
      category: ExpenseCategory;
      spent: number;
      limit: number;
      pct: number;
      severity: 'critical' | 'warning';
    }[] = [];

    (Object.keys(categoryLimits) as ExpenseCategory[]).forEach((cat) => {
      const limit = categoryLimits[cat];
      const spent = categoryTotals[cat] || 0;
      if (limit > 0) {
        const pct = (spent / limit) * 100;
        if (pct >= 100) {
          list.push({ category: cat, spent, limit, pct, severity: 'critical' });
        } else if (pct >= budget.alertThresholdPercent) {
          list.push({ category: cat, spent, limit, pct, severity: 'warning' });
        }
      }
    });

    return list.sort((a, b) => b.pct - a.pct);
  }, [categoryLimits, categoryTotals, budget.alertThresholdPercent]);

  // SVG Donut chart segments
  const donutSegments = useMemo(() => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPct = 0;

    return (Object.keys(categoryTotals) as ExpenseCategory[])
      .map((cat) => {
        const val = categoryTotals[cat];
        const pct = totalSpent > 0 ? val / totalSpent : 0;
        const strokeDasharray = `${pct * circumference} ${circumference}`;
        const strokeDashoffset = -accumulatedPct * circumference;
        accumulatedPct += pct;
        return {
          category: cat,
          amount: val,
          pct: pct * 100,
          color: CATEGORY_COLORS[cat],
          strokeDasharray,
          strokeDashoffset,
        };
      })
      .filter((s) => s.amount > 0);
  }, [categoryTotals, totalSpent]);

  // 14-day cumulative spending trajectory
  const trajectoryPoints = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    if (sorted.length === 0) return { path: '', area: '', points: [] };

    let running = 0;
    const pts = sorted.map((e, idx) => {
      running += e.amount;
      return {
        label: e.dateStr.slice(5),
        value: running,
        title: e.title,
        idx,
      };
    });

    const maxVal = Math.max(running, totalCategoryBudget, 500);
    const width = 560;
    const height = 170;
    const padX = 24;
    const padY = 20;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coords = pts.map((p, i) => {
      const x =
        pts.length === 1
          ? width / 2
          : padX + (i / (pts.length - 1)) * usableW;
      const y = height - padY - (p.value / maxVal) * usableH;
      return { ...p, x, y };
    });

    const path = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const area =
      coords.length > 1
        ? `${path} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`
        : '';

    const budgetLineY =
      height - padY - (Math.min(totalCategoryBudget, maxVal) / maxVal) * usableH;

    return { path, area, points: coords, budgetLineY, maxVal };
  }, [expenses, totalCategoryBudget]);

  return (
    <div className="space-y-6">
      {/* Top 4 Primary Financial Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400">Monthly Budget Spent</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-white">
              ${totalSpent.toFixed(2)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              / ${totalCategoryBudget.toFixed(0)} limit
            </span>
          </div>
          <div className="mt-3 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-transform duration-200 origin-left ${
                totalSpent > totalCategoryBudget
                  ? 'bg-rose-500'
                  : totalSpent / totalCategoryBudget >= budget.alertThresholdPercent / 100
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                transform: `scaleX(${Math.min(
                  totalCategoryBudget > 0 ? totalSpent / totalCategoryBudget : 0,
                  1
                )})`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>
              {totalCategoryBudget > 0
                ? `${((totalSpent / totalCategoryBudget) * 100).toFixed(1)}% utilized`
                : '0% utilized'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              ${Math.max(0, budget.monthlyAllowance - totalSpent).toFixed(2)} left of allowance
            </span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400">Uninvested Savings Pool</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-emerald-400">
              ${budget.savingsBalance.toFixed(2)}
            </span>
            <button
              onClick={() => onNavigateTab('invest')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              Deploy Cash <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span>+${totalRoundUps.toFixed(2)} spare change round-ups</span>
            <span aria-hidden="true">·</span>
            <span>Ready to invest</span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400">Multi-Asset Portfolio Value</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-white">
              ${totalInvested.toFixed(2)}
            </span>
            <span className="text-xs font-mono tabular-nums text-emerald-400">
              {weightedApy.toFixed(2)}% Avg APY
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span>{investments.length} active positions</span>
            <span aria-hidden="true">·</span>
            <span>
              +${((totalInvested * weightedApy) / 100).toFixed(2)}/yr projected yield
            </span>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400">Active Spending Alerts</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-semibold font-mono tabular-nums ${
                activeAlerts.some((a) => a.severity === 'critical')
                  ? 'text-rose-400'
                  : activeAlerts.length > 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {activeAlerts.length === 0
                ? 'All Nominal'
                : `${activeAlerts.length} Triggered`}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              Threshold: {budget.alertThresholdPercent}%
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span>
              {activeAlerts.length === 0
                ? 'Every category below warning cap'
                : `${activeAlerts[0].category} at ${activeAlerts[0].pct.toFixed(0)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Spending Alerts Banner (only shown if triggered or nominal summary) */}
      {activeAlerts.length > 0 && (
        <div className="bg-[#111827] border border-amber-500/40 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <h2 className="text-sm font-semibold text-white">
                Real-Time Category Spending Alerts (Threshold: {budget.alertThresholdPercent}%)
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('savings')}
              className="text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              Adjust Category Caps & Threshold →
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert.category}
                className="flex items-start justify-between gap-3 pt-1"
              >
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <span>{alert.category}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        alert.severity === 'critical'
                          ? 'text-rose-400 font-mono tabular-nums'
                          : 'text-amber-400 font-mono tabular-nums'
                      }
                    >
                      {alert.severity === 'critical' ? 'Over Cap' : 'Near Limit'} (
                      {alert.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                    ${alert.spent.toFixed(2)} spent of ${alert.limit.toFixed(0)} budget
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row: Category Breakdown + Cumulative Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Donut & Budget Utilization Bars */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">
                Monthly Category Allocation & Cap Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time burn rate against your student category limits
              </p>
            </div>
            <button
              onClick={onOpenAddExpense}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Log Expense
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* SVG Donut Chart */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="58"
                    fill="transparent"
                    stroke="#1E293B"
                    strokeWidth="14"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.category}
                      cx="70"
                      cy="70"
                      r="58"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="butt"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400">Total Spent</span>
                  <span className="text-lg font-semibold font-mono tabular-nums text-white mt-0.5">
                    ${totalSpent.toFixed(0)}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    of ${totalCategoryBudget}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Progress Rows */}
            <div className="md:col-span-7 space-y-3.5">
              {(Object.keys(categoryLimits) as ExpenseCategory[]).map((cat) => {
                const spent = categoryTotals[cat] || 0;
                const limit = categoryLimits[cat] || 1;
                const pct = (spent / limit) * 100;
                const isOver = pct >= 100;
                const isWarn = !isOver && pct >= budget.alertThresholdPercent;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                        />
                        <span className="text-slate-200 font-medium">{cat}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        <span
                          className={
                            isOver
                              ? 'text-rose-400 font-semibold'
                              : isWarn
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-200'
                          }
                        >
                          ${spent.toFixed(2)}
                        </span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">${limit}</span>
                        <span className="text-slate-500">·</span>
                        <span
                          className={
                            isOver
                              ? 'text-rose-400'
                              : isWarn
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-transform duration-200 origin-left"
                        style={{
                          backgroundColor: isOver
                            ? '#F43F5E'
                            : isWarn
                            ? '#F59E0B'
                            : CATEGORY_COLORS[cat],
                          transform: `scaleX(${Math.min(pct / 100, 1)})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cumulative Cashflow Trajectory SVG Chart */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Monthly Spending Pace
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cumulative outlay vs. total budget ceiling
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {expenses.length} transactions
              </span>
            </div>

            <div className="mt-5">
              {trajectoryPoints.points.length > 0 ? (
                <div className="relative">
                  <svg
                    viewBox="0 0 560 170"
                    className="w-full h-44 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="spendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Budget Cap Reference Line */}
                    {trajectoryPoints.budgetLineY !== undefined && (
                      <g>
                        <line
                          x1="24"
                          y1={trajectoryPoints.budgetLineY}
                          x2="536"
                          y2={trajectoryPoints.budgetLineY}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x="534"
                          y={Math.max(12, trajectoryPoints.budgetLineY - 6)}
                          textAnchor="end"
                          className="fill-amber-400 text-[10px] font-mono"
                        >
                          Budget Cap (${totalCategoryBudget})
                        </text>
                      </g>
                    )}

                    {trajectoryPoints.area && (
                      <path d={trajectoryPoints.area} fill="url(#spendAreaGrad)" />
                    )}
                    {trajectoryPoints.path && (
                      <path
                        d={trajectoryPoints.path}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.25"
                      />
                    )}
                    {trajectoryPoints.points.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="3.5"
                          className="fill-emerald-400 stroke-[#111827] stroke-2"
                        />
                      </g>
                    ))}
                  </svg>
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 mt-1 px-1">
                    <span>{trajectoryPoints.points[0]?.label}</span>
                    <span>Mid-Cycle</span>
                    <span>
                      {
                        trajectoryPoints.points[
                          trajectoryPoints.points.length - 1
                        ]?.label
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-slate-400">
                    Log your first student expense to visualize your monthly pace.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="text-slate-400">
              Daily Burn Average:{' '}
              <span className="text-white font-mono tabular-nums font-medium">
                ${(totalSpent / 30).toFixed(2)}/day
              </span>
            </div>
            <div className="text-slate-400">
              Auto Round-Ups:{' '}
              <span className="text-emerald-400 font-mono tabular-nums font-medium">
                +${totalRoundUps.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Pattern-Based Savings Suggestions Preview */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Pattern-Based Student Savings Recommendations
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculated directly from your logged monthly merchants, recurring subscriptions, and dining habits. Sweep savings directly into your investment portfolio.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('savings')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
          >
            View Full Savings Optimizer →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
          {suggestions.slice(0, 3).map((sug) => {
            const isClaimed = claimedIds.includes(sug.id);
            return (
              <div
                key={sug.id}
                className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 last:border-0 pb-4 md:pb-0 md:pr-5 last:pr-0"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{sug.category}</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                      Save +${sug.monthlySavingsPotential.toFixed(0)}/mo
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1.5">
                    {sug.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {sug.reason}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
                    <span>Target: {sug.recommendedAssetClass}</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      1-Yr Est: ${sug.projectedOneYearValue.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onClaimSuggestion(sug)}
                      disabled={isClaimed}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                        isClaimed
                          ? 'bg-slate-800 text-emerald-400 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Swept to Pool
                        </>
                      ) : (
                        `Sweep $${sug.monthlySavingsPotential} to Savings`
                      )}
                    </button>
                    <button
                      onClick={() => onInvestSuggestion(sug)}
                      className="py-1.5 px-3 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Invest
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
