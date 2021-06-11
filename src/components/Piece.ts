import { state } from './../gameplayHandler';
import { collisionTags, collisionGroups } from './../collisionTag';
import { convertToThreeVec3, createRigidBodyForGroup } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { cannonTypeMaterials, CyclinderBasicParam } from "../main";
import GameObject from "./GameObject";
import { timers } from 'jquery';

// 0.08, 0.7, 2, 50
// assume 4 con số trên là của cyclinder 

export default class Piece extends GameObject {
  args: CyclinderBasicParam;
  active: boolean;

  color: string;
  selectColor: string;

  mode: string; // normal | select

  userId: string;

  initPosition: CANNON.Vec3; // position x, y, z
  targetPoint: CANNON.Vec3;
  isTouchBoard: boolean;
  isAtStartCommonPath: boolean;
  stepCounter: number;
  stepCursor: number;
  goal: number;
  isReturn: boolean;
  atBase: boolean;
  order: number;

  // isStartModeAuto;

  constructor(color: string, order: number, args: CyclinderBasicParam, position: number[], world: CANNON.World, userId: string) {
    super();

    this.world = world;
    this.args = args;
    this.position = new CANNON.Vec3(...position);
    this.initPosition = new CANNON.Vec3(...position);
    this.isTouchBoard = true;
    this.stepCounter = 0;
    this.stepCursor = -1;
    this.goal -1;
    this.isReturn = false;
    this.atBase = true;
    this.color = color;
    this.selectColor = '#7852ca';
    this.order = order;
    this.mass = 50000;

    this.userId = userId;

    this.mode = 'normal';

    // this.isStartModeAuto = false;
  }

  initObject = async () => {
    const listMesh: THREE.Mesh[] = [];
    
    const baseGeometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      reflectivity: 1.0, clearcoat: 1.0,
      color: this.active ? "purple" : this.color,
    });

    listMesh.push(new THREE.Mesh(baseGeometry, baseMaterial));
    listMesh[0].position.add(new THREE.Vector3(0, 1, 0)); // sphere on top
    listMesh[0].receiveShadow = false;
    listMesh[0].castShadow = false;

    const topGeometry = new THREE.CylinderBufferGeometry(
      ...Object.values(this.args)
    );
    listMesh.push(new THREE.Mesh(topGeometry, baseMaterial));
    listMesh[1].receiveShadow = false;
    listMesh[1].castShadow = false;

    this.addMesh(...listMesh);

    this.initRigidBody();
    this.rigidBody.collisionFilterGroup = collisionGroups.piece;
    this.rigidBody.collisionFilterMask = collisionGroups.board;
    this.rigidBody.material

    this.rigidBody['tag'] = collisionTags.piece;
    this.rigidBody['userId'] = this.userId;
    this.rigidBody['order'] = this.order;
    this.rigidBody.material = cannonTypeMaterials['ground'];

    this.rigidBody.addEventListener('collide', ev => {
      if (ev.body.tag === collisionTags.board) {
        this.isTouchBoard = true;
      } else {
        this.isTouchBoard = false;
      }

      if (ev.body.tag === collisionTags.piece) {
        if (ev.body.userId !== this.userId) {
          state.getGamePiece(ev.body.userId)
            .find(x => x.order === ev.body.order).isReturn = true;
        }
      }
    })
  }

  getPosType = () => {
    // suppose piece stop when execute this function

    const commonPath = state.getUserCommonPath(this.userId);
    const finalPath = state.getUserFinalPath(this.userId);

    const currentStep = this.stepCursor + this.stepCounter;

    if (currentStep === -1) return 'base';
    if (currentStep === 0) return 'start';
    if (currentStep > 0 && currentStep < commonPath.length)
      return 'common';
    if (currentStep - commonPath.length >= 0 &&
      currentStep - commonPath.length < finalPath.length)
      return 'final';

    return 'none'
  }

  setMode = (val: string) => {
    this.mode = val;
    
    if (this.mode === 'select')
      this.setColor(this.selectColor);
    else if (this.mode === 'normal')
      this.setColor(this.color);
  }

  handleAutoJumpMode = (commonPath: any[], finalPath: any[]) => {
    if (!commonPath || commonPath.length < 52)
      return;

    // console.log(commonPath[0]);

    if (this.stepCursor >= 0) {
      if (Math.abs(this.rigidBody.velocity.y) <= 0.01) {
        if (this.stepCursor + this.stepCounter >= this.goal) {
          this.stepCursor = -1;
          this.stepCounter = this.goal;
          this.targetPoint = null;
        } else {
          if (this.stepCursor + this.stepCounter >= commonPath.length) {
            this.targetPoint = new CANNON.Vec3(
              ...<number[]>Object.values(finalPath[ ((this.stepCursor++) + this.stepCounter) - commonPath.length]));
          }
          else this.targetPoint = new CANNON.Vec3(
            ...<number[]>Object.values(commonPath[(this.stepCursor++) + this.stepCounter]));
          
          if (this.atBase) {
            this.launch(new CANNON.Vec3(0, 40, 0));
            this.atBase = false;
          } else {this.launch(new CANNON.Vec3(0, 25, 0));}
        }
      } 
    }
  }

  handleMapPoint = () => {
    if (!this.targetPoint)
      return;
    let targetVeloc = this.targetPoint.vsub(this.rigidBody.position);
    targetVeloc = targetVeloc.scale(25);

    // console.log(targetVeloc);
    this.rigidBody.velocity.x = targetVeloc.x;
    this.rigidBody.velocity.z = targetVeloc.z;
    this.setRotation(new CANNON.Vec3(0, 0, 0));
    // this.rigidBody.velocity.set(targetVeloc.x, targetVeloc.y, targetVeloc.z)
  }

  handleIsReturn = () => {
    if (this.isReturn) {
      this.setPosition(new CANNON.Vec3(
        this.initPosition.x,
        5,
        this.initPosition.z));
      this.isReturn = false;
      this.atBase = true;
    }
  }

  // goByStep = (userId: string, step: number, order: number) => {
  //   if (userId === state.getUserId() && order === this.order) {
  //     this.nextStep++;
  //     this.goal = this.prevStep + step;
  //   }
  // }

  goByStep = (step: number, proceed: boolean = true) => {
    // suppose piece stop when execute this function

    const commonPath = state.getUserCommonPath(this.userId);
    const finalPath = state.getUserFinalPath(this.userId);
    
    const currentStep = this.stepCursor + this.stepCounter;

    if (this.stepCounter + step >= commonPath.length + finalPath.length)
      return false;
    
    let otherPieceArr = state.getGamePiece(this.userId)
      .filter(x => x.order !== this.order && 
        x.stepCursor + x.stepCounter > currentStep);

    for (let i = 0; i < otherPieceArr.length; i++) {
      const otherCurrentStep = otherPieceArr[i].stepCursor + otherPieceArr[i].stepCounter;
      if (currentStep + step >= otherCurrentStep) {
        return false;
      }
    }
    
    if (proceed) {
      this.stepCursor++; // = 0
      this.goal = this.stepCounter + step;

      this.setMode('normal');
    }

    return true;
  }

  keyboardHandle = (table) => {
    this.rigidBody.wakeUp(); // very important
    
    let keycode = require('keycode');
    // if (table[keycode('q')]) {
    //   this.goByStep(state.getUserId(), 2, 1);
    // }
  }

  update = () => {
    // update rigidBody upon value from object
    const commonPath = state.getUserCommonPath(this.userId);
    const finalPath = state.getUserFinalPath(this.userId);

    this.handleAutoJumpMode(commonPath, finalPath);
    this.handleMapPoint();

    this.mainModel.position.fromArray(Object.values(this.rigidBody.position));
    this.mainModel.quaternion.fromArray(Object.values(this.rigidBody.quaternion));

    this.setRotation(new CANNON.Vec3(0, 0, 0));
  }

  getMesh = async () => {
    await this.initObject();

    return this.mainModel;
  }
}
