import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useBox, usePlane } from "@react-three/cannon";
import { Vector3 } from "three";
import * as THREE from "three";
import useStore, { GAME_STATE } from "../store";

function Dice({ position, ...props }) {
  const { camera, viewport } = useThree();
  const [ref, api] = useBox(() => ({
    mass: 300,
    position: position,
    ...props,

    rotation: [-Math.PI / 8, 0, 0],
  }));

  const velocity = useRef([0, 0, 0]);

  useEffect(() => {
    api.velocity.subscribe((v) => (velocity.current = v), []);
  }, []);

  const actions = useStore((state) => state.actions);

  const dice_material = create_dice_materials(
    standart_face_labels,
    scale / 2,
    1.0
  );

  useEffect(() => {
    //actions.setRollDice(rollDice);
    // document.addEventListener("keypress", (e) => {
    //   if (e.code === "KeyP") console.log(get_dice_value());
    // });
  });

  // const get_dice_value = () => {
  //   var vector = new THREE.Vector3(0, 0, 1);
  //   var closest_face,
  //     closest_angle = Math.PI * 2;
  //   for (var i = 0, l = ref.current.geometry.groups.length; i < l; ++i) {
  //     var face = ref.current.geometry.groups[i];
  //     if (face.materialIndex == 0) continue;
  //     var angle = face.normal
  //       .clone()
  //       .applyQuaternion(ref.current.quaternion)
  //       .angleTo(vector);
  //     if (angle < closest_angle) {
  //       closest_angle = angle;
  //       closest_face = face;
  //     }
  //   }
  //   var matindex = closest_face.materialIndex - 1;
  //   return matindex;
  // };
  const rollDice = () => {
    api.position.set(camera.position.x, camera.position.y, camera.position.z);
    api.velocity.set(-camera.position.x, 0, -camera.position.z);
    api.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
    api.angularVelocity.set(15, 0, 0);
    actions.setState(GAME_STATE.ROLL_DICE);
  };

  useEffect(() => {
    if (
      velocity.current[0] < 0.01 &&
      velocity.current[1] < 0.01 &&
      velocity.current[1] < 0.01
    )
      actions.setDiceNumber((Math.random() % 6) + 1);
  }, [velocity]);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        rollDice();
      }
    });
  });

  const { nodes, materials } = useGLTF("./models/board/scene.gltf");

  return (
    // <group ref={ref} position {...props} dispose={null}>
    //   <primitive object={nodes.ludoludo_ludoblinn6_0} />
    // </group>

    <mesh ref={ref} castShadow>
      <boxBufferGeometry {...props} />
      {dice_material.map((mat) => (
        <meshPhongMaterial attachArray="material" map={mat} />
      ))}
    </mesh>
  );
}

export default Dice;

// export const create_d6 = () => {
//   if (!this.d6_geometry)
//     this.d6_geometry = this.create_d6_geometry(this.scale * 0.9);
//   if (!this.dice_material)
//     this.dice_material = new THREE.MeshFaceMaterial(
//       this.create_dice_materials(
//         this.standart_d20_dice_face_labels,
//         this.scale / 2,
//         1.0
//       )
//     );
//   return new THREE.Mesh(this.d6_geometry, this.dice_material);
// };
const scale = 50;

const create_dice_materials = (face_labels, size, margin) => {
  function create_text_texture(text, color, back_color) {
    if (text == undefined) return null;
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var ts = calc_texture_size(size + size * 2 * margin) * 2;
    canvas.width = canvas.height = ts;
    context.font = ts / (1 + 2 * margin) + "pt Arial";
    context.fillStyle = back_color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  var texture = [];
  for (var i = 0; i < face_labels.length; ++i)
    texture.push(create_text_texture(face_labels[i], label_color, dice_color));

  return texture;
};

const label_color = "#aaaaaa";
const dice_color = "#202020";
const standart_face_labels = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
];

function calc_texture_size(approx) {
  return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
}
