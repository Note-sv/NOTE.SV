'use strict'

const bsv = require('bsv')
const PrivateKey = bsv.PrivateKey
const PublicKey = bsv.PublicKey
const Hash = bsv.crypto.Hash
const crypto = require('crypto')

function electrumECDHKey (publicKey, privateKey) {
  // Get ECDH Key
  const buf = PublicKey(publicKey.point.mul(privateKey.bn)).toBuffer()
  return Hash.sha512(buf)
}

function encrypt (message, publicKey, privateKey = null) {
  // Prepare keys
  const recvPubkey = new PublicKey(publicKey)
  // Override ephemeral_key if privateKey is given. This overriding is for traditional ECIES.
  const ephemeralKey = new PrivateKey(privateKey)
  const ecdhKey = electrumECDHKey(recvPubkey, ephemeralKey)
  const iv = ecdhKey.subarray(0, 16)
  const keyE = ecdhKey.subarray(16, 32)
  const keyM = ecdhKey.subarray(32, 64)

  // Encrypt with AES-128-CBC
  const cipher = crypto.createCipheriv('aes-128-cbc', keyE, iv)
  let crypted = cipher.update(message, 'utf8', 'binary')
  crypted += cipher.final('binary')
  crypted = Buffer.from(crypted, 'binary')

  // Build Encrypted Massage
  const ephemeralPubkey = ephemeralKey.toPublicKey().toBuffer()
  const encrypted = Buffer.concat([Buffer.from('BIE1'), ephemeralPubkey, crypted])
  const hmac = Hash.sha256hmac(Buffer.from(encrypted), Buffer.from(keyM))

  return Buffer.concat([encrypted, hmac])
}

function decrypt (encrypted, privateKey, publicKey = null) {
  // Read from Encrypted Massage, Encrypted message should be in Base64, so toString is safe.
  // const magic = encrypted.subarray(0, 4)
  // Override publicKey in message when publicKey is given. The overriding is for sender to retrieve message he sent in traditional ECIES.
  const ephemeralPubkey = (publicKey == null) ? PublicKey.fromBuffer(encrypted.subarray(4, 37)) : new PublicKey(publicKey)
  const ciphertext = encrypted.subarray(37, encrypted.length - 32)

  const mac = encrypted.subarray(encrypted.length - 32)

  // Prepare Keys
  const recvPrvKey = new PrivateKey(privateKey)
  const ecdhKey = electrumECDHKey(ephemeralPubkey, recvPrvKey)
  const iv = ecdhKey.subarray(0, 16)
  const keyE = ecdhKey.subarray(16, 32)
  const keyM = ecdhKey.subarray(32, 64)

  // Check HMAC
  const crypted = encrypted.subarray(0, encrypted.length - 32)
  const hmac = Hash.sha256hmac(Buffer.from(crypted), Buffer.from(keyM))

  if (hmac.compare(mac) !== 0) throw new Error('HMAC Error: ' + encrypted.toString('hex'))

  // Decrypt with AES-128-CBC
  const decipher = crypto.createDecipheriv('aes-128-cbc', keyE, iv)
  let decrypted = decipher.update(ciphertext, 'binary', 'utf8')
  decrypted += decipher.final('utf8')
  decrypted = Buffer.from(decrypted)

  return decrypted
}
function getPublicKey (encrypted) {
// Read from Encrypted Massage, Encrypted message should be in Base64, so toString is safe.
  // Override publicKey in message when publicKey is given. The overriding is for sender to retrieve message he sent in traditional ECIES.
  return PublicKey.fromBuffer(encrypted.subarray(4, 37))
}
function getMagic (encrypted) {
// Read from Encrypted Massage, Encrypted message should be in Base64, so toString is safe.
  return encrypted.subarray(0, 4)
}
function getHMAC (encrypted) {
// Read from Encrypted Massage, Encrypted message should be in Base64, so toString is safe.
  return encrypted.subarray(encrypted.length - 32)
}

export default {
  encrypt: encrypt,
  decrypt: decrypt,
  ecdh_key: electrumECDHKey,
  _getMagic: getMagic,
  _getPublicKey: getPublicKey,
  _getHMAC: getHMAC
}
