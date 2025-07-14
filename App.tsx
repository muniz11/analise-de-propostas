
import React, { useState, useEffect, useMemo } from 'react';
import { Property, Unit, ClientProposal, PaymentPlan, DiscountSuggestion, DiscountApplicationTarget } from './types';
import { properties } from './data/mockData';
import PropertySelector from './components/PropertySelector';
import ProposalTable from './components/ProposalTable';
import SummaryCard from './components/SummaryCard';
import DiscountAdvisor from './components/DiscountAdvisor';
import { getDiscountSuggestion } from './services/geminiService';

const App: React.FC = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0].id);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(properties[0].units[0].id);
  const [clientProposal, setClientProposal] = useState<ClientProposal>({});
  const [discountSuggestion, setDiscountSuggestion] = useState<DiscountSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProperty = useMemo(() => properties.find(p => p.id === selectedPropertyId)!, [selectedPropertyId]);

  // Safely find the selected unit. If the unitId from state doesn't exist in the
  // currently selected property, default to the first unit of that property.
  // This prevents the app from crashing when the property changes.
  const selectedUnit = useMemo(() => {
      const unit = selectedProperty.units.find(u => u.id === selectedUnitId);
      return unit || selectedProperty.units[0];
  }, [selectedProperty, selectedUnitId]);

  // This effect handles state synchronization and resets when the context changes.
  useEffect(() => {
    const currentUnitId = selectedUnit.id;
    // If the unit ID in state is out of sync, update it. This happens when the property is switched.
    if (selectedUnitId !== currentUnitId) {
      setSelectedUnitId(currentUnitId);
    }
    // Reset proposal details whenever the unit changes.
    setClientProposal({});
    setDiscountSuggestion(null);
  }, [selectedUnit.id]);

  const handleClearProposal = () => {
    setClientProposal({});
  };

  const calculatedProposal: PaymentPlan = useMemo(() => {
    const tableValue = selectedUnit.valorTabela;
    const proposal = clientProposal;

    const negotiatedTotal = proposal.total ?? tableValue.total;
    
    // Use proposed `ato` or default to table value.
    const ato = proposal.ato ?? tableValue.ato;
    
    // Calculate the difference ONLY if the client's `ato` is lower than the table's `ato`.
    const atoDifference = tableValue.ato - ato;
    let remainingDifference = atoDifference > 0 ? atoDifference : 0;

    // --- PARCELAS ---
    let parcelasValor: number;
    // Check if user provided a value for parcelas
    if (proposal.parcelas?.valor !== undefined) {
        parcelasValor = proposal.parcelas.valor;
    } else if (remainingDifference > 0 && tableValue.parcelas.quantidade > 0) {
        // No user input for parcelas, so apply the difference here.
        const baseParcelasTotal = tableValue.parcelas.valor * tableValue.parcelas.quantidade;
        const newParcelasTotal = baseParcelasTotal + remainingDifference;
        parcelasValor = newParcelasTotal / tableValue.parcelas.quantidade;
        remainingDifference = 0; // The difference is fully absorbed.
    } else {
        // No difference to apply or user didn't set value. Use table value.
        parcelasValor = tableValue.parcelas.valor;
    }

    // --- ANUAL ---
    let anualValor: number;
    // Check if user provided a value for anual
    if (proposal.anual?.valor !== undefined) {
        anualValor = proposal.anual.valor;
    } else if (remainingDifference > 0 && tableValue.anual.quantidade > 0) {
        // No user input for anual, apply remaining difference.
        const baseAnualTotal = tableValue.anual.valor * tableValue.anual.quantidade;
        const newAnualTotal = baseAnualTotal + remainingDifference;
        anualValor = newAnualTotal / tableValue.anual.quantidade;
        remainingDifference = 0; // Difference absorbed.
    } else {
        anualValor = tableValue.anual.valor;
    }
    
    // --- ÚNICA ---
    let unica: number;
    // Check if user provided a value for unica
    if (proposal.unica !== undefined) {
        unica = proposal.unica;
    } else if (remainingDifference > 0) {
        // No user input for unica, apply remaining difference.
        unica = tableValue.unica + remainingDifference;
        remainingDifference = 0; // Difference absorbed.
    } else {
        unica = tableValue.unica;
    }
    
    // --- FINAL CALCULATION ---
    const parcelasTotal = parcelasValor * tableValue.parcelas.quantidade;
    const anualTotal = anualValor * tableValue.anual.quantidade;
    const paidBeforeFinancing = ato + parcelasTotal + anualTotal + unica;
    const financiado = negotiatedTotal - paidBeforeFinancing;

    return {
        total: negotiatedTotal,
        ato,
        parcelas: { valor: parcelasValor, quantidade: tableValue.parcelas.quantidade },
        anual: { valor: anualValor, quantidade: tableValue.anual.quantidade },
        unica,
        financiado,
    };
  }, [selectedUnit, clientProposal]);

  const handleAnalyzeProposal = async () => {
    setIsLoadingSuggestion(true);
    setError(null);
    setDiscountSuggestion(null);
    try {
      const suggestion = await getDiscountSuggestion(selectedProperty, selectedUnit, calculatedProposal);
      setDiscountSuggestion(suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleApplyDiscount = (target: DiscountApplicationTarget) => {
    if (!discountSuggestion) return;

    const newTotal = discountSuggestion.newNegotiatedValue;
    const totalDiscount = calculatedProposal.total - newTotal;
    
    const newClientProposal: ClientProposal = {
        ...clientProposal,
        total: newTotal,
    };
    
    if (target === 'financiado') {
        setClientProposal(newClientProposal);
        return;
    }
    
    switch (target) {
        case 'anual': {
            const currentAnualValor = calculatedProposal.anual.valor;
            const quantity = selectedUnit.valorTabela.anual.quantidade;
            if (quantity > 0) {
                const totalAnualValue = currentAnualValor * quantity;
                const newTotalAnualValue = Math.max(0, totalAnualValue - totalDiscount);
                newClientProposal.anual = { valor: newTotalAnualValue / quantity };
            }
            break;
        }
        case 'parcelas': {
            const currentParcelasValor = calculatedProposal.parcelas.valor;
            const quantity = selectedUnit.valorTabela.parcelas.quantidade;
            if (quantity > 0) {
                const totalParcelasValue = currentParcelasValor * quantity;
                const newTotalParcelasValue = Math.max(0, totalParcelasValue - totalDiscount);
                newClientProposal.parcelas = { valor: newTotalParcelasValue / quantity };
            }
            break;
        }
        case 'unica': {
            const currentUnicaValue = calculatedProposal.unica;
            newClientProposal.unica = Math.max(0, currentUnicaValue - totalDiscount);
            break;
        }
    }
    
    setClientProposal(newClientProposal);
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Analisador de Propostas Imobiliárias</h1>
          <p className="mt-2 text-lg text-gray-600">Selecione o imóvel, ajuste a proposta e obtenha sugestões de desconto com IA.</p>
        </header>

        <main className="space-y-8">
          <PropertySelector
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
            selectedUnitId={selectedUnit.id}
            onSelectUnit={setSelectedUnitId}
            units={selectedProperty.units}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-md border border-gray-200">
               <ProposalTable 
                basePlan={selectedUnit.valorTabela}
                clientProposal={clientProposal}
                onProposalChange={setClientProposal}
                calculatedProposal={calculatedProposal}
                propertyName={selectedProperty.name}
                unitId={selectedUnit.id}
                onClearProposal={handleClearProposal}
               />
            </div>
            
            <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
                <SummaryCard 
                    basePlan={selectedUnit.valorTabela}
                    calculatedProposal={calculatedProposal}
                    area={selectedUnit.area}
                />
                <DiscountAdvisor
                    onAnalyze={handleAnalyzeProposal}
                    suggestion={discountSuggestion}
                    isLoading={isLoadingSuggestion}
                    error={error}
                    calculatedTotal={calculatedProposal.total}
                    onApplyDiscount={handleApplyDiscount}
                />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
