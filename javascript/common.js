import {SPECS} from 'battlecode';

export class CommonSource {
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
