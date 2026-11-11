import React, { useState } from 'react';
import { RARITY_CONFIG } from '../../data/items';
import { GameIconName, ItemRarity } from '../../types/game';

interface ItemIconProps {
  iconName: GameIconName;
  rarity?: ItemRarity;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  level?: number;
  isProtected?: boolean;
  className?: string;
  showFrame?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<ItemIconProps['size']>, { box: string; img: string }> = {
  xs: { box: 'w-6 h-6 rounded', img: 'w-4 h-4' },
  sm: { box: 'w-8 h-8 rounded-md', img: 'w-5 h-5' },
  md: { box: 'w-11 h-11 rounded-lg', img: 'w-7 h-7' },
  lg: { box: 'w-14 h-14 rounded-lg', img: 'w-9 h-9' },
  xl: { box: 'w-16 h-16 rounded-xl', img: 'w-11 h-11' },
};

function renderFallbackSvg(iconName: GameIconName, color: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3/5 h-3/5"
      aria-hidden="true"
    >
      {iconName === 'broadsword' || iconName === 'gladius' || iconName === 'daggers' ? (
        <>
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M16 16l4 4" />
        </>
      ) : iconName === 'battle-axe' ? (
        <>
          <path d="M14 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L11 9" />
          <path d="M15 13L9 7l4-4 6 6-4 4z" />
        </>
      ) : iconName === 'chest-armor' || iconName === 'leather-armor' || iconName === 'barbute' || iconName === 'visored-helm' ? (
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      ) : iconName === 'two-coins' ? (
        <>
          <circle cx="9" cy="9" r="6" />
          <circle cx="15" cy="15" r="6" />
        </>
      ) : iconName === 'emerald' ? (
        <polygon points="12 2 19 8 16 22 8 22 5 8 12 2" />
      ) : (
        <circle cx="12" cy="12" r="8" />
      )}
    </svg>
  );
}

export const ItemIcon: React.FC<ItemIconProps> = ({
  iconName,
  rarity = 'common',
  size = 'md',
  level = 0,
  isProtected = false,
  className = '',
  showFrame = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const rarityCfg = RARITY_CONFIG[rarity];
  const sizeSpec = SIZE_CLASSES[size];

  const hexWithoutHash = rarityCfg.colorHex.replace('#', '');
  const iconUrl = `https://api.iconify.design/game-icons/${iconName}.svg?color=%23${
    showFrame ? hexWithoutHash : 'ffffff'
  }`;

  if (!showFrame) {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {!imgError ? (
          <img
            src={iconUrl}
            alt={iconName}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`${sizeSpec.img} object-contain select-none pointer-events-none`}
          />
        ) : (
          renderFallbackSvg(iconName, rarityCfg.colorHex)
        )}
      </span>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 border transition-transform ${sizeSpec.box} ${className}`}
      style={{
        backgroundColor: rarityCfg.bgTint,
        borderColor: rarityCfg.borderHex,
        boxShadow:
          rarity === 'legendary' || rarity === 'epic'
            ? `0 0 14px -2px ${rarityCfg.colorHex}55, inset 0 0 8px ${rarityCfg.colorHex}25`
            : `inset 0 0 6px ${rarityCfg.colorHex}18`,
      }}
    >
      {!imgError ? (
        <img
          src={iconUrl}
          alt={iconName}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`${sizeSpec.img} object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] select-none pointer-events-none`}
        />
      ) : (
        renderFallbackSvg(iconName, rarityCfg.colorHex)
      )}

      {level > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 px-1 py-0.2 text-[10px] font-mono-num font-bold leading-tight rounded bg-slate-950 border"
          style={{
            color: rarityCfg.colorHex,
            borderColor: rarityCfg.borderHex,
          }}
        >
          +{level}
        </span>
      )}

      {isProtected && (
        <span
          title="Защищено Тайным Карманом"
          className="absolute -bottom-1 -left-1 px-1 text-[9px] font-mono-num font-bold uppercase tracking-tighter rounded bg-amber-950 text-amber-300 border border-amber-500/70"
        >
          Сейф
        </span>
      )}
    </div>
  );
};
