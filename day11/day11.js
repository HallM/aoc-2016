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

// 128 = typeT G thulium
// 256 = typeP G plutonium
// 512 = typeS G strontium
// 1024 = typeM G promethium
// 2048 = typeR G ruthenium
// 4096 = typeE G elerium
// 8192 = typeD G dilithium

// if we had 64-bit... we could have done this. but nooo, JS is 32-bit.
// const startfloors = (1 | 256 | 512 | 1024 | 32 | 64 | 8192 | 16384) | ((2 | 4) << 16) | ((8 | 16 | 2048 | 4096) << 32);
const startfloors = [
  (1 | 128 | 256 | 512 | 32 | 64 | 4096 | 8192),
  (2 | 4),
  (8 | 16 | 1024 | 2048),
  0
];

const allMcs = 1 | 2 | 4 | 8 | 16 | 32 | 64;
const allGens = 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192;
const finalSolution = allMcs | allGens;

let runners = [{current: 0, floors: startfloors}];

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
  const hash1 = next[0] | (next[1] << 14);
  const hash2 = next[2] | (next[3] << 14);

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
  const hash1 = next[0] | (next[1] << 14);
  const hash2 = next[2] | (next[3] << 14);

  const v = prevStates[floor][hash1];
  if (!v) {
    return false;
  }

  return v[hash2] === true;
}

function wouldGroupBeOk(items) {
  // if one generator exists:
  // then every microchip must have a matching generator
  const gens = (items >> 7) & 0x7F;

  if (gens === 0) {
    return true;
  }

  const mcs = items & 0x7F;

  // when gen is 1, then we ignore that mc
  // when gen is 0, we need to know if the mc exists. basically AND mc with NOT gen
  return (mcs & ~(gens)) === 0;
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

  for (let i = 1; i <= 8192; i = i << 1) {
    if ((floorItems & i) === 0) {
      continue;
    }

    // start at i, because i can travel alone
    // when j === i, it is basically i travelling alone. helps reduce code
    for (let j = i; j <= 8192; j = j << 1) {
      if ((floorItems & j) === 0) {
        continue;
      }

      const ij = i | j;

      if (canGoUp) {
        const nextFloors = makeFloors(runner.floors, ij, floor, upFloor);
        if (wouldAllFloorsBeOk(nextFloors) && !isDoneBefore(nextFloors, upFloor)) {
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
