import React from 'react';
import { PaymentPlan, ClientProposal } from '../types';
import { TrashIcon } from './icons';

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || isNaN(value)) return 'R$ -';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface InputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder: string;
}

const CurrencyInput: React.FC<InputProps> = ({ value, onChange, placeholder }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numberValue = parseFloat(rawValue.replace(/[^0-9,]/g, '').replace(',', '.'));
    onChange(isNaN(numberValue) ? undefined : numberValue);
  };

  return (
    <input
      type="text"
      value={value !== undefined ? new Intl.NumberFormat('pt-BR').format(value) : ''}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full bg-indigo-50 border border-indigo-200 rounded-md p-2 text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
    />
  );
};

interface ProposalTableProps {
  basePlan: PaymentPlan;
  clientProposal: ClientProposal;
  onProposalChange: (proposal: ClientProposal) => void;
  calculatedProposal: PaymentPlan;
  propertyName: string;
  unitId: string;
  onClearProposal: () => void;
}

const ProposalTable: React.FC<ProposalTableProps> = ({
  basePlan,
  clientProposal,
  onProposalChange,
  calculatedProposal,
  propertyName,
  unitId,
  onClearProposal,
}) => {
  const handleProposalChange = <K extends keyof ClientProposal>(field: K, value: ClientProposal[K]) => {
    onProposalChange({ ...clientProposal, [field]: value });
  };
  
  const handleNestedChange = (field: 'parcelas' | 'anual', value: { valor?: number }) => {
     onProposalChange({ ...clientProposal, [field]: value });
  }

  const renderRow = (label: string, baseValue: React.ReactNode, calculatedValue: React.ReactNode, input?: React.ReactNode, isTotal = false) => (
    <div className={`grid grid-cols-12 gap-4 items-center py-3 px-2 ${isTotal ? 'font-bold' : ''} border-b border-gray-200 last:border-b-0`}>
      <div className="col-span-3 text-gray-600">{label}</div>
      <div className="col-span-3 text-right text-gray-800">{baseValue}</div>
      <div className="col-span-3 text-right font-medium text-indigo-700">{calculatedValue}</div>
      <div className="col-span-3">{input || <div className="h-10"></div>}</div>
    </div>
  );

  return (
    <div>
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-xl font-bold">{propertyName}</h2>
            <div className="flex items-center gap-4">
                <span className="text-lg font-semibold bg-gray-700 px-3 py-1 rounded-md">Unidade {unitId}</span>
                <button 
                    onClick={onClearProposal}
                    title="Limpar Proposta"
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition-colors text-sm"
                >
                    <TrashIcon className="h-4 w-4" />
                    Limpar
                </button>
            </div>
        </div>
      <div className="grid grid-cols-12 gap-4 py-3 px-2 bg-gray-100 font-semibold text-sm text-gray-500 border-b-2 border-gray-300">
        <div className="col-span-3">Item</div>
        <div className="col-span-3 text-right">Valor Tabela</div>
        <div className="col-span-3 text-right">Valor Negociado</div>
        <div className="col-span-3 text-center">Proposta do Cliente</div>
      </div>
      
      {renderRow(
        'Valor Total', 
        formatCurrency(basePlan.total), 
        formatCurrency(calculatedProposal.total),
        <CurrencyInput
          value={clientProposal.total}
          onChange={(val) => handleProposalChange('total', val)}
          placeholder={formatCurrency(basePlan.total)}
        />,
        true
      )}

      {renderRow(
        'Ato',
        formatCurrency(basePlan.ato),
        formatCurrency(calculatedProposal.ato),
        <CurrencyInput
          value={clientProposal.ato}
          onChange={(val) => handleProposalChange('ato', val)}
          placeholder={formatCurrency(basePlan.ato)}
        />
      )}

      {renderRow(
        `${basePlan.parcelas.quantidade} Parcelas`,
        formatCurrency(basePlan.parcelas.valor),
        formatCurrency(calculatedProposal.parcelas.valor),
        <CurrencyInput
          value={clientProposal.parcelas?.valor}
          onChange={(val) => handleNestedChange('parcelas', { valor: val })}
          placeholder={formatCurrency(basePlan.parcelas.valor)}
        />
      )}

      {renderRow(
        `${basePlan.anual.quantidade} Anual`,
        formatCurrency(basePlan.anual.valor),
        formatCurrency(calculatedProposal.anual.valor),
        <CurrencyInput
          value={clientProposal.anual?.valor}
          onChange={(val) => handleNestedChange('anual', { valor: val })}
          placeholder={formatCurrency(basePlan.anual.valor)}
        />
      )}

      {renderRow(
        'Única',
        formatCurrency(basePlan.unica),
        formatCurrency(calculatedProposal.unica),
        <CurrencyInput
          value={clientProposal.unica}
          onChange={(val) => handleProposalChange('unica', val)}
          placeholder={formatCurrency(basePlan.unica)}
        />
      )}

      {renderRow(
        'Valor Financiado',
        formatCurrency(basePlan.financiado),
        <span className={calculatedProposal.financiado < 0 ? "text-red-500" : ""}>{formatCurrency(calculatedProposal.financiado)}</span>
      )}
    </div>
  );
};

export default ProposalTable;