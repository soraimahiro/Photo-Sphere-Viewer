# Cubemap video

<Badges module="cubemap-video-adapter"/>

::: module
This adapter is available in the [@photo-sphere-viewer/cubemap-video-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-video-adapter) package.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.CubemapVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [PhotoSphereViewer.VideoPlugin],
});
```

::: warning
This adapter requires to use the [VideoPlugin](../../plugins/video.md).
:::

## Example

::: code-demo

```yaml
title: PSV Cubemap Video Demo
packages:
    - name: cubemap-video-adapter
      imports: CubemapVideoAdapter
    - name: video-plugin
      imports: VideoPlugin
      style: true
    - name: settings-plugin
      imports: SettingsPlugin
      style: true
    - name: resolution-plugin
      imports: ResolutionPlugin
```

<<< ./demos-src/cubemap-video.js

:::

::: tip Positions definitions
This adapter does not support pixel positions, only `yaw`+`pitch`.
:::

## Configuration

#### `autoplay`

-   type: `boolean`
-   default: `false`

Automatically starts the video on load.

#### `muted`

-   type: `boolean`
-   default: `false`

Mute the video by default.

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)

-   type: `string`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.

#### `equiangular`

-   type: `boolean`
-   default: `true`

Set to `true` when using an equiangular cubemap (EAC), which is the format used by Youtube. Set to `false` when using a standard cubemap.

### Video format

This adapter supports video files consisting of a grid of the six faces of the cube, as used by Youtube for example.

The layout of a frame must be as follow:

![cubemap-video](/images/cubemap-video.png)
