import {SPECS} from 'battlecode';
import {find_path} from './astar.js';

export class Crusader {
  constructor() {
    this.step = 0;
    this.path = null;
  }

  /*
  Actions:
  return puppet.attack(dx, dy);
  return puppet.give(dx, dy, karbonite, fuel);
  return puppet.move(dx, dy);

  Communications:
  return puppet.signal(value, sq_radius);
  return puppet.castleTalk(value);
  */
  get_action_for(puppet) {
    if (this.step == 0) {
      this.path = find_path([puppet.me.x, puppet.me.y], [15, 15], puppet.map);
      this.step++;
    }else {
      if ((puppet.me.x == this.path[this.step][0]) && (puppet.me.y == this.path[this.step][1]) && (this.step + 1 < this.path.length)) {
        this.step++;
      }
      puppet.log(this.path[this.step]);
      let dx = this.path[this.step][0] - puppet.me.x;
      let dy = this.path[this.step][1] - puppet.me.y;
      return puppet.move(dx, dy);
    }
    // if (puppet.step > 1) {
    //   var path =
    //
    //   if (path.length > 1) {
    //     puppet.log([puppet.me.x, puppet.me.y])
    //     puppet.log(path);
    //     let next = path[1];
    //     let dx = next[0] - puppet.me.x;
    //     let dy = next[1] - puppet.me.y;
    //     puppet.log(dx);
    //     puppet.log(dy);
    //     return puppet.move(dx, dy);
    //   }
    // }
  }
}
