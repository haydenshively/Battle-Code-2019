import {CommonSource} from './common.js';
import {PriorityQueue} from './queue.js'

const unit_ring = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 8;

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

  equals(vector) {
    return ((this.position[0] == vector[0]) && (this.position[1] == vector[1]));
  }
}

function node_comparator(a, b) {return a.f < b.f;}

function makeArray(w, h, val) {
  var arr = [];
  for (var i = 0; i < h; i++) {
    arr[i] = [];
    for (var j = 0; j < w; j++) {
        arr[i][j] = val;
    }
  }
  return arr;
}

export function find_path(start, end, map) {
  var my_map = makeArray(map[0].length, map.length, true);

  let node_start = new Node(null, start);
  let node_end = new Node(null, end);

  var branches = new PriorityQueue(node_comparator);
  // var trunk = new PriorityQueue(node_comparator);

  branches.push(node_start)

  while (!branches.isEmpty()) {

    let tip = branches.pop();
    // trunk.push(tip);
    // map[tip.position[1]][tip.position[0]] = false;
    my_map[tip.position[1]][tip.position[0]] = false;

    // Yay! Reached destination
    if (tip.equals(end)) {
      var path = [];
      var current = tip;
      while (current != null) {
        path.push(current.position);
        current = current.parent;
      }
      return path.reverse();
    }

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
      if (!map[child_position[1]][child_position[0]]) {continue}
      if (!my_map[child_position[1]][child_position[0]]) {continue}

      var child = new Node(tip, child_position);
      child.g = tip.g + Math.abs(unit_ring[direction][0]) + Math.abs(unit_ring[direction][1]);
      child.h = Math.max(Math.abs(child_position[0] - end[0]), Math.abs(child_position[1] - end[1]));
      child.f = child.g + child.h;

      // for (var j = branches.length - 1; j >= 0; j--) {
      //   if ((child_position = branches[j].position) && (child.g > branches[j].g)) {
      //     continue
      //   }
      // }

      branches.push(child);
    }
  }
  return false;
}
