// Initialize OpenSeadragon Viewer
const viewer = OpenSeadragon({
    id: "wsi-viewer",
    prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
    tileSources: {
        type: "image",
        url: "assets/images/7_20241209_024613.png"
    },
    showNavigationControl: true,
    minZoomLevel: 0.5,
    maxZoomLevel: 10
});

// Load detection results from output.json
fetch('assets/data/output.json')
    .then(response => response.json())
    .then(data => {
        const detectionResults = JSON.parse(data.inference_results).output.detection_results;

        // Overlay bounding boxes
        const overlay = document.getElementById('overlay');
        detectionResults.forEach(([x, y, x2, y2, label]) => {
            const width = x2 - x;
            const height = y2 - y;
            const box = document.createElement('div');
            box.style.position = 'absolute';
            box.style.left = `${x}px`;
            box.style.top = `${y}px`;
            box.style.width = `${width}px`;
            box.style.height = `${height}px`;
            box.style.border = '2px solid red';
            box.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            box.title = `${label} (Count: 222, %: 67%)`;
            overlay.appendChild(box);

            // Adjust box position and size with zoom
            viewer.addHandler('update-viewport', () => {
                const zoom = viewer.viewport.getZoom();
                const containerPoint = viewer.viewport.imageToViewportCoordinates(x, y);
                const scaledWidth = width * zoom;
                const scaledHeight = height * zoom;
                box.style.left = `${containerPoint.x * overlay.clientWidth}px`;
                box.style.top = `${containerPoint.y * overlay.clientHeight}px`;
                box.style.width = `${scaledWidth}px`;
                box.style.height = `${scaledHeight}px`;
            });
        });
    })
    .catch(error => console.error('Error loading detection results:', error));

// Sync hub view pointer with WSI viewer
const hubPointer = document.getElementById('hub-pointer');
viewer.addHandler('update-viewport', () => {
    const bounds = viewer.viewport.getBounds();
    const imageBounds = viewer.viewport.viewportToImageRectangle(bounds);
    const hubImage = document.getElementById('hub-image');
    const scaleX = hubImage.clientWidth / 1024; // Image width is 1024px
    const scaleY = hubImage.clientHeight / 512; // Image height is 512px
    hubPointer.style.left = `${imageBounds.x * scaleX}px`;
    hubPointer.style.top = `${imageBounds.y * scaleY}px`;
    hubPointer.style.width = `${imageBounds.width * scaleX}px`;
    hubPointer.style.height = `${imageBounds.height * scaleY}px`;
});

// Navigate WSI viewer by clicking on hub view
document.getElementById('hub-image').addEventListener('click', (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const point = new OpenSeadragon.Point(x, y);
    viewer.viewport.panTo(viewer.viewport.imageToViewportCoordinates(point.x * 1024, point.y * 512));
});