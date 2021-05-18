import { createRigidBodyForGroup, convertToCannonQuaternion } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GameObject from "./GameObject";
import { convertToCannonVec3, createShapeForMesh } from "../utils";
export default class Board extends GameObject {
  constructor(world) {
    super();
    this.world = world;
    this.scale = new CANNON.Vec3(2, 2, 2);
    this.mass = 0;
  }

  childNode = ['ludoludo4_ludolambert3_0'];
  txtNode = ['mainTxt'];

  loadResource = async () => {
    const loader = new GLTFLoader();

    this.texture[this.txtNode[0]] = await (new THREE.TextureLoader().loadAsync('../models/board/textures/ludolambert2_baseColor.jpeg'));   
    const map = await loader.loadAsync("../models/board/scene.gltf");
 
    map.scene.traverse((child) => {
      if (child.name === this.childNode[0]) {
        this.geometry[this.childNode[0]] = child['geometry'];
        this.material[this.childNode[0]] = child['material'];
        return;
      }
    });
  }

  initObject = async () => {
    await this.loadResource();

    const listMesh = [];
  
    listMesh.push(new THREE.Mesh(
      this.geometry[this.childNode[0]],
      this.material[this.childNode[0]]));
    
    let planeGeometry = new THREE.PlaneGeometry(12, 12, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: this.texture[this.txtNode[0]]
    });

    listMesh.push(new THREE.Mesh(planeGeometry, planeMaterial));
    
    listMesh[1].rotation.fromArray([-Math.PI / 2, 0, 0]);
    listMesh[1].position.fromArray([0, 0.2, 0]);
    listMesh[1].receiveShadow = true;

    this.addMesh(...listMesh);
    this.initScale(2);
    this.initRigidBody();
  }

  update = () => {
    // update rigidBody upon value from object

    this.rigidBody.position.copy(this.position); // stand still
    this.mainModel.position.fromArray(Object.values(this.rigidBody.position));
    this.mainModel.quaternion.fromArray(Object.values(this.rigidBody.quaternion));
  }

  getMesh = async () => {
    await this.initObject();
  
    return this.mainModel;
  }
}
