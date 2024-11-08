import type { OptionsSetting, SettingsPlugin, ToggleSetting } from '@photo-sphere-viewer/settings-plugin';
import { callPlugin, callViewer, waitViewerReady } from '../../utils';

describe('plugin: settings', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/plugins/settings.html');
        waitViewerReady();
        // createBaseSnapshot();
    });

    const TOGGLE_SETTING = {
        id: 'toggle-setting',
        label: 'Toggle setting',
        type: 'toggle',
        active: () => false,
        toggle: () => void 0,
    } satisfies ToggleSetting;

    const OPTIONS_SETTING = {
        id: 'options-setting',
        label: 'Options setting',
        type: 'options',
        current: () => 'A',
        options: () => [
            { id: 'A', label: 'Option A' },
            { id: 'B', label: 'Option B' },
        ],
        apply: () => void 0,
    } satisfies OptionsSetting;

    it('should add a navbar button', () => {
        cy.get('.psv-settings-button').should('not.be.visible');

        getSettings('add setting').then(settings => settings.addSetting(TOGGLE_SETTING));

        cy.get('.psv-settings-button')
            .should('be.visible')
            .click()
            .should('have.class', 'psv-button--active');
    });

    it('should place the menu close to the button', () => {
        getSettings('add setting').then(settings => settings.addSetting(TOGGLE_SETTING));

        [
            ['caption settings', 'right', '0px'],
            ['settings caption', 'left', '0px'],
            ['zoom move settings caption', 'left', '290px'],
            ['download settings caption', 'left', '0px'],
            ['caption settings fullscreen', 'right', '0px'],
        ].forEach(([navbar, prop, value]) => {
            callViewer(`navbar "${navbar}"`).then(viewer => viewer.setOption('navbar', navbar));

            cy.get('.psv-settings-button').click();

            cy.get('.psv-settings').should('have.css', prop, value);

            cy.get('.psv-settings-button').click();
        });
    });

    it('should show toggle and options settings', () => {
        getSettings('add setting').then(settings => {
            settings.addSetting(TOGGLE_SETTING);
            settings.addSetting(OPTIONS_SETTING);
        });

        cy.get('.psv-settings-button').click();

        cy.get('.psv-settings').compareScreenshots('base');
    });

    it('should toggle the toggle', () => {
        const value = { v: false };

        getSettings('add setting').then(settings => {
            settings.addSetting({
                ...TOGGLE_SETTING,
                active: () => value.v,
                toggle: () => value.v = !value.v,
            });
            settings.addSetting(OPTIONS_SETTING);
        });

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=toggle-setting]').click();

        cy.wrap(value).its('v').should('eq', true);
        cy.get('.psv-settings').compareScreenshots('toggle-true');

        cy.get('[data-setting-id=toggle-setting]').click();

        cy.wrap(value).its('v').should('eq', false);
        cy.get('.psv-settings').compareScreenshots('base');
    });

    it('should select an option', () => {
        const value = { v: 'A' };

        getSettings('add setting').then(settings => {
            settings.addSetting(TOGGLE_SETTING);
            settings.addSetting({
                ...OPTIONS_SETTING,
                current: () => value.v,
                apply: (option) => value.v = option,
            });
        });

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=options-setting]').click();

        cy.get('.psv-settings').compareScreenshots('option-list');

        cy.get('[data-option-id=__back]').click();

        cy.wrap(value).its('v').should('eq', 'A');
        cy.get('.psv-settings').compareScreenshots('base');

        cy.get('[data-setting-id=options-setting]').click();
        cy.get('[data-option-id=B]').click();

        cy.wrap(value).its('v').should('eq', 'B');
        cy.get('.psv-settings').should('not.be.visible');

        cy.get('.psv-settings-button').click();

        cy.get('.psv-settings').compareScreenshots('option-b');
    });

    it('should display a badge', () => {
        const value = { v: 'A' };

        getSettings('add setting').then(settings => {
            settings.addSetting({
                ...OPTIONS_SETTING,
                current: () => value.v,
                apply: (option) => value.v = option,
                badge: () => value.v,
            });
        });

        cy.get('.psv-settings-button')
            .should('include.text', 'A')
            .compareScreenshots('badge-a');

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=options-setting]').click();
        cy.get('[data-option-id=B]').click();

        cy.get('.psv-settings-button')
            .should('include.text', 'B')
            .compareScreenshots('badge-b');
    });


    function getSettings(log: string) {
        return callPlugin<SettingsPlugin>('settings', log);
    }
});
