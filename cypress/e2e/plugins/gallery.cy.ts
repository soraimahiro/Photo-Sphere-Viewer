import type { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import { getPlugin, getViewer, waitViewerReady } from '../../utils';
import { BASE_URL } from '../../utils/constants';

describe('plugin: gallery', () => {
    beforeEach(() => {
        cy.visit('e2e/plugins/gallery.html');
        waitViewerReady();
        cy.waitForResources(
            'key-biscayne-1-thumb.jpg',
            'key-biscayne-2-thumb.jpg',
            'key-biscayne-3-thumb.jpg',
            'key-biscayne-4-thumb.jpg',
        );
        // createBaseSnapshot();
    });

    it('should have a gallery', () => {
        cy.get('.psv-gallery')
            .should('be.visible')
            .compareScreenshots('base');
    });

    it('should hide gallery on panel open', () => {
        getViewer('open panel').then(viewer => viewer.panel.show('Lorem ipsum'));

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should display fullscreen on mobile', {
        viewportWidth: 400,
        viewportHeight: 800,
    }, () => {
        cy.waitForResources(
            'key-biscayne-5-thumb.jpg',
            'key-biscayne-6-thumb.jpg',
            'key-biscayne-7-thumb.jpg',
        );

        cy.get('.psv-gallery')
            .should(gallery => {
                const { x, y, width, height } = gallery[0].getBoundingClientRect();
                expect({ x, y, width, height }).to.deep.eq({ x: 0, y: 0, width: 400, height: 760 });
            });

        cy.get('.psv-gallery').compareScreenshots('mobile');

        cy.get('.psv-gallery .psv-panel-close-button').click();

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should add a navbar button', () => {
        cy.get('.psv-gallery-button')
            .should('be.visible')
            .should('have.class', 'psv-button--active')
            .click()
            .should('not.have.class', 'psv-button--active');

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should highlight the current item', () => {
        cy.get('[data-psv-gallery-item=sphere]').should('have.class', 'psv-gallery-item--active');

        getViewer('change panorama').then(viewer => viewer.setPanorama(BASE_URL + 'sphere-test.jpg', { transition: false }));
        waitViewerReady();

        cy.get('[data-psv-gallery-item=sphere]').should('not.have.class', 'psv-gallery-item--active');
        cy.get('[data-psv-gallery-item=test-sphere]').should('have.class', 'psv-gallery-item--active');

        getViewer('change panorama').then(viewer => viewer.setPanorama(BASE_URL + 'sphere-cropped.jpg', { transition: false }));
        waitViewerReady();

        cy.get('.psv-gallery-item--active').should('not.exist');
    });

    it('should change the panorama when clicked', () => {
        cy.get('[data-psv-gallery-item=test-sphere]').click();
        waitViewerReady();

        getViewer('check panorama').then(viewer => expect(viewer.config.panorama as string).to.eq(BASE_URL + 'sphere-test.jpg'));
        cy.get('.psv-caption-content').should('have.text', 'Test sphere'); // use name as caption

        cy.get('[data-psv-gallery-item=1]').click();
        waitViewerReady();

        cy.get('.psv-caption-content').should('have.text', 'Cape Florida Light, Key Biscayne © Pixexid');
    });

    it('should hide on click', () => {
        getGallery('set hideOnClick').then(gallery => gallery.setOption('hideOnClick', true));

        cy.get('[data-psv-gallery-item=test-sphere]').click();

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should change thumbnails size', () => {
        getGallery('set thumbnailSize').then(gallery => gallery.setOption('thumbnailSize', { width: 100, height: 100 }));
        
        cy.waitForResources(
            'key-biscayne-5-thumb.jpg',
            'key-biscayne-6-thumb.jpg',
            'key-biscayne-7-thumb.jpg',
        );

        cy.get('.psv-gallery').compareScreenshots('set-thumbnailSize');
    });

    it('should change the items', () => {
        getGallery('set items').then(gallery => {
            gallery.setItems([
                {
                    id: 1,
                    panorama: BASE_URL + 'tour/key-biscayne-1.jpg',
                    thumbnail: BASE_URL + 'tour/key-biscayne-1-thumb.jpg',
                },
                {
                    id: 2,
                    panorama: BASE_URL + 'tour/key-biscayne-2.jpg',
                    thumbnail: BASE_URL + 'tour/key-biscayne-2-thumb.jpg',
                },
            ]);
        });

        cy.get('.psv-gallery').compareScreenshots('set-items');
    });

    it('should change the items w. custom callback', () => {
        const callback = cy.stub();

        getGallery('set items').then(gallery => {
            gallery.setItems([
                {
                    id: 1,
                    panorama: BASE_URL + 'tour/key-biscayne-1.jpg',
                    thumbnail: BASE_URL + 'tour/key-biscayne-1-thumb.jpg',
                },
            ], callback);
        });

        cy.get('[data-psv-gallery-item=1]')
            .click()
            .should('have.class', 'psv-gallery-item--active')
            .then(() => {
                expect(callback.getCall(0)).to.be.calledWith('1');
            });

        // not changed
        getViewer('check panorama').then(viewer => expect(viewer.config.panorama as string).to.eq(BASE_URL + 'sphere-small.jpg'));
    });

    it('should hide the button when no items', () => {
        getGallery('set items').then(gallery => gallery.setItems([]));

        cy.get('.psv-gallery-button').should('not.be.visible');

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should not be visible on load', () => {
        cy.visit('e2e/plugins/gallery.html?visibleOnLoad=false');
        waitViewerReady();

        cy.get('.psv-gallery').should('not.be.visible');
    });

    function getGallery(log: string) {
        return getPlugin<GalleryPlugin>('gallery', log);
    }
});
