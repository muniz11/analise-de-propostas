
import React, { useState } from 'react';
import { DiscountSuggestion, DiscountApplicationTarget } from '../types';
import { SparklesIcon, LightBulbIcon, CheckIcon } from './icons';

interface DiscountAdvisorProps {
  onAnalyze: () => void;
  suggestion: DiscountSuggestion | null;
  isLoading: boolean;
  error: string | null;
  calculatedTotal: number;
  onApplyDiscount: (target: DiscountApplicationTarget) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const DiscountAdvisor: React.FC<DiscountAdvisorProps> = ({ onAnalyze, suggestion, isLoading, error, calculatedTotal, onApplyDiscount }) => {
  const [selectedTarget, setSelectedTarget] = useState<DiscountApplicationTarget>('financiado');
  const finalDiscountValue = calculatedTotal - (suggestion?.newNegotiatedValue ?? calculatedTotal);

  const targets: { id: DiscountApplicationTarget; label: string }[] = [
    { id: 'financiado', label: 'No Financiamento' },
    { id: 'parcelas', label: 'Nas Parcelas' },
    { id: 'anual', label: 'Na Anual' },
    { id: 'unica', label: 'Na Única' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
        <SparklesIcon className="h-6 w-6 text-indigo-500 mr-2" />
        Consultor de Descontos (IA)
      </h3>

      <button
        onClick={onAnalyze}
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analisando...
          </>
        ) : (
          'Analisar Proposta'
        )}
      </button>

      {error && (
        <div className="mt-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {suggestion && !isLoading && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div className="text-center bg-green-50 border-2 border-dashed border-green-300 p-4 rounded-lg">
            <p className="text-sm text-green-700">Sugestão de Desconto Máximo</p>
            <p className="text-3xl font-bold text-green-800">{suggestion.suggestedDiscountPercentage.toFixed(2)}%</p>
            <p className="text-sm font-semibold text-green-700">
              {formatCurrency(finalDiscountValue)} sobre o valor atual da proposta
            </p>
          </div>
          <div className="text-center bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Novo Valor Negociado Sugerido</p>
            <p className="text-2xl font-bold text-indigo-700">{formatCurrency(suggestion.newNegotiatedValue)}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm text-yellow-800 flex items-center mb-2">
                <LightBulbIcon className="h-5 w-5 mr-1.5"/>
                Justificativa da IA
            </h4>
            <p className="text-sm text-yellow-900">{suggestion.rationale}</p>
          </div>

          <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4">
            <h4 className="font-bold text-md text-gray-800 mb-3 text-center">
              Aplicar Sugestão de Desconto
            </h4>
            <p className="text-center text-sm text-gray-500 mb-4">Escolha onde o valor do desconto será abatido.</p>
            
            <div className="grid grid-cols-2 gap-2">
              {targets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => setSelectedTarget(target.id)}
                  className={`p-2 rounded-md text-center text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    selectedTarget === target.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'
                  }`}
                >
                  {target.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => onApplyDiscount(selectedTarget)}
              className="mt-4 w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out flex items-center justify-center gap-2"
            >
              <CheckIcon className="h-5 w-5" />
              Aplicar e Recalcular Proposta
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default DiscountAdvisor;
