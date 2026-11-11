import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSPECTIVE_Y_RATIO,
  computeDepthZ,
  toPerspectiveRy,
  resolveEllipticalCollider,
  shouldOccludeFade,
  checkProjectileObstacleHit,
  selectPerimeterWallTile,
  spatialHash2D,
  selectFloorTileKey,
  computeWeaponHandTransform,
  type EllipticalObstacle,
  type TallOccludingStructure,
} from './Perspective34';

test('computeDepthZ orders entities by ground contact Y coordinate', () => {
  const behindZ = computeDepthZ(-20);
  const frontZ = computeDepthZ(15);
  assert.equal(behindZ < frontZ, true);
  assert.equal(computeDepthZ(10, 5), 15);
});

test('toPerspectiveRy applies 3/4 foreshortening ratio accurately', () => {
  const ry = toPerspectiveRy(50);
  assert.equal(ry, Math.round(50 * PERSPECTIVE_Y_RATIO * 10) / 10);
  assert.equal(ry < 50, true);
});

test('resolveEllipticalCollider pushes actor smoothly outside 3/4 elliptical pedestal footprint', () => {
  const pedestal: EllipticalObstacle = {
    id: 'forge',
    x: 200,
    y: 12,
    rx: 36,
    ry: 16,
  };

  const far = resolveEllipticalCollider(0, 0, 18, 12, pedestal);
  assert.equal(far.collided, false);
  assert.equal(far.x, 0);
  assert.equal(far.y, 0);

  const overlapNorth = resolveEllipticalCollider(200, 12 - 18 - 10, 18, 12, pedestal);
  assert.equal(overlapNorth.collided, true);
  assert.equal(overlapNorth.x, 200);
  assert.equal(overlapNorth.y < 12 - 18 - 10, true);
});

test('shouldOccludeFade triggers only when actor feet are behind tall pillar canopy', () => {
  const pillar: TallOccludingStructure = {
    x: -220,
    baseY: -75,
    occludeHalfW: 36,
    occludeHeight: 78,
  };

  assert.equal(shouldOccludeFade(-215, -110, 18, pillar), true);
  assert.equal(shouldOccludeFade(-220, -60, 18, pillar), false);
  assert.equal(shouldOccludeFade(-120, -110, 18, pillar), false);
});

test('checkProjectileObstacleHit blocks projectiles on solid dungeon pillars', () => {
  const pillar: EllipticalObstacle = {
    id: 'pillar_nw',
    x: -220,
    y: -95,
    rx: 28,
    ry: 13,
    blocksProjectiles: true,
    projectileRadius: 22,
    projectileYOffset: -14,
  };

  assert.equal(checkProjectileObstacleHit(-215, -108, 6, pillar), true);
  assert.equal(checkProjectileObstacleHit(-150, -108, 6, pillar), false);
});

test('selectPerimeterWallTile returns proper 9-slice 3/4 wall keys for corners, sides, north and south', () => {
  const rows = 8;
  const cols = 12;

  assert.equal(selectPerimeterWallTile(-2, -1, rows, cols), 'wall_corner_tl');
  assert.equal(selectPerimeterWallTile(-2, cols, rows, cols), 'wall_corner_tr');
  assert.equal(selectPerimeterWallTile(-2, 4, rows, cols), 'wall_top');
  assert.equal(selectPerimeterWallTile(-1, 4, rows, cols), 'wall_brick');
  assert.equal(selectPerimeterWallTile(-1, -1, rows, cols), 'wall_side_left');
  assert.equal(selectPerimeterWallTile(3, -1, rows, cols), 'wall_side_left');
  assert.equal(selectPerimeterWallTile(3, cols, rows, cols), 'wall_side_right');
  assert.equal(selectPerimeterWallTile(rows, -1, rows, cols), 'wall_corner_bl');
  assert.equal(selectPerimeterWallTile(rows, cols, rows, cols), 'wall_corner_br');
  assert.equal(selectPerimeterWallTile(rows, 5, rows, cols), 'wall_south');
});

test('spatialHash2D and selectFloorTileKey break diagonal periodicity across dungeon tiles', () => {
  // Check a 10-step diagonal line: in the old (r*73 + c*37)%10 hash, stepping (+1, +2) or similar had fixed period.
  const diagonalKeys = new Set<string>();
  for (let i = 0; i < 12; i++) {
    diagonalKeys.add(selectFloorTileKey(i, i * 2, 15, 22, false));
    assert.notEqual(spatialHash2D(i, i), spatialHash2D(i + 1, i + 1));
  }
  assert.equal(diagonalKeys.size >= 2, true);
});

test('computeWeaponHandTransform mirrors hand position and vertical scale when facing left and tucks weapon when aiming north', () => {
  const rightAim = computeWeaponHandTransform(0, 1, 0, 3.0);
  assert.equal(rightAim.pivotX > 0, true);
  assert.equal(rightAim.scaleY > 0, true);
  assert.equal(rightAim.behindBody, false);

  const leftAim = computeWeaponHandTransform(Math.PI, -1, 0, 3.0);
  assert.equal(leftAim.pivotX < 0, true);
  assert.equal(leftAim.scaleY < 0, true);
  assert.equal(leftAim.behindBody, false);

  const northAim = computeWeaponHandTransform(-Math.PI / 2, 1, 0, 3.0);
  assert.equal(northAim.behindBody, true);
});
