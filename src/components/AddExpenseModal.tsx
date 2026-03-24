'use client';

import { useState, useEffect } from 'react';
import type { Currency, Category, CreditCard, ExpenseType, ExpenseFormData, ExpenseWithDetails } from '../lib/types';
import { MONTH_NAMES } from '../lib/types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExpenseFormData) => Promise<void>;
  currencies: Currency[];
  categories: Category[];
  creditCards: CreditCard[];
  currentMonth: number;
  currentYear: number;
  editingExpense?: ExpenseWithDetails | null;
}

const INITIAL_FORM: ExpenseFormData = {
  name: '',
  description: '',
  amount: '',
  currency_id: 0,
  category_id: null,
  credit_card_id: null,
  type: 'fixed',
  start_month: 1,
  start_year: 2024,
  duration_months: '3',
};

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  currencies,
  categories,
  creditCards,
  currentMonth,
  currentYear,
  editingExpense,
}: AddExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setForm({
          name: editingExpense.name,
          description: editingExpense.description || '',
          amount: String(editingExpense.amount),
          currency_id: editingExpense.currency_id,
          category_id: editingExpense.category_id,
          credit_card_id: editingExpense.credit_card_id,
          type: editingExpense.type,
          start_month: editingExpense.start_month,
          start_year: editingExpense.start_year,
          duration_months: String(editingExpense.duration_months ?? ''),
        });
      } else {
        setForm({
          ...INITIAL_FORM,
          currency_id: currencies[0]?.id ?? 0,
          start_month: currentMonth,
          start_year: currentYear,
        });
      }
      setError('');
    }
  }, [isOpen, editingExpense, currencies, currentMonth, currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (form.type === 'installment' && (!form.duration_months || parseInt(form.duration_months) <= 0)) {
      setError('Duration must be greater than 0 for installments');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'fixed', label: 'Fixed', desc: 'Recurring monthly' },
                { value: 'installment', label: 'Installment', desc: 'Limited months' },
                { value: 'singular', label: 'One-time', desc: 'This month only' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value as ExpenseType }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    form.type === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Netflix, Rent, Savings..."
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(links, notes, etc.)</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Payment link, notes..."
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                id="currency"
                value={form.currency_id}
                onChange={e => setForm(f => ({ ...f, currency_id: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map(c => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + Credit Card */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="category"
                value={form.category_id ?? ''}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="credit_card" className="block text-sm font-medium text-gray-700 mb-1">
                Credit Card <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                id="credit_card"
                value={form.credit_card_id ?? ''}
                onChange={e => setForm(f => ({ ...f, credit_card_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None</option>
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start month/year (for fixed and installment) */}
          {form.type !== 'singular' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start_month" className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
                <select
                  id="start_month"
                  value={form.start_month}
                  onChange={e => setForm(f => ({ ...f, start_month: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="start_year" className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                <select
                  id="start_year"
                  value={form.start_year}
                  onChange={e => setForm(f => ({ ...f, start_year: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Duration (for installments only) */}
          {form.type === 'installment' && (
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Installments
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                max="120"
                value={form.duration_months}
                onChange={e => setForm(f => ({ ...f, duration_months: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 12"
              />
            </div>
          )}

          {/* Month selector for singular */}
          {form.type === 'singular' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="singular_month" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  id="singular_month"
                  value={form.start_month}
                  onChange={e => setForm(f => ({ ...f, start_month: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="singular_year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  id="singular_year"
                  value={form.start_year}
                  onChange={e => setForm(f => ({ ...f, start_year: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
