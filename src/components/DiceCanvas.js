import * as THREE from "./Graphic/three-dice/three";
import * as CANNON from "./Graphic/three-dice/cannon"
import "./Graphic/three-dice/CannonDebugRenderer";
import { DiceD6, DiceManager } from "./Graphic/three-dice/dice";
import { OrbitControls } from "./Graphic/three-dice/OrbitControls";
import { Sky } from "./Graphic/three-dice/Sky";

const GRAVITY = -2500;
const FPS = 1 / 30;
const ORBIT_CONTROLS = false;

export default class DiceCanvas {
  floorScale = [50, 50, 50];

  constructor(canvasTag) {
    this.nextThrowReady = true;
    this.cameraTracking = false;
    this.canvasTag = canvasTag;
  }

  degToRad(degrees) {
    let pi = Math.PI;
    return degrees * (pi / 180);
  }

  setFromSphericalCoords(vec3, radius, phi, theta) {
    const sinPhiRadius = Math.sin(phi) * radius;
    vec3.x = sinPhiRadius * Math.sin(theta);
    vec3.y = Math.cos(phi) * radius;
    vec3.z = sinPhiRadius * Math.cos(theta);
    return vec3;
  }

  initScene = async () => {
    let ambinentLight = new THREE.AmbientLight(); // soft whit light
    ambinentLight.intensity = 0.5;

    const spotLight = new THREE.PointLight();
    spotLight.intensity = 1;
    spotLight.position.set(450, 200, 300);

    this.scene.add(ambinentLight, spotLight);

    let sky = new Sky();
    sky.scale.setScalar(450000);

    let sunPosition = new THREE.Vector3(0, 0, 0);

    const uniformSpecDefault = {
      turbidity: 10,
      rayleigh: 3,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.7,
      elevation: 2,
      azimuth: 50,
      exposure: 1,
    };

    const uniforms = sky.material.uniforms;
    uniforms["turbidity"].value = uniformSpecDefault.turbidity;
    uniforms["rayleigh"].value = uniformSpecDefault.rayleigh;
    uniforms["mieCoefficient"].value = uniformSpecDefault.mieCoefficient;
    uniforms["mieDirectionalG"].value = uniformSpecDefault.mieDirectionalG;

    const phi = this.degToRad(90 - uniformSpecDefault.elevation);
    const theta = this.degToRad(uniformSpecDefault.azimuth);

    this.setFromSphericalCoords(sunPosition, 1, phi, theta);

    uniforms["sunPosition"].value.copy(sunPosition);

    sky.material.uniforms = { ...uniforms };
    this.renderer.toneMappingExposure = uniformSpecDefault.exposure;
    this.renderer.render(this.scene, this.camera);

    this.scene.add(sky);
  };

  addWall = () => {
    const wallScale = 15;

    __wall_1: {
      let wall_1_Material = new THREE.MeshPhongMaterial({
        color: "#E1E1E1",
        side: THREE.DoubleSide,
      });
      let wall_1_Geometry = new THREE.BoxGeometry(100, 100, 1, 10);
      this.wall_1_ = new THREE.Mesh(wall_1_Geometry, wall_1_Material);
      this.wall_1_.visible = false;
      this.wall_1_.receiveShadow = true;
      this.wall_1_.geometry.scale(wallScale, wallScale, wallScale);
      this.scene.add(this.wall_1_);

      this.wall_1_.geometry.center();

      let wall_1_Size = this.wall_1_.geometry.boundingBox.getSize(
        new THREE.Vector3()
      );
      wall_1_Size = wall_1_Size.multiplyScalar(0.5);
      let shape = new CANNON.Box(
        new CANNON.Vec3(...Object.values(wall_1_Size))
      );

      this.wall_1_Body = new CANNON.Body({
        mass: 0,
        shape: shape,
        quaternion: new CANNON.Quaternion(
          ...Object.values(this.wall_1_.quaternion)
        ),
        position: new CANNON.Vec3(0, 0, 50 * 4),
        material: DiceManager.barrierBodyMaterial,
      });
      this.world.add(this.wall_1_Body);
    }

    __wall_2: {
      let wall_2_Material = new THREE.MeshPhongMaterial({
        color: "#E1E1E1",
        side: THREE.DoubleSide,
      });
      let wall_2_Geometry = new THREE.BoxGeometry(100, 100, 1, 10);
      this.wall_2_ = new THREE.Mesh(wall_2_Geometry, wall_2_Material);
      this.wall_2_.visible = false;
      this.wall_2_.rotation.y = Math.PI / 2;
      this.wall_2_.receiveShadow = true;
      this.wall_2_.geometry.scale(wallScale, wallScale, wallScale);
      this.scene.add(this.wall_2_);

      this.wall_2_.geometry.center();

      let wall_2_Size = this.wall_2_.geometry.boundingBox.getSize(
        new THREE.Vector3()
      );
      wall_2_Size = wall_2_Size.multiplyScalar(0.5);
      let shape = new CANNON.Box(
        new CANNON.Vec3(...Object.values(wall_2_Size))
      );

      this.wall_2_Body = new CANNON.Body({
        mass: 0,
        shape: shape,
        quaternion: new CANNON.Quaternion(
          ...Object.values(this.wall_2_.quaternion)
        ),
        position: new CANNON.Vec3(-50 * 4, 0, 0),
        material: DiceManager.barrierBodyMaterial,
      });
      this.world.add(this.wall_2_Body);
    }
  };

  addFloor = () => {
    let floorMaterial = new THREE.MeshPhongMaterial({
      color: "#EAEAEA",
      side: THREE.DoubleSide,
    });
    let floorGeometry = new THREE.BoxGeometry(50, 50, 1, 10);
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.receiveShadow = true;
    this.floor.rotation.x = Math.PI / 2;
    this.floor.geometry.scale(
      this.floorScale[0],
      this.floorScale[1],
      this.floorScale[2]
    );
    this.scene.add(this.floor);

    this.floor.geometry.center();

    let floorSize = this.floor.geometry.boundingBox.getSize(
      new THREE.Vector3()
    );
    floorSize = floorSize.multiplyScalar(0.5);
    let shape = new CANNON.Box(new CANNON.Vec3(...Object.values(floorSize)));

    this.floorBody = new CANNON.Body({
      mass: 0,
      shape: shape,
      quaternion: new CANNON.Quaternion(
        ...Object.values(this.floor.quaternion)
      ),
      material: DiceManager.floorBodyMaterial,
    });

    // this.floorBody.quaternion.setFromAxisAngle(
    //   new CANNON.Vec3(1, 0, 0),
    //   -Math.Pi / 2
    // )
    this.world.add(this.floorBody);
  };

  addDice = () => {
    DiceManager.setWorld(this.world);

    this.listDice = [];
    this.listDice.push(new DiceD6({ backColor: "#FAFAFA", fontColor: "#000000" }));
    this.listDice.push(new DiceD6({ backColor: "#FAFAFA", fontColor: "#000000" }));

    for (let i = 0; i < this.listDice.length; i++) {
      this.scene.add(this.listDice[i].getObject());
    }

    this.listDice[0].getObject().body.tag = "dice";
    this.listDice[1].getObject().body.tag = "dice";

    this.listDice[0].getObject().body.velocity.set(0, 0, 0);
    this.listDice[1].getObject().body.velocity.set(0, 0, 0);

    this.listDice[0].getObject().position.x = 0;
    this.listDice[0].getObject().position.y = 30;
    this.listDice[0].getObject().rotation.x = (20 * Math.PI) / 180;
    this.listDice[0].updateBodyFromMesh();

    this.listDice[1].getObject().position.x = 100;
    this.listDice[1].getObject().position.y = 30;
    this.listDice[1].getObject().rotation.x = (50 * Math.PI) / 180;
    this.listDice[1].updateBodyFromMesh();
  };

  initDiceUtils = async () => {
    this.scene = new THREE.Scene();

    this.SCREEN_WIDTH = 400;
    this.SCREEN_HEIGHT = 300;
    this.VIEW_ANGLE = 90;
    this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
    this.NEAR = 0.01;
    this.FAR = 20000;

    this.camera = new THREE.PerspectiveCamera(
      this.VIEW_ANGLE,
      this.ASPECT,
      this.NEAR,
      this.FAR
    );
    this.camera.position.set(142.21300046993107, 571.6373507111894, -126.53146549630453);
    this.camera.quaternion.set(-0.2917269822897262, 0.6441239768936987, 0.6441233327414131, 0.2917272740298214);
    this.camera.rotation.set(-1.5707969864053455, 7.516667855368018e-7, 2.291057672677735, "XYZ");

    this.scene.add(this.camera);

    this.camera.updateProjectionMatrix();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasTag,
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (ORBIT_CONTROLS)
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    await this.initScene();

    this.world = new CANNON.World();
    this.world.gravity.set(0, GRAVITY, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 16;

    this.cannonDebugRenderer = new THREE.CannonDebugRenderer(
      this.scene,
      this.world
    );

    this.addFloor();
    this.addWall();
    this.addDice();

    this.dt = FPS * 1000;
    this.timeTarget = 0;
  };

  velocityToTarget = (originPos, targetPos, shootingHeight) => {
    let distanceY = targetPos.y - originPos.y;
    let h = distanceY + shootingHeight;
    let distanceXZ = new CANNON.Vec3(
      targetPos.x - originPos.x,
      0,
      targetPos.z - originPos.z
    );

    if (distanceY <= 0) {
      h = originPos.y + shootingHeight;
      const velocity = this.calculateBallisticsVelocity_targetBelow(
        distanceXZ,
        distanceY,
        h,
        GRAVITY
      );

      return velocity;
    }

    return this.calculateBallisticsVelocity_targetAbove(
      distanceXZ,
      distanceY,
      h,
      GRAVITY
    );
  };

  calculateBallisticsVelocity_targetAbove = (distanceXZ, py, h, gravity) => {
    const fxz = distanceXZ.scale(
      1 / (Math.sqrt((-2 * h) / gravity) + Math.sqrt((2 * (py - h)) / gravity))
    );
    const fy = new CANNON.Vec3(0, 1, 0).scale(Math.sqrt(-2 * gravity * h));
    return fxz.vadd(fy).scale(-1 * Math.sign(gravity));
  };

  calculateBallisticsVelocity_targetBelow = (distanceXZ, py, h, gravity) => {
    const fxz = distanceXZ.scale(
      1 / (Math.sqrt((-2 * h) / gravity) + Math.sqrt((-2 * (py + h)) / gravity))
    );
    const fy = new CANNON.Vec3(0, 1, 0).scale(
      Math.sqrt(-2 * gravity * (h + py))
    );
    return fxz.vadd(fy).scale(-1 * Math.sign(gravity));
  };

  throwDice = (diceVals, angularVeloc = null, rotation = null, diceCallBack = null) => {
    if (this.nextThrowReady == false) return false;
    if (DiceManager.throwRunning) return false;

    this.diceCallBack = diceCallBack;

    let i = 0;
    let diceValues = [];

    this.nextThrowReady = false;
    this.cameraTracking = true;

    for (const dice of this.listDice) {
      dice.getObject().position.x = 1000 + i * 150;
      dice.getObject().position.y = 200;
      dice.getObject().position.z = -1000 + i * 150;

      if (rotation) {
        dice.getObject().rotation.set(rotation.x, rotation.y, rotation.z);
      }
      dice.updateBodyFromMesh();

      if (angularVeloc) {
        dice
          .getObject()
          .body.angularVelocity.set(angularVeloc.x, angularVeloc.y, angularVeloc.z);
      }

      let veloc = this.velocityToTarget(
        new CANNON.Vec3(
          dice.getObject().position.x,
          dice.getObject().position.y,
          dice.getObject().position.z
        ),
        new CANNON.Vec3(-500, 200, 300),
        50
      );
      veloc = veloc.scale(0.8)

      dice.getObject().body.velocity.set(veloc.x, veloc.y, veloc.z);

      diceValues.push({ dice: dice, value: diceVals[i] });
      i++;
    }
    DiceManager.prepareValues(diceValues);
    // DiceManager.world.step(FPS);

    return true;
  };

  initWorker = async () => {
    await this.initDiceUtils();
    requestAnimationFrame(this.render);

    // document.onkeydown = (ev) => {
    //   if (ev.key == "f") {
    //     const dice1 = Math.floor(Math.random() * 6) + 1;
    //     const dice2 = Math.floor(Math.random() * 6) + 1;
    //     this.throwDice([dice1, dice2]);
    //   }
    // };
  };

  updateObjects = () => {
    this.world.step(FPS);

    this.floorBody.position.x = 0;
    this.floorBody.position.y = 0;
    this.floorBody.position.z = 0;

    let checkReadyThrow = true;
    let objGroupCenter = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < this.listDice.length; i++) {
      this.listDice[i].updateMeshFromBody();
      objGroupCenter.add(this.listDice[i].getObject().position);
      if (Math.abs(this.listDice[i].getObject().body.velocity.y) > 1) {
        checkReadyThrow = checkReadyThrow && false;
      }
      checkReadyThrow = checkReadyThrow && true;
    }
    objGroupCenter.multiplyScalar(1 / this.listDice.length);

    if (this.cameraTracking) {
      // track cam implement
    }

    if (!this.nextThrowReady) {
      this.nextThrowReady = checkReadyThrow;

      if (checkReadyThrow) {
        this.cameraTracking = false;

        if (this.diceCallBack)
          this.diceCallBack();
      }
    }
  };

  render = () => {
    if (this.controls)
      this.controls.update();
    this.cannonDebugRenderer.update();

    this.updateObjects();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render);
  };
}
