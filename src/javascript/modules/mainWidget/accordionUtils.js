export function createAccordionWrapper () {
  const accordionWrapper = document.createElement('div');
  accordionWrapper.setAttribute('class', 'cl-main-accordion-container');
  return accordionWrapper;
}

export function createAccordionMenu () {
  const statusMenu = document.createElement('div');
  statusMenu.setAttribute('class', 'cl-main-accordion-container-menu');
  return statusMenu;
}

export function createAccordionMenuItem (text, type, isActive = false) {
  const menuItem = document.createElement('div');
  menuItem.setAttribute('class', `cl-main-accordion-container-menu-item ${type}`);
  menuItem.innerHTML = text;
  if (isActive) {
    menuItem.classList.add('active');
  }
  return menuItem;
}

export function createAccordionSection (entry, onLayout) {
  const accordionSection = document.createElement('div');
  const topShownEntry = document.createElement('div');
  const accordionListContainer = document.createElement('div');
  const accordionList = document.createElement('div');

  accordionSection.setAttribute('class', 'cl-accordion ' + entry.type + ((typeof entry.show === 'boolean' && entry.show) ? ' cl-shown' : ''));
  topShownEntry.setAttribute('class', 'cl-accordion-entry');
  accordionListContainer.setAttribute('class', 'cl-accordion-list-container');
  accordionList.setAttribute('class', 'cl-accordion-list');

  accordionListContainer.appendChild(accordionList);
  accordionSection.appendChild(accordionListContainer);

  if (typeof onLayout === 'function') {
    onLayout(accordionSection, accordionList, topShownEntry, entry, accordionListContainer);
  }

  return accordionSection;
}

export function buildAccordion (data, menuItems, onSectionLayout) {
  const wrapper = createAccordionWrapper();
  const menu = createAccordionMenu();
  menuItems.forEach(item => {
    menu.appendChild(item.element);
  });

  wrapper.appendChild(menu);

  data.forEach(entry => {
    const section = createAccordionSection(entry, onSectionLayout);
    wrapper.appendChild(section);
  });

  return wrapper;
}
