'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toaster';
import { useReviews } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  userName: string;
  userInitials: string;
  date: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    userName: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [votedMap, setVotedMap] = useState<Record<string, 'helpful' | 'notHelpful'>>({});

  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const reviewsApi = useReviews();

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsApi.getProductReviews(productId);
      if (data) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReview.title.trim() || !newReview.comment.trim()) {
      addToast({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha o título e o seu comentário sobre o produto na obra.'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        rating: newReview.rating,
        title: newReview.title.trim(),
        comment: newReview.comment.trim(),
        userName: newReview.userName.trim() || user?.name || 'Cliente da Obra',
        verified: true,
      };

      await reviewsApi.createReview(productId, payload);

      addToast({
        type: 'success',
        title: 'Avaliação publicada!',
        message: 'Obrigado por compartilhar sua experiência de uso deste material.'
      });

      setNewReview({ rating: 5, title: '', comment: '', userName: '' });
      setShowReviewForm(false);
      await loadReviews();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erro ao enviar avaliação',
        message: error.message || 'Tente novamente mais tarde'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpfulVote = async (reviewId: string, helpful: boolean) => {
    if (votedMap[reviewId]) {
      addToast({
        type: 'info',
        title: 'Voto já registrado',
        message: 'Você já avaliou a utilidade deste comentário.'
      });
      return;
    }

    try {
      await reviewsApi.voteReview(reviewId, helpful);
      
      setVotedMap(prev => ({ ...prev, [reviewId]: helpful ? 'helpful' : 'notHelpful' }));
      
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            helpful: helpful ? r.helpful + 1 : r.helpful,
            notHelpful: !helpful ? r.notHelpful + 1 : r.notHelpful,
          };
        }
        return r;
      }));

      addToast({
        type: 'success',
        title: 'Obrigado pelo feedback!',
        message: 'Seu voto ajudará outros compradores e construtores.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao registrar voto',
        message: 'Tente novamente.'
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-100'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Resumo das Avaliações / Placar Geral */}
      <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 rounded-2xl p-6 md:p-8 border border-gray-200/80 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Coluna 1: Nota Média */}
          <div className="md:col-span-4 text-center md:text-left md:border-r md:border-gray-200/80 md:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              <span>Avaliações Reais de Obras</span>
            </div>
            <div className="flex items-baseline justify-center md:justify-start gap-2 mt-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">
                {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-gray-400 text-lg font-bold">/ 5.0</span>
            </div>
            <div className="mt-2 flex justify-center md:justify-start">
              {renderStars(stats.totalReviews > 0 ? stats.averageRating : 5, 'lg')}
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {stats.totalReviews > 0 
                ? `Baseado em ${stats.totalReviews} avaliaç${stats.totalReviews === 1 ? 'ão' : 'ões'} de compradores e empreiteiros`
                : 'Seja o primeiro a avaliar este item!'}
            </p>
          </div>

          {/* Coluna 2: Barra de Distribuição */}
          <div className="md:col-span-5 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution] || 0;
              const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                  <span className="w-6 text-right flex items-center justify-end gap-1">
                    {star} <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  </span>
                  <div className="flex-1 bg-gray-200/70 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-amber-400 h-full rounded-full"
                    />
                  </div>
                  <span className="w-8 text-left text-gray-400 font-medium">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Coluna 3: Ação de Avaliar */}
          <div className="md:col-span-3 flex flex-col justify-center items-center text-center">
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{showReviewForm ? 'Fechar Formulário' : 'Avaliar este Produto'}</span>
            </button>
            <p className="text-[11px] text-gray-500 mt-2">
              Compartilhe sua experiência de aplicação na obra
            </p>
          </div>
        </div>
      </div>

      {/* Formulário Interativo de Nova Avaliação */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmitReview} className="bg-white border-2 border-orange-200 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    Escrever Avaliação para <span className="text-orange-600">{productName}</span>
                  </h4>
                  <p className="text-xs text-gray-500">Ajude outros profissionais da construção a escolher o melhor material</p>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                  Avaliação da Obra
                </span>
              </div>

              {/* Seletor de Estrelas */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Sua Nota Geral *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= newReview.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">
                    {newReview.rating === 5 && '🌟 Excelente! Recomendo'}
                    {newReview.rating === 4 && '👍 Muito bom'}
                    {newReview.rating === 3 && '😐 Atende o básico'}
                    {newReview.rating === 2 && '👎 Poderia ser melhor'}
                    {newReview.rating === 1 && '⚠️ Não recomendo'}
                  </span>
                </div>
              </div>

              {/* Nome do Avaliador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Seu Nome ou Empresa / Construtora
                  </label>
                  <input
                    type="text"
                    value={newReview.userName}
                    onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                    placeholder={user?.name || "Ex: Carlos Silva (Engenheiro / Mestre de Obras)"}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Título da Avaliação */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Título Resumido *
                  </label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="Ex: Excelente acabamento e encaixe perfeito no tubo"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Comentário Detalhado */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Comentário / Detalhes de Uso na Obra *
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={3}
                  placeholder="Conte como foi a instalação, resistência do material, durabilidade e tempo de entrega..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Publicar Avaliação</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white border border-gray-200/90 rounded-2xl p-5 md:p-6 shadow-sm hover:border-orange-200 transition"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                  {review.userInitials || 'CO'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{review.userName}</span>
                    {review.verified && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Compra Verificada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {renderStars(review.rating, 'sm')}
                    <span className="text-[11px] text-gray-400 font-medium">
                      • {formatDate(review.date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <h5 className="font-bold text-gray-900 text-sm mb-1.5">{review.title}</h5>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">{review.comment}</p>

            {/* Votação de Avaliação Útil */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span className="text-[11px]">Esta avaliação foi útil para sua decisão?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleHelpfulVote(review.id, true)}
                  disabled={!!votedMap[review.id]}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                    votedMap[review.id] === 'helpful'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Sim ({review.helpful})</span>
                </button>
                <button
                  onClick={() => handleHelpfulVote(review.id, false)}
                  disabled={!!votedMap[review.id]}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                    votedMap[review.id] === 'notHelpful'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>Não ({review.notHelpful})</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50/60 rounded-2xl border border-dashed border-gray-300">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Star className="h-7 w-7" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              Nenhuma avaliação cadastrada ainda
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Você já utilizou este material em sua obra ou reforma? Deixe a primeira avaliação e ajude outros construtores!
            </p>
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-5 rounded-xl shadow transition text-xs"
            >
              Avaliar Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
