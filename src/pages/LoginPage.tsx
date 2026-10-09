import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoBlack from '../assets/images/logo_black.png';
import logoWhite from '../assets/images/logo_white.png';

export const LoginPage: React.FC = () => {
  const [loginMode, setLoginMode] = useState<'email' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, getTaskOwnerByLinkCode } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLoginEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (error: any) {
      console.error('Erro no login:', error);
      let message = 'Falha ao realizar login. Verifique suas credenciais.';
      if (error.code === 'auth/invalid-email') {
        message = 'Endereço de e-mail inválido.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas malsucedidas. Tente novamente mais tarde.';
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) {
      setErrorMessage('Por favor, digite o código do link.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const cleanCode = linkCode.trim();
      const result = await getTaskOwnerByLinkCode(cleanCode);

      if (!result) {
        setErrorMessage('Código de link não encontrado. Verifique e tente novamente.');
        setIsSubmitting(false);
        return;
      }

      navigate(`/link/${cleanCode}`);
    } catch (error) {
      console.error('Erro ao acessar por código de link:', error);
      setErrorMessage('Erro ao conectar ao servidor do link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors"
      style={{ backgroundColor: colors.bgPrimary }}
    >
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center">
          <img
            src={isDarkMode ? logoBlack : logoWhite}
            alt="Logo Tarefas Diárias"
            className="h-20 object-contain mb-2"
          />
          <button
            type="button"
            className="self-end bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            onClick={toggleTheme}
          >
            {isDarkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>
        </div>

        <div
          className="rounded-3xl p-6 shadow-xl border transition-colors"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <div className="mb-5 text-center">
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Escolha como deseja se conectar ao sistema
            </p>
          </div>

          {/* Login Mode Selector Tabs */}
          <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl mb-5">
            <button
              type="button"
              className={`flex-1 py-2.5 text-center rounded-lg text-xs font-semibold transition-all ${
                loginMode === 'email'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              onClick={() => {
                setLoginMode('email');
                setErrorMessage('');
              }}
            >
              📧 E-mail e Senha
            </button>

            <button
              type="button"
              className={`flex-1 py-2.5 text-center rounded-lg text-xs font-semibold transition-all ${
                loginMode === 'link'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              onClick={() => {
                setLoginMode('link');
                setErrorMessage('');
              }}
            >
              🔗 Código do Link
            </button>
          </div>

          {errorMessage ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl p-3 mb-4 text-center">
              <span className="text-red-600 dark:text-red-400 text-xs font-medium">⚠️ {errorMessage}</span>
            </div>
          ) : null}

          {loginMode === 'email' ? (
            <form onSubmit={handleLoginEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                  E-mail
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-bold text-base shadow-md transition-all active:scale-[0.98] ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar com Conta'}
              </button>

              <div className="flex justify-center text-sm pt-2">
                <span style={{ color: colors.textSecondary }}>Ainda não tem uma conta?&nbsp;</span>
                <Link to="/register" className="text-blue-600 font-bold hover:underline">
                  Cadastre-se
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                  Código do Link
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl px-3.5 py-3 text-sm border outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                  placeholder="Digite seu código de link (Ex: abc123_l1)"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-bold text-base shadow-md transition-all active:scale-[0.98] ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Conectando...' : '🚀 Acessar pelo Link'}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed pt-2">
                Ao entrar pelo código do link, você acessa diretamente as tarefas atribuídas àquele link neste dispositivo.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
