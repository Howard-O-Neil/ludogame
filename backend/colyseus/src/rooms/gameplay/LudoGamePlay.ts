import { User } from './schema/User';
import { GameState } from './schema/GameState';
import { Room, Client } from "colyseus";
import { Dice } from "./schema/Dice";
import { GameRoom } from './schema/GameRoom';

export const NormalErrorCode = "[NORMAL]";

export const StartGame = "StartGame";
export const StartPlaying = "StartPlaying";
export const InitGameState = "InitGameState";

const maxPlayer = 4;

export class LudoGameplay extends Room<GameRoom> {
  clientJoinRoom = (client: Client, options: any) => {
    this.state.slots.push(new User(options.clientId, false));

    console.log(options.clientId, "joined room ", this.roomId);
    console.log("client count: ", this.clients.length);

    client.send(InitGameState, {
      camera: this.state.getCameraPosition(options.clientId),
      dices: this.state.getDice(),
    });
  }

  onCreate (options: any) {
    this.maxClients = maxPlayer;
    this.setMetadata({roomAlias: options.roomAlias});
    // this.roomName = options.roomName;

    this.setState(new GameRoom());

    this.onMessage(StartGame, client => {
      this.state.getClientById(client.id).startPlaying = true;
      client.send(InitGameState, this.state.getCameraPosition(client.id));

      if (this.state.userReadyToPlay()) {
        this.broadcast(StartPlaying, this.state.getClientGameState());
      }
    })
  }

  onJoin (client: Client, options: any) {
    if (this.state.getClientById(options.clientId)) {
      throw new Error(`${NormalErrorCode} You already join this room`);
    }
    this.clientJoinRoom(client, options);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}