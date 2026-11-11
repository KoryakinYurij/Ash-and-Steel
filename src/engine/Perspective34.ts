import type { SpriteKey } from './SpriteFactory';

/**
 * Standard 3/4 top-down oblique foreshortening ratio (ry / rx).
 * Matches a ~62-degree overhead camera angle where circular floor features
 * project as horizontal ellipses with vertical radius = 0.44 * horizontal radius.
 */
export const PERSPECTIVE_Y_RATIO = 0.44;

export interface EllipticalObstacle {
  id: string;
  /** World X center of the obstacle's ground footprint */
  x: number;
  /** World Y center of the obstacle's ground footprint (contact plane) */
  y: number;
  /** Horizontal semi-axis of the ground footprint ellipse */
  rx: number;
  /** Vertical semi-axis of the ground footprint ellipse */
  ry: number;
  /** Whether projectiles are blocked by this obstacle (e.g. tall stone pillars) */
  blocksProjectiles?: boolean;
  /** Projectile hit radius at mid-height if blocksProjectiles is true */
  projectileRadius?: number;
  /** World Y of projectile collision center */
  projectileYOffset?: number;
}

export interface TallOccludingStructure {
  /** Ground contact X center */
  x: number;
  /** Ground contact Y threshold (actors with footY < baseY are behind this structure) */
  baseY: number;
  /** Half-width of the upper visual canopy/column that can occlude actors behind it */
  occludeHalfW: number;
  /** Vertical height extending upward (negative Y) from baseY */
  occludeHeight: number;
}

/**
 * Computes a deterministic Y-sort zIndex from an entity's ground contact Y coordinate.
 */
export function computeDepthZ(footY: number, zBias = 0): number {
  return Math.round((footY + zBias) * 10) / 10;
}

/**
 * Converts a horizontal ground radius into a 3/4 perspective-foreshortened vertical radius.
 */
export function toPerspectiveRy(rx: number, ratio = PERSPECTIVE_Y_RATIO): number {
  return Math.max(1, Math.round(rx * ratio * 10) / 10);
}

/**
 * Resolves smooth 3/4 elliptical footprint collision between an actor's feet and a static obstacle.
 * Normalizes the ellipse into isotropic unit space so actors slide naturally around pedestals and pillars.
 */
export function resolveEllipticalCollider(
  actorX: number,
  actorY: number,
  actorFootOffsetY: number,
  actorFootRadiusX: number,
  obstacle: EllipticalObstacle
): { x: number; y: number; collided: boolean } {
  const footX = actorX;
  const footY = actorY + actorFootOffsetY;

  const combinedRx = obstacle.rx + actorFootRadiusX;
  const combinedRy = obstacle.ry + actorFootRadiusX * PERSPECTIVE_Y_RATIO;

  const dx = footX - obstacle.x;
  const dy = footY - obstacle.y;

  const nx = dx / combinedRx;
  const ny = dy / combinedRy;
  const normDistSq = nx * nx + ny * ny;

  if (normDistSq >= 1) {
    return { x: actorX, y: actorY, collided: false };
  }

  const normDist = Math.sqrt(normDistSq);
  let ux: number;
  let uy: number;
  if (normDist < 0.0001) {
    ux = 0;
    uy = 1;
  } else {
    ux = nx / normDist;
    uy = ny / normDist;
  }

  const resolvedFootX = obstacle.x + ux * combinedRx;
  const resolvedFootY = obstacle.y + uy * combinedRy;

  return {
    x: resolvedFootX,
    y: resolvedFootY - actorFootOffsetY,
    collided: true,
  };
}

/**
 * Checks whether an actor's feet and torso are behind a tall 3/4 structure (pillar, portal arch),
 * signaling that the structure should fade to partial transparency so the actor stays visible.
 */
export function shouldOccludeFade(
  actorX: number,
  actorY: number,
  actorFootOffsetY: number,
  structure: TallOccludingStructure
): boolean {
  const footY = actorY + actorFootOffsetY;
  // Actor must be strictly behind the structure's ground contact line
  if (footY >= structure.baseY - 2) {
    return false;
  }
  // Actor must be within the vertical span occluded by the tall column/arch
  if (footY < structure.baseY - structure.occludeHeight) {
    return false;
  }
  // Actor must overlap horizontally with the column/arch silhouette
  return Math.abs(actorX - structure.x) <= structure.occludeHalfW;
}

/**
 * Checks if a projectile at (px, py) with radius pr hits a solid 3/4 obstacle (such as a stone pillar).
 */
export function checkProjectileObstacleHit(
  px: number,
  py: number,
  pr: number,
  obstacle: EllipticalObstacle
): boolean {
  if (!obstacle.blocksProjectiles) return false;
  const hitRadius = (obstacle.projectileRadius ?? obstacle.rx * 0.78) + pr;
  const centerY = obstacle.y + (obstacle.projectileYOffset ?? -14);
  const dx = px - obstacle.x;
  const dy = py - centerY;
  // Slightly foreshortened hit cylinder along the lower/mid shaft of the pillar
  const scaledDy = dy / 0.72;
  return Math.hypot(dx, scaledDy) <= hitRadius;
}

/**
 * Selects the proper 9-slice / autotiled 3/4 perimeter wall SpriteKey for a room grid.
 * - r = -2: North top parapet cap + top-left / top-right corners
 * - r = -1: North vertical brick facade (inside) or vertical side parapet (c = -1, c = cols)
 * - 0 <= r < rows: Left / Right vertical stone parapet walls
 * - r = rows: South parapet cap + bottom-left / bottom-right corners
 */
export function selectPerimeterWallTile(
  r: number,
  c: number,
  rows: number,
  cols: number
): SpriteKey {
  if (r === -2) {
    if (c === -1) return 'wall_corner_tl';
    if (c === cols) return 'wall_corner_tr';
    return 'wall_top';
  }
  if (r === rows) {
    if (c === -1) return 'wall_corner_bl';
    if (c === cols) return 'wall_corner_br';
    return 'wall_south';
  }
  if (r === -1 && c >= 0 && c < cols) {
    return 'wall_brick';
  }
  if (c === -1) {
    return 'wall_side_left';
  }
  if (c === cols) {
    return 'wall_side_right';
  }
  return 'wall_top';
}

/**
 * Non-linear 2D spatial bit-mixing hash (eliminates diagonal LCG stripes on tile grids).
 * Returns an unsigned 32-bit integer in [0, 2^32 - 1].
 */
export function spatialHash2D(r: number, c: number, seed = 0x9e3779b9): number {
  let h = Math.imul(r + 0x1f35, 0x85ebca6b) ^ Math.imul(c + 0x4b1d, 0xc2b2ae35) ^ seed;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Selects a floor tile key with organic non-linear distribution (no diagonal stair-stepping):
 * - In Hub: creates a purposeful carved slate walkway ('floor_3') along the central north-south axis
 *   and around the sanctuary dais, with damp moss near the outer stone walls.
 * - In Dungeon: scatters weathered slabs ('floor_2'), ancient inlaid stones ('floor_3'), and damp moss
 *   clusters ('floor_moss') organically without periodic diagonal lines.
 */
export function selectFloorTileKey(
  r: number,
  c: number,
  rows: number,
  cols: number,
  isHub: boolean
): SpriteKey {
  const h = spatialHash2D(r, c);
  const roll = h % 100;
  const centerC = (cols - 1) / 2;
  const distFromCenterCol = Math.abs(c - centerC);
  const nearWall = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;

  if (isHub) {
    // Central ceremonial aisle leading from Sanctuary Dais up to the Portal Arch
    if (distFromCenterCol <= 1.1 && r <= Math.floor(rows / 2) + 1) {
      return roll < 75 ? 'floor_3' : 'floor_2';
    }
    if (nearWall && roll < 22) {
      return 'floor_moss';
    }
    if (roll < 6) return 'floor_moss';
    if (roll < 38) return 'floor_2';
    if (roll < 46) return 'floor_3';
    return 'floor_1';
  }

  // Dungeon catacomb distribution
  if (nearWall && roll < 20) {
    return 'floor_moss';
  }
  if (roll < 9) return 'floor_moss';
  if (roll < 17) return 'floor_3';
  if (roll < 52) return 'floor_2';
  return 'floor_1';
}

/**
 * Computes 3/4 weapon hand mount offset, vertical flip, rotation, and behind-body layering
 * so weapons never grow out of the stomach or flip upside-down when facing left.
 */
export function computeWeaponHandTransform(
  aimAngle: number,
  facing: 1 | -1,
  swingOffsetRad: number,
  baseScale: number
): {
  pivotX: number;
  pivotY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  behindBody: boolean;
} {
  // Place hand mount on the leading side of the character
  const pivotX = facing === 1 ? 8 : -8;
  const pivotY = 3;

  // Our 16x16 weapon sprites are drawn pointing diagonally up-right (-45 deg / -PI/4 in screen space).
  // When facing left, flipping scaleY mirrors the blade across its local X-axis so the top edge stays up!
  const scaleX = baseScale;
  const scaleY = facing === -1 ? -baseScale : baseScale;

  // With scaleY = -baseScale when facing === -1, the local diagonal is +PI/4 instead of -PI/4
  const spriteDiagonalOffset = facing === -1 ? -Math.PI / 4 : Math.PI / 4;
  const effectiveSwing = facing === -1 ? -swingOffsetRad : swingOffsetRad;
  const rotation = aimAngle + effectiveSwing + spriteDiagonalOffset;

  // When aiming into the northern upper hemisphere, tuck the weapon behind the knight's shoulder/back
  const behindBody = Math.sin(aimAngle) < -0.28;

  return {
    pivotX,
    pivotY,
    scaleX,
    scaleY,
    rotation,
    behindBody,
  };
}
