import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useBox, usePlane } from "@react-three/cannon";

function Dice({ position, ...props }) {
  const { camera, viewport } = useThree();
  const [ref, api] = useBox(() => ({
    mass: 300,
    position: position,
    ...props,

    rotation: [-Math.PI / 8, 0, 0],
  }));

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        api.position.set(
          camera.position.x,
          camera.position.y,
          camera.position.z
        );
        api.velocity.set(-camera.position.x, 0, -camera.position.z);
        api.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
        api.angularVelocity.set(15, 0, 0);
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
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default Dice;
