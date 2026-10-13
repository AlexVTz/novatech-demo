# NovaTech Architecture

Reference for the site structure, JavaScript modules, CSS architecture, and tests. For colors, typography, and component specs, see [figma-spec.md](figma-spec.md). For the planned backend, see [api-spec.md](api-spec.md).

## Site Structure

The site has five static pages in `src/pages/`. Every page shares the same header (`.header` with `.nav`) and footer (`.footer`), and loads `navigation.js`.

| Page | File | Content | Page CSS | Page JS |
|------|------|---------|----------|---------|
| Home | `index.html` | Hero, "Why Choose NovaTech?" (3 feature cards: Fast Delivery, Secure by Design, Scalable Solutions), call to action (CTA) | `pages/home.css` | `navigation.js` |
| Services | `services.html` | Page hero, 4 services (Custom Software Development, Cloud Solutions, Technology Consulting, Data & Analytics), CTA | `pages/services.css` | `navigation.js` |
| Portfolio | `portfolio.html` | Page hero, filter buttons (all, web, mobile, cloud), 6 project cards (FinTrack Dashboard, HealthHub Mobile, LogiFlow Platform, EduLearn LMS, DataSync Migration, RetailGo POS), CTA | `pages/portfolio.css` | `navigation.js`, `portfolio-filters.js` |
| Team | `team.html` | Page hero, 6 team cards, "Our Values" (Excellence, Collaboration, Innovation, Integrity), CTA | `pages/team.css` | `navigation.js` |
| Contact | `contact.html` | Page hero, contact info, form (`name`, `email`, `company`, `service`, `message`) | `pages/contact.css` | `navigation.js`, `contact-form.js` |

Pages reference assets with root-relative paths (`/css/...`, `/js/...`). The dev server serves `src/` as its root, so open pages at `http://localhost:3000/pages/index.html`.

## JavaScript Modules

All modules live in `src/js/` and load with `<script type="module">`. Each module that touches the DOM auto-initializes (immediately, or on `DOMContentLoaded` if the document is still loading). The exported init functions return early when their target elements are missing, so calling them twice or on the wrong page is safe.

### `navigation.js`

Mobile menu toggle.

| Export | Signature | Description |
|--------|-----------|-------------|
| `initNavigation` | `() => void` | Binds `.nav__toggle` to `.nav__menu`. |

Behavior:
- Click on the toggle adds or removes `is-open` on the menu and updates `aria-expanded`.
- Click outside the menu closes it.
- `Escape` closes the menu and returns focus to the toggle.

### `validation.js`

Reusable form validation. It has no auto-initialization.

| Export | Signature | Returns |
|--------|-----------|---------|
| `validateField` | `(field: HTMLElement)` | `{ isValid: boolean, message: string }` |
| `validateForm` | `(form: HTMLFormElement)` | `{ isValid: boolean, errors: Array<{ field: string, message: string }> }` |
| `isValidEmail` | `(email: string)` | `boolean` |
| `isValidPhone` | `(phone: string)` | `boolean` |

Details:
- `validateField` trims the value and reads rules from the element: `required`, `type` (`email` or `tel`), `minLength`, and `maxLength`. It applies the first failing rule, in that order. It does not apply the `pattern` attribute.
- `validateField` toggles `is-invalid` on the field and writes the message into the element with id `<field.id>-error`, if present.
- `validateForm` checks every `input`, `textarea`, and `select` that is `required` or has a value. `field` in each error is `field.name`, falling back to `field.id`.
- Email pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Phone pattern: `/^[\d\s\-+()]{10,}$/`.

```js
import { validateForm, isValidEmail } from './validation.js';

isValidEmail('jane@example.com'); // true

const { isValid, errors } = validateForm(document.querySelector('#contact-form'));
// errors: [{ field: 'email', message: 'Please enter a valid email address' }]
```

### `contact-form.js`

Wires `#contact-form` to `validation.js`.

| Export | Signature | Description |
|--------|-----------|-------------|
| `initContactForm` | `() => void` | Attaches submit and blur handlers to `#contact-form`. |

Behavior:
- On blur, validates a field if it is `required` or has a value.
- On submit, calls `preventDefault()` and runs `validateForm`. If invalid, it focuses the first `.is-invalid` field and stops.
- If valid, it disables the submit button, shows "Sending...", and simulates a 1.5 second request (no real network call). It then writes a success message to `#form-status` (class `form-status--success`) and resets the form. The failure path uses `form-status--error`.

### `portfolio-filters.js`

Category filter for the portfolio grid.

| Export | Signature | Description |
|--------|-----------|-------------|
| `initPortfolioFilters` | `() => void` | Attaches one delegated click handler to `.portfolio__filters`. |

Behavior:
- A click on a `.filter-btn` reads its `data-filter` value (`all`, `web`, `mobile`, `cloud`).
- Each `.project-card` whose `data-category` does not match gets `is-hidden`. `all` shows every card.
- The clicked button gets `filter-btn--active` and `aria-pressed="true"`. The others are reset.

## CSS Architecture

```
src/css/
├── variables.css    # Design tokens (custom properties on :root)
├── base.css         # Reset, typography, layout primitives, utilities
├── components.css   # Shared components
└── pages/
    ├── home.css
    ├── services.css
    ├── portfolio.css
    ├── team.css
    └── contact.css
```

Each page loads four stylesheets in this order: `variables.css`, `base.css`, `components.css`, then its own `pages/<page>.css`. Page files hold only styles for that page.

`components.css` holds the shared blocks: `.header`, `.nav`, `.footer`, `.btn` (`--primary`, `--secondary`, `--large`, `--full-width`), `.page-hero`, `.cta`, `.form-*`, and `.form-status` (`--success`, `--error`).

### Design tokens

Defined in `variables.css`. Always use `var(--token)` instead of hard-coded values.

| Group | Tokens |
|-------|--------|
| Color | `--color-primary-50..900`, `--color-secondary-50..900`, `--color-accent-100/500/700`, `--color-success-*`, `--color-warning-*`, `--color-error-*` (100/500/700) |
| Typography | `--font-family-base`, `--font-family-heading`, `--font-size-xs..5xl`, `--font-weight-normal/medium/semibold/bold`, `--line-height-tight/normal/relaxed` |
| Spacing | `--spacing-1,2,3,4,5,6,8,10,12,16,20` (4px grid, in `rem`) |
| Layout | `--container-max-width` (1200px), `--container-padding` |
| Radius | `--radius-sm/md/lg/xl/full` |
| Shadow | `--shadow-sm/md/lg/xl` |
| Transition | `--transition-fast/base/slow` (150/200/300ms) |
| Z-index | `--z-dropdown/sticky/fixed/modal/tooltip` (100 to 500) |

### BEM naming

Classes follow `.block__element--modifier`.

```css
.nav__link { }            /* element */
.nav__link--active { }    /* modifier */
.btn--primary { }         /* block modifier */
```

State classes use an `is-` prefix and are toggled by JavaScript: `is-open`, `is-invalid`, `is-hidden`.

### Responsive behavior

The CSS uses `max-width` media queries (mostly at `768px`; `contact.css` also uses `900px`). This is desktop-first, which differs from the mobile-first rule in `CLAUDE.md`.

## Testing

| Command | What it runs |
|---------|--------------|
| `npm run test` | Unit tests, then E2E tests |
| `npm run test:unit` | `node --test 'tests/unit/**/*.test.js'` (Node built-in runner) |
| `npm run test:e2e` | `playwright test` (specs in `tests/e2e/`) |
| `npm run test:e2e:ui` | Playwright interactive UI mode |
| `npm run lint` / `lint:fix` | ESLint on `src/js/` |
| `npm run format` / `format:check` | Prettier on `src/**/*.{html,css,js}` |

Playwright starts the dev server itself (`npm run dev`, port 3000), so you do not need to start it first. On a fresh machine, install browsers once with `npx playwright install`.

Current coverage:
- `tests/unit/validation.test.js` checks the email, phone, required, and minimum-length rules.
- `tests/e2e/navigation.spec.js` covers the mobile menu.
- `tests/e2e/contact-form.spec.js` covers the contact form.
