import { User, Settings, Bell } from 'lucide-react';

export default function MyPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        마이페이지
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        프로필 및 설정을 관리합니다
      </p>

      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {[
          { icon: User, title: '프로필 관리', desc: '이름, 이메일, 경력 정보 수정' },
          { icon: Settings, title: '환경 설정', desc: '알림, 테마, 언어 설정' },
          { icon: Bell, title: '알림 내역', desc: '분석 완료 알림 확인' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              style={{
                background: '#fff',
                border: '1px solid #e8eaef',
                borderRadius: 14,
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  '0 4px 6px -1px rgba(0,0,0,0.06)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <Icon size={24} style={{ color: '#3b82f6', marginBottom: 12 }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
