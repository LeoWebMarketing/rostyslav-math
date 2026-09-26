import { Link, useLocation } from 'react-router-dom';
import { Art } from '../../app/ui';
import { contentRegistry } from '../../../content';
import { useProgress } from '../progress/store';

export function EndScreenPage() {
  const gameTickets = useProgress(state => state.gameTickets);
  const result = useLocation().state as { stars: number; xp: number; accuracy: number; lessonKey: string; review?: boolean } | null;
  if (!result) return (
    <div className="jungle-page end-page">
      <h1>Спершу пройди урок</h1>
      <Link className="action-button" to="/klasy">Обрати клас</Link>
    </div>
  );
  const [grade, subject, section, lesson] = result.lessonKey.split('/');
  const lessons = contentRegistry
    .filter(item => item.grade === Number(grade) && item.subject === subject)
    .flatMap(item => item.lessons.map(entry => ({ section: item.section, lesson: entry })));
  const position = lessons.findIndex(item => item.section === section && item.lesson.id === lesson);
  const next = lessons[position + 1];
  return (
    <div className="jungle-page end-page">
      <div className="end-card">
        <Art file="/theme/dino/lesson-complete.webp" fallback="🦖" className="end-mascot" width={150} height={150} eager />
        <h1>Урок завершено!</h1>
        <div className="end-stars" aria-label={`${result.stars} зірки`}>
          {'⭐'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}
        </div>
        <div className="result-grid">
          <span><strong>+{result.xp}</strong> досвіду</span>
          <span><strong>{Math.round(result.accuracy * 100)}%</strong> з першої спроби</span>
        </div>
        {!result.review && gameTickets > 0 && (
          <Link className="action-button" to={`/game?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&section=${encodeURIComponent(section)}`}
            aria-label={`Втекти від динозавра! Доступно забігів: ${gameTickets}`}>
            Втекти від динозавра! 🦖
          </Link>
        )}
        {next && !result.review && (
          <Link className="action-button" to={`/g/${grade}/${subject}/${next.section}/${next.lesson.id}`}>Далі</Link>
        )}
        <Link className="action-button secondary" to={result.review ? '/klasy' : `/g/${grade}/${subject}`}>До карти</Link>
      </div>
    </div>
  );
}
