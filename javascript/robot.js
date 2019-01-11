import {BCAbstractRobot, SPECS} from 'battlecode';
import {Castle} from './castle.js';
import {Church} from './church.js';
import {Crusader} from './crusader.js';
import {Pilgrim} from './pilgrim.js';
import {Preacher} from './preacher.js';
import {Prophet} from './prophet.js';

class MyRobot extends BCAbstractRobot {

  constructor() {
    super();
    this._initialized = false;
  }

  turn() {
    if (!this._initialized) {
      switch (this.me.unit) {
        case SPECS.CASTLE: this.source = new Castle(); break;
        case SPECS.CHURCH: this.source = new Church(); break;
        case SPECS.PILGRIM: this.source = new Pilgrim(); break;
        case SPECS.CRUSADER: this.source = new Crusader(); break;
        case SPECS.PROPHET: this.source = new Prophet(); break;
        case SPECS.PREACHER: this.source = new Preacher(); break;
        default: this.source = new RandomMovement(); this.log("Defaulting to RandomMovement");
      }

      this._initialized = true;
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
