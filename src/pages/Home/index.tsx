import styles from './Home.module.css';

const features = [
  { icon: '🏢', title: '기업 분석', desc: '기업 최신 뉴스 및 핵심 정보 AI 분석', path: '/company' },
  { icon: '📋', title: 'JD 분석', desc: '채용공고 키워드 및 적합도 분석', path: '/jd' },
  { icon: '✏️', title: '자기소개서', desc: 'AI가 작성해주는 맞춤형 자기소개서', path: '/resume' },
  { icon: '🎤', title: '면접 준비', desc: '기업별 예상 면접 질문 및 답변 코칭', path: '/interview' },
];

export default function HomePage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.greeting}>취업 준비, AI와 함께 <span>스마트하게</span> 🚀</h1>
        <p className={styles.subtitle}>기업 분석부터 자기소개서, 면접 준비까지 한번에 해결하세요.</p>
      </section>
      <section className={styles.grid}>
        {features.map((f) => (
          <a key={f.path} href={f.path} className={styles.card}>
            <span className={styles.cardIcon}>{f.icon}</span>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
