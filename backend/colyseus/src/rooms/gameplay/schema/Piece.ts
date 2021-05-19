import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";

export class Piece extends Schema {
  @type('number')
  order: number;

  @type(Vec3)
  initPosition: Vec3;

  @type('string')
  color: string;
  
  @type('number')
  prevStep: number;

  @type('number')
  nextStep: number;

  @type('boolean')
  isReturn: boolean;

  constructor(initPosition: Vec3, color: string, order: number) {
    super();
    
    this.order = order;
    this.initPosition = initPosition; 
    this.color = color;
    this.prevStep = 0;
    this.nextStep = -1; // unknown
    this.isReturn = false;
  }
}
