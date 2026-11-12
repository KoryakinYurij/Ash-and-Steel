import React from 'react';
import {
  Hammer,
  Package,
  Pause,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Compass,
  LogOut,
} from 'lucide-react';
import { getWaveComposition } from '../../data/enemies';
import { RARITY_CONFIG, SLOT_NAMES_RU } from '../../data/items';
import { SoundManager } from '../../engine/SoundManager';
import { useGameStore } from '../../store/useGameStore';
import { ItemSlot } from '../../types/game';
import { ItemIcon } from '../ui/ItemIcon';

const SLOTS_ORDER: ItemSlot[] = ['weapon', 'armor', 'helmet', 'ring'];

export const GameHUD: React.FC = () => {
  const {
    shellState,
    mode,
    gold,
    essence,
    runGold,
    runEssence,
    playerHp,
    playerMaxHp,
    dashCooldownRatio,
    currentWave,
    waveEnemiesKilled,
    waveEnemiesTotal,
    extractionPortalOpen,
    equipped,
    runBag,
    nearbyStation,
    isMuted,
    autoAttack,
    toggleMute,
    toggleAutoAttack,
    setShellState,
    setActiveStationModal,
    startDungeonRun,
    toggleProtectRunItem,
    notifications,
    getComputedStats,
  } = useGameStore();

  if (shellState === 'title') return null;

  const stats = getComputedStats();
  const hpPct = Math.max(0, Math.min(100, Math.round((playerHp / Math.max(1, playerMaxHp)) * 100)));
  const dashReadyPct = Math.round((1 - dashCooldownRatio) * 100);
  const waveComp = getWaveComposition(currentWave);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Row: 3 compact perimeter clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Cluster: Vitality Bar, Dash & Currencies */}
        <div
          data-hud-interactive="true"
          className="pointer-events-auto bg-[#0e111a]/95 border border-slate-800/90 rounded-xl p-3.5 shadow-xl min-w-[270px] space-y-2.5"
        >
          {/* HP Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Здоровье рыцаря
              </span>
              <span className="font-mono-num font-bold text-slate-100">
                {playerHp} / {playerMaxHp} ОЗ
              </span>
            </div>
            <div className="w-full h-3 bg-[#080a0f] rounded-md overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-emerald-500 rounded-sm transition-all duration-150"
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {/* Dash Bar & Combat Quick Readout */}
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-400 whitespace-nowrap">Рывок [Пробел]:</span>
              <div className="flex-1 h-1.5 bg-[#080a0f] rounded overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-sky-400 transition-all duration-75"
                  style={{ width: `${dashReadyPct}%` }}
                />
              </div>
            </div>
            <div className="font-mono-num text-slate-300 whitespace-nowrap">
              Урон: <strong className="text-amber-300">{stats.damage}</strong> · Крит:{' '}
              <strong className="text-sky-300">{stats.critChance}%</strong>
            </div>
          </div>

          {/* Currencies */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/90 text-xs font-mono-num">
            <div className="flex items-center gap-1.5">
              <ItemIcon iconName="two-coins" rarity="legendary" size="xs" showFrame={false} />
              <span className="text-slate-400">Золото:</span>
              <span className="font-bold text-amber-400">{gold}</span>
              {mode === 'dungeon' && runGold > 0 && (
                <span className="text-amber-300 text-[11px]">(+{runGold})</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <ItemIcon iconName="emerald" rarity="uncommon" size="xs" showFrame={false} />
              <span className="text-slate-400">Эссенция:</span>
              <span className="font-bold text-emerald-400">{essence}</span>
              {mode === 'dungeon' && runEssence > 0 && (
                <span className="text-emerald-300 text-[11px]">(+{runEssence})</span>
              )}
            </div>
          </div>
        </div>

        {/* Top-Center Cluster: Mode Status / Station Quick Actions / Wave Progress */}
        <div
          data-hud-interactive="true"
          className="pointer-events-auto flex flex-col items-center gap-2"
        >
          {mode === 'hub' ? (
            <div className="bg-[#0e111a]/95 border border-slate-800/90 rounded-xl px-4 py-2.5 shadow-xl flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-display font-bold text-amber-200 tracking-wide mr-1">
                Цитадель Пепла (Хаб)
              </span>

              <button
                type="button"
                onClick={() => setActiveStationModal('stash')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161b29] hover:bg-[#1f2638] text-amber-300 border border-amber-500/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Package className="w-3.5 h-3.5" />
                Сундук Хранилища
              </button>

              <button
                type="button"
                onClick={() => setActiveStationModal('forge')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161b29] hover:bg-[#1f2638] text-orange-300 border border-orange-500/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Hammer className="w-3.5 h-3.5" />
                Кузница Улучшений
              </button>

              <button
                type="button"
                onClick={() => {
                  SoundManager.playSwordSlash();
                  startDungeonRun();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Compass className="w-3.5 h-3.5" />
                Врата Вылазки (В бой)
              </button>
            </div>
          ) : (
            <div className="bg-[#0e111a]/95 border border-slate-800/90 rounded-xl px-5 py-2.5 shadow-xl flex items-center gap-5">
              <div>
                <div className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                  Волна {currentWave} · {waveComp.titleRu}
                </div>
                <div className="text-xs text-slate-300 font-mono-num mt-0.5">
                  Повержено врагов:{' '}
                  <strong className="text-slate-100">
                    {waveEnemiesKilled} / {waveEnemiesTotal}
                  </strong>
                  {waveComp.rareLootBonusPct > 0 && (
                    <span className="ml-2 text-amber-300">
                      (Редкая добыча +{waveComp.rareLootBonusPct}%)
                    </span>
                  )}
                </div>
              </div>

              {extractionPortalOpen && (
                <button
                  type="button"
                  onClick={() => setActiveStationModal('extraction')}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  Алтарь Эвакуации [E]
                </button>
              )}
            </div>
          )}

          {/* Contextual Interaction Prompt when standing near a physical station */}
          {nearbyStation && (
            <button
              type="button"
              onClick={() => {
                if (nearbyStation === 'portal') {
                  startDungeonRun();
                } else {
                  setActiveStationModal(nearbyStation);
                }
              }}
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
            >
              Нажмите [E] или кликните: Открыть{' '}
              {nearbyStation === 'stash'
                ? 'Сундук Хранилища'
                : nearbyStation === 'forge'
                ? 'Кузницу Улучшений'
                : nearbyStation === 'portal'
                ? 'Врата Вылазки'
                : 'Алтарь Эвакуации'}
            </button>
          )}
        </div>

        {/* Top-Right Cluster: Utility Controls */}
        <div
          data-hud-interactive="true"
          className="pointer-events-auto flex items-center gap-2 bg-[#0e111a]/95 border border-slate-800/90 rounded-xl p-2 shadow-xl"
        >
          <button
            type="button"
            onClick={(e) => {
              toggleAutoAttack();
              e.currentTarget.blur();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              autoAttack
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#161a26] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Авто-атака: {autoAttack ? 'ВКЛ' : 'ВЫКЛ'}
          </button>

          <button
            type="button"
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
            onClick={(e) => {
              toggleMute();
              e.currentTarget.blur();
            }}
            className="p-2 rounded-lg bg-[#161a26] text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            aria-label="Пауза"
            onClick={(e) => {
              setShellState('paused');
              e.currentTarget.blur();
            }}
            className="p-2 rounded-lg bg-[#161a26] text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications Toast Stack (Top Right below controls) */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-none">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="px-3.5 py-2 rounded-lg bg-[#111520]/95 border border-slate-700 text-xs font-medium text-slate-100 shadow-lg"
            >
              {n.text}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Row: Equipped 4 Slots + Run Loot Bag (when in Dungeon) */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Equipped 4 Gear Slots */}
        <div
          data-hud-interactive="true"
          className="pointer-events-auto bg-[#0e111a]/95 border border-slate-800/90 rounded-xl p-2.5 shadow-xl flex items-center gap-2"
        >
          {SLOTS_ORDER.map((slot) => {
            const item = equipped[slot];
            return (
              <button
                key={slot}
                type="button"
                title={
                  item
                    ? `${SLOT_NAMES_RU[slot]}: ${item.name}`
                    : `${SLOT_NAMES_RU[slot]}: Пусто`
                }
                onClick={() => {
                  setActiveStationModal(mode === 'hub' ? 'stash' : 'runbag');
                }}
                className="flex flex-col items-center p-1.5 rounded-lg bg-[#141824] border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer min-w-[56px]"
              >
                {item ? (
                  <ItemIcon
                    iconName={item.iconName}
                    rarity={item.rarity}
                    level={item.level}
                    isProtected={item.isProtected}
                    size="sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">
                    —
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1">{SLOT_NAMES_RU[slot]}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom-Right: Run Loot Bag (in Dungeon) or Controls Legend (in Hub) */}
        {mode === 'dungeon' ? (
          <div
            data-hud-interactive="true"
            className="pointer-events-auto bg-[#0e111a]/95 border border-slate-800/90 rounded-xl p-2.5 shadow-xl flex items-center gap-3"
          >
            <div className="pr-2.5 border-r border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-bold font-mono-num ${
                    runBag.length >= 10 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  Рюкзак ({runBag.length}/10)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStationModal('runbag')}
                className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Управление [I / Tab]
              </button>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const item = runBag[idx];
                return (
                  <button
                    key={item ? item.id : `empty_${idx}`}
                    type="button"
                    title={
                      item
                        ? `${item.name} (${RARITY_CONFIG[item.rarity].nameRu}) — Клик: Управление / Карман`
                        : `Слот ${idx + 1}: Свободно`
                    }
                    onClick={() => {
                      if (item) {
                        toggleProtectRunItem(item.id);
                      } else {
                        setActiveStationModal('runbag');
                      }
                    }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                      item
                        ? 'bg-[#141824] border-slate-700 cursor-pointer hover:border-amber-400'
                        : 'bg-[#0a0c12] border-slate-800/60 cursor-pointer hover:border-slate-700'
                    }`}
                  >
                    {item ? (
                      <ItemIcon
                        iconName={item.iconName}
                        rarity={item.rarity}
                        level={item.level}
                        isProtected={item.isProtected}
                        size="xs"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-700 font-mono-num">{idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {extractionPortalOpen && (
              <button
                type="button"
                onClick={() => setActiveStationModal('extraction')}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Эвакуация
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#0e111a]/90 border border-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-400 font-mono-num">
            WASD: Ходьба · Пробел: Рывок · ЛКМ: Удар · I/Tab: Сундук · E: Станции
          </div>
        )}
      </div>
    </div>
  );
};
