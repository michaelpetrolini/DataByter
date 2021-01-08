'use strict';

(function () {
  const client = new RestClient('/api');

  async function populateEntryDetails(table, projectId, entryId){
    const resp = await client.get("entryHistory", {projectId: projectId, entryId: entryId});
    const headerRow = table.querySelector('tr[id=header-row]');
    resp.results[0].fields.forEach(field => {
        const hElem = document.createElement('th');
        hElem.textContent = field.field;
        headerRow.appendChild(hElem);
    });
    const hAuthor = document.createElement('th');
    hAuthor.textContent = "Author";
    headerRow.appendChild(hAuthor);
    const hDate = document.createElement('th');
    hDate.textContent = "Creation Date";
    headerRow.appendChild(hDate);
    const tBody = table.querySelector('tbody[id=entries-rows]');
    resp.results.forEach(entry => {
      const newRow = tBody.insertRow();
      entry.fields.forEach(field => {
        const newCell = newRow.insertCell();
        switch(entry.pType){
          case "Text":
            newCell.innerHTML = field.value;
            break;
          case "Image":
            if(field.isLabel === true){
              newCell.innerHTML = field.value;
            } else {
              const img = document.createElement('img');
              img.style.maxBlockSize = "75px";
              img.src = field.value;
              newCell.appendChild(img);
            }
        }
      });
      const authorCell = newRow.insertCell();
      authorCell.innerHTML = entry.author;
      const creationCell = newRow.insertCell();
      creationCell.innerHTML = entry.creationDate;
    });
    
  }

  async function init() {
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    const entryId = new URLSearchParams(window.location.search).get('entryId');
    window.addEventListener('load', function ($event) {
        const table = document.querySelector("table[id=entries-table]");
        $event.preventDefault();
        const addBtn = document.querySelector("a[id=update-entry]");
        addBtn.href = "updateEntry.html?projectId=" + projectId + "&entryId=" + entryId;
        const backBtn = document.querySelector("a[id=back]");
        backBtn.href = "projectDetails.html?projectId=" + projectId;
        populateEntryDetails(table, projectId, entryId);
    });

    const delProjectBtn = document.querySelector('button[id=delete-entry]');
    delProjectBtn.addEventListener('click', async function(){
      await client.del("entry", {projectId: projectId, entryId: entryId});
      window.location = "/projectDetails.html?projectId=" + projectId;
    });

    const logOutButton = document.querySelector('button[id=logout]');
    logOutButton.addEventListener('click', function(){
      sessionStorage.removeItem('username');
      window.location = '/';
    });
  }
  init();
})();