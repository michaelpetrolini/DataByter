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

  function imgToBase64(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    img.crossOrigin = 'anonymous';
    ctx.drawImage(img, 0, 0);
  
    return canvas.toDataURL();
  }
  

  async function addFields(fieldsDiv, projectId) {
    const resp = await client.get("project", {id: projectId});
    const projectInfo = resp.project;
    populatePanelInfo(projectInfo);
    resp.project.fields.forEach(field => {
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
            resp.project.labels.forEach(label => {
                const option = document.createElement('option');
                option.value = label;
                option.textContent = label;
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
                  input.value = "";
                  break;
                case "Number":
                  input.type = "number";
                  input.value = 0;
                  break;
                case "Date":
                  input.type = "date";
                  input.value = new Date().toISOString().slice(0,10);
                  break;
                case "Boolean":
                  input.type = "checkbox";
                  break;
              }
              fieldContainer.appendChild(input);
            } else {
              const imgDiv = document.createElement('div');
              const input = document.createElement('input');
              input.name = field.name;
              input.type = "file";
              input.accept = "image/*";
              const img = document.createElement('img');
              img.id = field.name;
              img.src = "";
              img.hidden = true;
              const icon = document.createElement('img');
              icon.className = 'image-icon';
              input.addEventListener('change', function(){
                const photo = input.files[0];
                const reader = new FileReader();
                reader.onloadend = function() {
                  img.src = reader.result;
                  icon.src = reader.result;
                }
                if(photo) reader.readAsDataURL(photo);
              });
              imgDiv.appendChild(input);
              imgDiv.appendChild(img);
              imgDiv.appendChild(icon);
              fieldContainer.appendChild(imgDiv);
            }
        }
        fieldsDiv.appendChild(fieldContainer);
    });

    function populatePanelInfo(projectInfo) {
      const infoPanel = document.querySelector("div[id=info-panel]");
      const nameLbl = infoPanel.querySelector('label[id=project-name]');
      const nameVal = document.createElement('label');
      nameVal.textContent = projectInfo.pName;
      nameLbl.after(nameVal);
      const typeLbl = infoPanel.querySelector('label[id=project-type]');
      const typeVal = document.createElement('label');
      typeVal.textContent = projectInfo.pType;
      typeLbl.after(typeVal);
      const authorLbl = infoPanel.querySelector('label[id=project-author]');
      const authorVal = document.createElement('label');
      authorVal.textContent = projectInfo.pAuthor;
      authorLbl.after(authorVal);
      const creationLbl = infoPanel.querySelector('label[id=project-creation]');
      const creationVal = document.createElement('label');
      creationVal.textContent = projectInfo.creationDate;
      creationLbl.after(creationVal);
    }
  }

  async function addEntry(fieldsDiv, projectId){
      const fieldsList = fieldsDiv.querySelectorAll('div[class=field-container]');
      const infoPanel = document.querySelector("div[id=info-panel]");
      const pType = infoPanel.querySelector('label[id=project-type]').nextSibling.textContent;
      const author = sessionStorage.getItem('username');
      const entry = {author: author, pType: pType, fields: []}
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
      const resp = await client.post("addEntry", entry, {id: projectId});
      window.location = "/projectDetails.html?projectId=" + projectId;
  }

  function init() {
    window.addEventListener('load', function($event){
        const projectId = new URLSearchParams(window.location.search).get('projectId');
        const backBtn = document.querySelector("a[id=back-btn]");
        backBtn.href = "projectDetails.html?projectId=" + projectId;
        const cancelBtn = document.querySelector("a[id=cancel-btn]");
        cancelBtn.href = "projectDetails.html?projectId=" + projectId;
        $event.preventDefault();
        const fieldsDiv = document.querySelector("div[id=fields]");
        addFields(fieldsDiv, projectId);
    });

    const saveButton = document.querySelector('button[id=add-entry]');
    saveButton.addEventListener('click', function($event){
        $event.preventDefault();
        const fieldsDiv = document.querySelector("div[id=fields]");
        const projectId = new URLSearchParams(window.location.search).get('projectId');
        addEntry(fieldsDiv, projectId);
    });

    const logOutButton = document.querySelector('button[id=logout]');
    logOutButton.addEventListener('click', function(){
      sessionStorage.removeItem('username');
      window.location = '/';
    });
  }


  init();

})();