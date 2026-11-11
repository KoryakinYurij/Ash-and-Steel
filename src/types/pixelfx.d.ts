declare module 'pixelfx' {
  export interface PixelFxFrame {
    w: number;
    h: number;
    ox: number;
    oy: number;
    color: Uint32Array;
    light: Uint32Array;
  }

  export interface PixelFxMeta {
    name: string;
    desc?: string;
    tags?: string[];
    size: [number, number];
    origin: [number, number];
    duration: number;
    loop: boolean;
    fps?: number;
    bg?: string;
    actor?: number;
    options?: Record<string, unknown>;
  }

  export interface PixelFxModule {
    meta: PixelFxMeta;
    create?: (opts: Record<string, unknown>) => {
      update?: (dt: number, opts: Record<string, unknown>) => void;
      draw: (p: unknown, t: number, opts: Record<string, unknown>) => void;
      drawBack?: (p: unknown, t: number, opts: Record<string, unknown>) => void;
    };
    draw?: (p: unknown, t: number, opts: Record<string, unknown>) => void;
    drawBack?: (p: unknown, t: number, opts: Record<string, unknown>) => void;
  }

  export interface PixelFxInstance {
    meta: PixelFxMeta;
    options: Record<string, unknown>;
    readonly t: number;
    update: (dt: number) => void;
    draw: (frame: PixelFxFrame, layer?: 'back' | 'front') => void;
    stop: () => void;
    done: () => boolean;
  }

  export function createFrame(w: number, h: number, ox?: number, oy?: number): PixelFxFrame;
  export function clearFrame(frame: PixelFxFrame): PixelFxFrame;
  export function createFx(mod: PixelFxModule, opts?: Record<string, unknown>): PixelFxInstance;
  export function composite(
    frame: PixelFxFrame,
    out: Uint8ClampedArray | Uint8Array,
    bg?: number | Uint32Array | null,
    lightK?: number
  ): Uint8ClampedArray | Uint8Array;
}

declare module 'pixelfx/fx/*' {
  import { PixelFxMeta } from 'pixelfx';
  export const meta: PixelFxMeta;
  export function create(opts: Record<string, unknown>): {
    update?: (dt: number, opts: Record<string, unknown>) => void;
    draw: (p: unknown, t: number, opts: Record<string, unknown>) => void;
    drawBack?: (p: unknown, t: number, opts: Record<string, unknown>) => void;
  };
  export function draw(p: unknown, t: number, opts: Record<string, unknown>): void;
  export function drawBack(p: unknown, t: number, opts: Record<string, unknown>): void;
}
