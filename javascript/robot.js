import {BCAbstractRobot, SPECS} from 'battlecode';
import {find_path} from './astar.js'

var step = -1;

class MyRobot extends BCAbstractRobot {

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

  castle_turn() {
    /*
    Actions:
    return this.proposeTrade(karbonite, fuel);
    return this.buildUnit(unit, dx, dy);
    return this.give(dx, dy, karbonite, fuel);

    Communications:
    return this.signal(value, sq_radius);
    return this.castleTalk(value);
    */

    if (step === 0) {
      //this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
      return this.buildUnit(SPECS.PILGRIM, 1, 1);
    }else {
      return // this.log("Castle health: " + this.me.health);
    }
  }

  church_turn() {
    /*
    Actions:
    return this.buildUnit(unit, dx, dy);
    return this.give(dx, dy, karbonite, fuel);

    Communications:
    return this.signal(value, sq_radius);
    return this.castleTalk(value);
    */
  }

  pilgrim_turn() {
    /*
    Actions:
    return this.buildUnit(SPECS.CHURCH, dx, dy);
    return this.give(dx, dy, karbonite, fuel);
    return this.mine();
    return this.move(dx, dy);

    Communications:
    return this.signal(value, sq_radius);
    return this.castleTalk(value);
    */
    if (step > 0) {
      let path = find_path([this.me.x, this.me.y], [15, 15], this.map, this);
      if (path) {
        this.log([this.me.x, this.me.y])
        this.log(path);
        let next = path[1];
        let dx = next[0] - this.me.x;
        let dy = next[1] - this.me.y;
        this.log(dx);
        this.log(dy);
        return this.move(dx, dy);
      }
    }
  }

  crusader_turn() {
    /*
    Actions:
    return this.attack(dx, dy);
    return this.give(dx, dy, karbonite, fuel);
    return this.move(dx, dy);

    Communications:
    return this.signal(value, sq_radius);
    return this.castleTalk(value);
    */
    // this.log("Crusader health: " + this.me.health);
    this.log("CRUSADER");
    const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
    const choice = choices[Math.floor(Math.random()*choices.length)];
    return this.move(...choice);


  }

  prophet_turn() {
    /*
    Actions:
    return this.attack(dx, dy);
    return this.give(dx, dy, karbonite, fuel);
    return this.move(dx, dy);

    Communications:
    return this.signal(value, sq_radius);
    return this.castleTalk(value);
    */
  }

  preacher_turn() {
    /*
    Actions:
    return this.attack(dx, dy);
    return this.give(dx, dy, karbonite, fuel);
    return this.move(dx, dy);

    Communications:
    return this.signal(value, sq_radius);
    return this.castleTalk(value);
    */
  }

  turn() {
    step++;

    switch (this.me.unit) {
    case SPECS.CASTLE: return this.castle_turn();
    case SPECS.CHURCH: return this.church_turn();
    case SPECS.PILGRIM: return this.pilgrim_turn();
    case SPECS.CRUSADER: return this.crusader_turn();
    case SPECS.PROPHET: return this.prophet_turn();
    case SPECS.PREACHER: return this.preacher_turn();

    default: this.log("Something went very wrong. Didn't conform to any SPEC.")
    }
  }
}

var robot = new MyRobot();
