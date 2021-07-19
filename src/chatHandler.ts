import { LoadPrevMessage, SendMessage } from './chatEvent';
import $ from "jquery";
import ChatState, { ChatMessage } from "./components/State/ChatState";
import { uuidv4 } from './utils';

$('.chatbox').hide();

export const chatState = new ChatState();

const initChatEvent = () => {
  const chatRoom = chatState.getChatRoom();

  chatRoom.onMessage(SendMessage, (mess) => {
    const msg = <ChatMessage>mess;

    if (msg.senderId != chatState.getUserId()) {
      loadReceivedMsg(msg);
    } else {
      loadSentMsg(msg);
    }
  });
  chatRoom.onMessage(LoadPrevMessage, (mess) => {
    for (const msg of <ChatMessage[]>mess.listMess) {
      console.log('load prev message')
      if (msg.senderId != chatState.getUserId()) {
        loadReceivedMsg(msg);
      } else {
        loadSentMsg(msg);
      }  
    }
  })
}

export const createChatRoom = (roomAlias: string, roomId: string) => {
  chatState.getClient().joinOrCreate("chat", {
    roomAlias: `[Chat] - ${roomAlias}`,
    roomId: `chat-${roomId}`,
    userId: chatState.getUserId(),
  }).then(room => {
    chatState.setCurrentChatRoomId(room.id);
    chatState.setChatRoom(room);

    initChatEvent();
  });
}

export const joinChatRoom = (roomId: string) => {
  chatState.getClient().joinById(`chat-${roomId}`, {
    userId: chatState.getUserId(),
  }).then(room => {
    chatState.setCurrentChatRoomId(room.id);
    chatState.setChatRoom(room);

    initChatEvent();
  });
}

export const showChatBox = () => {
  $('.chatbox').show();
}

// send function start

const loadSentMsg = (msg: ChatMessage) => {
  let userInfo = chatState.getListUserInRoom().find(x => x.id == msg.senderId);
  let time = new Date(msg.created_at);

  let body = 
      `
        <div class="row msg_container base_sent">
          <div class="col-md-10 col-xs-10">
            <div class="messages msg_sent">
              <p>${msg.textContent}</p>
              <time datetime="${time.toLocaleString()}">${userInfo.name} • ${time.toLocaleString()}</time>
            </div>
          </div>
          <div class="col-md-2 col-xs-2 avatar">
            <img src="${userInfo.avatar}"
              class="chatimg img-responsive ">
          </div>
        </div>
      `;
  $(body).appendTo("#messagebody");
  $("#messagebody").animate({ scrollTop: $("#messagebody")[0].scrollHeight }, 'slow');
}

const loadReceivedMsg = (msg: ChatMessage) => {
  let userInfo = chatState.getListUserInRoom().find(x => x.id == msg.senderId);
  let time = new Date(msg.created_at);

  let body = 
      `
        <div class="row msg_container base_receive">
          <div class="col-md-2 col-xs-2 avatar">
            <img
              src="${userInfo.avatar}"
              class="chatimg img-responsive ">
          </div>
          <div class="col-md-10 col-xs-10">
            <div class="messages msg_receive">
              <p>${msg.textContent}</p>
              <time datetime="${time.toLocaleString()}">${userInfo.name} • ${time.toLocaleString()}</time>
            </div>
          </div>
        </div>
      `;
  $(body).appendTo("#messagebody");
  $("#messagebody").animate({ scrollTop: $("#messagebody")[0].scrollHeight }, 'slow');
}

const sendText = () => {
  let txt = <string>($("#btn-input").val());

  const msg: ChatMessage = {
    id: uuidv4(),
    senderId: chatState.getUserId(),
    textContent: txt,
    attachment: '',
    chatRoomId: chatState.getChatRoom().id,
    created_at: Date.now()
  }
  chatState.getChatRoom().send(SendMessage, msg)
  $("#btn-input").val("")
}

// send function end

$("#btn-chat").on("click", function () {
  sendText()
});

$('#btn-input').on("keypress", function (e) {
  if (e.key == "Enter") {
    sendText()
  }
});



// $(document).on('click', '.panel-heading span.icon_minim', function (e) {
//   let $this = $(this);
//   if (!$this.hasClass('panel-collapsed')) {
//     $this.parents('.panel').find('.panel-body').slideUp();
//     $this.addClass('panel-collapsed');
//     $this.removeClass('glyphicon-minus').addClass('glyphicon-plus');
//   } else {
//     $this.parents('.panel').find('.panel-body').slideDown();
//     $this.removeClass('panel-collapsed');
//     $this.removeClass('glyphicon-plus').addClass('glyphicon-minus');
//   }
// });
// $(document).on('focus', '.panel-footer input.chat_input', function (e) {
//   let $this = $(this);
//   if ($('#minim_chat_window').hasClass('panel-collapsed')) {
//     $this.parents('.panel').find('.panel-body').slideDown();
//     $('#minim_chat_window').removeClass('panel-collapsed');
//     $('#minim_chat_window').removeClass('glyphicon-plus').addClass('glyphicon-minus');
//   }
// });
// $(document).on('click', '#new_chat', function (e) {
//   let size = $(".chat-window:last-child").css("margin-left");
//   let size_total = parseInt(size) + 400;
//   alert(size_total);
//   let clone = $("#chat_window_1").clone().appendTo(".container");
//   clone.css("margin-left", size_total);
// });
// $(document).on('click', '.icon_close', function (e) {
//   //$(this).parent().parent().parent().parent().remove();
//   $("#chatbox").hide();
// });