
export interface PaymentDetail {
  valor: number;
  quantidade: number;
}

export interface PaymentPlan {
  total: number;
  ato: number;
  parcelas: PaymentDetail;
  anual: PaymentDetail;
  unica: number;
  financiado: number;
}

export interface Unit {
  id: string;
  area: number;
  valorTabela: PaymentPlan;
}

export interface Property {
  id: string;
  name: string;
  units: Unit[];
}

export interface ClientProposal {
  total?: number;
  ato?: number;
  parcelas?: { valor?: number };
  anual?: { valor?: number };
  unica?: number;
}

export interface DiscountSuggestion {
    suggestedDiscountPercentage: number;
    rationale: string;
    newNegotiatedValue: number;
}

export type DiscountApplicationTarget = 'financiado' | 'anual' | 'parcelas' | 'unica';
