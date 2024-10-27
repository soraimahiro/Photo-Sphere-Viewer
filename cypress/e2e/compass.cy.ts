import type { CompassPlugin, CompassPluginConfig } from '@photo-sphere-viewer/compass-plugin';
import type { Point } from '@photo-sphere-viewer/core';
import { checkPosition, getPlugin, getViewer, waitViewerReady } from '../utils';

describe('compass', () => {
    beforeEach(() => {
        cy.visit('e2e/compass.html');
        waitViewerReady();
        // createBaseSnapshot();
    });

    it('should have a compass', () => {
        cy.get('.psv-compass')
            .should('be.visible')
            .compareScreenshots('base');
    });

    it('should hide the compass', () => {
        getPlugin<CompassPlugin>('compass', 'hide compass')
            .then(compass => compass.hide());

        cy.get('.psv-compass').should('not.be.visible');

        getPlugin<CompassPlugin>('compass', 'show compass')
            .then(compass => compass.show());

        cy.get('.psv-compass').should('be.visible');
    });

    it('should pan & zoom', () => {
        getViewer('rotate 90deg')
            .then(viewer => viewer.rotate({ pitch: 0, yaw: '90deg' }))
            .wait(200);

        cy.get('.psv-compass').compareScreenshots('rotate');

        getViewer('zoom 100%')
            .then(viewer => viewer.zoom(100))
            .wait(200);

        cy.get('.psv-compass').compareScreenshots('zoom');
    });

    it('should show navigation cone', () => {
        withCompassPosition(({ element, x, y, width, height }) => {
            // center-right
            const enterPoint = { clientX: x + width, clientY: y + height * .5 };
            // above bottom-center
            const clickPoint = { clientX: x + width * .5, clientY: y + height * .75 };
            // bottom-center
            const leavePoint = { clientX: x + width * .5, clientY: y + height };

            element
                .trigger('mouseenter', enterPoint)
                .compareScreenshots('navigation-1')
                .trigger('mousemove', clickPoint)
                .compareScreenshots('navigation-2')
                .trigger('mousedown', clickPoint)
                .trigger('mouseup', clickPoint)
                .trigger('mouseleave', leavePoint)
                .compareScreenshots('navigation-3');
        });

        checkPosition({ yaw: Math.PI, pitch: 0 });
    });

    it('should disable navigation', () => {
        getPlugin<CompassPlugin>('compass', 'disable navigation')
            .then(compass => compass.setOption('navigation', false));

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * .5, clientY: y + height * .75 };

            element
                .trigger('mouseenter', point)
                .compareScreenshots('base')
                .trigger('mousedown', point)
                .trigger('mouseup', point)
                .trigger('mouseleave', point);
        });

        checkPosition({ yaw: 0, pitch: 0 });
    });

    it('should reset pitch on click', () => {
        getViewer('move down')
            .then(viewer => viewer.rotate({ yaw: 0, pitch: -1 }))
            .wait(200);

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * .75, clientY: y + height * .5 };

            element
                .trigger('mousedown', point)
                .trigger('mouseup', point);
        });

        checkPosition({ yaw: Math.PI / 2, pitch: -1 });

        getPlugin<CompassPlugin>('compass', 'set resetPitch')
            .then(compass => compass.setOption('resetPitch', true));

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * .5, clientY: y + height * .75 };

            element
                .trigger('mousedown', point)
                .trigger('mouseup', point);
        });

        checkPosition({ yaw: Math.PI, pitch: 0 });
    });

    Object.entries({
        coneColor: '#00000055',
        navigationColor: 'rgba(0, 255, 0, 0.5)',
        size: '300px',
        backgroundSvg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="rgba(0, 0, 0, .5)"/></svg>',
    } satisfies CompassPluginConfig).forEach(([key, value]) => {
        it(`should set the ${key}`, () => {
            getPlugin<CompassPlugin>('compass', `set ${key}`)
                .then(compass => compass.setOption(key as any, value));

            if (key === 'navigationColor') {
                withCompassPosition(({ element, x, y, width, height }) => {
                    element
                        .trigger('mousemove', { clientX: x + width * .5, clientY: y + height * .75 })
                        .compareScreenshots(`set-${key}`)
                        .trigger('mouseleave');
                });
            } else {
                cy.get('.psv-compass').compareScreenshots(`set-${key}`);
            }
        });
    });

    it('should change the position', () => {
        const size = 120;
        const margin = 10;
        const nav = 40;
        const vw = Cypress.config('viewportWidth');
        const vh = Cypress.config('viewportHeight');

        [
            ['top left', { x: margin, y: margin }],
            ['top center', { x: vw / 2 - size / 2, y: margin }],
            ['top right', { x: vw - size - margin, y: margin }],
            ['left center', { x: margin, y: vh / 2 - size / 2 }],
            ['center center', { x: vw / 2 - size / 2, y: vh / 2 - size / 2 }],
            ['right center', { x: vw - size - margin, y: vh / 2 - size / 2 }],
            ['bottom left', { x: margin, y: vh - nav - margin - size }],
            ['bottom center', { x: vw / 2 - size / 2, y: vh - nav - margin - size }],
            ['bottom right', { x: vw - size - margin, y: vh - nav - margin - size }],
        ].forEach(([position, coords]: [string, Point]) => {
            getPlugin<CompassPlugin>('compass', `set position ${position}`)
                .then(compass => compass.setOption('position', position));

            cy.get('.psv-compass')
                .then(element => {
                    const { x, y } = element[0].getBoundingClientRect();
                    return { x, y } satisfies Point;
                })
                .should('deep.equal', coords);
        });

        getViewer('hide navbar')
            .then(viewer => viewer.navbar.hide())
            .wait(200);

        [
            ['bottom left', { x: margin, y: vh - margin - size }],
            ['bottom center', { x: vw / 2 - size / 2, y: vh - margin - size }],
            ['bottom right', { x: vw - size - margin, y: vh - margin - size }],
        ].forEach(([position, coords]: [string, Point]) => {
            getPlugin<CompassPlugin>('compass', `set position ${position}`)
                .then(compass => compass.setOption('position', position));

            cy.get('.psv-compass')
                .then(element => {
                    const { x, y } = element[0].getBoundingClientRect();
                    return { x, y } satisfies Point;
                })
                .should('deep.equal', coords);
        });
    });

    it('should show hotspots', () => {
        getPlugin<CompassPlugin>('compass', 'set hotspots')
            .then(compass => {
                compass.setHotspots([
                    // @ts-ignore missing pitch
                    { yaw: 0 },
                    { yaw: Math.PI / 2, pitch: 0 },
                    { yaw: Math.PI, pitch: -1 },
                    { yaw: Math.PI * 3 / 2, pitch: 1 },
                ]);
            });

        cy.get('.psv-compass').compareScreenshots('hotspots');
    });

    it('should set hotspots color', () => {
        getPlugin<CompassPlugin>('compass', 'set hotspots')
            .then(compass => {
                compass.setOption('hotspotColor', 'green')

                compass.setHotspots([
                    { yaw: 0, pitch: 0 },
                    { yaw: Math.PI / 2, pitch: 0, color: 'red' },
                    { yaw: Math.PI, pitch: 0, color: 'rgba(255, 0, 0, 0.5)' },
                    { yaw: Math.PI * 3 / 2, pitch: 0, color: '#ff000050' },
                ]);
            });

        cy.get('.psv-compass').compareScreenshots('hotspots-color');
    });

    function withCompassPosition(cb: (res: { element: Cypress.Chainable<JQuery<HTMLElement>>, x: number, y: number, width: number, height: number }) => void) {
        cy.get('.psv-compass')
            .then(element => {
                const { x, y, width, height } = element[0].getBoundingClientRect();

                cb({
                    element: cy.wrap(element, { log: false }),
                    x, y, width, height,
                });
            });
    }

});
