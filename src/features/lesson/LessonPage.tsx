import { useParams } from 'react-router-dom';
import { contentRegistry } from '../../../content';
import { Player } from './Player';

export function LessonPage() {
  const { grade, subject, section, lesson } = useParams();
  const data = contentRegistry.find(item => item.grade === Number(grade) && item.subject === subject && item.section === section);
  const current = data?.lessons.find(item => item.id === lesson);
  if (!current) return <div className="lesson-page"><p>Урок не знайдено.</p><a href={`/g/${grade}/${subject}`}>До карти</a></div>;
  return (
    <Player
      key={current.id}
      lesson={current}
      lessonKey={`${grade}/${subject}/${section}/${lesson}`}
      back={`/g/${grade}/${subject}`}
    />
  );
}
