import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GameObject from "./GameObject";

export default class Board extends GameObject {
  constructor() {
    super();

    this.position = [12, 0.2, 0];
    this.scale = [2, 2, 2];
    this.rotation = [-Math.PI / 2, 0, 400];
  }

  loadResource = async () => {
    const loader = new GLTFLoader();

    this.texture = await (new THREE.TextureLoader().loadAsync('../models/board/textures/ludolambert2_baseColor.jpeg'));   
    const map = await loader.loadAsync("../models/board/scene.gltf");

    map.scene.traverse((child) => {
      if (child.name === "ludoludo4_ludolambert3_0") {
        this.geometry = child['geometry'];
        this.material = child['material'];

        // console.log("done parsing");
        return;
      }
    });
  }

  getMesh = async () => {
    await this.loadResource();
  
    const baseMesh = new THREE.Mesh(this.geometry, this.material);
    baseMesh.scale.fromArray(this.scale);

    const planeGeometry = new THREE.PlaneBufferGeometry(12, 12, 1);
    const planeMaterial = new THREE.MeshStandardMaterial(this.texture);

    const topMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    topMesh.position.fromArray(this.position);
    topMesh.scale.fromArray(this.scale);
    topMesh.rotation.fromArray(this.rotation);
    topMesh.receiveShadow = true;


    const res = new THREE.Group()
    res.receiveShadow = true;
    res.add(baseMesh);
    res.add(topMesh);

    return res;
  }
}
