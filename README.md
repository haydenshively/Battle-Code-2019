# Battle Code 2019

The following information is from the [competition website](https://battlecode.org/dash/docs).  

## Game Format
Battlecode: Crusade is a turn based game, where robots on a tiled grid are each controlled by individual computer programs. Robots include Castles, Churches, Pilgrims, Crusaders, Prophets, and Preachers. The objective of the game is to destroy the enemy team Castles. If by 1000 rounds both blue and red Castles remain, the winner is determined by the team with more castles, followed by the team with more total health, followed by a coin flip.  

## Map and Resources
Game maps are procedurally generated, and are square 2d grids ranging between 32x32 and 64x64 tiles. Every map is either horizontally or vertically symmetric, and the top left corner has the coordinates (0,0). Each tile in the map is either passable or impassable rocky terrain, and each team starts with 1-3 Castles on the map, 100 Karbonite, and 500 Fuel.  
  
Passable tiles can have resource points on them which when mined by Pilgrims provide either Karbonite, which is used to construct units, or Fuel, which is used to run them. Once mined, these resources can be transferred between units and deposited for global usage at Castles or Churches. Before being deposited at a Castle or Church, resources are unrefined, and cannot be utilized. Almost any action in Battlecode Crusade consumes either Karbonite or Fuel, all from the global refined stores. Note that rather than being distributed evenly, Karbonite and Fuel depots are usually found in small discrete clumps on the map. In addition to the resources teams start with and mine, at every round each team receives 25 fuel.  
  
Robots have knowledge of the full map at the beginning of the game (including resource depots), and can only see robots within their vision radius.  

## Units
Unlike last year’s Battlecode game, each unit is controlled by its own process. Each unit is initialized with a 100ms chess clock, and receives 20ms of additional computation each round. Each turn is additionally capped at 200ms, after which code will be stopped. If a robot exceeds its chess clock, it cannot move until it has > 0 time in its clock.  
  
When a unit is spawned, it is assigned a unique 32 bit integer ID, and always occupies a single tile. When the health of a unit is reduced to 0, the unit is immediately removed from the game.  
  
There are two types of units: robots and structures. Robots are mobile units that fight, move, build factories, carry resources, or mine fuel and karbonite from the map. There are two types of structures: Castles and Churches. Castles are like Churches that cannot be created and carry special abilities. Churches produce robots, and provide a depot for Pilgrims to deposit resources into the global economy.  
  
**Castles**  
Each team starts with 1-3 castles on the map, each with initial health 200 and vision radius 100. Castles have all the abilities of Churches, but cannot be built, and have greater health. Castles can also attack units within a 64 r^2 distance at 10 damage for 10 fuel. Castles also have unique communication abilities; not only can all units send messages to Castles for free (discussed in the Communication section), but Castles can also trade Karbonite and Fuel with opposing team castles.  
  
Each turn, a castle can offer a Barter to a castle of the opposing team. Barters are offers to trade X Karbonite for Y Fuel (or vice versa). Players can use this functionality to collaborate with the opposing team for mutual benefit.  
  
When all of a team’s castles are destroyed, the team is considered defeated.  
  
**Churches**  
Churches are structures with the ability to produce robots for their Karbonite and Fuel cost. In any given turn a church or castle can spawn a robot in any adjacent square (where adjacent is defined to include diagonals), with that robot added to the end of the turn queue. Robots adjacent to churches and castles in their turn can deposit Fuel and Karbonite, adding those resources to the team’s global stores.  
  
Churches can be constructed by Pilgrims for 50 Karbonite and 200 Fuel, and have an initial starting health of 100 and a vision radius of 100.  
  
**Robots**  
There are four classes of robots: Pilgrims, Crusaders, Prophets, and Preachers. Pilgrims are scouting, mining, and building robots, while the other robots are only capable of combat and resource transportation.  

## Communication
There are two types of communication: signal and castleTalk. signal uses fuel to send a 16 bit message to all units within a variable radius. castleTalk sends an 8 bit message to the unit's team's castles for free. Units can communicate while simultaneously performing other actions.
