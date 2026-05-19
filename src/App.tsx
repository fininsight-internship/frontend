import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants';

// Layout
import MainLayout from './components/layout/MainLayout.tsx';

// Pages
import HomePage from './pages/Home/index.tsx';
import CompanyPage from './pages/Company/index.tsx';
import JDPage from './pages/JD/index.tsx';
import ResumePage from './pages/Resume/index.tsx';
import InterviewHome from './pages/Interview/InterviewHome.tsx';
import InterviewDetail from './pages/Interview/InterviewDetail.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.COMPANY} element={<CompanyPage />} />
          <Route path={ROUTES.JD} element={<JDPage />} />
          <Route path={ROUTES.RESUME} element={<ResumePage />} />
          <Route path={ROUTES.INTERVIEW} element={<InterviewHome />} />
          <Route path={ROUTES.INTERVIEW_DETAIL} element={<InterviewDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
