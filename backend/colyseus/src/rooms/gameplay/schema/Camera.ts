import { Vec3 } from './Vec3';
import { Schema, Context, type } from "@colyseus/schema";

export class Camera extends Schema {
  @type(Vec3)
  position: Vec3;

  constructor(vec3: Vec3) {
    super();

    this.position = vec3;
  }
}
