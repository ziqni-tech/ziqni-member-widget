/**
 * Константи для MainWidget
 */
export const ITEMS_PER_PAGE = {
  TOURNAMENTS: 12,
  ACHIEVEMENTS: 6,
  REWARDS: 6,
  MESSAGES: 9,
  MISSIONS: 6
};

export const PAGINATOR_CLASSES = {
  ACTIVE: 'paginator-active',
  READY: 'paginator-ready',
  FINISHED: 'paginator-finished',
  AVAILABLE: 'paginator-available',
  CLAIMED: 'paginator-claimed',
  EXPIRED: 'paginator-expired'
};

export const ACCORDION_TYPES = {
  AWARDS: {
    AVAILABLE: 'availableAwards',
    CLAIMED: 'claimedAwards',
    EXPIRED: 'expiredAwards',
    INSTANT_WINS: 'instantWins'
  },
  TOURNAMENTS: {
    READY: 'readyCompetitions',
    ACTIVE: 'activeCompetitions',
    FINISHED: 'finishedCompetitions'
  },
  ACHIEVEMENTS: {
    ALL: 'all',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    FINISHED: 'finishedAchievements'
  }
};
