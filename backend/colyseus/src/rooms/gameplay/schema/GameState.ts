import { IResponse } from './../../../IResponse';
import { GameRoom } from './GameRoom';
import { Camera } from './Camera';
import { Dice } from './Dice';
import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";
import _ from 'lodash';

interface RoomClient {
  roomId: string,
  slots: string[],
}

// 4 slot on each gameplay
export class GameState extends Schema {

  @type([GameRoom])
  listGameRoom: GameRoom[];

  public getListAvailableRoom = (): IResponse<RoomClient[]> => {
    return {
      data: this.listGameRoom
        .map(x => {
          return {
            roomId: x.roomId,
            slots: x.slots.map(x1 => x1.id),
          }
        }),
    };
  }

  // init gameState
  // set exact value
  constructor() {
    super();

    this.listGameRoom = [];
  }
}
