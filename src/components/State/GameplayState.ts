import * as Colyseus from "colyseus.js";
import MainGame from "../../main";
import { uuidv4 } from "../../utils";

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

export class GameplayState {
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

  constructor() {
    this._client = new Colyseus.Client("ws://localhost:2567");
    this._gameRoom = null;
    this._listRoom = [];
    this._userCommonPath = new Map();
    this._userFinalPath = new Map();
    this._userPiece = new Map();

    this._gameplay = new MainGame();
    this._userId = uuidv4();
    this._currentRoomId = "";
    this._listUserInRoom = [];
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
}