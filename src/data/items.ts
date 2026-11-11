import {
  ComputedPlayerStats,
  EquippedGear,
  GameIconName,
  GameItem,
  HubUpgradeDefinition,
  HubUpgradeId,
  ItemAffix,
  ItemRarity,
  ItemSlot,
  ItemStats,
  WeaponSpriteType,
} from '../types/game';

export interface RarityConfig {
  id: ItemRarity;
  nameRu: string;
  colorHex: string;
  borderHex: string;
  bgTint: string;
  statMultiplier: number;
  affixCount: number;
  weight: number;
  salvageGold: number;
  salvageEssence: number;
}

export const RARITY_CONFIG: Record<ItemRarity, RarityConfig> = {
  common: {
    id: 'common',
    nameRu: 'Обычный',
    colorHex: '#94a3b8',
    borderHex: '#475569',
    bgTint: 'rgba(148, 163, 184, 0.10)',
    statMultiplier: 1.0,
    affixCount: 0,
    weight: 46,
    salvageGold: 15,
    salvageEssence: 2,
  },
  uncommon: {
    id: 'uncommon',
    nameRu: 'Необычный',
    colorHex: '#34d399',
    borderHex: '#059669',
    bgTint: 'rgba(52, 211, 153, 0.12)',
    statMultiplier: 1.22,
    affixCount: 1,
    weight: 30,
    salvageGold: 32,
    salvageEssence: 5,
  },
  rare: {
    id: 'rare',
    nameRu: 'Редкий',
    colorHex: '#38bdf8',
    borderHex: '#0284c7',
    bgTint: 'rgba(56, 189, 248, 0.14)',
    statMultiplier: 1.5,
    affixCount: 2,
    weight: 15,
    salvageGold: 65,
    salvageEssence: 12,
  },
  epic: {
    id: 'epic',
    nameRu: 'Эпический',
    colorHex: '#c084fc',
    borderHex: '#9333ea',
    bgTint: 'rgba(192, 132, 252, 0.16)',
    statMultiplier: 1.85,
    affixCount: 3,
    weight: 7,
    salvageGold: 130,
    salvageEssence: 25,
  },
  legendary: {
    id: 'legendary',
    nameRu: 'Легендарный',
    colorHex: '#fbbf24',
    borderHex: '#d97706',
    bgTint: 'rgba(251, 191, 36, 0.18)',
    statMultiplier: 2.35,
    affixCount: 4,
    weight: 2,
    salvageGold: 260,
    salvageEssence: 55,
  },
};

export const SLOT_NAMES_RU: Record<ItemSlot, string> = {
  weapon: 'Оружие',
  armor: 'Броня',
  helmet: 'Шлем',
  ring: 'Кольцо',
};

export const STAT_NAMES_RU: Record<keyof ItemStats, { label: string; dative: string; suffix: string }> = {
  damage: { label: 'Урон', dative: 'урону', suffix: '' },
  maxHp: { label: 'Здоровье', dative: 'здоровью', suffix: '' },
  critChance: { label: 'Шанс крита', dative: 'шансу крита', suffix: '%' },
  attackSpeed: { label: 'Скорость атаки', dative: 'скорости атаки', suffix: '%' },
  moveSpeed: { label: 'Скорость бега', dative: 'скорости бега', suffix: '%' },
  armor: { label: 'Броня', dative: 'броне', suffix: '' },
};

export type GrammaticalForm = 'm' | 'f' | 'pl';

export interface ItemTemplate {
  id: string;
  nameRu: string;
  grammar: GrammaticalForm;
  slot: ItemSlot;
  iconName: GameIconName;
  weaponSprite?: WeaponSpriteType;
  isRanged?: boolean;
  baseStats: ItemStats;
  descriptionRu: string;
}

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // Weapons
  {
    id: 'iron_broadsword',
    nameRu: 'Полуторный меч стража',
    grammar: 'm',
    slot: 'weapon',
    iconName: 'broadsword',
    weaponSprite: 'broadsword',
    baseStats: { damage: 22, critChance: 5 },
    descriptionRu: 'Сбалансированный клинок рыцарей пепельного бастиона.',
  },
  {
    id: 'legion_gladius',
    nameRu: 'Гладиус клятвы',
    grammar: 'm',
    slot: 'weapon',
    iconName: 'gladius',
    weaponSprite: 'gladius',
    baseStats: { damage: 18, attackSpeed: 14, critChance: 7 },
    descriptionRu: 'Короткий и быстрый клинок для стремительных выпадов.',
  },
  {
    id: 'executioner_axe',
    nameRu: 'Секира палача',
    grammar: 'f',
    slot: 'weapon',
    iconName: 'battle-axe',
    weaponSprite: 'battle-axe',
    baseStats: { damage: 31, critChance: 9 },
    descriptionRu: 'Тяжёлое двуручное лезвие, сокрушающее кости и щиты.',
  },
  {
    id: 'shadow_daggers',
    nameRu: 'Парные клинки тени',
    grammar: 'pl',
    slot: 'weapon',
    iconName: 'daggers',
    weaponSprite: 'daggers',
    baseStats: { damage: 15, attackSpeed: 24, critChance: 14, moveSpeed: 5 },
    descriptionRu: 'Бритвенно-острые кинжалы для молниеносных серий ударов.',
  },
  {
    id: 'astral_staff',
    nameRu: 'Посох пустоты',
    grammar: 'm',
    slot: 'weapon',
    iconName: 'wizard-staff',
    weaponSprite: 'wizard-staff',
    isRanged: true,
    baseStats: { damage: 25, critChance: 10, attackSpeed: 8 },
    descriptionRu: 'Выпускает сгустки эфирного пламени на среднюю дистанцию.',
  },
  {
    id: 'inquisitor_crossbow',
    nameRu: 'Арбалет дознавателя',
    grammar: 'm',
    slot: 'weapon',
    iconName: 'crossbow',
    weaponSprite: 'crossbow',
    isRanged: true,
    baseStats: { damage: 27, critChance: 12 },
    descriptionRu: 'Тяжёлый стальной арбалет с пробивными болтами.',
  },
  // Armor
  {
    id: 'citadel_plate',
    nameRu: 'Кираса Цитадели',
    grammar: 'f',
    slot: 'armor',
    iconName: 'chest-armor',
    baseStats: { maxHp: 55, armor: 8 },
    descriptionRu: 'Кованые стальные пластины с гербом павшего ордена.',
  },
  {
    id: 'stalker_brigandine',
    nameRu: 'Бригантина следопыта',
    grammar: 'f',
    slot: 'armor',
    iconName: 'leather-armor',
    baseStats: { maxHp: 35, armor: 5, moveSpeed: 9, attackSpeed: 6 },
    descriptionRu: 'Лёгкий доспех из дублёной кожи с клепаными вставками.',
  },
  // Helmets
  {
    id: 'warden_barbute',
    nameRu: 'Барбют хранителя',
    grammar: 'm',
    slot: 'helmet',
    iconName: 'barbute',
    baseStats: { maxHp: 32, armor: 5, critChance: 4 },
    descriptionRu: 'Закрытый шлем, защищающий от осколков и проклятий.',
  },
  {
    id: 'crusader_visor',
    nameRu: 'Шлем с забралом',
    grammar: 'm',
    slot: 'helmet',
    iconName: 'visored-helm',
    baseStats: { maxHp: 42, armor: 6, damage: 5 },
    descriptionRu: 'Массивный рыцарский шлем, внушающий ужас нежити.',
  },
  // Rings
  {
    id: 'ember_signet',
    nameRu: 'Перстень тлеющего угля',
    grammar: 'm',
    slot: 'ring',
    iconName: 'ring',
    baseStats: { damage: 8, critChance: 8, attackSpeed: 10 },
    descriptionRu: 'Древнее золотое кольцо, согревающее руку в бою.',
  },
  {
    id: 'reaper_skull_ring',
    nameRu: 'Печатка жнеца',
    grammar: 'f',
    slot: 'ring',
    iconName: 'skull-ring',
    baseStats: { damage: 12, critChance: 11, maxHp: 18 },
    descriptionRu: 'Кольцо из почерневшего серебра, питающееся силой павших.',
  },
];

interface AffixPoolEntry {
  id: string;
  nameRu: string;
  statKey: keyof ItemStats;
  minVal: number;
  maxVal: number;
  isPercent?: boolean;
}

const AFFIX_POOL: AffixPoolEntry[] = [
  { id: 'ferocity', nameRu: 'Свирепость', statKey: 'damage', minVal: 4, maxVal: 11 },
  { id: 'vitality', nameRu: 'Живучесть', statKey: 'maxHp', minVal: 15, maxVal: 38 },
  { id: 'precision', nameRu: 'Точность', statKey: 'critChance', minVal: 3, maxVal: 9, isPercent: true },
  { id: 'zeal', nameRu: 'Рвение', statKey: 'attackSpeed', minVal: 5, maxVal: 14, isPercent: true },
  { id: 'swiftness', nameRu: 'Стремительность', statKey: 'moveSpeed', minVal: 4, maxVal: 11, isPercent: true },
  { id: 'fortitude', nameRu: 'Стойкость', statKey: 'armor', minVal: 2, maxVal: 6 },
];

const RARITY_PREFIXES_RU: Record<ItemRarity, Record<GrammaticalForm, string[]>> = {
  common: {
    m: ['Потёртый', 'Простой', 'Железный'],
    f: ['Потёртая', 'Простая', 'Железная'],
    pl: ['Потёртые', 'Простые', 'Железные'],
  },
  uncommon: {
    m: ['Закалённый', 'Добротный', 'Острый'],
    f: ['Закалённая', 'Добротная', 'Острая'],
    pl: ['Закалённые', 'Добротные', 'Острые'],
  },
  rare: {
    m: ['Рунический', 'Кровавый', 'Воронёный'],
    f: ['Руническая', 'Кровавая', 'Воронёная'],
    pl: ['Рунические', 'Кровавые', 'Воронёные'],
  },
  epic: {
    m: ['Проклятый', 'Астральный', 'Демонический'],
    f: ['Проклятая', 'Астральная', 'Демоническая'],
    pl: ['Проклятые', 'Астральные', 'Демонические'],
  },
  legendary: {
    m: ['Предвечный', 'Божественный', 'Царский'],
    f: ['Предвечная', 'Божественная', 'Царская'],
    pl: ['Предвечные', 'Божественные', 'Царские'],
  },
};

/**
 * Rolls a rarity with wave bonus. Each wave above 1 increases rare+ weight by +25% relative.
 */
export function rollRarity(wave: number = 1, rng: () => number = Math.random): ItemRarity {
  const waveBonusMultiplier = 1 + Math.max(0, wave - 1) * 0.25;
  const weights: Record<ItemRarity, number> = {
    common: RARITY_CONFIG.common.weight,
    uncommon: RARITY_CONFIG.uncommon.weight * (1 + (wave - 1) * 0.1),
    rare: RARITY_CONFIG.rare.weight * waveBonusMultiplier,
    epic: RARITY_CONFIG.epic.weight * waveBonusMultiplier * 1.1,
    legendary: RARITY_CONFIG.legendary.weight * waveBonusMultiplier * 1.25,
  };

  const total = Object.values(weights).reduce((acc, w) => acc + w, 0);
  let roll = rng() * total;
  const order: ItemRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  for (const r of order) {
    if (roll < weights[r]) {
      return r;
    }
    roll -= weights[r];
  }
  return 'common';
}

export function generateLootItem(options?: {
  wave?: number;
  forcedRarity?: ItemRarity;
  forcedSlot?: ItemSlot;
  forcedTemplateId?: string;
  rng?: () => number;
}): GameItem {
  const rng = options?.rng ?? Math.random;
  const wave = options?.wave ?? 1;
  const rarity = options?.forcedRarity ?? rollRarity(wave, rng);
  const rarityCfg = RARITY_CONFIG[rarity];

  let candidates = ITEM_TEMPLATES;
  if (options?.forcedTemplateId) {
    const exact = ITEM_TEMPLATES.find((t) => t.id === options.forcedTemplateId);
    if (exact) candidates = [exact];
  } else if (options?.forcedSlot) {
    candidates = ITEM_TEMPLATES.filter((t) => t.slot === options.forcedSlot);
  }

  const template = candidates[Math.floor(rng() * candidates.length)] || ITEM_TEMPLATES[0];
  const waveScale = 1 + Math.max(0, wave - 1) * 0.08;
  const mult = rarityCfg.statMultiplier * waveScale;

  const baseStats: ItemStats = {};
  for (const [k, val] of Object.entries(template.baseStats)) {
    if (typeof val === 'number') {
      const variance = 0.92 + rng() * 0.16;
      baseStats[k as keyof ItemStats] = Math.max(1, Math.round(val * mult * variance));
    }
  }

  // Roll affixes
  const shuffledAffixes = [...AFFIX_POOL].sort(() => rng() - 0.5);
  const affixes: ItemAffix[] = [];
  for (let i = 0; i < rarityCfg.affixCount && i < shuffledAffixes.length; i++) {
    const entry = shuffledAffixes[i];
    const rawVal = entry.minVal + rng() * (entry.maxVal - entry.minVal);
    const scaledVal = Math.max(1, Math.round(rawVal * (1 + (wave - 1) * 0.06)));
    affixes.push({
      id: `${entry.id}_${i}`,
      nameRu: entry.nameRu,
      statKey: entry.statKey,
      value: scaledVal,
      isPercent: entry.isPercent,
    });
  }

  const prefixes = RARITY_PREFIXES_RU[rarity][template.grammar];
  const prefix = prefixes[Math.floor(rng() * prefixes.length)];
  const fullName = rarity === 'common' ? template.nameRu : `${prefix} ${template.nameRu.toLowerCase()}`;
  const formattedName = fullName.charAt(0).toUpperCase() + fullName.slice(1);

  return {
    id: `item_${Date.now()}_${Math.floor(rng() * 1000000)}`,
    templateId: template.id,
    name: formattedName,
    slot: template.slot,
    slotNameRu: SLOT_NAMES_RU[template.slot],
    rarity,
    rarityNameRu: rarityCfg.nameRu,
    iconName: template.iconName,
    weaponSprite: template.weaponSprite,
    level: 0,
    baseStats,
    affixes,
    descriptionRu: template.descriptionRu,
    isRanged: template.isRanged,
  };
}

/**
 * Calculates total effective stats of a single item including its upgrade level (+1, +2, ...)
 * Each upgrade level boosts stats by +14% of base+affix total (minimum +1 per present stat).
 */
export function getEffectiveItemStats(item: GameItem): ItemStats {
  const combined: ItemStats = { ...item.baseStats };
  for (const affix of item.affixes) {
    combined[affix.statKey] = (combined[affix.statKey] ?? 0) + affix.value;
  }
  if (item.level <= 0) {
    return combined;
  }
  const upgraded: ItemStats = {};
  const levelMult = 1 + item.level * 0.14;
  for (const [k, val] of Object.entries(combined)) {
    if (typeof val === 'number') {
      const boosted = Math.round(val * levelMult);
      upgraded[k as keyof ItemStats] = Math.max(val + item.level, boosted);
    }
  }
  return upgraded;
}

/**
 * Calculates upgrade cost in Gold and Essence for upgrading an item from `item.level` to `item.level + 1`.
 */
export function getItemUpgradeCost(item: GameItem): { gold: number; essence: number } {
  const rarityMult = RARITY_CONFIG[item.rarity].statMultiplier;
  const nextLevel = item.level + 1;
  const gold = Math.round(35 * rarityMult * Math.pow(1.45, item.level));
  const essence = Math.max(2, Math.round(5 * rarityMult * nextLevel));
  return { gold, essence };
}

/**
 * Calculates salvage return in Gold and Essence for dismantling an item.
 */
export function getItemSalvageValue(item: GameItem): { gold: number; essence: number } {
  const cfg = RARITY_CONFIG[item.rarity];
  const levelBonus = 1 + item.level * 0.5;
  return {
    gold: Math.round(cfg.salvageGold * levelBonus),
    essence: Math.round(cfg.salvageEssence * levelBonus),
  };
}

export const HUB_UPGRADES: Record<HubUpgradeId, HubUpgradeDefinition> = {
  healing_well: {
    id: 'healing_well',
    nameRu: 'Колодец Исцеления',
    descriptionRu: 'Увеличивает максимальный запас здоровья и регенерацию между волнами.',
    iconName: 'emerald',
    maxLevel: 5,
    baseGoldCost: 80,
    baseEssenceCost: 10,
    effectTextRu: (lvl) => `+${lvl * 20} к макс. здоровью и +${lvl * 8}% исцеления после волны`,
  },
  training_dummy: {
    id: 'training_dummy',
    nameRu: 'Боевой Манекен',
    descriptionRu: 'Оттачивает мастерство рыцаря, повышая базовый урон и шанс критического удара.',
    iconName: 'broadsword',
    maxLevel: 5,
    baseGoldCost: 95,
    baseEssenceCost: 12,
    effectTextRu: (lvl) => `+${lvl * 4} к базовому урону и +${lvl * 2}% к шансу крита`,
  },
  safe_pocket: {
    id: 'safe_pocket',
    nameRu: 'Тайный Карман',
    descriptionRu: 'Позволяет сохранить лучший предмет из рюкзака вылазки даже в случае гибели в подземелье.',
    iconName: 'locked-chest',
    maxLevel: 3,
    baseGoldCost: 140,
    baseEssenceCost: 20,
    effectTextRu: (lvl) =>
      lvl === 0
        ? 'Не открыто (при гибели теряется вся добыча вылазки)'
        : `Сохраняет 1 предмет при гибели и даёт +${lvl * 10}% золота с врагов`,
  },
};

export function getHubUpgradeCost(id: HubUpgradeId, currentLevel: number): { gold: number; essence: number } {
  const def = HUB_UPGRADES[id];
  const factor = Math.pow(1.65, currentLevel);
  return {
    gold: Math.round(def.baseGoldCost * factor),
    essence: Math.round(def.baseEssenceCost * factor),
  };
}

/**
 * Pure calculation of total player stats from equipped gear + Hub upgrades.
 */
export function computePlayerStats(
  equipped: EquippedGear,
  hubUpgrades: Record<HubUpgradeId, number>
): ComputedPlayerStats {
  let damage = 14 + (hubUpgrades.training_dummy || 0) * 4;
  let maxHp = 110 + (hubUpgrades.healing_well || 0) * 20;
  let critChance = 6 + (hubUpgrades.training_dummy || 0) * 2;
  let attackSpeedPct = 0;
  let moveSpeedPct = 0;
  let armor = 2;

  const items = [equipped.weapon, equipped.armor, equipped.helmet, equipped.ring];
  for (const item of items) {
    if (!item) continue;
    const stats = getEffectiveItemStats(item);
    if (stats.damage) damage += stats.damage;
    if (stats.maxHp) maxHp += stats.maxHp;
    if (stats.critChance) critChance += stats.critChance;
    if (stats.attackSpeed) attackSpeedPct += stats.attackSpeed;
    if (stats.moveSpeed) moveSpeedPct += stats.moveSpeed;
    if (stats.armor) armor += stats.armor;
  }

  return {
    damage: Math.round(damage),
    maxHp: Math.round(maxHp),
    critChance: Math.min(85, Math.round(critChance)),
    attackSpeed: Number((1 + attackSpeedPct / 100).toFixed(2)),
    moveSpeed: Math.round(160 * (1 + moveSpeedPct / 100)),
    armor: Math.round(armor),
  };
}

/**
 * Creates a deterministic starter kit for a new player so the Stash and Equipped slots are immediately rich and playable.
 */
export function createStarterKit(): { equipped: EquippedGear; stash: GameItem[] } {
  let seed = 42;
  const seededRng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const starterSword = generateLootItem({
    forcedTemplateId: 'iron_broadsword',
    forcedRarity: 'uncommon',
    wave: 1,
    rng: seededRng,
  });
  starterSword.name = 'Клинок стража Цитадели';

  const starterArmor = generateLootItem({
    forcedTemplateId: 'citadel_plate',
    forcedRarity: 'common',
    wave: 1,
    rng: seededRng,
  });

  const starterHelm = generateLootItem({
    forcedTemplateId: 'warden_barbute',
    forcedRarity: 'common',
    wave: 1,
    rng: seededRng,
  });

  const starterRing = generateLootItem({
    forcedTemplateId: 'ember_signet',
    forcedRarity: 'uncommon',
    wave: 1,
    rng: seededRng,
  });

  // Extra items in permanent Stash so the user can test comparing, equipping, upgrading, and salvaging right away
  const stashItems: GameItem[] = [
    generateLootItem({ forcedTemplateId: 'executioner_axe', forcedRarity: 'rare', wave: 2, rng: seededRng }),
    generateLootItem({ forcedTemplateId: 'astral_staff', forcedRarity: 'rare', wave: 2, rng: seededRng }),
    generateLootItem({ forcedTemplateId: 'shadow_daggers', forcedRarity: 'uncommon', wave: 1, rng: seededRng }),
    generateLootItem({ forcedTemplateId: 'stalker_brigandine', forcedRarity: 'uncommon', wave: 2, rng: seededRng }),
    generateLootItem({ forcedTemplateId: 'crusader_visor', forcedRarity: 'rare', wave: 2, rng: seededRng }),
    generateLootItem({ forcedTemplateId: 'reaper_skull_ring', forcedRarity: 'epic', wave: 3, rng: seededRng }),
  ];

  return {
    equipped: {
      weapon: starterSword,
      armor: starterArmor,
      helmet: starterHelm,
      ring: starterRing,
    },
    stash: stashItems,
  };
}
