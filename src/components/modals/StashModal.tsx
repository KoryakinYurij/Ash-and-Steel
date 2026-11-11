import React, { useMemo, useState } from 'react';
import { Hammer, Shield, Sparkles, Trash2, X, ArrowUpRight, Check } from 'lucide-react';
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

export const StashModal: React.FC = () => {
  const {
    equipped,
    stash,
    gold,
    essence,
    equipItemFromStash,
    unequipSlotToStash,
    salvageStashItem,
    salvageAllCommonInStash,
    setActiveStationModal,
    getComputedStats,
  } = useGameStore();

  const [slotFilter, setSlotFilter] = useState<'all' | ItemSlot>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    stash[0]?.id || equipped.weapon?.id || null
  );

  const playerStats = getComputedStats();

  const filteredStash = useMemo(() => {
    if (slotFilter === 'all') return stash;
    return stash.filter((item) => item.slot === slotFilter);
  }, [stash, slotFilter]);

  const selectedItem: { item: GameItem; isEquipped: boolean } | null = useMemo(() => {
    if (!selectedItemId) return null;
    for (const slot of SLOTS_ORDER) {
      if (equipped[slot]?.id === selectedItemId) {
        return { item: equipped[slot]!, isEquipped: true };
      }
    }
    const found = stash.find((i) => i.id === selectedItemId);
    if (found) return { item: found, isEquipped: false };
    if (filteredStash[0]) return { item: filteredStash[0], isEquipped: false };
    return null;
  }, [selectedItemId, equipped, stash, filteredStash]);

  const comparedEquippedItem: GameItem | null = useMemo(() => {
    if (!selectedItem || selectedItem.isEquipped) return null;
    return equipped[selectedItem.item.slot];
  }, [selectedItem, equipped]);

  const renderStatComparison = (candidate: GameItem, currentEquipped: GameItem | null) => {
    const candStats = getEffectiveItemStats(candidate);
    const currStats = currentEquipped ? getEffectiveItemStats(currentEquipped) : {};
    const allKeys = Array.from(
      new Set([...Object.keys(candStats), ...Object.keys(currStats)])
    ) as (keyof ItemStats)[];

    return (
      <div className="space-y-1.5">
        {allKeys.map((key) => {
          const cVal = candStats[key] ?? 0;
          const eVal = currStats[key] ?? 0;
          const diff = cVal - eVal;
          const meta = STAT_NAMES_RU[key];
          if (cVal === 0 && eVal === 0) return null;

          return (
            <div
              key={key}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80"
            >
              <span className="text-slate-300">{meta.label}</span>
              <div className="flex items-center gap-2 font-mono-num">
                <span className="text-slate-100 font-semibold">
                  +{cVal}
                  {meta.suffix}
                </span>
                {!selectedItem?.isEquipped && diff !== 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ({diff > 0 ? `+${diff}` : diff}
                    {meta.suffix})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-label="Сундук Хранилища"
      data-hud-interactive="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 pointer-events-auto"
    >
      <div className="w-full max-w-5xl bg-[#11141d] border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c0e15] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ItemIcon iconName="locked-chest" rarity="legendary" size="md" />
            <div>
              <h2 className="text-xl font-display font-bold tracking-wide text-amber-100">
                Сундук Хранилища и Снаряжение
              </h2>
              <p className="text-xs text-slate-400">
                Экипируйте оружие и доспехи в 4 слота или разбирайте лишнюю добычу на ресурсы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
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
              onClick={() => setActiveStationModal('forge')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Hammer className="w-3.5 h-3.5" />
              К Кузнице
            </button>

            <button
              type="button"
              aria-label="Закрыть хранилище"
              onClick={() => setActiveStationModal(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Left Column: Equipped Loadout & Total Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[#0d1017] border border-slate-800/90 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
                <span>Экипировка рыцаря</span>
                <span className="text-xs font-normal text-slate-400">4 активных слота</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {SLOTS_ORDER.map((slot) => {
                  const item = equipped[slot];
                  const isSelected = selectedItem?.item.id === item?.id && item !== null;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => item && setSelectedItemId(item.id)}
                      className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/25 border-amber-400'
                          : 'bg-[#131722] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] text-slate-400 mb-1.5">
                        {SLOT_NAMES_RU[slot]}
                      </span>
                      {item ? (
                        <div className="flex items-center gap-2.5 w-full">
                          <ItemIcon
                            iconName={item.iconName}
                            rarity={item.rarity}
                            level={item.level}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-xs font-semibold truncate"
                              style={{ color: RARITY_CONFIG[item.rarity].colorHex }}
                            >
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {item.rarityNameRu} {item.level > 0 ? `+${item.level}` : ''}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                          <Shield className="w-4 h-4 opacity-40" />
                          <span>Пусто</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player Summary Stats */}
            <div className="bg-[#0d1017] border border-slate-800/90 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Сводные характеристики
              </h3>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-[#131722] border border-slate-800/70">
                  <div className="text-slate-400">Урон атаки</div>
                  <div className="text-base font-mono-num font-bold text-amber-300 mt-0.5">
                    {playerStats.damage}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#131722] border border-slate-800/70">
                  <div className="text-slate-400">Макс. здоровье</div>
                  <div className="text-base font-mono-num font-bold text-emerald-400 mt-0.5">
                    {playerStats.maxHp}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#131722] border border-slate-800/70">
                  <div className="text-slate-400">Шанс крита</div>
                  <div className="text-base font-mono-num font-bold text-sky-400 mt-0.5">
                    {playerStats.critChance}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#131722] border border-slate-800/70">
                  <div className="text-slate-400">Скорость атаки</div>
                  <div className="text-base font-mono-num font-bold text-purple-300 mt-0.5">
                    {Math.round(playerStats.attackSpeed * 100)}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#131722] border border-slate-800/70">
                  <div className="text-slate-400">Скорость бега</div>
                  <div className="text-base font-mono-num font-bold text-slate-200 mt-0.5">
                    {playerStats.moveSpeed}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#131722] border border-slate-800/70">
                  <div className="text-slate-400">Броня</div>
                  <div className="text-base font-mono-num font-bold text-slate-200 mt-0.5">
                    {playerStats.armor}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Permanent Stash Grid (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-[#0d1017] border border-slate-800/90 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 bg-[#141824] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSlotFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    slotFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Все ({stash.length})
                </button>
                {SLOTS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlotFilter(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      slotFilter === s
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {SLOT_NAMES_RU[s]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  SoundManager.playLootPickup();
                  salvageAllCommonInStash();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Разобрать обычные
              </button>
            </div>

            {filteredStash.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <ItemIcon iconName="locked-chest" rarity="common" size="lg" className="opacity-40 mb-3" />
                <p className="text-sm font-medium text-slate-400">В этой категории хранилища пусто</p>
                <p className="text-xs text-slate-500 mt-1">
                  Отправляйтесь в подземелье через Врата Вылазки, чтобы добыть новое снаряжение
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredStash.map((item) => {
                  const rarityCfg = RARITY_CONFIG[item.rarity];
                  const isSelected = selectedItem?.item.id === item.id;
                  const stats = getEffectiveItemStats(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedItemId(item.id);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-400 shadow-sm'
                          : 'bg-[#131722] border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <ItemIcon
                        iconName={item.iconName}
                        rarity={item.rarity}
                        level={item.level}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-semibold truncate"
                          style={{ color: rarityCfg.colorHex }}
                        >
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{item.slotNameRu}</span>
                          <span>·</span>
                          <span>{item.rarityNameRu}</span>
                        </div>
                        <div className="text-[11px] font-mono-num text-slate-300 mt-0.5 truncate">
                          {stats.damage ? `+${stats.damage} Урон ` : ''}
                          {stats.maxHp ? `+${stats.maxHp} ОЗ ` : ''}
                          {stats.critChance ? `+${stats.critChance}% Крит` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Item Inspector & Comparison Tooltip (3 cols) */}
          <div className="lg:col-span-3 flex flex-col bg-[#0d1017] border border-slate-800/90 rounded-lg p-4">
            {selectedItem ? (
              <div className="flex flex-col h-full justify-between space-y-4">
                <div>
                  <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                    <ItemIcon
                      iconName={selectedItem.item.iconName}
                      rarity={selectedItem.item.rarity}
                      level={selectedItem.item.level}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm font-bold leading-snug"
                        style={{ color: RARITY_CONFIG[selectedItem.item.rarity].colorHex }}
                      >
                        {selectedItem.item.name}
                        {selectedItem.item.level > 0 ? ` +${selectedItem.item.level}` : ''}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {selectedItem.item.slotNameRu} · {selectedItem.item.rarityNameRu}
                      </div>
                      {selectedItem.isEquipped && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mt-1">
                          <Check className="w-3 h-3" /> Сейчас экипировано
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic my-3">
                    {selectedItem.item.descriptionRu}
                  </p>

                  <div className="mb-3">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                      Характеристики {comparedEquippedItem ? '(сравнение с надетым)' : ''}:
                    </div>
                    {renderStatComparison(selectedItem.item, comparedEquippedItem)}
                  </div>

                  {selectedItem.item.affixes.length > 0 && (
                    <div className="p-2.5 rounded bg-[#131722] border border-slate-800/80 space-y-1">
                      <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Магические свойства:
                      </div>
                      {selectedItem.item.affixes.map((aff) => (
                        <div key={aff.id} className="text-xs text-slate-300 font-mono-num">
                          • {aff.nameRu}: +{aff.value}
                          {STAT_NAMES_RU[aff.statKey].suffix} к{' '}
                          {STAT_NAMES_RU[aff.statKey].dative}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  {selectedItem.isEquipped ? (
                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.playLootPickup();
                        unequipSlotToStash(selectedItem.item.slot);
                      }}
                      className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors cursor-pointer"
                    >
                      Снять в хранилище
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          SoundManager.playLootPickup();
                          equipItemFromStash(selectedItem.item.id);
                        }}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Экипировать предмет
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          SoundManager.playAnvilHammer();
                          salvageStashItem(selectedItem.item.id);
                          setSelectedItemId(null);
                        }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Разобрать (+{getItemSalvageValue(selectedItem.item).gold} зол. / +
                        {getItemSalvageValue(selectedItem.item).essence} эсс.)
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-500">
                Выберите любой предмет в хранилище или слоте экипировки для осмотра и сравнения
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
