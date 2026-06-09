"""Test model running and property setting with correct COM invocation"""
import win32com.client
import pythoncom
import time
import os

pythoncom.CoInitialize()
arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True  # Make visible to see what's happening

model = arena.Models.Add()
mods = model.Modules
dp = arena.Panels.Item(2)

def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

# Create modules
mods.Create(dp, find_def(dp, "Create"), 100, 200)
mods.Create(dp, find_def(dp, "Process"), 350, 200)
mods.Create(dp, find_def(dp, "Dispose"), 600, 200)
time.sleep(1)

# Print DISPIDs for Data
print("=== DISPID Analysis ===")
m = mods.Item(1)
ti = m._oleobj_.GetTypeInfo()
for i in range(ti.GetTypeAttr().cFuncs):
    fd = ti.GetFuncDesc(i)
    names = ti.GetNames(fd.memid)
    if names and names[0] == "Data":
        print(f"  Index {i}: memid={fd.memid} (0x{fd.memid:x}), invkind={fd.invkind}, params={names[1:]}")

# Also try GetIDsOfNames
names_to_ids = pythoncom.GetIDsOfNames(m._oleobj_, "Data")
print(f"  GetIDsOfNames('Data'): {names_to_ids}")

# Try to set Data via different Invoke patterns
print("\n=== Property Set Attempts ===")

# The correct way to invoke a property put with args in win32com:
from win32com.client.dynamic import _get_good_object_
from win32com.client.util import Invoke as UtilInvoke

import pythoncom

# Get DISPID for Data
# In COM, property "puts" use wFlags = DISPATCH_PROPERTYPUT (0x0004 | 0x1000 = 0x1004 for putref)
# Actually DISPATCH_PROPERTYPUT = 0x0004, DISPATCH_PROPERTYPUTREF = 0x1000

dispid_data_get = 12  # From type lib index
dispid_data_put = 13  # From type lib index

# But I need to verify these are the actual DISPIDs, not just indices
# Let me get them properly:
for i in range(ti.GetTypeAttr().cFuncs):
    fd = ti.GetFuncDesc(i)
    names = ti.GetNames(fd.memid)
    if names and names[0] == "Data":
        if fd.invkind == 1:  # INVOKE_PROPERTYGET
            dispid_data_get = fd.memid
            print(f"  Data GET: memid={fd.memid}, invkind={fd.invkind}")
        elif fd.invkind == 4:  # INVOKE_PROPERTYPUT (value is 4)
            dispid_data_put = fd.memid
            print(f"  Data PUT: memid={fd.memid}, invkind={fd.invkind}")

# Now try to set using the actual memid
print(f"\nUsing DISPIDs: GET={dispid_data_get}, PUT={dispid_data_put}")

try:
    # Try Invoke with PROPERTYPUT
    # DISPPARAMS structure: [rgvarg][cArgs][rgdispidNamedArgs][cNamedArgs]
    # For Data("Name") = "NewValue", the args are [0]="NewValue", [1]="Name"
    # In COM, rgvarg is reversed - last param first
    # So rgvarg = ["NewValue", "Name"] with cArgs=2
    result = m._oleobj_.Invoke(
        dispid_data_put,           # dispid
        pythoncom.DISPATCH_PROPERTYPUT,  # wFlags (0x0004)
        0,                         # lcid
        ("NewCreateName", "Name")  # params tuple - in COM order (reversed)
    )
    print(f"  Result: {result}")
except Exception as e:
    print(f"  Error: {e}")
    
    # Try with named args approach
    try:
        # Some COM objects need explicit named args
        # Use the Invoke with a DISPPARAMS structure
        disp_params = pythoncom.DISPPARAMS(
            ("NewCreateName", "Name"),  # rgvarg (COM order: last param first)
            (pythoncom.DISPATCH_PROPERTYPUT,),  # for property put, no named args typically
        )
        result = m._oleobj_.Invoke(
            dispid_data_put,
            pythoncom.DISPATCH_PROPERTYPUT,
            0,
            disp_params
        )
        print(f"  Result with DISPPARAMS: {result}")
    except Exception as e2:
        print(f"  DISPPARAMS error: {e2}")

# Check if it worked
print(f"\nAfter attempt: Data('Name') = {m.Data('Name')}")

# Try running model with Visible=True to see errors
print("\n=== Running Model ===")
model.BatchMode = False  # Visible mode
model.QuietMode = True

# Look for any model issues
try:
    model.Check()
    print("Model check passed")
except Exception as e:
    print(f"Model check error: {e}")

# Try running with timeout
import threading
run_ok = [False]

def runner():
    try:
        model.Go()
        run_ok[0] = True
    except Exception as e:
        print(f"Go() error: {e}")

t = threading.Thread(target=runner, daemon=True)
t.start()
t.join(15)
if t.is_alive():
    print("Go() timed out - might need interaction")
    # Try to stop
    try:
        model.End()
        print("End() called")
    except:
        pass
else:
    if run_ok[0]:
        print("Model ran OK!")
    else:
        print("Model run had errors")

time.sleep(2)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
