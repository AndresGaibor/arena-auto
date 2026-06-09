"""Set Data property using correct DISPID"""
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
print(f"Module: {m.Caption}")
print(f"Name before: {m.Data('Name')}")

# DISPID for Data property
DATA_DISPID = 1610743813  # 0x60020005

# Attempt 1: Invoke with PROPERTYPUT
print("\nAttempt 1: _oleobj_.Invoke with DISPATCH_PROPERTYPUT")
try:
    result = m._oleobj_.Invoke(
        DATA_DISPID,                      # dispidMethod
        pythoncom.DISPATCH_PROPERTYPUT,   # wFlags (0x4)
        0,                                # LCID
        ("MyCreateMod", "Name")           # params: value first? or name first?
    )
    print(f"  Result: {result}")
except Exception as e:
    print(f"  Error: {e}")

print(f"Name after 1: {m.Data('Name')}")

# Attempt 2: Different param order
print("\nAttempt 2: reversed params")
try:
    result = m._oleobj_.Invoke(
        DATA_DISPID,
        pythoncom.DISPATCH_PROPERTYPUT,
        0,
        ("Name", "MyCreateMod2")
    )
    print(f"  Result: {result}")
except Exception as e:
    print(f"  Error: {e}")

print(f"Name after 2: {m.Data('Name')}")

# Attempt 3: Using DISPPARAMS
print("\nAttempt 3: with DISPPARAMS")
try:
    # In COM, DISPPARAMS.rgvarg stores arguments in reverse order
    # For Data("MyName") = "NewValue":
    # rgvarg[0] = "NewValue" (the value to set)
    # rgvarg[1] = "MyName" (the index/parameter)
    # cArgs = 2
    result = m._oleobj_.Invoke(
        DATA_DISPID,
        pythoncom.DISPATCH_PROPERTYPUT,
        0,
        ("MyCreateMod3", "Name")  # Maybe Python reverses internally?
    )
    print(f"  Result: {result}")
except Exception as e:
    print(f"  Error: {e}")

print(f"Name after 3: {m.Data('Name')}")

# Attempt 4: Just try calling with 2 args  
print("\nAttempt 4: m.Data as method with 2 args")
try:
    piped = m.Data("Name", "MyCreateMod4")
    print(f"  Result: {piped}")
except Exception as e:
    print(f"  Error: {e}")

print(f"Name after 4: {m.Data('Name')}")

# Attempt 5: Use _ApplyTypes_
print("\nAttempt 5: _ApplyTypes_")
try:
    # _ApplyTypes_(dispid, wFlags, retType, argFlags, *args)
    result = m._ApplyTypes_(
        DATA_DISPID,                      # dispid
        pythoncom.DISPATCH_PROPERTYPUT,   # wFlags
        None,                             # retType (None = void)
        None,                             # argFlags
        "MyCreateMod5", "Name"            # args
    )
    print(f"  Result: {result}")
except Exception as e:
    print(f"  Error: {e}")

print(f"Name after 5: {m.Data('Name')}")

time.sleep(1)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
