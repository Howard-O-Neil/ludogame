import * as Colyseus from "colyseus.js";
import MainGame from "./main";
import $ from 'jquery';
import { uuidv4 } from "./utils";
import { InitGameState } from "./gameEvent";

// <div class="form-check">
//   <input class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1">
//   <label class="form-check-label" for="flexRadioDefault1">
//     Default radio
//   </label>
// </div>

interface IRoomClient {
  roomId: string;
  roomAlias: string;
}

export const client = new Colyseus.Client("ws://localhost:2567");
export let gameRoom: Colyseus.Room = null;

export let listRoom: IRoomClient[] = [];
export let currentRoomId = "";
export let clientId = uuidv4();

export const gameplay = new MainGame();

const getFormSubmitValue = (jquerySelectString: string) => {
  let values = {};
  $.each($(jquerySelectString).serializeArray(), function(i, field) {
    values[field.name] = field.value;
  });
  return values;
}

// <tr class="users-list">
// <td class="title">
//   <div class="thumb">
//     <img class="img-fluid" src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="">
//   </div>
//   <div class="user-list-details">
//     <div class="user-list-info">
//       <div class="user-list-title">
//         <h5 class="mb-0"><a href="#">Brooke Kelly</a></h5>
//       </div>
//       <div class="user-list-option">
//         <ul class="list-unstyled">
//           <li><i class="fas fa-filter pr-1"></i>Information Technology</li>
//           <li><i class="fas fa-map-marker-alt pr-1"></i>Rolling Meadows, IL 60008</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// </td>
// <td class="user-list-favourite-time text-center">
//   <a class="user-list-favourite order-2 text-danger" href="#"><i class="fas fa-heart"></i></a>
//   <span class="user-list-time order-1">Shortlisted</span>
// </td>
// <td>
//   <ul class="list-unstyled mb-0 d-flex justify-content-end">
//     <li><a href="#" class="text-primary" data-toggle="tooltip" title="" data-original-title="chat"><i class="far fa-eye"></i></a></li>
//     <li><a href="#" class="text-info" data-toggle="tooltip" title="" data-original-title="view"><i class="far fa-comment-dots"></i></a></li>
//   </ul>
// </td>
// </tr>

// handle join room
$('.selectRoom form').on('submit', ev => {
  ev.preventDefault();

  const formValue = getFormSubmitValue('.selectRoom form');
  joinRoom(listRoom.find(x => x.roomId === formValue['choosenRoomId']));
  // console.log('what the fuck')
  // console.log(ev);
})

// handle create room
$('#createRoom').on('click', ev => {
  ev.preventDefault();

  const roomAlias = window.prompt('Input Room Name', 'lets play');

  if (!roomAlias) {
    alert('you have to input roomName');
    return;
  }
  // console.log(roomAlias);

  client.create("gameplay", {roomAlias, clientId})
    .then(room => {
      currentRoomId = room.id;
      gameRoom = room;

      gameRoom.onMessage(InitGameState, mess => {
        $('.selectRoom').hide();
        gameplay.initGameplay(mess.camera, mess.dices);
      });

      getRoom();
    })
})

const joinRoom = (room: IRoomClient) => {
  if (!room) {
    alert('room is not available');
    return;
  }
  currentRoomId = room.roomId;

  client.joinById(room.roomId, {clientId})
    .then(room => {
      gameRoom = room;
      gameRoom.onMessage(InitGameState, mess => {
        $('.selectRoom').hide();
        gameplay.initGameplay(mess.camera, mess.dices);
      })
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
  client.getAvailableRooms("gameplay").then((x) => {
    if (x.length > 0) {
      listRoom = x.map(x1 => {
        return {
          roomId: x1.roomId,
          roomAlias: x1.metadata.roomAlias
        }
      });
      loadRoomId(listRoom);      
    } else {
      $('.selectRoom form .formBody').append(
        $(`<div style="margin-top: 10px;">There is currently no room available</div>`)
      );
      $('.selectRoom form .formBody').append(
        $(`<div style="margin-bottom: 50px;">Create new room or refresh your browser</div>`)
      );
      // $('.selectRoom form .formBody').append(
      //   $(`<div>There is currently no room available</div>`));
    }
    if (callBack) callBack()
  });
}
getRoom();

