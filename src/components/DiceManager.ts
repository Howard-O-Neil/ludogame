import { displayToolBoxOnState, state } from './../gameplayHandler';
import { convertToCannonVec3, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion, velocityNearlyStop } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import GameObject from "./GameObject";
import { cannonTypeMaterials } from '../main';
import Dice from './Dice';
import { RollDicePoint } from '../gameEvent';

// props

export default class DiceManager extends GameObject {
  readonly camera: THREE.Camera;
  world: CANNON.World;
  listDice: Dice[];

  checkDicePoint: boolean;

  constructor(camera, world) {
    super();

    this.camera = camera;
    this.world = world;

    this.listDice = [];
    this.checkDicePoint = false;
    for (let i = 0; i < 2; i++) {
      this.listDice.push(new Dice(
        this.camera, this.world
      ))
    }
  }

  throwDice = (dices: any) => {
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].mainModel.visible = true;
      this.listDice[i].rigidBody.wakeUp();

      this.listDice[i].rigidBody.position.set(
        dices[i].position.x, dices[i].position.y,
        dices[i].position.z);
      
      let quaternion = this.setRotationReturnVal(new CANNON.Vec3(
        dices[i].rotation.x, dices[i].rotation.y,
        dices[i].rotation.z));
      this.listDice[i].rigidBody.quaternion.set(
        quaternion.x, quaternion.y, quaternion.z, quaternion.w);

      this.listDice[i].rigidBody.angularVelocity.set(
        dices[i].angularVeloc.x, dices[i].angularVeloc.y,
        dices[i].angularVeloc.z);
        
      this.listDice[i].rigidBody.velocity.set(
        dices[i].velocity.x, dices[i].velocity.y, dices[i].velocity.z);
        
      this.listDice[i].isLaunch = true;
      this.listDice[i].isTouchWall = false;
      this.checkDicePoint = false;
    }
  }

  keyboardHandle = (table) => {
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].rigidBody.wakeUp();
    }

    // let keycode = require('keycode');
    // if (table[keycode('space')]) {
    //   this.throwDice();
    // }
  }

  handleGetPointFromDice = () => {
    let flag: boolean = true;

    if (this.checkDicePoint) {
      return;
    }

    for (let i = 0; i < this.listDice.length; i++) {
      const dice = this.listDice[i];

      const condition = dice.isTouchWall == true && dice.isLaunch == true &&
        this.listDice.filter(x => velocityNearlyStop(x.rigidBody.velocity)).length >= 2;
      if (!condition) {        
        flag = false; 
      }
    }

    if (flag) {
      this.checkDicePoint = true;

      state.getGameRoom().send(RollDicePoint, {
        dice1: Math.floor(Math.random() * 6) + 1,
        dice2: Math.floor(Math.random() * 6) + 1,
      }) 
    }
  }

  update = () => {
    this.handleGetPointFromDice();

    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].update();
    }

    // console.log(this.rigidBody.velocity);
  }

  getMesh = async () => {
    
    const listMesh = [];
    for (const dice of this.listDice) {
      listMesh.push(await dice.getMesh());
      dice.setPosition(new CANNON.Vec3(0, 10, 0));
    }
  
    return listMesh;
  }
}
