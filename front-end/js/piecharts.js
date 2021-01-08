async function balancePiechart(){
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    const client = new RestClient('/api');
    const result = await client.get('balancePiechart', {projectId: projectId});
    const labels = [['Label', 'Occurrences']];
    if(result[0]){
        result[0].labels.forEach(label => labels.push([label.label, parseInt(label.occurrences)]));
        const data = google.visualization.arrayToDataTable(labels);
        const options = {'title':'Project balance', 'width':300, 'height':200};
        const chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart.draw(data, options);
    }
}

async function balancePiechart2(){
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    const client = new RestClient('/api');
    const result = await client.get('statusPiechart', {projectId: projectId});
    const labels = [['Label', 'Occurrences']];
    if(result[0]){
        result[0].labels.forEach(label => labels.push([label.label, parseInt(label.occurrences)]));
        const data = google.visualization.arrayToDataTable(labels);
        const options = {'title':'Project balance', 'width':550, 'height':400};
        const chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart.draw(data, options);
    }
}