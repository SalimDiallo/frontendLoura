'use client';

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '20px 0' }}>Page non trouvée</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Désolé, la page que vous recherchez n&apos;existe pas.
      </p>
      <Link
        href="/"
        style={{
          padding: '10px 20px',
          backgroundColor: '#000000',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
