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

  async function logIn(username, password) {
    const checkUser = await client.post("checkUser", {username: username, password: password});
    if(checkUser.canAccess === true){
      sessionStorage.setItem("username", username);
      window.location = '/viewProjects.html';
    } else {
      toast('Your username/password is incorrect, please try again', 'error');
    }
  }

  function init() {
    const logButton = document.querySelector('button[id=sign-in]');
    logButton.addEventListener('click', function(){
      const username = (document.querySelector('input[id=username]').value || '').trim();
      if (!username) {
        toast('You must first enter your username and password', 'error');
      } else {
        const password = document.querySelector('input[id=password]').value;
        logIn(username, password);
      }
    });
  }
  init();
})();
