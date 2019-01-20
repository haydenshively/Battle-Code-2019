import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

const unit_ring = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 8;

export class PilgrimSource extends CommonSource{
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.parent = null;
    this.parent_signal = -1;
    this.friend_count = 0;

    this.path = [];

    this.church_location = []
    this.has_built_church = false;
    this.should_mine = true;
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
      // TODO must update more often because of low vision radius
      this.update_path(puppet, puppet.map, puppet.getVisibleRobotMap(), this.most_crucial_resource_map(puppet));
    }

    if (this.path.length > 1) {
      let dx = this.path[1][0] - puppet.me.x;
      let dy = this.path[1][1] - puppet.me.y;
      this.path.shift();
      return puppet.move(dx, dy);
    }else {
      if (!this.has_built_church && this.can_build_church(puppet)) {
        this.church_location = this.find_best_church_spot(puppet.me.x, puppet.me.y, puppet);
        puppet.log("Church Location: " + this.church_location);
        this.has_built_church = true;
        return puppet.buildUnit(SPECS.CHURCH, this.church_location[0], this.church_location[1]);
      }else if (this.has_built_church) {
        if (this.should_mine) {
          this.should_mine = !this.should_mine;
          puppet.log("MINING!!");
          return puppet.mine();}
        else {
          this.should_mine = !this.should_mine;
          puppet.log("GIVING!!")
          return puppet.give(this.church_location[0], this.church_location[1], puppet.me.karbonite, puppet.me.fuel);}
      }
    }
  }

  can_build_church(puppet) {
    let spec = SPECS.UNITS[SPECS.CHURCH];
    return (puppet.karbonite >= spec.CONSTRUCTION_KARBONITE) && (puppet.fuel >= spec.CONSTRUCTION_FUEL);
  }

  most_crucial_resource_map(puppet) {return (puppet.karbonite <= puppet.fuel ? puppet.karbonite_map : puppet.fuel_map);}

  // TODO read data from signal instead of constant [15, 15]
  update_path(puppet, terrain_map, troop_map, resource_map) {
    let target = (this.parent_signal > -1 ? [15, 15] : super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map));
    this.path = find_path([puppet.me.x, puppet.me.y], target, terrain_map, troop_map, SPECS.PILGRIM);
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

  find_best_church_spot(x, y, puppet) {
    let troop_map = puppet.getVisibleRobotMap();

    var best_score = false;
    var bests = [];

    for (var i = unit_ring_length - 1; i >= 0; i--) {
      let direction1 = unit_ring[i];
      let near_col = x + direction1[0];
      let near_row = y + direction1[1];
      if (puppet.map[near_row] && puppet.map[near_row][near_col] && (troop_map[near_row][near_col] <= 0) && !puppet.karbonite_map[near_row][near_col] && !puppet.fuel_map[near_row][near_col]) {
        var score = 64;
        for (var j = unit_ring_length - 1; j >= 0; j--) {
          let direction2 = unit_ring[j];
          let hazard_col = near_col + direction2[0];
          let hazard_row = near_row + direction2[1];
          let troop_map_tile = troop_map[hazard_row][hazard_col];
          if (troop_map_tile > 0) {
            let troop = puppet.getRobot(troop_map_tile);
            if (troop.team == puppet.me.team) {
              switch (troop.unit) {
                case SPECS.CASTLE:
                  score -= 2*(Math.abs(direction2[0]) + Math.abs(direction2[1]));
                  break;
                case SPECS.CHURCH:
                  score -= Math.abs(direction2[0]) + Math.abs(direction2[1]);
                  break;
              }
            }else {
              switch (troop.unit) {
                case SPECS.CASTLE:
                  score += 2*(Math.abs(direction2[0]) + Math.abs(direction2[1]));
                  break;
                case SPECS.CHURCH:
                  score += Math.abs(direction2[0]) + Math.abs(direction2[1]);
                  break;
              }
            }
          }
        }
        if (!best_score || (score > best_score)) {best_score = score; bests = [direction1];}
        else if (score == best_score) {bests.push(direction1);}
      }
    }

    return bests[Math.floor(Math.random() * bests.length)];
  }
}
