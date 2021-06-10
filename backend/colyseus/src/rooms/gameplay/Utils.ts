import * as CANNON from "cannon-es";
import { GRAVITY } from "./LudoGamePlay";

export const velocityToTarget = (thisPos :CANNON.Vec3, targetPos: CANNON.Vec3, shootingHeight: number): CANNON.Vec3 => {
  let thisPosition = thisPos;
  let distanceY = targetPos.y - thisPosition.y;
  let h = distanceY + shootingHeight;
  let distanceXZ = new CANNON.Vec3(targetPos.x - thisPosition.x, 0, targetPos.z - thisPosition.z);

  if (distanceY <= 0) {
    h = thisPosition.y + shootingHeight;
    const velocity = calculateBallisticsVelocity_targetBelow(distanceXZ, distanceY, h, GRAVITY);

    return velocity;
  }

  return calculateBallisticsVelocity_targetAbove(distanceXZ, distanceY, h, GRAVITY);
}

export const calculateBallisticsVelocity_targetAbove = (distanceXZ: CANNON.Vec3, py: number, h: number, gravity: number): CANNON.Vec3 => {
  const fxz = distanceXZ.scale(1 / (Math.sqrt( (-2 * h) / gravity ) + Math.sqrt( (2 * (py - h)) / gravity )));
  const fy = (new CANNON.Vec3(0, 1, 0)).scale(Math.sqrt( -2 * gravity * h));
  return fxz.vadd(fy).scale(-1 * Math.sign(gravity));
}

export const calculateBallisticsVelocity_targetBelow = (distanceXZ: CANNON.Vec3, py: number, h: number, gravity: number): CANNON.Vec3 => {
  const fxz = distanceXZ.scale(1 / (Math.sqrt( (-2 * h) / gravity ) + Math.sqrt( (-2 * (py + h)) / gravity )));
  const fy = (new CANNON.Vec3(0, 1, 0)).scale(Math.sqrt( -2 * gravity * (h + py)));
  return fxz.vadd(fy).scale(-1 * Math.sign(gravity));
}