import { User } from './schema/User';
import { Room, Client } from "colyseus";
import { Dice } from "./schema/Dice";
import { GameRoom } from './schema/GameRoom';

export const NormalErrorCode = "[NORMAL]";

export const StartGame = "StartGame";
export const GameInProgress = "GameInProgress";
export const UserReady = "UserReady";
export const UserLeave = "UserLeave";
export const UserJoin = "UserJoin";
export const InitGamePlay = "InitGamePlay";

const maxPlayer = 4;

export class LudoGameplay extends Room<GameRoom> {

  // client join room by their id
  handleClientJoinRoom = (client: Client, options: any) => {
    this.onMessage(StartGame, client => {
      this.state.setUserReady(options.clientId, true);

      client.send(InitGamePlay, this.state.getUserInitGameState(options.clientId));
      this.broadcast(UserReady, this.state.getUserById(options.clientId));

      if (this.state.userReadyToPlay()) {
        this.lock();
        this.broadcast(GameInProgress, this.state.getUserInitGameState(options.clientId));
      }
    });
    this.onMessage(UserLeave, client => {
      this.broadcast(UserLeave, this.state.getUserByClientId(client.id));
    });

    this.state.addUser(new User(options.clientId, client.id, false));
    this.broadcast(UserJoin, this.state.getUserById(options.clientId));

    console.log(options.clientId, "joined room ", this.roomId);
    console.log("client count: ", this.clients.length);
  }

  handleClientLeaveRoom = (client: Client) => {
    this.broadcast(UserLeave, this.state.removeUserByClientId(client.id));
    if (this.state.isEmptyRoom()) {
      this.disconnect();
    }
  }

  onCreate (options: any) {
    this.maxClients = maxPlayer;
    this.setMetadata({roomAlias: options.roomAlias});
    // this.roomName = options.roomName;

    this.setState(new GameRoom());
  }

  onJoin (client: Client, options: any) {
    if (this.state.getUserById(options.clientId)) {
      throw new Error(`${NormalErrorCode} You already join this room`);
    }
    this.handleClientJoinRoom(client, options);
  }

  onLeave (client: Client, _consented: boolean) {
    this.broadcast(UserLeave, this.state.getUserByClientId(client.id));
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}