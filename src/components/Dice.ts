import { convertToCannonVec3, createRigidBodyForMesh, createRigidBodyForGroup, convertToThreeVec3, convertToCannonQuaternion } from './../utils';
import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import GameObject from "./GameObject";

// props

export default class Dice extends GameObject {
  mass: number;
  readonly camera: THREE.Camera;
  world: CANNON.World;

  constructor(position, scale, camera, world) {
    super();

    this.mass = 0;
    this.scale = new CANNON.Vec3(...scale);
    this.position = new CANNON.Vec3(...position);
    this.camera = camera;
    this.world = world;
    // this.rotation = new CANNON.Vec3(-Math.PI / 8, 0, 0);
  }

  loadResource = async () => {
    const loader = new GLTFLoader();

    const map = await loader.loadAsync("../models/board/scene.gltf");

    map.scene.traverse((child) => {
      if (child.name === "ludoludo_ludoblinn6_0") {
        this.geometry = child['geometry'];
        this.material = child['material'];
        return;
      }
    });
    
    this.geometry.computeBoundingBox();    
  }

  initObject = async () =>  {
    await this.loadResource();

    // this.geometry = new THREE.BoxGeometry(2, 2, 2, 1, 1, 1);
    // this.material = new THREE.MeshPhysicalMaterial({
    //   color: "red",
    //   clearcoat: 1,
    //   clearcoatRoughness: 0
    // });
    const baseMesh = new THREE.Mesh(this.geometry, this.material);
    baseMesh.receiveShadow = true;

    const mesh = new THREE.Mesh(this.geometry, this.material);
    this.mainModel = new THREE.Group();
    this.mainModel.add(mesh);

    this.applyScale(...[2, 2, 2]);

    this.rigidBody = createRigidBodyForGroup(<THREE.Group>this.mainModel, {
      mass: this.mass,
      position: this.position,
    });

    // console.log(this.rigidBody.shapes.)
    this.world.addBody(this.rigidBody);

    document.addEventListener('keydown', ev => {
      this.keyboardHandle(ev);
    })
  }

  keyboardHandle = (ev: KeyboardEvent) => {
    if (ev.key == 'r') {
      // 0this.setPosition(convertToCannonVec3(this.camera.position));
      this.launch(new CANNON.Vec3(0, 20, -20));
    }
  }

  update = () => {
    // update rigidBody upon value from object

    this.mainModel.position.fromArray(Object.values(this.rigidBody.position));
    this.mainModel.quaternion.fromArray(Object.values(this.rigidBody.quaternion));
  }


  getMesh = async () => {
    await this.initObject();
  
    return this.mainModel;
  }
}
