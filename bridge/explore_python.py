"""
Exhaustive exploration of Arena COM API via Python win32com
with safe timeouts to avoid hangs
"""
import sys
import os
import signal

# Timeout handler
class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("Operation timed out")

# Set timeout for signals (only works on Unix, not Windows)
# We'll use a different approach for Windows

import win32com.client
import win32com.client.dynamic
import pythoncom
import threading
import queue

def run_with_timeout(func, args=(), timeout=10):
    """Run a function with timeout"""
    result_queue = queue.Queue()
    error_queue = queue.Queue()
    
    def worker():
        try:
            result = func(*args)
            result_queue.put(result)
        except Exception as e:
            error_queue.put(e)
    
    t = threading.Thread(target=worker, daemon=True)
    t.start()
    t.join(timeout)
    
    if t.is_alive():
        raise TimeoutError(f"Operation timed out after {timeout}s")
    
    if not error_queue.empty():
        raise error_queue.get()
    
    return result_queue.get()


def safe_call(obj, attr, *args, timeout=10):
    """Safely call a COM method with timeout"""
    try:
        method = getattr(obj, attr)
        if callable(method):
            return run_with_timeout(method, args, timeout)
        return method
    except TimeoutError:
        return f"[TIMEOUT]"
    except AttributeError:
        return f"[NO ATTR]"
    except Exception as e:
        return f"[ERR: {e}]"


def safe_get(obj, attr, timeout=10):
    """Safely get a COM property with timeout"""
    return safe_call(obj, attr, timeout=timeout)


def main():
    print("Initializing COM...")
    pythoncom.CoInitialize()
    
    print("Creating Arena.Application...")
    try:
        arena = win32com.client.Dispatch("Arena.Application")
        print("OK")
    except Exception as e:
        print(f"FAILED: {e}")
        return
    
    arena.Visible = False
    print(f"Arena Version: {safe_get(arena, 'Version')}")
    
    # === PHASE 1: Explore top-level object ===
    print("\n" + "="*60)
    print("PHASE 1: Top-level Arena.Application exploration")
    print("="*60)
    
    # Try all properties we can think of
    props = [
        "ActiveModel", "Models", "Visible", "Version", "Name",
        "Capabilities", "BuildNumber", "ProductCode", "ProductName",
        "Templates", "DefaultFilePath", "EnableEvents",
        "ScreenUpdating", "DisplayAlerts", "StatusBar",
        "Interactive", "SuppressDialogs",
    ]
    
    for p in props:
        val = safe_get(arena, p, 5)
        print(f"  arena.{p} = {str(val)[:100]}")
    
    # === PHASE 2: Open a model ===
    print("\n" + "="*60)
    print("PHASE 2: Opening model")
    print("="*60)
    
    try:
        model = safe_call(arena.Models, "Open", r"C:\Users\AndresGaibor\Documents\arena\prueba.doe", 15)
        print(f"Model opened: {safe_get(model, 'Name')}")
    except Exception as e:
        print(f"Failed to open model: {e}. Trying to create new...")
        try:
            model = safe_call(arena.Models, "Add", 15)
            print(f"New model created: {safe_get(model, 'Name')}")
        except Exception as e:
            print(f"Failed to create model: {e}")
            arena.Quit()
            return
    
    # === PHASE 3: Exhaustive method discovery ===
    print("\n" + "="*60)
    print("PHASE 3: Exhaustive method discovery")
    print("="*60)
    
    objects_to_check = {
        "Model": model,
        "Arena": arena,
        "Modules": safe_get(model, "Modules", 5),
        "SIMAN": safe_get(model, "SIMAN", 5),
    }
    
    # Try to get Panels
    try:
        panels = safe_get(model, "Panels", 5)
        if panels and "[ERR" not in str(panels) and "[NO" not in str(panels):
            objects_to_check["Panels"] = panels
            for pi in range(1, min(int(safe_get(panels, "Count", 5) or 0) + 1, 10)):
                panel = safe_get(panels, "Item", pi)
                if panel:
                    objects_to_check[f"Panel_{pi}"] = panel
    except:
        pass
    
    # Try Connections
    try:
        conns = safe_get(model, "Connections", 5)
        if conns and "[ERR" not in str(conns) and "[NO" not in str(conns):
            objects_to_check["Connections"] = conns
    except:
        pass
    
    # Try View
    try:
        view = safe_get(model, "View", 5)
        if view and "[ERR" not in str(view) and "[NO" not in str(view):
            objects_to_check["View"] = view
    except:
        pass
    
    # Enumerate each object
    for name, obj in objects_to_check.items():
        print(f"\n  --- {name} ---")
        if obj is None:
            print("    None")
            continue
        
        try:
            # Get methods and properties
            members = [m for m in dir(obj) if not m.startswith('_')]
            print(f"    Members ({len(members)}):")
            
            for m in members:
                try:
                    attr = getattr(obj, m)
                    is_method = callable(attr)
                    
                    if is_method:
                        # Try to call 0-arg methods to see return value
                        print(f"      method: {m}")
                    else:
                        val_str = str(attr)[:60]
                        print(f"      prop:   {m} = {val_str}")
                except:
                    print(f"      (error): {m}")
        except Exception as e:
            print(f"    Enumeration error: {e}")
    
    # === PHASE 4: Try every conceivable module creation technique ===
    print("\n" + "="*60)
    print("PHASE 4: Module creation attempts")
    print("="*60)
    
    attempts = [
        # Direct module addition
        ("Modules.Add(Create)", lambda: safe_get(model, "Modules", 5).Add("Create", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        ("Modules.Add(PROCESS)", lambda: safe_get(model, "Modules", 5).Add("Process", 1, 300, 200) if safe_get(model, "Modules", 5) else None),
        
        # Drawing/creation methods on Model
        ("Model.AddModule", lambda: safe_call(model, "AddModule", "Create", 1, 100, 200)),
        ("Model.CreateModule", lambda: safe_call(model, "CreateModule", "Create", 1, 100, 200)),
        ("Model.DrawModule", lambda: safe_call(model, "DrawModule", "Create", 1, 100, 200)),
        ("Model.PlaceModule", lambda: safe_call(model, "PlaceModule", "Create", 1, 100, 200)),
        ("Model.InsertModule", lambda: safe_call(model, "InsertModule", "Create", 1, 100, 200)),
        ("Model.NewModule", lambda: safe_call(model, "NewModule", "Create", 1, 100, 200)),
        
        # Arena level
        ("Arena.AddModule", lambda: safe_call(arena, "AddModule", "Create", 1, 100, 200)),
        
        # Using Panels
        ("Panel.DrawModule", lambda: safe_call(safe_get(model, "Panels", 5).Item(1) if safe_get(model, "Panels", 5) and safe_get(model, "Panels", 5).Count > 0 else None, "DrawModule", "Create", 1, 100, 200) if safe_get(model, "Panels", 5) and safe_get(model, "Panels", 5).Count > 0 else "No panels"),
        ("Panel.CreateModule", lambda: safe_call(safe_get(model, "Panels", 5).Item(1) if safe_get(model, "Panels", 5) and safe_get(model, "Panels", 5).Count > 0 else None, "CreateModule", "Create", 1, 100, 200) if safe_get(model, "Panels", 5) and safe_get(model, "Panels", 5).Count > 0 else "No panels"),
        
        # Modules collection methods
        ("Modules.Create", lambda: safe_call(safe_get(model, "Modules", 5), "Create", "Create", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        ("Modules.Insert", lambda: safe_call(safe_get(model, "Modules", 5), "Insert", "Create", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        ("Modules.New", lambda: safe_call(safe_get(model, "Modules", 5), "New", "Create", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        
        # Model manipulation
        ("Model.Paste", lambda: safe_call(model, "Paste", 100, 200)),
        
        # Check specific module type addition
        ("Modules.AddCreateModule", lambda: safe_call(safe_get(model, "Modules", 5), "AddCreateModule", "Create", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        ("Modules.AddProcessModule", lambda: safe_call(safe_get(model, "Modules", 5), "AddProcessModule", "Process", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        ("Modules.AddDisposeModule", lambda: safe_call(safe_get(model, "Modules", 5), "AddDisposeModule", "Dispose", 1, 100, 200) if safe_get(model, "Modules", 5) else None),
        
        # Try various parameter combinations
        ("Modules.Add(Create,0,0,0)", lambda: safe_call(safe_get(model, "Modules", 5), "Add", "Create", 0, 0, 0) if safe_get(model, "Modules", 5) else None),
        ("Modules.Add(Create,1)", lambda: safe_call(safe_get(model, "Modules", 5), "Add", "Create", 1) if safe_get(model, "Modules", 5) else None),
        ("Modules.Add(Create)", lambda: safe_call(safe_get(model, "Modules", 5), "Add", "Create") if safe_get(model, "Modules", 5) else None),
    ]
    
    for name, attempt_fn in attempts:
        try:
            result = attempt_fn()
            print(f"  [{name}] => {str(result)[:100]}")
        except Exception as e:
            print(f"  [{name}] => EXCEPTION: {e}")
    
    # === PHASE 5: Type library exploration ===
    print("\n" + "="*60)
    print("PHASE 5: Type library / Interface exploration")
    print("="*60)
    
    try:
        # Get type info for the model
        ti = model._oleobj_.GetTypeInfo()
        ta = ti.GetTypeAttr()
        print(f"Type Kind: {ta.typekind}")
        print(f"GUID: {ta.guid}")
        print(f"Number of functions: {ta.cFuncs}")
        print(f"Number of implemented interfaces: {ta.cImplTypes}")
        
        for i in range(min(ta.cFuncs, 100)):
            try:
                fd = ti.GetFuncDesc(i)
                names = ti.GetNames(fd.memid)
                func_name = names[0] if names else "Unknown"
                params = names[1:] if len(names) > 1 else []
                print(f"  Func {i}: {func_name}({', '.join(params)})")
            except Exception as e:
                print(f"  Func {i}: ERROR - {e}")
    except Exception as e:
        print(f"  TypeInfo error: {e}")
    
    # === PHASE 6: ImportModules attempt ===
    print("\n" + "="*60)
    print("PHASE 6: ImportModules approach")
    print("="*60)
    
    # Check if ImportModules/ExportModules exist
    for method_name in ["ImportModules", "ExportModules", "Import", "Export"]:
        try:
            method = getattr(model, method_name)
            print(f"  {method_name} exists: {method}")
        except AttributeError:
            print(f"  {method_name} does not exist")
    
    # Try to create a module definition file manually
    print("\n  Trying to create model via .p file...")
    p_path = r"C:\Users\AndresGaibor\code\arena-mcp\models\test_model.p"
    
    # Check if .p file can be opened directly
    try:
        # Try opening .p file as a model
        model2 = arena.Models.Open(p_path)
        print(f"  .p file opened successfully: {model2.Name}")
    except Exception as e:
        print(f"  .p file open failed: {e}")
    
    # === PHASE 7: Cleanup ===
    print("\n" + "="*60)
    print("PHASE 7: Cleanup")
    print("="*60)
    try:
        arena.Quit()
        print("Arena closed")
    except:
        pass
    
    pythoncom.CoUninitialize()
    print("\nDone!")


if __name__ == "__main__":
    main()
