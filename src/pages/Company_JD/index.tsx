import { useState } from "react";
import { getCompanyReport } from "../../services/companyService";

export default function CompanyPage() {
  const [company, setCompany] = useState("");
  const [job, setJob] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!company || loading) return;

    setLoading(true);
    try {
      const res = await getCompanyReport(company, job);

      console.log("API 결과:", res);

      // 🔥 핵심
      setData(res.data.data);

    } catch (err) {
      console.error(err);
      alert("분석 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>기업 분석</h2>

      {/* 입력 */}
      <div style={styles.inputBox}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="기업명 (예: 네이버)"
          style={styles.input}
        />
        <input
          value={job}
          onChange={(e) => setJob(e.target.value)}
          placeholder="직무 (예: 마케팅)"
          style={styles.input}
        />
        <button onClick={handleClick} disabled={loading} style={styles.button}>
          {loading ? "분석 중..." : "분석"}
        </button>
      </div>

      {/* 결과 */}
      {data && (
        <div style={styles.grid}>
          <Card title="📌 요약">
            <p>{data?.summary || "요약 없음"}</p>
          </Card>

          <Card title="🔥 핵심 이슈">
            <ul style={styles.ul}>
              {data?.issues?.length > 0 ? (
                data.issues.map((i: string, idx: number) => (
                  <li key={idx}>{i}</li>
                ))
              ) : (
                <li>없음</li>
              )}
            </ul>
          </Card>

          <Card title="🏢 주요 사업">
            <p>{data?.business?.main?.join(", ") || "없음"}</p>
            <p>{data?.business?.description || ""}</p>
          </Card>

          <Card title="🌱 기업 문화">
            <p>{data?.culture?.keywords?.join(", ") || "없음"}</p>
            <p>{data?.culture?.description || ""}</p>
          </Card>

          <Card title="🚀 전략">
            <ul style={styles.ul}>
              {data?.strategy?.length > 0 ? (
                data.strategy.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))
              ) : (
                <li>없음</li>
              )}
            </ul>
          </Card>

          <Card title="🔗 채용">
            {data?.career_url ? (
              <a href={data.career_url} target="_blank">
                채용 페이지 이동
              </a>
            ) : (
              <p>없음</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ---------------- 카드 ---------------- */

function Card({ title, children }: any) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <div style={styles.cardContent}>{children}</div>
    </div>
  );
}

/* ---------------- 스타일 ---------------- */

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  inputBox: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },

  input: {
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    flex: 1,
  },

  button: {
    padding: "8px 16px",
    backgroundColor: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  card: {
    border: "1px solid #eee",
    borderRadius: "10px",
    padding: "16px",
    background: "#fafafa",
    color: "#111", // 🔥 전체 텍스트 기본 색
  },

  cardTitle: {
    color: "#111",
    marginBottom: "8px",
    fontWeight: "600",
  },

  cardContent: {
    color: "#333",
    lineHeight: "1.6",
  },

  ul: {
    paddingLeft: "18px",
    lineHeight: "1.6",
  },
};