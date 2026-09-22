import os
import json
from pathlib import Path

def peek_history():
    appdata = os.environ.get('APPDATA', r"C:\Users\Oficina\AppData\Roaming")
    code_history = Path(appdata) / "Code" / "User" / "History"
    cursor_history = Path(appdata) / "Cursor" / "User" / "History"

    history_dirs = []
    if code_history.exists():
        history_dirs.append(code_history)
        print(f"Code history found: {code_history}")
    if cursor_history.exists():
        history_dirs.append(cursor_history)
        print(f"Cursor history found: {cursor_history}")

    count = 0
    for hist_dir in history_dirs:
        for entry_dir in hist_dir.iterdir():
            if not entry_dir.is_dir(): continue
            entries_file = entry_dir / "entries.json"
            if not entries_file.exists(): continue
            
            try:
                with open(entries_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    resource = data.get("resource", "")
                    if resource:
                        print(resource)
                        count += 1
                        if count >= 30:
                            return
            except Exception as e:
                pass

if __name__ == "__main__":
    peek_history()
