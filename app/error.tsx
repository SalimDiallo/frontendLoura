'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <h1 style={{ fontSize: '3rem', margin: '0' }}>Erreur</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '20px 0' }}>Une erreur s&apos;est produite</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {error.message || `Une erreur inattendue s'est produite`}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
