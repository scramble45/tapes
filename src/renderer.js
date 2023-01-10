
/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

window.api.receive("fromMain", (data) => {
    data = JSON.parse(data);
    const { fileData } = data;
    loadDirectory(fileData);
});

function loadDirectory(fileData) {
    // Clear the streams list
    var streamsList = document.getElementById('channel_list-elements');
    streamsList.innerHTML = '';

    // read each line of the m3u data
    var reader = new FileReader();
    reader.onload = function (e) {
        const decoder = new TextDecoder();
        const contents = decoder.decode(e.target.result);
        const lines = contents.split('\n');

        var streams = [];
        var title = null;
        var url = null;
        lines.forEach(function (line) {
            if (line.startsWith('#EXTINF')) {
                // Extract the title from the line
                var titleMatch = line.match(/^#EXTINF:-1 tvg-id=".*" status=".*",(.*)$/);
                if (titleMatch) {
                    title = titleMatch[1];
                }
            } else if (line.startsWith('http')) {
                // Extract the URL from the line
                url = line;
                streams.push({ title: title, url: url });
                title = null;
                url = null;
            }
        });

        // Create a list element for each stream
        streams.forEach(function (stream, index) {
            var listItem = document.createElement('li');
            listItem.className = "channel_list-element"
            listItem.innerHTML = '<a href="#" onclick="selectStream(\'' + stream.url + '\')">' + `${index} : ${stream.title}` + '</a>';
            streamsList.appendChild(listItem);
        });
    };

    reader.readAsArrayBuffer(new Blob([fileData]));
}
