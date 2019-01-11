import {SPECS} from 'battlecode';
import {find_path} from './astar.js';
export class Castle {
  constructor() {

  }

  /*
  Actions:
  return this.proposeTrade(karbonite, fuel);
  return this.buildUnit(unit, dx, dy);
  return this.give(dx, dy, karbonite, fuel);

  Communications:
  return this.signal(value, sq_radius);
  return this.castleTalk(value);
  */
  turn(manager) {
    if (manager.step === 0) {
      //this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
      return manager.buildUnit(SPECS.CRUSADER, 1, 1);
    }else {
      return // this.log("Castle health: " + this.me.health);
    }
  }
}
