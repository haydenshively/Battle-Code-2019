import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';

const unit_ring = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 8;

class Castle {
  constructor(place_in_turn_queue = null, x = null, y = null, id_bool = null) {
    this.place_in_turn_queue = place_in_turn_queue;
    this.x = x;
    this.y = y;
    this.id_bool = id_bool;
  }
}

export class CastleSource extends CommonSource {
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.place_in_turn_queue = null;
    this.buildable_tiles = [];
    // Are all the above set?
    this.initialized = false;

    // Variables to set once (after more information becomes available)
    this.castle_count = null;
    this.other_units = {};
    this.our_castles = {};
    this.their_castles = {};
  }

  /*
  Actions:
  return puppet.proposeTrade(karbonite, fuel);
  return puppet.buildUnit(unit, dx, dy);
  return puppet.give(dx, dy, karbonite, fuel);

  Communications:
  return puppet.signal(value, sq_radius);
  return puppet.castleTalk(value);
  */
  get_action_for(puppet) {
    if (!this.initialized) {this.initialize_with(puppet);}

    if (puppet.me.turn == 1) {
      let i = Math.floor(Math.random() * this.buildable_tiles.length);
      let direction = this.buildable_tiles[i];

      // DEBUG
      puppet.log("CASTLE " + puppet.me.id + " TURN 1");
      puppet.log("Place in queue: " + this.place_in_turn_queue);
      puppet.log("X: " + puppet.me.x + ", Y: " + puppet.me.y);
      puppet.log("Placing on: " + direction);
      puppet.log("--------------------------------------------------");

      if (this.place_in_turn_queue == 2) {
        return puppet.buildUnit(SPECS.CRUSADER, direction[0], direction[1]);
      }else {
        return puppet.buildUnit(SPECS.PILGRIM, direction[0], direction[1]);
      }
    }
    else if (puppet.me.turn == 2) {
      this.second_init(puppet);

      // DEBUG
      puppet.log("CASTLE " + puppet.me.id + " TURN 2");
      puppet.log("Detected " + this.castle_count + " castles");
      for (var id in this.our_castles) {
        let castle = this.our_castles[id];
        puppet.log("--ID: " + id);
        puppet.log("--X: " + castle.x);
        puppet.log("--Y: " + castle.y);
        puppet.log("--")
      }
      puppet.log("--------------------------------------------------");
    }
  }

  second_init(puppet) {

    function handle_enemy(robot, inst) {}
    function handle_friendly_for_2_part_A(robot, inst) {
      if ((robot.turn == 2) && (inst.castle_count == 3)) {
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        let is_pilgrim_1_larger_than_castle_3 = castle_talk[1];
        let possible_castle_ids = Object.keys(inst.other_units);
        let castle3ID = (is_pilgrim_1_larger_than_castle_3 ? Math.min(...possible_castle_ids) : Math.max(...possible_castle_ids));
        inst.our_castles[castle3ID] = new Castle(3, null, null, true);
      }
    }
    function handle_friendly_for_2_part_B(robot, inst) {
      if (robot.turn == 1) {
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        if (inst.our_castles[robot.id]) {
          inst.our_castles[robot.id].id_bool = castle_talk[0];
          inst.our_castles[robot.id].x = castle_talk[1];
        }else if (inst.other_units[robot.id] && (castle_talk[1] != puppet.me.y)) {
          for (var id in inst.our_castles) {
            if (inst.our_castles[id].place_in_turn_queue == 1) {inst.our_castles[id].y = castle_talk[1];}
          }
        }else if (castle_talk[1] != puppet.me.y) {
          for (var id in inst.our_castles) {
            if (inst.our_castles[id].place_in_turn_queue == 3) {inst.our_castles[id].y = castle_talk[1];}
          }
        }
      }
    }
    if (this.place_in_turn_queue%2) {this.other_units = {};}
    function handle_friendly_for_others(robot, inst) {
      if (robot.turn == 1) {
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        if (inst.our_castles[robot.id]) {
          inst.our_castles[robot.id].id_bool = castle_talk[0];
          inst.our_castles[robot.id].x = castle_talk[1];
        }else {
          inst.other_units[robot.id] = castle_talk;
        }
      }
    }
    function completion(visible_robots, inst) {
      if (inst.place_in_turn_queue == 1) {
        var pilgrim1ID;
        var castle3ID;
        for (var i = visible_robots.length - 1; i >= 0; i--) {
          let robot = visible_robots[i];
          if (robot.team == !puppet.me.team) {continue}
          else if (robot.id == puppet.me.id) {continue}
          else {
            if (inst.get_bool_coord_from(robot.castle_talk)[0] && inst.our_castles[robot.id]) {castle3ID = robot.id;}
            else if (CommonSource.r_sq_between(puppet.me.x, puppet.me.y, robot.x, robot.y) <= 2) {pilgrim1ID = robot.id;}//TODO
          }
        }
        puppet.castleTalk(inst.small_packet_for(true, (pilgrim1ID > castle3ID)));
      }

      if (inst.place_in_turn_queue%2) {
        for (var unit_id in inst.other_units) {
          let castle_talk = inst.other_units[unit_id];
          if (puppet.me.y == castle_talk[1]) {continue}
          for (var castle_id in inst.our_castles) {
            if ((castle_id != puppet.me.id) && (inst.our_castles[castle_id].id_bool == inst.other_units[unit_id][0])) {

              inst.our_castles[castle_id].y = inst.other_units[unit_id][1];
            }
          }
        }
      }
    }

    if (this.place_in_turn_queue%2) {
      this.process_visible_robots_using(puppet, handle_enemy, handle_friendly_for_others, completion);
    }else {
      this.process_visible_robots_using(puppet, handle_enemy, handle_friendly_for_2_part_A, completion);
      this.process_visible_robots_using(puppet, handle_enemy, handle_friendly_for_2_part_B, completion);
    }
  }


  initialize_with(puppet) {
    super.initialize_with(puppet);
    this.find_buildable_tiles_around(puppet.me.x, puppet.me.y, puppet.map);
    // start at 0, will basically become castle # (1, 2, or 3)
    this.place_in_turn_queue = 1;

    function handle_enemy(robot, inst) {}
    function handle_friendly(robot, inst) {
      if (robot.turn == 1) {
        inst.place_in_turn_queue++;
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        inst.our_castles[robot.id] = new Castle();
        inst.our_castles[robot.id].id_bool = castle_talk[0];
        inst.our_castles[robot.id].x = castle_talk[1];
      }else {
        inst.other_units[robot.id] = new Castle();
      }
    }
    function completion(visible_robots, inst) {
      switch (inst.place_in_turn_queue) {
        case 1:
          inst.our_castles = inst.other_units;
          inst.castle_count = Object.keys(inst.our_castles).length + 1;
          break
        case 2:
          inst.our_castles[Object.keys(inst.our_castles)[0]].place_in_turn_queue = 1;
          inst.castle_count = Object.keys(inst.our_castles).length + Object.keys(inst.other_units).length;
          break
        case 3:
          inst.castle_count = Object.keys(inst.our_castles).length + 1;
      }
    }

    this.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

    let id_bool = Boolean(this.place_in_turn_queue%2);
    this.our_castles[puppet.me.id] = new Castle(this.place_in_turn_queue, puppet.me.x, puppet.me.y, id_bool);
    puppet.castleTalk(super.small_packet_for(id_bool, puppet.me.x));

    this.initialized = true;
  }

  find_buildable_tiles_around(x, y, map) {
    for (var i = unit_ring_length - 1; i >= 0; i--) {
      let direction = unit_ring[i];
      let col = x + direction[0];
      let row = y + direction[1];
      if (map[row][col]) {this.buildable_tiles.push(direction);}
    }
  }

  process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion) {
    // because this is a castle, includes everything in 100 r^2 and own team
    let visible_robots = puppet.getVisibleRobots();
    // iterate through all results
    for (var i = visible_robots.length - 1; i >= 0; i--) {
      let robot = visible_robots[i];
      /*
      If opponents show up, it's because they're visible, in which case
      their team # will be accessible. If it's the opposite of our team #,
      treat them differently. In any other case (team # matches ours or
      is null) treat them as family.
      */
      if (robot.team == !puppet.me.team) {handle_enemy(robot, this); continue}
      else if (robot.id == puppet.me.id) {continue}
      else {handle_friendly(robot, this); continue}
    }
    completion(visible_robots, this);
  }



  // find_partner_for(coordinates, symmetry) {
  //
  // }
}
