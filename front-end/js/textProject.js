'use strict';

(function () {
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

  async function saveProject() {
    const inp = document.querySelector('label[id=name]');
    const pName = (inp.textContent || '').trim();
    if (pName) {
      console.log(`Saving new project '${pName}'...`);
      const description = document.querySelector('label[id=description]').textContent;
      const pType = "Text";
      const sTarget = document.querySelector('label[id=size-target]').textContent;
      const fieldsFields = document.querySelectorAll('.field-left');
      const fields = [];
      fieldsFields.forEach(field => {
        const fieldName = field.querySelector('label[id=field-name]').textContent;
        const fieldType = field.querySelector('label[id=field-type]').textContent;
        const labelFlag = field.querySelector('input[name=isLabel]').checked? true: false;
        fields.push({name: fieldName, type: fieldType, isLabel: labelFlag});
      });
      const labelsFields = document.querySelectorAll('.label-left');
      const labels = [];
      labelsFields.forEach(label => {
        const labelValue = label.querySelector('label[class=label-value]').textContent;
        labels.push(labelValue);
      });
      const user = sessionStorage.getItem('username');
      const creationDate = new Date().toISOString().slice(0,10);
      const project = {pName: pName, description: description, pType: pType, sizeTarget: sTarget, pAuthor: user, fields: fields, labels: labels, creationDate: creationDate};
      const result = await client.post('saveProject', project);
      console.log('Project successfully saved');
      window.location = '/viewProjects.html';
    }
  }

  async function init() {
    window.addEventListener('load', function(){
      const pName = sessionStorage.getItem("name");
      const nameLbl = document.querySelector("label[id=name]");
      nameLbl.textContent = pName;
      sessionStorage.removeItem("name");
      const pDesc = sessionStorage.getItem("description");
      const descLbl = document.querySelector("label[id=description]");
      descLbl.textContent = pDesc;
      sessionStorage.removeItem("description");
      const sTarget = sessionStorage.getItem("size-target");
      const targetLbl = document.querySelector("label[id=size-target]");
      targetLbl.textContent = sTarget;
      sessionStorage.removeItem("size-target");
    });
    const button = document.getElementById('save-project')
    button.addEventListener('click', function ($event) {
      $event.preventDefault();
      saveProject();
    });

    const logOutButton = document.querySelector('button[id=logout]');
    logOutButton.addEventListener('click', function(){
      sessionStorage.removeItem('username');
      window.location = '/';
    });
  }


  init();

})();