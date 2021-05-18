// import Board from "./components/Board";
// import Piece from "./components/Piece";
// import Dice from "./components/Dice";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import Board from "./components/Board";
import * as dat from "dat.gui";
import GameObject from "./components/GameObject";
import Piece from "./components/Piece";
import Dice from "./components/Dice";
import $ from "jquery";
import { CannonDebugRenderer, createCannonDebugger } from "./components/CannonDebug";


export let globalState = {
  sayHi: "",
};

export interface CyclinderBasicParam {
  radiusTop: number,
  radiusBottom: number,
  radialSegments: number,
  heightSegments: number,
}

const data = [
  [-5.439477664422223, 5.199988980367679, -5.308972802276404],
  [-5.393146085870269, 5.1999890702525435, -7.71029413378612],
  [-7.779093281241222, 5.1999884336587399, -7.6962970855280775],
  [-7.735512466757786, 5.199988657083725, -5.359430200465674],

  [-5.439477664422223 , 5.199988980367679, 5.308972802276404        + 0.25],
  [-5.393146085870269 , 5.1999890702525435, 7.71029413378612        + 0.25],
  [-7.779093281241222 , 5.1999884336587399, 7.6962970855280775      + 0.25],
  [-7.735512466757786 , 5.199988657083725, 5.359430200465674        + 0.25],

  [5.439477664422223 + 0.15, 5.199988980367679, -5.308972802276404],
  [5.393146085870269 + 0.15, 5.1999890702525435, -7.71029413378612],
  [7.779093281241222 + 0.15, 5.1999884336587399, -7.6962970855280775],
  [7.735512466757786 + 0.15, 5.199988657083725, -5.359430200465674],

  [5.439477664422223 + 0.1, 5.199988980367679, 5.308972802276404     + 0.15],
  [5.393146085870269 + 0.1, 5.1999890702525435, 7.71029413378612     + 0.15],
  [7.779093281241222 + 0.1, 5.1999884336587399, 7.6962970855280775   + 0.15],
  [7.735512466757786 + 0.1, 5.199988657083725, 5.359430200465674     + 0.15],
];

const colors = ["#8aacae", "#ca5452", "#d7c944", "#b4cb5f"];

const FPS = 1 / 60;

export default class MainGame {

  // display

  sky: Sky;
  sunPosition: THREE.Vector3;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbitControl: OrbitControls;
  gridHelper: THREE.GridHelper;

  cannonDebugger: CannonDebugRenderer;

  keyCodes: Array<boolean>;

  // physics

  world: CANNON.World;

  // gameplay

  gameObjectList: GameObject[];

  effectController: {
    turbidity: number,
    rayleigh: number,
    mieCoefficient: number,
    mieDirectionalG: number,
    elevation: number,
    azimuth: number,
    exposure: number,
  };

  constructor() {
    this.effectController = {
      turbidity: 10,
      rayleigh: 3,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.7,
      elevation: 2,
      azimuth: 180,
      exposure: null,
    }
    this.keyCodes = new Array(255);
    this.resetKeycode();
  }

  resetKeycode = () => {
    for (let i = 0; i < this.keyCodes.length; i++)
      this.keyCodes[i] = false;    
  }

  guiChanged = () => {
    const uniforms = this.sky.material.uniforms;
    uniforms["turbidity"].value = this.effectController.turbidity;
    uniforms["rayleigh"].value = this.effectController.rayleigh;
    uniforms["mieCoefficient"].value = this.effectController.mieCoefficient;
    uniforms["mieDirectionalG"].value = this.effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - this.effectController.elevation);
    const theta = THREE.MathUtils.degToRad(this.effectController.azimuth);

    this.sunPosition.setFromSphericalCoords(1, phi, theta);

    uniforms["sunPosition"].value.copy(this.sunPosition);

    this.sky.material.uniforms = {...uniforms};
    this.renderer.toneMappingExposure = this.effectController.exposure;
    this.renderer.render(this.scene, this.camera);
  }

  initSky = () => {
    // Add Sky
    this.effectController.exposure = this.renderer.toneMappingExposure;
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);

    this.sunPosition = new THREE.Vector3();

    /// GUI
    const gui = new dat.GUI();

    gui.add(this.effectController, "turbidity", 0.0, 20.0, 0.1).onChange(this.guiChanged);
    gui.add(this.effectController, "rayleigh", 0.0, 4, 0.001).onChange(this.guiChanged);
    gui.add(this.effectController, "mieCoefficient", 0.0, 0.1, 0.001)
      .onChange(this.guiChanged);
    gui.add(this.effectController, "mieDirectionalG", 0.0, 1, 0.001)
      .onChange(this.guiChanged);
    gui.add(this.effectController, "elevation", 0, 90, 0.1).onChange(this.guiChanged);
    gui.add(this.effectController, "azimuth", -180, 180, 0.1).onChange(this.guiChanged);
    gui.add(this.effectController, "exposure", 0, 1, 0.0001).onChange(this.guiChanged);

    this.scene.add(this.sky);
    this.guiChanged();
  };

  public initWorld = async () => {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -50, 0);
    this.world.allowSleep = true;
    this.world.broadphase.useBoundingBoxes = true;
  }

  public initGameplay = async (cameraPos: any, dices: any[]) => {
    // console.log(cameraPos, dices);
    // setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: <HTMLCanvasElement>($('.gameplay')[0])
    });
    // this.renderer.setSize(window.innerWidth, window.innerHeight);

    // document.body.appendChild(this.renderer.domElement);

    // camera + scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    window.onresize = (ev) => {
      // this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    };

    this.camera.position.fromArray(Object.values(cameraPos.position));

    const ambinentLight = new THREE.AmbientLight(); // soft whit light
    ambinentLight.intensity = 0.5;

    const spotLight = new THREE.PointLight();
    spotLight.intensity = 1;
    spotLight.position.set(10, -25, -10);

    this.scene.add(ambinentLight, spotLight);

    this.initSky();

    // this.gridHelper = new THREE.GridHelper(200, 2, 0xffffff, 0xffffff);
    // this.scene.add(this.gridHelper);

    // init game objects

    this.initWorld()

    this.gameObjectList = [];

    this.gameObjectList.push(new Board(this.world));

    for (let i = 0; i < dices.length; i++) {
      this.gameObjectList.push(new Dice(
        Object.values(dices[i].position), Object.values(dices[i].scale),
        this.camera, this.world));
    }
      

    for (let i = 0; i < data.length; i += 4) {

      for (let j = i; j < i + 4; j++) {
        this.gameObjectList.push(new Piece(
          colors[parseInt((j / 4).toString())],
          {
            radiusTop: 0.08,
            radiusBottom: 0.7,
            radialSegments: 2,
            heightSegments: 50
          },
          data[j], this.world));
      }
    }
    
    //cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
    // this.cannonDebugger = createCannonDebugger(this.scene, this.world);

    for (const obj of this.gameObjectList) {
      if (obj.getMesh) {
        const mesh = await obj.getMesh();
        this.scene.add(mesh);  
      }
    }

    // render function

    // keyboard
    $(document).on('keypress', ev => {
      let keycode = require('keycode');
      this.keyCodes[keycode(ev.key)] = true;
    });

    // setup orbit controls
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControl.autoRotate = true;
    this.orbitControl.autoRotateSpeed = 1;
    
    this.orbitControl.update();

    this.render();
  };

  keyboardHandle = () => {
    let keycode = require('keycode');
    
    for (const gameObj of this.gameObjectList) {
      if (gameObj.keyboardHandle)
        gameObj.keyboardHandle(this.keyCodes);
    }
    this.resetKeycode();
  }

  updatePhysics = () => {
    for (const gameObj of this.gameObjectList) {
      if (gameObj.update)
        gameObj.update();
    }
    this.world.step(FPS);
  }

  dt = FPS * 1000;
  timeTarget = 0;

  render = () => {
    if (Date.now()>= this.timeTarget) {
      this.orbitControl.update();
    
      this.keyboardHandle();
      this.updatePhysics();

      this.renderer.render(this.scene, this.camera);

      this.timeTarget += this.dt;
      if (Date.now() >= this.timeTarget){
        this.timeTarget = Date.now();
      }
    }
    requestAnimationFrame(this.render);

    // this.cannonDebugger.update();

    
  }
}

require('./gameplayHandler'); // load gameplay handler