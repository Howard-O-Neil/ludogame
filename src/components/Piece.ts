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
    // this.velocity = new CANNON.Vec3(0, 0, 0);
    this.position = new CANNON.Vec3(...position);
    this.color = color;
    this.mass = 5;
  }

  initObject = async () => {
    const baseGeometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: this.active ? "purple" : this.color,
      clearcoat: 1,
      clearcoatRoughness: 0
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.fromArray([0, 1, 0]); // sphere on top
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;

    const topGeometry = new THREE.CylinderBufferGeometry(
      ...Object.values(this.args)
    );
    const topMesh = new THREE.Mesh(topGeometry, baseMaterial);
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;

    this.mesh.push(baseMesh);
    this.mesh.push(topMesh);
    
    this.mainModel = new THREE.Group();
    this.mainModel.position.fromArray(Object.values(this.position));
    this.mainModel.receiveShadow = true;

    for (const mesh of this.mesh) {
      this.mainModel.add(mesh);
    }

    this.rigidBody = createRigidBodyForGroup(<THREE.Group>this.mainModel, {
      mass: this.mass,
      position: this.position,
    });
    this.world.addBody(this.rigidBody);

    document.addEventListener('keydown', ev => {
      this.keyboardHandle(ev);
    })
  }

  keyboardHandle = (ev: KeyboardEvent) => {
    if (ev.key === 'j') {
      this.launch(new CANNON.Vec3(10, 20, 20));
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
