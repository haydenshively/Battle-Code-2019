import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

// class Castle {
//   constructor(id = null, x = null, y = null, id_bool = null) {
//     this.id = id;
//     this.x = x;
//     this.y = y;
//     this.id_bool = id_bool;
//   }
// }

export class PilgrimSource extends CommonSource{
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.meta_turn = -1;
    this.parent = null;
    this.parent_signal = -1;
    this.friend_count = 0;
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
    this.meta_turn++;

    if (this.parent_signal > -1) {
      //TODO
    }else {
      let resource_map = (puppet.karbonite <= puppet.fuel ? puppet.karbonite_map : puppet.fuel_map);// TODO prob don't want to switch after on tile
      let target = super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map);
      let path = find_path([puppet.me.x, puppet.me.y], target, puppet.map, SPECS.PILGRIM);

      if (path.length > 1) {
        let dx = path[1][0] - puppet.me.x;
        let dy = path[1][1] - puppet.me.y;
        return puppet.move(dx, dy);
      }
    }
  }

  initialize_with(puppet) {
    super.initialize_with(puppet);

    function handle_enemy(robot, inst) {}
    function handle_friendly(robot, inst) {
      if (robot.unit == SPECS.CASTLE) {
        if (CommonSource.r_sq_between(puppet.me.x, puppet.me.y, robot.x, robot.y)) {
          inst.parent = robot;
          inst.parent_signal = robot.signal;
          puppet.castleTalk(inst.small_packet_for(true, robot.y));
        }else {
          // TODO log castle
        }
      }else {
        inst.friend_count++;
      }
    }
    function completion(robot, inst) {inst.meta_turn += inst.parent.turn;}
    super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

    this.initialized = true;
  }
}
