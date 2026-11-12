import React from 'react';
import { LogOut, Play, RotateCcw, ShieldCheck, Skull, Trophy } from 'lucide-react';
import { RARITY_CONFIG } from '../../data/items';
import { SoundManager } from '../../engine/SoundManager';
import { getRunLossPayout, useGameStore } from '../../store/useGameStore';
import { ItemIcon } from '../ui/ItemIcon';

const runOutcomes = {
  extracted: {
    label: 'Итоги эвакуации',
    title: 'Эвакуация прошла успешно!',
    border: 'border-emerald-500/50',
    iconStyle: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400',
    Icon: Trophy,
  },
  retreated: {
    label: 'Итоги отступления',
    title: 'Отступление из катакомб',
    border: 'border-amber-500/50',
    iconStyle: 'bg-amber-950/60 border-amber-500/50 text-amber-400',
    Icon: LogOut,
  },
  defeat: {
    label: 'Поражение',
    title: 'Вы пали в катакомбах',
    border: 'border-rose-500/50',
    iconStyle: 'bg-rose-950/60 border-rose-500/50 text-rose-400',
    Icon: Skull,
  },
};

export const TitleAndStatusModals: React.FC = () => {
  const state = useGameStore();
  const {
    shellState,
    setShellState,
    mode,
    currentWave,
    runGold,
    runEssence,
    extractionPortalOpen,
    highestWaveReached,
    totalRunsCompleted,
    lastRunSummary,
    returnToHubFromSummary,
    startDungeonRun,
    retreatToHub,
  } = state;

  if (shellState === 'title') {
    return (
      <div
        data-hud-interactive="true"
        className="fixed inset-0 z-50 flex flex-col justify-between p-8 md:p-14 bg-gradient-to-r from-[#090a0f]/95 via-[#090a0f]/80 to-transparent pointer-events-auto"
      >
        {/* Top Kicker */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="text-amber-400 font-semibold tracking-wider uppercase">
            Тёмное Фэнтези · Рогалик с Эвакуацией
          </span>
          <span aria-hidden="true">·</span>
          <span>Пиксельная графика 16x16</span>
        </div>

        {/* Center Left Emblem & Title Lockup */}
        <div className="max-w-xl my-auto space-y-6">
          {/* Custom Inline SVG Heraldic Crest */}
          <div className="flex items-center gap-4">
            <svg
              viewBox="0 0 64 64"
              className="w-16 h-16 shrink-0 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
              aria-hidden="true"
            >
              <path
                d="M32 4 L56 14 V32 C56 47 45 57 32 61 C19 57 8 47 8 32 V14 Z"
                fill="#141824"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              <path
                d="M32 10 L50 18 V32 C50 43 41 51 32 55 C23 51 14 43 14 32 V18 Z"
                fill="#1e1b2e"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              <path
                d="M32 15 L36 36 L32 42 L28 36 Z"
                fill="#f8fafc"
              />
              <path
                d="M22 28 H42"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="32" cy="28" r="3.5" fill="#ef4444" />
            </svg>

            <div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-slate-100 leading-none">
                Пепел и Сталь
              </h1>
              <p className="text-lg sm:text-xl font-display text-amber-400 mt-1">
                Хроники Цитадели: Экстракция
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            Снаряжайте рыцаря в безопасном Хабе, закаляйте клинки в Кузнице и спускайтесь в
            катакомбы за легендарной добычей. Вовремя эвакуируйтесь через Алтарь — или рискните
            всем ради глубин.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              data-start="true"
              onClick={() => {
                SoundManager.playSwordSlash();
                setShellState('playing');
              }}
              className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              {mode === 'dungeon' ? 'Продолжить вылазку' : 'Войти в Цитадель (Хаб)'}
            </button>

            <button
              type="button"
              onClick={() => {
                SoundManager.playSwordSlash();
                startDungeonRun();
              }}
              className="px-5 py-3.5 rounded-xl bg-[#171b26] hover:bg-[#1f2536] text-slate-200 border border-slate-700 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {mode === 'dungeon' ? 'Начать новую вылазку' : 'Сразу в Вылазку (Волна 1)'}
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono-num pt-2">
            <span>Рекорд глубины: Волна {highestWaveReached}</span>
            <span>·</span>
            <span>Успешных эвакуаций: {totalRunsCompleted}</span>
          </div>
        </div>

        {/* Bottom Single-Line Control Hint */}
        <div className="text-xs text-slate-400 font-mono-num">
          WASD Перемещение · Пробел Рывок · ЛКМ Атака · E Взаимодействие · P Пауза
        </div>
      </div>
    );
  }

  if (shellState === 'paused') {
    const retreat = mode === 'dungeon' ? getRunLossPayout(state, 'retreated') : null;

    return (
      <div
        role="dialog"
        aria-label="Пауза"
        data-hud-interactive="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto"
      >
        <div className="w-full max-w-md bg-[#11141d] border border-slate-700 rounded-xl p-6 shadow-2xl space-y-5 text-center">
          <h2 className="text-2xl font-display font-bold text-amber-100">Игра на паузе</h2>
          <p className="text-xs text-slate-400">
            {mode === 'hub'
              ? 'Вы находитесь в безопасном зале Цитадели'
              : `Активная вылазка в подземелье · Волна ${currentWave}`}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
            <div className="p-3 rounded-lg bg-[#161a26] border border-slate-800">
              <div className="text-slate-400">Рекорд волны</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">{highestWaveReached}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#161a26] border border-slate-800">
              <div className="text-slate-400">Успешных эвакуаций</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{totalRunsCompleted}</div>
            </div>
          </div>

          {retreat && (
            <div className="text-xs bg-[#161a26] border border-slate-800 rounded-lg p-3 space-y-2 text-left">
              {extractionPortalOpen && (
                <p className="text-emerald-300">Алтарь открыт. Эвакуация сохранит всю добычу.</p>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Сохранится при отступлении</span>
                <span className="font-mono-num text-slate-200 text-right">
                  {retreat.keptGold} зол. · {retreat.keptEssence} эсс.
                </span>
              </div>
              {retreat.itemSaved && (
                <p className="text-amber-200">Тайный Карман сохранит «{retreat.itemSaved.name}»</p>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Потеряется</span>
                <span className="font-mono-num text-rose-300/90 text-right">
                  {retreat.itemsLost} предм. · {runGold - retreat.keptGold} зол. ·{' '}
                  {runEssence - retreat.keptEssence} эсс.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShellState('playing')}
              className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Продолжить игру
            </button>

            {retreat && (
              <button
                type="button"
                onClick={() => retreatToHub()}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-colors cursor-pointer"
              >
                Отступить в Хаб
              </button>
            )}

            <button
              type="button"
              onClick={() => setShellState('title')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              На главный экран
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (shellState === 'gameover' && lastRunSummary) {
    const { label, title, border, iconStyle, Icon } = runOutcomes[lastRunSummary.outcome];
    const savedCount = lastRunSummary.itemsExtracted.length;

    return (
      <div
        role="dialog"
        aria-label={label}
        data-hud-interactive="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 pointer-events-auto"
      >
        <div
          className={`w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#11141d] border rounded-xl p-6 shadow-2xl space-y-5 ${border}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${iconStyle}`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-100">
                {title}
              </h2>
              {savedCount === 0 && <p className="text-xs text-slate-400">Предметы не сохранены</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center font-mono-num">
            <div className="p-3 rounded-lg bg-[#151924] border border-slate-800">
              <div className="text-[11px] text-slate-400">Достигнута волна</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                {lastRunSummary.waveReached}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#151924] border border-slate-800">
              <div className="text-[11px] text-slate-400">Повержено врагов</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {lastRunSummary.enemiesSlain}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#151924] border border-slate-800">
              <div className="text-[11px] text-slate-400">Ресурсы в Хаб</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">
                +{lastRunSummary.goldCollected} зол. · +{lastRunSummary.essenceCollected} эсс.
              </div>
            </div>
          </div>

          {lastRunSummary.itemsLost > 0 && (
            <p className="text-[11px] text-rose-300/90 text-center">
              Потеряно предметов: {lastRunSummary.itemsLost}
            </p>
          )}

          {savedCount > 0 && (
            <div className="bg-[#0d1017] border border-slate-800 rounded-lg p-3.5">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{lastRunSummary.protectedItemSaved ? 'Спасено Тайным Карманом' : `Сохранено предметов (${savedCount})`}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastRunSummary.itemsExtracted.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#141824] border border-slate-800"
                  >
                    <ItemIcon iconName={item.iconName} rarity={item.rarity} size="sm" />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: RARITY_CONFIG[item.rarity].colorHex }}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              data-start="true"
              onClick={() => returnToHubFromSummary()}
              className="flex-1 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Вернуться в Хаб (К Сундуку и Кузнице)
            </button>
            <button
              type="button"
              onClick={() => startDungeonRun()}
              className="py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Новая вылазка
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
