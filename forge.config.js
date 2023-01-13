const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

module.exports = {
  packagerConfig: {
    icon: "./src/icons/png/64x64.png",
    appBundleId: fromBuildIdentifier({ beta: 'com.beta.app', prod: 'com.app' })
  },
  make_targets: {
    win32: [
      "squirrel"
    ],
    linux: [
      "flatpak"
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        iconUrl: 'file:///C:/Users/......./src/icons/win/icon.ico'
      }
    },
    {
      name: "@electron-forge/maker-flatpak",
      config: {
        options: {
          categories: ['Video'],
          icon: {
            "512x512": "./src/icons/png/512x512.png"
          }
        },
        modules: [
          {
            name: "zypak",
            sources: [
              {
                type: "git",
                url: "https://github.com/refi64/zypak",
                tag: "v2022.03"
              }
            ]
          }
        ]
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "linux",
        "win"
      ],
      config: {}
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'scramble45',
          name: 'tapes'
        },
        authtoken: process.env.GITHUB_TAPES_REPO_TOKEN,
        prerelease: true
      }
    }
  ],
  plugins: [],
  hooks: {},
  buildIdentifier: process.env.IS_BETA ? 'beta' : 'prod'
}