export default class GameObject {
  geometry: any;
  material: any;
  texture: any;
  scale: number[];
  rotation: number[];
  position: number[];
  
  constructor() {
    this.scale = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.position = [0, 0, 0];
  }

  getMesh;
}
