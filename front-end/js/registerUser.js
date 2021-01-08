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

  async function signUp(email, username, password, passwordCheck) {
    const registrationCheck = await client.post("registerUser", {email: email, username: username, password: password, passwordCheck: passwordCheck});
    if(registrationCheck.status === true){
      window.location = '/';
    } else {
      switch(registrationCheck.errorCode){
        case 1:
            toast('Email already registered', 'error');
            break;
        case 2:
            toast('Username already registered', 'error');
            break;
        case 3:
            toast('You entered two different passwords', 'error');
            break;
      }
    }
  }

  function init() {
    const regButton = document.querySelector('button[id=sign-up]');
    regButton.addEventListener('click', function(){
        const email = (document.querySelector('input[id=email]').value || '').trim();
        const username = (document.querySelector('input[id=username]').value || '').trim();
        const password = (document.querySelector('input[id=password]').value || '').trim();
        const passwordCheck = (document.querySelector('input[id=password-check]').value || '').trim();
        if (!email || !username || !password || !passwordCheck) {
        toast('You must first enter all the fields', 'error');
      } else {
        signUp(email, username, password, passwordCheck);
      }
    });
  }
  init();
})();
