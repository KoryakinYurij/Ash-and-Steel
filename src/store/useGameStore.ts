import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  computePlayerStats,
  createStarterKit,
  getHubUpgradeCost,
  getItemSalvageValue,
  getItemUpgradeCost,
  HUB_UPGRADES,
  RARITY_CONFIG,
} from '../data/items';
import {
  AppShellState,
  ComputedPlayerStats,
  EquippedGear,
  GameItem,
  GameMode,
  HubStationId,
  HubUpgradeId,
  ItemRarity,
  ItemSlot,
  RunSummarySnapshot,
} from '../types/game';

export interface GameNotification {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'loot';
}

export interface GameStoreState {
  // Shell & Mode
  shellState: AppShellState;
  mode: GameMode;
  activeStationModal: HubStationId | 'extraction' | 'runbag' | null;
  nearbyStation: HubStationId | 'extraction' | null;

  // Permanent Hub State (persisted)
  gold: number;
  essence: number;
  equipped: EquippedGear;
  stash: GameItem[];
  hubUpgrades: Record<HubUpgradeId, number>;
  highestWaveReached: number;
  totalRunsCompleted: number;
  isMuted: boolean;
  autoAttack: boolean;

  // Volatile Run State
  playerHp: number;
  playerMaxHp: number;
  dashCooldownRatio: number; // 0 = ready, 1 = full cooldown
  currentWave: number;
  waveEnemiesKilled: number;
  waveEnemiesTotal: number;
  runBag: GameItem[]; // Max 10 slots
  pendingFloorDrops: GameItem[];
  runGold: number;
  runEssence: number;
  runEnemiesSlain: number;
  runStartTime: number;
  extractionPortalOpen: boolean;
  lastRunSummary: RunSummarySnapshot | null;

  // UI Notifications
  notifications: GameNotification[];

  // Computed helper
  getComputedStats: () => ComputedPlayerStats;

  // Actions
  setShellState: (state: AppShellState) => void;
  setActiveStationModal: (modal: HubStationId | 'extraction' | 'runbag' | null) => void;
  setNearbyStation: (station: HubStationId | 'extraction' | null) => void;
  toggleMute: () => void;
  toggleAutoAttack: () => void;
  pushNotification: (text: string, tone?: GameNotification['tone']) => void;
  dismissNotification: (id: string) => void;

  // Hub Inventory & Forge Actions
  equipItemFromStash: (itemId: string) => void;
  unequipSlotToStash: (slot: ItemSlot) => void;
  salvageStashItem: (itemId: string) => void;
  salvageAllCommonInStash: () => void;
  upgradeItemLevel: (itemId: string, isEquippedSlot?: ItemSlot) => boolean;
  upgradeHubPerk: (perkId: HubUpgradeId) => boolean;

  // Dungeon & Extraction Lifecycle
  startDungeonRun: () => void;
  syncPlayerVitals: (hp: number, maxHp: number, dashCooldownRatio?: number) => void;
  syncWaveProgress: (killed: number, total: number, portalOpen: boolean) => void;
  collectRunCurrency: (goldDelta: number, essenceDelta: number) => void;
  collectRunLoot: (item: GameItem) => boolean;
  toggleProtectRunItem: (itemId: string) => void;
  equipItemFromRunBag: (itemId: string) => void;
  salvageRunBagItem: (itemId: string) => void;
  salvageAllCommonInRunBag: () => void;
  dropRunBagItemToFloor: (itemId: string) => void;
  consumePendingFloorDrops: () => GameItem[];
  dropRunBagItem: (itemId: string) => void;
  extractToHub: () => void;
  retreatToHub: () => void;
  proceedToNextWave: () => void;
  triggerPlayerDefeat: () => void;
  returnToHubFromSummary: () => void;
}

const initialKit = createStarterKit();
const initialUpgrades: Record<HubUpgradeId, number> = {
  healing_well: 1,
  training_dummy: 1,
  safe_pocket: 1,
};
const initialStats = computePlayerStats(initialKit.equipped, initialUpgrades);

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

// Поражение сохраняет один предмет и 35% ресурсов, ранний выход — один предмет и 50%,
// эвакуация через Алтарь забирает всё.
const DEFEAT_KEEP_RATIO = 0.35;
export const RETREAT_KEEP_RATIO = 0.5;

type StoreSet = (partial: Partial<GameStoreState>) => void;

/** Общий финал вылазки с потерями: поражение (35%) и отступление (50%). */
const finishRunWithLoss = (
  state: GameStoreState,
  set: StoreSet,
  outcome: 'retreated' | 'defeat',
  keepRatio: number
) => {
  const stats = computePlayerStats(state.equipped, state.hubUpgrades);
  const hasSafePocket = (state.hubUpgrades.safe_pocket || 0) > 0;

  const savedItem =
    hasSafePocket && state.runBag.length > 0
      ? state.runBag.find((i) => i.isProtected) ||
        [...state.runBag].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])[0]
      : null;
  const cleanedSaved = savedItem ? { ...savedItem, isProtected: false } : null;

  const keptGold = Math.round(state.runGold * keepRatio);
  const keptEssence = Math.round(state.runEssence * keepRatio);
  const durationSec = Math.max(1, Math.round((Date.now() - state.runStartTime) / 1000));

  const summary: RunSummarySnapshot = {
    outcome,
    waveReached: state.currentWave,
    enemiesSlain: state.runEnemiesSlain,
    goldCollected: keptGold,
    essenceCollected: keptEssence,
    itemsExtracted: cleanedSaved ? [cleanedSaved] : [],
    itemsLost: Math.max(0, state.runBag.length - (cleanedSaved ? 1 : 0)),
    protectedItemSaved: cleanedSaved,
    durationSec,
  };

  if (typeof document !== 'undefined') {
    document.body.dataset.state = 'gameover';
  }

  set({
    shellState: 'gameover',
    mode: 'hub',
    activeStationModal: null,
    nearbyStation: null,
    gold: state.gold + keptGold,
    essence: state.essence + keptEssence,
    stash: cleanedSaved ? [cleanedSaved, ...state.stash] : state.stash,
    playerHp: stats.maxHp,
    playerMaxHp: stats.maxHp,
    runBag: [],
    pendingFloorDrops: [],
    runGold: 0,
    runEssence: 0,
    extractionPortalOpen: false,
    lastRunSummary: summary,
  });
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      shellState:
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('autostart') === '1'
          ? 'playing'
          : 'title',
      mode: 'hub',
      activeStationModal: null,
      nearbyStation: null,

      gold: 240,
      essence: 35,
      equipped: initialKit.equipped,
      stash: initialKit.stash,
      hubUpgrades: initialUpgrades,
      highestWaveReached: 1,
      totalRunsCompleted: 0,
      isMuted: false,
      autoAttack: false,

      playerHp: initialStats.maxHp,
      playerMaxHp: initialStats.maxHp,
      dashCooldownRatio: 0,
      currentWave: 1,
      waveEnemiesKilled: 0,
      waveEnemiesTotal: 10,
      runBag: [],
      pendingFloorDrops: [],
      runGold: 0,
      runEssence: 0,
      runEnemiesSlain: 0,
      runStartTime: Date.now(),
      extractionPortalOpen: false,
      lastRunSummary: null,
      notifications: [],

      getComputedStats: () => {
        const state = get();
        return computePlayerStats(state.equipped, state.hubUpgrades);
      },

      setShellState: (shellState) => {
        if (typeof document !== 'undefined') {
          document.body.dataset.state = shellState;
        }
        set({ shellState });
      },

      setActiveStationModal: (activeStationModal) => set({ activeStationModal }),
      setNearbyStation: (nearbyStation) => set({ nearbyStation }),

      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      toggleAutoAttack: () => {
        const next = !get().autoAttack;
        set({ autoAttack: next });
        get().pushNotification(
          next ? 'Авто-атака включена' : 'Авто-атака отключена',
          'info'
        );
      },

      pushNotification: (text, tone = 'info') => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          notifications: [...s.notifications.slice(-3), { id, text, tone }],
        }));
        setTimeout(() => {
          get().dismissNotification(id);
        }, 3200);
      },

      dismissNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      equipItemFromStash: (itemId) => {
        const state = get();
        const itemIndex = state.stash.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) return;

        const itemToEquip = state.stash[itemIndex];
        const currentEquipped = state.equipped[itemToEquip.slot];
        const nextStash = [...state.stash];
        nextStash.splice(itemIndex, 1);
        if (currentEquipped) {
          nextStash.unshift(currentEquipped);
        }

        const nextEquipped: EquippedGear = {
          ...state.equipped,
          [itemToEquip.slot]: itemToEquip,
        };
        const nextStats = computePlayerStats(nextEquipped, state.hubUpgrades);

        set({
          equipped: nextEquipped,
          stash: nextStash,
          playerMaxHp: nextStats.maxHp,
          playerHp: state.mode === 'hub' ? nextStats.maxHp : Math.min(state.playerHp, nextStats.maxHp),
        });
        state.pushNotification(`Экипировано: ${itemToEquip.name}`, 'success');
      },

      unequipSlotToStash: (slot) => {
        const state = get();
        const current = state.equipped[slot];
        if (!current) return;

        const nextEquipped: EquippedGear = {
          ...state.equipped,
          [slot]: null,
        };
        const nextStats = computePlayerStats(nextEquipped, state.hubUpgrades);

        set({
          equipped: nextEquipped,
          stash: [current, ...state.stash],
          playerMaxHp: nextStats.maxHp,
          playerHp: state.mode === 'hub' ? nextStats.maxHp : Math.min(state.playerHp, nextStats.maxHp),
        });
        state.pushNotification(`Снято в хранилище: ${current.name}`, 'info');
      },

      salvageStashItem: (itemId) => {
        const state = get();
        const item = state.stash.find((i) => i.id === itemId);
        if (!item) return;

        const { gold, essence } = getItemSalvageValue(item);
        set({
          stash: state.stash.filter((i) => i.id !== itemId),
          gold: state.gold + gold,
          essence: state.essence + essence,
        });
        state.pushNotification(
          `Разобрано: +${gold} золота, +${essence} эссенции`,
          'success'
        );
      },

      salvageAllCommonInStash: () => {
        const state = get();
        const commons = state.stash.filter((i) => i.rarity === 'common' && i.level === 0);
        if (commons.length === 0) {
          state.pushNotification('Нет обычных предметов для разбора', 'warning');
          return;
        }
        let totalGold = 0;
        let totalEssence = 0;
        for (const item of commons) {
          const val = getItemSalvageValue(item);
          totalGold += val.gold;
          totalEssence += val.essence;
        }
        set({
          stash: state.stash.filter((i) => !(i.rarity === 'common' && i.level === 0)),
          gold: state.gold + totalGold,
          essence: state.essence + totalEssence,
        });
        state.pushNotification(
          `Разобрано предметов (${commons.length}): +${totalGold} золота, +${totalEssence} эссенции`,
          'success'
        );
      },

      upgradeItemLevel: (itemId, isEquippedSlot) => {
        const state = get();
        let targetItem: GameItem | null = null;
        if (isEquippedSlot) {
          targetItem = state.equipped[isEquippedSlot];
        } else {
          targetItem = state.stash.find((i) => i.id === itemId) || null;
        }
        if (!targetItem) return false;

        const cost = getItemUpgradeCost(targetItem);
        if (state.gold < cost.gold || state.essence < cost.essence) {
          state.pushNotification('Недостаточно золота или эссенции для ковки', 'danger');
          return false;
        }

        const upgradedItem: GameItem = {
          ...targetItem,
          level: targetItem.level + 1,
        };

        if (isEquippedSlot) {
          const nextEquipped: EquippedGear = {
            ...state.equipped,
            [isEquippedSlot]: upgradedItem,
          };
          const nextStats = computePlayerStats(nextEquipped, state.hubUpgrades);
          set({
            gold: state.gold - cost.gold,
            essence: state.essence - cost.essence,
            equipped: nextEquipped,
            playerMaxHp: nextStats.maxHp,
            playerHp: state.mode === 'hub' ? nextStats.maxHp : state.playerHp,
          });
        } else {
          set({
            gold: state.gold - cost.gold,
            essence: state.essence - cost.essence,
            stash: state.stash.map((i) => (i.id === itemId ? upgradedItem : i)),
          });
        }

        state.pushNotification(
          `Улучшено: ${upgradedItem.name} +${upgradedItem.level}`,
          'success'
        );
        return true;
      },

      upgradeHubPerk: (perkId) => {
        const state = get();
        const def = HUB_UPGRADES[perkId];
        const currentLvl = state.hubUpgrades[perkId] || 0;
        if (currentLvl >= def.maxLevel) {
          state.pushNotification('Достигнут максимальный уровень улучшения', 'warning');
          return false;
        }

        const cost = getHubUpgradeCost(perkId, currentLvl);
        if (state.gold < cost.gold || state.essence < cost.essence) {
          state.pushNotification('Недостаточно ресурсов для улучшения святилища', 'danger');
          return false;
        }

        const nextUpgrades: Record<HubUpgradeId, number> = {
          ...state.hubUpgrades,
          [perkId]: currentLvl + 1,
        };
        const nextStats = computePlayerStats(state.equipped, nextUpgrades);

        set({
          gold: state.gold - cost.gold,
          essence: state.essence - cost.essence,
          hubUpgrades: nextUpgrades,
          playerMaxHp: nextStats.maxHp,
          playerHp: state.mode === 'hub' ? nextStats.maxHp : state.playerHp,
        });

        state.pushNotification(
          `${def.nameRu}: уровень ${currentLvl + 1}`,
          'success'
        );
        return true;
      },

      startDungeonRun: () => {
        const state = get();
        const stats = computePlayerStats(state.equipped, state.hubUpgrades);
        if (typeof document !== 'undefined') {
          document.body.dataset.state = 'playing';
        }
        set({
          shellState: 'playing',
          mode: 'dungeon',
          activeStationModal: null,
          nearbyStation: null,
          playerHp: stats.maxHp,
          playerMaxHp: stats.maxHp,
          dashCooldownRatio: 0,
          currentWave: 1,
          waveEnemiesKilled: 0,
          waveEnemiesTotal: 10,
          runBag: [],
          pendingFloorDrops: [],
          runGold: 0,
          runEssence: 0,
          runEnemiesSlain: 0,
          runStartTime: Date.now(),
          extractionPortalOpen: false,
          lastRunSummary: null,
        });
        state.pushNotification('Вылазка началась: Волна 1 — Внешние Катакомбы', 'info');
      },

      syncPlayerVitals: (hp, maxHp, dashCooldownRatio) =>
        set((s) => ({
          playerHp: Math.max(0, Math.round(hp)),
          playerMaxHp: Math.max(1, Math.round(maxHp)),
          dashCooldownRatio: dashCooldownRatio ?? s.dashCooldownRatio,
        })),

      syncWaveProgress: (killed, total, portalOpen) =>
        set((s) => {
          const newlyOpened = portalOpen && !s.extractionPortalOpen;
          if (newlyOpened) {
            setTimeout(() => {
              get().pushNotification(
                'Волна зачищена! Алтарь Эвакуации открыт в центре зала.',
                'success'
              );
            }, 0);
          }
          return {
            waveEnemiesKilled: killed,
            waveEnemiesTotal: total,
            extractionPortalOpen: portalOpen,
          };
        }),

      collectRunCurrency: (goldDelta, essenceDelta) => {
        const state = get();
        const pocketBonus = 1 + (state.hubUpgrades.safe_pocket || 0) * 0.1;
        const boostedGold = Math.round(goldDelta * pocketBonus);
        set({
          runGold: state.runGold + boostedGold,
          runEssence: state.runEssence + essenceDelta,
          runEnemiesSlain: state.runEnemiesSlain + (goldDelta > 0 ? 1 : 0),
        });
      },

      collectRunLoot: (item) => {
        const state = get();
        if (state.runBag.length >= 10) {
          state.pushNotification('Рюкзак полон (10/10)! Нажмите [I / Tab], чтобы разобрать или выбросить вещи', 'warning');
          return false;
        }
        const hasProtected = state.runBag.some((i) => i.isProtected);
        const shouldProtect = (state.hubUpgrades.safe_pocket || 0) > 0 && !hasProtected;
        const taggedItem: GameItem = { ...item, isProtected: shouldProtect };

        set({
          runBag: [...state.runBag, taggedItem],
        });
        state.pushNotification(
          `Добыча: ${item.name} (${RARITY_CONFIG[item.rarity].nameRu})`,
          'loot'
        );
        return true;
      },

      toggleProtectRunItem: (itemId) => {
        const state = get();
        if ((state.hubUpgrades.safe_pocket || 0) <= 0) {
          state.pushNotification('Сначала откройте Тайный Карман в Кузнице', 'warning');
          return;
        }
        set({
          runBag: state.runBag.map((i) => ({
            ...i,
            isProtected: i.id === itemId,
          })),
        });
        const target = state.runBag.find((i) => i.id === itemId);
        if (target) {
          state.pushNotification(`В Тайном Кармане: ${target.name}`, 'info');
        }
      },

      equipItemFromRunBag: (itemId) => {
        const state = get();
        const idx = state.runBag.findIndex((i) => i.id === itemId);
        if (idx === -1) return;

        const itemToEquip = { ...state.runBag[idx], isProtected: false };
        const prevEquipped = state.equipped[itemToEquip.slot];
        const nextBag = [...state.runBag];

        if (prevEquipped) {
          nextBag[idx] = {
            ...prevEquipped,
            isProtected: state.runBag[idx].isProtected,
          };
        } else {
          nextBag.splice(idx, 1);
        }

        const nextEquipped: EquippedGear = {
          ...state.equipped,
          [itemToEquip.slot]: itemToEquip,
        };
        const nextStats = computePlayerStats(nextEquipped, state.hubUpgrades);
        const hpDelta = Math.max(0, nextStats.maxHp - state.playerMaxHp);
        const nextHp = Math.min(nextStats.maxHp, state.playerHp + hpDelta);

        set({
          equipped: nextEquipped,
          runBag: nextBag,
          playerMaxHp: nextStats.maxHp,
          playerHp: nextHp,
        });
        state.pushNotification(`Экипировано в бою: ${itemToEquip.name}`, 'success');
      },

      salvageRunBagItem: (itemId) => {
        const state = get();
        const target = state.runBag.find((i) => i.id === itemId);
        if (!target) return;

        const { gold, essence } = getItemSalvageValue(target);
        let remaining = state.runBag.filter((i) => i.id !== itemId);

        // If the salvaged item was protected, automatically protect the highest-rarity remaining item
        if (target.isProtected && (state.hubUpgrades.safe_pocket || 0) > 0 && remaining.length > 0) {
          const best = [...remaining].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])[0];
          remaining = remaining.map((i) => ({ ...i, isProtected: i.id === best.id }));
        }

        set({
          runBag: remaining,
          runGold: state.runGold + gold,
          runEssence: state.runEssence + essence,
        });
        state.pushNotification(
          `Полевой разбор «${target.name}»: +${gold} золота, +${essence} эссенции`,
          'success'
        );
      },

      salvageAllCommonInRunBag: () => {
        const state = get();
        const toSalvage = state.runBag.filter((i) => i.rarity === 'common' && !i.isProtected);
        if (toSalvage.length === 0) {
          state.pushNotification('В рюкзаке нет незащищённых обычных вещей', 'warning');
          return;
        }
        let totalGold = 0;
        let totalEssence = 0;
        for (const item of toSalvage) {
          const val = getItemSalvageValue(item);
          totalGold += val.gold;
          totalEssence += val.essence;
        }
        const salvageIds = new Set(toSalvage.map((i) => i.id));
        set({
          runBag: state.runBag.filter((i) => !salvageIds.has(i.id)),
          runGold: state.runGold + totalGold,
          runEssence: state.runEssence + totalEssence,
        });
        state.pushNotification(
          `Полевой разбор (${toSalvage.length} шт.): +${totalGold} золота, +${totalEssence} эссенции`,
          'success'
        );
      },

      dropRunBagItemToFloor: (itemId) => {
        const state = get();
        const target = state.runBag.find((i) => i.id === itemId);
        if (!target) return;

        let remaining = state.runBag.filter((i) => i.id !== itemId);
        if (target.isProtected && (state.hubUpgrades.safe_pocket || 0) > 0 && remaining.length > 0) {
          const best = [...remaining].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])[0];
          remaining = remaining.map((i) => ({ ...i, isProtected: i.id === best.id }));
        }

        const droppedClean: GameItem = { ...target, isProtected: false };
        set({
          runBag: remaining,
          pendingFloorDrops: [...state.pendingFloorDrops, droppedClean],
        });
        state.pushNotification(`Выброшено на пол: ${target.name}`, 'info');
      },

      consumePendingFloorDrops: () => {
        const current = get().pendingFloorDrops;
        if (current.length === 0) return [];
        set({ pendingFloorDrops: [] });
        return current;
      },

      dropRunBagItem: (itemId) => {
        get().dropRunBagItemToFloor(itemId);
      },

      extractToHub: () => {
        const state = get();
        const stats = computePlayerStats(state.equipped, state.hubUpgrades);
        const cleanedLoot = state.runBag.map((i) => ({ ...i, isProtected: false }));
        const durationSec = Math.max(1, Math.round((Date.now() - state.runStartTime) / 1000));

        const summary: RunSummarySnapshot = {
          outcome: 'extracted',
          waveReached: state.currentWave,
          enemiesSlain: state.runEnemiesSlain,
          goldCollected: state.runGold,
          essenceCollected: state.runEssence,
          itemsExtracted: cleanedLoot,
          itemsLost: 0,
          protectedItemSaved: null,
          durationSec,
        };

        if (typeof document !== 'undefined') {
          document.body.dataset.state = 'gameover';
        }

        set({
          shellState: 'gameover',
          mode: 'hub',
          activeStationModal: null,
          nearbyStation: null,
          gold: state.gold + state.runGold,
          essence: state.essence + state.runEssence,
          stash: [...cleanedLoot, ...state.stash],
          highestWaveReached: Math.max(state.highestWaveReached, state.currentWave),
          totalRunsCompleted: state.totalRunsCompleted + 1,
          playerHp: stats.maxHp,
          playerMaxHp: stats.maxHp,
          runBag: [],
          pendingFloorDrops: [],
          runGold: 0,
          runEssence: 0,
          extractionPortalOpen: false,
          lastRunSummary: summary,
        });
      },

      retreatToHub: () => finishRunWithLoss(get(), set, 'retreated', RETREAT_KEEP_RATIO),

      proceedToNextWave: () => {
        const state = get();
        const nextWave = state.currentWave + 1;
        const healPct = 0.25 + (state.hubUpgrades.healing_well || 0) * 0.08;
        const healAmount = Math.round(state.playerMaxHp * healPct);
        const nextHp = Math.min(state.playerMaxHp, state.playerHp + healAmount);

        set({
          currentWave: nextWave,
          highestWaveReached: Math.max(state.highestWaveReached, nextWave),
          playerHp: nextHp,
          waveEnemiesKilled: 0,
          extractionPortalOpen: false,
          activeStationModal: null,
          nearbyStation: null,
          pendingFloorDrops: [],
        });

        state.pushNotification(
          `Волна ${nextWave}: Шанс редкой добычи +${(nextWave - 1) * 25}%! Исцелено +${healAmount} ОЗ`,
          'loot'
        );
      },

      triggerPlayerDefeat: () => finishRunWithLoss(get(), set, 'defeat', DEFEAT_KEEP_RATIO),

      returnToHubFromSummary: () => {
        const state = get();
        const stats = computePlayerStats(state.equipped, state.hubUpgrades);
        if (typeof document !== 'undefined') {
          document.body.dataset.state = 'playing';
        }
        set({
          shellState: 'playing',
          mode: 'hub',
          activeStationModal: null,
          nearbyStation: null,
          playerHp: stats.maxHp,
          playerMaxHp: stats.maxHp,
          lastRunSummary: null,
        });
      },
    }),
    {
      name: 'ash_and_steel_extraction_v1',
      partialize: (state) => ({
        gold: state.gold,
        essence: state.essence,
        equipped: state.equipped,
        stash: state.stash,
        hubUpgrades: state.hubUpgrades,
        highestWaveReached: state.highestWaveReached,
        totalRunsCompleted: state.totalRunsCompleted,
        isMuted: state.isMuted,
        autoAttack: state.autoAttack,
      }),
    }
  )
);
