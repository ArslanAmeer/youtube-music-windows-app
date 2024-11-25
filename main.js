const { app, BrowserWindow, dialog, session } = require("electron");

let mainWindow;
let isQuitting = false; // Track if the app is explicitly quitting

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const ses = session.fromPartition("persist:youtube-music");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      session: ses,
    },
  });

  mainWindow.loadURL("https://music.youtube.com");

  // Intercept the close event
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault(); // Prevent the default close behavior

      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1, // Default to "No"
        title: "Confirm",
        message: "Do you want to close the app? All music playback will stop.",
      });

      if (choice === 0) {
        // "Yes" button
        isQuitting = true; // Set the quitting flag
        mainWindow.destroy(); // Force destroy the window
        app.quit(); // Quit the app entirely
      }
    }
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  isQuitting = true; // Prevent dialog on quit
});
