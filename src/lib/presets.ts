export const CHORE_PRESETS = [
  { name: 'Make your bed', emoji: '🛏️', points: 10 },
  { name: 'Take out trash', emoji: '🗑️', points: 25 },
  { name: 'Load dishwasher', emoji: '🍽️', points: 20 },
  { name: 'Vacuum', emoji: '🧹', points: 30 },
  { name: 'Clean bathroom', emoji: '🚽', points: 40 },
  { name: 'Feed the pet', emoji: '🐾', points: 15 },
  { name: 'Fold laundry', emoji: '👕', points: 25 },
  { name: 'Set the table', emoji: '🍴', points: 10 },
  { name: 'Sweep or mop', emoji: '🧺', points: 30 },
  { name: 'Water plants', emoji: '🌱', points: 15 },
  { name: 'Practice piano', emoji: '🎹', points: 20 },
  { name: 'Practice guitar', emoji: '🎸', points: 20 },
  { name: 'Practice instrument', emoji: '🎵', points: 20 },
]

export const REWARD_PRESETS = [
  { name: 'Extra screen time (30 min)', emoji: '🎮', points_cost: 150, reward_type: 'privilege' as const },
  { name: 'Stay up 30 min later', emoji: '🌙', points_cost: 200, reward_type: 'privilege' as const },
  { name: 'Pick dinner tonight', emoji: '🍕', points_cost: 300, reward_type: 'experience' as const },
  { name: 'Movie night pick', emoji: '🎬', points_cost: 400, reward_type: 'experience' as const },
  { name: 'Sleepover', emoji: '😴', points_cost: 600, reward_type: 'experience' as const },
  { name: '$5 spending money', emoji: '💵', points_cost: 500, reward_type: 'item' as const },
]

export const CHORE_EMOJIS = [
  '🛏️', '🗑️', '🍽️', '🧹', '🚽', '🐾', '👕', '🍴', '🧺', '🌱',
  '🧽', '🫧', '📦', '🧻', '💡', '🌿', '📬', '💩', '🐶', '🎒',
  '🎹', '🎸', '🎵', '🎶', '🎻', '🥁', '🎺', '🎷', '📖', '✏️',
]
