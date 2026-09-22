import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';
export const alt = 'HubObra - Marketplace da Construção Civil';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0) 70%)',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            borderRadius: '9999px',
            padding: '10px 24px',
            marginBottom: '28px',
            color: '#FB923C',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          🏗️ O Maior Marketplace da Região
        </div>

        {/* Brand Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '64px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: '20px',
            textAlign: 'center',
            background: 'linear-gradient(to right, #ffffff, #F8FAFC, #CBD5E1)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          HubConstruções
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '26px',
            color: '#94A3B8',
            maxWidth: '850px',
            textAlign: 'center',
            lineHeight: 1.4,
            marginBottom: '40px',
          }}
        >
          Materiais de construção e reforma direto das lojas parceiras para sua obra com agilidade e os melhores preços.
        </div>

        {/* Features Row */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            fontSize: '18px',
            color: '#E2E8F0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            ⚡ Entrega Rápida
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            💳 Pagamento Seguro PIX & Cartão
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            📱 Atendimento via WhatsApp
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
