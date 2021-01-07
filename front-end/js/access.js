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

  /**
   * A minimal AJAX client for RESTful APIs.
   */
  class RestClient {
    /**
     * Instances a new `RestClient`.
     * @param baseUrl {string?} Optional baseUrl
     */
    constructor(baseUrl) {
      this._baseUrl = baseUrl;
    }

    /**
     * Sends an AJAX request for the specified `method`.
     * @param method {'GET'|'POST'|'PUT'|'DELETE'} HTTP method
     * @param path {string} The URL path to be appended to this `baseUrl`
     * @param body {Object?} Optional body of the message, will be converted to JSON if present
     * @param queryParams {Object?} Optional query parameters
     * @param headers {Object?} Optional headers
     * @return {Promise} A promise of the JSON response.
     * @private
     */
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

    /**
     * Sends a GET request.
     * @param path {string} URL path to be appended to base URL.
     * @param queryParams {Object?} Optional query parameters
     * @param headers {Object?} Optional headers
     * @return {Promise} A promise of the JSON response.
     */
    get(path, queryParams, headers) {
      return this._send('GET', path, null, queryParams, headers);
    }

    /**
     * Sends a POST request.
     * @param path {string} URL path to be appended to base URL.
     * @param body {Object?} Optional body of the message, will be converted to JSON if present
     * @param queryParams {Object?} Optional query parameters
     * @param headers {Object?} Optional headers
     * @return {Promise} A promise of the JSON response.
     */
    post(path, body, queryParams, headers) {
      return this._send('POST', path, body, queryParams, headers);
    }

    /**
     * Sends a PUT request.
     * @param path {string} URL path to be appended to base URL.
     * @param body {Object?} Optional body of the message, will be converted to JSON if present
     * @param queryParams {Object?} Optional query parameters
     * @param headers {Object?} Optional headers
     * @return {Promise} A promise of the JSON response.
     */
    put(path, body, queryParams, headers) {
      return this._send('PUT', path, body, queryParams, headers);
    }

    /**
     * Sends a DELETE request.
     * @param path {string} URL path to be appended to base URL.
     * @param queryParams {Object?} Optional query parameters
     * @param headers {Object?} Optional headers
     * @return {Promise} A promise of the JSON response.
     */
    del(path, queryParams, headers) {
      return this._send('DELETE', path, null, queryParams, headers);
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
