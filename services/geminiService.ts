import { Property, Unit, PaymentPlan, DiscountSuggestion } from '../types';

export const getDiscountSuggestion = async (
  property: Property,
  unit: Unit,
  clientProposal: PaymentPlan
): Promise<DiscountSuggestion> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ property, unit, clientProposal }),
    });

    const result = await response.json();

    if (!response.ok) {
        // Log the detailed error from the backend if available
        console.error("Error from backend:", result);
        throw new Error(result.error || `Request failed with status ${response.status}`);
    }

    // The backend should have already validated, but a client-side check is good practice.
    if (
      typeof result.suggestedDiscountPercentage !== 'number' ||
      typeof result.rationale !== 'string' ||
      typeof result.newNegotiatedValue !== 'number'
    ) {
      throw new Error("Formato de resposta da API inválido.");
    }
    
    return result as DiscountSuggestion;

  } catch (error) {
    console.error("Erro ao chamar a API de sugestão:", error);
    if (error instanceof Error) {
        // Re-throw a user-friendly message
        throw new Error(`Não foi possível obter a sugestão: ${error.message}`);
    }
    throw new Error("Não foi possível obter a sugestão da IA devido a um erro desconhecido.");
  }
};
