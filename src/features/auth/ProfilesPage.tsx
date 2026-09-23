import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mascot, Shell } from '../../app/ui';
import { api } from '../../lib/api';
import { isImportAvailable, useProgress } from '../progress/store';
import { LegalLinks } from '../legal/LegalPages';

const avatars = ['🦖', '🦕', '🥚', '🐊', '🐉', '🌿'];
export function ProfilesPage() {
  const navigate = useNavigate();
  const { authAvailable, user, profiles, guest, activeProfileId, selectProfile, initialize, importGuest, clearUser } = useProgress();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(avatars[0]);
  const [grade, setGrade] = useState(3);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim() || name.trim().length > 20) { setError('Ім’я має містити від 1 до 20 символів.'); return; }
    setBusy(true); setError('');
    try {
      const result = editing
        ? await api.updateProfile(editing, { name: name.trim(), avatar, grade })
        : await api.createProfile({ name: name.trim(), avatar, grade });
      await initialize(); await selectProfile(result.profile.id); setName(''); setEditing(null);
    } catch { setError('Не вдалося зберегти профіль. Спробуй ще раз.'); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Видалити цей профіль та його прогрес?')) return;
    setBusy(true);
    try { await api.deleteProfile(id); await initialize(); } catch { setError('Не вдалося видалити профіль.'); }
    finally { setBusy(false); }
  };
  if (!user) return (
    <Shell title="Профілі">
      <div className="empty-state">
        <Mascot pose="hello" size={120} className="empty-mascot" eager />
        <h1>Увійди як дорослий</h1>
        <p>Без входу уроки та прогрес доступні в гостьовому режимі.</p>
        {authAvailable && <a className="action-button" href="/api/auth/google">Увійти через Google</a>}
        <Link className="action-button secondary" to="/">Навчатися як гість</Link>
      </div>
      <LegalLinks />
    </Shell>
  );
  return (
    <Shell title="Профілі">
      <h1>Хто сьогодні навчається?</h1>
      <div className="profile-grid">{profiles.map(profile => (
        <div className={`profile-card ${activeProfileId === profile.id ? 'active' : ''}`} key={profile.id}>
          <button
            type="button"
            className="profile-pick"
            onClick={() => {
              void selectProfile(profile.id).then(() => {
                if (profile.grade === 2) window.location.href = '/g2/';
                else navigate(`/g/${profile.grade}`);
              });
            }}
          >
            <span>{profile.avatar}</span>
            <strong>{profile.name}</strong>
            <small>{profile.grade} клас</small>
          </button>
          <div className="profile-actions">
            <button type="button" onClick={() => {
              setEditing(profile.id); setName(profile.name); setAvatar(profile.avatar); setGrade(profile.grade);
            }}>Змінити</button>
            <button type="button" onClick={() => void remove(profile.id)}>Видалити</button>
          </div>
        </div>
      ))}</div>
      {isImportAvailable(activeProfileId, guest) && (
        <button className="import-button" type="button" onClick={() => {
          void importGuest().then(ok => setError(ok ? 'Гостьовий прогрес перенесено.' : 'Не вдалося перенести прогрес.'));
        }}>Перенести гостьовий прогрес</button>
      )}
      {(profiles.length < 6 || editing) && (
        <section className="profile-form">
          <h2>{editing ? 'Змінити профіль' : 'Створити профіль'}</h2>
          <label>Ім’я або прізвисько
            <input maxLength={20} value={name} onChange={event => setName(event.target.value)} />
          </label>
          <fieldset>
            <legend>Обери динозаврика</legend>
            <div className="avatar-list">{avatars.map(option => (
              <button
                type="button"
                className={avatar === option ? 'selected' : ''}
                key={option}
                aria-label={`Аватар ${option}`}
                aria-pressed={avatar === option}
                onClick={() => setAvatar(option)}
              >{option}</button>
            ))}</div>
          </fieldset>
          <label>Клас
            <select value={grade} onChange={event => setGrade(Number(event.target.value))}>
              <option value={2}>2 клас</option><option value={3}>3 клас</option>
            </select>
          </label>
          <button type="button" disabled={busy} className="action-button" onClick={() => void save()}>
            {editing ? 'Зберегти зміни' : 'Створити'}
          </button>
          {editing && (
            <button type="button" className="text-link" onClick={() => { setEditing(null); setName(''); }}>
              Скасувати
            </button>
          )}
        </section>
      )}
    {error && <p role="status" className="form-message">{error}</p>}
    <button className="text-link" type="button" onClick={() => { void clearUser().then(() => navigate('/')); }}>Вийти</button>
    <LegalLinks />
    </Shell>
  );
}
