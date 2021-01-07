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
    constructor(pName, description, pType, fields, labels) {
      this._pName = pName;
      this._description = description;
      this._pType = pType;
      this._fields = [];
      this._labels = [];
      fields.forEach((field)=>{
        const fieldName = field.querySelector('label[class=field-name]').textContent;
        const fieldType = field.querySelector('select[name=field-type]').value;
        const labelFlag = field.querySelector('input[name=isLabel]').checked? true: false;
        this._fields.push({name: fieldName, type: fieldType, isLabel: labelFlag});
    });
      labels.forEach((label)=>{
        const labelValue = label.querySelector('label[class=label-value]').textContent;
        this._labels.push(labelValue);
    });
      this._creationDate = new Date();
    }

    //@formatter:off
    get pName() { return this._pName; }
    get description() { return this._description; }
    get pType() { return this._pType; }
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
    constructor(pName, description, pType, fields, labels, client) {
      super(pName, description, pType, fields, labels);
      this._client = client;
    }

    toDto() {
      return {pName: this.pName, description: this.description, pType: this.pType, fields: this.fields, labels: this.labels, creationDate: this.creationDate};
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

  function imgToBase64(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
  
    // I think this won't work inside the function from the console
    img.crossOrigin = 'anonymous';
  
    ctx.drawImage(img, 0, 0);
  
    return canvas.toDataURL();
  }
  

  async function addFields(fieldsDiv, projectId, entryId) {
    const resp = await client.get("project", {id: projectId});
    const projectInfo = resp.project;
    const infoPanel = document.querySelector("div[id=info-panel]");
    const nameLbl = infoPanel.querySelector('label[id=project-name]');
    const nameVal = document.createElement('label');
    nameVal.textContent = projectInfo.pName;
    nameLbl.after(nameVal);
    const typeLbl = infoPanel.querySelector('label[id=project-type]');
    const typeVal = document.createElement('label');
    typeVal.textContent = projectInfo.pType;
    typeLbl.after(typeVal);
    const entriesLbl = infoPanel.querySelector('label[id=project-entries]');
    const entriesVal = document.createElement('label');
    entriesVal.textContent = resp.total;
    entriesLbl.after(entriesVal);
    const authorLbl = infoPanel.querySelector('label[id=project-author]');
    const authorVal = document.createElement('label');
    authorVal.textContent = projectInfo.pAuthor;
    authorLbl.after(authorVal);
    const creationLbl = infoPanel.querySelector('label[id=project-creation]');
    const creationVal = document.createElement('label');
    creationVal.textContent = projectInfo.creationDate;
    creationLbl.after(creationVal);
    const lastLbl = infoPanel.querySelector('label[id=project-last-entry]');
    const lastVal = document.createElement('label');
    lastVal.textContent = projectInfo.lastEntry;
    lastLbl.after(lastVal);
    const rsp = await client.get("entry", {projectId: projectId, entryId: entryId});
    console.log(rsp.entry);
    for(let i in resp.project.fields) {
        const field = resp.project.fields[i];
        const fEntry = rsp.entry.fields[i];
        console.log(fEntry);
        const fieldContainer = document.createElement('div');
        fieldContainer.className = "field-container";
        const fieldLbl = document.createElement('label');
        fieldLbl.innerHTML = "<b>" + field.name + ": </b>";
        if(field.isLabel === true) fieldLbl.style.color = "red";
        fieldContainer.appendChild(fieldLbl);
        if(field.isLabel === true){
            fieldContainer.id = "label";
            const select = document.createElement('select');
            select.name = field.name;
            select.value = fEntry.value;
            console.log(fEntry.value);
            resp.project.labels.forEach(label => {
                const option = document.createElement('option');
                option.value = label;
                option.textContent = label;
                label === fEntry.value? option.selected = true: option.selected = false;
                select.appendChild(option);
            });
            fieldContainer.appendChild(select);
        } else {
            if(projectInfo.pType === "Text"){
              const input = document.createElement('input');
              input.name = field.name;
              switch(field.type){
                case "String":
                  input.type = "text";
                  input.value = fEntry.value;
                  break;
                case "Number":
                  input.type = "number";
                  input.value = fEntry.value;
                  break;
                case "Date":
                  input.type = "date";
                  input.value = fEntry.value;
                  break;
                case "Boolean":
                  input.type = "checkbox";
                  input.checked = fEntry.value;
              }
              fieldContainer.appendChild(input);
            } else {
              const imgDiv = document.createElement('div');
              const input = document.createElement('input');
              const img = document.createElement('img');
              input.name = field.name;
              input.type = "file";
              input.accept = "image/*";
              img.id = field.name;
              img.style.maxBlockSize = "200px";
              img.src = fEntry.value;
              input.addEventListener('change', function(){
                const photo = input.files[0];
                const reader = new FileReader();
                reader.onloadend = function() {
                  img.src = reader.result;
                }
                if(photo) reader.readAsDataURL(photo);
              });
              imgDiv.appendChild(input);
              imgDiv.appendChild(img);
              fieldContainer.appendChild(imgDiv);
            }
        }
        fieldsDiv.appendChild(fieldContainer);
    }
  }

  async function updateEntry(fieldsDiv, projectId, entryId){
      const entry = {fields: []}
      const fieldsList = fieldsDiv.querySelectorAll('div[class=field-container]');
      const infoPanel = document.querySelector("div[id=info-panel]");
      const pType = infoPanel.querySelector('label[id=project-type]').nextSibling.textContent;
      entry.pType = pType;
      fieldsList.forEach(fContainer => {
        const entryElem = {};
        if(fContainer.id === "label"){
            entryElem.isLabel = true;
            const select = fContainer.querySelector('select');
            entryElem.field = select.name;
            entryElem.value = select.value;
        } else {
          entryElem.isLabel = false;
          switch (pType) {
            case "Text":
              const input = fContainer.querySelector('input');
              entryElem.field = input.name;
              switch (input.type){
                  case "text":
                    entryElem.value = input.value;
                    entry.type = "String";
                    break;
                  case "number":
                    entryElem.value = parseInt(input.value);
                    entry.type = "Number";
                    break;
                  case "date":
                    entryElem.value = input.value;
                    entry.type = "Date";
                    break;
                  case "checkbox":
                    entryElem.value = input.checked;
                    entry.type = "Boolean";
                    break;
              }
              break;
            case "Image":
              const img = fContainer.querySelector('img');
              entryElem.field = img.id;
              entryElem.value = imgToBase64(img);
              entry.type = "Image";
              break;
          }
        }
        entry.fields.push(entryElem);
      });
      const resp = await client.put("entry", entry, {projectId: projectId, entryId: entryId});
      window.location = "/projectDetails.html?projectId=" + projectId;
  }

  function init() {
    window.addEventListener('load', function($event){
        const projectId = new URLSearchParams(window.location.search).get('projectId');
        const entryId = new URLSearchParams(window.location.search).get('entryId');
        const backBtn = document.querySelector("a[id=back-btn]");
        backBtn.href = "projectDetails.html?projectId=" + projectId;
        const cancelBtn = document.querySelector("a[id=cancel-btn]");
        cancelBtn.href = "projectDetails.html?projectId=" + projectId;
        $event.preventDefault();
        const fieldsDiv = document.querySelector("div[id=fields]");
        addFields(fieldsDiv, projectId, entryId);
    });

    const saveButton = document.querySelector('button[id=update-entry]');
    saveButton.addEventListener('click', function($event){
        $event.preventDefault();
        const fieldsDiv = document.querySelector("div[id=fields]");
        const projectId = new URLSearchParams(window.location.search).get('projectId');
        const entryId = new URLSearchParams(window.location.search).get('entryId');
        updateEntry(fieldsDiv, projectId, entryId);
    });
  }


  init();

})();