import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";

export class Dice extends Schema {
  @type(Vec3)
  position: Vec3;
  
  @type(Vec3)
  velocity: Vec3;
  
  @type(Vec3)
  rotation: Vec3;

  @type(Vec3)
  angularVeloc: Vec3;

  @type(Vec3)
  scale: Vec3;

  constructor(position: Vec3, velocity: Vec3, rotation: Vec3, scale: Vec3) {
    super();
    
    this.position = position;
    this.velocity = velocity;
    this.rotation = rotation;
    this.scale = scale
  }
}
