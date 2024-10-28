import type { AbstractPlugin, SphericalPosition, Viewer } from '@photo-sphere-viewer/core';
import { NO_LOG } from './constants';

export function waitViewerReady() {
    getViewer('wait ready').then(viewer => {
        if (!viewer.state.ready) {
            return new Promise(resolve => {
                viewer.addEventListener('ready', () => {
                    setTimeout(resolve, 200);
                }, { once: true });
            });
        } else if (viewer.state.loadingPromise) {
            return viewer.state.loadingPromise;
        } else {
            return Promise.resolve();
        }
    });
}

export function getViewer(log: string): Cypress.Chainable<Viewer> {
    cy.log(`Viewer: ${log}`);
    return cy.window(NO_LOG)
        .its('viewer', NO_LOG);
}

export function getPlugin<T extends AbstractPlugin<any>>(id: string, log: string | false): Cypress.Chainable<T> {
    if (log !== false) {
        cy.log(`${id}: ${log}`);
    }
    return cy.window(NO_LOG)
        .its('viewer', NO_LOG)
        .then(viewer => viewer.getPlugin(id));
}

export function checkPosition(position: SphericalPosition) {
    getViewer('check position')
        .then(viewer => expect(viewer.getPosition()).to.deep.eq(position));
}

export function createBaseSnapshot() {
    if (Cypress.config('isInteractive')) {
        Cypress.env('visualRegressionType', 'base');
    } else {
        throw new Error(`Unauthorized call to createBaseSnapshot`);
    }
}
