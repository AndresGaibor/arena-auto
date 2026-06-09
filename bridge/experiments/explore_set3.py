"""Set Data property with correct Invoke parameter order"""
import win32com.client
import pythoncom
import time

pythoncom.CoInitialize()
arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = False
model = arena.Models.Add()
mods = model.Modules
dp = arena.Panels.Item(2)

def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

mods.Create(dp, find_def(dp, "Create"), 100, 200)
time.sleep(0.5)
m = mods.Item(1)
print(f"Module: {m.Caption}, Name: {m.Data('Name')}")

# Get the DISPID for Data
# From earlier: memid=1610743813 (0x60020005) for both get and put
DATA_DISPID = 1610743813

# Correct Invoke order: Invoke(dispid, lcid, wFlags, dispparams)
# wFlags: DISPATCH_PROPERTYPUT = 0x4
# dispparams: tuple of args (in COM reverse order: value last becomes first in rgvarg)

print("\n=== Attempt with correct argument order ===")
try:
    # dispid=DATA_DISPID, lcid=0, wFlags=0x4, dispparams=("NewName", "Name")
    result = m._oleobj_.Invoke(DATA_DISPID, 0, 0x4, ("NewName", "Name"))
    print(f"  Result: {result}")
    print(f"  Name after: {m.Data('Name')}")
except Exception as e:
    print(f"  Error: {e}")

# Try with lcid as wFlags and vice versa
print("\n=== Attempt with swapped lcid/wFlags ===")
try:
    result = m._oleobj_.Invoke(DATA_DISPID, 0x4, 0, ("NewName2", "Name"))
    print(f"  Result: {result}")
    print(f"  Name after: {m.Data('Name')}")
except Exception as e:
    print(f"  Error: {e}")


# Check entity type - can we set that?
print(f"\nEntity Type: {m.Data('Entity Type')}")
try:
    result = m._oleobj_.Invoke(DATA_DISPID, 0, 0x4, ("MyEntity", "Entity Type"))
    print(f"  Set Entity Type result: {result}")
    print(f"  Entity Type after: {m.Data('Entity Type')}")
except Exception as e:
    print(f"  Error: {e}")

# Try using pythoncom constants
print("\n=== Using pythoncom constants ===")
try:
    result = m._oleobj_.Invoke(DATA_DISPID, 0, pythoncom.DISPATCH_PROPERTYPUT, ("NewName3", "Name"))
    print(f"  Result: {result}")
    print(f"  Name after: {m.Data('Name')}")
except Exception as e:
    print(f"  Error: {e}")

# What if we need to treat Data as a method, not property?
# Maybe there's a different approach entirely
print("\n=== Check for alternative property setting methods ===")
for method_name in dir(m):
    if not method_name.startswith('_') and ('ata' in method_name.lower() or 'set' in method_name.lower() or 'put' in method_name.lower() or 'oper' in method_name.lower() or 'prop' in method_name.lower() or 'valu' in method_name.lower() or 'config' in method_name.lower() or 'param' in method_name.lower()):
        try:
            attr = getattr(m, method_name)
            is_callable = callable(attr)
            print(f"  {method_name} ({'callable' if is_callable else 'prop'})")
        except:
            print(f"  {method_name} (error)")

time.sleep(1)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
