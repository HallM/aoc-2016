let a = '00101000101111010';//'10000';
const targetLength = 35651584; // 20


function reverseChars(chars) {
  return chars.reverse();
}

function flipChars(chars) {
  for (let i = 0; i < chars.length; i++) {
    chars[i] = chars[i] === '0' ? '1' : '0';
  }
  return chars;
}

function enlargen(a) {
  return a + '0' + flipChars(reverseChars(a.split(''))).join('');
}

function checksum(str) {
  let sumParts = [];

  for (let i = 1; i < str.length; i += 2) {
    const isSame = str[i-1] === str[i];
    sumParts.push(isSame ? '1' : '0');
  }

  return sumParts.join('');
}

while (a.length < targetLength) {
  a = enlargen(a);
}

a = a.substr(0, targetLength);

let chk = checksum(a);

while ((chk.length % 2) === 0) {
  chk = checksum(chk);
}

console.log(chk);
