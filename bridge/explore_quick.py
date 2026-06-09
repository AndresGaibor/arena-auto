import sys
import os
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print("=== QUICK PYTHON TEST ===")

import win32com.client
import pythoncom

print("1. CoInitialize...")
pythoncom.CoInitialize()
print("2. Creating Arena...")
arena = win32com.client.Dispatch("Arena.Application")
print("3. Set Visible...")
arena.Visible = False
print(f"4. Version: {arena.Version}")

print("5. Dir arena...")
members = [m for m in dir(arena) if not m.startswith('_')]
print(f"   {len(members)} members")
for m in members:
    try:
        attr = getattr(arena, m)
        if callable(attr):
            print(f"   method: {m}")
        else:
            print(f"   prop: {m} = {str(attr)[:80]}")
    except:
        print(f"   error: {m}")

print("6. Models...")
models = arena.Models
print(f"   Count: {models.Count}")
print(f"   Dir: {[m for m in dir(models) if not m.startswith('_')]}")

print("7. Opening model...")
model = arena.Models.Open(r"C:\Users\AndresGaibor\Documents\arena\prueba.doe")
print(f"   Name: {model.Name}")

print("8. Model members...")
model_members = [m for m in dir(model) if not m.startswith('_')]
print(f"   {len(model_members)} members")
for m in model_members:
    try:
        attr = getattr(model, m)
        if callable(attr):
            print(f"   method: {m}")
        else:
            print(f"   prop: {m} = {str(attr)[:80]}")
    except:
        print(f"   error: {m}")

print("9. Modules...")
mods = model.Modules
print(f"   Count: {mods.Count}")
print(f"   Members: {[m for m in dir(mods) if not m.startswith('_')]}")
print(f"   Has Add: {hasattr(mods, 'Add')}")

print("10. Done, quitting...")
arena.Quit()
pythoncom.CoUninitialize()
print("OK")

sys.stdout.flush()
