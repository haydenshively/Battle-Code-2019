import {SPECS} from 'battlecode';
import {find_path} from './astar.js';

export class Castle {
  constructor() {
    this.step = 0;
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
    if (this.step == 0) {
      //puppet.log("Building a crusader at " + (puppet.me.x+1) + ", " + (puppet.me.y+1));
      return puppet.buildUnit(SPECS.CRUSADER, 1, 1);
    }else {
      return // puppet.log("Castle health: " + puppet.me.health);
    }
  }

  find_symmetry(map) {
    let rows = map.length;
    let cols = map[0].length;
    var left_right = true;
    var top_bottom = true;
    loop1:
    for (var i = 0; i < rows/2; i++) {
      let top = map[i];
      let bottom = map[rows - 1 - i];
      loop2:
      for (var j = 0; j < cols/2; j++) {
        if (top[j] != bottom[j]) {top_bottom = false; break loop1;}
        else if (top[j] != top[cols - 1 - j]) {left_right = false; break loop1;}
      }
    }

    return [left_right, top_bottom];
  }
}
