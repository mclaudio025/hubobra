'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, Tag, ArrowRight } from 'lucide-react'

interface WeeklyOfferCardProps {
  title: string
  subtitle: string
  image: string
  discount?: string
  bgGradient?: string
}

export default function WeeklyOfferCard({ title, subtitle, image, discount, bgGradient }: WeeklyOfferCardProps) {
  return (
    <motion.div 
      className="group relative bg-white/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden hover:shadow-3xl transition-all duration-700 border border-gray-200/50 transform-gpu"
      whileHover={{ 
        y: -12, 
        scale: 1.05,
        rotateY: 8,
        rotateX: 3,
        z: 80,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.8
        }
      }}
      whileTap={{ 
        scale: 0.95,
        rotateY: -2,
        transition: { duration: 0.1 }
      }}
      initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Enhanced animated background gradient */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${bgGradient || 'from-orange-500 via-red-500 to-orange-600'} opacity-0 group-hover:opacity-15 transition-opacity duration-700 rounded-3xl`}
        initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
        whileHover={{ 
          scale: 1.1, 
          opacity: 0.15,
          rotate: 2,
          transition: {
            type: "spring",
            stiffness: 200,
            damping: 25
          }
        }}
      />
      
      {/* Enhanced border glow with pulsing effect */}
      <motion.div 
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${bgGradient || 'from-orange-400 via-red-400 to-orange-500'} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-700`}
        initial={{ scale: 0.7 }}
        animate={{
          scale: [0.7, 0.8, 0.7],
          opacity: [0, 0.1, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ 
          scale: 1.2,
          opacity: 0.3,
          transition: {
            type: "spring",
            stiffness: 150,
            damping: 20
          }
        }}
      />
      
      {/* Dynamic floating background elements */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-20 h-20 bg-gradient-to-br ${bgGradient || 'from-orange-300/20 to-red-300/20'} rounded-full blur-xl opacity-0 group-hover:opacity-60`}
          style={{
            left: `${20 + i * 25}%`,
            top: `${15 + i * 30}%`
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5
          }}
          whileHover={{
            scale: 1.5,
            opacity: 0.6,
            transition: { duration: 0.5 }
          }}
        />
      ))}

      {/* Enhanced discount badge */}
      {discount && (
        <motion.div 
          className={`absolute top-4 right-4 z-20 bg-gradient-to-r ${bgGradient || 'from-orange-500 via-red-500 to-orange-600'} text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-md border border-white/30 overflow-hidden`}
          initial={{ scale: 0, rotate: -180, y: -20 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ 
            delay: 0.4, 
            type: "spring", 
            stiffness: 300, 
            damping: 15,
            mass: 0.8
          }}
          whileHover={{ 
            scale: 1.15, 
            rotate: 8,
            y: -3,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 20
            }
          }}
          whileTap={{
            scale: 0.9,
            rotate: -3
          }}
        >
          {/* Badge glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Badge shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-2xl"
            initial={{ x: '-100%', skewX: -20 }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          
          <div className="flex items-center gap-2 relative z-10">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ 
                rotate: 360,
                transition: { duration: 0.5 }
              }}
            >
              <Tag className="h-4 w-4" />
            </motion.div>
            <motion.span
              whileHover={{
                scale: 1.1,
                textShadow: "0 0 10px rgba(255,255,255,0.8)"
              }}
            >
              {discount}
            </motion.span>
          </div>
          
          {/* Floating particles around badge */}
          <motion.div
            className="absolute w-1 h-1 bg-white/80 rounded-full"
            style={{
              left: "-10px",
              top: "-5px"
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [-5, -15, -25],
              x: [0, 0, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute w-1 h-1 bg-white/80 rounded-full"
            style={{
              left: "5px",
              top: "3px"
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [-5, -15, -25],
              x: [0, 7, 13]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.3,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute w-1 h-1 bg-white/80 rounded-full"
            style={{
              left: "20px",
              top: "11px"
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [-5, -15, -25],
              x: [0, -3, -7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.6,
              ease: "easeOut"
            }}
          />
        </motion.div>
      )}

      {/* Enhanced sparkles effect */}
      <motion.div 
        className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        whileHover={{
          scale: 1.5,
          rotate: [0, 180, 360],
          transition: { duration: 0.6 }
        }}
      >
        <motion.div className="relative">
          <Sparkles className="h-6 w-6 text-amber-400 drop-shadow-lg" />
          
          {/* Sparkle glow effect */}
          <motion.div
            className="absolute inset-0 bg-amber-400/40 rounded-full blur-md"
            animate={{
              scale: [0.8, 1.4, 0.8],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>
      
      {/* Additional sparkles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute z-10 opacity-0 group-hover:opacity-80"
          style={{
            left: `${15 + i * 20}%`,
            top: `${10 + i * 15}%`
          }}
          initial={{ scale: 0, rotate: 0 }}
          whileHover={{
            scale: [0, 1.5, 0],
            rotate: [0, 180, 360],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 1.5,
            delay: 0.1 + i * 0.1,
            ease: "easeOut"
          }}
        >
          <Sparkles className="h-3 w-3 text-yellow-300 fill-current" />
        </motion.div>
      ))}

      <div className="relative h-52 overflow-hidden rounded-t-3xl">
        {/* Enhanced image with advanced parallax effect */}
        <motion.div
          className="relative h-full w-full transform-gpu"
          whileHover={{ 
            scale: 1.15,
            rotateZ: 1,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 0.8
            }
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            className="relative h-full w-full"
            whileHover={{
              scale: 1.1,
              rotateY: 2,
              transition: { duration: 0.8, ease: "easeOut" }
            }}
          >
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-all duration-700 group-hover:brightness-110 group-hover:contrast-105"
            />
          </motion.div>
          
          {/* Dynamic overlay gradient */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-t ${bgGradient || 'from-orange-500/30 via-red-500/20 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileHover={{ 
              opacity: 1, 
              scale: 1.05,
              transition: {
                type: "spring",
                stiffness: 150,
                damping: 20
              }
            }}
          />
          
          {/* Glassmorphism overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-[1px] opacity-0 group-hover:opacity-100"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 1,
              transition: { duration: 0.6 }
            }}
          />
        </motion.div>

        {/* Enhanced animated shine effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"
          initial={{ x: '-120%', skewX: -25 }}
          whileHover={{ x: '120%' }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* Dynamic light rays */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-60"
            style={{
              transform: `rotate(${15 + i * 30}deg)`,
              transformOrigin: 'center'
            }}
            initial={{ 
              x: '-150%', 
              skewX: -20,
              opacity: 0
            }}
            whileHover={{ 
              x: '150%',
              opacity: 0.6,
              transition: {
                duration: 1.2 + i * 0.3,
                delay: i * 0.1,
                ease: "easeInOut"
              }
            }}
          />
        ))}
        
        {/* Floating light particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/60 rounded-full opacity-0 group-hover:opacity-80 blur-sm"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 2) * 60}%`
            }}
            animate={{
              y: [-5, -15, -5],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
            whileHover={{
              scale: 1.5,
              y: -20,
              transition: { duration: 0.3 }
            }}
          />
        ))}
      </div>

      {/* Enhanced Content */}
      <div className="p-8 space-y-6 relative">
        {/* Enhanced title and subtitle */}
        <div className="space-y-3 relative">
          <motion.h3 
            className="text-2xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:via-red-500 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 relative"
            initial={{ opacity: 0.9, y: 0 }}
            whileHover={{ 
              scale: 1.05,
              y: -2,
              rotateX: 5,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
              }
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {title}
            
            {/* Title glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 -z-10"
              initial={{ scale: 0.8 }}
              whileHover={{ 
                scale: 1.2,
                transition: { duration: 0.4 }
              }}
            />
            
            {/* Sparkle effects */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-80"
                style={{
                  left: `${10 + i * 30}%`,
                  top: `${-5 + i * 2}%`
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.h3>
          
          <motion.p 
            className="text-gray-600 text-base leading-relaxed group-hover:text-gray-700 transition-colors duration-300"
            initial={{ opacity: 0.8 }}
            whileHover={{ 
              scale: 1.02,
              y: -1,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
              }
            }}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Enhanced action button */}
        <motion.button
          className="relative w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white py-4 px-8 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 group/btn overflow-hidden transform-gpu"
          initial={{ scale: 1 }}
          whileHover={{ 
            scale: 1.05,
            y: -3,
            rotateX: 5,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }
          }}
          whileTap={{ 
            scale: 0.95,
            y: 0,
            transition: { duration: 0.1 }
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Button background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 rounded-2xl blur-lg opacity-0 group-hover/btn:opacity-60 -z-10"
            initial={{ scale: 0.8 }}
            whileHover={{ 
              scale: 1.3,
              transition: { duration: 0.4 }
            }}
          />
          
          {/* Button shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/btn:opacity-100 -skew-x-12"
            initial={{ x: '-100%' }}
            whileHover={{ 
              x: '100%',
              transition: { duration: 0.6, ease: "easeInOut" }
            }}
          />
          
          {/* Button text */}
          <motion.span
            className="relative z-10 text-lg font-bold"
            whileHover={{
              scale: 1.05,
              textShadow: "0 0 8px rgba(255,255,255,0.8)"
            }}
          >
            Ver Oferta
          </motion.span>
          
          {/* Enhanced arrow icon */}
          <motion.div
            className="relative z-10"
            whileHover={{ 
              x: 6, 
              rotate: 15,
              scale: 1.2,
              transition: { duration: 0.3 }
            }}
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
          
          {/* Button particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/80 rounded-full opacity-0 group-hover/btn:opacity-100"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`
              }}
              animate={{
                y: [-3, -8, -3],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.button>

        {/* Enhanced floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-0 group-hover:opacity-70 blur-sm"
            style={{
              left: `${10 + i * 12}%`,
              bottom: `${5 + (i % 3) * 15}%`
            }}
            animate={{
              y: [-15, -30, -15],
              opacity: [0, 0.7, 0],
              scale: [0.5, 1.2, 0.5],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
            whileHover={{
              scale: 1.5,
              y: -40,
              transition: { duration: 0.3 }
            }}
          />
        ))}
        
        {/* Content background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 rounded-b-3xl opacity-0 group-hover:opacity-100 -z-10"
          initial={{ scale: 0.9 }}
          whileHover={{ 
            scale: 1.05,
            transition: { duration: 0.5 }
          }}
        />
      </div>

      {/* Floating particles effect */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-60"
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + i * 20}%`,
          }}
          animate={{
            y: [-10, -20, -10],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </motion.div>
  )
}
