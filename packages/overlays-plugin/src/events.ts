import { TypedEvent } from '@photo-sphere-viewer/core';
import type { OverlaysPlugin } from './OverlaysPlugin';

/**
 * @deprecated
 */
export class OverlayClickEvent extends TypedEvent<OverlaysPlugin> {
    static override readonly type = 'overlay-click';
    override type: 'overlay-click';

    /** @internal */
    constructor(public readonly overlayId: string) {
        super(OverlayClickEvent.type);
    }
}

/**
 * @deprecated
 */
export type OverlaysPluginEvents = OverlayClickEvent;
