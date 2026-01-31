/**
 * Mapa de plataformas de RAWG
 * Fuente: https://api.rawg.io/docs/#operation/platforms_list
 */
export const RAWG_PLATFORMS: Record<number, string> = {
  1: 'Xbox One',
  2: 'PlayStation 4',
  3: 'Xbox 360',
  4: 'PC',
  5: 'macOS',
  6: 'Linux',
  7: 'Nintendo Switch',
  8: 'Nintendo 3DS',
  9: 'Nintendo DS',
  10: 'Wii U',
  11: 'Wii',
  12: 'GameCube',
  13: 'Nintendo 64',
  14: 'PlayStation 5',
  15: 'PlayStation 3',
  16: 'PlayStation 2',
  17: 'PlayStation',
  18: 'PlayStation Vita',
  19: 'PSP',
  21: 'Android',
  22: 'iOS',
  23: 'Web',
  24: 'Xbox Series X/S',
  25: 'Game Boy Advance',
  26: 'Game Boy Color',
  27: 'Game Boy',
  28: 'SNES',
  29: 'NES',
  30: 'Sega Genesis',
  31: 'Dreamcast',
  32: 'Sega Saturn',
  33: 'Sega CD',
  34: 'Sega 32X',
  35: 'Sega Master System',
  36: 'Atari',
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