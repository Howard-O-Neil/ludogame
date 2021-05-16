/* global CANNON,THREE,Detector */

import * as THREE from "three";
import * as CANNON from "cannon-es";
import { cyclinderRadicalSegment } from "../constant";

export class CannonDebugRenderer {
  options;
  scene: THREE.Scene;
  world: CANNON.World;
  _meshes: THREE.Mesh[];
  _material: THREE.MeshBasicMaterial;

  tmpVec0 = new CANNON.Vec3();
  tmpVec1 = new CANNON.Vec3();
  tmpVec2 = new CANNON.Vec3();
  tmpQuat0 = new CANNON.Quaternion();

  constructor(scene, world, options?) {
    options = options || {};

    this.scene = scene;
    this.world = world;

    this._meshes = [];

    this._material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true
    });
  }

  update = () => {
    let bodies = this.world.bodies;
    let meshes = this._meshes;
    let shapeWorldPosition = this.tmpVec0;
    let shapeWorldQuaternion = this.tmpQuat0;

    let meshIndex = 0;

    for (let i = 0; i !== bodies.length; i++) {
      let body = bodies[i];

      for (let j = 0; j !== body.shapes.length; j++) {
        let shape = body.shapes[j];

        this._updateMesh(meshIndex, shape);

        let mesh = meshes[meshIndex];

        if (mesh) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

          // Copy to meshes
          mesh.position.fromArray(Object.values(shapeWorldPosition));
          mesh.quaternion.fromArray(Object.values(shapeWorldQuaternion));
        }

        meshIndex++;
      }
    }

    for (let i = meshIndex; i < meshes.length; i++) {
      let mesh = meshes[i];
      if (mesh) {
        this.scene.remove(mesh);
      }
    }

    meshes.length = meshIndex;
  }

  _updateMesh = (index, shape) => {
    let mesh = this._meshes[index];
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh);
      }
      mesh = this._meshes[index] = this._resetMesh(shape);
    }
    this._scaleMesh(mesh, shape);
  }

  _typeMatch = (mesh: THREE.Mesh, shape: CANNON.Shape) => {
    if (!mesh) {
      return false;
    }
    let geo = mesh.geometry;
    return (
      (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
      (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
      (geo instanceof THREE.CylinderGeometry && shape instanceof CANNON.Cylinder)
    );
  }

  _scaleMesh = (mesh: THREE.Mesh, shape) => {
    switch(shape.type){
    case CANNON.Shape.types.SPHERE:
      const sphereRadius = (<CANNON.Sphere>shape).radius;
      mesh.scale.set(sphereRadius, sphereRadius, sphereRadius);
      break;

    case CANNON.Shape.types.BOX:
      const boxHalfExtend = (<CANNON.Box>shape).halfExtents;
        
      mesh.scale.fromArray(Object.values(boxHalfExtend));
      mesh.scale.multiplyScalar(2);
      break;

    case CANNON.Shape.types.CYLINDER:
      // console.log(shape.halfExtents)
      const ratio = (<CANNON.Cylinder>shape).height / mesh.geometry['parameters'].height;
      // console.log(ratio);
      mesh.geometry.scale(ratio, ratio, ratio);
      mesh.geometry['parameters'].height = (<CANNON.Cylinder>shape).height;
      // mesh.scale.multiplyScalar(ratio);

      break;


    // case CANNON.Shape.types.CONVEXPOLYHEDRON:
    //   mesh.scale.set(1,1,1);
    //   break;

    // case CANNON.Shape.types.TRIMESH:
    //   mesh.scale.copy(shape.scale);
    //   break;

    // case CANNON.Shape.types.HEIGHTFIELD:
    //   mesh.scale.set(1,1,1);
    //   break;

    }
}

  // work on scale operation + special props
  _resetMesh = (shape: CANNON.Shape) => {
    let mesh: THREE.Mesh;
    let material = this._material;

    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        mesh = new THREE.Mesh(new THREE.SphereGeometry(), material);
        break;

      case CANNON.Shape.types.BOX:
        mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
        break;
      
      case CANNON.Shape.types.CYLINDER:
        // console.log((<CANNON.Cylinder>shape).radiusTop);
        // console.log((<CANNON.Cylinder>shape).radiusBottom);

        // console.log((<CANNON.Cylinder>shape).height);
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(
          (<CANNON.Cylinder>shape).radiusTop,
          (<CANNON.Cylinder>shape).radiusBottom,
          (<CANNON.Cylinder>shape).height,
          cyclinderRadicalSegment
        ), material);

        break;

      // case CANNON.Shape.types.CONVEXPOLYHEDRON:
      //   // Create mesh
      //   let geo = new THREE.Geometry();

      //   // Add vertices
      //   for (let i = 0; i < shape.vertices.length; i++) {
      //     let v = shape.vertices[i];
      //     geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
      //   }

      //   for (let i = 0; i < shape.faces.length; i++) {
      //     let face = shape.faces[i];

      //     // add triangles
      //     let a = face[0];
      //     for (let j = 1; j < face.length - 1; j++) {
      //       let b = face[j];
      //       let c = face[j + 1];
      //       geo.faces.push(new THREE.Face3(a, b, c));
      //     }
      //   }
      //   geo.computeBoundingSphere();
      //   geo.computeFaceNormals();

      //   mesh = new THREE.Mesh(geo, material);
      //   shape.geometryId = geo.id;
      //   break;

      // case CANNON.Shape.types.TRIMESH:
      //   let geometry = new THREE.Geometry();
      //   let v0 = this.tmpVec0;
      //   let v1 = this.tmpVec1;
      //   let v2 = this.tmpVec2;
      //   for (let i = 0; i < shape.indices.length / 3; i++) {
      //     shape.getTriangleVertices(i, v0, v1, v2);
      //     geometry.vertices.push(
      //       new THREE.Vector3(v0.x, v0.y, v0.z),
      //       new THREE.Vector3(v1.x, v1.y, v1.z),
      //       new THREE.Vector3(v2.x, v2.y, v2.z)
      //     );
      //     let j = geometry.vertices.length - 3;
      //     geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
      //   }
      //   geometry.computeBoundingSphere();
      //   geometry.computeFaceNormals();
      //   mesh = new THREE.Mesh(geometry, material);
      //   shape.geometryId = geometry.id;
      //   break;

      // case CANNON.Shape.types.HEIGHTFIELD:
      //   let geometry = new THREE.Geometry();

      //   let v0 = this.tmpVec0;
      //   let v1 = this.tmpVec1;
      //   let v2 = this.tmpVec2;
      //   for (let xi = 0; xi < shape.data.length - 1; xi++) {
      //     for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
      //       for (let k = 0; k < 2; k++) {
      //         shape.getConvexTrianglePillar(xi, yi, k === 0);
      //         v0.copy(shape.pillarConvex.vertices[0]);
      //         v1.copy(shape.pillarConvex.vertices[1]);
      //         v2.copy(shape.pillarConvex.vertices[2]);
      //         v0.vadd(shape.pillarOffset, v0);
      //         v1.vadd(shape.pillarOffset, v1);
      //         v2.vadd(shape.pillarOffset, v2);
      //         geometry.vertices.push(
      //           new THREE.Vector3(v0.x, v0.y, v0.z),
      //           new THREE.Vector3(v1.x, v1.y, v1.z),
      //           new THREE.Vector3(v2.x, v2.y, v2.z)
      //         );
      //         let i = geometry.vertices.length - 3;
      //         geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
      //       }
      //     }
      //   }
      //   geometry.computeBoundingSphere();
      //   geometry.computeFaceNormals();
      //   mesh = new THREE.Mesh(geometry, material);
      //   shape.geometryId = geometry.id;
      //   break;      
    }

    if (mesh) {
      this.scene.add(mesh);
    }

    return mesh;
  }

}

export const createCannonDebugger = (scene, world) => {
  return new CannonDebugRenderer(scene, world);
}