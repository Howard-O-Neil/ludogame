import * as Colyseus from "colyseus.js";
import * as THREE from "three";
import { CyclinderBasicParam } from "../main";
import GameObject from "./GameObject";

// 0.08, 0.7, 2, 50
// assume 4 con số trên là của cyclinder 

export default class Piece extends GameObject {
  texturePosition: number[];
  textureScale: number[];
  textureRotation: number[];

  args: CyclinderBasicParam;
  active: boolean;
  color: string;

  mainObject: THREE.Group; 

  // constructor() {
  //   super();

  //   this.texturePosition = [0, 0.2, 0];
  //   this.textureScale = [2, 2, 2];
  //   this.textureRotation = [-Math.PI / 2, 0, 0];
  // }

  constructor(color, args: CyclinderBasicParam, position) {
    super();

    this.args = args;
    this.position = position;
    this.color = color;
    this.mainObject = new THREE.Group();
    this.mainObject.position.fromArray(this.position);
  }


  getMesh = async () => {
    const baseGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: this.active ? "purple" : this.color,
      clearcoat: 1,
      clearcoatRoughness: 0
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.fromArray([0, 1, 0]); // sphere on top
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;

    const topGeometry = new THREE.CylinderGeometry(
      ...Object.values(this.args)
    );
    const topMesh = new THREE.Mesh(topGeometry, baseMaterial);
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;

    this.mainObject.clear();

    this.mainObject.add(baseMesh);
    this.mainObject.add(topMesh);

    return this.mainObject;
  }
}
