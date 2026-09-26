import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Pages } from './App';
import { legacyGameDestination } from './LegacyGameRedirect';
import { continueDestination } from '../features/landing/LandingPage';
import { contentRegistry } from '../../content';

function render(path: string) {
  return renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [path] },
    createElement(Pages),
  ));
}

describe('home routing', () => {
  it('matches the lazy game route', () => {
    expect(render('/game?grade=3&subject=math&section=multiplication')).toContain('route-loading');
  });

  it('renders the landing page at /', () => {
    expect(render('/')).toContain('Вчимося класно');
    expect(render('/')).toContain('href="/klasy"');
  });

  it('renders the grade picker at /klasy', () => {
    expect(render('/klasy')).toContain('Обери клас і вирушаймо вчитися');
  });

  it('redirects the legacy game query to /g2/', () => {
    const replace = vi.fn();
    vi.stubGlobal('window', { location: { replace } });
    try {
      expect(legacyGameDestination('/', '?game=zuma')).toBe('/g2/?game=zuma');
      expect(render('/?game=zuma')).toBe('');
      expect(replace).toHaveBeenCalledWith('/g2/?game=zuma');
      expect(legacyGameDestination('/klasy', '?game=zuma')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('continues at the next unfinished lesson in the latest subject', () => {
    const math = contentRegistry.filter(section => section.grade === 3 && section.subject === 'math');
    const english = contentRegistry.filter(section => section.grade === 3 && section.subject === 'english');
    const mathFirst = `3/math/${math[0].section}/${math[0].lessons[0].id}`;
    const englishFirst = `3/english/${english[0].section}/${english[0].lessons[0].id}`;
    const englishNext = `3/english/${english[0].section}/${english[0].lessons[1].id}`;
    expect(continueDestination([
      { lessonKey: mathFirst, completions: 1, lastAt: 100 },
      { lessonKey: englishFirst, completions: 1, lastAt: 200 },
    ])).toBe(`/g/${englishNext}`);
  });

  it('opens test preparation for a fresh English guest', () => {
    const map = render('/g/3/english');
    expect(map.indexOf('Підготовка до контрольної')).toBeLessThan(map.indexOf('Я вмію!'));
    expect(map).toContain('href="/g/3/english/test-prep/g3-en-tp-l1"');
    expect(map).toMatch(/class="lesson-node unlocked" href="\/g\/3\/english\/test-prep\/g3-en-tp-l1"/);
    expect(map).toMatch(/class="lesson-node unlocked" href="\/g\/3\/english\/can-activities\/g3-en-can-activities-l1"/);
  });
});
