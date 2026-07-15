/**
 * Decorative Circle / Arc logos on wooden sign stands in the world map.
 * Chat / speech bubbles intentionally do NOT use these — they stay on USDC only.
 */
export type WorldLogoPlacement = {
  /** Which logo asset to show. */
  kind: 'circle' | 'circle-icon' | 'arc' | 'arc-icon';
  /** Pixel X on the map (tile * tileDim). */
  x: number;
  /** Pixel Y on the map. */
  y: number;
  /** Display width in pixels. */
  w: number;
  /** Display height in pixels. */
  h: number;
};

const TILE = 32;

/** Convert tile coords to pixel origin for a logo centered on that tile. */
function atTile(
  kind: WorldLogoPlacement['kind'],
  tx: number,
  ty: number,
  w: number,
  h: number,
): WorldLogoPlacement {
  return {
    kind,
    // Lift slightly so wooden stand posts sit on the board tile below.
    x: tx * TILE + (TILE - w) / 2,
    y: ty * TILE + (TILE - h) / 2 - 6,
    w,
    h,
  };
}

/**
 * Inland stands — none within ~2 tiles of water, shoreline, or rocks.
 * East side has no wood floors, so stands sit on clear lawn / dirt there.
 */
export const WORLD_LOGO_PLACEMENTS: WorldLogoPlacement[] = [
  // South wood strip (clear of water/rocks)
  atTile('circle', 11, 43, 96, 28),
  atTile('arc', 18, 43, 96, 34),
  atTile('circle-icon', 6, 42, 40, 40),
  atTile('arc-icon', 1, 44, 36, 36),
  atTile('circle', 14, 44, 96, 28),
  atTile('arc-icon', 9, 36, 36, 36),

  // East side lawns / dirt (x >= 42)
  atTile('circle', 42, 14, 96, 28),
  atTile('arc', 49, 15, 96, 34),
  atTile('circle-icon', 42, 21, 40, 40),
  atTile('arc-icon', 48, 25, 36, 36),
  atTile('circle', 42, 29, 96, 28),
  atTile('arc', 49, 32, 96, 34),
  atTile('circle-icon', 43, 11, 40, 40),
  atTile('arc-icon', 47, 12, 36, 36),
  atTile('circle', 49, 43, 96, 28),
  atTile('arc-icon', 42, 43, 36, 36),
];

export const WORLD_LOGO_URLS: Record<WorldLogoPlacement['kind'], string> = {
  circle: '/ai-town/assets/logos/circle.png',
  'circle-icon': '/ai-town/assets/logos/circle-icon.png',
  arc: '/ai-town/assets/logos/arc.png',
  'arc-icon': '/ai-town/assets/logos/arc-icon.png',
};
