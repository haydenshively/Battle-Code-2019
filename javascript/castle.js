import {SPECS} from 'battlecode';
import {find_path} from './astar.js';

export class Castle {
  constructor() {
    this.step = 0;

    this.map_rows = null;
    this.map_cols = null;
    this.map_combined = null;
    this.symmetry_style = null;

    this.castles_per_team = 1;

    this.initialized = false;
  }

  initialize_with(puppet) {
    this.map_rows = puppet.map.length;
    this.map_cols = puppet.map[0].length;
    this.map_combined = Castle.add_bool_maps
    this.symmetry_style = this.find_symmetry_style(puppet.map);

    this.initialized = true;
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

    if (this.step == 0) {
      return puppet.buildUnit(SPECS.CRUSADER, 1, 1);
    }
  }

  find_symmetry_style_of(map) {
    var left_right = true;
    var top_bottom = true;
    loop1:
    for (var i = 0; i < this.map_rows/2; i++) {
      let top = map[i];
      let bottom = map[this.map_rows - 1 - i];
      loop2:
      for (var j = 0; j < this.map_cols/2; j++) {
        if (top[j] != bottom[j]) {top_bottom = false; break loop1;}
        else if (top[j] != top[this.map_cols - 1 - j]) {left_right = false; break loop1;}
      }
    }

    return [left_right, top_bottom];
  }

  static add_bool_maps(a, b) {return a.map((row, i) => row.map((element, j) => element + b[i][j]));}

  combine_maps(terrain, fuel, karbonite) {
    var combined = new Array(this.map_rows);
    for (var i = 0; i < this.map_rows; i++) {
      let terrain_row = terrain[i];
      let fuel_row = fuel[i];
      let karbonite_row = karbonite[i];
      for (var j = 0; j < this.map_cols; j++) {
        combined[i][j] = terrain_row[j] + fuel_row[j]*2 + karbonite_row[j]*3;
      }
    }
    return combined;
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

    return [left_right, top_bottom];
  }

  // find_partner_for(coordinates, symmetry) {
  //
  // }
}
