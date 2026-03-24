'use client';

import type { Currency, MonthlyBudget, ExpenseWithDetails } from '../lib/types';
import { formatCurrency } from '../lib/types';

interface SummaryProps {
  currencies: Currency[];
  budgets: MonthlyBudget[];
  expenses: ExpenseWithDetails[];
}

export default function Summary({ currencies, budgets, expenses }: SummaryProps) {
  if (currencies.length === 0) return null;

  const getTotalForCurrency = (currencyId: number): number => {
    return expenses
      .filter(e => e.currency_id === currencyId)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getBudgetForCurrency = (currencyId: number): number => {
    const budget = budgets.find(b => b.currency_id === currencyId);
    return budget?.amount ?? 0;
  };

  // Only show currencies that have either expenses or a budget set
  const activeCurrencies = currencies.filter(c =>
    getTotalForCurrency(c.id) > 0 || getBudgetForCurrency(c.id) > 0
  );

  if (activeCurrencies.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCurrencies.map(currency => {
          const total = getTotalForCurrency(currency.id);
          const budget = getBudgetForCurrency(currency.id);
          const remaining = budget - total;
          const percentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
          const isOverBudget = remaining < 0;

          return (
            <div key={currency.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{currency.code}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isOverBudget
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {isOverBudget ? 'Over budget' : 'On track'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total expenses</span>
                  <span className="font-medium text-gray-900">{formatCurrency(total, currency.symbol)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium text-gray-900">{formatCurrency(budget, currency.symbol)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1 mt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining</span>
                    <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining), currency.symbol)}
                    </span>
                  </div>
                </div>
              </div>

              {budget > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
