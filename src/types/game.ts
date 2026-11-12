export type ItemSlot = 'weapon' | 'armor' | 'helmet' | 'ring';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type GameIconName =
  | 'broadsword'
  | 'gladius'
  | 'battle-axe'
  | 'daggers'
  | 'wizard-staff'
  | 'crossbow'
  | 'chest-armor'
  | 'leather-armor'
  | 'barbute'
  | 'visored-helm'
  | 'ring'
  | 'skull-ring'
  | 'two-coins'
  | 'emerald'
  | 'anvil-impact'
  | 'locked-chest'
  | 'magic-portal';

export type WeaponSpriteType = 'broadsword' | 'gladius' | 'battle-axe' | 'daggers' | 'wizard-staff' | 'crossbow';

export interface ItemStats {
  damage?: number;
  maxHp?: number;
  critChance?: number; // Percentage e.g. 8 for 8%
  attackSpeed?: number; // Multiplier bonus e.g. 12 for +12%
  moveSpeed?: number; // Flat or percentage bonus e.g. 10 for +10%
  armor?: number;
}

export interface ItemAffix {
  id: string;
  nameRu: string;
  statKey: keyof ItemStats;
  value: number;
  isPercent?: boolean;
}

export interface GameItem {
  id: string;
  templateId: string;
  name: string;
  slot: ItemSlot;
  slotNameRu: string;
  rarity: ItemRarity;
  rarityNameRu: string;
  iconName: GameIconName;
  weaponSprite?: WeaponSpriteType;
  level: number; // +0, +1, +2, ...
  baseStats: ItemStats;
  affixes: ItemAffix[];
  isProtected?: boolean; // For Safe Pocket (Тайный карман)
  descriptionRu: string;
  isRanged?: boolean;
}

export type EquippedGear = {
  weapon: GameItem | null;
  armor: GameItem | null;
  helmet: GameItem | null;
  ring: GameItem | null;
};

export type EnemyArchetypeId = 'skeleton_warrior' | 'goblin_raider' | 'dark_cultist' | 'blood_golem';

export type EnemyBehaviorPolicy = 'melee_chaser' | 'fast_flanker' | 'ranged_kiter' | 'heavy_charger';

export interface EnemyDefinition {
  id: EnemyArchetypeId;
  nameRu: string;
  subtitleRu: string;
  behavior: EnemyBehaviorPolicy;
  baseHp: number;
  baseDamage: number;
  speed: number;
  scale: number;
  attackRange: number;
  attackCooldown: number;
  windupTime: number; // Telegraph duration in seconds
  goldDrop: [number, number];
  essenceDrop: [number, number];
  lootDropChance: number;
  isElite?: boolean;
  weaponSprite: WeaponSpriteType;
}

export type HubUpgradeId = 'healing_well' | 'training_dummy' | 'safe_pocket';

export interface HubUpgradeDefinition {
  id: HubUpgradeId;
  nameRu: string;
  descriptionRu: string;
  iconName: GameIconName;
  maxLevel: number;
  baseGoldCost: number;
  baseEssenceCost: number;
  effectTextRu: (level: number) => string;
}

export type HubStationId = 'stash' | 'forge' | 'portal';

export type GameMode = 'hub' | 'dungeon';

export type AppShellState = 'title' | 'playing' | 'paused' | 'gameover';

export interface ComputedPlayerStats {
  damage: number;
  maxHp: number;
  critChance: number; // % (0 - 85)
  attackSpeed: number; // attacks per second multiplier (1.0 base)
  moveSpeed: number; // pixels per second (155 base)
  armor: number; // damage reduction
}

export interface RunSummarySnapshot {
  outcome: 'extracted' | 'retreated' | 'defeat';
  waveReached: number;
  enemiesSlain: number;
  goldCollected: number;
  essenceCollected: number;
  itemsExtracted: GameItem[];
  itemsLost: number;
  protectedItemSaved: GameItem | null;
  durationSec: number;
}
