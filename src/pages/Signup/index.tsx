import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import api from '../../services/api';
import styles from './Signup.module.css';

const JOB_CHIPS = ['프론트엔드', '백엔드', '데이터 분석', '기획/PM', '마케팅', '디자인'];

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [jobs, setJobs] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form & { jobs: string; agree: string }>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const toggleJob = (j: string) =>
    setJobs((prev) => prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = '이름을 입력해주세요.';
    if (!form.email.trim()) e.email = '이메일을 입력해주세요.';
    if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!agreed) e.agree = '이용약관에 동의해주세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);
    try {
      const response = await api.post('/auth/signup', {
        email: form.email,
        password: form.password,
        name: form.name,
        nickname: form.nickname,
        role: jobs.join(', '),
      });
      
      console.log('✅ Signup Success:', response.data);
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      navigate('/experience/edit', { state: { fromSignup: true, step: 2 } });
    } catch (err: any) {
      console.error('❌ Signup API Error:', err);
      const errMsg = err.response?.data?.detail || '회원가입 처리 중 오류가 발생했습니다.';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>C</div>
          <span className={styles.logoText}>CareerAI</span>
        </div>

        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>취업 준비의 새로운 시작을 함께하세요</p>

        {/* Step indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.stepActive}`}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepLabel}>기본 정보</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepLabel}>경험 입력</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepLabel}>완료</span>
          </div>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleNext}>
          {apiError && (
            <div className={styles.apiErrorBox}>
              ⚠️ {apiError}
            </div>
          )}
          {/* Name + Nickname */}
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>이름</label>
              <input
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                value={form.name}
                onChange={update('name')}
                placeholder="홍길동"
              />
              {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>닉네임</label>
              <input
                className={styles.input}
                value={form.nickname}
                onChange={update('nickname')}
                placeholder="닉네임"
              />
            </div>
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>이메일</label>
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="example@email.com"
            />
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="8자 이상, 영문+숫자+특수문자"
            />
            {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
          </div>

          {/* Password confirm */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>비밀번호 확인</label>
            <input
              className={`${styles.input} ${errors.passwordConfirm ? styles.inputError : ''}`}
              type="password"
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              placeholder="비밀번호 재입력"
            />
            {errors.passwordConfirm && <span className={styles.errorMsg}>{errors.passwordConfirm}</span>}
          </div>

          {/* Job interest chips */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>관심 직무 <span className={styles.optional}>(선택)</span></label>
            <div className={styles.chips}>
              {JOB_CHIPS.map((j) => (
                <button
                  key={j}
                  type="button"
                  className={`${styles.chip} ${jobs.includes(j) ? styles.chipActive : ''}`}
                  onClick={() => toggleJob(j)}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '가입 처리 중...' : '다음 단계 →'}
          </button>

          {/* Terms */}
          <label className={styles.termsRow}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.termsText}>
              <a href="#" className={styles.termsLink}>이용약관</a> 및{' '}
              <a href="#" className={styles.termsLink}>개인정보처리방침</a>에 동의합니다
            </span>
          </label>
          {errors.agree && <span className={styles.errorMsg}>{errors.agree}</span>}
        </form>

        <p className={styles.switchText}>
          이미 계정이 있으신가요?{' '}
          <Link to={ROUTES.LOGIN} className={styles.switchLink}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
