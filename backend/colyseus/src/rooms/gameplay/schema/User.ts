import { GameRoom } from './GameRoom';
import { Camera } from './Camera';
import { Dice } from './Dice';
import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";

// 4 slot on each gameplay
export class User extends Schema {

  @type('string')
  id: string;

  @type('boolean')
  startPlaying;

  // init gameState
  // set exact value
  constructor(id: string, play: boolean) {
    super();

    this.id = id;
    this.startPlaying = play;
  }
}
