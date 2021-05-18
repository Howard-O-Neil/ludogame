import { convertToCannonVec3, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion } from './../utils';
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

    this.mass = 30;
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
    
    this.addMesh(...listMesh);
    this.initScale(...Object.values(this.scale));
    this.initRigidBody();
  }

  keyboardHandle = (table) => {
    this.rigidBody.wakeUp(); // very important

    let keycode = require('keycode');
    if (table[keycode('space')]) {
      this.setPosition(convertToCannonVec3(this.camera.position));
      this.setRotation(new CANNON.Vec3(-Math.PI / 4, 0, Math.PI / 4));
      this.setAngularVelocity(new CANNON.Vec3(10, 10, 10));
      this.launch(new CANNON.Vec3(0, 10, -22));
    } else if (table[keycode('q')]) {
      console.log('cc');
      this.launch(new CANNON.Vec3(0, 10, -20));
    }
  }

  update = () => {
    // update rigidBody upon value from object

    this.mainModel.position.fromArray(Object.values(this.rigidBody.position));
    this.mainModel.quaternion.fromArray(Object.values(this.rigidBody.quaternion));

    // console.log(this.rigidBody.velocity);
  }

  getMesh = async () => {
    await this.initObject();
  
    return this.mainModel;
  }
}
