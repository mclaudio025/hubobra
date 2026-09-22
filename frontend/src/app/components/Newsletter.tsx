'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Gift,
  Bell,
  Lightbulb,
  Loader2,
  Sparkles
} from 'lucide-react';

interface NewsletterProps {
  variant?: 'default' | 'compact' | 'footer';
  showPreferences?: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
      delay: 0.2
    }
  }
};

export default function Newsletter({ variant = 'default' }: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState({
    promotions: false,
    newProducts: false,
    tips: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Por favor, insira seu email');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/mail/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          preferences: showPreferences ? preferences : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Inscrição realizada com sucesso! Verifique seu email.');
        setEmail('');
        setName('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Erro ao inscrever na newsletter');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-col sm:flex-row gap-2 max-w-md">
        <Input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !email}
          className="whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Inscrever
            </>
          )}
        </Button>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <motion.div 
        className="text-center relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-blue-500/10 rounded-lg opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        <motion.div 
          className="flex items-center justify-center mb-4 relative z-10"
          variants={itemVariants}
        >
          <motion.div
            variants={iconVariants}
            whileHover={{ 
              scale: 1.2, 
              rotate: [0, -10, 10, 0],
              transition: { duration: 0.5 }
            }}
          >
            <Mail className="w-6 h-6 text-orange-500 mr-2" />
          </motion.div>
          <motion.h3 
            className="text-lg font-semibold bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent relative"
            whileHover={{ scale: 1.05 }}
          >
            Newsletter
            <motion.div
              className="absolute -top-1 -right-2 w-2 h-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-3 h-3 text-orange-400/60" />
            </motion.div>
          </motion.h3>
        </motion.div>
        
        <motion.p 
          className="text-gray-300 mb-4 text-sm relative z-10"
          variants={itemVariants}
          whileHover={{ scale: 1.02, color: "#f3f4f6" }}
        >
          Receba ofertas exclusivas e novidades em primeira mão!
        </motion.p>
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto relative z-10"
          variants={itemVariants}
        >
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileFocus={{ scale: 1.02 }}
          >
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:bg-gray-800 focus:border-orange-500"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.span
                  className="flex items-center gap-2"
                  whileHover={{ x: 2 }}
                >
                  Inscrever
                  <Mail className="w-4 h-4" />
                </motion.span>
              )}
            </Button>
          </motion.div>
        </motion.form>
        
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center justify-center gap-2 text-green-400 text-sm mt-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center justify-center gap-2 text-red-400 text-sm mt-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </motion.div>
        )}
        
        {/* Floating particles */}
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/30 rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: `${20 + (i % 2) * 60}%`
            }}
            animate={{
              y: [-5, 5, -5],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      <Card className="p-6 max-w-md mx-auto relative overflow-hidden">
        {/* Background animated glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-purple-500/5 to-blue-500/10 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        />
        
        {/* Floating background particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
            animate={{
              y: [-6, 6, -6],
              opacity: [0.2, 0.5, 0.2],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        
        <motion.div className="text-center mb-6 relative z-10" variants={itemVariants}>
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 relative"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.1, 
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.6 }
            }}
          >
            <motion.div
              variants={iconVariants}
              whileHover={{ 
                scale: 1.2, 
                rotate: [0, -10, 10, 0]
              }}
            >
              <Mail className="w-8 h-8 text-blue-600" />
            </motion.div>
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-blue-500/60" />
            </motion.div>
          </motion.div>
          <motion.h2 
            className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
          >
            📧 Newsletter
          </motion.h2>
          <motion.p 
            className="text-gray-600"
            variants={itemVariants}
            whileHover={{ scale: 1.02, color: "#374151" }}
          >
            Receba ofertas exclusivas, novidades e dicas diretamente no seu email
          </motion.p>
        </motion.div>

      {status === 'success' ? (
        <motion.div 
          className="text-center space-y-4 relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto relative"
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.6 }}
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-green-500/60" />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-green-800 mb-2">Inscrição Confirmada!</h3>
            <p className="text-sm text-green-600">{message}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              onClick={() => {
                setStatus('idle');
                setMessage('');
              }}
              className="hover:bg-green-50 hover:border-green-300 transition-all duration-300"
            >
              Inscrever outro email
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4 relative z-10"
          variants={itemVariants}
        >
          <motion.div className="space-y-3" variants={itemVariants}>
            <motion.div variants={itemVariants}>
              <motion.label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 mb-1"
                whileHover={{ scale: 1.02 }}
              >
                Nome (opcional)
              </motion.label>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02 }}
              >
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </motion.div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <motion.label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-1"
                whileHover={{ scale: 1.02 }}
              >
                Email *
              </motion.label>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02 }}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {showPreferences && (
            <motion.div 
              className="space-y-3"
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.5 }}
            >
              <motion.h4 
                className="font-medium text-sm"
                whileHover={{ scale: 1.02 }}
              >
                O que você gostaria de receber?
              </motion.h4>
              
              <motion.div className="space-y-2" variants={itemVariants}>
                <motion.label 
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:bg-red-50"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.promotions}
                    onChange={() => togglePreference('promotions')}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 transition-all duration-300"
                  />
                  <div className="flex items-center space-x-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Gift className="w-4 h-4 text-red-500" />
                    </motion.div>
                    <span className="text-sm">Promoções e ofertas especiais</span>
                  </div>
                </motion.label>

                <motion.label 
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:bg-blue-50"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.newProducts}
                    onChange={() => togglePreference('newProducts')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-300"
                  />
                  <div className="flex items-center space-x-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Bell className="w-4 h-4 text-blue-500" />
                    </motion.div>
                    <span className="text-sm">Novos produtos</span>
                  </div>
                </motion.label>

                <motion.label 
                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-300 hover:bg-yellow-50"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.tips}
                    onChange={() => togglePreference('tips')}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 transition-all duration-300"
                  />
                  <div className="flex items-center space-x-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                    <span className="text-sm">Dicas e tutoriais</span>
                  </div>
                </motion.label>
              </motion.div>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 relative overflow-hidden"
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              <motion.span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                    className="mr-2"
                  >
                    <Mail className="w-4 h-4" />
                  </motion.div>
                )}
                {isLoading ? 'Inscrevendo...' : 'Inscrever-se Gratuitamente'}
              </motion.span>
            </Button>
          </motion.div>

          <motion.div 
            className="text-xs text-gray-500 text-center relative z-10"
            variants={itemVariants}
          >
            📧 Enviamos apenas conteúdo relevante. Cancele a qualquer momento.
          </motion.div>
        </motion.form>
      )}

      {variant === 'default' && (
        <motion.div 
          className="mt-6 pt-4 border-t border-gray-200 relative z-10"
          variants={itemVariants}
        >
          <motion.div 
            className="flex justify-center space-x-4 text-xs text-gray-500"
            variants={itemVariants}
          >
            <motion.div 
              className="flex items-center space-x-1 p-1 rounded transition-all duration-300 hover:bg-green-50"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.3 }}
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
              </motion.div>
              <span>Sem spam</span>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-1 p-1 rounded transition-all duration-300 hover:bg-green-50"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.3 }}
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
              </motion.div>
              <span>Cancele quando quiser</span>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-1 p-1 rounded transition-all duration-300 hover:bg-green-50"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.3 }}
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
              </motion.div>
              <span>100% gratuito</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </Card>
    </motion.div>
  );
}
