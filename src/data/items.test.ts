import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePlayerStats,
  createStarterKit,
  generateLootItem,
  getEffectiveItemStats,
  getHubUpgradeCost,
  getItemSalvageValue,
  getItemUpgradeCost,
  RARITY_CONFIG,
} from './items';
import { getWaveComposition } from './enemies';

test('starter kit provides 4 equipped items and non-empty stash in Russian', () => {
  const kit = createStarterKit();
  assert.ok(kit.equipped.weapon, 'weapon should be equipped');
  assert.ok(kit.equipped.armor, 'armor should be equipped');
  assert.ok(kit.equipped.helmet, 'helmet should be equipped');
  assert.ok(kit.equipped.ring, 'ring should be equipped');
  assert.equal(kit.equipped.weapon?.slotNameRu, 'Оружие');
  assert.ok(kit.stash.length >= 4, 'stash should contain starter extra items');
});

test('item upgrade level (+1, +2) boosts effective stats deterministically', () => {
  const sword = generateLootItem({
    forcedTemplateId: 'iron_broadsword',
    forcedRarity: 'rare',
    wave: 1,
    rng: () => 0.5,
  });

  const baseEffective = getEffectiveItemStats(sword);
  const upgradedSword = { ...sword, level: 2 };
  const upgradedEffective = getEffectiveItemStats(upgradedSword);

  assert.ok(
    (upgradedEffective.damage ?? 0) > (baseEffective.damage ?? 0),
    'upgraded weapon damage must exceed level 0 damage'
  );

  const cost0 = getItemUpgradeCost(sword);
  const cost2 = getItemUpgradeCost(upgradedSword);
  assert.ok(cost2.gold > cost0.gold, 'upgrade gold cost scales with item level');
  assert.ok(cost2.essence > cost0.essence, 'upgrade essence cost scales with item level');
});

test('salvage value scales with rarity and item level', () => {
  const commonItem = generateLootItem({ forcedRarity: 'common', rng: () => 0.3 });
  const epicItem = generateLootItem({ forcedRarity: 'epic', rng: () => 0.3 });

  const commonSalvage = getItemSalvageValue(commonItem);
  const epicSalvage = getItemSalvageValue(epicItem);

  assert.ok(epicSalvage.gold > commonSalvage.gold);
  assert.ok(epicSalvage.essence > commonSalvage.essence);
  assert.equal(RARITY_CONFIG.epic.nameRu, 'Эпический');
});

test('computePlayerStats combines equipped gear and Hub upgrades accurately', () => {
  const kit = createStarterKit();
  const statsLv0 = computePlayerStats(kit.equipped, {
    healing_well: 0,
    training_dummy: 0,
    safe_pocket: 0,
  });
  const statsLv2 = computePlayerStats(kit.equipped, {
    healing_well: 2,
    training_dummy: 2,
    safe_pocket: 1,
  });

  assert.equal(statsLv2.maxHp - statsLv0.maxHp, 40);
  assert.equal(statsLv2.damage - statsLv0.damage, 8);
  assert.ok(getHubUpgradeCost('healing_well', 2).gold > getHubUpgradeCost('healing_well', 0).gold);
});

test('wave composition scales enemy count, multipliers, and +25% rare loot bonus per wave', () => {
  const wave1 = getWaveComposition(1);
  const wave3 = getWaveComposition(3);

  assert.equal(wave1.rareLootBonusPct, 0);
  assert.equal(wave3.rareLootBonusPct, 50);
  assert.ok(wave3.totalEnemies > wave1.totalEnemies);
  assert.ok(wave3.hpMultiplier > wave1.hpMultiplier);
});

test('Run Bag field management supports salvaging, equipping in combat, and dropping items to floor', async () => {
  const { useGameStore } = await import('../store/useGameStore');
  const store = useGameStore.getState();

  store.startDungeonRun();
  const commonBow = generateLootItem({
    forcedTemplateId: 'crossbow_ash',
    forcedRarity: 'common',
    wave: 1,
    rng: () => 0.2,
  });
  const epicStaff = generateLootItem({
    forcedTemplateId: 'staff_embers',
    forcedRarity: 'epic',
    wave: 2,
    rng: () => 0.4,
  });
  const rareArmor = generateLootItem({
    forcedTemplateId: 'brigandine_coat',
    forcedRarity: 'rare',
    wave: 2,
    rng: () => 0.5,
  });

  assert.equal(useGameStore.getState().collectRunLoot(commonBow), true);
  assert.equal(useGameStore.getState().collectRunLoot(epicStaff), true);
  assert.equal(useGameStore.getState().collectRunLoot(rareArmor), true);
  assert.equal(useGameStore.getState().runBag.length, 3);

  // 1. Field salvage common item -> frees slot and adds runGold/runEssence
  const goldBefore = useGameStore.getState().runGold;
  useGameStore.getState().salvageRunBagItem(commonBow.id);
  assert.equal(useGameStore.getState().runBag.length, 2);
  assert.ok(useGameStore.getState().runGold > goldBefore, 'field salvage adds gold to runGold');

  // 2. Equip epic staff from Run Bag -> swaps old weapon into Run Bag
  useGameStore.getState().equipItemFromRunBag(epicStaff.id);
  assert.equal(useGameStore.getState().equipped.weapon?.id, epicStaff.id);
  assert.equal(useGameStore.getState().runBag.length, 2);

  // 3. Drop item from Run Bag to dungeon floor -> frees slot and queues pendingFloorDrops
  useGameStore.getState().dropRunBagItemToFloor(rareArmor.id);
  assert.equal(useGameStore.getState().runBag.length, 1);
  const floorDrops = useGameStore.getState().consumePendingFloorDrops();
  assert.equal(floorDrops.length, 1);
  assert.equal(floorDrops[0].id, rareArmor.id);
  assert.equal(useGameStore.getState().consumePendingFloorDrops().length, 0);
});
