'use client';

import { useState, useMemo } from 'react';
import type { ExpenseWithDetails, ExpensePayment, Category, CreditCard } from '../lib/types';
import { formatCurrency } from '../lib/types';

type SortField = 'name' | 'category' | 'card' | 'amount' | 'type' | 'paid';
type SortDir = 'asc' | 'desc';

interface Filters {
  search: string;
  category: string;    // category id or ''
  card: string;        // credit card id or ''
  type: string;        // expense type or ''
  paid: string;        // 'paid' | 'unpaid' | ''
  currency: string;    // currency id or ''
}

interface ExpenseTableProps {
  expenses: ExpenseWithDetails[];
  payments: ExpensePayment[];
  categories: Category[];
  creditCards: CreditCard[];
  onTogglePayment: (expenseId: number, isPaid: boolean) => Promise<void>;
  onEdit: (expense: ExpenseWithDetails) => void;
  onDelete: (expenseId: number) => Promise<void>;
  onDeactivate: (expenseId: number) => Promise<void>;
}

const EMPTY_FILTERS: Filters = { search: '', category: '', card: '', type: '', paid: '', currency: '' };

export default function ExpenseTable({
  expenses,
  payments,
  categories,
  creditCards,
  onTogglePayment,
  onEdit,
  onDelete,
  onDeactivate,
}: ExpenseTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const isExpensePaid = (expenseId: number): boolean => {
    const payment = payments.find(p => p.expense_id === expenseId);
    return payment?.is_paid ?? false;
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Filter + sort
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(e => {
      if (filters.search && !e.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(e.description ?? '').toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category && String(e.category_id) !== filters.category) return false;
      if (filters.card) {
        if (filters.card === 'none' && e.credit_card_id !== null) return false;
        if (filters.card !== 'none' && String(e.credit_card_id) !== filters.card) return false;
      }
      if (filters.type && e.type !== filters.type) return false;
      if (filters.currency && String(e.currency_id) !== filters.currency) return false;
      if (filters.paid === 'paid' && !isExpensePaid(e.id)) return false;
      if (filters.paid === 'unpaid' && isExpensePaid(e.id)) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'category':
          cmp = (a.category?.name ?? '').localeCompare(b.category?.name ?? '');
          break;
        case 'card':
          cmp = (a.credit_card?.name ?? '').localeCompare(b.credit_card?.name ?? '');
          break;
        case 'amount':
          cmp = Number(a.amount) - Number(b.amount);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'paid': {
          const ap = isExpensePaid(a.id) ? 1 : 0;
          const bp = isExpensePaid(b.id) ? 1 : 0;
          cmp = ap - bp;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [expenses, payments, filters, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <svg className="w-3 h-3 ml-1 text-gray-300 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    }
    return sortDir === 'asc'
      ? <svg className="w-3 h-3 ml-1 text-blue-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3 h-3 ml-1 text-blue-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
  };

  const getTypeLabel = (expense: ExpenseWithDetails): string => {
    switch (expense.type) {
      case 'fixed': return 'Fixed';
      case 'installment': return `${expense.installment_number}/${expense.duration_months}`;
      case 'singular': return 'One-time';
      default: return '';
    }
  };

  const getTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'fixed': return 'bg-blue-100 text-blue-700';
      case 'installment': return 'bg-purple-100 text-purple-700';
      case 'singular': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Unique currencies from current expenses for the filter
  const usedCurrencies = useMemo(() => {
    const map = new Map<number, string>();
    expenses.forEach(e => {
      if (e.currency) map.set(e.currency.id, `${e.currency.code} (${e.currency.symbol})`);
    });
    return [...map.entries()];
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No expenses for this month.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Filter bar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Search name or description..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-blue-300 bg-blue-50 text-blue-600'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          Filters{hasActiveFilters ? ' *' : ''}
        </button>
        {hasActiveFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-400">
          {filteredExpenses.length}{filteredExpenses.length !== expenses.length ? ` / ${expenses.length}` : ''}
        </span>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <select
            value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={filters.card}
            onChange={e => setFilters(f => ({ ...f, card: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All cards</option>
            <option value="none">No card</option>
            {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="fixed">Fixed</option>
            <option value="installment">Installment</option>
            <option value="singular">One-time</option>
          </select>

          <select
            value={filters.paid}
            onChange={e => setFilters(f => ({ ...f, paid: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Paid & unpaid</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>

          {usedCurrencies.length > 1 && (
            <select
              value={filters.currency}
              onChange={e => setFilters(f => ({ ...f, currency: e.target.value }))}
              className="text-sm px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All currencies</option>
              {usedCurrencies.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left w-16 whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort('paid')}>
                Paid<SortIcon field="paid" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Name<SortIcon field="name" />
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
              <th className="px-4 py-3 text-left cursor-pointer select-none" onClick={() => toggleSort('category')}>
                Category<SortIcon field="category" />
              </th>
              <th className="px-4 py-3 text-left hidden sm:table-cell cursor-pointer select-none" onClick={() => toggleSort('card')}>
                Card<SortIcon field="card" />
              </th>
              <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                Amount<SortIcon field="amount" />
              </th>
              <th className="px-4 py-3 text-center cursor-pointer select-none" onClick={() => toggleSort('type')}>
                Type<SortIcon field="type" />
              </th>
              <th className="px-4 py-3 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No expenses match your filters.
                </td>
              </tr>
            ) : (
              filteredExpenses.map(expense => {
                const paid = isExpensePaid(expense.id);
                return (
                  <tr
                    key={expense.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      paid ? 'bg-green-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={paid}
                        onChange={() => onTogglePayment(expense.id, !paid)}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${paid ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {expense.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {expense.description ? (
                        isUrl(expense.description) ? (
                          <a
                            href={expense.description}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 underline truncate block max-w-xs"
                            title={expense.description}
                          >
                            {new URL(expense.description).hostname}
                          </a>
                        ) : (
                          <span className="text-gray-500 truncate block max-w-xs" title={expense.description}>
                            {expense.description}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {expense.category ? (
                        <span className="text-gray-600">{expense.category.name}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {expense.credit_card ? (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          {expense.credit_card.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-medium ${paid ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatCurrency(Number(expense.amount), expense.currency?.symbol ?? '$')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeBadgeClass(expense.type)}`}>
                        {getTypeLabel(expense)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {expense.type === 'fixed' && (
                          <button
                            onClick={() => onDeactivate(expense.id)}
                            className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                            title="Stop recurring"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {confirmDeleteId === expense.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { onDelete(expense.id); setConfirmDeleteId(null); }}
                              className="text-xs px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(expense.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
