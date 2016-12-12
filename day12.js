let reg = {a: 0, b: 0, c: 1, d: 0};
let pc = 0;

// cpy x y copies x (either an integer or the value of a register) into register y.
// inc x increases the value of register x by one.
// dec x decreases the value of register x by one.
// jnz x y jumps to an instruction y away (positive means forward; negative means backward), but only if x is not zero.
// The jnz instruction moves relative to itself: an offset of -1 would continue at the previous instruction, while an offset of 2 would skip over the next instruction.

function isReg(v) {
  return v >= 'a' && v <= 'd';
}

const inst = `cpy 1 a
cpy 1 b
cpy 26 d
jnz c 2
jnz 1 5
cpy 7 c
inc d
dec c
jnz c -2
cpy a c
inc a
dec b
jnz b -2
cpy c b
dec d
jnz d -6
cpy 18 c
cpy 11 d
inc a
dec d
jnz d -2
dec c
jnz c -5`.split('\n').map(function(str) {
  const parts = str.split(' ');

  if (parts[0] === 'cpy') {
    let cmd = {fn: cpy, dst: parts[2]};
    const v = parts[1];
    if (isReg(v)) {
      cmd.src = v;
    } else {
      cmd.v = parseInt(v);
    }
    return cmd;
  } else if (parts[0] === 'inc') {
    return {fn: inc, r: parts[1]};
  } else if (parts[0] === 'dec') {
    return {fn: dec, r: parts[1]};
  } else if (parts[0] === 'jnz') {
    let cmd = {fn: jnz, offset: parseInt(parts[2])};
    const v = parts[1];
    if (isReg(v)) {
      cmd.src = v;
    } else {
      cmd.v = parseInt(v);
    }
    return cmd;
  }
});

function cpy(cmd) {
  const v = cmd.v || reg[cmd.src];
  reg[cmd.dst] = v;
  pc++;
}

function inc(cmd) {
  reg[cmd.r]++;
  pc++;
}
function dec(cmd) {
  reg[cmd.r]--;
  pc++;
}

function jnz(cmd) {
  const v = cmd.v || reg[cmd.src];

  if (v !== 0) {
    pc += cmd.offset;
  } else {
    pc++;
  }
}

while (pc < inst.length) {
  const fn = inst[pc].fn;
  fn(inst[pc]);
}

console.log(reg);
