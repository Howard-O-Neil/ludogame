import { User } from './schema/User';
import { GameState } from './schema/GameState';
import { Room, Client } from "colyseus";
import { Dice } from "./schema/Dice";
import { GameRoom } from './schema/GameRoom';

export const StartGame = "StartGame";
export const StartPlaying = "StartPlaying";
export const SetCameraPosition = "SetCameraPosition";

const maxPlayer = 4;

export class LudoGameplay extends Room<GameRoom> {
  onCreate (options: any) {
    this.maxClients = maxPlayer;
    this.setMetadata({roomAlias: options.roomAlias});
    // this.roomName = options.roomName;

    this.setState(new GameRoom());

    this.onMessage(StartGame, client => {
      this.state.getClientById(client.id).startPlaying = true;
      client.send(SetCameraPosition, this.state.getCameraPosition(client.id));

      if (this.state.userReadyToPlay()) {
        this.clients.forEach(client => {
          client.send(StartPlaying, this.state.getClientGameState());
        });
      }
    })
  }

  onJoin (client: Client, options: any) {
    this.state.slots.push(new User(client.id, false));
    console.log(client.id, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}