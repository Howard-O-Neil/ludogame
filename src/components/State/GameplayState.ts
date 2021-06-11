import * as Colyseus from "colyseus.js";
import MainGame from "../../main";
import { uuidv4 } from "../../utils";
import Piece from "../Piece";

export interface IRoomClient {
  roomId: string;
  roomAlias: string;
}

export interface IUser {
  address: string;
  avatar: string;
  clientId: string;
  id: string;
  isReady: boolean;
  jobTitle: string;
  name: string;
  order: number;
}

export interface IPiece {
  order: number;
  initPosition: any; // position x, y, z
  color: string;
  prevStep: number;
  nextStep: number;
  isReturn: boolean;
}

export default class GameplayState {
  private _client: Colyseus.Client;
  private _gameRoom: Colyseus.Room;
  private _listRoom: IRoomClient[];
  private _gameplay: MainGame;
  private _userId: string;
  private _currentRoomId: string;
  private _listUserInRoom: IUser[];
  private _userCommonPath: Map<string, any[]>; // list position x, y, z
  private _userFinalPath: Map<string, any[]>; // list position x, y, z
  private _userPiece: Map<string, IPiece[]>;
  private _gamePiece: Map<string, Piece[]>;
  private _currentTurn: string;
  private _haveThrowDice: boolean;
  private _pointDice1: number;
  private _pointDice2: number;
  private _enableToolBox: boolean;
  private _canSpawn: boolean;
  private _canGoNext: boolean;

  constructor() {
    this._client = new Colyseus.Client("ws://localhost:2567");
    this._gameRoom = null;
    this._listRoom = [];
    this._userCommonPath = new Map();
    this._userFinalPath = new Map();
    this._gamePiece = new Map();
    this._userPiece = new Map();
    this._gameplay = new MainGame();
    this._userId = uuidv4();
    this._currentRoomId = "";
    this._pointDice1 = this._pointDice2 = 0;
    this._listUserInRoom = [];
    this._haveThrowDice = false;
    this._enableToolBox = false;
    this._canSpawn = false;
    this._canGoNext = false;
    this._currentTurn = '';
  }

  public getClient = () => this._client;
  public getGameRoom = () => this._gameRoom;
  public setGameRoom = (val) => this._gameRoom = val;
  public getListRoom = () => this._listRoom;
  public setListRoom = (val) => this._listRoom = val;
  public getGameplay = () => this._gameplay;
  public getCurrentRoomId = () => this._currentRoomId;
  public setCurrentRoomId = (val) => this._currentRoomId = val;
  public getUserId = () => this._userId;
  public getListUserInRoom = (): IUser[] => this._listUserInRoom;
  public setListUserInRoom = (val) => this._listUserInRoom = val;

  public addUserInRoom = (user) => this._listUserInRoom.push(user);
  public searchUserInRoom = (id) => this._listUserInRoom.find(x => x.id === id);

  public getUserCommonPath = (id): any[] => this._userCommonPath[id];
  public getUserFinalPath = (id): any[] => this._userFinalPath[id];
  public getUserPiece = (id): IPiece[] => this._userPiece[id];

  public setUserCommonPath = (id, data: any[]) => this._userCommonPath[id] = data;
  public setUserFinalPath = (id, data: any[]) => this._userFinalPath[id] = data;
  public setUserPiece = (id, data: IPiece[]) => this._userPiece[id] = data;

  public addGamePiece = (id, data: Piece) => {
    if (!this._gamePiece[id])
      this._gamePiece[id] = [];
    this._gamePiece[id].push(data);
  } 
  public setGamePiece = (id, data: Piece[]) => this._gamePiece[id] = data;
  public getGamePiece = (id): Piece[] => this._gamePiece[id];

  public getPointDice1 = () => this._pointDice1;
  public getPointDice2 = () => this._pointDice2;
  public setPointDice1 = (val) => this._pointDice1 = Math.floor(val);
  public setPointDice2 = (val) => this._pointDice2 = Math.floor(val);

  public getCurrentTurn = () => this._currentTurn;
  public setCurrentTurn = (val) => this._currentTurn = val;

  public getHaveThrowDice = () => this._haveThrowDice;
  public setHaveThrowDice = (val) => this._haveThrowDice = val;

  public setEnableToolBox = (val) => this._enableToolBox = val;
  public getEnableToolBox = () => this._enableToolBox;

  public setCanSpawn = (val) => this._canSpawn = val;
  public getCanSpawn = () => this._canSpawn;
  
  public setCanGoNext = (val) => this._canGoNext = val;
  public getCanGoNext = () => this._canGoNext;
}