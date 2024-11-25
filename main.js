const { app, BrowserWindow, Menu, Tray, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;
let settingsWindow;
let tray;
let isQuitting = false;

const settings = {
  minimizeOnClose: false,
  showInTray: true,
  minimizeToTray: false,
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "assets/logo-trim.png"),
  });

  mainWindow.loadURL("https://music.youtube.com");

  // Handle the "close" event for "Minimize on Close" behavior
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      if (settings.minimizeOnClose) {
        e.preventDefault();
        settings.minimizeToTray ? mainWindow.hide() : mainWindow.minimize();
      } else {
        isQuitting = true;
        app.quit();
      }
    }
  });

  // Handle the "minimize" event for "Minimize to Tray" behavior
  mainWindow.on("minimize", (e) => {
    if (settings.minimizeToTray) {
      e.preventDefault(); // Prevent default minimize behavior
      mainWindow.hide(); // Hide the window instead of minimizing it
    }
  });
}

function createSettingsWindow() {
  if (settingsWindow) return;

  const { width, height } =
    require("electron").screen.getPrimaryDisplay().workAreaSize;

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 600,
    x: Math.round((width - 600) / 2), // Center horizontally
    y: Math.round((height - 600) / 2), // Center vertically
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  settingsWindow.loadFile("settings.html");
  settingsWindow.setMenu(null);

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

function createTray() {
  if (!tray) {
    tray = new Tray(path.join(__dirname, "assets/logo-trim.png"));
    tray.setToolTip("YouTube Music");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show App",
          click: () => {
            mainWindow.show();
          },
        },
        {
          label: "Quit",
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ])
    );

    tray.on("click", () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });
  }
}

// App ready event
app.on("ready", () => {
  createMainWindow();
  createTray();

  // Add menu with "Settings" and "Quit" options
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "Settings",
          click: createSettingsWindow, // Open the settings window
        },
        { role: "quit" }, // Quit the application
      ],
    },
  ]);
  Menu.setApplicationMenu(menu); // Apply the menu to the app
});

autoUpdater.on("update-downloaded", () => {
  const choice = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["Yes", "Later"],
    defaultId: 0,
    message: "A new update is available. Do you want to install it now?",
  });

  if (choice === 0) {
    autoUpdater.quitAndInstall();
  }
});

ipcMain.handle("get-settings", () => settings);

ipcMain.on("update-setting", (event, { key, value }) => {
  settings[key] = value;

  if (key === "showInTray") {
    if (value) {
      createTray();
    } else if (!settings.minimizeToTray && tray) {
      tray.destroy();
      tray = null;
    }
  }

  if (key === "minimizeToTray") {
    if (value && !tray) {
      createTray();
    } else if (!value && !settings.showInTray && tray) {
      tray.destroy();
      tray = null;
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
