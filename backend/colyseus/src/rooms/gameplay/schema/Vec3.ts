import { type } from '@colyseus/schema';
import { Schema } from '@colyseus/schema';

export class Vec3 extends Schema {
  @type('number')
  x: number;

  @type('number')
  y: number;

  @type('number')
  z: number;

  constructor(x?: number, y?: number, z?: number) {
    super();

    this.x = x;
    this.y = y;
    this.z = z;
  }
}