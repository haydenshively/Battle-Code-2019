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

    this.has_church = false;
    this.church_location = []
    this.should_mine = false;
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
    if (puppet.me.turn == 1) this.initialize_with(puppet);
    // still preparing to start mining and refining
    if (!this.has_church) {
      this.update_path(puppet, puppet.map, puppet.getVisibleRobotMap(), CommonSource.most_crucial_resource_map(puppet));
      // travel
      if (this.path.length > 1) {
        let dx = this.path[1][0] - puppet.me.x;
        let dy = this.path[1][1] - puppet.me.y;
        this.path.shift();
        return puppet.move(dx, dy);
      }
      else if (this.searchForChurchAround(puppet.me.x, puppet.me.y, puppet)) {
        this.has_church = true;
        // LOG
        puppet.log("PILGRIM FOUND CHURCH");
        puppet.log("X: " + puppet.me.x + "  Y: " + puppet.me.y);
        puppet.log("Exists on: " + this.church_location);
        puppet.log("--------------------------------------------------");
      }
      // build church
      else if (CommonSource.can_build(SPECS.CHURCH, puppet)) {
        this.has_church = true;
        this.find_best_church_spot(puppet.me.x, puppet.me.y, puppet);
        // LOG
        puppet.log("PILGRIM BUILDING CHURCH");
        puppet.log("X: " + puppet.me.x + "  Y: " + puppet.me.y);
        puppet.log("Placing on: " + this.church_location);
        puppet.log("--------------------------------------------------");
        return puppet.buildUnit(SPECS.CHURCH, this.church_location[0], this.church_location[1]);
      }
    }
    // ready to mine and refine
    else {
      this.should_mine = !this.should_mine;
      if (this.should_mine) return puppet.mine();
      else return puppet.give(this.church_location[0], this.church_location[1], puppet.me.karbonite, puppet.me.fuel);
    }
  }


  // TODO read data from signal instead of constant [15, 15]
  update_path(puppet, terrain_map, troop_map, resource_map) {
    var target = (this.parent_signal > -1 ? [15, 15] : super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map));
    if ((puppet.me.x == target[0]) && (puppet.me.y == target[1])) {this.path = []; return}

    while (troop_map[target[1]][target[0]] > 0) {
      // TODO should prob also send out signal saying kill it if its an enemy
      resource_map[target[1]][target[0]] = false;
      target = super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map);
    }
    this.path = find_path([puppet.me.x, puppet.me.y], target, terrain_map, troop_map, SPECS.PILGRIM);
  }

  searchForChurchAround(x, y, puppet) {
    let troop_map = puppet.getVisibleRobotMap();

    for (var i = unit_ring_length - 1; i >= 0; i--) {
      let direction = unit_ring[i];
      let col = x + direction[0];
      let row = y + direction[1];
      if (puppet.map[row] && (troop_map[row][col] > 0)) {
        let troop = puppet.getRobot(troop_map[row][col]);
        if ((troop.team == puppet.me.team) && (troop.unit == SPECS.CHURCH)) {
          this.church_location = direction;
          return true;
        }
      }
    }

    return false;
  }

  // TODO combine with searchForChurchAround
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
          if ((hazard_row == x) && (hazard_col == y)) continue
          if (!troop_map[hazard_row]) continue
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

          if (puppet.karbonite_map[hazard_row][hazard_col] || puppet.fuel_map[hazard_row][hazard_col]) score += 4;
        }
        if (!best_score || (score > best_score)) {best_score = score; bests = [direction1];}
        else if (score == best_score) {bests.push(direction1);}
      }
    }

    this.church_location = bests[Math.floor(Math.random() * bests.length)];
  }

  initialize_with(puppet) {
    super.initialize_with(puppet);

    function handle_enemy(robot, inst) {}
    function handle_friendly(robot, inst) {
      if (robot.unit == SPECS.CASTLE) {
        if (CommonSource.r_sq_between(puppet.me.x, puppet.me.y, robot.x, robot.y)) {
          inst.parent = robot;
          inst.parent_signal = robot.signal;
          puppet.castleTalk(CommonSource.small_packet_for(true, robot.y));
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
