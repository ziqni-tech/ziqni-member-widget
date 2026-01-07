export function getTournamentTotalPrizePoolViewModel({
  tournament,
  showTotalPrize,
  rewardFormatter
}) {
  if (!tournament || !Array.isArray(tournament.contests) || !tournament.contests.length) {
    return '';
  }

  let rewardValue = '';

  if (showTotalPrize) {
    const totalReward = {
      rewardValue: 0,
      rewardType: {}
    };

    if (tournament.contests[0].rewards && tournament.contests[0].rewards.length) {
      totalReward.rewardType = tournament.contests[0].rewards[0].rewardType;
    }

    tournament.contests.forEach((contest) => {
      if (!contest.rewards || !contest.rewards.length) return;

      contest.rewards.forEach((reward) => {
        if (typeof reward.rewardRank !== 'string') {
          totalReward.rewardValue += reward.rewardValue || 0;
          return;
        }

        if (reward.rewardRank.indexOf('-') !== -1 || reward.rewardRank.indexOf(',') !== -1) {
          const rewardRankArr = reward.rewardRank.split(',');

          rewardRankArr.forEach((r) => {
            const idx = r.indexOf('-');
            if (idx !== -1) {
              const start = parseInt(r, 10);
              const end = parseInt(r.substring(idx + 1), 10);
              if (!isNaN(start) && !isNaN(end) && end >= start) {
                totalReward.rewardValue += (reward.rewardValue || 0) * (end - start + 1);
              }
            } else if (parseInt(r, 10) > 0) {
              totalReward.rewardValue += reward.rewardValue || 0;
            }
          });
        } else {
          totalReward.rewardValue += reward.rewardValue || 0;
        }
      });
    });

    if (totalReward.rewardValue && typeof rewardFormatter === 'function') {
      rewardValue = rewardFormatter(totalReward);
    }
  } else {
    const roundFirstIdx = tournament.contests.findIndex((c) => c.round === 1);

    if (roundFirstIdx !== -1) {
      const roundFirst = tournament.contests[roundFirstIdx];

      let firstPlaceReward = null;

      if (Array.isArray(roundFirst.rewards)) {
        roundFirst.rewards.forEach((reward) => {
          if (typeof reward.rewardRank !== 'string') {
            if (!firstPlaceReward && reward.rewardRank === 1) {
              firstPlaceReward = reward;
            }
            return;
          }

          if (reward.rewardRank.indexOf('-') !== -1 || reward.rewardRank.indexOf(',') !== -1) {
            const rewardRankArr = reward.rewardRank.split(',');
            rewardRankArr.forEach((r) => {
              const idx = r.indexOf('-');
              if (idx !== -1) {
                const start = parseInt(r, 10);
                if (start === 1 && !firstPlaceReward) {
                  firstPlaceReward = reward;
                }
              } else if (parseInt(r, 10) === 1 && !firstPlaceReward) {
                firstPlaceReward = reward;
              }
            });
          } else if (parseInt(reward.rewardRank, 10) === 1 && !firstPlaceReward) {
            firstPlaceReward = reward;
          }
        });
      }

      if (firstPlaceReward && typeof rewardFormatter === 'function') {
        rewardValue = rewardFormatter(firstPlaceReward);
      }
    }
  }

  return rewardValue || '';
}

export function buildTournamentItemViewModel({
  tournament,
  timeZone = 'UTC',
  showPrizeColumn = true,
  showTotalPrize = true,
  rewardFormatter
}) {
  const id = tournament.id;
  const name = tournament.name || '';

  let startDate = new Date(tournament.actualStartDate ?? tournament.scheduledStartDate);
  let endDate = new Date(tournament.actualEndDate ?? tournament.scheduledEndDate);

  startDate = startDate.toLocaleString('en-GB', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short'
  });
  endDate = endDate.toLocaleString('en-GB', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short'
  });

  const period = `${startDate} - ${endDate}`;

  let prize = '';
  if (showPrizeColumn) {
    prize = getTournamentTotalPrizePoolViewModel({
      tournament,
      showTotalPrize,
      rewardFormatter
    });
  }

  return {
    id,
    name,
    period,
    prize
  };
}

export function buildDashboardTournamentItemViewModel({
  tournament,
  isReadyStatus = false,
  timeZone = 'UTC',
  showTotalPrize = true,
  rewardFormatter,
  translation
}) {
  const title = tournament.name;

  let itemBg = '';
  if (tournament.bannerLowResolutionLink) {
    itemBg = `background-image: url(${tournament.bannerLowResolutionLink})`;
  } else if (tournament.bannerLink) {
    itemBg = `background-image: url(${tournament.bannerLink})`;
  }

  const endsLabel = isReadyStatus
    ? translation?.startsTitle
    : translation?.endsTitle;

  const date = isReadyStatus
    ? new Date(tournament.scheduledStartDate)
    : new Date(tournament.scheduledEndDate);

  const endsValue = date.toLocaleString('en-GB', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short'
  });

  const prizeValue = getTournamentTotalPrizePoolViewModel({
    tournament,
    showTotalPrize,
    rewardFormatter
  });

  const prizeLabel = showTotalPrize
    ? translation?.totalPrizeTitle
    : translation?.prizeTitle;

  return {
    title,
    itemBg,
    endsLabel,
    endsValue,
    prizeLabel,
    prizeValue
  };
}
