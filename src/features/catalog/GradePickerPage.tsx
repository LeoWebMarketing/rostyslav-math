import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Art, Mascot, Shell } from '../../app/ui';
import { api } from '../../lib/api';
import { contentRegistry } from '../../../content';
import { LegalLinks } from '../legal/LegalPages';
import { useProgress } from '../progress/store';

export function GradePickerPage() {
  const query = new URLSearchParams(window.location.search);
  const { guest, user, activeProfileId } = useProgress();
  const [hasReviewMistakes, setHasReviewMistakes] = useState(false);
  useEffect(() => {
    if (!user || !activeProfileId) {
      setHasReviewMistakes(guest.mistakes.length > 0);
      return;
    }
    let current = true;
    setHasReviewMistakes(false);
    api.review(activeProfileId)
      .then(data => { if (current) setHasReviewMistakes(data.mistakes.length > 0); })
      .catch(() => { if (current) setHasReviewMistakes(guest.mistakes.length > 0); });
    return () => { current = false; };
  }, [guest.mistakes, user, activeProfileId]);
  if (query.has('game')) { window.location.replace(`/g2/?${query.toString()}`); return null; }
  const grades = [...new Set(contentRegistry.map(section => section.grade))].sort();
  return <Shell title="Класно" contentClassName="grade-picker-page">
    <div className="grade-picker-main">
      <div className="hero">
        <Mascot pose="hello" size={110} className="mascot" eager />
        <div className="speech-bubble">Привіт! Я Дино. Обери клас і вирушаймо вчитися!</div>
      </div>
      <div className="card-grid">
        <a className="grade-card" href="/g2/">
          <Art file="/theme/dino/grade-2-card.webp" fallback="🎮" className="card-art" width={105} height={105} eager />
          <span><strong>2 клас</strong><small>Математика — класичні ігри</small></span>
        </a>
        {grades.map(grade => (
          <Link className="grade-card" key={grade} to={`/g/${grade}`}>
            <Art file="/theme/dino/grade-3-card.webp" fallback="🦕" className="card-art" width={105} height={105} eager />
            <span><strong>{grade} клас</strong><small>Математика, мови та пригоди</small></span>
          </Link>
        ))}
      </div>
      {hasReviewMistakes && <Link className="review-button" to="/review">Повторити помилки →</Link>}
    </div>
    <LegalLinks />
  </Shell>;
}
