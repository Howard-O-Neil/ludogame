import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Sky } from "three/examples/jsm/objects/Sky";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import Board from "./components/Board";
import * as dat from "dat.gui";
import GameObject from "./components/GameObject";
import $ from "jquery";
import { CannonDebugRenderer, createCannonDebugger } from "./components/CannonDebug";
export const cannonTypeMaterials: Map<string, CANNON.Material> = new Map();
cannonTypeMaterials['slippery'] = new CANNON.Material('slippery');
cannonTypeMaterials['ground'] = new CANNON.Material('ground');


export let globalState = {
  sayHi: "",
};

export interface CyclinderBasicParam {
  radiusTop: number,
  radiusBottom: number,
  radialSegments: number,
  heightSegments: number,
}

export const FPS = 1 / 60;
export const GRAVITY = -500;

export default class MainGame {

  gameObjIntersectCallBack: (gameObj: THREE.Object3D) => void; // callback
  gameObjIntersectLeaveCallBack: (gameObj: THREE.Object3D) => void; // callback
  gameObjIntersectMouseDownCallBack: (gameObj: THREE.Object3D) => void; // callback
  gameObjIntersectMouseUpCallBack: (gameObj: THREE.Object3D) => void; // callback

  // display

  sky: Sky;
  sunPosition: THREE.Vector3;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer = null;
  orbitControl: OrbitControls;
  gridHelper: THREE.GridHelper;

  cannonDebugger: CannonDebugRenderer;

  cannonContactMaterials: CANNON.ContactMaterial[];

  keyCodes: Array<boolean>;

  // physics

  world: CANNON.World;

  // gameplay

  gameObjectRaycaster: THREE.Raycaster;
  gameObjectIntersect: Map<string, THREE.Object3D>;

  mouseMove: THREE.Vector2;
  mouseDown: THREE.Vector2;
  mouseUp: THREE.Vector2;

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
    this.gameObjectIntersect = new Map();
    // define CANNON.Material

    this.cannonContactMaterials = [];

    this.cannonContactMaterials.push(new CANNON.ContactMaterial(
      cannonTypeMaterials['ground'], cannonTypeMaterials['ground'],
      {
        friction: 100,
        restitution: 0.0,
      }
    ));

    this.cannonContactMaterials.push(new CANNON.ContactMaterial(
      cannonTypeMaterials['ground'], cannonTypeMaterials['slippery'],
      {
        friction: 0,
        restitution: 0.3,
      }
    ));

    // end define

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

    this.world = new CANNON.World();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    window.onresize = (ev) => {
      // this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    };
    this.gameObjectList = [];
  }

  public getWorld = () => {
    return this.world;
  }

  public getCamera = () => {
    return this.camera;
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

    console.log("sky effect")
    console.log(this.effectController.turbidity)
    console.log(this.effectController.elevation)
    console.log(this.effectController.azimuth)
    console.log(this.effectController.exposure)

    const phi = THREE.MathUtils.degToRad(90 - this.effectController.elevation);
    const theta = THREE.MathUtils.degToRad(this.effectController.azimuth);

    this.sunPosition.setFromSphericalCoords(1, phi, theta);

    uniforms["sunPosition"].value.copy(this.sunPosition);

    this.sky.material.uniforms = { ...uniforms };
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
    this.world.gravity.set(0, GRAVITY, 0);
    this.world.allowSleep = true;
    this.world.broadphase.useBoundingBoxes = true;

    for (const contactMaterial of this.cannonContactMaterials) {
      this.world.addContactMaterial(contactMaterial);
    }
  }

  public addObject = (obj: GameObject[]) => {
    obj.forEach(x => {
      if (x.getMesh) {
        x.getMesh().then(mesh => {

          if (mesh) {
            if (Array.isArray(mesh)) {
              this.scene.add(...mesh);
            }
            else {
              this.scene.add(mesh);
            }
          }
          this.gameObjectList.push(x);
        })
      }
    });
  }

  // public removeObject = (callBack: (item) => boolean) => {
  //   this.gameObjectList = this.gameObjectList.filter(item => !callBack(item));
  // }

  public setCameraStopOrbitAuto = (cameraPos: any) => {
    this.camera.position.fromArray(Object.values(cameraPos.position));
    this.orbitControl.autoRotate = false;
  }

  public setGameObjectIntersectCallback = (intersectCallBack: (gameObj: THREE.Object3D) => void) => {
    this.gameObjIntersectCallBack = intersectCallBack
  }

  public setGameObjectIntersectLeaveCallback = (intersectCallBack: (gameObj: THREE.Object3D) => void) => {
    this.gameObjIntersectLeaveCallBack = intersectCallBack
  }

  public setGameObjectIntersectMouseDownCallback = (intersectCallBack: (gameObj: THREE.Object3D) => void) => {
    this.gameObjIntersectMouseDownCallBack = intersectCallBack
  }

  public setGameObjectIntersectMouseUpCallback = (intersectCallBack: (gameObj: THREE.Object3D) => void) => {
    this.gameObjIntersectMouseUpCallBack = intersectCallBack
  }


  public initGameplay = async (cameraPos: any) => { // iddle
    if (this.renderer !== null) // game already launch
      return;
    // console.log(cameraPos, dices);
    // setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: <HTMLCanvasElement>($('.gameplay')[0]),
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    // this.renderer.setSize(window.innerWidth, window.innerHeight);

    // document.body.appendChild(this.renderer.domElement);    

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

    this.gameObjectList.push(new Board(this.getWorld()));
    this.initWorld();

    // for (let i = 0; i < data.length; i += 4) {

    //   for (let j = i; j < i + 4; j++) {
    //     this.gameObjectList.push(new Piece(
    //       colors[parseInt((j / 4).toString())],
    //       {
    //         radiusTop: 0.08,
    //         radiusBottom: 0.7,
    //         radialSegments: 2,
    //         heightSegments: 50
    //       },
    //       data[j], this.world));
    //   }
    // }

    //cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
    this.cannonDebugger = createCannonDebugger(this.scene, this.world);
    this.gameObjectRaycaster = new THREE.Raycaster();

    this.mouseMove = new THREE.Vector2();
    this.mouseDown = new THREE.Vector2();
    this.mouseUp = new THREE.Vector2();

    for (const obj of this.gameObjectList) {
      if (obj.getMesh) {
        const mesh = await obj.getMesh();

        if (mesh) {
          if (Array.isArray(mesh)) {
            this.scene.add(...mesh);
          }
          else this.scene.add(mesh);
        }
      }
    }

    // render function

    // keyboard
    $(document).on('keypress', ev => {
      let keycode = require('keycode');
      this.keyCodes[keycode(ev.key)] = true;
    });

    
    $(document).on('mousemove', ev => {
      this.mouseMove.x = ( ev.clientX / window.innerWidth ) * 2 - 1;
      this.mouseMove.y = -( ev.clientY / window.innerHeight ) * 2 + 1;
    });

    $(document).on('mousedown', ev => {
      this.mouseDown.x = ( ev.clientX / window.innerWidth ) * 2 - 1;
      this.mouseDown.y = -( ev.clientY / window.innerHeight ) * 2 + 1;
    });


    $(document).on('mouseup', ev => {
      this.mouseUp.x = ( ev.clientX / window.innerWidth ) * 2 - 1;
      this.mouseUp.y = -( ev.clientY / window.innerHeight ) * 2 + 1;
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

  updateObjects = () => {
    for (const gameObj of this.gameObjectList) {
      if (gameObj.update)
        gameObj.update();
    }
    this.world.step(FPS);
  }

  raycastGameObject = () => {
    // mouse move
    this.gameObjectRaycaster.setFromCamera(this.mouseMove, this.camera);

    const gameObjList = this.scene.children.filter(
      x => x.type == "Group" && x["objInfo"] && x["objInfo"].raycast);
      
    const intersectedObjects = this.gameObjectRaycaster.intersectObjects(gameObjList, true);

    for (let i = 0; i < intersectedObjects.length; i++) {
      this.gameObjectIntersect.set(
        intersectedObjects[i].object.parent.uuid, intersectedObjects[i].object.parent);
      
      let gameObjIndex = gameObjList.findIndex(x => x.uuid == intersectedObjects[i].object.parent.uuid);
      gameObjList.splice(gameObjIndex, 1);

      if (this.gameObjIntersectCallBack)
        this.gameObjIntersectCallBack(intersectedObjects[i].object.parent)
    }

    for (let i = 0; i < gameObjList.length; i++) {
      if (this.gameObjectIntersect.get(gameObjList[i].uuid)) {
        if (this.gameObjIntersectLeaveCallBack)
          this.gameObjIntersectLeaveCallBack(gameObjList[i])

        this.gameObjectIntersect.delete(gameObjList[i].uuid);
      }
    }

    // mouse down
    this.gameObjectRaycaster.setFromCamera(this.mouseDown, this.camera);

    const gameObjList_down = this.scene.children.filter(
      x => x.type == "Group" && x["objInfo"] && x["objInfo"].raycast);
      
    const intersectedObjects_down = this.gameObjectRaycaster.intersectObjects(gameObjList_down, true);
    for (let i = 0; i < intersectedObjects_down.length; i++) {
      if (this.gameObjIntersectMouseDownCallBack)
        this.gameObjIntersectMouseDownCallBack(intersectedObjects_down[i].object.parent)
    }
    this.mouseDown = new THREE.Vector2();

    // mouse up
    this.gameObjectRaycaster.setFromCamera(this.mouseUp, this.camera);

    const gameObjList_up = this.scene.children.filter(
      x => x.type == "Group" && x["objInfo"] && x["objInfo"].raycast);
      
    const intersectedObjects_up = this.gameObjectRaycaster.intersectObjects(gameObjList_up, true);
    for (let i = 0; i < intersectedObjects_up.length; i++) {
      if (this.gameObjIntersectMouseUpCallBack)
        this.gameObjIntersectMouseUpCallBack(intersectedObjects_up[i].object.parent)
    }
    this.mouseUp = new THREE.Vector2();
  }

  dt = FPS * 1000;
  timeTarget = 0;
  render = () => {
    if (Date.now() >= this.timeTarget) {
      this.orbitControl.update();
      
      this.keyboardHandle();

      this.raycastGameObject();
      this.updateObjects();

      this.renderer.render(this.scene, this.camera);

      this.timeTarget += this.dt;
      if (Date.now() >= this.timeTarget) {
        this.timeTarget = Date.now();
      }
    }
    requestAnimationFrame(this.render);

    // this.cannonDebugger.update();    
  }
}
// require('./testDataBoard');
require('./gameplayHandler'); // load gameplay handler