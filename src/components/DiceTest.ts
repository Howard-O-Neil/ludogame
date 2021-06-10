import { randomAngularVeloc, randomRotation } from './../utils';
import * as DM from '../lib/dice.js' // Dice Manager
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import GameObject from './GameObject.js'
import { convertToCannonVec3, convertToThreeVec3 } from '../utils.js';
import { collisionTags } from '../collisionTag';
import { state } from '../gameplayHandler';
import { RollDicePoint } from '../gameEvent';

export default class DiceTest extends GameObject {
  readonly camera: THREE.Camera;
  world: CANNON.World;
  listDice: DM.DiceD6[];

  checkDicePoint

  constructor(camera, world, scene) {
    super();

    this.camera = camera;
    this.world = world;

    DM.DiceManager.setWorld(this.world)

    this.listDice = [];
    for (let i = 0; i < 2; i++) {
      this.listDice.push(new DM.DiceD6({backColor: '#ff0000'}))
    }
  }

  initObject = async () => {
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].getBody().addEventListener('collide', (ev) => {
        if (ev.body['tag'] === collisionTags.wall) {
          const oldSpeed = (Math.abs(this.rigidBody.velocity.x)
            + Math.abs(this.rigidBody.velocity.z)
            + Math.abs(this.rigidBody.velocity.y)) / 3;
  
          this.rigidBody.velocity.set(
            -Math.sign(this.rigidBody.velocity.x) * 2, 
            -oldSpeed,
            -Math.sign(this.rigidBody.velocity.z) * 2);
  
          this.listDice[i].isTouchWall = true;
  
        } else this.listDice[i].isTouchWall = false;
      })
    }
  }

  throwDice = (dices: any) => {
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].getObject().visible = true;
      this.listDice[i].getBody().wakeUp();

      this.listDice[i].getBody().position.set(
        dices[i].position.x, dices[i].position.y,
        dices[i].position.z);
      
      let quaternion = this.setRotationReturnVal(new CANNON.Vec3(
        dices[i].rotation.x, dices[i].rotation.y,
        dices[i].rotation.z));
      this.listDice[i].getBody().quaternion.set(
        quaternion.x, quaternion.y, quaternion.z, quaternion.w);

      this.listDice[i].getBody().angularVelocity.set(
        dices[i].angularVeloc.x, dices[i].angularVeloc.y,
        dices[i].angularVeloc.z);
        
      this.listDice[i].getBody().velocity.set(
        dices[i].velocity.x, dices[i].velocity.y, dices[i].velocity.z);
        
      this.listDice[i].isLaunch = true;
      this.listDice[i].isTouchWall = false;
      this.checkDicePoint = false;
    }
  }

  keyboardHandle = (table) => {
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].getBody().wakeUp();
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

      const condition = dice.isTouchWall == true && dice.isLaunch == true;
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
}