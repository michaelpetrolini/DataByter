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

  async function populateProjectDetails(infoPanel, table, projectId){
    const resp = await client.get("entries", {id: projectId});
    const projectInfo = resp.header;
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
    const headerRow = table.querySelector('tr[id=header-row]');
    projectInfo.fields.forEach(field => {
        const hElem = document.createElement('th');
        hElem.textContent = field.name;
        headerRow.appendChild(hElem);
    });
    const hAuthor = document.createElement('th');
    hAuthor.textContent = "Author";
    headerRow.appendChild(hAuthor);
    const hDate = document.createElement('th');
    hDate.textContent = "Last Update";
    headerRow.appendChild(hDate);
    const hActions = document.createElement('th');
    hActions.textContent = "Actions";
    headerRow.appendChild(hActions);

    const tBody = table.querySelector('tbody[id=entries-rows]');
    resp.results.forEach(entry => {
      const newRow = tBody.insertRow();
      entry.fields.forEach(field => {
        const newCell = newRow.insertCell();
        switch(projectInfo.pType){
          case "Text":
            newCell.innerHTML = field.value;
            break;
          case "Image":
            if(field.isLabel === true){
              newCell.innerHTML = field.value;
            } else {
              const img = document.createElement('img');
              img.src = field.value;
              newCell.appendChild(img);
            }
        }
      });
      const authorCell = newRow.insertCell();
      authorCell.innerHTML = entry.author;
      const updateCell = newRow.insertCell();
      updateCell.innerHTML = entry.creationDate;
      const pActions = newRow.insertCell();
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row-group';
      rowDiv.innerHTML = document.querySelector('script#actions-cell').textContent;
      const viewAnchor = rowDiv.querySelector('a[id=entry-history]');
      viewAnchor.href = "entryHistory.html?projectId=" + entry.projectId + "&entryId=" + entry.entryId;
      const anchor = rowDiv.querySelector('a[id=update-entry]');
      anchor.href = "updateEntry.html?projectId=" + entry.projectId + "&entryId=" + entry.entryId;
      const delButton = rowDiv.querySelector('button[id=delete-entry]');
      delButton.addEventListener('click', async function() {
        await client.del("entry",{projectId: entry.projectId, entryId: entry.entryId});
        location.reload();
      });
      pActions.appendChild(rowDiv);
    });
  }

  async function init() {
    const projectId = new URLSearchParams(window.location.search).get('projectId');

    window.addEventListener('load', function ($event) {
      const infoPanel = document.querySelector("div[id=info-panel]");
      const table = document.querySelector("table[id=entries-table]");
      $event.preventDefault();
      const addBtn = document.querySelector("a[id=add-entry]");
      addBtn.href = "addEntry.html?projectId=" + projectId;
      populateProjectDetails(infoPanel, table, projectId);
    });

    const delProjectBtn = document.querySelector('button[id=delete-project]');
    delProjectBtn.addEventListener('click', async function(){
      await client.del("project", {projectId: projectId});
      window.location = "/viewProjects.html";
    });

    const logOutButton = document.querySelector('button[id=logout]');
    logOutButton.addEventListener('click', function(){
      sessionStorage.removeItem('username');
      window.location = '/';
    });
  }
  init();
})();