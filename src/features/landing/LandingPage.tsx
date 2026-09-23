import { Link } from 'react-router-dom';
import { contentRegistry } from '../../../content';
import { Art, Mascot } from '../../app/ui';
import { useProgress } from '../progress/store';

const subjects = [
  { id: 'math', title: 'Математика', art: 'subject-math.webp', className: 'math' },
  { id: 'ukrainian', title: 'Українська мова', art: 'subject-ukrainian.webp', className: 'ukrainian' },
  { id: 'english', title: 'Англійська мова', art: 'subject-english.webp', className: 'english' },
] as const;

function MiniExercise({ kind }: { kind: 'choice' | 'match' | 'type' | 'order' | 'fill' }) {
  if (kind === 'choice') return <div className="landing-mini"><p>Скільки буде 3 × 4?</p><div className="mini-options"><span className="option-card">8</span><span className="option-card selected">12 ✓</span></div></div>;
  if (kind === 'match') return <div className="landing-mini"><p>Знайди пари</p><div className="mini-pairs"><span className="option-card">2 × 3</span><span className="option-card">6</span><span className="option-card">3 × 3</span><span className="option-card">9</span></div></div>;
  if (kind === 'type') return <div className="landing-mini"><p>Скільки буде 5 × 2?</p><span className="answer-field">10</span></div>;
  if (kind === 'order') return <div className="landing-mini"><p>Склади речення</p><div className="mini-chips"><span className="word-chip">Я</span><span className="word-chip">вчуся</span><span className="word-chip">класно!</span></div></div>;
  return <div className="landing-mini"><p>Встав пропущене слово</p><div className="mini-sentence">I ___ swim.</div><span className="option-card selected">can ✓</span></div>;
}

export function continueDestination(
  completed: { lessonKey: string; completions: number; lastAt?: number }[],
): string | null {
  const recent = completed
    .filter(item => item.completions > 0)
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0) || b.index - a.index);
  if (!recent.length) return null;
  const done = new Set(recent.map(item => item.lessonKey));
  const [grade, subject] = recent[0].lessonKey.split('/');
  const next = contentRegistry
    .filter(section => section.grade === Number(grade) && section.subject === subject)
    .flatMap(section => section.lessons.map(lesson => `${grade}/${subject}/${section.section}/${lesson.id}`))
    .find(key => !done.has(key));
  return next ? `/g/${next}` : `/g/${grade}/${subject}`;
}

export function LandingPage() {
  const { guest, remote, user, authAvailable } = useProgress();
  const guestProgress = Object.entries(guest.lessons).map(([lessonKey, entry]) => ({ lessonKey, ...entry }));
  const progress = user ? [...remote, ...guestProgress] : guestProgress;
  const resume = continueDestination(progress);

  return <div className="landing-page">
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <Link to="/" className="landing-brand" aria-label="Класно — головна">
          <Art file="/theme/dino/logo-mark.webp" fallback="🦖" width={44} height={44} eager />
          <strong>Класно</strong>
        </Link>
        <nav aria-label="Головна навігація"><Link to="/klasy">Обрати клас</Link></nav>
      </div>
    </header>

    <main>
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">Уроки, у які хочеться грати</span>
            <h1 id="landing-title">Вчимося класно — <em>разом із Дино!</em></h1>
            <p>Безкоштовні уроки з математики, української та англійської для початкової школи. Як у Duolingo — тільки за темами, які проходять у класі.</p>
            <div className="landing-actions">
              <Link className="action-button" to={resume ?? '/klasy'}>{resume ? 'Продовжити' : 'Почати вчитися'}</Link>
              {resume && <Link className="landing-text-link" to="/klasy">Обрати клас</Link>}
              {user ? <Link className="landing-text-link" to="/profiles">Профілі дітей</Link> : authAvailable ? <a className="landing-text-link" href="/api/auth/google">Увійти для батьків</a> : null}
            </div>
          </div>
          <div className="landing-hero-art"><Mascot pose="hello" size={440} className="landing-hero-mascot" eager /></div>
        </div>
      </section>

      <section className="landing-section landing-light" id="how" aria-labelledby="how-title">
        <div className="landing-container">
          <div className="landing-heading"><span className="landing-kicker">Три прості кроки</span><h2 id="how-title">Як це працює</h2></div>
          <div className="landing-steps">
            <article><span className="landing-step-number">01</span><span className="landing-step-icon">🎒</span><h3>Обери клас</h3><p>Знайди свій клас і вирушай на навчальну пригоду.</p></article>
            <article><span className="landing-step-number">02</span><span className="landing-step-icon">🧭</span><h3>Обери предмет</h3><p>Математика чи мови? Почни з теми, яку вивчаєш зараз.</p></article>
            <article><span className="landing-step-number">03</span><Mascot pose="cheer" size={88} className="landing-step-mascot" /><h3>Урок за 5 хвилин</h3><p>Відповідай і збирай зірки. Помилки повернуться, поки не вийде. Без штрафів і сердечок.</p></article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-dark" id="exercises" aria-labelledby="exercises-title">
        <div className="landing-container">
          <div className="landing-heading"><span className="landing-kicker">Трохи гри в кожному уроці</span><h2 id="exercises-title">Які бувають завдання</h2></div>
          <div className="landing-exercises">
            {([
              ['choice', 'Вибери правильне'], ['match', 'З’єднай пари'], ['type', 'Напиши відповідь'],
              ['order', 'Склади речення'], ['fill', 'Встав слово'],
            ] as const).map(([kind, title]) => <article className="landing-exercise-card" key={kind}><h3>{title}</h3><MiniExercise kind={kind} /></article>)}
          </div>
        </div>
      </section>

      <section className="landing-section landing-light" id="subjects" aria-labelledby="subjects-title">
        <div className="landing-container">
          <div className="landing-heading"><span className="landing-kicker">Кожному цікаво своє</span><h2 id="subjects-title">Предмети</h2></div>
          <div className="landing-subjects">{subjects.map(subject => {
            const sections = contentRegistry.filter(section => section.grade === 3 && section.subject === subject.id);
            return <article className={`landing-subject-card landing-subject-${subject.className}`} key={subject.id}>
              <Art file={`/theme/dino/${subject.art}`} fallback="🦕" alt="" width={180} height={180} />
              <h3>{subject.title}</h3>
              {sections.length ? <ul>{sections.map(section => <li key={section.id}>{section.title} <span>· {section.lessons.length} {section.lessons.length === 1 ? 'урок' : section.lessons.length < 5 ? 'уроки' : 'уроків'}</span></li>)}</ul> : <p>Уроки з’являться згодом.</p>}
              {sections.length > 0 && <Link to={`/g/3/${subject.id}`}>До уроків <span aria-hidden="true">→</span></Link>}
            </article>;
          })}</div>
          <a className="landing-classic" href="/g2/"><Art file="/theme/dino/grade-2-card.webp" fallback="🎮" alt="" width={72} height={72} /><span><strong>2 клас: математика — класичні ігри</strong><small>Грати у знайомі завдання</small></span><span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="landing-section landing-dark landing-parents" id="parents" aria-labelledby="parents-title">
        <div className="landing-container landing-parent-grid">
          <div><span className="landing-kicker">Спокійно за дитину</span><h2 id="parents-title">Для батьків</h2><p>Вчіться разом або дозвольте дитині досліджувати теми самостійно.</p><Mascot pose="thinking" size={150} className="landing-parent-mascot" /></div>
          <ul className="landing-benefits">
            <li><span>⭐</span><div><strong>Прогрес кожної дитини</strong><p>Окремі профілі допомагають бачити пройдені уроки й зірки.</p></div></li>
            <li><span>🔑</span><div><strong>Вхід через Google</strong><p>Батьківський акаунт зберігає прогрес між пристроями.</p></div></li>
            <li><span>🌿</span><div><strong>Безкоштовно і спокійно</strong><p>Без реклами та трекерів. Можна вчитися й без входу.</p></div></li>
          </ul>
          <Link className="landing-policy-link" to="/privacy">Як ми дбаємо про дані →</Link>
        </div>
      </section>

      <section className="landing-section landing-light landing-teachers" aria-labelledby="teachers-title">
        <div className="landing-container landing-teacher-grid">
          <div><span className="landing-kicker">Зазирнімо в майбутнє</span><h2 id="teachers-title">Для вчителів — незабаром</h2><p>Готуємо інструменти для роботи з цілим класом.</p></div>
          <div className="landing-teacher-note"><ul><li>Код для приєднання до класу</li><li>Тести з математики та рейтинг класу</li><li>Чернетки вправ зі світлини чи тексту теми, які перевіряє вчитель</li></ul><p>Хочете спробувати з класом? <a href="mailto:leowebmark@gmail.com">Напишіть нам</a>.</p></div>
        </div>
      </section>
    </main>

    <footer className="landing-footer"><div className="landing-container"><span>© 2026 Класно.online</span><nav aria-label="Інформація"><Link to="/privacy">Політика конфіденційності</Link><Link to="/terms">Умови користування</Link><a href="mailto:leowebmark@gmail.com">Контакт</a></nav></div></footer>
  </div>;
}
