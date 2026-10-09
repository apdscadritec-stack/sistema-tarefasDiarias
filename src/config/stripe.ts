export const STRIPE_PUBLIC =
  import.meta.env.STRIPE_PUBLIC


export interface CardDetails {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  name: string;
}

export interface StripePaymentResult {
  success: boolean;
  tokenId?: string;
  error?: string;
}

/**
 * Tokeniza os dados do cartão de crédito através da API pública oficial da Stripe.
 */
export async function createStripeToken(card: CardDetails): Promise<StripePaymentResult> {
  try {
    const cleanNumber = card.number.replace(/\s+/g, '');
    const cleanMonth = card.expMonth.trim();
    const cleanYear = card.expYear.trim().length === 2 ? `20${card.expYear.trim()}` : card.expYear.trim();
    const cleanCvc = card.cvc.trim();

    if (!cleanNumber || cleanNumber.length < 13) {
      return { success: false, error: 'Número de cartão inválido.' };
    }
    if (!cleanMonth || Number(cleanMonth) < 1 || Number(cleanMonth) > 12) {
      return { success: false, error: 'Mês de expiração inválido.' };
    }
    if (!cleanYear || Number(cleanYear) < 2024) {
      return { success: false, error: 'Ano de expiração inválido.' };
    }
    if (!cleanCvc || cleanCvc.length < 3) {
      return { success: false, error: 'Código CVC inválido.' };
    }

    const formBody = new URLSearchParams();
    formBody.append('card[number]', cleanNumber);
    formBody.append('card[exp_month]', cleanMonth);
    formBody.append('card[exp_year]', cleanYear);
    formBody.append('card[cvc]', cleanCvc);
    if (card.name) {
      formBody.append('card[name]', card.name);
    }

    const response = await fetch('https://api.stripe.com/v1/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${STRIPE_PUBLIC}`,
      },
      body: formBody.toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const stripeError = data.error?.message || 'Falha ao processar pagamento no Stripe.';
      return { success: false, error: stripeError };
    }

    return {
      success: true,
      tokenId: data.id,
    };
  } catch (err: any) {
    console.error('Erro na requisição Stripe:', err);
    return {
      success: false,
      error: 'Não foi possível conectar à Stripe. Verifique sua conexão.',
    };
  }
}
