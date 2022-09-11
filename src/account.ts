import $ from "jquery"

$('#btn-login').on('click', ev => {
  const formVal = $('#loginform').serializeArray();

  const body = {
    username: formVal.find(x => x.name == 'username').value,
    password: formVal.find(x => x.name == 'password').value,
  }

  fetch(`${process.env.API_URL}/user/sign-in`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json())
    .then(data => {
      if (data.status && data.status == 'failed') {
        alert(data.message);
        return;
      }
      window.sessionStorage.setItem('userId', data.id);
      window.location.href = '../';
    });
})

$('#btn-signup').on('click', ev => {
  const formVal = $('#signupform').serializeArray();
  console.log()

  if (formVal.find(x => x.name == 're-passwd').value != formVal.find(x => x.name == 'passwd').value) {
    alert('you type wrong password');
    return;
  }
  const body = {
    username: formVal.find(x => x.name == 'username').value,
    password: formVal.find(x => x.name == 'passwd').value,
  }

  fetch(`${process.env.API_URL}/user/sign-up`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json())
    .then(data => {
      if (data.status && data.status == 'failed') {
        alert(data.message);
        return
      }
      console.log(data)
      $('#signinlink').trigger('click')
    });
})