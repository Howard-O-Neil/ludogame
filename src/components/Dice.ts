import { convertToCannonVec3, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import GameObject from "./GameObject";
import { cannonTypeMaterials } from '../main';

// props

export default class Dice extends GameObject {
  mass: number;
  readonly camera: THREE.Camera;
  world: CANNON.World;

  childNode = ['ludoludo_ludoblinn6_0'];
  txtNode = ['mainTxt'];

  constructor(position, scale, camera, world) {
    super();

    this.mass = 500;
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
    listMesh[0].receiveShadow = false;
    
    this.addMesh(...listMesh);
    this.initScale(...Object.values(this.scale));
    this.initRigidBody(cannonTypeMaterials['slippery']);

    // this.rigidBody.id = 1;

    this.rigidBody.addEventListener('collide', (ev) => {
      console.log(ev.body.id);
      // if (body.id === 1) {
      //   alert('boom');
      // }
    })
  }

  keyboardHandle = (table) => {
    this.rigidBody.wakeUp(); // very important

    let keycode = require('keycode');
    if (table[keycode('space')]) {
      const vecFrom = convertToCannonVec3(this.camera.position);
      vecFrom.y -= 10;

      this.setPosition(vecFrom);
      this.setRotation(new CANNON.Vec3(-Math.PI / 4, 0, Math.PI / 4));
      this.setAngularVelocity(new CANNON.Vec3(30, 10, 10));
      // this.launch(new CANNON.Vec3(this.camera.position.x * -1, 10, this.camera.position.z * -1));
      this.launch(this.velocityToTarget(new CANNON.Vec3(0, 5, 0), 15));
      
    } else if (table[keycode('q')]) {
      alert(this.rigidBody.quaternion.toAxisAngle(new CANNON.Vec3(1, 0, 0))[1] * (180/Math.PI));
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
