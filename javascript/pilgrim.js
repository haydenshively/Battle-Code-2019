import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

const unit_ring = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 8;

export class PilgrimSource extends CommonSource{
  constructor() {
    super();

    this.nearest_friendly = [false, false, false, false, false, false];
    this.parent = null;

    this.has_reached_resource = false;
    this.has_established_depot = false;
    this.should_mine = false;

    this.depot_direction = [];
    this.brigade_size = 1;

    this.action = null;
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
    this.observe_with(puppet);
    if (puppet.me.turn == 1) this.initialize_with(puppet);
    // TODO send bucket brigade signal to newcomers
    // TODO send castle_talk

    if (!this.has_reached_resource && this.travelling_to_resource(puppet)) return this.action;
    else if (!this.has_established_depot && this.establishing_depot(puppet)) return this.action;
    else if (this.has_established_depot && this.mine(puppet)) return this.action;
  }

  travelling_to_resource(puppet) {
    let troop_map = puppet.getVisibleRobotMap();
    var resource_map = CommonSource.most_crucial_resource_map(puppet);
    // TODO read data from signal instead of constant [15, 15]
    var destination = (this.parent.signal > -1 ? [15, 15] : super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map));
    if ((puppet.me.x == destination[0]) && (puppet.me.y == destination[1])) {
      this.has_reached_resource = true;
      return false;
    }

    while (troop_map[destination[1]][destination[0]] > 0) {
      resource_map[destination[1]][destination[0]] = false;
      destination = super.find_nearest_resource([puppet.me.x, puppet.me.y], resource_map);
    }

    let path = find_path([puppet.me.x, puppet.me.y], destination, puppet.map, troop_map, puppet.me.unit);
    let dx = path[1][0] - puppet.me.x;
    let dy = path[1][1] - puppet.me.y;
    this.action = puppet.move(dx, dy);
    return true;// says to perform this.action once this function is complete
  }

  establishing_depot(puppet) {
    let nearest_castle = this.nearest_friendly[SPECS.CASTLE];
    let nearest_church = this.nearest_friendly[SPECS.CHURCH];
    let nearest_pilgrim = this.nearest_friendly[SPECS.PILGRIM];

    if ((nearest_castle != null) && (CommonSource.r_sq_between(puppet.me, nearest_castle) <= 2)) {
      puppet.log("Adjacent to castle; exploiting");
      this.depot_direction = [nearest_castle.x - puppet.me.x, nearest_castle.y - puppet.me.y];
      this.has_established_depot = true;
      return false;
    }else if ((nearest_church != null) && (CommonSource.r_sq_between(puppet.me, nearest_church) <= 2)) {
      puppet.log("Adjacent to church; exploiting");
      this.depot_direction = [nearest_church.x - puppet.me.x, nearest_church.y - puppet.me.y];
      this.has_established_depot = true;
      return false;
    }else if ((nearest_pilgrim != null) && (CommonSource.r_sq_between(puppet.me, nearest_pilgrim) <= 2)) {
      // if nearest pilgrim is part of brigade
      if ((nearest_pilgrim.signal > -1) && (nearest_pilgrim.signal < 10)) {// 10 represents resource_capacity/resource_per_call_to_mine
        puppet.log("Adjacent to bucket brigade; joining");
        this.brigade_size = nearest_pilgrim.signal + 1;
        this.depot_direction = [nearest_pilgrim.x - puppet.me.x, nearest_pilgrim.y - puppet.me.y];
        this.has_established_depot = true;
        return false;
      }
    }else if (CommonSource.can_build(SPECS.CHURCH, puppet)) {
      puppet.log("In new area; building church");
      this.find_best_church_spot(puppet);
      this.action = puppet.buildUnit(SPECS.CHURCH, this.depot_direction[0], this.depot_direction[1]);
      this.has_established_depot = true;
      return true;
    }else {
      puppet.log("In new area; waiting to build church")
      return false;
    }
  }

  mine(puppet) {
    this.should_mine = !this.should_mine;
    if (this.should_mine) this.action = puppet.mine();
    else this.action = puppet.give(this.depot_direction[0], this.depot_direction[1], puppet.me.karbonite, puppet.me.fuel);
    return true;// says to perform this.action once this function is complete
  }

  find_best_church_spot(puppet) {
    let x = puppet.me.x;
    let y = puppet.me.y;
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

    this.depot_direction = bests[Math.floor(Math.random() * bests.length)];
  }

  observe_with(puppet) {
    function handle_enemy(robot, inst) {}
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
    puppet.castleTalk(CommonSource.small_packet_for(true, this.parent.y));
  }
}
