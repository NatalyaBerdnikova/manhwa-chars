# manhwa-chars — Чернильный атлас

Статический каталог персонажей манхвы в виде витрины: одна ссылка на страницу, русский и английский переключаются в браузере. После сборки получается папка `dist/` — её можно выложить на GitHub Pages, Netlify, Cloudflare Pages или любой другой хостинг без сервера.

Каталог собирается из `data/mangabuff/import.json`. Повторный запуск `npm run import:mangabuff` дописывает персонажей, чьи картинки уже лежат в `data/mangabuff/images` или в `src/assets/library`. Персонаж без основного изображения в файлы сайта не попадает.

## Требования

- Node.js **22.23.4** или новее
- npm **9.6.5** или новее

## Локальный запуск

```bash
npm install
npm run dev
```

Сайт откроется на [http://127.0.0.1:4471/manhwa-chars/](http://127.0.0.1:4471/manhwa-chars/). Адрес с подпутём такой же, как на GitHub Pages: в `site.config.json` задан `base`. `npm install` также ставит git-хук, который оптимизирует новые картинки перед коммитом.

## Сборка

```bash
npm install
npm run build
```

Готовый сайт лежит в `dist/`. Проверка типов: `npm run check`. Проверка, что для каждого исходного JPG/PNG уже собраны WebP и AVIF: `npm run images:check`.

## Структура

```text
site.config.json          адрес сайта, базовый путь, адрес формы, имя владельца
telegram-relay/           Cloudflare Worker: заявка уходит в Telegram
src/i18n/ui/ru.json       строки интерфейса по-русски
src/i18n/ui/en.json       строки интерфейса по-английски
src/data/tags.json        категории и значения меток
src/content/works/        произведения, по одному Markdown-файлу
src/content/characters/   персонажи, по одному Markdown-файлу
src/assets/source/        исходные JPG/PNG, которые правите вы
src/assets/optimized/     WebP и AVIF, которые собирает скрипт
src/pages/                русские страницы
src/pages/en/             английские страницы
public/                   иконка, заголовки для Netlify/Cloudflare
```

Адрес страницы персонажа совпадает с именем файла: `lien-sol.md` → `/characters/lien-sol/` и `/en/characters/lien-sol/`. Имя файла — латинский идентификатор из строчных букв, цифр и дефисов.

Поля `ru` обязательны. Поле `en` можно не писать: тогда на английской странице останется русский текст и появится короткая пометка, что перевода ещё нет. Так сделано у примера «Юна Рек».

Черновик не попадает на сайт: добавьте `draft: true` в шапку файла.

## Как добавить произведение

1. Создайте `src/content/works/my-story.md`.
2. Положите обложку в `src/assets/source/works/my-story.png` (или `.jpg`).
3. Закоммитьте файл или выполните `npm run images`. Появится `src/assets/optimized/works/my-story.webp`.
4. В шапке укажите этот WebP.

```yaml
---
title:
  ru: "Новая история"
  en: "A New Story"
originalTitle: "Original Title"
altTitles:
  - "Другое название"
description:
  ru: "Одно-два предложения."
  en: "One or two sentences."
cover: "../../assets/optimized/works/my-story.webp"
year: 2026
author: "Имя автора"
status: "ongoing"   # ongoing, completed или hiatus
---

Дополнительный текст на русском. Можно с **разметкой**.

<!-- lang:en -->

Optional longer English text.
```

`status`: `ongoing` — онгоинг, `completed` — завершено, `hiatus` — перерыв.

## Как добавить персонажа

1. Создайте `src/content/characters/anna-lee.md`.
2. Положите фигуру в `src/assets/source/characters/anna-lee.png`. Лучше всего — вырезка в полный рост с прозрачным фоном (см. ниже).
3. Соберите WebP тем же хуком или командой `npm run images`.
4. В поле `work` укажите имя файла произведения без `.md`.

```yaml
---
name:
  ru: "Анна Ли"
  en: "Anna Lee"
work: "my-story"
image: "../../assets/optimized/characters/anna-lee.webp"
hoverImage: "../../assets/optimized/characters/anna-lee-alt.webp"
featured: false
added: "2026-11-09"
tags:
  hair: "black"
  eyes: "amber"
bio:
  ru: "Короткая биография для карточки."
  en: "Short biography used on the card."
---

Абзац подлиннее, если нужно.

<!-- lang:en -->

A longer paragraph, if you want one.
```

`featured: true` ставит персонажа в блок «Избранные» на главной. `added` — дата `ГГГГ-ММ-ДД`, по ней сортируется блок «Недавно добавленные». Метки необязательны: можно указать только те категории, которые подходят.

Картинка персонажа лучше всего выглядит как вырезка: фигура в полный рост, фон прозрачный (PNG). Тогда она стоит на подиуме на странице персонажа и при наведении «выходит» вверх из светлой плитки в каталоге. JPEG прозрачность не хранит — для персонажей он не подходит. Обложки произведений можно оставлять обычным JPEG или PNG с фоном.

Второе изображение — другая поза для наведения. Поле необязательное. Если его нет, карточка только увеличивается, картинка не меняется. Имя поля любое из двух: `hoverImage` или `imageAlt`. Если указаны оба, берётся `hoverImage`.

```yaml
hoverImage: "../../assets/optimized/characters/anna-lee-alt.webp"
# то же самое поле можно назвать так:
# imageAlt: "../../assets/optimized/characters/anna-lee-alt.webp"
```

Файл кладётся рядом с основным: `src/assets/source/characters/anna-lee-alt.png`. Дальше `npm run images` (или коммит — хук сделает то же для индексированных исходников). В примерах каталога такой вариант уже есть у каждой фигуры; у «Орфея Даля» он записан как `imageAlt`, у остальных как `hoverImage`.

На сенсорном экране и при `prefers-reduced-motion: reduce` плитка не выпрыгивает и не меняет кадр: остаётся спокойная карточка, ссылка работает как обычно.

Ключ метки — это `id` категории из `src/data/tags.json`, значение — `id` внутри этой категории. Неизвестная пара останавливает сборку и пишет, что именно добавить в файл меток.

## Как добавить категорию меток

Откройте `src/data/tags.json` и добавьте объект в массив `categories`. Код страниц менять не нужно: категория сама появится в фильтрах, в справочнике `/tags/` и на страницах `/tags/новый-id/`.

```json
{
  "id": "weapon",
  "label": { "ru": "Оружие", "en": "Weapon" },
  "description": {
    "ru": "Чем персонаж сражается.",
    "en": "What the character fights with."
  },
  "values": [
    { "id": "sword", "label": { "ru": "Меч", "en": "Sword" } }
  ]
}
```

`id` — латинский идентификатор: строчные буквы, цифры, дефисы. Он попадает в адрес (`/tags/weapon/sword/`) и не переводится. `label.ru` обязателен, `label.en` желателен. `description` можно не писать.

Дальше у персонажа:

```yaml
tags:
  weapon: "sword"
```

## Как добавить значение метки

В уже существующей категории допишите элемент в `values`:

```json
{ "id": "bow", "label": { "ru": "Лук", "en": "Bow" } }
```

Идентификатор должен быть уникален внутри своей категории. После этого его можно ставить персонажам. Страница значения собирается сама, даже если им ещё никто не отмечен.

## Переводы

У каждой страницы один адрес. Префикса `/en/` нет, отдельных английских URL нет, и в sitemap нет `hreflang`.

Оба языка уже лежат в HTML. Крошечный скрипт в `<head>` до первой отрисовки ставит `lang` и `data-lang`:

1. Если человек уже нажимал RU или EN, берётся значение из `localStorage` (`lang`).
2. Иначе смотрится `navigator.languages`: код, который начинается с `en`, даёт английский; с `ru` — русский.
3. Если ни то ни другое, остаётся русский.

Переключатель в шапке записывает выбор в `localStorage` и сразу меняет видимый текст. Без JavaScript виден русский: английские куски скрыты стилем, пока на `<html>` нет `data-lang="en"`.

Поисковики в основном проиндексируют русскую версию: заголовок, описание, Open Graph и JSON-LD отдаются по-русски без выполнения скрипта. Английский текст есть в странице, но для робота это не отдельный URL. Это осознанный обмен: мгновенное переключение и простые ссылки вместо двух копий каждой страницы.

Строки интерфейса:

- `src/i18n/ui/ru.json`
- `src/i18n/ui/en.json`

Ключи должны совпадать. В тексте можно подставлять `{name}`, `{title}`, `{n}`.

Тексты произведений, персонажей и меток переводятся полями `ru` и `en`. Длинный текст под шапкой Markdown делится маркером:

```md
Русский абзац.

<!-- lang:en -->

English paragraph.
```

Маркер на сайте не показывается. Если английского куска нет, при английском интерфейсе остаётся русский текст и короткая пометка. Так сделано у примера «Юна Рек».

## Адрес сайта и базовый путь

Оба значения правятся в одном месте — `site.config.json`:

```json
{
  "url": "https://natalyaberdnikova.github.io",
  "base": "/manhwa-chars/"
}
```

Переменные окружения перекрывают файл, это удобно в CI:

| Переменная | Зачем |
| --- | --- |
| `SITE_URL` | Полный адрес сайта, лучше только домен, без хвоста `/` |
| `BASE_PATH` | Подпуть, если сайт лежит не в корне. Пример: `/repo-name/` |
| `PUBLIC_FORM_ENDPOINT` | Адрес Cloudflare Worker, который шлёт заявку в Telegram |
| `PUBLIC_TURNSTILE_SITE_KEY` | Необязательный ключ виджета Cloudflare Turnstile |

Пример лежит в `.env.example`. Скопируйте его в `.env` для локальной сборки. Файл `.env` в git не попадает.

`SITE_URL` лучше оставлять доменом (`https://username.github.io`), а папку репозитория писать в `BASE_PATH`. Если в адресе уже есть путь, а `BASE_PATH` равен `/`, сборка предупредит: канонические ссылки могут потерять этот путь.

В файле уже стоит адрес этого репозитория: `https://natalyaberdnikova.github.io` и база `/manhwa-chars/`. Локальный `npm run dev` открывается по тому же подпути. Другой хостинг задаётся переменными `SITE_URL` и `BASE_PATH`, они перекрывают файл.

## Форма заявок и Telegram

Сайт статический, поэтому токен бота в браузер не попадает. Форма отправляет POST на небольшой Cloudflare Worker в папке `telegram-relay/`. Воркер проверяет поля, отбрасывает заполненную приманку `bot-field`, ограничивает частоту (5 заявок за 10 минут с одного IP на одном изоляте) и, если задан секрет Turnstile, проверяет капчу. Затем он шлёт сообщение в чат или канал через Bot API.

С JavaScript форма уходит через `fetch`, успех и ошибка показываются на странице на текущем языке. Без JavaScript браузер делает обычный POST, и воркер отвечает короткой страницей «отправлено» / «не удалось» со ссылкой назад.

В `site.config.json` уже указан развёрнутый приёмник `https://manhwa-chars-telegram.manhwa-chars.workers.dev`, поэтому кнопка отправки включена без дополнительных переменных. Пустой `formEndpoint` (и пустой `PUBLIC_FORM_ENDPOINT`) снова выключает кнопку.

### Как подключить бота

1. В Telegram откройте [@BotFather](https://t.me/BotFather), команда `/newbot`. Сохраните токен. Это `TELEGRAM_BOT_TOKEN`. Его нельзя коммитить и нельзя класть в сайт.
2. Создайте **приватный** канал (или группу), куда должны приходить заявки.
3. Добавьте бота в этот канал администратором с правом публиковать сообщения.
4. Узнайте `chat_id`. Для канала это обычно число вида `-100…`. Практичный способ: напишите в канал любое сообщение, затем откройте в браузере `https://api.telegram.org/bot<ТОКЕН>/getUpdates` после того, как бот увидел апдейт (для канала иногда проще временно добавить бота в группу, написать `/start`, и взять `chat.id` из ответа). Идентификатор канала также виден в некоторых клиентах в ссылке вида `t.me/c/1234567890` — тогда chat id равен `-100` + эти цифры.
5. Установите [Wrangler](https://developers.cloudflare.com/workers/wrangler/) и войдите в Cloudflare: `npx wrangler login`.
6. В папке `telegram-relay/` поле `ALLOWED_ORIGIN` в `wrangler.toml` — адрес сайта без хвоста `/`. Сейчас это `https://natalyaberdnikova.github.io`.
7. Задайте секреты и задеплойте:

```bash
cd telegram-relay
npm install
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```

8. Wrangler печатает адрес воркера. Текущий уже вписан в `formEndpoint`: `https://manhwa-chars-telegram.manhwa-chars.workers.dev`. Другой адрес задаётся там же или переменной `PUBLIC_FORM_ENDPOINT`. После смены пересоберите сайт.
9. Необязательно: заведите виджет [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/), сайт-ключ положите в `PUBLIC_TURNSTILE_SITE_KEY`, секрет — `npx wrangler secret put TURNSTILE_SECRET`. Если секрета нет, проверка капчи пропускается.

Тот же контракт (POST JSON или обычной формы, ответ JSON при заголовке `Accept: application/json`) можно повторить функцией Netlify или Vercel. В репозитории готовый вариант — Worker.

Имена полей: `kind`, `work_title`, `character_name`, `source_url`, `image_url`, `suggested_tags`, `comments`, `contact_email`, `locale`, приманка `bot-field`. Заявка сама страницу не создаёт.

## Изображения

Исходники — JPG или PNG в `src/assets/source/`. В сайт и в git попадают уже уменьшенные мастера:

- `npm run images` обходит все исходники;
- перед коммитом то же самое делает хук, но только для тех JPG/PNG, которые попали в индекс.

Хук ставится командой `prepare` при `npm install` (пакет `simple-git-hooks`). Он запускает Node, поэтому работает в Windows (Git for Windows), macOS и Linux: в PATH должен быть `node`. Если хук нужно обойти один раз: `SKIP_SIMPLE_GIT_HOOKS=1 git commit`.

Скрипт через `sharp`:

- поворачивает кадр по EXIF и выбрасывает метаданные;
- вписывает картинку в квадрат 1600×1600 без увеличения;
- не подкладывает цветной фон: альфа-канал PNG сохраняется в WebP (`alphaQuality: 100`) и в AVIF;
- пишет WebP (качество 78) и AVIF (качество 50, для картинок с альфой чуть выше) в `src/assets/optimized/` с тем же относительным путём;
- запоминает SHA-256 исходника в `src/assets/optimized/manifest.json`.

Дальше Astro `<Picture>` нарезает адаптивные размеры в AVIF, WebP и запасной PNG. Запасной формат тоже с прозрачностью, если она была в мастере. Так вырезка остаётся вырезкой и на подиуме, и в плитке, и в мелком кадре.

Повторный запуск ничего не переписывает, если файл и настройки не менялись. `--force` пересобирает всё. Удалённый из индекса исходник убирает и свою пару, и хук добавляет это удаление в коммит. Лишние файлы в `optimized/`, которым больше нет исходника, полная команда `npm run images` удаляет.

В Markdown указывайте **WebP**, не исходный PNG. Сборка проверяет формат и для `image`, и для `hoverImage` / `imageAlt`.

`<Picture>` ставит `srcset`, `sizes`, ширину и высоту, ленивую загрузку. Крупная фигура на странице персонажа, первый кадр слайдера произведения и обложка грузятся сразу. Исходный многомегабайтный файл в сборку не входит, а браузер всё равно получает картинку нужного размера. Полный AVIF рядом с WebP — тот же мастер, только во втором формате; его держит репозиторий, а отзывчивые версии всё равно собирает Astro.

Заново нарисовать примеры: `npm run placeholders`, затем `npm run images`.

## Деплой

### GitHub Pages

В репозитории уже есть `.github/workflows/pages.yml`. Он собирает `dist/` и публикует через GitHub Pages.

В настройках репозитория: Settings → Pages → Source: **GitHub Actions**.

Если переменные не заданы, workflow подставляет адрес этого репозитория: `SITE_URL=https://natalyaberdnikova.github.io`, `BASE_PATH=/manhwa-chars/` и `PUBLIC_FORM_ENDPOINT=https://manhwa-chars-telegram.manhwa-chars.workers.dev`.

Переменные репозитория (Settings → Secrets and variables → Actions → Variables) перекрывают эти значения:

- сайт пользователя `username.github.io`: `SITE_URL=https://username.github.io`, `BASE_PATH=/`
- сайт проекта: `SITE_URL=https://username.github.io`, `BASE_PATH=/имя-репозитория/`

Адрес воркера уже подставлен в workflow. Переменная `PUBLIC_FORM_ENDPOINT` нужна, только если приёмник другой. Сайт-ключ Turnstile, если он нужен, — `PUBLIC_TURNSTILE_SITE_KEY`. Токен бота на Pages не кладите: он живёт только в секретах Worker.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- В переменных окружения задайте `SITE_URL`, при необходимости `BASE_PATH`, и `PUBLIC_FORM_ENDPOINT` с адресом воркера

Файл `public/_headers` задаёт простые заголовки безопасности, Netlify их подхватывает. Сама форма Netlify больше не используется: заявки идут в Telegram.

### Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Те же переменные, что и выше

`public/_headers` Cloudflare Pages тоже понимает. Форма ходит на Worker из `telegram-relay/`, не в встроенные формы Pages.

## Что настроить перед публикацией

1. `url` и `base` в `site.config.json` уже указывают на `https://natalyaberdnikova.github.io/manhwa-chars/`. Для другого адреса задайте `SITE_URL` и `BASE_PATH`.
2. Воркер Telegram уже развёрнут, `formEndpoint` указывает на него. Секреты бота живут только в Worker. Для другого приёмника поменяйте `formEndpoint` или `PUBLIC_FORM_ENDPOINT`.
3. Заменить примеры в `src/content/` и картинки в `src/assets/source/` своими. Демонстрационные файлы подписаны в текстах и в подвале.
4. При желании поправить имя в поле `author` файла `site.config.json`.
