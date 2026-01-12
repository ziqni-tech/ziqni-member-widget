## Мінімальний план рефакторингу `MainWidget.js`

### Мета

Покращити читабельність та підтримуваність `MainWidget.js`, винести “важку” бізнес-логіку в окремі сервіси/утиліти, залишивши у файлі переважно побудову UI та зв’язування з `LbWidget`. Зберегти поточний зовнішній API.

---

### Етап 1 · Довести до кінця вже початий рефакторинг

- **1.1 Пагінація та акордеони**
  - Переконатися, що всі місця пагінації/акордеонів (`messagesListLayout`, `missionsListLayout`, `rewardsListLayout`, `loadCompetitionList`) використовують:
    - `mainWidget/paginatorUtils`
    - `mainWidget/accordionUtils`
    - `mainWidget/domUtils`
  - Видалити залишковий локальний код пагінації/створення акордеонів, якщо він дублює функціонал утиліт.

- **1.2 Форматування дат/таймерів**
  - Гарантувати, що скрізь використовується `formatDateTime`, `formatMissionDateTime`, `formatBannerDateTime` з `../utils/formatDateTime`, а не локальна логіка.

---

### Етап 2 · Винести бізнес-логіку списків (по типах секцій)

- **2.1 Турніри / leaderboard**
  - Створити модуль `src/javascript/modules/mainWidget/tournamentsViewModel.js`.
  - Винести в нього:
    - Розрахунок даних для `tournamentItem` та `dashboardTournamentItem`.
    - Логіку `getTournamentTotalPrizePool`.
  - У `MainWidget.js` в методах `tournamentItem`/`dashboardTournamentItem` залишити лише:
    - Створення DOM-елементів.
    - Підготовку контексту для шаблонів (`hbs`) на основі даних, отриманих із view‑model.

- **2.2 Нагороди (awards/rewards)**
  - Створити модуль `src/javascript/modules/mainWidget/rewardsViewModel.js`.
  - Винести туди:
    - Формування моделі для `rewardItem` та `dashboardAwardItem` (icon, обрізання назв, форматування prize).
  - У `MainWidget.js` в `rewardItem`/`dashboardAwardItem` використовувати ці утиліти і залишити лише DOM/шаблони.

- **2.3 Досягнення та місії**
  - Створити модулі:
    - `src/javascript/modules/mainWidget/achievementsViewModel.js`
    - `src/javascript/modules/mainWidget/missionsViewModel.js`
  - Перенести в них:
    - Розрахунок `stage`, `progressValue`, `progressLabel`, `reward` для:
      - `achievementItem`, `achievementDashboardItemUpdateProgression`
      - `missionsItem`, `dashboardMissionItem`, `missionItemUpdateProgression`, `missionDashboardItemUpdateProgression`
  - У методах `...Item` у `MainWidget.js` залишити лише збір DOM + виклики шаблонів.

---

### Етап 3 · Уніфікація списків + пагінації

- **3.1 Загальний helper для “список + пагінація”**
  - Створити модуль `src/javascript/modules/mainWidget/listWithPaginator.js`:
    - Вхідні параметри:
      - контейнер (`listContainer`),
      - масив елементів (`items`),
      - `totalCount`,
      - `itemsPerPage`,
      - `currentPage`,
      - `paginationArr`,
      - колбек побудови одного елемента (`renderItem`),
      - створювач пагінатора (наприклад, делегати до `createAchievementPaginators` / `createTournamentPaginators` тощо).
  - Переписати:
    - `messagesListLayout`
    - `missionsListLayout`
  - Вони мають лише:
    - діставати дані з `this.settings.lbWidget.settings.*`,
    - викликати `listWithPaginator` із відповідним `renderItem` (`messageItem` / `missionsItem`) та фабрикою пагінатора.

---

### Етап 4 · Розділити “оркестрацію” та “відображення”

- **4.1 Завантаження даних (`load*` методи)**
  - Методи:
    - `loadMessages`
    - `loadMissions`
    - `loadAwards`
    - `loadAchievements`
    - `loadDashboard*` (awards, missions, tournaments, achievements, instant wins)
  - Повинні:
    - Викликати відповідні методи/сервіси `LbWidget` (наприклад `checkForAvailable*`, `fetch*Summary`, `getDashboard*`).
    - Передавати отримані дані у відповідні `*ListLayout` або `dashboard*Item` хелпери.
  - Уникати додаткової бізнес-логіки в `MainWidget.js` (особливо фільтрації/мапінгу, якщо це можна перенести у view‑model модулі).

- **4.2 Dashboard loaders**
  - `loadDashboardAwards`, `loadDashboardMissions`, `loadDashboardTournaments`, `loadDashboardAchievements`, `loadDashboardInstantWins`:
    - Роблять лише:
      - виклик `LbWidget` сервісу (або вже готового сервісного шару),
      - очищення списків,
      - додавання елементів, створених через view‑model утиліти + `*Item` методи.

---

### Етап 5 · Локальне прибирання та дрібні покращення

- **5.1 Усунення дублікатів прогрес-барів**
  - Об’єднати пари методів:
    - `missionItemUpdateProgression` / `missionDashboardItemUpdateProgression`
    - `achievementItemUpdateProgression` / `achievementDashboardItemUpdateProgression`
  - Виділити спільні helper’и на кшталт:
    - `updateProgressBar(rootElement, selector, percentageComplete)`
    - `findMissionElementById(id, context)` / `findAchievementElementById(id, context)`
  - У поточних методах залишити лише визначення правильного контейнера (missions list vs dashboard list) і виклик загального helper’а.

- **5.2 JSDoc / легке типування**
  - Для ключових публічних методів `MainWidget` додати JSDoc:
    - `loadLeaderboard`
    - `loadAwards`
    - `loadMessages`
    - `loadMissions`
    - `initLayout`
  - Коротко описати:
    - призначення методу,
    - параметри (`@param`),
    - поведінку callback’ів.

---

### Пріоритети виконання

1. **Етап 1** — завершити використання існуючих утиліт (мінімальний ризик, швидкий виграш).
2. **Етап 2** — винести view‑model логіку для турнірів, нагород, досягнень і місій (максимальне скорочення розміру методу, мінімальний вплив на API).
3. **Етап 3** — уніфікувати “список + пагінація” для messages та missions.
4. **Етап 4** — зробити `load*` методи максимально тонкими (оркестрація, без складної логіки).
5. **Етап 5** — прибрати дрібні дублікати й додати JSDoc, коли основні зміни вже влиті.




