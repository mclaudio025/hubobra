'use client'

import React, { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

const secondaryOffers = [
  {
    id: 1,
    title: 'Ferramentas Elétricas',
    subtitle: 'Até 30% OFF',
    description: 'Furadeiras, parafusadeiras e muito mais',
    image: '/tools.svg',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Material Hidráulico',
    subtitle: 'Promoção Especial',
    description: 'Tubos, conexões e registros',
    image: '/plumbing.svg',
    color: 'bg-green-500'
  },
  {
    id: 3,
    title: 'Tintas e Vernizes',
    subtitle: 'Leve 3 Pague 2',
    description: 'Renove sua casa com qualidade',
    image: '/paint.svg',
    color: 'bg-orange-500'
  },
  {
    id: 4,
    title: 'Iluminação LED',
    subtitle: 'Economia Garantida',
    description: 'Lâmpadas e luminárias modernas',
    image: '/lighting.svg',
    color: 'bg-purple-500'
  }
];

export function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' }
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Ofertas Especiais</h2>
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
              aria-label="Anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
              aria-label="Próximo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {secondaryOffers.map((offer) => (
              <div className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%]" key={offer.id}>
                <div className={`${offer.color} text-white rounded-lg p-6 h-full transition-transform hover:scale-105`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{offer.title}</h3>
                      <p className="text-lg font-semibold opacity-90">{offer.subtitle}</p>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🔧</span>
                    </div>
                  </div>
                  <p className="text-sm opacity-80 mb-4">{offer.description}</p>
                  <button className="bg-white text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors">
                    Ver Ofertas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Carousel
