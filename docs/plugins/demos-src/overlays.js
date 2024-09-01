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
                    zIndex: 1,
                },
                {
                    path: baseUrl + 'pictos/tent.png',
                    opacity: 1,
                    yaw: -0.5,
                    pitch: 0.1,
                    width: 0.4,
                    height: 0.3,
                    zIndex: 2,
                },
            ],
        }],
    ],
});
