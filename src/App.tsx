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
import InterviewHome from './pages/Interview/InterviewHome.tsx';
import InterviewDetail from './pages/Interview/InterviewDetail.tsx';
import MyPage from './pages/MyPage/index.tsx';

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
          <Route path={ROUTES.INTERVIEW} element={<InterviewHome />} />
          <Route path={ROUTES.INTERVIEW_DETAIL} element={<InterviewDetail />} />
          <Route path={ROUTES.MYPAGE} element={<MyPage />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
