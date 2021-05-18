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

let _client = new Colyseus.Client("ws://localhost:2567");
let _gameRoom: Colyseus.Room = null;
let _listRoom: IRoomClient[] = [];
let _gameplay = new MainGame();
let _currentRoomId = "";
let _userId = uuidv4();
let _listUserInRoom: IUser[] = [];  

export const getClient = () => _client;
export const getGameRoom = () => _gameRoom;
export const setGameRoom = (val) => _gameRoom = val;
export const getListRoom = () => _listRoom;
export const setListRoom = (val) => _listRoom = val;
export const getGameplay = () => _gameplay;
export const getCurrentRoomId = () => _currentRoomId;
export const setCurrentRoomId = (val) => _currentRoomId = val;
export const getUserId = () => _userId;
export const setUserId = (val) => _userId = val;
export const getListUserInRoom = () => _listUserInRoom;
export const setListUserInRoom = (val) => _listUserInRoom = val;

export const addUserInRoom = (user) => _listUserInRoom.push(user);
export const searchUserInRoom = (id) => _listUserInRoom.find(x => x.id === id);