import {BCAbstractRobot, SPECS} from 'battlecode';
import {CastleSource} from './castle.js';
import {ChurchSource} from './church.js';
import {CrusaderSource} from './crusader.js';
import {PilgrimSource} from './pilgrim.js';
import {PreacherSource} from './preacher.js';
import {ProphetSource} from './prophet.js';

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
