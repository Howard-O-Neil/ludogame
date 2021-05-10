import "./style.css";
import React, { Suspense, useEffect, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, useSphere, useBox, usePlane } from "@react-three/cannon";

import Board from "./components/Board";
import Piece from "./components/Piece";
import { Environment, OrbitControls, Sky } from "@react-three/drei";

import Dice from "./components/Dice";
import Node from "./components/Node";

import useStore from "./store";
import Hud from "./Hud";

export default function App() {
  //const [nodes, setNodes] = useState([]);
  const [homes, setHomes] = useState([]);

  const commonRoute = useStore((state) => state.commonRoutes);
  const finalRoute = useStore((state) => state.finalRoutes);
  const startNode = useStore((state) => state.startNodes);
  const state = useStore((state) => state);
  const pieces = useStore((state) => state.pieces);
  const diceNumber = useStore((state) => state.diceNumber);
  const actions = useStore((state) => state.actions);

  useEffect(() => {
    console.log(state);
    document.addEventListener("keydown", (e) => {
      console.log(state);
    });
    actions.initPieces();
  }, []);

  return (
    <div className="App">
      <Canvas camera={{ position: [-10, 15, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight intensity={1} position={[-10, -25, -10]} />
        <spotLight
          castShadow
          intensity={0.5}
          angle={0.2}
          penumbra={1}
          position={[25, 25, 25]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        <Sky azimuth={1} inclination={0.6} distance={1000} />
        {commonRoute.map(
          (node, i) =>
            i === 13 && (
              <Node
                position={[node[0], node[1], node[2]]}
                scale={1.5}
                color="red"
              />
            )
        )}

        <Physics
          gravity={[0, -50, 0]}
          iterations={16}
          defaultContactMaterial={{
            restitution: 0.1,
            friction: 0.5,
            contactEquationRelaxation: 5,
            contactEquationStiffness: 1e7,
          }}
        >
          <Dice position={[0, 5, 0]} args={[1, 1, 1]} />
          <Suspense fallback={null}>
            <Board />
          </Suspense>
          {pieces.map((p) => p)}
        </Physics>

        <OrbitControls
        // maxPolarAngle={Math.PI / 3}
        // minPolarAngle={Math.PI / 5}
        />
      </Canvas>
      <Hud />
    </div>
  );
}
