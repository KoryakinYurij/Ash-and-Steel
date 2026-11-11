import { clearFrame, composite, createFrame, createFx, PixelFxModule } from 'pixelfx';
import * as arcaneOrbMod from 'pixelfx/fx/arcane/arcane-orb';
import * as portalMod from 'pixelfx/fx/arcane/portal';
import * as runeCircleMod from 'pixelfx/fx/arcane/rune-circle';
import * as spellChargeMod from 'pixelfx/fx/arcane/spell-charge';
import * as brazierMod from 'pixelfx/fx/fire/brazier';
import * as torchMod from 'pixelfx/fx/fire/torch';
import * as critHitMod from 'pixelfx/fx/impacts/crit-hit';
import * as hitSparkMod from 'pixelfx/fx/impacts/hit-spark';
import * as doubleSlashMod from 'pixelfx/fx/melee/double-slash';
import * as heavyCleaveMod from 'pixelfx/fx/melee/heavy-cleave';
import * as swordSlashMod from 'pixelfx/fx/melee/sword-slash';
import * as thrustMod from 'pixelfx/fx/melee/thrust';
import * as coinSpinMod from 'pixelfx/fx/pickups/coin-spin';
import * as collectBurstMod from 'pixelfx/fx/pickups/collect-burst';
import * as gemSpinMod from 'pixelfx/fx/pickups/gem-spin';
import * as arrowMod from 'pixelfx/fx/projectiles/arrow';
import * as plasmaShotMod from 'pixelfx/fx/projectiles/plasma-shot';
import * as poofMod from 'pixelfx/fx/spawn/poof';
import * as spawnPortalMod from 'pixelfx/fx/spawn/spawn-portal';

export type PixelFxKey =
  | 'slash_sword'
  | 'slash_daggers'
  | 'slash_axe'
  | 'slash_arcane'
  | 'cast_crossbow'
  | 'cast_staff'
  | 'proj_crossbow_bolt'
  | 'proj_staff_arcane'
  | 'proj_cultist_dark'
  | 'impact_hit'
  | 'impact_crit'
  | 'loop_torch'
  | 'loop_brazier'
  | 'loop_portal_dungeon'
  | 'loop_portal_extraction'
  | 'loop_rune_circle'
  | 'loop_coin'
  | 'loop_essence'
  | 'loop_orb_arcane'
  | 'loop_orb_cultist'
  | 'pickup_gold'
  | 'pickup_essence'
  | 'pickup_item'
  | 'death_poof'
  | 'death_elite'
  | 'spawn_rift';

export interface PixelFxRecipe {
  key: PixelFxKey;
  mod: PixelFxModule;
  fps: number;
  maxDuration?: number;
  lightK?: number;
  /** Offset from meta.origin [dx, dy] to align the sprite's visual pivot/rotation center */
  originOffset?: [number, number];
  options?: Record<string, unknown>;
}

export interface BakedPixelFxSequence {
  key: PixelFxKey;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  fps: number;
  loop: boolean;
  frames: Uint8ClampedArray[];
}

export const PIXEL_FX_RECIPES: Record<PixelFxKey, PixelFxRecipe> = {
  slash_sword: {
    key: 'slash_sword',
    mod: swordSlashMod as unknown as PixelFxModule,
    fps: 24,
    maxDuration: 0.42,
    lightK: 1.15,
    originOffset: [6, -26],
    options: {
      palette: ['#1e3a8a', '#2563eb', '#38bdf8', '#7dd3fc', '#bae6fd', '#f0f9ff', '#ffffff'],
      sparks: ['#fff3a6', '#fde047', '#fb923c', '#ef4444'],
      radius: 40,
      seed: 2,
    },
  },
  slash_daggers: {
    key: 'slash_daggers',
    mod: doubleSlashMod as unknown as PixelFxModule,
    fps: 24,
    maxDuration: 0.45,
    lightK: 1.2,
    originOffset: [16, -23],
    options: {
      palette: ['#064e3b', '#047857', '#10b981', '#34d399', '#6ee7b7', '#d1fae5', '#ffffff'],
      sparks: ['#a7f3d0', '#fde047', '#38bdf8', '#10b981'],
      seed: 6,
    },
  },
  slash_axe: {
    key: 'slash_axe',
    mod: heavyCleaveMod as unknown as PixelFxModule,
    fps: 20,
    maxDuration: 0.72,
    lightK: 1.2,
    originOffset: [12, -18],
    options: {
      palette: ['#2a0c10', '#5c1414', '#a3241a', '#e0481c', '#ff8a2a', '#ffc23d', '#fff0a0', '#ffffff'],
      seed: 5,
    },
  },
  slash_arcane: {
    key: 'slash_arcane',
    mod: swordSlashMod as unknown as PixelFxModule,
    fps: 24,
    maxDuration: 0.4,
    lightK: 1.25,
    originOffset: [6, -26],
    options: {
      palette: ['#2e1065', '#581c87', '#7e22ce', '#a855f7', '#d8b4fe', '#f3e8ff', '#ffffff'],
      sparks: ['#f5d0fe', '#e879f9', '#c084fc', '#9333ea'],
      radius: 36,
      seed: 9,
    },
  },
  cast_crossbow: {
    key: 'cast_crossbow',
    mod: thrustMod as unknown as PixelFxModule,
    fps: 28,
    maxDuration: 0.3,
    lightK: 1.2,
    originOffset: [9, -20],
    options: {
      palette: ['#0f172a', '#1e293b', '#475569', '#94a3b8', '#e2e8f0', '#f8fafc', '#ffffff'],
      sparks: ['#e0f2fe', '#7dd3fc', '#38bdf8', '#fde047'],
      reach: 38,
      seed: 4,
    },
  },
  cast_staff: {
    key: 'cast_staff',
    mod: spellChargeMod as unknown as PixelFxModule,
    fps: 24,
    maxDuration: 0.42,
    lightK: 1.28,
    originOffset: [15, -22],
    options: {
      palette: ['#1e1b4b', '#3b0764', '#6d28d9', '#a855f7', '#38bdf8', '#bae6fd', '#ffffff'],
      seed: 7,
    },
  },
  proj_crossbow_bolt: {
    key: 'proj_crossbow_bolt',
    mod: arrowMod as unknown as PixelFxModule,
    fps: 24,
    lightK: 1.2,
    originOffset: [-10, 0],
    options: {
      palette: ['#1c1108', '#4a2c14', '#854d27', '#cbd5e1', '#e2e8f0', '#f8fafc', '#ffffff'],
      seed: 3,
    },
  },
  proj_staff_arcane: {
    key: 'proj_staff_arcane',
    mod: plasmaShotMod as unknown as PixelFxModule,
    fps: 24,
    lightK: 1.28,
    originOffset: [-4, 0],
    options: {
      palette: ['#090d16', '#1e1b4b', '#3b0764', '#6d28d9', '#a855f7', '#38bdf8', '#bae6fd', '#ffffff'],
      seed: 5,
    },
  },
  proj_cultist_dark: {
    key: 'proj_cultist_dark',
    mod: plasmaShotMod as unknown as PixelFxModule,
    fps: 22,
    lightK: 1.25,
    originOffset: [-4, 0],
    options: {
      palette: ['#14041c', '#2e073f', '#581c87', '#9333ea', '#d946ef', '#f43f5e', '#fda4af', '#ffffff'],
      seed: 9,
    },
  },
  impact_hit: {
    key: 'impact_hit',
    mod: hitSparkMod as unknown as PixelFxModule,
    fps: 24,
    maxDuration: 0.36,
    lightK: 1.15,
    originOffset: [0, -16],
    options: {
      height: 16,
      aim: 0.08,
      seed: 4,
    },
  },
  impact_crit: {
    key: 'impact_crit',
    mod: critHitMod as unknown as PixelFxModule,
    fps: 22,
    maxDuration: 0.55,
    lightK: 1.25,
    originOffset: [0, -20],
    options: {
      height: 20,
      aim: 0.1,
      seed: 3,
    },
  },
  loop_torch: {
    key: 'loop_torch',
    mod: torchMod as unknown as PixelFxModule,
    fps: 14,
    lightK: 1.2,
    originOffset: [0, -10],
    options: {
      seed: 4,
    },
  },
  loop_brazier: {
    key: 'loop_brazier',
    mod: brazierMod as unknown as PixelFxModule,
    fps: 14,
    maxDuration: 1.5,
    lightK: 1.22,
    originOffset: [0, -2],
    options: {
      seed: 8,
    },
  },
  loop_portal_dungeon: {
    key: 'loop_portal_dungeon',
    mod: portalMod as unknown as PixelFxModule,
    fps: 14,
    lightK: 1.2,
    originOffset: [0, -32],
    options: {
      palette: ['#120824', '#2b124c', '#52228e', '#863ce2', '#b87cff', '#dfc0ff', '#f4e8ff', '#ffffff'],
      width: 17,
      height: 28,
      seed: 4,
    },
  },
  loop_portal_extraction: {
    key: 'loop_portal_extraction',
    mod: portalMod as unknown as PixelFxModule,
    fps: 14,
    lightK: 1.25,
    originOffset: [0, -32],
    options: {
      palette: ['#042f2e', '#064e3b', '#047857', '#10b981', '#34d399', '#6ee7b7', '#d1fae5', '#ffffff'],
      width: 18,
      height: 29,
      seed: 7,
    },
  },
  loop_rune_circle: {
    key: 'loop_rune_circle',
    mod: runeCircleMod as unknown as PixelFxModule,
    fps: 12,
    lightK: 1.15,
    originOffset: [0, 0],
    options: {
      palette: ['#271206', '#451a03', '#78350f', '#b45309', '#d97706', '#f59e0b', '#fde047', '#ffffff'],
      seed: 8,
    },
  },
  loop_coin: {
    key: 'loop_coin',
    mod: coinSpinMod as unknown as PixelFxModule,
    fps: 15,
    lightK: 1.15,
    originOffset: [0, -15],
    options: {
      seed: 3,
    },
  },
  loop_essence: {
    key: 'loop_essence',
    mod: gemSpinMod as unknown as PixelFxModule,
    fps: 15,
    lightK: 1.2,
    originOffset: [0, -17],
    options: {
      palette: ['#022c22', '#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#a7f3d0', '#ffffff'],
      seed: 6,
    },
  },
  loop_orb_arcane: {
    key: 'loop_orb_arcane',
    mod: arcaneOrbMod as unknown as PixelFxModule,
    fps: 14,
    lightK: 1.2,
    originOffset: [0, -52],
    options: {
      palette: ['#082f49', '#0c4a6e', '#0369a1', '#0284c7', '#38bdf8', '#7dd3fc', '#e0f2fe', '#ffffff'],
      seed: 6,
    },
  },
  loop_orb_cultist: {
    key: 'loop_orb_cultist',
    mod: arcaneOrbMod as unknown as PixelFxModule,
    fps: 14,
    lightK: 1.2,
    originOffset: [0, -52],
    options: {
      palette: ['#1f0524', '#4a044e', '#701a75', '#a21caf', '#d946ef', '#f0abfc', '#fae8ff', '#ffffff'],
      seed: 11,
    },
  },
  pickup_gold: {
    key: 'pickup_gold',
    mod: collectBurstMod as unknown as PixelFxModule,
    fps: 22,
    maxDuration: 0.65,
    lightK: 1.2,
    originOffset: [0, -30],
    options: {
      palette: ['#271206', '#451a03', '#78350f', '#b45309', '#f59e0b', '#fbbf24', '#fef08a', '#ffffff'],
      seed: 3,
    },
  },
  pickup_essence: {
    key: 'pickup_essence',
    mod: collectBurstMod as unknown as PixelFxModule,
    fps: 22,
    maxDuration: 0.65,
    lightK: 1.2,
    originOffset: [0, -30],
    options: {
      palette: ['#022c22', '#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#a7f3d0', '#ffffff'],
      seed: 5,
    },
  },
  pickup_item: {
    key: 'pickup_item',
    mod: collectBurstMod as unknown as PixelFxModule,
    fps: 22,
    maxDuration: 0.75,
    lightK: 1.25,
    originOffset: [0, -30],
    options: {
      palette: ['#1e1b4b', '#312e81', '#4f46e5', '#8b5cf6', '#a855f7', '#d8b4fe', '#f3e8ff', '#ffffff'],
      seed: 9,
    },
  },
  death_poof: {
    key: 'death_poof',
    mod: poofMod as unknown as PixelFxModule,
    fps: 20,
    maxDuration: 0.75,
    lightK: 1.1,
    originOffset: [0, -17],
    options: {
      palette: ['#1e1b2e', '#3f3a5a', '#6e678f', '#a39cc4', '#dcd8f0', '#ffffff'],
      stars: ['#f87171', '#fbbf24', '#ffffff'],
      seed: 21,
    },
  },
  death_elite: {
    key: 'death_elite',
    mod: poofMod as unknown as PixelFxModule,
    fps: 20,
    maxDuration: 0.9,
    lightK: 1.25,
    originOffset: [0, -17],
    options: {
      palette: ['#2a0808', '#5c1010', '#991b1b', '#dc2626', '#f87171', '#fef2f2'],
      stars: ['#fbbf24', '#fde047', '#ffffff'],
      seed: 13,
    },
  },
  spawn_rift: {
    key: 'spawn_rift',
    mod: spawnPortalMod as unknown as PixelFxModule,
    fps: 18,
    maxDuration: 1.35,
    lightK: 1.15,
    originOffset: [0, -12],
    options: {
      width: 22,
      seed: 6,
    },
  },
};

const bakedSequenceCache: Map<PixelFxKey, BakedPixelFxSequence> = new Map();

/**
 * Pure, deterministic frame baker for any configured `patch-gg/pixelfx` effect.
 * Runs in both Node.js (unit tests) and browser (PixiJS texture generation).
 */
export function bakePixelFxSequence(key: PixelFxKey): BakedPixelFxSequence {
  const cached = bakedSequenceCache.get(key);
  if (cached) return cached;

  const recipe = PIXEL_FX_RECIPES[key];
  const meta = recipe.mod.meta;
  const [width, height] = meta.size;
  const [ox, oy] = meta.origin;
  const [dx, dy] = recipe.originOffset || [0, 0];
  const duration = recipe.maxDuration
    ? Math.min(meta.duration, recipe.maxDuration)
    : meta.duration;
  const fps = recipe.fps;
  const totalFrames = Math.max(2, Math.round(duration * fps));
  const dt = duration / totalFrames;

  const frame = createFrame(width, height);
  const fx = createFx(recipe.mod, {
    x: ox,
    y: oy,
    ...(recipe.options || {}),
  });

  const frames: Uint8ClampedArray[] = [];
  for (let i = 0; i < totalFrames; i++) {
    if (i > 0) {
      fx.update(dt);
    }
    clearFrame(frame);
    fx.draw(frame);
    const rgba = new Uint8ClampedArray(width * height * 4);
    composite(frame, rgba, null, recipe.lightK ?? 1);
    frames.push(rgba);
  }

  const sequence: BakedPixelFxSequence = {
    key,
    width,
    height,
    anchorX: Math.max(0, Math.min(1, (ox + dx) / width)),
    anchorY: Math.max(0, Math.min(1, (oy + dy) / height)),
    fps,
    loop: Boolean(meta.loop),
    frames,
  };

  bakedSequenceCache.set(key, sequence);
  return sequence;
}
