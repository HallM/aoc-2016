function isValid(t) {
  let x1 = ((t + 1) + 0) % 7;
  let x2 = ((t + 2) + 0) % 13;
  let x3 = ((t + 3) + 2) % 3;
  let x4 = ((t + 4) + 2) % 5;
  let x5 = ((t + 5) + 0) % 17;
  let x6 = ((t + 6) + 7) % 19;
  let x7 = ((t + 7) + 0) % 11;

  return x1 === 0 && x2 === 0 && x3 === 0 && x4 === 0 && x5 === 0 && x6 === 0 && x7 === 0;
}

let it = 0;
while (!isValid(it)) {it++;}

console.log(it);
