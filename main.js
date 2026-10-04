const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

const APP_URL = process.env.VM_URL || 'https://voicemod-bot.onrender.com/panel';
const BRAND = 'VoiceMod';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0E1621',
    title: BRAND,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  // Убираем верхнее меню на Windows/Linux (macOS оставляет системное)
  if (process.platform !== 'darwin') {
    mainWindow.setMenuBarVisibility(false);
  }

  // Показываем индикатор пока грузится
  mainWindow.webContents.on('did-start-loading', () => {
    if (mainWindow) mainWindow.setTitle(BRAND + ' · загрузка…');
  });
  mainWindow.webContents.on('did-stop-loading', () => {
    if (mainWindow) mainWindow.setTitle(BRAND);
  });

  // Открываем внешние ссылки в системном браузере, не в приложении
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.loadURL(APP_URL);
}

// Разрешаем уведомления, микрофон, камеру для нашего домена
function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = [
      'media', 'audioCapture', 'videoCapture',
      'notifications', 'clipboard-read', 'clipboard-sanitized-write',
    ];
    callback(allowed.includes(permission));
  });
}

// Простое меню (только для macOS)
function buildMenu() {
  if (process.platform !== 'darwin') return;
  const template = [
    {
      label: BRAND,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Окно',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  setupPermissions();
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
