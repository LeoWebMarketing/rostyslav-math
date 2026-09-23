import { Link, useParams } from 'react-router-dom';
import { Art, Mascot, Shell } from '../../app/ui';
import { contentRegistry } from '../../../content';
import { useProgress } from '../progress/store';

export function SectionMapPage() {
  const { grade, subject } = useParams();
  const sections = contentRegistry.filter(section => section.grade === Number(grade) && section.subject === subject);
  const { guest, user, remote } = useProgress();
  const progress = (key: string) => user ? remote.find(row => row.lessonKey === key)?.bestStars ?? 0 : guest.lessons[key]?.bestStars ?? 0;
  let previous: string | null = null;
  let index = 0;
  return <Shell title={sections[0]?.title ?? 'Розділи'} back={`/g/${grade}`}>
    <div className="hero compact">
      <Mascot pose="hello" size={110} className="mascot" eager />
      <div className="speech-bubble">Крок за кроком — і все вийде!</div>
    </div>
    {sections.length ? sections.map(section => (
      <section className="path-section" key={section.id}>
        <h1>{section.title}</h1>
        <div className="lesson-path">{section.lessons.map(lesson => {
      const key = `${grade}/${subject}/${section.section}/${lesson.id}`;
      const stars = progress(key);
      const unlocked = !previous || progress(previous) >= 1;
      previous = key;
      const offset = (index++ % 3) - 1;
      const nodeArt = unlocked
        ? stars ? '/theme/dino/node-egg-done.webp' : '/theme/dino/node-egg.webp'
        : '/theme/dino/node-locked.webp';
      return (
        <div className={`path-stop offset-${offset}`} key={lesson.id}>
          <Link
            aria-disabled={!unlocked}
            tabIndex={unlocked ? 0 : -1}
            onClick={event => { if (!unlocked) event.preventDefault(); }}
            className={`lesson-node ${unlocked ? 'unlocked' : 'locked'}`}
            to={`/g/${key}`}
          >
            <Art file={nodeArt} fallback={unlocked ? stars ? '🐣' : '🥚' : '🔒'} className="node-art" width={72} height={72} />
          </Link>
          <strong>{lesson.title}</strong>
          <span className="stars" aria-label={`${stars} зірок`}>{stars ? '⭐'.repeat(stars) : unlocked ? 'Почати' : 'Закрито'}</span>
        </div>
      );
        })}</div>
      </section>
    )) : <p>Для цього предмета ще немає уроків.</p>}
  </Shell>;
}
