<p align="center">
  <image src=https://github.com/scramble45/tapes/blob/main/images/tapes.svg>
</p>
<h1 align="center">an iptv client</h1>

    
### What is tapes?
  - Tapes is a IPTV client, it can load a directory full of `.m3u` files containing stream URLs.
  - What makes tapes different that other players?
    - It is able to source the latest channels published to: https://github.com/iptv-org/iptv/
    - Gamepad support (steam deck)
    - A better user interface or the start of one.
  - Why electron?
    - Makes for quick work of bundling and distrubuting apps across a wild variety of platforms, change my mind.
  - Tapes is a small project that gets features added as I have time, although PRs are welcome.
  
### Flatpak
  - To be able to use a controller you need to grant udev filesystem permissions using the following command:
    - For now you will need to make sure you have the following installed for the flatpak to work correctly:
      ```
      sudo flatpak install flathub org.freedesktop.Platform/x86_64/19.08 org.freedesktop.Sdk/x86_64/19.08 org.electronjs.Electron2.BaseApp/x86_64/stable -y
      ```
    - `flatpak override --user --filesystem=/run/udev:ro io.atom.electron.tapes_iptv`

### Known issues:
  - The menubar is hidden by default, press the `ALT` key to make the menu visible.

### Downloads
  - See the [Releases](https://github.com/scramble45/tapes/releases) on this repo.
