'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MonthNavigator from '../components/MonthNavigator';
import BudgetManager from '../components/BudgetManager';
import ExpenseTable from '../components/ExpenseTable';
import AddExpenseModal from '../components/AddExpenseModal';
import SettingsPanel from '../components/SettingsPanel';
import Summary from '../components/Summary';
import ContentSkeleton from '../components/ContentSkeleton';
import type {
  Currency, Category, CreditCard, Expense,
  ExpensePayment, MonthlyBudget, ExpenseWithDetails, ExpenseFormData,
} from '../lib/types';
import {
  getCurrencies, addCurrency, deleteCurrency,
  getCategories, addCategory, deleteCategory,
  getCreditCards, addCreditCard, deleteCreditCard,
  getAllExpenses, getExpensesForMonth, createExpense, updateExpense, deleteExpense, deactivateExpense,
  getPaymentsForMonth, togglePayment,
  getBudgetsForMonth, setBudget,
} from '../lib/database';

export default function Home() {
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    if (typeof window === 'undefined') return new Date().getMonth() + 1;
    const m = parseInt(new URLSearchParams(window.location.search).get('month') || '');
    return m >= 1 && m <= 12 ? m : new Date().getMonth() + 1;
  });
  const [year, setYear] = useState(() => {
    if (typeof window === 'undefined') return new Date().getFullYear();
    const y = parseInt(new URLSearchParams(window.location.search).get('year') || '');
    return y >= 2000 && y <= 2100 ? y : new Date().getFullYear();
  });

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<ExpensePayment[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestMonthRef = useRef({ month, year });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Derived: expenses for the current month
  const monthExpenses = getExpensesForMonth(allExpenses, currencies, categories, creditCards, month, year);

  // Load month-specific data (stale-response safe for rapid navigation)
  const loadMonthData = useCallback(async (m: number, y: number) => {
    latestMonthRef.current = { month: m, year: y };
    setMonthLoading(true);
    try {
      const [pays, budg] = await Promise.all([
        getPaymentsForMonth(m, y),
        getBudgetsForMonth(m, y),
      ]);
      if (latestMonthRef.current.month === m && latestMonthRef.current.year === y) {
        setPayments(pays);
        setBudgets(budg);
        setMonthLoading(false);
      }
    } catch (err) {
      if (latestMonthRef.current.month === m && latestMonthRef.current.year === y) {
        setError(err instanceof Error ? err.message : 'Failed to load month data');
        setMonthLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [curr, cats, cards, expenses] = await Promise.all([
          getCurrencies(), getCategories(), getCreditCards(), getAllExpenses(),
        ]);
        setCurrencies(curr);
        setCategories(cats);
        setCreditCards(cards);
        setAllExpenses(expenses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
      await loadMonthData(month, year);
      setInitialLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    const url = new URL(window.location.href);
    url.searchParams.set('month', String(m));
    url.searchParams.set('year', String(y));
    window.history.replaceState({}, '', url.toString());
    loadMonthData(m, y);
  };

  const handleTogglePayment = async (expenseId: number, isPaid: boolean) => {
    await togglePayment(expenseId, month, year, isPaid);
    const pays = await getPaymentsForMonth(month, year);
    setPayments(pays);
  };

  const handleSaveExpense = async (form: ExpenseFormData) => {
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      currency_id: form.currency_id,
      category_id: form.category_id,
      credit_card_id: form.credit_card_id,
      type: form.type,
      start_month: form.start_month,
      start_year: form.start_year,
      duration_months: form.type === 'installment' ? parseInt(form.duration_months) : null,
    };

    if (editingExpense) {
      // Fixed expenses: versioned edit (close old, create new from current month)
      if (editingExpense.type === 'fixed') {
        await updateExpense(editingExpense.id, data, month, year);
      } else {
        await updateExpense(editingExpense.id, data);
      }
    } else {
      await createExpense(data);
    }

    setEditingExpense(null);
    const expenses = await getAllExpenses();
    setAllExpenses(expenses);
  };

  const handleDeleteExpense = async (id: number) => {
    await deleteExpense(id);
    const expenses = await getAllExpenses();
    setAllExpenses(expenses);
  };

  const handleDeactivateExpense = async (id: number) => {
    await deactivateExpense(id, month, year);
    const expenses = await getAllExpenses();
    setAllExpenses(expenses);
  };

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleSetBudget = async (currencyId: number, amount: number) => {
    await setBudget(currencyId, month, year, amount);
    const budg = await getBudgetsForMonth(month, year);
    setBudgets(budg);
  };

  const handleAddCurrency = async (code: string, name: string, symbol: string) => {
    await addCurrency(code, name, symbol);
    setCurrencies(await getCurrencies());
  };

  const handleDeleteCurrency = async (id: number) => {
    await deleteCurrency(id);
    setCurrencies(await getCurrencies());
  };

  const handleAddCategory = async (name: string) => {
    await addCategory(name);
    setCategories(await getCategories());
  };

  const handleDeleteCategory = async (id: number) => {
    await deleteCategory(id);
    setCategories(await getCategories());
  };

  const handleAddCreditCard = async (name: string) => {
    await addCreditCard(name);
    setCreditCards(await getCreditCards());
  };

  const handleDeleteCreditCard = async (id: number) => {
    await deleteCreditCard(id);
    setCreditCards(await getCreditCards());
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => { setError(null); window.location.reload(); }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const showSkeleton = initialLoading || monthLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Expense Organizer</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
                router.refresh();
              }}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <MonthNavigator month={month} year={year} onChange={handleMonthChange} />

        {showSkeleton ? (
          <ContentSkeleton />
        ) : (
          <>
            <BudgetManager
              currencies={currencies}
              budgets={budgets}
              month={month}
              year={year}
              onSetBudget={handleSetBudget}
            />

            {/* Expense List Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Expenses ({monthExpenses.length})
              </h3>
              <button
                onClick={() => { setEditingExpense(null); setShowAddModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </button>
            </div>

            <ExpenseTable
              expenses={monthExpenses}
              payments={payments}
              categories={categories}
              creditCards={creditCards}
              onTogglePayment={handleTogglePayment}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onDeactivate={handleDeactivateExpense}
            />

            <Summary
              currencies={currencies}
              budgets={budgets}
              expenses={monthExpenses}
            />
          </>
        )}
      </main>

      {/* Modals */}
      {!initialLoading && (
        <>
          <AddExpenseModal
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); setEditingExpense(null); }}
            onSave={handleSaveExpense}
            currencies={currencies}
            categories={categories}
            creditCards={creditCards}
            currentMonth={month}
            currentYear={year}
            editingExpense={editingExpense}
          />

          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            currencies={currencies}
            categories={categories}
            creditCards={creditCards}
            onAddCurrency={handleAddCurrency}
            onDeleteCurrency={handleDeleteCurrency}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddCreditCard={handleAddCreditCard}
            onDeleteCreditCard={handleDeleteCreditCard}
          />
        </>
      )}
    </div>
  );
}
