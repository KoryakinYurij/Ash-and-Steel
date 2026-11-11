import { Sprite, Texture } from 'pixi.js';
import { bakePixelFxSequence, PixelFxKey } from './PixelFxRegistry';

export interface CachedPixelFxTextures {
  key: PixelFxKey;
  textures: Texture[];
  anchorX: number;
  anchorY: number;
  fps: number;
  loop: boolean;
}

export interface ActivePixelFxAnimation {
  sprite: Sprite;
  textures: Texture[];
  fps: number;
  loop: boolean;
  elapsed: number;
  destroyOnComplete: boolean;
}

class PixelFxRendererManager {
  private cache: Map<PixelFxKey, CachedPixelFxTextures> = new Map();

  public getEffect(key: PixelFxKey): CachedPixelFxTextures {
    const existing = this.cache.get(key);
    if (existing) return existing;

    const baked = bakePixelFxSequence(key);
    const textures: Texture[] = [];

    for (const rgba of baked.frames) {
      const canvas = document.createElement('canvas');
      canvas.width = baked.width;
      canvas.height = baked.height;
      const ctx = canvas.getContext('2d')!;
      const imgData = new ImageData(new Uint8ClampedArray(rgba), baked.width, baked.height);
      ctx.putImageData(imgData, 0, 0);

      const tex = Texture.from(canvas);
      if (tex.source) {
        tex.source.scaleMode = 'nearest';
      }
      textures.push(tex);
    }

    const entry: CachedPixelFxTextures = {
      key,
      textures,
      anchorX: baked.anchorX,
      anchorY: baked.anchorY,
      fps: baked.fps,
      loop: baked.loop,
    };

    this.cache.set(key, entry);
    return entry;
  }

  /**
   * Warm up core effects at startup so the first swing/portal has zero frame hitch.
   */
  public warmUpCoreEffects(): void {
    const coreKeys: PixelFxKey[] = [
      'slash_sword',
      'cast_crossbow',
      'cast_staff',
      'proj_crossbow_bolt',
      'proj_staff_arcane',
      'impact_hit',
      'impact_crit',
      'loop_torch',
      'loop_portal_dungeon',
      'loop_rune_circle',
    ];
    for (const key of coreKeys) {
      this.getEffect(key);
    }
  }
}

export const PixelFxRenderer = new PixelFxRendererManager();
