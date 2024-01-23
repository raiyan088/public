import argparse
import socket
import select
import binascii
import struct
import json
import sys
import os
import time
import pyrx
from multiprocessing import Process, Queue

seed_hash = binascii.unhexlify('63eceef7919087068ac5d1b7faffa23fc90a58ad0ca89ecb224a2ef7ba282d48')

print('Start Program')
hash = pyrx.get_rx_hash('raiyan', seed_hash, 1)
print('Hash Test: {}'.format(binascii.hexlify(hash).decode()))

def pack_nonce(blob, nonce):
    b = binascii.unhexlify(blob)
    bin = struct.pack('39B', *bytearray(b[:39]))
    bin += struct.pack('I', nonce)
    bin += struct.pack('{}B'.format(len(b)-43), *bytearray(b[43:]))
    return bin


def worker(q, s):
    started = time.time()
    hash_count = 0

    while 1:
        job = q.get()
        if job.get('login_id'):
            login_id = job.get('login_id')
            print('Login ID: {}'.format(login_id))
        blob = job.get('blob')
        target = job.get('target')
        job_id = job.get('job_id')
        height = job.get('height')
        block_major = int(blob[:2], 16)
        cnv = 0
        if block_major >= 7:
            cnv = block_major - 6
        if cnv > 5:
            seed_hash = binascii.unhexlify(job.get('seed_hash'))
            print('New job with target: {}, RandomX, height: {}'.format(target, height))
        else:
            print('New job with target: {}, CNv{}, height: {}'.format(target, cnv, height))
        target = struct.unpack('I', binascii.unhexlify(target))[0]
        if target >> 32 == 0:
            target = int(0xFFFFFFFFFFFFFFFF / int(0xFFFFFFFF / target))
        nonce = 1

        while 1:
            bin = pack_nonce(blob, nonce)
            if cnv > 5:
                hash = pyrx.get_rx_hash(bin, seed_hash, height)
                hash_count += 1
                sys.stdout.write('.')
                sys.stdout.flush()
                hex_hash = binascii.hexlify(hash).decode()
                r64 = struct.unpack('Q', hash[24:])[0]
                if r64 < target:
                    elapsed = time.time() - started
                    hr = int(hash_count / elapsed)
                    print('{}Hashrate: {} H/s'.format(os.linesep, hr))
                    submit = {
                        'method':'submit',
                        'params': {
                            'id': login_id,
                            'job_id': job_id,
                            'nonce': binascii.hexlify(struct.pack('<I', nonce)).decode(),
                            'result': hex_hash
                        },
                        'id':1
                    }
                    s.sendall(str(json.dumps(submit)+'\n').encode('utf-8'))
                    select.select([s], [], [], 3)
                    if not q.empty():
                        break
                nonce += 1
            else:
                break

if __name__ == '__main__':
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.connect(('localhost', 9099))

    data = Queue()
    proc = Process(target=worker, args=(data, client))
    proc.daemon = True
    proc.start()

    print('Start Server')

    try:
        while 1:
            line = client.makefile().readline()
            read = json.loads(line)
            error = read.get('error')
            result = read.get('result')
            method = read.get('method')
            params = read.get('params')
            if error:
                continue
            if result and result.get('job'):
                login_id = result.get('id')
                job = result.get('job')
                job['login_id'] = login_id
                data.put(job)
            elif method and method == 'job' and len(login_id):
                data.put(params)
    except:
        print('Exit')
        sys.exit(0)
    
