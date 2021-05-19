import * as THREE from "three";
import { downloadOutput } from "./utils";

const scale = 1.46;
const boardBase = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 2],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0],
];

const vectors = [
  [0, "green"],
  [Math.PI / 2, "yellow"],
  [Math.PI, "blue"],
  [-Math.PI / 2, "red"],
];
export const colors = ["#b4cb5f", "#d7c944", "#8aacae", "#ca5452"];
//export const colors = ["#b4cb5f"];
const y_asis = new THREE.Vector3(0, 1, 0);
// export const initBoard = () => {
//   let tempArray = [];
//   vectors.map((vector) => {
//     boardBase.map((dat, i) => {
//       dat.map((node, j) => {
//         if (node > 0) {
//           let vec = new THREE.Vector3(i * scale, 0.2, j * scale).applyAxisAngle(
//             y_asis,
//             vector[0]
//           );
//           tempArray.push(
//             <Node
//               position={[vec.x, vec.y, vec.z]}
//               scale={1.5}
//               color={vector[1]}
//             />
//           );
//         }
//       });
//     });
//   });

//   //   boardBase.map((dat, i) => {
//   //     dat.map((node, j) => {
//   //       if (node > 0) {
//   //         let vec = new THREE.Vector3(i * scale, 0.2, j * scale).applyAxisAngle(
//   //           y_asis,
//   //           Math.PI / 2
//   //         );
//   //         tempArray.push(
//   //           <Node position={[vec.x, vec.y, vec.z]} scale={1.5} color="yellow" />
//   //         );
//   //       }
//   //     });
//   //   });
//   //   boardBase.map((dat, i) => {
//   //     dat.map((node, j) => {
//   //       if (node > 0) {
//   //         let vec = new THREE.Vector3(i * scale, 0.2, j * scale).applyAxisAngle(
//   //           y_asis,
//   //           Math.PI
//   //         );
//   //         tempArray.push(
//   //           <Node position={[vec.x, vec.y, vec.z]} scale={1.5} color="blue" />
//   //         );
//   //       }
//   //     });
//   //   });
//   //   boardBase.map((dat, i) => {
//   //     dat.map((node, j) => {
//   //       if (node > 0) {
//   //         let vec = new THREE.Vector3(i * scale, 0.2, j * scale).applyAxisAngle(
//   //           y_asis,
//   //           -Math.PI / 2
//   //         );
//   //         tempArray.push(
//   //           <Node position={[vec.x, vec.y, vec.z]} scale={1.5} color="red" />
//   //         );
//   //       }
//   //     });
//   //   });
//   return tempArray;
// };

// export const initHome = () => {
//   let tempArray = [];
//   vectors.map((vector) => {
//     [...Array(5)].map((_, i) => {
//       let vec = new THREE.Vector3(0, 0.2, i * scale + scale * 2).applyAxisAngle(
//         y_asis,
//         vector[0]
//       );
//       tempArray.push(
//         <Node position={[vec.x, vec.y, vec.z]} scale={1.5} color={vector[1]} />
//       );
//     });
//   });

//   return tempArray;
// };

export const initFinalRoutes = () => {
  let result = [];
  vectors.map((vector) => {
    let tempArray = [];
    for (let i = 4; i >= 0; i--) {
      let vec = new THREE.Vector3(0, 0.2, i * scale + scale * 2).applyAxisAngle(
        y_asis,
        <number>vector[0]
      );
      tempArray.push(vec.toArray());
    }
    result.push(tempArray);
  });

  return result;
};

export const initCommonRoutes = () => {
  let tempArray = [];
  vectors.map((vector) => {
    boardBase.map((dat, i) => {
      for (let j = dat.length; j >= 0; j--) {
        if (dat[j] > 0) {
          let vec = new THREE.Vector3(i * scale, 0.2, j * scale).applyAxisAngle(
            y_asis,
            <number>vector[0]
          );
          tempArray.push(vec.toArray());
        }
      }

      // dat.map((node, j) => {
      //   if (node > 0) {
      //     let vec = new THREE.Vector3(
      //       i * scale,
      //       0.2,
      //       j * scale
      //     ).applyAxisAngle(y_asis, vector[0]);
      //     tempArray.push(vec.toArray());
      //   }
      // });
    });
  });
  return tempArray;
};

const obj = initCommonRoutes();
for (let i = 0; i < obj.length; i+= 13) {
  downloadOutput(obj.slice(i, i + 13), `testData${i}`);
}

// console.log());

export const initBaseNodes = () => {
  let result = [];
  vectors.map((vector) => {
    let tempArray = [];
    [...Array(2)].map((_, i) => {
      [...Array(2)].map((_, j) => {
        let vec = new THREE.Vector3(
          i * (scale + 1) + 5.4,
          1.1,
          j * (scale + 1) + 5.4
        ).applyAxisAngle(y_asis, <number>vector[0]);
        tempArray.push(vec.toArray());
      });
    });
    result.push(tempArray);
  });
  return result;
};

export const getStartNodes = () => {
  let tempArray = [];
  vectors.map((vector) => {
    boardBase.map((dat, i) => {
      dat.map((node, j) => {
        if (node === 2) {
          let vec = new THREE.Vector3(i * scale, 0.2, j * scale).applyAxisAngle(
            y_asis,
            <number>vector[0]
          );
          tempArray.push(vec.toArray());
        }
      });
    });
  });
  return tempArray;
};