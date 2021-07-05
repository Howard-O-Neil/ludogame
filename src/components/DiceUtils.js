import * as THREE from "./Graphic/three-dice/three";
import * as CANNON from "./Graphic/three-dice/cannon"
import "./Graphic/three-dice/CannonDebugRenderer";
import { DiceD6, DiceManager } from "./Graphic/three-dice/dice";
import { OrbitControls } from "./Graphic/three-dice/OrbitControls";
import { Sky } from "./Graphic/three-dice/Sky";

const GRAVITY = -1500;
const FPS = 1 / 60;
export default class DiceUtils {
  floorScale = [30, 30, 30];

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
    __wall_1: {
      let wall_1_Material = new THREE.MeshPhongMaterial({
        color: "#E1E1E1",
        side: THREE.DoubleSide,
      });
      let wall_1_Geometry = new THREE.BoxGeometry(50, 50, 1, 10);
      this.wall_1_ = new THREE.Mesh(wall_1_Geometry, wall_1_Material);
      this.wall_1_.visible = false;
      this.wall_1_.receiveShadow = true;
      this.wall_1_.geometry.scale(8, 8, 8);
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
      });
      this.world.add(this.wall_1_Body);
    }

    __wall_2: {
      let wall_2_Material = new THREE.MeshPhongMaterial({
        color: "#E1E1E1",
        side: THREE.DoubleSide,
      });
      let wall_2_Geometry = new THREE.BoxGeometry(50, 50, 1, 10);
      this.wall_2_ = new THREE.Mesh(wall_2_Geometry, wall_2_Material);
      this.wall_2_.visible = false;
      this.wall_2_.rotation.y = Math.PI / 2;
      this.wall_2_.receiveShadow = true;
      this.wall_2_.geometry.scale(8, 8, 8);
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

    console.log("=== shape ===");
    console.log(shape);

    this.floorBody = new CANNON.Body({
      mass: 0,
      shape: shape,
      quaternion: new CANNON.Quaternion(
        ...Object.values(this.floor.quaternion)
      ),
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
    this.listDice.push(new DiceD6({ backColor: "#ff0000" }));
    this.listDice.push(new DiceD6({ backColor: "#ff0000" }));

    for (let i = 0; i < this.listDice.length; i++) {
      this.scene.add(this.listDice[i].getObject());
      console.log(this.listDice[i].getObject().position);
    }

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
    this.camera.position.set(-60, 320, 65);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasTag,
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

  throwDice = (diceVals) => {
    if (this.nextThrowReady == false) return false;

    let i = 0;
    let diceValues = [];

    this.nextThrowReady = false;
    this.cameraTracking = true;

    for (const dice of this.listDice) {
      dice.getObject().position.x = 350 + i * 150;
      dice.getObject().position.y = 500;
      dice.getObject().position.z = -350 + i * 150;
      dice.updateBodyFromMesh();

      dice
        .getObject()
        .body.angularVelocity.set(
          50 * Math.random() + 20,
          50 * Math.random() + 20,
          50 * Math.random() + 20
        );

      let veloc = this.velocityToTarget(
        new CANNON.Vec3(
          dice.getObject().position.x,
          dice.getObject().position.y,
          dice.getObject().position.z
        ),
        new CANNON.Vec3(0, 0, 0),
        5
      );

      dice.getObject().body.velocity.set(veloc.x, veloc.y, veloc.z);

      diceValues.push({ dice: dice, value: diceVals[i] });
      i++;
    }
    DiceManager.prepareValues(diceValues);

    return true;
  };

  initWorker = async (diceCallBack) => {
    this.diceCallBack = diceCallBack;

    await this.initDiceUtils();
    requestAnimationFrame(this.render);

    document.onkeydown = (ev) => {
      if (ev.key == "f") {
        this.throwDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }
    };
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

      if (Math.abs(this.listDice[i].getObject().body.velocity.y) > 4) {
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
    if (Date.now() >= this.timeTarget) {
      this.controls.update();
      // this.cannonDebugRenderer.update();

      this.updateObjects();

      this.renderer.render(this.scene, this.camera);

      this.timeTarget += this.dt;
      if (Date.now() >= this.timeTarget) {
        this.timeTarget = Date.now();
      }
    }
    requestAnimationFrame(this.render);
  };
}