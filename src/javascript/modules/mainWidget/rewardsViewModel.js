import stripHtml from '../../utils/stripHtml';

export function buildRewardItemViewModel(reward, rewardFormatter) {
  const listItem = document.createElement('div');
  listItem.setAttribute('class', 'cl-rew-list-item cl-rew-' + reward.id);
  listItem.dataset.id = reward.id;

  let iconLink = '';
  if (reward.rewardData && reward.rewardData.iconLink) {
    iconLink = `background-image: url(${reward.rewardData.iconLink})`;
  }

  const labelText = stripHtml(reward.name);
  const label = (labelText.length > 80) ? (labelText.substr(0, 80) + '...') : labelText;

  const isClimeBtn = !reward.claimed && reward.statusCode !== 115;

  let prize = rewardFormatter(reward.rewardValue);
  if (reward.rewardData) {
    prize = rewardFormatter(reward.rewardData);
  }

  return {
    listItem,
    isClimeBtn,
    prize,
    type: reward.rewardType.key,
    label,
    iconLink
  };
}

export function buildDashboardAwardViewModel(award) {
  const listItem = document.createElement('div');
  listItem.setAttribute('class', 'dashboard-award-item');
  listItem.setAttribute('data-id', award.id);
  const iconLink = award.rewardData.iconLink ? award.rewardData.iconLink : '';

  const labelText = stripHtml(award.name);
  const label = (labelText.length > 80) ? (labelText.substr(0, 80) + '...') : labelText;

  const prize = Number.isInteger(award.rewardValue) ? award.rewardValue : Math.floor(award.rewardValue * 100) / 100;

  return {
    listItem,
    prize,
    type: award.rewardType.key,
    label,
    iconLink
  };
}
