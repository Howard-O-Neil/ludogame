import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";
import { Piece } from './Piece';

export class ListRoute extends Schema {
  @type([Vec3])
  data: Vec3[];

  constructor(listPos: any[]) {
    super();
    
    this.data = [];
    for (const pos of <[number[]]>listPos) {
      this.data.push(new Vec3(...Object.values(pos)));
    }
  }
}
