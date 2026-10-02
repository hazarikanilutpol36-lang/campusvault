/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  AssetClass,
  BudgetProfile,
  ExpenseCategory,
  ExpenseRecord,
  InvestmentHolding,
  InvestmentInstrumentOption,
  PaymentMethod,
  SavingsSuggestion,
} from './types';
import {
  DEFAULT_BUDGET_PROFILE,
  INITIAL_DEMO_EXPENSES,
  INITIAL_DEMO_INVESTMENTS,
} from './mockData';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ExpenseLedger } from './components/ExpenseLedger';
import { SavingsOptimizer } from './components/SavingsOptimizer';
import { InvestmentHub } from './components/InvestmentHub';
import { LogIn, LogOut, Plus } from 'lucide-react';

type ActiveTab = 'overview' | 'expenses' | 'savings' | 'invest';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [openAddExpenseTrigger, setOpenAddExpenseTrigger] = useState(false);

  // Local fallback state (used prior to sign-in or while seeding)
  const [localBudget, setLocalBudget] = useState<BudgetProfile>({
    userId: 'demo_student',
    ...DEFAULT_BUDGET_PROFILE,
  });
  const [localExpenses, setLocalExpenses] = useState<ExpenseRecord[]>(
    INITIAL_DEMO_EXPENSES.map((e) => ({ ...e, userId: 'demo_student' }))
  );
  const [localInvestments, setLocalInvestments] = useState<InvestmentHolding[]>(
    INITIAL_DEMO_INVESTMENTS.map((i) => ({ ...i, userId: 'demo_student' }))
  );

  // Cloud Firestore state when signed in
  const [cloudBudget, setCloudBudget] = useState<BudgetProfile | null>(null);
  const [cloudExpenses, setCloudExpenses] = useState<ExpenseRecord[] | null>(
    null
  );
  const [cloudInvestments, setCloudInvestments] = useState<
    InvestmentHolding[] | null
  >(null);

  const [claimedSuggestionIds, setClaimedSuggestionIds] = useState<string[]>(
    []
  );
  const [targetInvestAssetClass, setTargetInvestAssetClass] = useState<
    AssetClass | 'All'
  >('All');
  const [targetInvestInstrumentName, setTargetInvestInstrumentName] = useState<
    string | null
  >(null);
  const [authBannerError, setAuthBannerError] = useState<string | null>(null);

  // Track Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setCloudBudget(null);
      setCloudExpenses(null);
      setCloudInvestments(null);
      return;
    }

    const uid = user.uid;
    const budgetRef = doc(db, 'budgets', uid);

    const unsubBudget = onSnapshot(
      budgetRef,
      async (snap) => {
        if (snap.exists()) {
          setCloudBudget(snap.data() as BudgetProfile);
        } else {
          // Initialize student's budget profile and seed initial records so the dashboard is rich immediately
          try {
            await setDoc(budgetRef, {
              userId: uid,
              ...DEFAULT_BUDGET_PROFILE,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            // Seed initial expenses
            for (const exp of INITIAL_DEMO_EXPENSES) {
              const expRef = doc(collection(db, 'expenses'));
              await setDoc(expRef, {
                userId: uid,
                title: exp.title,
                category: exp.category,
                amount: exp.amount,
                dateStr: exp.dateStr,
                paymentMethod: exp.paymentMethod,
                isRecurring: exp.isRecurring,
                roundUpSaved: exp.roundUpSaved,
                createdAt: serverTimestamp(),
              });
            }

            // Seed initial multi-asset holdings
            for (const inv of INITIAL_DEMO_INVESTMENTS) {
              const invRef = doc(collection(db, 'investments'));
              await setDoc(invRef, {
                userId: uid,
                assetClass: inv.assetClass,
                instrumentName: inv.instrumentName,
                investedAmount: inv.investedAmount,
                unitsOwned: inv.unitsOwned,
                expectedApy: inv.expectedApy,
                riskTier: inv.riskTier,
                autoInvestMonthly: inv.autoInvestMonthly,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `budgets/${uid}`);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `budgets/${uid}`)
    );

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', uid)
    );
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snap) => {
        const list: ExpenseRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ExpenseRecord, 'id'>),
        }));
        setCloudExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'expenses')
    );

    const investmentsQuery = query(
      collection(db, 'investments'),
      where('userId', '==', uid)
    );
    const unsubInvestments = onSnapshot(
      investmentsQuery,
      (snap) => {
        const list: InvestmentHolding[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<InvestmentHolding, 'id'>),
        }));
        setCloudInvestments(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'investments')
    );

    return () => {
      unsubBudget();
      unsubExpenses();
      unsubInvestments();
    };
  }, [authReady, user]);

  const activeBudget = user && cloudBudget ? cloudBudget : localBudget;
  const activeExpenses = user && cloudExpenses ? cloudExpenses : localExpenses;
  const activeInvestments =
    user && cloudInvestments ? cloudInvestments : localInvestments;

  // Compute dynamic spending-pattern savings suggestions based on current expenses
  const dynamicSuggestions: SavingsSuggestion[] = useMemo(() => {
    const coffeeSocialSpent = activeExpenses
      .filter((e) => e.category === 'Coffee & Social')
      .reduce((s, e) => s + e.amount, 0);

    const foodDiningSpent = activeExpenses
      .filter((e) => e.category === 'Food & Dining')
      .reduce((s, e) => s + e.amount, 0);

    const recurringSubsSpent = activeExpenses
      .filter((e) => e.category === 'Subscriptions & Apps' || e.isRecurring)
      .reduce((s, e) => s + e.amount, 0);

    const textbookSpent = activeExpenses
      .filter((e) => e.category === 'Textbooks & Academic')
      .reduce((s, e) => s + e.amount, 0);

    const coffeeSave = Math.max(25, Math.round(coffeeSocialSpent * 0.3));
    const diningSave = Math.max(40, Math.round(foodDiningSpent * 0.18));
    const subsSave = Math.max(18, Math.round(recurringSubsSpent * 0.25));
    const bookSave = Math.max(30, Math.round(textbookSpent * 0.22));

    return [
      {
        id: 'sug_coffee_gold',
        title: 'Brew 3x/Week in Dorm & Sweep Café Surplus to Digital Gold',
        category: 'Coffee & Social',
        monthlySavingsPotential: coffeeSave,
        reason: `You spent $${coffeeSocialSpent.toFixed(
          2
        )} on Coffee & Social this cycle. Shifting 3 café visits/week to dorm cold-brew unlocks $${coffeeSave}/mo for inflation-hedged 24K Digital Gold.`,
        recommendedAssetClass: 'Digital Gold & Silver',
        recommendedInstrument: '24K 99.99% Swiss Vaulted Digital Gold',
        projectedOneYearValue: Math.round(coffeeSave * 12 * 1.092),
      },
      {
        id: 'sug_dining_index',
        title: 'Batch-Prep 2 Late-Night Deliveries into S&P 500 Index ETF',
        category: 'Food & Dining',
        monthlySavingsPotential: diningSave,
        reason: `Food & Dining is at $${foodDiningSpent.toFixed(
          2
        )} ($${activeBudget.foodLimit} cap). Replacing two off-campus delivery orders saves $${diningSave}/mo for automated S&P 500 compounding.`,
        recommendedAssetClass: 'Automated Index Funds',
        recommendedInstrument: 'Vanguard S&P 500 Fractional ETF (VOO)',
        projectedOneYearValue: Math.round(diningSave * 12 * 1.104),
      },
      {
        id: 'sug_subs_savings',
        title: 'Consolidate Student Discounts & Route to High-Yield Vault',
        category: 'Subscriptions & Apps',
        monthlySavingsPotential: subsSave,
        reason: `Detected $${recurringSubsSpent.toFixed(
          2
        )} in recurring charges. Switching to .edu student bundles frees $${subsSave}/mo for your 4.85% APY Low-Risk Savings Vault.`,
        recommendedAssetClass: 'Low-Risk Savings',
        recommendedInstrument: 'Campus High-Yield Savings Vault',
        projectedOneYearValue: Math.round(subsSave * 12 * 1.0485),
      },
      {
        id: 'sug_books_p2p',
        title: 'Peer Rental & Used Lab Editions to P2P Lending Notes',
        category: 'Textbooks & Academic',
        monthlySavingsPotential: bookSave,
        reason: `Academic spend is $${textbookSpent.toFixed(
          2
        )}. Renting or reselling lab manuals at semester end recovers ~$${bookSave}/mo to earn 11.2% APY in Campus P2P Micro-Credit.`,
        recommendedAssetClass: 'P2P Lending',
        recommendedInstrument: 'Verified Campus Peer Micro-Credit Pool',
        projectedOneYearValue: Math.round(bookSave * 12 * 1.112),
      },
    ];
  }, [activeExpenses, activeBudget.foodLimit]);

  const handleGoogleSignIn = async () => {
    setAuthBannerError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthBannerError(
        err instanceof Error
          ? err.message
          : 'Sign-in popup closed or blocked by browser.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Handlers for CRUD operations (syncs to Firestore when logged in, or local state in preview mode)
  const handleAddExpense = async (newExp: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    dateStr: string;
    paymentMethod: PaymentMethod;
    isRecurring: boolean;
    roundUpSaved: number;
  }) => {
    if (user && cloudBudget) {
      try {
        await addDoc(collection(db, 'expenses'), {
          userId: user.uid,
          title: newExp.title.slice(0, 120),
          category: newExp.category,
          amount: newExp.amount,
          dateStr: newExp.dateStr,
          paymentMethod: newExp.paymentMethod,
          isRecurring: newExp.isRecurring,
          roundUpSaved: newExp.roundUpSaved,
          createdAt: serverTimestamp(),
        });

        if (newExp.roundUpSaved > 0) {
          const newPool = Number(
            (cloudBudget.savingsBalance + newExp.roundUpSaved).toFixed(2)
          );
          await updateDoc(doc(db, 'budgets', user.uid), {
            savingsBalance: newPool,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'expenses');
      }
    } else {
      const record: ExpenseRecord = {
        id: `local_exp_${Date.now()}`,
        userId: 'demo_student',
        ...newExp,
      };
      setLocalExpenses((prev) => [record, ...prev]);
      if (newExp.roundUpSaved > 0) {
        setLocalBudget((prev) => ({
          ...prev,
          savingsBalance: Number(
            (prev.savingsBalance + newExp.roundUpSaved).toFixed(2)
          ),
        }));
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
      }
    } else {
      setLocalExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleSweepRoundUpsToSavings = async (amount: number) => {
    if (amount <= 0) return;
    if (user && cloudBudget) {
      try {
        const nextBalance = Number(
          (cloudBudget.savingsBalance + amount).toFixed(2)
        );
        await updateDoc(doc(db, 'budgets', user.uid), {
          savingsBalance: nextBalance,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `budgets/${user.uid}`);
      }
    } else {
      setLocalBudget((prev) => ({
        ...prev,
        savingsBalance: Number((prev.savingsBalance + amount).toFixed(2)),
      }));
    }
  };

  const handleClaimSuggestion = async (suggestion: SavingsSuggestion) => {
    if (claimedSuggestionIds.includes(suggestion.id)) return;
    setClaimedSuggestionIds((prev) => [...prev, suggestion.id]);

    if (user && cloudBudget) {
      try {
        const nextBalance = Number(
          (
            cloudBudget.savingsBalance + suggestion.monthlySavingsPotential
          ).toFixed(2)
        );
        await updateDoc(doc(db, 'budgets', user.uid), {
          savingsBalance: nextBalance,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `budgets/${user.uid}`);
      }
    } else {
      setLocalBudget((prev) => ({
        ...prev,
        savingsBalance: Number(
          (prev.savingsBalance + suggestion.monthlySavingsPotential).toFixed(2)
        ),
      }));
    }
  };

  const handleInvestSuggestion = async (suggestion: SavingsSuggestion) => {
    if (!claimedSuggestionIds.includes(suggestion.id)) {
      await handleClaimSuggestion(suggestion);
    }
    setTargetInvestAssetClass(suggestion.recommendedAssetClass);
    setTargetInvestInstrumentName(suggestion.recommendedInstrument);
    setActiveTab('invest');
  };

  const handleUpdateBudgetLimits = async (updated: {
    monthlyAllowance: number;
    alertThresholdPercent: number;
    foodLimit: number;
    housingLimit: number;
    transitLimit: number;
    subscriptionsLimit: number;
    socialLimit: number;
    essentialsLimit: number;
  }) => {
    if (user && cloudBudget) {
      try {
        await updateDoc(doc(db, 'budgets', user.uid), {
          ...updated,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `budgets/${user.uid}`);
      }
    } else {
      setLocalBudget((prev) => ({
        ...prev,
        ...updated,
      }));
    }
  };

  const handleInvestFromSavings = async ({
    instrument,
    amountToInvest,
    autoInvestMonthly,
  }: {
    instrument: InvestmentInstrumentOption;
    amountToInvest: number;
    autoInvestMonthly: number;
  }) => {
    const addedUnits = Number(
      (amountToInvest / instrument.unitPrice).toFixed(6)
    );
    const nextSavingsBalance = Number(
      Math.max(0, activeBudget.savingsBalance - amountToInvest).toFixed(2)
    );

    if (user && cloudBudget && cloudInvestments) {
      try {
        // Deduct from savings pool
        await updateDoc(doc(db, 'budgets', user.uid), {
          savingsBalance: nextSavingsBalance,
          updatedAt: serverTimestamp(),
        });

        const existing = cloudInvestments.find(
          (i) => i.instrumentName === instrument.instrumentName
        );

        if (existing) {
          await updateDoc(doc(db, 'investments', existing.id), {
            investedAmount: Number(
              (existing.investedAmount + amountToInvest).toFixed(2)
            ),
            unitsOwned: Number((existing.unitsOwned + addedUnits).toFixed(6)),
            autoInvestMonthly,
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, 'investments'), {
            userId: user.uid,
            assetClass: instrument.assetClass,
            instrumentName: instrument.instrumentName,
            investedAmount: amountToInvest,
            unitsOwned: addedUnits,
            expectedApy: instrument.expectedApy,
            riskTier: instrument.riskTier,
            autoInvestMonthly,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'investments');
      }
    } else {
      setLocalBudget((prev) => ({
        ...prev,
        savingsBalance: nextSavingsBalance,
      }));

      setLocalInvestments((prev) => {
        const existing = prev.find(
          (i) => i.instrumentName === instrument.instrumentName
        );
        if (existing) {
          return prev.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  investedAmount: Number(
                    (item.investedAmount + amountToInvest).toFixed(2)
                  ),
                  unitsOwned: Number(
                    (item.unitsOwned + addedUnits).toFixed(6)
                  ),
                  autoInvestMonthly,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            id: `local_inv_${Date.now()}`,
            userId: 'demo_student',
            assetClass: instrument.assetClass,
            instrumentName: instrument.instrumentName,
            investedAmount: amountToInvest,
            unitsOwned: addedUnits,
            expectedApy: instrument.expectedApy,
            riskTier: instrument.riskTier,
            autoInvestMonthly,
          },
        ];
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap"
        >
          CampusVault
        </a>

        {/* Zone 2: 4 Clean Text Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'overview'
                ? 'text-white border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'expenses'
                ? 'text-white border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'savings'
                ? 'text-white border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Smart Savings
          </button>
          <button
            onClick={() => {
              setTargetInvestAssetClass('All');
              setActiveTab('invest');
            }}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'invest'
                ? 'text-white border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Invest Hub
          </button>
        </nav>

        {/* Zone 3: 2 Primary Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setOpenAddExpenseTrigger(true);
              setActiveTab('expenses');
            }}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>

          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" /> Cloud Sync Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {authBannerError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
            <span>{authBannerError}</span>
            <button
              onClick={() => setAuthBannerError(null)}
              className="text-rose-200 underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quiet Cloud Sync Context Line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-200 font-medium">
              October 2026 Semester Budget Cycle
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {user
                ? `Cloud Synced (${user.email})`
                : 'Interactive Preview Mode (Sign in to persist across devices)'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>Monthly Allowance: ${activeBudget.monthlyAllowance}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">
              Savings Pool: ${activeBudget.savingsBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'overview' && (
          <AnalyticsCharts
            budget={activeBudget}
            expenses={activeExpenses}
            investments={activeInvestments}
            suggestions={dynamicSuggestions}
            onClaimSuggestion={handleClaimSuggestion}
            onInvestSuggestion={handleInvestSuggestion}
            claimedIds={claimedSuggestionIds}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddExpense={() => {
              setOpenAddExpenseTrigger(true);
              setActiveTab('expenses');
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseLedger
            expenses={activeExpenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onSweepRoundUpsToSavings={handleSweepRoundUpsToSavings}
            showAddFormInitial={openAddExpenseTrigger}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsOptimizer
            budget={activeBudget}
            expenses={activeExpenses}
            suggestions={dynamicSuggestions}
            claimedIds={claimedSuggestionIds}
            onClaimSuggestion={handleClaimSuggestion}
            onInvestSuggestion={handleInvestSuggestion}
            onUpdateBudgetLimits={handleUpdateBudgetLimits}
          />
        )}

        {activeTab === 'invest' && (
          <InvestmentHub
            budget={activeBudget}
            investments={activeInvestments}
            initialSelectedAssetClass={targetInvestAssetClass}
            initialSelectedInstrumentName={targetInvestInstrumentName}
            onInvestFromSavings={handleInvestFromSavings}
            onAddExternalSavingsDeposit={handleSweepRoundUpsToSavings}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-5 px-6 text-xs text-slate-500">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CampusVault · Student Monthly Expense & Multi-Asset Micro-Investment Platform
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="hover:text-slate-300 transition-colors"
            >
              Dashboard
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('savings')}
              className="hover:text-slate-300 transition-colors"
            >
              Budget Alerts
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('invest')}
              className="hover:text-slate-300 transition-colors"
            >
              Portfolio Diversification
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
