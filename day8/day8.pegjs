{
  function makeInteger(arr) {
    return parseInt(arr.join(''), 10);
  }
}

start
  = block

eol
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

ws
  = [\t\v\f \u00A0\uFEFF]

integer
  = digits:[0-9]+ { return makeInteger(digits); }

block
  = command*

command
  = Rect
  / RotateRow
  / RotateCol

Rect
  = "rect" ws w:integer "x" h:integer eol
  {
    return {command: 0, w: w, h: h};
  }

RotateRow
  = "rotate row y=" y:integer ws "by" ws d:integer eol
  {
    return {command: 1, y: y, d: d};
  }

RotateCol
  = "rotate column x=" x:integer ws "by" ws d:integer eol
  {
    return {command: 2, x: x, d: d};
  }
