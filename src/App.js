import "./style.css";
import React, { Suspense } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, useSphere, useBox, usePlane } from "@react-three/cannon";

import Board from "./components/Board";
import Piece from "./components/Piece";
import { Environment, OrbitControls, Sky } from "@react-three/drei";

import Dice from "./components/Dice";

const data = [
  [-5.439477664422223, 1.199988980367679, -5.308972802276404],
  [-5.393146085870269, 1.1999890702525435, -7.71029413378612],
  [-7.779093281241222, 1.1999884336587399, -7.6962970855280775],
  [-7.735512466757786, 1.199988657083725, -5.359430200465674],
];

const colors = ["#8aacae", "#b4cb5f", "#ca5452", "#d7c944"];

export default function App() {
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

        <Physics
          gravity={[0, -50, 0]}
          iterations={16}
          defaultContactMaterial={{ restitution: 0.2, friction: 0.5 }}
        >
          <Dice position={[0, 5, 0]} args={[1, 1, 1]} />

          <Suspense fallback={null}>
            <Board />
          </Suspense>
          {data.map((pos, i) => (
            <Piece position={pos} args={[0.08, 0.7, 2, 50]} color={colors[i]} />
          ))}
        </Physics>

        <OrbitControls
        // maxPolarAngle={Math.PI / 3}
        // minPolarAngle={Math.PI / 5}
        />
      </Canvas>
    </div>
  );
}
