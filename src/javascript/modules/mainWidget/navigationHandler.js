import mapObject from '../../utils/mapObject';
import hasClass from '../../utils/hasClass';
import removeClass from '../../utils/removeClass';
import addClass from '../../utils/addClass';
import query from '../../utils/query';
import objectIterator from '../../utils/objectIterator';
import closest from '../../utils/closest';
import { buildAccordion, createAccordionMenuItem } from './accordionUtils';
import { createElementWithClass } from './domUtils';

export function navigationSorter(a, b) {
  if (a.order < b.order) {
    return -1;
  }
  if (a.order > b.order) {
    return 1;
  }
  return 0;
}

export function awardsList(widget, data, onLayout) {
  const idx = data.findIndex(d => d.show === true);
  const menuItems = [];

  menuItems.push({
    element: createAccordionMenuItem(widget.settings.lbWidget.settings.translation.rewards.availableRewards, 'availableAwards', idx !== -1 && data[idx].type === 'availableAwards')
  });
  menuItems.push({
    element: createAccordionMenuItem(widget.settings.lbWidget.settings.translation.rewards.claimed, 'claimedAwards', idx !== -1 && data[idx].type === 'claimedAwards')
  });
  if (widget.settings.lbWidget.settings.awards.showExpiredAwards) {
    menuItems.push({
      element: createAccordionMenuItem(widget.settings.lbWidget.settings.translation.rewards.expired, 'expiredAwards', idx !== -1 && data[idx].type === 'expiredAwards')
    });
  }
  if (widget.settings.lbWidget.settings.instantWins.enable) {
    menuItems.push({
      element: createAccordionMenuItem(widget.settings.lbWidget.settings.translation.rewards.instantWins, 'instantWins', idx !== -1 && data[idx].type === 'instantWins')
    });
  }

  return buildAccordion(data, menuItems, onLayout);
}

export function tournamentsList(widget, data, onLayout) {
  const idx = data.findIndex(d => d.show === true);
  const menuItems = [];

  menuItems.push({
    element: createAccordionMenuItem(
      widget.settings.lbWidget.settings.translation.tournaments.finishedCompetitions,
      'finishedTournaments',
      idx !== -1 && data[idx].type === 'finishedCompetitions'
    )
  });
  menuItems.push({
    element: createAccordionMenuItem(
      widget.settings.lbWidget.settings.translation.tournaments.activeCompetitions,
      'activeTournaments',
      idx !== -1 && data[idx].type === 'activeCompetitions'
    )
  });
  menuItems.push({
    element: createAccordionMenuItem(
      widget.settings.lbWidget.settings.translation.tournaments.readyCompetitions,
      'readyTournaments',
      idx !== -1 && data[idx].type === 'readyCompetitions'
    )
  });

  return buildAccordion(data, menuItems, function (accordionSection, accordionList, topEntryContainer, entry, accordionListContainer) {
    const accordionLabel = createElementWithClass('div', '');
    const header = createElementWithClass('div', 'cl-accordion-list-container-header');
    const headerLabel = createElementWithClass('div', 'cl-accordion-list-container-header-label', widget.settings.lbWidget.settings.translation.tournaments.label);
    const headerDate = createElementWithClass('div', 'cl-accordion-list-container-header-date', widget.settings.lbWidget.settings.translation.tournaments.date);
    const headerPrize = createElementWithClass(
      'div',
      'cl-accordion-list-container-header-prize',
      widget.settings.lbWidget.settings.tournaments.showTotalPrize
        ? widget.settings.lbWidget.settings.translation.tournaments.totalPrizeLabel
        : widget.settings.lbWidget.settings.translation.leaderboard.prize
    );

    header.appendChild(headerLabel);
    header.appendChild(headerDate);
    if (widget.settings.lbWidget.settings.tournaments.showTournamentsMenuPrizeColumn) {
      header.appendChild(headerPrize);
    }

    if (accordionListContainer) {
      accordionListContainer.insertBefore(header, accordionList);
    }

    accordionSection.insertBefore(accordionLabel, accordionSection.firstChild);
    if (topEntryContainer && accordionListContainer) {
      accordionSection.insertBefore(topEntryContainer, accordionListContainer);
    }

    if (typeof onLayout === 'function') {
      onLayout(accordionSection, accordionList, topEntryContainer, entry);
    }
  });
}

export function listsNavigation(widget, element) {
  const menuItems = element.parentNode.querySelectorAll('.cl-main-accordion-container-menu-item');
  const container = element.closest('.cl-main-accordion-container');
  const sections = container.querySelectorAll('.cl-accordion');

  menuItems.forEach(i => i.classList.remove('active'));
  element.classList.add('active');

  sections.forEach(s => s.classList.remove('cl-shown'));

  if (element.classList.contains('finishedTournaments')) {
    const finishedContainer = container.querySelector('.finishedCompetitions');
    finishedContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('activeTournaments')) {
    const activeContainer = container.querySelector('.activeCompetitions');
    activeContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('readyTournaments')) {
    const readyContainer = container.querySelector('.readyCompetitions');
    readyContainer.classList.add('cl-shown');
  }

  widget.hideSingleWheel();

  if (element.classList.contains('availableAwards')) {
    const availableContainer = container.querySelector('.cl-accordion.availableAwards');
    availableContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('claimedAwards')) {
    const claimedContainer = container.querySelector('.cl-accordion.claimedAwards');
    claimedContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('expiredAwards')) {
    const expiredContainer = container.querySelector('.cl-accordion.expiredAwards');
    expiredContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('instantWins')) {
    const instantWinsContainer = container.querySelector('.cl-accordion.instantWins');
    instantWinsContainer.classList.add('cl-shown');
    widget.loadInstantWins();
  }

  // Achievements
  if (element.classList.contains('all')) {
    const allContainer = container.querySelector('.cl-accordion.all');
    allContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('daily')) {
    const dailyContainer = container.querySelector('.cl-accordion.daily');
    dailyContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('weekly')) {
    const weeklyContainer = container.querySelector('.cl-accordion.weekly');
    weeklyContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('monthly')) {
    const monthlyContainer = container.querySelector('.cl-accordion.monthly');
    monthlyContainer.classList.add('cl-shown');
  }
  if (element.classList.contains('finishedAchievements')) {
    const finishedContainer = container.querySelector('.cl-accordion.finishedAchievements');
    finishedContainer.classList.add('cl-shown');
  }
}

export function accordionNavigation(widget, element) {
  const parentEl = element.parentNode;

  if (hasClass(parentEl, 'cl-shown')) {
    removeClass(parentEl, 'cl-shown');
  } else {
    objectIterator(query(closest(parentEl, '.cl-main-accordion-container'), '.cl-shown'), function (obj) {
      removeClass(obj, 'cl-shown');
    });

    addClass(parentEl, 'cl-shown');
  }
}

export function navigationItems(widget, container, navigationList) {
  // sorting navigation by order number
  navigationList.sort(navigationSorter);

  mapObject(navigationList, function (val, key) {
    const navigationItem = document.createElement('div');
    const navigationItemIcon = document.createElement('div');
    const navigationItemTitle = document.createElement('div');
    if (val.key === 'inbox') {
      navigationItemTitle.innerHTML = widget.settings.lbWidget.settings.translation.messages.label;
    } else {
      navigationItemTitle.innerHTML = widget.settings.lbWidget.settings.translation[val.key].label;
    }

    navigationItem.setAttribute(
      'class',
      widget.settings.lbWidget.settings.navigation[val.key].navigationClass +
            ' cl-main-widget-navigation-item' +
            (widget.settings.lbWidget.settings.navigation[val.key].enable ? '' : ' cl-hidden-navigation-item') +
            (widget.settings.lbWidget.settings.navigation[val.key].navigationClass !== 'cl-main-widget-navigation-dashboard' ? ' hidden' : '')
    );
    navigationItemIcon.setAttribute('class', widget.settings.lbWidget.settings.navigation[val.key].navigationClassIcon + ' cl-main-navigation-item');
    navigationItemTitle.setAttribute('class', 'cl-main-navigation-item-title');

    navigationItem.appendChild(navigationItemIcon);
    navigationItem.appendChild(navigationItemTitle);
    container.appendChild(navigationItem);
  });
}

export function mainNavigationCheck(widget) {
  const navItems = query(widget.settings.container, '.cl-main-widget-navigation-item');
  let checkEnabled = 0;

  objectIterator(navItems, function (navItem) {
    if (!hasClass(navItem, 'cl-hidden-navigation-item')) {
      checkEnabled++;
    }
  });

  if (checkEnabled === 1) {
    addClass(query(widget.settings.container, '.cl-main-widget-inner-wrapper'), 'cl-hidden-navigation');
  } else if (checkEnabled === 0) {
    widget.settings.lbWidget.log('All navigation items disabled, check [widget.settings.lbWidget.settings.navigation]');
  }
}
