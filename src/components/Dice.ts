import { convertToCannonVec3, createRigidBodyForMesh, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import GameObject from "./GameObject";

// props

export default class Dice extends GameObject {
  mass: number;
  readonly camera: THREE.Camera;
  world: CANNON.World;

  childNode = ['ludoludo_ludoblinn6_0'];
  txtNode = ['mainTxt'];

  constructor(position, scale, camera, world) {
    super();

    this.mass = 10;
    this.scale = new CANNON.Vec3(...scale);
    this.position = new CANNON.Vec3(...position);
    this.camera = camera;
    this.world = world;
    // this.rotation = new CANNON.Vec3(-Math.PI / 8, 0, 0);
  }

  loadResource = async () => {
    const loader = new GLTFLoader();

    const map = await loader.loadAsync("../models/board/scene.gltf");

    map.scene.traverse((child) => {
      if (child.name === this.childNode[0]) {
        this.geometry[this.childNode[0]] = child['geometry'];
        this.material[this.childNode[0]] = child['material'];
        return;
      }
    });    
  }

  initObject = async () =>  {
    await this.loadResource();

    const listMesh: THREE.Mesh[] = [];

    listMesh.push(new THREE.Mesh(this.geometry[this.childNode[0]], this.material[this.childNode[0]]));
    listMesh[0].receiveShadow = true;
    
    const mesh = new THREE.CylinderGeometry();
    this.addMesh(...listMesh);
    this.initScale(...[2, 2, 2]);
    this.initRigidBody();
  }

  keyboardHandle = (ev: KeyboardEvent) => {
    if (ev.key == 'r') {
      // 0this.setPosition(convertToCannonVec3(this.camera.position));
      this.launch(new CANNON.Vec3(0, 50, 0));
    } else if (ev.key == 'x') {
      this.applyScale(...[2, 2, 2]);
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
