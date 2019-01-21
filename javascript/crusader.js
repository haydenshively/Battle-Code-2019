import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

class Castle {
  constructor(id = null, id_bool = null, x = null, y = null) {
    this.id = id;
    this.id_bool = id_bool;
    this.x = x;
    this.y = y;
  }
}

export class CrusaderSource extends CommonSource {
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.parent = null;
    this.parent_signal = -1;
    this.friend_count = 0;

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
    if (!this.initialized) {this.initialize_with(puppet);}
  }

  initialize_with(puppet) {
    super.initialize_with(puppet);

    function handle_enemy(robot, inst) {}
    function handle_friendly(robot, inst) {
      if (robot.unit == SPECS.CASTLE) {
        if (CommonSource.r_sq_between(puppet.me, robot) <= 2) {
          inst.parent = robot;
          inst.parent_signal = robot.signal;
          puppet.castleTalk(CommonSource.small_packet_for(false, robot.y));
        }else {
          // TODO log castle
        }
      }else {
        inst.friend_count++;
      }
    }
    function completion(robot, inst) {}
    super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);
  }
}
