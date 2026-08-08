# Figma homepage implementation plan

Status: Epic 1 complete; Epic 2 has not started

Last updated: 2026-08-08

## Goal

Реализовать публичную Главную DeployLab по каноническим Figma-экранам в Nuxt 4
и Vue 3, переиспользуя существующий UI Kit и `CaseCard`. Сохранить SSR/static
generation, семантический HTML, доступность, SEO и текущие Core Web Vitals gates.

Канонические design endpoints:

- [Главная, desktop / 31:6020](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=31-6020&p=f&m=dev) — 1440×6575;
- [Главная, mobile / 144:233](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=144-233&p=f&m=dev) — 390×7342;
- [UI KIT / 141:98](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=141-98&p=f&m=dev);
- [Cases / 154:247](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=154-247&p=f&m=dev).

Главная включает header/hero, philosophy, services, selected projects, process,
feedback, contact form и footer. Текущий `/` является технической smoke-page и
будет заменён утверждённой композицией.

## Non-goals

- Не изменять Figma, не публиковать Code Connect и не использовать временные
  Figma asset URLs в production.
- Не реализовывать Privacy Policy page, CMS, новые product routes или другие
  страницы без отдельного подтверждения.
- Не добавлять Storybook/Histoire, глобальный store, второй CSS framework или
  UI library без доказанного gap.
- Не добавлять copy, URL, form behaviour, validation/error states или
  carousel behaviour за пределами принятого homepage ADR.
- Не создавать tablet-макет. Между Figma endpoints 390 и 1440 px используется
  fluid/intrinsic layout, а breakpoint — только при реальном изменении
  композиции.
- Не коммитить, не push-ить и не открывать PR без отдельного owner review и
  явного разрешения.

## Constraints

- Route `/` остаётся SSR/prerendered; существенный текст, ссылки и controls
  должны присутствовать в исходном HTML.
- `app/assets/styles/tokens.css` остаётся источником design tokens. Новые
  homepage-specific значения добавляются только после проверки точного Figma
  node и сопровождаются node-ID в CSS-комментарии.
- Переиспользовать `UiContainer`, `UiTypography`, `UiButton`, `UiInput`,
  `UiCheckbox`, `UiMenuToggle`, `UiSuccessNotice` и data-driven `CaseCard`.
  Не расширять их public API ради одного consumer без второго подтверждённого
  use case.
- Figma copy принят как production copy, включая `Testimonial #1/#2` и footer
  year `2025`. Textarea использует `Message`; case previews получают
  утверждённые generated placeholder alt texts из homepage ADR.
- Статический deployment profile и текущий Lighthouse gate сохраняются:
  performance ≥ 0.90, accessibility = 1.00, best practices ≥ 0.95, SEO = 1.00.
- Node 24 и Corepack pnpm 11.5.2 обязательны. Shell default Node 22 не является
  поддерживаемым test environment.
- Любые Figma exports должны иметь подтверждённое право использования и
  храниться локально. Декоративные изображения получают пустой `alt`,
  смысловые — утверждённое описание.
- Новых runtime dependencies в базовом плане нет. `@nuxt/image`, VueUse,
  native CSS, Vitest и Playwright уже закрывают текущие needs.

### Confirmed baseline

- `origin/main` и ветка `codex/homepage-figma-plan` начинаются с merge UI Kit
  PR #1 (`e010bc4`). Worktree до создания этого плана был clean.
- Figma MCP read-only context, variables и high-resolution screenshots
  получены для desktop `31:6020` и mobile `144:233`.
- UI Kit уже содержит typography, container, controls, success notice и шесть
  responsive CaseCard records с локальными PNG.
- Current homepage 3D smoke scene создаёт client chunk около 841 kB; её
  соответствие Figma не подтверждено.
- На Node 24.16.0 проходят setup doctor, formatting, static quality, 24 Vitest
  tests, dependency/cycle/dead-code checks, production build и 8 Playwright
  desktop/mobile scenarios. Static generate, link inspection и Lighthouse
  также проходят: performance 0.99, accessibility 1.00, best practices 1.00,
  SEO 1.00.
- Local browser proof на 1440×900 и 390×844 подтверждает текущий H1, IBM Plex
  Sans, 350 px mobile container, visible SVG fallback, отсутствие horizontal
  overflow и console errors. Dev-only `/__ui-kit` показывает шесть CaseCard,
  native controls и status region без console errors.

### Known baseline warnings

- ESLint сообщает семь existing formatting warnings для void elements в
  UI Kit; errors отсутствуют.
- Production build сообщает large client chunk около 841 kB, связанный с
  текущим 3D smoke hero, а также upstream OXC/esbuild и Rollup annotation
  warnings.
- Nuxt OG Image предупреждает о generated secret в development и о disabled
  SSR во время Nuxt test bootstrap. Эти предупреждения существовали до
  homepage plan и не маскируются как изменения текущей задачи.

## Ownership seam

- `app/pages/index.vue` владеет route-level композициями, SEO metadata и
  Organization schema, но не деталями каждой секции.
- `app/components/ui/` остаётся product-neutral UI Kit.
- `app/components/product/cases/` остаётся владельцем case data/presentation.
- Homepage-only композиции предлагается держать в
  `app/components/home/`; извлечение оправдано только секциями с самостоятельной
  разметкой, interaction state или focused test seam.
- Header/footer остаются home-owned, пока вторая implemented route не докажет
  общий layout boundary.
- Copy для одной страницы хранится в typed home-local config. Nuxt Content или
  CMS collection не входит в текущий контракт.
- Форма visual-only и не имеет submit/API boundary. Functional delivery
  остаётся отдельной будущей задачей.

## Plan

### Epic 0 — product contract, ADR and accepted baseline

Goal: закрыть решения, которые Figma не определяет, и не начинать кодирование
на предположениях.

- [x] Найти и изучить desktop/mobile Главной, переменные, screenshots и section
      nodes.
- [x] Инвентаризировать route ownership, UI Kit, assets, packages, tests, SEO и
      CWV constraints.
- [x] Создать отдельную ветку и воспроизвести baseline на Node 24.
- [x] Получить owner answers из раздела `Approved decisions`.
- [x] Записать принятые решения в homepage ADR: content
      source, interactions, form boundary, asset/3D strategy и page-vs-layout
      ownership.
- [x] Обновить этот roadmap и acceptance criteria по утверждённому ADR.

Completion gate: решения подтверждены, homepage ADR принят, baseline не
ухудшен. Epic 1 начинается только после отдельного явного implementation start.

### Epic 1 — assets, tokens and homepage shell

Goal: создать минимальную проверяемую основу без наполнения всех секций.

- [x] Получить exact local exports только для утверждённых homepage visuals;
      зафиксировать source node, role (decorative/content) и license approval.
- [x] Добавить только недостающие semantic tokens для section surfaces,
      translucent borders и spacing, подтверждённые Figma.
- [x] Создать home-local typed config для утверждённой navigation/copy/data;
      не создавать CMS collection без owner need.
- [x] Собрать semantic page skeleton с section IDs и одним H1; сохранить
      `useSeoMeta`, Organization schema, canonical/discovery contracts.
- [x] Реализовать shared-on-home header/footer composition. Mobile trigger
      использует `UiMenuToggle`, но поведение menu следует утверждённому ADR.
- [x] Заменить smoke 3D consumer точными локальными Figma visuals и только
      после dead-code evidence удалить неиспользуемые scene files, modules и
      dependencies отдельной task внутри эпика.

#### Epic 1 execution plan

Execution status: complete on 2026-08-08. The currently rendered navigation
exposes approved future section anchors; their visible targets arrive with their
respective content epics. `/privacy-policy` is an explicitly documented route
dependency, not a page created by this epic. Link Checker excludes this exact
approved route and Nitro ignores it during prerender crawling while it is out
of scope; either exclusion is not a claim that the future production page exists.

#### Epic 1 asset manifest

| Figma node                         | Local asset                                  | Role                           | Alt policy                           | Evidence                                                                                                                    |
| ---------------------------------- | -------------------------------------------- | ------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `31:6073` (`Abstract-Shape-069 1`) | `public/images/home/hero-abstract-shape.png` | Decorative static hero artwork | Empty `alt`; parent is `aria-hidden` | Exact 4096×4096 PNG exported from canonical Figma on 2026-08-08; local source is served through existing Nuxt Image as WebP |

Wordmark, primary-menu glyph and footer do not have standalone Figma asset
exports in this epic: the approved Figma nodes use text or existing `UiMenuToggle`.

##### E1.1 — asset evidence and local asset manifest — complete

1. Перед скачиванием повторно запросить design context и screenshot только для
   узлов, которые входят в Epic 1: desktop hero/header `31:6021`, mobile
   hero/header `141:4` и mobile navigation `144:1326`; при необходимости
   отдельно запросить desktop footer `46:1308` и mobile footer `144:1255`.
2. Составить в этом плане компактную таблицу `Figma node → local path → role →
alt policy`: hero artwork, logo/wordmark if exported as an asset, menu
   artwork and footer artwork. Не экспортировать графику следующих эпиков
   заранее, если она ещё не нужна для работающего shell.
3. Скачать точные approved Figma bytes в `app/assets/images/home/` или
   `app/assets/icons/home/` по их формату; не сохранять MCP URLs и не создавать
   replacement SVG/placeholder artwork. Каждому asset присвоить стабильное
   имя, а source node и разрешение на repository use зафиксировать в manifest.
4. Проверить размер, MIME type и импорт каждого local asset. Если Figma
   возвращает единственный flattened export вместо самостоятельного source
   asset, остановиться и сверить, пригоден ли он для responsive crop без
   ухудшения макета.

##### E1.2 — token delta and typed home contract — complete

1. Сопоставить homepage node values с `app/assets/styles/tokens.css` и добавить
   только отсутствующие semantic tokens: section surfaces, translucent border,
   overlay/backdrop и shell spacing. Для каждого нового token указать source
   node рядом с CSS rule; не добавлять page-local literal, который уже покрыт
   UI Kit.
2. Создать feature-private `app/components/home/home.config.ts`. В нём хранить
   typed navigation items, section anchor IDs, approved CTA labels, footer year,
   Privacy href `/privacy-policy`, text mobile menu и шесть resolved placeholder
   alt strings. Case-specific data не переносить из
   `app/components/product/cases/case-card.config.ts`.
3. Добавить быстрый unit test config contract: уникальные anchor IDs, expected
   six navigation destinations, exact Privacy href и отсутствие mutation path.

##### E1.3 — semantic header and mobile navigation — complete

1. Создать home-local `HomeHeader.vue` и `HomeMobileNavigation.vue`; не
   расширять `UiMenuToggle` и не переносить header в global layout.
2. На desktop отрендерить `<header>` и `<nav aria-label="Primary">` с
   server-rendered anchors. `Start a Project` — semantic anchor, а не
   `UiButton`, потому что он прокручивает к contact section.
3. На mobile использовать `UiMenuToggle` только как trigger. Overlay содержит
   тот же список ссылок, открывается/закрывается по approved contract, удерживает
   focus внутри себя, возвращает focus trigger и блокирует background scroll.
   Реализовать это native `<dialog>` либо минимальным local DOM lifecycle code;
   не добавлять modal/drawer package и не использовать `ClientOnly`.
4. Добавить Nuxt component tests для landmark/links и Playwright flow на mobile:
   open, Escape, selected link, focus restoration и no horizontal overflow.

##### E1.4 — route shell and SEO continuity — complete

1. Оставить `app/pages/index.vue` владельцем `useSeoMeta` и Organization
   schema; убрать из него только smoke-scene composition по мере её замены.
2. Ввести semantic `<main>` и Figma-approved section anchor IDs, не создавая
   пустые fake content blocks. До внедрения каждой content section в следующих
   эпиках navigation links могут ссылаться на declared future anchors, но финальный
   production link check не проходит, пока все targets не появились.
3. Добавить home-local footer composition с wordmark, year и Privacy anchor.
   Не создавать `/privacy-policy` в этом эпике: это отдельная scope dependency,
   уже зафиксированная в ADR.
4. Обновить focused E2E smoke assertions от canvas-specific к observable shell
   contract: one H1, landmarks, header/footer, metadata and absence of stale
   scene-only requirement.

##### E1.5 — static hero visual migration and bounded cleanup — complete

1. Создать local `HomeHeroVisual.vue`, который renders approved static Figma
   hero artwork with explicit intrinsic dimensions and decorative accessibility
   semantics. Его first use заменяет `HeroWireframe` в current route without
   changing SSR/prerender mode.
2. Сначала запустить focused tests/build и browser screenshot at 390/768/1440;
   проверить initial image request, reserved layout size, reduced-motion
   invariance and client chunk delta.
3. Только когда `rg` and dependency checks подтвердят отсутствие consumers,
   удалить obsolete `HeroWireframe*`, `HeroWireframeCanvas.vue`, scene lifecycle
   composable and associated asset/config. Затем удалить `@tresjs/nuxt`, `three`
   and `@types/three` from direct dependencies and `nuxt.config.ts` только если
   они не имеют иных consumers. Не удалять ничего до этой evidence point.
4. Обновить tests, которые ожидают canvas, сохранив проверку static visual и
   reduced-motion-compatible first paint.

##### E1.6 — epic integration and evidence — complete

1. Собрать route из config, header, footer и static hero visual, сохраняя exact
   Figma asset attribution in the plan.
2. Выполнить focused component/E2E checks сначала, затем полный Epic 1 gate из
   раздела `Verification`: static quality, dependency/dead-code checks, build,
   generate, Lighthouse, secrets check, browser screenshots at 390/768/1440,
   keyboard and console/network proof.
3. Обновить checklist Epic 1, roadmap status, asset manifest and documented
   before/after performance evidence. Остановиться перед Epic 2 для review.

Для посетителя это означает, что страница получит рабочую шапку и мобильную
навигацию, корректные ссылки и настоящую графику из макета уже на первом
этапе. Контентные секции и отправка формы появятся позднее: кнопка формы не
будет создавать впечатление, что заявка была отправлена.

Completion gate: full epic verification, SSR HTML содержит navigation/section
landmarks, keyboard menu flow доказан, asset requests локальны и стабильны.

### Epic 2 — hero, philosophy and services

Goal: реализовать above-the-fold и первые content sections с точным responsive
сопоставлением.

- [ ] Hero desktop `31:6021` / mobile `141:4`: heading, body, CTA и visual с
      зарезервированным размером, без layout shift.
- [ ] Philosophy desktop `31:6040` / mobile `144:208`: section heading и три
      value cards как semantic list.
- [ ] Services desktop `31:6064` / mobile `144:234`: шесть service items как
      semantic list; декоративный background не участвует в accessibility tree.
- [ ] Переиспользовать `UiContainer` и `UiTypography`; не создавать generic
      Card abstraction для двух визуально разных секций.
- [ ] Уточнить metadata description после фиксации финального hero copy.

Completion gate: full epic verification и визуальное сравнение 390, 768 и
1440 px с Figma для всех трёх sections.

### Epic 3 — selected projects and process

Goal: встроить существующий CaseCard и реализовать process без дублирования UI
Kit.

- [ ] Selected Projects desktop `32:6287` / mobile `144:816`: использовать
      `CaseCard` и существующий typed dataset.
- [ ] Перевести case previews на `NuxtImg`/`NuxtPicture` только если crop
      contract сохраняется; задать intrinsic dimensions, responsive sizes и lazy
      loading для below-fold images.
- [ ] Реализовать утверждённое collection behaviour (native scroll-snap либо
      другой согласованный control), без autoplay по умолчанию.
- [ ] Process desktop `46:53` / mobile `144:455`: semantic ordered list из семи
      этапов, responsive decorative line/art и читаемый DOM order.
- [ ] Применить шесть generated placeholder alt texts из homepage ADR и
      проверить external case links и touch/keyboard operation.

Completion gate: full epic verification, image/network budget comparison,
keyboard/touch proof и visual comparison всех visible project/process states.

### Epic 4 — feedback, contact and submission boundary

Goal: завершить interaction-heavy часть страницы без фиктивного backend.

- [ ] Feedback desktop `46:174` / mobile `144:535`: semantic testimonials и
      утверждённое navigation behaviour; no autoplay unless explicitly required.
- [ ] Contact desktop `48:1595` / mobile `144:1236`: собрать поля из `UiInput`,
      consent из `UiCheckbox`, visual submit control из `UiButton`; label и
      Privacy link остаются видимыми и keyboard-safe.
- [ ] Не делать submit action и не показывать fake success: форма visual-only.
      Functional submission, validation, anti-abuse и delivery adapter остаются
      отдельной будущей задачей.
- [ ] Проверить mobile menu, forms и horizontal collections совместно на
      focus order, Escape/back behaviour и scroll ownership.

Completion gate: full epic verification; visual controls не отправляют данные
и не показывают недостоверный success state.

### Epic 5 — final fidelity, SEO/CWV and reviewed handoff

Goal: доказать целостность Главной и подготовить uncommitted diff к owner
review.

- [ ] Сравнить full-page и section screenshots с Figma desktop/mobile;
      исправлять только измеримые deviations, сохраняя semantic constraints.
- [ ] Проверить heading/landmark order, keyboard-only path, focus visibility,
      reduced motion, contrast, 320 px minimum и intermediate widths.
- [ ] Проверить prerendered HTML, title/description/OG/canonical/schema,
      robots/sitemap, link checker и security headers.
- [ ] Провести Lighthouse после clean generate и сравнить с baseline; проверить
      LCP/CLS и JS/image transfer budgets.
- [ ] Удалить только доказанно неиспользуемый smoke/dead code и assets.
- [ ] Обновить roadmap, ADR consequences, README statement о smoke homepage и
      final evidence. Перед любым commit остановиться для owner review.

Completion gate: весь scope имеет browser/automated evidence, документация
соответствует коду, Lighthouse gates проходят, diff reviewable и uncommitted.

### Roadmap

| Milestone | Deliverable                                         | Dependency                 | Status   |
| --------- | --------------------------------------------------- | -------------------------- | -------- |
| R0        | Exact Figma/code/UI Kit inventory and baseline      | Figma read access, Node 24 | Complete |
| R1        | Approved contract and homepage ADR                  | Owner answers              | Complete |
| R2        | Local assets, tokens, semantic shell and navigation | R1, approved Epic 1 plan   | Complete |
| R3        | Hero, philosophy and services                       | R2                         | Pending  |
| R4        | Selected projects and process                       | R3                         | Pending  |
| R5        | Feedback and contact boundary                       | R4                         | Pending  |
| R6        | Full fidelity, SEO/CWV and reviewed handoff         | R5                         | Pending  |

## Verification

После каждого implementation epic выполняется полный gate на Node 24:

1. `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:styles`,
   `pnpm slop-scan` и `pnpm test:unit`.
2. Focused Nuxt component tests плюс полный `pnpm test:e2e` в desktop/mobile
   Chromium. Старые smoke assertions заменяются observable homepage contracts.
3. `pnpm deps:check`, `pnpm deps:cycles` и `pnpm dead-code` при каждом изменении
   component/dependency boundary.
4. `pnpm build`, `pnpm generate`, `pnpm lighthouse` и link inspection. Для
   visual changes — deterministic Playwright screenshots на 390 и 1440 px;
   768 px остаётся browser proof для fluid interpolation.
5. Browser check approved local origin: console/network, keyboard navigation,
   touch scrolling, focus restoration, reduced motion и responsive overflow.
6. `pnpm secrets:check`, `git diff --check` и `git status --short`; никаких
   stage/commit/push без отдельного разрешения.

Playwright уже имеет `toHaveScreenshot()`, поэтому отдельный visual-regression
package не нужен. Golden screenshots должны создаваться и обновляться только в
одинаковом CI environment после owner review изображения.

## Risk and stop condition

Остановиться и запросить owner direction, если:

- реализация требует copy, URL, interaction или form behaviour за пределами
  принятого homepage ADR;
- `/privacy-policy` отсутствует перед final production handoff;
- asset usage rights не подтверждены либо доступен только временный Figma URL;
- exact Figma visual требует сохранить/расширить 3D, external script,
  `ClientOnly`, новую runtime dependency или иной rendering profile;
- Lighthouse/SEO/accessibility gate регрессирует и исправление выходит за
  границы активного эпика;
- возникает необходимость изменить Figma, public route contract или второй
  page/layout ownership без отдельного подтверждения.

Task complete только после Epic 5, полного evidence и owner review
uncommitted diff. Commit/push являются отдельным действием после approval.

### Approved decisions

1. Figma copy is final; textarea uses `Message`, footer keeps `2025`, and case
   previews use generated placeholder alt text recorded in the homepage ADR.
2. Navigation and `Start a Project` use same-page anchors; Privacy Policy uses
   `/privacy-policy`.
3. Mobile menu is an accessible overlay; Projects and Feedback use manual
   scroll snap with no autoplay.
4. The form is visual-only. Functional submission is a future task.
5. Exact local Figma exports replace the smoke 3D consumer; obsolete 3D code
   and dependencies are removed only after dead-code evidence.
6. Header/footer remain home-owned, and copy lives in typed local config until
   a second route or editorial workflow proves a broader boundary.

### Epic 1 delivery evidence

- `app/components/home/` now owns the typed config and home-only header,
  native-dialog mobile navigation, footer and static hero artwork; `/` remains
  SSR/prerendered with its existing SEO and Organization schema.
- The hero uses one exact, local 4096×4096 Figma PNG. The old canvas, scene
  lifecycle and `@tresjs/nuxt`/`three` direct dependencies were removed after
  `rg` showed no remaining consumer.
- Focused component tests cover config/header contract; E2E covers desktop and
  mobile home shell, reduced motion, Escape-close and focus restoration.
- Browser proof at 390, 768 and 1440 px confirms one H1 and no horizontal
  document overflow. The static artwork is locally served.
- `linkChecker.excludeLinks` names only `/privacy-policy`, because that route is
  explicitly out of scope. The local 4096×4096 Figma source is rendered with
  existing Nuxt Image as a preloaded WebP derivative; no new package is needed.
