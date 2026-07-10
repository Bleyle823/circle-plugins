import os
import sys
from types import ModuleType

PLUGIN_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PLUGIN_ROOT not in sys.path:
    sys.path.insert(0, PLUGIN_ROOT)

# Hermes runtime stubs — tools.py imports plugins.plugin_utils.lazy_singleton
plugins_mod = ModuleType("plugins")
plugin_utils_mod = ModuleType("plugins.plugin_utils")


def lazy_singleton(fn):
    return fn


plugin_utils_mod.lazy_singleton = lazy_singleton
plugins_mod.plugin_utils = plugin_utils_mod
sys.modules["plugins"] = plugins_mod
sys.modules["plugins.plugin_utils"] = plugin_utils_mod
