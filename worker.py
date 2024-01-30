import sys
import time
import json
import random
import socket
import asyncio
import threading
from pythonmonkey import require

Module = require('./worker_cn.js')

async def hashLoad():
  module = await Module.LetsGo()
  return module.cwrap("letzfetz", "string", ["string", "string", "string", "number", "number", "string"])

getHash = asyncio.run(hashLoad())

time.sleep(1)

mClient = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

mJob = None

def handle_client(client):
    try:
        while True:
            line = client.makefile().readline()
            try:
                global mJob
                mJob = json.loads(line)
            except:
                continue
    except:
        sys.exit(0)


def hex2Int(data):
    res = []
    for idx in range(0, len(data), 2):
        res.append(data[idx : idx + 2])

    return int(''.join(res[::-1]), 16)

def int2hex(hex):
    data = format(hex, '02x').zfill(8)

    res = []
    for idx in range(0, len(data), 2):
        res.append(data[idx : idx + 2])

    return ''.join(res[::-1])


def targetHash(job):
    output = {
        'solved': False,
        'hash': None,
        'nonce': None
    }
    try:
        target = hex2Int(job['target'])
        hexnonce = int2hex(random.randint(0, 4294967295))
        blob = job['blob'][0:78]+hexnonce+job['blob'][86:len(job['blob'])]
        if job['algo'] == 'ghostrider':
            blob = job['blob'][0:152]+hexnonce
        seed_hash = None
        try:
            seed_hash = job['seed_hash']
        except:
            seed_hash = None
        hash = getHash(blob, job['algo'], job['targets'], job['variant'], job['height'], seed_hash)
        
        if hash != None:
            if hex2Int(hash[56:64]) < target:
                output['job_id'] = job['job_id']
                output['hash'] = hash
                output['nonce'] = hexnonce
                output['solved'] = True
    except:
        output['solved'] = False

    return output


if __name__ == "__main__":

    try:
        mClient.connect((socket.gethostname(), 9099))

        threading.Thread(target=handle_client, args=(mClient,)).start()

        while True:
            try:
                if mJob != None:
                    data = targetHash(mJob)
                    if data['solved']:
                        submit = {
                            'identifier': 'solved',
                            'job_id': data['job_id'],
                            'nonce': data['nonce'],
                            'result': data['hash']
                        }
                        mClient.sendall(str(json.dumps(submit)+'\n').encode('utf-8'))
                else:
                    time.sleep(1)
            except:
                continue
    except:
        sys.exit(0)
