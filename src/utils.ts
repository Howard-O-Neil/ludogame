import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ShapeOptions, ShapeType, threeToCannon } from "./components/Graphic/ThreeToCannon";
import $ from 'jquery';

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const getFormSubmitValue = (jquerySelectString: string) => {
  let values = {};
  $.each($(jquerySelectString).serializeArray(), function(i, field) {
    values[field.name] = field.value;
  });
  return values;
}

export function downloadOutput(data, filename) {

  if(!data) {
      console.error('Console.save: No data')
      return;
  }

  if(!filename) filename = 'console.json'

  if(typeof data === "object"){
      data = JSON.stringify(data, undefined, 4)
  }

  var blob = new Blob([data], {type: 'text/json'}),
      e    = document.createEvent('MouseEvents'),
      a    = document.createElement('a')

  a.download = filename
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
  e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  a.dispatchEvent(e)
}

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

export const convertToCannonQuaternion = (
  coor: THREE.Quaternion
): CANNON.Quaternion => {
  return new CANNON.Quaternion(...Object.values(coor));
};

export const convertToThreeQuaternion = (
  coor: CANNON.Quaternion
): THREE.Quaternion => {
  return new THREE.Quaternion(...Object.values(coor));
};

export const getBoxSize = (model: THREE.Mesh): CANNON.Vec3 => {
  const box = new THREE.Box3().setFromObject(model);
  return convertToCannonVec3(box.getSize(new THREE.Vector3()));
};

export const randomRotation = (): CANNON.Vec3 => {
  return new CANNON.Vec3(
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI
  )
}

export const randomAngularVeloc = (): CANNON.Vec3 => {
  const max = 100, min = 20;
  return new CANNON.Vec3(
    (Math.random() * (max - min + 1)) + min,
    (Math.random() * (max - min + 1)) + min,
    (Math.random() * (max - min + 1)) + min,
  )
}

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
  shapeOption: ShapeOptions = {}
) => {
  // compute size + center
  // only 1 rigidbody

  const rigidBody = new CANNON.Body({...bodyOption});

  let i = 0,
    arr = model.children.filter((x) => x.type === "Mesh");
  for (const item of arr) {
    const shape = createShapeForMesh(<THREE.Mesh>item, shapeOption);

    const offset = new CANNON.Vec3(...Object.values(
      item.position));

    if (shapeOption.moveOffset) {
      offset.x += shapeOption.moveOffset.x;
      offset.y += shapeOption.moveOffset.y;
      offset.z += shapeOption.moveOffset.z;
    }

    const orientation = new CANNON.Quaternion(
      ...Object.values(item.quaternion)
    );

    rigidBody.addShape(shape, offset, orientation);
  }
  return rigidBody;
};

export const createShapeForMesh = (model: THREE.Mesh, shapeOption: ShapeOptions = {}): CANNON.Shape => {
  model.geometry.computeBoundingSphere();
  model.geometry.computeBoundingBox();

  let res: CANNON.Shape = null;

  switch (model.geometry.type) {
    case "BufferGeometry":
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.BOX }).shape;
      break;
    case "BoxGeometry":
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.BOX }).shape;
      break;
    case "ConvexPolyhedronGeometry":
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.HULL }).shape;
      break;
    case "CylinderGeometry":
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.CYLINDER }).shape;
      break;
    case "PlaneGeometry":
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.BOX }).shape;
      break;
    case "SphereGeometry":
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.SPHERE }).shape;
      break;
    default:
      res = threeToCannon(model, { ...shapeOption, type: ShapeType.MESH }).shape;
  }
  return res;
};
