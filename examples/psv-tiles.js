import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularAdapter } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
import { VisibleRangePlugin } from '@photo-sphere-viewer/visible-range-plugin';

export { IIIFPanoramaViewer };
class IIIFPanoramaViewer {
    constructor(options = {}) {
        this.baseURL = options.baseURL;
        this.containerSelector = options.containerSelector || '#viewer';
        this.maxWidth = options.maxWidth || 65536;
        this.maxHeight = options.maxHeight || 32768;
        this.maxTileSize = options.maxTileSize || 2048;
        this.maxSingleSize = options.maxSingleSize || 8192;
        this.imgInfo = {};
        this.viewer = null;
        this.initialize();
    }

    async initialize() {
        try {
            const response = await fetch(`${this.baseURL}/info.json`);
            const data = await response.json();
            this.imgInfo.width = data.width;
            this.imgInfo.height = data.height;
            
            this.createViewer();
        } 
        catch (error) {
            console.error('Error loading info.json:', error);
        }
    }

    createViewer() {
        if (this.imgInfo.width <= this.maxSingleSize && this.imgInfo.height <= this.maxSingleSize) {
            this.createSingleImageViewer();
        } else {
            this.createTilesViewer();
        }
    }

    createTilesViewer() {
        let targetWidth = this.imgInfo.width;
        let targetHeight = this.imgInfo.height;
        let scale = 1;

        if (targetWidth > this.maxWidth || targetHeight > this.maxHeight) {
            const scaleX = this.maxWidth / targetWidth;
            const scaleY = this.maxHeight / targetHeight;
            scale = Math.min(scaleX, scaleY);
            targetWidth = Math.floor(targetWidth * scale);
            targetHeight = Math.floor(targetHeight * scale);
        }
        
        const { cols, rows } = this.calculateTileGrid(targetWidth, targetHeight);
        console.log(`Target Size: ${targetWidth}x${targetHeight}, Tiles: ${cols}x${rows}`);

        let minfov = 30;
        if (targetWidth > 32768 || targetHeight > 32768) {
            minfov = 5;
        }
        else if( targetWidth > 16384 || targetHeight > 16384) {
            minfov = 15;
        }
        
        this.viewer = new Viewer({
            container: document.querySelector(this.containerSelector),
            adapter: [EquirectangularTilesAdapter,{
                antialias: true,
                // debug: true,
            }],
            moveInertia: 0,
            moveSpeed: 2,
            minFov: minfov,
            defaultZoomLvl: 0,
            panorama: {
                width: targetWidth,
                cols: cols,
                rows: rows,
                baseUrl: `${this.baseURL}/full/2000,1000/0/default.jpg`,
                tileUrl: (col, row) => {
                    const originalTileWidth = Math.ceil(this.imgInfo.width / cols);
                    const originalTileHeight = Math.ceil(this.imgInfo.height / rows);
                    const x = col * originalTileWidth;
                    const y = row * originalTileHeight;
                    const w = Math.min(originalTileWidth, this.imgInfo.width - x);
                    const h = Math.min(originalTileHeight, this.imgInfo.height - y);
                    const outputWidth = Math.floor(w * scale);
                    const outputHeight = Math.floor(h * scale);
                    return `${this.baseURL}/${x},${y},${w},${h}/${outputWidth},${outputHeight}/0/default.jpg`;
                }
            }
        });
    }

    createSingleImageViewer() {
        console.log(`Target Size: ${this.imgInfo.width}x${this.imgInfo.height}, no tiles`);
        this.viewer = new Viewer({
            container: document.querySelector(this.containerSelector),
            adapter: EquirectangularAdapter,
            moveInertia: 0,
            moveSpeed: 2,
            panorama: `${this.baseURL}/full/full/0/default.jpg`,
            plugins: [
                [VisibleRangePlugin, {
                    usePanoData: true,
                }]
            ],
        });
    }

    calculateTileGrid(width, height) {
        let cols = 2;
        let rows = 2;
        
        while (Math.ceil(width / cols) > this.maxTileSize || Math.ceil(height / rows) > this.maxTileSize) {
            if (Math.ceil(width / cols) > this.maxTileSize) {
                cols *= 2;
            }
            if (Math.ceil(height / rows) > this.maxTileSize) {
                rows *= 2;
            }
        }
        
        return { cols, rows };
    }

    destroy() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
        }
    }

    setPanorama(baseURL) {
        this.baseURL = baseURL;
        this.destroy();
        this.initialize();
    }
}

const iiifURL = [
    "https://openmuseum.tw/muse_iiif/8dfd1fa4a943ba3eb140ed675b6f6dbc",
    "https://openmuseum.tw/muse_iiif/bebdf7c89cef3327509724bf7db795e7",
    "https://openmuseum.tw/muse_iiif/7929d24618d60c66223caeb631909c65",
    "https://openmuseum.tw/muse_iiif/ec698d0eaaf8798cab4ad4a3c807a20f",
    "https://openmuseum.tw/muse_iiif/5435e691092258ebaa626508c78944f2",
    "https://stacks.stanford.edu/image/iiif/hs631zg4177/hs631zg4177_00_0001"
];

document.addEventListener("DOMContentLoaded", async () => {
    const panoramaViewer = new IIIFPanoramaViewer({
        baseURL: iiifURL[0],
        containerSelector: '#viewer'
    });

    iiifURL.forEach((url, index) => {
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            panoramaViewer.setPanorama(url);
        });
        button.className = 'navbtn';
        button.textContent = (index + 1).toString();
        document.querySelector('.navbar').appendChild(button);
    });
});
