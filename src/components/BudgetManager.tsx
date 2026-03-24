'use client';

import { useState } from 'react';
import type { Currency, MonthlyBudget } from '../lib/types';
import { formatCurrency } from '../lib/types';

interface BudgetManagerProps {
  currencies: Currency[];
  budgets: MonthlyBudget[];
  month: number;
  year: number;
  onSetBudget: (currencyId: number, amount: number) => Promise<void>;
}

export default function BudgetManager({ currencies, budgets, month, year, onSetBudget }: BudgetManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const getBudgetForCurrency = (currencyId: number): number => {
    const budget = budgets.find(b => b.currency_id === currencyId);
    return budget?.amount ?? 0;
  };

  const startEditing = (currency: Currency) => {
    setEditingId(currency.id);
    setEditValue(getBudgetForCurrency(currency.id).toString());
  };

  const saveEdit = async (currencyId: number) => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount) && amount >= 0) {
      await onSetBudget(currencyId, amount);
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currencyId: number) => {
    if (e.key === 'Enter') saveEdit(currencyId);
    if (e.key === 'Escape') setEditingId(null);
  };

  if (currencies.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Available Budget
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {currencies.map(currency => {
          const amount = getBudgetForCurrency(currency.id);
          const isEditing = editingId === currency.id;

          return (
            <div
              key={currency.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
            >
              <div>
                <span className="text-xs text-gray-500 font-medium">{currency.code}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-gray-400 text-sm">{currency.symbol}</span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => handleKeyDown(e, currency.id)}
                      onBlur={() => saveEdit(currency.id)}
                      className="w-32 px-2 py-1 text-lg font-semibold border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      step="0.01"
                      min="0"
                    />
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(amount, currency.symbol)}
                  </p>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => startEditing(currency)}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  title="Edit budget"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
