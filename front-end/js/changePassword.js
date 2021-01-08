'use strict';

(function () {
  function toast(msg, type) {
    let t = document.body.querySelector('.toast');
    if (t) {
      t.remove();
    }
    t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = msg;
    document.body.insertBefore(t, document.body.firstChild);
  }

  const client = new RestClient('/api');

  async function changePassword(email, username, password, passwordCheck) {
    const changePassword = await client.put("changePassword", {email: email, username: username, password: password, passwordCheck: passwordCheck});
    if(changePassword.status === true){
      window.location = '/';
    } else {
      switch(changePassword.errorCode){
        case 1:
            toast('Email/Username not found', 'error');
            break;
        case 2:
            toast('You entered two different passwords', 'error');
            break;
      }
    }
  }

  function init() {
    const changeButton = document.querySelector('button[id=change-password]');
    changeButton.addEventListener('click', function(){
        const email = (document.querySelector('input[id=email]').value || '').trim();
        const username = (document.querySelector('input[id=username]').value || '').trim();
        const password = (document.querySelector('input[id=password]').value || '').trim();
        const passwordCheck = (document.querySelector('input[id=password-check]').value || '').trim();
        if (!email || !username || !password || !passwordCheck) {
        toast('You must first enter all the fields', 'error');
      } else {
        changePassword(email, username, password, passwordCheck);
      }
    });
  }
  init();
})();
