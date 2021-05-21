import GameplayState, { IPiece, IRoomClient, IUser } from './components/State/GameplayState';
import $ from 'jquery';
import { downloadOutput, getFormSubmitValue, uuidv4 } from "./utils";
import { GetUserReady, MeJoin, RollDicePoint, StartGame, StartTurn, SyncPieceState, ThrowDice, UpdatePieceState, UserJoin, UserLeave, UserReady, UserSkipTurn } from "./gameEvent";
import Piece from './components/Piece';
import Board from './components/Board';
import GameObject from './components/GameObject';
import DiceManager from './components/DiceManager';

export const state = new GameplayState();

const loadGame = () => {
  const diceManager = new DiceManager(state.getGameplay().getCamera(),
    state.getGameplay().getWorld());

  state.getGameplay().addObject([diceManager]);

  state.getGameRoom().onMessage(ThrowDice, mess => {
    diceManager.throwDiceOnSchema(mess.dice, mess.camera);
  });

  $('.gameToolBox .toolBox #throwDice').on('click', ev => {
    state.getGameRoom().send(ThrowDice, {userId: state.getUserId()});
    state.setHaveThrowDice(true);
  });
  $('.gameToolBox .toolBox #skipTurn').on('click', ev => {
    state.getGameRoom().send(UserSkipTurn, {userId: state.getUserId()});
    state.setHaveThrowDice(false);
  });
  $('.gameToolBox .toolBox #spawnNewPiece').on('click', ev => {
    const listPieceAvailable = state.getGamePiece(state.getUserId()).filter(x => x.atBase === true);
    if (listPieceAvailable.length > 0) {
      state.getGameRoom().send(SyncPieceState, {
        step: 1,
        userId: listPieceAvailable[0].userId,
        order: listPieceAvailable[0].order,
      });
    }
  });
  $('.gameToolBox .toolBox #goOldPiece').on('click', ev => {
    const listPieceAvailable = state.getGamePiece(state.getUserId()).filter(x => x.atBase === false);
    if (listPieceAvailable.length > 0) {

      state.getGameRoom().send(SyncPieceState, {
        step: state.getPointDice1() + state.getPointDice2(),
        userId: listPieceAvailable[0].userId,
        order: listPieceAvailable[0].order,
      });
    }
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



export const displayToolBoxOnState = () => {
  const dice1 = state.getPointDice1();
  const dice2 = state.getPointDice2();

  displayDots(dice1, '#dice1');
  displayDots(dice2, '#dice2');

  $('.gameToolBox .toolBox #throwDice').prop('disabled', true);
  $('.gameToolBox .toolBox #skipTurn').prop('disabled', true);
  $('.gameToolBox .toolBox #goOldPiece').prop('disabled', true);
  $('.gameToolBox .toolBox #spawnNewPiece').prop('disabled', true);

  if (state.getCurrentTurn() === state.getUserId()) {
    
    if (!state.getHaveThrowDice()) {
      $('.gameToolBox .toolBox').prop('disabled', true);
      $('.gameToolBox .toolBox #throwDice').prop('disabled', false);
      $('.gameToolBox .toolBox #skipTurn').prop('disabled', false);
    } else {
      $('.gameToolBox .toolBox').prop('disabled', true);
      $('.gameToolBox .toolBox #goOldPiece').prop('disabled', false);
      $('.gameToolBox .toolBox #skipTurn').prop('disabled', false);

      const listPieceAvailable = state.getGamePiece(state.getUserId()).filter(x => x.atBase === false);
      if (listPieceAvailable.length <= 0) {
        $('.gameToolBox .toolBox #goOldPiece').prop('disabled', true);
      }

      const listPieceAvailable1 = state.getGamePiece(state.getUserId()).filter(x => x.atBase === true);
        if (listPieceAvailable1.length <= 0) {
          $('.gameToolBox .toolBox #spawnNewPiece').prop('disabled', true);
        } else $('.gameToolBox .toolBox #spawnNewPiece').prop('disabled', false);

      // if (dice1 === dice2 && (dice1 === 1 || dice1 === 6)) {
        
      // }
    }
  }
}
displayToolBoxOnState();


const setUserStatus = (val: IUser) => {
  const elementSelectString = `#${val.id} .user-list-favourite-time`;
  $(elementSelectString).empty();

  const user = <IUser>state.searchUserInRoom(val.id);
  user.isReady = val.isReady;

  if (user.isReady) {
    $(elementSelectString).append(
      $(`
        <a class="user-list-favourite order-2 text-success" href="#"><i class="fas fa-check-circle"></i></a>
        <span class="user-list-time order-1">Ready</span>
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
  if (isModal) alert('fuck');
}

const handleShowChatBox = (ev: JQuery.ClickEvent, id: string) => {

}

const handleUserReady = (mess: any) => {
  if (mess.user.id === state.getUserId())
    state.getGameplay().setCameraStopOrbitAuto(mess.camera);

  state.setUserCommonPath(mess.user.id, mess.commonPath.data);
  state.setUserFinalPath(mess.user.id, mess.finalPath.data);
  state.setUserPiece(mess.user.id, <IPiece[]>mess.pieces.data);

  // load piece to map
  state.getGameplay().addObject(
    state.getUserPiece(mess.user.id).map(x => {
      const piece = new Piece(
        x.color, x.order,
        {
          radiusTop: 0.08,
          radiusBottom: 0.7,
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
      <td>
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

const initGameEvent = () => {
  $('.userInRoom tbody').empty();
  $('.selectRoom').hide();
  $('.userInRoom').show();
  $('.gameplay').show();

  const gameRoom = state.getGameRoom();

  gameRoom.onLeave((_) => {
    location.reload();
  });

  gameRoom.onError((code) => {
    location.reload();
  })

  gameRoom.onMessage(UserJoin, (mess) => {
    state.setListUserInRoom(mess.userList);

    $('.userInRoom tbody').empty();

    for (const user of mess.userList) {
      handleAddUserUI(user);
      setUserStatus(user);
    }
  });
  gameRoom.onMessage(StartGame, (mess) => {
    loadGame();

    if (mess.userId === state.getUserId())
      state.setCurrentTurn(mess.userId);
    setUserTurnIcon(mess.userId);
    displayToolBoxOnState();
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
  gameRoom.onMessage(UpdatePieceState, (mess) => {
    handleUpdatePiece(mess);
  });
  gameRoom.onMessage(StartTurn, (mess) => {
    state.setCurrentTurn(mess.userId);
    setUserTurnIcon(mess.userId);

    displayToolBoxOnState();
  });
  gameRoom.onMessage(RollDicePoint, (mess) => {
    state.setPointDice1(mess.dice1);
    state.setPointDice2(mess.dice2);

    displayToolBoxOnState();
  });
  gameRoom.onMessage(SyncPieceState, (mess) => {
    const piece = state.getGamePiece(mess.userId).find(x => x.order === mess.order);

    console.log(piece);
    piece.goByStep(mess.step);
  })
}

$('#startGame').on('click', ev => {
  state.getGameRoom().send(UserReady, {userId: state.getUserId()})
})

// handle join room
$('.selectRoom form').on('submit', ev => {
  ev.preventDefault();

  const formValue = getFormSubmitValue('.selectRoom form');
  joinRoom(state.getListRoom().find(x => x.roomId === formValue['choosenRoomId']));
  // console.log('what the fuck')
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

      initGameEvent();
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

      initGameEvent();
    })
    .catch(_ => {
      // console.log(message);
    })
}

// handle load room id
const loadRoomId = (arr: IRoomClient[]) => {
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
        loadRoomId(state.getListRoom());
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