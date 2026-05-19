import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants';

// Layout
import MainLayout from './components/layout/MainLayout.tsx';

// Pages
import HomePage from './pages/Home/index.tsx';
import AnalysisPage from './pages/Analysis/AnalysisPage.tsx';
import AnalysisChatPage from './pages/AnalysisChat/index.tsx';
import AnalysisReportPage from './pages/AnalysisReport/index.tsx';
import ResumePage from './pages/Resume/index.tsx';
import ResumeEditorPage from './pages/ResumeEditor/index.tsx';
import ExperienceEditPage from './pages/ExperienceEdit/index.tsx';
import ApplicationsPage from './pages/Applications/index.tsx';
import InterviewPage from './pages/Interview/InterviewHome.tsx';
import InterviewDetailPage from './pages/Interview/InterviewDetail.tsx';
import MyPage from './pages/MyPage/index.tsx';
import CompanyPage from './pages/Company_JD/index.tsx';
import LandingPage from './pages/Landing/index.tsx';
import LoginPage from './pages/Login/index.tsx';
import SignupPage from './pages/Signup/index.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.ANALYSIS} element={<AnalysisPage />} />
          <Route path={ROUTES.ANALYSIS_CHAT} element={<AnalysisChatPage />} />
          <Route path={ROUTES.ANALYSIS_REPORT} element={<AnalysisReportPage />} />
          <Route path={ROUTES.RESUME} element={<ResumePage />} />
          <Route path={ROUTES.APPLICATIONS} element={<ApplicationsPage />} />
          <Route path={ROUTES.INTERVIEW} element={<InterviewPage />} />
          <Route path={ROUTES.INTERVIEW_DETAIL} element={<InterviewDetailPage />} />
          <Route path={ROUTES.MYPAGE} element={<MyPage />} />
          <Route path={ROUTES.COMPANY} element={<CompanyPage />} />
        </Route>
        <Route path="/resume/editor" element={<ResumeEditorPage />} />
        <Route path="/experience/edit" element={<ExperienceEditPage />} />
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
