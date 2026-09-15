#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
subprocess.run(["python3", str(ROOT / "patch10.py")], check=True)

gradle = ROOT / "app/build.gradle"
g = gradle.read_text(encoding="utf-8")
g = g.replace("versionCode 10", "versionCode 11")
g = g.replace("versionName '0.10.0-beta10'", "versionName '0.10.1-beta11'")
old = """        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
"""
new = """        release {
            // Beta release keeps the same package identity as the historical debug beta,
            // but is intentionally left unsigned here. CI applies one stable public TEST key.
            applicationIdSuffix '.debug'
            versionNameSuffix '-debug'
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
"""
if old not in g:
    raise SystemExit("patch11: release build block not found")
g = g.replace(old, new, 1)
gradle.write_text(g, encoding="utf-8")

print("Generated FRAME Beta 0.10.1 stable-signing migration build")
