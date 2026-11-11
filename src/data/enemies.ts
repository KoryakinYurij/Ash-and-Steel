import { EnemyArchetypeId, EnemyDefinition } from '../types/game';

export const ENEMY_DEFINITIONS: Record<EnemyArchetypeId, EnemyDefinition> = {
  skeleton_warrior: {
    id: 'skeleton_warrior',
    nameRu: 'Скелет-воин',
    subtitleRu: 'Неутомимый пехотинец склепа',
    behavior: 'melee_chaser',
    baseHp: 62,
    baseDamage: 14,
    speed: 82,
    scale: 3.25,
    attackRange: 44,
    attackCooldown: 1.35,
    windupTime: 0.35,
    goldDrop: [8, 16],
    essenceDrop: [1, 3],
    lootDropChance: 0.32,
    weaponSprite: 'broadsword',
  },
  goblin_raider: {
    id: 'goblin_raider',
    nameRu: 'Гоблин-налётчик',
    subtitleRu: 'Стремительный охотник за добычей',
    behavior: 'fast_flanker',
    baseHp: 45,
    baseDamage: 11,
    speed: 118,
    scale: 3.0,
    attackRange: 38,
    attackCooldown: 0.95,
    windupTime: 0.28,
    goldDrop: [12, 24],
    essenceDrop: [1, 2],
    lootDropChance: 0.38,
    weaponSprite: 'daggers',
  },
  dark_cultist: {
    id: 'dark_cultist',
    nameRu: 'Тёмный культист',
    subtitleRu: 'Заклинатель пустотного пламени',
    behavior: 'ranged_kiter',
    baseHp: 52,
    baseDamage: 16,
    speed: 74,
    scale: 3.25,
    attackRange: 230,
    attackCooldown: 1.9,
    windupTime: 0.5,
    goldDrop: [14, 26],
    essenceDrop: [2, 5],
    lootDropChance: 0.42,
    weaponSprite: 'wizard-staff',
  },
  blood_golem: {
    id: 'blood_golem',
    nameRu: 'Кровавый голем (Элита)',
    subtitleRu: 'Бронированный колосс глубин',
    behavior: 'heavy_charger',
    baseHp: 175,
    baseDamage: 26,
    speed: 64,
    scale: 4.1,
    attackRange: 64,
    attackCooldown: 2.3,
    windupTime: 0.65,
    goldDrop: [38, 65],
    essenceDrop: [6, 12],
    lootDropChance: 0.85,
    isElite: true,
    weaponSprite: 'battle-axe',
  },
};

export interface WaveComposition {
  wave: number;
  titleRu: string;
  totalEnemies: number;
  maxConcurrent: number;
  spawnInterval: number;
  hpMultiplier: number;
  damageMultiplier: number;
  rareLootBonusPct: number;
  pool: { id: EnemyArchetypeId; weight: number }[];
  guaranteedElites: number;
}

export function getWaveComposition(wave: number): WaveComposition {
  const safeWave = Math.max(1, wave);
  const hpMultiplier = Number((1 + (safeWave - 1) * 0.24).toFixed(2));
  const damageMultiplier = Number((1 + (safeWave - 1) * 0.16).toFixed(2));
  const rareLootBonusPct = (safeWave - 1) * 25;

  const titles = [
    'Внешние Катакомбы',
    'Зал Расколотых Костей',
    'Святилище Тёмного Культа',
    'Кузня Кровавых Големов',
    'Сердце Пепельной Бездны',
  ];
  const titleRu = titles[Math.min(titles.length - 1, safeWave - 1)] || `Глубинный Ярус ${safeWave}`;

  const pool: { id: EnemyArchetypeId; weight: number }[] = [
    { id: 'skeleton_warrior', weight: 45 },
    { id: 'goblin_raider', weight: 35 },
    { id: 'dark_cultist', weight: safeWave >= 1 ? 25 : 0 },
    { id: 'blood_golem', weight: safeWave >= 2 ? 12 + safeWave * 4 : 6 },
  ];

  return {
    wave: safeWave,
    titleRu,
    totalEnemies: 7 + safeWave * 3,
    maxConcurrent: Math.min(10, 4 + safeWave * 2),
    spawnInterval: Math.max(0.85, 2.0 - safeWave * 0.14),
    hpMultiplier,
    damageMultiplier,
    rareLootBonusPct,
    pool,
    guaranteedElites: safeWave >= 2 ? Math.min(3, Math.floor(safeWave / 2)) : 1,
  };
}
