/**
 * Mapa de plataformas de RAWG
 * Fuente: https://api.rawg.io/docs/#operation/platforms_list
 */
export const RAWG_PLATFORMS: Record<number, string> = {
  // --- PC & Mobile ---
  4: 'PC',
  5: 'macOS',
  6: 'Linux',
  21: 'Android',
  22: 'iOS',
  23: 'Web',

  // --- PlayStation ---
  187: 'PlayStation 5',
  18: 'PlayStation 4',
  16: 'PlayStation 3',
  15: 'PlayStation 2',
  27: 'PlayStation 1',
  19: 'PS Vita',
  17: 'PSP',

  // --- Xbox ---
  186: 'Xbox Series X/S',
  1: 'Xbox One',
  14: 'Xbox 360',
  80: 'Xbox Retro',

  // --- Nintendo ---
  7: 'Nintendo Switch',
  8: 'Nintendo 3DS',
  9: 'Nintendo DS',
  13: 'Nintendo DSi',
  10: 'Wii U',
  11: 'Wii',
  105: 'GameCube',
  83: 'Nintendo 64',
  24: 'Game Boy Advance',
  43: 'Game Boy Color',
  26: 'Game Boy',
  79: 'SNES',
  49: 'NES',

  // --- SEGA ---
  167: 'Genesis',
  107: 'Sega Saturn',
  119: 'Sega Dreamcast',
  117: 'Sega 32X',
  74: 'Sega Master System',
  77: 'Game Gear',

  // --- Retro & Otros ---
  31: 'Atari 2600',
  28: 'Atari 7800',
  101: 'Atari 5200',
  46: 'Atari Lynx',
  50: 'Atari XEGS',
  166: 'Commodore / Amiga',
  111: '3DO',
  12: 'Neo Geo',
  129: 'Apple II'
};

/**
 * Convierte un array de IDs de plataforma a sus nombres
 */
export function getPlatformNames(platformIds: number[]): string[] {
  return platformIds
    .map(id => RAWG_PLATFORMS[id] || `Plataforma ${id}`)
    .filter(Boolean);
}

/**
 * Convierte un solo ID de plataforma a su nombre
 */
export function getPlatformName(platformId: number): string {
  return RAWG_PLATFORMS[platformId] || `Plataforma ${platformId}`;
}

/**
 * Agrupa plataformas por familia (PlayStation, Xbox, Nintendo, PC)
 */
export function groupPlatformsByFamily(platformIds: number[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    PlayStation: [],
    Xbox: [],
    Nintendo: [],
    PC: [],
    Mobile: [],
    Other: [],
  };

  platformIds.forEach(id => {
    const name = RAWG_PLATFORMS[id];
    if (!name) return;

    if (name.includes('PlayStation') || name.includes('PSP') || name.includes('Vita')) {
      groups.PlayStation!.push(name);
    } else if (name.includes('Xbox')) {
      groups.Xbox!.push(name);
    } else if (name.includes('Nintendo') || name.includes('Wii') || name.includes('Game Boy') || name.includes('NES') || name.includes('SNES')) {
      groups.Nintendo!.push(name);
    } else if (name === 'PC' || name === 'macOS' || name === 'Linux') {
      groups.PC!.push(name);
    } else if (name === 'Android' || name === 'iOS') {
      groups.Mobile!.push(name);
    } else {
      groups.Other!.push(name);
    }
  });

  // Filtrar grupos vacíos
  Object.keys(groups).forEach(key => {
    if (groups[key]!.length === 0) delete groups[key];
  });

  return groups;
}