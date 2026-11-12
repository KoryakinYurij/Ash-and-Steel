import React from 'react';
import {
  ArrowDownRight,
  ArrowUpDown,
  Backpack,
  Hammer,
  Home,
  Lock,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { getWaveComposition } from '../../data/enemies';
import { getItemSalvageValue, RARITY_CONFIG } from '../../data/items';
import { SoundManager } from '../../engine/SoundManager';
import { getRunLoot, useGameStore } from '../../store/useGameStore';
import { ItemIcon } from '../ui/ItemIcon';

export const ExtractionModal: React.FC = () => {
  const state = useGameStore();
  const {
    currentWave,
    runGold,
    runEssence,
    runBag,
    runStartingGear,
    playerHp,
    playerMaxHp,
    hubUpgrades,
    toggleProtectRunItem,
    equipItemFromRunBag,
    salvageRunBagItem,
    salvageAllCommonInRunBag,
    dropRunBagItemToFloor,
    extractToHub,
    proceedToNextWave,
    setActiveStationModal,
  } = state;

  const lootCount = getRunLoot(state).length;
  const nextWaveComp = getWaveComposition(currentWave + 1);
  const healPct = Math.round((0.25 + (hubUpgrades.healing_well || 0) * 0.08) * 100);
  const commonCount = runBag.filter((i) => i.rarity === 'common' && !i.isProtected).length;

  return (
    <div
      role="dialog"
      aria-label="Алтарь Эвакуации"
      data-hud-interactive="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 pointer-events-auto"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#11141d] border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c0e15] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ItemIcon iconName="magic-portal" rarity="uncommon" size="md" />
            <div>
              <h2 className="text-xl font-display font-bold text-emerald-300">
                Алтарь Эвакуации: Волна {currentWave} зачищена
              </h2>
              <p className="text-xs text-slate-400">
                Освободите место в рюкзаке перед спуском глубже или эвакуируйтесь со всей добычей в Цитадель
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStationModal('runbag')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181d2c] hover:bg-[#22293e] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Backpack className="w-3.5 h-3.5" />
              Инспектор рюкзака
            </button>

            <button
              type="button"
              aria-label="Закрыть окно алтаря"
              onClick={() => setActiveStationModal(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Collected Resources Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#151924] border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Добыто золота</div>
              <div className="text-lg font-mono-num font-bold text-amber-400 mt-0.5">
                +{runGold}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#151924] border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Добыто эссенции</div>
              <div className="text-lg font-mono-num font-bold text-emerald-400 mt-0.5">
                +{runEssence}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#151924] border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Свободно в рюкзаке</div>
              <div
                className={`text-lg font-mono-num font-bold mt-0.5 ${
                  runBag.length >= 10 ? 'text-rose-400' : 'text-sky-400'
                }`}
              >
                {runBag.length} / 10
              </div>
            </div>
          </div>

          {/* Run Bag Management & Safe Pocket Selection */}
          <div className="bg-[#0d1017] border border-slate-800 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  Рюкзак вылазки (разберите или выбросьте слабые вещи, чтобы освободить слоты для Волны {currentWave + 1})
                </span>
                {(hubUpgrades.safe_pocket || 0) > 0 && (
                  <div className="text-[11px] text-amber-300 flex items-center gap-1 mt-0.5">
                    <Lock className="w-3 h-3" /> Нажмите на находку, чтобы защитить её Тайным Карманом
                  </div>
                )}
              </div>

              {commonCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    SoundManager.playAnvilHammer();
                    salvageAllCommonInRunBag();
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Разобрать обычные ({commonCount})
                </button>
              )}
            </div>

            {runBag.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                В рюкзаке вылазки пока нет снаряжения (все 10 слотов свободны для следующей волны)
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {runBag.map((item) => {
                  const salvage = getItemSalvageValue(item);
                  const isStartingGear = runStartingGear?.[item.slot]?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between p-2 rounded-lg border text-center transition-all ${
                        item.isProtected
                          ? 'bg-amber-950/30 border-amber-400'
                          : 'bg-[#141824] border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        title={isStartingGear ? 'Снаряжение из Цитадели' : 'Положить в Тайный Карман'}
                        disabled={isStartingGear || !hubUpgrades.safe_pocket}
                        onClick={() => toggleProtectRunItem(item.id)}
                        className="flex flex-col items-center cursor-pointer disabled:cursor-default w-full"
                      >
                        <ItemIcon
                          iconName={item.iconName}
                          rarity={item.rarity}
                          level={item.level}
                          isProtected={item.isProtected}
                          size="sm"
                        />
                        <span
                          className="text-[11px] font-semibold mt-1.5 truncate w-full"
                          style={{ color: RARITY_CONFIG[item.rarity].colorHex }}
                        >
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.slotNameRu} · {item.rarityNameRu}
                        </span>
                      </button>

                      {/* Quick Inline Field Actions */}
                      <div className="grid grid-cols-3 gap-1 mt-2 pt-1.5 border-t border-slate-800/80">
                        <button
                          type="button"
                          title={`Экипировать «${item.name}» в бою`}
                          onClick={() => {
                            SoundManager.playLootPickup();
                            equipItemFromRunBag(item.id);
                          }}
                          className="py-1 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          title={`Разобрать (+${salvage.gold} зол., +${salvage.essence} эсс.)`}
                          onClick={() => {
                            SoundManager.playAnvilHammer();
                            salvageRunBagItem(item.id);
                          }}
                          className="py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Hammer className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          title="Выбросить на пол"
                          onClick={() => {
                            SoundManager.playSwordSlash();
                            dropRunBagItemToFloor(item.id);
                          }}
                          className="py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Two Choices: Extract vs Go Deeper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                SoundManager.playLootPickup();
                extractToHub();
              }}
              className="flex flex-col items-start justify-between p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Home className="w-4 h-4" />
                <span>Эвакуироваться в Хаб</span>
              </div>
              <p className="text-xs text-slate-900 font-medium mt-2 leading-relaxed">
                Вы вернётесь со всей добычей, включая надетые находки ({lootCount} предм.),
                и получите всё золото (+{runGold}) и эссенцию (+{runEssence}).
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                <ShieldCheck className="w-3.5 h-3.5" /> Надёжное сохранение добычи
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                SoundManager.playSwordSlash();
                proceedToNextWave();
              }}
              className="flex flex-col items-start justify-between p-4 rounded-xl bg-[#1a1528] hover:bg-[#231c36] text-slate-100 border border-purple-500/50 transition-all shadow-lg shadow-purple-900/20 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
                <ArrowDownRight className="w-4 h-4" />
                <span>Идти глубже (Волна {currentWave + 1})</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Спуститься в ярус «{nextWaveComp.titleRu}». Враги сильнее, но шанс редкой добычи{' '}
                <strong className="text-amber-300">+{nextWaveComp.rareLootBonusPct}%</strong>.
              </p>
              <div className="mt-3 text-[11px] font-mono-num text-emerald-400">
                Колодец восстановит +{healPct}% ОЗ (текущее ОЗ: {playerHp}/{playerMaxHp})
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
