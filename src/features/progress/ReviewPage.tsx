import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentRegistry } from '../../../content';
import { Mascot, Shell } from '../../app/ui';
import { api } from '../../lib/api';
import { useProgress } from './store';
import { Player } from '../lesson/Player';

export function ReviewPage() {
  const { guest, user, activeProfileId } = useProgress();
  const [mistakes, setMistakes] = useState(guest.mistakes);
  useEffect(() => {
    if (!user || !activeProfileId) return;
    api.review(activeProfileId)
      .then(data => setMistakes(data.mistakes.map(item => `${item.lessonKey}|${item.exerciseId}`)))
      .catch(() => setMistakes(guest.mistakes));
  }, [user, activeProfileId, guest.mistakes]);
  const recent = [...new Set([...mistakes].reverse())].slice(0, 12);
  const exercises = recent.flatMap(item => {
    const [key, exerciseId] = item.split('|');
    const [grade, subject, section, lesson] = key.split('/');
    const data = contentRegistry
      .find(row => row.grade === Number(grade) && row.subject === subject && row.section === section)
      ?.lessons.find(row => row.id === lesson);
    return data?.exercises.filter(exercise => exercise.id === exerciseId) ?? [];
  });
  if (!exercises.length) return (
    <Shell title="Робота над помилками">
      <div className="empty-state">
        <Mascot pose="sleep" size={120} className="empty-mascot" eager />
        <h1>Помилок поки немає!</h1>
        <p>Пройди урок, а складні вправи з’являться тут.</p>
        <Link className="action-button" to="/klasy">До уроків</Link>
      </div>
    </Shell>
  );
  return (
    <Player
      key={exercises.map(exercise => exercise.id).join('|')}
      lesson={{ id: 'review', title: 'Робота над помилками', exercises }}
      lessonKey="review/recent/all/review"
      back="/klasy"
      review
    />
  );
}
