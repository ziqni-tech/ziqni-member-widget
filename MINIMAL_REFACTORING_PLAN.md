# Мінімальний план рефакторингу MainWidget.js

## Мета
Покращити читабельність та підтримку коду з мінімальними змінами архітектури. Зберегти backwards compatibility.

## Поточні проблеми
1. **Дублювання коду пагінації** - однакова логіка в 4+ методах (~150 рядків дублювання)
2. **Дублювання accordion логіки** - awardsList, tournamentsList, achievementList схожі (~80 рядків)
3. **Великі методи** - loadCompetitionList (270 рядків), achievementListLayout (280 рядків), rewardsListLayout (200 рядків)
4. **Дублювання DOM створення** - багато однакового коду для створення елементів
5. **Магічні числа** - itemsPerPage, pagesCount logic дублюється

## Етап 1: Винесення утиліт (1-2 дні)

### 1.1 Створення PaginatorUtils
**Файл**: `src/javascript/modules/MainWidget/paginatorUtils.js`

```javascript
/**
 * Утиліти для створення пагінації
 */
export function createPaginator(totalCount, itemsPerPage, currentPage = 1, className = 'paginator') {
  if (totalCount <= itemsPerPage) {
    return null;
  }

  const pagesCount = Math.ceil(totalCount / itemsPerPage);
  const paginator = document.createElement('div');
  paginator.setAttribute('class', className);
  addClass(paginator, 'paginator');
  addClass(paginator, 'accordion');

  let page = '';
  const isEllipsis = pagesCount > 7;

  if (isEllipsis) {
    for (let i = 0; i < 7; i++) {
      if (i === 5) {
        page += '<span class="paginator-item" data-page="...">...</span>';
      } else if (i === 6) {
        page += '<span class="paginator-item" data-page=' + pagesCount + '>' + pagesCount + '</span>';
      } else {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '>' + (i + 1) + '</span>';
      }
    }
  } else {
    for (let i = 0; i < pagesCount; i++) {
      page += '<span class="paginator-item" data-page=' + (i + 1) + '>' + (i + 1) + '</span>';
    }
  }

  paginator.innerHTML = page;

  const prev = document.createElement('span');
  prev.setAttribute('class', 'paginator-item prev');
  const next = document.createElement('span');
  next.setAttribute('class', 'paginator-item next');

  paginator.prepend(prev);
  paginator.appendChild(next);

  return paginator;
}

export function updatePaginatorPage(paginator, pageNumber) {
  if (!paginator) return;
  
  const paginatorItems = paginator.querySelectorAll('.paginator-item');
  paginatorItems.forEach(item => {
    removeClass(item, 'active');
    if (Number(item.dataset.page) === Number(pageNumber)) {
      addClass(item, 'active');
    }
  });
}

export function createPaginatorFromArray(paginationArr, className = 'paginator') {
  if (!paginationArr || !paginationArr.length) {
    return null;
  }

  const paginator = document.createElement('div');
  paginator.setAttribute('class', className);
  addClass(paginator, 'paginator');
  addClass(paginator, 'accordion');

  let page = '';
  for (const i in paginationArr) {
    page += '<span class="paginator-item" data-page=' + paginationArr[i] + '>' + paginationArr[i] + '</span>';
  }

  paginator.innerHTML = page;

  const prev = document.createElement('span');
  prev.setAttribute('class', 'paginator-item prev');
  const next = document.createElement('span');
  next.setAttribute('class', 'paginator-item next');

  paginator.prepend(prev);
  paginator.appendChild(next);

  return paginator;
}
```

**Використання**: Замінити дублювання в:
- `loadCompetitionList()` - ~90 рядків → ~10 рядків
- `achievementListLayout()` - ~80 рядків → ~10 рядків  
- `rewardsListLayout()` - ~80 рядків → ~10 рядків
- `messagesListLayout()` - ~30 рядків → ~5 рядків
- `missionsListLayout()` - ~30 рядків → ~5 рядків

**Економія**: ~310 рядків дублювання → ~40 рядків утиліт

### 1.2 Створення AccordionUtils
**Файл**: `src/javascript/modules/MainWidget/accordionUtils.js`

```javascript
/**
 * Утиліти для створення accordion структур
 */
export function createAccordionWrapper() {
  const accordionWrapper = document.createElement('div');
  accordionWrapper.setAttribute('class', 'cl-main-accordion-container');
  return accordionWrapper;
}

export function createAccordionMenu() {
  const statusMenu = document.createElement('div');
  statusMenu.setAttribute('class', 'cl-main-accordion-container-menu');
  return statusMenu;
}

export function createAccordionMenuItem(text, type, isActive = false) {
  const menuItem = document.createElement('div');
  menuItem.setAttribute('class', `cl-main-accordion-container-menu-item ${type}`);
  menuItem.innerHTML = text;
  if (isActive) {
    menuItem.classList.add('active');
  }
  return menuItem;
}

export function createAccordionSection(entry, onLayout) {
  const accordionSection = document.createElement('div');
  const topShownEntry = document.createElement('div');
  const accordionListContainer = document.createElement('div');
  const accordionList = document.createElement('div');

  accordionSection.setAttribute('class', 'cl-accordion ' + entry.type + ((typeof entry.show === 'boolean' && entry.show) ? ' cl-shown' : ''));
  topShownEntry.setAttribute('class', 'cl-accordion-entry');
  accordionListContainer.setAttribute('class', 'cl-accordion-list-container');
  accordionList.setAttribute('class', 'cl-accordion-list');

  if (typeof onLayout === 'function') {
    onLayout(accordionSection, accordionList, topShownEntry, entry);
  }

  accordionListContainer.appendChild(accordionList);
  accordionSection.appendChild(accordionListContainer);

  return accordionSection;
}

export function buildAccordion(data, menuItems, onSectionLayout) {
  const wrapper = createAccordionWrapper();
  const menu = createAccordionMenu();

  // Додаємо меню items
  menuItems.forEach(item => {
    menu.appendChild(item.element);
  });

  wrapper.appendChild(menu);

  // Створюємо секції
  data.forEach(entry => {
    const section = createAccordionSection(entry, onSectionLayout);
    wrapper.appendChild(section);
  });

  return wrapper;
}
```

**Використання**: Спростити:
- `awardsList()` - ~80 рядків → ~40 рядків
- `tournamentsList()` - ~90 рядків → ~40 рядків
- `achievementList()` - ~80 рядків → ~40 рядків

**Економія**: ~250 рядків → ~100 рядків утиліт + спрощені методи

### 1.3 Створення DOMUtils для MainWidget
**Файл**: `src/javascript/modules/MainWidget/domUtils.js`

```javascript
/**
 * Додаткові DOM утиліти для MainWidget
 */
export function createElementWithClass(tag, className, content = '') {
  const element = document.createElement(tag);
  element.setAttribute('class', className);
  if (content) {
    element.innerHTML = content;
  }
  return element;
}

export function setActiveMenuItem(container, activeType) {
  const menuItems = container.querySelectorAll('.cl-main-accordion-container-menu-item');
  menuItems.forEach(item => {
    item.classList.remove('active');
    if (item.classList.contains(activeType)) {
      item.classList.add('active');
    }
  });
}
```

## Етап 2: Винесення констант (0.5 дня)

### 2.1 Створення constants.js
**Файл**: `src/javascript/modules/MainWidget/constants.js`

```javascript
/**
 * Константи для MainWidget
 */
export const ITEMS_PER_PAGE = {
  TOURNAMENTS: 12,
  ACHIEVEMENTS: 6,
  REWARDS: 6,
  MESSAGES: 9,
  MISSIONS: 6
};

export const PAGINATOR_CLASSES = {
  ACTIVE: 'paginator-active',
  READY: 'paginator-ready',
  FINISHED: 'paginator-finished',
  AVAILABLE: 'paginator-available',
  CLAIMED: 'paginator-claimed',
  EXPIRED: 'paginator-expired'
};

export const ACCORDION_TYPES = {
  AWARDS: {
    AVAILABLE: 'availableAwards',
    CLAIMED: 'claimedAwards',
    EXPIRED: 'expiredAwards',
    INSTANT_WINS: 'instantWins'
  },
  TOURNAMENTS: {
    READY: 'readyCompetitions',
    ACTIVE: 'activeCompetitions',
    FINISHED: 'finishedCompetitions'
  },
  ACHIEVEMENTS: {
    ALL: 'all',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    FINISHED: 'finishedAchievements'
  }
};
```

## Етап 3: Рефакторинг великих методів (2-3 дні)

### 3.1 Розбиття loadCompetitionList
**Проблема**: 270 рядків, багато дублювання пагінації

**Рішення**: Винести логіку пагінації та створення списку

```javascript
// Нова структура:
this.loadCompetitionList = function(callback, readyPageNumber, activePageNumber, finishedPageNumber, paginationArr, isReady, isActive, isFinished) {
  const _this = this;
  const listResContainer = query(_this.settings.tournamentListContainer, '.cl-main-widget-tournaments-list-body-res');
  const preLoader = _this.preloader();
  
  // Використовуємо утиліти
  const paginators = _this._createTournamentPaginators(
    _this.settings.lbWidget.settings.tournaments,
    listResContainer,
    readyPageNumber,
    activePageNumber,
    finishedPageNumber,
    paginationArr
  );
  
  // Налаштування accordion
  _this._setupTournamentAccordion(isReady, isActive, isFinished, paginationArr, paginators);
  
  // Завантаження даних
  preLoader.show(function() {
    _this._renderTournamentList(listResContainer, paginators, callback, preLoader);
  });
};

// Допоміжні методи (приватні, початок з _)
this._createTournamentPaginators = function(tournaments, container, readyPage, activePage, finishedPage, paginationArr) {
  // Логіка створення пагінаторів використовуючи утиліти
};

this._setupTournamentAccordion = function(isReady, isActive, isFinished, paginationArr, paginators) {
  // Логіка налаштування accordion
};

this._renderTournamentList = function(container, paginators, callback, preLoader) {
  // Логіка рендерингу списку
};
```

**Результат**: 270 рядків → ~150 рядків (основний метод) + ~100 рядків (допоміжні)

### 3.2 Розбиття achievementListLayout
**Проблема**: 280 рядків, дублювання пагінації

**Рішення**: Аналогічно до loadCompetitionList

```javascript
this.achievementListLayout = function(pageNumber, achievementData, paginationArr, currentPage) {
  const _this = this;
  const achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');
  
  // Використовуємо утиліти для пагінації
  const paginators = _this._createAchievementPaginators(
    _this.settings.lbWidget.settings.achievements,
    achList,
    pageNumber,
    paginationArr,
    currentPage
  );
  
  // Налаштування accordion
  _this._setupAchievementAccordion(currentPage);
  
  // Рендеринг
  _this._renderAchievementList(achList, achievementData, paginators, pageNumber, currentPage);
};
```

**Результат**: 280 рядків → ~100 рядків (основний метод) + ~150 рядків (допоміжні)

### 3.3 Розбиття rewardsListLayout
**Проблема**: 200 рядків, дублювання пагінації

**Рішення**: Аналогічно

**Результат**: 200 рядків → ~80 рядків (основний метод) + ~100 рядків (допоміжні)

## Етап 4: Спрощення accordion методів (1 день)

### 4.1 Рефакторинг awardsList, tournamentsList, achievementList
Використовувати нові утиліти з AccordionUtils

**Результат**: 
- `awardsList`: 80 рядків → 40 рядків
- `tournamentsList`: 90 рядків → 40 рядків  
- `achievementList`: 80 рядків → 40 рядків

## Етап 5: Мелкі покращення (1 день)

### 5.1 Винесення спільних перевірок
```javascript
// Замість повторюваних перевірок
if (typeof callback === 'function') {
  callback();
}

// Створити утиліту
function safeCallback(callback, ...args) {
  if (typeof callback === 'function') {
    callback(...args);
  }
}
```

### 5.2 Винесення логіки форматування
```javascript
// Винести в окрему функцію
function formatAccordionClassName(type, show) {
  return 'cl-accordion ' + type + ((typeof show === 'boolean' && show) ? ' cl-shown' : '');
}
```

## Очікувані результати

### До рефакторингу:
- **Розмір файлу**: 4953 рядки
- **Дублювання**: ~560 рядків
- **Найбільший метод**: 280 рядків
- **Складність**: Висока

### Після рефакторингу:
- **Розмір основного файлу**: ~4200 рядків (-750 рядків)
- **Нові утиліти**: ~300 рядків
- **Найбільший метод**: ~150 рядків
- **Дублювання**: Мінімальне
- **Складність**: Середня

### Переваги:
1. ✅ Менше дублювання коду
2. ✅ Легше тестувати утиліти окремо
3. ✅ Легше підтримувати
4. ✅ Backwards compatible (не змінюємо API)
5. ✅ Мінімальні ризики (поступові зміни)

## План виконання

### Тиждень 1: Утиліти та константи
- [ ] День 1: Створити PaginatorUtils
- [ ] День 2: Створити AccordionUtils  
- [ ] День 3: Створити DOMUtils та constants
- [ ] День 4: Інтегрувати утиліти в один метод (наприклад, messagesListLayout)
- [ ] День 5: Тестування та виправлення помилок

### Тиждень 2: Великі методи
- [ ] День 1-2: Рефакторинг loadCompetitionList
- [ ] День 3: Рефакторинг achievementListLayout
- [ ] День 4: Рефакторинг rewardsListLayout
- [ ] День 5: Рефакторинг accordion методів

### Тиждень 3: Фіналізація
- [ ] День 1-2: Мелкі покращення
- [ ] День 3: Тестування всього функціоналу
- [ ] День 4: Code review
- [ ] День 5: Документація змін

## Ризики та мітигація

### Ризики:
1. **Помилки при заміні** - можливі баги при використанні нових утиліт
   - **Мітигація**: Покрити утиліти unit тестами, поступова заміна

2. **Проблеми з імпортами** - потрібно додати нові імпорти
   - **Мітигація**: Перевірити webpack конфігурацію

3. **Зміна поведінки** - можливі незначні відмінності
   - **Мітигація**: Ретельне тестування, порівняння до/після

## Метрики успіху

1. ✅ Зменшення дублювання на 80%+
2. ✅ Найбільший метод < 200 рядків
3. ✅ Всі тести проходять
4. ✅ Немає регресій у функціональності
5. ✅ Покращення читабельності коду

## Висновок

Цей мінімальний рефакторинг дозволить:
- Значно зменшити дублювання коду
- Покращити читабельність
- Зробити код більш підтримуваним
- Зберегти backwards compatibility
- Мінімізувати ризики

Рекомендується виконувати поетапно з тестуванням після кожного етапу.


