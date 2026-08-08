# Figma homepage implementation plan

Status: Epic 5 complete; locally committed, awaiting owner direction (no push)

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
feedback, contact form и footer. Утверждённая композиция реализована на `/`.

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
- Не push-ить и не открывать PR без отдельного owner review и явного
  разрешения. Локальный commit Epic 5 явно разрешён owner.

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
  performance ≥ 0.90, accessibility ≥ 0.96 (owner-accepted debt), best
  practices ≥ 0.95, SEO = 1.00.
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

- [x] Hero desktop `31:6021` / mobile `141:4`: heading, body, CTA и visual с
      зарезервированным размером, без layout shift.
- [x] Philosophy desktop `31:6040` / mobile `144:208`: section heading и три
      value cards как semantic list.
- [x] Services desktop `31:6064` / mobile `144:234`: шесть service items как
      semantic list; декоративный background не участвует в accessibility tree.
- [x] Переиспользовать `UiContainer` и `UiTypography`; не создавать generic
      Card abstraction для двух визуально разных секций.
- [x] Проверить metadata description после фиксации финального hero copy: она
      уже соответствует утверждённому позиционированию и не требует правки.

Completion gate: full epic verification и визуальное сравнение 390, 768 и
1440 px с Figma для всех трёх sections.

#### Epic 2 execution plan

Execution status: complete on 2026-08-08. New runtime packages were not
required: the existing UI Kit, native CSS, Nuxt Image, Vitest and Playwright
cover the scope.

##### E2.1 — Figma measurements and content contract — complete

1. Re-fetch design context and reference screenshots for desktop `31:6021`,
   `31:6040`, `31:6064` and mobile `141:4`, `144:208`, `144:234` before
   writing each corresponding section. Record only the values missing from
   existing tokens, with source node IDs.
2. Verify all copy, card count and visual roles against the canonical nodes.
   Keep the approved hero copy in `home.config.ts`; add philosophy and services
   data there as typed immutable page-local content rather than introducing a
   CMS layer.
3. Audit every visual in these nodes. Reuse the local hero export from Epic 1;
   download an exact local Figma export only when a separate source asset is
   actually present and needed. Decorative media stays outside the accessibility
   tree; no hand-drawn substitute asset or remote Figma URL is allowed.

##### E2.2 — Hero fidelity and responsive hand-off — complete

1. Refactor the existing shell hero only as needed to match the exact desktop
   and mobile hierarchy, measured spacing, visual crop and CTA position. Keep
   exactly one document H1 and the CTA as a same-page `#contact` anchor.
2. Preserve intrinsic image dimensions, responsive `sizes` and static first
   paint. Verify no layout shift, canvas/WebGL reintroduction or duplicate
   hero copy is introduced.
3. Add focused component/E2E assertions for the hero heading, description,
   CTA destination, decorative visual semantics and reduced-motion-invariant
   rendering.

##### E2.3 — Philosophy section — complete

1. Create a home-local `HomePhilosophy.vue` composition under the existing
   route shell, anchored by `#philosophy`. Use `UiContainer` and
   `UiTypography`; express the three values as a semantic list with section
   heading/description and readable DOM order.
2. Implement the distinct card treatment locally from the Figma measurements.
   Do not create or expand a generic Card API: philosophy and services have no
   confirmed shared visual contract.
3. Match the 390 and 1440 layouts with an intrinsic fluid interpolation at
   768 px; verify wrapping, overflow, contrast and focus visibility.

##### E2.4 — Services section — complete

1. Create a home-local `HomeServices.vue`, anchored by `#services`, using
   typed immutable data for the six approved services. Use a semantic list and
   correct heading hierarchy, keeping decorative background content out of the
   accessibility tree.
2. Reuse `UiContainer` and `UiTypography`; retain services-specific visual
   treatment locally instead of abstracting it prematurely. Add narrowly scoped
   tokens only if the inspected Figma nodes prove an existing semantic token
   cannot represent the value.
3. Verify desktop grid/mobile stack, keyboard reading order and that the
   header navigation targets now resolve to real content landmarks.

##### E2.5 — integration, visual comparison and Epic 2 gate — complete

1. Compose the three completed sections in `app/pages/index.vue` without
   moving header/footer into a global layout or changing routes outside scope.
   Reconcile title/description metadata with the approved hero copy only if a
   concrete mismatch remains.
2. Capture deterministic section screenshots at 390 and 1440 px and browser
   proof at 768 px; compare against the exact Figma references and fix only
   measured deviations.
3. Run the full Node 24 gate in `Verification`, including focused and full
   E2E, dependencies/dead code, build/generate/Lighthouse, keyboard/console/
   network checks, secrets and a clean worktree. Update this plan, the ADR
   implementation record and focused test evidence on completion; stop before
   Epic 3 for review.

#### Epic 2 delivery evidence

- `HomePhilosophy.vue` and `HomeServices.vue` now compose the two real content
  landmarks after the static hero. They preserve one document H1; section titles
  are H2 and service titles are H3 in their semantic list order.
- The exact Figma exports are local only: philosophy artwork comes from nodes
  `31:6104`, `31:6105`, `31:6106`; the services wireframe is the local composite
  from `46:1230`; service icons come from `32:6153`, `32:6246`, `144:296`,
  `144:288`, `32:6184` and `32:6191`. All are decorative and therefore use an
  empty alternative text.
- `home.config.ts` provides immutable final copy for three philosophy cards and
  six services. Two narrowly scoped tokens, `--color-service-divider` and
  `--color-service-surface`, document Figma node `31:6064`; no generic card or
  runtime package was added.
- The hero keeps its exact local source and Figma geometry. Nuxt Image delivers
  a preloaded, one-density AVIF derivative at quality 8 for the decorative
  first paint; below-fold artwork remains lazy. This preserves the existing
  Lighthouse gate without introducing a new optimizer.
- Focused component coverage adds philosophy/services semantic-list assertions;
  Playwright checks real navigation targets and section counts in desktop and
  mobile Chromium. Full verification on Node 24.16.0 passed: 31 Vitest tests,
  11 Playwright tests (one existing skip), dependency/cycle/dead-code checks,
  build, generate/link inspection, Lighthouse (all configured assertions),
  secrets check and `git diff --check`.

### Epic 3 — selected projects and process

Goal: встроить существующий CaseCard и реализовать process без дублирования UI
Kit.

- [x] Selected Projects desktop `32:6287` / mobile `144:816`: использовать
      `CaseCard` и существующий typed dataset.
- [x] Перевести case previews на Nuxt Image с intrinsic dimensions, responsive
      sizes и lazy loading; существующий crop contract не менялся.
      contract сохраняется; задать intrinsic dimensions, responsive sizes и lazy
      loading для below-fold images.
- [x] Реализовать утверждённое collection behaviour (native scroll-snap либо
      другой согласованный control), без autoplay по умолчанию.
- [x] Process desktop `46:53` / mobile `144:455`: semantic ordered list из семи
      этапов, responsive decorative line/art и читаемый DOM order.
- [x] Применить шесть generated placeholder alt texts из homepage ADR и
      проверить external case links и touch/keyboard operation.

Completion gate: full epic verification, image/network budget comparison,
keyboard/touch proof и visual comparison всех visible project/process states.

#### Epic 3 execution plan

Execution status: complete on 2026-08-08. Новые runtime packages не требуются: существующие `CaseCard`, Nuxt
Image, native CSS scroll snap, `UiContainer`, `UiTypography`, Vitest и
Playwright покрывают scope.

##### E3.1 — Figma reconfirmation, content and asset contract — complete

1. Перед изменением каждого участка повторно получать context и screenshot для
   desktop `32:6287`/`46:53` и mobile `144:816`/`144:455`. Зафиксировать
   измеримые размеры карточек, gaps, видимый pagination state и оба варианта
   Process art; не строить interaction на основании одного статичного кадра.
2. Использовать `caseCardFixtures` как единственный источник case copy, URLs,
   image crops и внешней-link policy. Заменить шесть generic `Project preview`
   на уже approved placeholder alts в data-layer карточек, а не дублировать
   записи на homepage.
3. Загрузить только необходимые exact Figma Process exports локально. В plan
   записать node IDs, source path, роль и empty `alt`; временные Figma URLs и
   hand-drawn substitute не допускаются. Существующие шесть case PNG повторно
   не экспортировать.

##### E3.2 — CaseCard image-delivery proof and Projects collection — complete

1. Провести small visual spike на первой и второй карточках: добавить exact
   intrinsic dimensions, responsive `sizes` и `loading="lazy"` below fold,
   сохранив desktop/mobile crop variables pixel-for-pixel. Перейти на
   `NuxtImg`/`NuxtPicture` только если compare screenshot докажет отсутствие
   crop regression; иначе оставить native image с explicit dimensions и lazy
   loading. Не изменять CaseCard public API ради одной homepage-композиции.
2. Создать home-local `HomeProjects.vue` с `section#projects`, H2 intro и
   semantic `ul > li > CaseCard` в исходном порядке всех шести fixtures.
   Переиспользовать `UiContainer` и `UiTypography`; не создавать второй card
   component или переносить case copy в `home.config.ts`.
3. Реализовать Figma desktop 820×440 cards и mobile 350 px cards через native
   horizontal scroll container. Применить CSS `scroll-snap-type`,
   `scroll-snap-align`, visible focus и маркировку scroll region для
   keyboard/touch operation. Pagination dots оставить декоративным visual
   state, пока Figma не покажет настоящие controls; не добавлять autoplay,
   carousel library или invented navigation buttons.

##### E3.3 — Process composition and responsive art — complete

1. Создать home-local `HomeProcess.vue` с `section#process`, intro и readable
   `ol` из семи final Figma stages. Section heading остаётся H2, labels stages
   получают H3/semantic equivalent; декоративная линия и grid остаются вне
   accessibility tree.
2. На desktop воспроизвести диагональную композицию labels над exact local art,
   а на mobile — вертикальную sequence с measured 16 px gaps и wrap пятого
   шага. DOM order всегда остаётся 1→7, независимо от visual positioning.
3. Добавить только значения, действительно отсутствующие в tokens, с Figma
   node ID рядом с token; не превращать palette Process в глобальную тему без
   второго consumer.

##### E3.4 — route integration and focused evidence — complete

1. Вставить Projects и Process после Services в `app/pages/index.vue`, не
   менять header/footer, routes, SEO contract или future Feedback/Contact
   placeholders. Проверить, что прежние nav anchors теперь ведут к реальным
   landmarks.
2. Добавить component tests: шесть cards, approved alts, external
   `target`/`rel`, lazy/intrinsic image contract, process `ol` с семью items и
   decorative images. Добавить Playwright: anchors, visible desktop/mobile
   cards, keyboard focus/scroll, touch/manual scroll state, external-link
   attributes и отсутствие horizontal document overflow.
3. Сравнить 390 и 1440 screenshots с Figma, затем browser proof на 768 и
   320 px. Проверить reduced motion, focus visibility, console/network, lazy
   image requests и сохранение card crop. Не принимать visual snapshot как
   единственное доказательство interaction.

##### E3.5 — Epic gate and handoff — complete

1. Выполнить полный Node 24 gate: static quality, full desktop/mobile E2E,
   dependency/cycle/dead-code checks, build, generate/link inspection,
   Lighthouse, secrets и `git diff --check`.
2. Сравнить initial transfer/LCP с Epic 2: case PNG не должны стать eager,
   local Process art не должен блокировать first paint. Исправлять только
   регрессию в Epic 3 scope.
3. После успешного gate обновить Epic 3 checklist, roadmap, Figma asset
   manifest и ADR implementation record. Остановиться перед Epic 4; commit
   делать только после отдельного явного owner instruction.

#### Epic 3 delivery evidence

- `HomeProjects.vue` renders `section#projects` with an SSR semantic list of
  all six existing `CaseCard` fixtures. The native, focusable horizontal
  scroll container uses manual CSS scroll snap and decorative Figma pagination
  dots; it has no autoplay, carousel package or invented controls.
- The six fixture records now carry their approved placeholder alts and
  intrinsic dimensions. Nuxt Image delivers responsive WebP derivatives with
  lazy loading; existing desktop/mobile crop values remain unchanged, so the
  Figma card composition is preserved.
- `HomeProcess.vue` renders `section#process` with an ordered 1→7 DOM sequence.
  The exact Figma SVG exports are local: `46:346` / `46:352` for desktop and
  `144:485` / `144:531` for mobile; both grid and line are decorative with an
  empty `alt`.
- New focused component and E2E coverage proves project/process landmarks,
  item counts, case alt/link contracts and the focusable collection. Full
  Epic 3 verification is recorded after the final Node 24 gate below.

### Epic 4 — feedback, contact and submission boundary

Goal: завершить interaction-heavy часть страницы без фиктивного backend.

- [x] Feedback desktop `46:174` / mobile `144:535`: semantic testimonials и
      утверждённое navigation behaviour; no autoplay unless explicitly required.
- [x] Contact desktop `48:1595` / mobile `144:1236`: собрать поля из `UiInput`,
      consent из `UiCheckbox`, visual submit control из `UiButton`; label и
      Privacy link остаются видимыми и keyboard-safe.
- [x] Не делать submit action и не показывать fake success: форма visual-only.
      Functional submission, validation, anti-abuse и delivery adapter остаются
      отдельной будущей задачей.
- [x] Проверить mobile menu, forms и horizontal collections совместно на
      focus order, Escape/back behaviour и scroll ownership.

Completion gate: full epic verification; visual controls не отправляют данные
и не показывают недостоверный success state.

#### Epic 4 execution plan

Execution status: complete on 2026-08-08. Новые пакеты не потребовались: UI
Kit, Vue/Nuxt, native CSS scroll snap, Vitest и Playwright покрыли утверждённый
scope.

##### E4.1 — lock Figma data and local-art boundary

1. Перед кодированием ещё раз сравнить screenshot/context Feedback
   desktop `46:174` / mobile `144:535` и Contact desktop `48:1595` / mobile
   `144:1236`. Зафиксировать в typed `home.config.ts` три точных testimonial
   records: цитату John Lilic, `Testimonial #1` и `Testimonial #2`; не
   дописывать copy или авторов.
2. Через Figma metadata сузить decorative subtree Feedback и экспортировать
   только утверждённый локальный artwork/indicator. Не переносить сотни vector
   layers вручную, не использовать временный Figma URL и оставить decoration
   вне accessibility tree (`alt=""`, `aria-hidden`).
3. Добавить в home-local config Contact copy и labels: `Start a Project`,
   approved description, `Name`, `Email`, `Message`, consent и `Send request`.
   Desktop Figma-плейсхолдер textarea `Name` не переопределяет принятое
   решение: semantic и visible textarea label остаётся `Message`.
4. `/privacy-policy` остаётся только существующим ссылочным контрактом и
   исключением link checker. Сам route не реализовывать в Epic 4.

##### E4.2 — Feedback section and manual collection

1. Создать `HomeFeedback.vue`: `section#feedback` с `aria-labelledby`,
   `UiContainer`/`UiTypography`, semantic `ul > li > article` и
   `blockquote`/author для каждого testimonial. Сохранить точную desktop
   композицию с тремя cards и mobile 350 px visible card.
2. Сделать collection нативно focusable (`tabindex="0"`), touch/keyboard
   доступной и прокручиваемой вручную через CSS scroll snap. Не добавлять
   autoplay, carousel package, таймер или поведение pagination, которого нет в
   Figma; dots остаются декоративными, пока Figma не покажет controls.
3. Расположить локальный Figma-artwork под cards, с responsive crop по точным
   endpoints. Ввести homepage CSS values только при отсутствующем token и с
   Figma node ID в комментарии; не расширять общий UI Kit ради одной секции.

##### E4.3 — Contact visual-only boundary

1. Создать `HomeContact.vue`: `section#contact` с labelled form. На desktop
   расположить Name/Email в ряд, затем Message; на mobile собрать поля в один
   столбец. Использовать `UiInput` (textarea с Figma-height), `UiCheckbox` и
   `UiButton` без изменения их public API.
2. Связать каждый control с видимым native `label`, передать корректные
   `id`, `name`, `type` и `autocomplete`; consent label должен содержать
   keyboard-safe link `/privacy-policy`. Обеспечить заметный локальный
   `:focus-visible`, включая checkbox с `appearance: none`.
3. Форма может отражать введённые локально значения, но не имеет `action`,
   submit handler, API call, business validation, disabled/loading/error state
   или `UiSuccessNotice`. CTA имеет явный `type="button"`: клик не отправляет
   данные и не создаёт фиктивный success.

##### E4.4 — route integration and focused evidence

1. Вставить Feedback и Contact после Process в `app/pages/index.vue`, не
   менять header/footer, navigation contract, SEO/route ownership или
   будущую Privacy Policy page. Убедиться, что `#feedback`, `#contact` и Hero
   CTA ведут к реальным landmarks в SSR HTML.
2. Добавить focused component/config tests: число и точный текст testimonials,
   quote/author semantics, focusable manual collection, Contact labels, три
   fields, consent/policy link, `button[type="button"]` и отсутствие
   `role="status"`.
3. Добавить Playwright proof на desktop/mobile: anchors, manual feedback
   scroll/focus/touch ownership, visual field entry + consent, CTA без
   navigation/success, visible focus, no document overflow. Сверить
   deterministic screenshots 390 и 1440 с четырьмя Figma endpoints; 768 и
   320 проверить в browser как fluid/overflow proof.

##### E4.5 — Epic gate, documentation and stop

1. Выполнить полный Node 24 gate из раздела Verification, включая static
   quality, desktop/mobile E2E, build/generate/link inspection, Lighthouse,
   dependency/dead-code/secrets checks и `git diff --check`. Проверить form,
   mobile menu и обе horizontal collections совместно: focus order,
   Escape/back behaviour и scroll ownership.
2. После успешного gate обновить Epic 4 checklist, R5 status, Figma asset
   manifest и ADR implementation record с фактами реализации и остаточным
   visual-only boundary. Не менять ADR-решения без нового owner direction.
3. Остановиться до Epic 5. Commit, staging и push делать только по отдельной
   явной инструкции владельца после review.

#### Epic 4 delivery evidence

| Figma node | Local asset                                 | Role                                           | Alt policy                 |
| ---------- | ------------------------------------------- | ---------------------------------------------- | -------------------------- |
| `46:563`   | `public/images/home/feedback-wireframe.svg` | Decorative Feedback wireframe, responsive crop | Empty `alt`; `aria-hidden` |

- `HomeFeedback.vue` renders `section#feedback` with three Figma-approved
  testimonial records as semantic `ul > li > article > blockquote`, a local
  decorative export from Figma node `46:563`, and the existing manual,
  focusable CSS scroll-snap contract. Pagination dots are intentionally
  decorative; no autoplay, timer, carousel package or invented control exists.
- `HomeContact.vue` renders `section#contact` after Process. It reuses
  `UiInput`, `UiCheckbox` and `UiButton`, has labelled Name, Email and Message
  fields, a keyboard-safe `/privacy-policy` link and a visible consent control.
  The CTA is explicitly `type="button"`: there is no action, submit handler,
  API delivery, validation, loading/error state or `UiSuccessNotice`.
- `UiInput` now emits an empty SSR textarea without whitespace children. The
  minimal `sr-only` utility provides accessible labels without changing the
  approved placeholder visual.
- Focused config/component coverage and desktop/mobile Playwright coverage
  verify both new landmarks, testimonial semantics, manual collection focus,
  local field entry/consent, policy href, non-submitting CTA and absence of a
  success region. Node 24 full tests, static quality, dependency/cycle/dead-code,
  secrets, build, generate and `git diff --check` passed. The subsequent final
  Lighthouse audit is explicitly owned by Epic 5 after it identified the
  Contact contrast blocker recorded above.

### Epic 5 — final fidelity, SEO/CWV and reviewed handoff

Goal: доказать целостность Главной и подготовить reviewable local handoff.

- [ ] Сравнить full-page и section screenshots с Figma desktop/mobile;
      исправлять только измеримые deviations, сохраняя semantic constraints.
- [x] Проверить heading/landmark order, keyboard-only path, focus visibility,
      reduced motion, contrast, 320 px minimum и intermediate widths.
- [x] Проверить prerendered HTML, title/description/OG/canonical/schema,
      robots/sitemap, link checker и security headers.
- [x] Провести Lighthouse после clean generate и сравнить с baseline; проверить
      LCP/CLS и JS/image transfer budgets.
- [x] Удалить только доказанно неиспользуемый smoke/dead code и assets.
- [x] Обновить roadmap, ADR consequences, README statement о smoke homepage и
      final evidence. Сделать local commit по явной инструкции owner; не push-ить.

Completion gate: весь scope имеет browser/automated evidence, документация
соответствует коду, Lighthouse gates проходят, local commit reviewable.

#### Epic 5 execution plan

Execution status: complete on 2026-08-08. Epic 5 remained a final fidelity and
release-evidence pass: existing Figma MCP, local assets, native CSS, Vue/Nuxt,
Playwright, Lighthouse CI and project quality scripts were sufficient; no
package was added.

Accepted exception: latest local Lighthouse evidence (2026-08-08 14:32) records
accessibility `0.96`. Its Contact consent/Privacy contrast finding (`4.37:1`)
is owner-accepted delivery debt: do not change the approved visual to address
it in Epic 5. Lighthouse CI uses the same explicit `0.96` minimum, so the gate
remains truthful rather than concealing accepted debt or claiming `1.00`.

##### E5.1 — establish deterministic final comparison evidence

1. Re-read canonical Figma desktop `31:6020` (1440×6575) and mobile `144:233`
   (390×7342) context/screenshots before changing code. Make a compact
   section-by-section discrepancy log for header/hero, Philosophy, Services,
   Projects, Process, Feedback, Contact and footer: position, dimensions,
   typography, crop, colour and visible state.
2. Capture deterministic local Playwright section/full-page screenshots at 1440
   and 390 after fonts and local artwork settle. Use a fixed Chrome version and
   commit no new golden visual baseline until the owner has reviewed the images.
   At 768 and 320, retain browser proof for fluid interpolation and overflow
   rather than inventing a tablet Figma target.
3. Correct only a documented, measurable deviation. Do not replace approved
   local Figma artwork, change final copy, add placeholder assets, redesign the
   UI Kit or add a runtime dependency as part of visual polish.

##### E5.2 — whole-page accessibility and interaction audit

1. Verify the rendered/SSR heading sequence (one H1, section H2/H3 hierarchy),
   header/main/footer landmarks, decorative image exclusion, labelled controls,
   external-link safety and focus visibility on 320, 390, 768 and 1440 px.
   Preserve the Figma Contact H3 visual variant but render it as `h2`, so it
   remains a peer section heading after Feedback rather than an orphan H3.
2. Exercise the complete keyboard path: header links, Hero CTA, both focusable
   manual collections, Contact fields/consent/Privacy link and footer. On
   mobile additionally prove dialog open/close, Escape, selected-link close,
   focus restoration and scroll lock; test touch/manual horizontal scrolling
   without adding carousel controls or autoplay.
3. Confirm reduced-motion behaviour, document overflow absence and
   console/network cleanliness. Contact remains visual-only: no submit, API,
   validation, loading/error/success state or Privacy Policy route.
4. Retain the owner-accepted Contact consent/Privacy contrast finding as
   documented delivery debt. Re-run Lighthouse and keyboard/focus proof, record
   the actual result, and preserve the explicit owner-approved `0.96` Lighthouse
   accessibility minimum rather than falsely reporting `1.00`.

##### E5.3 — production, SEO and performance gates

1. Run the complete Node 24 quality suite, full desktop/mobile Playwright,
   dependency/cycle/dead-code/secrets checks and `git diff --check`. Treat only
   errors or newly introduced warnings as Epic 5 regressions; keep known
   upstream Nuxt/OXC/formatting warnings explicit rather than masking them.
2. From a clean generate, inspect prerendered `/` HTML and output for SSR copy,
   canonical/title/description/OG/Twitter, Organization/WebSite/WebPage schema,
   `lang`, robots, sitemap, security headers and local asset delivery. Verify
   `/` appears while `/__ui-kit` and the deliberately excluded
   `/privacy-policy` do not; the latter remains the sole out-of-scope link
   exception.
3. Run Lighthouse CI after clean static output and compare the category scores,
   LCP/CLS and initial JS/image transfer with the accepted baseline (currently
   920 kB total transfer, 731 kB images, 111 kB scripts and CLS 0). These
   measurements are evidence, not unapproved hard budgets. Preserve configured
   gates (performance ≥ 0.90, accessibility ≥ 0.96, best practices ≥ 0.95,
   SEO = 1.00); record the owner-accepted contrast debt transparently and
   investigate a regression only within final-homepage scope. Stop for owner
   direction if it demands broader architecture work.
4. Verify canonical/robots/sitemap/schema output against the current local/CI
   fallback `https://deploylab.example`. Do not infer a production origin;
   repeat the domain-specific evidence only when the owner supplies
   `NUXT_PUBLIC_SITE_URL` at a later stage.

##### E5.4 — prove or remove remaining smoke debt

1. Use `rg`, dependency checks and production output inspection to identify
   only genuinely unused files, imports and dependencies. The smoke 3D consumer
   is already removed; delete an item only with evidence that it has no runtime,
   test, documentation or tooling consumer, and do not manufacture cleanup
   work or remove retained platform capabilities speculatively.
2. Correct `README.md` and homepage documentation from the obsolete “technical
   smoke surface” statement to the implemented Figma homepage, preserving the
   real static deployment and visual-only Contact limitations.

##### E5.5 — final documentation and reviewed handoff

1. Update the Epic 5 checklist, R6, final Figma comparison evidence, known
   warnings and ADR consequences with only facts proven by the completed gate.
   Do not create a new ADR unless a durable decision changes.
2. Present the complete local commit and verification record for owner review.
   Push and PR still require a new explicit owner instruction, and no work may
   continue beyond Epic 5.

#### Epic 5 delivery evidence

- Re-read the canonical Figma desktop/mobile endpoints (`31:6020`, `144:233`)
  and compared local whole-page captures at 1440 and 390 px. Browser checks at
  320 and 768 px confirm no document horizontal overflow. The Contact title is
  now semantic `h2` while retaining the approved `h3` visual treatment.
- The visual-only Contact checkbox has an explicit accessible name; the CTA
  remains `type="button"`, does not navigate and creates no success state.
  Full Playwright proof passed: 15 tests across desktop/mobile Chromium, with
  the desktop-only mobile-menu scenario intentionally skipped.
- `pnpm build`, `pnpm generate` and link inspection passed. Prerendered output
  contains SSR copy, canonical/OG/schema and `https://deploylab.example/` in
  robots/sitemap. This is the documented temporary fallback until
  `NUXT_PUBLIC_SITE_URL` is provided; neither `/__ui-kit` nor
  `/privacy-policy` is a production sitemap route.
- Lighthouse CI passed its configured gates after clean generation: performance
  `0.90`, accessibility `0.96`, best practices `1.00`, SEO `1.00`; LCP was
  3596 ms, CLS `0` and total transfer 921 kB. The accepted Contact contrast
  finding remains explicitly documented debt, not a claim of 1.00 accessibility.
- No remaining smoke/3D consumer or direct runtime dependency was found for
  cleanup. README now describes the implemented Figma homepage and the
  visual-only form boundary. The current developer-only Nuxt Hints hydration
  telemetry warnings/400 responses and upstream OXC warning are known tool
  noise; they did not fail build or E2E and were not hidden.

### Roadmap

| Milestone | Deliverable                                         | Dependency                 | Status   |
| --------- | --------------------------------------------------- | -------------------------- | -------- |
| R0        | Exact Figma/code/UI Kit inventory and baseline      | Figma read access, Node 24 | Complete |
| R1        | Approved contract and homepage ADR                  | Owner answers              | Complete |
| R2        | Local assets, tokens, semantic shell and navigation | R1, approved Epic 1 plan   | Complete |
| R3        | Hero, philosophy and services                       | R2                         | Complete |
| R4        | Selected projects and process                       | R3                         | Complete |
| R5        | Feedback and contact boundary                       | R4                         | Complete |
| R6        | Full fidelity, SEO/CWV and reviewed handoff         | R5                         | Complete |

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
- owner просит включить не реализованную `/privacy-policy` page в текущий
  scope; до такого решения ссылка остаётся принятым out-of-scope contract;
- asset usage rights не подтверждены либо доступен только временный Figma URL;
- exact Figma visual требует сохранить/расширить 3D, external script,
  `ClientOnly`, новую runtime dependency или иной rendering profile;
- Lighthouse/SEO/accessibility gate регрессирует и исправление выходит за
  границы активного эпика;
- возникает необходимость изменить Figma, public route contract или второй
  page/layout ownership без отдельного подтверждения.

Task complete после Epic 5, полного evidence и local commit, explicitly
authorised by the owner. Push/PR остаются отдельным действием после approval.

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
