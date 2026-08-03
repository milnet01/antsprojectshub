"""The tray must talk to the port the server actually has, not the one it guessed.

Run with the rest of the suite: `npm test`, or on its own:
    python3 -m unittest discover -s test -p '*_test.py'
"""

import importlib.util
import os
import unittest

_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "tray", "ants-stats-tray.py")
_spec = importlib.util.spec_from_file_location("ants_stats_tray", _PATH)
tray = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tray)


class ParseUnitEnv(unittest.TestCase):
    def test_reads_systemctl_show_output(self):
        self.assertEqual(
            tray.parse_unit_env("Environment=STATS_PORT=4321 STATS_REFRESH_HOURS=24"),
            {"STATS_PORT": "4321", "STATS_REFRESH_HOURS": "24"},
        )

    def test_a_unit_with_no_environment(self):
        self.assertEqual(tray.parse_unit_env("Environment="), {})

    def test_a_unit_that_could_not_be_read(self):
        self.assertEqual(tray.parse_unit_env(""), {})

    def test_quoted_values(self):
        # systemd quotes any value containing spaces.
        self.assertEqual(
            tray.parse_unit_env('Environment=PORT=5997 NOTE="two words"'),
            {"PORT": "5997", "NOTE": "two words"},
        )


class ResolvePort(unittest.TestCase):
    def test_default(self):
        self.assertEqual(tray.resolve_port({}, {}), 4321)

    def test_unit_stats_port(self):
        self.assertEqual(tray.resolve_port({"STATS_PORT": "5001"}, {}), 5001)

    def test_unit_port_wins_over_unit_stats_port(self):
        self.assertEqual(
            tray.resolve_port({"PORT": "5997", "STATS_PORT": "4321"}, {}), 5997
        )

    def test_the_unit_beats_our_own_environment(self):
        # The regression this whole function exists for: the service is started by systemd, so
        # a drop-in override never reaches the tray's own environment. A tray that trusted
        # its own STATS_PORT here would open 4321 and POST /refresh into nothing.
        self.assertEqual(
            tray.resolve_port({"PORT": "5997"}, {"STATS_PORT": "4321"}), 5997
        )

    def test_own_environment_is_the_last_resort(self):
        self.assertEqual(tray.resolve_port({}, {"PORT": "5999"}), 5999)
        self.assertEqual(tray.resolve_port({}, {"STATS_PORT": "5001"}), 5001)
        self.assertEqual(tray.resolve_port({}, {"PORT": "5999", "STATS_PORT": "5001"}), 5999)

    def test_unusable_values_fall_through(self):
        # The tray only reads a port; the server is the one that refuses to start on a bad
        # one. Guessing 4321 here is right — it is what an unset PORT would have meant.
        for bad in ("abc", "[abc]", "", "0", "80", "65536", "5999.5", " 5997 "):
            self.assertEqual(tray.resolve_port({"PORT": bad}, {}), 4321, bad)


class Headless(unittest.TestCase):
    def test_managed(self):
        self.assertTrue(tray.is_headless({"LWSM_MANAGED": "1"}))

    def test_absent_or_anything_else_behaves_as_today(self):
        # A presentation hint with no security value: unauthenticated and trivially forged.
        # Exact "1" only, so nothing else is read as consent in either direction.
        self.assertFalse(tray.is_headless({}))
        for other in ("0", "", "true", "yes", "2", "1 "):
            self.assertFalse(tray.is_headless({"LWSM_MANAGED": other}), other)


if __name__ == "__main__":
    unittest.main()
