"""
Minimal focused Python COM exploration - step by step
"""
import win32com.client
import win32com.client.dynamic
import pythoncom
import sys
import os

pythoncom.CoInitialize()
print("Step 1: Creating Arena...")
arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = False
print(f"  Version: {arena.Version}")

print("\nStep 2: Open model...")
model = arena.Models.Open(r"C:\Users\AndresGaibor\Documents\arena\prueba.doe")
print(f"  Model: {model.Name}")

print("\nStep 3: Dir of Modules...")
try:
    mods = model.Modules
    print(f"  Modules Count: {mods.Count}")
    print(f"  Modules methods: {[m for m in dir(mods) if not m.startswith('_')]}")
    # Check if Add exists
    print(f"  Has 'Add': {'Add' in [m for m in dir(mods)]}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\nStep 4: Dir of Model...")
model_members = [m for m in dir(model) if not m.startswith('_')]
print(f"  Model methods/props ({len(model_members)}):")
for m in model_members:
    try:
        attr = getattr(model, m)
        if callable(attr):
            print(f"    method: {m}")
        else:
            val = str(attr)[:80]
            print(f"    prop:   {m} = {val}")
    except Exception as e:
        print(f"    (err):  {m} -> {e}")

print("\nStep 5: Dir of Arena.Application...")
arena_members = [m for m in dir(arena) if not m.startswith('_')]
print(f"  Arena methods/props ({len(arena_members)}):")
for m in arena_members:
    try:
        attr = getattr(arena, m)
        if callable(attr):
            print(f"    method: {m}")
        else:
            val = str(attr)[:80]
            print(f"    prop:   {m} = {val}")
    except Exception as e:
        print(f"    (err):  {m} -> {e}")

print("\nStep 6: TypeInfo enumeration...")
try:
    ti = model._oleobj_.GetTypeInfo()
    ta = ti.GetTypeAttr()
    print(f"  cFuncs: {ta.cFuncs}")
    for i in range(min(ta.cFuncs, 200)):
        try:
            fd = ti.GetFuncDesc(i)
            names = ti.GetNames(fd.memid)
            func_name = names[0] if names else "?"
            params = names[1:] if len(names) > 1 else []
            print(f"  [{i}] {func_name}({', '.join(params)})")
        except:
            pass
except Exception as e:
    print(f"  Model TypeInfo: {e}")

try:
    ti = arena._oleobj_.GetTypeInfo()
    ta = ti.GetTypeAttr()
    print(f"\n  Arena cFuncs: {ta.cFuncs}")
    for i in range(min(ta.cFuncs, 200)):
        try:
            fd = ti.GetFuncDesc(i)
            names = ti.GetNames(fd.memid)
            func_name = names[0] if names else "?"
            params = names[1:] if len(names) > 1 else []
            print(f"  [{i}] {func_name}({', '.join(params)})")
        except:
            pass
except Exception as e:
    print(f"  Arena TypeInfo: {e}")

print("\nStep 7: Try to create NEW model instead of open...")
try:
    new_model = arena.Models.Add()
    print(f"  New model created: {new_model.Name}")
    new_mods = new_model.Modules
    print(f"  New model modules Count: {new_mods.Count}")
    print(f"  New model modules methods: {[m for m in dir(new_mods) if not m.startswith('_')]}")
    # Check for Add again
    print(f"  Has Add on new: {'Add' in [m for m in dir(new_mods)]}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\nStep 8: Try Typelib on Modules...")
try:
    if mods and mods.Count > 0:
        mod = mods.Item(1)
        ti = mod._oleobj_.GetTypeInfo()
        ta = ti.GetTypeAttr()
        print(f"  Single Module: cFuncs={ta.cFuncs}")
        for i in range(min(ta.cFuncs, 50)):
            try:
                fd = ti.GetFuncDesc(i)
                names = ti.GetNames(fd.memid)
                params = names[1:] if len(names) > 1 else []
                print(f"  [{i}] {names[0]}({', '.join(params)})")
            except:
                pass
    else:
        print("  No modules to examine")
        
    # Try typeinfo on Modules collection
    ti = mods._oleobj_.GetTypeInfo()
    ta = ti.GetTypeAttr()
    print(f"\n  Modules collection: cFuncs={ta.cFuncs}")
    for i in range(min(ta.cFuncs, 50)):
        try:
            fd = ti.GetFuncDesc(i)
            names = ti.GetNames(fd.memid)
            params = names[1:] if len(names) > 1 else []
            print(f"  [{i}] {names[0]}({', '.join(params)})")
        except:
            pass
except Exception as e:
    print(f"  ERROR: {e}")

print("\nStep 9: Check Panels...")
try:
    panels = model.Panels
    print(f"  Panels Count: {panels.Count}")
    for pi in range(1, min(panels.Count + 1, 5)):
        panel = panels.Item(pi)
        print(f"  Panel {pi}: {panel.Name}")
        panel_members = [m for m in dir(panel) if not m.startswith('_')]
        print(f"    Members: {panel_members}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\nStep 10: Check View...")
try:
    view = model.View
    print(f"  View: {view}")
    view_members = [m for m in dir(view) if not m.startswith('_')]
    print(f"  View members: {view_members}")
    if hasattr(view, 'Paste'):
        print("  View.Paste EXISTS!")
        try:
            view.Paste(100, 200)
            print("  View.Paste called!")
        except Exception as e:
            print(f"  View.Paste error: {e}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\nStep 11: Cleanup...")
try:
    arena.Quit()
    print("  Arena closed")
except:
    pass
pythoncom.CoUninitialize()
print("\nDONE")
