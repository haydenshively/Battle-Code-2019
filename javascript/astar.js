import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {PriorityQueue} from './queue.js'

const ring = [
  [1, 0], [0, 1], [-1, 0], [0, -1],// r^2 = 1, available to all units
  [1, 1], [-1, 1], [-1, -1], [1, -1],// r^2 = 2, available to all units
  [2, 0], [0, 2], [-2, 0], [0, -2],// r^2 = 4, available to all units
  [2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1],// r^2 = 5, available to crusaders
  [2, 2], [-2, 2], [-2, -2], [2, -2],// r^2 = 8
  [3, 0], [0, 3], [-3, 0], [0, -3]// r^2 = 9
];
const ring_length = 12;
const ring_length_crusader = 28;

class Node {
  constructor(parent, position) {
    this.parent = parent;
    this.position = position;

    this.g = 0;
    this.h = 0;
    this.f = 0;
  }

  add(vector) {return [this.position[0] + vector[0], this.position[1] + vector[1]];}
  equals(vector) {return ((this.position[0] == vector[0]) && (this.position[1] == vector[1]));}
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

export function find_path(start, end, map, robot_type) {
  var my_map = makeArray(map[0].length, map.length, true);

  let node_start = new Node(null, start);
  let node_end = new Node(null, end);

  var branches = new PriorityQueue(node_comparator);
  branches.push(node_start)

  while (!branches.isEmpty()) {

    let tip = branches.pop();

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

    let last_index = (robot_type == SPECS.CRUSADER ? ring_length_crusader : ring_length);
    for (var direction = 0; direction < last_index; direction++) {
      let delta = ring[direction];
      let child_position = tip.add(delta);

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
      child.g = tip.g + delta[0]*delta[0] + delta[1]*delta[1];
      child.h = (child_position[0] - end[0])*(child_position[0] - end[0]) + (child_position[1] - end[1])*(child_position[1] - end[1]);
      child.f = child.g + child.h;

      branches.push(child);
    }
  }
  return false;
}
