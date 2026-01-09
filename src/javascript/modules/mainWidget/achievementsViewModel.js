export function buildAchievementItemViewModel(ach, translation, rewardFormatter) {
  let isMore = false;
  let isEnter = false;
  let isLeave = false;
  let isProgress = false;

  if (Array.isArray(ach.constraints) && ach.constraints.includes('optinRequiredForEntrants')) {
    if (ach.optInStatus && ach.optInStatus >= 15 && ach.optInStatus <= 35) {
      isLeave = true;
    } else if (!isNaN(ach.optInStatus) && (ach.optInStatus === 10 || ach.optInStatus === 0)) {
      isProgress = true;
    } else {
      isEnter = true;
    }
  } else {
    isMore = true;
  }

  let bgImage = '';
  if (ach.iconLink && ach.iconLink.split('_id')[1].length > 1) {
    bgImage = 'background-image: url(' + ach.iconLink + ')';
  }

  let rewardValue = '';
  if (ach.reward) {
    rewardValue = rewardFormatter(ach.reward);
  }

  return {
    id: ach.id,
    title: ach.name,
    bgImage: bgImage,
    rewardValue: rewardValue,
    moreLabel: translation.more,
    enterLabel: translation.listEnterBtn,
    leaveLabel: translation.listLeaveBtn,
    progressLabel: translation.listProgressionBtn,
    isMore: isMore,
    isEnter: isEnter,
    isLeave: isLeave,
    isProgress: isProgress,
    isFinished: ach.status === 'Finished'
  };
}
