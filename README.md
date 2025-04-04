# NOTE.SV

A secure note and password manager based on Bitcoin SV (BSV) Blockchain.

> **Important Notice**: This v1.0 codebase is no longer maintained. New users are recommended to download v2.0 from the official website.

### Development
```bash
npm install

# Desktop version
gulp desktop

# iOS version
gulp ios

# Android version
gulp android
```

### Build

Desktop:
```bash
npm install
gulp buildDesktop
```

iOS:
```bash
npm install
gulp buildIos
```

Android:
```bash
npm install
gulp buildAndroid
```

### Configuration

For Android development, you'll need to:
1. Create a Firebase project
2. Download your own `google-services.json`
3. Place it in `src-capacitor/android/app/google-services.json`

For iOS development, you'll need to:
1. Create a Firebase project
2. Download your own `GoogleService-Info.plist`
3. Place it in `src-capacitor/ios/App/App/GoogleService-Info.plist`

For iOS certificates:
1. Generate your own Apple Push Notification service (APNs) key from Apple Developer portal
2. Place your certificates in `src-capacitor/ios/cert/`
3. Update the certificate references in your Xcode project

> **Security Notice**: 
> - Never commit Firebase configuration files to version control
> - Never commit iOS certificates or private keys to version control

## Download Pre-built Versions

You can download the latest pre-built versions of NOTE.SV from our official GitHub releases page:

[https://github.com/Note-sv/NOTE.SV/releases](https://github.com/Note-sv/NOTE.SV/releases)

Available platforms:
- Windows (64-bit)
- macOS (Intel and Apple Silicon)
- Linux
- Android APK

## About

Developed by ChainBow Co. Ltd.  
Tokyo, Japan

Website: https://note.sv  
Support: support@chainbow.io

## License

MIT License

Copyright (c) 2020 ChainBow Co. Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.