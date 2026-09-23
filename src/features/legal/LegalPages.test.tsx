import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Pages } from '../../app/App';

describe('legal routes', () => {
  it.each([
    ['/privacy', 'Політика конфіденційності'],
    ['/terms', 'Умови користування'],
  ])('renders %s with its heading and both legal links', (path, heading) => {
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(Pages),
    ));

    expect(html).toContain(`<h1>${heading}</h1>`);
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
  });
});
