"""Try Modules.Create with actual COM objects"""
import win32com.client
import pythoncom

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True
model = arena.Models.Add()
mods = model.Modules

print("Getting panels...")
panels = arena.Panels
print(f"Panels: {panels.Count}")

# Get the "Basic Process" / DiscreteProcessing panel
discrete_panel = None
for pi in range(1, panels.Count + 1):
    p = panels.Item(pi)
    print(f"Panel {pi}: {p.Name}")
    if "Discrete" in p.Name or "Process" in p.Name:
        discrete_panel = p
    
if discrete_panel is None:
    discrete_panel = panels.Item(2)  # DiscreteProcessing

print(f"\nUsing panel: {discrete_panel.Name}")

# Get ModuleDefinitions from this panel
mdefs = discrete_panel.ModuleDefinitions
print(f"ModuleDefinitions: {mdefs.Count}")

# Find "Create" module definition
create_def = None
for mi in range(1, mdefs.Count + 1):
    md = mdefs.Item(mi)
    print(f"  MD {mi}: {md.Name}")
    if md.Name == "Create":
        create_def = md

if create_def:
    print(f"\nFound Create module definition: {create_def.Name}")
    
    # Try Create with COM objects
    print("\nTrying mods.Create(discrete_panel, create_def, 200, 200)...")
    try:
        result = mods.Create(discrete_panel, create_def, 200, 200)
        print(f"  SUCCESS! Result: {result}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
    
    # Try with integer indices
    print("\nTrying mods.Create(2, 4, 200, 200)...")  # panel 2, module def 4 = Create
    try:
        result = mods.Create(2, 4, 200, 200)
        print(f"  SUCCESS! Result: {result}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
    
    # Try with panel name and module def name
    print('\nTrying mods.Create("DiscreteProcessing", "Create", 200, 200)...')
    try:
        result = mods.Create("DiscreteProcessing", "Create", 200, 200)
        print(f"  SUCCESS! Result: {result}")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
else:
    print("Create module definition not found!")

print(f"\nFinal modules count: {mods.Count}")
if mods.Count > 0:
    for i in range(1, min(mods.Count + 1, 10)):
        m = mods.Item(i)
        print(f"  Module {i}: {m.Name} (Type: {m.Type})")

import time
time.sleep(2)

# Try using the create_def COM object more directly
print("\n=== Direct approach: Create with varargs ===")
import win32com.client.util
try:
    # Try passing as tuple/list
    result = mods.Create(*[discrete_panel, create_def, 300, 300])
    print(f"  SUCCESS: {result}")
except Exception as e:
    print(f"  FAILED: {e}")

time.sleep(2)
print(f"\nFinal modules count: {mods.Count}")

arena.Quit()
pythoncom.CoUninitialize()
print("DONE")
