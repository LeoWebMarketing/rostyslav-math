# Squid Math - Математика для Ростиславчика

## Project Info
- **URL**: https://rostyslav-math.pages.dev
- **GitHub**: https://github.com/LeoWebMarketing/rostyslav-math
- **Hosting**: Cloudflare Pages
- **Created**: 2026-01-10

## Purpose
Математична гра для учня 2 класу. Тренування арифметики з розкладанням чисел.

## Target User
Ростиславчик (2 клас) - вчить математику методом розкладання:
- `13 - 5` → розкладаємо 5 на 3+2 → `13 - 3 = 10` → `10 - 2 = 8`

## Game Mechanics

### Duolingo-style
- 10 прикладів за сесію
- Progress bar вгорі
- Статистика сесій за день (localStorage)

### Free-form Decomposition
- Дитина сама вирішує як розкладати числа
- Додає кроки через "+ Додати крок"
- Кожен крок перевіряється математично
- Головне - правильна фінальна відповідь

### Problem Types
- `A + B + C = ?`
- `A + B - C = ?`
- `A - B + C = ?`
- `A - B - C = ?`
- Числа: A (3-17), B та C (1-9)
- Результат завжди 0-20

## Design
**Theme**: Squid Game
- Dark background (#0f0f1a, #1a1a2e)
- Neon pink (#FF0080) - borders, accents
- Neon teal (#00F5D4) - secondary, success hints
- Geometric shapes in background (circle, triangle, square)

## Tech Stack
- Single HTML file (HTML + CSS + JS inline)
- No dependencies
- localStorage for persistence
- Cloudflare Pages hosting

## Data Storage (localStorage)
```javascript
{
  date: "2026-01-10",    // Reset daily
  sessions: 3,           // Sessions today
  correct: 25,           // Correct answers today
  best: 10               // Best score ever
}
```

## Deploy
```bash
cd ~/Documents/GitHub/rostyslav-math
CLOUDFLARE_API_TOKEN="..." npx wrangler pages deploy . --project-name rostyslav-math
```

## Future Ideas
- [ ] Рівні складності (легкий/важкий)
- [ ] Звукові ефекти
- [ ] Таблиця лідерів (потребує backend)
- [ ] Режим на час
- [ ] Більше типів прикладів (множення для 3 класу)
- [ ] PWA для офлайн роботи
