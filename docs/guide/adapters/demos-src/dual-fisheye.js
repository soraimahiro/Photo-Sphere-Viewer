const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    adapter: DualFisheyeAdapter,
    panorama: baseUrl + 'dualfisheye.jpg',
    caption: 'Kotka archipelago, Finland <b>&copy; Jonna Luostari</b>',
    sphereCorrection: { tilt: 0.1 },
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
