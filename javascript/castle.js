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
    this.castle_count = null;
    this.our_castles = {};
    // Are all the above set?
    this.initialized = false;

    // Variables to set once (after more information becomes available)
    this.other_units = {};
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
    switch (puppet.me.turn) {
      case 1:
        this.init_first_turn(puppet);

        let i = Math.floor(Math.random() * this.buildable_tiles.length);
        let direction = this.buildable_tiles[i];

        // DEBUG
        puppet.log("CASTLE " + puppet.me.id + " TURN 1");
        puppet.log("Place in queue: " + this.place_in_turn_queue);
        puppet.log("X: " + puppet.me.x + ", Y: " + puppet.me.y);
        puppet.log("Placing on: " + direction);
        puppet.log("--------------------------------------------------");

        if (this.place_in_turn_queue == 2) {return puppet.buildUnit(SPECS.CRUSADER, direction[0], direction[1]);}
        else {return puppet.buildUnit(SPECS.PILGRIM, direction[0], direction[1]);}

        break;
      case 2:
        this.init_second_turn(puppet);
        this.initialized = true;

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

        break;
    }
  }

  init_first_turn(puppet) {
    super.initialize_with(puppet);
    this.find_buildable_tiles_around(puppet.me.x, puppet.me.y, puppet.map);
    // start at 0, will basically become castle # (1, 2, or 3)
    this.place_in_turn_queue = 1;

    function handle_enemy(robot, inst) {}
    function handle_friendly(robot, inst) {
      if (robot.turn == 1) {
        inst.place_in_turn_queue++;
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        inst.our_castles[robot.id] = new Castle(null, castle_talk[1], null, castle_talk[0]);
      }else {
        inst.other_units[robot.id] = new Castle();
      }
    }
    function completion(visible_robots, inst) {}
    this.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

    switch (this.place_in_turn_queue) {
      case 1:
        this.our_castles = this.other_units;
        this.castle_count = Object.keys(this.our_castles).length + 1;
        break
      case 2:
        this.our_castles[Object.keys(this.our_castles)[0]].place_in_turn_queue = 1;
        this.castle_count = Object.keys(this.our_castles).length + Object.keys(this.other_units).length;
        break
      case 3:
        this.castle_count = Object.keys(this.our_castles).length + 1;
    }

    let id_bool = Boolean(this.place_in_turn_queue%2);
    this.our_castles[puppet.me.id] = new Castle(this.place_in_turn_queue, puppet.me.x, puppet.me.y, id_bool);
    puppet.castleTalk(super.small_packet_for(id_bool, puppet.me.x));
  }

  init_second_turn(puppet) {

    function handle_enemy(robot, inst) {}
    function extra_data_receiver(robot, inst) {
      if (robot.turn == 2) {
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        let is_pilgrim_1_larger_than_castle_3 = castle_talk[1];
        let possible_castle_ids = Object.keys(inst.other_units);
        let castle3ID = (is_pilgrim_1_larger_than_castle_3 ? Math.min(...possible_castle_ids) : Math.max(...possible_castle_ids));
        inst.our_castles[castle3ID] = new Castle(3, null, null, true);
        return true;
      }
    }
    function handle_friendly(robot, inst) {
      // filters out [castles that have already had 2 turns] and [units creates after the first round]
      if (robot.turn == 1) {
        // arr[1] should be an x or y value
        // arr[0] should indicate whether that value corresponds to an odd-numbered castle or an even one
        let castle_talk = inst.get_bool_coord_from(robot.castle_talk);
        // if this is known to be a castle, simply update values with new castle_talk
        // NOTE: no castles will reach the other conditionals in this block
        if (inst.our_castles[robot.id]) {
          inst.our_castles[robot.id].id_bool = castle_talk[0];
          inst.our_castles[robot.id].x = castle_talk[1];
        }
        // unique to castle 2, this updates castles 1 and 3 using castle_talk from their children
        // NOTE: this conditional can be ignored unless reading castle 2 logic
        else if ((inst.place_in_turn_queue == 2) && castle_talk[0]) {
          for (var id in inst.our_castles) {
            if ((inst.our_castles[id].place_in_turn_queue == 1) && inst.other_units[robot.id]) {inst.our_castles[id].y = castle_talk[1];}
            else if ((inst.our_castles[id].place_in_turn_queue == 3) && !inst.other_units[robot.id]) {inst.our_castles[id].y = castle_talk[1];}
          }
        }
        // save castle_talk of non-castles for future use
        else {inst.other_units[robot.id] = castle_talk;}
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
    }

    if (this.place_in_turn_queue%2) {
      this.other_units = {};
      this.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

      for (var unit_id in this.other_units) {
        let castle_talk = this.other_units[unit_id];
        for (var castle_id in this.our_castles) {
          let castle = this.our_castles[castle_id];
          if ((castle_id != puppet.me.id) && (castle_talk[0] == castle.id_bool) &&
              ((castle.y == null) || (castle.y == puppet.me.y))) {
              castle.y = castle_talk[1];
          }
        }
      }
    }else {
      if (this.castle_count == 3) {this.process_visible_robots_using(puppet, handle_enemy, extra_data_receiver, completion);}
      this.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);
    }
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
      if (robot.team == !puppet.me.team) {if(handle_enemy(robot, this)) {break}}
      else if (robot.id == puppet.me.id) {continue}
      else {if(handle_friendly(robot, this)) {break}}
    }
    completion(visible_robots, this);
  }



  // find_partner_for(coordinates, symmetry) {
  //
  // }
}
