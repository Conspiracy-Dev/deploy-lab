export const HERO_WIREFRAME = {
  animation: {
    rotationXPerSecond: 0.12,
    rotationYPerSecond: 0.2,
  },
  canvas: {
    alpha: true,
    clearAlpha: 0,
    clearColor: '#030303',
    dpr: [1, 1.5],
    fpsLimit: 40,
    powerPreference: 'low-power',
  },
  cameraPositionZ: 5,
  material: {
    color: '#1a20ff',
    wireframe: true,
  },
  torusKnotArgs: [1.25, 0.28, 192, 24] as [number, number, number, number],
}
