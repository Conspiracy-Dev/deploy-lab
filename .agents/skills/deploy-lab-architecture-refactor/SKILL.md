---
name: deploy-lab-architecture-refactor
description: Аудирует и рефакторит ответственности модулей, публичные контракты, направление импортов и сложность DeployLab. Используй для декомпозиции или архитектурного аудита нескольких связанных модулей. НЕ используй для SEO/CWV работы страницы — вместо этого используй deploy-lab-seo-cwv.
disable-model-invocation: true
---

## Instructions

1. Прочитай `.cursor/rules/architecture-refactoring.mdc`, затронутый контракт, его тесты и текущее направление импортов до редактирования.
2. Назови фактический шов ответственности: rendering, lifecycle, transformation, delivery, integration или configuration; размер файла сам по себе не является швом.
3. Оставь публичный surface явным через boundary export, а feature-private детали — прямыми локальными импортами; не меняй публичный API без запроса.
4. Извлеки только независимую ответственность, не добавляя generic `utils`, глобальный store, manager или новый слой без двух реальных потребителей.
5. Проверь `pnpm deps:check`, `pnpm deps:cycles`, lint complexity и сфокусированные тесты; покажи до/после по обязанностям, а не только числу строк.
