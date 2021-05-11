import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import GLTFLoader from "three-gltf-loader";
import GameObject from "./GameObject";

export default class Board extends GameObject {
  constructor() {
    super();
  }

  loadResource = async () => {
    const loader = new GLTFLoader();

    this.texture = await (new THREE.TextureLoader().loadAsync('../models/board/textures/ludolambert2_baseColor.jpeg'))
    console.log(this.texture);
    
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

    // const 
  }
}
