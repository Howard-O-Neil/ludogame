import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GameObject from "./GameObject";

export default class Board extends GameObject {
  texturePosition: number[];
  textureScale: number[];
  textureRotation: number[];

  constructor() {
    super();

    this.texturePosition = [0, 0.2, 0];
    this.textureScale = [2, 2, 2];
    this.textureRotation = [-Math.PI / 2, 0, 0];
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

  getMesh = async () => {
    await this.loadResource();
  
    const baseMesh = new THREE.Mesh(this.geometry, this.material);
    baseMesh.scale.fromArray(this.textureScale);

    const planeGeometry = new THREE.PlaneGeometry(12, 12, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: this.texture
    });

    const topMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    topMesh.scale.fromArray(this.textureScale);
    topMesh.rotation.fromArray(this.textureRotation);
    topMesh.position.fromArray(this.texturePosition);
    topMesh.receiveShadow = true;


    const res = new THREE.Group()
    res.receiveShadow = true;
    res.add(baseMesh);
    res.add(topMesh);

    return res;
  }
}
