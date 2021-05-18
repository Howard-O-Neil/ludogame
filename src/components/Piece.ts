import { convertToThreeVec3, createRigidBodyForGroup } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { CyclinderBasicParam } from "../main";
import GameObject from "./GameObject";

// 0.08, 0.7, 2, 50
// assume 4 con số trên là của cyclinder 

export default class Piece extends GameObject {
  args: CyclinderBasicParam;
  active: boolean;
  color: string;

  constructor(color: string, args: CyclinderBasicParam, position: number[], world: CANNON.World) {
    super();

    this.world = world;
    this.args = args;
    this.position = new CANNON.Vec3(...position);
    this.color = color;
    this.mass = 5;
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
    listMesh[0].receiveShadow = true;
    listMesh[0].castShadow = true;

    const topGeometry = new THREE.CylinderBufferGeometry(
      ...Object.values(this.args)
    );
    listMesh.push(new THREE.Mesh(topGeometry, baseMaterial));
    listMesh[1].receiveShadow = true;
    listMesh[1].castShadow = true;

    this.addMesh(...listMesh);
    this.initRigidBody();
  }

  keyboardHandle = (table) => {
    this.rigidBody.wakeUp(); // very important
    
    let keycode = require('keycode');
    if (table[keycode('e')]) {
      this.launch(new CANNON.Vec3(20, 30, 0));
    } else if (table[keycode('w')]) {
      this.applyScale(1, 2, 1);
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
