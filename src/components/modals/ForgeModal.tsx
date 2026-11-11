import React, { useMemo, useState } from 'react';
import { Hammer, ArrowUp, ShieldAlert, Sparkles, X } from 'lucide-react';
import {
  getEffectiveItemStats,
  getHubUpgradeCost,
  getItemUpgradeCost,
  HUB_UPGRADES,
  RARITY_CONFIG,
  SLOT_NAMES_RU,
  STAT_NAMES_RU,
} from '../../data/items';
import { SoundManager } from '../../engine/SoundManager';
import { useGameStore } from '../../store/useGameStore';
import { GameItem, HubUpgradeId, ItemSlot, ItemStats } from '../../types/game';
import { ItemIcon } from '../ui/ItemIcon';

const SLOTS_ORDER: ItemSlot[] = ['weapon', 'armor', 'helmet', 'ring'];
const PERK_ORDER: HubUpgradeId[] = ['healing_well', 'training_dummy', 'safe_pocket'];

export const ForgeModal: React.FC = () => {
  const {
    gold,
    essence,
    equipped,
    stash,
    hubUpgrades,
    upgradeItemLevel,
    upgradeHubPerk,
    setActiveStationModal,
  } = useGameStore();

  const [selectedRef, setSelectedRef] = useState<{
    id: string;
    isEquippedSlot?: ItemSlot;
  } | null>(() => {
    if (equipped.weapon) return { id: equipped.weapon.id, isEquippedSlot: 'weapon' };
    if (stash[0]) return { id: stash[0].id };
    return null;
  });

  const targetItem: GameItem | null = useMemo(() => {
    if (!selectedRef) return null;
    if (selectedRef.isEquippedSlot) {
      return equipped[selectedRef.isEquippedSlot];
    }
    return stash.find((i) => i.id === selectedRef.id) || null;
  }, [selectedRef, equipped, stash]);

  const currentStats = useMemo(
    () => (targetItem ? getEffectiveItemStats(targetItem) : null),
    [targetItem]
  );

  const nextLevelStats = useMemo(() => {
    if (!targetItem) return null;
    return getEffectiveItemStats({ ...targetItem, level: targetItem.level + 1 });
  }, [targetItem]);

  const upgradeCost = useMemo(
    () => (targetItem ? getItemUpgradeCost(targetItem) : { gold: 0, essence: 0 }),
    [targetItem]
  );

  const canAffordItemUpgrade =
    targetItem !== null && gold >= upgradeCost.gold && essence >= upgradeCost.essence;

  return (
    <div
      role="dialog"
      aria-label="Кузница Улучшений"
      data-hud-interactive="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 pointer-events-auto"
    >
      <div className="w-full max-w-5xl bg-[#11141d] border border-orange-500/35 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c0e15] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ItemIcon iconName="anvil-impact" rarity="legendary" size="md" />
            <div>
              <h2 className="text-xl font-display font-bold tracking-wide text-amber-100">
                Кузница Улучшений и Святилище
              </h2>
              <p className="text-xs text-slate-400">
                Закаляйте снаряжение (+1, +2, +3...) и развивайте постоянные благословения Цитадели
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 px-3.5 py-1.5 rounded-lg bg-[#161a26] border border-slate-800">
              <div className="flex items-center gap-1.5">
                <ItemIcon iconName="two-coins" rarity="legendary" size="xs" showFrame={false} />
                <span className="text-xs text-slate-400">Золото:</span>
                <span className="text-sm font-mono-num font-bold text-amber-400">{gold}</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <ItemIcon iconName="emerald" rarity="uncommon" size="xs" showFrame={false} />
                <span className="text-xs text-slate-400">Эссенция:</span>
                <span className="text-sm font-mono-num font-bold text-emerald-400">{essence}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveStationModal('stash')}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              К Хранилищу
            </button>

            <button
              type="button"
              aria-label="Закрыть кузницу"
              onClick={() => setActiveStationModal(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-y-auto">
          {/* Left: Select Item to Upgrade (4 cols) */}
          <div className="lg:col-span-4 bg-[#0d1017] border border-slate-800/90 rounded-lg p-3.5 flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Надетые предметы
            </h3>
            <div className="space-y-1.5 mb-3">
              {SLOTS_ORDER.map((slot) => {
                const item = equipped[slot];
                if (!item) return null;
                const isSelected =
                  selectedRef?.id === item.id && selectedRef.isEquippedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedRef({ id: item.id, isEquippedSlot: slot })}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-950/30 border-orange-400'
                        : 'bg-[#131722] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ItemIcon
                      iconName={item.iconName}
                      rarity={item.rarity}
                      level={item.level}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-xs font-semibold truncate"
                        style={{ color: RARITY_CONFIG[item.rarity].colorHex }}
                      >
                        {item.name} {item.level > 0 ? `+${item.level}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {SLOT_NAMES_RU[slot]} · Экипировано
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Предметы в хранилище ({stash.length})
            </h3>
            <div className="space-y-1.5 max-h-[195px] overflow-y-auto pr-1">
              {stash.map((item) => {
                const isSelected =
                  selectedRef?.id === item.id && !selectedRef.isEquippedSlot;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedRef({ id: item.id })}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-950/30 border-orange-400'
                        : 'bg-[#131722] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ItemIcon
                      iconName={item.iconName}
                      rarity={item.rarity}
                      level={item.level}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-xs font-semibold truncate"
                        style={{ color: RARITY_CONFIG[item.rarity].colorHex }}
                      >
                        {item.name} {item.level > 0 ? `+${item.level}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.slotNameRu} · {item.rarityNameRu}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Anvil Item Upgrade Station (4 cols) */}
          <div className="lg:col-span-4 bg-[#0d1017] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
            {targetItem && currentStats && nextLevelStats ? (
              <>
                <div>
                  <div className="flex flex-col items-center text-center pb-3 border-b border-slate-800">
                    <ItemIcon
                      iconName={targetItem.iconName}
                      rarity={targetItem.rarity}
                      level={targetItem.level}
                      size="lg"
                      className="mb-2"
                    />
                    <div
                      className="text-sm font-bold"
                      style={{ color: RARITY_CONFIG[targetItem.rarity].colorHex }}
                    >
                      {targetItem.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono-num">
                      <span className="text-slate-400">Уровень ковки:</span>
                      <span className="text-slate-100 font-bold">+{targetItem.level}</span>
                      <span className="text-orange-400">→</span>
                      <span className="text-amber-300 font-bold">+{targetItem.level + 1}</span>
                    </div>
                  </div>

                  <div className="my-3 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-300">
                      Прирост характеристик при ковке:
                    </div>
                    {(Object.keys(currentStats) as (keyof ItemStats)[]).map((statKey) => {
                      const curVal = currentStats[statKey] ?? 0;
                      const nxtVal = nextLevelStats[statKey] ?? 0;
                      if (curVal === 0 && nxtVal === 0) return null;
                      const meta = STAT_NAMES_RU[statKey];
                      return (
                        <div
                          key={statKey}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[#131722] border border-slate-800/70"
                        >
                          <span className="text-slate-300">{meta.label}</span>
                          <div className="flex items-center gap-2 font-mono-num">
                            <span className="text-slate-400">
                              +{curVal}
                              {meta.suffix}
                            </span>
                            <span className="text-orange-400">→</span>
                            <span className="text-emerald-400 font-bold">
                              +{nxtVal}
                              {meta.suffix}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-400">Стоимость закалки:</span>
                    <div className="flex items-center gap-2 font-mono-num font-bold">
                      <span className={gold >= upgradeCost.gold ? 'text-amber-400' : 'text-rose-400'}>
                        {upgradeCost.gold} золота
                      </span>
                      <span className="text-slate-600">·</span>
                      <span
                        className={
                          essence >= upgradeCost.essence ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {upgradeCost.essence} эссенции
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canAffordItemUpgrade}
                    onClick={() => {
                      const ok = upgradeItemLevel(targetItem.id, selectedRef?.isEquippedSlot);
                      if (ok) {
                        SoundManager.playAnvilHammer();
                      }
                    }}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      canAffordItemUpgrade
                        ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Hammer className="w-4 h-4" />
                    Улучшить до +{targetItem.level + 1}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-500">
                Выберите предмет слева для закалки на наковальне
              </div>
            )}
          </div>

          {/* Right: Permanent Hub Perks (4 cols) */}
          <div className="lg:col-span-4 bg-[#0d1017] border border-slate-800/90 rounded-lg p-3.5 flex flex-col">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Улучшения Цитадели (Навсегда)
              </h3>
            </div>

            <div className="space-y-2.5 flex-1">
              {PERK_ORDER.map((perkId) => {
                const def = HUB_UPGRADES[perkId];
                const lvl = hubUpgrades[perkId] || 0;
                const isMax = lvl >= def.maxLevel;
                const cost = getHubUpgradeCost(perkId, lvl);
                const canAfford = !isMax && gold >= cost.gold && essence >= cost.essence;

                return (
                  <div
                    key={perkId}
                    className="p-2.5 rounded-lg bg-[#131722] border border-slate-800 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <ItemIcon iconName={def.iconName} rarity="epic" size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{def.nameRu}</span>
                          <span className="text-[11px] font-mono-num text-amber-400 font-semibold">
                            Ур. {lvl}/{def.maxLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {def.descriptionRu}
                        </p>
                        <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                          {def.effectTextRu(lvl)}
                        </div>
                      </div>
                    </div>

                    {isMax ? (
                      <div className="py-1 text-center text-[11px] font-semibold text-amber-300 bg-amber-950/30 rounded border border-amber-500/30">
                        Максимальный уровень достигнут
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          const ok = upgradeHubPerk(perkId);
                          if (ok) SoundManager.playAnvilHammer();
                        }}
                        className={`w-full py-1.5 px-2.5 rounded text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                          canAfford
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                          Улучшить (Ур. {lvl + 1})
                        </span>
                        <span className="font-mono-num text-[11px] whitespace-nowrap">
                          {cost.gold} зол. · {cost.essence} эсс.
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-2.5 p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Тайный Карман автоматически защищает выбранный предмет в рюкзаке вылазки.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
