/*
The first floor contains a thulium generator, a thulium-compatible microchip, a plutonium generator, and a strontium generator.
The second floor contains a plutonium-compatible microchip and a strontium-compatible microchip.
The third floor contains a promethium generator, a promethium-compatible microchip, a ruthenium generator, and a ruthenium-compatible microchip.
The fourth floor contains nothing relevant.
*/

// 1 = typeT MC thulium
// 2 = typeP MC plutonium
// 4 = typeS MC strontium
// 8 = typeM MC promethium
// 16 = typeR MC ruthenium
// 32 = typeE MC elerium
// 64 = typeD MC dilithium

// 256 = typeT G thulium
// 512 = typeP G plutonium
// 1024 = typeS G strontium
// 2048 = typeM G promethium
// 4096 = typeR G ruthenium
// 8192 = typeE G elerium
// 16384 = typeD G dilithium

// if we had 64-bit... we could have done this. but nooo, JS is 32-bit.
// const startfloors = (1 | 256 | 512 | 1024 | 32 | 64 | 8192 | 16384) | ((2 | 4) << 16) | ((8 | 16 | 2048 | 4096) << 32);
const startfloors = [
  (1 | 256 | 512 | 1024 | 32 | 64 | 8192 | 16384),
  (2 | 4),
  (8 | 16 | 2048 | 4096),
  0
];

const allMcs = 1 | 2 | 4 | 8 | 16 | 32 | 64;
const allGens = 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
const finalSolution = allMcs | allGens;

let runners = [{current: 0, floors: startfloors, prev: []}];

// using an array of hashmaps for floors. odd, but eh. itll work. first level is elevator, second level is f0, ...
let prevStates = [{}, {}, {}, {}];

function getfloor(floors, floor) {
  // const shift = floor * 16;
  // return (floors >> shift) & 0xFFFF;
  return floors[floor];
}

function makeFloors(prev, newItems, oldFloor, newFloor) {
  // const xorBy = (newItems << (floor * 16)) | (newItems << (oldFloor * 16));
  // return prev ^ xorBy;

  let newFloors = prev.slice();

  if ((newFloors[newFloor] & newItems) !== 0) {
    throw new Error('this shouldnt happen');
  }

  newFloors[oldFloor] = newFloors[oldFloor] ^ newItems;
  newFloors[newFloor] = newFloors[newFloor] | newItems;

  return newFloors;
}

function addPath(next, floor) {
  // to reduce the number of hashmaps we have, going to use the full 32-bit int space for the hash
  // we use 2 hashes, so it is a hash in a hash in an array
  const hash1 = next[0] | (next[1] << 8);
  const hash2 = next[2] | (next[3] << 8);

  let pv = prevStates[floor];
  let v = pv;

  v = pv[hash1];
  if (!v) {
    pv[hash1] = {};
    v = pv[hash1];
  }
  pv = v;

  if (!pv[hash2]) {
    pv[hash2] = true;
  }
}

function isDoneBefore(next, floor) {
  const hash1 = next[0] | (next[1] << 8);
  const hash2 = next[2] | (next[3] << 8);

  const v = prevStates[floor][hash1];
  if (!v) {
    return false;
  }

  return v[hash2] === true;
}

function hasMatchingGenerator(items, mc) {
  const gen = mc << 8;
  return (items & gen) !== 0;
}
function hasMatchingMicrochip(items, gen) {
  const mc = gen >> 8;
  return (items & mc) !== 0;
}

function hasAnyGenerator(items) {
  return (items & allGens) !== 0;
}

function wouldGroupBeOk(items) {
  // if one generator exists:
  // then every microchip must have a matching generator

  if (!hasAnyGenerator(items)) {
    return true;
  }

  if ((items & 1) !== 0 && !hasMatchingGenerator(items, 1)) {
    return false;
  }
  if ((items & 2) !== 0 && !hasMatchingGenerator(items, 2)) {
    return false;
  }
  if ((items & 4) !== 0 && !hasMatchingGenerator(items, 4)) {
    return false;
  }
  if ((items & 8) !== 0 && !hasMatchingGenerator(items, 8)) {
    return false;
  }
  if ((items & 16) !== 0 && !hasMatchingGenerator(items, 16)) {
    return false;
  }
  if ((items & 32) !== 0 && !hasMatchingGenerator(items, 32)) {
    return false;
  }
  if ((items & 64) !== 0 && !hasMatchingGenerator(items, 64)) {
    return false;
  }

  return true;
}

function wouldAllFloorsBeOk(floors) {
  return floors.every(wouldGroupBeOk);
}

function canTravelTogether(items) {
  return wouldGroupBeOk(items);
}

function run(nextrunners, runner) {
  const floor = runner.current;
  const floorItems = getfloor(runner.floors, floor);

  if (floor === 3 && floorItems === finalSolution) {
    console.log('part 1 done');
    process.exit(0);
    return;
  }

  const upFloor = floor + 1;
  const downFloor = floor - 1;

  const canGoUp = floor < 3;
  const canGoDown = floor > 0;

  let addedOne = false;

  for (let i = 1; i <= 16384; i = i << 1) {
    if ((floorItems & i) === 0) {
      continue;
    }

    // start at i, because i can travel alone
    // when j === i, it is basically i travelling alone. helps reduce code
    for (let j = i; j <= 16384; j = j << 1) {
      if ((floorItems & j) === 0) {
        continue;
      }

      const ij = i | j;

      if (canGoUp) {
        const nextFloors = makeFloors(runner.floors, ij, floor, upFloor);
        if (wouldAllFloorsBeOk(nextFloors) && !isDoneBefore(nextFloors, upFloor)) {
          addedOne = true;
          nextrunners.push({
            current: upFloor,
            floors: nextFloors
          });
          addPath(nextFloors, upFloor);
        }
      }
      if (canGoDown) {
        const nextFloors = makeFloors(runner.floors, ij, floor, downFloor);
        if (wouldAllFloorsBeOk(nextFloors) && !isDoneBefore(nextFloors, downFloor)) {
          addedOne = true;
          nextrunners.push({
            current: downFloor,
            floors: nextFloors
          });
          addPath(nextFloors, downFloor);
        }
      }
    }
  }

  return nextrunners;
}

let iterations = 0;

while (runners.length) {
  runners = runners.reduce(run, []);
  console.log('iter:', ++iterations, runners.length);
}

console.log('no solution');
