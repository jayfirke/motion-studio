"""Where the workspace's API keys live, on every supported system (stdlib only; never prints a key).

Lookup order for a key, first hit wins:
  1. the environment variable (FISH_API_KEY, FREESOUND_API_KEY, FREESOUND_CLIENT_ID);
  2. macOS: the login Keychain item (service "motiongraphics.<name>"), written by scripts/setup/keys.sh;
  3. Linux and WSL 2: the desktop secret store through `secret-tool` (GNOME Keyring, KDE Wallet), same service name;
  4. Linux and WSL 2 without a secret store: ~/.config/motion-studio/keys.env (KEY=value lines, readable only by you),
     also written by keys.sh with hidden typing.
"""
import os
import platform
import subprocess
from pathlib import Path

KEYS_ENV = Path.home() / '.config' / 'motion-studio' / 'keys.env'


def _run(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return r.stdout.strip() if r.returncode == 0 else ''
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return ''


def _from_file(var):
    try:
        for line in KEYS_ENV.read_text().splitlines():
            k, _, v = line.partition('=')
            if k.strip() == var:
                return v.strip().strip('"').strip("'")
    except OSError:
        pass
    return ''


def get_key(var, service):
    """The key for env var `var` / store item `service`, or '' when none is stored."""
    key = os.environ.get(var, '').strip()
    if key:
        return key
    if platform.system() == 'Darwin':
        return _run(['security', 'find-generic-password', '-s', service, '-w'])
    return _run(['secret-tool', 'lookup', 'service', service]) or _from_file(var)


def where(var, service):
    """Human hint for error messages: how to store this key on this system."""
    if platform.system() == 'Darwin':
        return f'set {var} or run: bash scripts/setup/keys.sh (macOS Keychain item "{service}")'
    return f'set {var} or run: bash scripts/setup/keys.sh (secret store item "{service}", or {KEYS_ENV})'
