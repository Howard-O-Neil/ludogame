import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";
import { Piece } from './Piece';

export class ListPiece extends Schema {
  @type([Piece])
  data: Piece[];

  constructor(listPos: any[], color: string) {
    super();

    this.data = [];

    let index = 0;
    for (const pos of <[number[]]>listPos) {
      this.data.push(
        new Piece(
          new Vec3(...Object.values(pos)), color, index++
        )
      )
    }
  }
}
