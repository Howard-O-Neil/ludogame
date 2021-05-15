import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GameObject from "./GameObject";

// props

export default class Dice extends GameObject {
  mass: number;

  constructor(position, scale) {
    super();

    this.mass = 300;
    this.scale = scale;
    this.position = position;
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
  }

  getMesh = async () => {
    await this.loadResource();
  
    // const baseMesh = new THREE.Mesh(this.geometry, this.material);
    // baseMesh.mass
    // const planeGeometry = new THREE.PlaneGeometry(12, 12, 1);
    // const planeMaterial = new THREE.MeshBasicMaterial({
    //   map: this.texture
    // });

    // const topMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    // topMesh.scale.fromArray(this.textureScale);
    // topMesh.rotation.fromArray(this.textureRotation);
    // topMesh.position.fromArray(this.texturePosition);
    // topMesh.receiveShadow = true;


    // const res = new THREE.Group();
    // res.receiveShadow = true;
    // res.add(baseMesh);
    // res.add(topMesh);

    return new THREE.Mesh();
  }
}
