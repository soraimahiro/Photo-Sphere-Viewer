<template>
    <div class="photosphere" ref="container" :class="{ loaded: loaded }"></div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Viewer } from '../../../packages/core';

let viewer: Viewer;

const { isDark } = useData();
const loaded = ref(false);
const container = ref<HTMLElement | null>(null);

const urlLight = 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg';
const urlDark = 'https://photo-sphere-viewer-data.netlify.app/assets/sphere-night.jpg';

watch(isDark, () => {
    viewer?.setPanorama(isDark.value ? urlDark : urlLight);
});

onMounted(async () => {
    const { Viewer } = await import('@photo-sphere-viewer/core');

    viewer = new Viewer({
        container: container.value!,
        loadingTxt: '',
        defaultPitch: 0.1,
        mousewheel: false,
        navbar: false,
        panorama: isDark.value ? urlDark : urlLight,
    });
    viewer.addEventListener('ready', () => {
        loaded.value = true;
        setTimeout(() => {
            viewer.dynamics.position.roll({ yaw: false }, 0.2);
        }, 500);
    }, { once: true });
});

onBeforeUnmount(() => {
    viewer?.destroy();
});
</script>

<style lang="scss" scoped>
.photosphere {
    position: absolute;
    width: 100%;
    height: calc(100vh - var(--vp-nav-height));
    margin-top: var(--vp-nav-height);
    z-index: 0 !important;
    opacity: 0;
    transition: opacity linear 500ms !important;

    &.loaded {
        opacity: 1;
    }

    &:deep(.psv-loader) {
        display: none !important;
    }
}
</style>
