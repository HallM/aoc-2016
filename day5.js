const key = 'ffykfhsq'; //ffykfhsq
const crypto = require('crypto');

var i = 1;

function isValid() {
  const str = [key, i].join('');
  const hash = crypto.createHash('md5').update(str).digest("hex");

  if (hash[0] === '0' && hash[1] === '0' && hash[2] === '0' && hash[3] === '0' && hash[4] === '0') {
    // if (hash[5] === '0') {
    //   return 2;
    // }

    const insertAt = parseInt(hash[5], 16);
    if (insertAt >= 8) {
      return null;
    }

    return hash;
  }

  return null;
}

var password1 = '--------'.split('');
var reth;

while (password1.indexOf('-') !== -1) {
  while ((reth = isValid()) == null) {
    i++;
  }
  i++;

  console.log(reth[5], reth[6]);
  const place = parseInt(reth[5]);
  if (password1[place] === '-') {
    password1[place] = reth[6];
  }
}

console.log(password1.join(''));
