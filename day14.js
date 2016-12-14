const key = 'qzyelonm';
const crypto = require('crypto');

function genhashOnce(str) {
  return crypto.createHash('md5').update(str).digest("hex");
}

function genhash(i) {
  let str = [key, i].join('');
  for (let hashTimes = 0; hashTimes < 2017; hashTimes++) {
    str = genhashOnce(str);
  }
  return str;
}

function contains3(hash) {
  for (let i = 2; i < hash.length; i++) {
    if (hash[i] === hash[i-1] && hash[i] === hash[i-2]) {
      return hash[i];
    }
  }
  return null;
}

function contains5(hash) {
  for (let i = 4; i < hash.length; i++) {
    if (hash[i] === hash[i-1] && hash[i] === hash[i-2] && hash[i] === hash[i-3] && hash[i] === hash[i-4]) {
      return hash[i];
    }
  }
  return null;
}

let potentiallyValidHashes = {};
let knownGood = [];

let i = 1;
// 128 so we can fill out a few extras, doesnt take long
while (knownGood.length < 128) {
  const checkHash = genhash(i);
  const has3 = contains3(checkHash);
  const has5 = has3 !== null ? contains5(checkHash) : null;

  if (has5 !== null) {
    // validates everything in potentiallyValidHashes
    // knownGood = knownGood.concat(potentiallyValidHashes);
    if (!potentiallyValidHashes[has5]) {
      potentiallyValidHashes[has5] = [];
    } else if (potentiallyValidHashes[has5].length) {
      console.log(i, has5, potentiallyValidHashes[has5].length);
      knownGood = knownGood.concat(potentiallyValidHashes[has5]);
      potentiallyValidHashes[has5] = [];
    }

    // but also then adds itself to potentiallyValidHashes, cause it does have a 3 of a kind
    potentiallyValidHashes[has5].push({i: i, hash: checkHash});
  } else if (has3 !== null) {
    // console.log(i);
    if (!potentiallyValidHashes[has3]) {
      potentiallyValidHashes[has3] = [];
    }

    potentiallyValidHashes[has3].push({i: i, hash: checkHash});
  }
  // we must remove a hash if it is 1000 away from current
  removeOld();

  i++;
}

function removeOld() {
  for (let prop in potentiallyValidHashes) {
    let arr = potentiallyValidHashes[prop];
    arr = arr.filter(function(v) {
      return v.i > i-1000;
    });
    potentiallyValidHashes[prop] = arr;
  }
}

knownGood = knownGood.sort(function(a, b) {
  return a.i - b.i;
});

console.log(knownGood[63]);
