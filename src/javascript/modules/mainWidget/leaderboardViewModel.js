import mapObject from '../../utils/mapObject';
import objectIterator from '../../utils/objectIterator';
import query from '../../utils/query';
import remove from '../../utils/remove';
import appendNext from '../../utils/appendNext';
import hasClass from '../../utils/hasClass';
import addClass from '../../utils/addClass';
import removeClass from '../../utils/removeClass';

export function getReward(activeContest, rank, rewardFormatter) {
  const rewardResponse = [];

  if (typeof activeContest !== 'undefined' && activeContest !== null && typeof activeContest.rewards !== 'undefined') {
    mapObject(activeContest.rewards, function (reward) {
      if (reward.rewardRank.indexOf('-') !== -1 || reward.rewardRank.indexOf(',') !== -1) {
        const rewardRankArr = reward.rewardRank.split(',');
        rewardRankArr.forEach(r => {
          const idx = r.indexOf('-');
          if (idx !== -1) {
            const start = parseInt(r);
            const end = parseInt(r.substring(idx + 1));
            if (rank >= start && rank <= end) {
              rewardResponse.push(rewardFormatter(reward));
            }
          } else if (parseInt(r) === rank) {
            rewardResponse.push(rewardFormatter(reward));
          }
        });
      } else if (rank !== 0 && parseInt(reward.rewardRank) === rank) {
        rewardResponse.push(rewardFormatter(reward));
      }
    });
  }

  return rewardResponse.join(', ');
}

export function leaderboardRow(widget, rank, icon, name, change, growth, points, reward, count, memberFound) {
  const cellWrapper = document.createElement('div');
  const memberFoundClass = (memberFound) ? ' cl-lb-member-row' : '';
  cellWrapper.setAttribute('class', 'cl-lb-row cl-lb-rank-' + rank + ' cl-lb-count-' + count + memberFoundClass);
  cellWrapper.dataset.rank = rank;

  const datasetGrowth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
  const datasetChange = change;

  if (rank > widget.settings.lbWidget.settings.leaderboard.fullLeaderboardSize && !memberFound) {
    cellWrapper.classList.add('hidden');
  }

  const rewardEnabled = (typeof widget.settings.lbWidget.settings.competition.activeContest !== 'undefined' && widget.settings.lbWidget.settings.competition.activeContest !== null && typeof widget.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && widget.settings.lbWidget.settings.competition.activeContest.rewards.length > 0);

  const rewardValue = (typeof reward !== 'undefined' && reward !== null) ? reward : '';

  const template = require('../../templates/mainWidget/leaderboardRow.hbs');
  cellWrapper.innerHTML = template({
    rank: rank,
    name: name,
    icon: icon,
    datasetGrowth: datasetGrowth,
    datasetChange: datasetChange,
    growth: growth,
    points: points,
    rewardEnabled: rewardEnabled,
    rewardEnabledClass: 'cl-col-reward-enabled',
    rewardValue: rewardValue
  });

  return cellWrapper;
}

export function leaderboardRowUpdate(widget, rank, icon, name, change, growth, points, reward, count, memberFound, onMissing) {
  const cellRow = query(widget.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + count);

  if (cellRow === null) {
    onMissing(rank, name ? name[0] : '', name, change, growth, points, reward, count, memberFound);
  } else {
    const rankCel = query(cellRow, '.cl-rank-col-value');
    const iconCel = query(cellRow, '.cl-icon-col-img');
    const nameCel = query(cellRow, '.cl-name-col');
    const growthCel = query(cellRow, '.cl-growth-col');
    const pointsCel = query(cellRow, '.cl-points-col');
    const memberFoundClass = 'cl-lb-member-row';
    const rowHasClass = hasClass(cellRow, memberFoundClass);

    if (count > 0 && !hasClass(cellRow, 'cl-shared-rank')) {
      addClass(cellRow, 'cl-shared-rank');
    }

    if (memberFound && !rowHasClass) {
      addClass(cellRow, memberFoundClass);
    } else if (!memberFound && rowHasClass) {
      removeClass(cellRow, memberFoundClass);
    }

    cellRow.dataset.rank = rank;

    rankCel.innerHTML = rank;
    nameCel.innerHTML = name;

    growthCel.dataset.growth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
    growthCel.dataset.change = change;
    growthCel.innerHTML = growth;

    pointsCel.innerHTML = points;

    iconCel.innerText = name ? name[0] : '';

    if (typeof widget.settings.lbWidget.settings.competition.activeContest !== 'undefined' && widget.settings.lbWidget.settings.competition.activeContest !== null && typeof widget.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && widget.settings.lbWidget.settings.competition.activeContest.rewards.length > 0) {
      const rewardCel = query(cellRow, '.cl-reward-col');
      if (rewardCel !== null) {
        rewardCel.innerHTML = (typeof reward !== 'undefined' && reward !== null) ? reward : '';
      }
    } else {
      const rewardCel = query(cellRow, '.cl-reward-col');
      if (rewardCel !== null) {
        rewardCel.innerHTML = '';
      }
    }
  }
}

export function updateLeaderboardTopResults(widget, topResults, clearPrize = false) {
  const rankCheck = [];
  const cleanupRankCheck = [];

  // cleanup
  mapObject(topResults, function (lb) {
    cleanupRankCheck.push(lb.rank);
    objectIterator(query(widget.settings.leaderboard.topResults, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
      remove(obj);
    });
  });

  objectIterator(query(widget.settings.leaderboard.topResults, '.cl-lb-row'), function (obj) {
    const rank = parseInt(obj.dataset.rank);
    if (cleanupRankCheck.indexOf(rank) === -1 && rank > widget.settings.lbWidget.settings.leaderboard.fullLeaderboardSize) {
      remove(obj);
    }
  });

  mapObject(topResults, function (lb) {
    let memberNames = '';
    let memberLbName = '';
    if (lb.members && lb.members.length) {
      memberNames = lb.members.map((m) => m.name);
      memberLbName = memberNames.join();
    } else {
      memberLbName = lb.name;
    }
    let count = 0;
    const memberFound = lb.members && lb.members.findIndex(m => m.memberRefId === widget.settings.lbWidget.settings.member.memberRefId) !== -1;

    let memberName = (memberFound) ? widget.settings.lbWidget.settings.translation.leaderboard.you : memberLbName;
    const memberNameLength = widget.settings.lbWidget.settings.memberNameLength;
    const reward = clearPrize ? '' : getReward(widget.settings.lbWidget.settings.competition.activeContest, lb.rank, widget.settings.lbWidget.settings.partialFunctions.rewardFormatter);
    const change = (typeof lb.change === 'undefined') ? 0 : lb.change;
    const growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
    const growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";
    const formattedPoints = widget.settings.lbWidget.settings.leaderboard.pointsFormatter(lb.score);

    if (rankCheck.indexOf(lb.rank) !== -1) {
      for (let rc = 0; rc < rankCheck.length; rc++) {
        if (lb.rank === rankCheck[rc]) {
          count++;
        }
      }
    }

    if (memberNameLength && memberName !== widget.settings.lbWidget.settings.translation.leaderboard.you) {
      memberName = memberName.slice(0, memberNameLength) + '*****';
    }

    leaderboardRowUpdate(
      widget,
      lb.rank,
      memberName ? memberName[0] : '', // icon
      memberName,
      change,
      growthIcon, // growth
      formattedPoints,
      reward, // reward
      count,
      memberFound,
      function (rank, icon, name, change, growth, points, reward, count, memberFound) {
        const newRow = leaderboardRow(widget, rank, name ? name[0] : '', name, change, growth, points, reward, count, memberFound);
        const prevCellRow = query(widget.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

        if (prevCellRow !== null && typeof prevCellRow.length === 'undefined') {
          appendNext(prevCellRow, newRow);
        } else {
          widget.settings.leaderboard.topResults.appendChild(newRow);
        }
      }
    );

    rankCheck.push(lb.rank);
  });
}

export function updateLeaderboardResults(widget, remainingResults, clearPrize = false) {
  const rankCheck = [];
  const cleanupRankCheck = [];

  // cleanup
  mapObject(remainingResults, function (lb) {
    cleanupRankCheck.push(lb.rank);
    objectIterator(query(widget.settings.leaderboard.list, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
      remove(obj);
    });
  });

  objectIterator(query(widget.settings.leaderboard.container, '.cl-lb-row'), function (obj) {
    const rank = parseInt(obj.dataset.rank);
    if (cleanupRankCheck.indexOf(rank) === -1 && (rank > widget.settings.lbWidget.settings.leaderboard.fullLeaderboardSize || rank === 0)) {
      remove(obj);
    }
  });

  mapObject(remainingResults, function (lb) {
    let memberNames = '';
    let memberLbName = '';
    if (lb.members && lb.members.length) {
      memberNames = lb.members.map((m) => m.name);
      memberLbName = memberNames.join();
    } else {
      memberLbName = lb.name;
    }
    let count = 0;
    const icon = memberLbName && memberLbName.length ? memberLbName[0] : '';
    const memberFound = lb.members && lb.members.findIndex(m => m.memberRefId === widget.settings.lbWidget.settings.member.memberRefId) !== -1;
    let memberName = (memberFound) ? widget.settings.lbWidget.settings.translation.leaderboard.you : memberLbName;
    const memberNameLength = widget.settings.lbWidget.settings.memberNameLength;
    const reward = clearPrize ? '' : getReward(widget.settings.lbWidget.settings.competition.activeContest, lb.rank, widget.settings.lbWidget.settings.partialFunctions.rewardFormatter);
    const change = (typeof lb.change === 'undefined') ? 0 : lb.change;
    const growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
    const growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";
    const formattedPoints = widget.settings.lbWidget.settings.leaderboard.pointsFormatter(lb.score);

    if (rankCheck.indexOf(lb.rank) !== -1) {
      for (let rc = 0; rc < rankCheck.length; rc++) {
        if (lb.rank === rankCheck[rc]) {
          count++;
        }
      }
    }

    if (memberNameLength && memberName !== widget.settings.lbWidget.settings.translation.leaderboard.you) {
      memberName = memberName.slice(0, memberNameLength) + '*****';
    }

    leaderboardRowUpdate(
      widget,
      lb.rank,
      icon,
      memberName,
      change,
      growthIcon,
      formattedPoints,
      reward,
      count,
      memberFound,
      function (rank, icon, name, change, growth, points, reward, count, memberFound) {
        const newRow = leaderboardRow(widget, rank, icon, name, change, growth, points, reward, count, memberFound);
        const prevCellRow = query(widget.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

        if (prevCellRow !== null && typeof prevCellRow.length === 'undefined') {
          appendNext(prevCellRow, newRow);
        } else {
          widget.settings.leaderboard.list.appendChild(newRow);
        }
      }
    );

    rankCheck.push(lb.rank);
  });
}

export function populateLeaderboardResultsWithDefaultEntries(widget, clearPrize = false) {
  const topResults = [];
  const remainingResults = [];

  for (let i = 0; i < widget.settings.lbWidget.settings.leaderboard.topResultSize; i++) {
    const rank = i + 1;

    topResults.push({
      name: '--',
      rank: rank,
      score: '--',
      memberId: '',
      memberRefId: ''
    });
  }

  const emptyListLength = (
    widget.settings.lbWidget.settings.leaderboard.fullLeaderboardSize < widget.settings.lbWidget.settings.leaderboard.defaultEmptyList
  )
    ? widget.settings.lbWidget.settings.leaderboard.fullLeaderboardSize + 1
    : widget.settings.lbWidget.settings.leaderboard.defaultEmptyList;

  for (let s = widget.settings.lbWidget.settings.leaderboard.topResultSize; s < emptyListLength; s++) {
    const rank = s + 1;

    remainingResults.push({
      name: '--',
      rank: rank,
      score: '--',
      memberId: '',
      memberRefId: ''
    });
  }

  updateLeaderboardTopResults(widget, topResults, clearPrize);
  updateLeaderboardResults(widget, remainingResults, clearPrize);
}
