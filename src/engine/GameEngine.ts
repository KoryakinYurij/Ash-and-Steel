import { Application, Container, FederatedPointerEvent, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, getWaveComposition } from '../data/enemies';
import { generateLootItem, RARITY_CONFIG } from '../data/items';
import { useGameStore } from '../store/useGameStore';
import { EnemyArchetypeId, GameItem, HubStationId, WeaponSpriteType } from '../types/game';
import { SoundManager } from './SoundManager';
import { SpriteFactory, SpriteKey } from './SpriteFactory';
import { PixelFxKey } from './PixelFxRegistry';
import { ActivePixelFxAnimation, PixelFxRenderer } from './PixelFxRenderer';
import {
  EllipticalObstacle,
  TallOccludingStructure,
  checkProjectileObstacleHit,
  computeDepthZ,
  computeWeaponHandTransform,
  resolveEllipticalCollider,
  selectFloorTileKey,
  selectPerimeterWallTile,
  shouldOccludeFade,
  toPerspectiveRy,
} from './Perspective34';

interface PuppetActor {
  spriteKey: SpriteKey;
  root: Container;
  shadow: Graphics;
  bodyWrap: Container;
  sprite: Sprite;
  weaponPivot: Container;
  weaponSprite: Sprite;
  hpBarBg?: Graphics;
  hpBarFill?: Graphics;
  telegraphGraphic?: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  knockVx: number;
  knockVy: number;
  facing: 1 | -1;
  walkDist: number;
  idleTime: number;
  baseScale: number;
  weaponBaseScale: number;
  hitFlashTimer: number;
  swingTimer: number;
  swingDuration: number;
  swingDir: 1 | -1;
  aimAngle: number;
}

interface EnemyInstance extends PuppetActor {
  uid: string;
  archetypeId: EnemyArchetypeId;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  cooldownTimer: number;
  windupTimer: number;
  windupDuration: number;
  isWindingUp: boolean;
  chargeTargetX: number;
  chargeTargetY: number;
  flankSign: 1 | -1;
  isDying: boolean;
  deathTimer: number;
}

interface ProjectileInstance {
  root: Container;
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  isCrit: boolean;
  life: number;
  radius: number;
}

interface GroundDropInstance {
  uid: string;
  root: Container;
  glow: Graphics;
  sprite: Sprite;
  label?: Text;
  x: number;
  y: number;
  bobPhase: number;
  type: 'gold' | 'essence' | 'item';
  amount?: number;
  item?: GameItem;
  pickupCooldown?: number;
}

interface SlashArcEffect {
  graphic: Graphics;
  life: number;
  maxLife: number;
}

interface FloatingTextEffect {
  textObj: Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface PooledParticle {
  graphic: Graphics;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface AfterimageGhost {
  sprite: Sprite;
  life: number;
  maxLife: number;
}

interface TorchLightProp {
  root: Container;
  glow: Graphics;
  sprite: Sprite;
  phase: number;
}

interface StationTrigger {
  id: HubStationId | 'extraction';
  nameRu: string;
  subLabelRu: string;
  x: number;
  y: number;
  radius: number;
  root: Container;
  ring: Graphics;
  sprite: Sprite;
  upperWrap: Container;
  occludeStructure: TallOccludingStructure;
}

interface DungeonPillarInstance {
  id: string;
  x: number;
  y: number;
  root: Container;
  upperColumn: Container;
  structure: TallOccludingStructure;
}

export class GameEngine {
  private containerEl: HTMLElement;
  private app: Application | null = null;
  private isDestroyed = false;

  // Scene hierarchy (only Containers call addChild)
  private worldContainer = new Container();
  private floorLayer = new Container();
  private propLayer = new Container();
  private dropLayer = new Container();
  private shadowLayer = new Container();
  private actorLayer = new Container();
  private projectileLayer = new Container();
  private fxLayer = new Container();
  private uiWorldLayer = new Container();

  // Player puppet
  private player!: PuppetActor;
  private currentWeaponSpriteType: WeaponSpriteType = 'broadsword';
  private playerAttackCooldown = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private dashCooldownMax = 1.25;
  private dashDirX = 0;
  private dashDirY = 0;
  private afterimageAccum = 0;
  private playerInvulnTimer = 0;

  // Hub & World 3/4 props
  private stations: StationTrigger[] = [];
  private trainingDummy: PuppetActor | null = null;
  private torches: TorchLightProp[] = [];
  private pillars: DungeonPillarInstance[] = [];
  private obstacles: EllipticalObstacle[] = [];

  // Dungeon Wave & Entities
  private activeMode: 'hub' | 'dungeon' = 'hub';
  private activeWave = 1;
  private enemies: EnemyInstance[] = [];
  private projectiles: ProjectileInstance[] = [];
  private groundDrops: GroundDropInstance[] = [];
  private slashEffects: SlashArcEffect[] = [];
  private oneShotPixelFx: ActivePixelFxAnimation[] = [];
  private loopingPixelFx: ActivePixelFxAnimation[] = [];
  private floatingTexts: FloatingTextEffect[] = [];
  private afterimages: AfterimageGhost[] = [];
  private particlePool: PooledParticle[] = [];

  private waveEnemiesSpawned = 0;
  private activeRunId = 0;
  private waveEnemiesKilled = 0;
  private waveEnemiesTotal = 10;
  private waveSpawnTimer = 0;
  private waveSpawnInterval = 1.6;
  private waveMaxConcurrent = 6;
  private extractionStation: StationTrigger | null = null;

  // Arena bounds
  private arenaHalfW = 420;
  private arenaHalfH = 290;

  // Camera & Juice
  private camX = 0;
  private camY = 0;
  private trauma = 0;
  private hitstopTimer = 0;
  private hudSyncAccum = 0;

  // Input state
  private keysDown: Set<string> = new Set();
  private pointerScreenX = 0;
  private pointerScreenY = 0;
  private pointerWorldX = 100;
  private pointerWorldY = 0;
  private isPointerDown = false;

  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }

  public async init(): Promise<void> {
    const app = new Application();
    await app.init({
      resizeTo: this.containerEl,
      backgroundColor: 0x0b0c10,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    if (this.isDestroyed) {
      app.destroy(true, { children: true });
      return;
    }

    this.app = app;
    this.containerEl.appendChild(app.canvas);

    await SpriteFactory.preloadExternalAssets();
    if (this.isDestroyed) return;

    // Enable Y-sorting on prop and actor layers for authentic 3/4 depth
    this.propLayer.sortableChildren = true;
    this.actorLayer.sortableChildren = true;

    // Assemble world layer hierarchy
    this.worldContainer.addChild(this.floorLayer);
    this.worldContainer.addChild(this.propLayer);
    this.worldContainer.addChild(this.dropLayer);
    this.worldContainer.addChild(this.shadowLayer);
    this.worldContainer.addChild(this.actorLayer);
    this.worldContainer.addChild(this.projectileLayer);
    this.worldContainer.addChild(this.fxLayer);
    this.worldContainer.addChild(this.uiWorldLayer);
    app.stage.addChild(this.worldContainer);

    this.initParticlePool(80);
    PixelFxRenderer.warmUpCoreEffects();
    this.createPlayerPuppet();
    this.bindInputListeners();

    const store = useGameStore.getState();
    this.activeMode = store.mode;
    this.activeWave = store.currentWave;
    if (this.activeMode === 'hub') {
      this.buildHubScene();
    } else {
      this.buildDungeonScene(this.activeWave);
    }

    app.ticker.add((ticker) => {
      const rawDt = ticker.deltaMS / 1000;
      const dt = Math.min(rawDt, 0.05);
      this.update(dt);
    });
  }

  private initParticlePool(count: number): void {
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      g.rect(-2, -2, 4, 4).fill({ color: 0xffffff });
      g.visible = false;
      this.fxLayer.addChild(g);
      this.particlePool.push({
        graphic: g,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.4,
        size: 1,
      });
    }
  }

  private spawnParticles(x: number, y: number, color: number, count: number, speed = 110): void {
    let spawned = 0;
    for (const p of this.particlePool) {
      if (p.active) continue;
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.8);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd - 20;
      p.maxLife = 0.22 + Math.random() * 0.25;
      p.life = p.maxLife;
      p.size = 0.8 + Math.random() * 0.9;
      p.graphic.clear();
      p.graphic.rect(-2, -2, 4, 4).fill({ color });
      p.graphic.position.set(x, y);
      p.graphic.scale.set(p.size);
      p.graphic.alpha = 1;
      p.graphic.visible = true;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private createPlayerPuppet(): void {
    const root = new Container();
    root.sortableChildren = true;

    const shadow = new Graphics();
    shadow.ellipse(0, 21, 16, 7).fill({ color: 0x000000, alpha: 0.58 });
    shadow.zIndex = 0;
    root.addChild(shadow);

    const bodyWrap = new Container();
    bodyWrap.zIndex = 2;
    const sprite = new Sprite(SpriteFactory.getActorFrameTexture('player_knight', 'idle', 0));
    // Anchor at (0.5, 0.56) so the 16x22 Knight's boots rest firmly on the ground shadow at y = +21
    sprite.anchor.set(0.5, 0.56);
    const baseScale = 3.15;
    sprite.scale.set(baseScale);
    bodyWrap.addChild(sprite);
    root.addChild(bodyWrap);

    const weaponPivot = new Container();
    weaponPivot.zIndex = 3;
    weaponPivot.position.set(8, 3);
    const weaponSprite = new Sprite(SpriteFactory.getTexture('weapon_broadsword'));
    weaponSprite.anchor.set(0.2, 0.8);
    const weaponBaseScale = 3.0;
    weaponSprite.scale.set(weaponBaseScale);
    weaponPivot.addChild(weaponSprite);
    root.addChild(weaponPivot);

    this.actorLayer.addChild(root);

    this.player = {
      spriteKey: 'player_knight',
      root,
      shadow,
      bodyWrap,
      sprite,
      weaponPivot,
      weaponSprite,
      x: 0,
      y: 44,
      vx: 0,
      vy: 0,
      knockVx: 0,
      knockVy: 0,
      facing: 1,
      walkDist: 0,
      idleTime: 0,
      baseScale,
      weaponBaseScale,
      hitFlashTimer: 0,
      swingTimer: 0,
      swingDuration: 0.2,
      swingDir: 1,
      aimAngle: 0,
    };
  }

  private syncEquippedWeaponTexture(): void {
    const equippedWeapon = useGameStore.getState().equipped.weapon;
    const desiredType: WeaponSpriteType = equippedWeapon?.weaponSprite || 'broadsword';
    if (desiredType !== this.currentWeaponSpriteType) {
      this.currentWeaponSpriteType = desiredType;
      const key = `weapon_${desiredType}` as SpriteKey;
      this.player.weaponSprite.texture = SpriteFactory.getTexture(key);
    }
  }

  private clearSceneEntities(): void {
    this.floorLayer.removeChildren();
    this.propLayer.removeChildren();
    this.dropLayer.removeChildren();
    this.projectileLayer.removeChildren();
    this.uiWorldLayer.removeChildren();

    for (const e of this.enemies) {
      e.root.destroy({ children: true });
    }
    this.enemies = [];

    if (this.trainingDummy) {
      this.trainingDummy.root.destroy({ children: true });
      this.trainingDummy = null;
    }

    for (const st of this.stations) {
      st.root.destroy({ children: true });
    }
    this.stations = [];

    for (const t of this.torches) {
      t.root.destroy({ children: true });
    }
    this.torches = [];

    for (const p of this.pillars) {
      p.root.destroy({ children: true });
    }
    this.pillars = [];
    this.obstacles = [];

    for (const fx of this.oneShotPixelFx) {
      fx.sprite.destroy();
    }
    this.oneShotPixelFx = [];
    this.loopingPixelFx = [];

    this.projectiles = [];
    this.groundDrops = [];
    this.extractionStation = null;
  }

  private spawnPixelFx(
    key: PixelFxKey,
    x: number,
    y: number,
    opts?: {
      scale?: number;
      rotation?: number;
      flipY?: boolean;
      tint?: number;
      layer?: Container;
    }
  ): void {
    const def = PixelFxRenderer.getEffect(key);
    if (!def.textures.length) return;

    const sprite = new Sprite(def.textures[0]);
    sprite.anchor.set(def.anchorX, def.anchorY);
    sprite.position.set(x, y);
    const sc = opts?.scale ?? 1.5;
    sprite.scale.set(sc, opts?.flipY ? -sc : sc);
    if (opts?.rotation !== undefined) {
      sprite.rotation = opts.rotation;
    }
    if (opts?.tint !== undefined) {
      sprite.tint = opts.tint;
    }

    (opts?.layer ?? this.fxLayer).addChild(sprite);
    this.oneShotPixelFx.push({
      sprite,
      textures: def.textures,
      fps: def.fps,
      loop: false,
      elapsed: 0,
      destroyOnComplete: true,
    });
  }

  private attachLoopingPixelFx(
    key: PixelFxKey,
    parent: Container,
    opts?: {
      x?: number;
      y?: number;
      scale?: number;
      scaleX?: number;
      scaleY?: number;
      phaseOffset?: number;
    }
  ): Sprite {
    const def = PixelFxRenderer.getEffect(key);
    const startElapsed = opts?.phaseOffset ?? 0;
    const startIdx =
      def.textures.length > 0
        ? Math.floor(startElapsed * def.fps) % def.textures.length
        : 0;
    const sprite = new Sprite(def.textures[startIdx] || Texture.EMPTY);
    sprite.anchor.set(def.anchorX, def.anchorY);
    sprite.position.set(opts?.x ?? 0, opts?.y ?? 0);
    const sc = opts?.scale ?? 1.5;
    sprite.scale.set(opts?.scaleX ?? sc, opts?.scaleY ?? sc);
    parent.addChild(sprite);

    this.loopingPixelFx.push({
      sprite,
      textures: def.textures,
      fps: def.fps,
      loop: true,
      elapsed: startElapsed,
      destroyOnComplete: false,
    });

    return sprite;
  }

  private buildArenaTiles(halfW: number, halfH: number, isHub: boolean): void {
    this.arenaHalfW = halfW;
    this.arenaHalfH = halfH;
    const tileSize = 48; // 16x16 scaled by 3x
    const cols = Math.ceil((halfW * 2) / tileSize);
    const rows = Math.ceil((halfH * 2) / tileSize);
    const startX = -halfW;
    const startY = -halfH;

    // 3/4 Top-Down Room Architecture with 9-Slice Mitered Parapet Framing:
    // r = -2 is the top wall cap ('wall_top') + mitered top corners ('wall_corner_tl', 'wall_corner_tr')
    // r = -1 is the vertical front-facing North masonry wall ('wall_brick') framed by vertical side parapets
    // r = 0..rows-1, c = 0..cols-1 is the foreshortened stone flagstone floor
    // Left, right, and bottom perimeter borders use dedicated vertical side parapets and south ledge caps
    for (let r = -2; r <= rows; r++) {
      for (let c = -1; c <= cols; c++) {
        const tx = startX + c * tileSize;
        const ty = startY + r * tileSize;
        const isBorder = r < 0 || r === rows || c === -1 || c === cols;

        if (isBorder) {
          const wallKey: SpriteKey = selectPerimeterWallTile(r, c, rows, cols);
          const wallSprite = new Sprite(SpriteFactory.getTexture(wallKey));
          wallSprite.position.set(tx, ty);
          wallSprite.scale.set(3);
          this.floorLayer.addChild(wallSprite);
        } else {
          const key = selectFloorTileKey(r, c, rows, cols, isHub);
          const tile = new Sprite(SpriteFactory.getTexture(key));
          tile.position.set(tx, ty);
          tile.scale.set(3);
          this.floorLayer.addChild(tile);
        }
      }
    }

    // Architectural drop shadow cast by the vertical North wall onto the horizontal stone floor
    const wallShadow = new Graphics();
    const totalFloorW = cols * tileSize;
    const totalFloorH = rows * tileSize;
    wallShadow.rect(startX, startY, totalFloorW, 20).fill({ color: 0x020408, alpha: 0.58 });
    wallShadow.rect(startX, startY + 20, totalFloorW, 10).fill({ color: 0x020408, alpha: 0.25 });
    // Vertical corner ambient occlusion on the North brick wall (r = -1) where it meets the side parapets
    wallShadow.rect(startX, startY - tileSize, 16, tileSize).fill({ color: 0x020408, alpha: 0.48 });
    wallShadow.rect(startX + totalFloorW - 16, startY - tileSize, 16, tileSize).fill({ color: 0x020408, alpha: 0.48 });
    // Subtle inner perimeter ambient occlusion along side and bottom walls
    wallShadow.rect(startX, startY, 12, totalFloorH).fill({ color: 0x020408, alpha: 0.35 });
    wallShadow.rect(startX + totalFloorW - 12, startY, 12, totalFloorH).fill({ color: 0x020408, alpha: 0.35 });
    wallShadow.rect(startX, startY + totalFloorH - 14, totalFloorW, 14).fill({ color: 0x020408, alpha: 0.4 });
    this.floorLayer.addChild(wallShadow);

    // Center Sanctuary in Hub: 3/4 Stepped Stone Dais + perspective-matched Rune Circle
    if (isHub) {
      const daisY = 24;
      const sanctuaryDais = new Graphics();
      // 1. Ground contact shadow under stone dais
      sanctuaryDais.ellipse(0, daisY + 7, 94, 42).fill({ color: 0x020408, alpha: 0.62 });
      // 2. Vertical stone step front thickness (3D lip in 3/4 view)
      sanctuaryDais.ellipse(0, daisY + 4, 88, 39).fill({ color: 0x161b26 });
      // 3. Upper horizontal stone platform face (foreshortened ry/rx ≈ 0.43)
      sanctuaryDais
        .ellipse(0, daisY - 2, 88, 38)
        .fill({ color: 0x252d3d })
        .stroke({ color: 0x475569, width: 1.5, alpha: 0.75 });
      // 4. Inner recessed altar stone ring
      sanctuaryDais
        .ellipse(0, daisY - 2, 72, 31)
        .fill({ color: 0x1a202c })
        .stroke({ color: 0xd97706, width: 1.2, alpha: 0.42 });
      // 5. Soft warm ambient glow on the stone surface
      sanctuaryDais.ellipse(0, daisY - 2, 68, 29).fill({ color: 0xf59e0b, alpha: 0.09 });
      this.floorLayer.addChild(sanctuaryDais);

      // Attach rune circle with scaleY > scaleX so its native SY=0.3 ellipse matches the 3/4 floor angle (~0.42)
      this.attachLoopingPixelFx('loop_rune_circle', this.floorLayer, {
        x: 0,
        y: daisY - 1,
        scaleX: 1.38,
        scaleY: 1.95,
      });
    }

    // 1. WALL TORCHES ('loop_torch'): Mounted ONLY on the vertical North brick wall (r = -1)
    // Their iron wall brackets now bolt directly onto 'wall_brick' masonry instead of floating in midair!
    const northWallY = startY - 14;
    const wallTorchXCoords: number[] = isHub
      ? [-144, 144]
      : [-330, -115, 115, 330];

    wallTorchXCoords.forEach((x, idx) => {
      const root = new Container();
      root.position.set(x, northWallY);
      root.zIndex = northWallY;

      const glow = new Graphics();
      // Warm wall wash + foreshortened floor light pool below the wall sconce
      glow.circle(0, -6, 48).fill({ color: 0xf97316, alpha: 0.13 });
      glow.ellipse(0, 26, 72, 30).fill({ color: 0xf97316, alpha: 0.11 });
      glow.ellipse(0, 22, 38, 16).fill({ color: 0xfef08a, alpha: 0.14 });
      root.addChild(glow);

      const sprite = this.attachLoopingPixelFx('loop_torch', root, {
        x: 0,
        y: 6,
        scale: 1.35,
        phaseOffset: idx * 0.41,
      });

      this.propLayer.addChild(root);
      this.torches.push({ root, glow, sprite, phase: idx * 1.3 });
    });

    // 2. FLOOR-STANDING BRAZIERS ('loop_brazier'): Grounded 3-legged iron tripods on 3/4 stone plinths
    const floorBrazierCoords: [number, number][] = isHub
      ? [
          [-326, -86],
          [326, -86],
          [-326, 134],
          [326, 134],
        ]
      : [
          [-385, -135],
          [385, -135],
          [-385, 145],
          [385, 145],
        ];

    floorBrazierCoords.forEach(([x, y], idx) => {
      const root = new Container();
      root.position.set(x, y);
      // Unified Y-sorting on actorLayer by the brazier's stone plinth ground contact line
      const groundContactY = y + 6;
      root.zIndex = computeDepthZ(groundContactY);

      // Stepped 3/4 circular stone plinth under the iron tripod legs
      const plinth = new Graphics();
      plinth.ellipse(0, 5, 24, 10.5).fill({ color: 0x020408, alpha: 0.68 });
      plinth.ellipse(0, 3, 20, 9).fill({ color: 0x161b26 });
      plinth
        .ellipse(0, 0, 20, 8.5)
        .fill({ color: 0x283142 })
        .stroke({ color: 0x64748b, width: 1, alpha: 0.7 });
      plinth.ellipse(0, 0, 13, 5.5).fill({ color: 0x090b10, alpha: 0.65 });
      root.addChild(plinth);

      // Subtle core ground warmth (brazier.js already bakes the outer floor light ring)
      const glow = new Graphics();
      glow.ellipse(0, 0, 28, 12).fill({ color: 0xfef08a, alpha: 0.12 });
      root.addChild(glow);

      const sprite = this.attachLoopingPixelFx('loop_brazier', root, {
        x: 0,
        y: 3,
        scaleX: 1.22,
        scaleY: 0.96,
        phaseOffset: (idx + 2) * 0.53,
      });

      this.actorLayer.addChild(root);
      this.torches.push({ root, glow, sprite, phase: (idx + 3) * 1.1 });
      this.obstacles.push({
        id: `brazier_${idx}`,
        x,
        y: groundContactY - 2,
        rx: 18,
        ry: 8,
      });
    });
  }

  public buildHubScene(): void {
    this.clearSceneEntities();
    this.activeMode = 'hub';
    this.buildArenaTiles(384, 216, true);

    this.player.x = 0;
    this.player.y = 20;
    this.player.vx = 0;
    this.player.vy = 0;
    this.camX = 0;
    this.camY = 0;

    // Create the 3 Interactive Hub Stations on grounded 3/4 stone pedestals:
    // 1. Сундук Хранилища (Left)
    this.createStationTrigger({
      id: 'stash',
      nameRu: 'Сундук Хранилища',
      subLabelRu: '[E] или Клик — Снаряжение и Разбор',
      x: -200,
      y: -4,
      spriteKey: 'station_stash',
      ringColor: 0xfbbf24,
    });

    // 2. Кузница Улучшений (Right)
    this.createStationTrigger({
      id: 'forge',
      nameRu: 'Кузница Улучшений',
      subLabelRu: '[E] или Клик — Ковка +1 и Святилище',
      x: 200,
      y: -4,
      spriteKey: 'station_forge',
      ringColor: 0xf97316,
    });

    // 3. Врата Вылазки (Top Center archway threshold)
    this.createStationTrigger({
      id: 'portal',
      nameRu: 'Врата Вылазки',
      subLabelRu: '[E] или Клик — Вход в Катакомбы',
      x: 0,
      y: -124,
      spriteKey: 'station_portal',
      ringColor: 0xa855f7,
    });

    // 4. Interactive Training Dummy (Bottom Right) so player can test weapon swings & DPS in Hub
    this.createTrainingDummy(155, 118);
  }

  private createStationTrigger(cfg: {
    id: HubStationId | 'extraction';
    nameRu: string;
    subLabelRu: string;
    x: number;
    y: number;
    spriteKey: SpriteKey;
    ringColor: number;
  }): StationTrigger {
    const root = new Container();
    root.position.set(cfg.x, cfg.y);
    const isPortalFx = cfg.id === 'portal' || cfg.id === 'extraction';
    const groundContactY = cfg.y + (isPortalFx ? 16 : 19);
    root.zIndex = computeDepthZ(groundContactY);
    root.eventMode = 'static';
    root.cursor = 'pointer';

    // 1. Stepped 3/4 Stone Pedestal (Plinth) + Ground Contact Shadow so the station sits firmly on the floor
    const pedestal = new Graphics();
    if (isPortalFx) {
      // Ancient 3/4 stone portal threshold dais
      pedestal.ellipse(0, 22, 60, 25).fill({ color: 0x020408, alpha: 0.68 });
      pedestal.ellipse(0, 18, 54, 22).fill({ color: 0x161b26 });
      pedestal
        .ellipse(0, 13, 54, 21)
        .fill({ color: 0x262f40 })
        .stroke({ color: 0x64748b, width: 1.5, alpha: 0.75 });
      pedestal.ellipse(0, 13, 42, 16).fill({ color: 0x141824 });
    } else {
      // Heavy 3/4 stone plinth under Stash Chest & Blacksmith Anvil
      pedestal.ellipse(0, 25, 50, 21).fill({ color: 0x020408, alpha: 0.68 });
      // Vertical front step face (5px thick stone slab)
      pedestal.ellipse(0, 21, 44, 18).fill({ color: 0x161b26 });
      // Horizontal top plane of stone plinth
      pedestal
        .ellipse(0, 15, 44, 17)
        .fill({ color: 0x283142 })
        .stroke({ color: 0x64748b, width: 1.5, alpha: 0.75 });
      // Direct contact shadow of the chest/anvil resting on the stone plinth
      pedestal.ellipse(0, 15, 29, 11).fill({ color: 0x03050a, alpha: 0.78 });
    }
    root.addChild(pedestal);

    // 2. Foreshortened 3/4 Interactive Aura Ring on the horizontal pedestal surface
    const ring = new Graphics();
    if (isPortalFx) {
      ring.ellipse(0, 13, 46, 18).fill({ color: cfg.ringColor, alpha: 0.22 });
      ring.ellipse(0, 13, 46, 18).stroke({ color: cfg.ringColor, width: 1.5, alpha: 0.65 });
    } else {
      ring.ellipse(0, 15, 38, 14.5).fill({ color: cfg.ringColor, alpha: 0.16 });
      ring.ellipse(0, 15, 38, 14.5).stroke({ color: cfg.ringColor, width: 1.5, alpha: 0.55 });
    }
    root.addChild(ring);

    // 3. Upper Station Sprite / Portal Vortex wrapped so it can smoothly fade when occluding an actor behind it
    const upperWrap = new Container();
    let sprite: Sprite;
    if (isPortalFx) {
      const fxKey: PixelFxKey =
        cfg.id === 'portal' ? 'loop_portal_dungeon' : 'loop_portal_extraction';
      sprite = this.attachLoopingPixelFx(fxKey, upperWrap, {
        x: 0,
        y: -12,
        scale: 1.45,
      });
    } else {
      sprite = new Sprite(SpriteFactory.getTexture(cfg.spriteKey));
      sprite.anchor.set(0.5, 0.5);
      sprite.position.set(0, -4);
      sprite.scale.set(3.8);
      upperWrap.addChild(sprite);
    }
    root.addChild(upperWrap);

    const titleStyle = new TextStyle({
      fontFamily: 'Manrope, sans-serif',
      fontSize: 13,
      fontWeight: '700',
      fill: 0xf8fafc,
      stroke: { color: 0x090a0f, width: 4 },
      align: 'center',
    });
    const titleText = new Text({ text: cfg.nameRu, style: titleStyle });
    titleText.anchor.set(0.5, 1);
    titleText.position.set(0, isPortalFx ? -58 : -38);
    root.addChild(titleText);

    const subStyle = new TextStyle({
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10,
      fontWeight: '600',
      fill: cfg.ringColor,
      stroke: { color: 0x090a0f, width: 3 },
      align: 'center',
    });
    const subText = new Text({ text: cfg.subLabelRu, style: subStyle });
    subText.anchor.set(0.5, 0);
    subText.position.set(0, isPortalFx ? 42 : 36);
    root.addChild(subText);

    root.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.activateStation(cfg.id);
    });

    // Add to unified Y-sorted actorLayer so actors walking behind stations are properly occluded
    this.actorLayer.addChild(root);

    // Register solid 3/4 elliptical pedestal footprint collider slightly behind the front zIndex baseline
    if (cfg.id !== 'extraction') {
      this.obstacles.push({
        id: `station_${cfg.id}`,
        x: cfg.x,
        y: cfg.y + 6,
        rx: isPortalFx ? 36 : 35,
        ry: isPortalFx ? 15 : 15,
      });
    }

    const occludeStructure: TallOccludingStructure = {
      x: cfg.x,
      baseY: groundContactY,
      occludeHalfW: isPortalFx ? 46 : 38,
      occludeHeight: isPortalFx ? 82 : 60,
    };

    const trigger: StationTrigger = {
      id: cfg.id,
      nameRu: cfg.nameRu,
      subLabelRu: cfg.subLabelRu,
      x: cfg.x,
      y: cfg.y,
      radius: 78,
      root,
      ring,
      sprite,
      upperWrap,
      occludeStructure,
    };
    this.stations.push(trigger);
    return trigger;
  }

  private createTrainingDummy(x: number, y: number): void {
    const root = new Container();
    root.position.set(x, y);
    root.zIndex = computeDepthZ(y + 18);

    const shadow = new Graphics();
    // Grounded 3/4 stone/wood stand shadow beneath the training dummy post
    shadow.ellipse(0, 23, 22, 9.5).fill({ color: 0x020408, alpha: 0.65 });
    shadow
      .ellipse(0, 20, 17, 7.5)
      .fill({ color: 0x262f40 })
      .stroke({ color: 0x475569, width: 1, alpha: 0.65 });
    root.addChild(shadow);

    this.obstacles.push({
      id: 'training_dummy',
      x,
      y: y + 18,
      rx: 15,
      ry: 7,
    });

    const bodyWrap = new Container();
    const sprite = new Sprite(SpriteFactory.getTexture('training_dummy'));
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(3.4);
    bodyWrap.addChild(sprite);
    root.addChild(bodyWrap);

    const label = new Text({
      text: 'Манекен (Проверка урона)',
      style: new TextStyle({
        fontFamily: 'Manrope, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: 0x94a3b8,
        stroke: { color: 0x090a0f, width: 3 },
      }),
    });
    label.anchor.set(0.5, 1);
    label.position.set(0, -32);
    root.addChild(label);

    const weaponPivot = new Container();
    const weaponSprite = new Sprite();
    weaponPivot.addChild(weaponSprite);
    root.addChild(weaponPivot);

    this.actorLayer.addChild(root);

    this.trainingDummy = {
      spriteKey: 'training_dummy',
      root,
      shadow,
      bodyWrap,
      sprite,
      weaponPivot,
      weaponSprite,
      x,
      y,
      vx: 0,
      vy: 0,
      knockVx: 0,
      knockVy: 0,
      facing: 1,
      walkDist: 0,
      idleTime: 0,
      baseScale: 3.4,
      weaponBaseScale: 1,
      hitFlashTimer: 0,
      swingTimer: 0,
      swingDuration: 0.2,
      swingDir: 1,
      aimAngle: 0,
    };
  }

  public buildDungeonScene(wave: number): void {
    const store = useGameStore.getState();
    this.clearSceneEntities();
    this.activeMode = 'dungeon';
    this.activeRunId = store.runId;
    this.activeWave = wave;
    this.buildArenaTiles(540, 360, false);

    // Build 4 tactical 3/4 stone pillars inside the catacomb hall for depth occlusion & projectile cover
    const pillarCoords: [string, number, number][] = [
      ['pillar_nw', -224, -92],
      ['pillar_ne', 224, -92],
      ['pillar_sw', -224, 108],
      ['pillar_se', 224, 108],
    ];
    for (const [id, px, py] of pillarCoords) {
      this.createDungeonPillar(id, px, py);
    }

    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.camX = 0;
    this.camY = 0;

    const comp = getWaveComposition(wave);
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesKilled = 0;
    this.waveEnemiesTotal = comp.totalEnemies;
    this.waveSpawnInterval = comp.spawnInterval;
    this.waveMaxConcurrent = comp.maxConcurrent;
    this.waveSpawnTimer = 0.4;

    store.syncWaveProgress(0, this.waveEnemiesTotal, false);

    // Spawn initial 3 enemies around the perimeter so action starts immediately
    for (let i = 0; i < 3; i++) {
      this.spawnWaveEnemy(wave, i === 0 && comp.guaranteedElites > 0 && wave >= 2);
    }
  }

  private createDungeonPillar(id: string, x: number, y: number): void {
    const root = new Container();
    root.position.set(x, y);
    // Sort threshold at the front edge of the stone plinth so actors behind/beside the upper shaft sort behind it
    const groundContactY = y + 22;
    root.zIndex = computeDepthZ(groundContactY);

    // 1. Grounded 3/4 stone plinth + directional ambient cast shadow
    const baseGraphics = new Graphics();
    // Cast shadow to south-east
    baseGraphics.ellipse(8, 21, 36, 15.5).fill({ color: 0x020408, alpha: 0.62 });
    // Stepped 3/4 stone pedestal under pillar
    baseGraphics.ellipse(0, 18, 30, 13).fill({ color: 0x131722 });
    baseGraphics
      .ellipse(0, 13, 30, 12.5)
      .fill({ color: 0x252e40 })
      .stroke({ color: 0x64748b, width: 1.2, alpha: 0.72 });
    // Subtle warm ward glow on floor around the rune pillar
    baseGraphics.ellipse(0, 15, 38, 16).fill({ color: 0xf59e0b, alpha: 0.07 });
    root.addChild(baseGraphics);

    // 2. Seamless 1-piece 16x32 monolithic 3/4 stone column + capital (zero mid-shaft black seam!)
    const upperColumn = new Container();
    const pillarSprite = new Sprite(SpriteFactory.getTexture('dungeon_pillar'));
    pillarSprite.anchor.set(0.5, 0.84);
    pillarSprite.position.set(0, 14);
    pillarSprite.scale.set(3.5);
    upperColumn.addChild(pillarSprite);

    root.addChild(upperColumn);
    this.actorLayer.addChild(root);

    const structure: TallOccludingStructure = {
      x,
      baseY: groundContactY,
      occludeHalfW: 38,
      occludeHeight: 96,
    };

    this.pillars.push({
      id,
      x,
      y,
      root,
      upperColumn,
      structure,
    });

    this.obstacles.push({
      id,
      x,
      y: y + 4,
      rx: 29,
      ry: 14,
      blocksProjectiles: true,
      projectileRadius: 22,
      projectileYOffset: -10,
    });
  }

  private spawnWaveEnemy(wave: number, forceElite = false): void {
    if (this.waveEnemiesSpawned >= this.waveEnemiesTotal) return;
    const comp = getWaveComposition(wave);

    let archetypeId: EnemyArchetypeId = 'skeleton_warrior';
    if (forceElite || (this.waveEnemiesSpawned === this.waveEnemiesTotal - 1 && comp.guaranteedElites > 0)) {
      archetypeId = 'blood_golem';
    } else {
      const totalWeight = comp.pool.reduce((acc, p) => acc + p.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const entry of comp.pool) {
        if (roll < entry.weight) {
          archetypeId = entry.id;
          break;
        }
        roll -= entry.weight;
      }
    }

    const def = ENEMY_DEFINITIONS[archetypeId];
    // Choose a spawn position safely away from the player and outside any stone pillars
    let sx = 0;
    let sy = 0;
    for (let attempt = 0; attempt < 14; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 240 + Math.random() * 180;
      sx = Math.max(-this.arenaHalfW + 48, Math.min(this.arenaHalfW - 48, this.player.x + Math.cos(angle) * dist));
      sy = Math.max(-this.arenaHalfH + 48, Math.min(this.arenaHalfH - 48, this.player.y + Math.sin(angle) * dist));
      const farFromPlayer = Math.hypot(sx - this.player.x, sy - this.player.y) > 170;
      const clearOfObstacles = this.obstacles.every(
        (obs) => Math.hypot(sx - obs.x, sy - obs.y) > obs.rx + 28
      );
      if (farFromPlayer && clearOfObstacles) break;
    }

    const root = new Container();
    root.sortableChildren = true;
    root.position.set(sx, sy);

    const telegraphGraphic = new Graphics();
    telegraphGraphic.zIndex = -1;
    root.addChild(telegraphGraphic);

    const shadow = new Graphics();
    shadow.zIndex = 0;
    const shadowRx = def.isElite ? 22 : 15;
    shadow.ellipse(0, 20, shadowRx, 7).fill({ color: 0x000000, alpha: 0.55 });
    root.addChild(shadow);

    const bodyWrap = new Container();
    bodyWrap.zIndex = 2;
    const sprite = new Sprite(SpriteFactory.getActorFrameTexture(archetypeId, 'idle', 0));
    sprite.anchor.set(0.5, 0.54);
    sprite.scale.set(def.scale);
    bodyWrap.addChild(sprite);
    root.addChild(bodyWrap);

    const weaponPivot = new Container();
    weaponPivot.zIndex = 3;
    weaponPivot.position.set(8, 3);
    const weaponSprite = new Sprite(SpriteFactory.getTexture(`weapon_${def.weaponSprite}` as SpriteKey));
    weaponSprite.anchor.set(0.2, 0.8);
    const weaponBaseScale = def.isElite ? 3.4 : 2.6;
    weaponSprite.scale.set(weaponBaseScale);
    weaponPivot.addChild(weaponSprite);
    root.addChild(weaponPivot);

    // Health bar above enemy
    const hpBarBg = new Graphics();
    hpBarBg.zIndex = 4;
    const barW = def.isElite ? 48 : 32;
    hpBarBg.roundRect(-barW / 2, -34, barW, 5, 2).fill({ color: 0x090a0f, alpha: 0.85 });
    root.addChild(hpBarBg);

    const hpBarFill = new Graphics();
    hpBarFill.zIndex = 5;
    hpBarFill.roundRect(-barW / 2 + 1, -33, barW - 2, 3, 1).fill({
      color: def.isElite ? 0xfbbf24 : 0xef4444,
    });
    root.addChild(hpBarFill);

    this.actorLayer.addChild(root);

    const scaledHp = Math.round(def.baseHp * comp.hpMultiplier);
    const scaledDamage = Math.round(def.baseDamage * comp.damageMultiplier);

    this.enemies.push({
      uid: `enemy_${Date.now()}_${Math.random()}`,
      archetypeId,
      spriteKey: archetypeId,
      root,
      shadow,
      bodyWrap,
      sprite,
      weaponPivot,
      weaponSprite,
      hpBarBg,
      hpBarFill,
      telegraphGraphic,
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      knockVx: 0,
      knockVy: 0,
      facing: 1,
      walkDist: 0,
      idleTime: Math.random() * 4,
      baseScale: def.scale,
      weaponBaseScale,
      hitFlashTimer: 0,
      swingTimer: 0,
      swingDuration: 0.24,
      swingDir: 1,
      aimAngle: 0,
      hp: scaledHp,
      maxHp: scaledHp,
      damage: scaledDamage,
      speed: def.speed,
      attackRange: def.attackRange,
      attackCooldown: def.attackCooldown,
      cooldownTimer: 0.6 + Math.random() * 0.5,
      windupTimer: 0,
      windupDuration: def.windupTime,
      isWindingUp: false,
      chargeTargetX: sx,
      chargeTargetY: sy,
      flankSign: Math.random() < 0.5 ? 1 : -1,
      isDying: false,
      deathTimer: 0,
    });

    this.waveEnemiesSpawned++;
    this.spawnPixelFx('spawn_rift', sx, sy + 10, {
      scale: 1.25,
      layer: this.floorLayer,
    });
    this.spawnParticles(sx, sy, def.isElite ? 0xdc2626 : 0x9333ea, 10, 80);
  }

  private spawnExtractionPortal(): void {
    if (this.extractionStation) return;
    this.extractionStation = this.createStationTrigger({
      id: 'extraction',
      nameRu: 'Алтарь Эвакуации',
      subLabelRu: '[E] или Клик — Эвакуация или Следующая Волна',
      x: 0,
      y: 0,
      spriteKey: 'extraction_portal',
      ringColor: 0x10b981,
    });
    this.spawnPixelFx('pickup_essence', 0, 0, { scale: 1.8 });
    this.spawnParticles(0, 0, 0x34d399, 24, 150);
    SoundManager.playLootPickup();
  }

  private activateStation(stationId: HubStationId | 'extraction'): void {
    const store = useGameStore.getState();
    if (stationId === 'portal') {
      store.startDungeonRun();
    } else {
      store.setActiveStationModal(stationId);
    }
  }

  private bindInputListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private unbindInputListeners(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private onWindowBlur = (): void => {
    this.keysDown.clear();
    this.isPointerDown = false;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const store = useGameStore.getState();
    const code = e.code;

    // Title screen start shortcut
    if (store.shellState === 'title' && (code === 'Enter' || code === 'Space')) {
      e.preventDefault();
      store.setShellState('playing');
      return;
    }

    // Pause / close modal shortcut
    if (code === 'Escape' || code === 'KeyP') {
      if (store.activeStationModal) {
        store.setActiveStationModal(null);
        return;
      }
      if (store.shellState === 'playing') {
        store.setShellState('paused');
        return;
      } else if (store.shellState === 'paused') {
        store.setShellState('playing');
        return;
      }
    }

    // Inventory / Run Bag toggle on [I], [Tab], or [B]
    if (code === 'KeyI' || code === 'Tab' || code === 'KeyB') {
      if (store.shellState === 'playing') {
        e.preventDefault();
        const targetModal = store.mode === 'dungeon' ? 'runbag' : 'stash';
        if (store.activeStationModal === targetModal) {
          store.setActiveStationModal(null);
        } else if (!store.activeStationModal) {
          store.setActiveStationModal(targetModal);
        }
        return;
      }
    }

    if (store.shellState !== 'playing' || store.activeStationModal) return;

    this.keysDown.add(code);

    // Dash on Space
    if (code === 'Space') {
      e.preventDefault();
      this.tryTriggerDash();
    }

    // Interact on E
    if (code === 'KeyE') {
      this.tryInteractWithNearby();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.app) return;
    const rect = this.app.canvas.getBoundingClientRect();
    this.pointerScreenX = e.clientX - rect.left;
    this.pointerScreenY = e.clientY - rect.top;
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    const store = useGameStore.getState();
    if (store.shellState !== 'playing' || store.activeStationModal) return;

    // Ignore clicks on React HUD buttons
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [role="dialog"], [data-hud-interactive="true"]')) {
      return;
    }

    this.onPointerMove(e);
    this.isPointerDown = true;
    this.tryPlayerAttack();
  };

  private onPointerUp = (): void => {
    this.isPointerDown = false;
  };

  private tryInteractWithNearby(): void {
    const store = useGameStore.getState();
    if (store.nearbyStation) {
      this.activateStation(store.nearbyStation);
    }
  }

  private tryTriggerDash(): void {
    if (this.dashCooldown > 0 || this.dashTimer > 0) return;

    let dx = 0;
    let dy = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) dy -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) dy += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) dx -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) dx += 1;

    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.player.aimAngle);
      dy = Math.sin(this.player.aimAngle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    this.dashDirX = dx;
    this.dashDirY = dy;
    this.dashTimer = 0.16;
    this.dashCooldown = this.dashCooldownMax;
    this.playerInvulnTimer = 0.22;

    // Squash & stretch on dash
    this.player.bodyWrap.scale.set(1.25, 0.78);
    SoundManager.playDash();
    this.spawnParticles(this.player.x, this.player.y, 0x38bdf8, 8, 90);
  }

  private tryPlayerAttack(): void {
    if (this.playerAttackCooldown > 0) return;

    const store = useGameStore.getState();
    const stats = store.getComputedStats();
    const equippedWeapon = store.equipped.weapon;
    const isRanged = equippedWeapon?.isRanged ?? false;

    const baseInterval = 0.42;
    this.playerAttackCooldown = Math.max(0.14, baseInterval / stats.attackSpeed);

    // Swing animation across 120-degree arc
    this.player.swingDuration = Math.min(0.22, this.playerAttackCooldown * 0.85);
    this.player.swingTimer = this.player.swingDuration;
    this.player.swingDir = this.player.swingDir === 1 ? -1 : 1;

    const angle = this.player.aimAngle;

    if (isRanged) {
      const isCrossbow = this.currentWeaponSpriteType === 'crossbow';
      if (isCrossbow) {
        SoundManager.playCrossbowShot();
        this.spawnPixelFx(
          'cast_crossbow',
          this.player.x + Math.cos(angle) * 14,
          this.player.y + Math.sin(angle) * 14,
          {
            scale: 1.15,
            rotation: angle,
          }
        );
      } else {
        SoundManager.playStaffCast();
        this.spawnPixelFx(
          'cast_staff',
          this.player.x + Math.cos(angle) * 18,
          this.player.y + Math.sin(angle) * 18,
          {
            scale: 1.25,
            rotation: angle,
          }
        );
      }

      const isCrit = Math.random() * 100 < stats.critChance;
      const dmg = Math.round(stats.damage * (isCrit ? 1.75 : 1));
      const projSpeed = isCrossbow ? 520 : 410;
      this.spawnProjectile({
        x: this.player.x + Math.cos(angle) * 24,
        y: this.player.y + Math.sin(angle) * 24,
        vx: Math.cos(angle) * projSpeed,
        vy: Math.sin(angle) * projSpeed,
        damage: dmg,
        isPlayer: true,
        isCrit,
        projectileKind: isCrossbow ? 'crossbow_bolt' : 'staff_arcane',
      });
      return;
    }

    SoundManager.playSwordSlash();

    const slashKey: PixelFxKey =
      this.currentWeaponSpriteType === 'daggers'
        ? 'slash_daggers'
        : this.currentWeaponSpriteType === 'battle-axe'
        ? 'slash_axe'
        : 'slash_sword';

    this.spawnPixelFx(
      slashKey,
      this.player.x + Math.cos(angle) * 18,
      this.player.y + Math.sin(angle) * 18,
      {
        scale: this.currentWeaponSpriteType === 'battle-axe' ? 1.35 : 1.45,
        rotation: angle,
        flipY: this.player.swingDir === -1 && slashKey !== 'slash_axe',
      }
    );

    // Melee arc hit detection (120-degree cone, reach 76px)
    const reach = 78;
    const coneCos = Math.cos((68 * Math.PI) / 180);

    // Check Training Dummy in Hub
    if (this.activeMode === 'hub' && this.trainingDummy) {
      const dx = this.trainingDummy.x - this.player.x;
      const dy = this.trainingDummy.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= reach) {
        const dirDot = (dx / (dist || 1)) * Math.cos(angle) + (dy / (dist || 1)) * Math.sin(angle);
        if (dirDot >= coneCos || dist < 36) {
          const isCrit = Math.random() * 100 < stats.critChance;
          const dmg = Math.round(stats.damage * (isCrit ? 1.75 : 1));
          this.trainingDummy.hitFlashTimer = 0.1;
          this.trainingDummy.bodyWrap.scale.set(1.22, 0.8);
          SoundManager.playHitImpact(isCrit);
          this.spawnPixelFx(
            isCrit ? 'impact_crit' : 'impact_hit',
            this.trainingDummy.x,
            this.trainingDummy.y,
            {
              scale: isCrit ? 1.35 : 1.25,
              rotation: angle,
            }
          );
          this.spawnParticles(this.trainingDummy.x, this.trainingDummy.y, isCrit ? 0xfbbf24 : 0xe2e8f0, 8, 110);
          this.spawnFloatingText(
            this.trainingDummy.x,
            this.trainingDummy.y - 24,
            isCrit ? `${dmg}! КРИТ` : `${dmg}`,
            isCrit ? 0xfbbf24 : 0xf8fafc,
            isCrit ? 16 : 13
          );
        }
      }
    }

    // Check Dungeon Enemies
    for (const enemy of this.enemies) {
      if (enemy.isDying) continue;
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= reach) {
        const dirDot = (dx / (dist || 1)) * Math.cos(angle) + (dy / (dist || 1)) * Math.sin(angle);
        if (dirDot >= coneCos || dist < 38) {
          const isCrit = Math.random() * 100 < stats.critChance;
          const dmg = Math.round(stats.damage * (isCrit ? 1.75 : 1));
          this.damageEnemy(enemy, dmg, isCrit, Math.cos(angle) * 190, Math.sin(angle) * 190);
        }
      }
    }
  }

  private spawnProjectile(cfg: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    isPlayer: boolean;
    isCrit: boolean;
    projectileKind?: 'crossbow_bolt' | 'staff_arcane' | 'cultist_dark';
  }): void {
    const root = new Container();
    root.position.set(cfg.x, cfg.y);
    const kind = cfg.projectileKind ?? (cfg.isPlayer ? 'staff_arcane' : 'cultist_dark');
    const fxKey: PixelFxKey =
      kind === 'crossbow_bolt'
        ? 'proj_crossbow_bolt'
        : kind === 'staff_arcane'
        ? 'proj_staff_arcane'
        : 'proj_cultist_dark';

    const sprite = this.attachLoopingPixelFx(fxKey, root, {
      x: 0,
      y: 0,
      scale: kind === 'crossbow_bolt' ? 1.45 : kind === 'staff_arcane' ? 1.35 : 1.25,
    });
    sprite.rotation = Math.atan2(cfg.vy, cfg.vx);
    this.projectileLayer.addChild(root);

    this.projectiles.push({
      root,
      sprite,
      x: cfg.x,
      y: cfg.y,
      vx: cfg.vx,
      vy: cfg.vy,
      damage: cfg.damage,
      isPlayer: cfg.isPlayer,
      isCrit: cfg.isCrit,
      life: 1.4,
      radius: 14,
    });
  }

  private damageEnemy(
    enemy: EnemyInstance,
    damage: number,
    isCrit: boolean,
    knockVx: number,
    knockVy: number
  ): void {
    if (enemy.isDying) return;
    enemy.hp = Math.max(0, enemy.hp - damage);
    enemy.hitFlashTimer = 0.09;
    enemy.knockVx = knockVx;
    enemy.knockVy = knockVy;
    enemy.bodyWrap.scale.set(1.2, 0.82);

    // Update Enemy HP bar
    if (enemy.hpBarFill) {
      const def = ENEMY_DEFINITIONS[enemy.archetypeId];
      const barW = (def.isElite ? 48 : 32) - 2;
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      enemy.hpBarFill.clear();
      if (ratio > 0) {
        enemy.hpBarFill
          .roundRect(-(barW / 2), -31, Math.max(2, barW * ratio), 3, 1)
          .fill({ color: def.isElite ? 0xfbbf24 : 0xef4444 });
      }
    }

    SoundManager.playHitImpact(isCrit);
    this.trauma = Math.min(1, this.trauma + (isCrit ? 0.32 : 0.16));
    if (isCrit || enemy.hp <= 0) {
      this.hitstopTimer = 0.04;
    }

    const hitAngle = Math.atan2(knockVy, knockVx);
    this.spawnPixelFx(
      isCrit ? 'impact_crit' : 'impact_hit',
      enemy.x,
      enemy.y,
      {
        scale: isCrit ? 1.35 : 1.2,
        rotation: hitAngle,
      }
    );
    this.spawnParticles(enemy.x, enemy.y, isCrit ? 0xfbbf24 : 0xef4444, isCrit ? 14 : 7, 130);
    this.spawnFloatingText(
      enemy.x + (Math.random() - 0.5) * 16,
      enemy.y - 26,
      isCrit ? `${damage}!` : `${damage}`,
      isCrit ? 0xfbbf24 : 0xf8fafc,
      isCrit ? 16 : 13
    );

    if (enemy.hp <= 0) {
      enemy.isDying = true;
      enemy.deathTimer = 0.28;
      if (enemy.telegraphGraphic) enemy.telegraphGraphic.clear();
      const def = ENEMY_DEFINITIONS[enemy.archetypeId];
      this.spawnPixelFx(
        def.isElite ? 'death_elite' : 'death_poof',
        enemy.x,
        enemy.y,
        { scale: def.isElite ? 1.65 : 1.35 }
      );
      this.onEnemyKilled(enemy);
    }
  }

  private onEnemyKilled(enemy: EnemyInstance): void {
    const def = ENEMY_DEFINITIONS[enemy.archetypeId];
    const store = useGameStore.getState();

    // Roll currency drops
    const goldAmt =
      def.goldDrop[0] + Math.floor(Math.random() * (def.goldDrop[1] - def.goldDrop[0] + 1));
    const essenceAmt =
      def.essenceDrop[0] + Math.floor(Math.random() * (def.essenceDrop[1] - def.essenceDrop[0] + 1));

    this.spawnGroundDrop({
      x: enemy.x - 14 + (Math.random() - 0.5) * 16,
      y: enemy.y + (Math.random() - 0.5) * 16,
      type: 'gold',
      amount: goldAmt,
    });

    if (essenceAmt > 0) {
      this.spawnGroundDrop({
        x: enemy.x + 14 + (Math.random() - 0.5) * 16,
        y: enemy.y + (Math.random() - 0.5) * 16,
        type: 'essence',
        amount: essenceAmt,
      });
    }

    // Roll equipment loot drop
    const waveLootBonus = 1 + (this.activeWave - 1) * 0.12;
    if (Math.random() < def.lootDropChance * waveLootBonus) {
      const item = generateLootItem({
        wave: this.activeWave,
        forcedRarity: def.isElite && Math.random() < 0.45 ? 'epic' : undefined,
      });
      this.spawnGroundDrop({
        x: enemy.x,
        y: enemy.y - 8,
        type: 'item',
        item,
      });
    }

    this.waveEnemiesKilled++;
    const allCleared =
      this.waveEnemiesKilled >= this.waveEnemiesTotal &&
      this.enemies.filter((e) => !e.isDying).length === 0;

    store.syncWaveProgress(this.waveEnemiesKilled, this.waveEnemiesTotal, allCleared);
    if (allCleared) {
      this.spawnExtractionPortal();
    }
  }

  private spawnGroundDrop(cfg: {
    x: number;
    y: number;
    type: 'gold' | 'essence' | 'item';
    amount?: number;
    item?: GameItem;
    pickupCooldown?: number;
  }): void {
    const root = new Container();
    root.position.set(cfg.x, cfg.y);

    const glow = new Graphics();
    let glowColor = 0xfbbf24;
    let spriteKey: SpriteKey = 'loot_gold';

    if (cfg.type === 'essence') {
      glowColor = 0x34d399;
      spriteKey = 'loot_essence';
    } else if (cfg.type === 'item' && cfg.item) {
      const rarityColorHex = RARITY_CONFIG[cfg.item.rarity].colorHex;
      glowColor = parseInt(rarityColorHex.replace('#', ''), 16);
      spriteKey = cfg.item.weaponSprite
        ? (`weapon_${cfg.item.weaponSprite}` as SpriteKey)
        : 'loot_chest';
    }

    // 3/4 Perspective-foreshortened ground drop shadow + aura ellipse on the stone floor
    const auraRx = cfg.type === 'item' ? 24 : 15;
    const auraRy = toPerspectiveRy(auraRx);
    glow.ellipse(0, 9, auraRx * 0.72, toPerspectiveRy(auraRx * 0.72)).fill({ color: 0x020408, alpha: 0.55 });
    glow.ellipse(0, 7, auraRx, auraRy).fill({ color: glowColor, alpha: 0.24 });
    if (cfg.type === 'item') {
      glow.ellipse(0, 7, auraRx, auraRy).stroke({ color: glowColor, width: 1.5, alpha: 0.78 });
    }
    root.addChild(glow);

    let sprite: Sprite;
    if (cfg.type === 'gold') {
      sprite = this.attachLoopingPixelFx('loop_coin', root, {
        x: 0,
        y: 0,
        scale: 1.35,
        phaseOffset: Math.random() * 1.6,
      });
    } else if (cfg.type === 'essence') {
      sprite = this.attachLoopingPixelFx('loop_essence', root, {
        x: 0,
        y: 0,
        scale: 1.3,
        phaseOffset: Math.random() * 2.4,
      });
    } else {
      sprite = new Sprite(SpriteFactory.getTexture(spriteKey));
      sprite.anchor.set(0.5, 0.5);
      sprite.scale.set(2.6);
      root.addChild(sprite);
    }

    let label: Text | undefined;
    if (cfg.type === 'item' && cfg.item) {
      label = new Text({
        text: cfg.item.name,
        style: new TextStyle({
          fontFamily: 'Manrope, sans-serif',
          fontSize: 10,
          fontWeight: '700',
          fill: glowColor,
          stroke: { color: 0x090a0f, width: 3 },
        }),
      });
      label.anchor.set(0.5, 1);
      label.position.set(0, -18);
      root.addChild(label);
    }

    this.dropLayer.addChild(root);
    this.groundDrops.push({
      uid: `drop_${Date.now()}_${Math.random()}`,
      root,
      glow,
      sprite,
      label,
      x: cfg.x,
      y: cfg.y,
      bobPhase: Math.random() * Math.PI * 2,
      type: cfg.type,
      amount: cfg.amount,
      item: cfg.item,
      pickupCooldown: cfg.pickupCooldown ?? 0,
    });
  }

  private spawnSlashArc(
    x: number,
    y: number,
    angle: number,
    radius: number,
    color: number
  ): void {
    const g = new Graphics();
    g.position.set(x, y);
    const startAngle = angle - Math.PI / 3;
    const endAngle = angle + Math.PI / 3;

    g.arc(0, 0, radius, startAngle, endAngle).stroke({
      color,
      width: 7,
      alpha: 0.85,
    });
    g.arc(0, 0, radius - 6, startAngle + 0.15, endAngle - 0.15).stroke({
      color: 0xfbbf24,
      width: 3,
      alpha: 0.65,
    });

    this.fxLayer.addChild(g);
    this.slashEffects.push({
      graphic: g,
      life: 0.14,
      maxLife: 0.14,
    });
  }

  private spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: number,
    fontSize = 13
  ): void {
    const textObj = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'JetBrains Mono, monospace',
        fontSize,
        fontWeight: '700',
        fill: color,
        stroke: { color: 0x090a0f, width: 3.5 },
      }),
    });
    textObj.anchor.set(0.5, 0.5);
    textObj.position.set(x, y);
    this.uiWorldLayer.addChild(textObj);

    this.floatingTexts.push({
      textObj,
      vx: (Math.random() - 0.5) * 28,
      vy: -58,
      life: 0.65,
      maxLife: 0.65,
    });
  }

  private damagePlayer(rawAmount: number, sourceX: number, sourceY: number): void {
    if (this.playerInvulnTimer > 0) return;
    const store = useGameStore.getState();
    if (store.mode !== 'dungeon' || store.shellState !== 'playing') return;

    const stats = store.getComputedStats();
    const mitigated = Math.max(2, Math.round(rawAmount - stats.armor * 0.45));
    const nextHp = Math.max(0, store.playerHp - mitigated);

    this.playerInvulnTimer = 0.45;
    this.player.hitFlashTimer = 0.14;
    this.trauma = Math.min(1, this.trauma + 0.42);
    this.hitstopTimer = 0.045;

    const dx = this.player.x - sourceX;
    const dy = this.player.y - sourceY;
    const dist = Math.hypot(dx, dy) || 1;
    this.player.knockVx = (dx / dist) * 210;
    this.player.knockVy = (dy / dist) * 210;

    SoundManager.playPlayerHurt();
    this.spawnPixelFx('impact_hit', this.player.x, this.player.y, {
      scale: 1.35,
      rotation: Math.atan2(dy, dx),
      tint: 0xff6666,
    });
    this.spawnParticles(this.player.x, this.player.y, 0xdc2626, 14, 130);
    this.spawnFloatingText(this.player.x, this.player.y - 28, `-${mitigated}`, 0xef4444, 15);

    store.syncPlayerVitals(nextHp, stats.maxHp);
    if (nextHp <= 0) {
      store.triggerPlayerDefeat();
    }
  }

  private update(dt: number): void {
    if (!this.app) return;
    const store = useGameStore.getState();

    // A new run can start on the same wave as the previous run.
    if (store.mode === 'dungeon') {
      if (
        this.activeMode !== 'dungeon' ||
        store.currentWave !== this.activeWave ||
        store.runId !== this.activeRunId
      ) {
        this.buildDungeonScene(store.currentWave);
      }
    } else if (this.activeMode !== 'hub') {
      this.buildHubScene();
    }

    this.syncEquippedWeaponTexture();

    // Animate torches & looping pixelfx props even when paused/title
    for (const t of this.torches) {
      t.phase += dt * 7;
      const pulse = 1 + Math.sin(t.phase) * 0.08;
      t.glow.scale.set(pulse);
    }
    this.updateLoopingPixelFx(dt);

    const dungeonBehindTitle = store.mode === 'dungeon' && store.shellState === 'title';
    if (store.shellState === 'paused' || store.shellState === 'gameover' || dungeonBehindTitle) {
      this.updateCamera(dt);
      return;
    }

    // Hitstop freeze for heavy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateCamera(dt);
      return;
    }

    this.updatePlayer(dt, store);
    if (this.trainingDummy) {
      this.updatePuppetVisuals(this.trainingDummy, dt);
    }

    this.updateProjectiles(dt);

    if (this.activeMode === 'dungeon') {
      this.updateWaveSpawner(dt);
      this.updateEnemies(dt);
      this.updateGroundDrops(dt, store);
    }

    this.updateStationProximity(store);
    this.updateOcclusionFade(dt);
    this.updateEffects(dt);
    this.updateCamera(dt);
  }

  private updatePlayer(dt: number, store: ReturnType<typeof useGameStore.getState>): void {
    const stats = store.getComputedStats();

    if (this.playerAttackCooldown > 0) this.playerAttackCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.playerInvulnTimer > 0) this.playerInvulnTimer -= dt;

    // Convert screen pointer to world coordinates
    const screenW = this.app!.screen.width;
    const screenH = this.app!.screen.height;
    this.pointerWorldX = this.pointerScreenX - screenW / 2 + this.camX;
    this.pointerWorldY = this.pointerScreenY - screenH / 2 + this.camY;

    // Auto-aim at nearest enemy if autoAttack is active and enemies exist
    let targetX = this.pointerWorldX;
    let targetY = this.pointerWorldY;
    if (store.autoAttack && this.activeMode === 'dungeon' && this.enemies.length > 0) {
      let nearest: EnemyInstance | null = null;
      let bestDist = Infinity;
      for (const e of this.enemies) {
        if (e.isDying) continue;
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < bestDist) {
          bestDist = d;
          nearest = e;
        }
      }
      if (nearest && bestDist < 280) {
        targetX = nearest.x;
        targetY = nearest.y;
      }
    }

    this.player.aimAngle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    this.player.facing = Math.cos(this.player.aimAngle) >= 0 ? 1 : -1;

    // Movement input
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      const dashSpeed = stats.moveSpeed * 2.9;
      this.player.vx = this.dashDirX * dashSpeed;
      this.player.vy = this.dashDirY * dashSpeed;

      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.035) {
        this.afterimageAccum = 0;
        this.spawnAfterimage();
      }
    } else if (store.shellState === 'playing' && !store.activeStationModal) {
      let mx = 0;
      let my = 0;
      if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) my -= 1;
      if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) my += 1;
      if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) mx -= 1;
      if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) mx += 1;

      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my);
        this.player.vx = (mx / len) * stats.moveSpeed;
        this.player.vy = (my / len) * stats.moveSpeed;
      } else {
        this.player.vx = 0;
        this.player.vy = 0;
      }
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
    }

    // Apply movement + knockback
    this.player.x += (this.player.vx + this.player.knockVx) * dt;
    this.player.y += (this.player.vy + this.player.knockVy) * dt;
    this.player.knockVx *= Math.pow(0.001, dt);
    this.player.knockVy *= Math.pow(0.001, dt);

    // Resolve smooth 3/4 elliptical collisions against pedestals, braziers, and dungeon pillars
    for (const obs of this.obstacles) {
      const resolved = resolveEllipticalCollider(this.player.x, this.player.y, 18, 12, obs);
      if (resolved.collided) {
        this.player.x = resolved.x;
        this.player.y = resolved.y;
      }
    }

    // Clamp to arena bounds
    const margin = 32;
    this.player.x = Math.max(-this.arenaHalfW + margin, Math.min(this.arenaHalfW - margin, this.player.x));
    this.player.y = Math.max(-this.arenaHalfH + margin, Math.min(this.arenaHalfH - margin, this.player.y));

    // Continuous attack if holding mouse or autoAttack in range
    if (
      store.shellState === 'playing' &&
      !store.activeStationModal &&
      (this.isPointerDown || (store.autoAttack && this.activeMode === 'dungeon' && this.enemies.some((e) => !e.isDying && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 220)))
    ) {
      this.tryPlayerAttack();
    }

    this.updatePuppetVisuals(this.player, dt);

    // Throttled sync of dash cooldown ratio to HUD
    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.08) {
      this.hudSyncAccum = 0;
      const ratio = this.dashCooldown > 0 ? this.dashCooldown / this.dashCooldownMax : 0;
      if (Math.abs(ratio - store.dashCooldownRatio) > 0.02) {
        store.syncPlayerVitals(store.playerHp, stats.maxHp, ratio);
      }
    }
  }

  private spawnAfterimage(): void {
    const ghost = new Sprite(this.player.sprite.texture);
    ghost.anchor.set(0.5, 0.56);
    ghost.position.set(this.player.x, this.player.y);
    ghost.scale.set(this.player.baseScale * this.player.facing, this.player.baseScale);
    ghost.tint = 0x38bdf8;
    ghost.alpha = 0.55;
    this.fxLayer.addChild(ghost);
    this.afterimages.push({ sprite: ghost, life: 0.18, maxLife: 0.18 });
  }

  private updatePuppetVisuals(actor: PuppetActor, dt: number): void {
    actor.root.position.set(actor.x, actor.y);
    // Sort by the actor's ground contact line (feet at y + 18) for unified 3/4 depth with stations & pillars
    actor.root.zIndex = computeDepthZ(actor.y + 18);

    const speed = Math.hypot(actor.vx, actor.vy);
    if (actor.spriteKey !== 'training_dummy') {
      if (speed > 8) {
        // Advance 4-frame pixel-art Run cycle synced to distance traveled (zero jelly distortion!)
        actor.walkDist += speed * dt * 0.055;
        const runFrame = Math.floor(actor.walkDist) % 4;
        actor.sprite.texture = SpriteFactory.getActorFrameTexture(actor.spriteKey, 'run', runFrame);
        // Crisp 1-pixel stride cadence without warping sprite scale
        const stepLift = runFrame === 1 || runFrame === 3 ? -2 : 0;
        actor.bodyWrap.position.y = stepLift;
      } else {
        // Advance 4-frame pixel-art Idle breathing cycle with planted feet
        actor.idleTime += dt * 4.2;
        const idleFrame = Math.floor(actor.idleTime) % 4;
        actor.sprite.texture = SpriteFactory.getActorFrameTexture(actor.spriteKey, 'idle', idleFrame);
        actor.bodyWrap.position.y *= Math.pow(0.01, dt);
      }
    }

    // Smoothly settle any discrete impulse squash-and-stretch (dash / hit impact) back to crisp 1.0
    actor.bodyWrap.scale.x += (1 - actor.bodyWrap.scale.x) * Math.min(1, dt * 16);
    actor.bodyWrap.scale.y += (1 - actor.bodyWrap.scale.y) * Math.min(1, dt * 16);

    actor.sprite.scale.x = actor.baseScale * actor.facing;
    actor.sprite.scale.y = actor.baseScale;

    if (actor.hitFlashTimer > 0) {
      actor.hitFlashTimer -= dt;
      actor.sprite.tint = 0xffaaaa;
      actor.bodyWrap.alpha = 0.85;
    } else {
      actor.sprite.tint = 0xffffff;
      actor.bodyWrap.alpha = 1;
    }

    // Weapon pivot aiming, left-facing vertical mirror, behind-shoulder z-ordering & 120-degree swing arc
    let swingOffset = 0;
    if (actor.swingTimer > 0) {
      actor.swingTimer = Math.max(0, actor.swingTimer - dt);
      const progress = 1 - actor.swingTimer / actor.swingDuration;
      const swingSpan = (120 * Math.PI) / 180;
      swingOffset = (-swingSpan / 2 + progress * swingSpan) * actor.swingDir;
    }

    const hand = computeWeaponHandTransform(
      actor.aimAngle,
      actor.facing,
      swingOffset,
      actor.weaponBaseScale
    );
    actor.weaponPivot.position.set(hand.pivotX, hand.pivotY + actor.bodyWrap.position.y * 0.5);
    actor.weaponSprite.scale.set(hand.scaleX, hand.scaleY);
    actor.weaponPivot.rotation = hand.rotation;
    actor.weaponPivot.zIndex = hand.behindBody ? 1 : 3;
  }

  private updateWaveSpawner(dt: number): void {
    if (this.waveEnemiesSpawned >= this.waveEnemiesTotal) return;
    const aliveCount = this.enemies.filter((e) => !e.isDying).length;
    if (aliveCount >= this.waveMaxConcurrent) return;

    this.waveSpawnTimer -= dt;
    if (this.waveSpawnTimer <= 0) {
      this.waveSpawnTimer = this.waveSpawnInterval;
      this.spawnWaveEnemy(this.activeWave);
    }
  }

  private updateEnemies(dt: number): void {
    let activeAttackers = 0;
    const maxConcurrentWindups = 3;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.isDying) {
        e.deathTimer -= dt;
        e.x += e.knockVx * dt;
        e.y += e.knockVy * dt;
        e.root.position.set(e.x, e.y);
        e.root.alpha = Math.max(0, e.deathTimer / 0.28);
        e.bodyWrap.rotation += 8 * dt * e.facing;
        if (e.deathTimer <= 0) {
          e.root.destroy({ children: true });
          this.enemies.splice(i, 1);

          // Check if last enemy just finished dying
          const allCleared =
            this.waveEnemiesKilled >= this.waveEnemiesTotal &&
            this.enemies.filter((en) => !en.isDying).length === 0;
          if (allCleared) {
            useGameStore.getState().syncWaveProgress(this.waveEnemiesKilled, this.waveEnemiesTotal, true);
            this.spawnExtractionPortal();
          }
        }
        continue;
      }

      const def = ENEMY_DEFINITIONS[e.archetypeId];
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;

      e.aimAngle = Math.atan2(dy, dx);
      e.facing = dirX >= 0 ? 1 : -1;

      if (e.cooldownTimer > 0) e.cooldownTimer -= dt;
      if (e.isWindingUp) activeAttackers++;

      // Handle Attack Windup Telegraph & Execution
      if (e.isWindingUp) {
        e.windupTimer -= dt;
        e.vx = 0;
        e.vy = 0;

        if (e.telegraphGraphic) {
          e.telegraphGraphic.clear();
          const progress = 1 - Math.max(0, e.windupTimer / e.windupDuration);
          if (def.behavior === 'heavy_charger') {
            // 3/4 Perspective ground charge corridor + foreshortened slam ellipse at target feet
            const relTx = e.chargeTargetX - e.x;
            const relTy = e.chargeTargetY - e.y;
            const slamRx = 46;
            const slamRy = toPerspectiveRy(slamRx);
            e.telegraphGraphic
              .moveTo(0, 16)
              .lineTo(relTx, relTy + 16)
              .stroke({ color: 0xef4444, width: 3, alpha: 0.35 + progress * 0.35 });
            e.telegraphGraphic
              .ellipse(relTx, relTy + 16, slamRx, slamRy)
              .fill({ color: 0xdc2626, alpha: 0.14 + progress * 0.24 })
              .stroke({ color: 0xef4444, width: 2, alpha: 0.88 });
            e.telegraphGraphic
              .ellipse(relTx, relTy + 16, Math.max(6, slamRx * progress), Math.max(3, slamRy * progress))
              .stroke({ color: 0xfca5a5, width: 1.5, alpha: 0.65 });
          } else if (def.behavior === 'ranged_kiter') {
            // 3/4 Arcane foot rune ellipse + directional aim sight-line toward player
            const castRx = 24;
            const castRy = toPerspectiveRy(castRx);
            const aimLen = Math.min(dist, 165);
            e.telegraphGraphic
              .ellipse(0, 18, castRx, castRy)
              .fill({ color: 0x9333ea, alpha: 0.14 + progress * 0.2 })
              .stroke({ color: 0xc084fc, width: 1.5, alpha: 0.55 + progress * 0.4 });
            e.telegraphGraphic
              .moveTo(dirX * 14, 10 + dirY * 8)
              .lineTo(dirX * aimLen, 10 + dirY * aimLen)
              .stroke({ color: 0xe879f9, width: 1.5, alpha: 0.35 + progress * 0.45 });
          } else {
            const teleRx = e.attackRange * 0.78;
            const teleRy = toPerspectiveRy(teleRx);
            e.telegraphGraphic
              .ellipse(0, 16, teleRx, teleRy)
              .fill({ color: 0xf59e0b, alpha: 0.06 + progress * 0.1 })
              .stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.42 + progress * 0.5 });
          }
        }

        if (e.windupTimer <= 0) {
          e.isWindingUp = false;
          if (e.telegraphGraphic) e.telegraphGraphic.clear();
          e.cooldownTimer = e.attackCooldown;
          e.swingTimer = e.swingDuration;

          if (def.behavior === 'ranged_kiter') {
            this.spawnProjectile({
              x: e.x + dirX * 16,
              y: e.y + dirY * 16,
              vx: dirX * 240,
              vy: dirY * 240,
              damage: e.damage,
              isPlayer: false,
              isCrit: false,
            });
          } else if (def.behavior === 'heavy_charger') {
            // Leap/slam toward chargeTarget
            const cdx = e.chargeTargetX - e.x;
            const cdy = e.chargeTargetY - e.y;
            const cdist = Math.hypot(cdx, cdy) || 1;
            e.knockVx = (cdx / cdist) * 340;
            e.knockVy = (cdy / cdist) * 340;
            this.spawnPixelFx('slash_axe', e.x, e.y, {
              scale: 1.5,
              rotation: e.aimAngle,
            });
            if (Math.hypot(this.player.x - e.x, this.player.y - e.y) <= e.attackRange + 18) {
              this.damagePlayer(e.damage, e.x, e.y);
            }
          } else {
            // Melee strike
            this.spawnPixelFx('slash_sword', e.x + dirX * 12, e.y + dirY * 12, {
              scale: 1.15,
              rotation: e.aimAngle,
              tint: 0xff6b6b,
            });
            if (dist <= e.attackRange + 14) {
              this.damagePlayer(e.damage, e.x, e.y);
            }
          }
        }
      } else {
        // Distinct Movement Policies
        if (def.behavior === 'melee_chaser') {
          if (dist > e.attackRange * 0.85) {
            e.vx = dirX * e.speed;
            e.vy = dirY * e.speed;
          } else {
            e.vx = 0;
            e.vy = 0;
          }
        } else if (def.behavior === 'fast_flanker') {
          // Orbit/flank tangentially while closing in
          const perpX = -dirY * e.flankSign * 0.55;
          const perpY = dirX * e.flankSign * 0.55;
          if (dist > e.attackRange * 0.85) {
            e.vx = (dirX * 0.85 + perpX) * e.speed;
            e.vy = (dirY * 0.85 + perpY) * e.speed;
          } else {
            e.vx = perpX * e.speed * 0.5;
            e.vy = perpY * e.speed * 0.5;
          }
        } else if (def.behavior === 'ranged_kiter') {
          // Maintain distance ~150-210px
          if (dist < 125) {
            e.vx = -dirX * e.speed * 0.9;
            e.vy = -dirY * e.speed * 0.9;
          } else if (dist > 205) {
            e.vx = dirX * e.speed;
            e.vy = dirY * e.speed;
          } else {
            e.vx = -dirY * e.flankSign * e.speed * 0.45;
            e.vy = dirX * e.flankSign * e.speed * 0.45;
          }
        } else if (def.behavior === 'heavy_charger') {
          if (dist > e.attackRange * 1.3) {
            e.vx = dirX * e.speed;
            e.vy = dirY * e.speed;
          } else {
            e.vx = 0;
            e.vy = 0;
          }
        }

        // Start attack windup if in range and attack token available
        const triggerDist = def.behavior === 'heavy_charger' ? e.attackRange * 1.6 : e.attackRange;
        if (dist <= triggerDist && e.cooldownTimer <= 0 && activeAttackers < maxConcurrentWindups) {
          e.isWindingUp = true;
          e.windupTimer = e.windupDuration;
          e.chargeTargetX = this.player.x;
          e.chargeTargetY = this.player.y;
          activeAttackers++;
        }
      }

      // Soft separation between enemies so they don't stack on identical coordinates
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        if (other.isDying) continue;
        const sdx = e.x - other.x;
        const sdy = e.y - other.y;
        const sdist = Math.hypot(sdx, sdy);
        if (sdist > 0 && sdist < 34) {
          const push = ((34 - sdist) / 34) * 90;
          e.vx += (sdx / sdist) * push;
          e.vy += (sdy / sdist) * push;
        }
      }

      e.x += (e.vx + e.knockVx) * dt;
      e.y += (e.vy + e.knockVy) * dt;
      e.knockVx *= Math.pow(0.001, dt);
      e.knockVy *= Math.pow(0.001, dt);

      // Resolve 3/4 elliptical footprint collisions against pillars & braziers for enemies
      for (const obs of this.obstacles) {
        const resolved = resolveEllipticalCollider(e.x, e.y, 18, 11, obs);
        if (resolved.collided) {
          e.x = resolved.x;
          e.y = resolved.y;
        }
      }

      const margin = 36;
      e.x = Math.max(-this.arenaHalfW + margin, Math.min(this.arenaHalfW - margin, e.x));
      e.y = Math.max(-this.arenaHalfH + margin, Math.min(this.arenaHalfH - margin, e.y));

      this.updatePuppetVisuals(e, dt);
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.root.position.set(p.x, p.y);

      let hit = false;
      if (p.isPlayer) {
        if (this.activeMode === 'hub' && this.trainingDummy) {
          if (Math.hypot(this.trainingDummy.x - p.x, this.trainingDummy.y - p.y) <= 28) {
            this.trainingDummy.hitFlashTimer = 0.1;
            this.trainingDummy.bodyWrap.scale.set(1.22, 0.8);
            SoundManager.playHitImpact(p.isCrit);
            this.spawnPixelFx(
              p.isCrit ? 'impact_crit' : 'impact_hit',
              this.trainingDummy.x,
              this.trainingDummy.y,
              {
                scale: p.isCrit ? 1.35 : 1.25,
                rotation: Math.atan2(p.vy, p.vx),
              }
            );
            this.spawnParticles(
              this.trainingDummy.x,
              this.trainingDummy.y,
              p.isCrit ? 0xfbbf24 : 0xe2e8f0,
              8,
              110
            );
            this.spawnFloatingText(
              this.trainingDummy.x,
              this.trainingDummy.y - 24,
              p.isCrit ? `${p.damage}! КРИТ` : `${p.damage}`,
              p.isCrit ? 0xfbbf24 : 0xf8fafc,
              p.isCrit ? 16 : 13
            );
            hit = true;
          }
        }
        if (!hit) {
          for (const e of this.enemies) {
            if (e.isDying) continue;
            if (Math.hypot(e.x - p.x, e.y - p.y) <= 26) {
              this.damageEnemy(e, p.damage, p.isCrit, p.vx * 0.35, p.vy * 0.35);
              hit = true;
              break;
            }
          }
        }
      } else {
        if (Math.hypot(this.player.x - p.x, this.player.y - p.y) <= 22) {
          this.damagePlayer(p.damage, p.x, p.y);
          hit = true;
        }
      }

      // Check tactical projectile cover against solid 3/4 dungeon pillars
      if (!hit) {
        for (const obs of this.obstacles) {
          if (checkProjectileObstacleHit(p.x, p.y, p.radius * 0.55, obs)) {
            this.spawnPixelFx('impact_hit', p.x, p.y, {
              scale: 1.05,
              rotation: Math.atan2(-p.vy, -p.vx),
              tint: 0x94a3b8,
            });
            this.spawnParticles(p.x, p.y, 0x94a3b8, 6, 95);
            hit = true;
            break;
          }
        }
      }

      if (
        hit ||
        p.life <= 0 ||
        Math.abs(p.x) > this.arenaHalfW ||
        Math.abs(p.y) > this.arenaHalfH
      ) {
        p.root.destroy({ children: true });
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateGroundDrops(dt: number, store: ReturnType<typeof useGameStore.getState>): void {
    // Spawn any items dropped from the player's Run Bag onto the dungeon floor
    const droppedItems = store.consumePendingFloorDrops();
    for (const item of droppedItems) {
      const dropAngle = Math.random() * Math.PI * 2;
      const dropDist = 34 + Math.random() * 14;
      const dx = Math.max(
        -this.arenaHalfW + 40,
        Math.min(this.arenaHalfW - 40, this.player.x + Math.cos(dropAngle) * dropDist)
      );
      const dy = Math.max(
        -this.arenaHalfH + 40,
        Math.min(this.arenaHalfH - 40, this.player.y + Math.sin(dropAngle) * dropDist)
      );
      this.spawnGroundDrop({
        x: dx,
        y: dy,
        type: 'item',
        item,
        pickupCooldown: 3.2,
      });
      this.spawnParticles(dx, dy, 0x94a3b8, 6, 65);
    }

    for (let i = this.groundDrops.length - 1; i >= 0; i--) {
      const d = this.groundDrops[i];
      d.bobPhase += dt * 4.5;
      d.sprite.position.y = Math.sin(d.bobPhase) * 3.5;

      if (d.pickupCooldown && d.pickupCooldown > 0) {
        d.pickupCooldown = Math.max(0, d.pickupCooldown - dt);
        continue;
      }

      const dx = this.player.x - d.x;
      const dy = this.player.y - d.y;
      const dist = Math.hypot(dx, dy);

      // Magnetize toward player
      const magnetRadius = d.type === 'item' ? 85 : 135;
      if (dist < magnetRadius && dist > 1) {
        if (d.type !== 'item' || store.runBag.length < 10) {
          d.x += (dx / dist) * 230 * dt;
          d.y += (dy / dist) * 230 * dt;
          d.root.position.set(d.x, d.y);
        }
      }

      if (dist < 28) {
        if (d.type === 'gold') {
          const amt = d.amount || 10;
          store.collectRunCurrency(amt, 0);
          SoundManager.playLootPickup();
          this.spawnPixelFx('pickup_gold', d.x, d.y, { scale: 1.2 });
          this.spawnFloatingText(d.x, d.y - 16, `+${amt} Золота`, 0xfbbf24, 12);
          d.root.destroy({ children: true });
          this.groundDrops.splice(i, 1);
        } else if (d.type === 'essence') {
          const amt = d.amount || 2;
          store.collectRunCurrency(0, amt);
          SoundManager.playLootPickup();
          this.spawnPixelFx('pickup_essence', d.x, d.y, { scale: 1.2 });
          this.spawnFloatingText(d.x, d.y - 16, `+${amt} Эссенции`, 0x34d399, 12);
          d.root.destroy({ children: true });
          this.groundDrops.splice(i, 1);
        } else if (d.type === 'item' && d.item) {
          const picked = store.collectRunLoot(d.item);
          if (picked) {
            SoundManager.playLootPickup();
            this.spawnPixelFx('pickup_item', d.x, d.y, { scale: 1.35 });
            d.root.destroy({ children: true });
            this.groundDrops.splice(i, 1);
          }
        }
      }
    }
  }

  private updateStationProximity(store: ReturnType<typeof useGameStore.getState>): void {
    let closest: HubStationId | 'extraction' | null = null;
    let bestDist = Infinity;

    for (const st of this.stations) {
      const dist = Math.hypot(this.player.x - st.x, this.player.y - st.y);
      const isNear = dist <= st.radius;
      st.ring.alpha = isNear ? 1.0 : 0.55;
      const isPixelFxPortal = st.id === 'portal' || st.id === 'extraction';
      const baseScale = isPixelFxPortal ? 1.45 : 3.8;
      st.sprite.scale.set(isNear ? baseScale * 1.1 : baseScale);

      if (isNear && dist < bestDist) {
        bestDist = dist;
        closest = st.id;
      }
    }

    if (closest !== store.nearbyStation) {
      store.setNearbyStation(closest);
    }
  }

  private updateOcclusionFade(dt: number): void {
    const fadeSpeed = Math.min(1, dt * 12);

    // 1. Fade tall dungeon pillars when player or an enemy stands behind their upper shaft
    for (const pillar of this.pillars) {
      let occluded = shouldOccludeFade(this.player.x, this.player.y, 18, pillar.structure);
      if (!occluded) {
        for (const e of this.enemies) {
          if (!e.isDying && shouldOccludeFade(e.x, e.y, 18, pillar.structure)) {
            occluded = true;
            break;
          }
        }
      }
      const targetAlpha = occluded ? 0.42 : 1.0;
      pillar.upperColumn.alpha += (targetAlpha - pillar.upperColumn.alpha) * fadeSpeed;
    }

    // 2. Fade tall station sprites/portals when player walks behind them
    for (const st of this.stations) {
      const occluded = shouldOccludeFade(this.player.x, this.player.y, 18, st.occludeStructure);
      const targetAlpha = occluded ? 0.48 : 1.0;
      st.upperWrap.alpha += (targetAlpha - st.upperWrap.alpha) * fadeSpeed;
    }
  }

  private updateLoopingPixelFx(dt: number): void {
    for (let i = this.loopingPixelFx.length - 1; i >= 0; i--) {
      const fx = this.loopingPixelFx[i];
      if (!fx.sprite || fx.sprite.destroyed) {
        this.loopingPixelFx.splice(i, 1);
        continue;
      }
      fx.elapsed += dt;
      const total = fx.textures.length;
      if (total > 0) {
        const idx = Math.floor(fx.elapsed * fx.fps) % total;
        fx.sprite.texture = fx.textures[idx];
      }
    }
  }

  private updateEffects(dt: number): void {
    // One-shot patch-gg/pixelfx animations
    for (let i = this.oneShotPixelFx.length - 1; i >= 0; i--) {
      const fx = this.oneShotPixelFx[i];
      fx.elapsed += dt;
      const frameIdx = Math.floor(fx.elapsed * fx.fps);
      if (frameIdx >= fx.textures.length) {
        if (fx.destroyOnComplete) {
          fx.sprite.destroy();
        }
        this.oneShotPixelFx.splice(i, 1);
      } else {
        fx.sprite.texture = fx.textures[frameIdx];
      }
    }

    // Slash arcs
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const s = this.slashEffects[i];
      s.life -= dt;
      s.graphic.alpha = Math.max(0, s.life / s.maxLife);
      s.graphic.scale.set(1 + (1 - s.life / s.maxLife) * 0.18);
      if (s.life <= 0) {
        s.graphic.destroy();
        this.slashEffects.splice(i, 1);
      }
    }

    // Floating damage numbers
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.life -= dt;
      f.textObj.x += f.vx * dt;
      f.textObj.y += f.vy * dt;
      f.vy *= 0.92;
      f.textObj.alpha = Math.max(0, f.life / f.maxLife);
      if (f.life <= 0) {
        f.textObj.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }

    // Dash afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const a = this.afterimages[i];
      a.life -= dt;
      a.sprite.alpha = Math.max(0, (a.life / a.maxLife) * 0.55);
      if (a.life <= 0) {
        a.sprite.destroy();
        this.afterimages.splice(i, 1);
      }
    }

    // Pooled particles
    for (const p of this.particlePool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.graphic.visible = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.graphic.position.set(p.x, p.y);
      p.graphic.alpha = p.life / p.maxLife;
    }
  }

  private updateCamera(dt: number): void {
    if (!this.app) return;
    const followSpeed = 8.5;
    this.camX += (this.player.x - this.camX) * Math.min(1, followSpeed * dt);
    this.camY += (this.player.y - this.camY) * Math.min(1, followSpeed * dt);

    // Trauma decay & screen shake
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    const shakeMag = this.trauma * this.trauma * 12;
    const shakeX = (Math.random() * 2 - 1) * shakeMag;
    const shakeY = (Math.random() * 2 - 1) * shakeMag;

    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    this.worldContainer.position.set(
      Math.round(screenW / 2 - this.camX + shakeX),
      Math.round(screenH / 2 - this.camY + shakeY)
    );
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.unbindInputListeners();
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
