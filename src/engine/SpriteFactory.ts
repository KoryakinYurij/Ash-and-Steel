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

/**
 * Optional external PNG asset map (0x72 DungeonTileset II / Kenney Tiny Dungeon compatible).
 * If any key is populated with a valid PNG URL, SpriteFactory.preloadExternalAssets() will
 * load it via PixiJS v8 Assets.load() and seamlessly override the procedural 16x16 texture.
 */
export const externalSpriteMap: Partial<Record<SpriteKey, string>> = {};

type PaletteMap = Record<string, string>;

const SPRITE_GRIDS: Record<SpriteKey, { grid: string[]; palette: PaletteMap; autoOutline: boolean }> = {
  player_knight: {
    autoOutline: true,
    palette: {
      S: '#e2e8f0', // Bright steel highlight
      M: '#94a3b8', // Mid steel
      D: '#475569', // Dark steel
      V: '#0f172a', // Visor slit
      E: '#38bdf8', // Glowing knight eyes
      C: '#dc2626', // Crimson plume / cape
      R: '#991b1b', // Dark crimson cape
      B: '#78350f', // Leather belt
      G: '#fbbf24', // Gold buckle
    },
    grid: [
      '......CCCC......',
      '.....CCRRCC.....',
      '....SSSSSSSS....',
      '...SSMMMMMMSS...',
      '...SMVVEEVVMS...',
      '...SMVVVVVVMS...',
      '....SMDDDDMS....',
      '..RRCCCCCCCCRR..',
      '.RRRCMMMMMMCRRR.',
      '.RR.SMDDDDMS.RR.',
      '.R..BBBBBBBB..R.',
      '....BBGGGGBB....',
      '....DDDDDDDD....',
      '....DD....DD....',
      '...DDD....DDD...',
      '................',
    ],
  },

  skeleton_warrior: {
    autoOutline: true,
    palette: {
      B: '#f1f5f9', // Bone bright
      G: '#cbd5e1', // Bone shadow
      D: '#64748b', // Deep bone socket
      E: '#ef4444', // Red undead eye
      R: '#7c2d12', // Tattered rust armor
      M: '#475569', // Greaves
    },
    grid: [
      '................',
      '....BBBBBBBB....',
      '...BBBBBBBBBB...',
      '...BBDD..DDBB...',
      '...BBDE..EDBB...',
      '....BBBBBBBB....',
      '.....B.BB.B.....',
      '...GGGGGGGGGG...',
      '..GG.BBBBBB.GG..',
      '..G..G.BB.G..G..',
      '.....BBBBBB.....',
      '....RRRRRRRR....',
      '....GG....GG....',
      '....GG....GG....',
      '...MMM....MMM...',
      '................',
    ],
  },

  goblin_raider: {
    autoOutline: true,
    palette: {
      G: '#4ade80', // Goblin light green skin
      D: '#16a34a', // Goblin shadow skin
      Y: '#facc15', // Yellow eyes
      R: '#dc2626', // Red pupil/bandana
      L: '#92400e', // Leather vest
      B: '#451a03', // Dark leather boots
    },
    grid: [
      '................',
      '................',
      '....RRRRRRRR....',
      '.GG.GGGGGGGG.GG.',
      'GGG.GGGGGGGG.GGG',
      '.DD.GGYR..RYGG.D',
      '....GGGGGGGG....',
      '.....DDDDDD.....',
      '...LLLLLLLLLL...',
      '..GG.LLLLLL.GG..',
      '..D..BBBBBB..D..',
      '.....LLLLLL.....',
      '.....DD..DD.....',
      '....BB....BB....',
      '...BBB....BBB...',
      '................',
    ],
  },

  dark_cultist: {
    autoOutline: true,
    palette: {
      P: '#9333ea', // Purple hood
      D: '#581c87', // Deep shadow robe
      V: '#090d16', // Face void
      E: '#c084fc', // Arcane eyes
      G: '#fbbf24', // Gold rune trim
    },
    grid: [
      '......PPPP......',
      '....PPPPPPPP....',
      '...PPPDDDDPPP...',
      '...PPVVVVVVPP...',
      '...PPVE..EVPP...',
      '...PPVVVVVVPP...',
      '....PGGGGGGP....',
      '...PPPPPPPPPP...',
      '..PPPDDDDDDPPP..',
      '..PP.PGGGGP.PP..',
      '.....PDDDDP.....',
      '....PPDDDDPP....',
      '....PPGGGGPP....',
      '...DDDDDDDDDD...',
      '...GGG....GGG...',
      '................',
    ],
  },

  blood_golem: {
    autoOutline: true,
    palette: {
      A: '#7f1d1d', // Dark blood armor
      R: '#dc2626', // Glowing blood veins
      B: '#450a0a', // Obsidian iron
      S: '#94a3b8', // Steel spikes
      G: '#fca5a5', // Core glow
    },
    grid: [
      '..SS..BBBB..SS..',
      '.SS..BBBBBB..SS.',
      '....BBRRRRBB....',
      '...BBGGGGGGGB...',
      '..BBBBBBBBBBBB..',
      '.SSAAAAAAAAAASS.',
      '.S.AARRRRRRAA.S.',
      '..AAARGGGGGRAAA.',
      '..AAARRRRRRRAAA.',
      '..BBBBBBBBBBBB..',
      '..BBAA....AABB..',
      '...BAA....AAB...',
      '...BBB....BBB...',
      '..BBBB....BBBB..',
      '..SSSS....SSSS..',
      '................',
    ],
  },

  training_dummy: {
    autoOutline: true,
    palette: {
      W: '#d97706', // Hay / straw
      S: '#b45309', // Shadow straw
      P: '#78350f', // Wood post
      R: '#dc2626', // Target bullseye
      M: '#94a3b8', // Base iron
    },
    grid: [
      '......WWWW......',
      '.....WWWWWW.....',
      '.....WSSSSW.....',
      '......PPPP......',
      '.PPPPPPPPPPPPPP.',
      '..PPPWWWWWWPPP..',
      '....WWWRRWWW....',
      '....WWRRRRWW....',
      '....WWWRRWWW....',
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
      D: '#171b26',
      H: '#2c344a',
    },
    grid: [
      'BBBBBBBBBBBBBBBB',
      'HHHHHHHHHHHHHHHH',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'HHHHHHHHHHHHHHHH',
      'BBBBBBBBBBBBBBBB',
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
      Y: '#fef08a', // Top lid gold highlight (3/4 top plane)
      G: '#fbbf24', // Gold trim straps
      B: '#d97706', // Lower gold shadow
      L: '#b45309', // Top lid wood plane (lit from above)
      W: '#78350f', // Front face wood
      D: '#451a03', // Deep wood shadow / overhang
      S: '#f8fafc', // Iron lock plate highlight
      M: '#94a3b8', // Iron lock shadow
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
      W: '#f8fafc', // Anvil top flat working face (3/4 top plane)
      S: '#cbd5e1', // Anvil top bevel
      M: '#64748b', // Anvil front waist
      D: '#334155', // Anvil heavy base shadow
      P: '#1e293b', // Heavy timber/stone block under anvil
      O: '#f97316', // Glowing forge coal bed
      Y: '#fde047', // Hot forge spark
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
      S: '#64748b', // Stone arch
      D: '#334155', // Dark stone
      P: '#a855f7', // Portal outer swirl
      C: '#38bdf8', // Portal inner cyan
      W: '#f8fafc', // Core energy
    },
    grid: [
      '....SSSSSSSS....',
      '..SSDDDDDDDDSS..',
      '.SDDPPPPPPPPDDS.',
      '.SDPPPCCCCPPPdS.',
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
      G: '#fbbf24', // Golden rune frame
      E: '#10b981', // Emerald outer
      C: '#34d399', // Bright emerald
      W: '#ecfdf5', // Pure core
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

class SpriteFactoryManager {
  private cache: Map<SpriteKey, Texture> = new Map();

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
        // Fallback to procedural 16x16 sprite
      }
    }
  }

  public getTexture(key: SpriteKey): Texture {
    const existing = this.cache.get(key);
    if (existing) return existing;

    const spec = SPRITE_GRIDS[key];
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 16, 16);

    const filled: boolean[][] = Array.from({ length: 16 }, () => Array(16).fill(false));

    // Pass 1: Draw main pixels
    for (let y = 0; y < 16; y++) {
      const row = spec.grid[y] || '................';
      for (let x = 0; x < 16; x++) {
        const ch = row[x] || '.';
        const color = spec.palette[ch];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
          if (ch !== '.') {
            filled[y][x] = true;
          }
        }
      }
    }

    // Pass 2: Automatic 1px dark pixel outline (#0b0c10) for characters, weapons, and props
    if (spec.autoOutline) {
      ctx.fillStyle = '#0b0c10';
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (filled[y][x]) continue;
          let hasNeighbor = false;
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < 16 && ny >= 0 && ny < 16 && filled[ny][nx]) {
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
    this.cache.set(key, texture);
    return texture;
  }
}

export const SpriteFactory = new SpriteFactoryManager();
