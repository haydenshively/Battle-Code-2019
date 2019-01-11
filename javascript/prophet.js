import {SPECS} from 'battlecode';
import {find_path} from './astar.js';

export class Prophet {
  constructor() {
    this.step = 0;
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

  }
}
