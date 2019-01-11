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

    this.step = -1;
  }

  turn() {
    if (this.step == -1) {
      switch (this.me.unit) {
        case SPECS.CASTLE: this.playbook = new Castle(); break;
        case SPECS.CHURCH: this.playbook = new Church(); break;
        case SPECS.PILGRIM: this.playbook = new Pilgrim(); break;
        case SPECS.CRUSADER: this.playbook = new Crusader(); break;
        case SPECS.PROPHET: this.playbook = new Prophet(); break;
        case SPECS.PREACHER: this.playbook = new Preacher(); break;
        default:
        this.playbook = null;
        this.log("Something went very wrong. Didn't conform to any SPEC.");
      }
    }


    this.step++;
    return this.playbook.turn(this);
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
