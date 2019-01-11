import {SPECS} from 'battlecode';
import {find_path} from './astar.js';
export class Crusader {
  constructor() {
    this.step = 0;
    this.path = null;
  }

  /*
  Actions:
  return manager.attack(dx, dy);
  return manager.give(dx, dy, karbonite, fuel);
  return manager.move(dx, dy);

  Communications:
  return manager.signal(value, sq_radius);
  return manager.castleTalk(value);
  */
  turn(manager) {
    if (this.step == 0) {
      this.path = find_path([manager.me.x, manager.me.y], [15, 15], manager.map);
      this.step++;
    }else {
      if ((manager.me.x == this.path[this.step][0]) && (manager.me.y == this.path[this.step][1]) && (this.step + 1 < this.path.length)) {
        this.step++;
      }
      manager.log(this.path[this.step]);
      let dx = this.path[this.step][0] - manager.me.x;
      let dy = this.path[this.step][1] - manager.me.y;
      return manager.move(dx, dy);
    }
    // if (manager.step > 1) {
    //   var path =
    //
    //   if (path.length > 1) {
    //     manager.log([manager.me.x, manager.me.y])
    //     manager.log(path);
    //     let next = path[1];
    //     let dx = next[0] - manager.me.x;
    //     let dy = next[1] - manager.me.y;
    //     manager.log(dx);
    //     manager.log(dy);
    //     return manager.move(dx, dy);
    //   }
    // }
  }
}
