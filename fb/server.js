const puppeteer = require('puppeteer')
const twofactor = require('node-2fa')
const axios = require('axios')
const fs = require('fs')


let browser = null
let page = null
let mHeaders = {}
let mPostData = {}
let mReceive = false
let mProfilData = null
let mBgData = null

let mCookies = [
    {
        name: 'fr',
        value: '01fxe7jxJWAy91GLN.AWWQmEW520R2G7L1fPsvEeVaNtw.Bm9JX4..AAA.0.0.Bm9JYM.AWW-Ei_xOJQ',
        domain: '.facebook.com',
        path: '/',
        expires: 1795081228,
        size: 82,
        httpOnly: true,
        secure: true,
        session: false,
        sameSite: 'None',
        sameParty: false,
        sourceScheme: 'Secure',
        sourcePort: 443
    },    
    {
      name: 'c_user',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 20,
      httpOnly: false,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'm_page_voice',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 26,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'Lax',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'xs',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 47,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    },
    {
      name: 'datr',
      value: '',
      domain: '.facebook.com',
      path: '/',
      expires: 1791753442,
      size: 28,
      httpOnly: true,
      secure: true,
      session: false,
      sameSite: 'None',
      sameParty: false,
      sourceScheme: 'Secure',
      sourcePort: 443
    }
]

let mBio = JSON.parse('["Qm9ybiB0byBleHByZXNzLCBub3QgdG8gaW1wcmVzcy4=","SGkgdGhlcmUuIEkgam9pbmVkIEZhY2Vib29rLiBIYXBweSBub3c/","QWxsIEkgZG8gaXMgd2luLCB3aW4sIHdpbi4gTm8gbWF0dGVyIHdoYXQg8J+lhw==","VG9vIGRlYWQgdG8gZGllLg==","QmVsaWV2ZXIgaW4gdGhlIHBvd2VyIG9mIGtpbmRuZXNzLg==","SGFwcGluZXNzIGlzIGhvbWVtYWRlIPCfj6A=","TWFraW5nIGV2ZXJ5IGRheSBjb3VudC4=","TGVhcm5pbmcsIGdyb3dpbmcsIGFuZCBldm9sdmluZy4=","TXVzaWMgbG92ZXIsIGZvb2RpZSwgYW5kIGFkdmVudHVyZXIg4puw77iP","T24gYSBqb3VybmV5IGNhbGxlZCBsaWZlLg==","TGl2aW5nLCBsYXVnaGluZywgYW5kIGxvdmluZy4=","RHJlYW1pbmcgYmlnLCBvbmUgc3RlcCBhdCBhIHRpbWUg8J+atvCfj7s=","U2hhcmluZyBteSB0aG91Z2h0cywgb25lIHBvc3QgYXQgYSB0aW1lLg==","RW5qb3lpbmcgdGhlIHNpbXBsZSBwbGVhc3VyZXMgb2YgbGlmZS4=","Rm9sbG93aW5nIG15IGhlYXJ0IHdoZXJldmVyIGl0IGxlYWRzLg==","TGl2aW5nIG15IGJlc3QgbGlmZS4=","TGlmZeKAmXMgYSBqb3VybmV5OyBlbmpveSB0aGUgcmlkZS4=","RW1icmFjaW5nIHRoZSBjaGFvcy4=","Q29mZmVlIGFuZCBraW5kbmVzcyBlbnRodXNpYXN0IOKYlQ==","TGl2aW5nIGluIHRoZSBtb21lbnQu","RmluZGluZyBqb3kgaW4gdGhlIGxpdHRsZSBtb21lbnRzLg==","RmFtaWx5IGZpcnN0LCBhbHdheXMu","VHVybmluZyBkcmVhbXMgaW50byByZWFsaXR5IOKYge+4jw==","TGl2aW5nLCBsb3ZpbmcsIGFuZCBsZWFybmluZyDwn5OW","TWFraW5nIG1lbW9yaWVzIGFuZCBzaGFyaW5nIHNtaWxlcy4=","Q2hhc2luZyBkcmVhbXMgYW5kIGNhdGNoaW5nIGZsaWdodHMu","TGl2aW5nIGxpZmUgb25lIGRheSBhdCBhIHRpbWUu","SGF2aW5nIGEgemVzdCBmb3IgbGlmZS4=","RmluZGluZyBpbnNwaXJhdGlvbiBpbiB0aGUgb3JkaW5hcnku","U3RyaXZpbmcgZm9yIHByb2dyZXNzLCBub3QgcGVyZmVjdGlvbi4=","TWFraW5nIGxpZmUgYmVhdXRpZnVsIGluIG15IG93biB3YXku","SnVzdCB0cnlpbmcgdG8gYmUgYSBiZXR0ZXIgcGVyc29uLg==","QWR2ZW50dXJlIGlzIG91dCB0aGVyZSE=","RXhwbG9yaW5nIHRoZSBiZWF1dHkgb2YgZXZlcnlkYXkgbGlmZS4=","Q3JlYXRpbmcgbXkgb3duIHN1bnNoaW5lIOKYgO+4jw==","RmluZGluZyBqb3kgaW4gdGhlIGxpdHRsZSB0aGluZ3Mu","UG9zaXRpdmUgdmliZXMgb25seS4=","U3ByZWFkaW5nIGxvdmUgYW5kIHBvc2l0aXZpdHkg8J+MhQ==","RXhwbG9yaW5nIG5ldyBob3Jpem9ucy4=","SGFwcGluZXNzIGlzIGEgY2hvaWNlLg==","SnVzdCBiZWluZyBwcm91ZCDwn5Kr","SHVzdGxlIGFuZCBoZWFydCBzZXQgbWUgYXBhcnQu","TG9zdCBpbiB0aGUgcGFnZXMgb2YgbGlmZeKAmXMgYWR2ZW50dXJlcy4=","RXhwbG9yaW5nIHRoZSB3b3JsZCBvbmUgcG9zdCBhdCBhIHRpbWUu","SW4gYSB3b3JsZCBvZiBzcXVhcmVzLCBJ4oCZbSBqdXN0IHRyeWluZyB0byBmaXQgaW4u","RW1icmFjaW5nIHRoZSBjaGFvcyB3aXRoIGEgc21pbGUuIPCfmIo=","RXBpYyBtb21lbnRzLCB0aW55IGNhcHRpb25zLg==","VHVybmluZyBvcmRpbmFyeSBpbnRvIGV4dHJhb3JkaW5hcnku","U3Vuc2hpbmUgbWl4ZWQgd2l0aCBhIGxpdHRsZSBodXJyaWNhbmUuIOKYgO+4j/CfjKrvuI8=","TGVzcyBwZXJmZWN0aW9uLCBtb3JlIGF1dGhlbnRpY2l0eS4=","TWFraW5nIG1lbW9yaWVzIGFuZCB0YWtpbmcgbmFtZXMu","Q2hhc2luZyBkcmVhbXMgYW5kIGNhdGNoaW5nIGZsaWdodHMu","TGl2aW5nIG15IHN0b3J5LCBvbmUgcG9zdCBhdCBhIHRpbWUu","U2ltcGxpY2l0eSBpcyB0aGUgdWx0aW1hdGUgc29waGlzdGljYXRpb24u","RGFuY2luZyB0aHJvdWdoIGxpZmUg8J+Vug==","Q2FwdHVyaW5nIG1vbWVudHMg8J+Ttw==","UmVhZHkgdG8gY29ucXVlciB0aGUgd29ybGQg8J+MjQ==","R2xhbSBhbmQgZ3JhY2Ug8J+ShQ==","RmFsbCB2aWJlcyBhbGwgeWVhciDwn42C","Q29mZmVlIGNvbm5vaXNzZXVyIOKYlQ==","VGVjaCBlbnRodXNpYXN0IPCfk7E=","UmVhZHkgZm9yIHRha2VvZmYg8J+agQ==","Qmxvc3NvbWluZyBpbiBzdHlsZSDwn4y8","U2luZ2luZyBteSBoZWFydCBvdXQg8J+Otg==","TWFraW5nIG1lbW9yaWVzIOKciO+4jw==","U3RhcnJ5LWV5ZWQgZHJlYW1lciDinKg=","Rml0bmVzcyBmcmVhayDwn5Kl","RXhwbG9yaW5nIHRoZSB3b3JsZCDwn5e677iP","R2FtaW5nIGlzIG15IHdvcmxkIPCfjq8=","QmVhY2ggYnVtIGZvciBsaWZlIPCfj5bvuI8=","U3VuLWtpc3NlZCBhbmQgaGFwcHkg4piA77iP","TmlnaHQgb3dsIGJ5IGNob2ljZSDwn4yM","V29yZHMgYXJlIG15IGFydCDwn5Oc","QnVyZ2VyIGFmaWNpb25hZG8g8J+Nnw==","RmluZGluZyB6ZW4gaW4gY2hhb3Mg8J+nmOKAjeKZgu+4jw==","Q2l0eSBsaWdodHMsIGNpdHkgbGlmZSDwn4+Z77iP","Qm9va3dvcm0gYW5kIHByb3VkIPCfk5Y=","TGlmZSBpcyBhIHN0YWdlIPCfjq0=","U2hpbmluZyBpbiBteSBvd24gd2F5IPCfko4=","TGl2aW5nIGZvciB0aGUgbmlnaHRsaWZlIPCfjJk=","Rm9vZGllIGF0IGhlYXJ0IPCfjZQ=","VXJiYW4gZXhwbG9yZXIg8J+Pl++4jw==","Rmxvd2VyIGNoaWxkIGF0IGhlYXJ0IPCfjLs=","R2VlayBjaGljIPCfpJM=","UGVkYWxsaW5nIHRvIGZyZWVkb20g8J+atA==","4oCN4pmC77iPR3ltIGlzIG15IHRoZXJhcHkg8J+Pi++4j+KAjeKZgO+4jw==","TGl2aW5nIGluIGNvbG9yIPCfjqg=","4pmA77iPQ3ljbGluZyB0aHJvdWdoIGxpZmUg8J+atOKAjeKZgu+4jw==","TXVzaWMgaXMgbXkgc291bCDwn462","TmF0dXJlIGxvdmVyIPCfjLM=","Q2hhc2luZyBkcmVhbXMg4pyo","UGl6emEgbG92ZXIgZm9yIGxpZmUg8J+NlQ==","U3Vuc2V0IGNoYXNlciDwn4yF","Um9hZCB0cmlwIGVudGh1c2lhc3Qg8J+amQ==","TGl2aW5nIG15IGZhaXJ5IHRhbGUg8J+nmuKAjeKZgO+4jw==","U3ByZWFkaW5nIGxvdmUgYW5kIHBvc2l0aXZpdHkg4p2k77iP","QmVpbmcgcnVnZ2VkbHkgaGFuZHNvbWUg8J+Yjg==","Q2FyIGxvdmVyIPCfmpc=","V2lzaCBtZSBvbiAoYmlydGhkYXkpIPCfjoI=","VGhleSBzYWlkIEkgY291bGRu4oCZdCwgc28gSSBkaWQu","V2lubmluZyBpbiBsaWZlIPCfmqk=","U3R1ZGVudCDwn5OW","SW1wb3NzaWJsZSBpcyBub3QgaW4gbXkgZGljdGlvbmFyeSDinYw=","QXR0aXR1ZGUgaXMgZXZlcnl0aGluZyDwn5Kq8J+Puw==","QnVsa2luZyB1cCDwn4+L8J+Puw==","QmVpbmcgZmFidWxvdXMgaXMgYSBmdWxsLXRpbWUgam9iIOKtkA==","TG92ZXIgb2YgdGVjaCDimpnvuI8=","Rml0bmVzcyBlbnRodXNpYXN0IPCfkqrwn4+7","RXZlcnlvbmUgaGFzIHdlYWtuZXNzZXMsIGJ1dCBJ4oCZbSBub3QgZXZlcnlvbmUg8J+Yjw==","Q2FtZXJhIGxvdmVyIPCfk7g=","Q3JlYXRpbmcgbXkgb3duIHNvdW5kdHJhY2sgdG8gbGlmZSDwn462","Q29vbCBkdWRlIPCfmI4=","TG92ZXIgb2YgdHVuZXMg8J+OtQ==","TG9zdCBpbiB0aGUgYmVhdXR5IG9mIHRoZSBjb3Ntb3Mg8J+Sqw==","Q3JlYXRpbmcgb3duIHJ1bGVzIPCfj7TigI3imKDvuI8=","TXVzaWMgYWRkaWN0ZWQg8J+Opw==","TGl2aW5nIGluIGEgd29ybGQgb2YgdGVjaG5vbG9neSAmIGRyZWFtcyDimpnvuI8=","VGVjaCBlbnRodXNpYXN0IPCfkrs=","U2NpZW5jZSBnZWVrIPCfpbw=","UGFpbnRpbmcgbXkgbGlmZSB3aXRoIHZpdmlkIGNvbG91cnMg8J+OqA==","TmF0dXJlIGxvdmVyIPCfj57vuI8=","TG92ZXMgdG8gdHJhdmVsIOKciO+4jw==","Q2FwdHVyaW5nIGxpZmXigJlzIHBpeGVscyBhbmQgbW9tZW50cyDwn5a877iP","UGhvdG9ncmFwaGVyIPCfk7g=","QnVyZ2VyIGxvdmVyIG9uIGEgcXVlc3QgZm9yIHRoZSBiZXN0IPCfjZQ=","Rm9vZGllIGZvciBsaWZlIPCfmIs=","TG9zdCBpbiB0aGUgdW5pdmVyc2Ugb2YgbXkgdGhvdWdodHMg8J+SrA==","Q2xvc2Ugb2JzZXJ2ZXIg8J+klA==","SGF2aW5nIGJpZyBkcmVhbXMg8J+Mn/CfkYrwn4+7","QSBzdHVkZW50IG9mIGxpZmUsIGFsd2F5cyBsZWFybmluZyDwn5Oa","TG92ZXMgbW92aWVzIPCfk73vuI8=","Rm9vZGllIG9uIHRyYXZlbCBtb2RlIPCfjZXwn4+N77iP","R3Jvd2luZyBvbmUgZXhwZXJpZW5jZSBhdCBhIHRpbWUg4o+y77iP","Q2FwdHVyaW5nIG1vbWVudHMg8J+TuA==","QW5pbWFsIGxvdmVyIPCfkJU=","U3RhcmR1c3Qgd2l0aCBhIHNwcmlua2xlIG9mIGltYWdpbmF0aW9uIOKcqA==","TG92ZXMgbmlnaHRsaWZlIPCfjIM=","V2lzaCBtZSBvbiAoYmlydGhkYXkpIPCfjoI=","T24gdGhlIHJvYWQgdG8gc2VsZi1kaXNjb3Zlcnkg8J+bo++4jw==","V2lsbGluZyBmb3Igc29tZXRoaW5nIGRpZmZlcmVudCDwn6uk","T2JlZGllbnQgYW5kIHNpbmNlcmUg8J+Zgg==","U2lwcGlu4oCZIG9uIGluc3BpcmF0aW9uLCBvbmUgY3VwIGF0IGEgdGltZSDwn421","V3JpdGVyIOKcjfCfj7s=","Qm9vayB3b3JtIPCfk5c=","QWR2ZW50dXJpbmcgaW50byB0aGUgZ29sZGVuIGhvdXJzIOKPsw==","TGlmZeKAmXMgYW4gYWR2ZW50dXJlIPCfj5TvuI8=","QmljeWNsaXN0IPCfmrTwn4+74oCN4pmA77iP","TWFyYXRob24gcnVubmVyIPCfj4Pwn4+74oCN4pmC77iP","U2V0dGluZyByZWNvcmRzIOKMmg==","TmF0dXJlIGxvdmVyIPCfjL8=","Um93aW5nIHRocm91Z2ggdGhlIHJpdmVyIG9mIGV4aXN0ZW5jZS4=","VGhlIHdvcmxk4oCZcyBhIHN0YWdlLCBhbmQgSeKAmW0gdGhlIHBsYXllci4=","SnVkZ2UgbWUgYW5kIEnigJlsbCBwcm92ZSB5b3Ugd3Jvbmcu","VGhpcyBpcyB3aG8gSSBhbS4gTm9ib2R5IHNhaWQgeW91IGhhZCB0byBsaWtlIGl0Lg==","Rm9sbG93IG1lIGlmIHlvdSBmYW5jeSBiZWluZyBzZWNvbmQg8J+atvCfj7s=","SeKAmW0gYWZmbGljdGVkIHdpdGggQXdlc29tZS4gVGhlcmXigJlzIG5vIGN1cmluZyBpdC4=","VGhlcmUgaXMgbm8gY29tcGV0aXRpb24gYmVjYXVzZSBub2JvZHkgY2FuIGJlIG1lLg==","TXkgaGF0ZXJzIGFyZSBteSBiaWdnZXN0IG1vdGl2YXRvcnMu","Tm8gYWxhcm0gY2xvY2sgaXMgbmVlZGVkLiBNeSBwYXNzaW9uIHdha2VzIG1lIHVwLg==","QmUgZ29vZCwgZG8gZ29vZCwgbG9vayBnb29kLg==","SW5mZWN0aW91cyBsYXVnaHRlcg==","Sm9pbiBtZSBvbiB0aGlzIHJvbGxlcmNvYXN0ZXIgY2FsbGVkIGxpZmU=","QXR0aXR1ZGU6IE5vdCB5b3VyIGF2ZXJhZ2UgY3VwIG9mIGNoYWku","VW5hcG9sb2dldGljYWxseSBmYWJ1bG91cy4=","UmVhbGl0eSBpcyBiZXR0ZXIgdGhhbiB5b3VyIGRyZWFtcyDwn4yl77iP","QnJhY2UgeW91cnNlbGYgZm9yIHVuYXBvbG9nZXRpYyBob25lc3R5Lg==","QSBmaWVyY2UgYWR2b2NhdGUgZm9yIGtlZXBpbmcgaXQgcmVhbC4=","QXR0aXR1ZGUgZ2Fsb3JlLg==","SSBhbSBub3QgcGVyZmVjdCwgYnV0IEkgYW0gdW5pcXVlLg==","T25lIHNuYXJreSBjb21tZW50IGF0IGEgdGltZSDwn5Ks","S2VlcGluZyBpdCByZWFs","QXR0aXR1ZGUgSXMgRXZlcnl0aGluZy4=","RG9u4oCZdCBsaWtlIG15IGF0dGl0dWRlLCBzdGF5IGF3YXku","RG9u4oCZdCBtaW5kIGlmIEkgZmxhdW50IG15IGF0dGl0dWRlLg==","QXR0aXR1ZGUgaXMgbWFkZSBvZiBlbW90aW9ucw==","U2xheWluZyB3aXRoIGF0dGl0dWRlLg==","QXR0aXR1ZGUgb24gZGlzcGxheSwgZWZmb3J0bGVzc2x5Lg==","RWxlZ2FuY2UgbWVldHMgYXVkYWNpdHkgaGVyZSDwn5Kr","Q29uZmlkZW5jZSBpcyBteSBhY2Nlc3Nvcnku","RG9u4oCZdCBtaW5kIGlmIEkgZmxhdW50IG15IGF0dGl0dWRlLg==","S2VlcGluZyBpdCByZWFsLg==","QXR0aXR1ZGUgZ2Fsb3JlLg==","U2xheWluZyB3aXRoIGF0dGl0dWRlLg==","QXR0aXR1ZGU6IG15IGtpbmQgb2Yg8J+Gkg==","Um9ja2luZyBsaWZlIHdpdGggYXR0aXR1ZGUu","SeKAmW0gbm90IGp1c3QgYSBkcmVhbWVyOyBJ4oCZbSBhIGRvZXIu","RWxlZ2FuY2UsIHdpdGggYSB0d2lzdC4=","QXR0aXR1ZGUgb24gcG9pbnQsIGFsd2F5cyDwn5S0","VG9vIGdsYW0gdG8gZ2l2ZSBhIGRhbW4u","TGl2aW5nIGxpZmUgdW5hcG9sb2dldGljYWxseS4=","QXR0aXR1ZGUgb24gcG9pbnQsIHZpYmVzIG9uIGZpcmUu","Q29uZmlkZW5jZSBsZXZlbDogU2VsZi1tYWRlLg==","SW4gYSB3b3JsZCBmdWxsIG9mIHRyZW5kcywgSSByZW1haW4gYSBjbGFzc2ljLg==","SeKAmW0gbm90IGJvc3N5LCBJIGp1c3QgaGF2ZSBiZXR0ZXIgaWRlYXMu","RWxlZ2FuY2UgaXMgYW4gYXR0aXR1ZGUu","Q2xhc3N5IHdpdGggYSBoaW50IG9mIHNhdmFnZS4=","UXVlZW4gb2YgbXkgb3duIGNhc3RsZS4=","Rmx1ZW50IGluIHNhcmNhc20gYW5kIHNhc3Mu","Qm9zcyBiYWJlIHdpdGggYSB0b3VjaCBvZiByZWJlbC4=","RHJpcHBpbmcgaW4gZmluZXNzZSBhbmQgb296aW5nIGF0dGl0dWRlLg==","U3dhZ2dlciBzbyBicmlnaHQsIEkgbmVlZCBzaGFkZXMu","QXR0aXR1ZGUgaXMgbXkgbWlkZGxlIG5hbWUu","TGl2aW5nIG15IGxpZmUgbGlrZSBpdOKAmXMgZ29sZGVuLg==","SeKAmW0gbm90IGFudGktc29jaWFsLCBJ4oCZbSBzZWxlY3RpdmVseSBzb2NpYWwu","U2lsZW50IGJ1dCBkZWFkbHku","TXIuIFBlcmZlY3Qg8J+Yjg==","U2luZ2xlIOKYuu+4jw==","U3R1ZGVudCBPZiBDb21tZXJjZSDwn5GU","QmVsaWV2aW5nIGluIHRoZSBtYWdpYyB3aXRoaW4g8J+kqQ==","UGl6emEgbG92ZXIg8J+NlQ==","Um9sbGluZyB3aXRoIHRoZSBnYW5nIPCflKU=","VXJiYW4gc291bCB3aXRoIHJ1cmFsIGRyZWFtcyDimIHvuI8=","VG8gbWFrZSBwYXJlbnRzIHByb3VkIPCfpbk=","QmlnIGdvYWxzIHRvIGFjaGlldmUg8J+UpQ==","Rmx5aW5nIGhpZ2ggb24gZHJlYW1zIGFuZCBwb3NzaWJpbGl0aWVzIOKciO+4jw==","Q3JlYXRpbmcgYSB3b25kZXJmdWwgbGlmZSDwn5KZ","QmlnIGdvYWxzIPCfkqrwn4+7","RW1icmFjaW5nIHRoZSB3YXJtdGggb2YgcG9zaXRpdml0eSDinKg=","U3RheWluZyBwb3NpdGl2ZSBhbHdheXMg8J+Smg==","VHJhdmVsbGVyIPCfmp4=","TWlkbmlnaHQgc25hY2tlciDwn42f","TW92aWUgYnVmZiDwn46s","TWlkbmlnaHQgdGhpbmtlciwgZGF3biBkcmVhbWVyIPCfjIc=","QXV0b21vYmlsZSBsb3ZlciDwn5qX8J+Pje+4jw==","QWxsIHRoaW5ncyB0ZWNoIOKame+4jw==","Q2hhc2luZyBkcmVhbXMsIG5vdCBkZWFkbGluZXMg4pqg77iP","TmF0dXJlIGxvdmVyIPCfjLM=","R2FpbmluZyBleHBlcmllbmNlcyDwn6ST","TGlmdGluZyB3ZWlnaHRzIGFuZCBsaWZl4oCZcyBjaGFsbGVuZ2VzIPCfj4vwn4+74oCN4pmC77iP","R3ltIGZyZWFrIPCfkqrwn4+7","Rml0bmVzcyBpcyBldmVyeXRoaW5nIPCflKU=","Q2hhc2luZyBzdW5zZXRzIGFuZCBob3Jpem9ucyDwn4yH","TG9zdCBpbiB0aG91Z2h0cyDwn5Kt","TXVzaWMgbG92ZXIg8J+OtQ==","U29sdmluZyBsaWZl4oCZcyBwdXp6bGVzIPCfp6k=","RnVsbCBvZiBkcmVhbXMg4pyo","QmFsYW5jaW5nIHdvcmsgYW5kIGxpZmUg8J+SvA==","RXhwZXJ0IHByb2NyYXN0aW5hdG9yIPCfq6A=","Tm8gbGltaXRzLCBqdXN0IG9wcG9ydHVuaXRpZXMu","TG92ZSBmb3IgY2FycywgYnVybmluZyBydWJiZXIgb24gdGhlIHRyYWNrIPCfmpc=","SGl0dGluZyBsaWZl4oCZcyBjdXJ2ZWJhbGxzIHdpdGggc3R5bGUu","VGhyaXZpbmcgaW4gdGhlIGZhc3QgbGFuZSBvZiBsaWZlLg==","Qm9ybiBmb3IgdGhlIG91dGRvb3JzLCB0aHJpdmluZyBpbiBuYXR1cmUu","QmVhcmQgZ2FtZSBzdHJvbmcsIGhlYXJ0IGV2ZW4gc3Ryb25nZXIg8J+nlPCfj7vigI3imYLvuI8=","U3BvcnRzIGZhbmF0aWMgYW5kIHByb3VkIG9mIGl0Lg==","V2luZSBhbmQgZGluZSBjb25ub2lzc2V1ciDwn423","VGVjaCB3aGl6IHdpdGggYSBwYXNzaW9uIGZvciBpbm5vdmF0aW9uLg==","Rml0bmVzcyBpcyBteSBsaWZlc3R5bGUsIG5vdCBhIHBoYXNlLg==","Qm9ybiB0byBleHBsb3JlLCBkZXN0aW5lZCB0byB3YW5kZXIu","Q2hhc2luZyBkcmVhbXMgYW5kIHNjb3JpbmcgZ29hbHMu","U2t5ZGl2ZXIsIHRha2luZyBsaWZlIHRvIG5ldyBoZWlnaHRzLg==","RElZIGVudGh1c2lhc3QsIGNyYWZ0aW5nIG15IGRlc3Rpbnkg8J+bo++4jw==","TWFraW5nIGhpc3RvcnksIG9uZSBkYXkgYXQgYSB0aW1lLg==","RW1icmFjaW5nIGNoYW9zIGFuZCB0dXJuaW5nIGl0IGludG8gYXJ0Lg==","Q29mZmVlIGluIG9uZSBoYW5kLCBjb25maWRlbmNlIGluIHRoZSBvdGhlci4=","RGV0ZXJtaW5hdGlvbiBpcyBteSBzdXBlcnBvd2VyLg==","RW5naW5lZXIgYnkgZGF5LCBnYW1lciBieSBuaWdodC4=","SHVtYmxlIGJlZ2lubmluZ3MsIGJpZyBhbWJpdGlvbnMu","TmF0dXJlIGVudGh1c2lhc3QsIGNhbXBpbmcgdW5kZXIgdGhlIHN0YXJzIPCfjJ8=","SGVyZSB0byBtYWtlIG1lbW9yaWVzLCBub3QgZXhjdXNlcy4=","QWR2ZW50dXJlIHNlZWtlciBvbiBhIGNvbnN0YW50IHF1ZXN0Lg==","RmFzaGlvbi1mb3J3YXJkIHdpdGggYSBkYXNoIG9mIHN3YWcg8J+Mnw==","TmlnaHQgb3dsLCBidXJuaW5nIHRoZSBtaWRuaWdodCBvaWwu","TW90b3JjeWNsZSByaWRlciwgcm9hZCB3YXJyaW9yLg==","R2FtZSBvbiwgd29ybGQhIPCfjq4=","Tm90IGp1c3QgYSBnYW1lciwgYSBnYW1lLWNoYW5nZXIu","TGl2aW5nIHRoZSBkcmVhbSwgbm90IGp1c3QgZHJlYW1pbmcu","TXVzaWMgbG92ZXIgd2l0aCBhIHJvY2sg4oCYbuKAmSByb2xsIHNvdWwu","Rm9vZGllIGV4cGxvcmVyLCB0YXN0aW5nIG15IHdheSBhcm91bmQu","U2NpZW5jZSBnZWVrIGJ5IGRheSwgc3VwZXJoZXJvIGJ5IG5pZ2h0Lg==","Rml0bmVzcyBmcmVhaywgZ3ltIGlzIG15IHBsYXlncm91bmQg8J+SqvCfj7vwn4+L77iP4oCN4pmC77iP","QkJRIG1hc3RlciBhbmQgZ3JpbGwgZ3VydS4=","QWN0aW9uIHNwZWFrcyBsb3VkZXIgdGhhbiB3b3Jkcy4=","RmFtaWx5IGZpcnN0LCBhbHdheXMgYW5kIGZvcmV2ZXIu","MTAwJSBnZW50bGVtYW4sIDAlIGRyYW1hLg==","QXJ0aXN0aWMgc291bCwgY3JlYXRpbmcgbXkgb3duIG1hc3RlcnBpZWNlIPCflrzvuI8=","S25vd2xlZGdlIGlzIHBvd2VyLCBib29rcyBhcmUgbXkgYWxsaWVzLg==","VGVjaCBhbmQgdHJhdmVsLCBteSB1bHRpbWF0ZSBjb21iby4=","TGl2aW5nIGxpZmUgb25lIHRocmlsbCBhdCBhIHRpbWUu","RnVlbGVkIGJ5IHBhc3Npb24gYW5kIGNhZmZlaW5lIOKYlQ==","RHJpdmluZyBpbm5vdmF0aW9uIGZvcndhcmQu","Q3JlYXRpbmcgbGlmZSBvbiBteSB0ZXJtcy4=","RGVkaWNhdGVkIHRvIHJlbGVudGxlc3MgcHJvZ3Jlc3Mg8J+PgQ==","RW1wb3dlcmluZyBjaGFuZ2UtbWFrZXJzLg==","V2hlcmUgdmlzaW9uYXJpZXMgdW5pdGUu","SW5zcGlyaW5nIHdpdGggaW50ZW50Lg==","TmF2aWdhdGluZyB1bmNoYXJ0ZWQgcGF0aHMu","RWxldmF0aW5nIHRoZSBzdGF0dXMgcXVvLg==","Q2hhbXBpb25pbmcgY2hhbmdlIOKcqA==","QnJpZGdpbmcgZHJlYW1zIGFuZCByZWFsaXR5Lg==","Q3JlYXRpbmcgd2F2ZXMgb2YgaW5zcGlyYXRpb24u","TGl2aW5nIHRoZSBsZWdhY3kgSeKAmW0gYnVpbGRpbmcu","TGl2aW5nIGEgbGlmZSB1bmJvdW5kZWQu","U2hhcGluZyB0b21vcnJvd+KAmXMgbmFycmF0aXZlIPCfl6PvuI8=","RGVzaWduaW5nIG15IG93biBzdWNjZXNzIHN0b3J5Lg==","SW5mbHVlbmNpbmcgd2l0aCBldmVyeSBwb3N0Lg==","T24gYSBtaXNzaW9uIHRvIHNwYXJrIGNoYW5nZS4=","QW1iaXRpb24gbWVldHMgZGV0ZXJtaW5hdGlvbi4=","U3RyaXZpbmcgZm9yIGV4Y2VsbGVuY2UgZGFpbHkg8J+MhQ==","U2NyaXB0aW5nIG15IG93biBzdWNjZXNzLg==","TWFzdGVyaW5nIHRoZSBhcnQgb2YgaW5mbHVlbmNlLg==","Q3JhZnRpbmcgYSB2aXNpb25hcnkgZnV0dXJlLg==","QXJjaGl0ZWN0IG9mIHRvbW9ycm934oCZcyBsZWdhY3kg8J+MhA==","RGVmeWluZyBsaW1pdHMgZGFpbHku","TGl2aW5nIGEgbGVnYWN5IGluIHByb2dyZXNzLg==","UGlvbmVlcmluZyB0aGUgbmV4dCB3YXZlLg==","SW5zcGlyaW5nIGdsb2JhbCBjb25uZWN0aW9ucy4=","QmVoaW5kLXRoZS1zY2VuZXMgc3RyYXRlZ2lzdCDwn5OP","QXJjaGl0ZWN0IG9mIGluZmx1ZW5jZS4=","TGl2aW5nIGxpZmUgaW4gaGlnaC1kZWYu","RHJlYW0uIEJlbGlldmUuIEFjaGlldmUu","RWxldmF0aW5nIGV2ZXJ5IGV4cGVyaWVuY2Uu","QWltaW5nIGZvciBleHRyYW9yZGluYXJ5IGhlaWdodHMg8J+UnQ==","RGV0ZXJtaW5lZCB0byBtYWtlIGEgbWFyay4=","VHJhbnNmb3JtaW5nIGlkZWFzIGludG8gcmVhbGl0aWVzLg==","RnVlbGluZyBteSBqb3VybmV5IHdpdGggZHJlYW1zLg==","VG9nZXRoZXIsIHdl4oCZcmUgdW5zdG9wcGFibGUu","TG92ZSBpcyBteSBzdXBlcnBvd2VyLiDinaTvuI8=","U3ByZWFkaW5nIGxvdmUsIG9uZSBzbWlsZSBhdCBhIHRpbWUuIPCfmIo=","WW91IG1ha2UgbXkgaGVhcnQgYmVhdCBmYXN0ZXIu","QWxsIHlvdSBuZWVkIGlzIGxvdmUuIPCfjrY=","QmVpbmcgd2l0aCB5b3UgbWFrZXMgbWUgaGFwcHk=","TG92ZSBjb25xdWVycyBhbGwg8J+Phg==","WW91IGFuZCBtZSwgYWx3YXlzLg==","TG92ZSBpcyBpbiB0aGUgYWlyLg==","SW4gbG92ZSB3aXRoIGxpZmXigJlzIGxpdHRsZSBtb21lbnRzLiDwn4yf","T3VyIGxvdmUgc3RvcnkgaXMgZm9yZXZlci4=","TG92ZSBoYXMgZm91bmQgdXMu","TXkgaGVhcnQgYmVhdHMgZm9yIHlvdS4=","VG9nZXRoZXIgaXMgb3VyIGhhcHB5IHBsYWNlLg==","UXVpZXRseSBpbiBsb3ZlLg==","TG92ZSwgbGF1Z2gsIGxpdmUuIOKcqA==","VGhlIHBlcmZlY3QgcGFydG5lci4=","TG92ZSB0aGF0IGtpbGxzLg==","Q3JhenkgYWJvdXQgZWFjaCBvdGhlci4=","WW91IG1ha2UgdGltZSBzdGFuZCBzdGlsbC4=","RXhwbG9yaW5nIGxpZmUgaGFuZCBpbiBoYW5kIPCfpJ0=","VHdvIGhlYXJ0cywgb25lIGpvdXJuZXku","TXkgbG92ZSBmb3IgeW91IHdpbGwgbmV2ZXIgZGllLg==","TG92ZSBwZXJmZWN0ZWQg8J+SnA==","THVja3kgaW4gbG92ZS4=","TXkgaGVhcnQgYmVhdHMgZm9yIHlvdS4=","U28gbWFueSBvZiBteSBzbWlsZXMgYmVnaW4gd2l0aCB5b3Uu","SSBjYW7igJl0IHRoaW5rIG9mIGFueW9uZSBidXQgeW91Lg==","UGFydG5lcnMgaW4gY3JpbWUgYW5kIHBhcnRuZXJzIGluIGxpZmUu","TG92ZSBpcyB0aGUgb25seSBjdXJyZW5jeSBJIGRlYWwgaW4g8J+SsA==","WW91IGFuZCBtZSwgdHJ1ZSBsb3ZlIGZvcmV2ZXIu","SW4gYSB3b3JsZCBvZiBwb3NzaWJpbGl0aWVzLCBJIGNob29zZSB5b3Uu","VGltZSBzdGFuZHMgc3RpbGwgd2hlbiBJIGFtIHdpdGggeW91Lg==","TG92ZSBpcyB0aGUgYW5zd2VyIPCfkqs=","QWxsIEkgY2FuIHRoaW5rIG9mIGlzIHlvdS4=","SGVhZCBvdmVyIGhlZWxzIGluIGxvdmUu","TXkgZm9yZXZlciBWYWxlbnRpbmUu","TXkgb25lIGFuZCBvbmx5Lg==","SGVhcnQgZnVsbCBvZiBsb3ZlLCBhbHdheXMg8J+Slg==","WW91IGFyZSB0cnVseSBteSBzb3VsbWF0ZS4=","SGFwcGlseSBpbiBsb3ZlLg==","RmxpcnRpbmcgY29tZXMgbmF0dXJhbGx5Lg==","TG92ZSBtYWtlcyBsaWZlIGJlYXV0aWZ1bCDwn4y5","UGFzc2lvbmF0ZSBsb3ZlLg==","U291bG1hdGVzIGZvciBsaWZlLg==","TG92ZSBtYWtlcyBsaWZlIGEgZmFpcnkgdGFsZSDwn5OW","VGVjaCwgQ29kZSwgQ3JlYXRlIPCfkajwn4+74oCN8J+Suw==","VHJhdmVsLCBFeHBsb3JlLCBSZXBlYXQu","V29yayBIYXJkLCBQbGF5IEhhcmQu","RHJlYW0sIEJlbGlldmUsIEFjaGlldmUu","TmF0dXJl4oCZcyBCZWF1dHkgRXZlcnl3aGVyZSDwn4+e77iP","UG9zaXRpdmUgVmliZXMgT25seS4=","RmFpdGgsIEhvcGUsIENvdXJhZ2Uu","Sm95LCBQZWFjZSwgU2VyZW5pdHku","QWR2ZW50dXJlIEF3YWl0cyBZb3Uu","UG9ldHJ5LCBBcnQsIEltYWdpbmF0aW9uIPCfjq0=","RXhwbG9yZSwgRGlzY292ZXIsIEdyb3cu","Qm9sZCwgQmVhdXRpZnVsLCBCcmlsbGlhbnQu","Rm9vZCwgRnJpZW5kcywgRnVuLg==","U2VlaywgTGVhcm4sIFN1Y2NlZWQg8J+SqvCfj7s=","TGF1Z2ggT2Z0ZW4sIExvdmUgRGVlcGx5Lg==","TGl2aW5nLCBMYXVnaGluZywgTG92aW5nLg==","RmFzaGlvbiwgU3R5bGUsIEVsZWdhbmNlLg==","TGl2aW5nLCBMb3ZpbmcsIExlYXJuaW5nIPCflLA=","U21pbGUsIFNwYXJrbGUsIFNoaW5lLg==","UG9zaXRpdml0eSBSdWxlcyBIZXJlLg==","RGFuY2UsIEV4cHJlc3MsIFRocml2ZS4=","Rm9vZGllIGF0IEhlYXJ0Lg==","RHJlYW0gQmlnIERyZWFtcy4=","Rm9yZXZlciBZb3VuZyBTb3VsIPCfjLE=","Qm9vayBMb3ZlciBGb3JldmVyLg==","TXVzaWMsIE1hZ2ljLCBNZW1vcmllcy4=","Rml0bmVzcywgRnVuLCBGcmVlZG9tLg==","SW5zcGlyZSwgRW1wb3dlciwgSW1wYWN0Lg==","QXJ0aXN0IGJ5IFBhc3Npb24g8J+WjO+4jw==","SGlraW5nLCBDYW1waW5nLCBBZHZlbnR1cmluZy4=","Q3JlYXRpbmcsIEluc3BpcmluZywgU2hhcmluZy4=","QmVhdXR5LCBCcmFpbnMsIEdyYWNlLg==","SG9wZSwgRmFpdGgsIExvdmUu","UG9ldHJ5IGluIE1vdGlvbiDwn5ej77iP","RHJlYW1lciwgQWNoaWV2ZXIsIEJlbGlldmVyLg==","Qm9sZCBhbmQgRmVhcmxlc3Mu","Q29mZmVlLCBCb29rcywgQmxpc3Mu","TGlmZSBpcyBCZWF1dGlmdWwu","TWluZGZ1bCwgR3JhdGVmdWwsIEhhcHB5Lg==","RmFtaWx5LCBMb3ZlLCBIb21lIPCfj6E=","RmFzaGlvbmlzdGEsIFRyZW5kc2V0dGVyLCBJY29uLg==","RWxlZ2FuY2UgaW4gZXZlcnkgYXNwZWN0","U3R5bGUgaXMgbXkgc2lnbmF0dXJl","RmFzaGlvbi1mb3J3YXJkIGFuZCBuZXZlciBsb29raW5nIGJhY2s=","RXhwbG9yaW5nIHRoZSBhcnQgb2YgZmFzaGlvbg==","Q2hpYyBhbmQgdW5pcXVl","QWNjaWRlbnRhbCBzdHlsZSBpY29uIA==","RmFzaGlvbiBpcyBteSBwYXNzaW9u","QWx3YXlzIGluIHZvZ3Vl","QmxlbmRpbmcgZmFzaGlvbiBhbmQgZnVuY3Rpb24=","RWxlZ2FuY2U6IHJlZGVmaW5lZA==","U3R5bGUgdGhhdCBzcGVha3Mgdm9sdW1lcw==","TWFraW5nIHN0YXRlbWVudHMgd2l0aCBzdHlsZQ==","RmFzaGlvbiBpcyBhcnQsIGFuZCBJ4oCZbSB0aGUgY2FudmFz","TGl2aW5nIG15IGJlc3QgZmFzaGlvbiBsaWZl","RHJlc3NpbmcgbGlrZSBJ4oCZbSBhbHJlYWR5IGZhbW91cw==","RmFzaGlvbiBpcyBteSBsb3ZlIGxhbmd1YWdl","TXkgc3R5bGUgaXMgbXkgc3Rvcnk=","RmFzaGlvbiBpcyBmbGVldGluZy4gU3R5bGUgaXMgZXRlcm5hbA==","U3R5bGlzaCBieSBuYXR1cmUsIGNvbmZpZGVudCBieSBjaG9pY2U=","U3R5bGUgaXMgd2hhdCBJIHdlYXIgYW5kIGhvdyBJIGxpdmU=","Q29vbGVyIHRoYW4gdGhlIG9wcG9zaXRlIHNpZGUgb2YgdGhlIHBpbGxvdw==","SnVzdCBjaGlsbGlu4oCZIGxpa2UgYSB2aWxsYWlu","S2VlcGlu4oCZIGl0IHJlYWwgMjUvOA==","VG9vIHNjaG9vbCBmb3IgY29vbA==","TGl2aW5nIGxpZmUgb24gbXkgdGVybXM=","R29vZCB2aWJlcyBvbmx5","Vm90ZWQgbnVtYmVyIDEgc21vb3RoZXN0IG9wZXJhdG9y","TGlmZeKAmXMgdG9vIHNob3J0IHRvIGJlIGFueXRoaW5nIGJ1dCByYWQ=","SGVsbCB5ZWFoLCBkdWRl","Qm9ybiB0byBiZSBtaWxk","SnVzdCBhIHJlZ3VsYXIgZHVkZQ==","Q29vbCBhcyBhIGN1Y3VtYmVy","S2VlcGluZyBpdCBjb29sIHNpbmNlIGRheSBvbmU=","R3Jvb3Z5LCBiYWJ5","Q2hpbGwgdmliZXMgYW5kIGdvb2QgdGltZXM=","RG9u4oCZdCBiZSBtYWQgSeKAmW0gc28gcmFk","TXkgTW9tIHNheXMgSeKAmW0gY29vbA==","SW4gaXQgZm9yIHRoZSByaWRlIA==","SnVzdCB2aWJpbuKAmQ==","QWx3YXlzIGNvb2w=","U2Vla2luZyBhZHZlbnR1cmUgYWx3YXlzISA=","SnVzdCBhbiBhdmVyYWdlIGd1eSB3aXRoIGJpZyBkcmVhbXM=","W0hPQkJZXSBmYW5hdGljIGFuZCBbUEFTU0lPTl0gZW50aHVzaWFzdA==","TGl2aW5nIGxpZmUgb25lIGdhbWUgYXQgYSB0aW1l","QWx3YXlzIGRvd24gZm9yIGEgY2hhbGxlbmdl","SnVzdCBhIGd1eSB3aG8gbG92ZXMgaGlzIFtIT0JCWV0=","TWFraW5nIG1lbW9yaWVzIGV2ZXJ5IGRheQ==","WW91IGNhbuKAmXQgcGF1c2UgYW4gb25saW5lIGdhbWUsIE1vbQ==","U2VsZi1jb25mZXNzZWQgW0hPQkJZXSBmYW5hdGlj","T24gYSBtaXNzaW9uIHRvIGNvbnF1ZXI=","TGlmZeKAmXMgYSBqb3VybmV5LCBlbmpveSB0aGUgcmlkZQ==","SnVzdCBhIHJlZ3VsYXIgZ3V5","QWx3YXlzIGN1cmlvdXM=","Qm9ybiB0byBiZSB3aWxk","SnVzdCBoZXJlIHRvIGhhdmUgZnVu","RHJlYW0gc21hbGwsIHdvcmsgbGVzcw==","W0hPQkJZXSBnZWVrIGtlZXBpbmcgaXQgcmVhbC4=","T25lIG9mIHRoZSBib3lzLg==","SWYgeW91IGRvbuKAmXQgYWxyZWFkeSBrbm93IG1lLCBJIGZlZWwgYmFkIGZvciB5b3Uh","S2luZyBlbmVyZ3k=","TGl2aW5nIGxpZmUgd2l0aCBhIHNtaWxl","SnVzdCBhIGdpcmwgd2l0aCBiaWcgZHJlYW1z","TWFraW5nIG1lbW9yaWVzIG9uZSBkYXkgYXQgYSB0aW1l","W0hPQkJZXSBpcyBteSBlc2NhcGUg","TG92ZXIgb2YgYWxsIHRoaW5ncyBiZWF1dGlmdWw=","SnVzdCBhIGdpcmwgd2hvIGxvdmVzIGhlciBsaWZl","RHJlYW0gYmlnLCBzcGFya2xlIG1vcmU=","TGlmZeKAmXMgdG9vIHNob3J0IHRvIHdlYXIgYm9yaW5nIFtJVEVNIE9GIENMT1RISU5HXQ==","W0hPQkJZXSBvYnNlc3NlZCBnYWwhIA==","SnVzdCBhIHJlZ3VsYXIgZ2lybA==","UHJvdWQgdG8gYWx3YXlzIGJlIG1l","Qm9ybiB0byBzaGluZQ==","TWFraW5nIHRoZSBtb3N0IG9mIGV2ZXJ5IG1vbWVudA==","R2lybCBwb3dlciEg","SnVzdCBoZXJlIHRvIHNwcmVhZCBsb3Zl","U2xheWluZyB0aGUgZGF5IGV2ZXJ5IGRheQ==","TG9zdCBpbiB0aGUgcGFnZXMgb2YgbGlmZeKAmXMgYWR2ZW50dXJlcw==","W0hPQkJZIGUuZy4gYXJ0aXN0XSBieSBoZWFydCA=","RG9pbmcgZXZlcnl0aGluZyB3aXRoIGdyYWNlIGFuZCBodW1vcg==","UXVlZW4gZW5lcmd5","Qm9ybiB0byBzdGFuZCBvdXQ=","S25lZWwgZm9yIG5vYm9keQ==","T25seSBnb2QgY2FuIGp1ZGdlIG1l","Tm8gYXBvbG9naWVzIGdpdmVu","VG9vIGdsYW0gdG8gZ2l2ZSBhIGRhbW4=","VW5hcG9sb2dldGljYWxseSBtZQ==","Q29uZmlkZW5jZSBpcyBteSBiZXN0IGFjY2Vzc29yeQ==","TmV2ZXIgdW5kZXJlc3RpbWF0ZSBtZQ==","TGl2aW5nIGxpZmUgb24gbXkgdGVybXM=","RmFidWxvdXMgYW5kIGZpZXJjZQ==","Tm8gdGltZSBmb3Igbm9uc2Vuc2U=","VW5zdG9wcGFibGUgZm9yY2U=","TXkgd2F5IG9yIHRoZSBoaWdod2F5","Qm9sZCBhbmQgYmVhdXRpZnVs","V2F0Y2ggbWUgc2hpbmU=","RW1icmFjZSB0aGUgYXR0aXR1ZGU=","Tm8gZ3V0cywgbm8gZ2xvcnk=","RmVhcmxlc3MgYW5kIGZyZWU=","S2VlcGluZyBteSBoZWFkIGhpZ2g=","QXR0aXR1ZGUgaXMgZXZlcnl0aGluZw==","TGl2aW5nIGxpZmU=","SnVzdCBtZQ==","RHJlYW0gYmln","Q2FycGUgZGllbQ==","Rm9yZXZlciBzbWlsaW5n","TGlmZeKAmXMgZ29vZA==","U2ltcGx5IGhhcHB5","TWFraW5nIG1lbW9yaWVz","U3RheWluZyBwb3NpdGl2ZQ==","TGlmZeKAmXMgYSBqb3VybmV5","S2VlcGluZyBpdCByZWFs","TGl2ZSwgbGF1Z2gsIGxvdmU=","Rm9yZXZlciBjdXJpb3Vz","SnVzdCBoYXZpbmcgZnVu","RW5qb3lpbmcgdGhlIHJpZGU=","S2VlcCBzbWlsaW5n","TGl2aW5nIHRoZSBkcmVhbQ==","QWx3YXlzIGxlYXJuaW5n","TG92aW5nIGxpZmU=","RHJlYW1lciAmIGRvZXI=","U3dhZyBtb2RlOiBvbg==","MiBjb29sIDQgdQ==","T24gbXkgZ3JpbmRzZXQ=","SnVzdCBhIGJvc3M=","U3dhZ2dlcmlmaWM=","Qm9ybiB0byBydWxl","U3dhZyBpbiBteSB2ZWlucw==","VG9vIGxlZ2l0IHRvIHF1aXQ=","TGl2aW5nIGxpZmUgbGFyZ2U=","U3dhZyBvdmVybG9hZA==","RHJpcHBpbuKAmSBub3QgdHJpcHBpbuKAmQ==","S2VlcGlu4oCZIGl0IHJlYWw=","U3dhZyBpcyBteSBzdHlsZQ==","TGl2aW5nIGxpZmUgd2l0aCBzd2Fn","VG9vIGZseSB0byBkaWU=","U3dhZyBvbiBwb2ludA==","Q29vbG5lc3MgZGVmaW5lZA==","Qm9ybiB0byBiZSBzd2FnZ3k=","VW5mYXRob21hYmxlIHJpeno=","U3dhZ2dlciBzbyBicmlnaHQsIHlvdeKAmWxsIG5lZWQgc2hhZGVz","UHJvZmVzc2lvbmFsIG5hcHBlcg==","SeKAmW0gbm90IGxhenksIGp1c3QgZW5lcmd5LWVmZmljaWVudA==","TGlmZSBpcyBzaG9ydCwgc21pbGUgd2hpbGUgeW91IHN0aWxsIGhhdmUgdGVldGg=","Qm9ybiB0byBiZSBhd2Vzb21lLCBmb3JjZWQgdG8gZG8gZGlzaGVz","SeKAmW0gb24gYSBzZWFmb29kIGRpZXQuIEkgc2VlIGZvb2QgYW5kIGVhdCBpdA==","SnVzdCBhbm90aGVyIHBhcGVyLWN1dCBzdXJ2aXZvcg==","SeKAmW0gbm90IHdlaXJkLCBJ4oCZbSBhIGxpbWl0ZWQtZWRpdGlvbg==","SeKAmW0gbm90IHNtYWxsLCBJ4oCZbSBmdW4tc2l6ZWQ=","U3RvcCBtYWtpbmcgbWUgYWR1bHQ=","VGhlIHdvcmxk4oCZcyBva2F5ZXN0IHBlcnNvbg==","UnVubmluZyBvbiBzYXJjYXNtIGFuZCBjYWZmZWluZQ==","UGFydC10aW1lIHN1cGVyaGVybw==","RnVsbC10aW1lIGZ1biBzZWVrZXI=","TGlmZeKAmXMgdG9vIHNob3J0IHRvIGJlIHNlcmlvdXM=","SXTigJlzIG5vdCBhcmd1aW5nLCBJdOKAmXMgZXhwbGFpbmluZyB3aHkgSeKAmW0gcmlnaHQ=","U3R1bWJsaW5nIG15IHdheSB0aHJvdWdoIGxpZmU=","UHJvZmVzc2lvbmFsIHByb2NyYXN0aW5hdG9yLiBXaWxsIHdyaXRlIGEgYmlvIGxhdGVy","UGFydC10aW1lIHN1cGVyaGVybw==","SeKAmW0gbm90IG9sZCwgSeKAmW0gdmludGFnZQ==","T24gYSBtaXNzaW9uIHRvIHBldCBldmVyeSBkb2cgaW4gdGhlIHdvcmxk"]')

let BASE_URL = decode('aHR0cHM6Ly9qb2Itc2VydmVyLTA4OC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vcmFpeWFuMDg4Lw==')
let STORAGE = decode('aHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9qb2Itc2VydmVyLTA4OC5hcHBzcG90LmNvbS9vL3Bob3RvJTJG')


browserStart()


async function browserStart() {

    while (true) {
        let user = await waitForNewUser()
        if (user) {
            await delay(3000)
        } else {
            await delay(30000)
        }
    }
}

async function waitForNewUser() {

    try {
        let response = await axios.get(BASE_URL+'facebook/account.json?orderBy=%22$key%22&limitToFirst=1')

        let data = response.data

        if (data) {
            let key = Object.keys(data)[0]

            let valid = await fbIdValied(key)

            console.log(key, valid)

            if (valid) {
                let cookie = JSON.parse(data[key]['cookies'])
                
                for (let i = 0; i < mCookies.length; i++) {
                    if(mCookies[i]['name'] == 'c_user') {
                        mCookies[i]['value'] = cookie['c_user']
                    } else if(mCookies[i]['name'] == 'datr') {
                        mCookies[i]['value'] = cookie['datr']
                    } else if(mCookies[i]['name'] == 'xs') {
                        mCookies[i]['value'] = encodeURIComponent(cookie['xs'])
                    } else if(mCookies[i]['name'] == 'm_page_voice') {
                        mCookies[i]['value'] = cookie['c_user']
                    }
                }

                try {
                    browser = await puppeteer.launch({
                        headless: false,
                        headless: 'new',
                        args: [
                            '--no-sandbox',
                            '--disable-notifications',
                            '--disable-setuid-sandbox',
                            '--ignore-certificate-errors',
                            '--ignore-certificate-errors-skip-list',
                            '--disable-dev-shm-usage'
                        ]
                    })
                
                    page = (await browser.pages())[0]
            
                    page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())
                    
                    await page.setCookie(...mCookies)

                    await setupAll(key, data[key], cookie['c_user'])
                } catch (error) {}

                try {
                    if (page != null) {
                        await page.close()
                        page = null
                    }
                } catch (error) {}

                try {
                    if (browser != null) {
                        await browser.close()
                        browser = null
                    }
                } catch (error) {}
            } else {
                try {
                    let response = await axios.get('https://fb-server-088.onrender.com/block?block='+data[key]['key']+'&type=1')
                    await axios.delete(BASE_URL+'facebook/account/'+key+'.json')
                    console.log('Delete: '+response.data)
                } catch (error) {
                    console.log('Delete: Error')
                }
            }

            return true
        }
    } catch (e) {
        console.log(e)
        await delay(1000000)
    }

    return false
}


async function setupAll(key, data, user) {
    if (!fs.existsSync('upload')) {
        fs.mkdirSync('upload')
    }

    // let profile = true
    // let bio = true
    // let cover = true
    // let mode = true

    let profile = await uploadProfilePic(data)

    console.log(profile ? 'Profile Pic Upload: Success' : 'Profile Pic Upload: Error')

    let bio = await addProfileBio()

    console.log(bio ? 'Bio Upload: Success' : 'Bio Upload: Error')

    let cover = await uploadCoverPicture()

    console.log(cover ? 'Cover Pic Upload: Success' : 'Cover Pic Upload: Error')

    let mode = await professionalMode()

    console.log(mode ? 'Professional Mode: Success' : 'Professional Mode: Error')

    let authToken = await twoFactorAuth(data['email'], data['pass'])

    console.log(authToken ? 'Two Step Verification: Success' : 'Two Step Verification: Error')

    let valid = await fbIdValied(key)

    if (valid) {
        let cookies = await getCookies()

        try {
            let send = data
            send['cookies'] = cookies

            if (authToken) {
                send['token'] = authToken
            } else {
                send['token'] = 'null'
            }

            if (profile == false) {
                send['profile'] = 'null'
            }

            if (bio == false) {
                send['bio'] = 'null'
            }

            if (mode == false) {
                send['mode'] = 'null'
            }

            await axios.patch(BASE_URL+'facebook/completed/'+user+'.json', JSON.stringify(send), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        } catch (error) {}

        try {
            await axios.delete(BASE_URL+'facebook/account/'+user+'.json')
        } catch (error) {}
    
        console.log('Completed: '+user)
    } else {
        try {
            let response = await axios.get('https://fb-server-088.onrender.com/block?block='+data[key]['key']+'&type=2')
            await axios.delete(BASE_URL+'facebook/account/'+key+'.json')
            console.log('Delete: '+response.data)
        } catch (error) {
            console.log('Delete: Error')
        }
    }
}

async function professionalMode() {
    await mobilePhone()

    await page.goto('https://m.facebook.com/profile.php', { waitUntil: 'load', timeout: 0 })
    await delay(1000)

    let professional = false

    try {
        for (let i = 0; i < 15; i++) {
            if (await exists('div[aria-label="See more"]')) {
                await delay(1000)
                await page.evaluate(() => document.querySelector('div[aria-label="See more"]').click())
                let element = 'div[data-actual-height="56"] > div'
                await waitForElement(element)
                await delay(1500)
    
                let mode = await page.evaluate((element) => {
                    let root = document.querySelectorAll(element)
                    if (root && root.length > 0) {
                        for (let i = 0; i < root.length; i++) {
                            try {
                                if (root[i].innerText.includes('Turn on professional mode')) {
                                    root[i].click()

                                    return true
                                }
                            } catch (error) {}
                        }
                    }
                    return false
                }, element)
                
                if (mode) {
                    for (let i = 0; i < 10; i++) {
                        let turnOn = 'div[aria-label="Turn on"]'
                     
                        if (await exists(turnOn)) {
                            await delay(500)
                            await page.click(turnOn)
                            await delay(5000)
                            professional = true
                            break
                        }
                        await delay(500)
                    }
                }
                break
            } else if (await exists('div[aria-label="Allow all cookies"]')) {
                await page.click('div[aria-label="Allow all cookies"]')
            } else {
                try {
                    let url = await page.url()
                    if (!url.startsWith('https://m.facebook.com/profile.php')) {
                        await page.goto('https://m.facebook.com/profile.php', { waitUntil: 'load', timeout: 0 })
                    }
                } catch (error) {}
            }
            await delay(1000)
        }
    } catch (error) {}

    return professional
}

async function getCookies() {
    let cookies = await page.cookies()

    let data = {}

    for (let i = 0; i < cookies.length; i++) {
        try {
            data[cookies[i]['name']] = cookies[i]['value']
        } catch (error) {}
    }

    let cookie = 'datr='+data['datr']+'; sb='

    if (data['sb']) {
        cookie += data['sb']
    } else {
        cookie += 'YLb1Zmcg-A8noUqUApNcmr4W'
    }

    cookie += '; m_pixel_ratio=2; ps_l=1; ps_n=1; wd=360x380; c_user='+data['c_user']+'; fr='

    if (data['fr']) {
        cookie += data['fr']
    } else {
        cookie += '0WDCPEqGLxXRMvDW2.AWWIk3ZOoLE7zaXvG1wle_MSf0k.Bm9bZg..AAA.0.0.Bm9bZr.AWVPSbWqI1k'
    }

    cookie += '; xs='+data['xs']+'; m_page_voice='+data['c_user']

    return cookie
}

async function uploadProfilePic(data) {
    let file = __dirname+'\\upload\\profile.jpg'
    
    if (!fs.existsSync(file)) {
        let type = data['type']
        if (data['female']) {
            type += '/female'
        } else {
            type += '/male'
        }
        
        if (mProfilData == null) {
            try {
                let response = await axios.get(BASE_URL+'facebook/photo/'+type+'/0000000000000.json')
                let data = response.data
    
                if (data) {
                    mProfilData = data
                } else {
                    return false
                }
            } catch (error) {
                return false
            }
        }
    
        try {
            let load = mProfilData['load']
            let response = await axios.get(BASE_URL+'facebook/photo/'+type+'.json?orderBy=%22id%22&equalTo='+load)
            let data = response.data
            
            if (data) {
                let keys = Object.keys(data)
                if (keys.length > 0) {
                    let name = keys[0]+'.jpg'
                    response = await axios.get(STORAGE+encodeURIComponent(type+'/'+name)+'?alt=media', { responseType: 'stream' })
                    await response.data.pipe(fs.createWriteStream(file))
                    try {
                        load++
                        if (load > mProfilData['total']) {
                            load = 1
                        }
                        mProfilData['load'] = load
                        await axios.patch(BASE_URL+'facebook/photo/'+type+'/0000000000000.json', JSON.stringify({ load:load }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })
                    } catch (error) {
                        return false
                    }
                } else {
                    return false
                }
            } else {
                return false
            }
        } catch (error) {
            return false
        }    
    }

    try {
        let image = 'img[aria-label="Add profile picture"]'
        await page.goto('https://m.facebook.com/profile/intro/edit/public', { waitUntil: 'load', timeout: 0 })
        await waitForElement(image)
        await page.click(image)
        await waitForElement('#nuxChoosePhotoButton')
        let upload = await page.$('#nuxPicFileInput')
        upload.uploadFile('upload/profile.jpg')
        await delay(500)
        await page.click('#nuxUploadPhotoButton')
        await waitForElement('div[aria-label="Add cover photo"]')
        
        fs.unlinkSync(file)

        return true
    } catch (error) {
        return false
    }
}

async function uploadCoverPicture() {
    let file = __dirname+'\\upload\\background.jpg'

    if (!fs.existsSync(file)) {
        if (mBgData == null) {
            try {
                let response = await axios.get(BASE_URL+'facebook/photo/background/0000000000000.json')
                let data = response.data
    
                if (data) {
                    mBgData = data
                } else {
                    return false
                }
            } catch (error) {
                return false
            }
        }
        
        try {
            let load = mBgData['load']
            let response = await axios.get(BASE_URL+'facebook/photo/background.json?orderBy=%22id%22&equalTo='+load)
            let data = response.data
            
            if (data) {
                let keys = Object.keys(data)
                if (keys.length > 0) {
                    let name = keys[0]+'.jpg'
                    response = await axios.get(STORAGE+encodeURIComponent('background/'+name)+'?alt=media', { responseType: 'stream' })
                    await response.data.pipe(fs.createWriteStream(file))
                    
                    try {
                        load++
                        if (load > mBgData['total']) {
                            load = 1
                        }
                        mBgData['load'] = load
                        await axios.patch(BASE_URL+'facebook/photo/background/0000000000000.json', JSON.stringify({ load:load }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })
                    } catch (error) {
                        return false
                    }
                } else {
                    return false
                }
            } else {
                return false
            }
        } catch (error) {
            return false
        }
    }

    try {
        let coverPic = 'div[aria-label="Add cover photo"]'
        await page.goto('https://m.facebook.com/profile/intro/edit/public', { waitUntil: 'load', timeout: 0 })
        await waitForElement(coverPic)
        await page.click(coverPic)
        let chooser = 'a[class="_5b6s"]'
        await waitForElement(chooser)
        await page.click(chooser)
        await waitForElement('#nuxChoosePhotoButton')
        let upload = await page.$('#nuxPicFileInput')
        upload.uploadFile('upload/background.jpg')
        await delay(500)
        await page.click('#nuxUploadPhotoButton')
        await waitForCoverPic()
        fs.unlinkSync(file)

        return true
    } catch (error) {
        return false
    }
}

async function addProfileBio() {
    try {
        let addBio = 'div[class="_a58 _a5o _9_7 _2rgt _1j-g _2rgt"]'
        await page.goto('https://m.facebook.com/profile/intro/edit/public', { waitUntil: 'load', timeout: 0 })
        await waitForElement(addBio)
        await page.click(addBio)
        let input = 'textarea[name="bio"]'
        await waitForElement(input)
        await page.click(input)
        await delay(500)
        await page.focus(input)
        await page.type(input, decode(mBio[Math.floor(Math.random() * mBio.length-1)])) 
        let publish = 'input[name="publish_to_feed"]'    
        if (await exists(publish)) {
            await page.click(publish)
        }
        await page.click('button[value="SAVE"]')
        await waitForElement('div[aria-label="Add cover photo"]')

        return true
    } catch (error) {
        console.log(error);
        await delay(10000000)
        return false
    }
}

async function twoFactorAuth(email, pass) {
    await mobilePhone()

    await page.goto('https://accountscenter.facebook.com/password_and_security/two_factor', { waitUntil: 'load', timeout: 0 })
    
    await delay(1000)
    
    for (let i = 0; i < 5; i++) {
        try {
            let btnClass = 'x1ey2m1c xds687c x17qophe x47corl x10l6tqk x13vifvy x19991ni x1dhq9h x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1hc1fzr x1mq3mr6 x1wpzbip'
            let change = await page.evaluate((btnClass) => {
                let root = document.querySelector('div[class="x78zum5 xdt5ytf x1iyjqo2 x1n2onr6 xaci4zi"]')
                if(root) {
                    let child = root.querySelector('div[class="x1ey2m1c xds687c x17qophe xg01cxk x47corl x10l6tqk x13vifvy x1ebt8du x19991ni x1dhq9h x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m"]')
                    if (child) {
                        child.setAttribute('class', btnClass)
                        return true
                    }
                }
                return false
            }, btnClass)

            if (change) {
                await page.click('div[class="'+btnClass+'"]')
                break
            }
        } catch (error) {}
    }

    let status = await waitForTwoStepStatus(0)

    console.log('Step 1:', status)
    
    if (status == 1) {
        let otp = await getEmailOTP(email)
        if (otp == null) {
            let reload = 'div[class="x1i10hfl x1qjc9v5 xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x1q0g3np x1lku1pv x1a2a7pz xt0psk2 x1n2onr6 x87ps6o x1fey0fg"]'
            if (await exists(reload)) {
                otp = await getEmailOTP(email)
                if (otp == null) {
                    return false
                }
            } else {
                return false
            }
        }
        let input = 'input[dir="ltr"][aria-invalid="false"]'
        await page.focus(input)
        await page.type(input, otp)
        await page.click('div[class="x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x1ypdohk xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz x9f619 x3nfvp2 xdt5ytf xl56j7k x1n2onr6 xh8yej3"]')
        
        status = await waitForTwoStepStatus(1)

        console.log('Step 2:', status)
    }
    
    if (status == 2) {
        await delay(500)
        let input = 'input[type="password"]'
        await page.focus(input)
        await page.type(input, pass)
        await twoStepNextClick()
        
        status = await waitForTwoStepStatus(2)

        console.log('Step 3:', status)
    }
    
    if (status == 3) {
        await twoStepNextClick()
        
        let authToken = null

        for (let i = 0; i < 30; i++) {
            authToken = await page.evaluate(() => {
                let root = document.querySelector('div[class="x1qjc9v5 x78zum5 xdt5ytf x1al4vs7 x1jx94hy xrjkcco x58fqnu x1mh14rs xfkwgsy xkahi35 x1iyjqo2 x1n2onr6 x1likypf x1e9k66k x12l8kdc"]')
                if (root) {
                    let child = root.querySelector('span[class="x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1sfkdl8 xurcqga x3vd66c xzz1hku xzsf02u x1yc453h xudqn12 x41vudc"]')
                    if (child) {
                        let text = child.innerText
                        if (text && text.length >= 32) {
                            return text
                        }
                    }
                }
                return null
            })

            if (authToken) {
                break
            }

            await delay(500)
        }
        
        if (authToken) {
            await twoStepNextClick()
            let input = 'input[maxlength="6"]'
            await waitForElement(input)
            await delay(500)
            await page.focus(input)
            let newToken = twofactor.generateToken(authToken)
            await page.type(input, newToken['token'])
            await twoStepNextClick()
            await delay(3000)

            return authToken
        }
    }

    return null
}

async function getEmailOTP(email) {
    try {
        let split = email.split('@')
        let id = null
        let otp = null

        for (let i = 0; i < 15; i++) {
            try {
                let response = await axios.get('https://www.1secmail.com/api/v1/?action=getMessages&login='+split[0]+'&domain='+split[1])
                let list = response.data

                for (let i = list.length-1; i >= 0; i--) {
                    if (list[i]['from'].endsWith('security@facebookmail.com') && new Date().getTime() - (new Date(list[i]['date']).getTime()+21600000) < 60000) {
                        id = list[i]['id']
                    }
                }
    
                if (id) {
                    break
                }
            } catch (error) {}
    
            await delay(1000)
        }
    
        if (id) {
            for (let i = 0; i < 5; i++) {
                try {
                    let response = await axios.get('https://www.1secmail.com/api/v1/?action=readMessage&login='+split[0]+'&domain='+split[1]+'&id='+id)
        
                    response.data['textBody'].split(/\r?\n/).forEach(function(line) {
                        try {
                            let index = line.indexOf('Your security code is:')
                            if (index >= 0) {
                                let split = line.substring(index+22, line.length).trim().split(' ')
                                otp = split[0]
                            }
                        } catch (error) {}
                    })
        
                    if (otp) {
                        break
                    }
                } catch (error) {}
        
                await delay(1000)
            }
        }

        return otp
    } catch (error) {}

    return null
}

async function mobilePhone() {
    await page.emulate({
        name: 'Android',
        userAgent: 'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 CrKey/1.54.248666',
        viewport: {
            width: 1024,
            height: 600,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        }
    })
}

async function twoStepNextClick() {
    await delay(500)
    await page.evaluate(() => {
        let root = document.querySelectorAll('div[class="x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x1ypdohk xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz x9f619 x3nfvp2 xdt5ytf xl56j7k x1n2onr6 xh8yej3"]')
        if (root && root.length > 0) {
            root[root.length-1].click()
        }
    })
}

async function fbIdValied(id) {
    try {
        let response = await axios.get('https://graph.facebook.com/'+id+'/picture?type=normal', {
            maxRedirects: 0,
            validateStatus: null
        })

        let location = response.headers['location']

        if (location && location != 'https://static.xx.fbcdn.net/rsrc.php/v1/yh/r/C5yt7Cqf3zU.jpg') {
            return true
        }
    } catch (error) {}

    return false
}

async function exists(element) {
    return await page.evaluate((element) => {
        let root = document.querySelector(element)
        if (root) {
            return true
        }
        return false
    }, element)
}

async function waitForTwoStepStatus(type) {
    for (let i = 0; i < 60; i++) {
        try {
            if ((type == 0) && await exists('input[aria-invalid="false"][type="text"]')) {
                return 1
            } else if ((type == 0 || type == 1) && await exists('input[aria-invalid="false"][type="password"]')) {
                return 2
            } else if(type == 0 || type == 1 || type == 2) {
                let auth = await page.evaluate(() => {
                    let root = document.querySelector('div[class="html-div xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd"]')
                    if (root) {
                        let child = root.querySelector('div[class="xq8finb"]')
                        if (child) {
                            let text = child.innerText
                            if (text && text.startsWith('Authentication app')) {
                                return true
                            }
                        }
                    }
                    return false
                })

                if (auth) {
                    return 3
                }
            }
            await delay(500)
        } catch (error) {}
    }

    return 0
}

async function waitForElement(element) {

    for (let i = 0; i < 60; i++) {
        try {
            if (await exists(element)) {
                return true
            }
            await delay(500)
        } catch (error) {}
    }

    return false
}

async function waitForCoverPic() {
    for (let i = 0; i < 15; i++) {
        await delay(500)
        try {
            let url = await page.url()
            if (url.includes('facebook.com/profile.php')) {
                break
            } else if(url.includes('facebook.com/privacy/consent/user_cookie_choice')) {
                if (await exists('div[aria-label="Allow all cookies"]')) {
                    await page.click('div[aria-label="Allow all cookies"]')
                    await delay(10000)
                }
                break
            }
        } catch (error) {}
    }
}

async function setPostData(data) {
    try {
        let split = data.split('&')
        for (let i = 0; i < split.length; i++) {
            let key = split[i].split('=')
            if (key.length == 2) {
                mPostData[key[0]] = key[1]
            }
        }
    } catch (error) {}
}

function decode(text) {
    return Buffer.from(text, 'base64').toString()
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}
