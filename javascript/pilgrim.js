import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

export class PilgrimSource extends CommonSource{
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.parent = null;
    this.parent_signal = -1;
    this.friend_count = 0;

    this.path = [];

    this.has_built_church = false;
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
    if (puppet.me.turn == 1) {
      this.initialize_with(puppet);
      this.update_path(puppet, puppet.map, this.most_crucial_resource_map(puppet));
    }

    if (this.path.length > 1) {
      let dx = this.path[1][0] - puppet.me.x;
      let dy = this.path[1][1] - puppet.me.y;
      this.path.shift();
      return puppet.move(dx, dy);
    }else {
      if (!this.has_built_church && this.can_build_church(puppet)) {
        return puppet.buildUnit(SPECS.CHURCH, -1, 1);
      }
    }
  }

  can_build_church(puppet) {
    let spec = SPECS.UNITS[SPECS.CHURCH];
    return (puppet.karbonite >= spec.CONSTRUCTION_KARBONITE) && (puppet.fuel >= spec.CONSTRUCTION_FUEL);
  }

  most_crucial_resource_map(puppet) {return (puppet.karbonite <= puppet.fuel ? puppet.karbonite_map : puppet.fuel_map);}

  // TODO read data from signal instead of constant [15, 15]
  update_path(puppet, terrain_map, resource_map) {
    let target = (this.parent_signal > -1 ? [15, 15] : super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map));
    this.path = find_path([puppet.me.x, puppet.me.y], target, terrain_map, SPECS.PILGRIM);
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
    function completion(robot, inst) {}
    super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);
  }
}
