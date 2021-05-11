

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
