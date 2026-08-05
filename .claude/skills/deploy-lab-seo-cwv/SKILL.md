---
name: deploy-lab-seo-cwv
description: Изменяет SEO-контракт и SSR/prerender/CWV индексируемых Nuxt-страниц DeployLab. Используй для metadata, structured data, canonical/robots/sitemap, rendering strategy или Core Web Vitals. НЕ используй для разделения модульных ответственностей — вместо этого используй deploy-lab-architecture-refactor.
disable-model-invocation: true
---

## Instructions

1. Прочитай `.cursor/rules/nuxt-seo-cwv.mdc`, целевую страницу и её SEO-тест до изменения.
2. Определи индексируемый контракт: семантический HTML, title/description, canonical, robots, sitemap и structured data, если он нужен странице.
3. Выбери SSR или prerender для индексируемого содержания; ограничь browser-only enhancement минимальным островком и не добавляй `ClientOnly` или `ssr: false` без причины в задаче.
4. Реализуй метаданные через Nuxt composables и сохрани единый источник site origin через runtime config.
5. Защити CWV: не добавляй лишний client JavaScript, резервируй место для визуальных элементов, откладывай необязательную 3D-графику и учитывай reduced motion.
6. Запусти сфокусированный SEO-тест; при UI-изменении получи browser proof по deploy-lab-ui-browser-verification и сообщи изменившийся публичный SEO-контракт.
