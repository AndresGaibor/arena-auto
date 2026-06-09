"""Minimal read/save test for created modules"""
import win32com.client
import pythoncom
import time
import os

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True

# Open the saved model
path = r"C:\Users\AndresGaibor\Documents\arena\mcp_test_model.doe"
if os.path.exists(path):
    print(f"File exists: {os.path.getsize(path)} bytes")
    model = arena.Models.Open(path)
else:
    print("File doesn't exist, creating new model")
    model = arena.Models.Add()
    # Create 3 modules
    dp = arena.Panels.Item(2)
    def find_def(p, name):
        for i in range(1, p.ModuleDefinitions.Count + 1):
            md = p.ModuleDefinitions.Item(i)
            if md.Name == name:
                return md
        return None
    
    m1 = model.Modules.Create(dp, find_def(dp, "Create"), 100, 200)
    m2 = model.Modules.Create(dp, find_def(dp, "Process"), 300, 200)
    m3 = model.Modules.Create(dp, find_def(dp, "Dispose"), 500, 200)
    time.sleep(1)
    model.SaveAs(path)
    print("Created and saved")

print(f"Modules count: {model.Modules.Count}")

for i in range(1, model.Modules.Count + 1):
    m = model.Modules.Item(i)
    print(f"\n  Module {i}:")
    print(f"    Caption: {m.Caption}")
    try:
        print(f"    Data('Name'): {m.Data('Name')}")
    except Exception as e:
        print(f"    Data('Name'): {e}")
    try:
        print(f"    Data('Type'): {m.Data('Type')}")
    except Exception as e:
        print(f"    Data('Type'): {e}")
    
    # Check connections
    try:
        print(f"    ToConnections: {m.ToConnections.Count}")
    except:
        pass
    try:
        print(f"    FromConnections: {m.FromConnections.Count}")
    except:
        pass

time.sleep(1)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
