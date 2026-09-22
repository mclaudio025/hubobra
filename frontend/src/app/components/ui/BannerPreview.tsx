'use client';

import { ArrowRight } from 'lucide-react';

interface BannerData {
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  bgColor?: string;
  textColor: string;
  type: string;
}

interface BannerPreviewProps {
  banner: BannerData;
}

export default function BannerPreview({ banner }: BannerPreviewProps) {
  const renderHeroBanner = () => (
    <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg">
      {/* Background */}
      {banner.imageUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner.imageUrl})` }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor || 'from-gray-600 to-gray-700'}`} />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      
      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {banner.title || 'Título do Banner'}
            </h1>
            {banner.subtitle && (
              <p className="text-xl md:text-2xl mb-2 font-medium">
                {banner.subtitle}
              </p>
            )}
            {banner.description && (
              <p className="text-lg mb-8 opacity-90">
                {banner.description}
              </p>
            )}
            {banner.buttonText && (
              <div className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg">
                {banner.buttonText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromotionalBanner = () => (
    <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
      {/* Background */}
      {banner.imageUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner.imageUrl})` }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor || 'from-blue-600 to-blue-700'}`} />
      )}
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        <div>
          <h3 className={`text-2xl font-bold mb-2 ${banner.textColor}`}>
            {banner.title || 'Título do Banner'}
          </h3>
          {banner.subtitle && (
            <p className={`text-lg font-semibold mb-2 ${banner.textColor} opacity-90`}>
              {banner.subtitle}
            </p>
          )}
          {banner.description && (
            <p className={`text-sm ${banner.textColor} opacity-80`}>
              {banner.description}
            </p>
          )}
        </div>
        
        {banner.buttonText && (
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${banner.textColor} opacity-90`}>
              {banner.buttonText}
            </span>
            <ArrowRight className={`h-5 w-5 ${banner.textColor}`} />
          </div>
        )}
      </div>
    </div>
  );

  const renderDepartmentBanner = () => (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
      {banner.imageUrl ? (
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-16 h-16 rounded-full object-cover mb-3"
        />
      ) : (
        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${banner.bgColor || 'from-orange-400 to-orange-500'} flex items-center justify-center mb-3`}>
          <span className="text-white font-bold text-xl">
            {banner.title?.charAt(0) || 'D'}
          </span>
        </div>
      )}
      <span className="text-center text-sm font-medium text-gray-700">
        {banner.title || 'Departamento'}
      </span>
      {banner.subtitle && (
        <span className="text-xs text-gray-500 mt-1">
          {banner.subtitle}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Preview do Banner</h3>
      
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        {banner.type === 'HERO' && renderHeroBanner()}
        {banner.type === 'PROMOTIONAL' && renderPromotionalBanner()}
        {banner.type === 'DEPARTMENT' && renderDepartmentBanner()}
        
        {!banner.type && (
          <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Selecione um tipo de banner para ver o preview</p>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        <p>Preview em tempo real - as alterações aparecerão automaticamente</p>
      </div>
    </div>
  );
}
