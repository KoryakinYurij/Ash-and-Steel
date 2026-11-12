import React, { useState } from 'react';
import {
  ArrowUpDown,
  Backpack,
  Hammer,
  Lock,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  getEffectiveItemStats,
  getItemSalvageValue,
  RARITY_CONFIG,
  SLOT_NAMES_RU,
  STAT_NAMES_RU,
} from '../../data/items';
import { SoundManager } from '../../engine/SoundManager';
import { useGameStore } from '../../store/useGameStore';
import { GameItem, ItemSlot, ItemStats } from '../../types/game';
import { ItemIcon } from '../ui/ItemIcon';

const SLOTS_ORDER: ItemSlot[] = ['weapon', 'armor', 'helmet', 'ring'];
const STAT_KEYS: (keyof ItemStats)[] = [
  'damage',
  'maxHp',
  'armor',
  'moveSpeed',
  'attackSpeed',
  'critChance',
];

function formatStatValue(key: keyof ItemStats, val: number): string {
  if (key === 'critChance') return `+${val}%`;
  if (key === 'attackSpeed') return `+${Math.round(val * 100)}%`;
  return `+${val}`;
}

export const RunBagModal: React.FC = () => {
  const {
    currentWave,
    runBag,
    runStartingGear,
    runGold,
    runEssence,
    equipped,
    hubUpgrades,
    extractionPortalOpen,
    equipItemFromRunBag,
    salvageRunBagItem,
    salvageAllCommonInRunBag,
    dropRunBagItemToFloor,
    toggleProtectRunItem,
    setActiveStationModal,
  } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(
    runBag[0]?.id || null
  );

  const selectedItem: GameItem | null =
    runBag.find((i) => i.id === selectedId) || runBag[0] || null;

  const comparedEquippedItem: GameItem | null = selectedItem
    ? equipped[selectedItem.slot]
    : null;

  const selectedSalvage = selectedItem ? getItemSalvageValue(selectedItem) : null;
  const hasSafePocket = (hubUpgrades.safe_pocket || 0) > 0;
  const selectedIsStartingGear = selectedItem && runStartingGear?.[selectedItem.slot]?.id === selectedItem.id;
  const commonCount = runBag.filter((i) => i.rarity === 'common' && !i.isProtected).length;

  return (
    <div
      role="dialog"
      aria-label="Полевой Рюкзак Вылазки"
      data-hud-interactive="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 pointer-events-auto"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-[#11141d] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c0e15] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Backpack className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-100">
                Полевой Рюкзак Вылазки ({runBag.length} / 10)
              </h2>
              <p className="text-xs text-slate-400">
                Волна {currentWave} · Надетые находки тоже можно потерять при отступлении или гибели
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-[#161a26] border border-slate-800 text-xs font-mono-num whitespace-nowrap">
              <span className="text-amber-400 font-semibold">
                Золото: +{runGold}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-semibold">
                Эссенция: +{runEssence}
              </span>
            </div>

            {extractionPortalOpen && (
              <button
                type="button"
                onClick={() => setActiveStationModal('extraction')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                К Алтарю Эвакуации
              </button>
            )}

            <button
              type="button"
              aria-label="Закрыть рюкзак"
              onClick={() => setActiveStationModal(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): 10-Slot Run Bag Grid + Equipped Reference */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Слоты рюкзака вылазки ({runBag.length} / 10)
                </h3>

                <button
                  type="button"
                  disabled={commonCount === 0}
                  onClick={() => {
                    SoundManager.playAnvilHammer();
                    salvageAllCommonInRunBag();
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                >
                  Разобрать обычные ({commonCount})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const item = runBag[idx];
                  if (!item) {
                    return (
                      <div
                        key={`empty_slot_${idx}`}
                        className="h-24 rounded-lg border border-dashed border-slate-800/80 bg-[#0b0d14]/70 flex flex-col items-center justify-center text-slate-600"
                      >
                        <span className="text-xs font-mono-num">Слот {idx + 1}</span>
                        <span className="text-[10px] mt-0.5">Свободно</span>
                      </div>
                    );
                  }

                  const isSelected = selectedItem?.id === item.id;
                  const rarityColor = RARITY_CONFIG[item.rarity].colorHex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`h-24 p-2 rounded-lg border flex flex-col items-center justify-between text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#1e2436] border-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-[#141824] border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <ItemIcon
                        iconName={item.iconName}
                        rarity={item.rarity}
                        level={item.level}
                        isProtected={item.isProtected}
                        size="sm"
                      />
                      <div className="w-full">
                        <div
                          className="text-[11px] font-semibold truncate w-full"
                          style={{ color: rarityColor }}
                        >
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {SLOT_NAMES_RU[item.slot]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currently Equipped Gear Strip for Reference */}
            <div className="pt-3 border-t border-slate-800/90">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Текущая экипировка рыцаря (для сравнения)
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {SLOTS_ORDER.map((slot) => {
                  const eqItem = equipped[slot];
                  const isHighlightedSlot = selectedItem?.slot === slot;
                  return (
                    <div
                      key={slot}
                      className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                        isHighlightedSlot
                          ? 'bg-[#192030] border-sky-500/50'
                          : 'bg-[#131722] border-slate-800/80'
                      }`}
                    >
                      {eqItem ? (
                        <ItemIcon
                          iconName={eqItem.iconName}
                          rarity={eqItem.rarity}
                          level={eqItem.level}
                          isProtected={eqItem.isProtected}
                          size="sm"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-600">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">
                          {SLOT_NAMES_RU[slot]}
                        </div>
                        <div
                          className="text-xs font-semibold truncate"
                          style={{
                            color: eqItem
                              ? RARITY_CONFIG[eqItem.rarity].colorHex
                              : '#64748b',
                          }}
                        >
                          {eqItem ? eqItem.name : 'Пусто'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Item Inspector, Stat Comparison & 4 Tactical Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#151925] border border-slate-800 rounded-xl p-5">
            {selectedItem ? (
              <>
                <div>
                  <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800">
                    <ItemIcon
                      iconName={selectedItem.iconName}
                      rarity={selectedItem.rarity}
                      level={selectedItem.level}
                      isProtected={selectedItem.isProtected}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{
                            color: RARITY_CONFIG[selectedItem.rarity].colorHex,
                          }}
                        >
                          {selectedItem.rarityNameRu}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">
                          {selectedItem.slotNameRu}
                        </span>
                      </div>
                      <h4 className="text-lg font-display font-bold text-slate-100 mt-0.5">
                        {selectedItem.name}
                        {selectedItem.level > 0 ? ` +${selectedItem.level}` : ''}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {selectedItem.descriptionRu}
                      </p>
                    </div>
                  </div>

                  {/* Stats & Comparison with Equipped Slot */}
                  <div className="py-4 space-y-2 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Характеристики предмета
                      </span>
                      {comparedEquippedItem && (
                        <span className="text-[11px] text-slate-400">
                          Сравнение с надетой вещью
                        </span>
                      )}
                    </div>

                    {(() => {
                      const candStats = getEffectiveItemStats(selectedItem);
                      const eqStats = comparedEquippedItem
                        ? getEffectiveItemStats(comparedEquippedItem)
                        : {};

                      return STAT_KEYS.map((key) => {
                        const val = candStats[key];
                        const eqVal = eqStats[key];
                        if (val === undefined && eqVal === undefined) return null;

                        const numVal = val ?? 0;
                        const numEq = eqVal ?? 0;
                        const diff = Number((numVal - numEq).toFixed(2));

                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-[#10131c]"
                          >
                            <span className="text-slate-300">
                              {STAT_NAMES_RU[key].label}
                            </span>
                            <div className="flex items-center gap-2 font-mono-num">
                              <span className="font-semibold text-slate-100">
                                {val !== undefined ? formatStatValue(key, val) : '0'}
                              </span>
                              {comparedEquippedItem && diff !== 0 && (
                                <span
                                  className={
                                    diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }
                                >
                                  ({diff > 0 ? `+${diff}` : diff})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* 4 Tactical Actions */}
                <div className="pt-4 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      SoundManager.playLootPickup();
                      equipItemFromRunBag(selectedItem.id);
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Экипировать в бою (Заменить {SLOT_NAMES_RU[selectedItem.slot].toLowerCase()})
                  </button>

                  {hasSafePocket && !selectedIsStartingGear && (
                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.playLootPickup();
                        toggleProtectRunItem(selectedItem.id);
                      }}
                      className={`w-full py-2 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                        selectedItem.isProtected
                          ? 'bg-amber-950/40 border-amber-400 text-amber-300'
                          : 'bg-[#1b2030] hover:bg-[#23293d] border-slate-700 text-slate-200'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {selectedItem.isProtected
                        ? 'Защищено в Тайном Кармане'
                        : 'Защитить при отступлении и гибели'}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {selectedSalvage && (
                      <button
                        type="button"
                        onClick={() => {
                          SoundManager.playAnvilHammer();
                          salvageRunBagItem(selectedItem.id);
                        }}
                        className="py-2.5 px-3 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-semibold text-xs flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Hammer className="w-3.5 h-3.5" />
                          Полевой разбор
                        </span>
                        <span className="text-[10px] font-mono-num text-emerald-400">
                          +{selectedSalvage.gold} зол. · +{selectedSalvage.essence} эсс.
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.playSwordSlash();
                        dropRunBagItemToFloor(selectedItem.id);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-semibold text-xs flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" />
                        Выбросить на пол
                      </span>
                      <span className="text-[10px] text-rose-400/90">
                        Останется лежать в зале
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                <Backpack className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-300">
                  Рюкзак вылазки пуст (0 / 10)
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Побеждайте врагов в катакомбах, чтобы собирать редкое оружие, броню и реликвии.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
