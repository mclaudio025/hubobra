import os
import json
from pathlib import Path

def debug_history():
    code_history = Path(os.path.expandvars(r"%APPDATA%\Code\User\History"))
    cursor_history = Path(os.path.expandvars(r"%APPDATA%\Cursor\User\History"))

    history_dirs = []
    if code_history.exists():
        history_dirs.append(code_history)
    if cursor_history.exists():
        history_dirs.append(cursor_history)

    target_pattern = "frontend"
    
    found_resources = set()

    for hist_dir in history_dirs:
        for entry_dir in hist_dir.iterdir():
            if not entry_dir.is_dir(): 
                continue
            
            entries_file = entry_dir / "entries.json"
            if not entries_file.exists(): 
                continue
            
            try:
                with open(entries_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                continue
                
            resource = data.get("resource", "")
            if 'frontend' in resource.lower() and 'src' in resource.lower():
                found_resources.add(resource)
                
    for r in list(found_resources)[:20]:
        print(r)

if __name__ == "__main__":
    debug_history()
