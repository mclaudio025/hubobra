'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  CheckCircle, 
  MessageCircle, 
  KeyRound, 
  Sparkles,
  ShieldCheck,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toaster';
import Loading from '../components/ui/Loading';
import { STORE_CONFIG, getWhatsAppLink } from '@/config/store.config';

function LoginFormContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: true,
  });
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Senhas divergentes',
        message: 'A confirmação de senha não confere com a senha digitada.',
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const loggedUser: any = await login(formData.email, formData.password);
        addToast({
          type: 'success',
          title: 'Bem-vindo(a) de volta!',
          message: `Login realizado com sucesso na ${STORE_CONFIG.name}.`,
        });

        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (loggedUser?.role === 'ADMIN' || loggedUser?.role === 'MANAGER') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        await register(formData.name, formData.email, formData.password);
        addToast({
          type: 'success',
          title: 'Conta criada com sucesso!',
          message: `Bem-vindo à ${STORE_CONFIG.name}! Você já pode começar a comprar.`,
        });
        
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push('/');
        }
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: isLogin ? 'Falha na autenticação' : 'Erro no cadastro',
        message: error.message || 'Verifique suas credenciais e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleQuickFillAdmin = () => {
    setFormData(prev => ({
      ...prev,
      email: 'admin@loja.com',
      password: 'admin123'
    }));
    setIsLogin(true);
    addToast({
      type: 'info',
      title: 'Credenciais preenchidas',
      message: 'Admin de demonstração carregado no formulário.',
    });
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    // Simula envio e prepara link de suporte rápido
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
      addToast({
        type: 'success',
        title: 'Instruções enviadas!',
        message: `Se o e-mail ${forgotEmail} estiver cadastrado, você receberá o link de redefinição.`,
      });
    }, 800);
  };

  const getWhatsAppRecoveryUrl = () => {
    const emailToUse = forgotEmail || formData.email || '';
    const message = `Olá equipe da ${STORE_CONFIG.name}! 👋\nPreciso de suporte para redefinir/recuperar a senha da minha conta.\n\n📧 *Email cadastrado:* ${emailToUse || '(informar email)'}`;
    return getWhatsAppLink(message);
  };

  return (
    <div className="min-h-[92vh] bg-gradient-to-b from-slate-50 via-orange-50/20 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Botão de voltar ao topo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors py-1 px-2.5 rounded-lg hover:bg-orange-100/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para a loja
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo e Identidade */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20 mb-3">
            <span className="font-extrabold text-2xl tracking-tighter">H</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta na ' + STORE_CONFIG.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isLogin ? 'Não tem uma conta? ' : 'Já possui cadastro? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all"
            >
              {isLogin ? 'Cadastre-se grátis' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nome Completo (Apenas Cadastro) */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Senha
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(formData.email);
                      setForgotSent(false);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  placeholder={isLogin ? 'Sua senha de acesso' : 'Mínimo de 6 caracteres'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha digitada'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Senha (Apenas Cadastro) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    placeholder="Repita a senha digitada"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Ver confirmação de senha'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Manter conectado */}
            {isLogin && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span className="text-xs text-slate-600 font-medium">Lembrar deste dispositivo</span>
                </label>
              </div>
            )}

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 shadow-md shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <Loading size="sm" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    {isLogin ? 'Entrar na Conta' : 'Criar Conta e Começar'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Credenciais de Teste / Atalho */}
          {isLogin && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ambiente de Testes
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 py-1 px-2.5 rounded-lg border border-orange-200 transition-colors inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Preencher Admin
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 border border-slate-200/70 font-mono flex items-center justify-between">
                <span>admin@loja.com</span>
                <span className="text-slate-400 font-sans">senha: admin123</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Recuperar sua senha
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Informe o e-mail cadastrado na sua conta. Vamos enviar as instruções para você redefinir sua senha com segurança.
            </p>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-900">Instruções Enviadas!</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Verifique sua caixa de entrada e pasta de spam em <strong>{forgotEmail}</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={getWhatsAppRecoveryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Atendimento Rápido no WhatsApp
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Fechar e voltar ao login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgotEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    E-mail da sua conta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 focus:outline-none disabled:opacity-50 transition-all"
                  >
                    {forgotLoading ? <Loading size="sm" /> : 'Enviar link de recuperação'}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase">ou suporte direto</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <a
                    href={getWhatsAppRecoveryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Recuperar via WhatsApp Oficial
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
