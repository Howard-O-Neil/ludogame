import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ShapeType, threeToCannon } from "./components/Graphic/ThreeToCannon";

export interface ShapeProps {
  size: CANNON.Vec3;
  center: CANNON.Vec3;
  position: CANNON.Vec3;
}

export interface AlterNativeOptions {
  plusSize: CANNON.Vec3;
}

export const convertToCannonVec3 = (coor: THREE.Vector3): CANNON.Vec3 => {
  return new CANNON.Vec3(...Object.values(coor));
};

export const convertToThreeVec3 = (coor: CANNON.Vec3): THREE.Vector3 => {
  return new THREE.Vector3(...Object.values(coor));
};

export const getBoxSize = (model: THREE.Mesh): CANNON.Vec3 => {
  const box = new THREE.Box3().setFromObject(model);
  return convertToCannonVec3(box.getSize(new THREE.Vector3()));
};

const convertFromRawVertices = (array: number[]): CANNON.Vec3[] => {
  const arr: CANNON.Vec3[] = [];

  for (let i = 0; i < array.length; i += 3) {
    arr.push(new CANNON.Vec3(array[i], array[i + 1], array[i + 2]));
  }
  return arr;
};

const getFaceFromVertices = (array: CANNON.Vec3[]): number[][] => {
  const arr: number[][] = [];
  for (let i = 0; i < array.length; i += 3) {
    arr.push([i, i + 1, i + 2]);
  }
  return arr;
};

export const createRigidBodyForGroup = (
  model: THREE.Group,
  bodyOption: CANNON.BodyOptions,
  option?: AlterNativeOptions
) => {
  // compute size + center
  // only 1 rigidbody

  const rigidBody = new CANNON.Body(bodyOption);

  let i = 0,
    arr = model.children.filter((x) => x.type === "Mesh");
  for (const item of arr) {
    const shape = createShapeForMesh(<THREE.Mesh>item);
    rigidBody.addShape(shape, new CANNON.Vec3(...Object.values(item.position)));
  }
  return rigidBody;
};

export const createRigidBodyMesh = (
  model: THREE.Mesh,
  bodyOption: CANNON.BodyOptions,
  option?: AlterNativeOptions
) => {
  // compute size + center
  // only 1 rigidbody

  const rigidBody = new CANNON.Body(bodyOption);

  const shape = createShapeForMesh(<THREE.Mesh>model);
  rigidBody.addShape(shape, new CANNON.Vec3(...Object.values(model.position)));

  return rigidBody;
};

export const createShapeForMesh = (model: THREE.Mesh): CANNON.Shape => {
  // model.geometry.computeBoundingSphere();
  // model.geometry.computeBoundingBox();

  // console.log(model.geometry.type);

  // return threeToCannon(model, { type: ShapeType.BOX }).shape;  

  switch (model.geometry.type) {
    case "BufferGeometry":
      return threeToCannon(model, { type: ShapeType.CYLINDER }).shape;
    case "BoxGeometry": 
      console.log('the fuck this ');
      return threeToCannon(model, { type: ShapeType.BOX }).shape;
    case "ConvexPolyhedronGeometry":
      return threeToCannon(model, { type: ShapeType.HULL }).shape;
    case "CylinderGeometry":
      return threeToCannon(model, { type: ShapeType.CYLINDER }).shape;
    case "PlaneGeometry":
      return threeToCannon(model, { type: ShapeType.BOX }).shape;
    case "SphereGeometry":
      console.log('hello piece');
      return threeToCannon(model, { type: ShapeType.SPHERE }).shape;
    default:
      return threeToCannon(model, { type: ShapeType.MESH }).shape;
  }
};
