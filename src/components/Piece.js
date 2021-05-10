import React, { useEffect, useRef, useState } from "react";

import { useBox, useCylinder } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import useStore from "../store";

export default function Piece({
  color,
  args,
  position,
  scale,
  player,
  num,
  ...props
}) {
  const [ref, api] = useCylinder(() => ({
    mass: 100,
    type: "Kinematic",
    args: args,
    position: position,
  }));

  const velocity = useRef([0, 0, 0]);
  const pos = useRef([0, 0, 0]);

  useEffect(() => {
    api.position.subscribe((p) => (pos.current = p), []);
    api.velocity.subscribe((v) => (velocity.current = v), []);
  }, []);

  const [texture] = useTexture(["./Selector.png"]);
  const [isSelectable, setIsSelectable] = useState(false);
  const selector = useRef();
  useFrame(() => {
    if (isSelectable) selector.current.rotation.z += 0.1;
    if (num === 0 && player === 0)
      document.addEventListener("keypress", (e) => {
        if (e.code === "KeyA") moveOut();
        if (e.code === "KeyS") setSteps(6);
      });
  });
  const [fullRoute, setFullRoute] = useState([]);

  // const [currentNode, setCurrentNode] = useState({});
  const [baseNode, setBaseNode] = useState(position);
  const [goalNode, setGoalNode] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isOut, setIsOut] = useState(false);
  const [steps, setSteps] = useState(0);
  const [doneSteps, setDoneSteps] = useState(0);

  const commonRoute = useStore((state) => state.commonRoutes);
  const finalRoute = useStore((state) => state.finalRoutes[player]);
  const startNode = useStore((state) => state.startNodes[player]);

  const [routePosition, setRoutePosition] = useState(-1);

  useFrame(() => {
    if (!isMoving) {
      if (steps > 0) {
        if (routePosition + steps > fullRoute.length) {
          console.log("number too high");
          setSteps(0);
          return;
        } else if (routePosition + steps === fullRoute.length) {
          console.log("you won");
        }
        const nextPos = fullRoute[routePosition + 1];
        setRoutePosition(routePosition + 1);

        console.log(goalNode);
        modeToNextNode(nextPos);
        setIsMoving(true);
        console.log("steps >0\n");
      }
    } else {
      if (checkReachGoal()) {
        api.velocity.set(0, 0, 0);
        setIsMoving(false);

        if (routePosition !== 0) setSteps(steps - 1);
        console.log("reached goal \n");
      }
    }
  });

  const moveOut = () => {
    setRoutePosition(0);
    setIsMoving(true);
    calSpeed(startNode);
    setGoalNode(startNode);
  };

  const modeToNextNode = (goal) => {
    setGoalNode(goal);
    calSpeed(goal);
  };

  const checkReachGoal = () => {
    if (
      Math.abs(pos.current[0] - goalNode[0]) < 0.01 &&
      Math.abs(pos.current[2] - goalNode[2]) < 0.01
    )
      return true;
    return false;
  };
  // useEffect(() => {
  //   if (goalNode !== null)
  //     api.velocity.set(
  //       goalNode[0] - pos.current[0],
  //       0,
  //       goalNode[2] - pos.current[2]
  //     );
  // }, [goalNode]);

  const calSpeed = (node) => {
    if (routePosition === -1)
      api.velocity.set(node[0] - pos.current[0], 0, node[2] - pos.current[2]);
    else {
      api.velocity.set(
        (node[0] - pos.current[0]) * 4,
        0,
        (node[2] - pos.current[2]) * 4
      );
    }
  };

  useEffect(() => {
    if (commonRoute && finalRoute && startNode) {
      getFullRoute();
    }
  }, [commonRoute, finalRoute, startNode]);
  useEffect(() => {
    console.log(fullRoute);
  }, [fullRoute]);

  const getFullRoute = () => {
    const startNodeIndex = commonRoute.findIndex((i) => {
      if (
        i[0] === startNode[0] &&
        i[1] === startNode[1] &&
        i[2] === startNode[2]
      )
        return true;
      return false;
    });
    console.log(startNodeIndex);
    let tempArray = [];
    for (let i = 0; i < commonRoute.length; i++) {
      let tempPos = startNodeIndex + i;
      tempPos %= commonRoute.length;
      tempArray.push(commonRoute[tempPos]);
    }
    tempArray = [...tempArray, ...finalRoute];
    setFullRoute(tempArray);
  };

  return (
    <group ref={ref} position={position} onClick={moveOut}>
      <mesh position={[0, args[2] - 1, 0]} receiveShadow castShadow>
        <sphereBufferGeometry args={[args[0] + 0.5, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh receiveShadow castShadow scale={scale}>
        <cylinderBufferGeometry args={args} {...props} />
        <meshStandardMaterial color={color} />
      </mesh>
      {isSelectable && (
        <mesh
          ref={selector}
          position={[0, -1, 0]}
          scale={[2, 2, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeBufferGeometry args={[1, 1, 1]} />
          <meshStandardMaterial transparent map={texture} />
        </mesh>
      )}
    </group>
  );
}
