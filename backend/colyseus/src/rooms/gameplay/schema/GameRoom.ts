import { User } from './User';
import { Camera } from './Camera';
import { Dice } from './Dice';
import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";
import { v4 } from 'uuid';
import * as _ from 'lodash';

interface ClientGameState {
  dices: Dice[];
}

// 4 slot on each gameplay
export class GameRoom extends Schema {
  @type('string')
  roomId: string;

  @type([Dice])
  dices: Dice[];

  @type([Camera])
  cameras: Camera[];

  @type([User])
  slots: User[];

  @type('boolean')
  gameplayProgressing: boolean;

  @type('boolean')
  gameEnd: boolean;

  public getClientById = (id: string) => {
    return this.slots.find(x => x.id === id);
  }

  public getClientGameState = (): ClientGameState => {
    return {
      dices: this.dices
    };
  }

  public getCameraPosition = (id: string) => {
    return this.cameras[this.slots.findIndex(x => x.id === id)];
  }

  public userReadyToPlay = () => {
    return this.slots.findIndex(x => x.startPlaying === false) !== -1;
  }

  // init gameState
  // set exact value
  constructor() {
    super();

    this.roomId = v4();
    this.slots = [];
    this.cameras = [];
    this.dices = [];
    this.cameras.push(new Camera(new Vec3(-15, 12, 15)));
    this.cameras.push(new Camera(new Vec3(15, 12, 15)));
    this.cameras.push(new Camera(new Vec3(15, 12, -15)));
    this.cameras.push(new Camera(new Vec3(-15, 12, -15)));

    this.dices.push(new Dice(
      new Vec3(0, 10, 0),
      new Vec3(0, 0, 0),
      new Vec3(0, 0, 0),
      2
    ));

    this.dices.push(new Dice(
      new Vec3(5, 10, 0),
      new Vec3(0, 0, 0),
      new Vec3(0, 0, 0),
      2
    ));

    this.gameplayProgressing = false;
    this.gameEnd = false;
  }
}
