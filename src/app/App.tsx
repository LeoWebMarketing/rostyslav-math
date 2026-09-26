import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GradePickerPage } from '../features/catalog/GradePickerPage';
import { SubjectPickerPage } from '../features/catalog/SubjectPickerPage';
import { SectionMapPage } from '../features/catalog/SectionMapPage';
import { LandingPage } from '../features/landing/LandingPage';
import { LegacyGameRedirect } from './LegacyGameRedirect';
import { ProfilesPage } from '../features/auth/ProfilesPage';
import { PrivacyPage, TermsPage } from '../features/legal/LegalPages';
import { useProgress } from '../features/progress/store';

const LessonPage = lazy(() => import('../features/lesson/LessonPage').then(module => ({ default: module.LessonPage })));
const EndScreenPage = lazy(() => import('../features/lesson/EndScreenPage').then(module => ({ default: module.EndScreenPage })));
const ReviewPage = lazy(() => import('../features/progress/ReviewPage').then(module => ({ default: module.ReviewPage })));
const GamePage = lazy(() => import('../features/game/GamePage').then(module => ({ default: module.GamePage })));

export function Pages() {
  const initialize = useProgress(state => state.initialize);
  useEffect(() => { void initialize(); }, [initialize]);
  return <Suspense fallback={<div className="route-loading">Завантажуємо урок…</div>}><Routes>
    <Route path="/" element={<LegacyGameRedirect><LandingPage /></LegacyGameRedirect>} />
    <Route path="/klasy" element={<GradePickerPage />} />
    <Route path="/g/:grade" element={<SubjectPickerPage />} />
    <Route path="/g/:grade/:subject" element={<SectionMapPage />} />
    <Route path="/g/:grade/:subject/:section/:lesson" element={<LessonPage />} />
    <Route path="/lesson-end" element={<EndScreenPage />} />
    <Route path="/review" element={<ReviewPage />} />
    <Route path="/game" element={<GamePage />} />
    <Route path="/profiles" element={<ProfilesPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="*" element={<GradePickerPage />} />
  </Routes></Suspense>;
}

export function App() {
  return (
    <BrowserRouter>
      <Pages />
    </BrowserRouter>
  );
}
