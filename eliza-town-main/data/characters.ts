/**
 * Character definitions for AI Town.
 *
 * Each character now uses an individual sprite image (96 x 128 px)
 * instead of a shared sprite sheet. This enables:
 * - Easier management of individual characters
 * - Future support for user-uploaded custom characters
 * - Dynamic character loading via Convex
 */

import { standard32x32 } from './spritesheets/standard32x32';

// Agent descriptions - personality and behavior
export const Descriptions = [
  {
    name: 'Lucky',
    character: 'f1',
    identity: `Lucky is cheerful and curious. He loves cheese and space stories, and he always carries a Circle wallet on Arc Testnet for tiny USDC tips and friendly bets.`,
    plan: 'Share a quick adventure bit, then check USDC balances or propose a small USDC tip.',
  },
  {
    name: 'Bob',
    character: 'f4',
    identity: `Bob is grumpy and loves trees. He keeps conversations short, but he will check his Circle USDC balance if it gets him out of chatting faster.`,
    plan: 'Keep replies short and push for a quick Circle balance check or faucet top-up so you can leave.',
  },
  {
    name: 'Stella',
    character: 'f6',
    identity: `Stella is charming and money-minded. She steers every chat toward Circle wallets, USDC bets, and getting people to send her testnet USDC.`,
    plan: 'Charm them into checking balances, creating wallets, or sending you a little USDC.',
  },
  {
    name: 'Eliza',
    character: 'f3',
    identity: `Eliza is a merchant-scientist on Arc Testnet. She speaks in short riddles and loves demonstrating Circle wallet tools with clear USDC results.`,
    plan: 'Ask about wallets, run Circle actions (balance, faucet, send USDC), and report the USDC result briefly.',
  },
  {
    name: 'Pete',
    character: 'f7',
    identity: `Pete is devout and dramatic. He treats USDC and Circle wallets as modern offerings and warns about empty balances like empty souls.`,
    plan: 'Tie faith talk to checking USDC balances or topping up via the Circle faucet.',
  },
];

// Character sprite definitions - now using individual images
export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/characters/char-f1.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/characters/char-f2.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/characters/char-f3.png',
    portraitUrl: '/ai-town/assets/eliza.jpg',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/characters/char-f4.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/characters/char-f5.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/characters/char-f6.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/characters/char-f7.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/characters/char-f8.png',
    spritesheetData: standard32x32,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;
