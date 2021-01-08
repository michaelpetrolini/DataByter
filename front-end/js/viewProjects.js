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

  async function populateProjectsTable(table){
    const resp = await client.get("projects");
    resp.results.forEach(project => {
      let newRow = table.insertRow();
      let pName = newRow.insertCell();
      pName.innerHTML = project.pName;
      let pDescription = newRow.insertCell();
      pDescription.innerHTML = project.description;
      let pType = newRow.insertCell();
      pType.innerHTML = project.pType;
      let pAuthor = newRow.insertCell();
      pAuthor.innerHTML = project.pAuthor;
      let creationDate = newRow.insertCell();
      creationDate.innerHTML = project.creationDate;
      let pActions = newRow.insertCell();
      const anchor = document.createElement('a');
      anchor.className = "custom-button";
      anchor.href = "projectDetails.html?projectId=" + project.projectId;
      const button = document.createElement('i');
      button.className = "eos-icons";
      button.appendChild(document.createTextNode("search"));
      anchor.appendChild(button);
      pActions.appendChild(anchor);
    });
  }

  async function init() {
    window.addEventListener('load', function ($event) {
        const table = document.querySelector("tbody[id=projects-rows]");
        $event.preventDefault();
        populateProjectsTable(table);
    });

    const logOutButton = document.querySelector('button[id=logout]');
    logOutButton.addEventListener('click', function(){
      sessionStorage.removeItem('username');
      window.location = '/';
    });
  }
  init();
})();