import { PixiComponent, applyDefaultProps } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { AnimatedSprite, WorldMap } from '../../convex/aiTown/worldMap';
import * as campfire from '../../data/animations/campfire.json';
import * as gentlesparkle from '../../data/animations/gentlesparkle.json';
import * as gentlewaterfall from '../../data/animations/gentlewaterfall.json';
import * as gentlesplash from '../../data/animations/gentlesplash.json';
import * as windmill from '../../data/animations/windmill.json';
import { WORLD_LOGO_PLACEMENTS, WORLD_LOGO_URLS } from '../../data/worldLogos';

const animations = {
  'campfire.json': { spritesheet: campfire, url: '/ai-town/assets/spritesheets/campfire.png' },
  'gentlesparkle.json': {
    spritesheet: gentlesparkle,
    url: '/ai-town/assets/spritesheets/gentlesparkle32.png',
  },
  'gentlewaterfall.json': {
    spritesheet: gentlewaterfall,
    url: '/ai-town/assets/spritesheets/gentlewaterfall32.png',
  },
  'windmill.json': { spritesheet: windmill, url: '/ai-town/assets/spritesheets/windmill.png' },
  'gentlesplash.json': {
    spritesheet: gentlesplash,
    url: '/ai-town/assets/spritesheets/gentlewaterfall32.png',
  },
};

function addWorldLogos(container: PIXI.Container) {
  const textureCache = new Map<string, PIXI.Texture>();

  for (const placement of WORLD_LOGO_PLACEMENTS) {
    const url = WORLD_LOGO_URLS[placement.kind];
    let texture = textureCache.get(url);
    if (!texture) {
      texture = PIXI.Texture.from(url);
      texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
      textureCache.set(url, texture);
    }

    const padW = placement.w + 14;
    const padH = placement.h + 12;
    const px = placement.x - 7;
    const py = placement.y - 6;
    const stand = new PIXI.Graphics();

    // Two wooden posts (stands) under the board
    const postW = Math.max(5, Math.floor(padW * 0.08));
    const postH = Math.max(14, Math.floor(placement.h * 0.55) + 10);
    const postY = py + padH - 2;
    const leftPostX = px + Math.floor(padW * 0.18);
    const rightPostX = px + padW - Math.floor(padW * 0.18) - postW;

    for (const postX of [leftPostX, rightPostX]) {
      stand.beginFill(0x3d2412, 0.95);
      stand.drawRoundedRect(postX - 1, postY, postW + 2, postH + 2, 2);
      stand.endFill();
      stand.beginFill(0x6b4423, 0.98);
      stand.drawRoundedRect(postX, postY, postW, postH, 2);
      stand.endFill();
      // post highlight edge
      stand.beginFill(0x9a6a3a, 0.55);
      stand.drawRect(postX + 1, postY + 1, Math.max(1, postW - 3), postH - 2);
      stand.endFill();
    }

    // Ground footers under each post
    const footW = postW + 8;
    const footH = 5;
    for (const postX of [leftPostX, rightPostX]) {
      const fx = postX + postW / 2 - footW / 2;
      const fy = postY + postH - 1;
      stand.beginFill(0x2a180c, 0.85);
      stand.drawRoundedRect(fx, fy, footW, footH, 2);
      stand.endFill();
      stand.beginFill(0x5a3a1c, 0.9);
      stand.drawRoundedRect(fx + 1, fy + 1, footW - 2, footH - 2, 1);
      stand.endFill();
    }

    // Wood signboard / plaque
    stand.beginFill(0x4a2f14, 0.95);
    stand.drawRoundedRect(px - 1, py - 1, padW + 2, padH + 2, 5);
    stand.endFill();
    stand.beginFill(0x8b5a2b, 0.98);
    stand.drawRoundedRect(px, py, padW, padH, 4);
    stand.endFill();
    stand.beginFill(0xa8723a, 0.5);
    stand.drawRoundedRect(px + 2, py + 2, padW - 4, Math.max(4, padH * 0.28), 3);
    stand.endFill();
    // Plank lines on the board
    stand.lineStyle(1, 0x3d2412, 0.4);
    const plankStep = Math.max(6, Math.floor(padH / 3));
    for (let y = py + plankStep; y < py + padH - 2; y += plankStep) {
      stand.moveTo(px + 4, y);
      stand.lineTo(px + padW - 4, y);
    }

    container.addChild(stand);

    const sprite = new PIXI.Sprite(texture);
    sprite.x = placement.x;
    sprite.y = placement.y;
    sprite.width = placement.w;
    sprite.height = placement.h;
    sprite.alpha = 0.98;
    container.addChild(sprite);
  }
}

export const PixiStaticMap = PixiComponent('StaticMap', {
  create: (props: { map: WorldMap; [k: string]: any }) => {
    const map = props.map;
    const numxtiles = Math.floor(map.tileSetDimX / map.tileDim);
    const numytiles = Math.floor(map.tileSetDimY / map.tileDim);
    const bt = PIXI.BaseTexture.from(map.tileSetUrl, {
      scaleMode: PIXI.SCALE_MODES.NEAREST,
    });

    const tiles = [];
    for (let x = 0; x < numxtiles; x++) {
      for (let y = 0; y < numytiles; y++) {
        tiles[x + y * numxtiles] = new PIXI.Texture(
          bt,
          new PIXI.Rectangle(x * map.tileDim, y * map.tileDim, map.tileDim, map.tileDim),
        );
      }
    }
    const screenxtiles = map.bgTiles[0].length;
    const screenytiles = map.bgTiles[0][0].length;

    const container = new PIXI.Container();
    const allLayers = [...map.bgTiles, ...map.objectTiles];

    // blit bg & object layers of map onto canvas
    for (let i = 0; i < screenxtiles * screenytiles; i++) {
      const x = i % screenxtiles;
      const y = Math.floor(i / screenxtiles);
      const xPx = x * map.tileDim;
      const yPx = y * map.tileDim;

      // Add all layers of backgrounds.
      for (const layer of allLayers) {
        const tileIndex = layer[x][y];
        // Some layers may not have tiles at this location.
        if (tileIndex === -1) continue;
        const ctile = new PIXI.Sprite(tiles[tileIndex]);
        ctile.x = xPx;
        ctile.y = yPx;
        container.addChild(ctile);
      }
    }

    // TODO: Add layers.
    const spritesBySheet = new Map<string, AnimatedSprite[]>();
    for (const sprite of map.animatedSprites) {
      const sheet = sprite.sheet;
      if (!spritesBySheet.has(sheet)) {
        spritesBySheet.set(sheet, []);
      }
      spritesBySheet.get(sheet)!.push(sprite);
    }
    for (const [sheet, sprites] of spritesBySheet.entries()) {
      const animation = (animations as any)[sheet];
      if (!animation) {
        console.error('Could not find animation', sheet);
        continue;
      }
      const { spritesheet, url } = animation;
      const texture = PIXI.BaseTexture.from(url, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
      });
      const spriteSheet = new PIXI.Spritesheet(texture, spritesheet);
      spriteSheet.parse().then(() => {
        for (const sprite of sprites) {
          const pixiAnimation = spriteSheet.animations[sprite.animation];
          if (!pixiAnimation) {
            console.error('Failed to load animation', sprite);
            continue;
          }
          const pixiSprite = new PIXI.AnimatedSprite(pixiAnimation);
          pixiSprite.animationSpeed = 0.1;
          pixiSprite.autoUpdate = true;
          pixiSprite.x = sprite.x;
          pixiSprite.y = sprite.y;
          pixiSprite.width = sprite.w;
          pixiSprite.height = sprite.h;
          container.addChild(pixiSprite);
          pixiSprite.play();
        }
      });
    }

    // Circle / Arc logos on wooden sign stands — chat/dialogs keep using USDC only.
    addWorldLogos(container);

    container.x = 0;
    container.y = 0;

    // Set the hit area manually to ensure `pointerdown` events are delivered to this container.
    container.interactive = true;
    container.hitArea = new PIXI.Rectangle(
      0,
      0,
      screenxtiles * map.tileDim,
      screenytiles * map.tileDim,
    );

    return container;
  },

  applyProps: (instance, oldProps, newProps) => {
    applyDefaultProps(instance, oldProps, newProps);
  },
});
