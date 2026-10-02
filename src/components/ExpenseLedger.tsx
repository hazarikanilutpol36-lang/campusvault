import React, { useMemo, useState } from 'react';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ExpenseRecord,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types';
import { Plus, Search, Trash2, ArrowUpRight } from 'lucide-react';

interface ExpenseLedgerProps {
  expenses: ExpenseRecord[];
  onAddExpense: (expense: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    dateStr: string;
    paymentMethod: PaymentMethod;
    isRecurring: boolean;
    roundUpSaved: number;
  }) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onSweepRoundUpsToSavings: (amount: number) => Promise<void>;
  showAddFormInitial?: boolean;
}

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onSweepRoundUpsToSavings,
  showAddFormInitial = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [showAddModal, setShowAddModal] = useState(showAddFormInitial);

  // New expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState('2026-10-02');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Campus Card');
  const [isRecurring, setIsRecurring] = useState(false);
  const [autoRoundUp, setAutoRoundUp] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundUpSweptNotice, setRoundUpSweptNotice] = useState(false);

  const calculatedRoundUp = useMemo(() => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0 || !autoRoundUp) return 0;
    const nextDollar = Math.ceil(val);
    const diff = Number((nextDollar - val).toFixed(2));
    return diff === 0 ? 1.0 : diff;
  }, [amountStr, autoRoundUp]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesSearch =
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat =
          selectedCategory === 'All' || e.category === selectedCategory;
        const matchesRec =
          recurringFilter === 'all' ||
          (recurringFilter === 'recurring' && e.isRecurring) ||
          (recurringFilter === 'one-time' && !e.isRecurring);
        return matchesSearch && matchesCat && matchesRec;
      })
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [expenses, searchQuery, selectedCategory, recurringFilter]);

  const totalFilteredAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const totalRoundUpsAccumulated = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.roundUpSaved || 0), 0),
    [expenses]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = title.trim().slice(0, 120);
    const parsedAmount = parseFloat(amountStr);

    if (!cleanTitle) {
      setFormError('Please enter a merchant or item description.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      setFormError('Please enter a valid amount between $0.01 and $100,000.');
      return;
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) {
      setFormError('Date must be in YYYY-MM-DD format.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddExpense({
        title: cleanTitle,
        category,
        amount: Number(parsedAmount.toFixed(2)),
        dateStr,
        paymentMethod,
        isRecurring,
        roundUpSaved: calculatedRoundUp,
      });
      setTitle('');
      setAmountStr('');
      setIsRecurring(false);
      setShowAddModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to log expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSweepRoundUps = async () => {
    if (totalRoundUpsAccumulated <= 0) return;
    await onSweepRoundUpsToSavings(totalRoundUpsAccumulated);
    setRoundUpSweptNotice(true);
    setTimeout(() => setRoundUpSweptNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-white">
              Student Monthly Expense Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Every purchase automatically calculates spare-change round-ups that can be swept into your investment pool.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSweepRoundUps}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>
                {roundUpSweptNotice
                  ? 'Round-Ups Swept to Savings!'
                  : `Sweep +$${totalRoundUpsAccumulated.toFixed(2)} Round-Ups`}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowAddModal((prev) => !prev)}
              className="px-4 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {showAddModal ? 'Close Form' : 'New Expense'}
            </button>
          </div>
        </div>

        {/* Inline Add Expense Drawer */}
        {showAddModal && (
          <form
            onSubmit={handleSubmit}
            className="mt-5 pb-6 border-b border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Log New Student Transaction
              </h2>
              <span className="text-xs font-mono tabular-nums text-emerald-400">
                Spare Change Round-Up: +${calculatedRoundUp.toFixed(2)} to Savings Pool
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Merchant or Description
                </label>
                <input
                  type="text"
                  maxLength={120}
                  required
                  placeholder="e.g., Campus Bookstore — Calculus Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100000"
                  required
                  placeholder="18.50"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Payment:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Recurring Monthly Charge</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRoundUp}
                    onChange={(e) => setAutoRoundUp(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Auto Round-Up Spare Change to Savings</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
                >
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter & Search Toolbar */}
        <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, category, or card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Recurring Filter */}
            <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
              {(['all', 'recurring', 'one-time'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRecurringFilter(mode)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    recurringFilter === mode
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'all'
                    ? 'All Types'
                    : mode === 'recurring'
                    ? 'Recurring'
                    : 'One-Time'}
                </button>
              ))}
            </div>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="mt-5 overflow-x-auto">
          {filteredExpenses.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Merchant / Description</th>
                  <th className="py-2.5 px-3">Category · Cadence</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Round-Up Saved</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {exp.dateStr}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {exp.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      <span>{exp.category}</span>
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      <span
                        className={
                          exp.isRecurring ? 'text-amber-400' : 'text-slate-500'
                        }
                      >
                        {exp.isRecurring ? 'Recurring' : 'One-time'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400 whitespace-nowrap">
                      +${(exp.roundUpSaved || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-white whitespace-nowrap">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        title="Remove transaction"
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-800 text-xs font-mono tabular-nums">
                  <td colSpan={4} className="py-3 px-3 text-slate-400">
                    Showing {filteredExpenses.length} of {expenses.length} logged student expenses
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-medium">
                    +$
                    {filteredExpenses
                      .reduce((s, e) => s + (e.roundUpSaved || 0), 0)
                      .toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-white font-semibold">
                    ${totalFilteredAmount.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm text-slate-300 font-medium">
                No matching student expenses found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Adjust your search filter or log a new purchase above to track your monthly burn rate.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setRecurringFilter('all');
                  setShowAddModal(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-medium bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Log First Expense
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
