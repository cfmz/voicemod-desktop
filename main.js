const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const APP_URL = process.env.VM_URL || 'https://voicemod-bot.onrender.com/panel';
const BRAND = 'VoiceMod';
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180, height: 780, minWidth: 800, minHeight: 600,
    backgroundColor: '#0E1621', title: BRAND, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false, spellcheck: false
    },
  });
  if (process.platform !== 'darwin') mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadURL(APP_URL);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => {
    const ok = ['media','audioCapture','videoCapture','notifications','clipboard-read','clipboard-sanitized-write'];
    cb(ok.includes(perm));
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
