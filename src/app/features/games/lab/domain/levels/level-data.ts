import { Element } from '../models/element.model';
import { LevelDef } from '../models/level.model';

let nid = 1;
const next = () => nid++;

const peg = (x: number, y: number, r = 7): Element => ({ type: 'peg', id: next(), x, y, r });
const bumper = (x: number, y: number, r = 14): Element => ({ type: 'bumper', id: next(), x, y, r });
const wall = (cx: number, cy: number, w: number, h: number, angle = 0): Element =>
  ({ type: 'wall', id: next(), cx, cy, w, h, angle });
const goal = (x: number, y: number, r = 22): Element => ({ type: 'goal', id: next(), x, y, r });
const portal = (x: number, y: number, pairId: number, color: number, angle = 0, r = 16): Element =>
  ({ type: 'portal', id: next(), x, y, r, pairId, angle, color });
const well = (x: number, y: number, r: number, strength: number, mode: 'attract' | 'repel'): Element =>
  ({ type: 'gravityWell', id: next(), x, y, r, strength, mode });
const spinner = (cx: number, cy: number, w: number, h: number, angularVel: number): Element =>
  ({ type: 'spinner', id: next(), cx, cy, w, h, angularVel });

// Field assumed 480×640. All coords are in field-local space.

const L1: LevelDef = {
  id: 1, name: 'Free Fall', intro: 'Drop. Land. Trust gravity.',
  spawner: { x: 240, y: 50 }, maxBalls: 3, goalCount: 1,
  elements: [
    goal(240, 560, 30)
  ]
};

const L2: LevelDef = {
  id: 2, name: 'Funnel', intro: 'Walls guide the way.',
  spawner: { x: 240, y: 50 }, maxBalls: 3, goalCount: 1,
  elements: [
    wall(120, 300, 200, 8, 0.45),
    wall(360, 300, 200, 8, -0.45),
    wall(190, 460, 8, 100, 0),
    wall(290, 460, 8, 100, 0),
    goal(240, 580, 26)
  ]
};

const L3: LevelDef = {
  id: 3, name: 'Peg Forest', intro: 'Bouncy little posts.',
  spawner: { x: 240, y: 40 }, maxBalls: 5, goalCount: 2,
  elements: [
    peg(120, 180), peg(200, 180), peg(280, 180), peg(360, 180),
    peg(160, 260), peg(240, 260), peg(320, 260),
    peg(120, 340), peg(200, 340), peg(280, 340), peg(360, 340),
    peg(160, 420), peg(240, 420), peg(320, 420),
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    goal(150, 580, 28),
    goal(330, 580, 28)
  ]
};

const L4: LevelDef = {
  id: 4, name: 'Bumper Boost', intro: 'Energy gained, not lost.',
  spawner: { x: 240, y: 50 }, maxBalls: 4, goalCount: 1,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    bumper(160, 380, 18),
    bumper(320, 380, 18),
    bumper(240, 480, 18),
    wall(140, 240, 130, 8, 0.4),
    wall(340, 240, 130, 8, -0.4),
    goal(80, 560, 26),
    goal(400, 560, 26)
  ]
};

const L5: LevelDef = {
  id: 5, name: 'Slalom', intro: 'Zig. Then zag.',
  spawner: { x: 240, y: 40 }, maxBalls: 5, goalCount: 2,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    wall(120, 180, 200, 10, 0.25),
    wall(360, 280, 200, 10, -0.25),
    wall(120, 380, 200, 10, 0.25),
    wall(360, 480, 200, 10, -0.25),
    goal(180, 580, 26),
    goal(300, 580, 26)
  ]
};

const L6: LevelDef = {
  id: 6, name: 'The Cradle', intro: 'A nest of bounces.',
  spawner: { x: 240, y: 50 }, maxBalls: 5, goalCount: 2,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    peg(140, 200), peg(240, 180), peg(340, 200),
    peg(180, 280), peg(300, 280),
    bumper(120, 380, 18),
    bumper(360, 380, 18),
    peg(180, 480), peg(240, 460), peg(300, 480),
    wall(160, 540, 100, 8, 0.45),
    wall(320, 540, 100, 8, -0.45),
    goal(240, 590, 30)
  ]
};

const L7: LevelDef = {
  id: 7, name: 'Portal', intro: 'One in. One out.',
  spawner: { x: 240, y: 50 }, maxBalls: 4, goalCount: 1,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    // Full barrier — only way past it is the portal pair
    wall(240, 290, 380, 10, 0),
    // Portal A above the barrier, ball drops directly onto it
    portal(240, 200, 7002, 0x22d3ee, 0, 24),
    // Portal B below the barrier, ball exits and falls toward goal
    portal(240, 480, 7001, 0xec4899, 0, 24),
    goal(240, 590, 30)
  ]
};
// Cross-link the portals: each one's pairId must point at the other's id.
// Hack: re-emit with explicit ids by replacing the placeholders.
function patchPortals(level: LevelDef): LevelDef {
  const elems = level.elements.slice();
  const portals = elems.filter(e => e.type === 'portal');
  if (portals.length === 2) {
    const [a, b] = portals;
    if (a.type === 'portal' && b.type === 'portal') {
      const aFix = { ...a, pairId: b.id };
      const bFix = { ...b, pairId: a.id };
      return { ...level, elements: elems.map(e => (e === a ? aFix : e === b ? bFix : e)) };
    }
  }
  return level;
}

const L8: LevelDef = {
  id: 8, name: 'Twin Chambers', intro: 'Two rooms, one path.',
  spawner: { x: 120, y: 50 }, maxBalls: 5, goalCount: 2,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    wall(240, 320, 10, 540, 0),     // central divider
    peg(120, 200), peg(140, 280), peg(100, 360),
    peg(360, 360), peg(340, 280), peg(380, 200),
    portal(120, 460, 2002, 0x22d3ee, 0, 18),
    portal(360, 460, 2001, 0xec4899, 0, 18),
    goal(120, 590, 26),
    goal(360, 590, 26)
  ]
};

const L9: LevelDef = {
  id: 9, name: 'Gravity Well', intro: 'Pull toward the prize.',
  spawner: { x: 240, y: 50 }, maxBalls: 4, goalCount: 1,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    wall(140, 240, 8, 200, 0),
    wall(340, 240, 8, 200, 0),
    well(240, 420, 200, 12, 'attract'),
    peg(180, 380), peg(300, 380),
    peg(200, 460), peg(280, 460),
    goal(240, 560, 32)
  ]
};

const L10: LevelDef = {
  id: 10, name: 'Anti-Gravity', intro: 'Push away. Land between.',
  spawner: { x: 240, y: 50 }, maxBalls: 5, goalCount: 2,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    well(240, 380, 140, 14, 'repel'),
    peg(140, 200), peg(340, 200),
    peg(120, 360), peg(360, 360),
    peg(140, 480), peg(340, 480),
    wall(80, 560, 100, 8, -0.35),
    wall(400, 560, 100, 8, 0.35),
    goal(110, 590, 24),
    goal(370, 590, 24)
  ]
};

const L11: LevelDef = {
  id: 11, name: 'Spinner Gauntlet', intro: 'Time the swing.',
  spawner: { x: 240, y: 50 }, maxBalls: 5, goalCount: 2,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    spinner(140, 200, 100, 10, 0.0024),
    spinner(340, 320, 100, 10, -0.0028),
    spinner(140, 440, 100, 10, 0.0026),
    peg(240, 200), peg(240, 320), peg(240, 440),
    goal(180, 590, 26),
    goal(300, 590, 26)
  ]
};

const L12: LevelDef = {
  id: 12, name: 'The Final Lab', intro: 'Everything. Everywhere.',
  spawner: { x: 240, y: 40 }, maxBalls: 6, goalCount: 3,
  elements: [
    wall(40, 320, 8, 540, 0),
    wall(440, 320, 8, 540, 0),
    peg(120, 130), peg(360, 130),
    bumper(240, 160, 16),
    spinner(140, 280, 90, 10, 0.0022),
    spinner(340, 280, 90, 10, -0.0026),
    portal(110, 360, 9002, 0x22d3ee, 0, 16),
    portal(370, 460, 9001, 0xec4899, 0, 16),
    well(240, 420, 130, 10, 'attract'),
    peg(180, 460), peg(300, 460),
    bumper(240, 520, 16),
    wall(160, 560, 90, 8, 0.35),
    wall(320, 560, 90, 8, -0.35),
    goal(110, 590, 22),
    goal(240, 600, 26),
    goal(370, 590, 22)
  ]
};

export const LEVELS: readonly LevelDef[] = [
  L1, L2, L3, L4, L5, L6,
  patchPortals(L7),
  patchPortals(L8),
  L9, L10, L11,
  patchPortals(L12)
];
