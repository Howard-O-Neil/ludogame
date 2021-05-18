import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";

export class Piece extends Schema {
  @type(Vec3)
  initPosition: Vec3;

  @type('string')
  color: string;
  
  @type('number')
  step: number;

  constructor(initPosition: Vec3, color: string, step: number) {
    super();
    
    this.initPosition = initPosition;
    this.color = color;
    this.step = step;
  }
}
