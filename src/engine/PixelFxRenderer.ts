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

/**
 * Quantizes high-resolution procedural RGBA buffers into crisp pixel-art blocks (2x2)
 * so environmental props (braziers, portals, torches, rune circles) share uniform pixel size
 * with the 16x16 / 16x24 world sprites (eliminating "mixels").
 */
function quantizeRgbaToPixelGrid(
  src: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  blockSize: number
): Uint8ClampedArray {
  if (blockSize <= 1) {
    return new Uint8ClampedArray(src);
  }
  const out = new Uint8ClampedArray(width * height * 4);
  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      // Sample the pixel with the highest alpha/luminance in the block so thin sparks aren't lost
      let bestIdx = (by * width + bx) * 4;
      let bestAlpha = src[bestIdx + 3];
      for (let dy = 0; dy < blockSize && by + dy < height; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < width; dx++) {
          const idx = ((by + dy) * width + (bx + dx)) * 4;
          const a = src[idx + 3];
          if (a > bestAlpha) {
            bestAlpha = a;
            bestIdx = idx;
          }
        }
      }

      const r = src[bestIdx];
      const g = src[bestIdx + 1];
      const b = src[bestIdx + 2];
      // Crisp alpha thresholding for authentic pixel art edges
      const a = bestAlpha < 28 ? 0 : bestAlpha > 185 ? 255 : bestAlpha;

      for (let dy = 0; dy < blockSize && by + dy < height; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < width; dx++) {
          const outIdx = ((by + dy) * width + (bx + dx)) * 4;
          out[outIdx] = r;
          out[outIdx + 1] = g;
          out[outIdx + 2] = b;
          out[outIdx + 3] = a;
        }
      }
    }
  }
  return out;
}

class PixelFxRendererManager {
  private cache: Map<PixelFxKey, CachedPixelFxTextures> = new Map();

  public getEffect(key: PixelFxKey): CachedPixelFxTextures {
    const existing = this.cache.get(key);
    if (existing) return existing;

    const baked = bakePixelFxSequence(key);
    const textures: Texture[] = [];
    // Quantize 48x48+ effects to 2x2 pixel blocks to match the 3x world pixel grid
    const blockSize = baked.width >= 48 ? 2 : 1;

    for (const rgba of baked.frames) {
      const canvas = document.createElement('canvas');
      canvas.width = baked.width;
      canvas.height = baked.height;
      const ctx = canvas.getContext('2d')!;
      const quantized = quantizeRgbaToPixelGrid(rgba, baked.width, baked.height, blockSize);
      const imgData = new ImageData(new Uint8ClampedArray(quantized), baked.width, baked.height);
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
