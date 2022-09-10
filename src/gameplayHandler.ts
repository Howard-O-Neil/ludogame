import GameplayState, { IPiece, IRoomClient, IUser } from './components/State/GameplayState';
import $ from 'jquery';
import { downloadOutput, getFormSubmitValue, uuidv4 } from "./utils";
import { GetUserReady, MeJoin, RollDicePoint, StartGame, StartTurn, SyncPieceState, ThrowDice, UpdatePieceState, UserJoin, UserLeave, UserReady, UserSkipTurn } from "./gameEvent";
import Piece from './components/Piece';
import Board from './components/Board';
import GameObject from './components/GameObject';
import DiceCanvas from './components/DiceCanvas';
import { chatState, createChatRoom, showChatBox, joinChatRoom } from './chatHandler';

// require('./chatHandler'); // load gameplay chat

if (window.location.pathname == '/') {
  if (!window.sessionStorage.getItem('userId'))
    window.location.href = '/account'
}

export const state = new GameplayState(window.sessionStorage.getItem('userId'));
chatState.configChatState(state.getClient(), state.getUserId());

export const diceManager = new DiceCanvas($('.gameToolBox .diceArea .diceAreaPlayground')[0]);
diceManager.initWorker()

const CHEAT_DICE = true
var cheat_dice1 = -1
var cheat_dice2 = -1

const loadGame = () => {
  // state.getGameRoom().onMessage(ThrowDice, mess => {
  //   diceManager.throwDiceOnSchema(mess.dice, mess.camera);
  // });

  $('.gameToolBox .toolBox #throwDice').on('click', ev => {
    if (state.getHaveThrowDiceStatus() || !diceManager.nextThrowReady)
      return;

    if (CHEAT_DICE) {
      cheat_dice1 = parseInt(prompt("cheat dice 1 value", "1"));
      cheat_dice2 = parseInt(prompt("cheat dice 2 value", "1"));
    }

    state.getGameRoom().send(ThrowDice, {
      userId: state.getUserId(),
    });
    state.setHaveThrowDiceStatus(true);
    configToolBoxOnState();
  });

  $('.gameToolBox .toolBox #skipTurn').on('click', ev => {
    if (!state.getSkipTurnStatus())
      return;

    state.resetToolbox();
    state.setCurrentTurn('');
    state.setPointDice1(0);
    state.setPointDice2(0);
    state.getGameRoom().send(UserSkipTurn, {userId: state.getUserId()});
    configToolBoxOnState();
  });
  $('.gameToolBox .toolBox #movePiece').on('click', ev => {
    if (!state.getCanMovePieceStatus())
      return

    alert('Please click directly on your dice');
  });
};

const displayDots = (num: number, jqueryComponent) => {
  let cls = 'odd-'
  if (num % 2 === 0) {
    cls = 'even-'
  }

  $(jqueryComponent).empty();
  for (let i = 1; i <= num; i++) {
    $(jqueryComponent).append('<div class="dot ' + cls + i + '"></div>');
  }
}

// document.addEventListener("keydown", ev => {
//   if (ev.key == 'w') {
//     const piece = state.getGamePiece(state.getUserId())[0];
//     piece.goByStep(5);
//   }
//   if (ev.key == 'r') {
//     const piece = state.getGamePiece(state.getUserId())[0];
//     piece.returnBase();
//   }
//   if (ev.key == 's') {
//     const piece = state.getGamePiece(state.getUserId())[0];
//     piece.goByStep(1);
//   }
// })

const configUserAction = () => {
  if (state.getCurrentTurn() == state.getUserId()) {
    if (state.getHaveThrowDiceStatus() && state.getPointDice1() != 0 && state.getPointDice2() != 0) {
      const pieces = state.getGamePiece(state.getUserId());
  
      if (pieces.filter(x => x.checkAvailable(state.getPointDice1() + state.getPointDice2())).length > 0) {
        state.setCanMovePieceStatus(true);
      } else state.setCanMovePieceStatus(false);
    }
  } else {
    state.resetToolbox();
  }
}

export const configToolBoxOnState = () => {
  const dice1 = state.getPointDice1();
  const dice2 = state.getPointDice2();

  displayDots(dice1, '#dice1');
  displayDots(dice2, '#dice2');

  $('.gameToolBox .toolBox #throwDice').prop('disabled', true);
  $('.gameToolBox .toolBox #movePiece').prop('disabled', true);
  $('.gameToolBox .toolBox #skipTurn').prop('disabled', true);

  configUserAction();

  if (!state.getHaveThrowDiceStatus()) {
    $('.gameToolBox .toolBox #throwDice').prop('disabled', false);
  } else $('.gameToolBox .toolBox #throwDice').prop('disabled', true);

  if (state.getCanMovePieceStatus())
    $('.gameToolBox .toolBox #movePiece').prop('disabled', false);
  else $('.gameToolBox .toolBox #movePiece').prop('disabled', true);

  if (state.getSkipTurnStatus())
    $('.gameToolBox .toolBox #skipTurn').prop('disabled', false);
  else $('.gameToolBox .toolBox #skipTurn').prop('disabled', true);
}
configToolBoxOnState();


const setUserStatus = (val: IUser) => {
  const elementSelectString = `#${val.id} .user-list-favourite-time`;
  $(elementSelectString).empty();

  const user = <IUser>state.searchUserInRoom(val.id);
  user.isReady = val.isReady;

  if (user.isReady) {
    $(elementSelectString).append(
      $(`
        <a class="user-list-favourite order-2 text-success" href="#"><i class="fas fa-check-circle"></i></a>
        <span class="user-list-time order-1">Ready&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      `));
  } else {
    $(elementSelectString).append(
      $(`
        <a class="user-list-favourite order-2 text-info" href="#"><i class="fas fa-clock"></i></a>
        <span class="user-list-time order-1">Waiting...</span>
      `));
  }
}

const setUserTurnIcon = (userId: string) =>  {
  const elementSelectString = `#${userId}`;

  $('.userInRoom .userInRoomList .users-list').removeClass('users-main');
  $(elementSelectString).addClass('users-main');
}

const handleShowUserInfo = (ev: JQuery.ClickEvent, id: string, isModal: boolean = true) => {
}

const handleShowChatBox = (ev: JQuery.ClickEvent, id: string) => {

}

const handleUserReady = (mess: any) => {
  if (mess.user.id === state.getUserId())
    state.getGameplay().setCameraStopOrbitAuto(mess.camera);

  state.setUserCommonPath(mess.user.id, mess.commonPath.data);
  state.setUserFinalPath(mess.user.id, mess.finalPath.data);
  state.setUserPiece(mess.user.id, <IPiece[]>mess.pieces.data);  

  const sample_x = state.getUserPiece(mess.user.id)[0]

  // for (const pos of mess.fullFinal) {
  //   const piece = new Piece(
  //     sample_x.color, 5,
  //     {
  //       radiusTop: 0.08,
  //       radiusBottom: 0.6,
  //       radialSegments: 2,
  //       heightSegments: 50
  //     },
  //     Object.values(pos),
  //     state.getGameplay().getWorld(),
  //     mess.user.id,
  //   );
  //   state.getGameplay().addObject([piece]);
  // }

  // for (const pos of mess.commonPath.data) {
  //   const piece = new Piece(
  //     sample_x.color, sample_x.order,
  //     {
  //       radiusTop: 0.08,
  //       radiusBottom: 0.6,
  //       radialSegments: 2,
  //       heightSegments: 50
  //     },
  //     Object.values(pos),
  //     state.getGameplay().getWorld(),
  //     mess.user.id,
  //   );
  //   state.getGameplay().addObject([piece]);
  // }

  // load piece to map
  state.getGameplay().addObject(
    state.getUserPiece(mess.user.id).map(x => {
      const piece = new Piece(
        x.color, x.order,
        {
          radiusTop: 0.08,
          radiusBottom: 0.6,
          radialSegments: 2,
          heightSegments: 50
        },
        Object.values(x.initPosition),
        state.getGameplay().getWorld(),
        mess.user.id,
      );
      state.addGamePiece(mess.user.id, piece);
      return piece;
    })
  )
}

const handleUpdatePiece = (mess: any) => {
  const piece = <Piece>state.getGamePiece(mess.userId).find(x => x.order === mess.data.order);
  piece.targetPoint = mess.data.targetPoint;
  piece.prevStep = mess.data.prevStep;
  piece.nextStep = mess.data.nextStep;
  piece.goal = mess.data.goal;
  piece.isReturn = mess.data.isReturn;
  piece.atBase = mess.data.atBase;
}

const syncPiece = (piece: Piece) => {
  // sync data

  // step: 1,
  // userId: listPieceAvailable[0].userId,
  // order: listPieceAvailable[0].order,

  let step = state.getPointDice1() + state.getPointDice2();
  if (piece.atBase) step = 1;

  state.setCurrentTurn('');
  state.setCanMovePieceStatus(false);
  state.setPointDice1(0);
  state.setPointDice2(0);

  state.getGameRoom().send(SyncPieceState, {
    step, userId: piece.userId, order: piece.order,
  });
}

const handleAddUserUI = (mess: IUser) => {
  // state.addUserInRoom(mess);

  const element = $(`
    <tr class="users-list" id="${mess.id}">
      <td class="title">
        <div class="thumb">
          <img class="img-fluid" src="${mess.avatar}" alt="">
        </div>
        <div class="user-list-details">
          <div class="user-list-info">
            <div class="user-list-title">
              <h5 class="mb-0"><a class="showUserInfo" href="#">${mess.name} 
                ${mess.id === state.getUserId() ? "( YOU )" : ""}</a></h5>
            </div>
            <div class="user-list-option">
              <ul class="list-unstyled">
                <li><i class="fas fa-filter pr-1"></i>${mess.jobTitle}</li>
                <li><i class="fas fa-map-marker-alt pr-1"></i>${mess.address}</li>
              </ul>
            </div>
          </div>
        </div>
      </td>
      <td class="user-list-favourite-time text-center">
        
      </td>
      <td class="user-list-favourite-function">
        <ul class="list-unstyled mb-0 d-flex justify-content-end">
          <li><a class="showUserInfo" class="text-primary" data-toggle="tooltip" title="" data-original-title="chat"><i class="far fa-eye"></i></a></li>
          <li><a class="showChatBox class="text-info" data-toggle="tooltip" title="" data-original-title="view"><i class="far fa-comment-dots"></i></a></li>
        </ul>
      </td>
    </tr>
  `)
  $('.userInRoom tbody').append(element);

  $(`.userInRoom tbody #${mess.id} .list-unstyled .showUserInfo`).on('click', ev => {
    ev.preventDefault();
    handleShowUserInfo(ev, mess.id, true);
  });

  $(`.userInRoom tbody #${mess.id} .user-list-title .showUserInfo`).on('click', ev => {
    ev.preventDefault();
    handleShowUserInfo(ev, mess.id, false);
  });

  $(`.userInRoom tbody #${mess.id} .showChatBox`).on('click', ev => {
    ev.preventDefault();
    handleShowChatBox(ev, mess.id);
  });
}

const handleUserLeaveUI = (mess: IUser) => {
  $(`#${mess.id}`).remove();
}

const gameObjectIntersectCallback = (gameObj: THREE.Object3D) => {
  switch (gameObj["objInfo"].tag) {
    case 'piece': {
      if (state.getCurrentTurn() == state.getUserId() && gameObj["objInfo"].userId == state.getUserId() 
        && state.getCanMovePieceStatus()) {
        const piece = state.getGamePiece(gameObj["objInfo"].userId)
          .find(x => x.order == gameObj["objInfo"].order);
        
        if (piece) {
          if (piece.checkAvailable(state.getPointDice1() + state.getPointDice2())) {
            piece.colorAvailable();
          } else {
            piece.colorUnAvailable();
          }
        }
      }
    }
  }
}

const gameObjectIntersectLeaveCallback = (gameObj: THREE.Object3D) => {
  switch (gameObj["objInfo"].tag) {
    case 'piece': {
      if (state.getCurrentTurn() == state.getUserId()) {
        const piece = state.getGamePiece(gameObj["objInfo"].userId)
          .find(x => x.order == gameObj["objInfo"].order);

        if (piece)
          piece.colorDefault();
      }
    }
  }
}

const gameObjectIntersectMouseClickCallback = (gameObj: THREE.Object3D) => {
  switch (gameObj["objInfo"].tag) {
    case 'piece': {
      if (state.getCurrentTurn() == state.getUserId() && gameObj["objInfo"].userId == state.getUserId() 
        && state.getCanMovePieceStatus()) {
        const piece = state.getGamePiece(gameObj["objInfo"].userId)
          .find(x => x.order == gameObj["objInfo"].order);

        if (piece) {
          if (piece.checkAvailable(state.getPointDice1() + state.getPointDice2())) {
            syncPiece(piece);
            state.getGamePiece(state.getUserId()).forEach(x => x.colorDefault());
          }
        }
      }
    }
  }
}

const gameObjectIntersectMouseDownCallback = (gameObj: THREE.Object3D) => {
  // switch (gameObj["objInfo"].tag) {
  //   case 'piece': {
  //     if (state.getCurrentTurn() == state.getUserId() && state.getCanMovePieceStatus()) {
  //       const piece = state.getGamePiece(gameObj["objInfo"].userId)
  //         .find(x => x.order == gameObj["objInfo"].order);

  //       console.log("check piece");
  //       console.log(piece.checkAvailable(state.getPointDice1() + state.getPointDice2()))

  //       if (piece.checkAvailable(state.getPointDice1() + state.getPointDice2())) {
  //         syncPiece(piece);
  //       }
  //     }
  //   }
  // }
}

// do something revert mouse down effect
const gameObjectIntersectMouseUpCallback = (gameObj: THREE.Object3D) => {
  // switch (gameObj["objInfo"].tag) {
  //   case 'piece': {
  //     const piece = state.getGamePiece(gameObj["objInfo"].userId)
  //       .find(x => x.order == gameObj["objInfo"].order);
  //     piece.makeAvailableColor();
  //   }
  // }
}

const initGameEvent = () => {
  const gameRoom = state.getGameRoom();

  gameRoom.onLeave((_) => {
    location.reload();
  });

  gameRoom.onError((code) => {
    location.reload();
  })

  gameRoom.onMessage(UserJoin, (mess) => {
    state.setListUserInRoom(mess.userList);
    chatState.setListUserInRoom(mess.userList);

    showChatBox();
    $('.userInRoom tbody').empty();

    for (const user of mess.userList) {
      handleAddUserUI(user);
      setUserStatus(user);
    }
  });
  gameRoom.onMessage(StartGame, (mess) => {
    loadGame();

    state.setCurrentTurn(mess.userId);
    state.setHaveThrowDiceStatus(false);
    state.setSkipTurnStatus(true);

    setUserTurnIcon(mess.userId);
    configToolBoxOnState();
  });
  gameRoom.onMessage(UserLeave, (mess) => {
    handleUserLeaveUI(mess);
  });
  gameRoom.onMessage(MeJoin, (mess) => {
    state.getGameplay().initGameplay(mess.cameraPos)
      .then(_ => {
        state.getGameRoom().send(GetUserReady, '');
      })
  });
  gameRoom.onMessage(GetUserReady, (mess: any) => {
    // downloadOutput(mess, 'test.json');

    for (const payload of mess.data) {
      handleUserReady(payload);
    }
  });
  gameRoom.onMessage(UserReady, (mess) => {
    if (mess.user.id === state.getUserId()) {
      $('#startGame').prop('disabled', true);
    }
    setUserStatus(mess.user);
    handleUserReady(mess);
  });
  // gameRoom.onMessage(UpdatePieceState, (mess) => {
  //   handleUpdatePiece(mess);
  // });
  gameRoom.onMessage(StartTurn, (mess) => {
    state.setCurrentTurn(mess.userId);
    state.setHaveThrowDiceStatus(false);
    state.setSkipTurnStatus(true);
    
    setUserTurnIcon(mess.userId);
    configToolBoxOnState();
  });
  gameRoom.onMessage(ThrowDice, (mess) => {
    if (CHEAT_DICE) {
      diceManager.throwDice([cheat_dice1, cheat_dice2], mess.dice.angularVeloc, mess.dice.rotation, () => {
        state.setPointDice1(cheat_dice1);
        state.setPointDice2(cheat_dice2);
  
        configToolBoxOnState();
      });  
    } else {
      diceManager.throwDice(mess.diceVals, mess.dice.angularVeloc, mess.dice.rotation, () => {
        state.setPointDice1(mess.diceVals[0]);
        state.setPointDice2(mess.diceVals[1]);
  
        configToolBoxOnState();
      });
    }
  });
  // gameRoom.onMessage(RollDicePoint, (mess) => {
  //   state.setPointDice1(mess.dice1);
  //   state.setPointDice2(mess.dice2);

  //   displayToolBoxOnState();
  // });
  gameRoom.onMessage(SyncPieceState, (mess) => {
    const piece = state.getGamePiece(mess.userId).find(x => x.order === mess.order);

    piece.goByStep(mess.step);
  })
}

const initGamePlay = () => {
  $('.userInRoom tbody').empty();
  $('.selectRoom').hide();
  $('.userInRoom').show();
  $('.gameplay').show();

  initGameEvent()

  state.getGameplay().setGameObjectIntersectCallback(gameObjectIntersectCallback);
  state.getGameplay().setGameObjectIntersectLeaveCallback(gameObjectIntersectLeaveCallback);
  state.getGameplay().setGameObjectIntersectMouseDownCallback(gameObjectIntersectMouseDownCallback);
  state.getGameplay().setGameObjectIntersectMouseUpCallback(gameObjectIntersectMouseUpCallback);
  state.getGameplay().setGameObjectIntersectMouseClickCallback(gameObjectIntersectMouseClickCallback);
}

$('#startGame').on('click', ev => {
  state.getGameRoom().send(UserReady, {userId: state.getUserId()})
})

// handle join room
$('.selectRoom form').on('submit', ev => {
  ev.preventDefault();

  const formValue = getFormSubmitValue('.selectRoom form');
  joinRoom(state.getListRoom().find(x => x.roomId === formValue['choosenRoomId']));
  // console.log(ev);
});

// handle create room
$('#createRoom').on('click', ev => {
  ev.preventDefault();

  const roomAlias = window.prompt('Input Room Name', 'lets play');

  if (!roomAlias) {
    alert('you have to input roomName');
    return;
  }
  // console.log(roomAlias);

  state.getClient().create("gameplay", { roomAlias, userId: state.getUserId() })
    .then(room => {
      state.setCurrentRoomId(room.id);
      state.setGameRoom(room);

      createChatRoom(roomAlias, room.id);

      initGamePlay();
      getRoom();
    })
})

const joinRoom = (room: IRoomClient) => {
  if (!room) {
    alert('room is not available');
    return;
  }
  state.setCurrentRoomId(room.roomId);
  state.getClient().joinById(room.roomId, { userId: state.getUserId() })
    .then(room => {
      state.setGameRoom(room);
      joinChatRoom(room.id);

      initGamePlay();
    })
    .catch(_ => {
      // console.log(message);
    })
}

// handle load room id
const displayRoomId = (arr: IRoomClient[]) => {
  $('.selectRoom form .formBody').empty();

  for (const room of arr.reverse()) {
    const element = $(`
      <div class="form-check">
        <input class="form-check-input" type="radio" name="choosenRoomId" value="${room.roomId}" id="${uuidv4()}" 
          ${arr.findIndex(x => x === room) === 0 ? "checked" : ""}>
        <label class="form-check-label" for="${uuidv4()}">
          ${`${room.roomAlias} (${room.roomId})`}
        </label>
      </div>`);

    $('.selectRoom form .formBody').append(element);
  }
}

const getRoom = (callBack?: any) => {
  state.getClient().getAvailableRooms("gameplay")
    .then((x) => {
      if (x.length > 0) {
        state.setListRoom(x.map(x1 => {
          return {
            roomId: x1.roomId,
            roomAlias: x1.metadata.roomAlias
          }
        }));
        displayRoomId(state.getListRoom());
      } else {
        $('.selectRoom form .formBody').append(
          $(`<div style="margin-top: 10px;">There is currently no room available</div>`),
          $(`<div style="margin-bottom: 50px;">Create new room or refresh your browser</div>`)
        );
      }
      if (callBack) callBack()
    })
    .catch(er => {
      $('.selectRoom form .formBody').append(
        $(`<div style="margin-top: 10px;">Cannot connect to server</div>`),
        $(`<div style="margin-bottom: 50px;">Please try again later</div>`)
      );
    })
}
getRoom();