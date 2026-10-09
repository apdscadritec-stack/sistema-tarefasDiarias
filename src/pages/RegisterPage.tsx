import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let message = 'Falha ao criar conta. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Endereço de e-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca.';
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors"
      style={{ backgroundColor: colors.bgPrimary }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-3xl p-6 shadow-xl border transition-colors"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
              Criar Conta
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Ganhe 30 dias de teste grátis
            </p>
          </div>

          {errorMessage ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl p-3 mb-4 text-center">
              <span className="text-red-600 dark:text-red-400 text-xs font-medium">⚠️ {errorMessage}</span>
            </div>
          ) : null}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                Nome Completo
              </label>
              <input
                type="text"
                className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-green-500 transition-all"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                E-mail
              </label>
              <input
                type="email"
                className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-green-500 transition-all"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                Senha
              </label>
              <input
                type="password"
                className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-green-500 transition-all"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                Confirmar Senha
              </label>
              <input
                type="password"
                className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-green-500 transition-all"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-bold text-base shadow-md transition-all active:scale-[0.98] ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>

            <div className="flex justify-center text-sm pt-2">
              <span style={{ color: colors.textSecondary }}>Já possui uma conta?&nbsp;</span>
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Faça login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
