---
name: deploy-lab-ui-browser-verification
description: 'Собирает браузерное доказательство изменённого UI DeployLab: focused E2E, screenshot и console/network observations. Используй когда меняется пользовательский интерфейс, responsive layout или интерактивность. НЕ используй для изменения модульных границ — вместо этого используй deploy-lab-architecture-refactor.'
disable-model-invocation: true
---

## Instructions

1. Найди самый узкий тест в `test/e2e/` для изменённого пользовательского пути; не выдавай статическую проверку за визуальное доказательство.
2. Запусти этот Playwright-тест с нужным проектом; если такого теста нет, обоснуй минимальный новый сценарий до его создания.
3. Открой только одобренный локальный origin в изолированной сессии Playwright MCP и сохрани screenshot изменённого состояния.
4. Для responsive/layout изменений сделай ещё один screenshot в mobile viewport (например, preset "mobile" в браузерном MCP), а не только desktop — многие layout-баги видны только на узком экране.
5. Проверь консоль и нужные сетевые запросы через Playwright MCP или Chrome DevTools MCP, не раскрывая cookies, токены, заголовки или данные внутренних сервисов.
6. Сообщи URL, viewport/сценарий, путь к screenshot, результат E2E и все оставшиеся риски; примени `deploy-lab-plain-language-handoff`, если задача видима пользователю.
