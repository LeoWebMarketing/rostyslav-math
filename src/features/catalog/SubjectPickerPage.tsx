import { Link, useParams } from 'react-router-dom';
import { Art, Shell } from '../../app/ui';
import { contentRegistry } from '../../../content';

const subjects = [
  { id: 'math', title: 'Математика', emoji: '🔢', image: '/theme/dino/subject-math.webp' },
  { id: 'ukrainian', title: 'Українська мова', emoji: '📖', image: '/theme/dino/subject-ukrainian.webp' },
  { id: 'english', title: 'Англійська мова', emoji: '🌍', image: '/theme/dino/subject-english.webp' },
];

export function SubjectPickerPage() {
  const { grade } = useParams();
  const available = subjects.filter(subject => contentRegistry.some(
    section => section.grade === Number(grade) && section.subject === subject.id,
  ));
  return (
    <Shell title={`${grade} клас`} contentClassName="subject-picker-page">
      <h1>Обери предмет</h1>
      <div className="card-grid">{available.map(subject => (
        <Link className={`subject-card subject-${subject.id}`} key={subject.id} to={`/g/${grade}/${subject.id}`}>
          <Art file={subject.image} fallback={subject.emoji} className="card-art" width={105} height={105} eager />
          <strong>{subject.title}</strong>
        </Link>
      ))}</div>
    </Shell>
  );
}
