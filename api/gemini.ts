import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { Property, Unit, PaymentPlan, DiscountSuggestion } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { property, unit, clientProposal } = req.body as {
    property: Property;
    unit: Unit;
    clientProposal: PaymentPlan;
  };

  if (!property || !unit || !clientProposal) {
    return res.status(400).json({ error: 'Missing required body parameters.' });
  }

  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set on Vercel.");
    return res.status(500).json({ error: "Server configuration error. API_KEY is missing." });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  const prompt = `
    Analise a seguinte proposta de pagamento para um imóvel e sugira um desconto máximo justificável.

    **Contexto:**
    Você é um analista financeiro imobiliário especialista. Seu objetivo é avaliar a proposta de pagamento de um cliente em comparação com o plano de pagamento padrão da empresa (Valor Tabela). Sua sugestão de desconto deve ser estritamente baseada nos benefícios financeiros que a proposta do cliente oferece à empresa. Um fluxo de caixa melhor (maior pagamento inicial, menor valor financiado, prazo mais curto) justifica um desconto maior.

    **Detalhes do Imóvel:**
    - Empreendimento: ${property.name}
    - Unidade: ${unit.id}
    - Área: ${unit.area} m²

    **Plano Padrão (Valor Tabela):**
    - Valor Total: ${formatCurrency(unit.valorTabela.total)}
    - Ato: ${formatCurrency(unit.valorTabela.ato)}
    - Parcelas: ${unit.valorTabela.parcelas.quantidade}x de ${formatCurrency(unit.valorTabela.parcelas.valor)}
    - Anual: ${unit.valorTabela.anual.quantidade}x de ${formatCurrency(unit.valorTabela.anual.valor)}
    - Única: ${formatCurrency(unit.valorTabela.unica)}
    - Valor Financiado: ${formatCurrency(unit.valorTabela.financiado)} (${(unit.valorTabela.financiado / unit.valorTabela.total * 100).toFixed(2)}%)

    **Proposta do Cliente (Valor Negociado):**
    - Valor Total: ${formatCurrency(clientProposal.total)}
    - Ato: ${formatCurrency(clientProposal.ato)}
    - Parcelas: ${clientProposal.parcelas.quantidade}x de ${formatCurrency(clientProposal.parcelas.valor)}
    - Anual: ${clientProposal.anual.quantidade}x de ${formatCurrency(clientProposal.anual.valor)}
    - Única: ${formatCurrency(clientProposal.unica)}
    - Valor Financiado: ${formatCurrency(clientProposal.financiado)} (${(clientProposal.financiado / clientProposal.total * 100).toFixed(2)}%)

    **Sua Tarefa:**
    Com base na comparação, determine o percentual de desconto máximo que pode ser oferecido sobre o "Valor Total" da proposta do cliente. Forneça uma justificativa clara e concisa para sua sugestão. A resposta DEVE estar no formato JSON.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedDiscountPercentage: {
              type: Type.NUMBER,
              description: "O percentual de desconto sugerido. Exemplo: 5.5 para 5.5%.",
            },
            rationale: {
              type: Type.STRING,
              description: "Uma explicação clara para o desconto, destacando os benefícios financeiros (ex: maior entrada, redução do financiamento).",
            },
            newNegotiatedValue: {
              type: Type.NUMBER,
              description: "O novo valor total do imóvel após aplicar o desconto sugerido sobre o valor total da proposta do cliente.",
            },
          },
          required: ["suggestedDiscountPercentage", "rationale", "newNegotiatedValue"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as DiscountSuggestion;
    
    if (
      typeof result.suggestedDiscountPercentage !== 'number' ||
      typeof result.rationale !== 'string' ||
      typeof result.newNegotiatedValue !== 'number'
    ) {
      throw new Error("Formato de resposta da IA inválido.");
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Erro ao chamar a API Gemini no backend:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred on the server.";
    return res.status(500).json({ error: "Não foi possível obter a sugestão da IA.", details: errorMessage });
  }
}