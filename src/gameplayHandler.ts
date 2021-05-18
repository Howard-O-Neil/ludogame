import { getGameRoom, getListRoom, getClient, getUserId, setCurrentRoomId, setGameRoom, IRoomClient, setListRoom, IUser, addUserInRoom, getGameplay, searchUserInRoom } from './components/State/GameplayState';
import MainGame from "./main";
import $ from 'jquery';
import { getFormSubmitValue, uuidv4 } from "./utils";
import { UserJoin } from "./gameEvent";

const setUserStatus = (id: string) => {
  const elementSelectString = `#${id} .user-list-favourite-time`;
  $(elementSelectString).empty();

  const user = <IUser>searchUserInRoom(id);

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

const handleShowUserInfo = (ev: JQuery.ClickEvent, id: string, isModal: boolean = true) => {
  if (isModal) alert('fuck');
}

const handleShowChatBox = (ev: JQuery.ClickEvent, id: string) => {

}

const handleAddUserUI = (mess: IUser) => {
  $('.selectRoom').hide();
  $('.userInRoom').show();
  $('.gameplay').show();

  const element = $(`
    <tr class="users-list" id="${mess.id}">
      <td class="title">
        <div class="thumb">
          <img class="img-fluid" src="${mess.avatar}" alt="">
        </div>
        <div class="user-list-details">
          <div class="user-list-info">
            <div class="user-list-title">
              <h5 class="mb-0"><a class="showUserInfo" href="#">${mess.name}</a></h5>
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

const initGameEvent = () => {
  $('.userInRoom tbody').empty();

  const gameRoom = getGameRoom();
  gameRoom.onMessage(UserJoin, (mess: IUser) => {
    addUserInRoom(mess);
    handleAddUserUI(mess);

    setUserStatus(mess.id);
    getGameplay().initGameplay({position: {x: 15, y: 12, z: 15}}, []);
  });
}

// handle join room
$('.selectRoom form').on('submit', ev => {
  ev.preventDefault();

  const formValue = getFormSubmitValue('.selectRoom form');
  joinRoom(getListRoom().find(x => x.roomId === formValue['choosenRoomId']));
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

  getClient().create("gameplay", {roomAlias, clientId: getUserId()})
    .then(room => {
      setCurrentRoomId(room.id);
      setGameRoom(room);

      initGameEvent();
      getRoom();
    })
})

const joinRoom = (room: IRoomClient) => {
  if (!room) {
    alert('room is not available');
    return;
  }
  setCurrentRoomId(room.roomId);
  getClient().joinById(room.roomId, {clientId: getUserId()})
    .then(room => {
      setGameRoom(room);

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
  getClient().getAvailableRooms("gameplay").then((x) => {
    if (x.length > 0) {
      setListRoom(x.map(x1 => {
        return {
          roomId: x1.roomId,
          roomAlias: x1.metadata.roomAlias
        }
      }));
      loadRoomId(getListRoom());      
    } else {
      $('.selectRoom form .formBody').append(
        $(`<div style="margin-top: 10px;">There is currently no room available</div>`),
        $(`<div style="margin-bottom: 50px;">Create new room or refresh your browser</div>`)
      );
    }
    if (callBack) callBack()
  });
}
getRoom();