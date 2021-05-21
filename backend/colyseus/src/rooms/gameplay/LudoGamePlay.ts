import { User } from './schema/User';
import { Room, Client } from "colyseus";
import { Dice } from "./schema/Dice";
import { GameRoom } from './schema/GameRoom';

export const NormalErrorCode = "[NORMAL]";

export const StartGame = "StartGame";
export const GameInProgress = "GameInProgress";
export const GetUserInRoom = "GetUserInRoom";
export const GetUserReady = "GetUserReady";
export const UserReady = "UserReady";
export const UserLeave = "UserLeave";
export const UserJoin = "UserJoin";
export const MeJoin = "MeJoin";
export const InitGamePlay = "InitGamePlay";
export const StartTurn = "StartTurn";
export const ThrowDice = "ThrowDice";
export const UpdatePieceState = "UpdatePieceState";
export const UserSkipTurn = "UserSkipTurn";
export const RollDicePoint = "RollDicePoint";
export const SyncPieceState = "SyncPieceState";

const maxPlayer = 4;

export class LudoGameplay extends Room<GameRoom> {

  setupEvent = () => {
    this.onMessage(UserReady, (client, message) => {
      console.log(message.userId, 'is ready...');
      this.state.setUserReady(message.userId, true);

      this.broadcast(UserReady, this.state.getUserReadyState(message.userId));

      if (this.state.userReadyToPlay()) {
        this.lock();
        this.broadcast(StartGame, this.state.getUserTurnState());
      }
    });
    this.onMessage(UserLeave, client => {
      this.broadcast(UserLeave, this.state.getUserByClientId(client.id));
    });
    this.onMessage(GetUserReady, (client, message) => {
      client.send(GetUserReady, this.state.getUserReady());
    });
    this.onMessage(UpdatePieceState, (client, message) => {
      this.broadcast(UpdatePieceState, this.state.updatePiece(message));
    });
    this.onMessage(UserSkipTurn, (client, message) => {
      this.broadcast(StartTurn, this.state.getUserTurnState());
    });
    this.onMessage(ThrowDice, (client, message) => {
      this.broadcast(ThrowDice, this.state.getDice(message.userId))
    });
    this.onMessage(RollDicePoint, (client, message) => {
      this.broadcast(RollDicePoint, this.state.updateDicePoint(message.dice1, message.dice2));
    })
    this.onMessage(SyncPieceState, (client, message) => {
      console.log(message);
      this.broadcast(SyncPieceState, message);
    })
  }

  // client join room by their id
  handleClientJoinRoom = (client: Client, options: any) => {
    this.setupEvent();
    
    this.state.addUser(new User(options.userId, client.id, false));
    this.broadcast(UserJoin, this.state.getUserInRoom());
    client.send(MeJoin, this.state.getUserJoinState(options.userId));

    console.log(options.userId, "joined room ", this.roomId);
    console.log("client count: ", this.clients.length);
  }

  handleClientLeaveRoom = (client: Client) => {
    this.broadcast(UserLeave, this.state.removeUserByClientId(client.id));

    if (this.state.isEmptyRoom()) {
      this.disconnect();
    } else {
      if (this.state.userReadyToPlay()) {
        this.lock();
        this.broadcast(StartGame, this.state.getUserTurnState());
      }
    }
  }

  onCreate (options: any) {
    this.maxClients = maxPlayer;
    this.setMetadata({roomAlias: options.roomAlias});
    // this.roomName = options.roomName;

    this.setState(new GameRoom());
  }

  onJoin (client: Client, options: any) {
    if (this.state.getUserById(options.userId)) {
      throw new Error(`${NormalErrorCode} You already join this room`);
    }
    this.handleClientJoinRoom(client, options);
  }

  onLeave (client: Client, _consented: boolean) {
    this.handleClientLeaveRoom(client);

    console.log(client.id, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}