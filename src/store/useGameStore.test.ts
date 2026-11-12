import test from 'node:test';
import assert from 'node:assert/strict';
import { createStarterKit, generateLootItem } from '../data/items';
import { useGameStore } from './useGameStore';
import type { GameStoreState } from './useGameStore';
import type { GameItem, HubUpgradeId, ItemSlot } from '../types/game';

const makeItem = (rarity: GameItem['rarity'], isProtected = false): GameItem => ({
  ...generateLootItem({ forcedRarity: rarity, wave: 2, rng: () => 0.42 }),
  id: `test-${rarity}`,
  isProtected,
});

const upgrades = (safePocket: number): Record<HubUpgradeId, number> => ({
  healing_well: 0,
  training_dummy: 0,
  safe_pocket: safePocket,
});

const prepareRun = (overrides: Partial<GameStoreState> = {}) => {
  useGameStore.setState({
    shellState: 'playing',
    mode: 'dungeon',
    gold: 1000,
    essence: 100,
    equipped: createStarterKit().equipped,
    stash: [],
    hubUpgrades: upgrades(1),
    runStartingGear: null,
    runBag: [],
    pendingFloorDrops: [],
    runGold: 0,
    runEssence: 0,
    runEnemiesSlain: 3,
    runStartTime: Date.now() - 5000,
    currentWave: 3,
    extractionPortalOpen: false,
    lastRunSummary: null,
    highestWaveReached: 2,
    totalRunsCompleted: 4,
    ...overrides,
  });
};

test('retreat keeps half the resources and does not count as a completed run', () => {
  prepareRun({ runGold: 101, runEssence: 40 });

  useGameStore.getState().retreatToHub();
  const state = useGameStore.getState();

  assert.equal(state.lastRunSummary?.outcome, 'retreated');
  assert.equal(state.lastRunSummary?.goldCollected, 51);
  assert.equal(state.lastRunSummary?.essenceCollected, 20);
  assert.equal(state.gold, 1051);
  assert.equal(state.essence, 120);
  assert.equal(state.totalRunsCompleted, 4, 'retreat must not increment completed runs');
  assert.equal(state.highestWaveReached, 2, 'retreat must not rewrite the depth record');
  assert.deepEqual(state.runBag, []);
  assert.equal(state.runGold, 0);
  assert.equal(state.runEssence, 0);
  assert.equal(state.shellState, 'gameover');
  assert.equal(state.mode, 'hub');
  assert.equal(state.extractionPortalOpen, false);
});

test('defeat keeps only 35% of the resources', () => {
  prepareRun({ runGold: 200, runEssence: 50 });

  useGameStore.getState().triggerPlayerDefeat();
  const state = useGameStore.getState();

  assert.equal(state.lastRunSummary?.outcome, 'defeat');
  assert.equal(state.lastRunSummary?.goldCollected, 70);
  assert.equal(state.lastRunSummary?.essenceCollected, 18);
  assert.equal(state.gold, 1070);
  assert.equal(state.essence, 118);
  assert.equal(state.totalRunsCompleted, 4);
});

test('safe pocket saves the protected item on retreat and counts the rest as lost', () => {
  const bag = [makeItem('common'), makeItem('rare', true), makeItem('epic')];
  prepareRun({ runBag: bag, runGold: 10, runEssence: 10, hubUpgrades: upgrades(1) });

  useGameStore.getState().retreatToHub();
  const state = useGameStore.getState();

  assert.equal(state.stash.length, 1);
  assert.equal(state.stash[0].rarity, 'rare', 'the protected item wins over the best rarity');
  assert.equal(state.stash[0].isProtected, false, 'shelved items must lose the protection flag');
  assert.equal(state.lastRunSummary?.itemsExtracted.length, 1);
  assert.equal(state.lastRunSummary?.itemsLost, 2);
  assert.equal(state.lastRunSummary?.protectedItemSaved?.rarity, 'rare');
});

test('without safe pocket nothing is saved, but the resource share stays the same', () => {
  const bag = [makeItem('legendary'), makeItem('common')];
  prepareRun({ runBag: bag, runGold: 10, runEssence: 10, hubUpgrades: upgrades(0) });

  useGameStore.getState().retreatToHub();
  const state = useGameStore.getState();

  assert.deepEqual(state.stash, []);
  assert.deepEqual(state.lastRunSummary?.itemsExtracted, []);
  assert.equal(state.lastRunSummary?.itemsLost, 2);
  assert.equal(state.lastRunSummary?.protectedItemSaved, null);
  assert.equal(state.gold, 1005);
  assert.equal(state.essence, 105);
});

test('altar extraction keeps the full haul and advances the record', () => {
  const bag = [makeItem('epic'), makeItem('common')];
  prepareRun({ runBag: bag, runGold: 33, runEssence: 7, currentWave: 6, extractionPortalOpen: true });

  useGameStore.getState().extractToHub();
  const state = useGameStore.getState();

  assert.equal(state.lastRunSummary?.outcome, 'extracted');
  assert.equal(state.gold, 1033);
  assert.equal(state.essence, 107);
  assert.equal(state.stash.length, 2);
  assert.equal(state.lastRunSummary?.itemsLost, 0);
  assert.equal(state.totalRunsCompleted, 5);
  assert.equal(state.highestWaveReached, 6);
});

const collectLoot = (slot: ItemSlot, rarity: GameItem['rarity'] = 'rare'): GameItem => {
  const item = {
    ...generateLootItem({ forcedSlot: slot, forcedRarity: rarity, wave: 1 }),
    id: `loot-${slot}`,
  };
  assert.equal(useGameStore.getState().collectRunLoot(item), true);
  return item;
};

test('retreat counts worn loot as at risk and restores the carried starting gear', () => {
  prepareRun({ mode: 'hub' });
  const startingGear = useGameStore.getState().equipped;
  useGameStore.getState().startDungeonRun();
  const weapon = collectLoot('weapon');
  const armor = collectLoot('armor');
  const helmet = collectLoot('helmet');
  useGameStore.getState().equipItemFromRunBag(weapon.id);
  useGameStore.getState().equipItemFromRunBag(armor.id);
  useGameStore.getState().toggleProtectRunItem(helmet.id);
  useGameStore.getState().setShellState('paused');
  useGameStore.getState().retreatToHub();

  const state = useGameStore.getState();
  assert.deepEqual(state.equipped, startingGear);
  assert.deepEqual(state.stash.map((item) => item.id), [helmet.id]);
  assert.equal(state.lastRunSummary?.itemsLost, 2);
});

test('the safe pocket protects the same item after equipping it', () => {
  prepareRun({ mode: 'hub' });
  useGameStore.getState().startDungeonRun();
  const weapon = collectLoot('weapon');
  useGameStore.getState().equipItemFromRunBag(weapon.id);
  collectLoot('armor');
  useGameStore.getState().triggerPlayerDefeat();

  const state = useGameStore.getState();
  assert.deepEqual(state.stash.map((item) => item.id), [weapon.id]);
  assert.equal(state.lastRunSummary?.protectedItemSaved?.id, weapon.id);
  assert.equal(state.lastRunSummary?.itemsLost, 1);
});

for (const removeItem of ['dropRunBagItemToFloor', 'salvageRunBagItem'] as const) {
  test(`safe pocket reassigns to the rarest carried loot after ${removeItem}`, () => {
    prepareRun({ mode: 'hub' });
    useGameStore.getState().startDungeonRun();
    const firstLoot = collectLoot('armor');
    const weapon = collectLoot('weapon', 'legendary');
    useGameStore.getState().equipItemFromRunBag(weapon.id);
    collectLoot('helmet', 'common');
    useGameStore.getState()[removeItem](firstLoot.id);

    assert.equal(useGameStore.getState().equipped.weapon?.isProtected, true);
    useGameStore.getState().retreatToHub();
    assert.equal(useGameStore.getState().lastRunSummary?.protectedItemSaved?.id, weapon.id);
  });
}

test('restarting a run discards worn loot without recreating salvaged starting gear', () => {
  prepareRun({ mode: 'hub' });
  const startingWeapon = useGameStore.getState().equipped.weapon!;
  useGameStore.getState().startDungeonRun();
  const weapon = collectLoot('weapon');
  useGameStore.getState().equipItemFromRunBag(weapon.id);
  useGameStore.getState().salvageRunBagItem(startingWeapon.id);
  useGameStore.getState().startDungeonRun();

  const state = useGameStore.getState();
  assert.equal(state.equipped.weapon, null);
  assert.deepEqual(state.stash, []);
  assert.deepEqual(state.runBag, []);
});

test('only an open altar can secure worn loot, and the payout can only happen once', () => {
  prepareRun({ mode: 'hub' });
  const startingWeapon = useGameStore.getState().equipped.weapon!;
  useGameStore.getState().startDungeonRun();
  const weapon = collectLoot('weapon');
  const armor = collectLoot('armor');
  useGameStore.getState().equipItemFromRunBag(weapon.id);
  useGameStore.getState().extractToHub();
  assert.equal(useGameStore.getState().lastRunSummary, null);

  useGameStore.getState().syncWaveProgress(10, 10, true);
  useGameStore.getState().extractToHub();
  useGameStore.getState().extractToHub();
  useGameStore.getState().retreatToHub();

  const state = useGameStore.getState();
  assert.equal(state.lastRunSummary?.outcome, 'extracted');
  assert.deepEqual(state.lastRunSummary?.itemsExtracted.map((item) => item.id), [armor.id, weapon.id]);
  assert.deepEqual(state.stash.map((item) => item.id), [startingWeapon.id, armor.id]);
  assert.equal(state.equipped.weapon?.id, weapon.id);
  assert.equal(state.equipped.weapon?.isProtected, false);
  assert.equal(state.totalRunsCompleted, 5);
});
