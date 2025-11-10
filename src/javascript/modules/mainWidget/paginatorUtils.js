export function createPaginator (totalCount, itemsPerPage, currentPage = 1, className = 'paginator') {
  if (totalCount <= itemsPerPage) {
    return null;
  }

  const pagesCount = Math.ceil(totalCount / itemsPerPage);
  const paginator = document.createElement('div');
  paginator.setAttribute('class', className);
  paginator.classList.add('paginator');
  paginator.classList.add('accordion');

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

export function createPaginatorFromArray (paginationArr, className = 'paginator') {
  if (!paginationArr || !paginationArr.length) {
    return null;
  }

  const paginator = document.createElement('div');
  paginator.setAttribute('class', className);
  paginator.classList.add('paginator');
  paginator.classList.add('accordion');

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
