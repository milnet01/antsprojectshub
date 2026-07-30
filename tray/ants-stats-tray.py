#!/usr/bin/env python3
"""Tray control for the private stats dashboard server (systemd user unit `ants-stats`).

Sits next to the clock and offers: open the dashboard, refresh the stats now, start / stop /
restart the server, and quit (which stops the server too).

Python rather than Node — the rest of this repo's tooling — because a tray icon needs a
desktop toolkit, and the Node option would mean bundling a whole browser via Electron for one
menu. PySide6 is Qt, which KDE Plasma is itself built on, so it is already installed and the
icon behaves like a native one.

    python3 tray/ants-stats-tray.py          # or: npm run stats:tray

Talks to the server the same way the dashboard page does — POST /refresh on 127.0.0.1 — so
there is no second code path that could disagree with the Refresh button.
"""

import os
import subprocess
import urllib.request

from PySide6.QtCore import QObject, QRunnable, QThreadPool, QTimer, Signal
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication, QMenu, QMessageBox, QSystemTrayIcon

HERE = os.path.dirname(os.path.abspath(__file__))
UNIT = os.environ.get("STATS_UNIT", "ants-stats.service")
PORT = int(os.environ.get("STATS_PORT", "4321"))
URL = f"http://127.0.0.1:{PORT}"
POLL_MS = 5000

ICON_RUNNING = os.path.join(HERE, "icon-running.svg")
ICON_STOPPED = os.path.join(HERE, "icon-stopped.svg")


def systemctl(*args, capture=False):
    """Run `systemctl --user …`. Returns stdout when capturing, else the exit code."""
    cmd = ["systemctl", "--user", *args]
    if capture:
        r = subprocess.run(cmd, capture_output=True, text=True)
        return r.stdout.strip()
    return subprocess.run(cmd, capture_output=True, text=True).returncode


def is_running():
    return systemctl("is-active", UNIT, capture=True) == "active"


def unit_installed():
    return systemctl("cat", UNIT) == 0


def post_refresh():
    """Ask the running server to regenerate. Long timeout — a full run takes ~15 s."""
    req = urllib.request.Request(f"{URL}/refresh", method="POST")
    with urllib.request.urlopen(req, timeout=300) as res:
        return res.read().decode()


# ---------------------------------------------------------------- background jobs
#
# A refresh takes about fifteen seconds and a systemctl call can block on the unit; doing
# either on the GUI thread would freeze the menu mid-click and make Plasma offer to kill us.


class _JobSignals(QObject):
    done = Signal(bool, str)


class _Job(QRunnable):
    def __init__(self, fn):
        super().__init__()
        self.fn = fn
        self.signals = _JobSignals()

    def run(self):
        try:
            self.signals.done.emit(True, self.fn() or "")
        except Exception as err:  # noqa: BLE001 — any failure becomes a visible notification
            self.signals.done.emit(False, str(err))


_jobs = set()  # QThreadPool owns the C++ side; this keeps the Python wrapper alive


def run_async(fn, on_done):
    job = _Job(fn)
    _jobs.add(job)
    job.signals.done.connect(lambda ok, msg: (_jobs.discard(job), on_done(ok, msg)))
    QThreadPool.globalInstance().start(job)


# ---------------------------------------------------------------------- the tray


class StatsTray(QSystemTrayIcon):
    def __init__(self):
        super().__init__()
        self.running_icon = QIcon(ICON_RUNNING)
        self.stopped_icon = QIcon(ICON_STOPPED)
        self.busy = False  # one long-running action at a time

        menu = QMenu()
        self.act_open = menu.addAction("Open dashboard", self.open_dashboard)
        self.act_refresh = menu.addAction("Refresh stats now", self.refresh)
        menu.addSeparator()
        self.act_toggle = menu.addAction("Stop server", self.toggle)
        self.act_restart = menu.addAction("Restart server", self.restart)
        menu.addSeparator()
        menu.addAction("Quit (stops the server)", self.quit)
        self.setContextMenu(menu)

        # Left-click opens the dashboard; the menu is the right-click.
        self.activated.connect(
            lambda reason: self.open_dashboard()
            if reason == QSystemTrayIcon.ActivationReason.Trigger
            else None
        )

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.sync)
        self.timer.start(POLL_MS)
        self.sync()

    # Icon, tooltip and menu wording all say the same thing, so the state never has to be
    # read off a 22-pixel icon alone.
    def sync(self):
        if self.busy:
            return
        on = is_running()
        self.setIcon(self.running_icon if on else self.stopped_icon)
        self.setToolTip(
            f"Private stats — server running on {URL}"
            if on
            else "Private stats — server stopped"
        )
        self.act_toggle.setText("Stop server" if on else "Start server")
        self.act_refresh.setEnabled(on)
        self.act_restart.setEnabled(on)

    def note(self, title, body):
        self.showMessage(title, body, self.running_icon, 5000)

    def open_dashboard(self):
        if not is_running():
            self.note("Private stats", "The server is stopped — start it from this menu first.")
            return
        subprocess.Popen(["xdg-open", URL])

    def refresh(self):
        if self.busy:
            return
        self.busy = True
        self.setToolTip("Private stats — refreshing…")
        self.act_refresh.setText("Refreshing…")
        self.act_refresh.setEnabled(False)

        def finished(ok, msg):
            self.busy = False
            self.act_refresh.setText("Refresh stats now")
            self.note(
                "Private stats",
                "Stats refreshed." if ok else f"Refresh failed: {msg}",
            )
            self.sync()

        run_async(post_refresh, finished)

    def _unit_action(self, verb, doing, done):
        if self.busy:
            return
        self.busy = True
        self.setToolTip(f"Private stats — {doing}…")

        def finished(ok, _msg):
            self.busy = False
            self.note("Private stats", done if ok else f"Could not {verb} the server.")
            self.sync()

        # A non-zero exit becomes a failed job, so the notification tells the truth.
        def go():
            if systemctl(verb, UNIT) != 0:
                raise RuntimeError(verb)

        run_async(go, finished)

    def toggle(self):
        if is_running():
            self._unit_action("stop", "stopping", "Server stopped.")
        else:
            self._unit_action("start", "starting", "Server started.")

    def restart(self):
        self._unit_action("restart", "restarting", "Server restarted.")

    def quit(self):
        # "Quit" was chosen to mean "shut the whole thing down", so leaving the server running
        # behind a vanished icon would be the surprising outcome, not the safe one.
        systemctl("stop", UNIT)
        QApplication.instance().quit()


def main():
    app = QApplication([])
    app.setApplicationName("Ants Stats Tray")
    app.setQuitOnLastWindowClosed(False)  # closing a notification must not end the app

    if not QSystemTrayIcon.isSystemTrayAvailable():
        QMessageBox.critical(None, "Ants Stats Tray", "This desktop has no system tray.")
        return 1
    if not unit_installed():
        QMessageBox.critical(
            None,
            "Ants Stats Tray",
            f"The {UNIT} user service isn't installed.\n\n"
            "See the 'Private stats dashboard' section of the repo README.",
        )
        return 1

    tray = StatsTray()
    tray.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
