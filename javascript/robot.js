import {BCAbstractRobot, SPECS} from 'battlecode';

var step = -1;

class MyRobot extends BCAbstractRobot {

    castle_turn() {
      this.log("CASTLE");
      if (step % 10 === 0) {
        //this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
        return this.buildUnit(SPECS.CRUSADER, 1, 1);
      }else {
        return // this.log("Castle health: " + this.me.health);
      }
    }

    church_turn() {

    }

    pilgrim_turn() {

    }

    crusader_turn() {
      // this.log("Crusader health: " + this.me.health);
      this.log("CRUSADER");
      const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
      const choice = choices[Math.floor(Math.random()*choices.length)];
      return this.move(...choice);
    }

    prophet_turn() {

    }

    preacher_turn() {

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
