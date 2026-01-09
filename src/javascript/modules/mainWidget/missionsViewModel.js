export function buildMissionItemViewModel(mission, translation, rewardFormatter) {
  const itemId = mission.id;
  let progressId = mission.id;

  let name = (mission.name.length > 36) ? mission.name.substr(0, 36) + '...' : mission.name;
  if (mission.customFields && mission.customFields['Global-Title']) {
    name = (mission.customFields['Global-Title'].length > 36)
      ? mission.customFields['Global-Title'].substr(0, 36) + '...'
      : mission.customFields['Global-Title'];
  }

  let reward = mission.reward ? rewardFormatter(mission.reward) : '';
  const actionsBtnLabel = translation.btn;

  let bgImage = '';
  if (
    mission.bannerLowResolutionLink &&
    mission.bannerLowResolutionLink.length > mission.bannerLowResolutionLink.indexOf('_id/') + 4
  ) {
    bgImage = `background-image: url(${mission.bannerLowResolutionLink})`;
  } else if (
    mission.bannerLink &&
    mission.bannerLink.length > mission.bannerLink.indexOf('_id/') + 4
  ) {
    bgImage = `background-image: url(${mission.bannerLink})`;
  }

  let stage = null;
  let progressValue = mission.optInStatus ? mission.optInStatus.percentageComplete : 0;
  let progressLabel = '0/100';
  if (mission.optInStatus && mission.optInStatus.percentageComplete) {
    progressLabel = String(mission.optInStatus.percentageComplete) + '/100';
  }

  if (mission.dependencies && mission.dependencies.length) {
    let currentStage = 1;
    if (mission.optInStatus && mission.optInStatus.percentageComplete === 100) {
      const idx = mission.dependencies.findIndex(a => a.achievement.optInStatus.percentageComplete === null || a.achievement.optInStatus.percentageComplete < 100);
      if (idx !== -1) {
        currentStage = mission.dependencies[idx].ordering + 1;
        progressId = mission.dependencies[idx].achievement.entityId;
        progressValue = mission.dependencies[idx].achievement.optInStatus.percentageComplete;
        progressLabel = String(mission.dependencies[idx].achievement.optInStatus.percentageComplete) + '/100';
        reward = mission.dependencies[idx].achievement.reward
          ? rewardFormatter(mission.dependencies[idx].achievement.reward)
          : '';
      } else {
        const lastIdx = mission.dependencies.length - 1;
        currentStage = mission.dependencies[lastIdx].ordering + 1;
        progressId = mission.dependencies[lastIdx].achievement.entityId;
        progressValue = mission.dependencies[lastIdx].achievement.optInStatus.percentageComplete;
        progressLabel = String(mission.dependencies[lastIdx].achievement.optInStatus.percentageComplete) + '/100';
        reward = mission.dependencies[lastIdx].achievement.reward
          ? rewardFormatter(mission.dependencies[lastIdx].achievement.reward)
          : '';
      }
    }
    stage = currentStage + '/' + (mission.dependencies.length + 1);
  }

  return {
    itemId,
    progressId,
    name,
    reward,
    actionsBtnLabel,
    bgImage,
    progressLabel,
    progressValue,
    stage
  };
}
