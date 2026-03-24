'use client';

import { useState } from 'react';
import type { Currency, Category, CreditCard } from '../lib/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Currency[];
  categories: Category[];
  creditCards: CreditCard[];
  onAddCurrency: (code: string, name: string, symbol: string) => Promise<void>;
  onDeleteCurrency: (id: number) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onAddCreditCard: (name: string) => Promise<void>;
  onDeleteCreditCard: (id: number) => Promise<void>;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  currencies,
  categories,
  creditCards,
  onAddCurrency,
  onDeleteCurrency,
  onAddCategory,
  onDeleteCategory,
  onAddCreditCard,
  onDeleteCreditCard,
}: SettingsPanelProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'cards' | 'currencies'>('categories');

  if (!isOpen) return null;

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      await onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleAddCard = async () => {
    if (newCardName.trim()) {
      await onAddCreditCard(newCardName.trim());
      setNewCardName('');
    }
  };

  const handleAddCurrency = async () => {
    if (newCurrencyCode.trim() && newCurrencyName.trim() && newCurrencySymbol.trim()) {
      await onAddCurrency(newCurrencyCode.trim().toUpperCase(), newCurrencyName.trim(), newCurrencySymbol.trim());
      setNewCurrencyCode('');
      setNewCurrencyName('');
      setNewCurrencySymbol('');
    }
  };

  const tabs = [
    { key: 'categories' as const, label: 'Categories' },
    { key: 'cards' as const, label: 'Credit Cards' },
    { key: 'currencies' as const, label: 'Currencies' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1">
                {categories.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Credit Cards Tab */}
          {activeTab === 'cards' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCardName}
                  onChange={e => setNewCardName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCard()}
                  placeholder="Card name (e.g., Visa, Mastercard)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1">
                {creditCards.length === 0 ? (
                  <li className="text-sm text-gray-400 text-center py-4">No credit cards added yet</li>
                ) : (
                  creditCards.map(card => (
                    <li key={card.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{card.name}</span>
                      <button
                        onClick={() => onDeleteCreditCard(card.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Currencies Tab */}
          {activeTab === 'currencies' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newCurrencyCode}
                    onChange={e => setNewCurrencyCode(e.target.value)}
                    placeholder="Code (USD)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    maxLength={10}
                  />
                  <input
                    type="text"
                    value={newCurrencyName}
                    onChange={e => setNewCurrencyName(e.target.value)}
                    placeholder="Name"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    value={newCurrencySymbol}
                    onChange={e => setNewCurrencySymbol(e.target.value)}
                    placeholder="Symbol ($)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    maxLength={10}
                  />
                </div>
                <button
                  onClick={handleAddCurrency}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Currency
                </button>
              </div>
              <ul className="space-y-1">
                {currencies.map(cur => (
                  <li key={cur.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{cur.code}</span>
                      <span className="text-sm text-gray-400 ml-2">({cur.symbol}) {cur.name}</span>
                    </div>
                    <button
                      onClick={() => onDeleteCurrency(cur.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
