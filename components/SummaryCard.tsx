
import React from 'react';
import { PaymentPlan } from '../types';

interface SummaryCardProps {
    basePlan: PaymentPlan;
    calculatedProposal: PaymentPlan;
    area: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const SummaryItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className="flex justify-between items-baseline text-sm">
        <p className="text-gray-500">{label}</p>
        <p className={`font-semibold text-gray-800 ${className}`}>{value}</p>
    </div>
);

const SummaryCard: React.FC<SummaryCardProps> = ({ basePlan, calculatedProposal, area }) => {
    const discountValue = basePlan.total - calculatedProposal.total;
    const discountPercentage = basePlan.total > 0 ? (discountValue / basePlan.total) * 100 : 0;

    const baseFinancingPercent = basePlan.total > 0 ? (basePlan.financiado / basePlan.total) * 100 : 0;
    const proposalFinancingPercent = calculatedProposal.total > 0 ? (calculatedProposal.financiado / calculatedProposal.total) * 100 : 0;

    const basePricePerSqM = area > 0 ? basePlan.total / area : 0;
    const proposalPricePerSqM = area > 0 ? calculatedProposal.total / area : 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-full">
            <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">Resumo da Negociação</h3>
            <div className="space-y-3">
                <SummaryItem label="Área Privativa" value={`${area.toLocaleString('pt-BR')} m²`} />
                <hr/>
                <SummaryItem label="Valor Tabela (m²)" value={formatCurrency(basePricePerSqM)} />
                <SummaryItem label="Valor Proposta (m²)" value={formatCurrency(proposalPricePerSqM)} className="text-indigo-600" />
                <hr/>
                <SummaryItem 
                    label="Desconto Aplicado" 
                    value={formatCurrency(discountValue)} 
                    className={discountValue > 0 ? 'text-green-600' : 'text-gray-800'} 
                />
                 <SummaryItem 
                    label="% Desconto" 
                    value={`${discountPercentage.toFixed(2)}%`} 
                    className={discountPercentage > 0 ? 'text-green-600' : 'text-gray-800'}
                />
                <hr/>
                <SummaryItem label="% Financiado (Tabela)" value={`${baseFinancingPercent.toFixed(2)}%`} />
                <SummaryItem 
                    label="% Financiado (Proposta)" 
                    value={`${proposalFinancingPercent.toFixed(2)}%`}
                    className={proposalFinancingPercent < baseFinancingPercent ? 'text-green-600' : 'text-red-600'}
                />
            </div>
        </div>
    );
};

export default SummaryCard;