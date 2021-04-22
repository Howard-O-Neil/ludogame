import React, { useEffect, useRef } from "react";

import { useBox, useCylinder } from "@react-three/cannon";

export default function Piece({ color, args, position, scale, ...props }) {
  const [ref, api] = useCylinder(() => ({
    mass: 100,
    args: args,
    position: position,
  }));
  let posi = useRef();

  useEffect(() => api.position.subscribe((pos) => (posi.current = pos)), []);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "ArrowLeft":
          api.position.set(
            posi.current[0] + 0.1,
            posi.current[1],
            posi.current[2]
          );
          console.log(posi);
          break;
        case "ArrowRight":
          api.position.set(
            posi.current[0] - 0.1,
            posi.current[1],
            posi.current[2]
          );
          break;
        case "ArrowUp":
          api.position.set(
            posi.current[0],
            posi.current[1],
            posi.current[2] + 0.1
          );
          break;
        case "ArrowDown":
          api.position.set(
            posi.current[0],
            posi.current[1],
            posi.current[2] - 0.1
          );
          break;
      }
    });
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, args[2] - 1, 0]} receiveShadow castShadow>
        <sphereBufferGeometry args={[args[0] + 0.5, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh receiveShadow castShadow scale={scale}>
        <cylinderBufferGeometry args={args} {...props} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
