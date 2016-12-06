var posX = 0;
var posY = 0;
var dir = 0; // 0 = N, 1 = E, 2 = S, 3 = W

function move(dist) {
  switch(dir) {
    case 0:
      posY += dist;
      break;
    case 1:
      posX += dist;
      break;
    case 2:
      posY -= dist;
      break;
    case 3:
      posX -= dist;
      break;
  }
}

function left(dist) {
  dir--;
  if (dir < 0) {
    dir += 4;
  }
  move(dist);
}

function right(dist) {
  dir++;
  if (dir > 3) {
    dir -= 4;
  }
  move(dist);
}

var cmds = 'L5, R1, R3, L4, R3, R1, L3, L2, R3, L5, L1, L2, R5, L1, R5, R1, L4, R1, R3, L4, L1, R2, R5, R3, R1, R1, L1, R1, L1, L2, L1, R2, L5, L188, L4, R1, R4, L3, R47, R1, L1, R77, R5, L2, R1, L2, R4, L5, L1, R3, R187, L4, L3, L3, R2, L3, L5, L4, L4, R1, R5, L4, L3, L3, L3, L2, L5, R1, L2, R5, L3, L4, R4, L5, R3, R4, L2, L1, L4, R1, L3, R1, R3, L2, R1, R4, R5, L3, R5, R3, L3, R4, L2, L5, L1, L1, R3, R1, L4, R3, R3, L2, R5, R4, R1, R3, L4, R3, R3, L2, L4, L5, R1, L4, L5, R4, L2, L1, L3, L3, L5, R3, L4, L3, R5, R4, R2, L4, R2, R3, L3, R4, L1, L3, R2, R1, R5, L4, L5, L5, R4, L5, L2, L4, R4, R4, R1, L3, L2, L4, R3'.split(',');

var traveledLineSegments = [];

function lineIntersect(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    var s1_x, s1_y, s2_x, s2_y;

    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return {
        x: p0_x + (t * s1_x),
        y: p0_y + (t * s1_y)
      };
    }

    return null;
}

function findIntersection(lineSegment) {
  // only search based on the fact only NS+EW combo can intersect
  // since we alternate, one NS, the next EW, the next NS etc, then we can just skip 2
  // we also can skip the previous line, because it always "intersects", but not really the answer we want
  for (var i = traveledLineSegments.length - 3; i >= 0; i -= 2) {
    var line2 = traveledLineSegments[i];
    var intersect = lineIntersect(
      lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2,
      line2.x1, line2.y1, line2.x2, line2.y2
    );

    if (intersect !== null) {
      return intersect;
    }
  }

  return null;
}

// change to forEach for part 1, since we want to go to the end
// some() will let us stop processing once we have our answer
cmds.some(function(cmd) {
  var trimmed = cmd.trim();
  var goDir = trimmed[0];
  var goDist = parseInt(trimmed.substr(1), 10);

  var lastX = posX;
  var lastY = posY;

  if (goDir === 'L') {
    left(goDist);
  } else if (goDir === 'R') {
    right(goDist);
  }

  // the rest of this is part 2 only
  var lineSegment = {x1: lastX, y1: lastY, x2: posX, y2: posY};
  var intersect = findIntersection(lineSegment);

  if (intersect !== null) {
    console.log('intersect X:', intersect.x);
    console.log('intersect Y:', intersect.y);

    var distance = Math.abs(intersect.x) + Math.abs(intersect.y);
    console.log('distance:', distance);

    return true;
  }

  traveledLineSegments.push(lineSegment);
  return false;
});

// for part 1:
// console.log('posX:', posX);
// console.log('posY:', posY);

// var distance = Math.abs(posX) + Math.abs(posY);
// console.log('distance:', distance);
