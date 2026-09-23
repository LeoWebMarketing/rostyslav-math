import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GradePickerPage } from '../features/catalog/GradePickerPage';
import { SubjectPickerPage } from '../features/catalog/SubjectPickerPage';
import { SectionMapPage } from '../features/catalog/SectionMapPage';
import { LessonPage } from '../features/lesson/LessonPage';
import { EndScreenPage } from '../features/lesson/EndScreenPage';
import { ReviewPage } from '../features/progress/ReviewPage';
import { ProfilesPage } from '../features/auth/ProfilesPage';
import { PrivacyPage, TermsPage } from '../features/legal/LegalPages';
import { useProgress } from '../features/progress/store';

export function Pages() {
  const initialize = useProgress(state => state.initialize);
  useEffect(() => { void initialize(); }, [initialize]);
  return <Routes>
    <Route path="/" element={<GradePickerPage />} />
    <Route path="/g/:grade" element={<SubjectPickerPage />} />
    <Route path="/g/:grade/:subject" element={<SectionMapPage />} />
    <Route path="/g/:grade/:subject/:section/:lesson" element={<LessonPage />} />
    <Route path="/lesson-end" element={<EndScreenPage />} />
    <Route path="/review" element={<ReviewPage />} />
    <Route path="/profiles" element={<ProfilesPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="*" element={<GradePickerPage />} />
  </Routes>;
}

export function App() {
  return (
    <BrowserRouter>
      <Pages />
    </BrowserRouter>
  );
}
