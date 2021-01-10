function downloadCSV(csv, filename) {
    let csvFile;
    let downloadLink;

    csvFile = new Blob([csv], {type: "text/csv"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function exportTableToCSV(filename) {
    const csv = [];
    const rows = document.querySelectorAll("table tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        
        for (let j = 0; j < cols.length - 1; j++) {
            let content;
            if(cols[j].tagName == 'TD' && cols[j].firstElementChild && cols[j].firstElementChild.tagName == 'IMG'){
                content = cols[j].firstElementChild.src;
            } else {
                content = cols[j].innerText;
            }
            row.push(content);
        }
        csv.push(row.join(","));        
    }
    downloadCSV(csv.join("\n"), filename);
}