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
    this.destination = null;
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
    else if (this.travelling_to_even_tile(puppet)) return this.action;
  }

  attacking(puppet) {
    if (this.nearest_enemy != false) {
      // preacher's vision radius = attack radius, no need to check if in range
      let dx = this.nearest_enemy.x - puppet.me.x;
      let dy = this.nearest_enemy.y - puppet.me.y;
      puppet.log('Attacking enemy at ' + dx + ', ' + dy);
      this.action = puppet.attack(dx, dy);
      return true;
    }
    return false;
  }

  travelling_to_even_tile(puppet) {
    let map_troop = puppet.getVisibleRobotMap();
    map_troop[puppet.me.y][puppet.me.x] = 0;
    let map_terrain = puppet.map;
    let map_karb = puppet.karbonite_map;
    let map_fuel = puppet.fuel_map;

    let choices = [-1, 1];
    if (this.destination[0]%2 != 0) this.destination[0] += choices[Math.floor(Math.random()*2)];
    if (this.destination[1]%2 != 0) this.destination[1] += choices[Math.floor(Math.random()*2)];
    while (
      ((Math.abs(this.destination[0] - this.parent.x) + Math.abs(this.destination[1] - this.parent.y)) <= 2) ||
      (this.destination[0] > map_troop[0].length - 1) ||
      (this.destination[0] < 0) ||
      (this.destination[1] > map_troop.length - 1) ||
      (this.destination[1] < 0) ||
      (map_troop[this.destination[1]][this.destination[0]] > 0) ||
      (!map_terrain[this.destination[1]][this.destination[0]]) ||
      (map_karb[this.destination[1]][this.destination[0]]) ||
      (map_fuel[this.destination[1]][this.destination[0]])) {
        let divisor = Math.random()*8;
        if (Math.floor(Math.random()*2)) {
          this.destination[1] += 2*Math.sign((map_troop.length/divisor) - puppet.me.y);
        }else {
          this.destination[0] += 2*Math.sign((map_troop[0].length/divisor) - puppet.me.x);
        }
    }

    if ((this.destination[0] != puppet.me.x) || (this.destination[1] != puppet.me.y)) {
      let path = find_path([puppet.me.x, puppet.me.y], this.destination, puppet.map, map_troop, puppet.me.unit);
      let dx = path[1][0] - puppet.me.x;
      let dy = path[1][1] - puppet.me.y;
      this.action = puppet.move(dx, dy);
      return true;// says to perform this.action once this function is complete
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

    this.destination = [puppet.me.x, puppet.me.y];
  }
}
