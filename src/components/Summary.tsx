'use client';

import { useMemo, useState } from 'react';
import type { Currency, MonthlyBudget, ExpenseWithDetails } from '../lib/types';
import { formatCurrency } from '../lib/types';

interface SummaryProps {
  currencies: Currency[];
  budgets: MonthlyBudget[];
  expenses: ExpenseWithDetails[];
}

type BreakdownTab = 'overview' | 'category' | 'card';

export default function Summary({ currencies, budgets, expenses }: SummaryProps) {
  const [tab, setTab] = useState<BreakdownTab>('overview');

  const getTotalForCurrency = (currencyId: number): number => {
    return expenses
      .filter(e => e.currency_id === currencyId)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getBudgetForCurrency = (currencyId: number): number => {
    const budget = budgets.find(b => b.currency_id === currencyId);
    return budget?.amount ?? 0;
  };

  const activeCurrencies = currencies.filter(c =>
    getTotalForCurrency(c.id) > 0 || getBudgetForCurrency(c.id) > 0
  );

  // Group totals by category per currency
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; totals: Map<number, number> }>();
    for (const e of expenses) {
      const catName = e.category?.name ?? 'Uncategorized';
      const catKey = e.category_id != null ? String(e.category_id) : 'none';
      if (!map.has(catKey)) map.set(catKey, { name: catName, totals: new Map() });
      const entry = map.get(catKey)!;
      entry.totals.set(e.currency_id, (entry.totals.get(e.currency_id) ?? 0) + Number(e.amount));
    }
    return [...map.values()].sort((a, b) => {
      // Sort by largest total across all currencies
      const sumA = [...a.totals.values()].reduce((s, v) => s + v, 0);
      const sumB = [...b.totals.values()].reduce((s, v) => s + v, 0);
      return sumB - sumA;
    });
  }, [expenses]);

  // Group totals by credit card per currency
  const cardBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; totals: Map<number, number> }>();
    for (const e of expenses) {
      const cardName = e.credit_card?.name ?? 'No card';
      const cardKey = e.credit_card_id != null ? String(e.credit_card_id) : 'none';
      if (!map.has(cardKey)) map.set(cardKey, { name: cardName, totals: new Map() });
      const entry = map.get(cardKey)!;
      entry.totals.set(e.currency_id, (entry.totals.get(e.currency_id) ?? 0) + Number(e.amount));
    }
    return [...map.values()].sort((a, b) => {
      const sumA = [...a.totals.values()].reduce((s, v) => s + v, 0);
      const sumB = [...b.totals.values()].reduce((s, v) => s + v, 0);
      return sumB - sumA;
    });
  }, [expenses]);

  if (activeCurrencies.length === 0 && expenses.length === 0) return null;

  const currencyMap = new Map(currencies.map(c => [c.id, c]));

  const tabs: { key: BreakdownTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'category', label: 'By Category' },
    { key: 'card', label: 'By Card' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Summary
        </h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
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
                    isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
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
      )}

      {/* By Category tab */}
      {tab === 'category' && (
        <BreakdownTable rows={categoryBreakdown} activeCurrencies={activeCurrencies} currencyMap={currencyMap} />
      )}

      {/* By Card tab */}
      {tab === 'card' && (
        <BreakdownTable rows={cardBreakdown} activeCurrencies={activeCurrencies} currencyMap={currencyMap} />
      )}
    </div>
  );
}

function BreakdownTable({
  rows,
  activeCurrencies,
  currencyMap,
}: {
  rows: { name: string; totals: Map<number, number> }[];
  activeCurrencies: Currency[];
  currencyMap: Map<number, Currency>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No data.</p>;
  }

  // Compute grand totals per currency
  const grandTotals = new Map<number, number>();
  for (const row of rows) {
    for (const [cid, amount] of row.totals) {
      grandTotals.set(cid, (grandTotals.get(cid) ?? 0) + amount);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 text-gray-500 font-medium">Name</th>
            {activeCurrencies.map(c => (
              <th key={c.id} className="text-right py-2 px-2 text-gray-500 font-medium">{c.code}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.name} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-700">{row.name}</td>
              {activeCurrencies.map(c => {
                const amount = row.totals.get(c.id);
                return (
                  <td key={c.id} className="py-2 px-2 text-right font-mono text-gray-900">
                    {amount ? formatCurrency(amount, c.symbol) : <span className="text-gray-300">-</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300">
            <td className="py-2 pr-4 font-semibold text-gray-700">Total</td>
            {activeCurrencies.map(c => {
              const total = grandTotals.get(c.id) ?? 0;
              return (
                <td key={c.id} className="py-2 px-2 text-right font-mono font-semibold text-gray-900">
                  {total > 0 ? formatCurrency(total, c.symbol) : <span className="text-gray-300">-</span>}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
