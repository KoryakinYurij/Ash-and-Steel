import { Assets, Texture } from 'pixi.js';

export type SpriteKey =
  | 'player_knight'
  | 'skeleton_warrior'
  | 'goblin_raider'
  | 'dark_cultist'
  | 'blood_golem'
  | 'training_dummy'
  | 'weapon_broadsword'
  | 'weapon_gladius'
  | 'weapon_battle-axe'
  | 'weapon_daggers'
  | 'weapon_wizard-staff'
  | 'weapon_crossbow'
  | 'floor_1'
  | 'floor_2'
  | 'floor_3'
  | 'floor_moss'
  | 'wall_brick'
  | 'wall_top'
  | 'wall_side_left'
  | 'wall_side_right'
  | 'wall_south'
  | 'wall_corner_tl'
  | 'wall_corner_tr'
  | 'wall_corner_bl'
  | 'wall_corner_br'
  | 'pillar_base'
  | 'pillar_top'
  | 'dungeon_pillar'
  | 'torch'
  | 'station_stash'
  | 'station_forge'
  | 'station_portal'
  | 'extraction_portal'
  | 'loot_chest'
  | 'loot_gold'
  | 'loot_essence'
  | 'projectile_cultist'
  | 'projectile_player';

export type ActorAnimMode = 'idle' | 'run';

/**
 * Optional external PNG asset map (0x72 DungeonTileset II / Kenney Tiny Dungeon compatible).
 * If any key is populated with a valid PNG URL, SpriteFactory.preloadExternalAssets() will
 * load it via PixiJS v8 Assets.load() and seamlessly override the procedural texture.
 */
export const externalSpriteMap: Partial<Record<SpriteKey, string>> = {};

type PaletteMap = Record<string, string>;

interface SpriteSpec {
  grid: string[];
  palette: PaletteMap;
  autoOutline: boolean;
  idleFrames?: string[][];
  runFrames?: string[][];
  legSplitRow?: number;
}

const KNIGHT_PALETTE: PaletteMap = {
  W: '#f8fafc', // Specular top-left steel highlight
  S: '#e2e8f0', // Lit steel plate
  M: '#94a3b8', // Mid steel armor
  D: '#475569', // Shadowed right-side steel
  K: '#1e293b', // Deep armor joint / crevice
  V: '#090d16', // Visor slit void
  E: '#38bdf8', // Glowing knight eyes (3/4 forward gaze)
  O: '#f87171', // Plume bright highlight
  C: '#dc2626', // Crimson plume & surcoat
  R: '#991b1b', // Deep crimson cape shadow
  B: '#78350f', // War-belt leather
  G: '#fbbf24', // Gold sun crest & buckle
};

const SPRITE_GRIDS: Record<SpriteKey, SpriteSpec> = {
  /**
   * Heroic 16x22 3/4 Dark-Fantasy Knight (0x72 DungeonTileset II inspired proportions:
   * tall 1:1.75 silhouette, top-left directional steel shading, 3/4 visor gaze,
   * flowing crimson plume/cape, and dedicated 4-frame Idle & 4-frame Run animations).
   */
  player_knight: {
    autoOutline: true,
    palette: KNIGHT_PALETTE,
    grid: [
      '.....OOCC.......',
      '....OCCRRC......',
      '.....CCRRC......',
      '.....WWSSSS.....',
      '....WSSSSMMD....',
      '....SSMVVVMD....',
      '....SMVEVEVD....',
      '....SSMVVVMD....',
      '.....SMDDDDS....',
      '...RWSSMMMMDD...',
      '..RWWSMMGMMMDK..',
      '..RR.SMGGGGMD...',
      '..RR.SCCRRCCD...',
      '..R..BBBBBBBB...',
      '..R..BBGGGGBB...',
      '.....SCCRRCCD...',
      '.....SMDDDDMD...',
      '.....SMK..KMD...',
      '.....SMD..DMD...',
      '....SSMD..DMSS..',
      '..........DDSS..',
      '................',
    ],
    idleFrames: [
      // Frame 0: Ready stance, feet planted in 3/4 stagger
      [
        '.....OOCC.......',
        '....OCCRRC......',
        '.....CCRRC......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '...RWSSMMMMDD...',
        '..RWWSMMGMMMDK..',
        '..RR.SMGGGGMD...',
        '..RR.SCCRRCCD...',
        '..R..BBBBBBBB...',
        '..R..BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '.....SMK..KMD...',
        '.....SMD..DMD...',
        '....SSMD..DMSS..',
        '..........DDSS..',
        '................',
      ],
      // Frame 1: Inhale / subtle helm & pauldron rise, plume waves back
      [
        '....OOCC........',
        '...OCCRRC.......',
        '....WWSSSS......',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '...RWSSMMMMDD...',
        '..RWWSMMGMMMDK..',
        '..RR.SMGGGGMD...',
        '..RR.SCCRRCCD...',
        '..R..BBBBBBBB...',
        '..R..BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '.....SMK..KMD...',
        '.....SMD..DMD...',
        '.....SMD..DMD...',
        '....SSMD..DMSS..',
        '..........DDSS..',
        '................',
      ],
      // Frame 2: Exhale / chestplate & helm settle 1px down while boots stay anchored
      [
        '................',
        '.....OOCC.......',
        '....OCCRRC......',
        '.....CCRRC......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '...RWSMDDDDSD...',
        '..RWWSMMGMMMDK..',
        '..RRRSMGGGGMD...',
        '..RR.SCCRRCCD...',
        '..R..BBBBBBBB...',
        '.....BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '.....SMK..KMD...',
        '.....SMD..DMD...',
        '....SSMD..DMSS..',
        '..........DDSS..',
        '................',
      ],
      // Frame 3: Recovery stance with cape flutter
      [
        '.....OOCC.......',
        '....OCCRRC......',
        '....RCCRRC......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '...RWSSMMMMDD...',
        '..RWWSMMGMMMDK..',
        '..RRRSMGGGGMD...',
        '..RR.SCCRRCCD...',
        '..R..BBBBBBBB...',
        '.....BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '.....SMK..KMD...',
        '.....SMD..DMD...',
        '....SSMD..DMSS..',
        '..........DDSS..',
        '................',
      ],
    ],
    runFrames: [
      // Run Frame 0: Wide stride — left boot kicks back-up, right boot plants forward, cape billows
      [
        '....OOCC........',
        '...OCCRRC.......',
        '....RCCRRC......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '..RRWSSMMMMDD...',
        '.RRWWSMMGMMMDK..',
        '.RRR.SMGGGGMD...',
        '.RR..SCCRRCCD...',
        '.....BBBBBBBB...',
        '.....BBGGGGBB...',
        '.....SCCRRCCD...',
        '....SMDDDDMD....',
        '...SSMD...KMD...',
        '...DDSS....DMSS.',
        '...........DDSS.',
        '................',
        '................',
      ],
      // Run Frame 1: Passing high bounce (body rises 1px, legs cross under center)
      [
        '.....OOCC.......',
        '....OCCRRC......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '...RWSSMMMMDD...',
        '..RWWSMMGMMMDK..',
        '..RR.SMGGGGMD...',
        '..R..SCCRRCCD...',
        '.....BBBBBBBB...',
        '.....BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '......SMKKMD....',
        '......SMDDMD....',
        '.....SSMDDS.....',
        '......DDSS......',
        '................',
        '................',
      ],
      // Run Frame 2: Opposite wide stride — left boot plants forward, right boot kicks back-up
      [
        '....OOCC........',
        '...OCCRRC.......',
        '....CCRRC.......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '..RRWSSMMMMDD...',
        '.RRWWSMMGMMMDK..',
        '.RRR.SMGGGGMD...',
        '..R..SCCRRCCD...',
        '.....BBBBBBBB...',
        '.....BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '....SMK...DMSS..',
        '...SSMD....DDSS.',
        '...DDSS.........',
        '................',
        '................',
      ],
      // Run Frame 3: Passing gather bounce
      [
        '.....OOCC.......',
        '....OCCRRC......',
        '.....WWSSSS.....',
        '....WSSSSMMD....',
        '....SSMVVVMD....',
        '....SMVEVEVD....',
        '....SSMVVVMD....',
        '.....SMDDDDS....',
        '...RWSSMMMMDD...',
        '..RWWSMMGMMMDK..',
        '..RRRSMGGGGMD...',
        '..RR.SCCRRCCD...',
        '.....BBBBBBBB...',
        '.....BBGGGGBB...',
        '.....SCCRRCCD...',
        '.....SMDDDDMD...',
        '.....SMK..KMD...',
        '.....SSMD.DMD...',
        '.....DDSS.DMSS..',
        '..........DDSS..',
        '................',
        '................',
      ],
    ],
  },

  skeleton_warrior: {
    autoOutline: true,
    legSplitRow: 14,
    palette: {
      W: '#ffffff', // Skull brow highlight
      B: '#f1f5f9', // Bone bright (left lit side)
      G: '#cbd5e1', // Bone mid/shadow (right side)
      D: '#64748b', // Deep bone socket / ribs
      E: '#ef4444', // Glowing undead eye
      R: '#7c2d12', // Tattered rustloin armor
      M: '#475569', // Iron greaves
    },
    grid: [
      '................',
      '.....WWBBBB.....',
      '....WBBBBGGGD...',
      '....BBDD.DDGD...',
      '....BBDE.EDGD...',
      '.....BBBBGGD....',
      '......B.BG.D....',
      '....BBGGGGGGD...',
      '...BB.BDBBGD.D..',
      '...G..B.BG.D.D..',
      '......BBBBGD....',
      '.....RRRRRRRD...',
      '.....RRDDDDDR...',
      '.....BB....GD...',
      '.....BG....GD...',
      '....MMG....GD...',
      '....MMM....MMM..',
      '...........MMM..',
      '................',
      '................',
    ],
  },

  goblin_raider: {
    autoOutline: true,
    legSplitRow: 13,
    palette: {
      H: '#86efac', // Goblin brow/ear top highlight
      G: '#4ade80', // Goblin light green skin
      D: '#16a34a', // Goblin shadow skin (right side)
      Y: '#facc15', // Yellow eyes
      R: '#dc2626', // Red bandana & pupils
      L: '#92400e', // Scavenger leather vest
      B: '#451a03', // Dark leather boots
    },
    grid: [
      '................',
      '................',
      '.....RRRRRR.....',
      '....RRRRRRRRD...',
      '.HH.HGGGGGGDD.G.',
      'HGG.GGGGGGGGD.GD',
      '.GD.GGYR.RYGD.D.',
      '.....GGGGGGDD...',
      '......DDDDDD....',
      '....LLLLLLLLD...',
      '...GG.LLLLLD.D..',
      '...D..BBBBBB.D..',
      '......LLLLLD....',
      '.....GG....DD...',
      '.....GD....DD...',
      '....BBB....BBB..',
      '...........BBB..',
      '................',
    ],
  },

  dark_cultist: {
    autoOutline: true,
    legSplitRow: 15,
    palette: {
      L: '#a855f7', // Lit left hood edge
      P: '#9333ea', // Purple hood & robe
      D: '#581c87', // Deep shadow robe (right side)
      V: '#090d16', // Face void
      E: '#e879f9', // Arcane glowing eyes
      G: '#fbbf24', // Gold rune trim
    },
    grid: [
      '......LLPP......',
      '.....LLPPPPD....',
      '....LLPPDDDDD...',
      '....LPVVVVVVPD..',
      '....LPVE..EVPD..',
      '....LPVVVVVVPD..',
      '.....PGGGGGGD...',
      '....LLPPPPPPDD..',
      '...LLPPDDDDDDPD.',
      '...LP.PGGGGP.DD.',
      '......PDDDDD....',
      '.....LPDDDDPD...',
      '.....LPGGGGPD...',
      '....LPPDDDDPPD..',
      '....PPPDDDDDDD..',
      '....GGG....GGD..',
      '...........GGG..',
      '................',
      '................',
      '................',
    ],
  },

  blood_golem: {
    autoOutline: true,
    legSplitRow: 15,
    palette: {
      W: '#e2e8f0', // Horn/spike specular
      S: '#94a3b8', // Steel spikes
      A: '#991b1b', // Lit blood-iron plate
      D: '#7f1d1d', // Shadowed blood armor
      R: '#ef4444', // Glowing blood veins
      B: '#450a0a', // Obsidian iron
      G: '#fecaca', // Molten core glow
    },
    grid: [
      '..WS..BBBB..SD..',
      '.WSS..BBBBBB.SD.',
      '.....BBRRRRBB...',
      '....BBGGGGGGGB..',
      '...BBBBBBBBBBBB.',
      '.WSAAAAADDDDDSS.',
      '.S.AARRRRRRDD.S.',
      '..AAARGGGGGRDDD.',
      '..AAARRRRRRRDDD.',
      '..AAAADDDDDDDDD.',
      '..BBBBBBBBBBBB..',
      '..BBAAD...DDBB..',
      '...BAAD...DDB...',
      '...BBBD...BBB...',
      '..BBBBD...BBBB..',
      '..SSSS....BBBBB.',
      '..........SSSSS.',
      '................',
      '................',
      '................',
    ],
  },

  training_dummy: {
    autoOutline: true,
    palette: {
      W: '#f59e0b', // Lit straw top-left
      S: '#b45309', // Shadow straw right
      P: '#78350f', // Wood post
      R: '#dc2626', // Target bullseye
      M: '#94a3b8', // Base iron
    },
    grid: [
      '......WWWW......',
      '.....WWWWSS.....',
      '.....WWSSSS.....',
      '......PPPP......',
      '.PPPPPPPPPPPPPP.',
      '..PPPWWWWSSPPP..',
      '....WWWRRSSS....',
      '....WWRRRRSS....',
      '....WWWRRSSS....',
      '....SSSSSSSS....',
      '......PPPP......',
      '......PPPP......',
      '......PPPP......',
      '....MMMMMMMM....',
      '...MMMMMMMMMM...',
      '................',
    ],
  },

  weapon_broadsword: {
    autoOutline: true,
    palette: {
      S: '#f8fafc', // Blade edge
      M: '#94a3b8', // Blade fuller
      G: '#fbbf24', // Crossguard & pommel
      H: '#78350f', // Hilt grip
    },
    grid: [
      '.............SS.',
      '............SSM.',
      '...........SSMM.',
      '..........SSMM..',
      '.........SSMM...',
      '........SSMM....',
      '.......SSMM.....',
      '......SSMM......',
      '...GG..SM.......',
      '....GGGG........',
      '....HHHHG.......',
      '...HHH..GG......',
      '..GG............',
      '..GG............',
      '................',
      '................',
    ],
  },

  weapon_gladius: {
    autoOutline: true,
    palette: {
      S: '#f1f5f9',
      M: '#38bdf8',
      G: '#f59e0b',
      H: '#991b1b',
    },
    grid: [
      '................',
      '............SS..',
      '...........SSM..',
      '..........SSMM..',
      '.........SSMM...',
      '........SSMM....',
      '.......SSMM.....',
      '....GG..SM......',
      '.....GGGG.......',
      '....HHHH........',
      '...GG...........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  'weapon_battle-axe': {
    autoOutline: true,
    palette: {
      S: '#f8fafc',
      M: '#94a3b8',
      R: '#dc2626',
      W: '#78350f',
      G: '#fbbf24',
    },
    grid: [
      '.........SSSS...',
      '........SSMMSS..',
      '.......SSMMMMSS.',
      '.......SMMRWWSS.',
      '........SMWWMS..',
      '.........WWMM...',
      '........WW.S....',
      '.......WW.......',
      '......WW........',
      '.....WW.........',
      '....WW..........',
      '...GG...........',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  weapon_daggers: {
    autoOutline: true,
    palette: {
      S: '#e2e8f0',
      E: '#34d399',
      G: '#475569',
      H: '#1e293b',
    },
    grid: [
      '................',
      '................',
      '...........SS...',
      '..........SSE...',
      '.........SSEE...',
      '........SSEE....',
      '.....GG..SE.....',
      '......GGGG......',
      '.....HHH........',
      '....GG..........',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  'weapon_wizard-staff': {
    autoOutline: true,
    palette: {
      P: '#c084fc',
      E: '#e879f9',
      G: '#fbbf24',
      W: '#78350f',
    },
    grid: [
      '..........PPP...',
      '.........PEEEP..',
      '.........PEEEP..',
      '.........GGGGG..',
      '........G..WW...',
      '..........WW....',
      '.........WW.....',
      '........WW......',
      '.......WW.......',
      '......WW........',
      '.....WW.........',
      '....WW..........',
      '...GG...........',
      '................',
      '................',
      '................',
    ],
  },

  weapon_crossbow: {
    autoOutline: true,
    palette: {
      S: '#cbd5e1',
      G: '#fbbf24',
      W: '#78350f',
      B: '#38bdf8',
    },
    grid: [
      '........SSS.....',
      '.......SS.......',
      '......SS...BB...',
      '......GG..BB....',
      '.....GWWWWB.SS..',
      '....WWWWWWGSS...',
      '...WWWW..SS.....',
      '..WW....SS......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  floor_1: {
    autoOutline: false,
    palette: {
      '.': '#151923', // Mid stone slab face
      H: '#1f2534', // 3/4 top bevel highlight (catches overhead light)
      A: '#181d29', // Subtle stone grain
      B: '#0c0e14', // Recessed mortar seam
      S: '#11141d', // Bottom slab lip shadow
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHBHHHHHHHH',
      '..AAA..B....AA..',
      '.......B........',
      '.......B..AAA...',
      '...AA..B........',
      '.......B........',
      'SSSSSSSBSSSSSSSS',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHB',
      '...AAA.....AA..B',
      '...............B',
      '......AAA......B',
      '..AA...........B',
      '...............B',
      'SSSSSSSSSSSSSSSB',
    ],
  },

  floor_2: {
    autoOutline: false,
    palette: {
      '.': '#141822',
      H: '#1d2331',
      A: '#171c27',
      B: '#0c0e14',
      S: '#10131b',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHBHHHHHHHH',
      '....AA.B..AAA...',
      '.......B........',
      '..AA...B....AA..',
      '.......B........',
      '.......B........',
      'SSSSSSSBSSSSSSSS',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHB',
      '..AA.......AAA.B',
      '...............B',
      '....AAA........B',
      '...........AA..B',
      '...............B',
      'SSSSSSSSSSSSSSSB',
    ],
  },

  floor_3: {
    autoOutline: false,
    palette: {
      '.': '#171b26', // Sanctuary polished slate
      H: '#23293a', // Top bevel highlight
      G: '#2d2926', // Subtle warm weathered inlay
      B: '#0c0e14', // Deep seam
      S: '#12151f', // Lower shadow
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHBHHHHHHHH',
      '.GGGGG.B.GGGGGG.',
      '.G...G.B.G....G.',
      '.G...G.B.G....G.',
      '.GGGGG.B.GGGGGG.',
      '.......B........',
      'SSSSSSSBSSSSSSSS',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHB',
      '..GGGGGGGGGGG..B',
      '..G.........G..B',
      '..G...HHH...G..B',
      '..G.........G..B',
      '..GGGGGGGGGGG..B',
      'SSSSSSSSSSSSSSSB',
    ],
  },

  floor_moss: {
    autoOutline: false,
    palette: {
      '.': '#151923',
      H: '#1f2534',
      B: '#0c0e14',
      S: '#11141d',
      M: '#14532d',
      L: '#166534',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'MMHHHHHBHHHHHHHH',
      'MLM....B....MM..',
      '.......B...MLLM.',
      '.......B....MM..',
      '.......B........',
      '.......B........',
      'SSSSSSSBSSSSSSSS',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHB',
      '....MM.........B',
      '...MLLM........B',
      '....MM.....MM..B',
      '..........MLM..B',
      '...............B',
      'SSSSSSSSSSSSSSSB',
    ],
  },

  wall_brick: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#1e2433',
      M: '#293145',
      H: '#384259',
    },
    grid: [
      'HHHHHHHHHHHHHHHH',
      'MMMMMMMMMMMMMMMB',
      'DDDDDDDDDDDDDDDB',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHBBHHHHHHH',
      'MMMMMMMBBMMMMMMM',
      'DDDDDDDBBDDDDDDD',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHH',
      'MMMMMMMMMMMMMMMB',
      'DDDDDDDDDDDDDDDB',
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHBBHHHHHHH',
      'MMMMMMMBBMMMMMMM',
      'DDDDDDDBBDDDDDDD',
      'BBBBBBBBBBBBBBBB',
    ],
  },

  wall_top: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      S: '#11141d',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHH',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'MMMMMMMMMMMMMMMM',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'SSSSSSSSSSSSSSSS',
      'BBBBBBBBBBBBBBBB',
    ],
  },

  wall_side_left: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHBBBBBBBBBBBBHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDMMHB',
      'BHMMMMMMMMMMMMHB',
    ],
  },

  wall_side_right: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHBBBBBBBBBBBBHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
      'BHMMMMMMMMMMMMHB',
    ],
  },

  wall_south: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      S: '#11141d',
      D: '#171b26',
      M: '#1e2433',
      H: '#384259',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHH',
      'MMMMMMMMMMMMMMMB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'DDDDDDDDDDDDDDDB',
      'BBBBBBBBBBBBBBBB',
      'MMMMMMMBMMMMMMMM',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'SSSSSSSSSSSSSSSS',
      'HHHHHHHHHHHHHHHH',
      'BBBBBBBBBBBBBBBB',
    ],
  },

  wall_corner_tl: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'BHHHHHHHHHHHHHHH',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDMMMMMMMMM',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDMMMM',
      'BHDDDDDDDDDDMMHB',
    ],
  },

  wall_corner_tr: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'MMMMMMMMMDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'MMMMDDDDDDDDDDHB',
      'BHMMDDDDDDDDDDHB',
    ],
  },

  wall_corner_bl: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BHDDDDDDDDDDMMHB',
      'BHDDDDDDDDDDHHHH',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDMMMMMMMMM',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHDDDDDDDDDDDDDD',
      'BHHHHHHHHHHHHHHH',
      'BBBBBBBBBBBBBBBB',
    ],
  },

  wall_corner_br: {
    autoOutline: false,
    palette: {
      B: '#090a0f',
      D: '#171b26',
      M: '#1e2433',
      H: '#2c344a',
    },
    grid: [
      'BHMMDDDDDDDDDDHB',
      'HHHHDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'MMMMMMMMMDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'DDDDDDDDDDDDDDHB',
      'HHHHHHHHHHHHHHHB',
      'BBBBBBBBBBBBBBBB',
    ],
  },

  /**
   * Seamless 16x32 Monolithic 3/4 Dungeon Pillar:
   * Continuous vertical fluted stone shaft from stepped plinth to 3/4 top capital slab,
   * with a single outer silhouette outline and zero mid-shaft black seams.
   */
  dungeon_pillar: {
    autoOutline: true,
    palette: {
      W: '#94a3b8', // Top-left capital specular edge
      T: '#64748b', // 3/4 Top stone slab plane
      L: '#475569', // Lit left fluted stone ridge
      M: '#334155', // Mid stone shaft
      D: '#1e293b', // Recessed flute shadow / right side
      S: '#0f172a', // Deep capital overhang & base shadow
      G: '#f59e0b', // Glowing carved ward rune
      Y: '#fef08a', // Bright rune core
    },
    grid: [
      '................',
      '...WWWWTTTTTT...',
      '..WTLLLLLLLLTD..',
      '..WTLLDDDDLLTD..',
      '..WTTTTTTTTTTD..',
      '..LMMMMMMMMMMD..',
      '...SSSSSSSSSS...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMGGGGGGDM...',
      '...LMGYGGYGDM...',
      '...LMGGGGGGDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '...LMDMDDDMDM...',
      '..WTTTTTTTTTTD..',
      '..LLLLMMMMDDDD..',
      '.LLMMMMMMMMDDDD.',
      '.DDDDDDDDDDDDDD.',
      '.SSSSSSSSSSSSSS.',
      '................',
      '................',
    ],
  },

  pillar_top: {
    autoOutline: true,
    palette: {
      T: '#64748b',
      L: '#475569',
      M: '#334155',
      D: '#1e293b',
      S: '#0f172a',
    },
    grid: [
      '................',
      '...TTTTTTTTTT...',
      '..TLLLLLLLLLLT..',
      '..TLLDDDDDDLLT..',
      '..TTTTTTTTTTTT..',
      '..MMMMMMMMMMMM..',
      '...SSSSSSSSSS...',
      '...MDDDDDDDDM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
    ],
  },

  pillar_base: {
    autoOutline: true,
    palette: {
      T: '#64748b',
      L: '#475569',
      M: '#334155',
      D: '#1e293b',
      S: '#0f172a',
      G: '#f59e0b',
      Y: '#fef08a',
    },
    grid: [
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MGGGGGGGGM...',
      '...MGYGGGGYGM...',
      '...MGGGGGGGGM...',
      '...SSSSSSSSSS...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '...MLMDDDDMLM...',
      '..TTTTTTTTTTTT..',
      '..LLLLLLLLLLLL..',
      '.LMMMMMMMMMMMML.',
      '.DDDDDDDDDDDDDD.',
      '.SSSSSSSSSSSSSS.',
      '................',
      '................',
    ],
  },

  torch: {
    autoOutline: true,
    palette: {
      Y: '#fef08a',
      O: '#f97316',
      R: '#dc2626',
      W: '#78350f',
      M: '#64748b',
    },
    grid: [
      '.......YY.......',
      '......YYYY......',
      '.....YYOOYY.....',
      '.....YOOOOR.....',
      '......ORRR......',
      '......MMMM......',
      '......WWWW......',
      '.......WW.......',
      '.......WW.......',
      '......MMMM......',
      '.......WW.......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  station_stash: {
    autoOutline: true,
    palette: {
      Y: '#fef08a',
      G: '#fbbf24',
      B: '#d97706',
      L: '#b45309',
      W: '#78350f',
      D: '#451a03',
      S: '#f8fafc',
      M: '#94a3b8',
    },
    grid: [
      '................',
      '...YYYYYYYYYY...',
      '..YGLLLLLLLLGY..',
      '.YGLLGLLLLGLLGY.',
      '.YLLLGLLLLGLLLY.',
      '.GGGGGGSSGGGGGG.',
      '.DDDDDDSSDDDDDD.',
      '.GWWWGSMMSGWWWG.',
      '.GWWWGMMMMGWWWG.',
      '.GWWWGDDDDGWWWG.',
      '.GDDDDGGGGDDDDG.',
      '.BBBBBBBBBBBBBB.',
      '..DDDDDDDDDDDD..',
      '................',
      '................',
      '................',
    ],
  },

  station_forge: {
    autoOutline: true,
    palette: {
      W: '#f8fafc',
      S: '#cbd5e1',
      M: '#64748b',
      D: '#334155',
      P: '#1e293b',
      O: '#f97316',
      Y: '#fde047',
    },
    grid: [
      '......Y...O.....',
      '...WWWWWWWWWW...',
      '.SWWWWWWWWWWWWS.',
      'SSSSMMMMMMMMSSSS',
      '..DDMMMMMMMMDD..',
      '....MMMMMMMM....',
      '.....DDDDDD.....',
      '....DDDDDDDD....',
      '...SSSSSSSSSS...',
      '..PPPPPPPPPPPP..',
      '..PPPPOOOOPPPP..',
      '..PPPOYYYYOPPP..',
      '..PPPPPPPPPPPP..',
      '................',
      '................',
      '................',
    ],
  },

  station_portal: {
    autoOutline: true,
    palette: {
      S: '#64748b',
      D: '#334155',
      P: '#a855f7',
      C: '#38bdf8',
      W: '#f8fafc',
    },
    grid: [
      '....SSSSSSSS....',
      '..SSDDDDDDDDSS..',
      '.SDDPPPPPPPPDDS.',
      '.SDPPPCCCCPPPDS.',
      'SDPPCCWWWWCCPPDS',
      'SDPCW.WWWW.WCPDS',
      'SDPCWWWWWWWWCPDS',
      'SDPCWWW..WWWCPDS',
      'SDPCWWWWWWWWCPDS',
      'SDPPCCWWWWCCPPDS',
      '.SDPPPCCCCPPPDS.',
      '.SDDPPPPPPPPDDS.',
      '..SSDDDDDDDDSS..',
      '..SSSSSSSSSSSS..',
      '................',
      '................',
    ],
  },

  extraction_portal: {
    autoOutline: true,
    palette: {
      G: '#fbbf24',
      E: '#10b981',
      C: '#34d399',
      W: '#ecfdf5',
    },
    grid: [
      '....GGGGGGGG....',
      '..GGEEEEEEEEGG..',
      '.GEEECCCCCCEEEG.',
      '.GEECWWWWWWCEEG.',
      'GEECWWCCCCWWCEEG',
      'GECWWCWWWWCWWCEG',
      'GECWWCWWWWCWWCEG',
      'GECWWCWWWWCWWCEG',
      'GEECWWCCCCWWCEEG',
      '.GEECWWWWWWCEEG.',
      '.GEEECCCCCCEEEG.',
      '..GGEEEEEEEEGG..',
      '....GGGGGGGG....',
      '................',
      '................',
      '................',
    ],
  },

  loot_chest: {
    autoOutline: true,
    palette: {
      G: '#fbbf24',
      W: '#b45309',
      D: '#78350f',
      S: '#f8fafc',
    },
    grid: [
      '................',
      '................',
      '................',
      '...GGGGGGGGGG...',
      '..GWWWWWWWWWWG..',
      '..GGGGSSGGGGGG..',
      '..GWWWWWWWWWWG..',
      '..GDDDDDDDDDDG..',
      '...GGGGGGGGGG...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  loot_gold: {
    autoOutline: true,
    palette: {
      Y: '#fef08a',
      G: '#fbbf24',
      D: '#d97706',
    },
    grid: [
      '................',
      '................',
      '................',
      '......GGGG......',
      '.....GYYYYG.....',
      '....GYGGGGYG....',
      '....GYGDDGYG....',
      '.....GDDDDG.....',
      '......GGGG......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  loot_essence: {
    autoOutline: true,
    palette: {
      W: '#ecfdf5',
      E: '#34d399',
      D: '#059669',
    },
    grid: [
      '................',
      '................',
      '.......EE.......',
      '......EWW.......',
      '.....EWWWEE.....',
      '....EEWWEEEE....',
      '....EEDDDDEE....',
      '.....EDDDDE.....',
      '......EDDE......',
      '.......EE.......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  projectile_cultist: {
    autoOutline: true,
    palette: {
      W: '#fae8ff',
      P: '#e879f9',
      D: '#9333ea',
    },
    grid: [
      '................',
      '................',
      '................',
      '......DDDD......',
      '....DDPPPPDD....',
      '...DPPPWWPPPD...',
      '...DPPWWWWPPD...',
      '...DPPPWWPPPD...',
      '....DDPPPPDD....',
      '......DDDD......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },

  projectile_player: {
    autoOutline: true,
    palette: {
      W: '#ffffff',
      C: '#38bdf8',
      B: '#0284c7',
    },
    grid: [
      '................',
      '................',
      '................',
      '......BBBB......',
      '....BBCCCCBB....',
      '...BCCCWWCCCB...',
      '...BCCWWWWCCB...',
      '...BCCCWWCCCB...',
      '....BBCCCCBB....',
      '......BBBB......',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
};

function shiftRowHoriz(row: string, dx: number): string {
  const w = row.length;
  if (dx === 0) return row;
  if (dx > 0) {
    return '.'.repeat(dx) + row.slice(0, w - dx);
  }
  const abs = -dx;
  return row.slice(abs) + '.'.repeat(abs);
}

/**
 * Generates a 4-frame idle or 4-frame run pixel grid for enemy archetypes
 * by shifting upper torso breathing vs lower leg stride before outline baking.
 */
function buildProceduralActorFrameGrid(
  baseGrid: string[],
  legSplitRow: number,
  mode: ActorAnimMode,
  frameIdx: number
): string[] {
  const h = baseGrid.length;
  const w = baseGrid[0]?.length || 16;
  const emptyRow = '.'.repeat(w);
  const f = ((frameIdx % 4) + 4) % 4;

  if (mode === 'idle') {
    // Frame 0 & 3: base pose; Frame 1 & 2: upper body settles 1px down while feet stay planted
    if (f === 0 || f === 3) return baseGrid;
    const out: string[] = [emptyRow];
    for (let y = 0; y < legSplitRow - 1; y++) {
      out.push(baseGrid[y]);
    }
    for (let y = legSplitRow; y < h; y++) {
      out.push(baseGrid[y]);
    }
    while (out.length < h) out.push(emptyRow);
    return out.slice(0, h);
  }

  // Run mode (4 frames):
  // Frame 0: left leg forward (-1px), right leg back (+1px)
  // Frame 1: passing bounce (whole character rises 1px)
  // Frame 2: right leg forward (+1px), left leg back (-1px)
  // Frame 3: passing gather
  if (f === 1) {
    const out = baseGrid.slice(1);
    out.push(emptyRow);
    return out;
  }
  if (f === 3) {
    return baseGrid;
  }

  const out = baseGrid.slice();
  const midX = Math.floor(w / 2);
  for (let y = legSplitRow; y < h; y++) {
    const row = baseGrid[y];
    const leftHalf = row.slice(0, midX);
    const rightHalf = row.slice(midX);
    if (f === 0) {
      out[y] = shiftRowHoriz(leftHalf, -1) + shiftRowHoriz(rightHalf, 1);
    } else {
      out[y] = shiftRowHoriz(leftHalf, 1) + shiftRowHoriz(rightHalf, -1);
    }
  }
  return out;
}

class SpriteFactoryManager {
  private cache: Map<string, Texture> = new Map();

  public async preloadExternalAssets(): Promise<void> {
    const entries = Object.entries(externalSpriteMap) as [SpriteKey, string][];
    for (const [key, url] of entries) {
      if (!url) continue;
      try {
        const tex = await Assets.load<Texture>(url);
        if (tex && tex.source) {
          tex.source.scaleMode = 'nearest';
          this.cache.set(key, tex);
        }
      } catch {
        // Fallback to procedural sprite
      }
    }
  }

  private bakeGridToTexture(
    grid: string[],
    palette: PaletteMap,
    autoOutline: boolean
  ): Texture {
    const height = grid.length;
    const width = grid[0]?.length || 16;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    const filled: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

    // Pass 1: Draw main pixels
    for (let y = 0; y < height; y++) {
      const row = grid[y] || '.'.repeat(width);
      for (let x = 0; x < width; x++) {
        const ch = row[x] || '.';
        const color = palette[ch];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
          if (ch !== '.') {
            filled[y][x] = true;
          }
        }
      }
    }

    // Pass 2: Automatic 1px dark pixel outline (#0b0c10) for characters, weapons, pillars, and props
    if (autoOutline) {
      ctx.fillStyle = '#0b0c10';
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (filled[y][x]) continue;
          let hasNeighbor = false;
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && filled[ny][nx]) {
              hasNeighbor = true;
              break;
            }
          }
          if (hasNeighbor) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    const texture = Texture.from(canvas);
    texture.source.scaleMode = 'nearest';
    return texture;
  }

  public getTexture(key: SpriteKey): Texture {
    const existing = this.cache.get(key);
    if (existing) return existing;

    const spec = SPRITE_GRIDS[key];
    const texture = this.bakeGridToTexture(spec.grid, spec.palette, spec.autoOutline);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Returns a frame-accurate pixel-art texture for an actor's 4-frame Idle or 4-frame Run cycle.
   */
  public getActorFrameTexture(
    key: SpriteKey,
    mode: ActorAnimMode,
    frameIdx: number
  ): Texture {
    // If an external PNG override was loaded for this key, return it
    if (externalSpriteMap[key] && this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const f = ((frameIdx % 4) + 4) % 4;
    const cacheKey = `${key}__${mode}__${f}`;
    const existing = this.cache.get(cacheKey);
    if (existing) return existing;

    const spec = SPRITE_GRIDS[key];
    let frameGrid: string[] = spec.grid;

    if (mode === 'idle' && spec.idleFrames && spec.idleFrames[f]) {
      frameGrid = spec.idleFrames[f];
    } else if (mode === 'run' && spec.runFrames && spec.runFrames[f]) {
      frameGrid = spec.runFrames[f];
    } else if (spec.legSplitRow !== undefined) {
      frameGrid = buildProceduralActorFrameGrid(spec.grid, spec.legSplitRow, mode, f);
    }

    const texture = this.bakeGridToTexture(frameGrid, spec.palette, spec.autoOutline);
    this.cache.set(cacheKey, texture);
    return texture;
  }
}

export const SpriteFactory = new SpriteFactoryManager();
