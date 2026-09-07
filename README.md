# meet-attendance 🎓

Автоматична перевірка відвідуваності: MeetList.io → Google Sheets.

## Як це працює

```
Після уроку → запускаєш скрипт → він іде в MeetList API
→ бере список учасників → порівнює зі списком учнів
→ записує в Google Sheets: хто був, о котрій прийшов, скільки сидів
```

Підтримує кирилицю і латиницю — якщо учень зайшов як "Oleg Ivanenko",
скрипт знайде його у списку як "Іваненко Олег".

---

## Налаштування (один раз)

### Крок 1: Отримати MEETLIST_TOKEN

1. Зайди на [meetlist.io](https://meetlist.io)
2. Відкрий F12 → Network → Fetch/XHR
3. Перезавантаж сторінку
4. Натисни на запит `me/`
5. Вкладка **Headers** → розділ **Request Headers**
6. Знайди рядок `Cookie: ...` — скопіюй все значення після `Cookie:`
7. Постав це значення в `.env` як `MEETLIST_TOKEN=...`

### Крок 2: Google Service Account

1. Зайди на [console.cloud.google.com](https://console.cloud.google.com)
2. Новий проєкт (назви як хочеш)
3. APIs & Services → Enable APIs → **Google Sheets API** → увімкни
4. IAM & Admin → Service Accounts → Create
   - Ім'я: meet-attendance
   - Role: Editor
5. Після створення → Keys → Add Key → JSON → скачай
6. Поклади JSON файл в папку `credentials/` під назвою `service-account.json`
7. Відкрий кожну з 4 таблиць → Поділитися → вставити email сервіс-акаунту → Редактор

### Крок 3: Налаштувати таблиці

У кожній таблиці:
- Перший аркуш (перевір назву) — список учнів: `A2:A` = "Прізвище Ім'я" (або A = Прізвище, B = Ім'я)
- Створи новий аркуш з назвою `Відвідуваність`

Назви аркушів вкажи в `config/classes.js` (поле `rosterSheet`).

### Крок 4: Встановити і запустити

```bash
npm install
cp .env.example .env
# відкрий .env і встав токен
node src/index.js --class 7A
```

---

## Запуск після кожного уроку

```bash
# Конкретний клас:
node src/index.js --class 7A
node src/index.js --class 7B

# Всі класи одразу:
node src/index.js --all

# Або через npm:
npm run 7a
npm run all
```

Скрипт автоматично бере **останню** зустріч з MeetList.

---

## Що записується в таблицю

| Учень | Дата | Приєднався | Час у дзвінку | Статус | Ім'я в Meet |
|---|---|---|---|---|---|
| Іваненко Олег | 07.09.2026 | 07:20 | 00:45:12 | ✅ Присутній | Oleg I |
| Коваль Марія | 07.09.2026 | — | — | ❌ Відсутній | |
