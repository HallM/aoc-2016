let runners = [{current: [1, 1], steps: 0}];

let visited = {};
visited[hashLocation(1, 1)] = true;

// const favNumber = 10;
// const dest = [7, 4];
const favNumber = 1362;
const dest = [31, 39];

function countBits(num) {
  let x = num;
  let count = 0;
  while (x !== 0) {
    if ((x & 1) === 1) {
      count++;
    }
    x = x >> 1;
  }
  return count;
}

function hashLocation(x, y) {
  return (x & 0xFF) | ((y & 0xFF) << 8);
}

function isWall(x, y) {
  const factor = x*x + 3*x + 2*x*y + y + y*y + favNumber;
  const bits = countBits(factor);
  return ((bits & 1) === 1);
}

function canGoTo(x, y) {
  return (x >= 0 && x < 0xFF) && (y >= 0 && y < 0xFF) && !visited[hashLocation(x, y)] && !isWall(x, y);
}

function makeRunnerWithSteps(steps) {
  return function(next) {
    const x = next[0];
    const y = next[1];

    if (!canGoTo(x, y)) {
      return null;
    }

    visited[hashLocation(x, y)] = true;
    return {current: next, steps: steps};
  };
}

function isNonNull(item) {
  return item != null;
}

function run(nextrunners, runner) {
  const x = runner.current[0];
  const y = runner.current[1];
  const steps = runner.steps;

  if (x === dest[0] && y == dest[1]) {
    console.log('Part 1 Solution:', steps);
    process.exit(0);
  }

  const makeRunner = makeRunnerWithSteps(steps + 1);

  const next = [
    [x, y-1],
    [x, y+1],
    [x-1, y],
    [x+1, y]
  ].map(makeRunner).filter(isNonNull);

  return nextrunners.concat(next);
}

let iterations = 0;

while (runners.length) {
  runners = runners.reduce(run, []);
  console.log(++iterations, ':', runners.length);

  if (iterations === 50) {
    console.log('Part 2 Solution: ', countInMap(visited));
  }
}

function countInMap(map) {
  // we know everything is "true" or non-existant anyway
  return Object.keys(map).length;
}
