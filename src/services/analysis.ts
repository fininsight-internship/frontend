import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface AnalysisRequestData {
  companyName: string;
  jdUrl: string;
  resumeFile?: File | null;
  resumeTextInput?: string;
}

export interface AnalysisResponseData {
  company_analysis: {
    core_business: string;
    recent_issues: string[];
    organizational_direction: string;
    required_competencies_from_company: string[];
    interview_context: string;
  };
  job_analysis: {
    core_requirements: string[];
    tech_stacks: string[];
    preferred_qualifications: string[];
    strategic_importance: string;
  };
  fit_analysis: {
    score: number;
    evaluation: string;
    lacking_competencies: string[];
  };
  document_optimization: {
    experiences_to_highlight: string[];
    modification_direction: string[];
  };
}

export const analyzeJobAndResume = async (data: AnalysisRequestData): Promise<AnalysisResponseData> => {
  const formData = new FormData();
  formData.append('company_name', data.companyName);
  formData.append('jd_url', data.jdUrl);
  if (data.resumeFile) {
    formData.append('resume_file', data.resumeFile);
  }
  if (data.resumeTextInput) {
    formData.append('resume_text_input', data.resumeTextInput);
  }

  const response = await axios.post<{ success: boolean; data: AnalysisResponseData }>(
    `${API_BASE_URL}/analysis/report`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data.success) {
    throw new Error('분석 요청에 실패했습니다.');
  }

  return response.data.data;
};
