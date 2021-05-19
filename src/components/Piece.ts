import { convertToThreeVec3, createRigidBodyForGroup } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { cannonTypeMaterials, CyclinderBasicParam } from "../main";
import GameObject from "./GameObject";

// 0.08, 0.7, 2, 50
// assume 4 con số trên là của cyclinder 

export default class Piece extends GameObject {
  args: CyclinderBasicParam;
  active: boolean;
  color: string;

  initPosition: CANNON.Vec3; // position x, y, z
  prevStep: number;
  nextStep: number;
  isReturn: boolean;
  order: number;


  constructor(color: string, order: number, args: CyclinderBasicParam, position: number[], world: CANNON.World) {
    super();

    this.world = world;
    this.args = args;
    this.position = new CANNON.Vec3(...position);
    this.initPosition = new CANNON.Vec3(...position);
    this.prevStep = 0;
    this.nextStep = -1;
    this.isReturn = false;
    this.color = color;
    this.order = order;
    this.mass = 5000;
  }

  initObject = async () => {
    const listMesh: THREE.Mesh[] = [];
    
    const baseGeometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: this.active ? "purple" : this.color,
      clearcoat: 1,
      clearcoatRoughness: 0
    });

    listMesh.push(new THREE.Mesh(baseGeometry, baseMaterial));
    listMesh[0].position.add(new THREE.Vector3(0, 1, 0)); // sphere on top
    listMesh[0].receiveShadow = false;
    listMesh[0].castShadow = false;

    const topGeometry = new THREE.CylinderBufferGeometry(
      ...Object.values(this.args)
    );
    listMesh.push(new THREE.Mesh(topGeometry, baseMaterial));
    listMesh[1].receiveShadow = false;
    listMesh[1].castShadow = false;

    this.addMesh(...listMesh);
    this.initRigidBody(cannonTypeMaterials['ground']);
  }

  keyboardHandle = (table) => {
    this.rigidBody.wakeUp(); // very important
    
    let keycode = require('keycode');
    if (table[keycode('e')]) {
      this.launch(new CANNON.Vec3(0, 30, -30));
    } else if (table[keycode('w')]) {
      this.applyScale(-2, 2, 2);
    } else if (table[keycode('a')]) {
      alert(this.rigidBody.velocity);
    }
  }

  update = () => {
    // update rigidBody upon value from object

    this.mainModel.position.fromArray(Object.values(this.rigidBody.position));
    this.mainModel.quaternion.fromArray(Object.values(this.rigidBody.quaternion));
  }

  getMesh = async () => {
    await this.initObject();

    return this.mainModel;
  }
}
