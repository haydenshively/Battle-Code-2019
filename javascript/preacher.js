import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

const unit_ring = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 8;

export class PreacherSource extends CommonSource {
  constructor() {
    super();
    this.nearest_friendly = [false, false, false, false, false, false];
    this.parent = null;
    this.nearest_enemy = false;

    this.action = null;
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
    this.observe_with(puppet);
    if (puppet.me.turn == 1) this.initialize_with(puppet);

    if (this.attacking(puppet)) return this.action;
  }

  attacking(puppet) {
    if (this.nearest_enemy != false) {
      // preacher's vision radius = attack radius, no need to check if in range
      let dx = inst.nearest_enemy.x - puppet.me.x;
      let dy = inst.nearest_enemy.y - puppet.me.y;
      puppet.log('Attacking enemy at ' + dx + ', ' + dy);
      this.action = puppet.attack(dx, dy);
      return true;
    }
    return false;
  }

  observe_with(puppet) {
    function handle_enemy(robot, inst) {
      if (inst.nearest_enemy == false) inst.nearest_enemy = robot;
      else {
        let distance_old = CommonSource.r_sq_between(puppet.me, inst.nearest_enemy);
        let distance_new = CommonSource.r_sq_between(puppet.me, robot);
        if (distance_new < distance_old) inst.nearest_enemy = robot;
      }
    }
    function handle_friendly(robot, inst) {
      if (inst.nearest_friendly[robot.unit] == false) inst.nearest_friendly[robot.unit] = robot;
      else {
        let nearest = inst.nearest_friendly[robot.unit];
        let distance_old = CommonSource.r_sq_between(puppet.me, nearest);
        let distance_new = CommonSource.r_sq_between(puppet.me, robot);
        if ((distance_new < distance_old) || ((distance_new == distance_old) && (robot.signal > nearest.signal))) {
          inst.nearest_friendly[robot.unit] = robot;
        }
      }
    }
    function completion(robot, inst) {}
    super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);
  }

  initialize_with(puppet) {
    super.initialize_with(puppet);

    this.parent = this.nearest_friendly[SPECS.CASTLE];
    let nearest_church = this.nearest_friendly[SPECS.CHURCH];
    if (nearest_church && (CommonSource.r_sq_between(puppet.me, nearest_church) < CommonSource.r_sq_between(puppet.me, this.parent))) this.parent = nearest_church;
    puppet.castleTalk(CommonSource.small_packet_for(false, this.parent.y));
  }
}
