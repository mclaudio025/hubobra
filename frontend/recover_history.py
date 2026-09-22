import os
import json
import shutil
import urllib.parse
from pathlib import Path

def recover_files():
    # Paths to Local History
    code_history = Path(os.path.expandvars(r"%APPDATA%\Code\User\History"))
    cursor_history = Path(os.path.expandvars(r"%APPDATA%\Cursor\User\History"))

    history_dirs = []
    if code_history.exists():
        history_dirs.append(code_history)
    if cursor_history.exists():
        history_dirs.append(cursor_history)

    # We want to target files in 'e:/Apps/Projeto Loja Moderna/frontend/src/app' and its subdirectories
    target_pattern = "Projeto%20Loja%20Moderna/frontend/src"
    
    recovered_count = 0

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
            if target_pattern in resource:
                # e.g., resource = "file:///e%3A/Apps/Projeto%20Loja%20Moderna/frontend/src/app/page.tsx"
                # Remove file:/// or vscode-vfs:// if any, but properly parse the URI
                parsed_url = urllib.parse.urlparse(resource)
                # decoded path looks like /e:/Apps/Projeto Loja Moderna/frontend/src/app/page.tsx
                file_path_str = urllib.parse.unquote(parsed_url.path)
                
                # Trim the leading '/' on Windows (e.g. /e:/Apps -> e:/Apps)
                if file_path_str.startswith('/') and ':' in file_path_str[1:3]:
                    file_path_str = file_path_str[1:]
                elif file_path_str.startswith('\\'):
                    file_path_str = file_path_str[1:]
                    
                target_path = Path(file_path_str)
                
                # Ensure the path is actually inside our project
                if not str(target_path).lower().startswith("e:\\apps\\projeto loja moderna\\frontend\\src"):
                    if not str(target_path).lower().startswith("e:/apps/projeto loja moderna/frontend/src"):
                        continue
                
                entries = data.get("entries", [])
                if not entries: 
                    continue
                
                # Sort by timestamp descending to get the newest history entry
                entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
                
                # Find the newest valid file (size > 0)
                for entry in entries:
                    entry_id = entry.get("id")
                    source_file = entry_dir / entry_id
                    
                    if source_file.exists() and source_file.stat().st_size > 0:
                        # Before copying, let's verify if the current file in the project is actually 0 bytes
                        # or significantly malformed, or if it doesn't exist
                        needs_recovery = False
                        if not target_path.exists():
                            needs_recovery = True
                        elif target_path.stat().st_size == 0:
                            needs_recovery = True
                        
                        if needs_recovery:
                            target_path.parent.mkdir(parents=True, exist_ok=True)
                            shutil.copy2(source_file, target_path)
                            print(f"Recovered: {target_path}")
                            recovered_count += 1
                        break

    print(f"Total recovered: {recovered_count}")

if __name__ == "__main__":
    recover_files()
