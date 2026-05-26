import api from './api';

export interface AnalysisRequestData {
  companyName: string;
  jdUrl: string;
  resumeFile?: File | null;
  resumeTextInput?: string;
}

export interface AnalysisResponseData {
  id?: number;
  company_name?: string;
  job_role?: string;
  is_starred?: boolean;
  created_at?: string;
  company_analysis: {
    core_business: string;
    recent_issues: string[];
    organizational_direction: string;
    required_competencies_from_company: string[];
    interview_context: string;
  };
  job_analysis: {
    job_role?: string;
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

  const response = await api.post<{ success: boolean; data: AnalysisResponseData }>(
    `/api/analysis/report`,
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

export const getSavedReports = async (): Promise<AnalysisResponseData[]> => {
  const response = await api.get<{ success: boolean; data: AnalysisResponseData[] }>(
    `/api/analysis/reports`
  );
  if (!response.data.success) {
    throw new Error('저장된 리포트 목록을 불러오는데 실패했습니다.');
  }
  return response.data.data;
};

export const toggleStarReport = async (id: number): Promise<boolean> => {
  const response = await api.put<{ success: boolean; is_starred: boolean }>(
    `/api/analysis/reports/${id}/star`
  );
  if (!response.data.success) {
    throw new Error('즐겨찾기 상태를 변경하는데 실패했습니다.');
  }
  return response.data.is_starred;
};

export const deleteReport = async (id: number): Promise<void> => {
  const response = await api.delete<{ success: boolean }>(
    `/api/analysis/reports/${id}`
  );
  if (!response.data.success) {
    throw new Error('리포트를 삭제하는데 실패했습니다.');
  }
};
