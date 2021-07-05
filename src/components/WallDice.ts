import { collisionTags, collisionGroups } from '../collisionTag';
import { createRigidBodyForGroup, convertToCannonQuaternion } from '../utils';
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GameObject from "./GameObject";
import { convertToCannonVec3, createShapeForMesh } from "../utils";
import { cannonTypeMaterials } from '../main';

export default class WallDice extends GameObject {
  constructor(world) {
    super();
    this.world = world;
  }

  childNode = ['ludoludo4_ludolambert3_0'];
  txtNode = ['mainTxt'];

  loadResource = async () => {
    
  }

  initObject = async () => {
    await this.loadResource();

    const listMesh: THREE.Mesh[] = [];

    let scale = 3;
    let heightlistMesh = 5;
    const opaqueMaterial = new THREE.MeshBasicMaterial({
      transparent: false, visible: false
    });

    const glassMaterial = new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0.3, color: '0x171e1e'
    });
      
    
    let index = 0;
    listMesh.push(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.05), opaqueMaterial));
    listMesh[index].rotation.fromArray([Math.PI / 2, Math.PI / 2, 0]); 
    listMesh[index++].position.fromArray([2.25 + scale, heightlistMesh, 0.15]);

    listMesh.push(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.05), opaqueMaterial));
    listMesh[index].rotation.fromArray([Math.PI / 2, -Math.PI / 2, 0]); 
    listMesh[index++].position.fromArray([-2.25 - scale, heightlistMesh, 0.15]);
    
    listMesh.push(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.05), opaqueMaterial));
    listMesh[index].rotation.fromArray([0, 0, 0]); 
    listMesh[index++].position.fromArray([0, heightlistMesh, 2.35 + scale]);
  
    listMesh.push(new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.05), opaqueMaterial));
    listMesh[index].rotation.fromArray([0, 0, 0]); 
    listMesh[index++].position.fromArray([0, heightlistMesh, -2.15 - scale]);

    listMesh.push(new THREE.Mesh(new THREE.BoxGeometry(5, 0.05, 5), glassMaterial))
    listMesh[index++].position.fromArray([0.15, 8, 0.15]);

    this.addMesh(...listMesh);
    this.initScale(...[2, 2, 2]);
    this.initRigidBody(cannonTypeMaterials['ground']);
    this.rigidBody.collisionFilterMask = collisionGroups.dice;

    this.setRotation(new CANNON.Vec3(0, Math.PI / 4, 0));

    this.rigidBody['tag'] = collisionTags.wall;
    // this.setQuaternion(new CANNON.Quaternion(0, 0, Math.PI / 2, 1));
    // this.setSpaceFriction(0.01);
  }

  keyboardHandle = (table) => {
    this.rigidBody.wakeUp(); // very important

    let keycode = require('keycode');
    if (table[keycode('a')]) {
      alert(this.rigidBody.quaternion);
    }
  }

  update = () => {
    // update rigidBody upon value from object

    this.rigidBody.position.copy(this.position); // stand still

    // this.applyFriction();
    this.mainModel.position.fromArray(Object.values(this.rigidBody.position));
    this.mainModel.quaternion.fromArray(Object.values(this.rigidBody.quaternion));
  }

  getMesh = async () => {
    await this.initObject();
  
    return this.mainModel;
  }
}
