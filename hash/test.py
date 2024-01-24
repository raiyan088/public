import time
from javascript import require

Module = require('./worker_cn.js')

cn = Module.cwrap("hash_cn", "string", ["string", "number", "number", "number"])

started = time.time()*1000
hash_count = 0

while True:
    hash = cn('0808b085a49606875c0aaa63484e82f4d95e9233e71cd0df8835633bac5326f947463171e56971ffffffff392c0d7dd9eb76b7d98f2e5abb311436f54a99de9be1642ab32886dee439d168010000000000000000000000000000000000000000000000000000000000000000', 3, 2, 2154814)
    hash_count += 1
    elapsed = int(time.time()*1000 - started)
    if elapsed > 2000:
        print('Hashrate: {} H/s'.format(int(hash_count/2)))
        started = time.time()*1000
        hash_count = 0
