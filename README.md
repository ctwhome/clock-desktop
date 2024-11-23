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

### Signing and notarization (WIP)
Secrets to your GitHub repository:

- **BUILD_CERTIFICATE_BASE64**: Your Apple Developer certificate exported as p12 and base64 encoded
- **P12_PASSWORD**: The password for your p12 certificate
- **KEYCHAIN_PASSWORD**: Any password for the temporary keychain
- **APPLE_SIGNING_IDENTITY**: Your Apple Developer signing identity (format: "Developer ID Application: Your Name (Team ID)")
- **APPLE_ID**: Your Apple Developer account email
- **APPLE_PASSWORD**: Your app-specific password for your Apple ID
- **APPLE_TEAM_ID**: Your Apple Developer Team ID


The workflow will now:

Install and configure your Apple certificate
Build the app with proper code signing
Submit the app for notarization
Staple the notarization ticket to the DMG
Create a GitHub release with the signed and notarized DMG

The next time pushed to the main branch, it will create a properly signed macOS application that users can install without any security warnings.



## Recommended IDE Setup
[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).


