import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import styles from './Landing.module.css';

const FEATURES = [
  { icon: '🏢', title: '기업 & JD 분석', desc: '채용공고 URL 하나로 기업전략·직무역량 리포트 자동 생성' },
  { icon: '✍️', title: 'AI 자기소개서', desc: 'JD·기업분석 데이터 기반 STAR 기법 맞춤 초안 생성' },
  { icon: '🎤', title: '모의 면접', desc: '자소서 기반 예상 질문 + 실시간 STAR 피드백' },
  { icon: '📊', title: '정량 평가', desc: '키워드 매칭률·적합도 점수로 객관적 개선 방향 제시' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>C</div>
            <span className={styles.logoText}>CareerAI</span>
          </div>
          <nav className={styles.nav}>
            <a href="#features" className={styles.navLink}>서비스 소개</a>
            <a href="#pricing" className={styles.navLink}>요금제</a>
            <button className={styles.loginBtn} onClick={() => navigate(ROUTES.LOGIN)}>로그인</button>
            <button className={styles.startBtn} onClick={() => navigate(ROUTES.SIGNUP)}>무료로 시작하기</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.heroBadge}>● AI 기반 취업 준비 통합 플랫폼</span>
        <h1 className={styles.heroTitle}>
          기업분석부터 면접 준비까지<br />
          <span className={styles.heroHighlight}>하나의 흐름으로 완성하세요</span>
        </h1>
        <p className={styles.heroDesc}>
          JD 분석·자기소개서·모의 면접·포트폴리오, 모든 취업 준비를 AI 개인 코칭.<br />
          여러 플랫폼을 넘나들 필요 없이 하나로 준비하세요.
        </p>
        <div className={styles.heroBtns}>
          <button className={styles.heroPrimary} onClick={() => navigate(ROUTES.SIGNUP)}>
            무료로 시작하기 →
          </button>
          <button className={styles.heroSecondary} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            서비스 소개 보기
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
