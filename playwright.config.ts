import { defineConfig } from '@playwright/test'

const viewports = [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
  { width: 740, height: 375 },
]

export default defineConfig({
  testDir: './tests',
  outputDir: '/tmp/finsoft-responsive-results',
  fullyParallel: true,
  workers: 3,
  timeout: 45000,
  expect: { timeout: 6000 },
  reporter: [['list'], ['html', { outputFolder: '/tmp/finsoft-responsive-report', open: 'never' }]],
  use: {
    actionTimeout: 6000,
    baseURL: 'http://127.0.0.1:5174',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: viewports.map((viewport) => ({
    name: `${viewport.width}x${viewport.height}`,
    use: { viewport, hasTouch: viewport.width < 992, isMobile: viewport.width < 768 },
  })),
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
  },
})