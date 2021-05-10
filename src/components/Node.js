import { usePlane } from "@react-three/cannon";

import React, { useEffect, useRef } from "react";

const Node = (props) => {
  return (
    <>
      <mesh
        position={props.position}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[props.scale, props.scale, props.scale]}
      >
        <planeBufferGeometry args={[1, 1]} />
        <meshStandardMaterial color={props.color} opacity={1} />
      </mesh>
    </>
  );
};

export default Node;
