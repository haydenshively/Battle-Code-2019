import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

class Castle {
  constructor(id = null, x = null, y = null, id_bool = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.id_bool = id_bool;
  }
}

export class PilgrimSource extends CommonSource{
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.parent = null;
    // Are all the above set?
    this.initialized = false;
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
    if (!this.initialized) {this.initialize_with(puppet);}
  }

  initialize_with(puppet) {
    super.initialize_with(puppet);

    function handle_enemy() {}
    function handle_friendly(robot, inst) {
      // if robot is parent //TODO what if 2 castles are really close together
      if (CommonSource.r_sq_between(puppet.me.x, puppet.me.y, robot.x, robot.y) <= 2) {
        inst.parent = new Castle(robot.id, robot.x, robot.y, null);
        puppet.castleTalk(inst.small_packet_for(true, robot.y));
      }
    }
    function completion() {}
    super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

    this.initialized = true;
  }
}
