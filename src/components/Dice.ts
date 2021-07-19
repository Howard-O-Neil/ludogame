import { collisionGroups, collisionTags } from './../collisionTag';
import { convertToCannonVec3, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import GameObject from "./GameObject";
import { cannonTypeMaterials } from '../main';
import { DiceD6, DiceManager } from 'threejs-dice';

// props

export default class Dice extends GameObject {
  mass: number;
  readonly camera: THREE.Camera;
  world: CANNON.World;
  isTouchWall: boolean;
  isLaunch: boolean;

  childNode = ['ludoludo_ludoblinn6_0'];
  txtNode = ['mainTxt'];

  constructor(camera, world) {
    super();

    this.mass = 500;
    this.camera = camera;
    this.world = world;
    this.isTouchWall = false;
    this.isLaunch = false;

    this.position = new CANNON.Vec3();

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
    this.initScale(...[2, 2, 2]);
    this.initRigidBody(cannonTypeMaterials['ground']);
    this.rigidBody.collisionFilterGroup = collisionGroups.dice;

    // this.rigidBody.id = 1;

    this.rigidBody.addEventListener('collide', (ev) => {
      if (ev.body['tag'] === collisionTags.wall) {
        const oldSpeed = (Math.abs(this.rigidBody.velocity.x)
          + Math.abs(this.rigidBody.velocity.z)
          + Math.abs(this.rigidBody.velocity.y)) / 3;

        this.rigidBody.velocity.set(
          -Math.sign(this.rigidBody.velocity.x) * 2, 
          -oldSpeed,
          -Math.sign(this.rigidBody.velocity.z) * 2);

        this.isTouchWall = true;

      } else this.isTouchWall = false;
      // if (body.id === 1) {
      //   alert('boom');
      // }
    })
  }

  keyboardHandle = (table) => {
    
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
