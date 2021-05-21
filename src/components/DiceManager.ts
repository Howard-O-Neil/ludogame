import { displayToolBoxOnState, state } from './../gameplayHandler';
import { convertToCannonVec3, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion } from './../utils';
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

  throwDice = () => {
    const camPos = convertToCannonVec3(this.camera.position);
    camPos.y -= 5;

    let center = this.listDice.length % 2 == 0 ? ((this.listDice.length / 2) + 0.15) : this.listDice.length / 2;
    for (let i = 0; i < this.listDice.length; i++) {
      const t = camPos.clone();

      if (i + 1 < center) {
        t.x -= (i + 1) * 3;
        t.z -= (i + 1) * 3;
      } else if (i + 1 > center) {
        t.x += (i + 1) * 3;
        t.z += (i + 1) * 3;
      }

      this.listDice[i].setPosition(t);
      this.listDice[i].setRotation(new CANNON.Vec3(-Math.PI / 4, 0, Math.PI / 4));
      this.listDice[i].setAngularVelocity(new CANNON.Vec3(30, 10, 40));
      // this.launch(new CANNON.Vec3(this.camera.position.x * -1, 10, this.camera.position.z * -1));s

      if (this.camera.position.y <= -50) {
        this.listDice[i].launch(this.listDice[i].velocityToTarget(new CANNON.Vec3(0, 12, 0), 30));
      }
      else this.listDice[i].launch(this.listDice[i].velocityToTarget(new CANNON.Vec3(0, 12, 0), 5));

      this.listDice[i].isLaunch = true;
      this.checkDicePoint = false;
    }
  }

  throwDiceOnSchema = (diceSchema: any, camera: any) => {
    const camPos = new CANNON.Vec3(...<number[]>Object.values(camera.position));
    camPos.y -= 5;

    let center = this.listDice.length % 2 == 0 ? ((this.listDice.length / 2) + 0.15) : this.listDice.length / 2;
    for (let i = 0; i < this.listDice.length; i++) {
      const t = camPos.clone();

      if (i + 1 < center) {
        t.x -= (i + 1) * 3;
        t.z -= (i + 1) * 3;
      } else if (i + 1 > center) {
        t.x += (i + 1) * 3;
        t.z += (i + 1) * 3;
      }

      this.listDice[i].setPosition(t);
      this.listDice[i].setRotation(new CANNON.Vec3(...<number[]>Object.values(diceSchema.rotation)));
      this.listDice[i].setAngularVelocity(new CANNON.Vec3(...<number[]>Object.values(diceSchema.angularVeloc)));
      // this.launch(new CANNON.Vec3(this.camera.position.x * -1, 10, this.camera.position.z * -1));s

      if (this.camera.position.y <= -50) {
        this.listDice[i].launch(this.listDice[i].velocityToTarget(new CANNON.Vec3(0, 12, 0), 30));
      }
      else this.listDice[i].launch(this.listDice[i].velocityToTarget(new CANNON.Vec3(0, 12, 0), 5));

      this.listDice[i].isLaunch = true;
      this.checkDicePoint = false;
    }
  }

  keyboardHandle = (table) => {
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].rigidBody.wakeUp();
    }

    let keycode = require('keycode');
    if (table[keycode('space')]) {
      this.throwDice();
    }
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
