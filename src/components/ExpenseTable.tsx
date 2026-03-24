'use client';

import { useState } from 'react';
import type { ExpenseWithDetails, ExpensePayment } from '../lib/types';
import { formatCurrency } from '../lib/types';

interface ExpenseTableProps {
  expenses: ExpenseWithDetails[];
  payments: ExpensePayment[];
  onTogglePayment: (expenseId: number, isPaid: boolean) => Promise<void>;
  onEdit: (expense: ExpenseWithDetails) => void;
  onDelete: (expenseId: number) => Promise<void>;
  onDeactivate: (expenseId: number) => Promise<void>;
}

export default function ExpenseTable({
  expenses,
  payments,
  onTogglePayment,
  onEdit,
  onDelete,
  onDeactivate,
}: ExpenseTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isExpensePaid = (expenseId: number): boolean => {
    const payment = payments.find(p => p.expense_id === expenseId);
    return payment?.is_paid ?? false;
  };

  const getTypeLabel = (expense: ExpenseWithDetails): string => {
    switch (expense.type) {
      case 'fixed':
        return 'Fixed';
      case 'installment':
        return `${expense.installment_number}/${expense.duration_months}`;
      case 'singular':
        return 'One-time';
      default:
        return '';
    }
  };

  const getTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'fixed':
        return 'bg-blue-100 text-blue-700';
      case 'installment':
        return 'bg-purple-100 text-purple-700';
      case 'singular':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No expenses for this month.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left w-12">Paid</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Card</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => {
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
            })}
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
