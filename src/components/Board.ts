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

  loadResource = async () => {
    const loader = new GLTFLoader();

    this.texture = await (new THREE.TextureLoader().loadAsync('../models/board/textures/ludolambert2_baseColor.jpeg'));   
    const map = await loader.loadAsync("../models/board/scene.gltf");

    map.scene.traverse((child) => {
      if (child.name === "ludoludo4_ludolambert3_0") {
        this.geometry = child['geometry'];
        this.material = child['material'];
        return;
      }
    });
  }

  initObject = async () => {
    await this.loadResource();
  
    const baseMesh = new THREE.Mesh(this.geometry, this.material);
    
    let planeGeometry = new THREE.PlaneGeometry(12, 12, 1);
    // planeGeometry = <THREE.PlaneGeometry>planeGeometry.scale(2, 2, 2);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: this.texture
    });

    let topMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    
    topMesh.rotation.fromArray([-Math.PI / 2, 0, 0]);
    topMesh.position.fromArray([0, 0.2, 0]);
    topMesh.receiveShadow = true;

    this.mainModel = new THREE.Group();
    this.mainModel.receiveShadow = true;

    this.mainModel.add(baseMesh);
    this.mainModel.add(topMesh);

    this.initScale(...[2, 2, 2]);

    this.rigidBody = createRigidBodyForGroup(<THREE.Group>this.mainModel, {
      mass: this.mass,
      position: this.position,
    });
    this.world.addBody(this.rigidBody);
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
