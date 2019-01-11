import {SPECS} from 'battlecode';
import {find_path} from './astar.js';
export class Pilgrim {
  constructor() {

  }

  /*
  Actions:
  return manager.buildUnit(SPECS.CHURCH, dx, dy);
  return manager.give(dx, dy, karbonite, fuel);
  return manager.mine();
  return manager.move(dx, dy);

  Communications:
  return manager.signal(value, sq_radius);
  return manager.castleTalk(value);
  */
  turn(manager) {
    if (manager.step > 1) {
      let path = find_path([manager.me.x, manager.me.y], [15, 15], manager.map, manager);
      if (path) {
        manager.log([manager.me.x, manager.me.y])
        manager.log(path);
        let next = path[1];
        let dx = next[0] - manager.me.x;
        let dy = next[1] - manager.me.y;
        manager.log(dx);
        manager.log(dy);
        return manager.move(dx, dy);
      }
    }
  }
}
