import query from '../../../utils/query';
import hasClass from '../../../utils/hasClass';
import addClass from '../../../utils/addClass';
import removeClass from '../../../utils/removeClass';

export function getNavigationIcon(container, navigation, entity) {
  const root =
    typeof container === 'string'
      ? query(document, container)
      : container;

  if (!root || !navigation) {
    return null;
  }

  let selector = null;

  switch (entity) {
    case 'Award':
      selector = '.' + navigation.rewards.navigationClass;
      break;
    case 'Message':
      selector = '.' + navigation.inbox.navigationClass;
      break;
    default:
      return null;
  }

  return query(root, selector);
}

export function animateIcon({
  container,
  navigation,
  entity,
  iconIntervalId,
  setIconIntervalId
}) {
  const icon = getNavigationIcon(container, navigation, entity);

  if (!icon || iconIntervalId) {
    return;
  }

  let x = 0;
  const intervalId = setInterval(function () {
    if (hasClass(icon, 'cl-active-nav')) {
      if (hasClass(icon, 'decrease')) {
        removeClass(icon, 'decrease');
      } else {
        addClass(icon, 'decrease');
      }
    } else {
      if (hasClass(icon, 'grow')) {
        removeClass(icon, 'grow');
      } else {
        addClass(icon, 'grow');
      }
    }

    if (++x === 8) {
      clearInterval(intervalId);
      if (typeof setIconIntervalId === 'function') {
        setIconIntervalId(null);
      }
    }
  }, 300);

  if (typeof setIconIntervalId === 'function') {
    setIconIntervalId(intervalId);
  }
}
