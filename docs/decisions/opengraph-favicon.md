# Open Graph и favicon DeployLab

Принято 2026-11-15.

## Контекст

У каждой страницы уже свои заголовок, описание и `og:type`. Канонический
origin задаётся через `NUXT_PUBLIC_SITE_URL`, а Nuxt SEO дополняет метаданные
при рендеринге. В UI KIT есть готовая обложка и два варианта favicon.

## Решение

- Используем [обложку 154:189](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=154-189)
  на всех страницах. Экспортируем её в PNG 1200×630 и публикуем как
  `/images/social/deploylab-v1.png`. У каждой страницы остаются собственные
  заголовок и описание.
- Используем [чёрный Frame 101, 154:168](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=154-168)
  с зелёным `[D]`. В общем head указываем PNG 96×96 по стабильному URL
  `/favicon-96.png`. Сохраняем традиционный путь `/favicon.ico` с экспортом
  знака 32×32.
- Общая обложка объявляется в Nuxt через `useSeoMeta`. В сгенерированном
  HTML указываем абсолютные OG/X URL, alt, тип и размеры OG PNG. Используем
  `summary_large_image` для X.
- Превью принимаем в Telegram, LinkedIn, Facebook и X. Для favicon проверяем
  браузеры и доступность для Google Search.

Готовый экспорт сохраняет утверждённую графику. Nuxt SEO разрешает пути
к изображениям относительно канонического origin, а существующий Caddy
отдаёт файлы из результата сборки. Это позволяет обойтись штатными
зависимостями и проверять именно тот HTML, который получают краулеры.

При следующем обновлении обложки меняем версию в имени файла для повторного
сканирования соцсетями. URL favicon сохраняем стабильным. [Open Graph](https://ogp.me/) ·
[Meta Sharing](https://developers.facebook.com/documentation/sharing/webmasters) ·
[LinkedIn](https://www.linkedin.com/help/linkedin/answer/a521928) ·
[Google Search Central](https://developers.google.com/search/docs/appearance/favicon-in-search)
