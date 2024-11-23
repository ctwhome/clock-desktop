# Floating Clock App
Sometimes you  need a sleek, large or small clock Always on top floating on your desktop.
Place it wherever you want and make it as big or small as you desire.

-> Compatible with **MacOS (Apple Silicon)**. _More platforms coming soon if there is demand_.

Download here: [clock-desktop.dmg](https://github.com/ctwhome/clock-desktop/raw/main/Download/Apple%20Silicon/clock-desktop_0.0.0_aarch64.dmg)

![image](https://github.com/user-attachments/assets/b8bf47aa-1ada-4532-8810-def5394c8a18)




### Development

If for whatever reason is not working, remove the src-tauri/target folder and try again.
```bash
# Run locally
bun tauri dev
```


## Buid for MacOS (Apple Silicon)

```bash
bunx tauri build --target aarch64-apple-darwin
```
Get the .dmg file in the `./src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/clock-desktop_0.0.0_aarch64.dmg` folder.



## Recommended IDE Setup
[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).


