import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { convertToCannonVec3 } from './../utils';
import * as CANNON from "cannon-es";
import * as THREE from "three";

export default class GameObject {
  geometry: THREE.BufferGeometry;
  material: any;
  texture: any;
  scale: CANNON.Vec3;
  rotation: CANNON.Vec3;
  position: CANNON.Vec3;
  quaternion: CANNON.Quaternion;
  size: CANNON.Vec3;
  world: CANNON.World
  mass: number;
  rigidBody: CANNON.Body;
  // velocity: CANNON.Vec3;
  // mesh: THREE.Mesh[];
  mainModel: THREE.Group;
  
  constructor() {
    this.size = new CANNON.Vec3();
    this.scale = new CANNON.Vec3();
    this.rotation = new CANNON.Vec3();
    this.position = new CANNON.Vec3();

    // this.mesh = [];
  }

  getMesh; // abstract function
  update; // abstract function
  initObject; // abstract function

  getBoxSize = (model: THREE.Mesh): CANNON.Vec3 => {
    const box = new THREE.Box3().setFromObject(model);
    return convertToCannonVec3(box.getSize(new THREE.Vector3()));
  }

  getSumMassGroup = (model: THREE.Group): number => {
    let sum = 0;
    for (const child of model.children) {
      if (child.type === 'Mesh') {
        sum += this.getSumMass(<THREE.Mesh>child);
      }
    }
    return 0;
  }

  getSumMass = (model: THREE.Mesh): number => {
    if (!model.geometry.boundingBox)
      model.geometry.computeBoundingBox();

    const size = model.geometry.boundingBox.getSize(new THREE.Vector3());
    return Math.abs(size.x) + Math.abs(size.y) + Math.abs(size.z);
  }

  launch = (velocity: CANNON.Vec3) => {
    this.rigidBody.velocity = velocity;
  }

  setPosition = (position: CANNON.Vec3) => {
    this.rigidBody.position = position;
  }

  applyScale = (x?: number, y?: number, z?: number) => {
    for (const child of this.mainModel.children) {
      const mesh = <THREE.Mesh>child;
      mesh.geometry.scale(x, y, z);
    }
  }
}
