import {SPECS} from 'battlecode';
import {find_path} from './astar.js';

export class Castle {
  constructor() {
    this.step = 0;

    this.map_rows = null;
    this.map_cols = null;
    this.symmetry_style = null;

    this.initialized = false;
  }

  initialize_with(puppet) {
    this.map_rows = puppet.map.length;
    this.map_cols = puppet.map[0].length;
    this.symmetry_style = this.find_symmetry_style(puppet.map);

    this.initialized = true;
  }

  /*
  Actions:
  return puppet.proposeTrade(karbonite, fuel);
  return puppet.buildUnit(unit, dx, dy);
  return puppet.give(dx, dy, karbonite, fuel);

  Communications:
  return puppet.signal(value, sq_radius);
  return puppet.castleTalk(value);
  */
  get_action_for(puppet) {
    if (!this.initialized) {this.initialize_with(puppet);}

    if (this.step == 0) {
      return puppet.buildUnit(SPECS.CRUSADER, 1, 1);
    }
  }

  find_symmetry_style(map) {
    var left_right = true;
    var top_bottom = true;
    loop1:
    for (var i = 0; i < this.map_rows/2; i++) {
      let top = map[i];
      let bottom = map[this.map_rows - 1 - i];
      loop2:
      for (var j = 0; j < this.map_cols/2; j++) {
        if (top[j] != bottom[j]) {top_bottom = false; break loop1;}
        else if (top[j] != top[this.map_cols - 1 - j]) {left_right = false; break loop1;}
      }
    }

    return [left_right, top_bottom];
  }

  // find_partner_for(coordinates, symmetry) {
  //
  // }
}
