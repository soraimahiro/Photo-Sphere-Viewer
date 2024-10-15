const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        [OverlaysPlugin, {
            overlays: [
                {
                    id: 'xray',
                    path: baseUrl + 'sphere-overlay.png',
                    opacity: .8,
                },
            ],
        }],
    ],
});
