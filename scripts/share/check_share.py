#!/usr/bin/env python3
"""Lists the files that would be shared (exactly what git would track) and refuses if any of them holds
a secret or a file whose licence forbids passing it on. Stdlib only. Never prints a key.

  python3 scripts/share/check_share.py                 # report only
  python3 scripts/share/check_share.py --list-out f    # also write the NUL-separated file list to f

Checks, in order:
  1. exact keys: the values of the workspace's Keychain items (and FISH_API_KEY / FREESOUND_API_KEY /
     FREESOUND_CLIENT_ID if set) must not appear in any shared file, text or binary;
  2. key patterns: private keys, Anthropic/OpenAI/AWS/Google/GitHub/Slack/Hugging Face tokens, bearer
     tokens, and "api_key = '...'"-style assignments in text files;
  3. forbidden files: .env, *.pem, *.p8, *.p12, .local/, personal Claude settings;
  4. Mixkit: every path named in a Mixkit row of a project's ASSETS-USED.md must be left out
     (Mixkit's licence allows the sounds only inside rendered videos, never as files).
Exit 0 when clean, 1 when anything is found.
"""
import os, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVICES = ['motiongraphics.fish-audio-api-key', 'motiongraphics.freesound-api-key', 'motiongraphics.freesound-client-id']
ENV_KEYS = ['FISH_API_KEY', 'FREESOUND_API_KEY', 'FREESOUND_CLIENT_ID']
PATTERNS = [
    ('private key', rb'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
    ('Anthropic key', rb'sk-ant-[A-Za-z0-9_-]{20,}'),
    ('OpenAI-style key', rb'(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9_-]{32,}'),
    ('AWS access key', rb'(?<![A-Za-z0-9+/])AKIA[0-9A-Z]{16}(?![A-Za-z0-9+/=])'),
    ('Google API key', rb'(?<![A-Za-z0-9+/])AIza[0-9A-Za-z_-]{35}(?![A-Za-z0-9+/=])'),
    ('GitHub token', rb'(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,})'),
    ('Slack token', rb'xox[abprs]-[A-Za-z0-9-]{10,}'),
    ('Hugging Face token', rb'(?<![A-Za-z0-9])hf_[A-Za-z0-9]{30,}'),
    ('bearer token', rb'[Bb]earer [A-Za-z0-9._~+/-]{24,}'),
    ('key assignment', rb'(?i)(?:api[_-]?key|apikey|secret|client[_-]?secret|password|passwd|access[_-]?token)["\' ]*[:=] *["\'][A-Za-z0-9_./+=-]{16,}["\']'),
]
FORBIDDEN = [r'(^|/)\.env(\.|$)', r'\.(pem|p8|p12|pfx|keystore|jks)$', r'^\.local/', r'(^|/)CLAUDE\.local\.md$',
             r'^\.claude/settings\.local\.json$', r'(^|/)id_(rsa|ed25519)']
TEXT_EXT = {'.md', '.txt', '.json', '.jsonc', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.sh', '.html',
            '.css', '.yml', '.yaml', '.toml', '.tsv', '.csv', '.mdc', '.cfg', '.ini', '.env', '.xml', '.svg'}


def shared_files():
    out = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
                         cwd=ROOT, capture_output=True, check=True).stdout
    return [p.decode() for p in out.split(b'\0') if p]


def secrets():
    vals = []
    for s in SERVICES:
        r = subprocess.run(['security', 'find-generic-password', '-s', s, '-w'], capture_output=True)
        v = r.stdout.strip()
        if r.returncode == 0 and len(v) >= 8:
            vals.append((s, v))
    for e in ENV_KEYS:
        v = os.environ.get(e, '').strip().encode()
        if len(v) >= 8:
            vals.append((e, v))
    return vals


def mixkit_paths(files):
    """Paths named in Mixkit rows of projects/*/ASSETS-USED.md that are still in the shared list."""
    shared = set(files)
    hits = []
    for ledger in sorted(ROOT.glob('projects/*/ASSETS-USED.md')):
        proj = ledger.parent.relative_to(ROOT).as_posix()
        for line in ledger.read_text(errors='replace').splitlines():
            if 'mixkit' not in line.lower():
                continue
            for name in re.findall(r'`([^`]+\.(?:mp3|wav|ogg|m4a|aac|flac))`', line):
                name = name.strip()
                cands = [f'{proj}/{name}'] if '/' in name else [f for f in shared if f.startswith(proj + '/') and f.endswith('/' + name)]
                hits += [c for c in cands if c in shared]
    hits += [f for f in files if f.startswith('projects/') and 'mixkit' in f.lower()]
    return sorted(set(hits))


def main():
    files = shared_files()
    problems = 0
    total = sum((ROOT / f).lstat().st_size for f in files if (ROOT / f).exists() or (ROOT / f).is_symlink())
    print(f'Files to share: {len(files)} ({total / 1e6:.0f} MB)')

    # 1. exact keys
    keys = secrets()
    found = []
    for f in files:
        p = ROOT / f
        if p.is_symlink() or not p.is_file():
            continue
        data = p.read_bytes()
        for name, v in keys:
            if v in data:
                found.append((f, name))
    print(f'1. Exact keys: checked {len(keys)} stored key(s) against every file: ' + ('none found' if not found else f'{len(found)} FOUND'))
    for f, name in found:
        print(f'   {f}: contains the value of {name}')
    problems += len(found)

    # 2. key patterns (text files only; base64 runs are skipped by the lookarounds)
    pat = []
    rx = [(n, re.compile(r)) for n, r in PATTERNS]
    for f in files:
        p = ROOT / f
        if p.suffix.lower() not in TEXT_EXT or p.is_symlink() or not p.is_file() or p.stat().st_size > 5_000_000:
            continue
        data = p.read_bytes()
        for n, r in rx:
            m = r.search(data)
            if m:
                line = data[:m.start()].count(b'\n') + 1
                pat.append((f, line, n))
    print('2. Key patterns: ' + ('none found' if not pat else f'{len(pat)} FOUND (look before sharing)'))
    for f, line, n in pat:
        print(f'   {f}:{line}: looks like a {n}')
    problems += len(pat)

    # 3. forbidden files
    bad = [f for f in files if any(re.search(r, f) for r in FORBIDDEN)]
    print('3. Forbidden files: ' + ('none' if not bad else f'{len(bad)} FOUND'))
    for f in bad:
        print(f'   {f}')
    problems += len(bad)

    # 4. Mixkit
    mk = mixkit_paths(files)
    print('4. Mixkit files: ' + ('none (all left out)' if not mk else f'{len(mk)} would be shared: add them to .gitignore'))
    for f in mk:
        print(f'   {f}')
    problems += len(mk)

    # outward symlinks would break on another machine and leak this one's paths
    outward = [f for f in files if (ROOT / f).is_symlink() and os.path.isabs(os.readlink(ROOT / f))]
    if outward:
        print('5. Symlinks to absolute paths (break elsewhere): ' + ', '.join(outward))
        problems += len(outward)

    if '--list-out' in sys.argv:
        Path(sys.argv[sys.argv.index('--list-out') + 1]).write_bytes(b'\0'.join(f.encode() for f in files) + b'\0')
    print('CLEAN' if problems == 0 else f'NOT CLEAN: {problems} problem(s)')
    sys.exit(0 if problems == 0 else 1)


if __name__ == '__main__':
    main()
