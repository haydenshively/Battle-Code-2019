import {SPECS} from 'battlecode';
import {CommonSource} from './common.js';
import {find_path} from './astar.js';

export class ProphetSource extends CommonSource {
  constructor() {
    super();
    // Variables to set once (as soon as we receive a puppet instance)
    this.parent = null;
    // Are all the above set?
    this.initialized = false;
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
    if (!this.initialized) {this.initialize_with(puppet);}
  }

  initialize_with(puppet) {
    super.initialize_with(puppet);

    // includes everything in 100 r^2
    let visible_robots = puppet.getVisibleRobots();
    // iterate through all results
    for (var i = visible_robots.length - 1; i >= 0; i--) {
      let robot = visible_robots[i];
      if (robot.team != puppet.me.team) {
        continue// TODO
      }
      // if robot is self
      else if (robot.id == puppet.me.id) {
        continue// TODO
      }
      // if robot is parent //TODO what if 2 castles are really close together
      else if (CommonSource.r_sq_between(puppet.me.x, puppet.me.y, robot.x, robot.y) <= 2) {
        this.parent = new Castle(robot.id, null, robot.x, robot.y);
        puppet.castleTalk(super.small_packet_for(true, robot.y));
      }
      // if robot is something else on our team
      else {
        continue// TODO
      }
    }

    this.initialized = true;
  }
}
