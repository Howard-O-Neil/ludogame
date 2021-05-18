import { Piece } from './Piece';
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
  private roomId: string;

  @type([Dice])
  private dices: Dice[];

  @type([[Piece]])
  private pieces: Piece[][];

  @type([Camera])
  private cameras: Camera[];

  @type([User])
  private slots: User[];

  @type('boolean')
  private gameplayProgressing: boolean;

  @type('boolean')
  private gameEnd: boolean;

  public addUser(user: User) {
    user.order = this.slots.length + 1;
    this.slots.push(user);
  }

  public getUserById = (id: string) => {
    return this.slots.find(x => x.id === id);
  }

  public getUserByClientId = (id: string) => {
    return this.slots.find(x => x.clientId === id);
  }

  public removeUserByClientId = (id: string) => {
    const temp = this.slots.find(x => x.clientId === id);
    const userIndex = this.slots.findIndex(x => x.clientId === id);
    this.slots.splice(userIndex, 1);
    return temp;
  }

  public isEmptyRoom = () => {
    return this.slots.length <= 1;
  }

  public setUserReady = (id: string, isReady: boolean) => {
    this.getUserById(id).isReady = isReady;
  }

  public getCameraPosition = (id: string) => {
    return this.cameras[this.slots.findIndex(x => x.id === id)];
  }

  public getUserInitGameState = (id: string) => {
    return {
      isReady: this.getUserById(id).isReady,
      camera: this.getCameraPosition(id),
      dices: this.getDice()
    }
  }

  public getDice = () => {
    return this.dices;
  }

  public userReadyToPlay = () => {
    return this.slots.findIndex(x => x.isReady === false) !== -1;
  }

  // init gameState
  // set exact value
  constructor() {
    super();

    this.roomId = v4();
    this.slots = [];
    this.cameras = [];
    this.dices = [];
    this.cameras.push(new Camera(new Vec3(-15, 12, -15)));
    this.cameras.push(new Camera(new Vec3(-15, 12, 15)));
    this.cameras.push(new Camera(new Vec3(15, 12, -15)));
    this.cameras.push(new Camera(new Vec3(15, 12, 15)));

    this.dices.push(new Dice(
      new Vec3(-2, 10, 0),
      new Vec3(0, 0, 0),
      new Vec3(0, 0, 0),
      new Vec3(2, 2, 2),
    ));

    this.dices.push(new Dice(
      new Vec3(1, 10, 0),
      new Vec3(0, 0, 0),
      new Vec3(0, 0, 0),
      new Vec3(2, 2, 2),
    ));

    this.gameplayProgressing = false;
    this.gameEnd = false;
  }
}
