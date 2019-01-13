import {SPECS} from 'battlecode';

const unit_ring = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const unit_ring_length = 8;

class Castle {
  constructor(id_bool = null, x = null, y = null) {
    this.id_bool = id_bool;
    this.x = x;
    this.y = y;
  }
}

export class CastleSource {
  constructor() {
    // Variables to set once (as soon as we receive a puppet instance)
    this.map_rows = null;
    this.map_cols = null;
    this.symmetry_style = null;
    this.place_in_turn_queue = null;
    this.buildable_tiles = [];
    // Are all the above set?
    this.initialized = false;

    // Variables to set once (after more information becomes available)
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
      puppet.log(direction);
      return puppet.buildUnit(SPECS.PILGRIM, direction[0], direction[1]);
    }
  }

  initialize_with(puppet) {
    this.map_rows = puppet.map.length;
    this.map_cols = puppet.map[0].length;
    this.find_buildable_tiles_around(puppet.me.x, puppet.me.y, puppet.map);
    this.find_symmetry_style_of(puppet.map, puppet.fuel_map, puppet.karbonite_map);

    puppet.log("Symmetry Style:")
    puppet.log(this.symmetry_style);

    // start at 0, will basically become castle # (1, 2, or 3)
    this.place_in_turn_queue = 0;
    // because this is a castle, includes everything in 100 r^2 and own team
    let visible_robots = puppet.getVisibleRobots();
    // iterate through all results
    for (var i = visible_robots.length - 1; i >= 0; i--) {
      let robot = visible_robots[i];
      // If opponents show up, it's because they're visible, in which case
      // their team # will be accessible. If it's the opposite of our team #,
      // treat them differently. In any other case (team # matches ours or
      // is null) treat them as family.
      if (robot.team == !puppet.me.team) {
        continue// TODO
      }
      // if robot is self
      else if (robot.id == puppet.me.id) {
        this.place_in_turn_queue++;
        continue// TODO
      }
      // if robot has had 1 turn
      else if (robot.turn == 1) {
          this.place_in_turn_queue++;
          let castle_talk = this.get_bool_coord_from(robot.castle_talk);
          this.our_castles[robot.id] = new Castle(castle_talk[0], castle_talk[1], null);
      }
      // if robot has had 0 turns
      else {
        continue// TODO
      }
    }

    let id_bool;
    switch (this.place_in_turn_queue) {
      case 1:
        id_bool = false;
        this.our_castles[puppet.me.id] = new Castle(id_bool, puppet.me.x, puppet.me.y);
        puppet.log(this.create_packet_for(id_bool, puppet.me.x));
        puppet.castleTalk(this.create_packet_for(id_bool, puppet.me.x));
        break;
      case 2:
        id_bool = false;
        this.our_castles[puppet.me.id] = new Castle(id_bool, puppet.me.x, puppet.me.y);
        puppet.log(this.create_packet_for(id_bool, puppet.me.x));
        puppet.castleTalk(this.create_packet_for(id_bool, puppet.me.x));
        break;
      case 3:
        id_bool = true;
        this.our_castles[puppet.me.id] = new Castle(id_bool, puppet.me.x, puppet.me.y);
        puppet.log(this.create_packet_for(id_bool, puppet.me.x));
        puppet.castleTalk(this.create_packet_for(id_bool, puppet.me.x));
        break;
    }

    // puppet.log("NEW CASTLE RUNNING");
    // puppet.log("Robots detected: " + visible_robots.length);
    // for (var i = 0; i < visible_robots.length; i++) {
    //   puppet.log("ID: " + visible_robots[i].id);
    //   puppet.log("Turn: " + visible_robots[i].turn);
    //   puppet.log("Signal Radius: " + visible_robots[i].signal_radius);
    // }

    this.initialized = true;
  }

  create_packet_for(bool, coord) {
    // var packet = (128 + coord).toString(2);
    // if (!bool) {packet = packet.replace('1', '0')}
    // return packet;
    return (bool ? 128 + coord : coord);
  }
  get_bool_coord_from(packet) {
    var bool = packet >= 128;
    // var coord = parseInt(packet, 2);
    if (bool) {packet -= 128;}
    return [bool, packet];
  }

  find_buildable_tiles_around(x, y, map) {
    for (var i = unit_ring_length - 1; i >= 0; i--) {
      let direction = unit_ring[i];
      let col = x + direction[0];
      let row = y + direction[1];
      if (map[row][col]) {this.buildable_tiles.push(direction);}
    }
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

  // find_partner_for(coordinates, symmetry) {
  //
  // }

  // count_castles(puppet) {
  //   // wait for turn 2 so that we can detect some sort of castle talk
  //   this.castles_per_team = 1;// TODO use castle talk to make this correct
  //
  //   if (this.castles_per_team%2) {// is odd
  //
  //   }
  // }
}
