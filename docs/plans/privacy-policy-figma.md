# Privacy Policy implementation plan

Status: Epic 4 in review; Epics 0–3 complete

Last updated: 2026-08-08

## Goal

Реализовать публичную страницу `/privacy-policy` по каноническим Figma-экранам,
используя предоставленный английский контент, существующий Nuxt 4/Vue 3 UI Kit
и статический SSR/prerender-профиль проекта. Страница должна совпадать с Figma
на 1440 и 390 px, оставаться семантической, доступной, индексируемой и не
ухудшать Главную.

Канонические design endpoints:

- [Privacy Policy, desktop / 153:52](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=153-52&p=f&m=dev) — 1440×1533;
- [Privacy Policy, mobile / 153:123](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=153-123&p=f&m=dev) — 390×1843;
- [Главная, desktop / 31:6020](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=31-6020&p=f&m=dev) — источник существующих shell/UI Kit-паттернов.

## Non-goals

- Не менять текст политики без owner/legal approval и не давать юридических
  гарантий от имени DeployLab.
- Не добавлять cookie banner, consent manager, analytics, форму, backend,
  мультиязычность, CMS UI или новые legal pages.
- Не изменять Figma и не добавлять Code Connect.
- Не перерабатывать Главную или UI Kit за пределами минимального общего seam,
  подтверждённого вторым маршрутом.
- Не добавлять runtime-зависимости без доказанного пробела и отдельного
  согласования.
- Не коммитить, не пушить и не публиковать изменения до явного owner review.

## Constraints

### Подтверждённый контекст

- Рабочая ветка `codex/privacy-policy-figma` перебазирована на актуальный
  `origin/main` (`146a575`) после merge homepage-ветки.
- На старте публичный URL `/privacy-policy` уже был принят в homepage ADR и
  использовался в Contact/Footer, но был временно исключён из link checker и
  Nitro prerender; реализация убрала оба исключения.
- Figma-контент — заглушка. Figma задаёт layout, цвета, типографические уровни,
  desktop/mobile endpoints и shell; production copy приходит из переданного
  `content.md`.
- В Figma нет новых растровых assets. Mobile header содержит menu toggle;
  desktop header содержит только бренд.
- Доступны `UiContainer`, `UiTypography`, `UiMenuToggle` и существующие CSS
  tokens. Form primitives и `CaseCard` этой странице не нужны.
- На старте `HomeHeader`, `HomeMobileNavigation` и `HomeFooter` были home-owned.
  Реализация сохранила отдельные desktop headers и вынесла только доказанный
  второй use case: site-owned footer и route-aware mobile navigation.
- Nuxt Content и Zod уже установлены; к исходной коллекции `news` добавлена
  отдельная `legal`. Новая библиотека для Markdown или prose не понадобилась.
- Проект требует Node 24.16.0 и pnpm 11.5.2. Они доступны через NVM/Corepack;
  команды задачи должны явно использовать pinned toolchain, а не системные
  Node 22.11.0/pnpm 11.16.0.
- Канонический production domain ещё не задан; текущий принятый fallback —
  `https://deploylab.example`.

### Подтверждённые product/legal решения

1. `content.md` публикуется дословно; подтверждённые replacements —
   `August 8, 2026` и `hello@deployteam.io`. Непредоставленные юридические факты
   не выдумываются и остаются явными placeholders.
2. `/privacy-policy` индексируется и включается в prerender, sitemap, canonical
   и обычный link checking.
3. Контент хранится в отдельной типизированной Nuxt Content collection `legal`.
4. Mobile menu использует primary navigation с абсолютными ссылками
   `/#section`, brand ведёт на `/`; desktop Privacy header остаётся без nav/CTA
   по Figma.
5. Утверждён SEO title `Privacy Policy | DeployLab`; description пересказывает
   только одобренный policy copy.
6. Footer сохраняет утверждённый Figma year `2025`. Отдельный production
   canonical domain не подтверждён, поэтому сохраняется существующий runtime
   fallback до настройки окружения.

Юридический review является owner responsibility. Официальные Article 13/14
checklists требуют, в зависимости от применимого права и обработки, точную
идентичность controller, lawful bases, recipients/transfers, retention,
применимые права и канал жалобы. Эти факты нельзя выводить из макета или кода.

## Ownership seam

- `app/pages/privacy-policy.vue` владеет route composition, metadata и
  семантическим `main/article`.
- Источник copy после owner decision живёт либо в `content/legal/` с отдельной
  schema/query boundary, либо page-local; одновременно оба подхода не
  используются.
- `UiContainer` владеет общими fluid gutters; `UiTypography` — Figma-уровнями
  H1–H4. Абзацы, списки, ссылки и email остаются нативной semantic prose
  разметкой.
- Общий shell извлекается только в подтверждённом объёме. Предпочтительный
  вариант: общий `SiteFooter` и route-aware mobile navigation; desktop Privacy
  header остаётся отдельной композицией, потому что Figma не показывает desktop
  navigation/CTA.
- `app/layouts/default.vue` не превращается автоматически в глобальный
  header/footer: разные desktop-композиции должны оставаться явными.

### Architecture test для новых границ

- Проблема: home-only hash links не работают на `/privacy-policy`, а footer и
  mobile navigation становятся реальным вторым use case.
- Более простой вариант — дублирование — сохраняет неверную ownership-модель и
  создаёт два источника navigation/footer copy. Полный global layout, напротив,
  шире необходимого и конфликтует с разными desktop headers.
- Минимальное извлечение усложняет пропсы route-aware destinations и требует
  регрессии Главной, но не меняет UI Kit API.
- При росте числа обычных страниц общий footer/mobile navigation масштабируются;
  page-specific desktop headers остаются независимыми. Generic `UiProse` не
  добавляется до второго реального prose consumer.

## Plan

### Epic 0 — решения владельца, ADR и воспроизводимый baseline

Status: Complete

1. Получить ответы на семь вопросов из `Constraints`; не заменять отсутствующие
   юридические, navigation или SEO факты предположениями.
2. После подтверждения создать один ADR
   `docs/decisions/privacy-policy-architecture.md`: content ownership, ровно тот
   общий site-shell seam, который одобрен, и включение `/privacy-policy` в
   production SEO/prerender contract. Не переписывать исторический homepage ADR.
3. Перейти на Node 24.16.0/pnpm 11.5.2, выполнить `pnpm setup:doctor` и снять
   baseline полного gate до изменений.
4. Зафиксировать Figma acceptance measurements: 80 px header, title band,
   desktop 80 px gutters и 840 px prose measure, mobile 20 px gutters,
   40/80 px section padding, 40 px block gaps, footer geometry и уровни
   H1/H2/H3/H4.

Acceptance: ADR отражает только подтверждённые durable decisions; baseline
воспроизводим на pinned toolchain; нет изменений production code.

Baseline evidence — 2026-08-08: `setup:doctor`, typecheck, Stylelint, slop scan
и 39 Vitest tests прошли на Node 24.16.0/pnpm 11.5.2. ESLint прошёл без ошибок
с 15 существующими style warnings вне Privacy scope.

Epic 0 delivery evidence — 2026-08-08: branch rebased onto `origin/main`
`146a575`; accepted decisions are recorded in the Privacy Policy ADR; intake,
format, static quality, 39 Vitest tests, dependency/cycle/dead-code checks,
build, generate, Lighthouse, Gitleaks and Git diff checks passed. Full clean
Playwright baseline passed 19 scenarios with 3 intentional breakpoint skips.
The sitemap assertion now uses Playwright's raw HTTP request seam so browser
XSL rendering cannot make concurrent projects observe different payloads.

Testing gate: полный текущий gate без UI-изменений — format, typecheck, lint,
stylelint, slop scan, unit, Playwright, dependency/cycle/dead-code, build,
generate, Lighthouse, secrets и Git checks. Падения baseline документируются и
не маскируются реализацией.

### Epic 1 — content contract, маршрут и семантический документ

Status: Complete

1. Создать один canonical content source выбранного типа. При Nuxt Content —
   добавить непересекающуюся `legal` page collection со schema для title,
   description и `updatedAt`, перенести одобренный Markdown без изменения
   смысла и запросить ровно `/privacy-policy`.
2. Создать `app/pages/privacy-policy.vue` с SSR/prerendered content, одним H1,
   последовательными H2/H3, настоящими `ul/li`, ссылкой `mailto:` и
   предусмотренным empty/not-found состоянием для content query.
3. Добавить согласованные `useSeoMeta`/canonical inputs. Не добавлять JSON-LD,
   `ClientOnly`, `ssr: false`, browser fetch или клиентское состояние без
   отдельной необходимости.
4. Добавить focused Nuxt tests на полный approved copy, heading outline,
   списки, email/date и отсутствие placeholder-текста Figma.

Acceptance: весь одобренный legal text находится в prerender-capable boundary,
контент имеет один источник истины, семантика не зависит от CSS или JS.

Testing gate: полный gate после эпика плюс проверка generated HTML на полный
policy copy. При Nuxt Content отдельно проверить schema/query/render contract.

Delivery evidence — 2026-08-08: добавлена отдельная schema-validated collection
`legal`, canonical Markdown source и SSR route с 1 H1, 11 H2, 2 H3, нативными
списками и `mailto:`. Generated HTML содержит согласованный copy, дату,
canonical и не зависит от client-only fetch. Focused content/E2E tests и полный
static gate прошли; итоговый suite содержит 42 Vitest tests.

### Epic 2 — UI Kit composition и responsive Figma fidelity

Status: Complete

1. Собрать title band и long-form content через `UiContainer`,
   `UiTypography` и существующие tokens; Figma node IDs указать рядом с
   driven CSS. Нативные prose elements не оборачивать в новый generic
   компонент.
2. Реализовать natural-height layout: никаких фиксированных высот контента из
   placeholder frame. Сохранить 840 px desktop measure, mobile full measure,
   fluid intermediate layout и перенос длинных ссылок.
3. Реализовать одобренный Privacy header/footer и route-aware navigation seam.
   Brand возвращает на `/`; mobile menu не использует локальные hash links
   legal page. Desktop не получает отсутствующие в Figma nav/CTA.
4. Сверить 1440×1533 и 390×1843 с Figma, а 320/768/1920 использовать только
   для доказательства fluid layout и отсутствия horizontal overflow.
5. Проверить порядок фокуса, visible focus, keyboard/touch/Escape/focus restore
   для mobile menu, если он одобрен.

Acceptance: visual endpoints совпадают по цветам, typography hierarchy,
gutters, measure, gaps и shell; длинный реальный контент расширяет страницу без
обрезки; Главная визуально и функционально не изменилась сверх approved seam.

Testing gate: полный gate после эпика, focused desktop/mobile Playwright,
browser screenshots, console/network inspection и регрессия существующих
HomeHeader/HomeMobileNavigation/HomeFooter сценариев.

Delivery evidence — 2026-08-08: Privacy shell использует `UiContainer`,
`UiTypography`, `UiMenuToggle`, новый site-owned footer и route-aware native
dialog navigation. Измеренный browser layout: header 80 px, title band 190 px
desktop/124 px mobile, content padding 80 px, desktop prose 840 px при x=80,
H1 64/40 px и footer 108/132 px. Overflow отсутствует на
320/390/768/1440/1920; чистый Privacy tab не содержит console errors/warnings.
Контрольные 1440/390 snapshots сняты в локальном browser-сеансе.

### Epic 3 — public route, SEO/discovery и доступность

Status: Complete

1. Удалить ровно два временных исключения `/privacy-policy` из link checker и
   Nitro prerender; не менять deployment strategy.
2. Проверить status/security headers, canonical, title/description, sitemap и
   присутствие policy route/copy в `.output/public/privacy-policy/index.html`.
3. Добавить E2E-путь с Главной через Contact/Footer на Privacy Policy и обратно
   через brand/navigation; self-link footer не должен ломать keyboard flow.
4. Провести UI-quality audit: landmarks, heading order, list semantics,
   distinguishable links, contrast, focus, long-form readability, 200% zoom,
   reduced motion и отсутствие overflow.
5. Добавить `/privacy-policy` в Lighthouse evidence. Новый axe-пакет не
   добавлять: он не нужен для этой страницы без отдельного системного scope.

Acceptance: route входит в static release/discovery contract, индексируемый
контент присутствует без hydration, navigation работает с обеих страниц,
accessibility/CWV gates не хуже принятых проектом.

Testing gate: полный gate после эпика, включая build, generate, link/sitemap
inspection, оба Playwright проекта, Lighthouse и browser proof.

Delivery evidence — 2026-08-08: временные route exclusions удалены; prerender
crawler и link checker обрабатывают две публичные страницы без ошибок, sitemap
содержит `/privacy-policy`, generated route содержит copy/canonical. Полный
Playwright: 25 passed, 5 intentional breakpoint skips; mobile dialog проверен
на Escape и focus restore, cross-route footer/brand path — в обоих проектах.
Lighthouse после добавления Privacy URL: Privacy 0.98/1/1/1 и Главная
0.99/0.96/1/1 (performance/accessibility/best practices/SEO). Для стабильности
существующего Home LCP boolean preload заменён на официальный Nuxt Image
priority-hint object; пороги не менялись.

### Epic 4 — финальная регрессия, документация и review handoff

Status: In review

1. Повторно сверить фактические 1440/390 screenshots с Figma; закрывать
   расхождения только измерениями, не масками и magic offsets.
2. Запустить финальный полный gate на pinned toolchain; проверить no unintended
   dependencies/assets/client chunks, `git diff --check` и scoped status.
3. Обновить этот plan фактическими status/evidence. ADR менять только если
   durable decision реально изменилось; README и другие docs не дублировать.
4. Передать uncommitted diff владельцу с локальным URL и коротким визуальным
   checklist. Дождаться явного approve/reject.
5. Коммит возможен только отдельной командой владельца после review; push,
   PR и deploy остаются отдельными действиями.

Acceptance: все эпики имеют фактическое evidence, полный diff просмотрен
владельцем, открытых blocker нет, но commit отсутствует до отдельного
разрешения.

Current evidence — 2026-08-08: format, typecheck, Stylelint, slop scan, 42
Vitest tests, 25 Playwright scenarios, dependency/cycle/dead-code checks,
build, generate, generated HTML/sitemap assertions, link checker, Lighthouse,
Gitleaks и Git integrity прошли. ESLint — 0 errors и 15 существующих warnings.
Новые packages/assets отсутствуют. Working tree намеренно не staged и не
committed; завершение R4 ожидает owner visual/diff review.

## Roadmap

| Milestone | Deliverable                                      | Dependency       | Status    |
| --------- | ------------------------------------------------ | ---------------- | --------- |
| R0        | Owner decisions, ADR и clean baseline            | Ответы владельца | Complete  |
| R1        | SSR content contract и semantic route            | R0               | Complete  |
| R2        | Figma-matched responsive UI и approved site seam | R1               | Complete  |
| R3        | SEO/discovery, a11y и cross-route integration    | R2               | Complete  |
| R4        | Full regression evidence и uncommitted review    | R3               | In review |

Status этого документа обновляется после каждого эпика. Добавляется только
фактическое evidence: результаты проверок, измеренные Figma/browser deltas и
оставшийся риск — без command logs и дневника попыток.

## Verification

После каждого implementation-эпика выполнить полноценную проверку, как требует
задача:

1. `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:styles`,
   `pnpm slop-scan`, `pnpm test:unit`.
2. Focused и затем полный Playwright в desktop Chromium и mobile Chrome;
   screenshot proof на 1440/390 и overflow proof на 320/768/1920.
3. `pnpm deps:check`, `pnpm deps:cycles`, `pnpm dead-code` после изменения
   component/content boundary.
4. `pnpm build`, `pnpm generate`; проверить generated policy HTML, canonical,
   sitemap, security headers и отсутствие временного route exclusion.
5. `pnpm lighthouse` с включённым Privacy route; keyboard, focus, zoom,
   contrast, reduced-motion, console и network browser audit.
6. `pnpm secrets:check`, `git diff --check`, `git status --short`.

В отчёте после эпика указывать фактические команды, pass/fail, browser URL и
viewport, screenshot path, оставшийся риск и следующий шаг. Failed gate не
закрывается retry или формулировкой «не относится» без доказательства.

## Risk and stop condition

Остановиться и запросить решение владельца, если:

- legal copy, controller identity, contact/domain, date, jurisdiction,
  processors/cookies или SEO copy не подтверждены;
- mobile menu behaviour или shared shell boundary остаются неоднозначными;
- реализация требует нового runtime package, global layout redesign,
  ClientOnly/`ssr: false`, внешнего сервиса, Figma write или public contract
  вне этого плана;
- Figma endpoint/context становится недоступен до визуального сравнения;
- реальный контент требует layout, которого нет в Figma и нельзя вывести из
  существующей fluid-системы без продуктового решения;
- полный gate показывает регрессию Главной, SEO, accessibility или CWV, которую
  нельзя устранить внутри активного эпика.

План разрешает только подготовку и реализацию после owner approval. Он не даёт
разрешения на commit, push, PR, deploy или изменение Figma.
