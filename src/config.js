const CONFIG = {
  GAME_WIDTH:    800,
  GAME_HEIGHT:   500,
  PLAYER_HP:     5,
  PLAYER_X:      110,
  GROUND_Y:      305,   // characters walk on this line (above the math panel)
  PANEL_Y:       350,   // math panel top edge
  PANEL_HEIGHT:  150,   // math panel height

  DIFFICULTIES: {
    easy:   { min: 1, max: 10 },
    medium: { min: 1, max: 25 },
    hard:   { min: 1, max: 100 }
  },

  SLIME_BASE_SPEED:              60,
  SLIME_SPEED_INCREMENT:          6,
  SLIME_SPEED_INCREMENT_INTERVAL: 12000,
  SLIME_SPEED_MAX:               180,

  MAX_SLIMES_START:       1,
  SLIMES_SCALE_THRESHOLD: 5,
  MAX_SLIMES_CAP:         6,

  SPAWN_INTERVAL_BASE: 3200,
  SPAWN_INTERVAL_MIN:   900,

  PROJECTILE_SPEED: 520,
  SCORE_PER_KILL:   100,

  COLORS: {
    PLAYER:       0x4488ff,
    SLIME:        0x44cc44,
    PROJECTILE:   0xffee00,
    HEART:        0xff4477,
    HEART_EMPTY:  0x553344,
    PANEL_BG:     0x110022,
    PANEL_BORDER: 0xaa44ff,
    CORRECT:      0x44ff88,
    WRONG:        0xff4444,
    GOLD:         0xffcc00
  }
};
