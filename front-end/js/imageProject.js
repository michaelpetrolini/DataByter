'use strict';

(function () {

  /**
   * Creates a new sequence function.
   * @return {function(): number} A function that returns sequences of numbers on each call
   */
  function sequencer() {
    let i = 1;
    return function () {
      const n = i;
      i++;
      return n;
    }
  }

  /**
   * An event handler that keeps track of the callback reference added
   * to an HTML element using `addEventListener` and removed with
   * `removeEventListener`.
   */
  class Handler {
    /**
     * Instances a new `Handler` and registers the `callback` function
     * for the specified `event` at the `element` level.
     * @param event {string} The event name
     * @param element {HTMLElement} An HTML element
     * @param callback {Function} The function to be invoked on `event`
     */
    constructor(event, element, callback) {
      this._event = event;
      this._element = element;
      this._callback = callback;
      this._element.addEventListener(this._event, this._callback);
    }

    //@formatter:off
    get event() { return this._event; }
    get element() { return this._element; }
    get callback() { return this._callback; }
    //@formatter:on

    /**
     * Unregisters this handler.
     */
    unregister() {
      this._element.removeEventListener(this._event, this._callback);
    }
  }

  /**
   * An entity that is able to emit events certain subscribers are
   * interested into.
   */
  class EventEmitter {
    constructor() {
      this._subscribers = [];
      this._seq = sequencer();
    }

    /**
     * Adds a new subscriber for the specified event.
     * @param event
     * @param callback
     */
    on(event, callback) {
      const id = this._seq();
      this._subscribers.push({id, event, callback});
      return {
        unsubscribe: this._unsubscribe.bind(this)
      };
    }

    _unsubscribe(anId) {
      const j = this._subscribers.findIndex(s => s.id === anId);
      if (j >= 0) {
        this._subscribers.splice(j, 1);
      }
    }

    /**
     * Emits an event. This immediately triggers any callback that has
     * been subscribed for the exact same event.
     * @param event {string} The event name
     * @param data {Object?} Any additional data passed to the callback.
     */
    emit(event, data) {
      this._subscribers
        .filter(s => s.event === event)
        .forEach(s => s.callback(data));
    }
  }

  /**
   * A task.
   */
  class ProjectModel {
    constructor(pName, description, pType, sTarget, fields, labels) {
      this._pName = pName;
      this._description = description;
      this._pType = pType;
      this._sTarget = parseInt(sTarget);
      this._fields = [];
      this._labels = [];
      fields.forEach((field)=>{
        const fieldName = field.querySelector('label[id=field-name]').textContent;
        const labelFlag = field.querySelector('input[name=isLabel]').checked? true: false;
        this._fields.push({name: fieldName, isLabel: labelFlag});
    });
      labels.forEach((label)=>{
        const labelValue = label.querySelector('label[class=label-value]').textContent;
        this._labels.push(labelValue);
    });
      this._creationDate = new Date().toISOString().slice(0,10);
    }

    //@formatter:off
    get pName() { return this._pName; }
    get description() { return this._description; }
    get pType() { return this._pType; }
    get sTarget() { return this._sTarget }
    get fields() { return this._fields; }
    get labels() { return this._labels; }
    get creationDate() { return this._creationDate; }
    //@formatter:on
  }

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
      console.debug("status: " + req.status);
      console.debug("responseText: " + req.responseText);
      console.debug("content: " + req.getResponseHeader('Content-type'));
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

  /**
   * A task that can be synchronized with the REST API.
   */
  class RestProjectModel extends ProjectModel {
    constructor(pName, description, pType, sTarget, fields, labels, client) {
      super(pName, description, pType, sTarget, fields, labels);
      this._client = client;
    }

    toDto() {
      return {pName: this.pName, description: this.description, pType: this.pType, sizeTarget: this.sTarget, fields: this.fields, labels: this.labels, creationDate: this.creationDate};
    }

    async create() {
      let dto = this.toDto();
      dto = await this._client.post('saveProject', dto);
      return this;
    }

    async delete() {
      await this._client.del(`task/${encodeURIComponent(this.id)}`);
      return this;
    }

    async update(newDesc) {
      let dto = {description: newDesc};
      await this._client.put(`task/${encodeURIComponent(this.id)}`, dto);
      this.pName = newDesc;
      return this;
    }
  }

  const tasks = [];
  const client = new RestClient('/api');

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

  async function removeTask(task) {
    try {
      let i = tasks.findIndex(t => t.model.id === task.id);
      if (i >= 0) {
        console.log(`Deleting task ${task.id}...`);
        const {model} = tasks[i];
        await model.delete();
        console.log(`Task ${model.id}, '${model.description}' successfully deleted!`);

        // this must be repeated as other things might have changed
        i = tasks.findIndex(t => t.model.id === task.id);
        const {component} = tasks[i];
        component.destroy();
        tasks.splice(i, 1);
      }
    } catch (e) {
      console.error(`Cannot delete task ${task.id}`, e);
    }
  }

  function taskIdOf(el) {
    const idStr = el.id.substr(5 /*'task-'.length*/);
    return parseInt(idStr, 10);
  }

  async function saveProject() {
    const inp = document.querySelector('label[id=name]');
    const pName = (inp.textContent || '').trim();
    if (pName) {
      console.log(`Saving new project '${pName}'...`);
      const description = document.querySelector('label[id=description]').textContent;
      const pType = "Image";
      const sTarget = document.querySelector('label[id=size-target]').textContent;
      const fields = document.querySelectorAll('.field-left');
      const labels = document.querySelectorAll('.label-left');
      const model = new RestProjectModel(pName, description, pType, sTarget, fields, labels, client);
      await model.create();
      console.log('Project successfully saved', {model: model.toDto()});
      window.location = '/';
    }
  }

  async function init() {
    window.addEventListener('load', function(){
      const pName = localStorage.getItem("name");
      const nameLbl = document.querySelector("label[id=name]");
      nameLbl.textContent = pName;
      localStorage.removeItem("name");
      const pDesc = localStorage.getItem("description");
      const descLbl = document.querySelector("label[id=description]");
      descLbl.textContent = pDesc;
      localStorage.removeItem("description");
      const sTarget = localStorage.getItem("size-target");
      const targetLbl = document.querySelector("label[id=size-target]");
      targetLbl.textContent = sTarget;
      localStorage.removeItem("size-target");
    });
    const button = document.getElementById('save-project')
    button.addEventListener('click', function ($event) {
      $event.preventDefault();
      saveProject();
    });
  }


  init();

})();