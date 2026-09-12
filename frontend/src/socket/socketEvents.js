export const CLIENT_EVENTS = {
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  PLAYER_INPUT: 'PLAYER_INPUT',
  PLACE_BOMB: 'PLACE_BOMB',
};

export const SERVER_EVENTS = {
  GAME_STATE: 'GAME_STATE',
  PLAYER_ELIMINATED: 'PLAYER_ELIMINATED',
  GAME_OVER: 'GAME_OVER',
  ERROR: 'ERROR',
};

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

export const GAME_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
};
