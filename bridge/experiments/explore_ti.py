"""Explore type libraries for Modules, Application, ModelLogic"""
import win32com.client
import pythoncom

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = False
model = arena.Models.Open(r"C:\Users\AndresGaibor\Documents\arena\prueba.doe")

def print_ti(obj, label):
    try:
        ti = obj._oleobj_.GetTypeInfo()
        ta = ti.GetTypeAttr()
        print(f"\n=== {label}: {ta.cFuncs} functions ===")
        for i in range(ta.cFuncs):
            try:
                fd = ti.GetFuncDesc(i)
                names = ti.GetNames(fd.memid)
                fn = names[0] if names else "?"
                params = ", ".join(names[1:]) if len(names) > 1 else ""
                print(f"  [{i}] {fn}({params})")
            except:
                pass
    except Exception as e:
        print(f"\n=== {label}: ERROR - {e} ===")

# 1. Modules collection
mods = model.Modules
print_ti(mods, "Modules collection")

# 2. Single module (if exists)
if mods.Count > 0:
    print_ti(mods.Item(1), "Single module")
else:
    print("\nNo modules to examine")

# 3. Arena.Application
print_ti(arena, "Arena.Application")

# 4. Models collection
models = arena.Models
print_ti(models, "Models collection")

# 5. ModelLogic
try:
    ml = model.ModelLogic
    print(f"\n=== ModelLogic object: {ml} ===")
    print(f"  Dir: {[m for m in dir(ml) if not m.startswith('_')]}")
    print_ti(ml, "ModelLogic type lib")
except Exception as e:
    print(f"\n=== ModelLogic: ERROR - {e} ===")

# 6. Check Script/Editor object if available
for prop in ["Script", "Editor", "CodeModule", "VBProject", "VBE"]:
    try:
        val = getattr(model, prop)
        print(f"\n{prop}: {val}")
        print(f"  Dir: {[m for m in dir(val) if not m.startswith('_')]}")
    except:
        print(f"\n{prop}: not available")

arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
