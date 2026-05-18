import { Link } from 'react-router-dom';
import { Search, FileEdit, MessageSquare, BarChart3 } from 'lucide-react';
import styles from './Home.module.css';

const features = [
  { icon: Search, title: 'JD & 기업분석', desc: '채용공고와 기업정보를 AI가 통합 분석', path: '/analysis' },
  { icon: FileEdit, title: '자기소개서', desc: 'AI가 작성해주는 맞춤형 자기소개서', path: '/resume' },
  { icon: MessageSquare, title: '면접 준비', desc: '기업별 예상 면접 질문 및 답변 코칭', path: '/interview' },
  { icon: BarChart3, title: '마이페이지', desc: '프로필 관리 및 분석 히스토리', path: '/mypage' },
];

export default function HomePage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.greeting}>
          취업 준비, AI와 함께 <span>스마트하게</span> 🚀
        </h1>
        <p className={styles.subtitle}>
          기업 분석부터 자기소개서, 면접 준비까지 한번에 해결하세요.
        </p>
      </section>
      <section className={styles.grid}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.path} to={f.path} className={styles.card}>
              <span className={styles.cardIcon}>
                <Icon size={28} style={{ color: '#3b82f6' }} />
              </span>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
