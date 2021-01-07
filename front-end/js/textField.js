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
   * A field.
   */
  class FieldModel {
    constructor(id, fieldName, fieldType) {
      this._id = id;
      this._fieldName = fieldName;
      this._fieldType = fieldType;
      this._timestamp = new Date();
    }

    //@formatter:off
    get id() { return this._id; }
    get fieldName() { return this._fieldName; }
    set fieldName(fieldName) { this._fieldName = fieldName; }
    get fieldType() { return this._fieldType; }
    set fieldType(fieldType) { this._fieldType = fieldType; }
    get timestamp() { return this._timestamp; }
    //@formatter:on
  }

  /**
   * Encapsulates the control and view logics behind a single field.
   */
  class FieldComponent extends EventEmitter {
    constructor(model) {
      super();
      this._model = model;
      this._element = null;
      this._handlers = [];
      this._edit = null;
    }

    destroy() {
      this._handlers.forEach(h => h.unregister());
      this._element.remove();
    }

    init() {
      this._element = document.createElement('div');
      this._element.className = 'field';
      this._element.innerHTML = document.querySelector('script#field-template').textContent;

      const id = `field-${this._model.id}`;
      const lbl = this._element.querySelector('label[id=field-name]');
      lbl.htmlFor = id;
      lbl.textContent = this._model.fieldName;
      const typeLbl = this._element.querySelector('label[id=field-type]');
      typeLbl.htmlFor = id;
      typeLbl.textContent = this._model.fieldType;
      const isLabel = this._element.querySelector('input[name=isLabel]');
      isLabel.htmlFor = id;
      if(this._model.id === 1){
        isLabel.checked = true;
      }

      const editBtn = this._element.querySelector('.field-right button[name=edit]');
      let hdlr = new Handler('click', editBtn, () => this.edit());
      this._handlers.push(hdlr);

      const compBtn = this._element.querySelector('.field-right button[name=remove]');
      hdlr = new Handler('click', compBtn, () => this.complete());
      this._handlers.push(hdlr);

      return this._element;
    }

    edit() {
      if (this._edit) {
        this._edit.classList.remove('hidden');
      } else {
        this._edit = document.createElement('div');
        this._edit.className = 'field-edit';
        this._edit.innerHTML = document.querySelector('script#field-edit-template').textContent;

        const btnSave = this._edit.querySelector('button[name=save]');
        let hdlr = new Handler('click', btnSave, () => this.save());
        this._handlers.push(hdlr);

        const btnCancel = this._edit.querySelector('button[name=cancel]');
        hdlr = new Handler('click', btnCancel, () => this.cancel());
        this._handlers.push(hdlr);
      }

      const inp = this._edit.querySelector('input');
      inp.value = this._model.fieldName;

      const sel = this._edit.querySelector('select');
      sel.value = this._model.fieldType;

      const children = [
        this._element.querySelector('.field-left'),
        this._element.querySelector('.field-right')];

      children.forEach(c => c.classList.add('hidden'));
      this._element.append(this._edit);
    }

    save() {
      if (this._edit) {
        const newName = this._edit.querySelector('input').value || '';
        const newType = this._edit.querySelector('select').value;
        if (newName.trim()) {
          this._model.fieldName = newName.trim();
          this._model.fieldType = newType;
        }
        this._update();
        this._hideEditfield();
      }
    }

    cancel() {
      this._hideEditfield();
    }

    complete() {
      this.emit('completed', this._model);
    }

    _hideEditfield() {
      if (this._edit) {
        this._edit.classList.add('hidden');
      }

      const children = [
        this._element.querySelector('.field-left'),
        this._element.querySelector('.field-right')];
      children.forEach(c => c.classList.remove('hidden'));
    }

    _update() {
      if (this._element) {
        const nameLabel = this._element.querySelector('label[id=field-name]');
        nameLabel.textContent = this._model.fieldName;
        const typeLabel = this._element.querySelector('label[id=field-type]');
        typeLabel.textContent = this._model.fieldType;
      }
    }
  }

  const seq = sequencer();
  const fields = [];

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

  function removeField(field) {
    const i = fields.findIndex(t => t.model.id === field.id);
    if (i >= 0) {
      const {component} = fields[i];
      component.destroy();
      fields.splice(i, 1);
    }
  }

  function fieldIdOf(el) {
    const idStr = el.id.substr(5 /*'field-'.length*/);
    return parseInt(idStr, 10);
  }

  function removeSelectedFields() {
    const inps = document.querySelectorAll('.field-left input[type=checkbox]:checked');
    const fields = Array.prototype.slice.apply(inps).map(el => ({id: fieldIdOf(el)}));
    fields.forEach(removeField);
  }

  function addField(form) {
    const inp = form.querySelector('input[name=field-name]');
    const fieldName = (inp.value || '').trim();
    if (fieldName !== '') {
      const root = document.querySelector('.content .panel .fields');
      const fieldType = form.querySelector('select').value;
      const model = new FieldModel(seq(), fieldName, fieldType);
      const component = new FieldComponent(model);
      fields.push({model, component});
      const el = component.init();
      root.appendChild(el);
      component.on('completed', removeField);
    }
  }

  function init() {
    const form = document.forms.namedItem('new-field');
    if (!form) {
      toast('Cannot initialize components: no <b>form</b> found', 'error');
    }

    form.addEventListener('submit', function ($event) {
      $event.preventDefault();
      addField(form);
      form.reset();
    });
  }


  init();

})();