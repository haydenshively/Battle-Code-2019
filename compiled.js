'use strict';

var SPECS = {"COMMUNICATION_BITS":16,"CASTLE_TALK_BITS":8,"MAX_ROUNDS":1000,"TRICKLE_FUEL":25,"INITIAL_KARBONITE":100,"INITIAL_FUEL":500,"MINE_FUEL_COST":1,"KARBONITE_YIELD":2,"FUEL_YIELD":10,"MAX_TRADE":1024,"MAX_BOARD_SIZE":64,"MAX_ID":4096,"CASTLE":0,"CHURCH":1,"PILGRIM":2,"CRUSADER":3,"PROPHET":4,"PREACHER":5,"RED":0,"BLUE":1,"CHESS_INITIAL":100,"CHESS_EXTRA":20,"TURN_MAX_TIME":200,"MAX_MEMORY":50000000,"UNITS":[{"CONSTRUCTION_KARBONITE":null,"CONSTRUCTION_FUEL":null,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":200,"VISION_RADIUS":100,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,64],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":50,"CONSTRUCTION_FUEL":200,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":100,"VISION_RADIUS":100,"ATTACK_DAMAGE":0,"ATTACK_RADIUS":0,"ATTACK_FUEL_COST":0,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":10,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":1,"STARTING_HP":10,"VISION_RADIUS":100,"ATTACK_DAMAGE":null,"ATTACK_RADIUS":null,"ATTACK_FUEL_COST":null,"DAMAGE_SPREAD":null},{"CONSTRUCTION_KARBONITE":15,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":9,"FUEL_PER_MOVE":1,"STARTING_HP":40,"VISION_RADIUS":49,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":25,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":2,"STARTING_HP":20,"VISION_RADIUS":64,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[16,64],"ATTACK_FUEL_COST":25,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":30,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":3,"STARTING_HP":60,"VISION_RADIUS":16,"ATTACK_DAMAGE":20,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":15,"DAMAGE_SPREAD":3}]};

function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        this._bc_reset_state();
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        this.id = game_state.id;
        this.karbonite = game_state.karbonite;
        this.fuel = game_state.fuel;
        this.last_offer = game_state.last_offer;

        this.me = this.getRobot(this.id);

        if (this.me.turn === 1) {
            this.map = game_state.map;
            this.karbonite_map = game_state.karbonite_map;
            this.fuel_map = game_state.fuel_map;
        }

        try {
            var t = this.turn();
        } catch (e) {
            t = this._bc_error_action(e);
        }

        if (!t) t = this._bc_null_action();

        t.signal = this._bc_signal;
        t.signal_radius = this._bc_signal_radius;
        t.logs = this._bc_logs;
        t.castle_talk = this._bc_castle_talk;

        this._bc_reset_state();

        return t;
    }

    _bc_reset_state() {
        // Internal robot state representation
        this._bc_logs = [];
        this._bc_signal = 0;
        this._bc_signal_radius = 0;
        this._bc_game_state = null;
        this._bc_castle_talk = 0;
        this.me = null;
        this.id = null;
        this.fuel = null;
        this.karbonite = null;
        this.last_offer = null;
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'signal_radius': this._bc_signal_radius,
            'logs': this._bc_logs,
            'castle_talk': this._bc_castle_talk
        };
    }

    _bc_error_action(e) {
        var a = this._bc_null_action();
        
        if (e.stack) a.error = e.stack;
        else a.error = e.toString();

        return a;
    }

    _bc_action(action, properties) {
        var a = this._bc_null_action();
        if (properties) for (var key in properties) { a[key] = properties[key]; }
        a['action'] = action;
        return a;
    }

    _bc_check_on_map(x, y) {
        return x >= 0 && x < this._bc_game_state.shadow[0].length && y >= 0 && y < this._bc_game_state.shadow.length;
    }
    
    log(message) {
        this._bc_logs.push(JSON.stringify(message));
    }

    // Set signal value.
    signal(value, radius) {
        // Check if enough fuel to signal, and that valid value.
        
        var fuelNeeded = Math.ceil(Math.sqrt(radius));
        if (this.fuel < fuelNeeded) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw "Signal radius is too big.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= fuelNeeded;
    }

    // Set castle talk value.
    castleTalk(value) {
        // Check if enough fuel to signal, and that valid value.

        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw "Invalid castle talk, must be between 0 and 2^8.";

        this._bc_castle_talk = value;
    }

    proposeTrade(karbonite, fuel) {
        if (this.me.unit !== SPECS.CASTLE) throw "Only castles can trade.";
        if (!Number.isInteger(karbonite) || !Number.isInteger(fuel)) throw "Must propose integer valued trade."
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw "Cannot trade over " + SPECS.MAX_TRADE + " in a given turn.";

        return this._bc_action('trade', {
            trade_fuel: fuel,
            trade_karbonite: karbonite
        });
    }

    buildUnit(unit, dx, dy) {
        if (this.me.unit !== SPECS.PILGRIM && this.me.unit !== SPECS.CASTLE && this.me.unit !== SPECS.CHURCH) throw "This unit type cannot build.";
        if (this.me.unit === SPECS.PILGRIM && unit !== SPECS.CHURCH) throw "Pilgrims can only build churches.";
        if (this.me.unit !== SPECS.PILGRIM && unit === SPECS.CHURCH) throw "Only pilgrims can build churches.";
        
        if (!Number.isInteger(dx) || !Number.isInteger(dx) || dx < -1 || dy < -1 || dx > 1 || dy > 1) throw "Can only build in adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't build units off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] > 0) throw "Cannot build on occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot build onto impassable terrain.";
        if (this.karbonite < SPECS.UNITS[unit].CONSTRUCTION_KARBONITE || this.fuel < SPECS.UNITS[unit].CONSTRUCTION_FUEL) throw "Cannot afford to build specified unit.";

        return this._bc_action('build', {
            dx: dx, dy: dy,
            build_unit: unit
        });
    }

    move(dx, dy) {
        if (this.me.unit === SPECS.CASTLE || this.me.unit === SPECS.CHURCH) throw "Churches and Castles cannot move.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't move off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot move outside of vision range.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] !== 0) throw "Cannot move onto occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot move onto impassable terrain.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);  // Squared radius
        if (r > SPECS.UNITS[this.me.unit]['SPEED']) throw "Slow down, cowboy.  Tried to move faster than unit can.";
        if (this.fuel < r*SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE']) throw "Not enough fuel to move at given speed.";

        return this._bc_action('move', {
            dx: dx, dy: dy
        });
    }

    mine() {
        if (this.me.unit !== SPECS.PILGRIM) throw "Only Pilgrims can mine.";
        if (this.fuel < SPECS.MINE_FUEL_COST) throw "Not enough fuel to mine.";
        
        if (this.karbonite_map[this.me.y][this.me.x]) {
            if (this.me.karbonite >= SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY) throw "Cannot mine, as at karbonite capacity.";
        } else if (this.fuel_map[this.me.y][this.me.x]) {
            if (this.me.fuel >= SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY) throw "Cannot mine, as at fuel capacity.";
        } else throw "Cannot mine square without fuel or karbonite.";

        return this._bc_action('mine');
    }

    give(dx, dy, karbonite, fuel) {
        if (dx > 1 || dx < -1 || dy > 1 || dy < -1 || (dx === 0 && dy === 0)) throw "Can only give to adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't give off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] <= 0) throw "Cannot give to empty square.";
        if (karbonite < 0 || fuel < 0 || this.me.karbonite < karbonite || this.me.fuel < fuel) throw "Do not have specified amount to give.";

        return this._bc_action('give', {
            dx:dx, dy:dy,
            give_karbonite:karbonite,
            give_fuel:fuel
        });
    }

    attack(dx, dy) {
        if (this.me.unit === SPECS.CHURCH) throw "Churches cannot attack.";
        if (this.fuel < SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST) throw "Not enough fuel to attack.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't attack off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot attack outside of vision range.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);
        if (r > SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1] || r < SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0]) throw "Cannot attack outside of attack range.";

        return this._bc_action('attack', {
            dx:dx, dy:dy
        });
        
    }


    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Check if a given robot is visible.
    isVisible(robot) {
        return ('unit' in robot);
    }

    // Check if a given robot is sending you radio.
    isRadioing(robot) {
        return robot.signal >= 0;
    }

    // Get map of visible robot IDs.
    getVisibleRobotMap() {
        return this._bc_game_state.shadow;
    }

    // Get boolean map of passable terrain.
    getPassableMap() {
        return this.map;
    }

    // Get boolean map of karbonite points.
    getKarboniteMap() {
        return this.karbonite_map;
    }

    // Get boolean map of impassable terrain.
    getFuelMap() {
        return this.fuel_map;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    turn() {
        return null;
    }
}

class CommonSource {
  constructor() {
    // Variables to set once (as soon as we receive a puppet instance)
    this.map_rows = null;
    this.map_cols = null;
    this.symmetry_style = null;
  }

  initialize_with(puppet) {
    this.map_rows = puppet.map.length;
    this.map_cols = puppet.map[0].length;
    this.find_symmetry_style_of(puppet.map, puppet.fuel_map, puppet.karbonite_map);
  }

  find_symmetry_style_of(terrain, fuel, karbonite) {
    var left_right = true;
    var top_bottom = true;
    loop1:
    for (var i = 0; i < this.map_rows/2; i++) {
      let i_inv = this.map_rows - 1 - i;

      let terrain_top = terrain[i];
      let terrain_bottom = terrain[i_inv];
      let fuel_top = fuel[i];
      let fuel_bottom = fuel[i_inv];
      let karbonite_top = karbonite[i];
      let karbonite_bottom = karbonite[i_inv];

      loop2:
      for (var j = 0; j < this.map_cols/2; j++) {
        let j_inv = this.map_cols - 1 - j;

        let top_left = terrain_top[j] + fuel_top[j]*2 + karbonite_top[j]*3;
        let top_right = terrain_top[j_inv] + fuel_top[j_inv]*2 + karbonite_top[j_inv]*3;
        let bottom_left = terrain_bottom[j] + fuel_bottom[j]*2 + karbonite_bottom[j]*3;

        if (top_left != top_right) {left_right = false; break loop1;}
        else if (top_left != bottom_left) {top_bottom = false; break loop1;}
      }
    }

    this.symmetry_style = [left_right, top_bottom];
  }

  process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion) {
    // includes everything in vision radius
    // if castle, also includes our entire team (for castle_talk)
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
      if (robot.team == !puppet.me.team) {if (handle_enemy(robot, this)) {break}}
      else if (robot.id == puppet.me.id) {continue}
      else {if (handle_friendly(robot, this)) {break}}
    }
    completion(visible_robots, this);
  }

  static small_packet_for(bool, coord) {return (bool ? 128 + coord : coord);}
  static get_bool_coord_from(small_packet) {
    if (small_packet >= 128) {return [true, small_packet - 128];}
    else {return [false, small_packet];}
  }

  static small_packet2_for(robot_type, enemy_count) {
    let robot_type_addend;
    switch (robot_type) {
      case SPECS.PILGRIM: robot_type_addend = 0; break;
      case SPECS.CRUSADER: robot_type_addend = 32; break;
      case SPECS.PROPHET: robot_type_addend = 64; break;
      case SPECS.PREACHER: robot_type_addend = 96; break;
      case SPECS.CHURCH: robot_type_addend = 128; break;
      default: robot_type_addend = 160;
    }
    if (enemy_count > 31) enemy_count = 31;
    return robot_type_addend + enemy_count;
  }
  static get_type_count_from(small_packet) {
    if (small_packet < 32) return [SPECS.PILGRIM, small_packet];
    if (small_packet < 64) return [SPECS.CRUSADER, small_packet - 32];
    if (small_packet < 96) return [SPECS.PROPHET, small_packet - 64];
    if (small_packet < 128) return [SPECS.PREACHER, small_packet - 96];
    if (small_packet < 160) return [SPECS.CHURCH, small_packet - 128];
    return [null, small_packet - 160];
  }

  static r_sq_between(robot1, robot2) {return (robot2.x - robot1.x)**2 + (robot2.y - robot1.y)**2;}

  static most_crucial_resource_map(puppet) {return (5*puppet.karbonite <= puppet.fuel) ? puppet.karbonite_map : puppet.fuel_map;}

  static can_build(robot_type, puppet) {
    let spec = SPECS.UNITS[robot_type];
    return (puppet.karbonite >= spec.CONSTRUCTION_KARBONITE) && (puppet.fuel >= spec.CONSTRUCTION_FUEL);
  }

  static can_attack(robot_type, r, puppet) {
    let spec = SPECS.UNITS[robot_type];
    let range = spec['ATTACK_RADIUS'];
    return (puppet.fuel >= spec.ATTACK_FUEL_COST) && (r >= range[0]) && (r <= range[1])
  }

  find_nearest_resource(from, map) {
    if (map[from[1]][from[0]]) {return from;}

    var found = false;
    var k = 1;
    var i = 0;
    var x = from[0] - k;
    var y = from[1] - k;
    var delta = [0, -1];
    while (!found) {
      // if we need to change directions in the spiral
      if (i%(2*k) == 0) {
        if (delta[0]) {delta[1] = delta[0]; delta[0] = 0;}
        else {delta[0] = -delta[1]; delta[1] = 0;}
      }
      // finished current ring, expand search radius
      if (i == 8*k) {
        k++;
        i = 0;
        x = from[0] - k;
        y = from[1] - k;
      }

      if (map[y] && map[y][x]) {found = true; break}
      x += delta[0];
      y += delta[1];

      i++;
    }

    return [x, y];
  }

  static make_array(w, h, val) {
    var arr = [];
    for (var i = 0; i < h; i++) {arr[i] = []; for (var j = 0; j < w; j++) {arr[i][j] = val;}}
    return arr;
  }
}

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

class CastleSource extends CommonSource {
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

    this.build_order = [SPECS.PILGRIM, SPECS.CRUSADER, SPECS.CRUSADER, SPECS.PILGRIM, SPECS.PILGRIM,
                        SPECS.CRUSADER, SPECS.PILGRIM, SPECS.CRUSADER, SPECS.PILGRIM, SPECS.CRUSADER,
                        SPECS.CRUSADER, SPECS.CRUSADER, SPECS.CRUSADER];
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
    this.find_buildable_tiles_around(puppet.me.x, puppet.me.y, puppet.map, puppet.getVisibleRobotMap());
    let direction;

    switch (puppet.me.turn) {
      case 1:
        this.init_first_turn(puppet);

        direction = this.buildable_tiles[Math.floor(Math.random() * this.buildable_tiles.length)];
        // LOG
        puppet.log("CASTLE TURN 1");
        puppet.log("X: " + puppet.me.x + "  Y: " + puppet.me.y);
        puppet.log("Placing on: " + direction);
        puppet.log("--------------------------------------------------");

        if (this.place_in_turn_queue == 2) {return puppet.buildUnit(SPECS.CRUSADER, direction[0], direction[1]);}
        else {return puppet.buildUnit(SPECS.PILGRIM, direction[0], direction[1]);}

        break;

      case 2:
        this.init_second_turn(puppet);
        this.initialized = true;

        // LOG
        puppet.log("CASTLE TURN 2");
        for (var id in this.our_castles) puppet.log("Found ID: " + id + "  X: " + this.our_castles[id].x + "  Y: " + this.our_castles[id].y);
        puppet.log("--------------------------------------------------");

        break;

      default:
        direction = this.buildable_tiles[Math.floor(Math.random() * this.buildable_tiles.length)];
        if ((puppet.fuel >= 350) && (puppet.karbonite >= 80)) {
          if (this.build_order.length > 0) {
            let build_type = this.build_order.shift();
            return puppet.buildUnit(build_type, direction[0], direction[1]);
          }else {
            let choices = [SPECS.PILGRIM, SPECS.PILGRIM, SPECS.CRUSADER, SPECS.CRUSADER, SPECS.PROPHET, SPECS.PREACHER];
            return puppet.buildUnit(choices[Math.floor(Math.random()*choices.length)], direction[0], direction[1]);
          }
        }
    }
  }

  init_first_turn(puppet) {
    super.initialize_with(puppet);
    // start at 0, will basically become castle # (1, 2, or 3)
    this.place_in_turn_queue = 1;

    function handle_enemy(robot, inst) {}
    function handle_friendly(robot, inst) {
      if (robot.turn == 1) {
        inst.place_in_turn_queue++;
        let castle_talk = CommonSource.get_bool_coord_from(robot.castle_talk);
        inst.our_castles[robot.id] = new Castle(null, castle_talk[1], null, castle_talk[0]);
      }else {
        inst.other_units[robot.id] = new Castle();
      }
    }
    function completion(visible_robots, inst) {}
    super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

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
    puppet.castleTalk(CommonSource.small_packet_for(id_bool, puppet.me.x));
  }

  init_second_turn(puppet) {

    function handle_enemy(robot, inst) {}
    function extra_data_receiver(robot, inst) {
      if (robot.turn == 2) {
        let castle_talk = CommonSource.get_bool_coord_from(robot.castle_talk);
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
        let castle_talk = CommonSource.get_bool_coord_from(robot.castle_talk);
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
            if (CommonSource.get_bool_coord_from(robot.castle_talk)[0] && inst.our_castles[robot.id]) {castle3ID = robot.id;}
            else if (CommonSource.r_sq_between(puppet.me, robot) <= 2) {pilgrim1ID = robot.id;}//TODO
          }
        }
        puppet.castleTalk(CommonSource.small_packet_for(true, (pilgrim1ID > castle3ID)));
      }
    }

    if (this.place_in_turn_queue%2) {
      this.other_units = {};
      super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);

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
      if (this.castle_count == 3) {super.process_visible_robots_using(puppet, handle_enemy, extra_data_receiver, completion);}
      super.process_visible_robots_using(puppet, handle_enemy, handle_friendly, completion);
    }
  }

  find_buildable_tiles_around(x, y, map, troop_map) {
    this.buildable_tiles = [];
    for (var i = unit_ring_length - 1; i >= 0; i--) {
      let direction = unit_ring[i];
      let col = x + direction[0];
      let row = y + direction[1];
      if (map[row][col] && (troop_map[row][col] == 0)) {this.buildable_tiles.push(direction);}
    }
  }



  // find_partner_for(coordinates, symmetry) {
  //
  // }
}

const top = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }

  size() {return this._heap.length;}

  isEmpty() {return this.size() == 0;}

  peek() {return this._heap[top];}

  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }

  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > top) {
      this._swap(top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }

  replace(value) {
    const replacedValue = this.peek();
    this._heap[top] = value;
    this._siftDown();
    return replacedValue;
  }

  _greater(i, j) {return this._comparator(this._heap[i], this._heap[j]);}

  _swap(i, j) {[this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];}

  _siftUp() {
    let node = this.size() - 1;
    while (node > top && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  
  _siftDown() {
    let node = top;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

const ring = [
  [1, 0], [0, 1], [-1, 0], [0, -1],// r^2 = 1, available to all units
  [1, 1], [-1, 1], [-1, -1], [1, -1],// r^2 = 2, available to all units
  [2, 0], [0, 2], [-2, 0], [0, -2],// r^2 = 4, available to all units
  [2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1],// r^2 = 5, available to crusaders
  [2, 2], [-2, 2], [-2, -2], [2, -2],// r^2 = 8
  [3, 0], [0, 3], [-3, 0], [0, -3]// r^2 = 9
];
const ring_length = 12;
const ring_length_crusader = 28;

class Node {
  constructor(parent, position) {
    this.parent = parent;
    this.position = position;

    this.g = 0;
    this.h = 0;
    this.f = 0;
  }

  add(vector) {return [this.position[0] + vector[0], this.position[1] + vector[1]];}
  equals(vector) {return ((this.position[0] == vector[0]) && (this.position[1] == vector[1]));}
}

function node_comparator(a, b) {return a.f < b.f;}



function find_path(start, end, map, troop_map, robot_type) {
  var already_tested_map = CommonSource.make_array(map[0].length, map.length, false);

  let node_start = new Node(null, start);

  var branches = new PriorityQueue(node_comparator);
  branches.push(node_start);

  while (!branches.isEmpty()) {

    let tip = branches.pop();

    // map[tip.position[1]][tip.position[0]] = false;
    already_tested_map[tip.position[1]][tip.position[0]] = true;

    // Yay! Reached destination
    if (tip.equals(end)) {
      var path = [];
      var current = tip;
      while (current != null) {
        path.push(current.position);
        current = current.parent;
      }
      return path.reverse();
    }

    let last_index = (robot_type == SPECS.CRUSADER ? ring_length_crusader : ring_length);
    for (var direction = 0; direction < last_index; direction++) {
      let delta = ring[direction];
      let child_position = tip.add(delta);

      if (
        (child_position[0] > map[0].length - 1) ||
        (child_position[0] < 0) ||
        (child_position[1] > map.length - 1) ||
        (child_position[1] < 0)
      ) {
        continue
      }
      if (!map[child_position[1]][child_position[0]]) {continue}
      if (already_tested_map[child_position[1]][child_position[0]]) {continue}
      if (troop_map[child_position[1]][child_position[0]] > 0) {continue}

      var child = new Node(tip, child_position);
      child.g = tip.g + delta[0]*delta[0] + delta[1]*delta[1];
      child.h = (child_position[0] - end[0])*(child_position[0] - end[0]) + (child_position[1] - end[1])*(child_position[1] - end[1]);
      child.f = child.g + child.h;

      branches.push(child);
    }
  }
  return false;
}

class ChurchSource {
  constructor() {
    this.step = 0;
  }

  /*
  Actions:
  return puppet.buildUnit(unit, dx, dy);
  return puppet.give(dx, dy, karbonite, fuel);

  Communications:
  return puppet.signal(value, sq_radius);
  return puppet.castleTalk(value);
  */
  get_action_for(puppet) {

  }
}

class CrusaderSource extends CommonSource {
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
      let distance = CommonSource.r_sq_between(puppet.me, this.nearest_enemy);
      // crusader's vision radius > attack radius, so must check if in range
      if (CommonSource.can_attack(puppet.me.unit, distance, puppet)) {
        let dx = this.nearest_enemy.x - puppet.me.x;
        let dy = this.nearest_enemy.y - puppet.me.y;
        puppet.log('Attacking enemy at ' + dx + ', ' + dy);
        this.action = puppet.attack(dx, dy);
        return true;
      }
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
    this.nearest_enemy = false;
    function handle_enemy(robot, inst) {
      if (inst.nearest_enemy == false) inst.nearest_enemy = robot;
      else {
        let distance_old = CommonSource.r_sq_between(puppet.me, inst.nearest_enemy);
        let distance_new = CommonSource.r_sq_between(puppet.me, robot);
        if ((distance_new < distance_old) || ((distance_new == distance_old) && (robot.signal > inst.nearest_enemy.signal))) {
          inst.nearest_enemy = robot;
        }
      }
    }
    function handle_friendly(robot, inst) {
      if (inst.nearest_friendly[robot.unit] == false) inst.nearest_friendly[robot.unit] = robot;
      else {
        let nearest = inst.nearest_friendly[robot.unit];
        let distance_old = CommonSource.r_sq_between(puppet.me, nearest);
        let distance_new = CommonSource.r_sq_between(puppet.me, robot);
        if (distance_new < distance_old) inst.nearest_friendly[robot.unit] = robot;
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

const unit_ring$2 = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length$2 = 8;

class PilgrimSource extends CommonSource{
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
      puppet.log("In new area; waiting to build church");
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

    for (var i = unit_ring_length$2 - 1; i >= 0; i--) {
      let direction1 = unit_ring$2[i];
      let near_col = x + direction1[0];
      let near_row = y + direction1[1];
      if (puppet.map[near_row] && puppet.map[near_row][near_col] && (troop_map[near_row][near_col] <= 0) && !puppet.karbonite_map[near_row][near_col] && !puppet.fuel_map[near_row][near_col]) {
        var score = 64;
        for (var j = unit_ring_length$2 - 1; j >= 0; j--) {
          let direction2 = unit_ring$2[j];
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

class PreacherSource extends CommonSource {
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
    this.nearest_enemy = false;
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

class ProphetSource extends CommonSource {
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
      // prophet's observe_with function has already ensured that nearest_enemy is in range
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
    this.nearest_enemy = false;
    function handle_enemy(robot, inst) {
      let distance_new = CommonSource.r_sq_between(puppet.me, robot);
      if (CommonSource.can_attack(puppet.me.unit, distance_new, puppet)) {
        if (inst.nearest_enemy == false) inst.nearest_enemy = robot;
        else {
          let distance_old = CommonSource.r_sq_between(puppet.me, inst.nearest_enemy);
          if (distance_new < distance_old) inst.nearest_enemy = robot;
        }
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

class MyRobot extends BCAbstractRobot {

  constructor() {
    super();
    this.initialized = false;
  }

  turn() {
    if (!this.initialized) {
      switch (this.me.unit) {
        case SPECS.CASTLE: this.source = new CastleSource(); break;
        case SPECS.CHURCH: this.source = new ChurchSource(); break;
        case SPECS.PILGRIM: this.source = new PilgrimSource(); break;
        case SPECS.CRUSADER: this.source = new CrusaderSource(); break;
        case SPECS.PROPHET: this.source = new ProphetSource(); break;
        case SPECS.PREACHER: this.source = new PreacherSource(); break;
        default: this.source = new RandomMovement(); this.log("Defaulting to RandomMovement");
      }

      this.initialized = true;
    }

    return this.source.get_action_for(this);
  }
}

class RandomMovement {
  constructor() {this.directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];}
  get_action_for(puppet) {
    let rand = Math.random()*this.directions.length;
    let direction = this.directions[Math.floor(rand)];
    return puppet.move(direction[0], direction[1]);
  }
}

// get_me_data() {
//   this.me.id;
//   this.me.unit;
//   this.me.health;
//   this.me.team;
//   this.me.x;
//   this.me.y;
//   this.me.fuel;
//   this.me.karbonite;
//   this.me.turn;
//
//   this.me.signal;
//   this.me.signal_radius;
//
//   this.me.castle_talk;
// }
//
// get_visible_data() {
//   this.me.id;
//   this.me.unit;
//   this.me.team;
//   this.me.x;
//   this.me.y;
//   this.me.turn;
// }
//
// get_radioable_data() {
//   this.me.signal;
//   this.me.signal_radius;
// }

var robot = new MyRobot();

var robot = new MyRobot();
