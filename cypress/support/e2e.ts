import 'cypress-mochawesome-reporter/register';
import 'cypress-real-events';
import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command';

addCompareSnapshotCommand({
    errorThreshold: 0.01,
    failSilently: !Cypress.config('isInteractive'),
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
        interface Chainable {
            compareScreenshots(name: string, options?: { errorThreshold?: number, hideViewer?: boolean }): Chainable<JQuery<HTMLElement>>;
        }
    }
}

Cypress.Commands.add('compareScreenshots', { prevSubject: ['element'] }, (subject, name, options = {}) => {
    if (options.hideViewer !== false) {
        cy.get('.psv-canvas-container', { log: false }).then(container => container.hide());
    }

    cy.wrap(subject, { log: false }).compareSnapshot(name, options)
        .then((result) => {
            if (result.images.diff) {
                // @ts-ignore
                Cypress.Mochawesome.context.push({ title: `Visual regression diff (${name})`, value: 'data:image/png;base64,' + result.images.diff });
            }

            if (result.error) {
                throw new Error(result.error);
            }

            if (options.hideViewer !== false) {
                return cy.get('.psv-canvas-container', { log: false }).then(container => container.show());
            }
        });

    return cy.wrap(subject, { log: false });
});
