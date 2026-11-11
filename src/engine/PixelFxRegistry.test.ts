import assert from 'node:assert/strict';
import test from 'node:test';
import { bakePixelFxSequence, PIXEL_FX_RECIPES, PixelFxKey } from './PixelFxRegistry';

test('PixelFxRegistry bakes non-empty RGBA frames for melee, ranged projectiles, environment, and loot effects', () => {
  const keysToVerify: PixelFxKey[] = [
    'slash_sword',
    'slash_daggers',
    'slash_axe',
    'cast_crossbow',
    'cast_staff',
    'proj_crossbow_bolt',
    'proj_staff_arcane',
    'proj_cultist_dark',
    'impact_hit',
    'impact_crit',
    'loop_torch',
    'loop_brazier',
    'loop_portal_dungeon',
    'loop_portal_extraction',
    'loop_rune_circle',
    'loop_coin',
    'loop_essence',
    'pickup_gold',
    'death_poof',
    'spawn_rift',
  ];

  for (const key of keysToVerify) {
    const seq = bakePixelFxSequence(key);
    assert.ok(seq.width > 0 && seq.height > 0, `${key} should have positive dimensions`);
    assert.ok(seq.frames.length >= 2, `${key} should bake multiple frames`);
    assert.ok(seq.anchorX >= 0 && seq.anchorX <= 1, `${key} anchorX in [0, 1]`);
    assert.ok(seq.anchorY >= 0 && seq.anchorY <= 1, `${key} anchorY in [0, 1]`);

    // Check that at least one frame has visible non-transparent pixels
    let nonZeroAlphaPixels = 0;
    for (const frame of seq.frames) {
      assert.equal(frame.length, seq.width * seq.height * 4);
      for (let i = 3; i < frame.length; i += 4) {
        if (frame[i] > 0) {
          nonZeroAlphaPixels++;
        }
      }
    }
    assert.ok(nonZeroAlphaPixels > 20, `${key} should render visible pixel art (got ${nonZeroAlphaPixels})`);
  }
});

test('Crossbow bolt and Wizard Staff plasma projectile have distinct dimensions and pixel signatures', () => {
  const boltSeq = bakePixelFxSequence('proj_crossbow_bolt');
  const staffSeq = bakePixelFxSequence('proj_staff_arcane');

  assert.notEqual(
    boltSeq.width,
    staffSeq.width,
    'Crossbow bolt (arrow) and Wizard Staff plasma shot should have distinct canvas geometries'
  );
  assert.equal(boltSeq.loop, true);
  assert.equal(staffSeq.loop, true);
});

test('PixelFxRegistry caches baked sequences deterministically', () => {
  const first = bakePixelFxSequence('slash_sword');
  const second = bakePixelFxSequence('slash_sword');
  assert.equal(first, second);
  assert.equal(Object.keys(PIXEL_FX_RECIPES).length, 26);
});
