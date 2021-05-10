import { usePlane } from "@react-three/cannon";

import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import React, { useEffect, useRef } from "react";
import { useFBX, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const Board = (props) => {
  const group = useRef();
  const [texture] = useTexture([
    "./models/board/textures/ludolambert2_baseColor.jpeg",
  ]);
  const { nodes, materials } = useGLTF("./models/board/scene.gltf");
  usePlane(() => ({
    position: [0, 0.2, 0],
    rotation: [-Math.PI / 2, 0, 0],
  }));

  return (
    <group ref={group} {...props} dispose={null} receiveShadow>
      <mesh
        geometry={nodes.ludoludo4_ludolambert3_0.geometry}
        material={nodes.ludoludo4_ludolambert3_0.material}
        scale={[2, 2, 2]}
      ></mesh>

      <mesh
        position={[-0.07, 0.1, -0.07]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        scale={[2, 2, 2]}
      >
        <planeBufferGeometry args={[12, 12, 1]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};

export default Board;
useGLTF.preload("./models/board/scene.gltf");
