import { IUser } from './State/GameplayState';
import { configToolBoxOnState, state } from './../gameplayHandler';
import { collisionTags, collisionGroups } from './../collisionTag';
import { convertToThreeVec3, createRigidBodyForGroup } from './../utils';
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { cannonTypeMaterials, CyclinderBasicParam } from "../main";
import GameObject from "./GameObject";
import { timers } from 'jquery';
import { UserSkipTurn } from '../gameEvent';

// 0.08, 0.7, 2, 50
// assume these 4 numbers belong to cylinder

const COMMON_PATH_LENGTH = 52
const FINAL_PATH_LENGTH = 5

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

  currentPosStatus: string; // common | final | base ( currentPosIndex = -1 )
  currentPosIndex: number; // commonPath index | finalPath index

  // isStartModeAuto;

  constructor(color: string, order: number, args: CyclinderBasicParam, position: number[], world: CANNON.World, userId: string) {
    super();

    this.world = world;
    this.args = args;
    this.position = new CANNON.Vec3(...position);
    this.initPosition = new CANNON.Vec3(...position);
    this.targetPoint = this.initPosition;
    this.currentPosStatus = 'base';
    this.currentPosIndex = -1;
    this.isTouchBoard = true;
    this.prevStep = 0;
    this.nextStep = -1;
    this.goal = -1;
    this.isReturn = false;
    this.atBase = true;
    this.color = color;
    this.order = order;
    this.mass = 50500;

    this.userId = userId;

    // this.isStartModeAuto = false;
  }

  checkAvailable = (step: number) => {
    if (this.atBase) {
      if (state.getGamePiece(this.userId).filter(x => x.currentPosIndex == 0).length > 0)
        return false;
    } else {
      const allOtherUser: IUser[] = state.getListUserInRoom().filter(x => x.id != this.userId);
      const allCommonPiece: Piece[] = [];

      const testOtherPiece: { equivalentIndex: number }[] = [];
      for (const user of allOtherUser) {
        allCommonPiece.push(...state.getGamePiece(user.id)
          .filter(x => !x.atBase && x.currentPosStatus == "common"));
      }
      for (const piece of allCommonPiece) {
        const otherUser = state.getListUserInRoom().find(x => x.id == piece.userId);
        const thisUser = state.getListUserInRoom().find(x => x.id == this.userId);
        const curIndex = piece.currentPosIndex;
        const curSection = Math.floor(curIndex / 13) + 1;
        const orderDistance = Math.abs(otherUser.order - thisUser.order);

        const equivalentSection =
          otherUser.order < thisUser.order
            ? (curSection - orderDistance <= 0)
              ? curSection - orderDistance + 4
              : curSection - orderDistance
            : (curSection + orderDistance) % 4 == 0
              ? 4
              : (curSection + orderDistance) % 4;

        // const equivalentSection = (curSection - orderDistance <= 0)
        //   ? curSection - orderDistance + 4
        //   : curSection - orderDistance;

        // console.log("check piece ============")
        // console.log(curIndex)
        // console.log(curSection)
        // console.log(equivalentSection)
        // console.log((curIndex % 13) + ((equivalentSection - 1) * 13))

        testOtherPiece.push({
          equivalentIndex: (curIndex % 13) + ((equivalentSection - 1) * 13),
        })
      }
      if (
        testOtherPiece
          .filter(x => x.equivalentIndex > this.currentPosIndex
            && x.equivalentIndex < this.currentPosIndex + step).length > 0
      ) {
        return false;
      }

      const frontPiece = state
        .getGamePiece(this.userId)
        .filter(x => x.order != this.order && !x.atBase && x.currentPosIndex > this.currentPosIndex);

      if (frontPiece.length > 0) {
        if (frontPiece.filter(x => x.currentPosIndex <= this.currentPosIndex + step).length > 0) {
          return false
        }
      } else {
        // currentPosIndex = prevStep + 1
        if (this.currentPosIndex + step >= COMMON_PATH_LENGTH + FINAL_PATH_LENGTH) {
          return false;
        }
      }
    }
    return true;
  }

  initObject = async () => {
    const listMesh: THREE.Mesh[] = [];

    const baseGeometry = new THREE.SphereBufferGeometry(0.45, 32, 32);
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
    // this.rigidBody.collisionFilterGroup = collisionGroups.piece;
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

      if (this.nextStep >= 0) {
        if (ev.body.tag == collisionTags.piece) {
          const piece = state.getGamePiece(ev.body.userId).find(x => x.order == ev.body.order);
          if (piece.userId != this.userId) {
            piece.returnBase();
          }
        }
      }
    });

    this.mainModel["objInfo"] = {
      tag: 'piece',
      userId: this.userId,
      order: this.order,
      body: this.rigidBody,
      raycast: true,
    }
  }

  isOnGround = () => {
    return Math.abs(this.rigidBody.velocity.y) <= 0.05;
  }

  handleAutoJumpMode = (commonPath: any[], finalPath: any[]) => {
    if (!commonPath || commonPath.length < 52)
      return;

    // console.log(commonPath[0]);

    if (this.nextStep >= 0) {
      if (this.isOnGround()) {
        if (this.nextStep + this.prevStep >= this.goal) {
          this.nextStep = -1;
          this.prevStep = this.goal;

          if (this.userId == state.getUserId()) {
            state.getGameRoom().send(UserSkipTurn, { userId: state.getUserId() });
            configToolBoxOnState();
          }
        } else {
          // console.log(this.prevStep + this.nextStep)
          if (this.nextStep + this.prevStep >= commonPath.length) {
            this.currentPosStatus = 'final';
            this.currentPosIndex = this.prevStep + this.nextStep;

            this.targetPoint = new CANNON.Vec3(
              ...<number[]>Object.values(finalPath[((this.nextStep++) + this.prevStep) - commonPath.length]));
          }
          else {
            this.currentPosStatus = 'common';
            this.currentPosIndex = this.prevStep + this.nextStep;

            this.targetPoint = new CANNON.Vec3(
              ...<number[]>Object.values(commonPath[(this.nextStep++) + this.prevStep]));
          }

          if (this.atBase) {
            this.launch(new CANNON.Vec3(0, 100, 0));
            this.atBase = false;
          } else { this.launch(new CANNON.Vec3(0, 35, 0)); }
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

  // goByStep = (userId: string, step: number, order: number) => {
  //   if (userId === state.getUserId() && order === this.order) {
  //     this.nextStep++;
  //     this.goal = this.prevStep + step;
  //   }
  // }

  colorAvailable = () => {
    for (const mesh of <THREE.Mesh[]>this.mainModel.children) {
      mesh.material["color"].set("#E400CF");
    }
  }

  colorUnAvailable = () => {
    for (const mesh of <THREE.Mesh[]>this.mainModel.children) {
      mesh.material["color"].set("#808B96");
    }
  }

  colorDefault = () => {
    for (const mesh of <THREE.Mesh[]>this.mainModel.children) {
      mesh.material["color"].set(this.color)
    }
  }

  returnBase = () => {
    this.targetPoint = this.initPosition;
    this.atBase = true;
    this.prevStep = 0;
    this.currentPosStatus = 'base'
    this.currentPosIndex = -1;
    this.nextStep = -1;
    this.goal = -1;

    this.launch(new CANNON.Vec3(0, 100, 0));
  }

  goByStep = (step: number) => {
    const commonPath = state.getUserCommonPath(this.userId);
    const finalPath = state.getUserFinalPath(this.userId);

    if (this.prevStep + step > commonPath.length + finalPath.length) {
      // console.log(`prevStep      = ${this.prevStep}`);
      // console.log(`step          = ${step}`);
      // console.log(`common length = ${commonPath.length}`);
      // console.log(`final length  = ${finalPath.length}`);
      return;
    }
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
