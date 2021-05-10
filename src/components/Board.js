import { useGLTF } from "@react-three/drei";
import * as Colyseus from "colyseus.js";
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

export default class Board {

  constructor() {
    const { nodes, materials } = useGLTF("../models/board/scene.gltf");
    console.log(nodes);
  }
}

// const Board = (props) => {
//   const group = useRef();
//   const [texture] = useTexture([
//     "./models/board/textures/ludolambert2_baseColor.jpeg",
//   ]);
//   const { nodes, materials } = useGLTF("./models/board/scene.gltf");

//   // const [boardY, setboardY] = useState(0.2);

//   usePlane(() => ({
//     position: [0, 0.2, 0],
//     rotation: [-Math.PI / 2, 0, 0],
//   }));

//   // useEffect(() => {
//   //   document.addEventListener("keydown", (e) => {
//   //     if (e.shiftKey && e.code === "Space") {
//   //       setboardY(boardY - 0.2);
//   //     } else if (e.code === "Space") {
//   //       setboardY(boardY + 0.2);
//   //     }
//   //   });
//   // });

//   return (
//     <group ref={group} {...props} dispose={null} receiveShadow>
//       <mesh
//         geometry={nodes.ludoludo4_ludolambert3_0.geometry}
//         material={nodes.ludoludo4_ludolambert3_0.material}
//         scale={[2, 2, 2]}
//       ></mesh>

//       <mesh
//         position={[0, 0.2, 0]}
//         rotation={[-Math.PI / 2, 0, 0]}
//         receiveShadow
//         scale={[2, 2, 2]}
//       >
//         <planeBufferGeometry args={[12, 12, 1]} />
//         <meshStandardMaterial map={texture} />
//       </mesh>
//     </group>
//   );
// };

// export default Board;
// useGLTF.preload("./models/board/scene.gltf");
