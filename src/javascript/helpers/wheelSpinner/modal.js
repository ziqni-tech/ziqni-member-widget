import { startConfetti } from './confetti';

let modalContainer = null;

export function createCongratulationsModal (reward, messageSettings) {
  const defaultSettings = {
    celebrationMessage: '<p><em>Congratulations!</em></p>',
    celebrationText: '<p><em>You won</em></p>',
    sorryMessage: '<p><em>Didn\'t win this time!</em></p>',
    sorryText: '<p><em>Wishing you better luck in the future</em></p>'
  };

  // Merge defaultSettings with messageSettings
  messageSettings = { ...defaultSettings, ...messageSettings };

  const sectionContainer = document.querySelector('.play-single-wheel');

  if (modalContainer) modalContainer = null;

  modalContainer = document.createElement('div');
  modalContainer.id = 'congratulations-modal';
  modalContainer.classList.add('hidden');

  const winCard = document.createElement('div');
  winCard.classList.add('win-card');

  const modalHeader = document.createElement('div');
  modalHeader.classList.add('modal-header');

  const rewardTitle = document.createElement('h2');
  rewardTitle.classList.add('reward-title');
  modalHeader.appendChild(rewardTitle);

  const subtitle = document.createElement('h3');
  subtitle.classList.add('modal-subtitle');
  modalHeader.appendChild(subtitle);

  const messageBox = document.createElement('div');
  messageBox.classList.add('message-box');

  if (reward && reward.name) {
    rewardTitle.innerHTML = messageSettings.celebrationMessage;
    subtitle.innerHTML = messageSettings.celebrationText;

    const prizeData = document.createElement('div');
    prizeData.classList.add('prize-data');
    prizeData.innerHTML = `<span class="quantity">${reward.rewardValue}</span><span class="prize-name">${reward.name}</span>`;

    messageBox.appendChild(prizeData);

    if (messageSettings.celebrationImage) {
      const rewardImage = document.createElement('div');
      rewardImage.classList.add('reward-image');
      const image = document.createElement('img');
      image.classList.add('image');
      image.setAttribute('src', messageSettings.celebrationImage);
      image.setAttribute('alt', 'Reward Image');
      rewardImage.appendChild(image);
      messageBox.appendChild(rewardImage);
    }
  } else {
    rewardTitle.innerHTML = messageSettings.sorryMessage;
    subtitle.innerHTML = messageSettings.sorryText;

    if (messageSettings.sorryImage) {
      const sorryImage = document.createElement('div');
      sorryImage.classList.add('sorry-image');
      const image = document.createElement('img');
      image.classList.add('image');
      image.setAttribute('src', messageSettings.sorryImage);
      image.setAttribute('alt', 'Sorry Image');
      sorryImage.appendChild(image);
      messageBox.appendChild(sorryImage);
    }
  }

  winCard.appendChild(modalHeader);
  winCard.appendChild(messageBox);

  const rewardButtons = document.createElement('div');
  rewardButtons.classList.add('reward-buttons');

  const claimButton = document.createElement('div');
  claimButton.classList.add('claim-reward-btn');
  claimButton.textContent = reward && reward.name ? 'Claim Reward' : 'Close';

  if (reward && reward.awardId) claimButton.dataset.id = reward.awardId;

  rewardButtons.appendChild(claimButton);

  winCard.appendChild(rewardButtons);
  modalContainer.appendChild(winCard);

  sectionContainer.appendChild(modalContainer);

  setTimeout(() => {
    modalContainer.classList.remove('hidden');
    modalContainer.classList.add('visible');
  }, 100);

  if (reward && reward.name && messageSettings.isCelebrationAnimation) {
    document.querySelector('#confetti').classList.remove('hidden');
    startConfetti();
  }

  return modalContainer;
}
