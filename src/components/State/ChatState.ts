import * as Colyseus from "colyseus.js";
import { IUser } from "./GameplayState";

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  textContent: string;
  attachment: string;
  created_at: number;
}

export default class ChatState {
  private _client: Colyseus.Client;
  private _chatRoom: Colyseus.Room;
  private _chatRoomId: string;
  private _userId: string;
  private _listUserInRoom: IUser[];
  
  constructor() {
    this._chatRoom = null;
  }

  public configChatState(client: Colyseus.Client, userId: string) {
    this._client = client;
    this._userId = userId;
  }

  public getClient = () => this._client;
  public getUserId = () => this._userId;
  public getChatRoom = () => this._chatRoom;
  public setChatRoom = (val) => this._chatRoom = val;
  public getCurrentChatRoomId = () => this._chatRoomId;
  public setCurrentChatRoomId = (val) => this._chatRoomId = val;
  public getListUserInRoom = (): IUser[] => this._listUserInRoom;
  public setListUserInRoom = (val) => this._listUserInRoom = val;
}