import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import styles from './Login.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // TODO: connect real auth
      await new Promise((r) => setTimeout(r, 600));
      navigate(ROUTES.HOME);
    } catch {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.left}>
        <div className={styles.leftLogo}>
          <div className={styles.leftLogoIcon}>C</div>
          <span className={styles.leftLogoText}>CareerAI</span>
        </div>
        <div className={styles.leftBody}>
          <h2 className={styles.leftTitle}>취업 준비의 모든 과정을<br />하나로 연결하세요</h2>
          <ul className={styles.leftList}>
            <li>기업 분석 리포트 자동 생성</li>
            <li>JD 기반 맞춤형 자소서 작성</li>
            <li>면접 예상 질문 + STAR 피드백</li>
          </ul>
        </div>
        <p className={styles.leftFooter}>© 2025 CareerAI</p>
      </div>

      {/* Right panel */}
      <div className={styles.right}>
        <div className={styles.formBox}>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.subtitle}>계정에 로그인하여 계속하세요</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>이메일</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.passwordHeader}>
                <label className={styles.label}>비밀번호</label>
                <button type="button" className={styles.forgotBtn}>비밀번호 찾기</button>
              </div>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className={styles.switchText}>
            계정이 없으신가요?{' '}
            <Link to={ROUTES.SIGNUP} className={styles.switchLink}>회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
