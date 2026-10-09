import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StripeCheckoutModal } from '../components/StripeCheckoutModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const BlockedPage: React.FC = () => {
  const { userData, logout, processStripePayment } = useAuth();
  const { colors } = useTheme();
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const paymentSucceededRef = useRef(false);
  const navigate = useNavigate();

  const handleStripeSuccess = async (stripeTokenId: string) => {
    try {
      await processStripePayment(stripeTokenId);
      paymentSucceededRef.current = true;
      setFeedback('Pagamento confirmado via Stripe! Redirecionando...');
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setFeedback('Erro ao registrar confirmação. Tente novamente.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 transition-colors"
      style={{ backgroundColor: colors.bgPrimary }}
    >
      <div className="w-full max-w-md space-y-4">
        {/* Top Header */}
        <div className="flex justify-between items-center px-1">
          <span className="text-base font-semibold" style={{ color: colors.textPrimary }}>
            {userData?.name || 'Usuário'}
          </span>
          <button
            type="button"
            onClick={logout}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Expiration Card */}
        <div
          className="rounded-3xl p-7 flex flex-col items-center shadow-xl border text-center transition-colors"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4 text-3xl">
            🔒
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Período de Teste Expirado
          </h2>

          <div className="bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-3.5 py-1 rounded-full mb-4">
            <span className="text-red-800 dark:text-red-300 text-xs font-bold">
              Status: Aguardando Pagamento
            </span>
          </div>

          {/* Core User Message */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: colors.textSecondary }}>
            Seus 30 dias de acesso gratuito terminaram. Para voltar a utilizar o aplicativo Tarefas Diárias e ter acesso total a todos os seus recursos, por favor efetue o pagamento da sua assinatura.
          </p>

          {feedback ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-3 rounded-xl mb-4 w-full text-center">
              <span className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold">{feedback}</span>
            </div>
          ) : null}

          {/* Pay Button using Stripe */}
          <button
            type="button"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-base shadow-lg transition-all"
            onClick={() => {
              paymentSucceededRef.current = false;
              setIsStripeModalOpen(true);
            }}
          >
            💳 Pagar R$ 29,90 com Stripe
          </button>

          <p className="text-xs text-slate-400 mt-3.5">
            Pagamento 100% seguro processado via criptografia SSL do Stripe.
          </p>
        </div>

        {/* Stripe Modal */}
        <StripeCheckoutModal
          visible={isStripeModalOpen}
          onClose={() => {
            setIsStripeModalOpen(false);
            if (paymentSucceededRef.current) {
              navigate('/', { replace: true });
            }
          }}
          onSuccessPayment={handleStripeSuccess}
          amountText="R$ 29,90"
        />
      </div>
    </div>
  );
};
