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
      if (robot.team == !puppet.me.team) {if(handle_enemy(robot, this)) {break}}
      else if (robot.id == puppet.me.id) {continue}
      else {if(handle_friendly(robot, this)) {break}}
    }
    completion(visible_robots, this);
  }

  small_packet_for(bool, coord) {return (bool ? 128 + coord : coord);}
  get_bool_coord_from(small_packet) {
    if (small_packet >= 128) {return [true, small_packet - 128];}
    else {return [false, small_packet];}
  }

  static r_sq_between(x1, y1, x2, y2) {return (x2 - x1)**2 + (y2 - y1)**2;}
}
