import * as THREE from "three";
import * as CANNON from "cannon-es";
import { ShapeType, threeToCannon } from "three-to-cannon";

export interface ShapeProps {
  size: CANNON.Vec3,
  center: CANNON.Vec3,
  position: CANNON.Vec3,
}

export interface AlterNativeOptions {
  plusSize: CANNON.Vec3,
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
}

const convertFromRawVertices = (array: number[]): CANNON.Vec3[] => {
  const arr: CANNON.Vec3[] = [];

  for (let i = 0; i < array.length; i += 3) {
    arr.push(new CANNON.Vec3(
      array[i], array[i + 1], array[i + 2]
    ));
  }
  return arr;
}

const getFaceFromVertices = (array: CANNON.Vec3[]): number[][] => {
  const arr: number[][] = [];
  for (let i = 0; i < array.length; i += 3) {
    arr.push([i, i + 1, i + 2]);
  }
  return arr;
}

function createRigidShape(type, args) {
  let arrProps: any[], rawVertices, vertices, indices;
  switch (type) {
    case 'Box':
      return new CANNON.Box(new CANNON.Vec3(...<number[]>Object.values(args))) // extents => halfExtents
    case 'ConvexPolyhedron':
      rawVertices = <number[]>args.position.array;
      vertices = convertFromRawVertices(rawVertices);

      return new CANNON.ConvexPolyhedron({
        vertices: vertices, 
        faces: getFaceFromVertices(vertices),
      });
    case 'Cylinder':
      arrProps = Object.values(args);
      const v = args[0]
      return new CANNON.Cylinder(<number>arrProps[0], <number>arrProps[1],
        <number>arrProps[2], <number>arrProps[3]) // [ radiusTop, radiusBottom, height, numSegments ] = args
    case 'Heightfield':
      return new CANNON.Heightfield(args) // [ Array data, options: {minValue, maxValue, elementSize}  ] = args
    case 'Particle':
      return new CANNON.Particle() // no args
    case 'Plane':
      return new CANNON.Plane() // no args, infinite x and y
    case 'Sphere':
      return new CANNON.Sphere(args) // [radius] = args
    default:
      console.log(args);
      rawVertices = <number[]>args.normal.array;
      vertices = convertFromRawVertices(rawVertices);

      return new CANNON.Trimesh([-6, 6, 0, 6, 6, 0, -6, -6, 0, 6, -6, 0], [0, 2, 1, 3]) // [vertices, indices] = args
  }
}

const findUnion = (prevPos: number, nextPos: number, prevLength: number, nextLength: number) => {
  let finalLength = prevLength;
  if (nextPos >= prevPos + prevLength || nextPos + nextLength <= prevPos) {
    finalLength = prevLength + nextLength;
  } else if (nextPos + nextLength > prevPos + prevLength) {
    const intersect = Math.abs(prevPos + prevLength - nextPos);
    finalLength = prevLength + (nextLength - intersect);
  } else if (nextPos < prevPos) {
    const intersect = Math.abs(prevPos - nextPos);
    finalLength = prevLength + (nextLength - intersect);
  }
  return finalLength;
}

const findNextShape = (prevProps: ShapeProps, nextProps: ShapeProps) => {
  const nextShape = prevProps;

  // nextShape.size.x = findUnion(prevProps.position.x, nextProps.position.x, 
  //   prevProps.size.x, nextProps.size.x);
  // nextShape.size.y = findUnion(prevProps.position.y, nextProps.position.y, 
  //   prevProps.size.y, nextProps.size.y);
  // nextShape.size.z = findUnion(prevProps.position.z, nextProps.position.z, 
  //   prevProps.size.z, nextProps.size.z);
  
  nextShape.center.x = (prevProps.center.x + nextProps.center.x) / 2;
  nextShape.center.y = (prevProps.center.y + nextProps.center.y) / 2;
  nextShape.center.z = (prevProps.center.z + nextProps.center.z) / 2;

  return nextShape;
}

const getArgsFromMesh = (mesh: THREE.Mesh, option?: AlterNativeOptions): ShapeProps => {
  const _size = convertToCannonVec3(
    mesh.geometry.boundingBox.getSize(new THREE.Vector3()));

  if (option?.plusSize) {
    _size.x += option.plusSize.x;
    _size.y += option.plusSize.y;
    _size.z += option.plusSize.z;
  }

  return {
    size: _size,
    center: convertToCannonVec3(mesh.geometry.boundingSphere.center),
    position: new CANNON.Vec3(
      mesh.position.x - (_size.x / 2),
      mesh.position.y - (_size.y / 2),
      mesh.position.z - (_size.z / 2)
    ),
  }
}

export const createRigidBodyForGroup = (model: THREE.Group, bodyOption: CANNON.BodyOptions, option?: AlterNativeOptions) => {
  // compute size + center
  // only 1 rigidbody

  const rigidBody = new CANNON.Body(bodyOption); 

  let i = 0, arr = model.children.filter(x => x.type === 'Mesh');
  for (const item of arr) {

    console.log(threeToCannon(model).shape);
  
    const shape = threeToCannon(model, {
      type: ShapeType.CYLINDER
    }).shape;
    rigidBody.addShape(shape, new CANNON.Vec3(...Object.values(item.position)));
  }
  return rigidBody;
}

export const createRigidBodyMesh = (model: THREE.Mesh, bodyOption: CANNON.BodyOptions, option?: AlterNativeOptions) => {
  // compute size + center
  // only 1 rigidbody

  const rigidBody = new CANNON.Body(bodyOption); 

  const shape = createShapeForMesh(<THREE.Mesh>model);
  rigidBody.addShape(shape, new CANNON.Vec3(...Object.values(model.position)));

  return rigidBody;
}

export const createShapeForMesh = (model: THREE.Mesh): CANNON.Shape => {
  model.geometry.computeBoundingSphere();
  model.geometry.computeBoundingBox();

  // return createRigidShape('Box', model.geometry.boundingBox.getSize(new THREE.Vector3()));
  return createRigidShape('TriMesh', model.geometry.attributes);
}
