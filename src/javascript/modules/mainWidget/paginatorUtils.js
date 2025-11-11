import { ITEMS_PER_PAGE, PAGINATOR_CLASSES } from './constants';
import query from '../../utils/query';

export function createPaginator (totalCount, itemsPerPage, currentPage = 1, className = 'paginator', isAccordion = true) {
  if (totalCount <= itemsPerPage) {
    return null;
  }

  const pagesCount = Math.ceil(totalCount / itemsPerPage);
  const paginator = document.createElement('div');
  paginator.setAttribute('class', className);
  paginator.classList.add('paginator');
  if (isAccordion) paginator.classList.add('accordion');

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

export function updatePaginatorPage (paginator, pageNumber) {
  if (!paginator) return;

  const paginatorItems = paginator.querySelectorAll('.paginator-item');
  paginatorItems.forEach(item => {
    item.classList.remove('active');
    if (Number(item.dataset.page) === Number(pageNumber)) {
      item.classList.add('active');
    }
  });
}

export function createPaginatorFromArray (paginationArr, className = 'paginator', isAccordion = true) {
  if (!paginationArr || !paginationArr.length) {
    return null;
  }

  const paginator = document.createElement('div');
  paginator.setAttribute('class', className);
  paginator.classList.add('paginator');
  if (isAccordion) paginator.classList.add('accordion');

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

export const createAchievementPaginators = function (
  achievements,
  container,
  pageNumber = 1,
  paginationArr = null,
  currentPage = 'all'
) {
  const itemsPerPage = ITEMS_PER_PAGE.ACHIEVEMENTS;

  const totalCount = achievements && achievements.totalCount ? achievements.totalCount : 0;
  const finishedTotalCount = achievements && achievements.finishedTotalCount ? achievements.finishedTotalCount : 0;

  let allPaginator = query(container, '.paginator');
  if (!allPaginator) {
    const allPage = currentPage === 'all' ? pageNumber : 1;
    allPaginator = createPaginator(totalCount, itemsPerPage, allPage, 'paginator', false);
  } else if (totalCount <= itemsPerPage) {
    allPaginator = null;
  }

  let finishedPaginator = query(container, '.' + PAGINATOR_CLASSES.FINISHED);
  if (!finishedPaginator) {
    const finishedPage = currentPage === 'finished' ? pageNumber : 1;
    finishedPaginator = createPaginator(finishedTotalCount, itemsPerPage, finishedPage, PAGINATOR_CLASSES.FINISHED, false);
  } else if (finishedTotalCount <= itemsPerPage) {
    finishedPaginator = null;
  }

  let dailyPaginator = null;
  let weeklyPaginator = null;
  let monthlyPaginator = null;

  if (paginationArr && paginationArr.length) {
    if (currentPage === 'finished') {
      finishedPaginator = createPaginatorFromArray(paginationArr, PAGINATOR_CLASSES.FINISHED, false);
    } else if (currentPage === 'daily') {
      dailyPaginator = createPaginatorFromArray(paginationArr, 'paginator-daily', false);
    } else if (currentPage === 'weekly') {
      weeklyPaginator = createPaginatorFromArray(paginationArr, 'paginator-weekly', false);
    } else if (currentPage === 'monthly') {
      monthlyPaginator = createPaginatorFromArray(paginationArr, 'paginator-monthly', false);
    } else {
      allPaginator = createPaginatorFromArray(paginationArr, 'paginator', false);
    }
  }

  if (allPaginator) {
    const allPage = currentPage === 'all' ? pageNumber : 1;
    updatePaginatorPage(allPaginator, allPage);
  }
  if (finishedPaginator) {
    const finishedPage = currentPage === 'finished' ? pageNumber : 1;
    updatePaginatorPage(finishedPaginator, finishedPage);
  }

  if (dailyPaginator) {
    const dailyPage = currentPage === 'daily' ? pageNumber : 1;
    updatePaginatorPage(dailyPaginator, dailyPage);
  }

  if (weeklyPaginator) {
    const weeklyPage = currentPage === 'weekly' ? pageNumber : 1;
    updatePaginatorPage(weeklyPaginator, weeklyPage);
  }

  if (monthlyPaginator) {
    const monthlyPage = currentPage === 'monthly' ? pageNumber : 1;
    updatePaginatorPage(monthlyPaginator, monthlyPage);
  }

  return {
    all: allPaginator,
    finished: finishedPaginator,
    daily: dailyPaginator,
    weekly: weeklyPaginator,
    monthly: monthlyPaginator
  };
};

export const createTournamentPaginators = function (
  tournaments,
  container,
  readyPageNumber = 1,
  activePageNumber = 1,
  finishedPageNumber = 1,
  paginationArr = null,
  isReady = false,
  isActive = true,
  isFinished = false
) {
  const itemsPerPage = ITEMS_PER_PAGE.TOURNAMENTS;

  const totalCount = tournaments && tournaments.totalCount ? tournaments.totalCount : 0;
  const readyTotalCount = tournaments && tournaments.readyTotalCount ? tournaments.readyTotalCount : 0;
  const finishedTotalCount = tournaments && tournaments.finishedTotalCount ? tournaments.finishedTotalCount : 0;

  let activePaginator = query(container, '.' + PAGINATOR_CLASSES.ACTIVE);
  if (!activePaginator) {
    activePaginator = createPaginator(totalCount, itemsPerPage, activePageNumber, PAGINATOR_CLASSES.ACTIVE);
  } else if (totalCount <= itemsPerPage) {
    activePaginator = null;
  }

  let readyPaginator = query(container, '.' + PAGINATOR_CLASSES.READY);
  if (!readyPaginator) {
    readyPaginator = createPaginator(readyTotalCount, itemsPerPage, readyPageNumber, PAGINATOR_CLASSES.READY);
  } else if (readyTotalCount <= itemsPerPage) {
    readyPaginator = null;
  }

  let finishedPaginator = query(container, '.' + PAGINATOR_CLASSES.FINISHED);
  if (!finishedPaginator) {
    finishedPaginator = createPaginator(finishedTotalCount, itemsPerPage, finishedPageNumber, PAGINATOR_CLASSES.FINISHED);
  } else if (finishedTotalCount <= itemsPerPage) {
    finishedPaginator = null;
  }

  // Handle paginationArr - replace paginator with array-based one if provided
  if (paginationArr && paginationArr.length) {
    if (isReady) {
      readyPaginator = createPaginatorFromArray(paginationArr, PAGINATOR_CLASSES.READY);
    } else if (isFinished) {
      finishedPaginator = createPaginatorFromArray(paginationArr, PAGINATOR_CLASSES.FINISHED);
    } else if (isActive) {
      activePaginator = createPaginatorFromArray(paginationArr, PAGINATOR_CLASSES.ACTIVE);
    }
  }

  if (activePaginator) {
    updatePaginatorPage(activePaginator, activePageNumber);
  }
  if (readyPaginator) {
    updatePaginatorPage(readyPaginator, readyPageNumber);
  }
  if (finishedPaginator) {
    updatePaginatorPage(finishedPaginator, finishedPageNumber);
  }

  return {
    active: activePaginator,
    ready: readyPaginator,
    finished: finishedPaginator
  };
};
