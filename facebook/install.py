import time
from pywinauto import Desktop
from pywinauto.keyboard import send_keys

time.sleep(1)
dialog = Desktop()['MuMu Player 12']
dialog.wait('visible', timeout=120)

time.sleep(5)
send_keys('{TAB}')
send_keys('{TAB}')
send_keys('{TAB}')
time.sleep(1)
send_keys('{ENTER}')
