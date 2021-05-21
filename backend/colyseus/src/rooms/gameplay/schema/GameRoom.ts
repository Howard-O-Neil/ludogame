import { ListRoute } from './ListRoute';
import { ListPiece } from './ListPiece';
import { Piece } from './Piece';
import { User } from './User';
import { Camera } from './Camera';
import { Dice } from './Dice';
import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";
import { v4 } from 'uuid';
import * as _ from 'lodash';
import { BoardBase, BoardCommonPath, BoardFinalPath, BoardColors } from './BoardData';

interface ClientGameState {
  dices: Dice[];
}

// 4 slot on each gameplay
export class GameRoom extends Schema {
  @type('string')
  private roomId: string;

  @type([Dice])
  private dices: Dice[];

  @type([ListPiece])
  private listPiece: ListPiece[];

  @type([ListRoute])
  private listCommonRoutes: ListRoute[];

  @type([ListRoute])
  private listFinalRoutes: ListRoute[];

  @type([Camera])
  private cameras: Camera[];

  @type([User])
  private slots: User[];

  @type('number')
  private currentTurn;

  @type('boolean')
  private gameEnd: boolean;

  @type('number')
  private dice1;

  @type('number')
  private dice2;

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

  public getUserJoinState = (id: string) => {
    const user = this.slots.find(x => x.id === id);
    return {
      user,
      cameraPos: this.cameras[user.order - 1]
    }
  }

  public getUserInRoom = () => {
    return {
      userList: this.slots,
    }
  }

  public updateDicePoint = (dice1: number, dice2: number) => {
    this.dice1 = dice1;
    this.dice2 = dice2;

    return {
      dice1: dice1,
      dice2: dice2
    }
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

  public getUserReadyState = (id: string) => {
    const user = this.getUserById(id);
    return {
      user,
      camera: this.getCameraPosition(id),
      commonPath: this.listCommonRoutes[user.order - 1],
      finalPath: this.listFinalRoutes[user.order - 1],
      pieces: this.listPiece[user.order - 1]
    }
  }

  public getUserReady = () => {
    const userList = this.slots.filter(x => x.isReady);
    return {
      data: userList.map(x => this.getUserReadyState(x.id))
    }
  }

  public getUserTurnState = () => {
    if (this.currentTurn === -1)
      this.currentTurn = 0;
    else {
      this.currentTurn += 1;
      if (this.currentTurn >= this.slots.length) {
        this.currentTurn = 0;
      }
    }

    console.log(this.slots[this.currentTurn].id, "turn...");

    return {
      order: this.currentTurn,
      userId: this.slots[this.currentTurn].id,
      camera: this.cameras[this.currentTurn],
    }
  }

  // public getUserInitGameState = () => {
  //   let rand = Math.floor(Math.random() * this.slots.length) + 1

  //   const id = this.slots[rand - 1].id;
  //   return {
  //     dices: this.getDice()
  //   }
  // }

  public getDice = (userId) => {
    return {
      dice: {
        rotation: {
          x: Math.random() * Math.PI * 2,
          y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI * 2,
        },
        angularVeloc: {
          x: Math.random() * Math.PI * 2,
          y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI * 2,
        }
      },
      camera: this.cameras[this.slots.find(x => x.id === userId).order - 1],
    };
  }

  public userReadyToPlay = () => {
    if (this.slots.length < 1)
      return false;
    return this.slots.findIndex(x => x.isReady === false) === -1;
  }

  public updatePiece = (mess: any) => {
    let userIndex = this.slots.findIndex(x => x.id === mess.id);
    const piece = this.listPiece[userIndex].data.find(x => x.order === mess.order);
    piece.targetPoint = mess.targetPoint;
    piece.prevStep = mess.prevStep;
    piece.nextStep = mess.nextStep;
    piece.goal = mess.goal;
    piece.isReturn = mess.isReturn;
    piece.atBase = mess.atBase;

    return {
      userId: mess.id,
      data: piece
    };
  }

  // init gameState
  // set exact value
  constructor() {
    super();

    this.dice1 = this.dice2 = 0;
    this.currentTurn = -1;
    this.roomId = v4();
    this.slots = [];
    this.cameras = [];
    this.dices = [];
    this.listCommonRoutes = [];
    this.listPiece = [];
    this.listFinalRoutes = [];
    this.cameras.push(new Camera(new Vec3(15, 12, 15)));
    this.cameras.push(new Camera(new Vec3(15, 12, -15)));
    this.cameras.push(new Camera(new Vec3(-15, 12, -15)));
    this.cameras.push(new Camera(new Vec3(-15, 12, 15)));

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

    for (let i = 0; i < BoardCommonPath.length; i += 13) {
      const startArr = <[number[]]>BoardCommonPath.slice(i, BoardCommonPath.length);
      if (startArr.length < 52) {
        startArr.push(...<[number[]]>BoardCommonPath.slice(0, 52 - startArr.length));
      }

      this.listCommonRoutes.push(new ListRoute(startArr));
    }

    for (let i = 0; i < BoardBase.length; i += 4) {
      let colorCode = BoardColors[parseInt((i / 4).toString())];

      this.listPiece.push(
        new ListPiece(<[number[]]>BoardBase.slice(i, i + 4), colorCode));
    }

    for (const node of BoardFinalPath) {
      this.listFinalRoutes.push(
        new ListRoute(<[number[]]>node));
    }

    this.gameEnd = false;
  }
}
