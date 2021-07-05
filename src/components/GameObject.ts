import { GRAVITY } from './../main';
import { ShapeOptions } from './Graphic/ThreeToCannon';
import { type } from '@colyseus/schema';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { convertToCannonVec3, createRigidBodyForGroup } from './../utils';
import * as CANNON from "cannon-es";
import * as THREE from "three";

export default class GameObject {
  geometry: Map<string, THREE.BufferGeometry>;
  material: Map<string, THREE.Material>;
  texture: Map<string, THREE.Texture>;
  scale: CANNON.Vec3;
  rotation: CANNON.Vec3;
  position: CANNON.Vec3;
  quaternion: CANNON.Quaternion;
  size: CANNON.Vec3;
  world: CANNON.World
  spaceFriction: number;
  mass: number;
  rigidBody: CANNON.Body;
  // velocity: CANNON.Vec3;
  // mesh: THREE.Mesh[];
  mainModel: THREE.Group;
  collisionTag: string;
  
  constructor() {
    this.size = new CANNON.Vec3();
    this.scale = new CANNON.Vec3(1, 1, 1);
    this.rotation = new CANNON.Vec3();
    this.position = new CANNON.Vec3();

    this.geometry = new Map();
    this.material = new Map();
    this.texture = new Map();

    this.mainModel = new THREE.Group();
    this.mainModel.receiveShadow = false;

    // this.mesh = [];
  }

  getMesh: () => Promise<any>; // abstract function
  update; // abstract function
  initObject; // abstract function
  keyboardHandle; // abstract function

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
    this.rigidBody.velocity.set(velocity.x, velocity.y, velocity.z);
  }

  setPosition = (position: CANNON.Vec3) => {
    this.position = position;
    this.rigidBody.position.set(position.x, position.y, position.z);
  }

  setAngularVelocity = (velocity: CANNON.Vec3) => {
    this.rigidBody.angularVelocity.set(velocity.x, velocity.y, velocity.z);
  }

  setRotation = (rotation: CANNON.Vec3) => {
    let quatX = new CANNON.Quaternion();
    let quatY = new CANNON.Quaternion();
    let quatZ = new CANNON.Quaternion();

    quatX.setFromAxisAngle(new CANNON.Vec3(1,0,0), rotation.x);
    quatY.setFromAxisAngle(new CANNON.Vec3(0,1,0), rotation.y);
    quatZ.setFromAxisAngle(new CANNON.Vec3(0,0,1), rotation.z);

    let quaternion = quatX.mult(quatY).mult(quatZ);
    this.rigidBody.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  setQuaternion = (quaternion: CANNON.Quaternion) => {
    this.rigidBody.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  initScale = (x?: number, y?: number, z?: number) => {
    for (const child of this.mainModel.children) {
      const mesh = <THREE.Mesh>child;
      mesh.geometry.scale(x, y, z);
    }
  }

  initRigidBody = (shapeOptions: ShapeOptions = {}, material?: CANNON.Material) => {
    this.rigidBody = createRigidBodyForGroup(<THREE.Group>this.mainModel, {
      mass: this.mass,
      position: new CANNON.Vec3(this.position.x, this.position.y *  0.5, this.position.z),
      material: material,
    }, shapeOptions);
    this.world.addBody(this.rigidBody);
  }

  setSpaceFriction = (val: number) => {
    this.spaceFriction = val;
  }

  resetRigidBody = (shapeOptions: ShapeOptions = {}) => {
    const oldRigid = this.rigidBody;
    
    this.rigidBody = createRigidBodyForGroup(<THREE.Group>this.mainModel, {
      position: oldRigid.position,
      velocity: oldRigid.velocity,
      quaternion: oldRigid.quaternion,
      mass: oldRigid.mass,
      material: oldRigid.material,
    }, shapeOptions);
    this.world.removeBody(oldRigid);
    this.world.addBody(this.rigidBody);
  }

  addMesh = (...meshes: THREE.Mesh[]) => {
    for (const mesh of meshes) {
      mesh.geometry.center(); // very important
      this.mainModel.add(mesh);
    }
  }

  centerMesh = () => {
    for (const mesh of <THREE.Mesh[]>this.mainModel.children) {
      mesh.geometry.center(); // very important
      mesh.geometry.rotateX(0);
      mesh.geometry.rotateY(0);
      mesh.geometry.rotateZ(0);
      mesh.quaternion.set(0, 0, 0, 1);
      mesh.rotation.set(0, 0, 0, "XYZ");
    }
    this.mainModel.rotation.set(0, 0, 0, "XYZ");
    this.mainModel.quaternion.set(0, 0, 0, 1);
  }

  velocityToTarget = (targetPos: CANNON.Vec3, shootingHeight: number): CANNON.Vec3 => {
    let distanceY = targetPos.y - this.position.y;
    let h = distanceY + shootingHeight;
    let distanceXZ = new CANNON.Vec3(targetPos.x - this.position.x, 0, targetPos.z - this.position.z);

    if (distanceY <= 0) {
      h = this.position.y + shootingHeight;
      const velocity = this.calculateBallisticsVelocity_targetBelow(distanceXZ, distanceY, h, GRAVITY);

      return velocity;
    }

    return this.calculateBallisticsVelocity_targetAbove(distanceXZ, distanceY, h, GRAVITY);
  }

  calculateBallisticsVelocity_targetAbove = (distanceXZ: CANNON.Vec3, py: number, h: number, gravity: number): CANNON.Vec3 => {
    const fxz = distanceXZ.scale(1 / (Math.sqrt( (-2 * h) / gravity ) + Math.sqrt( (2 * (py - h)) / gravity )));
    const fy = (new CANNON.Vec3(0, 1, 0)).scale(Math.sqrt( -2 * gravity * h));
    return fxz.vadd(fy).scale(-1 * Math.sign(gravity));
  }

  calculateBallisticsVelocity_targetBelow = (distanceXZ: CANNON.Vec3, py: number, h: number, gravity: number): CANNON.Vec3 => {
    const fxz = distanceXZ.scale(1 / (Math.sqrt( (-2 * h) / gravity ) + Math.sqrt( (-2 * (py + h)) / gravity )));
    const fy = (new CANNON.Vec3(0, 1, 0)).scale(Math.sqrt( -2 * gravity * (h + py)));
    return fxz.vadd(fy).scale(-1 * Math.sign(gravity));
  }

  upFrictionX = true;
  upFrictionZ = true;

  applyFriction = () =>  {
    const spaceFrictionRatio = 80;
    if (this.rigidBody) {
      if (this.upFrictionX) this.rigidBody.velocity.x += this.spaceFriction / spaceFrictionRatio;
      else this.rigidBody.velocity.x -= this.spaceFriction / spaceFrictionRatio;

      if (this.upFrictionZ) this.rigidBody.velocity.z += this.spaceFriction / spaceFrictionRatio;
      else this.rigidBody.velocity.z -= this.spaceFriction / spaceFrictionRatio;

      if (this.rigidBody.velocity.x <= -this.spaceFriction) {
        this.rigidBody.velocity.x += this.spaceFriction / spaceFrictionRatio;
        this.upFrictionX = true;
      }
      if (this.rigidBody.velocity.x >= this.spaceFriction) {
        this.rigidBody.velocity.x -= this.spaceFriction / spaceFrictionRatio;
        this.upFrictionX = false;
      }
      if (this.rigidBody.velocity.z <= -this.spaceFriction) {
        this.rigidBody.velocity.z += this.spaceFriction / spaceFrictionRatio;
        this.upFrictionZ = true;
      }
      if (this.rigidBody.velocity.z >= this.spaceFriction) {
        this.rigidBody.velocity.z -= this.spaceFriction / spaceFrictionRatio;
        this.upFrictionZ = false;
      }
    }
  }

  applyScale = (x?: number, y?: number, z?: number, shapeOptions: ShapeOptions = {}) => {
    this.scale.x *= x;
    this.scale.y *= y;
    this.scale.z *= z;

    for (const child of this.mainModel.children) {
      const mesh = <THREE.Mesh>child;
      // console.log(mesh.geometn.z ry.type);
      mesh.position.set(
        (mesh.position.x * x),
        (mesh.position.y * y),
        (mesh.position.z * z),
      );

      mesh.geometry.scale(x, y, z);
    }
    this.resetRigidBody(shapeOptions);
  }
}
