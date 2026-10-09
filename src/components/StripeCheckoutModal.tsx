import React, { useState } from 'react';
import { CardDetails, createStripeToken } from '../config/stripe';

interface StripeCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessPayment: (stripeTokenId: string) => Promise<void>;
  amountText?: string;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  visible,
  onClose,
  onSuccessPayment,
  amountText = 'R$ 29,90',
}) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState(''); // MM/YY
  const [cvc, setCvc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!visible) return null;

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleaned;
  };

  const formatExpDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpDate(formatExpDate(e.target.value));
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!cardName.trim()) {
      setErrorMessage('Por favor, digite o nome impresso no cartão.');
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13) {
      setErrorMessage('Número do cartão inválido.');
      return;
    }

    const expParts = expDate.split('/');
    if (expParts.length !== 2 || !expParts[0] || !expParts[1]) {
      setErrorMessage('Informe a data de validade no formato MM/AA.');
      return;
    }

    if (!cvc.trim() || cvc.trim().length < 3) {
      setErrorMessage('Informe o código CVC de 3 ou 4 dígitos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cardPayload: CardDetails = {
        name: cardName.trim(),
        number: cleanCard,
        expMonth: expParts[0].trim(),
        expYear: expParts[1].trim(),
        cvc: cvc.trim(),
      };

      const result = await createStripeToken(cardPayload);

      if (!result.success || !result.tokenId) {
        setErrorMessage(result.error || 'Erro ao validar cartão na Stripe.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Pagamento autorizado na Stripe! Ativando assinatura...');

      await onSuccessPayment(result.tokenId);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro no checkout Stripe:', err);
      setErrorMessage('Erro ao processar pagamento com a Stripe.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic text-[#635BFF]">stripe</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Checkout de Assinatura</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-lg text-slate-500 font-bold">✕</span>
          </button>
        </div>

        <form onSubmit={handleProcessPayment} className="space-y-4">
          {/* Price Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Plano Premium Tarefas Diárias</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Acesso total ilimitado a todos os recursos</p>
            </div>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{amountText}</span>
          </div>

          {errorMessage ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 p-3 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-xs font-semibold">⚠️ {errorMessage}</p>
            </div>
          ) : null}

          {successMessage ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 rounded-xl">
              <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">✅ {successMessage}</p>
            </div>
          ) : null}

          {/* Card Form */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome no Cartão</label>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              placeholder="Ex: JOAO S SILVA"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Número do Cartão</label>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Validade (MM/AA)</label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="12/28"
                value={expDate}
                onChange={handleExpDateChange}
                maxLength={5}
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CVC</label>
              <input
                type="password"
                className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                maxLength={4}
              />
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-2.5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              🔒 Criptografia SSL de 256 bits. Seus dados de pagamento são transmitidos com total segurança via Stripe.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-white font-bold text-base shadow-md transition-all ${
              isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-[#635BFF] hover:bg-[#534be0] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? 'Processando...' : `💳 Pagar ${amountText} com Stripe`}
          </button>

          <button
            type="button"
            className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:underline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};
