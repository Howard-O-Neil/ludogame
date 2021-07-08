import $ from "jquery";

$(document).on('click', '.panel-heading span.icon_minim', function (e) {
  let $this = $(this);
  if (!$this.hasClass('panel-collapsed')) {
    $this.parents('.panel').find('.panel-body').slideUp();
    $this.addClass('panel-collapsed');
    $this.removeClass('glyphicon-minus').addClass('glyphicon-plus');
  } else {
    $this.parents('.panel').find('.panel-body').slideDown();
    $this.removeClass('panel-collapsed');
    $this.removeClass('glyphicon-plus').addClass('glyphicon-minus');
  }
});
$(document).on('focus', '.panel-footer input.chat_input', function (e) {
  let $this = $(this);
  if ($('#minim_chat_window').hasClass('panel-collapsed')) {
    $this.parents('.panel').find('.panel-body').slideDown();
    $('#minim_chat_window').removeClass('panel-collapsed');
    $('#minim_chat_window').removeClass('glyphicon-plus').addClass('glyphicon-minus');
  }
});
$(document).on('click', '#new_chat', function (e) {
  let size = $(".chat-window:last-child").css("margin-left");
  let size_total = parseInt(size) + 400;
  alert(size_total);
  let clone = $("#chat_window_1").clone().appendTo(".container");
  clone.css("margin-left", size_total);
});
$(document).on('click', '.icon_close', function (e) {
  //$(this).parent().parent().parent().parent().remove();
  $("#chatbox").hide();
});

// send function start

function send() {
  let chat = $("#btn-input").val();
  let dt = new Date();
  let time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();

  if (chat == "") {
    alert('Enter Message');
  } else {
    var body = 
      `
        <div class="row msg_container base_sent">
          <div class="col-md-10 col-xs-10">
            <div class="messages msg_sent">
              <p>${chat}</p>
              <img src="https://images.ctfassets.net/hrltx12pl8hq/7yQR5uJhwEkRfjwMFJ7bUK/dc52a0913e8ff8b5c276177890eb0129/offset_comp_772626-opt.jpg?fit=fill&w=800&h=300" alt="Girl in a jacket" width="200" height="200">
              <time datetime="2009-11-13T20:00">Admininstrator • Today ${time}</time>
            </div>
          </div>
          <div class="col-md-2 col-xs-2 avatar">
            <img src="https://cheme.mit.edu/wp-content/uploads/2017/01/stephanopoulosgeorge-431x400.jpg"
              class="chatimg img-responsive ">
          </div>
        </div>
      `;
  }
  $(body).appendTo("#messagebody");
  $('#btn-input').val('');
  $("#messagebody").animate({ scrollTop: $("#messagebody")[0].scrollHeight }, 'slow');
}


// send function end




$("#btn-chat").on("click", function () {
  send()
});

$('#btn-input').on("keypress", function (e) {
  if (e.key == "Enter") {
    send()
  }
});