async function charts(){
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    const client = new RestClient('/api');
    const result = await client.get('piechartData', {projectId: projectId});
    const balanceLabels = [['Label', 'Occurrences']];
    const statusLabels = [[''], ['']];
    if(result.balance[0]){
        result.balance[0].labels.forEach(label => {
            balanceLabels.push([label.label, parseInt(label.occurrences)]);
            statusLabels[0].push(label.label);
            statusLabels[1].push(parseInt(label.occurrences));
        });
        const balanceData = google.visualization.arrayToDataTable(balanceLabels);
        const balanceOptions = {title:'Project balance', width: '300', legend:{position: 'none'}};
        const piechart = new google.visualization.PieChart(document.getElementById('balancePiechart'));
        piechart.draw(balanceData, balanceOptions);
    } else {
        statusLabels[0].push('');
        statusLabels[1].push(0);
    }
    const statusData = google.visualization.arrayToDataTable(statusLabels);
    const statusOptions = {title: 'Project status', isStacked: true, width: '300', hAxis:{title: 'Samples', minValue: parseInt(result.sizeTarget)}, vAxis:{title: 'Entries'}, legend:{position: 'none'}};
    const barchart = new google.visualization.BarChart(document.getElementById('statusBarchart'));
    barchart.draw(statusData, statusOptions);
}
