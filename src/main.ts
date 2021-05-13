// import Board from "./components/Board";
// import Piece from "./components/Piece";
// import Dice from "./components/Dice";
import * as Colyseus from "colyseus.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as THREE from "three";
import Board from "./components/Board";
import * as dat from "dat.gui";

let client = new Colyseus.Client("ws://localhost:2567");

export let globalState = {
  sayHi: "",
};

// client.joinOrCreate("main_game").then(room => {
//   // client.send("powerup", { kind: "ammo" });
//   console.log('==== client ====')
//   console.log(client);
//   room.onStateChange((state) => {
//     console.log(state)
//   })
//   console.log(room.sessionId, "joined", room.name);
// }).catch(e => {
//   console.log("JOIN ERROR", e);
// });

const data = [
  [-5.439477664422223, 1.199988980367679, -5.308972802276404],
  [-5.393146085870269, 1.1999890702525435, -7.71029413378612],
  [-7.779093281241222, 1.1999884336587399, -7.6962970855280775],
  [-7.735512466757786, 1.199988657083725, -5.359430200465674],
];

const colors = ["#8aacae", "#b4cb5f", "#ca5452", "#d7c944"];

export default class MainGame {
  sky: Sky;
  sunPosition: THREE.Vector3;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  gridHelper: THREE.GridHelper;

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

    gui.add(this.effectController, "turbidity", 0.0, 20.0, 0.1).onChange(() => this.guiChanged());
    gui.add(this.effectController, "rayleigh", 0.0, 4, 0.001).onChange(() => this.guiChanged());
    gui
      .add(this.effectController, "mieCoefficient", 0.0, 0.1, 0.001)
      .onChange(() => this.guiChanged());
    gui
      .add(this.effectController, "mieDirectionalG", 0.0, 1, 0.001)
      .onChange(() => this.guiChanged());
    gui.add(this.effectController, "elevation", 0, 90, 0.1).onChange(() => this.guiChanged());
    gui.add(this.effectController, "azimuth", -180, 180, 0.1).onChange(() => this.guiChanged());
    gui.add(this.effectController, "exposure", 0, 1, 0.0001).onChange(() => this.guiChanged());

    this.scene.add(this.sky);
    this.guiChanged();
  };

  public initGameplay = async () => {
    // setup renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    // camera + scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    window.onresize = (ev) => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    };

    this.camera.position.fromArray([-11.5, 14, 15.5]);

    const ambinentLight = new THREE.AmbientLight(); // soft white light
    ambinentLight.intensity = 0.5;

    const spotLight = new THREE.PointLight();
    spotLight.intensity = 1;
    spotLight.position.set(10, -25, -10);

    this.scene.add(ambinentLight, spotLight);

    this.initSky();

    this.gridHelper = new THREE.GridHelper(200, 2, 0xffffff, 0xffffff);
    this.scene.add(this.gridHelper);

    // init game objects
    const board = new Board();

    const mesh = await board.getMesh();
    this.scene.add(mesh);

    // render function

    // tool for inspect information
    document.addEventListener("keydown", (ev) => {
      if (ev.shiftKey && ev.key === "c") {
        console.log(`===== camera position =====`);
        console.log(this.camera.position);
      }
    });

    // setup orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    this.render();
  };

  render = () => {
    this.renderer.render(this.scene, this.camera);

    this.controls.update();

    requestAnimationFrame(this.render);
  }
}


const game = new MainGame();
game.initGameplay();