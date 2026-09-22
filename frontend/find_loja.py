import os
import json
from pathlib import Path
import urllib.parse

def find_loja():
    appdata = os.environ.get('APPDATA', r"C:\Users\Oficina\AppData\Roaming")
    code_history = Path(appdata) / "Code" / "User" / "History"
    cursor_history = Path(appdata) / "Cursor" / "User" / "History"

    history_dirs = []
    if code_history.exists(): history_dirs.append(code_history)
    if cursor_history.exists(): history_dirs.append(cursor_history)

    for hist_dir in history_dirs:
        for entry_dir in hist_dir.iterdir():
            if not entry_dir.is_dir(): continue
            entries_file = entry_dir / "entries.json"
            if not entries_file.exists(): continue
            
            try:
                with open(entries_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    resource = data.get("resource", "")
                    if "loja" in resource.lower():
                        print(f"FOUND: {resource}")
                        
                        # Find valid entries
                        entries = data.get("entries", [])
                        valid_sizes = []
                        for entry in entries:
                            p = entry_dir / entry.get("id", "")
                            if p.exists():
                                valid_sizes.append(p.stat().st_size)
                        print(f"  Sizes: {valid_sizes}")
            except Exception as e:
                pass

if __name__ == "__main__":
    find_loja()
