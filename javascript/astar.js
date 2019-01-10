import {PriorityQueue} from './queue.js'

const unit_ring = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0]
];//, [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 4;


class Node {
  constructor(parent, position) {
    this.parent = parent;
    this.position = position;

    this.g = 0;
    this.h = 0;
    this.f = 0;
  }

  add(vector) {
    return [this.position[0] + vector[0], this.position[1] + vector[1]];
  }
}

function node_comparator(a, b) {
  return a.f < b.f;
}

export function find_path(start, end, map, r) {
  let node_start = new Node(null, start);
  let node_end = new Node(null, end);

  var branches = [node_start];
  var trunk = [];

  while (branches.length > 0) {

    r.log("CHECK 1")

    // Find tip
    var tip_index = 0;
    var tip = branches[tip_index];
    for (var i = branches.length - 1; i >= 0; i--) {
      if (branches[i].f < tip.f) {
        tip_index = i;
        tip = branches[tip_index];
      }
    }

    r.log("CHECK 2")

    // Organize tree
    branches.splice(tip_index, 1);
    trunk.push(tip);
    map[tip.position[0]][tip.position[1]] = 1;

    r.log("CHECK 3")

    // Yay! Reached destination
    if (tip.position == end) {
      var path = [];
      var current = tip;
      while (current != null) {
        path.push(current.position);
        current = current.parent;
      }
    }

    r.log("CHECK 4")

    for (var direction = unit_ring_length - 1; direction >= 0; direction--) {
      let child_position = tip.add(unit_ring[direction]);

      if (
        (child_position[0] > map[0].length - 1) ||
        (child_position[0] < 0) ||
        (child_position[1] > map.length - 1) ||
        (child_position[1] < 0)
      ) {
        continue
      }
      if (map[child_position[0]][child_position[1]] != 0) {continue}

      r.log("CHECK 5")

      var child = new Node(null, child_position);
      child.g = tip.g + 1;
      child.h = Math.pow(child_position[0] - end[0], 2) + Math.pow(child_position[1] - end[1]);
      child.f = child.g + child.h;

      r.log("CHECK 6")

      for (var j = branches.length - 1; j >= 0; j--) {
        if ((child_position = branches[j].position) && (child.g > branches[j].g)) {
          continue
        }
      }

      branches.push(child);
    }

  }
}
