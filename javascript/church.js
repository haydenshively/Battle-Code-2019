import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

export class ChurchSource {
  constructor() {
    this.step = 0;
  }

  /*
  Actions:
  return puppet.buildUnit(unit, dx, dy);
  return puppet.give(dx, dy, karbonite, fuel);

  Communications:
  return puppet.signal(value, sq_radius);
  return puppet.castleTalk(value);
  */
  get_action_for(puppet) {

  }
}
