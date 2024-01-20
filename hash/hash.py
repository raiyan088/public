import binascii
import pycryptonight

for x in range(500):
    m = "Hello RandomX {}".format(x)
    bh = pycryptonight.cn_fast_hash(b'1')
    hh = binascii.hexlify(bh).decode()
    print("Result: {}".format(hh))
