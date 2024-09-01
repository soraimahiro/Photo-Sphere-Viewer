
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

let visibleRangePlugin;

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere-cropped.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    defaultZoomLvl: 30,

    navbar: [
        // custom buttons to clear and set the range
        {
            content: 'Clear range',
            className: 'custom-button',
            onClick: () => {
                visibleRangePlugin.setHorizontalRange(null);
                visibleRangePlugin.setVerticalRange(null);
            },
        },
        {
            content: 'Set custom range',
            className: 'custom-button',
            onClick: () => {
                visibleRangePlugin.setHorizontalRange([-Math.PI / 2, Math.PI / 2]);
                visibleRangePlugin.setVerticalRange([-Math.PI / 3, Math.PI / 3]);
            },
        },
        {
            content: 'Set range from panoData',
            className: 'custom-button',
            onClick: () => {
                visibleRangePlugin.setRangesFromPanoData();
            },
        },
        'caption',
        'fullscreen',
    ],

    plugins: [
        [VisibleRangePlugin, {
            usePanoData: true,
        }],
    ],
});

visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin);
