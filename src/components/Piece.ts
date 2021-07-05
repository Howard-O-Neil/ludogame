import { state } from './../gameplayHandler';
import { collisionTags, collisionGroups } from './../collisionTag';
import { convertToThreeVec3, createRigidBodyForGroup } from './../utils';
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

  userId: string;

  initPosition: CANNON.Vec3; // position x, y, z
  targetPoint: CANNON.Vec3;
  isTouchBoard: boolean;
  prevStep: number;
  nextStep: number;
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
    this.targetPoint = this.initPosition;
    this.isTouchBoard = true;
    this.prevStep = 0;
    this.nextStep = -1;
    this.goal -1;
    this.isReturn = false;
    this.atBase = true;
    this.color = color;
    this.order = order;
    this.mass = 50500;

    this.userId = userId;

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

    this.initRigidBody({}, cannonTypeMaterials['ground']);
    this.rigidBody.collisionFilterGroup = collisionGroups.piece;
    // this.rigidBody.collisionFilterMask = collisionGroups.board;

    this.rigidBody['tag'] = collisionTags.piece;
    this.rigidBody['userId'] = this.userId;
    this.rigidBody['order'] = this.order;

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

  handleAutoJumpMode = (commonPath: any[], finalPath: any[]) => {
    if (!commonPath || commonPath.length < 52)
      return;

    // console.log(commonPath[0]);

    if (this.nextStep >= 0) {
      if (Math.abs(this.rigidBody.velocity.y) <= 0.01) {
        if (this.nextStep + this.prevStep >= this.goal) {
          this.nextStep = -1;
          this.prevStep = this.goal;
        } else {
          if (this.nextStep + this.prevStep >= commonPath.length) {
            this.targetPoint = new CANNON.Vec3(
              ...<number[]>Object.values(finalPath[ ((this.nextStep++) + this.prevStep) - commonPath.length]));
          }
          else this.targetPoint = new CANNON.Vec3(
            ...<number[]>Object.values(commonPath[(this.nextStep++) + this.prevStep]));
          
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

  returnBase = () => {
    this.targetPoint = this.initPosition;
    this.prevStep = 0;
    this.nextStep = -1;
    this.goal = -1;

    this.launch(new CANNON.Vec3(0, 30, 0));
  }

  goByStep = (step: number) => {
    const commonPath = state.getUserCommonPath(this.userId);
    const finalPath = state.getUserFinalPath(this.userId);

    if (this.prevStep + step > commonPath.length + finalPath.length)
      return;
    this.nextStep++;
    this.goal = this.prevStep + step;
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
