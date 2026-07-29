import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '10px' }}>🚀</div>
        <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#1e293b' }}>QPilot</h1>
        <p style={{ fontSize: '18px', color: '#64748b', margin: '0 0 30px 0' }}>
          AI-powered question paper generator for teachers
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/new-paper">
            <button style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              📝 Create Paper
            </button>
          </Link>
          <Link href="/my-papers">
            <button style={{
              background: '#22c55e',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              📂 My Papers
            </button>
          </Link>
        </div>
        <p style={{ marginTop: '30px', color: '#94a3b8', fontSize: '12px' }}>
          SQLite Connected ✅
        </p>
      </div>
    </div>
  );
}
