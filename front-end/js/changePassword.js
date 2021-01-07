'use strict';

(function () {
  function endRemoveAndTrim(str, char) {
    if (str) {
      str = str.trimRight();
      while (str && str[str.length - 1] === char) {
        str = str.substr(0, str.length - 1).trimRight();
      }
    }
    return str;
  }

  function startRemoveAndTrim(str, char) {
    if (str) {
      str = str.trimLeft();
      while (str && str[0] === char) {
        str = str.substr(1, str.length - 1).trimLeft();
      }
    }
    return str;
  }

  function mkUrl(baseUrl, path, queryParams) {
    const bu = endRemoveAndTrim((baseUrl || '').trim(), '/');
    const p = startRemoveAndTrim(path.trim(), '/');
    let url = [bu, p].join('/');
    if (queryParams && typeof queryParams === 'object') {
      const params = [];
      for (let key of Object.keys(queryParams)) {
        const k = encodeURIComponent(key);
        const val = queryParams[key];
        if (val) {
          let v = encodeURIComponent(val);
          params.push(`${k}=${v}`);
        } else {
          params.push(k)
        }
      }
      if (params.length) {
        url += '?' + params.join('&');
      }
    }

    return url;
  }

  function handleJsonResponse(req, resolve, reject) {
    if (req.readyState === XMLHttpRequest.DONE) {
      // Everything is good, the response was received.
      if (req.status === 200 || req.status === 201) {
        const hdr = req.getResponseHeader('Content-type');
        if (hdr.substr(0, 16) === 'application/json' || hdr.substr(0, 9) === 'text/json') {
          resolve(JSON.parse(req.responseText));
        } else {
          const e = new Error('Not a JSON response');
          e.status = req.status;
          e.response = req.responseText;
          reject(e);
        }
      } else {
        const hdr = req.getResponseHeader('Content-type');
        const e = new Error('Operation failed');
        e.status = req.status;
        if (hdr === 'application/json' || hdr === 'text/json') {
          e.json = JSON.parse(req.responseText);
        } else {
          e.response = req.responseText;
        }
        reject(e);
      }
    }
  }

  function setHeaders(req, headers) {
    req.setRequestHeader("Access-Control-Allow-Origin","*");
    if (headers && typeof headers === 'object') {
      for (let key of Object.keys(headers)) {
        req.setRequestHeader(key, headers[key]);
      }
    }
  }

  class RestClient {
    constructor(baseUrl) {
      this._baseUrl = baseUrl;
    }

    _send(method, path, body, queryParams, headers) {
      return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        // prepares the response handler
        req.onreadystatechange = () => handleJsonResponse(req, resolve, reject);
        req.open(method, mkUrl(this._baseUrl, path, queryParams));

        // populates additional headers
        setHeaders(req, headers);

        // send request
        if (body) {
          req.setRequestHeader('Content-Type', 'application/json');
          req.send(JSON.stringify(body));
        } else {
          req.send();
        }
      });
    }

    put(path, body, queryParams, headers) {
      return this._send('PUT', path, body, queryParams, headers);
    }
  }

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
