import {SPECS} from 'battlecode';
import {find_path} from './astar.js';

export class PilgrimSource {
  constructor() {
    this.step = 0;
  }

  /*
  Actions:
  return puppet.buildUnit(SPECS.CHURCH, dx, dy);
  return puppet.give(dx, dy, karbonite, fuel);
  return puppet.mine();
  return puppet.move(dx, dy);

  Communications:
  return puppet.signal(value, sq_radius);
  return puppet.castleTalk(value);
  */
  get_action_for(puppet) {
    if (this.step > 1) {
      let path = find_path([puppet.me.x, puppet.me.y], [15, 15], puppet.map, puppet);
      if (path) {
        puppet.log([puppet.me.x, puppet.me.y])
        puppet.log(path);
        let next = path[1];
        let dx = next[0] - puppet.me.x;
        let dy = next[1] - puppet.me.y;
        puppet.log(dx);
        puppet.log(dy);
        return puppet.move(dx, dy);
      }
    }
  }
}
